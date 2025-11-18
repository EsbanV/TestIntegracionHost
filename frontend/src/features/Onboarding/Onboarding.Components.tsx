import React from 'react';
import { 
  User, Phone, Home, MapPin, Check, Camera, UploadCloud, ArrowLeft, ArrowRight
} from 'lucide-react';
import { CAMPUS_OPTIONS, StepProps } from './onboarding.types';

// --- PASO 1: DATOS BÁSICOS ---
export const StepOneBasicInfo = ({ formData, setFormData }: StepProps) => {
  
  // ✅ Validación Estricta: Solo números, máx 10 caracteres
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Regex: Permite cadena vacía o solo dígitos
    if (val === '' || /^\d+$/.test(val)) {
      if (val.length <= 10) {
        setFormData({ ...formData, telefono: val });
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Nombre de Usuario</label>
        <div className="relative">
           <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           <input 
             value={formData.usuario}
             onChange={e => setFormData({...formData, usuario: e.target.value})}
             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
             placeholder="Ej: juan.perez"
           />
        </div>
        <p className="text-xs text-slate-400">Identificador único en la plataforma.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Teléfono (Opcional)</label>
        <div className="relative">
           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           <input 
             type="tel" 
             inputMode="numeric"
             value={formData.telefono}
             onChange={handlePhoneChange}
             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium tracking-wide"
             placeholder="912345678"
           />
        </div>
        <p className={`text-xs text-right transition-colors ${formData.telefono.length === 10 ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
            {formData.telefono.length}/10 dígitos
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Dirección (Opcional)</label>
        <div className="relative">
           <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           <input 
             value={formData.direccion}
             onChange={e => setFormData({...formData, direccion: e.target.value})}
             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             placeholder="Ej: Villa Los Ríos #123"
           />
        </div>
      </div>
    </div>
  );
};

// --- PASO 2: CAMPUS ---
export const StepTwoCampus = ({ formData, setFormData }: StepProps) => (
  <div className="space-y-6 py-4">
    <div className="text-center space-y-2">
       <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 ring-4 ring-blue-50/50">
         <MapPin size={24} />
       </div>
       <h3 className="text-lg font-bold text-slate-800">Selecciona tu Campus</h3>
       <p className="text-sm text-slate-500">Te mostraremos productos cercanos a ti.</p>
    </div>

    <div className="grid gap-3">
      {CAMPUS_OPTIONS.map((camp) => (
        <div 
          key={camp}
          onClick={() => setFormData({...formData, campus: camp})}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
            formData.campus === camp 
              ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-200' 
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
          }`}
        >
          <span className={`text-sm font-bold ${formData.campus === camp ? 'text-blue-700' : 'text-slate-600'}`}>
            {camp}
          </span>
          {formData.campus === camp && (
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in">
                <Check size={14} strokeWidth={3} />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// --- PASO 3: FOTO Y TÉRMINOS ---
// Agregamos la prop onOpenTerms para abrir el modal
interface StepThreeProps extends StepProps {
    onOpenTerms?: () => void;
}

export const StepThreePhoto = ({ 
  formData, setFormData, imagePreview, fileInputRef, onImageSelect, onOpenTerms 
}: StepThreeProps) => (
  <div className="space-y-8 py-6 text-center">
     <div className="space-y-2">
       <h3 className="text-lg font-bold text-slate-800">Foto de Perfil 📸</h3>
       <p className="text-sm text-slate-500">Una buena foto aumenta la confianza en tus ventas.</p>
     </div>

     <div className="relative mx-auto w-36 h-36 group cursor-pointer" onClick={() => fileInputRef?.current?.click()}>
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative ring-1 ring-slate-200">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
              <User size={64} strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
             <Camera className="text-white drop-shadow-md" size={32} />
          </div>
        </div>
        <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg border-4 border-white transition-transform group-hover:scale-110 hover:bg-blue-700">
          <UploadCloud size={18} />
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onImageSelect}
        />
     </div>

     {/* ✅ Checkbox y Link al Modal */}
     <div className="pt-6 border-t border-slate-100 mt-6">
        <label className="flex items-start gap-3 cursor-pointer group text-left p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
            <div className="relative flex items-center mt-0.5">
                <input 
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600 hover:border-blue-400"
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                />
                <Check size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none font-bold" strokeWidth={3} />
            </div>
            <div className="text-xs text-slate-600 leading-relaxed select-none">
                He leído y acepto los <span 
                    className="text-blue-600 font-bold hover:underline hover:text-blue-800 transition-colors"
                    onClick={(e) => {
                        e.preventDefault(); // Evita marcar el check al hacer clic en el link
                        onOpenTerms?.();
                    }}
                >
                    Términos y Condiciones
                </span> y la Política de Privacidad de la plataforma.
            </div>
        </label>
     </div>
  </div>
);

// --- FOOTER ---
export const OnboardingFooter = ({ step, handleBack, handleNext, handleFinalSubmit, isLoading, canContinue, formData }: any) => {
  
  // ✅ Bloqueo si no acepta términos en el paso 3
  const isFinishDisabled = isLoading || (step === 3 && !formData?.acceptedTerms);
  const isNextDisabled = isLoading || (step !== 3 && !canContinue);

  return (
    <div className="mt-8 flex gap-3">
      {step > 1 && (
        <button 
          onClick={handleBack}
          disabled={isLoading}
          className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <button
        onClick={step === 3 ? handleFinalSubmit : handleNext}
        disabled={step === 3 ? isFinishDisabled : isNextDisabled}
        className={`
            flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
            ${step === 3 && isFinishDisabled 
                ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}
        `}
      >
        {isLoading ? (
          'Guardando...'
        ) : step === 3 ? (
          <>Finalizar <Check size={18} strokeWidth={3} /></>
        ) : (
          <>Continuar <ArrowRight size={18} strokeWidth={3} /></>
        )}
      </button>
    </div>
  );
};