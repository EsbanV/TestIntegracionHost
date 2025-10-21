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
  // draggable FAB position (start bottom-right)
  const BTN_SIZE = 64; // aumentado para que el círculo sea más grande
  const EDGE_PADDING = 12;
  const [pos, setPos] = useState<{ left: number; top: number }>(() => {
    if (typeof window !== "undefined") {
      return {
        left: Math.max(EDGE_PADDING, window.innerWidth - BTN_SIZE - EDGE_PADDING),
        top: Math.max(EDGE_PADDING, window.innerHeight - BTN_SIZE - EDGE_PADDING),
      };
    }
    return { left: 0, top: 0 };
  });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0, moved: false });

  // keep FAB inside viewport on resize
  useEffect(() => {
    const onResize = () => {
      setPos((p) => ({
        left: Math.max(EDGE_PADDING, Math.min(p.left, window.innerWidth - BTN_SIZE - EDGE_PADDING)),
        top: Math.max(EDGE_PADDING, Math.min(p.top, window.innerHeight - BTN_SIZE - EDGE_PADDING)),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!startRef.current.moved && Math.hypot(dx, dy) > 4) startRef.current.moved = true;
    const newLeft = Math.max(EDGE_PADDING, Math.min(startRef.current.left + dx, window.innerWidth - BTN_SIZE - EDGE_PADDING));
    const newTop = Math.max(EDGE_PADDING, Math.min(startRef.current.top + dy, window.innerHeight - BTN_SIZE - EDGE_PADDING));
    setPos({ left: newLeft, top: newTop });
  }, []);

  const onPointerUp = useCallback((_: PointerEvent) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      // if it wasn't a drag (click), toggle panel
      if (!startRef.current.moved) {
        setMode((m) => (m === "closed" ? "list" : "closed"));
      }
    }
  }, [onPointerMove]);

  const onPointerDown = useCallback((ev: React.PointerEvent) => {
    const el = ev.currentTarget as Element;
    (el as Element).setPointerCapture?.(ev.pointerId);
    draggingRef.current = true;
    startRef.current = { x: ev.clientX, y: ev.clientY, left: pos.left, top: pos.top, moved: false };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [onPointerMove, onPointerUp, pos.left, pos.top]);

  const computePanelStyle = () => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    // Anchor panel's bottom-right corner to FAB's bottom-right
    const panelLeft = pos.left + BTN_SIZE - width;
    const panelTop = pos.top + BTN_SIZE - height;
    const left = Math.max(EDGE_PADDING, Math.min(panelLeft, vw - width - EDGE_PADDING));
    const top = Math.max(EDGE_PADDING, Math.min(panelTop, vh - height - EDGE_PADDING));
    return { left, top };
  };

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
        onPointerDown={onPointerDown}
        aria-label="Abrir chat"
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          zIndex: 9999,
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderRadius: 9999,
          background: "white",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(2,6,23,0.25)",
          border: "1px solid rgba(15,23,42,0.08)",
          cursor: "pointer",
          touchAction: "none", // important for dragging on touch devices
          padding: 8,
        }}
      >
        {/* Imagen de logo (reemplaza la ruta si tu logo está en otro lugar) */}
        <img
          src="/assets/chat-logo.png"
          alt="Chat"
          style={{ width: "70%", height: "70%", objectFit: "contain", display: "block", pointerEvents: "none" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />

        {/* Fallback SVG si no existe la imagen */}
        <svg style={{ width: 28, height: 28, display: "block" }} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 15l-3 3V6a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H7z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 9h7M8.5 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>

        {unreadChatsCount > 0 && (
          <span
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              background: "#EDC500",
              color: "#111",
              borderRadius: "9999px",
              minWidth: 22,
              height: 22,
              padding: "0 6px",
              fontSize: 13,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.19)",
              pointerEvents: "none",
            }}
            aria-hidden={false}
            aria-label={`${unreadChatsCount} mensajes sin leer`}
          >
            {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
          </span>
        )}
      </button>

      {/* Panel fijo vertical/rectangular (abre donde quedó el FAB) */}
      {mode !== "closed" && (() => {
        const panelStylePos = computePanelStyle();
        return (
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden flex flex-col"
            style={{ width, height, left: panelStylePos.left, top: panelStylePos.top }}
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
        );
      })()}
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