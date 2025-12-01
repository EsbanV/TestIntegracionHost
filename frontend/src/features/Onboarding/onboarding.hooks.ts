import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { getImageUrl } from '@/app/imageHelper';
import { CAMPUS_OPTIONS, OnboardingFormData } from './onboarding.types';

const API_URL = import.meta.env.VITE_API_URL;

// --- UTILS ---
export const formatWelcomeName = (fullName?: string) => {
  if (!fullName) return "Usuario";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0];
};

export const useOnboarding = () => {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  
  // Estados de UI
  const [step, setStep] = useState(1);
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

  // --- HANDLERS UI ---

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // --- MUTACIÓN (Lógica de Negocio) ---

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No hay sesión activa");

      let finalPhotoUrl = user?.fotoPerfilUrl;

      // 1. Subir Foto (Si se seleccionó una nueva)
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('photo', selectedImage);

        const resImg = await fetch(`${API_URL}/api/upload/profile-photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData
        });
        
        const dataImg = await resImg.json();
        if (!resImg.ok) throw new Error(dataImg.message || "Error al subir imagen");
        
        finalPhotoUrl = dataImg.photoUrl;
      }

      // 2. Actualizar Perfil de Usuario
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
          campus: formData.campus,
          // Enviamos la URL de la foto explícitamente para asegurar consistencia
          fotoPerfilUrl: finalPhotoUrl 
        })
      });

      const dataProfile = await resProfile.json();
      if (!resProfile.ok) throw new Error(dataProfile.message || "Error al actualizar perfil");

      return { ...formData, fotoPerfilUrl: finalPhotoUrl };
    },
    onSuccess: (updatedData) => {
      // 3. Actualizar Contexto de Auth (Local)
      if (user) {
        const updatedUser = { 
          ...user, 
          ...updatedData, 
          // Aseguramos que acceptedTerms se guarde si el backend lo requiere, 
          // aunque usualmente es solo check de UI
        };
        const currentRefreshToken = localStorage.getItem('refresh_token') || '';
        login(token!, currentRefreshToken, updatedUser);
      }

      // 4. Navegar al Home
      navigate('/home', { replace: true });
    },
    onError: (error: Error) => {
      console.error("Error en onboarding:", error);
      alert(error.message || "Ocurrió un error inesperado.");
    }
  });

  const handleFinalSubmit = () => {
    if (!formData.acceptedTerms) {
      alert("Debes aceptar los términos y condiciones para continuar.");
      return;
    }
    submitMutation.mutate();
  };

  return {
    user,
    step,
    isLoading: submitMutation.isPending, // Estado automático de React Query
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