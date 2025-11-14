import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Link } from "react-router-dom"

// UI Components (Shadcn)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { 
  LuMessageSquare, 
  LuSend, 
  LuUser, 
  LuClock, 
  LuPlus, 
  LuLoader,
  LuMessageCircle
} from "react-icons/lu"

// Layout Components
import { Sidebar } from "@/features/shared/ui/Sidebar"
import Header from "@/features/shared/ui/Header"
import UserDefault from "@/assets/img/user_default.png"

// --- TIPOS ---
interface PublicationAuthor {
  id: number
  nombre: string
  usuario: string
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

// --- API ---
const fetchPublications = async (): Promise<Publication[]> => {
  const res = await fetch(`${URL_BASE}/api/publications`,)
  
  if (!res.ok) throw new Error("No se pudieron cargar las publicaciones")
  return (await res.json()).publications
}

const createPublication = async (
  newData: NewPublicationData,
  token: string | null
): Promise<Publication> => {
  if (!token) throw new Error("No estás autenticado")
  const res = await fetch(`${URL_BASE}/api/publications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include'
    body: JSON.stringify(newData),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Error al crear la publicación")
  return data.publication
}

// --- VARIANTS DE ANIMACIÓN ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", stiffness: 50 } 
  }
}

// --- COMPONENTE PRINCIPAL (LAYOUT) ---
const ForumPage = () => {
  return (
    <div className="flex h-screen bg-slate-50/50">
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <ForumContent />
        </main>
      </div>
    </div>
  )
}

export default ForumPage

// --- CONTENIDO DEL FORO ---
const ForumContent = () => {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: publications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publications"],
    queryFn: fetchPublications,
  })

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: (data: NewPublicationData) => createPublication(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] })
    },
    onError: (err) => alert(err.message),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* --- Header de Sección --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <LuMessageSquare className="text-blue-600" /> Foro de la Comunidad
          </h1>
          <p className="text-slate-500 mt-1">
            Comparte dudas, ideas y conecta con otros estudiantes.
          </p>
        </div>
        
        {/* Link rápido a Mis Publicaciones */}
        <Link to="/my-publications">
          <Button variant="outline" className="gap-2 border-slate-200 text-slate-700">
            <LuUser className="w-4 h-4" /> Mis Publicaciones
          </Button>
        </Link>
      </div>

      {/* --- Formulario de Creación --- */}
      {user && (
        <CreatePostForm onSubmit={(data) => mutate(data)} isLoading={isCreating} />
      )}

      {/* --- Lista de Publicaciones --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Discusiones Recientes</h2>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {publications?.length || 0}
          </Badge>
        </div>

        {isLoading ? (
          <ForumSkeleton />
        ) : error ? (
          <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100 text-red-600">
            Error al cargar el foro. Intenta recargar la página.
          </div>
        ) : publications?.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4">
              <LuMessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Aún no hay discusiones</h3>
            <p className="text-slate-500">¡Sé el primero en iniciar una conversación!</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {publications?.map((post) => (
              <PublicationCard key={post.id} post={post} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// --- COMPONENTE: FORMULARIO DE CREACIÓN ---
const CreatePostForm = ({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: NewPublicationData) => void
  isLoading: boolean
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

  return (
    <motion.div layout>
      <Card className={`border-blue-100 shadow-md transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-50' : ''}`}>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4">
            {/* Input colapsado / expandido */}
            <div className="flex gap-4">
              <Avatar className="hidden md:block">
                <AvatarImage src={UserDefault} />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <Input
                  placeholder="¿Qué quieres compartir hoy?"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  className="font-medium text-lg border-transparent bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-blue-200 transition-colors px-4 py-6"
                  disabled={isLoading}
                />

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <Textarea
                        placeholder="Escribe los detalles de tu publicación..."
                        value={cuerpo}
                        onChange={(e) => setCuerpo(e.target.value)}
                        rows={4}
                        className="resize-none border-slate-200 focus:border-blue-200"
                        disabled={isLoading}
                      />
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setIsExpanded(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700 gap-2"
                          disabled={isLoading || !titulo.trim() || !cuerpo.trim()}
                        >
                          {isLoading ? <LuLoader className="animate-spin" /> : <LuSend className="w-4 h-4" />}
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

// --- COMPONENTE: TARJETA DE PUBLICACIÓN ---
const PublicationCard = ({ post }: { post: Publication }) => {
  const formattedDate = format(new Date(post.fecha), "d 'de' MMMM", { locale: es })
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200">
        <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0">
          <Avatar className="h-10 w-10 border border-slate-100">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-medium">
              {post.usuario.usuario.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1">
              {post.titulo}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700 flex items-center gap-1">
                {post.usuario.usuario}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <LuClock className="w-3 h-3" /> {formattedDate}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">
            {post.cuerpo}
          </p>
        </CardContent>
        
        {/* Optional Footer for actions like Like/Comment in future */}
        {/* <CardFooter className="pt-0 border-t bg-slate-50/50 p-3"> ... </CardFooter> */}
      </Card>
    </motion.div>
  )
}

// --- SKELETON LOADING ---
const ForumSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 border rounded-xl bg-white space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    ))}
  </div>
)