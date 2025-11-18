// AdminUsersPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import {
  useAdminUsers,
  useAdminLookups,
} from './admin.hooks';
import type { AdminUserListItem } from './admin.types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [rolId, setRolId] = useState<number | undefined>(undefined);
  const [estadoId, setEstadoId] = useState<number | undefined>(undefined);

  const pageSize = 10;

  const { data: lookups } = useAdminLookups();
  const { data, isLoading } = useAdminUsers({
    q: q || undefined,
    rolId,
    estadoId,
    page,
    pageSize,
  });

  const totalPages = data?.totalPages ?? 1;

  const handleResetFilters = () => {
    setQ('');
    setRolId(undefined);
    setEstadoId(undefined);
    setPage(1);
  };

  return (
    <AdminLayout
      title="Usuarios"
      subtitle="Gestión de cuentas, roles y estados de los usuarios."
    >
      <AdminSectionCard
        title="Listado de usuarios"
        description="Filtra, revisa y administra los usuarios del marketplace."
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Buscar
            </label>
            <Input
              placeholder="Nombre, usuario, correo..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-9"
            />
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Rol
            </label>
            <Select
              value={rolId ? String(rolId) : ''}
              onValueChange={(value) => {
                setRolId(value ? Number(value) : undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {lookups?.roles.map((rol) => (
                  <SelectItem key={rol.id} value={String(rol.id)}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Estado
            </label>
            <Select
              value={estadoId ? String(estadoId) : ''}
              onValueChange={(value) => {
                setEstadoId(value ? Number(value) : undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {lookups?.userStatuses.map((estado) => (
                  <SelectItem key={estado.id} value={String(estado.id)}>
                    {estado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={handleResetFilters}
          >
            Limpiar filtros
          </Button>
        </div>

        {/* Tabla */}
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
                    Usuario
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Correo
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Rol
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">
                    Reputación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.users?.map((u: AdminUserListItem) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          {u.nombre || u.usuario}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          @{u.usuario}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {u.rol || 'Usuario'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] text-slate-700">
                        {u.estadoNombre || 'Activo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-slate-700">
                      {u.reputacion.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {(!data || data.users.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-500 italic"
                    >
                      No se encontraron usuarios con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación simple */}
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
