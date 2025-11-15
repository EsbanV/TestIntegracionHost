import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/app/context/AuthContext'

// Layout
import PageLayout from '@/features/shared/ui/PageLayout'

// Pages
import LoginPage from '@/features/Login/Login.UI/LoginPage'
import RegisterTest from '@/features/Login/Login.UI/RegisterTest'
import LoginTest from '@/features/Login/Login.UI/LoginTest'
import HomePage from '@/features/Marketplace/Marketplace.UI/HomePage'
import CreateProductPage from '@/features/CrearPublicacion/CrearPublicacion.UI/CrearPublicacionPage'
import EditarPublicacionPage from '@/features/EditarPublicacion/EditarPublicacion.UI/EditarPublicacionPage'
import MisPublicacionesPage from '@/features/MyPublications/MyPublications.UI/MisPublicacionesPage'
import PerfilPage from '@/features/Perfil/Perfil.UI/PerfilPage'
import ChatPage from '@/features/DM/DM.UI/ChatPage'
import ForumPage from '@/features/Forum/ForumPage'
import AyudaPage from '@/features/About.Terms.Help/Help.UI/AyudaPage'
import TermsPage from '@/features/About.Terms.Help/Terms.UI/TermsPage'
import AboutPage from '@/features/About.Terms.Help/About.UI/AboutPage'
import PublicProfilePage from '@/features/Perfil/Perfil.UI/PublicProfilePage'

export function AppRoutes() {
  return (
    <Routes>
      {/* =========================================
          1. RUTAS PÚBLICAS (Sin Layout)
          ========================================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterTest />} />
      <Route path="/login-test" element={<LoginTest />} />

      {/* =========================================
          2. RUTAS PÚBLICAS CON LAYOUT
          (Header y Sidebar visibles, Chat Flotante opcional)
          ========================================= */}
      <Route element={<PageLayout showHeader={true} showSidebar={true} />}>
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* =========================================
          3. RUTAS PROTEGIDAS (Requieren Login)
          ========================================= */}
      <Route element={<ProtectedRoute />}>
        
        {/* GRUPO A: Layout Estándar
            - Header: SÍ
            - Sidebar: SÍ
            - Chat Flotante: SÍ
        */}
        <Route 
          element={
            <PageLayout 
              showHeader={true} 
              showSidebar={true} 
              showFloatingChat={true} 
            />
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/crear" element={<CreateProductPage />} />
          <Route path="/editar" element={<EditarPublicacionPage />} />
          <Route path="/mis-publicaciones" element={<MisPublicacionesPage />} />
          <Route path="/forums" element={<ForumPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/perfil/public/:id" element={<PublicProfilePage />} />
        </Route>

        {/* GRUPO B: Layout de Chat Completo
            - Header: NO (Para ganar altura)
            - Sidebar: SÍ
            - Chat Flotante: NO (Ya estamos en el chat)
        */}
        <Route 
          element={
            <PageLayout 
              showHeader={false} 
              showSidebar={true} 
              showFloatingChat={false} 
            />
          }
        >
          <Route path="/chats" element={<ChatPage />} />
        </Route>

      </Route>

      {/* =========================================
          4. REDIRECCIONES
          ========================================= */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes