import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useOnboarding, formatWelcomeName } from '@/features/Onboarding/onboarding.hooks';
import { 
  StepOneBasicInfo, 
  StepTwoCampus, 
  StepThreePhoto, 
  OnboardingFooter 
} from '@/features/Onboarding/Onboarding.Components';
import { TermsModal } from '@/features/Onboarding/TermsModal';

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

  const [showTerms, setShowTerms] = useState(false);

  const handleAcceptTerms = () => {
    setFormData(prev => ({ ...prev, acceptedTerms: true }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return <StepOneBasicInfo formData={formData} setFormData={setFormData} isLoading={isLoading} />;
      case 2: return <StepTwoCampus formData={formData} setFormData={setFormData} isLoading={isLoading} />;
      case 3: return (
        <StepThreePhoto 
          formData={formData} 
          setFormData={setFormData} 
          isLoading={isLoading} 
          imagePreview={imagePreview} 
          fileInputRef={fileInputRef} 
          onImageSelect={handleImageSelect}
          onOpenTerms={() => setShowTerms(true)}
        />
      );
      default: return null;
    }
  };

  return (
    // Fondo transparente para ver el patrón del body (index.css)
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      
      {/* Tarjeta Principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card rounded-3xl shadow-2xl overflow-hidden border border-border z-0"
      >
        {/* Header Oscuro (Estilo "Night" para contraste con los blobs de luz) */}
        <div className="bg-zinc-950 p-8 pb-16 text-center relative overflow-hidden">
          <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-[-20px] w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hola, {formatWelcomeName(user?.nombre)}
            </h1>
            <p className="text-zinc-300 text-sm mt-1 font-medium">
              Vamos a configurar tu perfil universitario
            </p>
          </div>
        </div>

        {/* Contenido del Formulario */}
        <div className="relative -mt-8 px-6 pb-6">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            
            {/* Indicador de Pasos */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

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

            <OnboardingFooter 
                step={step} 
                handleBack={handleBack} 
                handleNext={handleNext} 
                handleFinalSubmit={handleFinalSubmit} 
                isLoading={isLoading}
                canContinue={step !== 1 || !!formData.usuario}
                formData={formData}
            />

          </div>
        </div>
      </motion.div>

      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        onAccept={handleAcceptTerms} 
      />
    </div>
  );
}