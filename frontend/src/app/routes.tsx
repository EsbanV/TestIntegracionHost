import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/features/Login/Login.UI/LoginPage'
import HomePage from '@/features/Marketplace/Marketplace.UI/HomePage'
import CrearPublicacionPage from '@/features/CrearPublicacion/CrearPublicacion.UI/CrearPublicacionPage'
import EditarPublicacionPage from '@/features/EditarPublicacion/EditarPublicacion.UI/EditarPublicacionPage'
import MisPublicacionesPage from '@/features/MyPublications/MyPublications.UI/MisPublicacionesPage'
import PerfilPage from '@/features/Perfil/Perfil.UI/PerfilPage'
import PageLayout from '@/features/shared/ui/PageLayout'
import ChatPage from '@/features/DM/DM.UI/ChatPage'
import AyudaPage from '@/features/About.Terms.Help/Help.UI/AyudaPage'
import TermsPage from '@/features/About.Terms.Help/Terms.UI/TermsPage'
import AboutPage from '@/features/About.Terms.Help/About.UI/AboutPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Redirige la raíz a /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route element={<PageLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/crear" element={<CrearPublicacionPage />} />
        <Route path="/editar" element={<EditarPublicacionPage />} />
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