import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useOnboarding, formatWelcomeName } from '@/features/Onboarding/onboarding.hooks';

// Componentes
import { 
  StepOneBasicInfo, 
  StepTwoCampus, 
  StepThreePhoto, 
  OnboardingFooter 
} from '@/features/Onboarding//Onboarding.Components';

export default function OnboardingPage() {
  const {
    user,
    step,
    isLoading,
    formData,
    setFormData,
    imagePreview,
    fileInputRef,
    handleImageSelect,
    handleNext,
    handleBack,
    handleFinalSubmit
  } = useOnboarding();

  // Renderizado dinámico del contenido
  const renderStepContent = () => {
    switch (step) {
      case 1: return <StepOneBasicInfo formData={formData} setFormData={setFormData} isLoading={isLoading} />;
      case 2: return <StepTwoCampus formData={formData} setFormData={setFormData} isLoading={isLoading} />;
      case 3: return <StepThreePhoto formData={formData} setFormData={setFormData} isLoading={isLoading} imagePreview={imagePreview} fileInputRef={fileInputRef} onImageSelect={handleImageSelect} />;
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

        {/* CARD FLOTANTE */}
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

            {/* Contenido del Paso */}
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
            <OnboardingFooter 
                step={step} 
                handleBack={handleBack} 
                handleNext={handleNext} 
                handleFinalSubmit={handleFinalSubmit} 
                isLoading={isLoading}
                canContinue={step !== 1 || !!formData.usuario} // Validación simple para paso 1
            />

          </div>
        </div>
      </motion.div>
    </div>
  );
}