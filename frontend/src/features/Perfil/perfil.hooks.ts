import { useEffect, useState, useRef } from "react";
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

// --- FETCHERS (NUEVO) ---
const fetchUserProductsRequest = async (userId: number) => {
  // Esta ruta YA EXISTE en tu backend (products.js) y filtra por vendedorId
  const res = await fetch(`${URL_BASE}/api/products/user/${userId}?limit=50`); 
  const data = await res.json();
  if (!res.ok) throw new Error("Error al cargar productos del usuario");
  return data.products || [];
};

// --- HOOK DE PUBLICACIONES DEL PERFIL (CORREGIDO) ---
export const usePublicationsFeed = ({ 
  authorId, // Este ID es clave
}: UsePublicationsFeedProps) => {
  
  // Si no hay authorId, no podemos cargar nada
  const userId = authorId ? parseInt(authorId) : null;

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: ["user-products", userId],
    queryFn: () => fetchUserProductsRequest(userId!),
    enabled: !!userId, // Solo se ejecuta si tenemos un ID válido
  });

  const hasResults = posts.length > 0;
  const totalResults = posts.length;

  // Mapeo de datos al formato UI
  const items: PublicationItem[] = posts.map((post: any) => ({
      id: post.id,
      title: post.nombre,
      image: post.imagenUrl, // Ojo: tu ruta /user/:id devuelve 'imagenUrl', no 'imagenes' array
      price: parseFloat(String(post.precioActual)),
      categoryName: post.categoria,
      rating: 0, // El endpoint simple no trae rating del vendedor por producto
      sales: 0
  }));

  return {
      items,
      isLoading,
      isError,
      error,
      hasResults,
      // En este endpoint simple no hay paginación infinita por ahora,
      // así que desactivamos la carga de "siguiente página"
      hasNextPage: false, 
      isFetchingNextPage: false,
      fetchNextPage: () => {}, 
      totalResults,
      lastPostElementRef: { current: null } // No necesitamos ref de scroll infinito aquí por ahora
  };
};