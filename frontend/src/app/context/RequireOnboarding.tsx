// RequireSetup.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';

export const RequireSetup = () => {
  const { user } = useAuth();
  
  // Si está logueado pero no tiene campus, forzar onboarding
  if (user && !user.campus) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <Outlet />;
};