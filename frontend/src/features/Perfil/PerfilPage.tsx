import React from "react";
import { useParams, useNavigate } from "react-router-dom"; // Importamos useParams
import { motion } from "framer-motion";

// Hooks
import { useProfile } from "@/features/Perfil/perfil.hooks";
import { useContactSeller } from "@/features/Marketplace/home.hooks"; // Para botón contactar

// Componentes UI
import { 
  ProfileHero, 
  ProfileField, 
  ProfileStatsCard, 
  ProfileSkeleton,
  ReviewsList,
  EmptyReviews 
} from "@/features/Perfil/Perfil.Components";
import MyPublicationsFeed from "@/features/Perfil/MyPublicationsFeed";

// UI Genérica
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LuInfo, LuMapPin, LuPhone, LuLayoutGrid, LuStar, LuMessageCircle, LuGhost } from "react-icons/lu";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export default function PerfilPage() {
  const { id } = useParams<{ id: string }>(); // Leemos ID de la URL
  const navigate = useNavigate();
  const { startTransaction } = useContactSeller();

  const {
    user,
    isLoadingProfile,
    isErrorProfile, // Capturamos error por si el usuario no existe
    reviewData,
    isLoadingReviews,
    isOwnProfile, // Bandera clave: ¿Soy yo o es otro?
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    saveProfile,
    isSaving,
    uploadPhoto,
    isUploadingPhoto
  } = useProfile(id); // Pasamos el ID al hook

  if (isLoadingProfile) return <ProfileSkeleton />;
  
  if (isErrorProfile || !user) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
      <LuGhost size={48} className="mb-4 opacity-50" />
      <h2 className="text-xl font-semibold">Usuario no encontrado</h2>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  // Acción para contactar (solo si no es mi perfil)
  const handleContact = async () => {
    const result = await startTransaction(user.id); // Aquí idealmente iniciarías chat sin producto específico o con uno dummy
    // Nota: Tu sistema de chat actual requiere un producto para iniciar transacción. 
    // Si quieres chat libre, deberías navegar directo al chat pasando el usuario.
    navigate('/chats', { state: { toUser: user } }); 
  };

  return (
    <div className="max-w-5xl mx-auto pb-8 px-4 md:px-6">
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
            readOnly={!isOwnProfile}
            // Deshabilitamos acciones de edición si no es mi perfil
            // ProfileHero debe estar preparado para ocultar el botón de editar si !isOwnProfile
            // (Ver abajo el pequeño ajuste sugerido a ProfileHero si no lo tiene)
          />
          
          {/* Botón de Contactar (Solo visible en perfil ajeno) */}
          {!isOwnProfile && (
             <div className="flex justify-end mt-4 px-2">
                <Button onClick={handleContact} className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-md">
                   <LuMessageCircle size={18} /> Contactar a @{user.usuario}
                </Button>
             </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA */}
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
                  canEdit={isEditing} // Solo editable si estoy en modo edición (que solo se activa si es mi perfil)
                  editComponent={
                    <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="bg-white" />
                  } 
                />
                <Separator />
                <ProfileField 
                  label="Campus" 
                  icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                  value={isOwnProfile || isEditing ? (formData.campus || user.campus || "No registrado") : (user.campus || "No registrado")} 
                  canEdit={isEditing} 
                  editComponent={
                    <select className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={formData.campus || ""} onChange={(e) => setFormData({...formData, campus: e.target.value})}>
                      <option value="San Francisco">San Francisco</option>
                      <option value="San Juan Pablo II">San Juan Pablo II</option>
                      <option value="Norte">Norte</option>
                    </select>
                  } 
                />
                
                {/* Datos Privados: Solo mostrar si es mi perfil o si decides que sean públicos */}
                {isOwnProfile && (
                  <>
                    <Separator />
                    <ProfileField label="Teléfono" icon={<LuPhone className="w-4 h-4 text-slate-400" />} value={formData.telefono || "No registrado"} canEdit={isEditing} editComponent={<Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />} />
                    <Separator />
                    <ProfileField label="Dirección" icon={<LuMapPin className="w-4 h-4 text-slate-400" />} value={formData.direccion || "No registrada"} canEdit={isEditing} editComponent={<Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} />} />
                  </>
                )}
                
                {!isOwnProfile && (
                   <div className="pt-2 text-xs text-slate-400 italic text-center">
                      Los datos de contacto son privados.
                   </div>
                )}
              </CardContent>
            </Card>

            <ProfileStatsCard user={user} />
          </motion.div>

          {/* COLUMNA DERECHA */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Tabs defaultValue="publications" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-white border border-slate-200 shadow-sm w-full justify-start p-1 h-auto">
                  <TabsTrigger value="publications" className="flex-1 md:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2">
                    <LuLayoutGrid className="w-4 h-4 mr-2" /> Publicaciones
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 md:flex-none data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 py-2">
                    <LuStar className="w-4 h-4 mr-2" /> Valoraciones
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="publications" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[400px]">
                  {/* Pasamos authorId para que filtre las publicaciones de este usuario */}
                  {/* Y desactivamos 'onlyMine' si no es mi perfil para ocultar botones de edición */}
                  <MyPublicationsFeed 
                      authorId={String(user.id)} 
                      // Nota: MyPublicationsFeed debe adaptarse para aceptar props que desactiven la edición
                      // Si no lo has hecho, el componente mostrará botones de editar pero fallarán al clickear.
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">Lo que dicen de {isOwnProfile ? 'ti' : user.nombre}</h3>
                    {reviewData?.stats && (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                        Promedio: {reviewData.stats.promedio} ★ ({reviewData.stats.total})
                      </Badge>
                    )}
                  </div>
                  {isLoadingReviews ? <ProfileSkeleton /> : reviewData?.reviews.length ? <ReviewsList reviews={reviewData.reviews} /> : <EmptyReviews />}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}