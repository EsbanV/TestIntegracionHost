import { Post, PostFilters } from '../../../../types/Post'

// Interface para el repositorio de posts
export interface PostRepository {
  findAll(filters: PostFilters, page: number, limit: number): Promise<{
    posts: Post[]
    hasMore: boolean
    totalCount: number
  }>
  findById(id: number): Promise<Post | null>
  create(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post>
  update(id: number, post: Partial<Post>): Promise<Post>
  delete(id: number): Promise<void>
}

// Interface para casos de uso de posts
export interface PostUseCases {
  getPostsWithFilters(filters: PostFilters, page: number): Promise<{
    posts: Post[]
    hasMore: boolean
    totalCount: number
  }>
  getPostById(id: number): Promise<Post | null>
  createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post>
  updatePost(id: number, postData: Partial<Post>): Promise<Post>
  deletePost(id: number): Promise<void>
}