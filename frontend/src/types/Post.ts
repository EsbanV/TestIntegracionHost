// Entidad Post del dominio del marketplace
export interface Post {
  id: number
  title: string
  description: string
  content: string
  categoryId: string
  categoryName: string
  author: string
  avatar: string
  image?: string
  likes: number
  comments: number
  shares: number
  timeAgo: string
  price?: string
  createdAt?: Date
  updatedAt?: Date
}

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

export const CATEGORIES = [
"Todo",
"Electonica",
"Musica",
"Deportes",
"Entretenimiento",
"Servicios",
] as const;
export type Category = (typeof CATEGORIES)[number];

