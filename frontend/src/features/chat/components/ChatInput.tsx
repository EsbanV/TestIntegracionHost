import { useState } from "react";

export function ChatInput({ onSend }: { onSend: (t: string, file?: File|null)=>Promise<void> }) {
  const [texto, setTexto] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);

  const submit = async () => {
    const t = texto.trim();
    if (!t && !file) return;
    await onSend(t, file);
    setTexto("");
    setFile(null);
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      if (f.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(f));
      } else {
        setPreview(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      submit();
    }
  };

  return (
    <div className="bg-transparent border-t">
      <div className="px-8 py-4">
        {/* Miniatura arriba de la entrada de texto */}
        {preview && (
          <div className="mb-2 flex justify-start">
            <img src={preview} alt="preview" className="max-h-24 rounded shadow" />
          </div>
        )}
        {file && !preview && (
          <div className="mb-2 text-sm text-gray-700 flex items-center gap-2">
            <span>Archivo: {file.name}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={2}
            className="flex-1 min-h-[44px] max-h-32 rounded-full border border-slate-300 bg-white px-4 text-[15px] outline-none focus:border-slate-400 resize-none"
          />
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="chat-file-input"
          />
          <label htmlFor="chat-file-input" className="cursor-pointer px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
            📎
          </label>
          <button
            onClick={submit}
            className="h-11 px-5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
