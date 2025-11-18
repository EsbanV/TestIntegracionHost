// AdminPostsPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import { useAdminPosts, useAdminDeletePost } from './admin.hooks';
import type { AdminPostListItem } from './admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';

// Fila individual de publicación (incluye botón de eliminar)
interface PostRowProps {
  post: AdminPostListItem;
}

const PostRow: React.FC<PostRowProps> = ({ post }) => {
  const deleteMutation = useAdminDeletePost(post.id);

  const handleDelete = () => {
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar la publicación #${post.id}?\n\nTítulo: "${post.titulo || '(Sin título)'}"`
    );
    if (!confirmado) return;

    deleteMutation.mutate();
  };

  return (
    <tr
      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
    >
      <td className="px-3 py-2 text-[11px] text-slate-800 max-w-xs truncate">
        {post.titulo || '(Sin título)'}
      </td>
      <td className="px-3 py-2 text-[11px] text-slate-600">
        @{post.usuario.usuario}
      </td>
      <td className="px-3 py-2 text-center text-[11px] text-slate-700">
        {post.totalComentarios}
      </td>
      <td className="px-3 py-2 text-[11px] text-slate-600 whitespace-nowrap">
        {new Date(post.fecha).toLocaleString('es-CL')}
      </td>
      <td className="px-3 py-2 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:text-red-600"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          aria-label="Eliminar publicación"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const pageSize = 10;

  const { data, isLoading } = useAdminPosts({
    page,
    pageSize,
    q: q || undefined,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <AdminLayout
      title="Publicaciones"
      subtitle="Moderación de publicaciones de la comunidad."
    >
      <AdminSectionCard
        title="Listado de publicaciones"
        description="Revisa y modera el contenido publicado por los usuarios."
      >
        <div className="mb-4 w-full md:w-1/3">
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Buscar
          </label>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Título o contenido..."
            className="h-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Título
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Autor
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Comentarios
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.posts?.map((p: AdminPostListItem) => (
                  <PostRow key={p.id} post={p} />
                ))}

                {(!data || data.posts.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No se encontraron publicaciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </AdminSectionCard>
    </AdminLayout>
  );
}
