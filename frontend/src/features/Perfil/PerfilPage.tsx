import React from "react";
import { motion } from "framer-motion";

// Hooks
import { useProfile } from "@/features/Perfil/perfil.hooks";

// Componentes UI del Perfil
import { 
  ProfileHero, 
  ProfileField, 
  ProfileStatsCard, 
  ProfileSkeleton,
  ReviewsList,
  EmptyReviews 
} from "@/features/Perfil/Perfil.Components";

// Componente de Publicaciones (Módulo Independiente)
import MyPublicationsFeed from "@/features/Perfil/MyPublicationsFeed";

// UI Genérica
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LuInfo, LuMapPin, LuPhone, LuLayoutGrid, LuStar } from "react-icons/lu";
import { Skeleton } from "@/components/ui/skeleton";

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
  // Consumimos el hook principal del perfil
  const {
    user,
    isLoadingProfile,
    reviewData,
    isLoadingReviews,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saveProfile,
    isSaving,
    uploadPhoto,
    isUploadingPhoto
  } = useProfile();

  // Estado de carga inicial
  if (isLoadingProfile) return <ProfileSkeleton />;
  
  // Si no hay usuario (por error o logout), no renderizamos nada (o podrías redirigir)
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto pb-8 px-4 md:px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* 1. SECCIÓN HERO (Portada, Avatar y Acciones Principales) */}
        <motion.div variants={itemVariants}>
          <ProfileHero 
            user={user} 
            isEditing={isEditing} 
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            onSave={() => saveProfile(formData)}
            isUploadingPhoto={isUploadingPhoto}
            onUploadPhoto={uploadPhoto}
          />
        </motion.div>

        {/* GRID DE CONTENIDO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. COLUMNA IZQUIERDA (Información y Stats) */}
          <motion.div variants={itemVariants} className="space-y-6">
            
            {/* Tarjeta de Datos Personales */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <LuInfo className="text-blue-500" /> Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileField 
                  label="Nombre Completo" 
                  value={formData.nombre || user.nombre || "No especificado"} 
                  canEdit={isEditing} 
                  editComponent={
                    <Input 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                      className="bg-white"
                    />
                  } 
                />
                <Separator />
                {/* El usuario (handle) no suele ser editable para mantener integridad de enlaces */}
                <ProfileField 
                  label="Nombre de Usuario" 
                  value={formData.usuario || user.usuario || "No especificado"} 
                  canEdit={false} 
                  editComponent={<Input value={formData.usuario} disabled className="bg-slate-50" />} 
                />
                <Separator />
                <ProfileField 
                  label="Campus" 
                  icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                  value={formData.campus || "No registrado"} 
                  canEdit={isEditing} 
                  editComponent={
                    <div className="relative w-full">
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none" 
                        value={formData.campus || ""} 
                        onChange={(e) => setFormData({...formData, campus: e.target.value})}
                      >
                        <option value="" disabled>Selecciona tu campus</option>
                        <option value="San Francisco">San Francisco</option>
                        <option value="San Juan Pablo II">San Juan Pablo II</option>
                        <option value="Norte">Norte</option>
                      </select>
                      {/* Flecha personalizada para el select si quisieras */}
                    </div>
                  } 
                />
                <Separator />
                <ProfileField 
                  label="Teléfono" 
                  icon={<LuPhone className="w-4 h-4 text-slate-400" />} 
                  value={formData.telefono || "No registrado"} 
                  canEdit={isEditing} 
                  editComponent={
                    <Input 
                      value={formData.telefono || ""} 
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                      placeholder="+56 9..." 
                      className="bg-white"
                    />
                  } 
                />
                <Separator />
                <ProfileField 
                  label="Dirección" 
                  icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                  value={formData.direccion || "No registrada"} 
                  canEdit={isEditing} 
                  editComponent={
                    <Input 
                      value={formData.direccion || ""} 
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                      placeholder="Ej: Av. Alemania 123" 
                      className="bg-white"
                    />
                  } 
                />
              </CardContent>
            </Card>

            {/* Tarjeta de Estadísticas */}
            <ProfileStatsCard user={user} />
          </motion.div>

          {/* 3. COLUMNA DERECHA (Tabs de Contenido) */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Tabs defaultValue="publications" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-white border border-slate-200 shadow-sm w-full justify-start p-1 h-auto">
                  <TabsTrigger 
                    value="publications" 
                    className="flex-1 md:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2"
                  >
                    <LuLayoutGrid className="w-4 h-4 mr-2" /> Mis Publicaciones
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="flex-1 md:flex-none data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 py-2"
                  >
                    <LuStar className="w-4 h-4 mr-2" /> Valoraciones
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB: PUBLICACIONES */}
              <TabsContent value="publications" className="mt-0">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[400px]"
                >
                  {/* Componente Modularizado: Feed de Publicaciones */}
                  {/* Nota: Este componente ya maneja su propio estado de carga y errores */}
                  <MyPublicationsFeed />
                </motion.div>
              </TabsContent>

              {/* TAB: RESEÑAS */}
              <TabsContent value="reviews" className="mt-0">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">Lo que dicen de ti</h3>
                    {reviewData?.stats && (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                        Promedio: {reviewData.stats.promedio} ★ ({reviewData.stats.total})
                      </Badge>
                    )}
                  </div>

                  {isLoadingReviews ? (
                    <div className="space-y-4">
                       <Skeleton className="h-20 w-full bg-slate-50" />
                       <Skeleton className="h-20 w-full bg-slate-50" />
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