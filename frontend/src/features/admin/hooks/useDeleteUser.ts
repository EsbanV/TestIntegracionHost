// frontend/src/features/admin/hooks/useDeleteUser.ts - ACTUALIZADO

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; 
import { adminUserKeys } from './useAdminUsers'; 

const deleteUserRequest = async (userId: string) => {
  console.log('🔄 Eliminando usuario ID:', userId);
  const response = await api.delete(`/admin/users/${userId}`);
  console.log('✅ Respuesta DELETE:', response);
  // Si response es null (204 No Content), retornamos un objeto de éxito
  return response || { success: true, message: 'Usuario eliminado correctamente' };
};

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserRequest,
    onSuccess: (data, userId) => {
      console.log('🎉 Usuario eliminado exitosamente:', { userId, data });
      // Invalida la caché de la lista para forzar el refetch
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
    onError: (error: any, userId) => {
      console.error('❌ Error eliminando usuario:', { userId, error });
      const errorMessage = error.message || "Fallo la eliminación del usuario.";
      throw new Error(errorMessage);
    },
  });
}