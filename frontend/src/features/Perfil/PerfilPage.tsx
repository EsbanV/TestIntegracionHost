import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// UI Genérica
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
// Icons standarizados
import { 
  Info, MapPin, Phone, LayoutGrid, Star, 
  MessageCircle, Ghost, Mail, User, Loader2 
} from "lucide-react";

// Lógica
import { useProfile } from "@/features/Perfil/perfil.hooks";
import { useContactSeller, useFavorites } from "@/features/Marketplace/home.hooks";

// Componentes UI Perfil
import { 
  ProfileHero, 
  ProfileField, 
  ProfileStatsCard, 
  ProfileSkeleton,
  ReviewsList,
  EmptyReviews 
} from "@/features/Perfil/Perfil.Components";

// Componentes UI Marketplace
import { ProductDetailModal } from "@/features/Marketplace/Home.Components";
import MyPublicationsFeed from "@/features/Perfil/MyPublicationsFeed";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function PerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    user, isLoadingProfile, isErrorProfile, reviewData, isLoadingReviews, 
    isOwnProfile, isEditing, setIsEditing, formData, setFormData, 
    saveProfile, isSaving, uploadPhoto, isUploadingPhoto 
  } = useProfile(id);
  
  const { startTransaction } = useContactSeller();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // --- HANDLERS ---
  const handleContactUser = () => {
    navigate('/chats', { state: { toUser: user } });
  };

  const handleProductClick = (post: any) => {
    const postFull = {
      ...post,
      vendedor: user,
      imagenes: post.image ? [{ url: post.image }] : [],
      fechaAgregado: new Date().toISOString()
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

  // ✅ Validación de Teléfono (Solo Números)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setFormData({ ...formData, telefono: val });
    }
  };

  if (isLoadingProfile) return <ProfileSkeleton />;
  
  if (isErrorProfile || !user) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Ghost size={40} className="mb-4 opacity-50" />
      <h2 className="text-xl font-semibold text-foreground">Usuario no encontrado</h2>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
    </div>
  );

  return (
    // Quitamos bg-background para dejar ver el patrón del body
    <div className="w-full min-h-screen text-foreground">
      <div className="max-w-6xl mx-auto pb-12 px-4 md:px-8 pt-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          
          {/* 1. HERO (Edición de usuario integrada) */}
          <ProfileHero 
            user={user} 
            isEditing={isEditing} 
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            onSave={() => saveProfile(formData)}
            isUploadingPhoto={isUploadingPhoto}
            onUploadPhoto={uploadPhoto}
            readOnly={!isOwnProfile}
            editUsername={formData.usuario}
            onEditUsernameChange={(e) => setFormData({...formData, usuario: e.target.value})}
          />

          {!isOwnProfile && (
            <div className="flex justify-end -mt-4 px-4 md:px-0">
              <Button 
                onClick={handleContactUser} 
                className="gap-2 rounded-full shadow-lg shadow-primary/20"
                size="lg"
                variant="default"
              >
                  <MessageCircle size={18} /> Enviar mensaje
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 2. SIDEBAR (Datos Personales) */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="shadow-sm border-border overflow-hidden bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wide">
                    <Info className="text-primary w-4 h-4" /> Datos de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  
                  {/* NOMBRE REAL */}
                  <ProfileField 
                    label="Nombre Completo" 
                    icon={<User className="w-3.5 h-3.5 text-muted-foreground" />}
                    value={user.nombre} 
                  />
                  <Separator className="bg-border" />

                  {/* CORREO */}
                  <ProfileField 
                    label="Correo Electrónico" 
                    icon={<Mail className="w-3.5 h-3.5 text-muted-foreground" />}
                    value={user.correo} 
                  />
                  <Separator className="bg-border" />

                  {/* TELÉFONO */}
                  <ProfileField 
                      label="Teléfono / WhatsApp" 
                      icon={<Phone className="w-3.5 h-3.5 text-muted-foreground" />} 
                      value={isEditing ? formData.telefono : (user.telefono || "No registrado")} 
                      canEdit={isEditing} 
                      editComponent={
                        <Input 
                          className="h-8 bg-background border-input"
                          value={formData.telefono} 
                          onChange={handlePhoneChange} 
                          placeholder="912345678"
                          inputMode="numeric"
                        />
                      } 
                  />
                  <Separator className="bg-border" />

                  {/* CAMPUS */}
                  <ProfileField 
                      label="Campus" 
                      icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />} 
                      value={isEditing ? formData.campus : (user.campus || "No registrado")} 
                      canEdit={isEditing} 
                      editComponent={
                        <select 
                          className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                          value={formData.campus || ""} 
                          onChange={(e) => setFormData({...formData, campus: e.target.value})}
                        >
                          <option value="San Francisco">San Francisco</option>
                          <option value="San Juan Pablo II">San Juan Pablo II</option>
                        </select>
                      } 
                  />
                  
                  <Separator className="bg-border" />
                  {/* DIRECCIÓN */}
                  <ProfileField 
                      label="Dirección (Opcional)" 
                      icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />} 
                      value={isEditing ? formData.direccion : (user.direccion || "No registrada")} 
                      canEdit={isEditing} 
                      editComponent={
                        <Input 
                          className="h-8 bg-background border-input"
                          value={formData.direccion} 
                          onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                        />
                      } 
                  />
                </CardContent>
              </Card>

              <ProfileStatsCard user={user} />
            </div>

            {/* 3. TABS (Publicaciones y Reseñas) */}
            <div className="lg:col-span-8">
              <Tabs defaultValue="publications" className="w-full">
                <TabsList className="w-full justify-start h-12 bg-muted/50 border border-border p-1 rounded-xl mb-6">
                  <TabsTrigger 
                    value="publications" 
                    className="flex-1 h-full rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" /> Publicaciones
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="flex-1 h-full rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    <Star className="w-4 h-4 mr-2" /> Valoraciones
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="publications" className="outline-none mt-0">
                  <MyPublicationsFeed 
                      authorId={String(user.id)} 
                      onProductClick={handleProductClick} 
                  />
                </TabsContent>

                <TabsContent value="reviews" className="outline-none mt-0">
                  <Card className="border-border shadow-sm bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      {isLoadingReviews ? (
                        <div className="space-y-4 text-center py-10">
                            <Loader2 className="animate-spin w-8 h-8 mx-auto text-primary" />
                            <p className="text-muted-foreground">Cargando reseñas...</p>
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

        <ProductDetailModal 
          open={!!selectedPost} 
          onClose={() => setSelectedPost(null)} 
          post={selectedPost} 
          isFavorite={favoriteIds.has(selectedPost?.id || 0)}
          onToggleFavorite={toggleFavorite}
          onContact={handleContactProduct}
        />
      </div>
    </div>
  );
}