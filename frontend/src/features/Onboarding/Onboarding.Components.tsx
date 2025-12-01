import React from 'react';
import { 
  User, Phone, Home, MapPin, Check, Camera, UploadCloud, ArrowLeft, ArrowRight
} from 'lucide-react';
import { CAMPUS_OPTIONS, StepProps } from './onboarding.types';

// --- PASO 1: DATOS BÁSICOS ---
export const StepOneBasicInfo = ({ formData, setFormData }: StepProps) => {
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      if (val.length <= 10) {
        setFormData({ ...formData, telefono: val });
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-bold text-foreground">Nombre de Usuario</label>
        <div className="relative group">
           <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
           <input 
             value={formData.usuario}
             onChange={e => setFormData({...formData, usuario: e.target.value})}
             className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground"
             placeholder="Ej: juan.perez"
           />
        </div>
        <p className="text-xs text-muted-foreground">Identificador único en la plataforma.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-foreground">Teléfono (Opcional)</label>
        <div className="relative group">
           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
           <input 
             type="tel" 
             inputMode="numeric"
             value={formData.telefono}
             onChange={handlePhoneChange}
             className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium tracking-wide text-foreground placeholder:text-muted-foreground"
             placeholder="912345678"
           />
        </div>
        <p className={`text-xs text-right transition-colors ${formData.telefono.length === 10 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
            {formData.telefono.length}/10 dígitos
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-foreground">Dirección (Opcional)</label>
        <div className="relative group">
           <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
           <input 
             value={formData.direccion}
             onChange={e => setFormData({...formData, direccion: e.target.value})}
             className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
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
       <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 ring-4 ring-primary/5">
         <MapPin size={24} />
       </div>
       <h3 className="text-lg font-bold text-foreground">Selecciona tu Campus</h3>
       <p className="text-sm text-muted-foreground">Te mostraremos productos cercanos a ti.</p>
    </div>

    <div className="grid gap-3">
      {CAMPUS_OPTIONS.map((camp) => (
        <div 
          key={camp}
          onClick={() => setFormData({...formData, campus: camp})}
          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
            formData.campus === camp 
              ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' 
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <span className={`text-sm font-bold ${formData.campus === camp ? 'text-primary' : 'text-foreground'}`}>
            {camp}
          </span>
          {formData.campus === camp && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-sm animate-in zoom-in">
                <Check size={14} strokeWidth={3} />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// --- PASO 3: FOTO Y TÉRMINOS ---
interface StepThreeProps extends StepProps {
    onOpenTerms?: () => void;
}

export const StepThreePhoto = ({ 
  formData, setFormData, imagePreview, fileInputRef, onImageSelect, onOpenTerms 
}: StepThreeProps) => (
  <div className="space-y-8 py-6 text-center">
     <div className="space-y-2">
       <h3 className="text-lg font-bold text-foreground">Foto de Perfil 📸</h3>
       <p className="text-sm text-muted-foreground">Una buena foto aumenta la confianza en tus ventas.</p>
     </div>

     <div className="relative mx-auto w-36 h-36 group cursor-pointer" onClick={() => fileInputRef?.current?.click()}>
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-card shadow-xl bg-muted relative ring-1 ring-border">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
              <User size={64} strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
             <Camera className="text-white drop-shadow-md" size={32} />
          </div>
        </div>
        <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg border-4 border-card transition-transform group-hover:scale-110 hover:bg-primary/90">
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

     <div className="pt-6 border-t border-border mt-6">
        <label className="flex items-start gap-3 cursor-pointer group text-left p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
            <div className="relative flex items-center mt-0.5">
                <input 
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-muted-foreground transition-all checked:border-primary checked:bg-primary hover:border-primary"
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                />
                <Check size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none font-bold" strokeWidth={3} />
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed select-none">
                He leído y acepto los <span 
                    className="text-primary font-bold hover:underline hover:text-primary/80 transition-colors"
                    onClick={(e) => {
                        e.preventDefault(); 
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
  const isFinishDisabled = isLoading || (step === 3 && !formData?.acceptedTerms);
  const isNextDisabled = isLoading || (step !== 3 && !canContinue);

  return (
    <div className="mt-8 flex gap-3">
      {step > 1 && (
        <button 
          onClick={handleBack}
          disabled={isLoading}
          className="px-4 py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <button
        onClick={step === 3 ? handleFinalSubmit : handleNext}
        disabled={step === 3 ? isFinishDisabled : isNextDisabled}
        className={`
            flex-1 py-3 text-primary-foreground font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
            ${step === 3 && isFinishDisabled 
                ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/20'}
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