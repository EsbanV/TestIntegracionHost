import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/context/AuthContext';
import { 
  ArrowRight, ArrowLeft, Check, Camera, MapPin, 
  User, Phone, Home, UploadCloud 
} from 'lucide-react';
import { getImageUrl } from '@/app/imageHelper';

const CAMPUS_OPTIONS = ["San Francisco", "San Juan Pablo II"];
const API_URL = import.meta.env.VITE_API_URL;

// Helper para obtener "PrimerNombre PrimerApellido"
const formatWelcomeName = (fullName?: string) => {
  if (!fullName) return "Usuario";
  const parts = fullName.trim().split(/\s+/);
  // Si tiene al menos dos partes, tomamos la 1ra y la 2da (o la última si queremos ser estrictos con apellido)
  // Aquí tomamos las dos primeras palabras asumiendo "Nombre Apellido"
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0];
};

export default function OnboardingPage() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del formulario completo
  const [formData, setFormData] = useState({
    usuario: user?.usuario || '',
    // Nota: 'nombre' no se edita en PUT /profile según tu backend, solo se muestra
    telefono: '',
    direccion: '',
    campus: CAMPUS_OPTIONS[0]
  });

  // Estado para la imagen
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(getImageUrl(user?.fotoPerfilUrl));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MANEJADORES ---

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      let finalPhotoUrl = user?.fotoPerfilUrl;

      // 1. Subir Foto (sin cambios...)
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('photo', selectedImage);

        const resImg = await fetch(`${API_URL}/api/upload/profile-photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData
        });
        
        const dataImg = await resImg.json();
        if (dataImg.ok) {
          finalPhotoUrl = dataImg.photoUrl;
        }
      }

      // 2. Actualizar Datos (sin cambios...)
      const resProfile = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario: formData.usuario,
          telefono: formData.telefono,
          direccion: formData.direccion,
          campus: formData.campus
        })
      });

      const dataProfile = await resProfile.json();

      if (dataProfile.ok) {
        // 3. Actualizar Contexto y Redirigir
        const updatedUser = { 
          ...user!, 
          ...formData,
          fotoPerfilUrl: finalPhotoUrl
        };

        // 👇 CORRECCIÓN AQUÍ: Recuperar el refresh token y pasarlo
        const currentRefreshToken = localStorage.getItem('refresh_token') || '';
        
        // Pasamos los 3 argumentos requeridos: token, refreshToken, usuario
        login(token!, currentRefreshToken, updatedUser);
        
        navigate('/home', { replace: true });
      } else {
        console.error("Error actualizando perfil:", dataProfile.message);
      }

    } catch (error) {
      console.error("Error crítico en onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERIZADO DE PASOS ---

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Nombre de Usuario</label>
              <div className="relative">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                 <input 
                   value={formData.usuario}
                   onChange={e => setFormData({...formData, usuario: e.target.value})}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="Ej: juan.perez"
                 />
              </div>
              <p className="text-xs text-slate-400">Este será tu identificador único en la plataforma.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Teléfono</label>
              <div className="relative">
                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                 <input 
                   type="tel"
                   value={formData.telefono}
                   onChange={e => setFormData({...formData, telefono: e.target.value})}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="+56 9 1234 5678"
                 />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Dirección (Opcional)</label>
              <div className="relative">
                 <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                 <input 
                   value={formData.direccion}
                   onChange={e => setFormData({...formData, direccion: e.target.value})}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="Para coordinar entregas"
                 />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
               <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                 <MapPin size={24} />
               </div>
               <h3 className="text-lg font-semibold text-slate-800">Selecciona tu Campus</h3>
               <p className="text-sm text-slate-500">Esto ayuda a mostrarte productos cercanos.</p>
            </div>

            <div className="grid gap-3">
              {CAMPUS_OPTIONS.map((camp) => (
                <div 
                  key={camp}
                  onClick={() => setFormData({...formData, campus: camp})}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    formData.campus === camp 
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-sm font-medium ${formData.campus === camp ? 'text-blue-700' : 'text-slate-600'}`}>
                    {camp}
                  </span>
                  {formData.campus === camp && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check size={12}/></div>}
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 py-6 text-center">
             <div className="space-y-2">
               <h3 className="text-lg font-semibold text-slate-800">¡Sonríe! 📸</h3>
               <p className="text-sm text-slate-500">Añade una foto para generar confianza.</p>
             </div>

             <div className="relative mx-auto w-32 h-32 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User size={48} />
                    </div>
                  )}
                  {/* Overlay Hover */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="text-white" size={32} />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white">
                  <UploadCloud size={16} />
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageSelect}
                />
             </div>

             <p className="text-xs text-slate-400">
               Puedes cambiarla más tarde en tu perfil.
             </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        {/* HEADER GRÁFICO */}
        <div className="bg-slate-900 p-8 pb-16 text-center relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-[-20px] w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hola, {formatWelcomeName(user?.nombre)}
            </h1>
            <p className="text-blue-200 text-sm mt-1 font-medium">
              Vamos a configurar tu cuenta
            </p>
          </div>
        </div>

        {/* CARD FLOTANTE CON CONTENIDO */}
        <div className="relative -mt-8 px-6 pb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            
            {/* Barra de Progreso */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= step ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Contenido Dinámico */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Footer de Navegación */}
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button 
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              
              <button
                onClick={step === 3 ? handleFinalSubmit : handleNext}
                disabled={isLoading || (step === 1 && !formData.usuario)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  'Guardando...'
                ) : step === 3 ? (
                  <>Finalizar <Check size={18} /></>
                ) : (
                  <>Continuar <ArrowRight size={18} /></>
                )}
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}