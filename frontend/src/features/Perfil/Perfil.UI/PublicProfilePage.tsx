import { useState } from "react";
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
import { Label } from "@/components/ui/label";

// Icons
import { 
  LuMapPin, LuCalendar, LuStar, LuShieldCheck, 
  LuLayoutGrid, LuMessageCircle, LuShoppingBag, LuGhost, LuUser, LuMail
} from "react-icons/lu";

const URL_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS ---
interface ProfileUser {
  id: number;
  nombre: string;
  usuario: string;
  correo: string; // Agregado para consistencia
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

// --- API FETCHERS ---
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

const fetchUserReviews = async (userId: string): Promise<{ reviews: Review[], stats: { total: number, promedio: string } }> => {
  const url = `${URL_BASE}/api/users/reviews/user/${userId}`;
  const res = await fetch(url);
  if (!res.ok) return { reviews: [], stats: { total: 0, promedio: "0" } };
  return await res.json();
};

// --- VARIANTS ANIMACIÓN ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
}
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
}

// --- PÁGINA PRINCIPAL ---
export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: () => fetchPublicProfile(id!),
    enabled: !!id,
    retry: 1
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["userProducts", id],
    queryFn: () => fetchUserProducts(id!),
    enabled: !!id,
  });

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
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* --- HERO SECTION (Igual al Perfil Personal) --- */}
        <motion.div variants={itemVariants} className="relative">
          <div className="h-48 w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl shadow-sm"></div>
            
          <Card className="relative -mt-16 mx-4 md:mx-0 border-none shadow-lg overflow-visible">
            <CardContent className="pt-0 pb-6 px-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                  
                {/* Avatar */}
                <div className="relative -mt-12 group">
                  <div className="p-1.5 bg-white rounded-full shadow-sm relative">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-inner">
                      <AvatarImage 
                        src={getImageUrl(profile.fotoPerfilUrl)}
                        alt={profile.nombre} 
                        className="object-cover" 
                      />
                      <AvatarFallback className="text-4xl bg-slate-100 text-slate-400 font-bold">
                        {profile.nombre.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-green-500 h-5 w-5 rounded-full border-4 border-white" title="Online"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 mt-4 md:mt-2 w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{profile.nombre}</h1>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">@{profile.usuario}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><LuCalendar className="w-4 h-4" /> Miembro desde {new Date(profile.fechaRegistro).getFullYear()}</span>
                        {profile.campus && <span className="flex items-center gap-1.5"><LuMapPin className="w-4 h-4" /> {profile.campus}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      {isOwnProfile ? (
                        <Button onClick={() => navigate('/perfil')} variant="outline" className="w-full md:w-auto gap-2 border-slate-300">
                           Editar mi perfil
                        </Button>
                      ) : (
                        <Button onClick={handleContact} className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/50">
                          <LuMessageCircle size={16} /> Contactar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* --- GRID CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mx-4 md:mx-0">
          
          {/* COLUMNA IZQUIERDA: INFO */}
          <motion.div variants={itemVariants} className="space-y-6">
             {/* Información Personal */}
             <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2"><LuUser className="text-blue-500" /> Información Pública</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <ProfileField label="Nombre Completo" value={profile.nombre} />
                   <Separator />
                   <ProfileField label="Campus" icon={<LuMapPin className="w-4 h-4 text-slate-400" />} value={profile.campus || "No especificado"} />
                   <Separator />
                   {/* Solo mostramos correo si es necesario, o lo ocultamos por privacidad */}
                   <ProfileField label="Contacto" icon={<LuMail className="w-4 h-4 text-slate-400" />} value="Vía Chat Interno" />
                </CardContent>
             </Card>

             {/* Estadísticas */}
             <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider">Reputación</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                      <p className="text-2xl font-bold">{Number(profile.reputacion || 0).toFixed(1)}</p>
                      <div className="flex items-center gap-1 text-amber-400 text-sm"><LuStar className="fill-current" /> Calificación</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                      <p className="text-2xl font-bold">{profile.stats?.ventas || 0}</p>
                      <div className="flex items-center gap-1 text-green-400 text-sm"><LuShieldCheck /> Ventas</div>
                    </div>
                  </div>
                </CardContent>
             </Card>
          </motion.div>

          {/* COLUMNA DERECHA: CONTENIDO */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Tabs defaultValue="products" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-white border border-slate-200 shadow-sm w-full justify-start p-1 h-auto">
                  <TabsTrigger value="products" className="flex-1 md:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2">
                    <LuLayoutGrid className="w-4 h-4 mr-2" /> Publicaciones ({products?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 md:flex-none data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 py-2">
                    <LuStar className="w-4 h-4 mr-2" /> Valoraciones ({reviewData?.stats.total || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Pestaña Productos */}
              <TabsContent value="products" className="mt-0">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                  </div>
                ) : products && products.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
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
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-center shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <LuShoppingBag className="text-slate-300 h-6 w-6" />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Este usuario no tiene publicaciones activas.</p>
                  </div>
                )}
              </TabsContent>

              {/* Pestaña Reseñas */}
              <TabsContent value="reviews" className="mt-0">
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Opiniones de compradores</h3>
                        <p className="text-xs text-slate-500">Basado en transacciones completadas</p>
                      </div>
                      {reviewData?.stats && (
                         <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">{reviewData.stats.promedio}</div>
                            <div className="flex text-amber-400 text-xs">
                               {[1,2,3,4,5].map(s => (
                                 <LuStar key={s} size={12} className={s <= Math.round(Number(reviewData.stats.promedio)) ? "fill-current" : "text-slate-200"} />
                               ))}
                            </div>
                         </div>
                      )}
                    </div>

                    {isLoadingReviews ? (
                      <div className="space-y-4">
                         <Skeleton className="h-24 w-full rounded-lg" />
                         <Skeleton className="h-24 w-full rounded-lg" />
                      </div>
                    ) : reviewData && reviewData.reviews.length > 0 ? (
                       <div className="space-y-4">
                         {reviewData.reviews.map((review) => (
                           <ReviewCard key={review.id} review={review} />
                         ))}
                       </div>
                    ) : (
                       <div className="text-center py-8">
                         <div className="inline-flex p-3 bg-slate-50 rounded-full mb-3">
                            <LuGhost className="text-slate-300 w-6 h-6" />
                         </div>
                         <p className="text-slate-500 text-sm">Aún no hay opiniones para este usuario.</p>
                       </div>
                    )}
                 </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

const ProfileField = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
      {icon} {label}
    </Label>
    <p className="text-sm font-medium text-slate-900">{value}</p>
  </div>
);

const ProfileProductCard = ({ product, onClick }: { product: ProfileProduct, onClick: (id: number) => void }) => {
  const formattedPrice = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(product.precioActual);
  return (
    <div 
      onClick={() => onClick(product.id)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {product.imagenUrl ? (
          <img src={getImageUrl(product.imagenUrl)} alt={product.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><LuShoppingBag size={24} /></div>
        )}
        <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-900 shadow-sm">{formattedPrice}</div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">{product.nombre}</h3>
        <Badge variant="outline" className="text-[10px] px-1.5 font-normal text-slate-500">{product.categoria}</Badge>
      </div>
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all">
    <Avatar className="h-10 w-10 bg-white border border-slate-200">
      <AvatarImage src={getImageUrl(review.calificador.fotoPerfilUrl)} />
      <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
        {review.calificador.nombre.substring(0,2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-slate-900 text-sm truncate pr-2">{review.calificador.nombre}</span>
        <span className="text-[10px] text-slate-400 shrink-0">{new Date(review.fecha).toLocaleDateString()}</span>
      </div>
      <div className="flex text-amber-400 mb-2">
        {[...Array(5)].map((_, i) => (
          <LuStar key={i} size={12} className={i < Number(review.puntuacion) ? "fill-current" : "text-slate-300"} />
        ))}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">"{review.comentario}"</p>
      
      {review.transaccion?.producto && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500">
          <LuShoppingBag size={10} /> 
          <span className="truncate max-w-[150px]">Compró: {review.transaccion.producto.nombre}</span>
        </div>
      )}
    </div>
  </div>
);

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <Skeleton className="h-48 w-full rounded-t-2xl bg-slate-200" />
      <div className="px-6 -mt-16 flex gap-6">
        <Skeleton className="h-32 w-32 rounded-full border-4 border-white bg-slate-300" />
        <div className="pt-16 space-y-2 w-full max-w-md">
           <Skeleton className="h-8 w-1/2 bg-slate-200" />
           <Skeleton className="h-4 w-1/3 bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 mx-4 md:mx-0">
        <Skeleton className="h-64 w-full rounded-xl bg-slate-100" />
        <Skeleton className="h-96 w-full lg:col-span-2 rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}