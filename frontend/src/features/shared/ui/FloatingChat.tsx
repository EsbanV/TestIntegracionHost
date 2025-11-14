import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext" // Tu contexto de auth

// Icons
import { 
  LuMessageCircle, LuX, LuSend, LuSearch, LuChevronLeft, 
  LuGripHorizontal, LuPlus, LuLoader 
} from "react-icons/lu"

// UI Components (Shadcn)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// --- TIPOS (Iguales a tu ChatPage) ---
type Estado = "enviando" | "enviado" | "recibido" | "leido"
interface Mensaje { 
  id: number | string; 
  texto: string; // en tu DB es 'contenido'
  autor: "yo" | "otro"; 
  hora: string; 
  estado?: Estado 
}
interface Chat { 
  id: number; 
  nombre: string; 
  ultimoMensaje?: string; 
  mensajes: Mensaje[]; 
  avatar?: string;
  noLeidos?: number;
}
type ViewState = "list" | "chat"

const URL_BASE = import.meta.env.VITE_API_URL;

// --- COMPONENTE PRINCIPAL ---
export default function FloatingChat() {
  const { user, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ViewState>("list")
  
  // Estado de datos reales
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // WebSocket ref
  const ws = useRef<WebSocket | null>(null)
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001" // Ajusta según tu env

  // 1. Conexión WebSocket Global (Solo si hay token)
  useEffect(() => {
    if (!token) return

    const socket = new WebSocket(WS_URL)
    ws.current = socket

    socket.onopen = () => {
      // Autenticar socket
      socket.send(JSON.stringify({ type: 'auth', token }))
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Si llega un mensaje nuevo
      if (data.tipo === 'new_message') {
        const nuevoMsg = data.mensaje // Ajustar estructura según tu backend
        
        setChats(prev => {
          // Buscar si el chat existe
          const chatExists = prev.find(c => c.id === nuevoMsg.remitenteId)
          
          if (chatExists) {
            return prev.map(c => {
              if (c.id === nuevoMsg.remitenteId) {
                return {
                  ...c,
                  ultimoMensaje: nuevoMsg.contenido,
                  noLeidos: (c.noLeidos || 0) + 1,
                  mensajes: [...c.mensajes, {
                    id: nuevoMsg.id,
                    texto: nuevoMsg.contenido,
                    autor: 'otro',
                    hora: new Date(nuevoMsg.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    estado: 'recibido'
                  }]
                }
              }
              return c
            })
          } else {
            // Si es chat nuevo, recargar lista (o agregarlo manualmente si tienes los datos del usuario)
            fetchChats()
            return prev
          }
        })
      }
    }

    return () => socket.close()
  }, [token, WS_URL])

  // 2. Cargar lista de conversaciones
  const fetchChats = async () => {
    if (!token) return
    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.ok) {
        // Transformar respuesta del backend a nuestro formato UI
        const formattedChats: Chat[] = data.conversaciones.map((c: any) => ({
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          ultimoMensaje: c.ultimoMensaje.contenido,
          avatar: c.usuario.fotoPerfilUrl, // Asegúrate de que tu backend envíe esto
          noLeidos: c.unreadCount || 0,
          mensajes: [] // Se cargan al abrir
        }))
        setChats(formattedChats)
      }
    } catch (error) {
      console.error("Error cargando chats flotantes:", error)
    }
  }

  useEffect(() => {
    if (isOpen) fetchChats()
  }, [isOpen])

  // 3. Cargar mensajes de un chat específico
  const loadMessages = async (chatId: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversacion/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.ok) {
        const formattedMessages: Mensaje[] = data.mensajes.map((m: any) => ({
          id: m.id,
          texto: m.contenido,
          autor: m.remitenteId === user?.id ? 'yo' : 'otro',
          hora: new Date(m.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: m.leido ? 'leido' : 'enviado'
        }))

        setChats(prev => prev.map(c => 
          c.id === chatId ? { ...c, mensajes: formattedMessages, noLeidos: 0 } : c
        ))
      }
    } catch (error) {
      console.error("Error cargando conversación:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar selección de chat
  const handleSelectChat = (id: number) => {
    setActiveChatId(id)
    setView("chat")
    loadMessages(id)
  }

  const activeChat = chats.find((c) => c.id === activeChatId)
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0)

  // 4. Enviar Mensaje
  const handleSend = useCallback(async (texto: string) => {
    if (!activeChatId || !token) return
    
    // Optimistic Update
    const tempId = "tmp-" + Date.now()
    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    
    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { 
            ...c, 
            ultimoMensaje: texto,
            mensajes: [...c.mensajes, { id: tempId, texto, autor: 'yo', hora, estado: 'enviando' }] 
          } 
        : c
    ))

    try {
      const res = await fetch(`${URL_BASE}/api/chat/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ destinatarioId: activeChatId, contenido: texto })
      })
      
      if (res.ok) {
        // Actualizar estado a enviado
        setChats(prev => prev.map(c => 
          c.id === activeChatId 
            ? { 
                ...c, 
                mensajes: c.mensajes.map(m => m.id === tempId ? { ...m, estado: 'enviado' } : m) 
              } 
            : c
        ))
        // Emitir por socket para que el otro lo reciba instantáneamente
        ws.current?.send(JSON.stringify({
          event: 'send_message',
          data: { destinatarioId: activeChatId, contenido: texto }
        }))
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error)
    }
  }, [activeChatId, token])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {isOpen && (
          <ChatWindow 
            view={view}
            setView={setView}
            chats={chats}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            onSend={handleSend}
            onClose={() => setIsOpen(false)}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto absolute bottom-6 right-6 shadow-2xl shadow-blue-900/30 bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50"
          >
            <LuMessageCircle size={28} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {totalUnread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ===================== VENTANA CHAT (UI) ===================== */
// Este componente se encarga solo de la presentación y el arrastre
const ChatWindow = ({ view, setView, chats, activeChat, onSelectChat, onSend, onClose, isLoading }: any) => {
  const dragControls = useDragControls()

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: window.innerWidth - 350, top: 0, bottom: window.innerHeight - 500 }}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8, y: window.innerHeight - 100, x: window.innerWidth - 400 }}
      animate={{ opacity: 1, scale: 1, y: window.innerHeight - 600 }}
      exit={{ opacity: 0, scale: 0.8, y: window.innerHeight - 100, x: window.innerWidth - 400 }}
      className="pointer-events-auto absolute w-[360px] h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 cursor-move touch-none select-none"
      >
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <button onClick={() => setView("list")} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
              <LuChevronLeft className="text-slate-600" />
            </button>
          )}
          <h3 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">
            {view === "chat" ? activeChat?.nombre : "Mensajes"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <LuGripHorizontal className="text-slate-300 mr-2" size={14} />
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <LuX size={18} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden bg-white relative">
        <AnimatePresence mode="wait">
          {view === "list" ? (
            <ChatListView key="list" chats={chats} onSelect={onSelectChat} />
          ) : (
            <ChatConversationView key="chat" chat={activeChat} onSend={onSend} isLoading={isLoading} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ===================== LISTA DE CHATS ===================== */
const ChatListView = ({ chats, onSelect }: any) => (
  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="h-full flex flex-col">
    <div className="p-2 border-b border-slate-100">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
        <input placeholder="Buscar..." className="w-full bg-slate-100 text-sm pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {chats.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">No tienes chats recientes</div>
      ) : (
        chats.map((chat: any) => (
          <div key={chat.id} onClick={() => onSelect(chat.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={chat.avatar} />
              <AvatarFallback>{chat.nombre.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h4 className="font-medium text-slate-800 text-sm truncate">{chat.nombre}</h4>
                {chat.noLeidos > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chat.noLeidos}</span>}
              </div>
              <p className="text-xs text-slate-500 truncate">{chat.ultimoMensaje}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
)

/* ===================== CONVERSACIÓN ===================== */
const ChatConversationView = ({ chat, onSend, isLoading }: any) => {
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chat?.mensajes, isLoading])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText("")
  }

  if (isLoading) return <div className="h-full flex items-center justify-center"><LuLoader className="animate-spin text-blue-500" /></div>

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="h-full flex flex-col bg-slate-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {chat?.mensajes.map((msg: Mensaje) => (
          <div key={msg.id} className={`flex ${msg.autor === "yo" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm shadow-sm ${
              msg.autor === "yo" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
            }`}>
              <p className="leading-snug">{msg.texto}</p>
              <div className={`text-[9px] mt-0.5 flex justify-end gap-1 ${msg.autor === "yo" ? "text-blue-200" : "text-slate-400"}`}>
                {msg.hora}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe..." className="flex-1 h-8 rounded-full text-sm" />
        <Button type="submit" size="icon" className="h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-full">
          <LuSend size={14} />
        </Button>
      </form>
    </motion.div>
  )
}