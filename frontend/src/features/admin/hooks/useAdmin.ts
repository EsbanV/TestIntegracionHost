// frontend/src/features/admin/hooks/useAdmin.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from '../types/adminUser';
import type { AdminProduct, AdminProductQuery } from '../types/adminProduct';
import type { Post } from '@/types/Post';

// 1. DEFINICIÓN ROBUSTA DE LA URL BASE
// Si VITE_API_URL no está definida, usará una cadena vacía (lo que causaría error en prod), 
// pero asumo que ya la tienes configurada en tu .env
const API_URL = import.meta.env.VITE_API_URL;

// Helper para fetch con Auth
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken'); // O como guardes tu token
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
};

// ============================================================================
// 1. GESTIÓN DE USUARIOS (ADMIN USERS)
// ============================================================================

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
  
  // ✅ Ruta completa: API_URL + /api/admin/users...
  const response = await fetchWithAuth(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
  
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
    staleTime: 1000 * 60 * 5, 
  });
}

// --- Mutaciones de Usuarios ---

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, banned }: { userId: string, banned: boolean }) => {
      return fetchWithAuth(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ banned }),
      });
    },
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

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newRole }: { id: string, newRole: string }) => {
      return fetchWithAuth(`/api/admin/users/${encodeURIComponent(id)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    }
  });
}


// ============================================================================
// 2. GESTIÓN DE PRODUCTOS (ADMIN PRODUCTS)
// ============================================================================

function mapPostToAdminProduct(p: any): AdminProduct {
  const priceNum = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : p.price;
  return {
    id: String(p.id),
    title: p.title || p.nombre, // Ajuste para compatibilidad con tu API
    author: p.author || p.vendedor?.nombre || 'Desconocido',
    price: typeof priceNum === 'number' && !Number.isNaN(priceNum) ? priceNum : undefined,
    categoryName: p.categoryName || p.categoria?.nombre,
    createdAt: p.createdAt || p.fechaAgregado,
    status: p.status || (p.visible ? 'published' : 'hidden'),
  };
}

export function useAdminProducts(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<AdminProduct['status'] | undefined>(undefined);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (opts?: Partial<AdminProductQuery>) => {
    setLoading(true);
    setError(null);
    try {
      const q = opts?.q ?? query;
      const s = opts?.status ?? status;
      
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (s) params.append('status', s);
      
      // ✅ Ruta completa: API_URL + /api/admin/products...
      const data = await fetchWithAuth(`/api/admin/products?${params.toString()}`);
      
      // Manejo robusto de la respuesta (array directo o envuelto)
      const rawList = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      
      // Mapear a la estructura AdminProduct
      const list = rawList.map(mapPostToAdminProduct);
      setProducts(list);

    } catch (err: any) {
      console.error("Error fetching products:", err);
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
    return fetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}/hide`, {
      method: 'PATCH'
    });
  };
  return { hideProduct };
}

export function useDeleteProduct() {
  const deleteProduct = async (id: string) => {
    return fetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  };
  return { deleteProduct };
}