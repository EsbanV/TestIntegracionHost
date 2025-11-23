import { useState, useEffect } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext"
import { getImageUrl } from "@/app/imageHelper"

// UI Components
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  PlusCircle,
  Menu
} from "lucide-react"

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png"
// IMPORTANTE: Importa aquí la imagen de fondo de tu diseño (la de las bolsas/iconos de fondo)
// import SidebarBg from "@/assets/img/sidebar_bg_pattern.png" 

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  // Inicia colapsado en móvil (< 1024px)
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setIsCollapsed(true)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Auto-colapsar en móvil al navegar
  useEffect(() => {
    if (isMobile) setIsCollapsed(true)
  }, [location.pathname, isMobile])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const sidebarVariants = {
    expanded: { width: "260px" },
    collapsed: { width: "80px" },
  }

  return (
    <TooltipProvider delayDuration={0}>
      <>
        {/* BACKDROP (Oscuro al expandir en móvil) */}
        <AnimatePresence>
          {isMobile && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCollapsed(true)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={isCollapsed ? "collapsed" : "expanded"}
          variants={sidebarVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`
            flex flex-col border-r border-slate-200/20 shadow-2xl z-50 overflow-hidden
            /* AQUÍ LA CLAVE: Fondo transparente para dejar ver la imagen decorativa */
            bg-transparent 
            ${isMobile ? 'fixed h-full top-0 left-0' : 'sticky top-0 h-screen'} 
            ${className}
          `}
        >
          {/* --- CAPA DE IMAGEN DE FONDO --- */}
          {/* Esta capa contiene tu imagen decorativa (las bolsas de compras).
              Se posiciona absoluta detrás del contenido. */}
          <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
             {/* Reemplaza este div con tu <img> real */}
             {/* <img src={SidebarBg} className="w-full h-full object-cover" /> */}
             
             {/* Placeholder visual (simulando tu imagen) */}
             <div className="w-full h-full bg-gradient-to-b from-blue-100/50 via-white/0 to-white/0" />
          </div>

          {/* --- FONDO BASE DIFUMINADO (Opcional para legibilidad) --- */}
          {/* Si la imagen es muy fuerte, esto ayuda a leer el texto sin tapar la imagen */}
          <div className="absolute inset-0 z-[-2] bg-white/80 backdrop-blur-sm" />


          {/* --- CONTENIDO DEL SIDEBAR --- */}

          {/* Header Azul (Como en tu imagen) */}
          <div className="flex items-center justify-between p-4 h-16 shrink-0 bg-transparent">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <img src={LogoMUCT} alt="Logo" className="h-5 w-auto brightness-0 invert" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-slate-800">
                    Market<span className="text-blue-600">UCT</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all ${isCollapsed ? 'mx-auto' : ''}`}
            >
              {isCollapsed ? (isMobile ? <Menu size={24} /> : <ChevronRight size={20} />) : <ChevronLeft size={20} />}
            </Button>
          </div>

          {/* Links de Navegación */}
          <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="space-y-1">
              <SidebarItem icon={<Store size={22} />} label="Marketplace" to="/home" isCollapsed={isCollapsed} isActive={location.pathname === "/home"} />
              <SidebarItem icon={<PlusCircle size={22} />} label="Crear Publicación" to="/crear" isCollapsed={isCollapsed} isActive={location.pathname === "/crear"} />
              <SidebarItem icon={<MessageSquare size={22} />} label="Chats" to="/chats" isCollapsed={isCollapsed} isActive={location.pathname === "/chats"} />
              <SidebarItem icon={<Users size={22} />} label="Foro Comunidad" to="/forums" isCollapsed={isCollapsed} isActive={location.pathname === "/forums"} />
            </div>

            <Separator className="bg-slate-300/50 my-2" />

            <div className="space-y-1">
              <SidebarItem icon={<FileText size={22} />} label="Términos" to="/terminos" isCollapsed={isCollapsed} isActive={location.pathname === "/terminos"} />
              <SidebarItem icon={<HelpCircle size={22} />} label="Ayuda" to="/ayuda" isCollapsed={isCollapsed} isActive={location.pathname === "/ayuda"} />
            </div>
          </nav>

          {/* Footer Usuario */}
          <div className="p-3 border-t border-slate-200/50 bg-white/30 shrink-0">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-3 overflow-hidden"
                  >
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                        {user?.usuario?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate text-slate-800">
                      <span className="text-sm font-bold truncate max-w-[120px]">
                        {user?.usuario}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[120px]">
                        {user?.role}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size={isCollapsed ? "icon" : "sm"}
                    className={`${isCollapsed ? '' : 'ml-auto'} text-red-500 hover:text-red-600 hover:bg-red-50`}
                  >
                    <LogOut size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar Sesión</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.aside>
      </>
    </TooltipProvider>
  )
}

// --- ITEM DE NAVEGACIÓN ---
interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  to: string
  isCollapsed: boolean
  isActive: boolean
}

function SidebarItem({ icon, label, to, isCollapsed, isActive }: SidebarItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          className={`
            relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
            /* LÓGICA DE ESTILOS: */
            ${isActive 
              ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-bold" // Activo: Fondo Sólido Azul
              : "text-slate-600 hover:bg-white/50 hover:text-blue-600 font-medium" // Inactivo: Transparente (texto gris)
            }
            ${isCollapsed ? "justify-center px-2" : ""}
          `}
        >
          <span className={`flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"}`}>
            {icon}
          </span>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </TooltipTrigger>
      
      {isCollapsed && (
        <TooltipContent side="right" className="bg-blue-600 text-white font-bold ml-2">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  )
}