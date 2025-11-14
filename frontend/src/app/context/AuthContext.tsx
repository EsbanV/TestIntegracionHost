import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Importamos la URL base del entorno
const URL_BASE = import.meta.env.VITE_API_URL;

// --- 1. Definición de Tipos ---
interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  role: string;
  campus?: string;
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
    const storedUser = localStorage.getItem('user_data'); 

    if (!storedToken) {
      console.log("🔵 Auth: No hay token guardado.");
      setIsLoading(false);
      return;
    }

    try {
      // Carga optimista del usuario (para que se vea rápido la UI)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.warn("Datos de usuario corruptos en storage");
        }
      }

      console.log("🟡 Auth: Validando token con backend...");
      
      // 2. Petición al backend (USANDO URL_BASE ABSOLUTA)
      // Asegúrate de tener creado el endpoint /api/auth/me en tu backend
      const res = await fetch(`${URL_BASE}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Importante para CORS consistente
      });

      if (res.ok) {
        const data = await res.json();
        // Ajusta esto según si tu backend devuelve { user: ... } o { data: ... }
        const userData = data.user || data.data || data; 
        
        console.log("🟢 Auth: Token válido. Usuario:", userData.usuario);
        
        setUser(userData);
        setToken(storedToken);
        
        // Actualizar datos frescos en storage
        localStorage.setItem('user_data', JSON.stringify(userData));
      } else {
        console.error("🔴 Auth: Backend rechazó el token.", res.status);
        logout(); 
      }
    } catch (error) {
      console.error('🔴 Auth: Error de red al validar token:', error);
      // En error de red, podrías optar por NO desloguear para permitir modo offline
      // Pero por seguridad, si falla la validación inicial, es mejor pedir login
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

  // Renderizado condicional para evitar parpadeos
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