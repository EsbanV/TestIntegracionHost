// Se importa 'useEffect' y 'useState' para la animación
import React, { useMemo, useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CreatePostForm } from './components/create-post/CreatePostForm';
import logo from "../../../assets/img/logouct.png"; 

// --- Icono de Libro (para decoración) ---
function IconBook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

// --- Icono de Birrete (para decoración) ---
function IconGraduationCap() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}


export default function CrearPublicacionPage() {
  const title = useMemo(() => 'Crear Nueva Publicación', []);
  
  // --- Estado para la animación de entrada ---
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      
      <aside>
        <Sidebar active="crear" />
      </aside>

      <div className="min-w-0 flex flex-col h-screen">
        
        {/* Header local eliminado para evitar duplicado — se usa el header global de la app */}
        
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-blue-100 to-white relative overflow-hidden">
          
          {/* --- CAMBIO: Fondo decorativo con iconos --- */}
          <div className="absolute inset-0 z-0 opacity-15 text-blue-300 pointer-events-none">
            <span className="absolute top-[10%] left-[5%] text-9xl -rotate-12">
              <IconBook />
            </span>
            <span className="absolute top-[20%] right-[10%] text-7xl rotate-6">
              <IconGraduationCap />
            </span>
            <span className="absolute bottom-[15%] left-[20%] text-6xl rotate-3">
              <IconBook />
            </span>
            <span className="absolute bottom-[30%] right-[30%] text-4xl -rotate-6">
              <IconGraduationCap />
            </span>
          </div>

          {/* --- CAMBIO: Tarjeta blanca con animación de entrada --- */}
          <div 
            className={`
              max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8 
              relative z-10 
              transition-all duration-700 ease-out
              ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
            `}
          >
            
            <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
              {title}
            </h2>
            
            <CreatePostForm />

          </div>
        </main>
      </div>
    </div>
  );
}