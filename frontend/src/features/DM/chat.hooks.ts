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
  TransaccionActiva, 
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

// Centralizamos las claves de caché para evitar errores de tipeo y facilitar invalidaciones
export const chatKeys = {
  all: ['chat'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  conversation: (chatId: number) => [...chatKeys.all, 'messages', chatId] as const,
  transaction: (chatId: number) => [...chatKeys.all, 'transaction', chatId] as const,
};

// Fetcher genérico con Auth
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
// 1. HOOK DE SOCKET (Conexión y Eventos)
// ============================================================================
// En chat.hooks.ts

export const useChatSocket = (activeChatId: number | null) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  
  // 1. Usamos useRef para mantener el ID actualizado sin reiniciar el efecto del socket
  const activeChatIdRef = useRef(activeChatId);

  // Actualizamos la referencia cada vez que cambia el componente, 
  // pero esto NO dispara el useEffect de abajo.
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token) return;

    // A. Inicialización ÚNICA (Solo depende del token)
    console.log("🔌 Inicializando Socket...");
    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      // Opcional: reconexión automática
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // B. Debugging de conexión
    socket.on("connect", () => console.log("🟢 Socket Conectado ID:", socket.id));
    socket.on("connect_error", (err) => console.error("🔴 Error Socket:", err.message));
    socket.on("disconnect", (reason) => console.warn("🟡 Socket Desconectado:", reason));

    // C. Manejo de mensajes
    socket.on("new_message", (msg: any) => {
      console.log("📩 Mensaje recibido por socket:", msg);

      // 1. Siempre refrescar la lista lateral (para mostrar "nuevo mensaje" y contadores)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });

      // 2. Verificar si el mensaje pertenece al chat que el usuario está viendo AHORA MISMO.
      // Usamos .current para leer el valor en tiempo real sin reiniciar el socket.
      const currentChatId = activeChatIdRef.current;
      
      const esRemitente = msg.remitente?.id === currentChatId;
      const esDestinatario = msg.destinatario?.id === currentChatId; // Caso raro pero posible si me auto-envío

      if (currentChatId && (esRemitente || esDestinatario)) {
         console.log("🔄 Refrescando chat activo:", currentChatId);
         queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentChatId) });
      }
    });

    // D. Eventos de transacción
    socket.on("transaction_event", (data: any) => {
      console.log("💰 Evento transacción:", data);
      const currentChatId = activeChatIdRef.current;
      
      // Refrescar siempre listas
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });

      // Si estamos en el chat relevante, refrescar transacciones y mensajes
      if (currentChatId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.transaction(currentChatId) });
        queryClient.invalidateQueries({ queryKey: chatKeys.conversation(currentChatId) });
      }
    });

    // Limpieza al desmontar (solo si cambia el token o se desmonta la app)
    return () => {
      console.log("🔌 Desconectando socket...");
      socket.disconnect();
    };
  }, [token, queryClient]); // <--- NOTA: activeChatId YA NO está aquí

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
    staleTime: 1000 * 60 * 2, // 2 minutos
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Aplanamos los datos para uso fácil en UI
      allChats: data.pages.flatMap(page => page.conversaciones.map((c: any) => ({
        id: c.usuario.id,
        nombre: c.usuario.nombre || c.usuario.usuario,
        ultimoMensaje: c.ultimoMensaje?.tipo === 'imagen' ? '📷 Imagen' : c.ultimoMensaje?.contenido,
        avatar: getFullImgUrl(c.usuario.fotoPerfilUrl),
        noLeidos: c.unreadCount || 0,
        mensajes: [],
        online: false, // Se podría implementar con socket presence
        transaccion: null
      } as Chat)))
    })
  });
};

// B. MENSAJES DE CONVERSACIÓN (Infinito hacia arriba)
export const useChatMessages = (activeChatId: number | null, isOpen: boolean) => {
  const { token, user } = useAuth();

  return useInfiniteQuery<MessagesResponse, Error>({
    queryKey: chatKeys.conversation(activeChatId!),
    queryFn: ({ pageParam = null }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return fetchWithAuth(`/api/chat/conversacion/${activeChatId}${cursor}`, token);
    },
    initialPageParam: null as number | null,
    // El cursor es el ID del mensaje más antiguo recibido
    getNextPageParam: (lastPage) => {
      if (!lastPage.ok || !lastPage.mensajes || lastPage.mensajes.length === 0) return undefined;
      return lastPage.mensajes[0].id; 
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 0, // Mensajes siempre frescos al cambiar de chat
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Mapeo de mensajes
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

// C. TRANSACCIÓN ACTIVA
// Después (más robusto)
// ============================================================================
// 3. HOOK: TRANSACCIONES ACTIVAS PARA UN CHAT (lista)
// ============================================================================
export const useChatTransactions = (
  activeChatId: number | null,
  isOpen: boolean
) => {
  const { token, user } = useAuth();

  return useQuery<ActiveTransaction[]>({
    queryKey: activeChatId
      ? chatKeys.transaction(activeChatId)
      : ['chat', 'transaction', 'none'],
    queryFn: async () => {
      if (!activeChatId) return [];

      const data = await fetchWithAuth<ActiveByChatResponse>(
        `/api/transactions/active-by-chat/${activeChatId}`,
        token
      );

      if (!data.ok || !Array.isArray(data.transactions)) {
        return [];
      }

      return data.transactions.map((t) => ({
        ...t,
        esComprador: t.compradorId === user?.id,
        esVendedor: t.vendedorId === user?.id,
      }));
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    retry: false,
  });
};

// ============================================================================
// 4. HOOK DE ACCIONES (mutaciones del chat + transacciones)
// ============================================================================
type ConfirmTxVars = {
  txId: number;
  type: 'delivery' | 'receipt';
  chatUserId: number; // mismo id que activeChatId
};

type CancelTxVars = {
  txId: number;
  chatUserId: number;
};

export const useChatActions = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // A. Enviar mensaje (texto o imagen)
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      chatId,
      text,
      file,
    }: {
      chatId: number;
      text: string;
      file?: File;
    }) => {
      let contenido = text;
      let tipo = 'texto';

      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${URL_BASE}/api/upload/upload-image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const raw = await res.json();
        if (!res.ok || !raw?.ok) {
          throw new Error(raw?.message || 'Error subiendo imagen');
        }

        contenido = raw.imageUrl;
        tipo = 'imagen';
      }

      return fetchWithAuth<{ ok: boolean }>(
        '/api/chat/send',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            destinatarioId: chatId,
            contenido,
            tipo,
          }),
        }
      );
    },
    onSuccess: (_, variables) => {
      // Refrescar conversación y lista de chats
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(variables.chatId),
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  // B. Marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) =>
      fetchWithAuth<{ ok: boolean }>(
        `/api/chat/conversacion/${chatId}/mark-read`,
        token,
        { method: 'POST' }
      ),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(chatId),
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  // C. Confirmar transacción (entrega / recibo)
  const confirmTransactionMutation = useMutation({
    mutationFn: async ({ txId, type }: ConfirmTxVars) => {
      const endpoint =
        type === 'delivery' ? 'confirm-delivery' : 'confirm-receipt';

      return fetchWithAuth<{ ok: boolean }>(
        `/api/transactions/${txId}/${endpoint}`,
        token,
        { method: 'PATCH' }
      );
    },
    onSuccess: (_, variables) => {
      // Refrescar solo lo relacionado al chat de esa persona
      queryClient.invalidateQueries({
        queryKey: chatKeys.transaction(variables.chatUserId),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(variables.chatUserId),
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  // D. Cancelar transacción (con devolución de stock)
  const cancelTransactionMutation = useMutation({
    mutationFn: async ({ txId }: CancelTxVars) => {
      return fetchWithAuth<{ ok: boolean }>(
        `/api/transactions/${txId}/cancel`,
        token,
        { method: 'PATCH' }
      );
    },
    onSuccess: (_, variables) => {
      // Al cancelar, sacamos esa transacción del carrusel
      queryClient.invalidateQueries({
        queryKey: chatKeys.transaction(variables.chatUserId),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(variables.chatUserId),
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });

  // ✅ API pública del hook
  return {
    sendMessage: (args: { chatId: number; text: string; file?: File }) =>
      sendMessageMutation.mutateAsync(args),

    markAsRead: (chatId: number) =>
      markAsReadMutation.mutateAsync(chatId),

    confirmTransaction: (vars: ConfirmTxVars) =>
      confirmTransactionMutation.mutateAsync(vars),

    cancelTransaction: (vars: CancelTxVars) =>
      cancelTransactionMutation.mutateAsync(vars),

    isSending: sendMessageMutation.isPending,
    isConfirming: confirmTransactionMutation.isPending,
    isCancelling: cancelTransactionMutation.isPending,
  };
};


// ============================================================================
// 4. RATE LIMITER (Mutaciones)
// ============================================================================

interface RateLimiterOptions {
  maxRequests: number; // Ej: 5 mensajes
  windowMs: number;    // Ej: en 5000ms (5 segundos)
  cooldownMs: number;  // Ej: Bloquear por 10000ms (10 segundos) si se excede
}

export function useRateLimiter({ maxRequests, windowMs, cooldownMs }: RateLimiterOptions) {
  const [isLimited, setIsLimited] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Usamos useRef para no provocar re-renders innecesarios con el historial de tiempos
  const timestamps = useRef<number[]>([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // 1. Filtrar timestamps antiguos (fuera de la ventana de tiempo)
    timestamps.current = timestamps.current.filter(t => now - t < windowMs);

    // 2. Verificar si estamos bloqueados
    if (isLimited) return false;

    // 3. Verificar si excedimos el límite
    if (timestamps.current.length >= maxRequests) {
      // ACTIVAR BLOQUEO
      setIsLimited(true);
      setTimeLeft(cooldownMs / 1000);

      // Iniciar cuenta regresiva para desbloquear
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLimited(false);
            timestamps.current = []; // Resetear historial al desbloquear
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return false; // Bloquear acción actual
    }

    // 4. Si todo ok, registrar este intento
    timestamps.current.push(now);
    return true; // Permitir acción
  }, [isLimited, maxRequests, windowMs, cooldownMs]);

  return { isLimited, timeLeft, checkRateLimit };
}