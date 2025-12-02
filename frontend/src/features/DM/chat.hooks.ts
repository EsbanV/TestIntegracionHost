import { useEffect, useRef, useCallback, useState } from "react";
import { 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient,
  useQuery,
  InfiniteData
} from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/app/context/AuthContext";
// Importamos los tipos estrictos que definimos antes
import type { 
  Chat, 
  Mensaje, 
  ChatListResponse, 
  MessagesResponse,
  BackendMessage,
  ActiveByChatResponse,
  ActiveTransaction
} from "./chat.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// ============================================================================
// 0. UTILIDADES (Normalización de Datos - TIPADO ESTRICTO)
// ============================================================================

const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Puente entre Backend (Raw) y Frontend (UI)
// Ahora usa 'BackendMessage' en lugar de 'any' para seguridad
const normalizeMessage = (m: BackendMessage | any, currentUserId?: number): Mensaje => {
  // 1. Detectar ID del remitente (Prioridad: camelCase > snake_case > objeto)
  const remitenteId = Number(m.remitenteId ?? m.remitente_id ?? m.remitente?.id);
  
  // 2. Detectar contenido
  const contenidoReal = m.contenido || m.texto || "";
  
  // 3. Detectar fecha
  const fechaStr = m.fechaEnvio || m.fecha_envio || new Date().toISOString();
  
  // 4. Parsear metadata
  let metadata = null;
  try { 
    if(m.tipo === 'sistema' && typeof contenidoReal === 'string' && contenidoReal.startsWith('{')) {
       metadata = JSON.parse(contenidoReal); 
    }
  } catch {}

  return {
    id: m.id || Date.now(), 
    texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? (metadata?.text || contenidoReal) : contenidoReal),
    imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(contenidoReal) : undefined,
    autor: (remitenteId === Number(currentUserId)) ? 'yo' : (m.tipo === 'sistema' ? 'sistema' : 'otro'),
    hora: new Date(fechaStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    fechaCompleta: new Date(fechaStr), // Agregado para ordenamientos precisos
    estado: m.leido ? 'leido' : 'recibido',
    tipo: m.tipo || 'texto' as any,
    leido: m.leido, // Importante para UI
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
// 1. HOOK DE SOCKET (CORREGIDO Y SINCRONIZADO)
// ============================================================================
export const useChatSocket = (activeChatId: number | null) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const activeChatIdRef = useRef(activeChatId);

  // Mantener ref actualizada para usar dentro de los listeners
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token || !user) return;
    if (socketRef.current?.connected) return;

    // Conexión
    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;
    socket.on("connect", () => console.log("🟢 [Socket] Conectado"));
    
    // --- A. NUEVO MENSAJE (Event Name: 'nuevo_mensaje') ---
    const handleIncomingMessage = (rawMsg: BackendMessage) => {
      console.log("📨 [Socket] Mensaje:", rawMsg);

      const remitenteId = Number(rawMsg.remitenteId ?? rawMsg.remitente_id ?? rawMsg.remitente?.id);
      const destinatarioId = Number(rawMsg.destinatarioId ?? rawMsg.destinatario_id ?? rawMsg.destinatario?.id);
      
      const currentChatId = Number(activeChatIdRef.current);
      const myId = Number(user.id);

      // Lógica de relevancia: ¿Pertenece este mensaje al chat que estoy viendo?
      const esRelevante = 
        (destinatarioId === myId && remitenteId === currentChatId) || // Me llega del otro
        (remitenteId === myId && destinatarioId === currentChatId);   // Lo envié yo (desde otro tab/device)

      if (esRelevante) {
        // Actualización Optimista de la Caché
        queryClient.setQueryData<InfiniteData<MessagesResponse>>(
          chatKeys.conversation(currentChatId),
          (oldData) => {
            if (!oldData) return undefined;
            
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
                // Inyectamos en la última página (la más reciente en el array)
                const lastPageIndex = newPages.length - 1;
                const lastPage = { ...newPages[lastPageIndex] };
                
                // Evitar duplicados (por si el socket reenvía)
                if (!lastPage.mensajes.find((m) => m.id === rawMsg.id)) {
                    lastPage.mensajes = [...lastPage.mensajes, rawMsg];
                    newPages[lastPageIndex] = lastPage;
                }
            }
            return { ...oldData, pages: newPages };
          }
        );
      }

      // Siempre invalidar lista de chats (para actualizar badge de no leídos y último mensaje)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    };

    // --- B. MENSAJES LEÍDOS (Nuevo: Actualiza doble check) ---
    const handleReadMessages = ({ leidoPor }: { leidoPor: number }) => {
        const currentChatId = Number(activeChatIdRef.current);
        // Si quien leyó es el usuario con el que estoy chateando
        if (leidoPor === currentChatId) {
            queryClient.setQueryData<InfiniteData<MessagesResponse>>(
                chatKeys.conversation(currentChatId),
                (oldData) => {
                    if (!oldData) return undefined;
                    // Recorremos todas las páginas y marcamos todo como leido = true
                    // Esto es más visual que volver a pedir todo al backend
                    const newPages = oldData.pages.map(page => ({
                        ...page,
                        mensajes: page.mensajes.map(m => ({ ...m, leido: true }))
                    }));
                    return { ...oldData, pages: newPages };
                }
            );
        }
    };

    // 🔥 SUSCRIPCIÓN A EVENTOS (Nombres deben coincidir con chat.js)
    socket.on("nuevo_mensaje", handleIncomingMessage);   
    socket.on("mensajes_leidos", handleReadMessages);

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
// 2. HOOKS DE LECTURA
// ============================================================================

export const useChatList = (isOpen: boolean) => {
  const { token, user } = useAuth(); // Necesitamos user id para saber si lo leí yo o él
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
      allChats: data.pages.flatMap(page => page.conversaciones.map((c) => {
        const msg = normalizeMessage(c.ultimoMensaje, user?.id); 
        return {
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          usuario: c.usuario.usuario, // Agregado campo faltante
          ultimoMensaje: msg.tipo === 'imagen' ? '📷 Imagen' : msg.texto,
          fechaUltimoMensaje: msg.fechaCompleta,
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
      // Pagination backwards: Tomamos el ID del mensaje más viejo (el primero del array)
      return lastPage.mensajes[0].id as number; 
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: Infinity, 
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allMessages: data.pages.flatMap(page => 
        page.mensajes.map((m) => normalizeMessage(m, user?.id))
      )
    })
  });
};

// ============================================================================
// 3. ACTIONS (Optimizadas)
// ============================================================================

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

      // La respuesta ahora contiene { ok: true, mensaje: BackendMessage }
      return fetchWithAuth<{ ok: boolean, mensaje: BackendMessage }>('/api/chat/send', token, {
        method: 'POST',
        body: JSON.stringify({ destinatarioId: chatId, contenido, tipo }),
      });
    },
    onSuccess: (data, variables) => {
       // Opcional: Si el socket tarda, podemos inyectar manualmente aquí también
       // Pero con la corrección del socket no debería ser necesario.
    },
    onError: (_, variables) => {
      // Si falla, invalidamos para asegurar que el usuario vea el estado real
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => 
        fetchWithAuth(`/api/chat/conversacion/${chatId}/mark-read`, token, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.lists() }),
  });

  // ... Transaction mutations se mantienen igual ...
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