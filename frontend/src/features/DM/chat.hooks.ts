import { useEffect, useRef, useCallback } from "react";
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
  MessagesResponse 
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
export const useChatSocket = (
  activeChatId: number | null
) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(URL_BASE, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🟢 Socket Conectado"));

    // Manejo de mensajes entrantes
    socket.on("new_message", (msg: any) => {
      // 1. Siempre invalidar la lista de chats (para actualizar el último mensaje y contadores)
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });

      // 2. Si el mensaje pertenece al chat abierto, invalidar sus mensajes
      if (activeChatId && (msg.remitente.id === activeChatId || msg.destinatario.id === activeChatId)) {
         queryClient.invalidateQueries({ queryKey: chatKeys.conversation(activeChatId) });
         // Opcional: Optimistic update aquí si quieres velocidad extrema
      }
    });

    // Manejo de eventos de transacción (entrega/recibo)
    socket.on("transaction_event", (data: any) => {
      if (activeChatId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.transaction(activeChatId) });
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      }
    });

    return () => { socket.disconnect(); };
  }, [token, activeChatId, queryClient]);

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
export const useChatTransaction = (activeChatId: number | null, isOpen: boolean) => {
  const { token, user } = useAuth();

  return useQuery<TransaccionActiva | null>({
    queryKey: chatKeys.transaction(activeChatId!),
    queryFn: async () => {
      const data: any = await fetchWithAuth(`/api/transactions/check-active/${activeChatId}`, token);
      if(data.ok && data.transaction) {
        return {
          id: data.transaction.id,
          producto: data.transaction.producto,
          estadoId: data.transaction.estadoId,
          esComprador: data.transaction.compradorId === user?.id,
          esVendedor: data.transaction.vendedorId === user?.id,
          confirmacionVendedor: data.transaction.confirmacionVendedor,
          confirmacionComprador: data.transaction.confirmacionComprador
        };
      }
      return null;
    },
    enabled: !!token && !!activeChatId && isOpen,
    staleTime: 1000 * 60 * 5, 
    retry: false
  });
};

// ============================================================================
// 3. HOOK DE ACCIONES (Mutaciones)
// ============================================================================
export const useChatActions = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  // A. Enviar Mensaje (Texto o Archivo)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text, file }: { chatId: number, text: string, file?: File }) => {
      let contenido = text;
      let tipo = 'texto';

      // Subir imagen si existe
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${URL_BASE}/api/upload/upload-image`, {
           method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        });
        const data = await res.json();
        if (!data.ok) throw new Error("Error subiendo imagen");
        contenido = data.imageUrl;
        tipo = 'imagen';
      }

      // Enviar mensaje
      return fetchWithAuth('/api/chat/send', token, {
        method: 'POST',
        body: JSON.stringify({ destinatarioId: chatId, contenido, tipo })
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar para refrescar UI
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    }
  });

  // B. Marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: number) => 
      fetchWithAuth(`/api/chat/conversacion/${chatId}/mark-read`, token, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    }
  });

  // C. Confirmar Transacción (Entrega o Recepción)
  const confirmTransactionMutation = useMutation({
    mutationFn: async ({ txId, type }: { txId: number, type: 'delivery' | 'receipt' }) => {
      const endpoint = type === 'delivery' ? 'confirm-delivery' : 'confirm-receipt';
      return fetchWithAuth(`/api/transactions/${txId}/${endpoint}`, token, { method: 'PATCH' });
    },
    onSuccess: (_, variables) => {
       // Buscamos qué chat tenía esta transacción para invalidarlo
       queryClient.invalidateQueries({ queryKey: chatKeys.all }); 
    }
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    confirmTransaction: confirmTransactionMutation.mutateAsync,
    isConfirming: confirmTransactionMutation.isPending
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