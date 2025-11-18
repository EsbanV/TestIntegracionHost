import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  ShoppingBag, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Asumiendo que tienes la utilidad de shadcn
import { Button } from '@/components/ui/button'; // Asumiendo componente shadcn
import { useAuth } from '@/app/context/AuthContext'; // Ajusta según tu contexto real

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/publicaciones', label: 'Publicaciones', icon: FileText },
  { href: '/admin/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth(); // O tu lógica de logout

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 transition-all duration-300">
      {/* Brand */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold text-white tracking-tight">
          Admin<span className="text-blue-500">Panel</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "hover:bg-slate-800 hover:text-white text-slate-400"
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={() => logout && logout()} // Conecta tu función de logout
        >
          <LogOut size={18} />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}