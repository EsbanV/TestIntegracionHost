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

// ============================================================================
// 0. UTILIDADES (Normalización de Datos - CRÍTICO)
// ============================================================================

const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Esta función es el "puente" entre tu DB (snake_case) y el Frontend
const normalizeMessage = (m: any, currentUserId?: number): Mensaje => {
  // 1. Detectar ID del remitente (Soporta remitente_id y remitenteId)
  const remitenteId = Number(m.remitenteId ?? m.remitente_id ?? m.remitente?.id);
  
  // 2. Detectar contenido (Soporta contenido y texto)
  const contenidoReal = m.contenido || m.texto || "";
  
  // 3. Detectar fecha (Soporta fechaEnvio y fecha_envio)
  const fechaStr = m.fechaEnvio || m.fecha_envio || new Date().toISOString();
  
  // 4. Parsear metadata si es mensaje de sistema
  let metadata = null;
  try { 
    if(m.tipo === 'sistema' && typeof contenidoReal === 'string' && contenidoReal.startsWith('{')) {
       metadata = JSON.parse(contenidoReal); 
    }
  } catch {}

  return {
    id: m.id || Date.now(), // Fallback ID temporal
    texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || contenidoReal) : contenidoReal),
    imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(contenidoReal) : undefined,
    autor: (remitenteId === Number(currentUserId)) ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
    hora: new Date(fechaStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    estado: m.leido ? 'leido' : 'recibido',
    tipo: m.tipo || 'texto',
    metadata
  };
};

export const chatKeys = {
  all: ['chat'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
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
// 1. HOOK DE SOCKET (Actualización en Tiempo Real)
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

    socket.on("connect", () => console.log("🟢 [Socket] Conectado"));
    
    // --- MANEJO DE MENSAJES UNIFICADO ---
    const handleIncomingMessage = (rawMsg: any) => {
      console.log("📨 [Socket] Mensaje recibido:", rawMsg);

      // Usamos el normalizador para sacar los IDs limpios
      const remitenteId = Number(rawMsg.remitenteId ?? rawMsg.remitente_id ?? rawMsg.remitente?.id);
      const destinatarioId = Number(rawMsg.destinatarioId ?? rawMsg.destinatario_id ?? rawMsg.destinatario?.id);
      
      const currentChatId = Number(activeChatIdRef.current);
      const myId = Number(user.id);

      // ¿Es relevante para el chat que tengo abierto ahora?
      // 1. Me lo mandaron A MÍ desde el CHAT ABIERTO.
      // 2. Lo mandé YO hacia el CHAT ABIERTO.
      const esRelevante = 
        (destinatarioId === myId && remitenteId === currentChatId) || 
        (remitenteId === myId && destinatarioId === currentChatId);

      if (esRelevante) {
        console.log("🚀 [Socket] Inyectando mensaje en UI...");
        
        // Convertimos el rawMsg a formato UI usando el normalizador
        const newMessageUI = normalizeMessage(rawMsg, myId);

        // Actualizamos la caché de React Query manualmente (Optimistic Update)
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          chatKeys.conversation(currentChatId),
          (oldData) => {
            if (!oldData) return undefined;
            
            const newPages = [...oldData.pages];
            
            // Inyectamos en la última página (o la única que haya)
            if (newPages.length > 0) {
                // Truco: En React Query Infinite, a veces la data viene al revés.
                // Asumiendo que `mensajes` es un array y los nuevos van al final:
                const lastPageIndex = newPages.length - 1;
                const lastPage = { ...newPages[lastPageIndex] };
                
                // Evitar duplicados por ID
                if (!lastPage.mensajes.find((m: any) => m.id === newMessageUI.id)) {
                    // Nota: Aquí inyectamos el mensaje YA NORMALIZADO o el RAW
                    // Pero como el hook useChatMessages usa 'select' para normalizar, 
                    // debemos inyectar algo que el 'select' entienda.
                    // Para simplificar, inyectamos el RAW que ya sabemos que 'select' procesará bien.
                    lastPage.mensajes = [...lastPage.mensajes, rawMsg];
                    newPages[lastPageIndex] = lastPage;
                }
            }
            return { ...oldData, pages: newPages };
          }
        );
      }

      // Siempre refrescar la lista de chats (para actualizar "último mensaje" y badges)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    };

    // Escuchar AMBOS eventos
    socket.on("new_message", handleIncomingMessage);   // Recibidos
    socket.on("message_sent", handleIncomingMessage);  // Enviados (confirmación)

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
// 2. HOOKS DE LECTURA (Usando el Normalizador)
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
      allChats: data.pages.flatMap(page => page.conversaciones.map((c: any) => {
        // Normalizamos el último mensaje para mostrarlo en la lista
        const msg = normalizeMessage(c.ultimoMensaje, 0); 
        return {
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          ultimoMensaje: msg.tipo === 'imagen' ? '📷 Imagen' : msg.texto,
          avatar: getFullImgUrl(c.usuario.fotoPerfilUrl),
          noLeidos: c.unreadCount || 0,
          mensajes: [],
          online: false
        } as Chat;
      }))
    })
  });
};

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
      return lastPage.mensajes[0].id; 
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: Infinity, 
    
    // 🔥 AQUÍ ESTÁ LA MAGIA: Usamos normalizeMessage en el select
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allMessages: data.pages.flatMap(page => 
        page.mensajes.map((m: any) => normalizeMessage(m, user?.id))
      )
    })
  });
};

// ... Resto de hooks (useChatTransactions, useChatActions, useRateLimiter)
// (Mantén el resto del código tal cual te lo envié anteriormente, es correcto)

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
    // No invalidamos en onSuccess porque confiamos en el socket.
    // Solo invalidamos si hay error para asegurar consistencia.
    onError: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
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