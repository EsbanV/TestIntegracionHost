import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext'; // Asegúrate que la ruta sea correcta
import { Loader2 } from 'lucide-react'; 

export default function AdminRoute() {
  // Extraemos 'user' y 'isLoading' directamente de tu contexto
  const { user, isLoading } = useAuth();

  // 1. ESTADO DE CARGA:
  // Si el AuthContext está verificando el token (validateToken), mostramos un spinner.
  // Esto evita que te redirija al login erróneamente antes de saber quién eres.
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Verificando permisos de administrador...</p>
      </div>
    );
  }

  // 2. NO AUTENTICADO:
  // Si terminó de cargar y 'user' es null, mandamos al login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. SIN PERMISOS:
  // Verificamos el rol que viene en tu interfaz AuthUser
  // Usamos toUpperCase() para seguridad (por si viene 'Admin', 'admin', 'ADMINISTRADOR')
  const role = user.role?.toUpperCase();
  
  // Ajusta 'ADMIN' o 'ADMINISTRADOR' según lo que guardes exactamente en tu base de datos
  if (role !== 'ADMIN' && role !== 'ADMINISTRADOR') {
    // Si es un usuario normal intentando entrar al admin, lo mandamos al home
    return <Navigate to="/home" replace />;
  }

  // 4. AUTORIZADO:
  // Si pasó todas las barreras, renderizamos el contenido de la ruta (Outlet)
  return <Outlet />;
}