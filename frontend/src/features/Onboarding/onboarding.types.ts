// src/features/onboarding/types/onboarding.types.ts

export interface OnboardingFormData {
  usuario: string;
  telefono: string;
  direccion: string;
  campus: string;
  acceptedTerms: boolean; // <--- Nuevo campo
}

export interface StepProps {
  formData: OnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
  isLoading: boolean;
  imagePreview?: string | null;
  onImageSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

export const CAMPUS_OPTIONS = ["San Francisco", "San Juan Pablo II"];