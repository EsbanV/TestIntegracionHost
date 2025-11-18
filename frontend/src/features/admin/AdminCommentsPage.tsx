// AdminCommentsPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import { useAdminComments } from './admin.hooks';
import type { AdminComment } from './admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCommentsPage() {
  const [page, setPage] = useState(1);
  const [publicacionId, setPublicacionId] = useState('');
  const [autorId, setAutorId] = useState('');
  const pageSize = 20;

  const { data, isLoading } = useAdminComments({
    page,
    pageSize,
    publicacionId: publicacionId ? Number(publicacionId) : undefined,
    autorId: autorId ? Number(autorId) : undefined,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <AdminLayout
      title="Comentarios"
      subtitle="Moderación de comentarios y respuestas."
    >
      <AdminSectionCard
        title="Listado de comentarios"
        description="Filtra por publicación o autor."
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              ID publicación
            </label>
            <Input
              value={publicacionId}
              onChange={(e) => {
                setPublicacionId(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
              placeholder="Opcional"
            />
          </div>
          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              ID autor
            </label>
            <Input
              value={autorId}
              onChange={(e) => {
                setAutorId(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Publicación
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Autor
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Contenido
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.comments?.map((c: AdminComment) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      #{c.publicacionId}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      @{c.autor?.usuario}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-800 max-w-xs truncate">
                      {c.contenido}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(c.fecha).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}

                {(!data || data.comments.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No se encontraron comentarios.
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
