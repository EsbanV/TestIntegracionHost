import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Agregamos Link
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ShieldCheck, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

// Assets
import loginBg from '@/assets/img/FondoLogin.jpg'; 

// Configuración
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;
const BACKGROUND_IMAGE = loginBg;

// Utils
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

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // 1. Inicializar Google
  useEffect(() => {
    const w = window as any;
    if (!GOOGLE_CLIENT_ID) {
      setError("Falta configurar VITE_GOOGLE_CLIENT_ID");
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
    }
  }, []);

  // 2. Callback Google
  const handleGoogleCallback = async (response: any) => {
    const idToken = response.credential;
    const payload = decodeJwt(idToken);
    
    if (!payload) { setError("No se pudo verificar la identidad."); return; }

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
        login(data.accessToken, data.refreshToken, data.user);
        const role = data.user.role?.toUpperCase();
        if (role === 'ADMINISTRADOR' || role === 'ADMIN') navigate('/admin', { replace: true });
        else if (data.isNewUser || !data.user.campus) navigate('/onboarding', { replace: true });
        else navigate('/home', { replace: true });
      } else {
        throw new Error(data.message || "Error al iniciar sesión.");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Fondo con Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={BACKGROUND_IMAGE} alt="Campus" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      </div>

      {/* TARJETA PRINCIPAL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "out" }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden z-10 mx-4 relative"
      >
        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 rotate-3"
          >
            <ShieldCheck className="text-white w-9 h-9" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">MarketUCT</h1>
          <p className="text-slate-500 text-sm font-medium">
            Comunidad exclusiva para estudiantes
          </p>
        </div>

        {/* Login Body */}
        <div className="px-8 pb-8">
          <div className="flex flex-col items-center gap-6">
            {/* Botón Google */}
            <div className="relative w-full flex justify-center min-h-[50px]">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-full backdrop-blur-sm border border-slate-100">
                  <Loader2 className="animate-spin text-blue-600" />
                </div>
              )}
              <div ref={googleButtonRef} className="overflow-hidden rounded-full shadow-md transition-transform hover:scale-[1.01]" />
            </div>

            {/* Dominios Permitidos */}
            <div className="text-center w-full">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-px bg-slate-200 flex-1"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acceso Exclusivo</span>
                 <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className="flex justify-center gap-2 text-xs font-medium text-slate-600">
                <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">@alu.uct.cl</span>
                <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">@uct.cl</span>
              </div>
            </div>
          </div>

          {/* Errores */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-red-50/80 border border-red-100 rounded-xl p-3 flex items-start gap-3 overflow-hidden"
              >
                <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER REDISEÑADO CON ENLACES */}
        <div className="bg-slate-50 border-t border-slate-100 p-5">
          
          {/* Enlaces de Navegación */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <Link 
              to="/about" 
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
            >
              <Info size={14} className="group-hover:scale-110 transition-transform"/>
              Acerca de
            </Link>
            
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            
            <Link 
              to="/terms" 
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              Términos
            </Link>
            
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            
            <a 
              href="https://uct.cl" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              UCT Oficial
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-wider">
            © {new Date().getFullYear()} MarketUCT • Hecho por estudiantes
          </p>
        </div>

      </motion.div>
    </div>
  );
}