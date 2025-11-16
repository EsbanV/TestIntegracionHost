import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

// --- IMPORTA TU IMAGEN AQUÍ ---
import loginBg from '@/assets/img/FondoLogin.jpg'; 

// --- CONFIGURACIÓN ---
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;

// Imagen de fondo
const BACKGROUND_IMAGE = loginBg;

// --- UTILIDADES INTERNAS ---
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

// --- COMPONENTE PRINCIPAL ---

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // 1. Inicializar Google Identity Services
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

  // 2. Manejar la respuesta de Google
  const handleGoogleCallback = async (response: any) => {
    const idToken = response.credential;
    const payload = decodeJwt(idToken);
    
    if (!payload) {
      setError("No se pudo verificar la identidad de Google.");
      return;
    }

    // NOTA: Ya no bloqueamos por dominio aquí en el frontend.
    // Dejamos que el backend decida si el usuario es válido (Estudiante UCT o Admin Externo).

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

      const data = await res.json();

      if (res.ok && data.ok) {
        // Login exitoso en AuthContext
        login(data.accessToken, data.refreshToken, data.user);
        
        // --- REDIRECCIÓN INTELIGENTE ---
        const role = data.user.role?.toUpperCase();

        if (role === 'ADMINISTRADOR' || role === 'ADMIN') {
           // Si es admin, va directo al panel
           navigate('/admin', { replace: true });
        } else if (data.isNewUser || !data.user.campus) {
           // Si es nuevo o le faltan datos, al onboarding
           navigate('/onboarding', { replace: true });
        } else {
           // Usuario normal completo, al home
           navigate('/home', { replace: true });
        }

      } else {
        // Mostrar el error específico del backend (ej: "Acceso denegado...")
        throw new Error(data.message || "Error al iniciar sesión.");
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      
      {/* --- FONDO PERSONALIZADO --- */}
      <div className="absolute inset-0 z-0">
        <img 
          src={BACKGROUND_IMAGE} 
          alt="Fondo Campus" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      </div>

      {/* --- TARJETA DE LOGIN --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "out" }}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden z-10 mx-4"
      >
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="text-white w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">MarketUCT</h1>
          <p className="text-slate-500 text-sm font-medium">
            Comunidad exclusiva universitaria
          </p>
        </div>

        {/* Login Area */}
        <div className="p-8 pt-8">
          
          {/* Botón Google */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full flex justify-center min-h-[50px]">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-full">
                  <Loader2 className="animate-spin text-blue-600" />
                </div>
              )}
              <div ref={googleButtonRef} className="overflow-hidden rounded-full shadow-md" />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Dominios permitidos
            </p>
            <div className="flex justify-center gap-2 text-xs font-medium text-slate-600">
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">@alu.uct.cl</span>
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">@uct.cl</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              * Administradores pueden ingresar con cualquier correo registrado.
            </p>
          </div>

          {/* Mensaje de Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 bg-red-50/80 border border-red-100 rounded-xl p-3 flex items-start gap-3"
              >
                <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-slate-50/50 p-4 text-center border-t border-slate-200/50">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} MarketUCT • Compra y vende seguro
          </p>
        </div>
      </motion.div>
    </div>
  );
}