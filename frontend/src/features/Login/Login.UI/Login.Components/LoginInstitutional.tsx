// frontend/src/features/Login/Login.UI/Login.Components/LoginInstitutional.tsx
import img from "@/assets/img/favicon.png";
import styles from './Login.module.css';
import { useEffect, useRef, useState } from 'react';
import LoginFooter from './LoginFooter';
import { isAllowedEmailDomain, parseAllowedDomainsFromEnv } from '@/features/Login/Login.Utils/validators';

type Props = {
  onOAuth?: () => void | Promise<void>;
  onShowAdminLogin?: () => void;
};

const ALUMNO_DOMAIN = "alu.uct.cl";
const PROFESOR_DOMAIN = "uct.cl";

export default function LoginInstitutional({ onOAuth, onShowAdminLogin }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const w = window as any;
    if (!w.google || !w.google.accounts || !w.google.accounts.id) {
      setError('Google Identity Services no está disponible. Verifica el script en index.html.');
      return;
    }

    const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!client_id) {
      console.warn('[Login] Falta VITE_GOOGLE_CLIENT_ID en el .env');
      setError('Falta configurar VITE_GOOGLE_CLIENT_ID en el entorno del frontend.');
      return;
    }

    const allowed = parseAllowedDomainsFromEnv(import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS);

    const decodeJwt = (token: string): Record<string, any> => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT');
        const b64url = parts[1];
        let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4;
        if (pad === 2) b64 += '==';
        else if (pad === 3) b64 += '=';
        const json = atob(b64);
        return JSON.parse(json);
      } catch {
        return {};
      }
    };

    w.google.accounts.id.initialize({
      client_id,
      // Fuerza el selector de cuenta y evita el auto sign-in
      auto_select: false,
      // Usa popup en lugar de redirect
      ux_mode: 'popup',
      callback: (resp: any) => {
        const payload = decodeJwt(resp?.credential || '');
        const email: string = String(payload?.email || '');
        if (!isAllowedEmailDomain(email, allowed)) {
          setError(`Solo cuentas ${allowed.map((d: string) => `@${d}`).join(' o ')}`);
          return;
        }
        try { localStorage.setItem('google_credential', resp.credential); } catch {}
        setError('');
        if (onOAuth) onOAuth();
      },
    });

    // Renderiza el botón REAL de Google dentro del contenedor
    const target = containerRef.current;
    if (!target) return;
    target.style.width = '100%';
    target.style.display = 'flex';
    target.style.justifyContent = 'center';

    w.google.accounts.id.renderButton(target, {
      theme: 'outline',
      size: 'large',
      width: 360,
      text: 'continue_with',
      logo_alignment: 'left',
      shape: 'pill',
    });
    // Opcional: mostrar One Tap si el usuario ya inició antes, pero siempre permitirá elegir cuenta en el popup
    try { w.google.accounts.id.prompt(); } catch {}
  }, [onOAuth]);

  return (
    <div className={styles.heroBg}>
      <div className={styles.card}>
        {/* Header centrado */}
        <header className={`${styles.header} ${styles.centered}`} role="banner" aria-labelledby="login-title">
          <div className={styles.logo}>
            <img src={img} alt="Logo UCT" className={styles.logoImg} loading="lazy" decoding="async" />
          </div>
          <div className={`${styles.headerText} ${styles.centered}`}>
            <h2 id="login-title" className={styles.title}>Iniciar sesión</h2>
            <span className={styles.badge} aria-hidden>Solo cuentas @{PROFESOR_DOMAIN} @{ALUMNO_DOMAIN}</span>
          </div>
        </header>

        {/* Contenedor centrado para el botón de Google (renderizado por GIS) */}
        <div className={styles.googleBtnContainer}>
          <div ref={containerRef} aria-label="Botón de Google" />
        </div>

        {/* BOTÓN DE ADMIN DISCRETO CENTRADO */}
        {onShowAdminLogin && (
          <div className={styles.adminContainer}>
            <button 
              onClick={onShowAdminLogin}
              className={styles.adminBtn}
            >
              ¿Eres administrador?
            </button>
          </div>
        )}

  {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
      </div>

      {/* Footer original sin cambios */}
      <LoginFooter />
    </div>
  );
}