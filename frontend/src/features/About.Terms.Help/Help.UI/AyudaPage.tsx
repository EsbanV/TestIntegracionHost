import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LifeBuoy, Send, MessageCircle, Search, 
  ChevronRight, HelpCircle, Loader2 
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- CONSTANTES (Datos de FAQ) ---
const FAQ_DATA = [
  {
    question: "¿Cómo puedo contactar al soporte?",
    answer: "Puedes escribirnos directamente usando el chat de ayuda en esta página o completar el formulario de contacto en nuestro pie de página."
  },
  {
    question: "¿Dónde encuentro la documentación?",
    answer: "La documentación oficial está disponible en la sección de recursos del estudiante o puedes solicitarla directamente por el chat."
  },
  {
    question: "¿Cómo actualizo mi perfil?",
    answer: "Dirígete a la sección 'Mi Perfil' en el menú lateral o superior y haz clic en el botón 'Editar' para modificar tus datos."
  },
  {
    question: "¿Qué hago si la app no carga?",
    answer: "Intenta recargar la página (F5). Si el problema persiste, borra la caché del navegador o intenta acceder desde otro dispositivo."
  },
  {
    question: "¿Cómo reporto un error?",
    answer: "Utiliza el chat de soporte indicando 'Reportar Bug' o envíanos un correo a soporte@marketuct.cl con capturas de pantalla."
  },
  {
    question: "¿Mis datos están seguros?",
    answer: "Sí, utilizamos protocolos de encriptación estándar y no compartimos tu información personal con terceros sin tu consentimiento."
  },
];

// --- SUB-COMPONENTE: FAQ ITEM ---
const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
  <div className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm md:text-base">
      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
      {question}
    </h3>
    <p className="mt-2 text-sm text-muted-foreground leading-relaxed pl-6">
      {answer}
    </p>
  </div>
);

// --- SUB-COMPONENTE: CHAT DE SOPORTE (Refactorizado de ChatBox.tsx) ---
const SupportChatWidget = () => {
  const [messages, setMessages] = useState([
    { sender: "soporte", text: "¡Hola! 👋 Soy el asistente virtual de MarketUCT. ¿En qué podemos ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Agregar mensaje del usuario
    const userMsg = { sender: "tú", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simular respuesta del bot
    setTimeout(() => {
      setMessages((prev) => [
        ...prev, 
        { sender: "soporte", text: "Gracias por tu mensaje. Un agente humano revisará tu consulta en breve." }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <Card className="border-border bg-card shadow-sm h-full flex flex-col overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/20 py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageCircle size={20} />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">Chat de Soporte</CardTitle>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> En línea
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-[350px]">
        {/* Área de Mensajes */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-muted/5 max-h-[400px] custom-scrollbar">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === "tú";
            return (
              <div key={idx} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`
                    max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm
                    ${isMe 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-card border border-border text-foreground rounded-bl-sm"}
                  `}
                >
                  <p className="leading-snug">{msg.text}</p>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card">
          <form className="flex gap-2" onSubmit={handleSend}>
            <Input
              type="text"
              className="flex-1 bg-muted/30 border-input focus:bg-card transition-all placeholder:text-muted-foreground"
              placeholder="Escribe tu consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 shrink-0"
              disabled={!input.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// PAGINA PRINCIPAL: AYUDA PAGE
// ============================================================================
export default function AyudaPage() {
  return (
    // Layout principal transparente para heredar fondo global
    <div className="w-full min-h-screen text-foreground p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto space-y-10"
      >
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <LifeBuoy className="h-8 w-8" />
              </div>
              Centro de Ayuda
            </h1>
            <p className="text-muted-foreground mt-2 text-base max-w-lg">
              Encuentra respuestas rápidas en nuestras preguntas frecuentes o contacta directamente con soporte.
            </p>
          </div>
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/20 text-primary bg-primary/5 rounded-full font-medium">
            Soporte 24/7
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: FAQ (7 columnas) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Preguntas Frecuentes</h2>
              <div className="relative w-48 hidden sm:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                    placeholder="Buscar tema..." 
                    className="w-full bg-card border border-border rounded-full py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                 />
              </div>
            </div>
            
            <div className="grid gap-4">
              {FAQ_DATA.map((item, idx) => (
                <FaqItem key={idx} question={item.question} answer={item.answer} />
              ))}
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3 items-start mt-4">
                <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                    <HelpCircle size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground">¿No encuentras lo que buscas?</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Revisa nuestros <a href="/terminos" className="text-primary hover:underline">Términos y Condiciones</a> para más detalles legales.
                    </p>
                </div>
            </div>
          </div>

          {/* Columna Derecha: Chat (5 columnas) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6">
               <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 lg:hidden">
                 Contactar Soporte
               </h2>
               <SupportChatWidget />
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}