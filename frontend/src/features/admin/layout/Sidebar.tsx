// Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  MessagesSquare,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';

const mainItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/transacciones', label: 'Transacciones', icon: CreditCard },
  { href: '/admin/reportes', label: 'Reportes', icon: AlertTriangle },
];

const contentItems = [
  { href: '/admin/publicaciones', label: 'Publicaciones', icon: FileText },
  { href: '/admin/comentarios', label: 'Comentarios', icon: MessageSquare },
  { href: '/admin/comunidad', label: 'Comunidad', icon: MessagesSquare },
];

const configItems = [
  { href: '/admin/categorias', label: 'Categorías', icon: Layers },
  { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();

  const renderSection = (
    title: string,
    items: { href: string; label: string; icon: React.ComponentType<any>; end?: boolean }[],
  ) => (
    <div className="space-y-1">
      <p className="px-3 text-[11px] uppercase tracking-wide text-slate-500 font-semibold mt-4 mb-1">
        {title}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'hover:bg-slate-800/40 hover:text-white text-slate-400',
            )
          }
        >
          <item.icon size={18} className="shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
      {/* Brand */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-tight leading-none">
            Market<span className="text-blue-400">UCT</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            Panel de administración
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {renderSection('Resumen', mainItems)}
        {renderSection('Contenido', contentItems)}
        {renderSection('Configuración', configItems)}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={() => logout && logout()}
        >
          <LogOut size={18} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
