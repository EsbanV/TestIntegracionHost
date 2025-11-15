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

export interface Post {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precioActual?: number | null; // Precio en CLP
  precioAnterior?: number | null;
  
  // Stock disponible
  cantidad?: number | null;

  // Categoría (Nombre legible, ej: "Electrónicos")
  categoria?: string | null;
  
  // Estado del producto (ej: "Nuevo", "Usado", "Reacondicionado")
  estado?: string | null; 

  // Array de imágenes
  imagenes?: ImagenProducto[] | null;

  // Datos del vendedor
  vendedor?: Vendedor | null;

  // Fechas
  fechaAgregado?: string | Date | null;

  // Calificación del producto en sí (opcional, distinto a la del vendedor)
  calificacion?: number | null;
}