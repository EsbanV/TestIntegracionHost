// src/components/RegisterTest.tsx

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

// --- Tipos de TypeScript ---

// 1. Define la estructura de los datos del formulario
type FormData = {
  nombre: string;
  usuario: string;
  email: string;
  password: string;
};

// 2. Define la estructura de un error de validación del backend
type ValidationError = {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
};

// 3. Define la estructura de la respuesta de error de la API
type ApiErrorResponse = {
  ok: false;
  message: string;
  errors?: ValidationError[];
};

// 4. Define la estructura de la respuesta exitosa de la API
type ApiSuccessResponse = {
  ok: true;
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    // ...otros campos de usuario
  };
};

// --- Componente React ---

function RegisterTest() {
  const [formData, setFormData] = useState<FormData>({
    nombre: 'Usuario TS',
    usuario: 'usuariots',
    // ¡Recuerda! El email debe cumplir la regla del backend
    email: 'prueba.ts@alu.uct.cl',
    password: 'password123',
  });

  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Evento tipado para los inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Evento tipado para el formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setErrors([]);
    setIsSuccess(false);

    try {
      // (Asumiendo que tienes el proxy de Vite configurado para '/api')
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Tipamos la respuesta de la API
      const data: ApiSuccessResponse | ApiErrorResponse = await res.json();

      if (data.ok) {
        // Éxito (data es ApiSuccessResponse)
        setIsSuccess(true);
        setMessage(`✅ ${data.message}. ¡Usuario creado!`);
        console.log('Token recibido:', data.token);
        console.log('Usuario:', data.user);
      } else {
        // Error (data es ApiErrorResponse)
        setIsSuccess(false);
        setMessage(`❌ ${data.message}`);
        if (data.errors) {
          setErrors(data.errors);
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

  // Clases de Tailwind para los mensajes de alerta
  const alertBaseClasses = 'mt-4 p-3 rounded-md border';
  const alertSuccessClasses = 'bg-green-100 text-green-800 border-green-200';
  const alertErrorClasses = 'bg-red-100 text-red-800 border-red-200';

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-5 text-center text-gray-800">
        🚀 Formulario de Registro (TS + Tailwind)
      </h2>
      <form onSubmit={handleSubmit}>
        
        {/* Nombre */}
        <div className="mb-4">
          <label
            htmlFor="nombre"
            className="block mb-1.5 font-medium text-gray-700"
          >
            Nombre:
          </label>
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

        {/* Usuario */}
        <div className="mb-4">
          <label
            htmlFor="usuario"
            className="block mb-1.5 font-medium text-gray-700"
          >
            Usuario:
          </label>
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

        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block mb-1.5 font-medium text-gray-700"
          >
            Email:
          </label>
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

        {/* Contraseña */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block mb-1.5 font-medium text-gray-700"
          >
            Contraseña:
          </label>
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

        {/* Botón de envío */}
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

      {/* Mensaje de éxito o error */}
      {message && (
        <div
          className={`${alertBaseClasses} ${
            isSuccess ? alertSuccessClasses : alertErrorClasses
          }`}
        >
          <p className="font-medium">{message}</p>
          {/* Lista de errores específicos */}
          {errors.length > 0 && (
            <ul className="list-disc list-inside mt-2 text-sm">
              {errors.map((err, index) => (
                <li key={index}>{err.msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default RegisterTest;