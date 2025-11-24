import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { getImageUrl } from '@/app/imageHelper';
import { CAMPUS_OPTIONS, OnboardingFormData } from './onboarding.types';
import API from '@/api/axiosInstance';

export const formatWelcomeName = (fullName?: string) => {
  if (!fullName) return "Usuario";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0];
};

export const useOnboarding = () => {
  const { user, login } = useAuth(); 
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    usuario: user?.usuario || '',
    telefono: '',
    direccion: '',
    campus: CAMPUS_OPTIONS[0],
    acceptedTerms: false 
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
    if (!formData.acceptedTerms) {
        alert("Debes aceptar los términos y condiciones.");
        return;
    }

    setIsLoading(true);
    
    try {
      let finalPhotoUrl = user?.fotoPerfilUrl;

      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('photo', selectedImage);

        const { data: dataImg } = await API.post('/upload/profile-photo', imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (dataImg.ok) finalPhotoUrl = dataImg.photoUrl;
      }

      const { data: dataProfile } = await API.put('/users/profile', {
        usuario: formData.usuario,
        telefono: formData.telefono,
        direccion: formData.direccion,
        campus: formData.campus
      });

      if (dataProfile.ok) {
        const updatedUser = { 
          ...user!, 
          ...formData, 
          fotoPerfilUrl: finalPhotoUrl
        };

        const currentToken = localStorage.getItem('authToken') || ''; 
        const currentRefreshToken = localStorage.getItem('refresh_token') || '';
        
        login(currentToken, currentRefreshToken, updatedUser);
        navigate('/home', { replace: true });
      } else {
        alert("Error al guardar: " + (dataProfile.message || "Intente nuevamente"));
      }

    } catch (error: any) {
      console.error("Error crítico en onboarding:", error);
      const msg = error.response?.data?.message || "Ocurrió un error de conexión.";
      alert(msg);
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