import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, AuthState } from '@/store/authStore';
// ¡NO importamos 'shallow' esta vez!

// --- MEJORA (Anti-Loop Infinito) ---
// En lugar de 'shallow', usamos dos selectores simples.
// Este es el mismo patrón que SÍ funciona en ProtectedRoute.tsx
const useAdminAuthStatus = () => useAuthStore((state: AuthState) => state.authStatus);
const useAdminUserRole = () => useAuthStore((state: AuthState) => state.user?.rol);
// ----------------------------------

const AdminRoute = () => {
  // Llamamos a los dos hooks simples por separado
  const authStatus = useAdminAuthStatus();
  const userRole = useAdminUserRole();
  
  // Tus logs de depuración
  console.log('🔐 AdminRoute - Estado actual:');
  console.log('     authStatus:', authStatus);
  console.log('     userRole:', userRole);

  if (authStatus === 'loading') {
    return <div>Cargando...</div>;
  }

  if (authStatus === 'unauthenticated') {
    console.log('❌ Redirigiendo a login: usuario no logueado');
    return <Navigate to="/login" replace />;
  }

  // El rol en la BD es 'ADMIN' (mayúsculas)
  if (userRole !== 'ADMIN') { 
    console.log('❌ Redirigiendo a home: usuario no es admin, rol actual:', userRole);
    return <Navigate to="/home" replace />;
  }

  console.log('✅ Acceso permitido: usuario es admin');
  return <Outlet />;
};

export default AdminRoute;