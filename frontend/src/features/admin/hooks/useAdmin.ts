// frontend/src/features/admin/hooks/useAdmin.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from '../types/adminUser';
import type { AdminProduct, AdminProductQuery } from '../types/adminProduct';
import type { Post } from '@/types/Post';

// 1. CONFIGURACIÓN BASE
const API_URL = import.meta.env.VITE_API_URL;

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token'); 
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 401) console.error("⚠️ Token inválido en admin");
    throw new Error(errorData.message || errorData.error || `Error ${res.status}`);
  }

  return res.json();
};

// ============================================================================
// 2. GESTIÓN DE USUARIOS (USERS)
// ============================================================================

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (query: string) => [...adminUserKeys.lists(), { query }] as const,
  metrics: () => ['admin', 'metrics'] as const, // Key para métricas
};

interface AdminUsersResponse {
  users: any[];
  total: number;
}

// GET /api/admin/users
const fetchUsers = async (query: string): Promise<AdminUsersResponse> => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  const queryString = params.toString();
  
  const response = await fetchWithAuth(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
  
  const coercedUsers = response.users.map((user: any) => ({
    ...user,
    // En tu backend: 2 = BANEADO, 1 = ACTIVO
    banned: user.estadoId === 3, 
    id: String(user.id)
  })) as AdminUser[];
  
  return { ...response, users: coercedUsers };
};

export function useAdminUsers(query: string) {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: adminUserKeys.list(query),
    queryFn: () => fetchUsers(query),
    staleTime: 1000 * 60 * 5, 
    retry: (failureCount, error: any) => {
        if (error.message.includes('401') || error.message.includes('403')) return false;
        return failureCount < 2;
    }
  });
}

// POST /api/admin/users (Crear Usuario)
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUserData: any) => {
      return fetchWithAuth(`/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify(newUserData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      // También invalidar métricas porque aumentó el total de usuarios
      queryClient.invalidateQueries({ queryKey: adminUserKeys.metrics() });
    },
  });
}

// PUT /api/admin/:id (Actualizar Usuario Completo)
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return fetchWithAuth(`/api/admin/${id}`, { // Ojo: tu ruta es PUT /:id directo en el router admin
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    }
  });
}

// DELETE /api/admin/users/:id
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.metrics() });
    },
  });
}

// PATCH /api/admin/users/:id/ban
export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, banned }: { userId: string, banned: boolean }) => {
      return fetchWithAuth(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ banned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

// PATCH /api/admin/users/:id/role (Nota: No vi esta ruta explícita en tu admin.js subido, 
// pero la tenías en los hooks anteriores. Si la usas, asegúrate de agregarla a admin.js 
// o usa useUpdateUser para cambiar el rolId)
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  // Adaptamos para usar la ruta genérica de actualización si no existe ruta específica
  return useMutation({
    mutationFn: async ({ id, newRole }: { id: string, newRole: string }) => {
      // Mapeo de string 'ADMIN' a ID (ej: 1) debería hacerse aquí o en el backend.
      // Asumiremos que el backend espera 'rolId' en el PUT general.
      let rolId = 3; 
      if(newRole === 'ADMIN') rolId = 1;
      if(newRole === 'MODERATOR') rolId = 2;

      return fetchWithAuth(`/api/admin/${id}`, { // Usando PUT general
        method: 'PUT',
        body: JSON.stringify({ rolId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    }
  });
}

// ============================================================================
// 3. MÉTRICAS (DASHBOARD)
// ============================================================================

// GET /api/admin/metrics
export function useAdminMetrics() {
  return useQuery({
    queryKey: adminUserKeys.metrics(),
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/metrics');
      return res.metrics; // Devolvemos el objeto 'metrics' directamente
    },
    staleTime: 1000 * 60 * 5 // 5 minutos
  });
}

// ============================================================================
// 4. GESTIÓN DE PRODUCTOS (PRODUCTS)
// ============================================================================

function mapPostToAdminProduct(p: any): AdminProduct {
  const priceNum = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : p.price;
  return {
    id: String(p.id),
    title: p.title || p.nombre,
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
      // Nota: Tu backend admin.js actual no filtra por 'status', solo por 'q'.
      // Si necesitas filtro por estado, deberás agregarlo al backend.
      
      const data = await fetchWithAuth(`/api/admin/products?${params.toString()}`);
      
      const rawList = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const list = rawList.map(mapPostToAdminProduct);
      
      // Filtrado local de estado si el backend no lo soporta aún
      const filteredList = s ? list.filter(p => p.status === s) : list;
      
      setProducts(filteredList);

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

// PATCH /api/admin/products/:id/hide
export function useHideProduct() {
  const queryClient = useQueryClient();
  // Ahora retornamos la mutación completa
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}/hide`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      // Invalidamos la lista para que se refresque sola
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); 
    }
  });
}

// DELETE /api/admin/products/:id
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }
  });
}