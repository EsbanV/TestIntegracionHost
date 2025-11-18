import React from 'react';
import { 
  User, Phone, Home, MapPin, Check, Camera, UploadCloud, ArrowLeft, ArrowRight, FileText 
} from 'lucide-react';
import { CAMPUS_OPTIONS, StepProps } from './onboarding.types';

// --- PASO 1: DATOS BÁSICOS ---
export const StepOneBasicInfo = ({ formData, setFormData }: StepProps) => {
  
  // Handler para validar solo números y máximo 10 dígitos
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Regex: Solo permite dígitos (0-9)
    if (/^\d*$/.test(val)) {
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
             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             placeholder="Ej: juan.perez"
           />
        </div>
        <p className="text-xs text-slate-400">Este será tu identificador único en la plataforma.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-slate-700">Teléfono (Opcional)</label>
        <div className="relative">
           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           <input 
             type="tel" // Cambiado a tel para teclados móviles
             inputMode="numeric" // Fuerza teclado numérico
             value={formData.telefono}
             onChange={handlePhoneChange} // Usamos el nuevo handler
             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             placeholder="912345678"
           />
        </div>
        <p className="text-xs text-slate-400 text-right">
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
             placeholder="Para coordinar entregas"
           />
        </div>
      </div>
    </div>
  );
};

// --- PASO 2: CAMPUS (Sin cambios, pero incluido por completitud) ---
export const StepTwoCampus = ({ formData, setFormData }: StepProps) => (
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
              ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-200' 
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
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

// --- PASO 3: FOTO Y TÉRMINOS ---
export const StepThreePhoto = ({ formData, setFormData, imagePreview, fileInputRef, onImageSelect }: StepProps) => (
  <div className="space-y-8 py-6 text-center">
     <div className="space-y-2">
       <h3 className="text-lg font-semibold text-slate-800">¡Sonríe! 📸</h3>
       <p className="text-sm text-slate-500">Añade una foto para generar confianza.</p>
     </div>

     <div className="relative mx-auto w-32 h-32 group cursor-pointer" onClick={() => fileInputRef?.current?.click()}>
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative ring-1 ring-slate-200">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <User size={48} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <Camera className="text-white" size={32} />
          </div>
        </div>
        <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white transition-transform group-hover:scale-110">
          <UploadCloud size={16} />
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onImageSelect}
        />
     </div>

     {/* Checkbox de Términos y Condiciones */}
     <div className="pt-4">
        <label className="flex items-start gap-3 cursor-pointer group text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
            <div className="relative flex items-center">
                <input 
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600"
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                />
                <Check size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <div className="text-xs text-slate-600 leading-relaxed select-none">
                He leído y acepto los <span className="text-blue-600 font-semibold underline">Términos y Condiciones</span> y la Política de Privacidad del marketplace.
            </div>
        </label>
     </div>
  </div>
);

// --- FOOTER DE NAVEGACIÓN (Actualizado para recibir formData) ---
export const OnboardingFooter = ({ step, handleBack, handleNext, handleFinalSubmit, isLoading, canContinue, formData }: any) => {
  
  // Lógica para deshabilitar el botón FINALIZAR
  const isFinishDisabled = isLoading || (step === 3 && !formData?.acceptedTerms);

  // Lógica para deshabilitar botón CONTINUAR (pasos 1 y 2)
  const isNextDisabled = isLoading || (step !== 3 && !canContinue);

  return (
    <div className="mt-8 flex gap-3">
      {step > 1 && (
        <button 
          onClick={handleBack}
          disabled={isLoading}
          className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <button
        onClick={step === 3 ? handleFinalSubmit : handleNext}
        disabled={step === 3 ? isFinishDisabled : isNextDisabled}
        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-300"
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
  );
};