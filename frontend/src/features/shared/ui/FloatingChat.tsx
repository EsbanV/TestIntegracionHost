import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { useAuth } from "@/app/context/AuthContext"
import { io, Socket } from "socket.io-client"
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'

// Icons
import { 
  LuMessageCircle, LuX, LuSend, LuSearch, LuChevronLeft, 
  LuGripHorizontal, LuLoader, LuImage, LuSmile 
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
  estado?: Estado;
  imagenUrl?: string;
  tipo?: string;
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

const URL_BASE = import.meta.env.VITE_API_URL; 

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
  
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)

  // 1. Conexión Socket
  useEffect(() => {
    if (!token) return

    const newSocket = io(URL_BASE, {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socketRef.current = newSocket

    newSocket.on("connect", () => console.log("🟢 MiniChat conectado"))
    newSocket.on("new_message", (msg: any) => handleIncomingMessage(msg))

    return () => { newSocket.disconnect() }
  }, [token])

  // 2. Cargar Chats
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
          mensajes: [],
          online: false
        }))
        setChats(formattedChats)
      }
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    if (token && isOpen) fetchChats()
  }, [token, isOpen])

  // 3. Manejar Mensajes Entrantes
  const handleIncomingMessage = (msgData: any) => {
    const remitenteId = msgData.remitente.id
    const contenido = msgData.tipo === 'imagen' ? '📷 Imagen' : msgData.contenido
    const hora = new Date(msgData.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})

    const nuevoMensaje: Mensaje = {
      id: msgData.id,
      texto: msgData.tipo === 'imagen' ? '' : msgData.contenido,
      imagenUrl: msgData.tipo === 'imagen' ? getFullImgUrl(msgData.contenido) : undefined,
      autor: "otro",
      hora: hora,
      estado: "recibido"
    }

    setChats(prev => {
      const chatIndex = prev.findIndex(c => c.id === remitenteId)
      if (chatIndex !== -1) {
        const updated = [...prev]
        const isChatOpen = isOpen && view === 'chat' && activeChatId === remitenteId
        
        updated[chatIndex] = {
          ...updated[chatIndex],
          ultimoMensaje: contenido,
          mensajes: [...updated[chatIndex].mensajes, nuevoMensaje],
          noLeidos: isChatOpen ? 0 : (updated[chatIndex].noLeidos || 0) + 1
        }
        updated.sort((a, b) => (a.id === remitenteId ? -1 : 1))
        return updated
      } else {
        fetchChats()
        return prev
      }
    })
  }

  // 4. Cargar Mensajes
  const loadMessages = async (chatId: number) => {
    setIsLoading(true)
    const currentChat = chats.find(c => c.id === chatId)
    
    if (currentChat && currentChat.mensajes.length > 0) {
      setIsLoading(false)
      markRead(chatId)
      return
    }

    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversacion/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.ok) {
        const msgs: Mensaje[] = data.mensajes.map((m: any) => ({
          id: m.id,
          texto: m.tipo === 'imagen' ? '' : m.contenido,
          imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(m.contenido) : undefined,
          autor: m.remitenteId === user?.id ? 'yo' : 'otro',
          hora: new Date(m.fechaEnvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          estado: 'leido'
        }))
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, mensajes: msgs, noLeidos: 0 } : c))
        markRead(chatId)
      }
    } catch (error) { console.error(error) }
    finally { setIsLoading(false) }
  }

  const markRead = async (chatId: number) => {
    try {
       await fetch(`${URL_BASE}/api/chat/conversacion/${chatId}/mark-read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
       })
    } catch(e) {}
  }

  const handleSelectChat = (id: number) => {
    setActiveChatId(id)
    setView("chat")
    setChats(prev => prev.map(c => c.id === id ? { ...c, noLeidos: 0 } : c))
    loadMessages(id)
  }

  // 5. Enviar Mensaje
  const handleSend = useCallback(async (texto: string, file?: File) => {
    if (!activeChatId || !token) return
    if (!texto.trim() && !file) return

    const tempId = "tmp-" + Date.now()
    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    
    let contenidoFinal = texto
    let tipoMensaje = 'texto'

    if (file) {
      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await fetch(`${URL_BASE}/api/upload/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        })
        const data = await res.json()
        if (data.ok) {
           contenidoFinal = data.imageUrl
           tipoMensaje = 'imagen'
        }
      } catch (e) { console.error(e); return; }
    }
    
    const prevUrl = file ? URL.createObjectURL(file) : undefined;

    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { 
            ...c, 
            ultimoMensaje: tipoMensaje === 'imagen' ? '📷 Imagen' : texto, 
            mensajes: [...c.mensajes, { 
                id: tempId, 
                texto: tipoMensaje === 'imagen' ? '' : texto, 
                imagenUrl: tipoMensaje === 'imagen' ? (prevUrl || getFullImgUrl(contenidoFinal)) : undefined,
                autor: 'yo', 
                hora, 
                estado: 'enviando' 
            }] 
          } 
        : c
    ))

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        destinatarioId: activeChatId,
        contenido: contenidoFinal,
        tipo: tipoMensaje
      })
    }
  }, [activeChatId, token])

  const activeChat = chats.find((c) => c.id === activeChatId)
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0)

  return (
    <>
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
            className="fixed bottom-6 right-6 z-[9999] shadow-xl shadow-blue-900/20 bg-gradient-to-br from-slate-800 to-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
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
    </>
  )
}

/* ===================== SUBCOMPONENTES ===================== */

const ChatWindow = ({ view, setView, chats, activeChat, onSelectChat, onSend, onClose, isLoading }: any) => {
  const dragControls = useDragControls()

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragConstraints={{ left: -window.innerWidth + 350, right: 20, top: -window.innerHeight + 500, bottom: 20 }}
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed right-6 bottom-24 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[9999]"
    >
      {/* --- HEADER BLANCO (CORREGIDO) --- */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 cursor-move touch-none select-none"
      >
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <button onClick={() => setView("list")} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
              <LuChevronLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
             <h3 className="font-bold text-slate-800 text-sm truncate max-w-[180px]">
               {view === "chat" ? activeChat?.nombre : "Mensajes"}
             </h3>
             {view === "chat" && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">● En línea</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="cursor-move p-2 text-slate-300 hover:text-slate-500">
             <LuGripHorizontal size={16} />
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors">
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
    <div className="p-3 border-b border-slate-50 bg-white">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
        <input placeholder="Buscar..." className="w-full bg-slate-50 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all" />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs">
           <LuMessageCircle size={32} className="mb-2 opacity-20" />
           No hay conversaciones
        </div>
      ) : (
        chats.map((chat: any) => (
          <div key={chat.id} onClick={() => onSelect(chat.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group">
            <div className="relative">
               <Avatar className="h-10 w-10 border border-slate-100">
                 <AvatarImage src={chat.avatar} className="object-cover" />
                 <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">{chat.nombre.charAt(0)}</AvatarFallback>
               </Avatar>
               {chat.noLeidos > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className={`text-sm truncate ${chat.noLeidos > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{chat.nombre}</h4>
                {chat.noLeidos > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full font-bold">{chat.noLeidos}</span>}
              </div>
              <p className={`text-xs truncate ${chat.noLeidos ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{chat.ultimoMensaje || 'Imagen enviada'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
)

const ChatConversationView = ({ chat, onSend, isLoading }: any) => {
  const [text, setText] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chat?.mensajes, isLoading])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText("")
    setShowEmoji(false)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onSend('', e.target.files[0])
    e.target.value = ''
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji)
  }

  if (isLoading) return <div className="h-full flex items-center justify-center"><LuLoader className="animate-spin text-slate-400" /></div>

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="h-full flex flex-col bg-[#F8F9FC]">
      
      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chat?.mensajes.map((msg: Mensaje) => {
          const isMe = msg.autor === "yo";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                isMe 
                  ? "bg-blue-600 text-white rounded-br-none" // 🔵 Azul para mí
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-none" // ⚪ Blanco para otros
              }`}>
                {msg.imagenUrl && (
                   <img src={msg.imagenUrl} alt="adjunto" className="rounded-lg mb-1 max-h-40 object-cover cursor-pointer bg-black/10" onClick={() => window.open(msg.imagenUrl, '_blank')} />
                )}
                {msg.texto && <p className="leading-snug break-words whitespace-pre-wrap">{msg.texto}</p>}
                <div className={`text-[9px] mt-1 flex justify-end gap-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.hora}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-16 left-2 z-50 shadow-xl rounded-xl overflow-hidden border border-slate-200">
          <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={350} theme={Theme.LIGHT} searchDisabled previewConfig={{showPreview: false}} />
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-2 bg-white border-t border-slate-200 flex items-end gap-1.5">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
          <LuImage size={20} />
        </button>
        <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-lg transition-colors ${showEmoji ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:bg-slate-100'}`}>
          <LuSmile size={20} />
        </button>
        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFile} />
        
        <textarea 
           value={text} 
           onChange={(e) => setText(e.target.value)} 
           onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
           placeholder="Escribe..." 
           className="flex-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none max-h-24 min-h-[36px]"
           rows={1}
        />
        
        <Button type="submit" size="icon" disabled={!text.trim()} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-9 w-9 shrink-0 shadow-sm">
          <LuSend size={16} />
        </Button>
      </form>
    </motion.div>
  )
}