// src/features/auth/types/login.types.ts

export interface GoogleAuthResponse {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    role: string;
    [key: string]: any;
  };
  isNewUser?: boolean;
  message?: string;
}

export interface LoginHookReturn {
  error: string | null;
  isLoading: boolean;
  googleButtonRef: React.RefObject<HTMLDivElement>;
}