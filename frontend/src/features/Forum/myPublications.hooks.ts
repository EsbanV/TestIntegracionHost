import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import { forumKeys } from "./forum.keys"; // ✅ Usamos las keys centralizadas
import type { Publication, UpdatePublicationData } from "./myPublications.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// ============================================================================
// 1. FETCHERS (Peticiones HTTP puras)
// ============================================================================

const fetchMyPublicationsRequest = async (token: string | null, userId: number | undefined): Promise<Publication[]> => {
  if (!token || !userId) return [];

  // Obtenemos todas y filtramos en cliente (según lógica original)
  const res = await fetch(`${URL_BASE}/api/publications?limit=100`, {
    headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
    },
  });

  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al cargar publicaciones");
  }
  
  const data = await res.json();
  const allPubs: Publication[] = data.publications || [];
  
  // Filtramos solo las del usuario actual
  return allPubs.filter(p => p.usuario.id === userId);
};

const deletePublicationRequest = async (id: number, token: string | null) => {
  if (!token) throw new Error("No autorizado");
  
  const res = await fetch(`${URL_BASE}/api/publications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al eliminar");
  }
  return await res.json();
};

const updatePublicationRequest = async (data: UpdatePublicationData, token: string | null) => {
  if (!token) throw new Error("No autorizado");
  
  const res = await fetch(`${URL_BASE}/api/publications/${data.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ titulo: data.titulo, cuerpo: data.cuerpo }),
  });
  
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al actualizar");
  }
  return await res.json();
};

// ============================================================================
// 2. HOOK PRINCIPAL
// ============================================================================

export const useMyPublications = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  // A. LECTURA (Query)
  const publicationsQuery = useQuery({
    queryKey: forumKeys.myPublications(), // ✅ Key única para caché
    queryFn: () => fetchMyPublicationsRequest(token, user?.id),
    enabled: !!user && !!token,
    staleTime: 1000 * 60 * 2, // 2 minutos de frescura
  });

  // B. BORRADO (Mutation)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePublicationRequest(id, token),
    onSuccess: () => {
      // 🚀 Invalidamos para forzar recarga automática
      queryClient.invalidateQueries({ queryKey: forumKeys.myPublications() });
      queryClient.invalidateQueries({ queryKey: forumKeys.publications() }); // También el feed global
    },
  });

  // C. ACTUALIZACIÓN (Mutation)
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePublicationData) => updatePublicationRequest(data, token),
    onSuccess: () => {
      // 🚀 Invalidamos para ver cambios reflejados al instante
      queryClient.invalidateQueries({ queryKey: forumKeys.myPublications() });
      queryClient.invalidateQueries({ queryKey: forumKeys.publications() });
    },
  });

  return {
    // Datos
    publications: publicationsQuery.data || [],
    isLoading: publicationsQuery.isLoading,
    isError: publicationsQuery.isError,
    error: publicationsQuery.error,
    
    // Acciones
    deletePublication: deleteMutation.mutate,
    updatePublication: updateMutation.mutate,
    
    // Estados de carga de acciones
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending
  };
};