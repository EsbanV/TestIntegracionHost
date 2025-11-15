import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Link } from "react-router-dom"

// UI Components (Shadcn)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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

// Layout Components
import { Sidebar } from "@/features/shared/ui/Sidebar"
import Header from "@/features/shared/ui/Header"

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

// --- API ---
const fetchMyPublications = async (token: string | null, userId: number | undefined): Promise<Publication[]> => {
  if (!token || !userId) return []
  // Se asume que el backend ya filtra por userId si se le pasa el parámetro
  const res = await fetch(`${URL_BASE}/api/publications?userId=${userId}&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  })
  if (!res.ok) throw new Error("Error al cargar publicaciones")
  const data = await res.json()
  // Filtro de seguridad en cliente por si el backend devuelve todo
  return data.publications.filter((p: Publication) => p.usuario.id === userId)
}

const deletePublication = async (id: number, token: string | null) => {
  if (!token) throw new Error("No autorizado")
  const res = await fetch(`${URL_BASE}/api/publications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  })
  if (!res.ok) throw new Error("Error al eliminar")
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
  if (!res.ok) throw new Error("Error al actualizar")
  return await res.json()
}

// --- VARIANTS DE ANIMACIÓN ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 60 } },
  exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }
}

// --- COMPONENTE PRINCIPAL (LAYOUT) ---
const MyPublicationsPage = () => {
  return (
    <div className="flex h-screen bg-slate-50/50">
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <MyPublicationsContent />
        </main>
      </div>
    </div>
  )
}

export default MyPublicationsPage

// --- CONTENIDO INTERNO ---
const MyPublicationsContent = () => {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)

  // 1. Query
  const {
    data: publications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-publications", user?.id],
    queryFn: () => fetchMyPublications(token, user?.id),
    enabled: !!user && !!token,
  })

  // 2. Mutation Delete
  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deletePublication(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-publications"] })
      queryClient.invalidateQueries({ queryKey: ["publications"] }) // Actualizar foro global
    },
    onError: (err) => alert(`Error: ${err.message}`),
  })

  // 3. Mutation Update
  const { mutate: handleUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdatePublicationData) => updatePublication(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-publications"] })
      queryClient.invalidateQueries({ queryKey: ["publications"] })
      setEditingId(null)
    },
    onError: (err) => alert(`Error al actualizar: ${err.message}`),
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* --- Header de Sección --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <LuFileText className="text-blue-600" /> Mis Publicaciones
          </h1>
          <p className="text-slate-500 mt-1">
            Gestiona el contenido que has compartido con la comunidad.
          </p>
        </div>
        
        {/* Botón Nueva Publicación (lleva al foro) */}
        <Link to="/forum">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-md hover:shadow-lg transition-all">
            <LuPlus className="w-4 h-4" /> Nueva Publicación
          </Button>
        </Link>
      </div>

      {/* --- Estados de Carga / Error / Vacío --- */}
      {isLoading ? (
        <MyPublicationsSkeleton />
      ) : error ? (
        <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100 text-red-600">
          Error al cargar tus publicaciones.
        </div>
      ) : publications?.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4">
            <LuFileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No tienes publicaciones aún</h3>
          <p className="text-slate-500 mb-6">Comparte algo interesante con la comunidad hoy.</p>
          <Link to="/forums">
            <Button variant="outline">Ir al Foro</Button>
          </Link>
        </div>
      ) : (
        
        /* --- Lista de Publicaciones --- */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence>
            {publications?.map((post) => (
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
  )
}

// --- COMPONENTE: TARJETA EDITABLE ---
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

  useEffect(() => {
    if (!isEditing) {
      setTitulo(post.titulo)
      setCuerpo(post.cuerpo)
    }
  }, [isEditing, post])

  const formattedDate = format(new Date(post.fecha), "d 'de' MMMM, yyyy • HH:mm", {
    locale: es,
  })

  return (
    <motion.div variants={itemVariants} exit="exit" layout>
      <Card
        className={`transition-all duration-300 border-slate-200 ${
          isEditing ? "ring-2 ring-blue-500/20 border-blue-200 shadow-md" : "hover:shadow-md"
        }`}
      >
        <CardContent className="p-6">
          
          {/* --- MODO VISUALIZACIÓN --- */}
          {!isEditing ? (
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Metadata Badges */}
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

                {/* Título y Cuerpo */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{post.titulo}</h3>
                  <p className="text-slate-600 leading-relaxed line-clamp-2">
                    {post.cuerpo}
                  </p>
                </div>
              </div>

              {/* Acciones (Botones) */}
              <div className="flex items-center gap-2 sm:flex-col sm:border-l sm:pl-4 sm:border-slate-100 self-start">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditStart}
                  disabled={isProcessing}
                  className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  title="Editar"
                >
                  <LuPencil className="w-5 h-5" />
                </Button>

                {/* Alerta de Confirmación para Borrar (Shadcn) */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      {isProcessing ? (
                        <LuLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <LuTrash2 className="w-5 h-5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Eliminará permanentemente tu publicación.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            
            /* --- MODO EDICIÓN --- */
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
                <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                  <LuPencil /> Editando Publicación
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase">Título</label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase">Contenido</label>
                  <Textarea
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={onEditCancel}
                  disabled={isProcessing}
                >
                  <LuX className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button
                  onClick={() => onSave({ id: post.id, titulo, cuerpo })}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <LuLoader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LuSave className="w-4 h-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- SKELETON LOADING ---
const MyPublicationsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 border border-slate-200 rounded-xl bg-white space-y-4 shadow-sm">
        <div className="flex justify-between">
          <div className="space-y-3 w-full">
            <div className="flex gap-3">
              <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-2 pl-4 border-l border-slate-100">
            <div className="h-8 w-8 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-8 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
)