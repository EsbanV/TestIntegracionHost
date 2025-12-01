import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/context/AuthContext';
import { CreateProductFormData, CATEGORY_MAP } from './crearPublicacion.types';
import { forumKeys } from '@/features/Forum/forum.keys'; // Asegúrate de que la ruta sea correcta

const API_URL = import.meta.env.VITE_API_URL;

// Utilidad interna
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const useCreatePublication = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient(); // Cliente para invalidar caché
  
  // Estados de UI (Formulario)
  const [formData, setFormData] = useState<CreateProductFormData>({
    titulo: '',
    precio: '',
    stock: '1',
    categoria: '',
    campus: '',
    descripcion: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [success, setSuccess] = useState<{ message: string, isPromotion: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- HANDLERS UI ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (images.length + newImages.length > 5) {
        setError("Máximo 5 imágenes permitidas");
        return;
      }
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- MUTACIÓN (Lógica de Servidor) ---

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Preparar Payload
      const base64Images = await Promise.all(images.map(file => convertFileToBase64(file)));

      const payload = {
        nombre: formData.titulo,
        descripcion: formData.descripcion,
        precioActual: parseFloat(formData.precio),
        precioAnterior: null,
        categoriaId: CATEGORY_MAP[formData.categoria] || 5,
        cantidad: parseInt(formData.stock) || 1,
        estadoProducto: 'usado', 
        informacionTecnica: formData.campus ? `Ubicación: ${formData.campus}` : '', 
        tiempoUso: '',
        imagenes: base64Images
      };

      // 2. Petición
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.errors?.[0]?.msg || "Error al publicar");
      }

      return data;
    },
    onSuccess: (data) => {
      setSuccess({
        message: "¡Producto publicado con éxito!",
        isPromotion: data.roleChanged
      });

      // 🚀 INVALIDACIÓN DE CACHÉ (MAGIA)
      // Esto le dice a React Query: "Los datos de 'mis publicaciones' y 'home' son viejos, recárgalos".
      queryClient.invalidateQueries({ queryKey: forumKeys.myPublications() });
      queryClient.invalidateQueries({ queryKey: forumKeys.publications() });

      // Navegar
      setTimeout(() => {
        navigate('/mis-publicaciones'); 
      }, 1500);
    },
    onError: (err: any) => {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado");
    }
  });

  // --- SUBMIT WRAPPER ---
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones síncronas antes de la mutación
    if (!formData.titulo || !formData.precio || !formData.categoria) {
      setError("Completa los campos obligatorios (Título, Precio, Categoría)");
      return;
    }
    if (images.length === 0) {
      setError("Sube al menos una imagen");
      return;
    }

    createMutation.mutate();
  };

  const handleCancel = () => navigate(-1);

  return {
    formData,
    images,
    isLoading: createMutation.isPending, // Usamos el estado de la mutación
    error,
    success,
    handleChange,
    handleImageUpload,
    removeImage,
    handleSubmit,
    handleCancel
  };
};