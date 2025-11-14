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
} from '../../../types/entities';

// Paginación / filtros
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
  code: string;            // p.ej. 'VALIDATION_ERROR'
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}