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
  Search, FileText, HelpCircle, LogOut, User, Loader2, Users, Heart 
} from "lucide-react";

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
  // --- ESTADOS ---
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
    const path = location.pathname;
    if (path.includes('/perfil')) return 'Perfil de Usuario';
    if (path.includes('/editar')) return 'Editar Publicación';
    
    switch(path) {
      case '/home': return 'Marketplace';
      case '/crear': return 'Nueva Publicación';
      case '/mis-publicaciones': return 'Mis Publicaciones';
      case '/favoritos': return 'Favoritos';
      case '/chats': return 'Mensajes';
      case '/forums': return 'Foro Comunidad';
      case '/ayuda': return 'Centro de Ayuda';
      case '/terminos': return 'Términos y Condiciones';
      default: return 'MarketUCT';
    }
  };

  return (
    // Se eliminó z-40 para que no tape el sidebar móvil (que es z-50)
    // Se agregó pl-14 md:pl-4 para dar espacio al toggle del sidebar en móvil si fuera necesario
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm h-16">
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6">
        
        {/* --- IZQUIERDA: TÍTULO DE PÁGINA --- */}
        {/* Ya no necesitamos el menú hamburguesa ni el logo aquí, porque el Sidebar lo maneja */}
        <div className="flex items-center">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {/* En móvil, damos un margen extra a la izquierda para que no choque con el Sidebar comprimido */}
            <span className="lg:hidden w-8"></span> 
            {getPageTitle()}
          </h2>
        </div>

        {/* --- DERECHA: BUSCADOR Y PERFIL --- */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* BUSCADOR (Lógica intacta) */}
          <div 
            ref={searchRef}
            className={`relative transition-all duration-300 ease-in-out ${isSearchFocused ? 'w-full absolute left-0 px-4 bg-white h-full flex items-center z-50 md:static md:w-96 md:p-0' : 'w-auto md:w-64'}`}
          >
             {/* Botón Lupa Móvil (Solo visible cuando NO está enfocado) */}
            {!isSearchFocused && (
                <Button variant="ghost" size="icon" className="md:hidden text-slate-600" onClick={() => setIsSearchFocused(true)}>
                    <Search className="h-5 w-5" />
                </Button>
            )}

            {/* Input (Visible siempre en desktop, condicional en móvil) */}
            <div className={`relative group w-full ${!isSearchFocused ? 'hidden md:block' : 'block'}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSearchFocused ? 'text-blue-600' : 'text-slate-400'}`} />
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className={`pl-10 bg-slate-100/50 border-slate-200 focus:bg-white transition-all rounded-full h-10 w-full focus:ring-2 focus:ring-blue-100 focus:border-blue-400 ${isSearchFocused ? 'shadow-sm' : ''}`}
                onFocus={() => setIsSearchFocused(true)}
                // onBlur se maneja con el click outside ref
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={isSearchFocused}
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
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-14 left-0 w-full md:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-[60]"
                >
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultados</p>
                      {searchResults.map((u) => (
                        <div key={u.id} onClick={() => handleUserSelect(u.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group">
                          <Avatar className="h-8 w-8 border border-slate-100">
                            <AvatarImage src={getImageUrl(u.fotoPerfilUrl)} />
                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">{u.usuario.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{u.nombre} {u.apellido}</p>
                            <p className="text-xs text-slate-500 truncate">@{u.usuario}</p>
                          </div>
                        </div>
                      ))}
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      <div onClick={handleViewAllResults} className="px-4 py-2 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-semibold text-blue-600">Ver todos</span>
                      </div>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-6 text-center text-slate-500">
                         <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                         <p className="text-sm">Sin resultados</p>
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- PERFIL DROPDOWN --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 p-0 ml-1">
                <Avatar className="h-9 w-9 border border-slate-200 hover:border-blue-300 transition-all">
                  <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} className="object-cover" />
                  <AvatarFallback className="bg-slate-900 text-white font-bold text-sm">
                    {user?.usuario?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 p-2" align="end" forceMount>
              <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.usuario}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate(`/perfil/${user?.id}`)} className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-slate-500" /> Mi Perfil
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate("/mis-publicaciones")} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4 text-slate-500" /> Mis Publicaciones
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/favoritos")} className="cursor-pointer">
                <Heart className="mr-2 h-4 w-4 text-slate-500" /> Favoritos
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/ayuda")} className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4 text-slate-500" /> Ayuda
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  )
}