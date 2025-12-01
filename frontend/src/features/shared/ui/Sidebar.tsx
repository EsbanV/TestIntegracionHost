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
  LayoutGrid
} from "lucide-react"

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Lógica Responsiva
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setIsCollapsed(false)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Auto-cerrar en móvil al navegar
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

  // ==========================
  //   VERSIÓN MÓVIL: BOTTOM BAR (Glassmorphism)
  // ==========================
  if (isMobile) {
    return (
      <TooltipProvider delayDuration={0}>
        <nav
          className="
            fixed bottom-0 left-0 right-0 z-50
            h-16 bg-white/90 backdrop-blur-xl
            border-t border-zinc-200
            shadow-[0_-4px_20px_rgba(0,0,0,0.05)]
            pb-safe
          "
        >
          <div className="flex h-full items-center justify-around px-2">
            <MobileNavItem
              icon={<Store size={22} />}
              label="Inicio"
              to="/home"
              isActive={location.pathname === "/home"}
            />
            <MobileNavItem
              icon={<PlusCircle size={22} />}
              label="Vender"
              to="/crear"
              isActive={location.pathname === "/crear"}
            />
            <MobileNavItem
              icon={<MessageSquare size={22} />}
              label="Chats"
              to="/chats"
              isActive={location.pathname.startsWith("/chats")}
            />
            <MobileNavItem
              icon={<Users size={22} />}
              label="Comunidad"
              to="/forums"
              isActive={location.pathname === "/forums"}
            />

            <button
              type="button"
              onClick={handleLogout}
              className="
                flex flex-col items-center justify-center gap-1
                text-[10px] font-medium
                text-zinc-400 hover:text-rose-500
                transition-colors px-2
              "
            >
              <LogOut size={22} />
              <span>Salir</span>
            </button>
          </div>
        </nav>
      </TooltipProvider>
    )
  }

  // ==========================
  //   VERSIÓN DESKTOP: LATERAL (Clean UI)
  // ==========================
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          flex flex-col bg-white border-r border-zinc-200 shadow-sm z-50
          sticky top-0 h-screen
          ${className}
        `}
      >
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-100 shrink-0">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
              >
                {/* Logo con fondo gradiente sutil */}
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
                  <img
                    src={LogoMUCT}
                    alt="Logo"
                    className="h-5 w-auto brightness-0 invert"
                  />
                </div>
                <span className="font-bold text-lg tracking-tight text-zinc-900">
                  Market<span className="text-indigo-600">UCT</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón Toggle Minimalista */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full h-8 w-8 transition-all
              ${isCollapsed ? "mx-auto" : ""}
            `}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* --- NAV LINKS --- */}
        <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
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
              isActive={location.pathname.startsWith("/chats")}
            />
            <SidebarItem
              icon={<Users size={20} />}
              label="Foro Comunidad"
              to="/forums"
              isCollapsed={isCollapsed}
              isActive={location.pathname === "/forums"}
            />
          </div>

          <Separator className="bg-zinc-100 my-2" />

          <div className="space-y-1">
            <SidebarItem
              icon={<FileText size={20} />}
              label="Términos y Condiciones"
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

        {/* --- FOOTER USER --- */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            } gap-2`}
          >
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-3 overflow-hidden flex-1"
                >
                  <Avatar className="h-9 w-9 border border-white shadow-sm shrink-0">
                    <AvatarImage src={getImageUrl(user.fotoPerfilUrl)} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
                      {user?.usuario?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-semibold text-zinc-800 truncate">
                      {user?.usuario}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-wider">
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
                  className={`
                    text-zinc-400 hover:text-rose-600 hover:bg-rose-50
                    ${isCollapsed ? "" : "ml-auto"}
                  `}
                >
                  <LogOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-white">
                <p>Cerrar Sesión</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

// --- ITEM DESKTOP ---
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
            relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group
            ${
              isActive
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 font-medium"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          <span className="flex-shrink-0 z-10 relative">
            {icon}
          </span>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden z-10 relative"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          
          {/* Indicador sutil de activo (glow) */}
          {isActive && (
            <div className="absolute inset-0 bg-white/10 rounded-xl" />
          )}
        </NavLink>
      </TooltipTrigger>

      {isCollapsed && (
        <TooltipContent
          side="right"
          className="bg-zinc-800 text-white border-zinc-700 ml-2 font-medium z-[60]"
        >
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

// --- ITEM MOBILE ---
interface MobileNavItemProps {
  icon: React.ReactNode
  label: string
  to: string
  isActive: boolean
}

function MobileNavItem({ icon, label, to, isActive }: MobileNavItemProps) {
  return (
    <NavLink
      to={to}
      className={`
        relative flex flex-col items-center justify-center gap-1
        text-[10px] font-medium p-2 rounded-xl transition-all
        ${
          isActive
            ? "text-indigo-600 bg-indigo-50"
            : "text-zinc-400 hover:text-zinc-600"
        }
      `}
    >
      <div className={`transition-transform duration-200 ${isActive ? "-translate-y-0.5" : ""}`}>
        {icon}
      </div>
      <span>{label}</span>
      
      {/* Indicador de punto activo móvil */}
      {isActive && (
        <motion.div 
          layoutId="mobileActive"
          className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
        />
      )}
    </NavLink>
  )
}