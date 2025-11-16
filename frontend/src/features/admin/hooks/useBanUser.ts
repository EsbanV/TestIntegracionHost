// frontend/src/features/admin/hooks/useBanUser.ts - VERSIÓN CORREGIDA
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserKeys } from './useAdminUsers'; 
import { api } from '@/lib/api';

interface BanRequest {
    userId: string;
    banned: boolean;
}

const toggleBanRequest = async ({ userId, banned }: BanRequest) => {
    console.log(`🔄 Enviando ban request: userId=${userId}, banned=${banned}`);
    const response = await api.patch(`/admin/users/${userId}/ban`, { banned });
    console.log('✅ Respuesta del servidor:', response);
    return response;
};

export function useBanUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleBanRequest,
        
        onMutate: async (variables: BanRequest) => {
            console.log('🎯 Iniciando optimistic update para:', variables);
            
            // CANCELAR TODAS LAS QUERIES RELACIONADAS, no solo lists()
            await queryClient.cancelQueries({ queryKey: adminUserKeys.all });
            
            // BUSCAR EN TODAS LAS QUERIES EXISTENTES
            const queryCache = queryClient.getQueryCache();
            const allUserQueries = queryCache.findAll(adminUserKeys.all);
            
            console.log('🔍 Queries encontradas:', allUserQueries.map(q => q.queryKey));
            
            let foundData = false;
            
            // Intentar optimistic update en todas las queries de usuarios
            allUserQueries.forEach(query => {
                const oldData = query.state.data;
                console.log(`📊 Datos en caché para query ${JSON.stringify(query.queryKey)}:`, oldData);
                
                if (oldData && oldData.users && Array.isArray(oldData.users)) {
                    foundData = true;
                    
                    queryClient.setQueryData(
                        query.queryKey,
                        (oldData: any) => {
                            const updatedUsers = oldData.users.map((user: any) => 
                                user.id.toString() === variables.userId 
                                    ? { ...user, banned: variables.banned }
                                    : user
                            );
                            
                            console.log('✅ Optimistic update aplicado:', {
                                userId: variables.userId,
                                banned: variables.banned,
                                usuariosActualizados: updatedUsers.length,
                                queryKey: query.queryKey
                            });
                            
                            return {
                                ...oldData,
                                users: updatedUsers
                            };
                        }
                    );
                }
            });
            
            if (!foundData) {
                console.log('⚠️ No se encontraron datos en caché para optimistic update');
            }
            
            return { previousQueries: allUserQueries.map(q => ({ queryKey: q.queryKey, data: q.state.data })) };
        },
        
        onError: (err, variables, context: any) => {
            console.error('❌ Error en ban/unban:', err);
            
            // REVERTIR TODAS LAS QUERIES
            if (context?.previousQueries) {
                context.previousQueries.forEach(({ queryKey, data }: any) => {
                    if (data) {
                        queryClient.setQueryData(queryKey, data);
                    }
                });
                console.log('🔄 Estado revertido por error en todas las queries');
            }
        },
        
        onSuccess: (data, variables) => {
            console.log('✅ Ban/unban exitoso, actualizando caché específica');
            
            // Actualizar específicamente el usuario en todas las queries
            const queryCache = queryClient.getQueryCache();
            const allUserQueries = queryCache.findAll(adminUserKeys.all);
            
            allUserQueries.forEach(query => {
                const oldData = query.state.data;
                if (oldData && oldData.users && Array.isArray(oldData.users)) {
                    queryClient.setQueryData(
                        query.queryKey,
                        (oldData: any) => {
                            const updatedUsers = oldData.users.map((user: any) => 
                                user.id.toString() === variables.userId 
                                    ? { ...user, banned: variables.banned }
                                    : user
                            );
                            
                            return {
                                ...oldData,
                                users: updatedUsers
                            };
                        }
                    );
                }
            });
        },
        
        onSettled: () => {
            console.log('🔄 Invalidando queries para asegurar consistencia');
            // Invalidar después de un breve delay para evitar race conditions
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
            }, 300);
        }
    });
}