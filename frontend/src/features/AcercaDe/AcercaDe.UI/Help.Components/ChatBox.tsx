import { useState } from "react";

const initialMessages = [
  { sender: "soporte", text: "¡Hola! ¿En qué podemos ayudarte hoy?" }
];

export default function ChatBox() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: "tú", text: input }]);
    setInput("");
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Chat de Ayuda</h2>
      <div className="h-40 overflow-y-auto mb-4 bg-gray-50 rounded p-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.sender === "tú" ? "text-blue-700" : "text-gray-700"}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form className="flex" onSubmit={handleSend}>
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1 mr-2"
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}