import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { Publication, NewPublicationData } from "./forum.types";

// Configuración
const URL_BASE = import.meta.env.VITE_API_URL;

// --- FETCHERS (Funciones puras) ---

// GET /api/publications
const fetchPublications = async (): Promise<Publication[]> => {
  const res = await fetch(`${URL_BASE}/api/publications`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' 
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al cargar publicaciones");
  }
  
  const data = await res.json();
  return data.publications || [];
};

// POST /api/publications
const createPublicationRequest = async (
  newData: NewPublicationData,
  token: string | null
): Promise<Publication> => {
  if (!token) throw new Error("No estás autenticado");
  
  const res = await fetch(`${URL_BASE}/api/publications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(newData),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    // Manejo específico de errores de validación (array de errores) o mensaje simple
    if (data.errors && Array.isArray(data.errors)) {
        throw new Error(data.errors.map((e: any) => e.msg).join(', '));
    }
    throw new Error(data.message || "Error al crear la publicación");
  }
  
  return data.publication;
};

// --- HOOKS (React Query) ---

// Hook para LEER publicaciones
export const usePublications = () => {
  return useQuery<Publication[], Error>({
    queryKey: ["publications"],
    queryFn: fetchPublications,
    retry: 1,
    staleTime: 1000 * 60 * 2, // 2 minutos de caché fresco
  });
};

// Hook para CREAR publicación
export const useCreatePublication = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewPublicationData) => createPublicationRequest(data, token),
    
    onSuccess: (newPost) => {
      // Actualización Optimista: Inyectamos el nuevo post al inicio de la lista sin recargar
      queryClient.setQueryData<Publication[]>(["publications"], (old) => {
        return old ? [newPost, ...old] : [newPost];
      });
      
      // Invalidamos para asegurar consistencia en background (eventual consistency)
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
    // El manejo de error (onError) se puede dejar al componente para mostrar alertas
  });
};