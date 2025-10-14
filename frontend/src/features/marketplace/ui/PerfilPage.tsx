import React from "react";
import { useMemo, useState, useCallback } from "react";
import {Sidebar} from "./components/Sidebar"; // mini sidebar con íconos (Marketplace / Chats)
import MyPublicationsFeed from "./components/MyPublicationsFeed";
import { RatingStars } from "./components/RatingStars"; // opcional: cámbialo o quítalo si no existe

type Review = {
  id: string;
  author: string;
  rating: number; // 0–5
};

type Publication = {
  id: string;
  title: string;
  price: number;
  status: "Disponible" | "Agotado";
  imageUrl?: string;
};

function StarRating({ value = 0, size = 18 }: { value?: number; size?: number }) {
  // dibuja 5 estrellas; llenas hasta 'value' (puede ser decimal como 4.5 -> media estrella)
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const fill =
          i < full ? "currentColor" : i === full && half ? "url(#half)" : "none";
        const stroke = "currentColor";
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="text-amber-500"
          >
            {/* gradiente para media estrella */}
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1"
            />
          </svg>
        );
      })}
    </div>
  );
}

export default function PerfilPage() {
  // Mock de usuario / datos
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
  ];

  const publications: Publication[] = [
    { id: "p1", title: "Publicación", price: 8900, status: "Disponible" },
    { id: "p2", title: "Publicación", price: 5900, status: "Disponible" },
    { id: "p3", title: "Publicación", price: 12900, status: "Agotado" },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      {/* Sidebar izquierda */}
      <Sidebar />

      {/* Contenido */}
      <div className="min-w-0">
        {/* Header del perfil */}
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-gray-300" />
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
                <div className="flex items-center gap-2">
                  <StarRating value={user.rating} />
                </div>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                <p className="text-sm text-gray-600">{user.campus}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Valoraciones */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Valoraciones</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.author}</p>
                      <StarRating value={r.rating} size={16} />
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>
          </section>

          {/* Tus publicaciones */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tus Publicaciones</h2>
              <MyPublicationsFeed/>
          </section>
        </main>
      </div>
    </div>
  );
}
