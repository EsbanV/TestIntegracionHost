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
    // CAMBIO CLAVE: bg-card/80 en lugar de bg-background. 
    // Esto iguala el tono con la Sidebar y crea contraste con el fondo negro de la página.
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-xl shadow-sm transition-all duration-200">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* --- IZQUIERDA: LOGO Y TÍTULO --- */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Logo Clickable */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => navigate("/home")}
          >
            {/* Contenedor del logo con primary para branding consistente */}
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <img src={LogoMUCT} alt="Logo" className="h-5 w-auto object-contain brightness-0 invert" />
            </div>
            
            <span className="font-bold text-lg text-foreground tracking-tight hidden sm:block">
              Market<span className="text-primary">UCT</span>
            </span>
          </div>

          {/* Separador y Título (Solo Desktop) */}
          {getPageTitle() && (
            <div className="hidden md:flex items-center">
              <span className="h-5 w-px bg-border mx-3"></span>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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
              ${isSearchFocused 
                ? 'w-full md:w-96 absolute left-0 right-0 px-4 md:relative md:px-0 md:left-auto md:right-auto bg-card md:bg-transparent h-full md:h-auto flex items-center' 
                : 'w-auto md:w-72'}
            `}
          >
            {/* Input Wrapper */}
            <div className={`relative group w-full ${isSearchFocused ? 'shadow-2xl shadow-black/10 md:shadow-none rounded-b-xl md:rounded-none' : ''}`}>
              <Search 
                className={`
                  absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-10
                  ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}
                `} 
              />
              
              <Input
                type="search"
                placeholder="Buscar usuarios..."
                className={`
                  pl-10 
                  /* Fondo sutilmente diferente al header (muted) para que parezca un campo de entrada */
                  bg-muted/50 border-transparent
                  focus:bg-muted/80 focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                  transition-all rounded-full h-10 w-full text-sm placeholder:text-muted-foreground text-foreground
                  ${!isSearchFocused && "cursor-pointer hover:bg-muted/70"}
                `}
                onFocus={() => setIsSearchFocused(true)}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                  // Usamos bg-popover para asegurar que flote correctamente con el color adecuado
                  className="absolute top-12 left-0 w-full bg-popover rounded-xl border border-border shadow-xl overflow-hidden ring-1 ring-foreground/5 mt-1 md:mt-2"
                >
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Resultados
                      </p>
                      {searchResults.map((u) => (
                        <div 
                          key={u.id} 
                          onClick={() => handleUserSelect(u.id)} 
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors group border-l-2 border-transparent hover:border-primary"
                        >
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={getImageUrl(u.fotoPerfilUrl)} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                              {u.usuario.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {u.nombre} {u.apellido}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">@{u.usuario}</p>
                          </div>
                        </div>
                      ))}
                      <div className="h-px bg-border my-1 mx-2" />
                      <div 
                        onClick={handleViewAllResults} 
                        className="px-4 py-2.5 text-center cursor-pointer hover:bg-muted/50 transition-colors text-xs font-semibold text-primary hover:text-primary/80"
                      >
                        Ver todos los resultados
                      </div>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-6 text-center">
                         <div className="mx-auto w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                           <Users className="h-5 w-5 text-muted-foreground" />
                         </div>
                         <p className="text-sm text-muted-foreground">No encontramos usuarios.</p>
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- DROPDOWN DE USUARIO --- */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full hover:bg-muted/50 p-0 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 transition-all ml-1"
                >
                  <Avatar className="h-9 w-9 border border-border transition-transform hover:scale-105 cursor-pointer bg-background shadow-sm">
                    <AvatarImage src={getImageUrl(user?.fotoPerfilUrl)} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {user?.usuario?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 mt-2 p-2 bg-popover border-border text-popover-foreground" align="end" forceMount>
                <div className="px-2 py-2 mb-1 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.usuario}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer rounded-md focus:bg-muted/50">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" /> Mi Perfil
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/mis-publicaciones")} className="cursor-pointer rounded-md focus:bg-muted/50">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Mis Publicaciones
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/favoritos")} className="cursor-pointer rounded-md focus:bg-muted/50">
                  <Heart className="mr-2 h-4 w-4 text-muted-foreground" /> Favoritos
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/ayuda")} className="cursor-pointer rounded-md focus:bg-muted/50">
                  <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Ayuda
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-border" />
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-md">
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