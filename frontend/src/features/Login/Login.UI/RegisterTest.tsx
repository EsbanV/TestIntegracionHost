import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom'; // Agregado para mejor navegación

// --- Tipos de TypeScript ---
type FormData = {
  nombre: string;
  usuario: string;
  email: string;
  password: string;
};

type ValidationError = {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
};

type ApiErrorResponse = {
  ok: false;
  message: string;
  errors?: ValidationError[];
};

type ApiSuccessResponse = {
  ok: true;
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
  };
};

const URL_BASE = import.meta.env.VITE_API_URL;

// --- Componente React ---

function RegisterTest() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    usuario: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setErrors([]);
    setIsSuccess(false);

    try {
      const res = await fetch(`${URL_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // <--- IMPORTANTE PARA CORS
        body: JSON.stringify(formData),
      });

      const data: ApiSuccessResponse | ApiErrorResponse = await res.json();

      if (data.ok) {
        setIsSuccess(true);
        setMessage(`✅ ${(data as ApiSuccessResponse).message}. ¡Usuario creado!`);
        setFormData({ nombre: '', usuario: '', email: '', password: '' }); // Limpiar form
      } else {
        setIsSuccess(false);
        setMessage(`❌ ${data.message}`);
        if ((data as ApiErrorResponse).errors) {
          setErrors((data as ApiErrorResponse).errors || []);
        }
      }
    } catch (error) {
      setIsSuccess(false);
      console.error('Error de fetch:', error);
      setMessage(
        '❌ Error de red. Revisa la consola y asegúrate que el backend esté corriendo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clases de Tailwind
  const alertBaseClasses = 'mt-4 p-3 rounded-md border';
  const alertSuccessClasses = 'bg-green-100 text-green-800 border-green-200';
  const alertErrorClasses = 'bg-red-100 text-red-800 border-red-200';

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-5 text-center text-gray-800">
        🚀 Registro de Usuario
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nombre" className="block mb-1.5 font-medium text-gray-700">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="usuario" className="block mb-1.5 font-medium text-gray-700">Usuario:</label>
          <input
            type="text"
            id="usuario"
            name="usuario"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.usuario}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block mb-1.5 font-medium text-gray-700">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={handleChange}
            placeholder="ej: tu.correo@alu.uct.cl"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-1.5 font-medium text-gray-700">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full py-2.5 px-4 font-semibold text-white rounded-md transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : 'Crear Usuario'}
        </button>
      </form>

      {message && (
        <div className={`${alertBaseClasses} ${isSuccess ? alertSuccessClasses : alertErrorClasses}`}>
          <p className="font-medium">{message}</p>
          {isSuccess && (
             <div className="mt-2 text-sm text-green-700">
               <Link to="/login" className="underline font-bold">Ir a Iniciar Sesión</Link>
             </div>
          )}
          {errors.length > 0 && (
            <ul className="list-disc list-inside mt-2 text-sm">
              {errors.map((err, index) => (
                <li key={index}>{err.msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mt-4 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline">Ingresa aquí</Link>
      </div>
    </div>
  );
}

export default RegisterTest;