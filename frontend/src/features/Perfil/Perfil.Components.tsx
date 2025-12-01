import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { getImageUrl } from "@/app/imageHelper";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// UI Shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Icons (Lucide React estandarizado)
import { 
  Pencil, Save, Mail, Calendar, Star, ShieldCheck,
  Camera, Loader2, Ghost, ShoppingBag, Eye, User
} from "lucide-react";

import type { Review, UserProfile } from "./perfil.types";
import { formatCLP } from "@/utils/format"; 

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 1. ATOMS & UTILS
// ============================================================================

export const ProfileField = ({ label, value, icon, canEdit = false, editComponent }: { label: string, value: string, icon?: React.ReactNode, canEdit?: boolean, editComponent?: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
      {icon} {label}
    </Label>
    <div className="min-h-[2.25rem] flex items-center">
      <AnimatePresence mode="wait">
        {canEdit && editComponent ? (
          <motion.div 
            key="editing" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }} 
            className="w-full"
          >
            {editComponent}
          </motion.div>
        ) : (
          <motion.p 
            key="view" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-sm font-medium text-foreground truncate w-full"
          >
            {value}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto px-4 mt-4">
    <Skeleton className="h-48 w-full rounded-t-3xl bg-muted" />
    <div className="px-6 -mt-16 flex flex-col md:flex-row gap-6">
      <Skeleton className="h-32 w-32 rounded-full border-4 border-background bg-muted" />
      <div className="pt-4 md:pt-16 space-y-3 w-full max-w-md">
         <Skeleton className="h-8 w-3/4 bg-muted" />
         <Skeleton className="h-4 w-1/2 bg-muted" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Skeleton className="h-64 bg-muted rounded-2xl" />
        <div className="col-span-2 space-y-4">
            <Skeleton className="h-12 w-full bg-muted rounded-xl" />
            <Skeleton className="h-48 w-full bg-muted rounded-xl" />
        </div>
    </div>
  </div>
);

// ============================================================================
// 2. HERO SECTION
// ============================================================================

interface HeroProps {
  user: UserProfile;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  isUploadingPhoto: boolean;
  onUploadPhoto: (file: File) => void;
  readOnly?: boolean;
  editUsername?: string;
  onEditUsernameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileHero = ({ 
  user, isEditing, setIsEditing, readOnly = false, 
  isSaving, onSave, isUploadingPhoto, onUploadPhoto,
  editUsername, onEditUsernameChange 
}: HeroProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadPhoto(file);
  };

  return (
    <div className="relative group mb-8">
      {/* Banner con gradiente semántico */}
      <div className="h-48 w-full bg-gradient-to-r from-primary to-primary/80 rounded-t-3xl shadow-sm"></div>
      
      <Card className="relative -mt-16 mx-4 md:mx-0 border-none shadow-xl overflow-visible bg-card rounded-3xl">
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Avatar */}
            <div className="relative -mt-12 group/avatar shrink-0">
              <div className="p-1.5 bg-card rounded-full shadow-sm relative">
                <Avatar className="h-32 w-32 border-4 border-card shadow-inner bg-muted">
                  <AvatarImage src={getImageUrl(user.fotoPerfilUrl)} alt={user.usuario} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                    {user.usuario.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {!readOnly && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="text-white w-8 h-8 animate-spin" />
                    ) : (
                      <Camera className="text-white w-8 h-8" />
                    )}
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            {/* Info Header */}
            <div className="flex-1 mt-4 md:mt-2 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full max-w-lg">
                  <div className="flex items-center gap-3 mb-1 min-h-[3rem]"> 
                    {isEditing && !readOnly ? (
                        <div className="relative w-full max-w-xs">
                           <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                           <Input 
                              value={editUsername}
                              onChange={onEditUsernameChange}
                              className="text-xl font-bold pl-9 h-10 bg-muted/50 focus:bg-background border-border"
                              placeholder="Nombre de usuario"
                              autoFocus
                           />
                        </div>
                    ) : (
                        <h1 className="text-3xl font-bold text-foreground tracking-tight truncate">
                          {user.usuario}
                        </h1>
                    )}
                    
                    {!isEditing && (
                        <Badge variant="secondary" className="shrink-0 bg-muted text-muted-foreground hover:bg-muted/80">
                          {user.role}
                        </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> {user.correo}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> 
                      Miembro desde {user.fechaRegistro ? new Date(user.fechaRegistro).getFullYear() : '2024'}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                {!readOnly && (
                  <div className="flex gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                    {!isEditing ? (
                      <Button 
                        onClick={() => setIsEditing(true)} 
                        variant="outline" 
                        className="gap-2 w-full md:w-auto border-border text-foreground hover:bg-muted"
                      >
                        <Pencil className="w-4 h-4" /> Editar Perfil
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditing(false)} 
                          disabled={isSaving}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={onSave} 
                          disabled={isSaving} 
                          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" /> 
                          ) : (
                            <>
                              <Save className="w-4 h-4" /> Guardar
                            </>
                          )}
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
// 3. STATS & LISTS
// ============================================================================

export const ProfileStatsCard = ({ user }: { user: UserProfile }) => (
  // Usamos Primary para el fondo, texto en Primary Foreground (usualmente blanco)
  <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative rounded-2xl">
    {/* Decoración de fondo sutil */}
    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
      <Star size={100} />
    </div>
    
    <CardContent className="p-6 relative z-10">
      <h3 className="text-xs font-bold text-primary-foreground/80 mb-4 uppercase tracking-wider">
        Estadísticas
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
          <p className="text-2xl font-bold">{Number(user.reputacion).toFixed(1)}</p>
          <div className="flex items-center gap-1 text-primary-foreground/80 text-xs mt-1">
            <Star className="fill-current w-3 h-3" /> Reputación
          </div>
        </div>
        <div className="p-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
          <p className="text-2xl font-bold">{user.resumen?.totalVentas || user.stats?.ventas || 0}</p>
          <div className="flex items-center gap-1 text-primary-foreground/80 text-xs mt-1">
            <ShieldCheck className="w-3 h-3" /> Ventas
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ReviewsList = ({ reviews }: { reviews: Review[] }) => (
  <div className="grid gap-4">
    {reviews.map((review) => (
      <div 
        key={review.id} 
        className="flex gap-4 p-4 rounded-2xl bg-card border border-border transition-all hover:bg-muted/30 hover:shadow-sm"
      >
        <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={getImageUrl(review.calificador.fotoPerfilUrl)} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {review.calificador.nombre.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {review.calificador.nombre}
              </span>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "w-3 h-3",
                      i < Number(review.puntuacion) ? "fill-current" : "text-muted-foreground/30"
                    )} 
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(review.fecha).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            "{review.comentario}"
          </p>
          
          {review.transaccion?.producto && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[10px] font-medium border border-border">
              <ShoppingBag size={10} /> {review.transaccion.producto.nombre}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

export const EmptyReviews = () => (
  <div className="text-center py-12">
    <div className="inline-flex p-4 bg-muted rounded-full mb-3">
        <Ghost className="text-muted-foreground w-6 h-6" />
    </div>
    <p className="text-muted-foreground text-sm">Aún no hay reseñas para este usuario.</p>
  </div>
);

export const PublicationsList = ({ 
  items, isLoading, isError, hasResults, hasNextPage, isFetchingNextPage, lastPostRef, showEditButton = false, onItemClick
}: any) => {
  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {[1,2,3].map(i => <Skeleton key={i} className="h-[300px] rounded-2xl bg-muted" />)}
    </div>
  );
  
  if (isError) return (
    <div className="p-6 bg-destructive/10 text-destructive rounded-xl text-center border border-destructive/20 text-sm font-medium">
      Error al cargar publicaciones.
    </div>
  );
  
  if (!hasResults) return (
    <Card className="border-dashed border-2 border-border bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
         <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
            <Ghost size={32} className="text-muted-foreground/50" />
         </div>
         <h3 className="text-lg font-semibold text-foreground">Sin publicaciones</h3>
         <p className="text-sm">Este usuario aún no ha publicado nada.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((post: any, index: number) => (
             <motion.div 
               key={post.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.05 }}
               ref={index === items.length - 1 ? lastPostRef : null}
               className="group relative bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col"
               onClick={() => onItemClick && onItemClick(post)}
             >
                {/* Imagen */}
                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                   {post.image ? (
                     <img 
                        src={getImageUrl(post.image)} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy" 
                     />
                   ) : (
                     <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                        <ShoppingBag className="w-10 h-10 mb-2 opacity-50"/>
                        <span className="text-xs font-medium">Sin foto</span>
                     </div>
                   )}
                   
                   {/* Badge Categoría */}
                   <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur text-foreground shadow-sm border border-border font-medium">
                        {post.categoryName || "Varios"}
                      </Badge>
                   </div>
                   
                   {/* Overlay Hover */}
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                      <Button size="sm" className="bg-background text-foreground hover:bg-background/90 font-medium shadow-lg border-none">
                         <Eye className="w-4 h-4 mr-2" /> Ver Detalle
                      </Button>
                   </div>
                </div>

                {/* Contenido Texto */}
                <div className="p-4 flex flex-col flex-1">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                   </div>
                   
                   <div className="mt-auto pt-3 border-t border-border flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                            <Calendar className="w-3 h-3" /> Publicado
                        </span>
                        <span className="text-lg font-bold text-primary">
                            {formatCLP(post.price || 0)}
                        </span>
                      </div>
                      
                      {showEditButton && (
                           <Button 
                             variant="secondary" 
                             size="sm" 
                             className="h-7 text-xs px-2.5 bg-muted text-muted-foreground hover:bg-muted/80"
                             onClick={(e) => { e.stopPropagation(); }}
                             asChild
                           >
                             <Link to={`/editar/${post.id}`}>
                               <Pencil className="w-3 h-3 mr-1.5" /> Editar
                             </Link>
                           </Button>
                      )}
                   </div>
                </div>
             </motion.div>
          ))}
       </div>
       {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary w-6 h-6" />
          </div>
       )}
    </div>
  );
};