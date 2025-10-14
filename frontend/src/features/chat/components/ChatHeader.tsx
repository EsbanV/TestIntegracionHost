import type { Chat } from "@/types/chat";

export function ChatHeader({ chatActivo }: { chatActivo: Chat | null }) {
  return (
    <header className="h-[64px] bg-transparent border-b flex items-center px-6">
      {/* Avatar + nombre + correo */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gray-200 grid place-items-center text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Z" fill="currentColor"/>
            <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">
            {chatActivo?.nombre ?? "Nombre"}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {(chatActivo as any)?.email ?? "nombre@alu.uct.cl"}
          </div>
        </div>
      </div>
    </header>
  );
}