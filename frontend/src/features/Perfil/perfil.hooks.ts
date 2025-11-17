import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import { usePostsWithFilters } from '@/features/Marketplace/home.hooks';
import type { 
  UserProfile, 
  UpdateProfileData, 
  ReviewsData, 
  ProfileApiResponse,
  PublicationItem,
  UsePublicationsFeedProps
} from "./perfil.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// --- FETCHERS ---

// 1. Perfil Privado (Mi cuenta)
const fetchMyProfileRequest = async (token: string | null): Promise<UserProfile> => {
  if (!token) throw new Error("No token");
  
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data: ProfileApiResponse = await res.json();
  
  if (!res.ok || !data.success) {
    throw new Error("Error al cargar perfil");
  }

  // Normalizar datos: Convertir 'resumen' a 'stats' para la UI
  const { resumen, ...userData } = data.data;
  return {
    ...userData,
    stats: {
      ventas: resumen?.totalVentas || 0,
      publicaciones: resumen?.totalProductos || 0,
      compras: resumen?.totalCompras || 0
    }
  };
};

// 2. Perfil Público (Otro usuario)
const fetchPublicProfileRequest = async (userId: number): Promise<UserProfile> => {
  const res = await fetch(`${URL_BASE}/api/users/public/${userId}`);
  
  const data: ProfileApiResponse = await res.json();
  
  if (!res.ok || !data.success) {
    throw new Error("Usuario no encontrado");
  }
  
  // En la ruta pública ya viene 'stats', pero nos aseguramos
  return data.data; 
};

const fetchReviewsRequest = async (userId: number): Promise<ReviewsData> => {
  const res = await fetch(`${URL_BASE}/api/users/reviews/user/${userId}`);
  const data = await res.json();
  
  // La ruta de reviews usa 'ok' en lugar de 'success'
  if (!res.ok || !data.ok) {
      return { ok: false, reviews: [], stats: { total: 0, promedio: "0" } };
  }
  return data;
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
  
  // La ruta de update usa 'ok'
  if (!res.ok || !result.ok) {
      throw new Error(result.message || "Error al actualizar");
  }
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
  if (!res.ok || !result.ok) throw new Error(result.message || "Error al subir imagen");
  return result;
};

// --- HOOK PRINCIPAL ---

export const useProfile = (profileIdParam?: string) => {
  const { token, user: sessionUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Determinar si es mi perfil
  const isOwnProfile = !profileIdParam || (sessionUser && String(sessionUser.id) === profileIdParam);
  const targetUserId = isOwnProfile ? sessionUser?.id : Number(profileIdParam);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    nombre: "", usuario: "", campus: "", telefono: "", direccion: "",
  });

  // 1. Query Perfil
  const profileQuery = useQuery({
    queryKey: ["userProfile", targetUserId],
    queryFn: () => {
        if (!targetUserId) return null;
        return isOwnProfile 
            ? fetchMyProfileRequest(token) 
            : fetchPublicProfileRequest(targetUserId);
    },
    enabled: !!targetUserId,
    // Datos iniciales optimistas si es mi propio perfil
    initialData: isOwnProfile && sessionUser ? {
        ...sessionUser,
        // Mock stats temporal mientras carga lo real
        stats: { ventas: 0, publicaciones: 0 } 
    } as any : undefined, 
  });

  const user = profileQuery.data;

  // 2. Query Reseñas
  const reviewsQuery = useQuery({
    queryKey: ["reviews", targetUserId],
    queryFn: () => fetchReviewsRequest(targetUserId!),
    enabled: !!targetUserId,
  });

  // Sincronizar formulario
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
    isErrorProfile: profileQuery.isError,
    
    reviewData: reviewsQuery.data,
    isLoadingReviews: reviewsQuery.isLoading,
    
    isOwnProfile,
    isEditing, setIsEditing,
    formData, setFormData,
    
    saveProfile: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    uploadPhoto: photoMutation.mutate,
    isUploadingPhoto: photoMutation.isPending
  };
};

// --- HOOK DE PUBLICACIONES (Feed) ---

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

  // Calcular resultados manualmente ya que usePostsWithFilters devuelve el array directo
  const hasResults = posts && posts.length > 0;
  const totalResults = posts ? posts.length : 0;

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, posts?.length]);

  const items: PublicationItem[] = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.nombre,
      image: post.imagenes?.[0]?.url,
      price: parseFloat(String(post.precioActual)),
      author: post.vendedor?.usuario || post.vendedor?.nombre,
      avatar: post.vendedor?.fotoPerfilUrl,
      description: post.descripcion,
      timeAgo: post.fechaAgregado,
      categoryName: post.categoryName,
      rating: post.vendedor?.reputacion ?? 0,
      sales: post.vendedor?.stats?.ventas ?? 0
  }));

  return {
      items, isLoading, isError, error, hasResults, hasNextPage, isFetchingNextPage, totalResults, lastPostElementRef
  };
};