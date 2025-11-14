import React, { useState } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext"

// UI Components
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

// Icons
import { 
  Menu, Search, Home, PlusSquare, FileText, 
  HelpCircle, Info, LogOut, User 
} from "lucide-react"

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png"
import UserDefault from "@/assets/img/user_default.png"

export const Header: React.FC = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    navigate("/login", { replace: true })
  }

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/home': return 'Marketplace';
      case '/crear': return 'Crear Publicación';
      case '/mis-publicaciones': return 'Mis Publicaciones';
      case '/perfil': return 'Mi Perfil';
      case '/chats': return 'Mensajes';
      case '/ayuda': return 'Centro de Ayuda';
      default: return '';
    }
  }

  return (
    // CAMBIO CLAVE: Quitamos 'bg-white/80 backdrop-blur' de aquí si queremos que sea sólido
    // y aseguramos w-full
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      
      {/* CAMBIO CLAVE: Quitamos 'container mx-auto'. Usamos 'w-full' y padding fluido */}
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
        
        {/* --- IZQUIERDA --- */}
        <div className="flex items-center gap-4">
          
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 text-slate-700">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              
              <SheetContent side="left" className="w-[300px] pr-0">
                <div className="px-2 mb-6">
                  <SheetTitle className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <img src={LogoMUCT} alt="Logo" className="h-5 w-auto brightness-0 invert" />
                    </div>
                    <span className="font-bold text-lg">MarketUCT</span>
                  </SheetTitle>
                  <SheetDescription>Menú principal</SheetDescription>
                </div>

                <div className="flex flex-col space-y-1 px-2">
                  <MobileNavLink to="/home" icon={<Home className="h-5 w-5" />} label="Inicio" onClick={() => setIsOpen(false)} />
                  <MobileNavLink to="/crear" icon={<PlusSquare className="h-5 w-5" />} label="Crear" onClick={() => setIsOpen(false)} />
                  <MobileNavLink to="/mis-publicaciones" icon={<FileText className="h-5 w-5" />} label="Mis Posts" onClick={() => setIsOpen(false)} />
                  <MobileNavLink to="/ayuda" icon={<HelpCircle className="h-5 w-5" />} label="Ayuda" onClick={() => setIsOpen(false)} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => { setIsOpen(false); navigate("/perfil") }}>
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                      <AvatarImage src={user?.fotoPerfilUrl || UserDefault} />
                      <AvatarFallback>{user?.usuario?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user?.usuario}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2" onClick={() => navigate("/home")}>
            <img src={LogoMUCT} alt="Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg text-slate-900">MarketUCT</span>
          </div>

          {/* Desktop Page Title */}
          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* --- DERECHA --- */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* Barra de búsqueda */}
          <div className={`relative hidden md:block transition-all duration-300 ${isSearchFocused ? 'w-72 lg:w-96' : 'w-64'}`}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-full h-10"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>

          <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
            <Search className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Avatar className="h-9 w-9 border border-slate-200 transition-transform hover:scale-105">
                    <AvatarImage src={user?.fotoPerfilUrl || UserDefault} className="object-cover" />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                      {user?.usuario?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.usuario}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/mis-publicaciones")} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" /> Mis Publicaciones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ayuda")} className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" /> Ayuda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </div>
    </header>
  )
}

export default Header

const MobileNavLink = ({ to, icon, label, onClick }: any) => {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
    >
      <span className={isActive ? "text-blue-600" : "text-slate-400"}>{icon}</span>
      {label}
    </NavLink>
  )
}