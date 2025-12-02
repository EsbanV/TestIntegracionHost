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
  ActiveTransaction,
  RawMessage
} from "./chat.types";

const URL_BASE = import.meta.env.VITE_API_URL;

const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Claves centralizadas (Asegúrate de que sean consistentes en toda la app)
export const chatKeys = {
  all: ['chat'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  // Forzamos String para evitar problemas de tipos
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
// 1. HOOK DE SOCKET (FIXED & DEBUGGED)
// ============================================================================
export const useChatSocket = (activeChatId: number | null) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  
  // Guardamos el ID en un ref para accederlo dentro de los eventos sin recrearlos
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token || !user) return;
    if (socketRef.current?.connected) return;

    console.log("🔌 [Socket] Iniciando conexión...");
    
    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🟢 [Socket] Conectado ID:", socket.id));
    
    // --- MANEJO DE MENSAJES UNIFICADO ---
    const handleMessageEvent = (rawMsg: any, source: string) => {
      // 1. Extraer IDs de forma segura (soportando cualquier formato del backend)
      const remitenteId = String(rawMsg.remitenteId ?? rawMsg.remitente_id ?? rawMsg.remitente?.id);
      const destinatarioId = String(rawMsg.destinatarioId ?? rawMsg.destinatario_id ?? rawMsg.destinatario?.id);
      
      const currentChatId = String(activeChatIdRef.current);
      const myId = String(user.id);

      console.log(`📨 [Socket:${source}] Recibido. De: ${remitenteId}, Para: ${destinatarioId}. ChatActivo: ${currentChatId}`);

      // 2. Lógica de relevancia (Comparación como Strings)
      const esMensajeEntrante = (remitenteId === currentChatId) && (destinatarioId === myId);
      const esMensajeSaliente = (remitenteId === myId) && (destinatarioId === currentChatId);

      // Si el mensaje tiene que ver con el chat abierto...
      if (esMensajeEntrante || esMensajeSaliente) {
        console.log("🚀 [Socket] Actualizando Chat Activo:", currentChatId);
        
        // A. Invalidación INMEDIATA (Más seguro que setQueryData si hay dudas de estructura)
        // Esto fuerza a React Query a hacer un fetch en segundo plano ya.
        queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentChatId) });

        // B. Intento de Actualización Optimista (Para velocidad visual)
        // Solo lo hacemos si estamos seguros de la estructura, si falla no pasa nada porque ya invalidamos
        try {
          queryClient.setQueryData<InfiniteData<MessagesResponse>>(
            chatKeys.conversation(currentChatId),
            (oldData) => {
              if (!oldData || !oldData.pages.length) return undefined;
              
              const newPages = [...oldData.pages];
              // Asumimos que la última página del array tiene los mensajes más recientes
              const lastPageIndex = newPages.length - 1;
              const lastPage = { ...newPages[lastPageIndex] };
              
              // Normalizamos para la UI
              const rawForCache: RawMessage = {
                ...rawMsg,
                id: rawMsg.id || Date.now(), // ID temporal si falta
                remitente_id: Number(remitenteId), // Normalizamos para que el selector funcione
                destinatario_id: Number(destinatarioId)
              };

              // Evitar duplicados (por si el fetch llega antes que el socket o viceversa)
              const exists = lastPage.mensajes.some((m: any) => m.id === rawForCache.id);
              if (!exists) {
                 lastPage.mensajes = [...lastPage.mensajes, rawForCache];
                 newPages[lastPageIndex] = lastPage;
              }
              
              return { ...oldData, pages: newPages };
            }
          );
        } catch (e) {
          console.warn("[Socket] Error en update optimista, confiando en invalidación.", e);
        }
      } else {
        console.log("💤 [Socket] Mensaje ignorado (No pertenece al chat activo)");
      }

      // 3. Siempre actualizar la lista lateral (badges, último mensaje)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    };

    // Escuchamos ambos eventos (entrada y salida) con el mismo handler
    socket.on("new_message", (msg) => handleMessageEvent(msg, "In"));
    socket.on("message_sent", (msg) => handleMessageEvent(msg, "Out"));

    socket.on("transaction_event", () => {
      console.log("💰 [Socket] Evento transacción");
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
// 2. HOOKS DE LECTURA (Queries)
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
        ultimoMensaje: c.ultimoMensaje?.tipo === 'imagen' ? '📷 Imagen' : (c.ultimoMensaje?.contenido || c.ultimoMensaje?.texto),
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
    // IMPORTANTE: String(activeChatId) para coincidir con la key del socket
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
    staleTime: Infinity, // Confiamos en el socket para nuevos, solo fetch histórico
    
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allMessages: data.pages.flatMap(page => page.mensajes).map((m: any) => {
        let metadata = null;
        try { if(m.tipo === 'sistema' && typeof m.contenido === 'string') metadata = JSON.parse(m.contenido); } catch {}
        
        // Normalización para visualización
        const remitenteId = Number(m.remitenteId ?? m.remitente_id);
        const contenidoReal = m.contenido || m.texto || "";
        const fechaReal = m.fechaEnvio || m.fecha_envio || new Date();

        return {
          id: m.id,
          texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || contenidoReal) : contenidoReal),
          imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(contenidoReal) : undefined,
          autor: (remitenteId === user?.id) ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
          hora: new Date(fechaReal).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: m.leido ? 'leido' : 'recibido',
          tipo: m.tipo,
          metadata
        } as Mensaje;
      })
    })
  });
};

// ... (Resto de hooks iguales: useChatTransactions, useChatActions, useRateLimiter)
// Asegúrate de copiar el resto del archivo que tenías o pídemelo si lo necesitas.
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
    // Al enviar, invalidamos inmediatamente para que el usuario vea su mensaje 
    // incluso si el socket falla.
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
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