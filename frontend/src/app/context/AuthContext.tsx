import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  role: string;
  campus?: string | null;
  fotoPerfilUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para intentar renovar el token
  const refreshSession = async (refreshToken: string) => {
    try {
      console.log("🔄 Intentando renovar token...");
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        console.log("✅ Token renovado con éxito");
        // Guardamos los nuevos tokens
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        setToken(data.accessToken);
        return data.accessToken; // Retornamos el nuevo token para usarlo ya
      } else {
        throw new Error("No se pudo renovar");
      }
    } catch (error) {
      console.error("❌ Falló la renovación de sesión:", error);
      logout();
      return null;
    }
  };

  const validateToken = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user_data');

    if (!storedToken || !storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    // Carga optimista inicial
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }

    try {
      // Intentar validar el token actual
      let currentToken = storedToken;
      let res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      // Si falla por token expirado (401 o 403), intentamos refrescar
      if (res.status === 401 || res.status === 403) {
        const newToken = await refreshSession(storedRefreshToken);
        if (newToken) {
          // Reintentar la petición con el nuevo token
          currentToken = newToken;
          res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
        } else {
           // Si no se pudo refrescar, termina aquí (logout ya fue llamado en refreshSession)
           return;
        }
      }

      if (res.ok) {
        const data = await res.json();
        const userData = data.user || data.data;
        setUser(userData);
        setToken(currentToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
      } else {
        // Si falla por otra razón (ej: usuario borrado de BD), cerrar sesión
        logout();
      }
    } catch (error) {
      console.error('Error validando sesión:', error);
      // En error de red, mantenemos la sesión optimista o forzamos logout según prefieras
      // logout(); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = (accessToken: string, refreshToken: string, newUser: AuthUser) => {
    setToken(accessToken);
    setUser(newUser);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken); // Guardamos el refresh token
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    // Opcional: Limpiar historial y forzar recarga
    // window.location.href = '/login';
  };

  const value = { user, token, login, logout, isLoading };

  if (isLoading) return <LoadingScreen />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ... (Tus componentes ProtectedRoute y LoadingScreen siguen igual) ...
export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 font-medium animate-pulse">Conectando...</p>
  </div>
);