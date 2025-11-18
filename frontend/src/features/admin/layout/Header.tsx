import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/context/AuthContext';

type Props = { title?: string };

export default function Header({ title }: Props) {
  const { user } = useAuth(); // Obtener datos del usuario real si existen

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm bg-opacity-80 backdrop-blur-md">
      {/* Título y Breadcrumb simple */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-800 leading-tight">
          {title || 'Panel de Control'}
        </h1>
        <span className="text-xs text-slate-500 font-medium">
          Administración / <span className="text-slate-700">{title || 'Inicio'}</span>
        </span>
      </div>

      {/* Acciones Derecha */}
      <div className="flex items-center gap-4">
        {/* Buscador rápido */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Buscar..." 
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-9 text-sm" 
          />
        </div>

        {/* Notificaciones (Decorativo por ahora) */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Perfil */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">
              {user?.nombre || 'Administrador'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Super Admin</p>
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