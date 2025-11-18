// src/features/forum/hooks/forum.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { 
  Publication, 
  NewPublicationData, 
  Comment, 
  NewCommentData, 
  CommentsResponse 
} from "./forum.types";

// Configuración
const URL_BASE = import.meta.env.VITE_API_URL;

// --- FETCHERS ---

const fetchPublications = async (): Promise<Publication[]> => {
  const res = await fetch(`${URL_BASE}/api/publications`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' 
  });
  
  if (!res.ok) throw new Error("Error al cargar publicaciones");
  const data = await res.json();
  return data.publications || [];
};

// Nuevo: Fetch de Comentarios por Publicación
const fetchComments = async (publicationId: number, page = 1): Promise<CommentsResponse> => {
  const res = await fetch(`${URL_BASE}/api/publications/${publicationId}/comments?page=${page}&limit=10`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!res.ok) throw new Error("Error al cargar comentarios");
  return await res.json();
};

// Nuevo: Crear Comentario o Respuesta
const createCommentRequest = async (
  data: NewCommentData, 
  token: string | null
): Promise<Comment> => {
  if (!token) throw new Error("No estás autenticado");

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
  
  if (!res.ok) {
    throw new Error(responseData.message || "Error al publicar comentario");
  }

  return responseData.comentario;
};

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
    if (data.errors && Array.isArray(data.errors)) {
        throw new Error(data.errors.map((e: any) => e.msg).join(', '));
    }
    throw new Error(data.message || "Error al crear la publicación");
  }
  return data.publication;
};

// --- HOOKS ---

export const usePublications = () => {
  return useQuery<Publication[], Error>({
    queryKey: ["publications"],
    queryFn: fetchPublications,
    retry: 1,
    staleTime: 1000 * 60 * 2, 
  });
};

export const useCreatePublication = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewPublicationData) => createPublicationRequest(data, token),
    onSuccess: (newPost) => {
      queryClient.setQueryData<Publication[]>(["publications"], (old) => {
        return old ? [newPost, ...old] : [newPost];
      });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });
};

// --- NUEVOS HOOKS PARA COMENTARIOS ---

// Hook para leer comentarios de una publicación específica
export const useComments = (publicationId: number, page: number = 1) => {
  return useQuery<CommentsResponse, Error>({
    queryKey: ["comments", publicationId, page], // Clave compuesta única por post y página
    queryFn: () => fetchComments(publicationId, page),
    enabled: !!publicationId, // Solo se ejecuta si hay un ID válido
    staleTime: 1000 * 30, // 30 segundos de caché
  });
};

// Hook para crear comentario o responder
export const useCreateComment = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewCommentData) => createCommentRequest(data, token),
    
    onSuccess: (newComment, variables) => {
      // Invalidamos la query específica de comentarios de ESTA publicación
      // Esto forzará una recarga para ver el nuevo comentario ordenado correctamente
      queryClient.invalidateQueries({ 
        queryKey: ["comments", variables.publicacionId] 
      });
      
      // Opcional: Podrías invalidar también "publications" si quisieras actualizar 
      // un contador global de comentarios en el feed principal.
    },
  });
};