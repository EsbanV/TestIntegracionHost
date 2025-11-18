// AdminUsersPage.tsx
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import {
  useAdminUsers,
  useAdminLookups,
  useAdminBanUser,
} from './admin.hooks';
import type { AdminUserListItem } from './admin.types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// =====================================================================
// Fila de la tabla: maneja ban / desban por usuario
// =====================================================================

interface UserRowProps {
  user: AdminUserListItem;
}

const UserRow: React.FC<UserRowProps> = ({ user }) => {
  const banMutation = useAdminBanUser(user.id);

  const handleToggleBan = () => {
    const nextBanned = !user.banned;

    const mensaje = nextBanned
      ? `¿Seguro que quieres BANEAR al usuario #${user.id} (@${user.usuario})?\n\n` +
        'No podrá crear nuevas publicaciones ni interactuar hasta que lo desbanees.'
      : `¿Seguro que quieres DESBANEAR al usuario #${user.id} (@${user.usuario})?\n\n` +
        'Podrá volver a usar normalmente el marketplace.';

    if (!window.confirm(mensaje)) return;

    banMutation.mutate({ banned: nextBanned });
  };

  const isBanned = user.banned;

  return (
    <tr
      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors ${
        isBanned ? 'bg-red-50/40' : ''
      }`}
    >
      {/* ID */}
      <td className="px-3 py-2 text-[11px] text-slate-500 font-mono">
        #{user.id}
      </td>

      {/* Datos básicos */}
      <td className="px-3 py-2">
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">
            {user.nombre || user.usuario}
          </span>
          <span className="text-[11px] text-slate-500">@{user.usuario}</span>
        </div>
      </td>

      {/* Correo */}
      <td className="px-3 py-2 text-[11px] text-slate-600">
        {user.email}
      </td>

      {/* Rol */}
      <td className="px-3 py-2">
        <Badge variant="outline" className="text-[10px]">
          {user.rol || 'Usuario'}
        </Badge>
      </td>

      {/* Estado + Baneo */}
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <span
            className={`text-[11px] ${
              isBanned ? 'text-red-700 font-semibold' : 'text-slate-700'
            }`}
          >
            {user.estadoNombre || (isBanned ? 'Suspendido' : 'Activo')}
          </span>
          {isBanned && (
            <Badge
              variant="destructive"
              className="w-fit text-[10px] uppercase tracking-wide"
            >
              BANEADO
            </Badge>
          )}
        </div>
      </td>

      {/* Reputación */}
      <td className="px-3 py-2 text-right text-[11px] text-slate-700">
        {user.reputacion.toFixed(2)}
      </td>

      {/* Acciones */}
      <td className="px-3 py-2 text-right">
        <Button
          variant={isBanned ? 'outline' : 'destructive'}
          size="sm"
          onClick={handleToggleBan}
          disabled={banMutation.isPending}
          className="text-[11px]"
        >
          {banMutation.isPending
            ? 'Guardando...'
            : isBanned
            ? 'Desbanear'
            : 'Banear'}
        </Button>
      </td>
    </tr>
  );
};

// =====================================================================
// Página principal
// =====================================================================

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
              value={rolId !== undefined ? String(rolId) : 'all'}
              onValueChange={(value) => {
                if (value === 'all') setRolId(undefined);
                else setRolId(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
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
              value={estadoId !== undefined ? String(estadoId) : 'all'}
              onValueChange={(value) => {
                if (value === 'all') setEstadoId(undefined);
                else setEstadoId(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
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
                    ID
                  </th>
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
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data?.users?.map((u: AdminUserListItem) => (
                  <UserRow key={u.id} user={u} />
                ))}

                {(!data || data.users.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
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
