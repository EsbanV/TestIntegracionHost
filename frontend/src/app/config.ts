import { QueryClient } from '@tanstack/react-query'

// Configuración centralizada de React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Configuración de categorías del marketplace
export const MARKETPLACE_CONFIG = {
  categories: [
    { id: 'electronics', name: 'Electrónicos' },
    { id: 'books', name: 'Libros y Materiales' },
    { id: 'clothing', name: 'Ropa y Accesorios' },
    { id: 'sports', name: 'Deportes' },
    { id: 'home', name: 'Hogar y Jardín' },
    { id: 'vehicles', name: 'Vehículos' },
    { id: 'services', name: 'Servicios' }
  ],
  pagination: {
    defaultPageSize: 9,
    debounceDelay: 300
  }
}