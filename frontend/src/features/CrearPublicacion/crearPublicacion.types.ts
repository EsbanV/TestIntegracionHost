// src/features/marketplace/types/crearPublicacion.types.ts

export interface CreateProductFormData {
  titulo: string;
  precio: string;
  stock: string;
  categoria: string;
  campus: string;
  descripcion: string;
}

export interface CategoryMap {
  [key: string]: number;
}

// Mapeo de categorías (Frontend String -> Backend ID)
export const CATEGORY_MAP: CategoryMap = {
  'Electrónica': 1,
  'Libros y Apuntes': 2,
  'Ropa': 3,
  'Servicios': 4,
  'Otros': 5
};

export const CAMPUS_OPTIONS = ["San Francisco", "San Juan Pablo II"];