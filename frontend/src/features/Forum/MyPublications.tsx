import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Link } from "react-router-dom"

// UI Components (Shadcn)
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Icons
import {
  LuPencil,
  LuTrash2,
  LuPlus,
  LuX,
  LuSave,
  LuLoader,
  LuCalendar,
  LuEye,
  LuFileText,
} from "react-icons/lu"

// --- TIPOS ---
interface Publication {
  id: number
  titulo: string
  cuerpo: string
  fecha: string
  estado: string
  visto: boolean
  usuario: { id: number; nombre: string; usuario: string }
}

interface UpdatePublicationData {
  id: number
  titulo: string
  cuerpo: string
}

const URL_BASE = import.meta.env.VITE_API_URL;

// --- API FETCHERS ---

const fetchMyPublications = async (token: string | null, userId: number | undefined): Promise<Publication[]> => {
  if (!token || !userId) return []

  // Intentamos obtener todas y filtrar en cliente (temporal hasta que el backend soporte ?userId=X)
  // Lo ideal sería un endpoint: GET /api/publications/me
  const res = await fetch(`${URL_BASE}/api/publications?limit=100`, {
    headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
    },
    credentials: 'include'
  })

  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al cargar publicaciones");
  }
  
  const data = await res.json()
  
  // Filtrar manualmente las que pertenecen al usuario logueado
  const allPubs: Publication[] = data.publications || [];
  return allPubs.filter(p => p.usuario.id === userId);
}

const deletePublication = async (id: number, token: string | null) => {
  if (!token) throw new Error("No autorizado")
  
  const res = await fetch(`${URL_BASE}/api/publications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  })
  
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al eliminar");
  }
  return await res.json()
}

const updatePublication = async (data: UpdatePublicationData, token: string | null) => {
  if (!token) throw new Error("No autorizado")
  
  const res = await fetch(`${URL_BASE}/api/publications/${data.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ titulo: data.titulo, cuerpo: data.cuerpo }),
  })
  
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al actualizar");
  }
  return await res.json()
}

// --- ANIMACIONES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }
}

// --- COMPONENTE PRINCIPAL ---
const MyPublicationsPage = () => {
  return (
    <div className="flex h-full bg-slate-50/50">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
        <MyPublicationsContent />
      </main>
    </div>
  )
}

export default MyPublicationsPage

// --- CONTENIDO ---
const MyPublicationsContent = () => {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)

  // 1. Query
  const {
    data: publications = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["my-publications", user?.id],
    queryFn: () => fetchMyPublications(token, user?.id),
    enabled: !!user && !!token,
    retry: 1
  })

  // 2. Mutation Delete
  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deletePublication(id, token),
    onSuccess: (_, id) => {
      // Optimistic remove from UI
      queryClient.setQueryData(["my-publications", user?.id], (old: Publication[] | undefined) => 
         old ? old.filter(p => p.id !== id) : []
      );
      queryClient.invalidateQueries({ queryKey: ["publications"] }); // Refresh global forum
    },
    onError: (err) => alert(`Error: ${err.message}`),
  })

  // 3. Mutation Update
  const { mutate: handleUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdatePublicationData) => updatePublication(data, token),
    onSuccess: (updatedResp) => {
      // Close editing mode
      setEditingId(null);
      // Invalidate to refresh data
      queryClient.invalidateQueries({ queryKey: ["my-publications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
    onError: (err) => alert(`Error al actualizar: ${err.message}`),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LuFileText className="text-blue-600" /> Mis Publicaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona el contenido que has compartido con la comunidad.
          </p>
        </div>
        
        <Link to="/forums">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-sm hover:shadow-md transition-all">
            <LuPlus className="w-4 h-4" /> Nueva Publicación
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="space-y-4">
          {isLoading ? (
            <MyPublicationsSkeleton />
          ) : isError ? (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100 text-red-600">
              <p>No se pudieron cargar tus publicaciones.</p>
              <p className="text-xs opacity-75 mt-1">{(error as Error)?.message}</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4">
                <LuFileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No tienes publicaciones aún</h3>
              <p className="text-slate-500 mb-6 text-sm">Comparte algo interesante con la comunidad hoy.</p>
              <Link to="/forums">
                <Button variant="outline">Ir al Foro</Button>
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {publications.map((post) => (
                  <EditablePublicationCard
                    key={post.id}
                    post={post}
                    isEditing={editingId === post.id}
                    onEditStart={() => setEditingId(post.id)}
                    onEditCancel={() => setEditingId(null)}
                    onSave={(data) => handleUpdate(data)}
                    onDelete={() => handleDelete(post.id)}
                    isProcessing={isDeleting || isUpdating}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
      </div>
    </div>
  )
}

// --- COMPONENTE TARJETA ---
const EditablePublicationCard = ({
  post,
  isEditing,
  onEditStart,
  onEditCancel,
  onSave,
  onDelete,
  isProcessing,
}: {
  post: Publication
  isEditing: boolean
  onEditStart: () => void
  onEditCancel: () => void
  onSave: (data: UpdatePublicationData) => void
  onDelete: () => void
  isProcessing: boolean
}) => {
  const [titulo, setTitulo] = useState(post.titulo)
  const [cuerpo, setCuerpo] = useState(post.cuerpo)

  // Reset form when editing is cancelled
  useEffect(() => {
    if (!isEditing) {
      setTitulo(post.titulo)
      setCuerpo(post.cuerpo)
    }
  }, [isEditing, post])

  const dateObj = new Date(post.fecha);
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? format(dateObj, "d 'de' MMM, yyyy • HH:mm", { locale: es })
    : "Fecha desconocida";

  return (
    <motion.div 
        layout
        variants={itemVariants} 
        exit="exit" 
        className="relative"
    >
      <Card
        className={`transition-all duration-300 border-slate-200 group ${
          isEditing ? "ring-2 ring-blue-100 border-blue-300 shadow-md" : "hover:shadow-md bg-white"
        }`}
      >
        <CardContent className="p-6">
          
          {!isEditing ? (
            // --- MODO VISTA ---
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={`${
                      post.visto
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {post.visto ? (
                      <span className="flex items-center gap-1"><LuEye className="w-3 h-3" /> Visto</span>
                    ) : (
                      "Nuevo"
                    )}
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <LuCalendar className="w-3 h-3" /> {formattedDate}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">{post.titulo}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                    {post.cuerpo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:flex-col sm:border-l sm:pl-4 sm:border-slate-100 self-start shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditStart}
                  disabled={isProcessing}
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8"
                  title="Editar"
                >
                  <LuPencil className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                      title="Eliminar"
                    >
                      {isProcessing ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuTrash2 className="w-4 h-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se borrará permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            // --- MODO EDICIÓN ---
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <h3 className="font-semibold text-blue-700 flex items-center gap-2 text-sm">
                  <LuPencil className="w-4 h-4" /> Editando Publicación
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Título</label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white font-medium border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contenido</label>
                  <Textarea
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white min-h-[100px] resize-none border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEditCancel}
                  disabled={isProcessing}
                  className="text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSave({ id: post.id, titulo, cuerpo })}
                  disabled={isProcessing || !titulo.trim() || !cuerpo.trim()}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {isProcessing ? <LuLoader className="w-3 h-3 animate-spin" /> : <LuSave className="w-3 h-3" />}
                  Guardar
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- SKELETON ---
const MyPublicationsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 border border-slate-200 rounded-xl bg-white space-y-3 shadow-sm">
        <div className="flex justify-between gap-4">
          <div className="space-y-3 w-full">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
          <div className="flex flex-col gap-2 border-l border-slate-100 pl-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
)