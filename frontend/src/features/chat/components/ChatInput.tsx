import React, { useEffect, useRef, useState } from "react";

export function ChatInput({ onSend }: { onSend: (t: string, file?: File|null)=>Promise<void> }) {
  const [texto, setTexto] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const textareaRef = useRef<HTMLTextAreaElement|null>(null);

  // panel emojis
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("Emoticonos");
  const emojiPanelRef = useRef<HTMLDivElement|null>(null);
  const wrapperRef = useRef<HTMLDivElement|null>(null);

  // IME / composición
  const isComposingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!showEmoji) return;
      const target = e.target as Node | null;
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(target) && wrapperRef.current && !wrapperRef.current.contains(target)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showEmoji]);

  const submit = async () => {
    const t = texto.trim();
    if (!t && !file) return;
    await onSend(t, file);
    setTexto("");
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    }
  };

  const cancelFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposingRef.current) return;
    const isEnter = e.key === "Enter";
    const isSendShortcut = (e.ctrlKey || e.metaKey) && isEnter;
    const isShiftEnter = e.shiftKey && isEnter;
    if (isSendShortcut) {
      e.preventDefault();
      submit();
      return;
    }
    if (isEnter && !isShiftEnter) {
      e.preventDefault();
      submit();
    }
  };

  const handleCompositionStart = () => { isComposingRef.current = true; };
  const handleCompositionEnd = () => { isComposingRef.current = false; };

  // emojis por categoría (en español)
  const EMOJI_CATEGORIES: Record<string, string[]> = {
    "Emoticonos": ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😍","😘","😇","🤩","🙂","🤗","😎","😴","😡","🤔"],
    "Gestos": ["👍","👎","👏","🙌","🙏","🤝","✌️","🤟","👌","🤏","✋","👋","🤙","🤘"],
    "Personas": ["👨","👩","👧","👦","🧑‍🚀","🧑‍🍳","🧑‍💻","🧑‍🏫","👴","👵","👶","🧑‍🎓"],
    "Objetos": ["📷","📎","🔗","📌","🔔","💡","🔒","📁","🖨️","💳","🧾","📦"],
    "Símbolos": ["✅","❌","⚠️","✨","❤️","💔","🔥","⭐","📛","🔰","🔖"],
    "Comida": ["🍎","🍌","🍕","🍔","🍣","🍪","☕","🍩","🍰","🍫"],
    "Animales": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐷"]
  };

  const CATEGORIES = Object.keys(EMOJI_CATEGORIES);

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setTexto((t) => (t + emoji));
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const before = texto.slice(0, start);
    const after = texto.slice(end);
    const next = before + emoji + after;
    setTexto(next);
    requestAnimationFrame(() => {
      const pos = start + emoji.length;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos;
    });
  };

  return (
    <footer className="w-full border-t bg-white/60 px-4 py-3">
      <div className="max-w-full mx-auto flex flex-col gap-2" ref={wrapperRef}>
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowEmoji(v => !v)}
            aria-expanded={showEmoji}
            aria-label="Abrir panel de emojis"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            😊
          </button>

          {showEmoji && (
            <div
              ref={emojiPanelRef}
              className="absolute bottom-full left-0 mb-3 w-96 max-h-72 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              role="dialog"
              aria-label="Selector de emojis por categoría"
            >
              <div className="flex flex-col h-full">
                {/* categorías */}
                <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 rounded text-sm whitespace-nowrap ${activeCategory === cat ? "bg-yellow-100 text-yellow-800 font-semibold" : "hover:bg-gray-100"}`}
                      aria-pressed={activeCategory === cat}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* grid de emojis - emojis más grandes, centrados */}
                <div className="p-3 overflow-auto">
                  {/* usar inline-grid dentro de un contenedor flex para centrar todo el conjunto */}
                  <div className="flex justify-center">
                    <div className="inline-grid grid-cols-8 gap-2 justify-items-center">
                      {(EMOJI_CATEGORIES[activeCategory] || []).map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => { insertEmoji(e); }}
                          className="w-12 h-12 flex items-center justify-center text-2xl rounded hover:bg-gray-100"
                          aria-label={`Emoji ${e}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* pie con categoría activa */}
                <div className="px-3 py-2 border-t text-sm text-gray-600">
                  Categoría: <strong>{activeCategory}</strong>
                </div>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Escribe un mensaje..."
            rows={2}
            className="flex-1 resize-none rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            aria-label="Escribe un mensaje"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Adjuntar archivo"
          >
            📎
          </button>
          <button
            type="button"
            onClick={() => submit()}
            // Cambiado a fondo amarillo y texto negro para que la letra sea negra y mantenga contraste
            className="px-4 py-2 rounded-md bg-yellow-400 text-black disabled:opacity-50"
            disabled={!texto.trim() && !file}
          >
            Enviar
          </button>
        </div>

        {preview && (
          <div className="flex items-center gap-2">
            <img src={preview} alt="preview" className="h-16 w-16 object-cover rounded" />
            <button onClick={cancelFile} className="text-sm text-red-500">Cancelar</button>
          </div>
        )}
      </div>
    </footer>
  );
}
