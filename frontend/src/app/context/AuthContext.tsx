import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// --- 1. Definición de Tipos ---
interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  apellido?: string; // Hecho opcional por si acaso
  role: string;
  campus?: string; // Hecho opcional
  fotoPerfilUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// --- 2. Componente Proveedor ---
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const validateToken = useCallback(async () => {
    // 1. Leer del localStorage
    const storedToken = localStorage.getItem('token');
    // (Opcional) Leer usuario guardado para carga instantánea visual
    const storedUser = localStorage.getItem('user_data'); 

    if (!storedToken) {
      console.log("🔵 Auth: No hay token guardado.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("🟡 Auth: Validando token con backend...");
      
      // Si tenemos usuario en cache, lo cargamos visualmente mientras validamos
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // 2. Petición al backend
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("🟢 Auth: Token válido. Usuario:", data.user.usuario);
        
        setUser(data.user);
        setToken(storedToken);
        
        // Actualizar datos frescos en storage
        localStorage.setItem('user_data', JSON.stringify(data.user));
      } else {
        // Si el backend dice 401/403, el token ya no sirve
        console.error("🔴 Auth: Backend rechazó el token.", res.status, res.statusText);
        logout(); // Limpiar todo
      }
    } catch (error) {
      console.error('🔴 Auth: Error de red al validar token:', error);
      // Nota: En error de red (servidor apagado), no borramos el token inmediatamente
      // para permitir reintentos, pero por seguridad ahora cerramos sesión.
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = (newToken: string, newUser: AuthUser) => {
    console.log("🔵 Auth: Iniciando sesión...");
    setToken(newToken);
    setUser(newUser);
    
    // Guardar en localStorage
    localStorage.setItem('token', newToken);
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  const logout = () => {
    console.log("⚫ Auth: Cerrando sesión...");
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- 3. Componente de Ruta Protegida ---
export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirigir al login pero recordar de dónde venía
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

// --- Pantalla de Carga ---
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 font-medium animate-pulse">Verificando sesión...</p>
  </div>
);