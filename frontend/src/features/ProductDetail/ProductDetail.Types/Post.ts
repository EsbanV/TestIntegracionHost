// Re-exportar tipos principales desde entities
export type {
  Product as Post,
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

// Value Objects relacionados con Post
export interface PostMetrics {
  likes: number
  comments: number
  shares: number
}

export interface PostAuthor {
  name: string
  avatar: string
  reputation?: number
}

export interface PostCategory {
  id: number
  name: string
  description?: string
}

// Estados del post
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// Tipos para filtros
export interface PostFilters {
  searchTerm: string
  categoryId: number // Cambiado a number para alinearse con schema
  status?: PostStatus
  authorId?: number
  priceRange?: {
    min: number
    max: number
  }
}

// Nota: Las categorías ahora se obtienen dinámicamente desde la API
// No usar constantes hardcodeadas

