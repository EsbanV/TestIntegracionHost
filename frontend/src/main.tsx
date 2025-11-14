import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './app/context/AuthContext'
import AppRoutes from './app/routes'   // <- usa este import
import './index.css'

// In dev: if VITE_DEV_RUN_ID changes (new dev session), expire local credentials
if (import.meta.env.DEV) {
  try {
    const currentId = import.meta.env.VITE_DEV_RUN_ID as string | undefined
    const storedId = localStorage.getItem('dev_run_id') || undefined
    if (currentId && storedId && storedId !== currentId) {
      // New dev run detected → clear auth tokens
      localStorage.removeItem('google_credential')
    }
    if (currentId && storedId !== currentId) {
      localStorage.setItem('dev_run_id', currentId)
    }
    // First run in this browser tab: set the id if missing
    if (currentId && !storedId) {
      localStorage.setItem('dev_run_id', currentId)
    }
  } catch {
    // ignore storage errors (e.g., private mode)
  }
}

// Crear instancia de QueryClient con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* --- 2. Envuelve AppRoutes con AuthProvider --- */}
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
