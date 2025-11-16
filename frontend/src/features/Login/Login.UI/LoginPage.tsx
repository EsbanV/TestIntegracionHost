// frontend/src/features/Login/Login.UI/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { login as apiLogin } from '@/features/auth/api/authApi';
import LoginForm from '@/features/auth/ui/LoginForm';
import LoginInstitutional from './Login.Components/LoginInstitutional';
import styles from './Login.Components/Login.module.css'; // MISMO CSS
import Logo from '@/assets/img/logouct.png';
import useGoogleAuth from '@/features/Login/Login.Hooks/useGoogleAuth';
import Spinner, { InlineSpinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { exchange } = useGoogleAuth();

  useEffect(() => {
    try {
      const token = localStorage.getItem('google_credential');
      if (token) navigate('/home', { replace: true });
    } catch {}
  }, [navigate]);

  async function handleEmailPasswordLogin(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const { token, user: userFromApi } = await apiLogin({ email, password });
      // El API ya entrega el usuario en la forma que espera el cliente (con 'rol').
      authLogin(token, userFromApi as any);
      
      // Verificar si necesita onboarding (usuario sin campus configurado)
      if (!userFromApi.campus || userFromApi.campus.trim() === '') {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      // Extraer mensaje de error específico
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña';
      } else if (err.response?.status === 403) {
        errorMessage = 'Acceso denegado. No tienes permisos para acceder';
      }
      
      setError(errorMessage);
      console.error('Error en login:', errorMessage);
      setLoading(false);
    }
  }

  async function handleOAuth() {
    // Intercambia el idToken (guardado por Google One Tap en localStorage)
    // por la sesión/JWT de la app antes de navegar.
    setError(null);
    setOauthLoading(true);
    try {
      const response = await exchange();
      
      // El backend devuelve: { ok: true, message: '...', token: 'jwt...', user: {...} }
      if (response.token && response.user) {
        // Guardar en authStore para mantener la sesión
        authLogin(response.token, response.user as any);
      }
      
      // Verificar si necesita onboarding (usuario nuevo de Google sin campus configurado)
      if (response.user && (!response.user.campus || response.user.campus.trim() === '')) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (e: any) {
      // Mostrar el error específico capturado
      const errorMsg = e?.message || 'No se pudo completar el inicio de sesión con Google';
      setError(errorMsg);
      console.error('Error en OAuth:', errorMsg);
    } finally {
      setOauthLoading(false);
    }
  }

  if (showAdminLogin) {
    return (
      // MISMO FONDO que el login institucional
      <div className={styles.heroBg}>
        <div className={styles.card}>
          {/* Header centrado - MISMO ESTILO que el login institucional */}
          <header className={`${styles.header} ${styles.centered}`} role="banner">
            <div className={styles.logo}>
              <img src={Logo} alt="Logo UCT" className={styles.logoImg} />
            </div>
            <div className={`${styles.headerText} ${styles.centered}`}>
              <h2 className={styles.title}>Inicio de Sesión (Admin)</h2>
              <span className={styles.subtitle}>Acceso para administradores del sistema</span>
            </div>
          </header>

          {/* Formulario centrado */}
          <div className={styles.googleBtnContainer}>
            <LoginForm 
              onSubmit={handleEmailPasswordLogin} 
              loading={loading}
              className={styles.form}
            />
          </div>

          {error && (
            <div className={styles.errorContainer}>
              <p className={styles.error} role="alert">{error}</p>
            </div>
          )}

          {/* Botón de volver */}
          <div className={styles.adminContainer}>
            <button 
              onClick={() => {
                setShowAdminLogin(false);
                setError(null);
              }}
              className={styles.adminBtn}
            >
              ← Volver a Acceso Institucional
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {oauthLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <Spinner size="xl" color="primary" label="Iniciando sesión con Google..." />
          </div>
        </div>
      )}
      <LoginInstitutional 
        onOAuth={handleOAuth} 
        onShowAdminLogin={() => setShowAdminLogin(true)}
        error={error}
      />
    </>
  );
}