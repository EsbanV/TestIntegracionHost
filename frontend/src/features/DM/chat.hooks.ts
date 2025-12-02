import { useEffect, useRef, useCallback, useState } from "react";
import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient,
  InfiniteData
} from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/app/context/AuthContext";
import type { 
  Chat, 
  Mensaje, 
  ChatListResponse, 
  MessagesResponse,
  ActiveByChatResponse,
  ActiveTransaction
} from "./chat.types";

const URL_BASE = import.meta.env.VITE_API_URL;

const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const chatKeys = {
  all: ['chat'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  // Convertimos a String para evitar bugs de "1" !== 1
  conversation: (chatId: number | string) => [...chatKeys.all, 'messages', String(chatId)] as const,
  transaction: (chatId: number | string) => [...chatKeys.all, 'transaction', String(chatId)] as const,
};

async function fetchWithAuth<T>(url: string, token: string | null, options: RequestInit = {}): Promise<T> {
  if (!token) throw new Error("No autenticado");
  const res = await fetch(`${URL_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error en la petición");
  return data;
}

// ============================================================================
// 1. HOOK DE SOCKET (OPTIMIZADO PARA TU DB)
// ============================================================================
export const useChatSocket = (activeChatId: number | null) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token || !user) return;
    if (socketRef.current?.connected) return;

    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🟢 Socket Conectado"));
    
    // --- NUEVO MENSAJE ---
    socket.on("new_message", (rawMsg: any) => {
      // 1. Detección robusta de IDs (Soporte para snake_case de tu DB y camelCase de Prisma)
      const remitenteId = Number(rawMsg.remitenteId ?? rawMsg.remitente_id ?? rawMsg.remitente?.id);
      const destinatarioId = Number(rawMsg.destinatarioId ?? rawMsg.destinatario_id ?? rawMsg.destinatario?.id);
      
      const currentChatId = Number(activeChatIdRef.current);
      const myId = Number(user.id);

      // 2. ¿Es relevante para el chat abierto?
      // Es relevante si el mensaje viene DEL usuario actual O si YO se lo envié al usuario actual
      const esDelChatAbierto = currentChatId && (
        remitenteId === currentChatId || destinatarioId === currentChatId
      );

      if (esDelChatAbierto) {
        // 3. Inyección Optimista (Sin Fetch)
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          chatKeys.conversation(currentChatId),
          (oldData) => {
            if (!oldData) return undefined;

            const newPages = [...oldData.pages];
            
            // Inyectamos en la primera página (la más reciente)
            if (newPages.length > 0) {
                // Clonamos para no mutar el estado directamente
                const firstPage = { ...newPages[0] };
                // Añadimos al final del array existente
                firstPage.mensajes = [...firstPage.mensajes, rawMsg]; 
                newPages[0] = firstPage;
            }

            return { ...oldData, pages: newPages };
          }
        );
      }

      // 4. Actualizar lista de conversaciones (para el contador de no leídos y último mensaje)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    });

    socket.on("transaction_event", () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      if (activeChatIdRef.current) {
        queryClient.invalidateQueries({ queryKey: chatKeys.transaction(activeChatIdRef.current) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient, user?.id]); 

  return socketRef;
};

// ============================================================================
// 2. HOOKS DE LECTURA (Corregidos)
// ============================================================================

// LISTA DE CHATS
export const useChatList = (isOpen: boolean) => {
  const { token } = useAuth();
  
  return useInfiniteQuery<ChatListResponse, Error>({
    queryKey: chatKeys.lists(),
    queryFn: ({ pageParam = 1 }) => 
      fetchWithAuth(`/api/chat/conversaciones?page=${pageParam}&limit=15`, token),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: !!token && isOpen,
    staleTime: 1000 * 60,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allChats: data.pages.flatMap(page => page.conversaciones.map((c: any) => {
        // Manejo defensivo de ultimoMensaje
        const contenidoMsg = c.ultimoMensaje?.contenido || c.ultimoMensaje?.texto || "";
        const tipoMsg = c.ultimoMensaje?.tipo || "texto";

        return {
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          // Si es imagen, mostramos texto "Imagen", si no el contenido
          ultimoMensaje: tipoMsg === 'imagen' ? '📷 Imagen' : contenidoMsg,
          avatar: getFullImgUrl(c.usuario.fotoPerfilUrl),
          noLeidos: c.unreadCount || 0,
          mensajes: [],
          online: false
        } as Chat;
      }))
    })
  });
};

// MENSAJES DE CONVERSACIÓN (Aquí estaba el error probable)
export const useChatMessages = (activeChatId: number | null, isOpen: boolean) => {
  const { token, user } = useAuth();

  return useInfiniteQuery<MessagesResponse, Error>({
    queryKey: chatKeys.conversation(activeChatId || 0),
    queryFn: ({ pageParam = null }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return fetchWithAuth(`/api/chat/conversacion/${activeChatId}${cursor}`, token);
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.ok || !lastPage.mensajes?.length) return undefined;
      // Cursor basado en el ID más antiguo (asumiendo orden descendente de fetch, ascendente de render)
      return lastPage.mensajes[0].id; 
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: Infinity, // No refrescar automáticamente para no pisar el socket
    
    // Transformación de datos
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allMessages: data.pages.flatMap(page => page.mensajes).map((m: any) => {
        // 1. Intentar parsear metadata si es sistema
        let metadata = null;
        try { 
          if(m.tipo === 'sistema' && typeof m.contenido === 'string' && m.contenido.startsWith('{')) {
             metadata = JSON.parse(m.contenido); 
          }
        } catch {}
        
        // 2. Normalizar ID de remitente (DB: remitente_id, API: remitenteId)
        // Convertimos a Number para comparar seguramente con user.id
        const remitenteId = Number(m.remitenteId ?? m.remitente_id);
        const myId = Number(user?.id);

        const contenidoReal = m.contenido || m.texto || "";
        const fechaReal = m.fechaEnvio || m.fecha_envio || new Date();

        return {
          id: m.id,
          // Si es sistema y tiene metadata, usar metadata.text, si no contenidoReal
          texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || contenidoReal) : contenidoReal),
          imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(contenidoReal) : undefined,
          // Lógica de autor:
          autor: (remitenteId === myId) ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
          hora: new Date(fechaReal).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: m.leido ? 'leido' : 'recibido',
          tipo: m.tipo,
          metadata
        } as Mensaje;
      })
    })
  });
};

// ... Resto de hooks (useChatTransactions, useChatActions, useRateLimiter) se mantienen igual ...
// (Asegúrate de mantener el resto del archivo que te envié antes o pídemelo si lo necesitas completo)
export const useChatTransactions = (activeChatId: number | null, isOpen: boolean) => {
  const { token, user } = useAuth();
  return useQuery<ActiveTransaction[]>({
    queryKey: chatKeys.transaction(activeChatId || 0),
    queryFn: async () => {
      if (!activeChatId) return [];
      const data = await fetchWithAuth<ActiveByChatResponse>(`/api/transactions/active-by-chat/${activeChatId}`, token);
      if (!data.ok || !Array.isArray(data.transactions)) return [];
      return data.transactions.map((t) => ({
        ...t,
        esComprador: t.compradorId === user?.id,
        esVendedor: t.vendedorId === user?.id,
      }));
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 0,
  });
};

export const useChatActions = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text, file }: { chatId: number; text: string; file?: File }) => {
      let contenido = text;
      let tipo = 'texto';

      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${URL_BASE}/api/upload/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const raw = await res.json();
        if (!res.ok || !raw?.ok) throw new Error(raw?.message || 'Error subiendo imagen');
        contenido = raw.imageUrl;
        tipo = 'imagen';
      }

      return fetchWithAuth<{ ok: boolean, mensaje?: any }>('/api/chat/send', token, {
        method: 'POST',
        body: JSON.stringify({ destinatarioId: chatId, contenido, tipo }),
      });
    },
    onSuccess: (data, variables) => {
        // Opcional: Si el backend devuelve el mensaje creado, podríamos inyectarlo aquí también
        // Pero confiamos en el socket para eso.
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => fetchWithAuth(`/api/chat/conversacion/${chatId}/mark-read`, token, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.lists() }),
  });

  const confirmTransactionMutation = useMutation({
    mutationFn: async ({ txId, type }: { txId: number, type: 'delivery' | 'receipt', chatUserId: number }) => {
      const endpoint = type === 'delivery' ? 'confirm-delivery' : 'confirm-receipt';
      return fetchWithAuth(`/api/transactions/${txId}/${endpoint}`, token, { method: 'PATCH' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.transaction(variables.chatUserId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatUserId) });
    },
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: async ({ txId }: { txId: number, chatUserId: number }) => {
      return fetchWithAuth(`/api/transactions/${txId}/cancel`, token, { method: 'PATCH' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.transaction(variables.chatUserId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatUserId) });
    },
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    confirmTransaction: confirmTransactionMutation.mutateAsync,
    cancelTransaction: cancelTransactionMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
};

export function useRateLimiter({ maxRequests, windowMs, cooldownMs }: { maxRequests: number; windowMs: number; cooldownMs: number }) {
  const [isLimited, setIsLimited] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timestamps = useRef<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter(t => now - t < windowMs);

    if (isLimited) return false;

    if (timestamps.current.length >= maxRequests) {
      setIsLimited(true);
      setTimeLeft(cooldownMs / 1000);
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLimited(false);
            timestamps.current = [];
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return false;
    }

    timestamps.current.push(now);
    return true;
  }, [isLimited, maxRequests, windowMs, cooldownMs]);

  return { isLimited, timeLeft, checkRateLimit };
}