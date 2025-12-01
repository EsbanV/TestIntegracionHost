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

const formatDate = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  } catch (e) {
    return "hace un momento";
  }
};

// ============================================================================
// 1. COMPONENTE: FORMULARIO DE COMENTARIOS
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
        onError: (err) => alert(err.message)
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 w-full mt-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || "Escribe un comentario..."}
        className="flex-1 bg-muted/50 border-border focus:bg-background transition-all text-sm placeholder:text-muted-foreground text-foreground"
        autoFocus={autoFocus}
        disabled={isPending}
      />
      <Button 
        type="submit" 
        size="icon" 
        variant="ghost"
        disabled={!content.trim() || isPending}
        className="text-primary hover:text-primary hover:bg-primary/10 shrink-0"
      >
        {isPending ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuSend className="w-4 h-4" />}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
          Cancelar
        </Button>
      )}
    </form>
  );
};

// ============================================================================
// 2. COMPONENTE: ITEM DE COMENTARIO
// ============================================================================
const CommentItem = ({ comment, postId }: { comment: Comment, postId: number }) => {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarImage src={comment.autor.fotoPerfilUrl} />
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
            {comment.autor.usuario.slice(0,2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-2xl px-3 py-2 relative border border-border/50">
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="font-semibold text-xs text-foreground">@{comment.autor.usuario}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{formatDate(comment.fecha)}</span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.contenido}</p>
          </div>

          <div className="flex items-center gap-4 mt-1 ml-2">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Responder
            </button>
          </div>

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

      {comment.respuestas && comment.respuestas.length > 0 && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-3">
          {comment.respuestas.map((reply) => (
            <div key={reply.id} className="flex gap-2 items-start opacity-90">
               <LuCornerDownRight className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
               <div className="bg-card border border-border rounded-xl px-3 py-2 w-full shadow-sm">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-foreground">@{reply.autor.usuario}</span>
                 </div>
                 <p className="text-xs text-muted-foreground">{reply.contenido}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. COMPONENTE: SECCIÓN DE COMENTARIOS
// ============================================================================
const CommentSection = ({ postId }: { postId: number }) => {
  const { data, isLoading, isError } = useComments(postId);

  if (isLoading) return <div className="p-4 text-center text-xs text-muted-foreground">Cargando comentarios...</div>;
  if (isError) return <div className="p-4 text-center text-xs text-destructive">Error al cargar hilos.</div>;

  const comments = data?.comments || [];

  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-6 opacity-60">
            <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
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
// 4. COMPONENTE: TARJETA DE PUBLICACIÓN
// ============================================================================
export const PublicationCard = ({ post }: { post: Publication }) => {
  const [showComments, setShowComments] = useState(false);
  const userInitial = post.usuario.usuario?.charAt(0).toUpperCase() || '?';

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden group">
        
        <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-start gap-3 space-y-0">
          <Avatar className="h-10 w-10 border border-border shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={post.usuario.fotoPerfilUrl} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer leading-tight text-base">
                        {post.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
                        @{post.usuario.usuario} • <LuClock className="w-3 h-3" /> {formatDate(post.fecha)}
                    </p>
                </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2 px-5 pl-[4.25rem]">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line break-words">
            {post.cuerpo}
          </p>
        </CardContent>

        <CardFooter className="px-5 py-3 border-t border-border bg-muted/20 flex justify-between items-center mt-2">
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setShowComments(!showComments)}
             className={`gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all ${showComments ? 'bg-primary/10 text-primary' : ''}`}
           >
             <LuMessageSquare className="w-4 h-4" />
             <span className="text-xs font-semibold">
                {showComments ? "Ocultar comentarios" : "Comentarios"}
             </span>
           </Button>
        </CardFooter>

        <AnimatePresence>
            {showComments && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-border bg-muted/10"
                >
                    <div className="px-5 py-4">
                        <div className="mb-6">
                            <CommentForm postId={post.id} />
                        </div>
                        <Separator className="my-4 bg-border" />
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
// 5. COMPONENTE: CREAR POST
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
      <Card className={`border-primary/20 shadow-sm transition-all duration-300 bg-card overflow-hidden ${isExpanded ? 'ring-2 ring-primary/20 shadow-md' : 'hover:shadow-md'}`}>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Avatar className="hidden sm:block h-10 w-10 border border-border shrink-0">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">YO</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Escribe un título interesante..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  className="font-semibold text-base border-transparent bg-muted/30 hover:bg-muted/50 focus:bg-card focus:ring-0 transition-colors px-4 py-5 h-auto rounded-xl placeholder:text-muted-foreground text-foreground"
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
                        className="resize-none border-border focus:border-primary rounded-xl bg-card placeholder:text-muted-foreground text-sm text-foreground"
                        disabled={isLoading}
                      />
                      
                      <div className="flex justify-end gap-2 pt-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsExpanded(false)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6 rounded-lg shadow-sm"
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
      <div key={i} className="p-5 border border-border rounded-xl bg-card space-y-4 shadow-sm">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2 bg-muted" />
            <Skeleton className="h-3 w-24 bg-muted/50" />
          </div>
        </div>
        <Skeleton className="h-16 w-full bg-muted rounded-lg" />
      </div>
    ))}
  </div>
);

export const EmptyState = () => (
  <div className="py-16 text-center bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
    <div className="p-4 rounded-full bg-muted mb-3">
      <LuMessageCircle className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground">El foro está en silencio</h3>
    <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">¡Sé el primero en iniciar una conversación interesante hoy!</p>
  </div>
);

export const ErrorState = ({ error, onRetry }: { error: any, onRetry: () => void }) => (
  <div className="p-6 text-center bg-destructive/10 rounded-xl border border-destructive/20 flex flex-col items-center gap-2">
    <p className="font-medium text-destructive">Algo salió mal al cargar las discusiones.</p>
    <p className="text-xs text-destructive/80">{error?.message || "Error desconocido"}</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 border-destructive/20 hover:bg-destructive/10 text-destructive">
        Intentar de nuevo
    </Button>
  </div>
);