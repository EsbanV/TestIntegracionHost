// src/features/favorites/types/favorites.types.ts

export interface Vendor {
  id: number;
  nombre: string;
  usuario: string;
  fotoPerfilUrl?: string;
  reputacion?: number;
  campus?: string;
}

export interface ProductImage {
  id: number;
  url: string;
}

export interface Post {
  id: number;
  nombre: string;
  descripcion?: string;
  precioActual: number;
  cantidad?: number;
  categoria?: string;
  estado?: string;
  fechaAgregado: string;
  vendedor: Vendor;
  imagenes?: ProductImage[];
}

export interface FavoritesState {
  posts: Post[];
  isLoading: boolean;
}