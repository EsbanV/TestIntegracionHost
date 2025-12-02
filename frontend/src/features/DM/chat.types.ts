// src/features/DM/types/chat.types.ts

// ============================================================================
// 1. TIPOS DE LA INTERFAZ DE USUARIO (Frontend Clean Data)
// ============================================================================
// Estos son los datos ya procesados listos para renderizar en React

export type EstadoMensaje = "enviando" | "enviado" | "recibido" | "leido" | "error";
export type AutorMensaje = "yo" | "otro" | "sistema";
export type TipoMensaje = "texto" | "imagen" | "sistema";

export interface UsuarioMinimo {
  id: number;
  nombre: string;
  usuario: string;
  fotoPerfilUrl?: string;
}

// El mensaje "limpio" que usan tus componentes React
export interface Mensaje { 
  id: number | string; // string para IDs temporales (optimistic UI)
  texto: string;       // Unificado: aquí siempre guardamos el contenido visual
  autor: AutorMensaje;
  hora: string;        // Formato HH:mm procesado
  fechaCompleta: Date; // Objeto Date real para ordenamiento
  estado: EstadoMensaje;
  tipo: TipoMensaje;
  leido: boolean;
  metadata?: any;
}

export interface Chat { 
  id: number; // ID del otro usuario (o ID de conversación si cambias la lógica)
  nombre: string; 
  usuario: string; // handle (@usuario)
  avatar?: string; 
  ultimoMensaje?: string; 
  fechaUltimoMensaje?: Date; // Para ordenar la lista de chats
  mensajes: Mensaje[]; 
  noLeidos: number;
  online: boolean; // Estado en tiempo real
  escribiendo?: boolean; // Estado "Typing..."
  transaccion?: TransaccionActiva | null;
}

// ============================================================================
// 2. TIPOS DE RESPUESTA DEL BACKEND (Raw Data)
// ============================================================================
// Estos deben coincidir EXACTAMENTE con lo que envía res.json() y io.emit()

// Base del mensaje que viene de Prisma (CamelCase)
export interface BackendMessage {
  id: number;
  contenido: string; // El backend refactorizado SIEMPRE envía 'contenido'
  tipo: string;      // 'texto' | 'imagen'
  leido: boolean;
  fechaEnvio: string; // Del JSON siempre viene string ISO
  remitenteId: number;
  destinatarioId: number;

  // Relaciones (Include de Prisma)
  remitente?: UsuarioMinimo;
  destinatario?: UsuarioMinimo;
  
  // Soporte legado para SQL Raw (solo si el backend no se normalizó al 100%)
  // Lo marcamos como opcional, pero intentaremos no usarlo
  remitente_id?: number; 
  destinatario_id?: number;
  fecha_envio?: string;
}

// Payload específico que llega por Socket.io (evento 'nuevo_mensaje')
export interface SocketMessagePayload extends BackendMessage {
  // A veces los sockets traen metadata extra, por ahora es igual al BackendMessage
}

// Respuesta de la lista de conversaciones (/api/chat/conversaciones)
export interface RawConversation {
  usuario: UsuarioMinimo;
  ultimoMensaje: BackendMessage; // Ahora usa la definición estricta
  unreadCount: number;
}

// --- RESPUESTAS DE API TIPADAS ---

export interface ChatListResponse {
  ok: boolean;
  conversaciones: RawConversation[]; 
  nextPage?: number;
}

export interface MessagesResponse {
  ok: boolean;
  mensajes: BackendMessage[]; 
}

// --- TRANSACCIONES (Mantenido igual, parece correcto) ---

export interface ActiveTransaction {
  id: number;
  producto: {
    id: number;
    nombre: string;
    imagen: string | null;
  };
  estadoId: number;
  compradorId: number;
  vendedorId: number;
  confirmacionVendedor: boolean;
  confirmacionComprador: boolean;
  fecha: string | Date;
  esComprador: boolean;
  esVendedor: boolean;
}

export interface TransaccionActiva extends ActiveTransaction {} // Alias por compatibilidad