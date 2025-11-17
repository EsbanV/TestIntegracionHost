// src/features/profile/types/perfil.types.ts

export interface UserProfile {
  id: number;
  correo: string;
  usuario: string;
  nombre: string;
  role: string;   // El backend envía el nombre del rol, no el objeto
  estado?: string; // El backend envía el nombre del estado
  campus: string | null;
  reputacion: string | number;
  telefono?: string | null;
  direccion?: string | null;
  fechaRegistro?: string;
  fotoPerfilUrl?: string;
  
  // Unificamos la estructura de estadísticas para el frontend
  stats?: {
    ventas: number;
    publicaciones: number; // En el privado puede venir como totalProductos
    compras?: number;      // Solo disponible en privado
  };
}

// Respuesta de la API para perfiles
export interface ProfileApiResponse {
  success: boolean;
  data: UserProfile & {
    // El backend a veces envía 'resumen' (privado) o 'stats' (público)
    resumen?: {
      totalVentas: number;
      totalProductos: number;
      totalCompras: number;
    };
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
  ok: boolean;
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