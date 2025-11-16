import React, { useState, useEffect, useRef } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext"
import { getImageUrl } from "@/app/imageHelper" 

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
  HelpCircle, LogOut, User, Loader2, Users, Heart 
} from "lucide-react"

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png"

const API_URL = import.meta.env.VITE_API_URL;

interface SearchUserResult {
  id: number;
  nombre: string;
  apellido?: string;
  usuario: string;
  fotoPerfilUrl?: string;
  campus?: string;
}

export const Header: React.FC = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // --- 1. EFECTO DE BÚSQUEDA EN VIVO ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchValue.trim().length > 1 && isSearchFocused) {
        setIsSearching(true);
        try {
          const res = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(searchValue)}&limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          
          if (data.success) {
            setSearchResults(data.data);
          }
        } catch (error) {
          console.error("Error buscando usuarios:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, isSearchFocused, token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSelect = (userId: number) => {
    navigate(`/perfil/public/${userId}`) 
    setIsSearchFocused(false)
    setSearchValue("")
  }

  const handleViewAllResults = () => {
    navigate(`/busqueda-usuarios?q=${encodeURIComponent(searchValue)}`)
    setIsSearchFocused(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleViewAllResults()
    }
  }

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
      case '/favoritos': return 'Mis Favoritos'; // Título para favoritos
      case '/perfil': return 'Mi Perfil';
      case '/chats': return 'Mensajes';
      case '/ayuda': return 'Centro de Ayuda';
      default: return '';
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
        
        {/* --- IZQUIERDA --- */}
        <div className="flex items-center gap-4">
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
                  {/* Link móvil a favoritos */}
                  <MobileNavLink to="/favoritos" icon={<Heart className="h-5 w-5" />} label="Favoritos" onClick={() => setIsOpen(false)} />
                  <MobileNavLink to="/ayuda" icon={<HelpCircle className="h-5 w-5" />} label="Ayuda" onClick={() => setIsOpen(false)} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => { setIsOpen(false); navigate("/perfil") }}>
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                      <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} />
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

          <div className="lg:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
            <img src={LogoMUCT} alt="Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg text-slate-900">MarketUCT</span>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* --- DERECHA --- */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Buscador */}
          <div 
            ref={searchRef}
            className={`relative hidden md:block transition-all duration-300 ${isSearchFocused ? 'w-80 lg:w-96' : 'w-64'}`}
          >
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${isSearchFocused ? 'text-blue-600' : 'text-slate-400'}`} />
              <Input
                type="search"
                placeholder="Buscar usuario..."
                className="pl-9 bg-slate-100/50 border-slate-200 focus:bg-white transition-all rounded-full h-10 w-full focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                onFocus={() => setIsSearchFocused(true)}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {isSearchFocused && searchValue.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-12 left-0 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50"
                >
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuarios encontrados</p>
                      {searchResults.map((u) => (
                        <div key={u.id} onClick={() => handleUserSelect(u.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group">
                          <Avatar className="h-9 w-9 border border-slate-100 group-hover:border-blue-200 transition-colors">
                            <AvatarImage src={getImageUrl(u.fotoPerfilUrl)} />
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">{u.usuario.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">{u.nombre} {u.apellido}</p>
                            <p className="text-xs text-slate-500 truncate">@{u.usuario}</p>
                          </div>
                        </div>
                      ))}
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      <div onClick={handleViewAllResults} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-medium text-blue-600 hover:underline">Ver más resultados</span>
                      </div>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-6 text-center text-slate-500">
                         <div className="mx-auto w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2"><Users className="h-5 w-5 opacity-50" /></div>
                         <p className="text-sm">No encontramos usuarios.</p>
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden text-slate-600" onClick={() => setIsSearchFocused(true)}>
            <Search className="h-5 w-5" />
          </Button>

          {/* --- MENÚ DE USUARIO --- */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Avatar className="h-9 w-9 border border-slate-200 transition-transform hover:scale-105 cursor-pointer">
                    <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} className="object-cover" />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">
                      {user?.usuario?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
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

                {/* 👇 ENLACE NUEVO A FAVORITOS */}
                <DropdownMenuItem onClick={() => navigate("/favoritos")} className="cursor-pointer">
                  <Heart className="mr-2 h-4 w-4" /> Mis Favoritos
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