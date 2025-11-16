import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Definimos los estados de autenticación
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Define la forma de los datos del usuario
// ❗️ Sugerencia: Mueve esta interfaz a `frontend/src/types/User.ts`
// y reemplaza esta definición local con: import { User } from '../types/User';
interface User {
  id: string; // Asegúrate que coincida con tu tipo global
  nombre: string;
  rol: 'USER' | 'ADMIN' | 'VENDEDOR'; // Ajusta los roles según tu `schema.prisma`
}

// Define el estado y las acciones del store
interface AuthState {
  token: string | null;
  user: User | null;
  authStatus: AuthStatus; // <-- MEJORA: Estado para manejar la carga inicial
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => void; // <-- MEJORA: Acción para verificar el estado al inicio
}

export const useAuthStore = create<AuthState>()(
  // El middleware 'persist' guardará el estado en localStorage
  persist(
    (set, get) => ({
      token: null,
      user: null,
      authStatus: 'loading', // <-- MEJORA: Empezamos en 'loading'

      // Acción para guardar el token y los datos del usuario al iniciar sesión
      login: (token, user) => {
        set({ token, user, authStatus: 'authenticated' });
      },

      // Acción para limpiar el estado al cerrar sesión
      logout: () => {
        set({ token: null, user: null, authStatus: 'unauthenticated' });
      },

      /**
       * MEJORA: Esta función se llama 1 sola vez al cargar la app (en main.tsx).
       * Revisa el estado persistido (de localStorage) y actualiza el authStatus.
       */
      checkAuth: () => {
        const token = get().token; // `get()` lee el estado persistido
        if (token) {
          set({ authStatus: 'authenticated' });
        } else {
          set({ authStatus: 'unauthenticated' });
        }
      },
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage
      storage: createJSONStorage(() => localStorage), // Especificamos localStorage
      /**
       * MEJORA: `partialize` asegura que SOLO 'token' y 'user' se guarden
       * en localStorage. El 'authStatus' no se persiste.
       */
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);