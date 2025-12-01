import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import { forumKeys } from "./forum.keys";
import type { 
  Publication, 
  NewPublicationData, 
  Comment, 
  NewCommentData, 
  CommentsResponse 
} from "./forum.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// --- HOOKS DE LECTURA (QUERIES) ---

export const usePublications = () => {
  return useQuery<Publication[], Error>({
    queryKey: forumKeys.publications(), // ✅ Clave centralizada
    queryFn: async () => {
      const res = await fetch(`${URL_BASE}/api/publications`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error("Error al cargar publicaciones");
      const data = await res.json();
      return data.publications || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos de caché fresca
  });
};

export const useComments = (publicationId: number, page: number = 1) => {
  return useQuery<CommentsResponse, Error>({
    queryKey: forumKeys.comments(publicationId), // ✅ Clave única por post
    queryFn: async () => {
      const res = await fetch(`${URL_BASE}/api/publications/${publicationId}/comments?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Error al cargar comentarios");
      return await res.json();
    },
    enabled: !!publicationId,
  });
};

// --- HOOKS DE ESCRITURA (MUTACIONES) ---

export const useCreatePublication = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newData: NewPublicationData) => {
      if (!token) throw new Error("No autenticado");
      
      const res = await fetch(`${URL_BASE}/api/publications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al publicar");
      return data.publication;
    },
    onSuccess: () => {
      // 🚀 MAGIA DE REACT QUERY:
      // Al crear un post, invalidamos ambas listas.
      // La próxima vez que entres al Home o a "Mis Publicaciones", se recargarán solas.
      queryClient.invalidateQueries({ queryKey: forumKeys.publications() });
      queryClient.invalidateQueries({ queryKey: forumKeys.myPublications() });
    },
  });
};

export const useCreateComment = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewCommentData) => {
      if (!token) throw new Error("No autenticado");

      const res = await fetch(`${URL_BASE}/api/publications/${data.publicacionId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contenido: data.contenido,
          parentCommentId: data.parentCommentId || null
        }),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Error al comentar");
      return responseData.comentario;
    },
    onSuccess: (_, variables) => {
      // 🚀 Refrescar solo los comentarios de ESTA publicación
      queryClient.invalidateQueries({ 
        queryKey: forumKeys.comments(variables.publicacionId) 
      });
    },
  });
};