import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

// --- CONFIGURACIÓN ---
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;
const ALLOWED_DOMAINS = ["alu.uct.cl", "uct.cl"];

// --- UTILIDADES INTERNAS ---

// Decodificar JWT para leer datos básicos antes de enviarlos al backend
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
  
  // Referencia para el botón de Google
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // 1. Inicializar Google Identity Services
  useEffect(() => {
    // Verificar si el script de Google está cargado en index.html
    // <script src="https://accounts.google.com/gsi/client" async defer></script>
    const w = window as any;
    
    if (!GOOGLE_CLIENT_ID) {
      setError("Falta configurar VITE_GOOGLE_CLIENT_ID en el .env");
      return;
    }

    if (w.google && w.google.accounts) {
      // Inicializar
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false, // No forzar login automático para evitar bucles
        ux_mode: 'popup',
      });

      // Renderizar botón
      if (googleButtonRef.current) {
        w.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '350', // Ancho en px
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
    
    // A. Validaciones preliminares en Frontend
    const payload = decodeJwt(idToken);
    if (!payload) {
      setError("No se pudo verificar la identidad de Google.");
      return;
    }

    const email = payload.email;
    const domain = email.split('@')[1];

    if (!ALLOWED_DOMAINS.includes(domain)) {
      setError(`Solo se permite el ingreso con correos institucionales (@${ALLOWED_DOMAINS.join(', @')}).`);
      return;
    }

    // B. Enviar al Backend
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: idToken,
          email: payload.email,
          name: payload.name || payload.given_name
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // C. Login Exitoso
        login(data.token, data.user);
        navigate('/home', { replace: true });
      } else {
        // D. Error del Backend
        throw new Error(data.message || "Error al iniciar sesión en el servidor");
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10"
      >
        {/* Header */}
        <div className="bg-white p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido a MarketUCT</h1>
          <p className="text-slate-500 text-sm px-4">
            La plataforma de compra y venta exclusiva para la comunidad universitaria.
          </p>
        </div>

        {/* Login Area */}
        <div className="p-8 pt-6">
          {/* Botón Google Container */}
          <div className="flex justify-center min-h-[50px] mb-6 relative">
            {/* Loader superpuesto si está cargando */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            )}
            <div ref={googleButtonRef} className="w-full flex justify-center" />
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
              Acceso exclusivo
            </p>
            <div className="flex justify-center gap-2 text-xs text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">@alu.uct.cl</span>
              <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">@uct.cl</span>
            </div>
          </div>

          {/* Mensaje de Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3"
              >
                <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} MarketUCT. Todos los derechos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}