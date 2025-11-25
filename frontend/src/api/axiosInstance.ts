// src/api/axiosInstance.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Definimos el tipo para los parámetros de búsqueda, si los hay
type Params = Record<string, any>; 

const URL_BASE: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const API: AxiosInstance = axios.create({
  baseURL: URL_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE SOLICITUD (REQUEST) ---
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); 
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPUESTA (RESPONSE) ---
API.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Lógica para 401 (redirección)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken'); 
      localStorage.removeItem('user'); 
      window.location.href = '/login'; 
    }

    const errorMessage = 
      error.response?.data?.message ||
      error.message ||
      'Ocurrió un error inesperado';

    return Promise.reject(errorMessage); 
  }
);

/**
 * Funciones Helper de TypeScript
 * <T> asegura que el tipo de datos de respuesta sea inferido o especificado.
 */
// T: Tipo de datos que se espera en la respuesta (por ejemplo, Usuario[] o Producto)
export const apiGet = async <T>(url: string, params: Params = {}): Promise<T> => {
  const response = await API.get<T>(url, { params });
  return response.data;
};

// D: Tipo de datos que se envían en el body (por ejemplo, LoginData)
export const apiPost = async <T, D = any>(url: string, body: D): Promise<T> => {
  const response = await API.post<T>(url, body);
  return response.data;
};

export const apiPut = async <T, D = any>(url: string, body: D): Promise<T> => {
  const response = await API.put<T>(url, body);
  return response.data;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await API.delete<T>(url);
  return response.data;
};

export default API;