export type AdminProductStatus = 'published' | 'hidden' | 'deleted' | string;

export interface AdminProduct {
  id: string;
  title: string;
  author: string;
  price?: number;
  categoryName?: string;
  createdAt?: string;
  status?: AdminProductStatus;
}

export interface AdminProductQuery {
  q?: string;
  status?: AdminProductStatus;
}
