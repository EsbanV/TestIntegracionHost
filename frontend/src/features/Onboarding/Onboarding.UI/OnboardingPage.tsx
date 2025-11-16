import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/context/AuthContext';
import { Check, MapPin, Phone, User } from 'lucide-react';

// Reutilizamos tus componentes UI internos (o impórtalos si los sacaste a archivos aparte)
// Asumo que tienes Button y Input disponibles o usamos HTML estándar con clases Tailwind

const CAMPUS_OPTIONS = ["San Francisco", "San Juan Pablo II", "Menchaca Lira", "Norte"];
const API_URL = import.meta.env.VITE_API_URL;

export default function OnboardingPage() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    campus: CAMPUS_OPTIONS[0],
    telefono: '',
    direccion: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // Actualizamos el usuario en el contexto con los nuevos datos
        // Importante para que la app sepa que ya tiene campus
        const updatedUser = { ...user!, ...formData };
        login(token!, updatedUser);
        
        // Redirigir al home
        navigate('/home', { replace: true });
      }
    } catch (error) {
      console.error("Error en onboarding", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100"
      >
        {/* Header con gradiente */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-900/50">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">¡Bienvenido, {user?.nombre}!</h1>
          <p className="text-blue-200 text-sm mt-2">Termina de configurar tu perfil para empezar.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Selección de Campus */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ¿En qué campus estudias?
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={formData.campus}
                onChange={(e) => setFormData({...formData, campus: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teléfono de contacto
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                placeholder="+56 9 1234 5678"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLoading ? 'Guardando...' : <>Finalizar <Check size={18} /></>}
          </button>

        </form>
      </motion.div>
    </div>
  );
}