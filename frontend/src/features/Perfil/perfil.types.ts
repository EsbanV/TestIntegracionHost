// src/features/profile/types/perfil.types.ts

export interface UserProfile {
  id: number;
  correo: string;
  usuario: string;
  nombre: string;
  role: string;
  campus: string | null;
  reputacion: string | number;
  telefono?: string | null;
  direccion?: string | null;
  fechaRegistro?: string;
  fotoPerfilUrl?: string;
  resumen?: {
    totalVentas: number;
    totalProductos: number;
  };
}

export interface Review {
  id: number;
  puntuacion: number;
  comentario: string;
  fecha: string;
  calificador: {
    nombre: string;
    fotoPerfilUrl?: string;
  };
  transaccion?: {
    producto: {
      nombre: string;
    };
  };
}

export interface UpdateProfileData {
  usuario?: string;
  campus?: string;
  telefono?: string;
  direccion?: string;
  nombre?: string;
}

export interface ReviewsData {
  reviews: Review[];
  stats: {
    total: number;
    promedio: string;
  };
}

export interface PublicationItem {
  id: string;
  title: string;
  image?: string;
  price?: number;
  author: string;
  avatar?: string;
  description?: string;
  timeAgo?: string;
  categoryName?: string;
  rating?: number;
  sales?: number;
}

export interface UsePublicationsFeedProps {
  searchTerm?: string;
  selectedCategoryId?: string;
  authorId?: string;
  onlyMine?: boolean;
}