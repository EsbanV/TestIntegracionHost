// Re-exportar Publication como Post desde el archivo central de tipos
export type { Publication as Post } from '../../../types/entities';

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
  id: string
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
  categoryId: string
  status?: PostStatus
  authorId?: string
  priceRange?: {
    min: number
    max: number
  }
}

// Nota: Las categorías ahora se obtienen dinámicamente desde la API
// No usar constantes hardcodeadas

