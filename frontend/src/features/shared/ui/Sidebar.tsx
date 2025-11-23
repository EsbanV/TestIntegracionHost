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
  Menu // Icono hamburguesa opcional
} from "lucide-react"

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  // Estado: true = Comprimida (80px), false = Expandida (260px)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Si es móvil, forzamos que inicie colapsada
      if (mobile) setIsCollapsed(true)
    }
    
    window.addEventListener("resize", handleResize)
    handleResize() // Chequeo inicial
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 2. Auto-colapsar al navegar en móvil (UX)
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
    }
  }, [location.pathname, isMobile])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  // Variantes de animación
  const sidebarVariants = {
    expanded: { width: "260px" },
    collapsed: { width: isMobile ? "0px" : "80px" }, // Opcional: Si quieres que en móvil desaparezca total pon "0px", si quieres barra de iconos pon "80px"
  }

  // Si decides que en móvil la barra comprimida sea visible (80px), usa esta variante:
  const mobileSidebarVariants = {
    expanded: { width: "280px" }, // Un poco más ancho en móvil para mejor toque
    collapsed: { width: "80px" },
  }

  return (
    <TooltipProvider delayDuration={0}>
      <>
        {/* --- BACKDROP (Solo Móvil y Expandido) --- */}
        {isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}

        <motion.aside
          initial={false}
          animate={isCollapsed ? "collapsed" : "expanded"}
          variants={isMobile ? mobileSidebarVariants : sidebarVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          // CLAVE: 'fixed' en móvil para sobreponerse, 'sticky' en desktop para empujar contenido
          className={`
            flex flex-col text-slate-100 border-r border-slate-800 bg-slate-950 shadow-2xl z-50 
            ${isMobile ? 'fixed h-full top-0 left-0' : 'sticky top-0 h-screen'} 
            ${className}
          `}
        >
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800/50 shrink-0">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
                    <img src={LogoMUCT} alt="Logo" className="h-5 w-auto brightness-0 invert" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-slate-100">
                    Market<span className="text-yellow-600">UCT</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Botón Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${isCollapsed ? 'mx-auto' : ''}`}
            >
              {isCollapsed ? (isMobile ? <Menu size={20} /> : <ChevronRight size={20} />) : <ChevronLeft size={20} />}
            </Button>
          </div>

          {/* --- NAV LINKS --- */}
          <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="space-y-1">
              <SidebarItem
                icon={<Store size={20} />}
                label="Marketplace"
                to="/home"
                isCollapsed={isCollapsed}
                isActive={location.pathname === "/home"}
              />
              <SidebarItem
                icon={<PlusCircle size={20} />}
                label="Crear Publicación"
                to="/crear"
                isCollapsed={isCollapsed}
                isActive={location.pathname === "/crear"}
              />
              <SidebarItem
                icon={<MessageSquare size={20} />}
                label="Chats"
                to="/chats"
                isCollapsed={isCollapsed}
                isActive={location.pathname === "/chats"}
              />
              <SidebarItem
                icon={<Users size={20} />}
                label="Foro Comunidad"
                to="/forums"
                isCollapsed={isCollapsed}
                isActive={location.pathname === "/forums"}
              />
            </div>

            <Separator className="bg-slate-800/50 my-2" />

            <div className="space-y-1">
              <SidebarItem
                icon={<FileText size={20} />}
                label="Términos"
                to="/terminos"
                isCollapsed={isCollapsed}
                isActive={location.pathname === "/terminos"}
              />
              <SidebarItem
                icon={<HelpCircle size={20} />}
                label="Ayuda"
                to="/ayuda"
                isCollapsed={isCollapsed}
                isActive={location.pathname === "/ayuda"}
              />
            </div>
          </nav>

          {/* --- FOOTER --- */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/30 shrink-0">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-3 overflow-hidden"
                  >
                    <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                      <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} />
                      <AvatarFallback className="bg-slate-800 text-slate-400">
                        {user?.usuario?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]">
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
                    className={`${isCollapsed ? '' : 'ml-auto'} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
                  >
                    <LogOut size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
                  <p>Cerrar Sesión</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.aside>
      </>
    </TooltipProvider>
  )
}

// --- SUBCOMPONENTE ITEM (Sin cambios mayores) ---
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
            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
            ${isActive 
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
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
            <motion.div
              layoutId="activeSidebarItem"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/30 rounded-r-full"
            />
          )}
        </NavLink>
      </TooltipTrigger>
      
      {isCollapsed && (
        <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700 ml-2 font-medium z-[60]">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

export default Sidebar