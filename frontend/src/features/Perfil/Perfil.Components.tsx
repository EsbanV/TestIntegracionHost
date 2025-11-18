import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { getImageUrl } from "@/app/imageHelper";

// UI Shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { 
  LuPencil, LuSave, LuMail, LuCalendar, LuStar, LuShieldCheck,
  LuCamera, LuLoader, LuGhost, LuShoppingBag, LuEye
} from "react-icons/lu";

// Tipos
import type { Review, UserProfile, PublicationItem } from "./perfil.types";

// Utils & Shared Components
// Asegúrate de que estas rutas sean correctas en tu proyecto
import { RatingStars } from "@/features/shared/ui/RatingStars"; 
import { formatCLP, formatInt } from "@/utils/format"; 

// ============================================================================
// 1. COMPONENTES BÁSICOS (Inputs, Skeleton)
// ============================================================================

export const ProfileField = ({ label, value, icon, canEdit = false, editComponent }: { label: string, value: string, icon?: React.ReactNode, canEdit?: boolean, editComponent?: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">{icon} {label}</Label>
    <div className="h-9 flex items-center">
      <AnimatePresence mode="wait">
        {canEdit && editComponent ? (
          <motion.div key="editing" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="w-full">{editComponent}</motion.div>
        ) : (
          <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-slate-900 truncate w-full">{value}</motion.p>
        )}
      </AnimatePresence>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
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
);

// ============================================================================
// 2. HERO SECTION (Portada y Avatar)
// ============================================================================

interface HeroProps {
  user: UserProfile;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  isUploadingPhoto: boolean;
  onUploadPhoto: (file: File) => void;
  readOnly?: boolean; // Nueva prop para ocultar botones en perfil público
}

export const ProfileHero = ({ user, isEditing, setIsEditing, readOnly = false, isSaving, onSave, isUploadingPhoto, onUploadPhoto }: HeroProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadPhoto(file);
  };

  return (
    <div className="relative">
      <div className="h-48 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl shadow-sm"></div>
      
      <Card className="relative -mt-16 mx-4 md:mx-0 border-none shadow-lg overflow-visible">
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Avatar */}
            <div className="relative -mt-12 group">
              <div className="p-1.5 bg-white rounded-full shadow-sm relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-inner">
                  <AvatarImage src={getImageUrl(user.fotoPerfilUrl)} alt={user.usuario} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-slate-100 text-slate-400">{user.usuario.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* Botón de subir foto (Solo si no es readOnly) */}
                {!readOnly && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingPhoto ? <LuLoader className="text-white w-8 h-8 animate-spin" /> : <LuCamera className="text-white w-8 h-8" />}
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              <div className="absolute bottom-2 right-2 bg-green-500 h-5 w-5 rounded-full border-4 border-white" title="Online"></div>
            </div>

            {/* Info */}
            <div className="flex-1 mt-4 md:mt-2 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{user.usuario}</h1>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">{user.role}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><LuMail className="w-4 h-4" /> {user.correo}</span>
                    <span className="flex items-center gap-1.5"><LuCalendar className="w-4 h-4" /> Miembro desde {user.fechaRegistro ? new Date(user.fechaRegistro).getFullYear() : '2024'}</span>
                  </div>
                </div>

                {/* Botones de Acción (Solo si no es readOnly) */}
                {!readOnly && (
                  <div className="flex gap-2 w-full md:w-auto">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 w-full md:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
                        <LuPencil className="w-4 h-4" /> Editar Perfil
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={onSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                          {isSaving ? "Guardando..." : <><LuSave className="w-4 h-4" /> Guardar</>}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// 3. ESTADÍSTICAS Y RESEÑAS
// ============================================================================

export const ProfileStatsCard = ({ user }: { user: UserProfile }) => (
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
    <CardContent className="p-6">
      <h3 className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider">Estadísticas</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm">
          <p className="text-2xl font-bold">{Number(user.reputacion).toFixed(1)}</p>
          <div className="flex items-center gap-1 text-amber-400 text-sm"><LuStar className="fill-current" /> Reputación</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm">
          <p className="text-2xl font-bold">{user.resumen?.totalVentas || user.stats?.ventas || 0}</p>
          <div className="flex items-center gap-1 text-blue-300 text-sm"><LuShieldCheck /> Ventas</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ReviewsList = ({ reviews }: { reviews: Review[] }) => (
  <div className="grid gap-4">
    {reviews.map((review) => (
      <div key={review.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
        <Avatar className="h-10 w-10 bg-slate-200">
            <AvatarImage src={getImageUrl(review.calificador.fotoPerfilUrl)} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
              {review.calificador.nombre.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">{review.calificador.nombre}</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <LuStar key={i} className={`w-3 h-3 ${i < Number(review.puntuacion) ? 'fill-current' : 'text-slate-200'}`} />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-slate-400">{new Date(review.fecha).toLocaleDateString()}</span>
          </div>
          
          <p className="text-slate-600 mt-1 text-sm leading-snug">"{review.comentario}"</p>
          
          {review.transaccion?.producto && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-100 text-[10px] text-slate-500">
              <LuShoppingBag size={10} /> {review.transaccion.producto.nombre}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

export const EmptyReviews = () => (
  <div className="text-center py-12">
    <div className="inline-flex p-3 bg-slate-50 rounded-full mb-3">
        <LuGhost className="text-slate-300 w-6 h-6" />
    </div>
    <p className="text-slate-500 text-sm">Aún no hay reseñas para este usuario.</p>
  </div>
);

// ... (ProfileField, ProfileSkeleton, ProfileHero se mantienen igual, asegúrate de importar ProfileHero del código anterior si lo necesitas, aquí me enfoco en PublicationsList) ...

// ... [Mantener ProfileField, ProfileSkeleton, ProfileHero igual que antes] ...
// Aquí solo pego el cambio crítico en PublicationsList para ahorrar espacio, 
// asume que el resto del archivo sigue igual a tu versión original excepto esto:

// ============================================================================
// 4. LISTA DE PUBLICACIONES (Grid Mejorado)
// ============================================================================

interface PublicationsListProps {
  items: PublicationItem[];
  isLoading: boolean;
  isError: boolean;
  hasResults: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  lastPostRef: (node: HTMLDivElement) => void;
  showEditButton?: boolean;
  onItemClick?: (item: PublicationItem) => void; // Nuevo prop
}

export const PublicationsList = ({ 
  items, isLoading, isError, hasResults, hasNextPage, isFetchingNextPage, lastPostRef, showEditButton = false, onItemClick
}: PublicationsListProps) => {
  
  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl bg-slate-100" />)}
    </div>
  );
  
  if (isError) return <div className="p-6 bg-red-50 text-red-600 rounded-lg text-center border border-red-100">Error al cargar publicaciones.</div>;
  
  if (!hasResults) return (
    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
         <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
            <LuGhost size={32} className="text-slate-300" />
         </div>
         <h3 className="text-lg font-semibold text-slate-600">Sin publicaciones</h3>
         <p className="text-sm">Este usuario aún no ha publicado nada.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((post, index) => (
             <motion.div 
               key={post.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.05 }}
               ref={index === items.length - 1 ? lastPostRef : null}
               className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
               onClick={() => onItemClick && onItemClick(post)} // Click para abrir modal
             >
                {/* Imagen */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                   {post.image ? (
                     <img src={getImageUrl(post.image)} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                   ) : (
                     <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <LuShoppingBag className="w-10 h-10 mb-2 opacity-50"/>
                        <span className="text-xs font-medium">Sin foto</span>
                     </div>
                   )}
                   
                   {/* Badges Superpuestos */}
                   <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur text-slate-800 shadow-sm border-0 font-medium">
                        {post.categoryName || "Varios"}
                      </Badge>
                   </div>
                   
                   {/* Acciones Hover */}
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg font-medium">
                         <LuEye className="w-4 h-4 mr-2" /> Ver Detalle
                      </Button>
                   </div>
                </div>
                
                {/* Info */}
                <div className="p-5 flex flex-col h-[160px]">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight flex-1 mr-2">
                        {post.title}
                      </h3>
                   </div>
                   
                   <div className="mt-auto space-y-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-emerald-600">{formatCLP(post.price || 0)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                         <div className="flex items-center gap-1 text-xs text-slate-400">
                            <LuCalendar className="w-3 h-3" />
                            <span>Publicado recientemente</span>
                         </div>
                         
                         {showEditButton && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                             onClick={(e) => {
                               e.stopPropagation(); // Evita abrir el modal si clickeas editar
                             }}
                             asChild
                           >
                             <Link to={`/editar/${post.id}`}>
                               <LuPencil className="w-3 h-3 mr-1" /> Editar
                             </Link>
                           </Button>
                         )}
                      </div>
                   </div>
                </div>
             </motion.div>
          ))}
       </div>
       
       {isFetchingNextPage && <div className="flex justify-center py-4"><LuLoader className="animate-spin text-blue-600" /></div>}
    </div>
  );
};