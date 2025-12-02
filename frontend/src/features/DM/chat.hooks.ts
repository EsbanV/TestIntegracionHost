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
  conversation: (chatId: number) => [...chatKeys.all, 'messages', chatId] as const,
  transaction: (chatId: number) => [...chatKeys.all, 'transaction', chatId] as const,
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
// 1. HOOK DE SOCKET (OPTIMIZADO)
// ============================================================================
export const useChatSocket = (activeChatId: number | null) => {
  const { token, user } = useAuth(); // Necesitamos 'user' para saber quién soy
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token) return;
    if (socketRef.current?.connected) return;

    console.log("🔌 Iniciando conexión Socket...");
    
    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🟢 Socket Conectado:", socket.id));
    socket.on("disconnect", () => console.warn("🟡 Socket Desconectado"));
    
    // DEBUG: Ver qué llega exactamente
    socket.onAny((event, ...args) => {
      console.log(`📡 Evento Socket: ${event}`, args);
    });

    // --- MANEJO DE MENSAJES (OPTIMISTIC UPDATE) ---
    socket.on("new_message", (rawMsg: any) => {
      // 1. Normalizar el objeto mensaje (Backend a veces manda estructuras diferentes)
      const newMessage: Mensaje = {
        id: rawMsg.id || Date.now(), // Fallback ID temporal si no viene
        texto: rawMsg.contenido || rawMsg.texto || "",
        autor: (rawMsg.remitenteId === user?.id || rawMsg.remitente?.id === user?.id) ? 'yo' : 'otro',
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        estado: 'recibido',
        tipo: rawMsg.tipo || 'texto',
        imagenUrl: rawMsg.tipo === 'imagen' ? getFullImgUrl(rawMsg.contenido) : undefined
      };

      const currentChatId = activeChatIdRef.current;
      
      // Determinar ID del remitente y destinatario de forma segura
      const remitenteId = rawMsg.remitente?.id || rawMsg.remitenteId;
      const destinatarioId = rawMsg.destinatario?.id || rawMsg.destinatarioId;

      // 2. Verificar si pertenece al chat abierto
      const esDelChatAbierto = 
        currentChatId && (remitenteId === currentChatId || destinatarioId === currentChatId);

      if (esDelChatAbierto) {
        console.log("🚀 Inyectando mensaje en caché:", newMessage);
        
        // ACTUALIZACIÓN DIRECTA DE LA CACHÉ (Sin esperar fetch)
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          chatKeys.conversation(currentChatId),
          (oldData) => {
            if (!oldData) return undefined;

            // Clonamos las páginas para respetar inmutabilidad
            const newPages = [...oldData.pages];
            
            // Asumiendo que la página 0 tiene los mensajes más recientes (ajustar según tu backend)
            // Si tu backend manda los más nuevos al final, usa push en el último array.
            // Aquí asumo que 'mensajes' es un array y agregamos al final para que aparezca abajo.
            if (newPages.length > 0) {
                const firstPage = { ...newPages[0] };
                // Añadimos el mensaje crudo o normalizado según lo que espere tu UI
                // Nota: Tu UI espera estructura de backend en useChatMessages select, 
                // pero aquí estamos inyectando.
                // Truco: React Query 'select' corre DESPUÉS de esto.
                // Debemos inyectar el formato CRUDO que espera el 'select' de useChatMessages
                firstPage.mensajes = [...firstPage.mensajes, rawMsg]; 
                newPages[0] = firstPage;
            }

            return {
              ...oldData,
              pages: newPages,
            };
          }
        );
        
        // Backup: Invalidar para asegurar consistencia a largo plazo
        queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentChatId) });
      }

      // 3. Siempre actualizar la lista lateral (para que suba el chat o marque no leído)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    });

    socket.on("transaction_event", () => {
      console.log("💰 Cambio en transacción");
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      const id = activeChatIdRef.current;
      if (id) {
        queryClient.invalidateQueries({ queryKey: chatKeys.transaction(id) });
        queryClient.invalidateQueries({ queryKey: chatKeys.conversation(id) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient, user?.id]); // Agregamos user.id para saber quién es 'yo'

  return socketRef;
};

// ============================================================================
// 2. RESTO DE HOOKS (Sin cambios mayores, solo asegurando tipos)
// ============================================================================

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
      allChats: data.pages.flatMap(page => page.conversaciones.map((c: any) => ({
        id: c.usuario.id,
        nombre: c.usuario.nombre || c.usuario.usuario,
        ultimoMensaje: c.ultimoMensaje?.tipo === 'imagen' ? '📷 Imagen' : c.ultimoMensaje?.contenido,
        avatar: getFullImgUrl(c.usuario.fotoPerfilUrl),
        noLeidos: c.unreadCount || 0,
        mensajes: [],
        online: false
      } as Chat)))
    })
  });
};

export const useChatMessages = (activeChatId: number | null, isOpen: boolean) => {
  const { token, user } = useAuth();
  return useInfiniteQuery<MessagesResponse, Error>({
    queryKey: chatKeys.conversation(activeChatId!),
    queryFn: ({ pageParam = null }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return fetchWithAuth(`/api/chat/conversacion/${activeChatId}${cursor}`, token);
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.ok || !lastPage.mensajes?.length) return undefined;
      // Si usas cursor basado en ID, usualmente es el ID del más antiguo para cargar hacia atrás
      return lastPage.mensajes[0].id; 
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 0, // Importante: 0 para que siempre busque nuevos al montar
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Aplanamos y mapeamos
      allMessages: data.pages.flatMap(page => page.mensajes).map((m: any) => {
        let metadata = null;
        try { if(m.tipo === 'sistema') metadata = JSON.parse(m.contenido); } catch {}
        
        return {
          id: m.id,
          texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || m.contenido) : m.contenido),
          imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(m.contenido) : undefined,
          autor: m.remitenteId === user?.id ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
          hora: new Date(m.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: m.leido ? 'leido' : 'recibido',
          tipo: m.tipo,
          metadata
        } as Mensaje;
      })
    })
  });
};

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

      return fetchWithAuth<{ ok: boolean }>('/api/chat/send', token, {
        method: 'POST',
        body: JSON.stringify({ destinatarioId: chatId, contenido, tipo }),
      });
    },
    onSuccess: (_, variables) => {
      // Al enviar, también invalidamos para asegurar que tenemos la respuesta del servidor (ID real, fecha real)
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => fetchWithAuth(`/api/chat/conversacion/${chatId}/mark-read`, token, { method: 'POST' }),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      // No necesariamente necesitamos recargar toda la conversacion solo por marcar leido
    },
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