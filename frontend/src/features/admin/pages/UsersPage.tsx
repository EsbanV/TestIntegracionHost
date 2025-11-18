import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  AdminTable, 
  AdminModal, 
  AdminSearchInput, 
  StatusBadge, 
  PageTransition 
} from '@/features/admin/components/AdminComponents'; // Archivo unificado
import { Button } from '@/components/ui/button'; // Botones Shadcn
import { Input } from '@/components/ui/input'; // Inputs Shadcn
import { 
  RefreshCcw, Trash2, Ban, ShieldCheck, User, Mail, AlertCircle 
} from 'lucide-react';

// Hooks (Mantenemos la lógica original)
import { 
  useAdminUsers, 
  useUpdateUserRole, 
  useBanUser, 
  useDeleteUser 
} from '../hooks/useAdmin';
import type { AdminUser } from '../types/adminUser';

export default function UsersPage() {
  const [query, setQuery] = useState('');

  // 1. Hook de consulta
// ... dentro de UsersPage ...
  const { 
    data: usersResponse, 
    isLoading: loading, 
    isError,
    error: queryError,
    refetch 
  } = useAdminUsers(query);

  const users = useMemo(() => {
    if (!usersResponse) return [];
    // El hook devuelve { users: [...], total: N }
    return usersResponse.users || []; 
  }, [usersResponse]);
  // ...

  // 3. Hooks de mutación
  const { mutate: banUser, isLoading: banLoading } = useBanUser();
  const { mutate: updateRole, isLoading: roleLoading } = useUpdateUserRole();
  const { mutate: deleteUser, isLoading: deleteLoading } = useDeleteUser();

  // 4. Estados locales
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [roleValue, setRoleValue] = useState<'USER' | 'MODERATOR' | 'ADMIN'>('USER');
  const [modalError, setModalError] = useState<string | null>(null);

  // Sincronizar estado al editar
  useEffect(() => {
    if (editing && users.length > 0) {
      const updatedUser = users.find(u => u.id === editing.id);
      if (updatedUser && updatedUser.banned !== editing.banned) {
        setEditing(updatedUser);
      }
    }
  }, [users, editing?.id]);

  // --- Definición de Columnas ---
  const columns = useMemo(() => [
    { 
      key: 'nombre', 
      title: 'Nombre', 
      render: (u: AdminUser) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-full">
            <User className="w-3 h-3 text-slate-500" />
          </div>
          <span className="font-medium">{u.nombre ?? '—'}</span>
        </div>
      ) 
    },
    { 
      key: 'email', 
      title: 'Email',
      render: (u: AdminUser) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Mail className="w-3 h-3" /> {u.email}
        </div>
      )
    },
    { 
      key: 'rol', 
      title: 'Rol', 
      render: (u: AdminUser) => (
        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
          u.rol === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
          u.rol === 'MODERATOR' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
          'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {u.rol}
        </span>
      ) 
    },
    { 
      key: 'banned', 
      title: 'Estado', 
      render: (u: AdminUser) => (
        <StatusBadge 
          status={u.banned ? 'err' : 'ok'} 
          label={u.banned ? 'Baneado' : 'Activo'} 
        />
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      align: 'right',
      render: (u: AdminUser) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => { 
              e.stopPropagation(); 
              setEditing(u); 
              setRoleValue(u.rol); 
              setModalError(null);
            }}
          >
            Gestionar
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => { 
              e.stopPropagation(); 
              setDeleting(u); 
              setModalError(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  // --- Handlers ---
  const onSaveRole = async () => {
    if (!editing) return;
    setModalError(null);
    try {
      if (roleValue !== editing.rol) {
        await updateRole({ id: editing.id.toString(), newRole: roleValue });
      }
      setEditing(null);
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar');
    }
  };

  const onToggleBan = async () => {
    if (!editing || banLoading) return;
    setModalError(null);
    try {
      await banUser({ userId: editing.id.toString(), banned: !editing.banned });
    } catch (err: any) {
      setModalError(err.message || 'Error al cambiar estado');
    }
  };

  const onConfirmDelete = async () => {
    if (!deleting || deleteLoading) return;
    setModalError(null);
    try {
      await deleteUser(deleting.id.toString());
      setDeleting(null);
    } catch (err: any) {
      setModalError(err.message || 'Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Gestión de Usuarios">
      <PageTransition>
        {/* Barra Superior */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <AdminSearchInput 
            value={query} 
            onChange={setQuery} 
            placeholder="Buscar por nombre o email..." 
          />
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>

        {/* Mensaje de Error Global */}
        {isError && (
          <div className="flex items-center gap-2 p-4 mb-4 text-red-700 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5" />
            <span>Error al cargar usuarios: {queryError?.message}</span>
          </div>
        )}

        {/* Tabla de Usuarios */}
        <AdminTable
          columns={columns}
          data={users}
          loading={loading}
          rowKey={(u) => u.id}
          onRowClick={(u) => { setEditing(u); setRoleValue(u.rol); }}
          emptyContent={
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <User className="w-10 h-10 mb-2 opacity-20" />
              <p>No se encontraron usuarios</p>
            </div>
          }
        />

        {/* MODAL DE EDICIÓN */}
        <AdminModal
          open={!!editing}
          onClose={() => setEditing(null)}
          title="Gestionar Usuario"
          description={`ID: ${editing?.id}`}
          onSave={onSaveRole}
          isSaving={roleLoading}
          saveLabel="Guardar Cambios"
        >
          {editing && (
            <div className="space-y-5">
              {/* Campos de solo lectura */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Nombre</label>
                  <Input value={editing.nombre ?? ''} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Email</label>
                  <Input value={editing.email} disabled className="bg-slate-50" />
                </div>
              </div>

              {/* Selector de Rol */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase">Rol del Sistema</label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value as any)}
                >
                  <option value="USER">Usuario (USER)</option>
                  <option value="MODERATOR">Moderador (MODERATOR)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>

              {/* Zona de Peligro (Baneo) */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Zona de Acciones</label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    {editing.banned ? (
                      <Ban className="w-4 h-4 text-red-500" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className={editing.banned ? "text-red-700 font-medium" : "text-slate-700"}>
                      {editing.banned ? 'Usuario Baneado' : 'Cuenta Activa'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={editing.banned ? "outline" : "destructive"}
                    size="sm"
                    onClick={onToggleBan}
                    disabled={banLoading}
                  >
                    {banLoading ? 'Procesando...' : editing.banned ? 'Desbanear Acceso' : 'Banear Acceso'}
                  </Button>
                </div>
              </div>

              {modalError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  {modalError}
                </div>
              )}
            </div>
          )}
        </AdminModal>

        {/* MODAL DE ELIMINACIÓN */}
        <AdminModal
          open={!!deleting}
          onClose={() => setDeleting(null)}
          title="¿Eliminar usuario definitivamente?"
          onSave={onConfirmDelete}
          isSaving={deleteLoading}
          saveLabel="Sí, eliminar"
        >
          {deleting && (
            <div className="space-y-2">
              <div className="bg-red-50 text-red-900 p-4 rounded-md border border-red-100 text-sm">
                <p className="font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> ¡Atención!
                </p>
                <p className="mt-1">
                  Estás a punto de eliminar a <strong>{deleting.email}</strong>.
                  Esta acción borrará todo su historial y no se puede deshacer.
                </p>
              </div>
              {modalError && <p className="text-red-600 text-sm">{modalError}</p>}
            </div>
          )}
        </AdminModal>

      </PageTransition>
    </AdminLayout>
  );
}