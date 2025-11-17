import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/app/imageHelper";

// UI Shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';

// Icons
import { 
  LuPencil, LuSave, LuMail, LuCalendar, LuStar, LuShieldCheck,
  LuCamera, LuLoader, LuGhost, LuShoppingBag
} from "react-icons/lu";

// Tipos
import type { Review, UpdateProfileData, UserProfile, PublicationItem } from "./perfil.types";

// --- ✅ COMPONENTES Y UTILS EXTERNOS ---
import { RatingStars } from "@/features/shared/ui/RatingStars"; // Ajusta la ruta a tu componente
import { formatCLP, formatInt } from "@/utils/format"; // Ajusta la ruta a tu archivo de formato

// --- SUBCOMPONENTES ---

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
  // ... (código del skeleton sin cambios) ...
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

// --- COMPONENTES PRINCIPALES ---

interface HeroProps {
  user: UserProfile;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  isUploadingPhoto: boolean;
  onUploadPhoto: (file: File) => void;
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

                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingPhoto ? <LuLoader className="text-white w-8 h-8 animate-spin" /> : <LuCamera className="text-white w-8 h-8" />}
                </div>
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

                <div className="flex gap-2 w-full md:w-auto">
                {/* Solo mostramos botones si NO es readOnly */}
     {!readOnly && (
        <div className="flex gap-2 w-full md:w-auto">
           {/* ... Botones Editar/Guardar ... */}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
          <p className="text-2xl font-bold">{user.resumen?.totalVentas || 0}</p>
          <div className="flex items-center gap-1 text-blue-300 text-sm"><LuShieldCheck /> Ventas</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- LISTA DE RESEÑAS ---
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
    <p className="text-slate-500 text-sm">Aún no tienes reseñas de compradores.</p>
  </div>
);

// --- LISTA DE PUBLICACIONES (COMPONENTE "TONTO") ---
interface PublicationsListProps {
  items: PublicationItem[];
  isLoading: boolean;
  isError: boolean;
  hasResults: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  lastPostRef: (node: HTMLDivElement) => void;
  showEditButton?: boolean;
}

export const PublicationsList = ({ 
  items, isLoading, isError, hasResults, hasNextPage, isFetchingNextPage, lastPostRef, showEditButton = false 
}: PublicationsListProps) => {
  
  if (isLoading) return <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" /></div>;
  
  if (isError) return <div className="p-6 bg-red-50 text-red-600 rounded-lg">Error al cargar publicaciones.</div>;
  
  if (!hasResults) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
       <div className="text-6xl mb-4">📭</div>
       <p>No hay publicaciones para mostrar.</p>
    </div>
  );

  return (
    <div className="space-y-6">
       {/* GRID */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((post, index) => (
             <div 
               key={post.id} 
               ref={index === items.length - 1 ? lastPostRef : null}
               className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group"
             >
                {/* Imagen */}
                <div className="relative aspect-video w-full bg-slate-100">
                   {post.image ? <img src={getImageUrl(post.image)} alt={post.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center"><LuShoppingBag className="w-8 h-8 text-slate-300"/></div>}
                   {post.price && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                        {formatCLP(post.price)}
                      </div>
                   )}
                </div>
                
                {/* Contenido */}
                <div className="p-4">
                   <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{post.title}</h3>
                   <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <div className="flex items-center gap-1">
                         <RatingStars rating={post.rating || 0} size={12} />
                         <span>({formatInt(post.sales || 0)} ventas)</span>
                      </div>
                      {showEditButton && (
                         <Link to={`/editar/${post.id}`} className="text-blue-600 font-medium hover:underline">Editar</Link>
                      )}
                   </div>
                </div>
             </div>
          ))}
       </div>
       
       {/* Loading More */}
       {isFetchingNextPage && <div className="text-center py-4 text-sm text-slate-400">Cargando más...</div>}
       
       {!hasNextPage && items.length > 0 && (
          <div className="text-center py-6 text-xs text-slate-400 border-t border-slate-50">
             Has llegado al final de la lista.
          </div>
       )}
    </div>
  );
};