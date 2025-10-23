// ChatWindow.tsx
import { useEffect, useRef } from "react";
import type { Mensaje } from "@/features/DM/DM.Types/chat";
import { ChatBubble } from "./ChatBubble";

export function ChatWindow({ mensajes }: { mensajes: Mensaje[] }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes]);

  return (
    // CAMBIO:
    // 1. 'bg-transparent' se cambia por 'bg-white/30' (fondo blanco al 30% de opacidad).
    // 2. Se añade 'backdrop-blur-sm' para el efecto "esmerilado" (frosted glass).
    <div className="h-full min-h-0 overflow-y-auto bg-white/30 backdrop-blur-sm">
      <div className="px-8 py-6 space-y-2">
        {mensajes.map((m) => <ChatBubble key={m.id} mensaje={m} />)}
        <div ref={endRef} />
      </div>
    </div>
  );
}