import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { getImageUrl } from "@/app/imageHelper";

// UI Components (Shadcn)
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import {
  MessageSquare,
  FileText,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  HelpCircle,
  PlusCircle
} from "lucide-react";

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png";
// import UserDefault from "@/assets/img/user_default.png"; // Si lo necesitas

interface SidebarProps {
  className?: string;
  active?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Ajuste responsive inicial
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebarVariants = {
    expanded: { width: "260px" },
    collapsed: { width: "80px" },
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        // ✅ CAMBIO AQUÍ: Eliminado bg-slate-900 para mantener la transparencia original
        className={`relative h-screen sticky top-0 flex flex-col text-slate-100 border-r border-slate-800 shadow-xl z-50 ${className}`}
      >
        {/* --- HEADER CON LOGO --- */}
        {/* ✅ CAMBIO AQUÍ: Eliminado bg-slate-950/20 */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800/50">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="logo-expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
              >
                {/* Logo Original (sin filtro de color para que se vea el azul/amarillo) */}
                <img 
                  src={LogoMUCT} 
                  alt="MarketUCT" 
                  className="h-8 w-auto object-contain" 
                />
                <span className="font-bold text-lg tracking-tight text-slate-100">
                  Market<span className="text-yellow-500">UCT</span>
                </span>
              </motion.div>
            ) : (
              <motion.div
                 key="logo-collapsed"
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0 }}
                 className="mx-auto"
              >
                 <img 
                  src={LogoMUCT} 
                  alt="M" 
                  className="h-8 w-8 object-contain" 
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isCollapsed && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all h-8 w-8"
            >
                <ChevronLeft size={18} />
            </Button>
          )}
          
          {isCollapsed && (
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(false)}
                className="absolute right-[-12px] top-6 bg-slate-800 border border-slate-700 rounded-full h-6 w-6 shadow-md z-50 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
            >
                <ChevronRight size={14} />
            </Button>
          )}
        </div>

        {/* --- NAVEGACIÓN --- */}
        <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-1">
            <SidebarItem icon={<Store size={20} />} label="Marketplace" to="/home" isCollapsed={isCollapsed} isActive={location.pathname === "/home"} />
            <SidebarItem icon={<PlusCircle size={20} />} label="Crear Publicación" to="/crear" isCollapsed={isCollapsed} isActive={location.pathname === "/crear"} />
            <SidebarItem icon={<MessageSquare size={20} />} label="Chats" to="/chats" isCollapsed={isCollapsed} isActive={location.pathname === "/chats"} />
            <SidebarItem icon={<Users size={20} />} label="Foro Comunidad" to="/forums" isCollapsed={isCollapsed} isActive={location.pathname === "/forums"} />
          </div>
          <Separator className="bg-slate-800/50 my-2" />
          <div className="space-y-1">
            <SidebarItem icon={<FileText size={20} />} label="Términos y Condiciones" to="/terminos" isCollapsed={isCollapsed} isActive={location.pathname === "/terminos"} />
            <SidebarItem icon={<HelpCircle size={20} />} label="Ayuda" to="/ayuda" isCollapsed={isCollapsed} isActive={location.pathname === "/ayuda"} />
          </div>
        </nav>

        {/* --- FOOTER --- */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-9 w-9 border border-slate-700">
                    <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} />
                    <AvatarFallback className="bg-slate-800 text-slate-400">{user?.usuario?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]">{user?.usuario}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[120px]">{user?.role}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleLogout} variant="ghost" size={isCollapsed ? "icon" : "sm"} className={`${isCollapsed ? '' : 'ml-auto'} text-red-400 hover:text-red-300 hover:bg-red-500/10`}>
                  <LogOut size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700"><p>Cerrar Sesión</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

// Subcomponente SidebarItem
function SidebarItem({ icon, label, to, isCollapsed, isActive }: any) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
            ${isActive 
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-400/10" /* Ajuste hover transparente */
            }
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          <span className={`flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`}>
            {icon}
          </span>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && !isCollapsed && (
            <motion.div layoutId="activeSidebarItem" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/30 rounded-r-full" />
          )}
        </NavLink>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700 ml-2 font-medium">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  )
}