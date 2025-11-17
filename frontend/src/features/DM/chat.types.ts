// src/features/DM/types/chat.types.ts

export type EstadoMensaje = "enviando" | "enviado" | "recibido" | "leido" | "error";
export type AutorMensaje = "yo" | "otro" | "sistema";
export type TipoMensaje = "texto" | "imagen" | "sistema";

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

// --- TIPOS PARA PAGINACIÓN ---

// Respuesta cruda del backend (Lista de Chats)
export interface ChatListResponse {
  ok: boolean;
  conversaciones: any[]; // Array de conversaciones crudas
  nextPage?: number;     // Paginación
}

// Respuesta cruda del backend (Mensajes)
export interface MessagesResponse {
  ok: boolean;
  mensajes: any[];       // Array de mensajes crudos
}

// --- TIPOS QUE RETORNAN LOS HOOKS INFINITOS ---
// Estos son los que usan los componentes

export interface ChatListData {
  pages: ChatListResponse[];
  pageParams: number[];
  allChats: Chat[]; // Array aplanado listo para UI
}

export interface ChatMessagesData {
  pages: MessagesResponse[];
  pageParams: number[];
  allMessages: Mensaje[]; // Array aplanado listo para UI
}