import { useState, ChangeEvent, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/app/context/AuthContext'
import { motion } from 'framer-motion'

// UI Components (Shadcn)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Icons
import { LuLoader, LuCircleAlert, LuLogIn } from "react-icons/lu"
import logo from "@/assets/img/logoMUCT.png" 

// --- TIPOS ---
type FormData = {
  email: string
  password: string
}

type ApiSuccessResponse = {
  ok: true
  message: string
  accessToken: string
  refreshToken: string
  user: {
    id: number
    email: string
    nombre: string
    role: string
    campus: string | null
  }
}

type ApiErrorResponse = {
  ok: false
  message: string
}

const URL_BASE = import.meta.env.VITE_API_URL;

export default function LoginTest() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState<FormData>({
    email: 'prueba.ts@alu.uct.cl',
    password: 'Contraseña1?',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Redirigir al usuario a donde quería ir, o al home por defecto
  const from = location.state?.from?.pathname || '/home'

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

// En LoginTest.tsx

// En src/components/LoginTest.tsx

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    const res = await fetch(`${URL_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    console.log("📡 Login Respuesta:", data);

    if (res.ok && data.ok) {
      // 1. Validar que llegue el token
      if (!data.accessToken) {
        throw new Error("El servidor no devolvió el token de acceso.");
      }

      // 2. LIMPIEZA DE DATOS (El Fix Importante) 🛡️
      // Convertimos 'null' a 'undefined' o cadena vacía para que React/TS no se quejen
      const safeUser = {
        ...data.user,
        campus: data.user.campus || undefined, // Si es null, pon undefined
        fotoPerfilUrl: data.user.fotoPerfilUrl || undefined
      };

      // 3. Guardar sesión
      console.log("💾 Guardando sesión...", safeUser);
      login(data.accessToken, safeUser);

      // 4. Redirección Forzada
      // Usamos un pequeño timeout para asegurar que el estado del Context se actualice primero
      setTimeout(() => {
        console.log("🚀 Redirigiendo al Home...");
        window.location.href = '/home';
      }, 100);

    } else {
      setError(data.message || 'Credenciales inválidas');
      setIsLoading(false); // Solo quitamos carga si falló, si no esperamos la redirección
    }
  } catch (err) {
    console.error(err);
    setError('Error de conexión o configuración.');
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</CardTitle>
            <CardDescription>
              Ingresa tus credenciales institucionales para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Alerta de Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Alert variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                    <LuCircleAlert className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Institucional</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@alu.uct.cl"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-white"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-white"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 transition-all" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LuLogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t bg-slate-50/50 p-4">
            <p className="text-sm text-slate-500">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}