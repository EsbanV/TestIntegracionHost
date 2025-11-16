// frontend/src/features/admin/hooks/useAdminUsers.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUser } from '../types/adminUser';

// Definimos el "query key"
export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (query: string) => [...adminUserKeys.lists(), { query }] as const,
};

// Interface para la respuesta completa de la API
interface AdminUsersResponse {
  users: any[]; // Usamos 'any' para recibir la estructura cruda antes de la coerción
  total: number;
}

// Definimos la función de fetching
const fetchUsers = async (query: string): Promise<AdminUsersResponse> => {
  const params = new URLSearchParams();
  if (query) {
    params.append('q', query);
  }
  const queryString = params.toString();
  const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get<AdminUsersResponse>(url);
  
  // --- CORRECCIÓN CRÍTICA: Mapeo y Coerción de Banned ---
  // Recorremos el array de usuarios para forzar la propiedad 'banned' a ser un booleano.
  const coercedUsers = response.users.map((user: any) => ({
      ...user,
      // Boolean() convierte el valor de la API (string o número) a booleano nativo.
      banned: Boolean(user.banned), 
      // Nos aseguramos que el ID sea string, si las mutaciones lo esperan
      id: String(user.id)
  })) as AdminUser[];
  
  // Devolvemos el objeto de respuesta COMPLETO con los datos coercios
  return {
    ...response,
    users: coercedUsers
  };
};

// Creamos el hook
export function useAdminUsers(query: string) {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: adminUserKeys.list(query),
    queryFn: () => fetchUsers(query),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}