// src/features/Marketplace/types/home.types.ts

// Tipo básico de Usuario (Vendedor)
export interface Vendor {
  id: number;
  nombre: string;
  usuario: string;
  fotoPerfilUrl?: string;
  reputacion?: number;
  campus?: string;
}

// Tipo de Imagen
export interface ProductImage {
  id: number;
  url: string;
}

// Tipo principal de Publicación (Post)
export interface Post {
  id: number;
  nombre: string;
  descripcion?: string;
  precioActual: number;
  cantidad?: number;
  categoria?: string;
  estado?: string; // Nuevo, Usado, etc.
  fechaAgregado: string;
  vendedor: Vendor;
  imagenes?: ProductImage[];
}

// Props para los componentes visuales
export interface ItemCardProps {
  post: Post;
  onClick: (p: Post) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}

export interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onContact: (post: Post) => void;
}

// src/features/marketplace/Marketplace.Types/ProductInterfaces.ts

export interface ImagenProducto {
  id: number;
  url: string;
  // Puedes agregar otros campos si vienen del backend, como mimeType
}

export interface Vendedor {
  id: number;
  nombre: string;
  usuario?: string;
  fotoPerfilUrl?: string | null;
  reputacion?: number | null; // Calificación promedio (0-5)
  campus?: string | null;
}

export interface StartTransactionApiResponse {
  ok: boolean;
  created: boolean;
  id: number;
  transactionId: number;
  message?: string;
}

export interface ActiveTransactionFromCheck {
  ok: boolean;
  transaction: {
    id: number;
    confirmacionVendedor: boolean;
    confirmacionComprador: boolean;
    // añade aquí otros campos si los usas (producto, estadoId, etc.)
  } | null;
  message?: string;
}
