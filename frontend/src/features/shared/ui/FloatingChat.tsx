import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext"
import { io, Socket } from "socket.io-client"

// Icons
import { 
  LuMessageCircle, LuX, LuSend, LuSearch, LuChevronLeft, 
  LuGripHorizontal, LuLoader 
} from "react-icons/lu"

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// --- TIPOS ---
type Estado = "enviando" | "enviado" | "recibido" | "leido"

interface Mensaje { 
  id: number | string; 
  texto: string; 
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
  online?: boolean;
}

type ViewState = "list" | "chat"

// Configuración URL
const URL_BASE = import.meta.env.VITE_API_URL; 

// Helper para imágenes
const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

// --- COMPONENTE PRINCIPAL ---
export default function FloatingChat() {
  const { user, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ViewState>("list")
  
  // Estado de datos
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Referencia al Socket
  const socketRef = useRef<Socket | null>(null)

  // 1. CONEXIÓN SOCKET.IO (REAL-TIME)
  useEffect(() => {
    if (!token) return

    // Conectar usando la librería cliente
    const newSocket = io(URL_BASE, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current = newSocket

    // Eventos Socket
    newSocket.on("connect", () => {
      console.log("🟢 MiniChat conectado:", newSocket.id)
    })

    newSocket.on("new_message", (mensajeBackend: any) => {
      console.log("📩 MiniChat recibió:", mensajeBackend)
      handleIncomingMessage(mensajeBackend)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  // 2. Cargar lista de conversaciones (API REST)
  const fetchChats = async () => {
    if (!token) return
    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.ok) {
        const formattedChats: Chat[] = data.conversaciones.map((c: any) => ({
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          ultimoMensaje: c.ultimoMensaje?.tipo === 'imagen' ? '📷 Imagen' : c.ultimoMensaje?.contenido,
          avatar: getFullImgUrl(c.usuario.fotoPerfilUrl),
          noLeidos: c.unreadCount || 0,
          mensajes: [], // Se llenará al abrir
          online: false // Pendiente implementar estado online
        }))
        setChats(formattedChats)
      }
    } catch (error) {
      console.error("Error cargando chats flotantes:", error)
    }
  }

  // Cargar inicial al abrir
  useEffect(() => {
    // Cargar chats al montar o al abrir si estaba vacío
    if (token) fetchChats()
  }, [token, isOpen])

  // 3. Manejo de Mensajes Entrantes
  const handleIncomingMessage = (msgData: any) => {
    const remitenteId = msgData.remitente.id
    const contenido = msgData.tipo === 'imagen' ? '📷 Imagen' : msgData.contenido
    const hora = new Date(msgData.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

    const nuevoMensaje: Mensaje = {
      id: msgData.id,
      texto: contenido,
      autor: "otro",
      hora: hora,
      estado: "recibido"
    }

    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(c => c.id === remitenteId)

      if (chatIndex !== -1) {
        // Actualizar chat existente
        const updatedChats = [...prevChats]
        const chat = updatedChats[chatIndex]
        
        // Si el chat está abierto y activo, no incrementamos no leídos
        const isChatOpen = isOpen && view === 'chat' && activeChatId === remitenteId
        
        updatedChats[chatIndex] = {
          ...chat,
          ultimoMensaje: contenido,
          mensajes: [...chat.mensajes, nuevoMensaje],
          noLeidos: isChatOpen ? 0 : (chat.noLeidos || 0) + 1
        }
        
        // Mover al principio
        updatedChats.sort((a, b) => (a.id === remitenteId ? -1 : 1))
        return updatedChats
      } else {
        // Si es nuevo chat, recargar lista
        fetchChats()
        return prevChats
      }
    })
  }

  // 4. Cargar historial de mensajes de un chat
  const loadMessages = async (chatId: number) => {
    setIsLoading(true)
    // Verificar cache local simple
    const currentChat = chats.find(c => c.id === chatId)
    if (currentChat && currentChat.mensajes.length > 0) {
      setIsLoading(false)
      // Aún así marcamos como leído en backend
      markRead(chatId)
      return
    }

    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversacion/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.ok) {
        const formattedMessages: Mensaje[] = data.mensajes.map((m: any) => ({
          id: m.id,
          texto: m.tipo === 'imagen' ? '📷 Imagen' : m.contenido,
          autor: m.remitenteId === user?.id ? 'yo' : 'otro',
          hora: new Date(m.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: 'leido'
        }))

        setChats(prev => prev.map(c => 
          c.id === chatId ? { ...c, mensajes: formattedMessages, noLeidos: 0 } : c
        ))
        
        markRead(chatId)
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const markRead = async (chatId: number) => {
    try {
      await fetch(`${URL_BASE}/api/chat/conversacion/${chatId}/mark-read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (e) { console.error(e) }
  }

  const handleSelectChat = (id: number) => {
    setActiveChatId(id)
    setView("chat")
    // Resetear contador localmente
    setChats(prev => prev.map(c => c.id === id ? { ...c, noLeidos: 0 } : c))
    loadMessages(id)
  }

  // 5. ENVIAR MENSAJE
  const handleSend = useCallback(async (texto: string) => {
    if (!activeChatId || !token || !texto.trim()) return
    
    const tempId = "tmp-" + Date.now()
    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    
    // Optimistic Update
    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { 
            ...c, 
            ultimoMensaje: texto,
            mensajes: [...c.mensajes, { id: tempId, texto, autor: 'yo', hora, estado: 'enviando' }] 
          } 
        : c
    ))

    // Emitir evento Socket
    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        destinatarioId: activeChatId,
        contenido: texto,
        tipo: "texto"
      })
      
      // Confirmación simulada
      setTimeout(() => {
        setChats(prev => prev.map(c => 
          c.id === activeChatId 
            ? { ...c, mensajes: c.mensajes.map(m => m.id === tempId ? { ...m, estado: 'enviado' } : m) } 
            : c
        ))
      }, 500)
    }

  }, [activeChatId, token])

  const activeChat = chats.find((c) => c.id === activeChatId)
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0)

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

/* ===================== SUBCOMPONENTES (Vista y UI) ===================== */

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
      className="pointer-events-auto absolute w-[360px] h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden right-6 bottom-24" // Posición ajustada
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
            <Avatar className="h-9 w-9 border border-slate-100">
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
              <p className="leading-snug break-words">{msg.texto}</p>
              <div className={`text-[9px] mt-0.5 flex justify-end gap-1 ${msg.autor === "yo" ? "text-blue-200" : "text-slate-400"}`}>
                {msg.hora}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
        <Input 
           value={text} 
           onChange={(e) => setText(e.target.value)} 
           placeholder="Escribe..." 
           className="flex-1 h-9 rounded-full text-sm border-slate-200 focus:ring-1 focus:ring-blue-500" 
        />
        <Button type="submit" size="icon" className="h-9 w-9 bg-blue-600 hover:bg-blue-700 rounded-full">
          <LuSend size={16} />
        </Button>
      </form>
    </motion.div>
  )
}