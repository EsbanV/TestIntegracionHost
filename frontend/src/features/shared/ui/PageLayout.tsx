import { Outlet, useLocation } from 'react-router-dom'
import FloatingChat from '@/features/DM/FloatingChat'
import Header from './Header'
import { Sidebar } from './Sidebar'

interface PageLayoutProps {
  /** Muestra u oculta la barra lateral (en desktop). Default: true */
  showSidebar?: boolean
  /** Muestra u oculta la barra superior. Default: true */
  showHeader?: boolean
  /** Habilita el widget de chat flotante. Default: true (se oculta automático en /chats) */
  showFloatingChat?: boolean
}

export default function PageLayout({
  showSidebar = true,
  showHeader = true,
  showFloatingChat = true,
}: PageLayoutProps) {
  const { pathname } = useLocation()
  
  // Detectar si estamos en la vista de chat completa para ajustar el scroll del contenedor
  const isDM = pathname.startsWith('/chats')

  // Lógica de visualización del Chat Flotante:
  // Se muestra si la prop es true Y NO estamos en la página de chat completa
  const shouldRenderFloatingChat = showFloatingChat && !isDM

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden">
      
      {/* 1. Sidebar Controlable */}
      {showSidebar && (
        <Sidebar className="hidden md:flex flex-shrink-0" />
      )}

      {/* 2. Contenedor Principal */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* 2a. Header Controlable */}
        {showHeader && <Header />}

        {/* 2b. Área de Contenido
            - Si es DM: overflow-hidden (el chat maneja su scroll)
            - Si no: overflow-y-auto (scroll normal de la página)
        */}
        <main 
          className={`
            flex-1 w-full relative
            ${isDM ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-6 scroll-smooth'}
          `}
        >
          <Outlet />
        </main>
      </div>

      {/* 3. Chat Flotante Controlable */}
      {shouldRenderFloatingChat && <FloatingChat />}
    </div>
  )
}