import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// UI Genérica
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LuInfo, LuMapPin, LuPhone, LuLayoutGrid, LuStar, LuMessageCircle, LuGhost } from "react-icons/lu";

// --- LÓGICA (Hooks Unificados) ---
import { useProfile } from "@/features/Perfil/perfil.hooks";
import { useContactSeller } from "@/features/Marketplace/home.hooks"; 

// --- COMPONENTES UI UNIFICADOS ---
import { 
  ProfileHero, 
  ProfileField, 
  ProfileStatsCard, 
  ProfileSkeleton,
  ReviewsList,
  EmptyReviews 
} from "@/features/Perfil/Perfil.Components";

// --- COMPONENTE DE PUBLICACIONES INDEPENDIENTE ---
import MyPublicationsFeed from "@/features/Perfil/MyPublicationsFeed";

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export default function PerfilPage() {
  const { id } = useParams<{ id: string }>(); // Leemos ID de la URL (si existe)
  const navigate = useNavigate();
  const { startTransaction } = useContactSeller();

  // 1. Hook Principal de Perfil
  // Este hook ya determina si es "mi perfil" o "perfil público" basado en el ID
  const {
    user,
    isLoadingProfile,
    isErrorProfile,
    reviewData,
    isLoadingReviews,
    
    isOwnProfile, // boolean clave
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    
    saveProfile,
    isSaving,
    uploadPhoto,
    isUploadingPhoto
  } = useProfile(id);

  // 2. Estados de Carga / Error
  if (isLoadingProfile) return <ProfileSkeleton />;
  
  if (isErrorProfile || !user) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
      <div className="p-4 bg-slate-50 rounded-full mb-4">
         <LuGhost size={40} className="text-slate-300" />
      </div>
      <h2 className="text-xl font-semibold text-slate-700">Usuario no encontrado</h2>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  // 3. Acción de Contacto (Solo para perfiles ajenos)
  const handleContact = async () => {
    // Iniciar chat vacío o con un producto dummy si tu lógica lo requiere
    // Aquí asumimos que vas al chat directo con el usuario
    navigate('/chats', { state: { toUser: user } }); 
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* HERO SECTION */}
        <motion.div variants={itemVariants}>
          <ProfileHero 
            user={user} 
            isEditing={isEditing} 
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            onSave={() => saveProfile(formData)}
            isUploadingPhoto={isUploadingPhoto}
            onUploadPhoto={uploadPhoto}
            readOnly={!isOwnProfile} // Oculta botones de edición si no es mi perfil
          />
          
          {/* Botón Contactar (Visible solo si NO es mi perfil) */}
          {!isOwnProfile && (
             <div className="flex justify-end mt-4 px-2">
                <Button onClick={handleContact} className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-md transition-all active:scale-95">
                   <LuMessageCircle size={18} /> Contactar a @{user.usuario}
                </Button>
             </div>
          )}
        </motion.div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: INFO & STATS */}
          <motion.div variants={itemVariants} className="space-y-6">
            
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <LuInfo className="text-blue-500" /> Información {isOwnProfile ? 'Personal' : 'Pública'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileField 
                  label="Nombre Completo" 
                  value={isOwnProfile || isEditing ? (formData.nombre || user.nombre) : user.nombre} 
                  canEdit={isEditing} 
                  editComponent={
                    <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="bg-white" />
                  } 
                />
                <Separator />
                <ProfileField 
                  label="Nombre de Usuario" 
                  value={user.usuario} 
                  canEdit={false} // Usuario no editable aquí
                  editComponent={<Input value={user.usuario} disabled className="bg-slate-50" />} 
                />
                <Separator />
                <ProfileField 
                  label="Campus" 
                  icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                  value={isOwnProfile || isEditing ? (formData.campus || user.campus || "No registrado") : (user.campus || "No registrado")} 
                  canEdit={isEditing} 
                  editComponent={
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-blue-500" 
                      value={formData.campus || ""} 
                      onChange={(e) => setFormData({...formData, campus: e.target.value})}
                    >
                      <option value="San Francisco">San Francisco</option>
                      <option value="San Juan Pablo II">San Juan Pablo II</option>
                      <option value="Norte">Norte</option>
                    </select>
                  } 
                />
                
                {/* Datos Privados (Solo visibles para el dueño) */}
                {isOwnProfile && (
                  <>
                    <Separator />
                    <ProfileField 
                        label="Teléfono" icon={<LuPhone className="w-4 h-4 text-slate-400" />} 
                        value={formData.telefono || "No registrado"} canEdit={isEditing} 
                        editComponent={<Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />} 
                    />
                    <Separator />
                    <ProfileField 
                        label="Dirección" icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                        value={formData.direccion || "No registrada"} canEdit={isEditing} 
                        editComponent={<Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} />} 
                    />
                  </>
                )}
                
                {!isOwnProfile && (
                   <div className="pt-2 text-xs text-slate-400 italic text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      🔒 Los datos de contacto son privados.
                   </div>
                )}
              </CardContent>
            </Card>

            <ProfileStatsCard user={user} />
          </motion.div>

          {/* COLUMNA DERECHA: TABS */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Tabs defaultValue="publications" className="w-full">
              <div className="flex items-center justify-between mb-4 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-1">
                  <TabsTrigger 
                    value="publications" 
                    className="flex-1 md:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2 rounded-lg transition-all"
                  >
                    <LuLayoutGrid className="w-4 h-4 mr-2" /> Publicaciones
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="flex-1 md:flex-none data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 py-2 rounded-lg transition-all"
                  >
                    <LuStar className="w-4 h-4 mr-2" /> Valoraciones
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: PUBLICACIONES (Feed Independiente) */}
              <TabsContent value="publications" className="mt-0 focus-visible:ring-0">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[400px]"
                >
                  <MyPublicationsFeed 
                      authorId={String(user.id)} // Filtra por este usuario
                      // El componente interno decidirá si mostrar botones de edición basado en si es el usuario logueado
                  />
                </motion.div>
              </TabsContent>

              {/* TAB 2: RESEÑAS */}
              <TabsContent value="reviews" className="mt-0 focus-visible:ring-0">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-3">
                    <h3 className="text-lg font-semibold text-slate-800">
                        Opiniones sobre {isOwnProfile ? 'ti' : user.nombre}
                    </h3>
                    {reviewData?.stats && (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                        {reviewData.stats.promedio} ★ ({reviewData.stats.total} opiniones)
                      </Badge>
                    )}
                  </div>

                  {isLoadingReviews ? (
                    <div className="space-y-4">
                       <Skeleton className="h-24 w-full rounded-lg" />
                       <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                  ) : reviewData && reviewData.reviews.length > 0 ? (
                    <ReviewsList reviews={reviewData.reviews} />
                  ) : (
                    <EmptyReviews />
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