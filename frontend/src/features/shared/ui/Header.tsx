import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { getImageUrl } from "@/app/imageHelper";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import { 
  Search, FileText, HelpCircle, LogOut, 
  User, Loader2, Users, Heart 
} from "lucide-react";

// Assets
import LogoMUCT from "@/assets/img/logoMUCT.png";

const API_URL = import.meta.env.VITE_API_URL;

interface SearchUserResult {
  id: number;
  nombre: string;
  apellido?: string;
  usuario: string;
  fotoPerfilUrl?: string;
}

export const Header: React.FC = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuth();

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

  // Cerrar búsqueda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 2. MANEJADORES ---

  const handleUserSelect = (userId: number) => {
    navigate(`/perfil/${userId}`);
    setIsSearchFocused(false);
    setSearchValue("");
  };

  const handleViewAllResults = () => {
    navigate(`/busqueda-usuarios?q=${encodeURIComponent(searchValue)}`);
    setIsSearchFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleViewAllResults();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/home': return 'Marketplace';
      case '/crear': return 'Crear Publicación';
      case '/mis-publicaciones': return 'Mis Publicaciones';
      case '/favoritos': return 'Favoritos';
      case '/perfil': return 'Mi Perfil';
      case '/chats': return 'Mensajes';
      case '/ayuda': return 'Centro de Ayuda';
      default: return '';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-200">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* --- IZQUIERDA: LOGO Y TÍTULO --- */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Logo Clickable */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => navigate("/home")}
          >
            <img src={LogoMUCT} alt="Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-lg text-slate-900 tracking-tight hidden sm:block">
              MarketUCT
            </span>
          </div>

          {/* Separador y Título (Solo Desktop) */}
          {getPageTitle() && (
            <div className="hidden md:flex items-center">
              <span className="h-5 w-px bg-slate-300 mx-3"></span>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {getPageTitle()}
              </h2>
            </div>
          )}
        </div>

        {/* --- DERECHA: BUSCADOR Y PERFIL --- */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
          
          {/* BUSCADOR */}
          <div 
            ref={searchRef}
            className={`
              relative transition-all duration-300 ease-in-out z-50
              ${isSearchFocused ? 'w-full md:w-96 absolute left-0 right-0 px-4 md:relative md:px-0 md:left-auto md:right-auto bg-white md:bg-transparent h-full md:h-auto flex items-center' : 'w-auto md:w-72'}
            `}
          >
            {/* Input Wrapper */}
            <div className={`relative group w-full ${isSearchFocused ? 'shadow-lg md:shadow-none rounded-b-xl md:rounded-none' : ''}`}>
              <Search 
                className={`
                  absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-10
                  ${isSearchFocused ? 'text-blue-600' : 'text-slate-400'}
                `} 
              />
              
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className={`
                  pl-10 bg-slate-100/80 border-slate-200 
                  focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 
                  transition-all rounded-full h-10 w-full text-sm placeholder:text-slate-400
                  ${!isSearchFocused && "cursor-pointer hover:bg-slate-100"}
                `}
                onFocus={() => setIsSearchFocused(true)}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>

            {/* Resultados Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchValue.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 left-0 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden ring-1 ring-slate-900/5 mt-1 md:mt-2"
                >
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Resultados
                      </p>
                      {searchResults.map((u) => (
                        <div 
                          key={u.id} 
                          onClick={() => handleUserSelect(u.id)} 
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group border-l-2 border-transparent hover:border-blue-500"
                        >
                          <Avatar className="h-8 w-8 border border-slate-100">
                            <AvatarImage src={getImageUrl(u.fotoPerfilUrl)} />
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-[10px]">
                              {u.usuario.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700">
                              {u.nombre} {u.apellido}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">@{u.usuario}</p>
                          </div>
                        </div>
                      ))}
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      <div 
                        onClick={handleViewAllResults} 
                        className="px-4 py-2.5 text-center cursor-pointer hover:bg-slate-50 transition-colors text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Ver todos los resultados
                      </div>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-6 text-center">
                         <div className="mx-auto w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                           <Users className="h-5 w-5 text-slate-300" />
                         </div>
                         <p className="text-sm text-slate-500">No encontramos usuarios.</p>
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- DROPDOWN DE USUARIO (Visible siempre ahora) --- */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full hover:bg-slate-100 p-0 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 transition-all ml-1"
                >
                  <Avatar className="h-9 w-9 border border-slate-200 transition-transform hover:scale-105 cursor-pointer bg-white shadow-sm">
                    <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} className="object-cover" />
                    <AvatarFallback className="bg-slate-900 text-white font-bold text-sm">
                      {user?.usuario?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 mt-2 p-2" align="end" forceMount>
                <div className="px-2 py-2 mb-1 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.usuario}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer rounded-md focus:bg-slate-100">
                  <User className="mr-2 h-4 w-4 text-slate-500" /> Mi Perfil
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/mis-publicaciones")} className="cursor-pointer rounded-md focus:bg-slate-100">
                  <FileText className="mr-2 h-4 w-4 text-slate-500" /> Mis Publicaciones
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/favoritos")} className="cursor-pointer rounded-md focus:bg-slate-100">
                  <Heart className="mr-2 h-4 w-4 text-slate-500" /> Favoritos
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/ayuda")} className="cursor-pointer rounded-md focus:bg-slate-100">
                  <HelpCircle className="mr-2 h-4 w-4 text-slate-500" /> Ayuda
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 rounded-md">
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

export default Header;