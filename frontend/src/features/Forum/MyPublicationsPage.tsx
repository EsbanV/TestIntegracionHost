import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import { LuFileText, LuPlus } from "react-icons/lu";

// Componentes UI Genéricos
import { Button } from "@/components/ui/button";

// Lógica Modular
import { useMyPublications } from "@/features/Forum/myPublications.hooks";
import type { UpdatePublicationData } from "@/features/Forum/myPublications.types";
import { 
  EditablePublicationCard, 
  MyPublicationsSkeleton 
} from "@/features/Forum/MyPublications.Components";

export default function MyPublicationsPage() {
  const [editingId, setEditingId] = useState<number | null>(null);

  const { 
    publications, 
    isLoading, 
    isError, 
    error, 
    deletePublication, 
    updatePublication, 
    isDeleting, 
    isUpdating 
  } = useMyPublications();

  const handleUpdate = (data: UpdatePublicationData) => {
    updatePublication(data, {
      onSuccess: () => setEditingId(null),
      onError: (err) => alert(err.message)
    });
  };

  const handleDelete = (id: number) => {
    deletePublication(id, {
      onError: (err) => alert(err.message)
    });
  };

  return (
    // Fondo transparente para heredar el patrón global. Texto semántico.
    <div className="flex h-full w-full text-foreground">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <LuFileText className="text-primary" /> Mis Publicaciones
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gestiona el contenido que has compartido con la comunidad.
              </p>
            </div>
            
            <Link to="/forums">
              {/* Botón Primary Semántico */}
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 transition-all">
                <LuPlus className="w-4 h-4" /> Nueva Publicación
              </Button>
            </Link>
          </div>

          {/* Content */}
          <div className="space-y-4">
              {isLoading ? (
                <MyPublicationsSkeleton />
              ) : isError ? (
                // Estado de Error Semántico (Destructive)
                <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
                  <p>No se pudieron cargar tus publicaciones.</p>
                  <p className="text-xs opacity-75 mt-1">{(error as Error)?.message}</p>
                </div>
              ) : publications.length === 0 ? (
                // Estado Vacío Semántico (Card + Muted)
                <div className="py-16 text-center bg-card rounded-xl border border-dashed border-border">
                  <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                    <LuFileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No tienes publicaciones aún</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Comparte algo interesante con la comunidad hoy.</p>
                  <Link to="/forums">
                    <Button variant="outline" className="border-border hover:bg-muted text-foreground">Ir al Foro</Button>
                  </Link>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
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
                        onSave={handleUpdate}
                        onDelete={() => handleDelete(post.id)}
                        isProcessing={isDeleting || isUpdating}
                      />
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