import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { Publication, UpdatePublicationData } from "./myPublications.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// --- FETCHERS (Lógica Pura) ---

const fetchMyPublicationsRequest = async (token: string | null, userId: number | undefined): Promise<Publication[]> => {
  if (!token || !userId) return [];

  // NOTA: Idealmente el backend debería filtrar por ?userId=X o /my-publications
  const res = await fetch(`${URL_BASE}/api/publications?limit=100`, {
    headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
    },
    credentials: 'include'
  });

  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al cargar publicaciones");
  }
  
  const data = await res.json();
  const allPubs: Publication[] = data.publications || [];
  
  // Filtramos en cliente por seguridad visual
  return allPubs.filter(p => p.usuario.id === userId);
};

const deletePublicationRequest = async (id: number, token: string | null) => {
  if (!token) throw new Error("No autorizado");
  
  const res = await fetch(`${URL_BASE}/api/publications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
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
    credentials: 'include',
    body: JSON.stringify({ titulo: data.titulo, cuerpo: data.cuerpo }),
  });
  
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al actualizar");
  }
  return await res.json();
};

// --- HOOKS (React Query) ---

export const useMyPublications = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  // 1. Lectura
  const publicationsQuery = useQuery({
    queryKey: ["my-publications", user?.id],
    queryFn: () => fetchMyPublicationsRequest(token, user?.id),
    enabled: !!user && !!token,
    retry: 1
  });

  // 2. Borrado
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePublicationRequest(id, token),
    onSuccess: (_, id) => {
      // Optimistic Update: Quitar de la lista local inmediatamente
      queryClient.setQueryData(["my-publications", user?.id], (old: Publication[] | undefined) => 
         old ? old.filter(p => p.id !== id) : []
      );
      // Refrescar foro global también
      queryClient.invalidateQueries({ queryKey: ["publications"] }); 
    },
  });

  // 3. Actualización
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePublicationData) => updatePublicationRequest(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-publications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });

  return {
    publications: publicationsQuery.data || [],
    isLoading: publicationsQuery.isLoading,
    isError: publicationsQuery.isError,
    error: publicationsQuery.error,
    deletePublication: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    updatePublication: updateMutation.mutate,
    isUpdating: updateMutation.isPending
  };
};