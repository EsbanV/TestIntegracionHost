import React, { useState, useRef } from "react";
import { useMemo } from "react";
import { Sidebar } from "@/features/shared/ui/Sidebar";
import MyPublicationsFeed from "./Perfil.Components/PublicationsFeed";
import UserDefault from "@/assets/img/user_default.png";
// CAMBIO: Añadido el import para el logo (ajusta la ruta si es necesario)
import logo from "@/assets/img/logouct.png"; 

const MyPublicationsFeedAny = MyPublicationsFeed as any;

type Review = {
  id: string;
  author: string;
  rating: number;
};

type Publication = {
  id: string;
  title: string;
  price: number;
  status: "Disponible" | "Agotado";
  imageUrl?: string;
};

// --- Componente StarRating (sin cambios) ---
function StarRating({ value = 0, size = 18 }: { value?: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="inline-flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }).map((_, i) => {
        const fill = i < full ? "currentColor" : i === full && half ? "url(#half)" : "none";
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="text-amber-500 flex-shrink-0">
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill={fill} stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      })}
    </div>
  );
}

// --- Componente Principal PerfilPage ---
export default function PerfilPage() {
  const user = {
    name: "Nombre",
    email: "nombre@alu.uct.cl",
    campus: "Campus San Juan Pablo II",
    rating: 4.5,
  };

  const reviews: Review[] = [
    { id: "r1", author: "Usuario", rating: 4.5 },
    { id: "r2", author: "Usuario", rating: 5 },
    { id: "r3", author: "Usuario", rating: 4 },
    { id: "r4", author: "Usuario", rating: 4.5 },
    { id: "r5", author: "Usuario", rating: 5 },
    { id: "r6", author: "Usuario", rating: 3.5 },
  ];

  const publications: Publication[] = [
    { id: "p1", title: "Publicación", price: 8900, status: "Disponible" },
    { id: "p2", title: "Publicación", price: 5900, status: "Disponible" },
    { id: "p3", title: "Publicación", price: 12900, status: "Agotado" },
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      <Sidebar />

      <div className="min-w-0 flex flex-col h-screen">
        
        {/* <main> (Todo el contenido de abajo es idéntico al de la respuesta anterior) */}
        <main 
          ref={scrollContainerRef as any} // Reutilizamos el ref o definimos uno nuevo para el main
          className="flex-1 overflow-y-auto max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 w-full bg-gradient-to-br from-blue-100 to-white scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Soluciones para Firefox y IE/Edge
        >
          <section className="flex flex-col items-center gap-4 pt-4 pb-8">
            <img 
              src={UserDefault} 
              alt={user.name} 
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <StarRating value={user.rating} />
                <span className="text-sm text-gray-700 font-medium">{user.rating.toFixed(1)}</span>
              </div>
              <p className="text-base text-gray-600 mt-2">{user.email}</p>
              <p className="text-base text-gray-600">{user.campus}</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Valoraciones</h2>
            <div className="relative">
              <div
                ref={scrollContainerRef}
                className="grid auto-cols-[calc(33.333%-0.67rem)] grid-flow-col gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {reviews.map((r, index) => (
                  <div
                    key={r.id}
                    className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center gap-3 hover:shadow-lg hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 ease-out"
                    style={{
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.author}</p>
                      <StarRating value={r.rating} size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tus Publicaciones</h2>
            <MyPublicationsFeedAny publications={publications} />
          </section>
        </main>
      </div>
    </div>
  );
}