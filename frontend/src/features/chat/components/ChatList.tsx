// ChatList.tsx
import type { Chat } from "../types/chat";

export function ChatList({
  chats,
  onSelectChat,
  chatActivo,
}: { chats: Chat[]; onSelectChat: (id:number)=>void; chatActivo: number|null }) {
  if (!chats || chats.length === 0) {
    return (
      // CAMBIO: Fondo amarillo
      <aside className="h-full w-full min-w-0 flex flex-col bg-yellow-400">
        {/* CAMBIO: Texto negro */}
        <div className="flex flex-1 items-center justify-center text-black opacity-75">
          No hay conversaciones
        </div>
      </aside>
    );
  }
  return (
    // CAMBIO: Fondo amarillo (antes bg-transparent)
    <aside className="h-full w-full min-w-0 flex flex-col bg-yellow-400">
      <ul className="min-h-0 overflow-y-auto overflow-x-hidden">
        {chats.map((chat) => {
          const active = chatActivo === chat.id;
          return (
            <li
              key={chat.id}
              role="button"
              tabIndex={0}
              aria-selected={active}
              // CAMBIO: Estilo activo es amarillo más oscuro. Borde amarillo más sutil.
              className={`group cursor-pointer px-4 py-3 border-b border-yellow-500/30 transition-colors duration-150 ease-in-out transform-gpu
                ${active ? "bg-yellow-500" : "bg-transparent hover:bg-yellow-500/50"}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300`}
              onClick={() => onSelectChat(chat.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectChat(chat.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                {/* CAMBIO: Avatar blanco (antes bg-gray-200) */}
                <div className="h-10 w-10 rounded-full bg-white grid place-items-center text-gray-500 shrink-0
                                transition-colors duration-150 ease-in-out group-hover:bg-yellow-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Z" fill="currentColor"/>
                    <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {/* CAMBIO: Texto principal negro (antes text-slate-800) */}
                  <p className={`font-semibold leading-5 truncate text-black`}>{chat.nombre}</p>
                  {/* CAMBIO: Texto secundario gris oscuro (antes text-slate-500) */}
                  <p className="text-xs text-gray-800 leading-5 truncate">
                    {chat.ultimoMensaje ?? ""}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  );
}