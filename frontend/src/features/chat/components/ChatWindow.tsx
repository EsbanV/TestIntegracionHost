// ChatWindow.tsx
import { useEffect, useRef } from "react";
import type { Mensaje } from "@/types/chat";
import { ChatBubble } from "./ChatBubble";

export function ChatWindow({ mensajes }: { mensajes: Mensaje[] }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes]);

  return (
    // 👇 este div ocupa el espacio disponible (no crece la página)
    <div className="h-full min-h-0 overflow-y-auto bg-transparent">
      <div className="px-8 py-6 space-y-2">
        {mensajes.map((m) => <ChatBubble key={m.id} mensaje={m} />)}
        <div ref={endRef} />
      </div>
    </div>
  );
}