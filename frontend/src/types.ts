// Re-exportar tipos principales desde entities
export type {
  User,
  Product,
  Category,
  Transaction,
  Rating,
  CartItem,
  Cart,
  Message,
  Chat,
  Report,
  Notification,
  Publication,
  Forum,
  ForumPublication,
  Comment,
  Favorite,
  LoginCredentials,
  RegisterData,
  CreateProductData,
  UpdateProductData,
} from './entities';

// Tipos de UI y utilitarios
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

// Respuestas de API
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

// Nota: Las categorías ahora se obtienen dinámicamente desde la API
// No usar constantes hardcodeadas