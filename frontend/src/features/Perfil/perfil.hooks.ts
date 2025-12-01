import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import type { 
  UserProfile, 
  UpdateProfileData, 
  ReviewsData, 
  ProfileApiResponse,
  PublicationItem,
  UsePublicationsFeedProps
} from "./perfil.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// ============================================================================
// 0. CLAVES DE CACHÉ (Centralizadas)
// ============================================================================
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: number | string) => [...profileKeys.all, 'detail', userId] as const,
  reviews: (userId: number | string) => [...profileKeys.all, 'reviews', userId] as const,
  products: (userId: number | string) => [...profileKeys.all, 'products', userId] as const,
};

// ============================================================================
// 1. FETCHERS
// ============================================================================

const fetchProfile = async (userId: number | undefined, token: string | null, isOwnProfile: boolean): Promise<UserProfile> => {
  const url = isOwnProfile 
    ? `${URL_BASE}/api/users/profile` 
    : `${URL_BASE}/api/users/public/${userId}`;
  
  const headers: HeadersInit = isOwnProfile && token 
    ? { 'Authorization': `Bearer ${token}` } 
    : {};

  const res = await fetch(url, { headers });
  const data: ProfileApiResponse = await res.json();

  if (!res.ok || !data.success) {
    throw new Error("Error al cargar perfil");
  }

  // Normalizar estructura de datos
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

const fetchReviews = async (userId: number): Promise<ReviewsData> => {
  const res = await fetch(`${URL_BASE}/api/users/reviews/user/${userId}`);
  const data = await res.json();
  
  if (!res.ok || !data.ok) {
      return { ok: false, reviews: [], stats: { total: 0, promedio: "0" } };
  }
  return data;
};

const fetchUserProducts = async (userId: number) => {
  const res = await fetch(`${URL_BASE}/api/products/user/${userId}?limit=50`); 
  const data = await res.json();
  if (!res.ok) throw new Error("Error al cargar productos");
  return data.products || [];
};

// ============================================================================
// 2. HOOK PRINCIPAL: USE PROFILE
// ============================================================================

export const useProfile = (profileIdParam?: string) => {
  const { token, user: sessionUser, login } = useAuth(); // Importamos login para actualizar sesión local
  const queryClient = useQueryClient();
  
  // Determinar identidad
  const isOwnProfile = !profileIdParam || (sessionUser && String(sessionUser.id) === profileIdParam);
  const targetId = isOwnProfile ? sessionUser?.id : Number(profileIdParam);
  const queryId = isOwnProfile ? 'me' : targetId || 0;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    nombre: "", usuario: "", campus: "", telefono: "", direccion: "",
  });

  // A. Query de Perfil
  const profileQuery = useQuery({
    queryKey: profileKeys.detail(queryId),
    queryFn: () => fetchProfile(targetId, token, isOwnProfile),
    enabled: !!targetId || isOwnProfile,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const user = profileQuery.data;

  // B. Query de Reseñas
  const reviewsQuery = useQuery({
    queryKey: profileKeys.reviews(queryId),
    queryFn: () => fetchReviews(Number(targetId)),
    enabled: !!targetId,
  });

  // C. Sincronizar Formulario
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

  // D. Mutación: Actualizar Datos
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!token) throw new Error("No autenticado");
      const res = await fetch(`${URL_BASE}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error al actualizar");
      return result.user;
    },
    onSuccess: (updatedUser) => {
      // 1. Actualizar caché de React Query
      queryClient.setQueryData(profileKeys.detail('me'), (old: any) => ({ ...old, ...updatedUser }));
      
      // 2. Actualizar contexto de Auth (importante para Header/Sidebar)
      const currentRefreshToken = localStorage.getItem('refresh_token') || '';
      login(token!, currentRefreshToken, updatedUser);

      setIsEditing(false);
    },
    onError: (err: any) => alert(err.message),
  });

  // E. Mutación: Subir Foto
  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!token) throw new Error("No autenticado");
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${URL_BASE}/api/upload/profile-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error al subir imagen");
      return result.photoUrl; // Asumimos que devuelve la URL
    },
    onSuccess: (newPhotoUrl) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
      
      // Actualizar contexto auth
      if (sessionUser) {
         const updatedUser = { ...sessionUser, fotoPerfilUrl: newPhotoUrl };
         const currentRefreshToken = localStorage.getItem('refresh_token') || '';
         login(token!, currentRefreshToken, updatedUser);
      }
    },
    onError: (err: any) => alert(err.message),
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

// ============================================================================
// 3. HOOK DE PUBLICACIONES (Feed Perfil)
// ============================================================================

export const usePublicationsFeed = ({ authorId }: UsePublicationsFeedProps) => {
  const userId = authorId ? parseInt(authorId) : null;

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: profileKeys.products(userId || 0),
    queryFn: () => fetchUserProducts(userId!),
    enabled: !!userId,
  });

  const hasResults = posts.length > 0;
  const totalResults = posts.length;

  const items: PublicationItem[] = posts.map((post: any) => ({
    id: post.id,
    title: post.nombre,
    image: post.imagenes?.[0]?.url || post.imagenUrl || null,
    price: post.precioActual ? parseFloat(String(post.precioActual)) : 0,
    categoryName: post.categoria || post.categoriaNombre || "Varios",
    rating: post.vendedor?.reputacion || 0,
    sales: 0
  }));

  return {
      items,
      isLoading,
      isError,
      error,
      hasResults,
      hasNextPage: false, 
      isFetchingNextPage: false,
      fetchNextPage: () => {}, 
      totalResults,
      lastPostElementRef: { current: null } 
  };
};