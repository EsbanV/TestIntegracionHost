import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // 1. Inicializar Google
  useEffect(() => {
    const w = window as any;
    
    if (!GOOGLE_CLIENT_ID) {
      setError("Falta configurar VITE_GOOGLE_CLIENT_ID en el .env");
      return;
    }

    if (w.google && w.google.accounts) {
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        ux_mode: 'popup',
      });

      if (googleButtonRef.current) {
        w.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_blue',
          size: 'large',
          width: '320',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left'
        });
      }
    } else {
      setError("Error cargando servicios de Google. Revisa tu conexión.");
    }
  }, []);

  // 2. Callback
  const handleGoogleCallback = async (response: any) => {
    const idToken = response.credential;
    const payload = decodeJwt(idToken);
    
    if (!payload) {
      setError("No se pudo verificar la identidad de Google.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: idToken,
          email: payload.email,
          name: payload.name || payload.given_name,
          picture: payload.picture
        }),
      });

      const data: GoogleAuthResponse = await res.json();

      if (res.ok && data.ok) {
        login(data.accessToken, data.refreshToken, data.user);
        
        const role = data.user.role?.toUpperCase();

        if (role === 'ADMINISTRADOR' || role === 'ADMIN') {
           navigate('/admin', { replace: true });
        } else if (data.isNewUser || !data.user.campus) {
           navigate('/onboarding', { replace: true });
        } else {
           navigate('/home', { replace: true });
        }
      } else {
        throw new Error(data.message || "Error al iniciar sesión.");
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return { error, isLoading, googleButtonRef };
};