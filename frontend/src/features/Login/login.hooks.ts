import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import type { GoogleAuthResponse } from './login.types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;

// --- UTILIDAD INTERNA ---
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const useGoogleLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // 1. MUTACIÓN (Lógica de autenticación con Backend)
  const loginMutation = useMutation({
    mutationFn: async (googleData: { idToken: string, email: string, name: string, picture: string }) => {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Error al iniciar sesión con Google.");
      }

      return data as GoogleAuthResponse;
    },
    onSuccess: (data) => {
      // 1. Guardar sesión en Contexto
      login(data.accessToken, data.refreshToken, data.user);
      
      // 2. Lógica de Redirección según Rol/Estado
      const role = data.user.role?.toUpperCase();

      if (role === 'ADMINISTRADOR' || role === 'ADMIN') {
         navigate('/admin', { replace: true });
      } else if (data.isNewUser || !data.user.campus) {
         navigate('/onboarding', { replace: true });
      } else {
         navigate('/home', { replace: true });
      }
    },
    onError: (err) => {
      console.error("Login Error:", err);
    }
  });

  // 2. INICIALIZACIÓN DE GOOGLE (Script)
  useEffect(() => {
    const w = window as any;
    
    if (!GOOGLE_CLIENT_ID) {
      console.error("Falta configurar VITE_GOOGLE_CLIENT_ID");
      return;
    }

    const handleGoogleCallback = (response: any) => {
      const idToken = response.credential;
      const payload = decodeJwt(idToken);
      
      if (!payload) {
        console.error("No se pudo verificar la identidad de Google.");
        return;
      }

      // Disparar mutación
      loginMutation.mutate({
        idToken: idToken,
        email: payload.email,
        name: payload.name || payload.given_name,
        picture: payload.picture
      });
    };

    if (w.google && w.google.accounts) {
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        ux_mode: 'popup',
      });

      if (googleButtonRef.current) {
        w.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_blue', // Estilo nativo de Google (no se puede cambiar con CSS)
          size: 'large',
          width: '100%', // Intentar ocupar el ancho del contenedor padre
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left'
        });
      }
    }
  }, []);

  return { 
    googleButtonRef, 
    isLoading: loginMutation.isPending, 
    error: loginMutation.error ? (loginMutation.error as Error).message : null 
  };
};