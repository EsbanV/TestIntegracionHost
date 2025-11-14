import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

// UI Components (Shadcn)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { 
  LuPencil, LuSave, LuX, LuMapPin, LuPhone, LuMail, 
  LuUser, LuCalendar, LuStar, LuShieldCheck, LuLayoutGrid,
  LuCamera, LuLoader
} from "react-icons/lu"

// Subcomponents
import MyPublicationsFeed from "./Perfil.Components/PublicationsFeed"
import UserDefault from "@/assets/img/user_default.png"

// --- TIPOS (Sin cambios) ---
interface UserProfile {
  id: number
  correo: string
  usuario: string
  nombre: string
  role: string
  campus: string | null
  reputacion: string | number
  telefono?: string
  direccion?: string
  fechaRegistro?: string
  fotoPerfilUrl?: string
  resumen?: {
    totalVentas: number
    totalProductos: number
  }
}

interface UpdateProfileData {
  usuario: string
  campus: string
  telefono: string
  direccion: string
}

const URL_BASE = import.meta.env.VITE_API_URL;

// --- API REFACTORIZADA ---
const fetchProfile = async (token: string | null): Promise<UserProfile> => {
  if (!token) throw new Error("No token")
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    credentials: 'include'
  })
  if (!res.ok) throw new Error("Error al cargar perfil")
  const data = await res.json()
  return data.data
}

const updateProfile = async (data: UpdateProfileData, token: string | null) => {
  if (!token) throw new Error("No token")
  const res = await fetch(`${URL_BASE}/api/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include', // <--- COMA AÑADIDA (Corrección de sintaxis)
    body: JSON.stringify(data),
  })
  const result = await res.json()
  if (!res.ok) throw new Error(result.message || "Error al actualizar")
  return result.user
}

const uploadProfilePhoto = async (file: File, token: string | null) => {
  if (!token) throw new Error("No token")
  
  const formData = new FormData()
  formData.append('photo', file)

  const res = await fetch(`${URL_BASE}/api/upload/profile-photo`, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}` 
      // Nota: No ponemos 'Content-Type' aquí para que el navegador ponga el multipart/form-data boundary automáticamente
    },
    credentials: 'include', // <--- COMA AÑADIDA (Corrección de sintaxis)
    body: formData,
  })
  
  const result = await res.json()
  if (!res.ok) throw new Error(result.message || "Error al subir imagen")
  return result
}

// --- VARIANTS DE ANIMACIÓN ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
}
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
}

// --- COMPONENTE PRINCIPAL ---
export default function PerfilPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UpdateProfileData>({
    usuario: "",
    campus: "",
    telefono: "",
    direccion: "",
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => fetchProfile(token),
    enabled: !!token,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        usuario: user.usuario || "",
        campus: user.campus || "Campus San Juan Pablo II",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
      })
    }
  }, [user])

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfile(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
      setIsEditing(false)
    },
    onError: (err) => alert(err.message),
  })

  const { mutate: uploadPhoto, isPending: isUploadingPhoto } = useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(file, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
    onError: (err) => alert(err.message),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadPhoto(file)
  }

  const reviews = [
    { id: 1, user: "Ana García", rating: 5, comment: "Excelente vendedor, muy rápido.", date: "Hace 2 días" },
    { id: 2, user: "Carlos M.", rating: 4, comment: "El producto estaba bien, pero demoró un poco.", date: "Hace 1 semana" },
  ]

  // --- RENDERIZADO ---
  
  return (
    <div className="max-w-5xl mx-auto pb-8">
      {isLoading ? (
        <ProfileSkeleton />
      ) : user ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* --- HERO SECTION --- */}
          <motion.div variants={itemVariants} className="relative">
            <div className="h-48 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl shadow-sm"></div>
            
            <Card className="relative -mt-16 mx-4 md:mx-0 border-none shadow-lg overflow-visible">
              <CardContent className="pt-0 pb-6 px-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  
                  {/* Avatar */}
                  <div className="relative -mt-12 group">
                    <div className="p-1.5 bg-white rounded-full shadow-sm relative">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-inner">
                        <AvatarImage 
                          src={user.fotoPerfilUrl ? `${user.fotoPerfilUrl}` : UserDefault} 
                          alt={user.usuario} 
                          className="object-cover" 
                        />
                        <AvatarFallback className="text-4xl bg-slate-100 text-slate-400">
                          {user.usuario.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingPhoto ? (
                          <LuLoader className="text-white w-8 h-8 animate-spin" />
                        ) : (
                          <LuCamera className="text-white w-8 h-8" />
                        )}
                      </div>
                      
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-green-500 h-5 w-5 rounded-full border-4 border-white" title="Online"></div>
                  </div>

                  {/* User Info */}
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
                        {!isEditing ? (
                          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 w-full md:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
                            <LuPencil className="w-4 h-4" /> Editar Perfil
                          </Button>
                        ) : (
                          <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancelar</Button>
                            <Button onClick={() => saveProfile(formData)} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                              {isSaving ? "Guardando..." : <><LuSave className="w-4 h-4" /> Guardar</>}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* --- GRID CONTENT --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN */}
            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2"><LuUser className="text-blue-500" /> Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProfileField label="Nombre" value={user.nombre} isEditing={false} editComponent={<Input value={user.nombre} disabled className="bg-slate-50" />} />
                  <Separator />
                  <ProfileField label="Campus" icon={<LuMapPin className="w-4 h-4 text-slate-400" />} value={formData.campus} isEditing={isEditing} editComponent={
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})}>
                      <option>Campus San Francisco</option>
                      <option>Campus San Juan Pablo II</option>
                      <option>Campus Menchaca Lira</option>
                    </select>
                  } />
                  <Separator />
                  <ProfileField label="Teléfono" icon={<LuPhone className="w-4 h-4 text-slate-400" />} value={formData.telefono || "No registrado"} isEditing={isEditing} editComponent={<Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} placeholder="+56 9..." />} />
                  <Separator />
                  <ProfileField label="Dirección" icon={<LuMapPin className="w-4 h-4 text-slate-400" />} value={formData.direccion || "No registrada"} isEditing={isEditing} editComponent={<Input value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Ej: Av. Alemania 123" />} />
                </CardContent>
              </Card>

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
            </motion.div>

            {/* RIGHT COLUMN */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Tabs defaultValue="publications" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="bg-white border border-slate-200 shadow-sm">
                    <TabsTrigger value="publications" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><LuLayoutGrid className="w-4 h-4 mr-2" /> Mis Publicaciones</TabsTrigger>
                    <TabsTrigger value="reviews" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"><LuStar className="w-4 h-4 mr-2" /> Valoraciones</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="publications" className="mt-0">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[400px]">
                    <MyPublicationsFeed />
                  </motion.div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-0">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Lo que dicen de ti</h3>
                    <div className="grid gap-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                          <Avatar className="h-10 w-10"><AvatarFallback className="bg-indigo-100 text-indigo-600">{review.user.charAt(0)}</AvatarFallback></Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{review.user}</span>
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (<LuStar key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-300'}`} />))}
                              </div>
                            </div>
                            <p className="text-slate-600 mt-1 text-sm">{review.comment}</p>
                            <span className="text-xs text-slate-400 mt-2 block">{review.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

// --- SUBCOMPONENTES ---
function ProfileField({ label, value, isEditing, editComponent, icon }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">{icon} {label}</Label>
      <div className="h-9 flex items-center">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="editing" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="w-full">{editComponent}</motion.div>
          ) : (
            <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-slate-900 truncate w-full">{value}</motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Skeleton className="h-48 w-full rounded-t-2xl" />
      <div className="px-6 -mt-16 flex gap-6">
        <Skeleton className="h-32 w-32 rounded-full border-4 border-white" />
        <div className="pt-16 space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-40" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full lg:col-span-2 rounded-xl" />
      </div>
    </div>
  )
}