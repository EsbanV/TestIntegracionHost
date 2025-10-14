import type { Mensaje } from "@/types/chat";

interface ChatBubbleProps {
  mensaje: Mensaje;
}

export function ChatBubble({ mensaje }: ChatBubbleProps) {
  const esPropio = mensaje.autor === "yo";

  const renderEstado = () => {
    if (!mensaje.estado) return null;

    let texto = "";
    let color = "";

    switch (mensaje.estado) {
      case "enviando":
        texto = "⏳ Enviando...";
        color = "text-gray-400";
        break;
      case "enviado":
        texto = "✔ Enviado";
        color = "text-gray-500";
        break;
      case "recibido":
        texto = "✔✔ Recibido";
        color = "text-gray-400";
        break;
      case "leido":
        texto = "✔✔ Leído";
        color = "text-blue-500 font-semibold"; // en vez de green
        break;
    }

    return <span className={`ml-2 text-xs ${color}`}>{texto}</span>;
  };

  return (
    <div
      className={`flex mb-2 ${esPropio ? "justify-end" : "justify-start"}`}
    >
      <div>
        <div
          className={`max-w-xs px-4 py-2 rounded-lg shadow text-sm ${
            esPropio
              ? "bg-[#0075B4] text-white rounded-br-none"
              : "bg-[#EDC500] text-black rounded-bl-none"
          }`}
        >
          {mensaje.texto}
        </div>
        {esPropio && (
          <div className="flex justify-end">{renderEstado()}</div>
        )}
      </div>
    </div>
  );
}