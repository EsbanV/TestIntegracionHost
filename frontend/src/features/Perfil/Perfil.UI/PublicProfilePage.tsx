import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { getImageUrl } from "@/app/imageHelper";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LuMapPin, LuCalendar, LuStar, LuShieldCheck, 
  LuLayoutGrid, LuMessageCircle, LuShoppingBag, LuGhost, LuUser
} from "react-icons/lu";

const URL_BASE = import.meta.env.VITE_API_URL;

// --- 1. TIPOS LOCALES ---

interface ProfileUser {
  id: number;
  nombre: string;
  usuario: string;
  fotoPerfilUrl?: string;
  campus?: string;
  reputacion: number;
  fechaRegistro: string;
  stats?: {
    ventas: number;
    publicaciones: number;
  };
}

interface ProfileProduct {
  id: number;
  nombre: string;
  precioActual: number;
  categoria: string;
  imagenUrl?: string;
  estado: string;
  cantidad: number;
}

// Nuevo tipo para las reseñas
interface Review {
  id: number;
  puntuacion: number;
  comentario: string;
  fecha: string;
  calificador: {
    nombre: string;
    fotoPerfilUrl?: string;
  };
  transaccion?: {
    producto: {
      nombre: string;
    };
  };
}

// --- 2. API FETCHERS ---

const fetchPublicProfile = async (userId: string): Promise<ProfileUser> => {
  const res = await fetch(`${URL_BASE}/api/users/public/${userId}`);
  if (!res.ok) throw new Error("Usuario no encontrado");
  const data = await res.json();
  return data.data;
};

const fetchUserProducts = async (userId: string): Promise<ProfileProduct[]> => {
  const res = await fetch(`${URL_BASE}/api/products/user/${userId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.products; 
};

// Nuevo fetcher para reseñas
const fetchUserReviews = async (userId: string): Promise<{ reviews: Review[], stats: { total: number, promedio: string } }> => {
  const url = `${URL_BASE}/api/users/reviews/user/${userId}`;
  
  console.log("📡 Fetching reviews from:", url); // Log para verificar

  const res = await fetch(url);
  if (!res.ok) return { reviews: [], stats: { total: 0, promedio: "0" } };
  return await res.json();
};

// --- 3. COMPONENTES LOCALES ---

const ProfileProductCard = ({ product, onClick }: { product: ProfileProduct, onClick: (id: number) => void }) => {
  const formattedPrice = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(product.precioActual);

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={() => onClick(product.id)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-all"
    >
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        {product.imagenUrl ? (
          <img 
            src={getImageUrl(product.imagenUrl)} 
            alt={product.nombre} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <LuShoppingBag size={32} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/90 text-slate-900 font-bold shadow-sm hover:bg-white">
            {formattedPrice}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
           <Badge variant="outline" className="text-[10px] px-1.5 h-5 text-slate-500 border-slate-200 font-normal">
             {product.categoria}
           </Badge>
           {product.estado === 'nuevo' && (
             <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Nuevo</span>
           )}
        </div>
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {product.nombre}
        </h3>
      </div>
    </motion.div>
  );
};

// Nuevo componente para tarjeta de reseña
const ReviewCard = ({ review }: { review: Review }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 bg-slate-100 border border-slate-200">
          <AvatarImage src={getImageUrl(review.calificador.fotoPerfilUrl)} />
          <AvatarFallback><LuUser className="text-slate-400" /></AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-slate-900">{review.calificador.nombre}</p>
          <p className="text-xs text-slate-400">{new Date(review.fecha).toLocaleDateString()}</p>
        </div>
      </div>
      {review.transaccion?.producto && (
        <Badge variant="secondary" className="text-[10px] font-normal bg-slate-50 text-slate-500">
          Compró: {review.transaccion.producto.nombre}
        </Badge>
      )}
    </div>
    
    <div className="flex text-amber-400 mb-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <LuStar 
          key={star} 
          size={14} 
          fill={star <= Number(review.puntuacion) ? "currentColor" : "none"} 
          className={star <= Number(review.puntuacion) ? "text-amber-400" : "text-slate-200"}
        />
      ))}
    </div>
    
    <p className="text-sm text-slate-600 leading-relaxed">
      "{review.comentario}"
    </p>
  </div>
);

// --- 4. PÁGINA PRINCIPAL ---

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Query Perfil
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: () => fetchPublicProfile(id!),
    enabled: !!id,
    retry: 1
  });

  // Query Productos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["userProducts", id],
    queryFn: () => fetchUserProducts(id!),
    enabled: !!id,
  });

  // Query Reseñas (NUEVO)
  const { data: reviewData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["userReviews", id],
    queryFn: () => fetchUserReviews(id!),
    enabled: !!id,
  });

  const isOwnProfile = currentUser?.id === Number(id);

  const handleContact = () => {
    if (!profile) return;
    navigate('/chats', { 
      state: { 
        toUser: {
          id: profile.id,
          nombre: profile.nombre,
          fotoPerfilUrl: profile.fotoPerfilUrl
        } 
      } 
    });
  };

  if (isLoading) return <ProfileSkeleton />;
  
  if (isError || !profile) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
      <div className="p-4 bg-slate-50 rounded-full mb-4">
         <LuGhost size={40} className="text-slate-300" />
      </div>
      <h2 className="text-xl font-semibold text-slate-700">Usuario no encontrado</h2>
      <p className="text-sm text-slate-400 mb-6">Es posible que el perfil haya sido eliminado.</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 p-4 md:p-8">
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* --- HERO HEADER --- */}
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-32 md:h-48 w-full bg-gradient-to-r from-slate-900 to-slate-800 relative">
             <div className="absolute inset-0 bg-black/10" />
          </div>
          
          <div className="px-6 pb-6 md:px-8">
            <div className="flex flex-col md:flex-row gap-4 items-start -mt-12 relative z-10">
              
              {/* Avatar */}
              <div className="p-1 bg-white rounded-full shadow-sm">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-slate-50 bg-white">
                  <AvatarImage 
                    src={getImageUrl(profile.fotoPerfilUrl)} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-3xl md:text-4xl bg-slate-100 text-slate-400 font-bold">
                    {profile.nombre.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Datos */}
              <div className="flex-1 pt-2 md:pt-14 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                      {profile.nombre}
                    </h1>
                    <p className="text-slate-500 font-medium">@{profile.usuario}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-3 text-sm text-slate-600">
                       {profile.campus && (
                         <div className="flex items-center gap-1.5">
                           <LuMapPin className="text-blue-500" size={14} /> 
                           <span>{profile.campus}</span>
                         </div>
                       )}
                       <div className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                       <div className="flex items-center gap-1.5">
                         <LuCalendar className="text-slate-400" size={14} /> 
                         <span>Miembro desde {new Date(profile.fechaRegistro).getFullYear()}</span>
                       </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 w-full md:w-auto">
                    {isOwnProfile ? (
                      <Button onClick={() => navigate('/perfil')} variant="outline" className="flex-1 md:flex-none gap-2 border-slate-300">
                         Editar Perfil
                      </Button>
                    ) : (
                      <Button onClick={handleContact} className="flex-1 md:flex-none gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                        <LuMessageCircle size={16} /> Contactar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLUMNA IZQUIERDA: INFO */}
          <div className="space-y-6">
             <Card className="border-slate-200 shadow-sm bg-slate-50/50">
                <CardHeader className="border-b border-slate-100 py-3 px-4">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid gap-4">
                   {/* Reputación */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white border border-slate-100 text-amber-500 rounded-lg shadow-sm">
                           <LuStar size={16} />
                         </div>
                         <span className="text-sm font-medium text-slate-600">Reputación</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {Number(profile.reputacion || 0).toFixed(1)}
                      </span>
                   </div>
                   
                   {/* Ventas */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white border border-slate-100 text-green-600 rounded-lg shadow-sm">
                           <LuShieldCheck size={16} />
                         </div>
                         <span className="text-sm font-medium text-slate-600">Ventas</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {profile.stats?.ventas || 0}
                      </span>
                   </div>

                   {/* Productos Publicados */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white border border-slate-100 text-blue-600 rounded-lg shadow-sm">
                           <LuLayoutGrid size={16} />
                         </div>
                         <span className="text-sm font-medium text-slate-600">Productos</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {profile.stats?.publicaciones || 0}
                      </span>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* CONTENIDO: PUBLICACIONES Y RESEÑAS */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="products" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-slate-100/80 p-1 border border-slate-200 rounded-xl">
                  <TabsTrigger value="products" className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    Publicaciones ({products?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    Valoraciones ({reviewData?.reviews.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Pestaña Productos */}
              <TabsContent value="products" className="mt-0">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
                  </div>
                ) : products && products.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
                  >
                    {products.map((product) => (
                       <ProfileProductCard 
                          key={product.id} 
                          product={product} 
                          onClick={(id) => navigate(`/producto/${id}`)} 
                       />
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <LuShoppingBag className="text-slate-300 h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Sin publicaciones activas</h3>
                    <p className="text-slate-500 mt-1 max-w-xs">
                      {isOwnProfile 
                        ? "Aún no has publicado nada. ¡Empieza a vender hoy!" 
                        : "Este usuario no tiene productos en venta actualmente."}
                    </p>
                    {isOwnProfile && (
                      <Button className="mt-4 bg-slate-900 text-white" onClick={() => navigate('/crear')}>
                        Crear publicación
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Pestaña Reseñas (NUEVA LÓGICA) */}
              <TabsContent value="reviews" className="mt-0">
                 {isLoadingReviews ? (
                   <div className="space-y-4">
                     <Skeleton className="h-32 w-full rounded-xl" />
                     <Skeleton className="h-32 w-full rounded-xl" />
                   </div>
                 ) : reviewData && reviewData.reviews.length > 0 ? (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     {/* Resumen de estrellas */}
                     <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex items-center gap-6">
                        <div className="text-center">
                           <div className="text-3xl font-bold text-slate-900">{reviewData.stats.promedio}</div>
                           <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Promedio</div>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <div className="flex-1">
                           <div className="flex gap-1 mb-1">
                             {[1,2,3,4,5].map(s => (
                               <LuStar key={s} size={20} className={s <= Math.round(Number(reviewData.stats.promedio)) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                             ))}
                           </div>
                           <div className="text-sm text-slate-500">{reviewData.stats.total} opiniones recibidas</div>
                        </div>
                     </div>

                     {/* Lista de reseñas */}
                     {reviewData.reviews.map((review) => (
                       <ReviewCard key={review.id} review={review} />
                     ))}
                   </motion.div>
                 ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <div className="inline-flex p-3 bg-amber-50 rounded-full mb-4">
                        <LuStar className="text-amber-400 h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">Sin valoraciones</h3>
                      <p className="text-slate-500 mt-1">Este usuario aún no ha recibido opiniones de compradores.</p>
                   </div>
                 )}
              </TabsContent>
            </Tabs>
          </div>

        </div>

      </motion.div>
    </div>
  );
}

// --- SKELETON LOADER ---
function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <Skeleton className="h-48 w-full rounded-t-2xl bg-slate-200" />
      <div className="px-8 -mt-16 flex gap-6 items-end">
        <Skeleton className="h-32 w-32 rounded-full border-4 border-white bg-slate-300" />
        <div className="pb-2 space-y-2 w-full max-w-md">
          <Skeleton className="h-8 w-1/2 bg-slate-200" />
          <Skeleton className="h-4 w-1/3 bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-8 mt-8">
         <Skeleton className="h-64 w-full rounded-xl bg-slate-100" />
         <div className="col-span-3 grid grid-cols-3 gap-4">
            <Skeleton className="h-64 rounded-xl bg-slate-100" />
            <Skeleton className="h-64 rounded-xl bg-slate-100" />
            <Skeleton className="h-64 rounded-xl bg-slate-100" />
         </div>
      </div>
    </div>
  )
}