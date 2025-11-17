// src/features/forum/types/forum.types.ts

// Autor de la publicación (Usuario)
export interface PublicationAuthor {
  id: number;
  nombre: string;
  usuario: string;
  fotoPerfilUrl?: string;
}

// Publicación completa
export interface Publication {
  id: number;
  titulo: string;
  cuerpo: string;
  fecha: string; // ISO Date string
  usuario: PublicationAuthor;
  // Opcionales si tu backend los manda
  estado?: string;
  visto?: boolean;
}

// Datos para crear nueva publicación
export interface NewPublicationData {
  titulo: string;
  cuerpo: string;
}