import { Link } from "react-router-dom";
import React from "react";
import logo from "@/assets/img/logouct.png"; // Se mantiene tu logo

export function Sidebar({
  active = "marketplace",
  className = "",
}: {
  active?: "marketplace" | "chats" | "terminos" | "ayuda" | "crear";
  className?: string;
}) {
  return (
    // CAMBIO 1: Fondo amarillo como en la imagen (en lugar del gradiente)
    <aside className={`relative bg-yellow-400 min-h-[100dvh] ${className}`}>
      <div className="sticky top-0 min-h-[100dvh] flex flex-col gap-4 p-4">
        
        {/* CAMBIO 2: Título y logo mantenidos, pero con texto blanco */}
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          {/* Le quité el 'bg-slate-50' para que el fondo sea amarillo */}
          <div className="w-11 h-11 rounded-xl grid place-items-center"> 
            <img
              src={logo}
              alt="Logo UCT"
              className="max-w-[70%] max-h-[70%] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <strong className="font-extrabold text-black text-xl">MarketUCT</strong>
        </div>

        <nav role="navigation" className="grid gap-1.5">
          
          {/* CAMBIO 3: Estilos de links actualizados al de la imagen */}
          <Link
            to="/marketplace"
            className={[
              "px-3 py-2 rounded-xl no-underline text-white", // Clase base
              active === "marketplace"
                ? "font-extrabold" // Estilo ACTIVO (como en tu imagen)
                : "font-medium hover:bg-yellow-500", // Estilo INACTIVO
            ].join(" ")}
          >
            MarketPlace
          </Link>
          <Link
            to="/chats"
            className={[
              "px-3 py-2 rounded-xl no-underline text-white",
              active === "chats"
                ? "font-extrabold"
                : "font-medium hover:bg-yellow-500",
            ].join(" ")}
          >
            Chats
          </Link>
          
          {/* CAMBIO 4: Se mantiene tu link de "Terminos" con el nuevo estilo */}
          <Link
            to="/terminos"
            className={[
              "px-3 py-2 rounded-xl no-underline text-white",
              active === "terminos"
                ? "font-extrabold"
                : "font-medium hover:bg-yellow-500",
            ].join(" ")}
          >
            Terminos y Condiciones
          </Link>
        </nav>

        {/* CAMBIO 5: Añadido "Cerrar Sesion" al final (como en la imagen) */}
        <div className="mt-auto"> {/* mt-auto empuja esto al fondo */}
          <button
            onClick={() => {
              // Tu lógica de logout aquí
              console.log("Cerrando sesión...");
            }}
            className="px-3 py-2 rounded-xl font-medium text-white no-underline bg-red-500 hover:bg-yellow-500 w-full text-left"
          >
            Cerrar Sesion
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;