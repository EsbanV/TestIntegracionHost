// frontend/src/features/admin/hooks/useAdmin.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUser } from '../types/adminUser';
import type { AdminProduct, AdminProductQuery } from '../types/adminProduct';
import type { Post } from '@/types/Post';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ============================================================================
// 1. GESTIÓN DE USUARIOS (ADMIN USERS)
// ============================================================================

// Definición de Query Keys
export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (query: string) => [...adminUserKeys.lists(), { query }] as const,
};

interface AdminUsersResponse {
  users: any[];
  total: number;
}

const fetchUsers = async (query: string): Promise<AdminUsersResponse> => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  
  const queryString = params.toString();
  const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get<AdminUsersResponse>(url);
  
  // Coerción de datos
  const coercedUsers = response.users.map((user: any) => ({
    ...user,
    banned: Boolean(user.banned),
    id: String(user.id)
  })) as AdminUser[];
  
  return { ...response, users: coercedUsers };
};

export function useAdminUsers(query: string) {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: adminUserKeys.list(query),
    queryFn: () => fetchUsers(query),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// --- Mutaciones de Usuarios ---

// DELETE USER
const deleteUserRequest = async (userId: string) => {
  console.log('🔄 Eliminando usuario ID:', userId);
  const response = await api.delete(`/admin/users/${userId}`);
  return response || { success: true };
};

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

// BAN USER (Optimistic Update Completo)
interface BanRequest {
  userId: string;
  banned: boolean;
}

const toggleBanRequest = async ({ userId, banned }: BanRequest) => {
  console.log(`🔄 Ban request: ${userId} -> ${banned}`);
  return await api.patch(`/admin/users/${userId}/ban`, { banned });
};

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleBanRequest,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: adminUserKeys.all });
      const previousQueries = queryClient.getQueriesData(adminUserKeys.all);
      
      queryClient.setQueriesData(adminUserKeys.all, (oldData: any) => {
        if (!oldData?.users) return oldData;
        return {
          ...oldData,
          users: oldData.users.map((u: any) => 
            String(u.id) === variables.userId ? { ...u, banned: variables.banned } : u
          )
        };
      });
      
      return { previousQueries };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
}

// UPDATE ROLE
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  const updateRole = async ({ id, newRole }: { id: string, newRole: string }) => {
    const res = await fetch(`${BASE}/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) throw new Error(`Failed to update role (${res.status})`);
    return res.json();
  };

  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    }
  });
}


// ============================================================================
// 2. GESTIÓN DE PRODUCTOS (ADMIN PRODUCTS)
// ============================================================================

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
    return `${BASE}/admin/products${params.length ? `?${params.join('&')}` : ''}`;
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
        const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setProducts(list);
      } else {
        // Fallback Mock
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

  return { products, loading, error, query, status, ...actions };
}

// --- Mutaciones de Productos ---

export function useHideProduct() {
  const hideProduct = async (id: string) => {
    const url = BASE 
      ? `${BASE}/admin/products/${encodeURIComponent(id)}/hide` 
      : `/api/posts/${encodeURIComponent(id)}`;
      
    const method = BASE ? 'PATCH' : 'PUT';
    const body = BASE ? undefined : JSON.stringify({ status: 'hidden' });

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: BASE ? 'include' : undefined,
      body
    });
    
    if (!res.ok) throw new Error(`Hide failed (${res.status})`);
    return res.json();
  };
  return { hideProduct };
}

export function useDeleteProduct() {
  const deleteProduct = async (id: string) => {
    const url = BASE 
      ? `${BASE}/admin/products/${encodeURIComponent(id)}`
      : `/api/posts/${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: 'DELETE',
      credentials: BASE ? 'include' : undefined,
    });

    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    return res.json();
  };
  return { deleteProduct };
}