import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { UserProfile, Review, UpdateProfileData, ReviewsData, PublicationItem, UsePublicationsFeedProps } from "./perfil.types";

// Importamos el hook base de Marketplace (Ajusta la ruta si es necesario)
import { usePostsWithFilters } from '@/features/Marketplace/home.hooks';

const URL_BASE = import.meta.env.VITE_API_URL;

// --- FETCHERS (Lógica de Perfil) ---

const fetchProfileRequest = async (token: string | null): Promise<UserProfile> => {
  if (!token) throw new Error("No token");
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    credentials: 'include'
  });
  if (!res.ok) throw new Error("Error al cargar perfil");
  const data = await res.json();
  return data.data;
};

const fetchMyReviewsRequest = async (userId: number): Promise<ReviewsData> => {
  const res = await fetch(`${URL_BASE}/api/users/reviews/user/${userId}`);
  if (!res.ok) return { reviews: [], stats: { total: 0, promedio: "0" } };
  return await res.json();
};

const updateProfileRequest = async (data: UpdateProfileData, token: string | null) => {
  if (!token) throw new Error("No token");
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Error al actualizar");
  return result.user;
};

const uploadProfilePhotoRequest = async (file: File, token: string | null) => {
  if (!token) throw new Error("No token");
  
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${URL_BASE}/api/upload/profile-photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  });
  
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Error al subir imagen");
  return result;
};

// --- HOOK PRINCIPAL DEL PERFIL ---

export const useProfile = () => {
  const { token, user: contextUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    nombre: "", usuario: "", campus: "", telefono: "", direccion: "",
  });

  // 1. Cargar Perfil
  const profileQuery = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => fetchProfileRequest(token),
    enabled: !!token,
    initialData: contextUser as any,
  });

  const user = profileQuery.data;

  // 2. Cargar Reseñas
  const reviewsQuery = useQuery({
    queryKey: ["myReviews", user?.id],
    queryFn: () => fetchMyReviewsRequest(user!.id),
    enabled: !!user?.id,
  });

  // Sincronizar form
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        usuario: user.usuario || "",
        campus: user.campus || "Campus San Juan Pablo II",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
      });
    }
  }, [user]);

  // 3. Mutaciones
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfileRequest(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setIsEditing(false);
    },
    onError: (err) => alert(err.message),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePhotoRequest(file, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
    onError: (err) => alert(err.message),
  });

  return {
    user,
    isLoadingProfile: profileQuery.isLoading,
    reviewData: reviewsQuery.data,
    isLoadingReviews: reviewsQuery.isLoading,
    isEditing, setIsEditing,
    formData, setFormData,
    saveProfile: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    uploadPhoto: photoMutation.mutate,
    isUploadingPhoto: photoMutation.isPending
  };
};

// --- HOOK DEL FEED DE PUBLICACIONES (Corregido) ---

export const usePublicationsFeed = ({ 
  searchTerm = '', 
  selectedCategoryId = '', 
  authorId,
  onlyMine = true 
}: UsePublicationsFeedProps) => {
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useRef<HTMLDivElement | null>(null);

  // 1. Llamamos al hook base
  const {
    posts, // <--- Este es el array de posts
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = usePostsWithFilters({
    searchTerm: searchTerm.trim(),
    categoryId: selectedCategoryId,
    authorId, 
    onlyMine
  } as any);

  // 2. 🔥 CORRECCIÓN: Creamos las variables que faltaban
  const hasResults = posts.length > 0;
  const totalResults = posts.length;

  // 3. Lógica de Scroll Infinito (Sin cambios)
  useEffect(() => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5, rootMargin: '200px' }
    );
    
    if (lastPostElementRef.current) observer.current.observe(lastPostElementRef.current);
    
    return () => observer.current?.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, posts.length]);

  // 4. Mapeo de datos (Sin cambios)
  const items: PublicationItem[] = posts.map((post: any) => ({
      id: post.id,
      title: post.nombre, // Mapeamos 'nombre' a 'title'
      image: post.imagenes?.[0]?.url,
      price: parseFloat(String(post.precioActual)),
      author: post.vendedor?.usuario, // Usamos 'usuario'
      avatar: post.vendedor?.fotoPerfilUrl,
      description: post.descripcion,
      timeAgo: post.fechaAgregado,
      categoryName: post.categoria,
      rating: post.vendedor?.reputacion ?? 0,
      sales: post.vendedor?.stats?.ventas ?? 0
  }));

  // 5. Retornamos el objeto completo (Ahora sí incluye hasResults y totalResults)
  return {
      items,
      isLoading,
      isError,
      error,
      hasResults,
      hasNextPage,
      isFetchingNextPage,
      totalResults,
      lastPostElementRef
  };
};