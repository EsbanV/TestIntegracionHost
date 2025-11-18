// src/features/forum/types/forum.types.ts

// --- USUARIOS ---
export interface PublicationAuthor {
  id: number;
  nombre: string;
  usuario: string;
  fotoPerfilUrl?: string;
}

// --- PUBLICACIONES ---
export interface Publication {
  id: number;
  titulo: string;
  cuerpo: string;
  fecha: string; // ISO Date string
  usuario: PublicationAuthor;
  estado?: string;
  visto?: boolean;
  // Opcional: Si en el futuro agregas conteo de comentarios a la vista principal
  _count?: {
    comentarios: number;
  };
}

export interface NewPublicationData {
  titulo: string;
  cuerpo: string;
}

// --- COMENTARIOS (NUEVO) ---

export interface CommentReplyPreview {
  id: number;
  contenido: string;
  autor: {
    id: number;
    usuario: string;
  };
}

export interface Comment {
  id: number;
  publicacionId: number;
  contenido: string;
  fecha: string;
  autor: PublicationAuthor;
  parentCommentId: number | null;
  
  // Datos calculados por el backend
  repliesCount: number; // Cantidad total de respuestas
  respuestas: CommentReplyPreview[]; // Preview de las últimas 2 respuestas
}

// Estructura de respuesta paginada para comentarios
export interface CommentsResponse {
  ok: boolean;
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Datos para crear/responder un comentario
export interface NewCommentData {
  publicacionId: number;
  contenido: string;
  parentCommentId?: number | null; // Opcional: si es null es raíz, si tiene ID es respuesta
}