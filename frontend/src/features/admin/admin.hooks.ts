// admin.hooks.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext'; // ajusta según tu proyecto
import type {
  AdminMetricsResponse,
  AdminDailyMetricsResponse,
  AdminLookupsResponse,
  AdminUsersFilters,
  AdminUserListResponse,
  AdminUserDetail,
  AdminUserActivityResponse,
  AdminUserProductsResponse,
  AdminUserTransactionsResponse,
  AdminCreateUserPayload,
  AdminCreateUserResponse,
  AdminUpdateUserPayload,
  AdminBanUserPayload,
  AdminSimpleSuccessResponse,
  AdminProductsFilters,
  AdminProductsListResponse,
  AdminProductDetail,
  AdminToggleProductVisibilityResponse,
  AdminUpdateProductStatusPayload,
  AdminUpdateProductStatusResponse,
  AdminCategoriesListResponse,
  AdminCreateCategoryPayload,
  AdminUpdateCategoryPayload,
  AdminCategoryMutationResponse,
  AdminReportsFilters,
  AdminReportsListResponse,
  AdminReportDetail,
  AdminUpdateReportStatusPayload,
  AdminUpdateReportStatusResponse,
  AdminTransactionsFilters,
  AdminTransactionsListResponse,
  AdminTransactionDetail,
  AdminUpdateTransactionStatusPayload,
  AdminUpdateTransactionStatusResponse,
  AdminPostsFilters,
  AdminPostsListResponse,
  AdminPostDetail,
  AdminCommentsFilters,
  AdminCommentsListResponse,
  AdminCommunityMessagesResponse,
} from './admin.types';

// Base de las rutas del router de admin
const ADMIN_BASE_URL = '/api/admin';
const URL_BASE = import.meta.env.VITE_API_URL;

// ==========================
// Helpers
// ==========================

async function fetchWithAuth<T>(url: string, token: string | null, options: RequestInit = {}): Promise<T> {
  if (!token) throw new Error("No autenticado");
  
  const res = await fetch(`${URL_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error en la petición");
  return data;
}

const buildQueryString = (params: Record<string, any>): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });

  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const adminKeys = {
  metrics: () => ['admin', 'metrics'] as const,
  dailyMetrics: (days?: number) => ['admin', 'metrics', 'daily', { days }] as const,
  lookups: () => ['admin', 'lookups'] as const,

  users: (filters?: AdminUsersFilters) => ['admin', 'users', filters || {}] as const,
  user: (id: number) => ['admin', 'users', id] as const,
  userActivity: (id: number, params?: { page?: number; pageSize?: number }) =>
    ['admin', 'users', id, 'activity', params || {}] as const,
  userProducts: (id: number, params?: { page?: number; pageSize?: number }) =>
    ['admin', 'users', id, 'products', params || {}] as const,
  userTransactions: (id: number, params?: { page?: number; pageSize?: number }) =>
    ['admin', 'users', id, 'transactions', params || {}] as const,

  products: (filters?: AdminProductsFilters) => ['admin', 'products', filters || {}] as const,
  product: (id: number) => ['admin', 'products', id] as const,

  categories: () => ['admin', 'categories'] as const,

  reports: (filters?: AdminReportsFilters) => ['admin', 'reports', filters || {}] as const,
  report: (id: number) => ['admin', 'reports', id] as const,

  transactions: (filters?: AdminTransactionsFilters) =>
    ['admin', 'transactions', filters || {}] as const,
  transaction: (id: number) => ['admin', 'transactions', id] as const,

  posts: (filters?: AdminPostsFilters) => ['admin', 'posts', filters || {}] as const,
  post: (id: number) => ['admin', 'posts', id] as const,

  comments: (filters?: AdminCommentsFilters) => ['admin', 'comments', filters || {}] as const,

  communityMessages: (params?: { page?: number; pageSize?: number }) =>
    ['admin', 'community-messages', params || {}] as const,
};

// ==========================
// 📊 MÉTRICAS
// ==========================

export const useAdminMetrics = () => {
  const { token } = useAuth();

  return useQuery<AdminMetricsResponse>({
    queryKey: adminKeys.metrics(),
    queryFn: () =>
      fetchWithAuth<AdminMetricsResponse>(`${ADMIN_BASE_URL}/metrics`, token),
    enabled: !!token,
  });
};

export const useAdminDailyMetrics = (days?: number) => {
  const { token } = useAuth();

  return useQuery<AdminDailyMetricsResponse>({
    queryKey: adminKeys.dailyMetrics(days),
    queryFn: () =>
      fetchWithAuth<AdminDailyMetricsResponse>(
        `${ADMIN_BASE_URL}/metrics/daily${buildQueryString({ days })}`,
        token,
      ),
    enabled: !!token,
  });
};

export const useAdminLookups = () => {
  const { token } = useAuth();

  return useQuery<AdminLookupsResponse>({
    queryKey: adminKeys.lookups(),
    queryFn: () =>
      fetchWithAuth<AdminLookupsResponse>(`${ADMIN_BASE_URL}/lookups`, token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};

// ==========================
// 👥 USUARIOS
// ==========================

export const useAdminUsers = (filters: AdminUsersFilters = {}) => {
  const { token } = useAuth();

  return useQuery<AdminUserListResponse>({
    queryKey: adminKeys.users(filters),
    queryFn: () =>
      fetchWithAuth<AdminUserListResponse>(
        `${ADMIN_BASE_URL}/users${buildQueryString(filters)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminUser = (id: number | null) => {
  const { token } = useAuth();

  return useQuery<AdminUserDetail>({
    queryKey: id ? adminKeys.user(id) : ['admin', 'users', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminUserDetail>(`${ADMIN_BASE_URL}/users/${id}`, token),
    enabled: !!token && !!id,
  });
};

export const useAdminUserActivity = (
  id: number | null,
  params: { page?: number; pageSize?: number } = {},
) => {
  const { token } = useAuth();

  return useQuery<AdminUserActivityResponse>({
    queryKey: id ? adminKeys.userActivity(id, params) : ['admin', 'users', 'activity', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminUserActivityResponse>(
        `${ADMIN_BASE_URL}/users/${id}/activity${buildQueryString(params)}`,
        token,
      ),
    enabled: !!token && !!id,
    keepPreviousData: true,
  });
};

export const useAdminUserProducts = (
  id: number | null,
  params: { page?: number; pageSize?: number } = {},
) => {
  const { token } = useAuth();

  return useQuery<AdminUserProductsResponse>({
    queryKey: id ? adminKeys.userProducts(id, params) : ['admin', 'users', 'products', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminUserProductsResponse>(
        `${ADMIN_BASE_URL}/users/${id}/products${buildQueryString(params)}`,
        token,
      ),
    enabled: !!token && !!id,
    keepPreviousData: true,
  });
};

export const useAdminUserTransactions = (
  id: number | null,
  params: { page?: number; pageSize?: number } = {},
) => {
  const { token } = useAuth();

  return useQuery<AdminUserTransactionsResponse>({
    queryKey: id
      ? adminKeys.userTransactions(id, params)
      : ['admin', 'users', 'transactions', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminUserTransactionsResponse>(
        `${ADMIN_BASE_URL}/users/${id}/transactions${buildQueryString(params)}`,
        token,
      ),
    enabled: !!token && !!id,
  });
};

// Mutaciones de usuario

export const useAdminCreateUser = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminCreateUserResponse, Error, AdminCreateUserPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminCreateUserResponse>(`${ADMIN_BASE_URL}/users`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useAdminUpdateUser = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, AdminUpdateUserPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/users/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(id) });
    },
  });
};

export const useAdminBanUser = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, AdminBanUserPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/users/${id}/ban`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(id) });
    },
  });
};

export const useAdminDeleteUser = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/users/${id}`,
        token,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// ==========================
// 📦 PRODUCTOS
// ==========================

export const useAdminProducts = (filters: AdminProductsFilters = {}) => {
  const { token } = useAuth();

  return useQuery<AdminProductsListResponse>({
    queryKey: adminKeys.products(filters),
    queryFn: () =>
      fetchWithAuth<AdminProductsListResponse>(
        `${ADMIN_BASE_URL}/products${buildQueryString(filters)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminProduct = (id: number | null) => {
  const { token } = useAuth();

  return useQuery<AdminProductDetail>({
    queryKey: id ? adminKeys.product(id) : ['admin', 'products', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminProductDetail>(
        `${ADMIN_BASE_URL}/products/${id}`,
        token,
      ),
    enabled: !!token && !!id,
  });
};

export const useAdminToggleProductVisibility = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminToggleProductVisibilityResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminToggleProductVisibilityResponse>(
        `${ADMIN_BASE_URL}/products/${id}/hide`,
        token,
        { method: 'PATCH' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.product(id) });
    },
  });
};

export const useAdminUpdateProductStatus = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminUpdateProductStatusResponse, Error, AdminUpdateProductStatusPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminUpdateProductStatusResponse>(
        `${ADMIN_BASE_URL}/products/${id}/status`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.product(id) });
    },
  });
};

export const useAdminDeleteProduct = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/products/${id}`,
        token,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
};

// ==========================
// 🧩 CATEGORÍAS
// ==========================

export const useAdminCategories = () => {
  const { token } = useAuth();

  return useQuery<AdminCategoriesListResponse>({
    queryKey: adminKeys.categories(),
    queryFn: () =>
      fetchWithAuth<AdminCategoriesListResponse>(
        `${ADMIN_BASE_URL}/categories`,
        token,
      ),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAdminCreateCategory = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminCategoryMutationResponse, Error, AdminCreateCategoryPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminCategoryMutationResponse>(
        `${ADMIN_BASE_URL}/categories`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
};

export const useAdminUpdateCategory = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminCategoryMutationResponse, Error, AdminUpdateCategoryPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminCategoryMutationResponse>(
        `${ADMIN_BASE_URL}/categories/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
};

export const useAdminDeleteCategory = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/categories/${id}`,
        token,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
  });
};

// ==========================
// 🚨 REPORTES
// ==========================

export const useAdminReports = (filters: AdminReportsFilters = {}) => {
  const { token } = useAuth();

  return useQuery<AdminReportsListResponse>({
    queryKey: adminKeys.reports(filters),
    queryFn: () =>
      fetchWithAuth<AdminReportsListResponse>(
        `${ADMIN_BASE_URL}/reports${buildQueryString(filters)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminReport = (id: number | null) => {
  const { token } = useAuth();

  return useQuery<AdminReportDetail>({
    queryKey: id ? adminKeys.report(id) : ['admin', 'reports', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminReportDetail>(
        `${ADMIN_BASE_URL}/reports/${id}`,
        token,
      ),
    enabled: !!token && !!id,
  });
};

export const useAdminUpdateReportStatus = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminUpdateReportStatusResponse, Error, AdminUpdateReportStatusPayload>({
    mutationFn: (payload) =>
      fetchWithAuth<AdminUpdateReportStatusResponse>(
        `${ADMIN_BASE_URL}/reports/${id}/status`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.report(id) });
    },
  });
};

// ==========================
// 💸 TRANSACCIONES
// ==========================

export const useAdminTransactions = (filters: AdminTransactionsFilters = {}) => {
  const { token } = useAuth();

  return useQuery<AdminTransactionsListResponse>({
    queryKey: adminKeys.transactions(filters),
    queryFn: () =>
      fetchWithAuth<AdminTransactionsListResponse>(
        `${ADMIN_BASE_URL}/transactions${buildQueryString(filters)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminTransaction = (id: number | null) => {
  const { token } = useAuth();

  return useQuery<AdminTransactionDetail>({
    queryKey: id ? adminKeys.transaction(id) : ['admin', 'transactions', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminTransactionDetail>(
        `${ADMIN_BASE_URL}/transactions/${id}`,
        token,
      ),
    enabled: !!token && !!id,
  });
};

export const useAdminUpdateTransactionStatus = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    AdminUpdateTransactionStatusResponse,
    Error,
    AdminUpdateTransactionStatusPayload
  >({
    mutationFn: (payload) =>
      fetchWithAuth<AdminUpdateTransactionStatusResponse>(
        `${ADMIN_BASE_URL}/transactions/${id}/status`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.transaction(id) });
    },
  });
};

// ==========================
// 📝 POSTS & COMENTARIOS
// ==========================

export const useAdminPosts = (filters: AdminPostsFilters = {}) => {
  const { token } = useAuth();

  return useQuery<AdminPostsListResponse>({
    queryKey: adminKeys.posts(filters),
    queryFn: () =>
      fetchWithAuth<AdminPostsListResponse>(
        `${ADMIN_BASE_URL}/posts${buildQueryString(filters)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminPost = (id: number | null) => {
  const { token } = useAuth();

  return useQuery<AdminPostDetail>({
    queryKey: id ? adminKeys.post(id) : ['admin', 'posts', 'null'],
    queryFn: () =>
      fetchWithAuth<AdminPostDetail>(`${ADMIN_BASE_URL}/posts/${id}`, token),
    enabled: !!token && !!id,
  });
};

export const useAdminDeletePost = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/posts/${id}`,
        token,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });
};

export const useAdminComments = (filters: AdminCommentsFilters = {}) => {
  const { token } = useAuth();

  return useQuery<AdminCommentsListResponse>({
    queryKey: adminKeys.comments(filters),
    queryFn: () =>
      fetchWithAuth<AdminCommentsListResponse>(
        `${ADMIN_BASE_URL}/comments${buildQueryString(filters)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminDeleteComment = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/comments/${id}`,
        token,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });
};

// ==========================
// 💬 COMUNIDAD
// ==========================

export const useAdminCommunityMessages = (params: { page?: number; pageSize?: number } = {}) => {
  const { token } = useAuth();

  return useQuery<AdminCommunityMessagesResponse>({
    queryKey: adminKeys.communityMessages(params),
    queryFn: () =>
      fetchWithAuth<AdminCommunityMessagesResponse>(
        `${ADMIN_BASE_URL}/community/messages${buildQueryString(params)}`,
        token,
      ),
    enabled: !!token,
    keepPreviousData: true,
  });
};

export const useAdminDeleteCommunityMessage = (id: number) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AdminSimpleSuccessResponse, Error, void>({
    mutationFn: () =>
      fetchWithAuth<AdminSimpleSuccessResponse>(
        `${ADMIN_BASE_URL}/community/messages/${id}`,
        token,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community-messages'] });
    },
  });
};
