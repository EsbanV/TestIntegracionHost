import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client' // 👈 Importamos socket.io

// Icons
import { 
  LuSend, LuPaperclip, LuSmile, LuSearch, LuEllipsisVertical , 
  LuCheck, LuCheckCheck, LuClock, LuX, LuMessageSquare, LuImage, LuLoader 
} from 'react-icons/lu'

// Hooks & Context
import { useAuth } from '@/app/context/AuthContext'

// --- TIPOS ---
type EstadoMensaje = 'enviando' | 'enviado' | 'recibido' | 'leido' | 'error'

interface Mensaje {
  id: number | string
  texto: string
  autor: 'yo' | 'otro'
  hora: string
  estado?: EstadoMensaje
  imagenUrl?: string
  tipo?: string
}

interface Chat {
  id: number
  nombre: string
  avatar?: string
  ultimoMensaje?: string
  mensajes: Mensaje[]
  noLeidos?: number
  online?: boolean
}

// --- CONFIGURACIÓN ---
const URL_BASE = import.meta.env.VITE_API_URL; // Ej: http://localhost:3001
// Helper para imágenes: Si la URL es relativa (/uploads/...), le pegamos el dominio.
const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

// --- COMPONENTE PRINCIPAL ---
export default function ChatPage() {
  const { user, token } = useAuth()
  const location = useLocation()
  
  // Estado
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
  // Refs
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // -----------------------------------------------------------------------
  // 1. CONEXIÓN SOCKET.IO
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!token) return

    // Conectamos pasando el token en 'auth' como espera tu server.js
    const newSocket = io(URL_BASE, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log("🟢 Socket conectado:", newSocket.id)
    })

    // Escuchar mensajes nuevos en tiempo real
    newSocket.on('new_message', (data: any) => {
      console.log("📩 Mensaje recibido:", data)
      handleIncomingMessage(data)
    })

    // Escuchar confirmación de envío
    newSocket.on('message_sent', (data: any) => {
       // Aquí podrías actualizar el estado de 'enviando' a 'enviado' usando un ID temporal
       // Por simplicidad, el optimistic update ya lo muestra.
    })

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  // -----------------------------------------------------------------------
  // 2. CARGAR BANDEJA DE ENTRADA (INBOX)
  // -----------------------------------------------------------------------
  const fetchConversations = async () => {
    if (!token) return
    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.ok) {
        // Transformar datos del backend al formato de UI
        const formattedChats: Chat[] = data.conversaciones.map((c: any) => ({
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          avatar: c.usuario.fotoPerfilUrl ? getFullImgUrl(c.usuario.fotoPerfilUrl) : undefined,
          ultimoMensaje: c.ultimoMensaje?.contenido || (c.ultimoMensaje?.tipo === 'imagen' ? '📷 Imagen' : ''),
          noLeidos: c.unreadCount || 0,
          mensajes: [], // Se cargarán al hacer clic
          online: false // Esto se podría actualizar con el evento 'user_online' del socket
        }))
        setChats(formattedChats)
        
        // Si venimos redirigidos de "Contactar Vendedor", abrir ese chat
        const state = location.state as { toUser?: any }
        if (state?.toUser) {
           const existingChat = formattedChats.find(c => c.id === state.toUser.id)
           if (existingChat) {
             setActiveChatId(existingChat.id)
             setMobileView('chat')
           } else {
             // Si es un chat nuevo que no existe en la lista, lo creamos temporalmente
             const newChatTemp: Chat = {
               id: state.toUser.id,
               nombre: state.toUser.nombre,
               avatar: state.toUser.fotoPerfilUrl ? getFullImgUrl(state.toUser.fotoPerfilUrl) : undefined,
               mensajes: [],
               noLeidos: 0
             }
             setChats(prev => [newChatTemp, ...prev])
             setActiveChatId(newChatTemp.id)
             setMobileView('chat')
           }
        }
      }
    } catch (error) {
      console.error("Error cargando chats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [token])

  // -----------------------------------------------------------------------
  // 3. CARGAR HISTORIAL AL ABRIR UN CHAT
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!activeChatId || !token) return

    const fetchHistory = async () => {
      try {
        // 1. Obtener historial
        const res = await fetch(`${URL_BASE}/api/chat/conversacion/${activeChatId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (data.ok) {
          const mensajesFormateados: Mensaje[] = data.mensajes.map((m: any) => ({
            id: m.id,
            texto: m.tipo === 'imagen' ? '' : m.contenido,
            imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(m.contenido) : undefined,
            autor: m.remitenteId === user?.id ? 'yo' : 'otro',
            hora: new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            estado: m.leido ? 'leido' : 'recibido',
            tipo: m.tipo
          }))

          setChats(prev => prev.map(c => 
            c.id === activeChatId 
              ? { ...c, mensajes: mensajesFormateados, noLeidos: 0 } 
              : c
          ))
        }

        // 2. Marcar como leídos
        await fetch(`${URL_BASE}/api/chat/conversacion/${activeChatId}/mark-read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })

      } catch (error) {
        console.error("Error cargando historial:", error)
      }
    }

    fetchHistory()
  }, [activeChatId, token, user?.id])

  // -----------------------------------------------------------------------
  // 4. MANEJO DE MENSAJES ENTRANTES (SOCKET)
  // -----------------------------------------------------------------------
  const handleIncomingMessage = (msgData: any) => {
    const remitenteId = msgData.remitente.id
    const esImagen = msgData.tipo === 'imagen'
    const contenido = esImagen ? '📷 Imagen' : msgData.contenido

    const nuevoMensaje: Mensaje = {
      id: msgData.id,
      texto: esImagen ? '' : msgData.contenido,
      imagenUrl: esImagen ? getFullImgUrl(msgData.contenido) : undefined,
      autor: 'otro',
      hora: new Date(msgData.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'recibido'
    }

    setChats(prev => {
      const chatExists = prev.find(c => c.id === remitenteId)
      
      if (chatExists) {
        return prev.map(c => {
          if (c.id === remitenteId) {
            const isChatOpen = activeChatId === remitenteId
            return {
              ...c,
              ultimoMensaje: contenido,
              noLeidos: isChatOpen ? 0 : (c.noLeidos || 0) + 1,
              mensajes: [...c.mensajes, nuevoMensaje]
            }
          }
          return c
        })
      } else {
        // Si llega mensaje de alguien que no está en la lista, recargar lista
        fetchConversations()
        return prev
      }
    })
  }

  // -----------------------------------------------------------------------
  // 5. ENVÍO DE MENSAJES E IMÁGENES
  // -----------------------------------------------------------------------
  const handleSend = async (texto: string, file?: File | null) => {
    if (!activeChatId || !token) return

    const tempId = `temp-${Date.now()}`
    let contenidoFinal = texto
    let tipoMensaje = 'texto'

    // A. Si hay archivo, subirlo primero
    if (file) {
      setIsUploading(true)
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
          contenidoFinal = data.imageUrl // El backend guarda la URL en 'contenido'
          tipoMensaje = 'imagen'
        } else {
          alert("Error al subir imagen")
          setIsUploading(false)
          return
        }
      } catch (error) {
        console.error("Error subiendo imagen", error)
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    // B. Optimistic Update (Mostrar mensaje inmediatamente en UI)
    const mensajeOptimista: Mensaje = {
      id: tempId,
      texto: tipoMensaje === 'imagen' ? '' : contenidoFinal,
      imagenUrl: tipoMensaje === 'imagen' ? (file ? URL.createObjectURL(file) : getFullImgUrl(contenidoFinal)) : undefined,
      autor: 'yo',
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'enviando'
    }

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          ultimoMensaje: tipoMensaje === 'imagen' ? '📷 Imagen' : contenidoFinal,
          mensajes: [...c.mensajes, mensajeOptimista]
        }
      }
      return c
    }))

    // C. Emitir evento Socket al backend
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        destinatarioId: activeChatId,
        contenido: contenidoFinal,
        tipo: tipoMensaje
      })
      
      // Simular cambio a "enviado" después de un momento (o esperar confirmación del socket)
      setTimeout(() => {
        setChats(prev => prev.map(c => 
           c.id === activeChatId 
             ? { ...c, mensajes: c.mensajes.map(m => m.id === tempId ? { ...m, estado: 'enviado' } : m) } 
             : c
        ))
      }, 500)
    }
  }

  const activeChat = chats.find(c => c.id === activeChatId)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm m-4 md:m-6">
      
      {/* --- LISTA DE CHATS --- */}
      <div className={`${
        mobileView === 'list' ? 'flex' : 'hidden md:flex'
      } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white`}>
        
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">Mensajes</h2>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <LuMessageSquare size={20} />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="Buscar chat..." 
              className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10"><LuLoader className="animate-spin text-slate-400" /></div>
          ) : chats.length === 0 ? (
             <div className="text-center text-slate-400 py-10 text-sm">No tienes mensajes aún</div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id)
                  setMobileView('chat')
                }}
                className={`group flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 border-l-4 ${
                  activeChatId === chat.id 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  {chat.avatar ? (
                     <img src={chat.avatar} alt={chat.nombre} className="w-12 h-12 rounded-full object-cover bg-slate-200" />
                  ) : (
                     <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                       {chat.nombre.charAt(0).toUpperCase()}
                     </div>
                  )}
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm font-semibold truncate ${activeChatId === chat.id ? 'text-blue-700' : 'text-slate-700'}`}>
                      {chat.nombre}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate max-w-[140px] ${chat.noLeidos ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                      {chat.ultimoMensaje || "Comenzar charla..."}
                    </p>
                    {chat.noLeidos ? (
                      <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {chat.noLeidos}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- CONVERSACIÓN --- */}
      <div className={`${
        mobileView === 'chat' ? 'flex' : 'hidden md:flex'
      } flex-1 flex-col bg-slate-50/50`}>
        
        {activeChat ? (
          <>
            {/* Header Chat */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600"
                >
                  <LuX size={20} />
                </button>
                
                <div className="relative shrink-0">
                   {activeChat.avatar ? (
                     <img src={activeChat.avatar} alt={activeChat.nombre} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                   ) : (
                     <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                       {activeChat.nombre.charAt(0).toUpperCase()}
                     </div>
                   )}
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeChat.nombre}</h3>
                  {/* Estado online/offline (opcional, requiere lógica adicional de socket) */}
                </div>
              </div>
              
              <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <LuEllipsisVertical  size={20} />
              </button>
            </div>

            {/* Mensajes */}
            <ChatMessages mensajes={activeChat.mensajes} messagesEndRef={messagesEndRef} />

            {/* Input */}
            {isUploading && (
               <div className="px-4 py-1 text-xs text-blue-600 bg-blue-50 flex items-center gap-2">
                 <LuLoader className="animate-spin"/> Subiendo imagen...
               </div>
            )}
            <ChatInputBox onSend={handleSend} isLoading={isUploading} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <LuMessageSquare size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-600">¡Comienza a chatear!</h3>
            <p className="text-sm max-w-xs mt-2">Selecciona un contacto de la izquierda para ver la conversación.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- SUBCOMPONENTES ---

const ChatMessages = ({ mensajes, messagesEndRef }: { mensajes: Mensaje[], messagesEndRef: any }) => {
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#f8f9fc]">
      {mensajes.length === 0 && (
        <div className="text-center text-slate-400 text-xs mt-10">
          No hay mensajes previos. Di "Hola" 👋
        </div>
      )}
      {mensajes.map((msg, idx) => {
        const esPropio = msg.autor === 'yo'
        
        return (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${esPropio ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${esPropio ? 'items-end' : 'items-start'}`}>
              
              <div className={`
                relative px-4 py-2.5 rounded-2xl text-sm shadow-sm
                ${esPropio 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                }
              `}>
                {msg.imagenUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden cursor-pointer">
                    <img src={msg.imagenUrl} alt="adjunto" className="max-w-full h-auto object-cover max-h-60" onClick={() => window.open(msg.imagenUrl, '_blank')} />
                  </div>
                )}
                
                {msg.texto && <p className="leading-relaxed whitespace-pre-wrap">{msg.texto}</p>}
              </div>
              
              {/* Metadata */}
              <div className="text-[10px] mt-1 text-slate-400 flex items-center gap-1 px-1">
                 <span>{msg.hora}</span>
                 {esPropio && (
                    <span>
                      {msg.estado === 'enviando' && <LuClock size={10} />}
                      {msg.estado === 'enviado' && <LuCheck size={10} />}
                      {msg.estado === 'recibido' && <LuCheckCheck size={10} />}
                      {msg.estado === 'leido' && <LuCheckCheck size={10} className="text-blue-500" />}
                    </span>
                 )}
              </div>

            </div>
          </motion.div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

const ChatInputBox = ({ onSend, isLoading }: { onSend: (t: string, f?: File) => void, isLoading: boolean }) => {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onSend('', e.target.files[0])
    }
    // Limpiar input para permitir subir el mismo archivo de nuevo
    e.target.value = ''
  }

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
        
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="Enviar imagen"
        >
          <LuImage size={20} />
        </button>
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          accept="image/*"
          onChange={handleFile}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-sm max-h-32 text-slate-800 placeholder:text-slate-400"
          rows={1}
          disabled={isLoading}
        />

        <button 
          type="submit"
          disabled={(!text.trim() && !isLoading) || isLoading}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
        >
          <LuSend size={18} />
        </button>
      </form>
    </div>
  )
}