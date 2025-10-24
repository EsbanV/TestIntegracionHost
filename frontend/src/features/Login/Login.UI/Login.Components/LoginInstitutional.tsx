import img from "@/assets/img/favicon.png";
import styles from './Login.module.css';
import { useEffect, useRef, useState } from 'react';
import LoginFooter from './LoginFooter';
import { isAllowedEmailDomain, parseAllowedDomainsFromEnv } from '@/features/Login/Login.Utils/validators';

type Props = {
  onOAuth?: () => void | Promise<void>;
};

const ALUMNO_DOMAIN = "alu.uct.cl";
const PROFESOR_DOMAIN = "uct.cl";

export default function LoginInstitutional({ onOAuth }: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const w = window as any;
    if (!w.google || !w.google.accounts || !w.google.accounts.id) return;

    const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!client_id) {
      console.warn('[Login] Falta VITE_GOOGLE_CLIENT_ID en el .env — se usará el botón visual como fallback');
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

    const container = document.createElement('div');
    container.style.width = '100%';
    if (btnRef.current && btnRef.current.parentNode) {
      btnRef.current.parentNode.replaceChild(container, btnRef.current);
    }
    w.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: 360,
      text: 'continue_with',
      logo_alignment: 'left',
      shape: 'pill',
    });
  }, [onOAuth]);

  return (
    <div className={styles.heroBg}>
      <div className={styles.card}>
        <header className={styles.header} role="banner" aria-labelledby="login-title">
          <div className={styles.logo}>
            <img src={img} alt="Logo UCT" className={styles.logoImg} loading="lazy" decoding="async" />
          </div>
          <div className={styles.headerText}>
            <h2 id="login-title" className={styles.title}>Iniciar sesión</h2>
            <span className={styles.badge} aria-hidden>Solo cuentas @{PROFESOR_DOMAIN} @{ALUMNO_DOMAIN}</span>
          </div>
        </header>

        <button
          ref={btnRef}
          type="button"
          className={styles.googleBtn}
          onClick={() => { if (onOAuth) onOAuth(); }}
          aria-label="Continuar con Google"
        >
          <GoogleIcon />
          <span>Continuar con Google</span>
        </button>

        {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}
      </div>

      <LoginFooter />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className={styles.g} viewBox="0 0 533.5 544.3" aria-hidden>
      <path fill="#EA4335" d="M533.5 278.4c0-18.6-1.6-37-5-54.8H272v103.8h147.2c-6.3 34.5-25 63.7-53.2 83.2l86 66.7c50.3-46.4 81.5-114.7 81.5-198.9z"/>
      <path fill="#34A853" d="M272 544.3c72.9 0 134.3-24.1 179-65.4l-86-66.7c-23.8 16-54.2 25.4-93 25.4-71.4 0-132-48.1-153.8-112.6l-89.4 69.3C66.7 482.8 161.5 544.3 272 544.3z"/>
      <path fill="#4A90E2" d="M118.2 324.9c-10.8-32.4-10.8-68.1 0-100.5l-89.4-69.3c-39.5 78.9-39.5 160.2 0 239.1l89.4-69.3z"/>
      <path fill="#FBBC05" d="M272 106.2c39.6-.6 77.9 14.3 106.8 41l79.6-79.6C413.3 22.8 345.9-.2 272 0 161.5 0 66.7 61.5 28.8 180.8l89.4 69.3C140 186.6 200.6 106.2 272 106.2z"/>
    </svg>
  );
}
