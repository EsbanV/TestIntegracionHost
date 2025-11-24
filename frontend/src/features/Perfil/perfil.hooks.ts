import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import API from "@/api/axiosInstance"; // <--- Importamos tu instancia
import type { 
  UserProfile, 
  UpdateProfileData, 
  ReviewsData, 
  ProfileApiResponse,
  PublicationItem,
  UsePublicationsFeedProps
} from "./perfil.types";

// --- FETCHERS SIMPLIFICADOS (Dentro del hook es mejor, pero los dejamos como helpers puros) ---
// Nota: Ya no necesitamos pasar 'token', Axios lo inyecta si existe en localStorage.

// --- HOOK PRINCIPAL ---
export const useProfile = (profileIdParam?: string) => {
  const { user: sessionUser } = useAuth();
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
    queryFn: async () => {
        if (!targetUserId) return null;
        
        let responseData;
        
        if (isOwnProfile) {
            // A. Perfil Privado (Mi cuenta)
            const { data } = await API.get<ProfileApiResponse>('/users/profile');
            if (!data.success) throw new Error("Error al cargar perfil");
            responseData = data.data;
        } else {
            // B. Perfil Público
            const { data } = await API.get<ProfileApiResponse>(`/users/public/${targetUserId}`);
            if (!data.success) throw new Error("Usuario no encontrado");
            responseData = data.data;
        }

        // Normalizar datos: backend devuelve 'resumen', UI espera 'stats'
        // Hacemos esto aquí para que el componente reciba data limpia
        const { resumen, ...userData } = responseData;
        return {
            ...userData,
            stats: {
                ventas: resumen?.totalVentas || 0,
                publicaciones: resumen?.totalProductos || 0,
                compras: resumen?.totalCompras || 0
            }
        } as UserProfile;
    },
    enabled: !!targetUserId,
  });

  const user = profileQuery.data;

  // 2. Query Reseñas
  const reviewsQuery = useQuery({
    queryKey: ["reviews", targetUserId],
    queryFn: async () => {
        try {
            const { data } = await API.get(`/users/reviews/user/${targetUserId}`);
            return data.ok ? data : { ok: false, reviews: [], stats: { total: 0, promedio: "0" } };
        } catch (error) {
            // Retornamos estructura vacía en error para no romper la UI
            return { ok: false, reviews: [], stats: { total: 0, promedio: "0" } };
        }
    },
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

  // 3. Mutaciones (Update & Upload)
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
       const { data: res } = await API.put('/users/profile', data);
       if (!res.ok) throw new Error(res.message || "Error al actualizar");
       return res.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setIsEditing(false);
    },
    onError: (err: any) => alert(err.message || "Error al actualizar perfil"),
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
        const formData = new FormData();
        formData.append('photo', file);
        
        // Axios detecta FormData y ajusta el header Content-Type automáticamente
        const { data } = await API.post('/upload/profile-photo', formData);
        if (!data.ok) throw new Error(data.message || "Error al subir imagen");
        return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
    onError: (err: any) => alert(err.message || "Error al subir foto"),
  });

  return {
    user,
    isLoadingProfile: profileQuery.isLoading,
    isErrorProfile: profileQuery.isError,
    
    reviewData: reviewsQuery.data as ReviewsData,
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
export const usePublicationsFeed = ({ authorId }: UsePublicationsFeedProps) => {
  
  const userId = authorId ? parseInt(authorId) : null;

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: ["user-products", userId],
    queryFn: async () => {
        const { data } = await API.get(`/products/user/${userId}`, {
            params: { limit: 50 }
        });
        return data.products || [];
    },
    enabled: !!userId,
  });

  const hasResults = posts.length > 0;
  const totalResults = posts.length;

  // Mapeo de datos para la UI
  const items: PublicationItem[] = posts.map((post: any) => {
    const mainImage = post.imagenes?.[0]?.url 
                   || post.imagenUrl          
                   || null;

    return {
      id: post.id,
      title: post.nombre,
      image: mainImage,
      price: post.precioActual ? parseFloat(String(post.precioActual)) : 0,
      categoryName: post.categoria || post.categoriaNombre || "Varios",
      rating: post.vendedor?.reputacion || 0,
      sales: 0
    };
  });

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