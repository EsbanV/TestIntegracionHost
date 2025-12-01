import { useEffect, useRef, useCallback, useState } from "react";
import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient
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

// ============================================================================
// 0. CONFIGURACIÓN Y UTILS
// ============================================================================
const URL_BASE = import.meta.env.VITE_API_URL;

const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Centralizamos las claves para evitar errores y facilitar la invalidación global
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
// 1. HOOK DE SOCKET (Conexión Estable)
// ============================================================================
export const useChatSocket = (activeChatId: number | null) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  
  // Referencia mutable para que el socket lea el chat actual sin desconectarse
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token) return;

    // Evitar múltiples conexiones si ya existe
    if (socketRef.current?.connected) return;

    console.log("🔌 Conectando Socket...");
    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🟢 Socket Online:", socket.id));
    socket.on("disconnect", (reason) => console.warn("🟡 Socket Offline:", reason));

    // EVENTO: Nuevo Mensaje
    socket.on("new_message", (msg: any) => {
      // 1. Siempre refrescar la lista (para notificaciones/contadores)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });

      // 2. Si el mensaje es del chat que estoy viendo, refrescar esa conversación
      const currentId = activeChatIdRef.current;
      const esRelevante = (msg.remitente?.id === currentId) || (msg.destinatario?.id === currentId);

      if (currentId && esRelevante) {
         queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentId) });
      }
    });

    // EVENTO: Transacciones (cambios de estado)
    socket.on("transaction_event", () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      const currentId = activeChatIdRef.current;
      if (currentId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.transaction(currentId) });
        queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentId) });
      }
    });

    return () => {
      // Solo desconectar si se desmonta el componente raíz o cambia el token
      if (socket) socket.disconnect();
    };
  }, [token, queryClient]); 

  return socketRef;
};

// ============================================================================
// 2. HOOKS DE LECTURA (Queries)
// ============================================================================

// A. LISTA DE CHATS (Infinito)
export const useChatList = (isOpen: boolean) => {
  const { token } = useAuth();
  
  return useInfiniteQuery<ChatListResponse, Error>({
    queryKey: chatKeys.lists(),
    queryFn: ({ pageParam = 1 }) => 
      fetchWithAuth(`/api/chat/conversaciones?page=${pageParam}&limit=15`, token),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: !!token && isOpen,
    staleTime: 1000 * 60, // 1 min caché
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

// B. MENSAJES DE CONVERSACIÓN
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
      return lastPage.mensajes[0].id; // Cursor es el mensaje más viejo
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 0, // Siempre fresco
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
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

// C. TRANSACCIONES ACTIVAS
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

// ============================================================================
// 3. HOOK DE ACCIONES (Mutaciones)
// ============================================================================

export const useChatActions = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // A. Enviar Mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text, file }: { chatId: number; text: string; file?: File }) => {
      let contenido = text;
      let tipo = 'texto';

      // Subir imagen primero si existe
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

  // B. Marcar Leído
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => fetchWithAuth(`/api/chat/conversacion/${chatId}/mark-read`, token, { method: 'POST' }),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() }); // Actualizar contadores
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(chatId) });
    },
  });

  // C. Confirmar Transacción
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

  // D. Cancelar Transacción
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

// ============================================================================
// 4. RATE LIMITER (Anti-Spam Local)
// ============================================================================
export function useRateLimiter({ maxRequests, windowMs, cooldownMs }: { maxRequests: number; windowMs: number; cooldownMs: number }) {
  const [isLimited, setIsLimited] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timestamps = useRef<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter(t => now - t < windowMs); // Limpiar viejos

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