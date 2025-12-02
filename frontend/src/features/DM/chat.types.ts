// src/features/DM/types/chat.types.ts

// ============================================================================
// 1. TIPOS DE LA INTERFAZ DE USUARIO (Frontend Clean Data)
// ============================================================================
export type EstadoMensaje = "enviando" | "enviado" | "recibido" | "leido" | "error";
export type AutorMensaje = "yo" | "otro" | "sistema";
export type TipoMensaje = "texto" | "imagen" | "sistema";

// El mensaje "limpio" que usan tus componentes React
export interface Mensaje { 
  id: number | string; 
  texto: string; 
  autor: AutorMensaje;
  hora: string; 
  estado?: EstadoMensaje;
  imagenUrl?: string;
  tipo?: string; 
  metadata?: any;
}

export interface TransaccionActiva {
  id: number;
  producto: { id: number, nombre: string, imagen?: string };
  estadoId: number; 
  esComprador: boolean;
  esVendedor: boolean;
  confirmacionVendedor: boolean;
  confirmacionComprador: boolean;
}

export interface Chat { 
  id: number; 
  nombre: string; 
  ultimoMensaje?: string; 
  mensajes: Mensaje[]; 
  avatar?: string; 
  noLeidos?: number;
  online?: boolean;
  transaccion?: TransaccionActiva | null;
}

// ============================================================================
// 2. TIPOS DE RESPUESTA DEL BACKEND (Raw Data)
// ============================================================================

// Interfaz polimórfica: Soporta respuesta de Prisma (camelCase) y SQL Raw (snake_case)
// Esto es vital para manejar los sockets y fetchers sin errores de tipo
export interface RawMessage {
  id: number | string; // El socket puede enviar IDs temporales strings
  contenido?: string;  // A veces llega como 'texto'
  texto?: string;      // Soporte para ambos nombres
  tipo: string;
  leido: boolean;
  
  // Claves de tiempo
  fecha_envio?: string | Date;
  fechaEnvio?: string | Date;
  created_at?: string | Date; // Por si acaso

  // Claves de IDs (Snake vs Camel)
  remitente_id?: number;
  remitenteId?: number;
  destinatario_id?: number;
  destinatarioId?: number;

  // Objetos anidados (Prisma include)
  remitente?: { id: number; nombre: string; usuario: string };
  destinatario?: { id: number; nombre: string; usuario: string };

  metadata?: any;
}

// Respuesta de la lista de conversaciones
export interface RawConversation {
  usuario: {
    id: number;
    nombre: string;
    usuario: string;
    fotoPerfilUrl?: string;
  };
  ultimoMensaje: RawMessage;
  unreadCount: number;
}

// --- RESPUESTAS DE API TIPADAS ---

export interface ChatListResponse {
  ok: boolean;
  conversaciones: RawConversation[]; // Ahora está fuertemente tipado
  nextPage?: number;
}

export interface MessagesResponse {
  ok: boolean;
  mensajes: RawMessage[]; // Ahora está fuertemente tipado
}

// --- TIPOS PARA INFINITE QUERIES (React Query) ---

export interface ChatListData {
  pages: ChatListResponse[];
  pageParams: number[];
  allChats: Chat[]; 
}

export interface ChatMessagesData {
  pages: MessagesResponse[];
  pageParams: number[];
  allMessages: Mensaje[];
}

// --- TRANSACCIONES ---

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

export interface ActiveByChatResponse {
  ok: boolean;
  transactions: {
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
    fecha: string;
  }[];
}