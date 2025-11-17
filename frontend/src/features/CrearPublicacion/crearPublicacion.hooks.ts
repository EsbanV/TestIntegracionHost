import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import { CreateProductFormData, CATEGORY_MAP } from './crearPublicacion.types';

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
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string, isPromotion: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateProductFormData>({
    titulo: '',
    precio: '',
    stock: '1',
    categoria: '',
    campus: '',
    descripcion: ''
  });

  const [images, setImages] = useState<File[]>([]);

  // Handlers de Formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  // Handlers de Imagen
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

  // Envío del Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validaciones básicas
    if (!formData.titulo || !formData.precio || !formData.categoria) {
      setError("Completa los campos obligatorios (Título, Precio, Categoría)");
      setIsLoading(false);
      return;
    }
    if (images.length === 0) {
      setError("Sube al menos una imagen");
      setIsLoading(false);
      return;
    }

    try {
      // Convertir imágenes a Base64
      const base64Images = await Promise.all(images.map(file => convertFileToBase64(file)));

      const payload = {
        nombre: formData.titulo,
        descripcion: formData.descripcion,
        precioActual: parseFloat(formData.precio),
        precioAnterior: null,
        categoriaId: CATEGORY_MAP[formData.categoria] || 5, // Default a 'Otros'
        cantidad: parseInt(formData.stock) || 1,
        // Valores por defecto requeridos por BD
        estadoProducto: 'usado', 
        informacionTecnica: formData.campus ? `Ubicación: ${formData.campus}` : '', 
        tiempoUso: '',
        imagenes: base64Images
      };

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

      setSuccess({
        message: "¡Producto publicado con éxito!",
        isPromotion: data.roleChanged
      });

      setTimeout(() => {
        navigate('/home'); // O /mis-publicaciones
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return {
    formData,
    images,
    isLoading,
    error,
    success,
    handleChange,
    handleImageUpload,
    removeImage,
    handleSubmit,
    handleCancel
  };
};