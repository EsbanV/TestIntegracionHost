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

// --- NUEVOS TIPOS PARA PAGINACIÓN ---

export interface ChatListResponse {
  ok: boolean;
  conversaciones: any[]; // Datos crudos del backend
  nextPage?: number;     // Para saber si hay más chats
}

export interface MessagesResponse {
  ok: boolean;
  mensajes: any[];       // Datos crudos del backend
}