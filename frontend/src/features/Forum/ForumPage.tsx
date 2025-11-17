import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LuMessageSquare, LuUser } from 'react-icons/lu';

// Hooks
import { useAuth } from "@/app/context/AuthContext";
import { usePublications, useCreatePublication } from '@/features/Forum/forum.hooks';

// Componentes Visuales
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PublicationCard, 
  CreatePostForm, 
  ForumSkeleton, 
  EmptyState, 
  ErrorState 
} from '@/features/Forum/Forum.Components';

export default function ForumPage() {
  const { user } = useAuth();
  
  // 1. Hooks de Datos
  const { data: publications = [], isLoading, isError, error, refetch } = usePublications();
  
  // 2. Hooks de Acción
  const { mutate: createPost, isPending: isCreating } = useCreatePublication();

  // Handler para crear post
  const handleCreate = (data: { titulo: string, cuerpo: string }) => {
      createPost(data, {
          onError: (err) => alert(err.message) // Feedback simple de error (ej: groserías)
      });
  };

  return (
    <div className="flex h-full bg-slate-50/50">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          
          {/* HEADER */}
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

          {/* CREAR PUBLICACIÓN (Solo si logueado) */}
          {user && (
            <CreatePostForm 
                onSubmit={handleCreate} 
                isLoading={isCreating} 
                userAvatar={user.fotoPerfilUrl} 
            />
          )}

          {/* LISTA DE PUBLICACIONES */}
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
              <ErrorState error={error} onRetry={() => refetch()} />
            ) : publications.length === 0 ? (
              <EmptyState />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
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
      </main>
    </div>
  );
}