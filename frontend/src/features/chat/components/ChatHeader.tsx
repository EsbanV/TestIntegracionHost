// ChatHeader.tsx
import type { Chat } from "@/types/chat";

export function ChatHeader({ chatActivo }: { chatActivo: Chat | null }) {
  return (
    // CAMBIO: Fondo azul oscuro, sin borde
    <header className="h-[64px] bg-blue-900 flex items-center px-6">
      <div className="flex items-center gap-3">
        {/* CAMBIO: Avatar blanco con ícono gris */}
        <div className="h-9 w-9 rounded-full bg-white grid place-items-center text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Z" fill="currentColor"/>
            <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="min-w-0">
          {/* CAMBIO: Texto de nombre blanco */}
          <div className="font-semibold text-white truncate">
            {chatActivo?.nombre ?? "Nombre"}
          </div>
          {/* CAMBIO: Texto de email gris claro (tal cual la imagen) */}
          <div className="text-xs text-gray-300 truncate">
            {(chatActivo as any)?.email ?? "nombre@alu.uct.cl"}
          </div>
        </div>
      </div>
    </header>
  );
}