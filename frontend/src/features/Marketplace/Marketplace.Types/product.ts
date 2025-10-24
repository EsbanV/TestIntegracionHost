// --- Tipos de Catálogo (Basados en el Schema) ---
export interface EstadoProducto {
  id: number;
  nombre: string; // Ej: "Disponible", "Vendido", "Reservado"
}

export interface Categoria {
  id: number; // El 'selectedCategoryId' de HomePage
  nombre: string; // Ej: "Electrónicos"
}

export interface ImagenProducto {
  id: number;
  urlImagen: string;
}

// --- Tipos de Entidad (Basados en el Schema) ---
export interface VendedorResumen {
  id: number; // ID de la Cuenta (para iniciar chat)
  usuario: string; // 'nombre' en modal, 'author' en card
  avatarUrl: string | null; // Asumimos que lo añadiste al schema 'Cuenta'
  reputacion: number;
}

/**
 * TIPO PRINCIPAL: Representa un producto en el feed.
 * Es la estructura que el hook 'useProductos' debe devolver.
 */
export interface MarketplaceProduct {
  id: number;
  nombre: string; // 'titulo' o 'title' en los componentes
  descripcion: string | null;
  precioActual: number; // 'price'
  cantidad: number | null; // 'stock'
  condicion: string | null; // Ej: "Usado", "Nuevo"
  campus: string | null; // En el schema 'Cuenta' o 'Producto'
  fechaAgregado: string; // ISO Date string ('fechaPublicacion')
  
  // Relaciones
  estado: EstadoProducto;
  categoria: Categoria | null;
  imagenes: ImagenProducto[];
  vendedor: VendedorResumen;
}

// --- Tipos de Hooks ---

/**
 * El objeto que la API devuelve para CADA página
 */
export interface PaginaDeProductos {
  productos: MarketplaceProduct[];
  nextCursor: number | null; // Cursor para la siguiente página
  totalProductos: number;
}

/**
 * Los filtros que acepta el hook 'useProductos'
 */
export interface ProductosFiltros {
  busqueda?: string;
  categoriaId?: number; // 'selectedCategoryId'
  cursor?: number; // Manejado internamente por useInfiniteQuery
}