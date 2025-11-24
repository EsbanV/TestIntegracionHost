import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { getImageUrl } from '@/app/imageHelper';
import { CAMPUS_OPTIONS, OnboardingFormData } from './onboarding.types';

const API_URL = import.meta.env.VITE_API_URL;

export const formatWelcomeName = (fullName?: string) => {
  if (!fullName) return "Usuario";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0];
};

export const useOnboarding = () => {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState<OnboardingFormData>({
    usuario: user?.usuario || '',
    telefono: '',
    direccion: '',
    campus: CAMPUS_OPTIONS[0],
    acceptedTerms: false // <--- Inicializado en false
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(getImageUrl(user?.fotoPerfilUrl));
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!token) return;
    
    // Validación extra de seguridad
    if (!formData.acceptedTerms) {
        alert("Debes aceptar los términos y condiciones.");
        return;
    }

    setIsLoading(true);
    
    try {
      let finalPhotoUrl = user?.fotoPerfilUrl;

      // 1. Subir Foto
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('photo', selectedImage);

        const resImg = await fetch(`${API_URL}/api/upload/profile-photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData
        });
        
        const dataImg = await resImg.json();
        if (dataImg.ok) finalPhotoUrl = dataImg.photoUrl;
      }

      // 2. Actualizar Perfil (Excluimos acceptedTerms del envío)
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
        const updatedUser = { 
          ...user!, 
          ...formData, // Esto guarda acceptedTerms en local, pero no afecta al backend
          fotoPerfilUrl: finalPhotoUrl
        };

        const currentRefreshToken = localStorage.getItem('refresh_token') || '';
        login(token, currentRefreshToken, updatedUser);
        navigate('/home', { replace: true });
      } else {
        alert("Error al guardar: " + (dataProfile.message || "Intente nuevamente"));
      }

    } catch (error) {
      console.error("Error crítico en onboarding:", error);
      alert("Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
};