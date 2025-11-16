import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUser } from '../types/adminUser';
import type { AdminProduct, AdminProductQuery } from '../types/adminProduct';

// 1. CONFIGURACIÓN BASE
const API_URL = import.meta.env.VITE_API_URL;

// Helper robusto para fetch
const fetchWithAuth = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token'); 
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    // Intentar parsear JSON, si falla (ej: 204 No Content), devolver null
    const data = res.status !== 204 ? await res.json().catch(() => ({})) : null;

    if (!res.ok) {
      if (res.status === 401) console.error("⚠️ Token inválido en admin request");
      throw new Error(data?.message || data?.error || `Error ${res.status}: ${res.statusText}`);
    }

    return data as T;
  } catch (error: any) {
    // Re-lanzar el error para que React Query lo capture
    throw error;
  }
};

// ============================================================================
// 2. QUERY KEYS (Centralizados)
// ============================================================================
export const adminKeys = {
  users: {
    all: ['admin', 'users'] as const,
    list: (query: string) => [...adminKeys.users.all, 'list', { query }] as const,
  },
  products: {
    all: ['admin', 'products'] as const,
    list: (query: string, status?: string) => [...adminKeys.products.all, 'list', { query, status }] as const,
  },
  metrics: ['admin', 'metrics'] as const,
};

// ============================================================================
// 3. GESTIÓN DE MÉTRICAS
// ============================================================================
export interface AdminMetrics {
  totalUsers: number;
  totalProducts: number;
  completedTransactions: number;
  openReports: number;
  activeUsers30d: number;
  newUsersChart: { day: string; count: number }[];
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics, Error>({
    queryKey: adminKeys.metrics,
    queryFn: async () => {
      const res = await fetchWithAuth<{ metrics: AdminMetrics }>('/api/admin/metrics');
      return res.metrics;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ============================================================================
// 4. GESTIÓN DE USUARIOS
// ============================================================================

interface AdminUsersResponse {
  users: any[];
  total: number;
}

// GET Users
export function useAdminUsers(query: string) {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: adminKeys.users.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      
      const res = await fetchWithAuth<AdminUsersResponse>(`/api/admin/users?${params.toString()}`);
      
      // Mapeo robusto
      const coercedUsers = res.users.map((user: any) => ({
        ...user,
        banned: user.banned ?? (user.estadoId === 2), // Soporte híbrido
        id: String(user.id)
      })) as AdminUser[];
      
      return { ...res, users: coercedUsers };
    },
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

// POST Create User
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminUser>) => 
      fetchWithAuth('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.metrics });
    },
  });
}

// PUT Update User (Completo)
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<AdminUser> }) => 
      fetchWithAuth(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
    },
  });
}

// PATCH Ban/Unban
export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, banned }: { userId: string, banned: boolean }) => 
      fetchWithAuth(`/api/admin/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ banned }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
    },
  });
}

// PATCH Change Role (Helper para usar el PUT general o endpoint específico si existiera)
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newRole }: { id: string, newRole: string }) => {
      // Mapeo de roles a IDs para tu backend (Ajusta según tu DB)
      let rolId = 3; // Usuario
      if (newRole === 'ADMIN') rolId = 1;
      if (newRole === 'MODERATOR' || newRole === 'VENDEDOR') rolId = 2;

      // Usamos el PUT de actualización general
      return fetchWithAuth(`/api/admin/users/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ rolId }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
    },
  });
}

// DELETE User
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => 
      fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.metrics });
    },
  });
}

// ============================================================================
// 5. GESTIÓN DE PRODUCTOS
// ============================================================================

function mapPostToAdminProduct(p: any): AdminProduct {
  const priceNum = typeof p.price === 'string' ? parseFloat(p.price.replace(/[^0-9.]/g, '')) : p.price;
  return {
    id: String(p.id),
    title: p.title || p.nombre,
    author: p.author || p.vendedor?.nombre || p.vendedor?.usuario || 'Desconocido',
    price: typeof priceNum === 'number' && !Number.isNaN(priceNum) ? priceNum : undefined,
    categoryName: p.categoryName || p.categoria?.nombre,
    createdAt: p.createdAt || p.fechaAgregado,
    status: p.status || (p.visible ? 'published' : 'hidden'), // Mapeo visible -> status
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
      
      // El backend no filtra por status aún, lo haremos en cliente si es necesario
      const rawData = await fetchWithAuth<any[]>(`/api/admin/products?${params.toString()}`);
      
      const list = rawData.map(mapPostToAdminProduct);
      
      // Filtrado local por estado
      const filteredList = s ? list.filter(p => p.status === s) : list;
      
      setProducts(filteredList);

    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err?.message ?? 'Error cargando productos');
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

// PATCH Hide/Show Product
export function useHideProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}/hide`, { method: 'PATCH' }),
    onSuccess: () => {
      // Invalidar caché de productos (si usáramos react-query para el listado también)
      // Como usas estado local en useAdminProducts, deberás llamar a refetch() manualmente en el componente
    }
  });
}

// DELETE Product
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.metrics }); // Actualizar contadores
    }
  });
}