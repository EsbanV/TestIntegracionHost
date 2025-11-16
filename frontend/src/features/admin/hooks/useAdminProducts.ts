import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminProduct, AdminProductQuery } from '../types/adminProduct';
import type { Post } from '@/types/Post';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function mapPostToAdminProduct(p: Post): AdminProduct {
  const priceNum = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : (p as any).price;
  const status = (p as any).status as AdminProduct['status'] | undefined;
  const createdAt = p.createdAt instanceof Date ? p.createdAt.toISOString() : (p.createdAt as any);
  return {
    id: String(p.id),
    title: p.title,
    author: p.author,
    price: typeof priceNum === 'number' && !Number.isNaN(priceNum) ? priceNum : undefined,
    categoryName: p.categoryName,
    createdAt,
    status: status ?? 'published',
  };
}

export function useAdminProducts(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<AdminProduct['status'] | undefined>(undefined);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = (q: string, s?: string) => {
    const params: string[] = [];
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (s) params.push(`status=${encodeURIComponent(s)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${BASE}/admin/products${qs}`;
  };

  const fetchProducts = useCallback(async (opts?: Partial<AdminProductQuery>) => {
    setLoading(true);
    setError(null);
    try {
      const q = opts?.q ?? query;
      const s = opts?.status ?? status;

      if (BASE) {
        const res = await fetch(buildUrl(q, s), { credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list: AdminProduct[] = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setProducts(list);
      } else {
        // Fallback a MSW /api/posts y filtrado local
        const res = await fetch(`/api/posts?limit=1000`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const posts: Post[] = Array.isArray(data?.posts) ? data.posts : [];
        let list = posts.map(mapPostToAdminProduct);
        if (q) {
          const ql = q.toLowerCase();
          list = list.filter(p => p.title.toLowerCase().includes(ql) || p.author.toLowerCase().includes(ql));
        }
        if (s) {
          list = list.filter(p => (p.status ?? 'published') === s);
        }
        setProducts(list);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const actions = useMemo(() => ({
    setQuery,
    setStatus,
    refetch: () => fetchProducts({ q: query, status }),
  }), [fetchProducts, query, status]);

  return {
    products,
    loading,
    error,
    query,
    status,
    ...actions,
  };
}
