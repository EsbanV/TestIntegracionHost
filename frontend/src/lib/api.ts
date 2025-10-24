// Un simple helper para fetch que maneja errores y JSON.
async function apiFetch(url: string, options: RequestInit = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Aquí podrías añadir tu token de autenticación si lo tienes
      // 'Authorization': `Bearer ${getToken()}`
    },
  };

  const res = await fetch(url, { ...defaultOptions, ...options });

  if (!res.ok) {
    // Si la respuesta no es OK, intenta parsear el error
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Ocurrió un error en la solicitud');
  }

  // Si no hay contenido (ej. en un DELETE), devuelve un objeto vacío
  if (res.status === 204) {
    return {};
  }
  
  return res.json();
}

// Exportamos métodos específicos
export const api = {
  get: <T>(url: string): Promise<T> => apiFetch(url),
  
  post: <T, U>(url: string, body: U): Promise<T> => 
    apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  
  // Puedes añadir put, patch, delete si los necesitas
  // ...
};