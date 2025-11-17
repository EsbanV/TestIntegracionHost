// src/utils/imageHelper.ts

const API_URL = import.meta.env.VITE_API_URL; // https://api-190...

export const getImageUrl = (path: string | undefined | null) => {
  if (!path) return "/img/user_default.png"; // Imagen por defecto si no hay nada

  // 1. Si ya es una URL completa (ej: Google Auth o imagen externa), la dejamos igual
  if (path.startsWith("http")) {
    return path;
  }

  // 2. Si es una ruta relativa (ej: /uploads/foto-123.jpg), le pegamos el dominio del VPS
  // Nos aseguramos de que no haya doble barra //
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${API_URL}${cleanPath}`;
};