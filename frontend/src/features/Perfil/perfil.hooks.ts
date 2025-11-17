import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { UserProfile, UpdateProfileData, ReviewsData, PublicationItem, UsePublicationsFeedProps } from "./perfil.types";
import { useRef } from 'react';
import { usePostsWithFilters } from '@/features/Marketplace/home.hooks';

const URL_BASE = import.meta.env.VITE_API_URL;

// --- FETCHERS ---

// 1. Perfil Privado (Mi cuenta)
const fetchMyProfileRequest = async (token: string | null): Promise<UserProfile> => {
  if (!token) throw new Error("No token");
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Error al cargar perfil");
  const data = await res.json();
  return data.data;
};

// 2. Perfil Público (Otro usuario)
const fetchPublicProfileRequest = async (userId: number): Promise<UserProfile> => {
  const res = await fetch(`${URL_BASE}/api/users/public/${userId}`);
  if (!res.ok) throw new Error("Usuario no encontrado");
  const data = await res.json();
  return data.data; // El backend devuelve la misma estructura básica en 'data'
};

const fetchReviewsRequest = async (userId: number): Promise<ReviewsData> => {
  const res = await fetch(`${URL_BASE}/api/users/reviews/user/${userId}`);
  if (!res.ok) return { reviews: [], stats: { total: 0, promedio: "0" } };
  return await res.json();
};

const updateProfileRequest = async (data: UpdateProfileData, token: string | null) => {
  if (!token) throw new Error("No token");
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    body: formData,
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Error al subir imagen");
  return result;
};

// --- HOOK PRINCIPAL ---

export const useProfile = (profileIdParam?: string) => {
  const { token, user: sessionUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Determinar si es mi perfil o estoy viendo a otro
  // Si no hay param en URL, es mi perfil. Si hay param y coincide con mi ID, es mi perfil.
  const isOwnProfile = !profileIdParam || (sessionUser && String(sessionUser.id) === profileIdParam);
  
  // El ID efectivo a buscar
  const targetUserId = isOwnProfile ? sessionUser?.id : Number(profileIdParam);

  // Estados Locales
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    nombre: "", usuario: "", campus: "", telefono: "", direccion: "",
  });

  // 1. Cargar Perfil (Inteligente: usa endpoint privado o público según corresponda)
  const profileQuery = useQuery({
    queryKey: ["userProfile", targetUserId],
    queryFn: () => {
        if (!targetUserId) return null;
        return isOwnProfile 
            ? fetchMyProfileRequest(token) 
            : fetchPublicProfileRequest(targetUserId);
    },
    enabled: !!targetUserId,
    // Si es mi perfil, uso los datos de sesión como placeholder inicial
    initialData: isOwnProfile ? (sessionUser as any) : undefined, 
  });

  const user = profileQuery.data;

  // 2. Cargar Reseñas del usuario objetivo
  const reviewsQuery = useQuery({
    queryKey: ["reviews", targetUserId],
    queryFn: () => fetchReviewsRequest(targetUserId!),
    enabled: !!targetUserId,
  });

  // Sincronizar form cuando llega la data (solo si es editable)
  useEffect(() => {
    if (user && isOwnProfile) {
      setFormData({
        nombre: user.nombre || "",
        usuario: user.usuario || "",
        campus: user.campus || "Campus San Juan Pablo II",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
      });
    }
  }, [user, isOwnProfile]);

  // 3. Mutaciones (Solo funcionan si tienes token, el backend protege la seguridad real)
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
    isErrorProfile: profileQuery.isError,
    
    reviewData: reviewsQuery.data,
    isLoadingReviews: reviewsQuery.isLoading,
    
    // Propiedades de UI
    isOwnProfile, // Bandera clave para la UI
    isEditing, 
    setIsEditing,
    formData, 
    setFormData,
    
    // Acciones
    saveProfile: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    uploadPhoto: photoMutation.mutate,
    isUploadingPhoto: photoMutation.isPending
  };
};

// --- HOOK DE PUBLICACIONES (Sin cambios mayores, solo reexportar) ---
export const usePublicationsFeed = ({ 
  searchTerm = '', 
  selectedCategoryId = '', 
  authorId,
  onlyMine = true 
}: UsePublicationsFeedProps) => {
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useRef<HTMLDivElement | null>(null);

  const {
    posts,
    hasResults,
    totalResults,
    fetchNextPage,
    hasNextPage,
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

  const items: PublicationItem[] = posts.map((post: any) => ({
      id: post.id,
      title: post.nombre,
      image: post.imagenes?.[0]?.url,
      price: parseFloat(String(post.precioActual)),
      author: post.vendedor?.usuario,
      avatar: post.vendedor?.fotoPerfilUrl,
      description: post.descripcion,
      timeAgo: post.fechaAgregado,
      categoryName: post.categoria,
      rating: post.vendedor?.reputacion ?? 0,
      sales: post.vendedor?.stats?.ventas ?? 0
  }));

  return {
      items, isLoading, isError, error, hasResults, hasNextPage, isFetchingNextPage, totalResults, lastPostElementRef
  };
};