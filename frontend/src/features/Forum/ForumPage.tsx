import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Link } from "react-router-dom"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { 
  LuMessageSquare, 
  LuSend, 
  LuUser, 
  LuClock, 
  LuLoader,
  LuMessageCircle,
  LuAlertCircle
} from "react-icons/lu"

// Assets
import UserDefault from "@/assets/img/user_default.png"

// --- TIPOS ---
interface PublicationAuthor {
  id: number
  nombre: string
  usuario: string
  fotoPerfilUrl?: string // Agregado para mostrar avatar real si existe
}

interface Publication {
  id: number
  titulo: string
  cuerpo: string
  fecha: string
  usuario: PublicationAuthor
}

interface NewPublicationData {
  titulo: string
  cuerpo: string
}

const URL_BASE = import.meta.env.VITE_API_URL;

// --- API FETCHERS ---

const fetchPublications = async (): Promise<Publication[]> => {
  const res = await fetch(`${URL_BASE}/api/publications`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' 
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al cargar publicaciones");
  }
  
  const data = await res.json();
  // Aseguramos devolver un array, incluso si el backend falla en paginación
  return data.publications || [];
}

const createPublication = async (
  newData: NewPublicationData,
  token: string | null
): Promise<Publication> => {
  if (!token) throw new Error("No estás autenticado");
  
  const res = await fetch(`${URL_BASE}/api/publications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(newData),
  });
  
  const data = await res.json();
  if (!res.ok) {
    // Manejo específico de errores de validación (array de errores)
    if (data.errors && Array.isArray(data.errors)) {
        throw new Error(data.errors.map((e: any) => e.msg).join(', '));
    }
    throw new Error(data.message || "Error al crear la publicación");
  }
  
  return data.publication;
}

// --- ANIMACIONES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

// --- PÁGINA PRINCIPAL ---
export default function ForumPage() {
  return (
    <div className="flex h-full bg-slate-50/50">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
        <ForumContent />
      </main>
    </div>
  )
}

// --- CONTENIDO DEL FORO ---
const ForumContent = () => {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: publications = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["publications"],
    queryFn: fetchPublications,
    retry: 1
  })

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: (data: NewPublicationData) => createPublication(data, token),
    onSuccess: (newPost) => {
      // Actualización optimista: Agregamos el post al inicio de la lista
      queryClient.setQueryData(["publications"], (old: Publication[] | undefined) => {
        return old ? [newPost, ...old] : [newPost];
      });
      // Invalidamos para asegurar consistencia en background
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
    onError: (err: Error) => {
        alert(err.message); // O usar un toast si tienes
    },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LuMessageSquare className="text-blue-600" /> Foro Comunitario
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Espacio para dudas, debates y colaboración estudiantil.
          </p>
        </div>
        
        <Link to="/mis-foros">
          <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-700 hover:bg-white shadow-sm">
            <LuUser className="w-4 h-4" /> Mis Publicaciones
          </Button>
        </Link>
      </div>

      {/* Crear Publicación */}
      {user && (
        <CreatePostForm onSubmit={(data) => mutate(data)} isLoading={isCreating} userAvatar={user.fotoPerfilUrl} />
      )}

      {/* Lista */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Discusiones Recientes</h2>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
            {publications.length} posts
          </Badge>
        </div>

        {isLoading ? (
          <ForumSkeleton />
        ) : isError ? (
          <div className="p-6 text-center bg-red-50 rounded-xl border border-red-100 text-red-600 flex flex-col items-center gap-2">
            <LuAlertCircle className="w-8 h-8 opacity-50" />
            <p className="font-medium">No se pudieron cargar las discusiones.</p>
            <p className="text-xs opacity-80">{(error as Error)?.message}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2 border-red-200 hover:bg-red-100 text-red-700">
                Reintentar
            </Button>
          </div>
        ) : publications.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4">
              <LuMessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">El foro está tranquilo...</h3>
            <p className="text-slate-500 text-sm mt-1">¡Sé el primero en iniciar una conversación interesante!</p>
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
                <PublicationCard key={post.id} post={post} />
                ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// --- FORMULARIO ---
const CreatePostForm = ({
  onSubmit,
  isLoading,
  userAvatar
}: {
  onSubmit: (data: NewPublicationData) => void
  isLoading: boolean
  userAvatar?: string | null
}) => {
  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !cuerpo.trim()) return
    onSubmit({ titulo, cuerpo })
    setTitulo("")
    setCuerpo("")
    setIsExpanded(false)
  }

  const avatarSrc = userAvatar ? 
    (userAvatar.startsWith('http') ? userAvatar : `${URL_BASE}${userAvatar}`) 
    : UserDefault;

  return (
    <motion.div layout className="relative z-10">
      <Card className={`border-blue-100 shadow-sm transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-100 shadow-md' : 'hover:shadow-md'}`}>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Avatar className="hidden sm:block h-10 w-10 border border-slate-100">
                <AvatarImage src={avatarSrc} className="object-cover" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="¿Qué quieres compartir hoy?"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  className="font-medium text-base border-transparent bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-0 focus:border-transparent transition-colors px-4 py-5 h-auto rounded-xl"
                  disabled={isLoading}
                />

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <Textarea
                        placeholder="Escribe los detalles..."
                        value={cuerpo}
                        onChange={(e) => setCuerpo(e.target.value)}
                        rows={3}
                        className="resize-none border-slate-200 focus:border-blue-400 rounded-xl bg-white"
                        disabled={isLoading}
                      />
                      
                      <div className="flex justify-end gap-2 pt-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsExpanded(false)}
                          disabled={isLoading}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 gap-2 px-4 rounded-lg"
                          disabled={isLoading || !titulo.trim() || !cuerpo.trim()}
                        >
                          {isLoading ? <LuLoader className="animate-spin w-4 h-4" /> : <LuSend className="w-3.5 h-3.5" />}
                          Publicar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
    </motion.div>
  )
}

// --- TARJETA POST ---
const PublicationCard = ({ post }: { post: Publication }) => {
  const dateObj = new Date(post.fecha);
  const isValidDate = !isNaN(dateObj.getTime());
  const formattedDate = isValidDate 
    ? format(dateObj, "d 'de' MMM", { locale: es })
    : "Fecha desconocida";
  
  const userInitial = post.usuario.usuario ? post.usuario.usuario.charAt(0).toUpperCase() : '?';

  return (
    <motion.div 
        layout
        variants={itemVariants}
        initial="hidden" 
        animate="visible" 
        exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="hover:shadow-md transition-all duration-200 border-slate-200 group bg-white">
        <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-start gap-3 space-y-0">
          <Avatar className="h-9 w-9 border border-slate-100 shrink-0 mt-1">
            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold text-xs">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                {post.titulo}
                </h3>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-1 rounded-full ml-2">
                    <LuClock className="w-3 h-3" /> {formattedDate}
                </span>
            </div>
            
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Por <span className="text-slate-700">@{post.usuario.usuario}</span>
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="pb-5 px-5 pl-[3.75rem]">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {post.cuerpo}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- SKELETON ---
const ForumSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-slate-100" />
            <Skeleton className="h-3 w-32 bg-slate-50" />
          </div>
        </div>
        <Skeleton className="h-12 w-full bg-slate-50 ml-12 rounded-lg" />
      </div>
    ))}
  </div>
)