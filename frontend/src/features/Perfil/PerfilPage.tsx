import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// UI Genérica
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LuInfo, LuMapPin, LuPhone, LuLayoutGrid, LuStar, LuMessageCircle, LuGhost, LuMail, LuLoader } from "react-icons/lu";

// Lógica
import { useProfile } from "@/features/Perfil/perfil.hooks";
import { useContactSeller, useFavorites } from "@/features/Marketplace/home.hooks"; // Reutilizamos hooks del home

// Componentes UI Perfil
import { 
  ProfileHero, 
  ProfileField, 
  ProfileStatsCard, 
  ProfileSkeleton,
  ReviewsList,
  EmptyReviews 
} from "@/features/Perfil/Perfil.Components";

// Componentes UI Marketplace (Reutilizados para ver detalles)
import { ProductDetailModal } from "@/features/Marketplace/Home.Components";
import MyPublicationsFeed from "@/features/Perfil/MyPublicationsFeed";

// --- ANIMACIONES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function PerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Hooks de lógica
  const { user, isLoadingProfile, isErrorProfile, reviewData, isLoadingReviews, isOwnProfile, isEditing, setIsEditing, formData, setFormData, saveProfile, isSaving, uploadPhoto, isUploadingPhoto } = useProfile(id);
  const { startTransaction } = useContactSeller();
  const { favoriteIds, toggleFavorite } = useFavorites();

  // Estado para el Modal de Detalle de Producto
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // --- HANDLERS ---
  const handleContactUser = () => {
    navigate('/chats', { state: { toUser: user } });
  };

  const handleProductClick = (post: any) => {
    // Necesitamos reconstruir el objeto 'post' para que coincida con lo que espera el Modal
    // ya que la API de perfil a veces devuelve una estructura simplificada.
    const postFull = {
      ...post,
      vendedor: user, // Asignamos el usuario actual como vendedor
      imagenes: post.image ? [{ url: post.image }] : [], // Adaptamos la imagen única a array
      fechaAgregado: new Date().toISOString() // Fallback si no viene fecha
    };
    setSelectedPost(postFull);
  };

  const handleContactProduct = async (post: any) => {
    const result = await startTransaction(post.id, user!.id);
    if (!result?.ok) {
      alert(result.message || 'No se pudo iniciar la transacción');
      return;
    }
    navigate('/chats', { state: { toUser: user, transactionId: result.transactionId } });
    setSelectedPost(null);
  };

  if (isLoadingProfile) return <ProfileSkeleton />;
  
  if (isErrorProfile || !user) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
      <LuGhost size={40} className="mb-4 text-slate-300" />
      <h2 className="text-xl font-semibold">Usuario no encontrado</h2>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        
        {/* 1. HERO (Portada y Avatar) */}
        <ProfileHero 
          user={user} 
          isEditing={isEditing} 
          setIsEditing={setIsEditing}
          isSaving={isSaving}
          onSave={() => saveProfile(formData)}
          isUploadingPhoto={isUploadingPhoto}
          onUploadPhoto={uploadPhoto}
          readOnly={!isOwnProfile}
        />

        {/* Botón Contactar Principal */}
        {!isOwnProfile && (
          <div className="flex justify-end -mt-2">
            <Button onClick={handleContactUser} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 gap-2 px-6 rounded-full">
                <LuMessageCircle size={18} /> Enviar mensaje a {user.nombre.split(' ')[0]}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 2. SIDEBAR (Info Personal) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <LuInfo className="text-blue-500" /> Datos de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <ProfileField 
                  label="Nombre Completo" 
                  value={isEditing ? formData.nombre : user.nombre} 
                  canEdit={isEditing}
                  editComponent={<Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />}
                />
                <Separator />
                
                {/* CORREO (Visible siempre) */}
                <ProfileField 
                  label="Correo Electrónico" 
                  icon={<LuMail className="w-4 h-4 text-slate-400" />}
                  value={user.correo} 
                />
                <Separator />

                {/* TELÉFONO (Visible siempre) */}
                <ProfileField 
                    label="Teléfono / WhatsApp" 
                    icon={<LuPhone className="w-4 h-4 text-slate-400" />} 
                    value={isEditing ? formData.telefono : (user.telefono || "No registrado")} 
                    canEdit={isEditing} 
                    editComponent={<Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />} 
                />
                <Separator />

                <ProfileField 
                    label="Campus" 
                    icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                    value={isEditing ? formData.campus : (user.campus || "No registrado")} 
                    canEdit={isEditing} 
                    editComponent={
                      <select className="w-full rounded-md border border-slate-300 p-2 text-sm" value={formData.campus || ""} onChange={(e) => setFormData({...formData, campus: e.target.value})}>
                        <option value="San Francisco">San Francisco</option>
                        <option value="San Juan Pablo II">San Juan Pablo II</option>
                      </select>
                    } 
                />
                
                {/* DIRECCIÓN (Visible siempre si existe) */}
                <Separator />
                <ProfileField 
                    label="Dirección (Opcional)" icon={<LuMapPin className="w-4 h-4 text-slate-400" />} 
                    value={isEditing ? formData.direccion : (user.direccion || "No registrada")} 
                    canEdit={isEditing} 
                    editComponent={<Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} />} 
                />
              </CardContent>
            </Card>

            <ProfileStatsCard user={user} />
          </div>

          {/* 3. CONTENIDO PRINCIPAL (Tabs) */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="publications" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-white border border-slate-200 p-1 rounded-xl shadow-sm mb-6">
                <TabsTrigger value="publications" className="flex-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg font-medium">
                  <LuLayoutGrid className="w-4 h-4 mr-2" /> Publicaciones
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 h-full data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-lg font-medium">
                  <LuStar className="w-4 h-4 mr-2" /> Valoraciones
                </TabsTrigger>
              </TabsList>

              {/* FEED DE PUBLICACIONES */}
              <TabsContent value="publications" className="outline-none">
                <MyPublicationsFeed 
                    authorId={String(user.id)} 
                    onProductClick={handleProductClick} // Pasamos el handler click
                />
              </TabsContent>

              {/* RESEÑAS */}
              <TabsContent value="reviews" className="outline-none">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    {isLoadingReviews ? (
                       <div className="space-y-4 text-center py-10">
                          <LuLoader className="animate-spin w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-slate-400">Cargando reseñas...</p>
                       </div>
                    ) : reviewData && reviewData.reviews.length > 0 ? (
                      <ReviewsList reviews={reviewData.reviews} />
                    ) : (
                      <EmptyReviews />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>

      {/* MODAL DE DETALLE DEL PRODUCTO (Reutilizado del Home) */}
      <ProductDetailModal 
        open={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost} 
        isFavorite={favoriteIds.has(selectedPost?.id || 0)}
        onToggleFavorite={toggleFavorite}
        onContact={handleContactProduct}
      />
    </div>
  );
}