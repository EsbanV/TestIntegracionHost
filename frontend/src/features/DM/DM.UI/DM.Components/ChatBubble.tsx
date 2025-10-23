// ChatBubble.tsx
import type { Mensaje } from "@/features/DM/DM.Types/chat";

interface ChatBubbleProps {
  mensaje: Mensaje;
}

export function ChatBubble({ mensaje }: ChatBubbleProps) {
  const esPropio = mensaje.autor === "yo";
  // ... (estado e imagen sin cambios) ...
  const estado = (mensaje as any).estado as string | undefined;
  const imagen = (mensaje as any).imagenUrl ?? (mensaje as any).imgUrl ?? null;
  // ... (wrapText sin cambios) ...
  const wrapText = (text: string, max = 30) => {
    if (!text) return "";
    return text
      .split("\n")
      .map((line) => {
        if (line.length <= max) return line;
        const parts: string[] = [];
        for (let i = 0; i < line.length; i += max) {
          parts.push(line.slice(i, i + max));
        }
        return parts.join("\n");
      })
      .join("\n");
  };
  const displayText = wrapText(String(mensaje.texto ?? ""), 30);
  const renderEstado = () => {
    // ... (lógica de estado sin cambios, pero ajustando color para fondo oscuro) ...
    if (!estado) return null;
    let texto = "";
    let color = "";
    switch (estado) {
      case "enviando":
        texto = "⏳ Enviando...";
        color = "text-gray-400"; // CAMBIO: Más claro
        break;
      case "enviado":
        texto = "✔ Enviado";
        color = "text-gray-400"; // CAMBIO: Más claro
        break;
      case "recibido":
        texto = "✔✔ Recibido";
        color = "text-gray-400"; // CAMBIO: Más claro
        break;
      case "leido":
        texto = "✔✔ Leído";
        color = "text-blue-400 font-semibold"; // CAMBIO: Azul más claro
        break;
      case "error":
        texto = "⚠ Error";
        color = "text-red-400"; // CAMBIO: Más claro
        break;
      default:
        texto = estado;
        color = "text-gray-400"; // CAMBIO: Más claro
    }
    return <span className={`ml-2 text-xs ${color}`}>{texto}</span>;
  };

  return (
    <div className={`flex mb-3 ${esPropio ? "justify-end" : "justify-start"}`}>
      <div>
        <div
          // CAMBIO CLAVE: AMBAS burbujas son blancas con texto negro
          className={`max-w-lg px-4 py-2 rounded-2xl text-sm transform transition-all duration-200 ease-out flex items-center
            ${esPropio
              ? "bg-white text-black rounded-br-none hover:shadow-lg hover:-translate-y-0.5" // CAMBIADO DE 'bg-blue-600'
              : "bg-white text-black rounded-bl-none hover:shadow-lg hover:-translate-y-0.5" // CAMBIADO DE 'bg-[#F2A900]'
            }`}
          style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.06)", whiteSpace: "pre-wrap" as const }}
        >
          <div className="w-full flex items-center gap-3">
            {imagen ? (
              <img
                src={imagen}
                alt="miniatura"
                className="h-12 w-12 object-cover rounded-md flex-shrink-0"
                style={{ width: 48, height: 48 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : null}
            <div className={`flex-1 ${imagen ? "" : "text-center"}`} style={{ lineHeight: 1.25 }}>
              {displayText}
            </div>
          </div>
        </div>
        {esPropio && (
          // CAMBIO: Texto de estado visible en fondo oscuro
          <div className="flex justify-end mt-1 text-gray-400">{renderEstado()}</div>
        )}
      </div>
    </div>
  );
}