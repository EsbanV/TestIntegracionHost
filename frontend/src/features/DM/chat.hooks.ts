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

export const chatKeys = {
  all: ['chat'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  // Forzamos que el ID sea string en la key para evitar desajustes "123" vs 123
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
// 1. HOOK DE SOCKET (CORREGIDO PARA ACTUALIZACIÓN EN TIEMPO REAL)
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
    if (!token) return;
    if (socketRef.current?.connected) return;

    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🟢 Socket Conectado"));
    
    // --- MANEJO DE MENSAJES (OPTIMISTIC UPDATE) ---
    socket.on("new_message", (rawMsg: any) => {
      console.log("📨 Socket Msg:", rawMsg);

      const currentChatId = activeChatIdRef.current;
      
      // Normalizar IDs para comparación (Socket a veces manda strings, DB numbers)
      const msgRemitenteId = Number(rawMsg.remitenteId ?? rawMsg.remitente_id ?? rawMsg.remitente?.id);
      const msgDestinatarioId = Number(rawMsg.destinatarioId ?? rawMsg.destinatario_id ?? rawMsg.destinatario?.id);
      const currentChatIdNum = Number(currentChatId);

      // Verificar relevancia
      const esParaMi = msgDestinatarioId === user?.id && msgRemitenteId === currentChatIdNum;
      const esMio = msgRemitenteId === user?.id && msgDestinatarioId === currentChatIdNum;

      if (esParaMi || esMio) {
        // 1. Crear un objeto que simule ser una fila de la DB (RawMessage)
        // Esto es CRUCIAL para que el 'select' de useChatMessages lo entienda
        const dbLikeMessage: RawMessage = {
          id: rawMsg.id || Date.now(),
          contenido: rawMsg.contenido || rawMsg.texto || "", // Normalizar contenido
          tipo: rawMsg.tipo || 'texto',
          leido: false,
          fechaEnvio: new Date().toISOString(), // Usar ISO string como la DB
          remitenteId: msgRemitenteId,
          destinatarioId: msgDestinatarioId,
          metadata: rawMsg.metadata
        };

        // 2. Inyectar en caché (Infinite Query)
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          chatKeys.conversation(currentChatIdNum),
          (oldData) => {
            if (!oldData) return undefined;

            const newPages = [...oldData.pages];
            
            // Inyectar en la página 0 (la más reciente)
            if (newPages.length > 0) {
                const firstPage = { ...newPages[0] };
                // Añadimos al final del array de mensajes
                firstPage.mensajes = [...firstPage.mensajes, dbLikeMessage];
                newPages[0] = firstPage;
            }

            return { ...oldData, pages: newPages };
          }
        );
      }

      // 3. Actualizar lista lateral siempre
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
// 2. HOOKS DE LECTURA (Selectores Robustos)
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
        ultimoMensaje: c.ultimoMensaje?.tipo === 'imagen' ? '📷 Imagen' : (c.ultimoMensaje?.contenido || c.ultimoMensaje?.texto), // Soporte doble
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
    // Usamos String() para asegurar coincidencia con la key del socket
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
    staleTime: Infinity, // IMPORTANTE: No refrescar automáticamente para no sobrescribir el socket
    
    // SELECTOR: Aquí transformamos la data Raw (DB + Socket) a data UI
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allMessages: data.pages.flatMap(page => page.mensajes).map((m: RawMessage) => {
        let metadata = null;
        try { if(m.tipo === 'sistema' && typeof m.contenido === 'string') metadata = JSON.parse(m.contenido); } catch {}
        
        // Normalización defensiva (Maneja lo que venga del socket o de la DB)
        const contenidoReal = m.contenido || m.texto || "";
        const remitenteIdReal = Number(m.remitenteId ?? m.remitente_id);
        const fechaReal = m.fechaEnvio || m.fecha_envio || new Date();

        return {
          id: m.id,
          texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || contenidoReal) : contenidoReal),
          imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(contenidoReal) : undefined,
          autor: (remitenteIdReal === user?.id) ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
          hora: new Date(fechaReal).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: m.leido ? 'leido' : 'recibido',
          tipo: m.tipo,
          metadata
        } as Mensaje;
      })
    })
  });
};

// ... (Resto de hooks: useChatTransactions, useChatActions, useRateLimiter - IGUALES)
// Solo asegúrate de copiar también el resto del archivo anterior si lo tenías completo.
// Aquí te dejo el resto por si acaso:

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

      return fetchWithAuth<{ ok: boolean, mensaje?: RawMessage }>('/api/chat/send', token, {
        method: 'POST',
        body: JSON.stringify({ destinatarioId: chatId, contenido, tipo }),
      });
    },
    // No usamos onSuccess aquí para evitar doble render, confiamos en el evento del socket que llega instantáneamente
    // Pero si el socket falla, podemos invalidar
    onError: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
    }
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