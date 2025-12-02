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

// Fetcher genérico
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
// 1. HOOK DE SOCKET (BLINDADO)
// ============================================================================
export const useChatSocket = (activeChatId: number | null) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  
  // Referencia mutable para leer el chat actual dentro del evento del socket sin reiniciar
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

    socket.on("connect", () => console.log("🟢 Socket Conectado ID:", socket.id));
    socket.on("disconnect", () => console.warn("🟡 Socket Desconectado"));
    
    // --- MANEJO DE MENSAJES (OPTIMISTIC UPDATE) ---
    socket.on("new_message", (rawMsg: any) => {
      console.log("📨 Socket recibió mensaje:", rawMsg);

      // 1. NORMALIZACIÓN DE IDs (El paso crítico)
      // Detectamos cualquier variante que envíe el backend (snake_case o camelCase)
      const remitenteId = rawMsg.remitenteId ?? rawMsg.remitente_id ?? rawMsg.remitente?.id;
      const destinatarioId = rawMsg.destinatarioId ?? rawMsg.destinatario_id ?? rawMsg.destinatario?.id;
      
      const currentChatId = activeChatIdRef.current;
      const myId = user?.id;

      // 2. ¿Es para el chat que tengo abierto?
      // Es relevante si el remitente es el otro usuario (currentChatId) O si yo se lo envié a él
      const esDelChatAbierto = currentChatId && (
        remitenteId === currentChatId || destinatarioId === currentChatId
      );

      if (esDelChatAbierto) {
        console.log("🚀 Actualizando UI en tiempo real para chat:", currentChatId);
        
        // Construimos el mensaje con el formato que espera la UI
        const newMessage: Mensaje = {
          id: rawMsg.id || Date.now(), // ID temporal si falta
          texto: rawMsg.contenido || "",
          // Si el remitente soy yo (mi ID), autor es 'yo', sino 'otro'
          autor: (remitenteId === myId) ? 'yo' : 'otro',
          hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: 'recibido',
          tipo: rawMsg.tipo || 'texto',
          imagenUrl: rawMsg.tipo === 'imagen' ? getFullImgUrl(rawMsg.contenido) : undefined,
          metadata: rawMsg.metadata // Por si acaso es mensaje de sistema
        };

        // INYECCIÓN DIRECTA EN CACHÉ (Sin fetch)
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          chatKeys.conversation(currentChatId),
          (oldData) => {
            if (!oldData) return undefined;

            // Clonamos profundamente para inmutabilidad
            const newPages = [...oldData.pages];
            
            // Inyectamos en la última página (o la primera según tu orden de array)
            // Tu API parece devolver orden ascendente, así que añadimos al final del último array
            // O si es paginación invertida, al principio.
            // Asumiremos que el array en memoria está ordenado cronológicamente.
            
            if (newPages.length > 0) {
                // Modificamos la página más reciente (o donde deban ir los nuevos)
                const targetPageIndex = newPages.length - 1; // Usualmente la última página cargada tiene los más recientes si es scroll infinito hacia arriba?
                // REVISIÓN: En chat, normalmente la "página 1" son los últimos mensajes.
                // En react-query infinite scroll, page[0] suele ser la primera petición.
                
                // Vamos a intentar añadirlo a todas las páginas para asegurar (o mejor, invalidar después)
                // Pero lo más limpio es añadirlo a la estructura que renderiza `allMessages`
                
                // Opción segura: Añadirlo a la última página recibida
                const lastPage = { ...newPages[newPages.length - 1] };
                lastPage.mensajes = [...lastPage.mensajes, rawMsg]; // Guardamos el raw para consistencia
                newPages[newPages.length - 1] = lastPage;
            }

            return { ...oldData, pages: newPages };
          }
        );
        
        // Backup: Invalidamos para asegurar consistencia real con DB en 1 segundo
        setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentChatId) });
        }, 500);
      }

      // 3. Siempre actualizar la lista lateral (para que suba el chat o marque no leído)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    });

    socket.on("transaction_event", () => {
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
  }, [token, queryClient, user?.id]); 

  return socketRef;
};

// ============================================================================
// 2. RESTO DE HOOKS (Fetchers)
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
      // API Backend: query cursor para paginación
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return fetchWithAuth(`/api/chat/conversacion/${activeChatId}${cursor}`, token);
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.ok || !lastPage.mensajes?.length) return undefined;
      return lastPage.mensajes[0].id; // ID del mensaje más viejo para pedir los anteriores
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 0, 
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Aplanamos todas las páginas en un solo array de mensajes
      allMessages: data.pages.flatMap(page => page.mensajes).map((m: any) => {
        let metadata = null;
        try { if(m.tipo === 'sistema') metadata = JSON.parse(m.contenido); } catch {}
        
        // NORMALIZACIÓN DE DATOS (Mismo proceso que en el socket)
        const remitenteId = m.remitenteId ?? m.remitente_id;

        return {
          id: m.id,
          texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || m.contenido) : m.contenido),
          imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(m.contenido) : undefined,
          autor: (remitenteId === user?.id) ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
          hora: new Date(m.fechaEnvio || m.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: m.leido ? 'leido' : 'recibido',
          tipo: m.tipo,
          metadata
        } as Mensaje;
      })
    })
  });
};

// ... El resto de hooks (useChatTransactions, useChatActions, useRateLimiter) se mantienen igual que en la versión anterior.
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
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => fetchWithAuth(`/api/chat/conversacion/${chatId}/mark-read`, token, { method: 'POST' }),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
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