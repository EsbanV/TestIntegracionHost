// src/components/MiniSidebar.tsx (VERSION REFRACTORIZADA CON NUEVOS COLORES)

import { Link } from "react-router-dom";
import logo from "@/assets/img/logouct.png"; // Mantén tu logo aquí

type SidebarProps = {
  active?: "marketplace" | "chats";
};

// --- ICONOS (Sin Cambios) ---

function IconStore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 10.5V8.8c0-.6.3-1.2.8-1.6l2.9-2.2c.3-.2.6-.3 1-.3h6.6c.4 0 .7.1 1 .3l2.9 2.2c.5.4.8 1 .8 1.6v1.7M5 10.5V19c0 .6.4 1 1 1h12c.6 0 1-.4 1-1v-8.5M9 20v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChats(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7 15l-3 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9h7M8.5 12h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// -----------------------------

export function MiniSidebar({ active = "marketplace" }: SidebarProps) {
  const base =
    "w-12 h-12 rounded-xl grid place-items-center transition-colors duration-150";
    
  // Colores Inactivos: Texto Negro (contorno de la bolsa) sobre el fondo Naranja.
  // El hover es un púrpura suave (bg-purple-100) para indicar la selección.
  const inactive = "text-black hover:bg-amber-600 hover:text-black";
  
  // Colores Activos: Texto Púrpura (contorno del chat) sobre el fondo Naranja/Amarillo más claro.
  // Usamos ring-purple para el contorno de selección.
  const activeCls = "text-purple-700 bg-amber-400 ring-2 ring-purple-500/50"; 

  return (
    // Fondo de aside a alto completo; contenido sticky
    // CRÍTICO: Cambio de color de fondo a un Amarillo/Naranja fuerte
    <aside className="relative bg-yellow-400 border-r border-amber-600"> 
      <div className="sticky top-0 h-dvh flex flex-col items-center gap-6 p-4">
        {/* Logo superior */}
        {/* Usar un fondo de contraste para el logo */}
        <Link to="/home" className="w-11 h-11 rounded-xl grid place-items-center bg-white">
          <img
            src={logo}
            alt="Logo UCT"
            className="max-w-[70%] max-h-[70%] object-contain"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Navegación: solo íconos */}
        <nav className="grid gap-3">
          <Link
            to="/home"
            title="Marketplace"
            aria-label="Marketplace"
            aria-current={active === "marketplace" ? "page" : undefined}
            className={[base, active === "marketplace" ? activeCls : inactive].join(" ")}
          >
            <IconStore className="w-6 h-6" />
            <span className="sr-only">Marketplace</span>
          </Link>

          <Link
            to="/chats"
            title="Chats"
            aria-label="Chats"
            aria-current={active === "chats" ? "page" : undefined}
            className={[base, active === "chats" ? activeCls : inactive].join(" ")}
          >
            <IconChats className="w-6 h-6" />
            <span className="sr-only">Chats</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}

export default MiniSidebar;