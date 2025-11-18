import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Icons
import { 
  LuClock, LuLoader, LuSend, LuMessageSquare, 
  LuCornerDownRight, LuMessageCircle, LuUser 
} from "react-icons/lu";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Hooks & Types
import { useComments, useCreateComment } from "./forum.hooks";
import type { Publication, NewPublicationData, Comment } from "./forum.types";

const URL_BASE = import.meta.env.VITE_API_URL;

// Helper para fechas relativas (ej: "hace 5 min")
const formatDate = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  } catch (e) {
    return "hace un momento";
  }
};

// ============================================================================
// 1. COMPONENTE: FORMULARIO DE COMENTARIOS (NUEVO/RESPUESTA)
// ============================================================================
interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onCancel?: () => void;
  onSuccess?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const CommentForm = ({ postId, parentId = null, onCancel, onSuccess, placeholder, autoFocus }: CommentFormProps) => {
  const [content, setContent] = useState("");
  const { mutate: sendComment, isPending } = useCreateComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sendComment(
      { publicacionId: postId, contenido: content, parentCommentId: parentId },
      {
        onSuccess: () => {
          setContent("");
          if (onSuccess) onSuccess();
        },
        onError: (err) => alert(err.message) // Manejo simple de error
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 w-full mt-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || "Escribe un comentario..."}
        className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
        autoFocus={autoFocus}
        disabled={isPending}
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost"
        disabled={!content.trim() || isPending}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
      >
        {isPending ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuSend className="w-4 h-4" />}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs text-slate-500">
          Cancelar
        </Button>
      )}
    </form>
  );
};

// ============================================================================
// 2. COMPONENTE: ITEM DE COMENTARIO (INDIVIDUAL + RESPUESTAS)
// ============================================================================
const CommentItem = ({ comment, postId }: { comment: Comment, postId: number }) => {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0 border border-slate-100">
          <AvatarImage src={comment.autor.fotoPerfilUrl} />
          <AvatarFallback className="text-[10px] bg-slate-200">
            {comment.autor.usuario.slice(0,2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-50 rounded-2xl px-3 py-2 relative">
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="font-semibold text-xs text-slate-900">@{comment.autor.usuario}</span>
              <span className="text-[10px] text-slate-400 ml-2">{formatDate(comment.fecha)}</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.contenido}</p>
          </div>

          {/* Acciones (Responder) */}
          <div className="flex items-center gap-4 mt-1 ml-2">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              Responder
            </button>
          </div>

          {/* Formulario de Respuesta */}
          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <CommentForm 
                  postId={postId} 
                  parentId={comment.id} 
                  onCancel={() => setIsReplying(false)}
                  onSuccess={() => setIsReplying(false)}
                  placeholder={`Respondiendo a @${comment.autor.usuario}...`}
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Renderizado de Respuestas (Nivel 2) */}
      {/* Nota: El backend devuelve 'respuestas' como preview. Si hay muchas, se debería paginar, pero aquí mostramos las disponibles */}
      {comment.respuestas && comment.respuestas.length > 0 && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-slate-100 pl-3">
          {comment.respuestas.map((reply) => (
            <div key={reply.id} className="flex gap-2 items-start opacity-90">
               <LuCornerDownRight className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
               <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 w-full">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-800">@{reply.autor.usuario}</span>
                 </div>
                 <p className="text-xs text-slate-600">{reply.contenido}</p>
               </div>
            </div>
          ))}
          {/* Si hay más respuestas que las mostradas en el preview, aquí iría un botón "Ver más respuestas" */}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. COMPONENTE: SECCIÓN DE COMENTARIOS (LISTA)
// ============================================================================
const CommentSection = ({ postId }: { postId: number }) => {
  // Nota: Usamos page=1 por defecto. Podrías añadir paginación "Load More" aquí.
  const { data, isLoading, isError } = useComments(postId);

  if (isLoading) return <div className="p-4 text-center text-xs text-slate-400">Cargando comentarios...</div>;
  if (isError) return <div className="p-4 text-center text-xs text-red-400">Error al cargar hilos.</div>;

  const comments = data?.comments || [];

  return (
    <div className="space-y-5 pt-2">
      {/* Lista de Comentarios */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-6 opacity-60">
            <p className="text-sm text-slate-500">Sé el primero en comentar.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 4. COMPONENTE: TARJETA DE PUBLICACIÓN (MAIN)
// ============================================================================
export const PublicationCard = ({ post }: { post: Publication }) => {
  const [showComments, setShowComments] = useState(false);
  
  // Calculamos inicial para avatar
  const userInitial = post.usuario.usuario?.charAt(0).toUpperCase() || '?';

  return (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
    >
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white overflow-hidden">
        
        {/* HEADER POST */}
        <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-start gap-3 space-y-0">
          <Avatar className="h-10 w-10 border border-slate-100 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={post.usuario.fotoPerfilUrl} className="object-cover" />
            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer leading-tight text-base">
                        {post.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                        @{post.usuario.usuario} • <LuClock className="w-3 h-3" /> {formatDate(post.fecha)}
                    </p>
                </div>
            </div>
          </div>
        </CardHeader>
        
        {/* BODY POST */}
        <CardContent className="pb-2 px-5 pl-[4.25rem]">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">
            {post.cuerpo}
          </p>
        </CardContent>

        {/* FOOTER / ACTIONS */}
        <CardFooter className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center mt-2">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setShowComments(!showComments)}
             className={`gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all ${showComments ? 'bg-blue-50 text-blue-600' : ''}`}
           >
             <LuMessageSquare className="w-4 h-4" />
             <span className="text-xs font-semibold">
                {showComments ? "Ocultar comentarios" : "Comentarios"}
             </span>
           </Button>
           
           {/* Placeholder para Likes o Share si lo implementas después */}
           {/* <div className="flex gap-2 text-xs text-slate-400">...</div> */}
        </CardFooter>

        {/* SECCIÓN DE COMENTARIOS EXPANDIBLE */}
        <AnimatePresence>
            {showComments && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50/30"
                >
                    <div className="px-5 py-4">
                        <div className="mb-6">
                            <CommentForm postId={post.id} />
                        </div>
                        <Separator className="my-4 bg-slate-200/60" />
                        <CommentSection postId={post.id} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </Card>
    </motion.div>
  );
};

// ============================================================================
// 5. COMPONENTE: CREAR POST (OPTIMIZADO)
// ============================================================================
interface CreatePostFormProps {
  onSubmit: (data: NewPublicationData) => void;
  isLoading: boolean;
  userAvatar?: string | null;
}

export const CreatePostForm = ({ onSubmit, isLoading, userAvatar }: CreatePostFormProps) => {
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !cuerpo.trim()) return;
    onSubmit({ titulo, cuerpo });
    setTitulo("");
    setCuerpo("");
    setIsExpanded(false);
  };

  return (
    <motion.div layout className="relative z-10 mb-6">
      <Card className={`border-blue-100/50 shadow-sm transition-all duration-300 bg-white overflow-hidden ${isExpanded ? 'ring-2 ring-blue-100 shadow-md' : 'hover:shadow-md'}`}>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Avatar className="hidden sm:block h-10 w-10 border border-slate-100 shrink-0">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Escribe un título interesante..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  className="font-semibold text-base border-transparent bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-0 transition-colors px-4 py-5 h-auto rounded-xl placeholder:text-slate-400"
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
                        placeholder="Cuéntanos más detalles..."
                        value={cuerpo}
                        onChange={(e) => setCuerpo(e.target.value)}
                        rows={4}
                        className="resize-none border-slate-200 focus:border-blue-400 rounded-xl bg-white placeholder:text-slate-300 text-sm"
                        disabled={isLoading}
                      />
                      
                      <div className="flex justify-end gap-2 pt-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsExpanded(false)}
                          disabled={isLoading}
                          className="text-slate-500"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 rounded-lg shadow-sm"
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
  );
};

// ============================================================================
// 6. STATES (Skeleton, Empty, Error)
// ============================================================================
export const ForumSkeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <div key={i} className="p-5 border border-slate-200 rounded-xl bg-white space-y-4 shadow-sm">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2 bg-slate-100" />
            <Skeleton className="h-3 w-24 bg-slate-50" />
          </div>
        </div>
        <Skeleton className="h-16 w-full bg-slate-50 rounded-lg" />
      </div>
    ))}
  </div>
);

export const EmptyState = () => (
  <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
    <div className="p-4 rounded-full bg-blue-50 mb-3">
      <LuMessageCircle className="w-8 h-8 text-blue-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900">El foro está en silencio</h3>
    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">¡Sé el primero en iniciar una conversación interesante hoy!</p>
  </div>
);

export const ErrorState = ({ error, onRetry }: { error: any, onRetry: () => void }) => (
  <div className="p-6 text-center bg-red-50 rounded-xl border border-red-100 flex flex-col items-center gap-2">
    <p className="font-medium text-red-800">Algo salió mal al cargar las discusiones.</p>
    <p className="text-xs text-red-600/80">{error?.message || "Error desconocido"}</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 border-red-200 hover:bg-red-100 text-red-700">
        Intentar de nuevo
    </Button>
  </div>
);