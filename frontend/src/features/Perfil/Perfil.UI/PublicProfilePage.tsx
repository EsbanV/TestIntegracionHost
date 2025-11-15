import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { getImageUrl } from "@/app/imageHelper";

// UI Components & Icons
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LuMapPin, LuCalendar, LuStar, LuShieldCheck, 
  LuLayoutGrid, LuMessageCircle, LuShoppingBag
} from "react-icons/lu";

// Importar ItemCard del Marketplace para mostrar sus productos
// Asegúrate de ajustar la ruta a donde tengas tu ItemCard
import { ItemCard } from "@/features/marketplace/Marketplace.UI/MarketplacePage"; 
import type { Post } from "@/features/marketplace/Marketplace.Types/ProductInterfaces";

const URL_BASE = import.meta.env.VITE_API_URL;

// --- TIPOS ---
interface PublicProfile {
  id: number;
  nombre: string;
  apellido?: string;
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

// --- API FETCHERS ---

const fetchPublicProfile = async (userId: string): Promise<PublicProfile> => {
  const res = await fetch(`${URL_BASE}/api/users/public/${userId}`);
  if (!res.ok) throw new Error("Usuario no encontrado");
  const data = await res.json();
  return data.data;
};

const fetchUserProducts = async (userId: string): Promise<Post[]> => {
  // Usamos el endpoint de productos filtrando por vendedorId
  // Nota: Asegúrate de que tu backend soporte ?vendedorId=... o ajusta esta llamada
  // Si no tienes filtro directo, podrías necesitar un endpoint específico
  // Por ahora asumiremos que /api/products acepta filtros o usamos uno simulado
  const res = await fetch(`${URL_BASE}/api/products?vendedorId=${userId}&limit=10`); 
  // OJO: Si tu backend 'products.js' no filtra por vendedorId en GET /, 
  // necesitarás agregar esa lógica en el backend o usar un endpoint específico.
  
  const data = await res.json();
  if (!res.ok) return [];
  
  // Mapeo rápido de datos (adaptar según tu respuesta real)
  return (data.products || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    precioActual: p.precioActual,
    categoria: p.categoria,
    imagenes: p.imagenes?.map((img: any) => ({ url: img.urlImagen })),
    vendedor: p.vendedor,
    cantidad: p.cantidad
  }));
};

// --- COMPONENTE PRINCIPAL ---

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // 1. Cargar Perfil
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: () => fetchPublicProfile(id!),
    enabled: !!id,
    retry: 1
  });

  // 2. Cargar Productos del Usuario
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["userProducts", id],
    queryFn: () => fetchUserProducts(id!),
    enabled: !!id,
  });

  const isOwnProfile = currentUser?.id === Number(id);

  // Acción: Contactar
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
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-xl font-semibold">Usuario no encontrado</h2>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-12 p-4 md:p-8">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* --- HERO CARD --- */}
        <div className="relative">
          {/* Fondo Degradado */}
          <div className="h-48 w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl shadow-sm"></div>
          
          <Card className="relative -mt-16 border-none shadow-lg overflow-visible bg-white">
            <CardContent className="pt-0 pb-6 px-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* Avatar */}
                <div className="relative -mt-12">
                  <div className="p-1.5 bg-white rounded-full shadow-sm">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-inner bg-slate-100">
                      <AvatarImage 
                        src={getImageUrl(profile.fotoPerfilUrl)} 
                        alt={profile.usuario} 
                        className="object-cover" 
                      />
                      <AvatarFallback className="text-4xl bg-slate-200 text-slate-500 font-bold">
                        {profile.nombre.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Info Principal */}
                <div className="flex-1 mt-2 w-full pt-2">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        {profile.nombre} {profile.apellido}
                      </h1>
                      <p className="text-slate-500 font-medium">@{profile.usuario}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
                         {profile.campus && (
                           <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                             <LuMapPin className="text-blue-500" /> {profile.campus}
                           </span>
                         )}
                         <span className="flex items-center gap-1.5">
                           <LuCalendar className="text-slate-400" /> 
                           Miembro desde {new Date(profile.fechaRegistro).getFullYear()}
                         </span>
                      </div>
                    </div>

                    {/* Botón de Acción */}
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                      {isOwnProfile ? (
                        <Button onClick={() => navigate('/perfil')} variant="outline" className="gap-2">
                          <LuPencil className="w-4 h-4" /> Editar mi perfil
                        </Button>
                      ) : (
                        <Button onClick={handleContact} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                          <LuMessageCircle className="w-4 h-4" /> Enviar Mensaje
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar: Estadísticas */}
          <div className="space-y-6">
             <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                  <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid gap-6">
                   {/* Reputación */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                           <LuStar size={20} />
                         </div>
                         <span className="font-medium text-slate-700">Reputación</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {Number(profile.reputacion).toFixed(1)}
                      </span>
                   </div>
                   <Separator />
                   {/* Ventas */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                           <LuShieldCheck size={20} />
                         </div>
                         <span className="font-medium text-slate-700">Ventas</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {profile.stats?.ventas || 0}
                      </span>
                   </div>
                   <Separator />
                   {/* Publicaciones */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                           <LuShoppingBag size={20} />
                         </div>
                         <span className="font-medium text-slate-700">Publicados</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {profile.stats?.publicaciones || 0}
                      </span>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Area Principal: Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="bg-white border border-slate-200 p-1 w-full justify-start rounded-xl mb-6">
                <TabsTrigger value="products" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 flex-1 md:flex-none px-6">
                  <LuLayoutGrid className="w-4 h-4 mr-2" /> Publicaciones
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 flex-1 md:flex-none px-6">
                  <LuStar className="w-4 h-4 mr-2" /> Valoraciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-0">
                {isLoadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.map((post) => (
                       // Usamos ItemCard pero deshabilitamos el click para evitar navegar dentro de la misma página si no queremos
                       // O permitimos navegar al detalle del producto
                       <div key={post.id} onClick={() => navigate(`/producto/${post.id}`)} className="cursor-pointer">
                          <ItemCard post={post} onClick={() => {}} />
                       </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <LuShoppingBag className="text-slate-300 h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Sin publicaciones activas</h3>
                    <p className="text-slate-500 mt-1">Este usuario no tiene productos en venta actualmente.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                   <p>Las valoraciones estarán disponibles pronto.</p>
                </div>
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
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <Skeleton className="h-48 w-full rounded-t-2xl" />
      <div className="px-6 -mt-16 flex gap-6">
        <Skeleton className="h-32 w-32 rounded-full border-4 border-white" />
        <div className="pt-16 space-y-2 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-8 mt-8">
         <Skeleton className="h-64 w-full rounded-xl" />
         <div className="col-span-2 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
         </div>
      </div>
    </div>
  )
}