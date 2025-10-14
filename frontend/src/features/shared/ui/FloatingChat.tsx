import { useRef, useState, useCallback, useEffect } from "react";
import { mockChats as rawMockChats } from "../../chat/mocks/mockChats"; // Ajusta la ruta si es necesario

/* ===================== Tipos ===================== */
type Estado = "enviando" | "enviado" | "recibido" | "leido";
type Mensaje = { id: string; texto: string; autor: "yo" | "otro"; hora: string; estado?: Estado };
type Chat = { id: number; nombre: string; ultimoMensaje?: string; mensajes: Mensaje[] };
type Mode = "closed" | "list" | "chat";

type FloatingChatProps = {
  width?: number;
  height?: number;
  corner?: "right" | "left";
  userId?: string;
};

/* ===================== Helpers ===================== */
const horaActual = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ===================== Transform mockChats ===================== */
// Convierte todos los id de mensajes a string para cumplir el tipado
const mockChats: Chat[] = rawMockChats.map(c => ({
  ...c,
  mensajes: c.mensajes.map(m => ({
    ...m,
    id: String(m.id),
  })),
}));

/* ===================== Componente principal ===================== */
export default function FloatingChat({
  width = 360,
  height = 560,
  corner = "right",
}: FloatingChatProps) {
  // ui
  const [mode, setMode] = useState<Mode>("closed");
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [activeId, setActiveId] = useState<number | null>(mockChats[0]?.id ?? null);

  // Render helpers
  const activeChat = chats.find(c => c.id === activeId) ?? null;
  const panelPos = corner === "right" ? "right-6 bottom-6" : "left-6 bottom-6";

  // CHAT BADGE: cuántos chats tienen mensajes no leídos
  const unreadChatsCount = chats.filter(chat =>
    chat.mensajes.some((msg: Mensaje) => msg.autor === "otro" && msg.estado !== "leido")
  ).length;

  // Enviar mensaje simulado
  const handleSend = useCallback(async (texto: string) => {
    if (!activeId) return;
    const tempId = "tmp-" + Date.now();
    const msg: Mensaje = { id: tempId, texto, autor: "yo", hora: horaActual(), estado: "enviando" };
    setChats(prev =>
      prev.map((c: Chat) =>
        c.id === activeId ? { ...c, mensajes: [...c.mensajes, msg], ultimoMensaje: texto } : c
      )
    );
    // Simula cambio de estado (enviado) después de 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
    setChats(prev =>
      prev.map((c: Chat) =>
        c.id === activeId
          ? {
              ...c,
              mensajes: c.mensajes.map((m: Mensaje) =>
                m.id === tempId ? { ...msg, estado: "enviado", id: String(Date.now()) } : m
              ),
            }
          : c
      )
    );
  }, [activeId]);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setMode(m => (m === "closed" ? "list" : "closed"))}
        className={[
          "fixed z-50 h-12 w-12 rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200",
          "grid place-items-center hover:bg-slate-50",
          panelPos,
        ].join(" ")}
        aria-label="Abrir chat"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <path d="M7 15l-3 3V6a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H7z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 9h7M8.5 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {unreadChatsCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "#EDC500",
              color: "#222",
              borderRadius: "50%",
              padding: "2px 7px",
              fontSize: "13px",
              fontWeight: "bold",
              boxShadow: "0 1px 4px rgba(0,0,0,0.19)",
              pointerEvents: "none",
            }}
          >
            {unreadChatsCount}
          </span>
        )}
      </button>

      {/* Panel fijo vertical/rectangular */}
      {mode !== "closed" && (
        <div
          className={[
            "fixed z-50 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden flex flex-col",
            panelPos,
          ].join(" ")}
          style={{ width, height }}
        >
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b bg-white shrink-0">
            {mode === "list" ? (
              <>
                <span className="text-sm font-semibold text-slate-700">Mensajes</span>
                <button onClick={() => setMode("closed")} className="text-slate-500 hover:text-slate-700 text-sm">
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <button onClick={() => setMode("list")} className="text-slate-600 hover:text-slate-900">←</button>
                  <div className="h-8 w-8 rounded-full bg-gray-200 grid place-items-center text-gray-500 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Z" fill="currentColor"/>
                      <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-slate-800 truncate">{activeChat?.nombre ?? "Nombre"}</div>
                    <div className="text-[11px] text-slate-500 truncate">nombre@alu.uct.cl</div>
                  </div>
                </div>
                <button onClick={() => setMode("closed")} className="text-slate-500 hover:text-slate-700 text-sm">
                  Cerrar
                </button>
              </>
            )}
          </div>

          {/* Contenido */}
          {mode === "list" ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {chats.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveId(c.id); setMode("chat"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b"
                >
                  <div className="h-9 w-9 rounded-full bg-gray-200 grid place-items-center text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Z" fill="currentColor"/>
                      <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate">{c.nombre}</div>
                    <div className="text-xs text-slate-500 truncate">{c.ultimoMensaje ?? ""}</div>
                  </div>
                </button>
              ))}
              {chats.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">No hay conversaciones</div>
              )}
            </div>
          ) : (
            <MiniChatWindow mensajes={activeChat?.mensajes ?? []} onSend={handleSend} />
          )}
        </div>
      )}
    </>
  );
}

/* ===================== Mini ventana de conversación ===================== */
function MiniChatWindow({
  mensajes,
  onSend,
}: { mensajes: Mensaje[]; onSend: (t: string) => Promise<void> }) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  const submit = async () => {
    const t = value.trim();
    if (!t) return;
    await onSend(t);
    setValue("");
  };

  return (
    <div className="min-h-0 flex-1 flex flex-col">
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden bg-[#EEF3F8] px-4 py-3 space-y-2 [scrollbar-gutter:stable] [overscroll-behavior:contain]"
      >
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.autor === "yo" ? "justify-end" : "justify-start"}`}>
            <div
              className={[
                "max-w-[82%] px-3 py-2 rounded-lg text-sm shadow",
                m.autor === "yo" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none",
              ].join(" ")}
            >
              <div className="whitespace-pre-wrap break-words">{m.texto}</div>
              <div className="mt-1 text-[10px] opacity-70 text-right">
                {m.hora}{" "}
                {m.autor === "yo" && (
                  <span className="ml-1">
                    {m.estado === "enviando" && "⏳"}
                    {m.estado === "enviado" && "✔"}
                    {m.estado === "recibido" && "✔✔"}
                    {m.estado === "leido" && "✔✔"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* input */}
      <div className="border-t bg-white p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Escribe un mensaje…"
            className="flex-1 h-10 w-full rounded-full border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            onClick={submit}
            className="h-10 px-4 rounded-full bg-black text-gray text-sm font-medium hover:bg-gray-900"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}