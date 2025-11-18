// Header.tsx
import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/context/AuthContext';

type Props = {
  title?: string;
  subtitle?: string;
  onToggleSidebar?: () => void; // opcional, por si luego haces sidebar colapsable
};

export default function Header({ title, subtitle, onToggleSidebar }: Props) {
  const { user } = useAuth();

  const resolvedTitle = title || 'Panel de Control';
  const resolvedSubtitle =
    subtitle || `Administración / ${title || 'Inicio'}`;

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm bg-opacity-80 backdrop-blur-md">
      {/* Izquierda: título + breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Botón menú solo móvil (opcional) */}
        {onToggleSidebar && (
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-800 leading-tight">
            {resolvedTitle}
          </h1>
          <span className="text-xs text-slate-500 font-medium">
            {resolvedSubtitle}
          </span>
        </div>
      </div>

      {/* Derecha: buscador + campana + perfil */}
      <div className="flex items-center gap-4">
        {/* Buscador rápido */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Buscar en el panel..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-9 text-sm"
          />
        </div>

        {/* Notificaciones (placeholder) */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Perfil */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">
              {user?.nombre || 'Administrador'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {user?.rolNombre || 'Super Admin'}
            </p>
          </div>
          <Avatar className="h-9 w-9 border border-slate-200">
            <AvatarImage src={user?.fotoPerfilUrl} />
            <AvatarFallback className="bg-slate-900 text-white text-xs font-bold">
              AD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
