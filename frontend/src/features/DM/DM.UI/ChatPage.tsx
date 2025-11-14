import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Icons
import { 
  LuSend, LuPaperclip, LuSmile, LuSearch, LuEllipsisVertical , 
  LuCheck, LuCheckCheck, LuClock, LuX, LuMessageSquare, LuImage 
} from 'react-icons/lu'

// Hooks & Context (Ajusta las rutas según tu proyecto)
import { useAuth } from '@/app/context/AuthContext'
import { MockChatWS } from '@/features/DM/DM.Hooks/MockChatWS'
import { mockChats as rawMockChats } from '@/features/shared/Shared.Repositories/mockChats'

// --- TIPOS ---
type EstadoMensaje = 'enviando' | 'enviado' | 'recibido' | 'leido' | 'error'

interface Mensaje {
  id: string
  texto: string
  autor: 'yo' | 'otro'
  hora: string
  estado?: EstadoMensaje
  imagenUrl?: string
  clientTempId?: string
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

// --- HELPERS ---
const horaActual = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// --- COMPONENTE PRINCIPAL ---
export default function ChatPage() {
  const { API, WS_URL } = useEnv()
  const location = useLocation()
  const { user } = useAuth()
  
  // Estado
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  
  // Refs
  const ws = useRef<WebSocket | MockChatWS | null>(null)
  const isMockWS = !WS_URL || WS_URL === "mock"

  // 1. Cargar Chats (Inicial)
  useEffect(() => {
    // Mock Data inicial
    const formattedMockChats: Chat[] = rawMockChats.map((c: any) => ({
      ...c,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`,
      mensajes: c.mensajes.map((m: any) => ({ ...m, id: String(m.id) })),
      online: Math.random() > 0.5,
      noLeidos: Math.floor(Math.random() * 3)
    }))
    setChats(formattedMockChats)
    
    // Si es desktop, seleccionar el primero por defecto
    if (window.innerWidth >= 768 && formattedMockChats.length > 0) {
      setActiveChatId(formattedMockChats[0].id)
    }
  }, [])

  // 2. WebSocket Logic (Simplificada para el ejemplo unificado)
  useEffect(() => {
    const socket = isMockWS ? new MockChatWS() : new WebSocket(`${WS_URL}`)
    ws.current = socket

    socket.onmessage = (evt: { data: string }) => {
      const data = JSON.parse(evt.data)
      if (data.tipo === 'mensaje') {
        setChats(prev => prev.map(c => {
          if (c.id === data.chatId) {
            return {
              ...c,
              ultimoMensaje: data.mensaje.texto,
              mensajes: [...c.mensajes, { ...data.mensaje, estado: 'recibido' }]
            }
          }
          return c
        }))
      }
    }
    return () => socket.close()
  }, [])

  // 3. Manejar Envío
  const handleSend = useCallback((texto: string, file?: File | null) => {
    if (!activeChatId) return

    const tempId = `temp-${Date.now()}`
    const nuevoMensaje: Mensaje = {
      id: tempId,
      texto,
      autor: 'yo',
      hora: horaActual(),
      estado: 'enviando',
      imagenUrl: file ? URL.createObjectURL(file) : undefined
    }

    // Actualización Optimista
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          ultimoMensaje: texto || (file ? '📷 Imagen' : ''),
          mensajes: [...c.mensajes, nuevoMensaje]
        }
      }
      return c
    }))

    // Simular respuesta del servidor
    setTimeout(() => {
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            mensajes: c.mensajes.map(m => 
              m.id === tempId ? { ...m, estado: 'enviado' } : m
            )
          }
        }
        return c
      }))
    }, 1000)
  }, [activeChatId])

  const activeChat = chats.find(c => c.id === activeChatId)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm m-4 md:m-6">
      
      {/* --- PANEL IZQUIERDO: LISTA DE CHATS --- */}
      <div className={`${
        mobileView === 'list' ? 'flex' : 'hidden md:flex'
      } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white`}>
        
        {/* Header Lista */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">Mensajes</h2>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <LuMessageSquare size={20} />
          </div>
        </div>

        {/* Buscador */}
        <div className="px-4 py-3">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="Buscar chat..." 
              className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
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
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                  <img src={chat.avatar} alt={chat.nombre} className="w-full h-full object-cover" />
                </div>
                {chat.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`text-sm font-semibold truncate ${activeChatId === chat.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {chat.nombre}
                  </h3>
                  <span className="text-[10px] text-slate-400">10:42 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 truncate max-w-[140px]">
                    {chat.ultimoMensaje}
                  </p>
                  {chat.noLeidos ? (
                    <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {chat.noLeidos}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- PANEL DERECHO: CONVERSACIÓN --- */}
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
                
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    <img src={activeChat.avatar} alt={activeChat.nombre} className="w-full h-full object-cover" />
                  </div>
                  {activeChat.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeChat.nombre}</h3>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    {activeChat.online ? '● En línea' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <LuEllipsisVertical  size={20} />
              </button>
            </div>

            {/* Área de Mensajes */}
            <ChatMessages mensajes={activeChat.mensajes} />

            {/* Input Area */}
            <ChatInputBox onSend={handleSend} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <LuMessageSquare size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-600">¡Comienza a chatear!</h3>
            <p className="text-sm max-w-xs mt-2">Selecciona un contacto de la izquierda para iniciar una conversación.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- SUBCOMPONENTE: LISTA DE MENSAJES ---
const ChatMessages = ({ mensajes }: { mensajes: Mensaje[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" ref={scrollRef}>
      {mensajes.map((msg, idx) => {
        const esPropio = msg.autor === 'yo'
        const mostrarAvatar = !esPropio && (idx === 0 || mensajes[idx - 1].autor === 'yo')
        
        return (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${esPropio ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] md:max-w-[70%] gap-2 ${esPropio ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Burbuja */}
              <div className={`
                relative px-4 py-2.5 rounded-2xl text-sm shadow-sm
                ${esPropio 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }
              `}>
                {msg.imagenUrl && (
                  <div className="mb-2 -mx-2 -mt-2 rounded-t-xl overflow-hidden">
                    <img src={msg.imagenUrl} alt="adjunto" className="max-w-full h-auto object-cover" />
                  </div>
                )}
                
                <p className="leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                
                {/* Metadata (Hora y Estado) */}
                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${esPropio ? 'text-blue-100' : 'text-slate-400'}`}>
                  <span>{msg.hora}</span>
                  {esPropio && (
                    <span>
                      {msg.estado === 'enviando' && <LuClock size={12} />}
                      {msg.estado === 'enviado' && <LuCheck size={12} />}
                      {msg.estado === 'recibido' && <LuCheckCheck size={12} />}
                      {msg.estado === 'leido' && <LuCheckCheck size={12} className="text-blue-200" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// --- SUBCOMPONENTE: INPUT ---
const ChatInputBox = ({ onSend }: { onSend: (t: string, f?: File) => void }) => {
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
  }

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
        
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <LuPaperclip size={20} />
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
          style={{ minHeight: '40px' }}
        />

        <button 
          type="button"
          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <LuSmile size={20} />
        </button>

        <button 
          type="submit"
          disabled={!text.trim()}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
        >
          <LuSend size={18} />
        </button>
      </form>
    </div>
  )
}

// --- HOOK DE ENTORNO ---
const useEnv = () => {
  const API = useMemo(() => import.meta.env.VITE_API_URL as string, [])
  const WS_URL = useMemo(() => import.meta.env.VITE_WS_URL as string, [])
  return { API, WS_URL }
}