import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LuMessageSquare, LuLayoutList } from 'react-icons/lu';

// Hooks
import { useAuth } from "@/app/context/AuthContext";
import { usePublications, useCreatePublication } from '@/features/Forum/forum.hooks';

// UI Components
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
  
  const { data: publications = [], isLoading, isError, error, refetch } = usePublications();
  const { mutate: createPost, isPending: isCreating } = useCreatePublication();

  const handleCreate = (data: { titulo: string, cuerpo: string }) => {
      createPost(data, {
          onError: (err) => alert(err.message)
      });
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="container max-w-3xl mx-auto px-4 py-8 md:py-12">
          
          {/* HEADER PRINCIPAL */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                    <LuMessageSquare className="text-white w-6 h-6" /> 
                </div>
                Comunidad
              </h1>
              <p className="text-slate-500 text-sm mt-2 ml-1">
                Comparte ideas, resuelve dudas y conecta con otros estudiantes.
              </p>
            </div>
            
            <Link to="/mis-foros">
              <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm gap-2">
                <LuLayoutList className="w-4 h-4" /> Mis Posts
              </Button>
            </Link>
          </div>

          {/* FORMULARIO DE CREACIÓN (Sticky visualmente en la mente del usuario) */}
          {user && (
            <CreatePostForm 
                onSubmit={handleCreate} 
                isLoading={isCreating} 
                userAvatar={user.fotoPerfilUrl} 
            />
          )}

          {/* BARRA DE ESTADO / FILTROS (Opcional, por ahora solo contador) */}
          <div className="flex items-center justify-between py-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Discusiones Activas
              </h2>
              {!isLoading && (
                <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 hover:bg-slate-200">
                    {publications.length} Publicaciones
                </Badge>
              )}
          </div>

          {/* LISTA DE PUBLICACIONES */}
          <div className="space-y-5 pb-20">
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
                  visible: { transition: { staggerChildren: 0.08 } }
                }}
              >
                <AnimatePresence mode="popLayout">
                    {publications.map((post) => (
                      <div key={post.id} className="mb-6">
                          <PublicationCard post={post} />
                      </div>
                    ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

      </main>
    </div>
  );
}