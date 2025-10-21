import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/ui'
import HomePage from '../features/marketplace/ui/HomePage'
import CrearPublicacionPage from '../features/marketplace/ui/CrearPublicacionPage'
import MisPublicacionesPage from '../features/marketplace/ui/MisPublicacionesPage'
import PerfilPage from '../features/marketplace/ui/PerfilPage'
import PageLayout from '../features/shared/ui/PageLayout'
import ChatPage from '../features/chat/pages/ChatPage'
import AyudaPage from '../features/marketplace/ui/AyudaPage'
import TermsPage from '../features/marketplace/ui/TermsPage'
import AboutPage from '../features/shared/ui/AboutPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Redirige la raíz a /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route element={<PageLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/crear" element={<CrearPublicacionPage />} />
        <Route path="/mis-publicaciones" element={<MisPublicacionesPage />} />
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/chats" element={<ChatPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes