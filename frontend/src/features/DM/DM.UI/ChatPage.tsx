import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { io, Socket } from 'socket.io-client'

// Icons
import { 
  LuSend, LuX, LuCheck, LuCheckCheck, 
  LuShoppingBag, LuStar, LuPackageCheck, LuTruck, LuCircleAlert, LuImage, LuLoader
} from 'react-icons/lu'

import { useAuth } from '@/app/context/AuthContext'
import RateUserModal from '@/features/DM/DM.UI/DM.Components/RateUserModal'

// --- TIPOS ---
type EstadoMensaje = 'enviando' | 'enviado' | 'recibido' | 'leido' | 'error'

interface TransaccionActiva {
  id: number;
  producto: { id: number, nombre: string, imagen?: string };
  estadoId: number; // 1: Pendiente, 2: Completado, 3: Cancelado
  esComprador: boolean; 
  esVendedor: boolean; 
  confirmacionVendedor: boolean;
  confirmacionComprador: boolean;
}

interface Mensaje {
  id: number | string
  texto: string
  autor: 'yo' | 'otro' | 'sistema'
  hora: string
  estado?: EstadoMensaje
  imagenUrl?: string
  tipo?: string
  metadata?: any
}

interface Chat {
  id: number
  nombre: string
  avatar?: string
  ultimoMensaje?: string
  mensajes: Mensaje[]
  noLeidos?: number
  online?: boolean
  transaccion?: TransaccionActiva | null; 
}

const URL_BASE = import.meta.env.VITE_API_URL; 

const getFullImgUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${URL_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function ChatPage() {
  const { user, token } = useAuth()
  const location = useLocation()
  
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
  // Estado Calificación
  const [isRateModalOpen, setIsRateModalOpen] = useState(false)
  const [pendingRatingData, setPendingRatingData] = useState<{sellerId: number, sellerName: string, transactionId: number} | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. CONEXIÓN SOCKET.IO
  useEffect(() => {
    if (!token) return
    const newSocket = io(URL_BASE, { auth: { token }, transports: ['websocket', 'polling'] })
    socketRef.current = newSocket
    
    newSocket.on('connect', () => console.log("🟢 Socket conectado"))
    
    // Escuchar mensajes nuevos
    newSocket.on('new_message', (data: any) => handleIncomingMessage(data))
    
    // Escuchar actualizaciones de transacción
    newSocket.on('transaction_update', (data: any) => {
        handleTransactionUpdate(data);
    });

    // Escuchar evento específico de transacción (Confirmaciones)
    newSocket.on('transaction_event', (data: any) => {
        handleTransactionUpdate(data);
    });

    return () => { newSocket.disconnect() }
  }, [token])

  // 2. CARGAR CHATS (INBOX)
  const fetchConversations = async () => {
    if (!token) return
    try {
      const res = await fetch(`${URL_BASE}/api/chat/conversaciones`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (data.ok) {
        const formattedChats: Chat[] = data.conversaciones.map((c: any) => ({
          id: c.usuario.id,
          nombre: c.usuario.nombre || c.usuario.usuario,
          avatar: c.usuario.fotoPerfilUrl ? getFullImgUrl(c.usuario.fotoPerfilUrl) : undefined,
          ultimoMensaje: c.ultimoMensaje?.contenido,
          noLeidos: c.unreadCount || 0,
          mensajes: [],
          online: false,
          transaccion: null 
        }))
        setChats(formattedChats)
        
        // Manejo de navegación desde botón "Contactar"
        const state = location.state as { toUser?: any, transactionId?: number }
        if (state?.toUser) {
           const existingChat = formattedChats.find(c => c.id === state.toUser.id)
           if (existingChat) {
             setActiveChatId(existingChat.id)
             setMobileView('chat')
           } else {
             // Chat nuevo temporal
             const newChatTemp: Chat = {
               id: state.toUser.id,
               nombre: state.toUser.nombre,
               avatar: state.toUser.fotoPerfilUrl ? getFullImgUrl(state.toUser.fotoPerfilUrl) : undefined,
               mensajes: [],
               noLeidos: 0,
               transaccion: null
             }
             setChats(prev => [newChatTemp, ...prev])
             setActiveChatId(newChatTemp.id)
             setMobileView('chat')
           }
        }
      }
    } catch (error) { console.error(error) } 
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchConversations() }, [token])

  // 3. CARGAR HISTORIAL Y TRANSACCIÓN ACTIVA
  useEffect(() => {
    if (!activeChatId || !token) return

    const fetchHistoryAndTransaction = async () => {
      try {
        // A. Cargar Mensajes
        const resMsg = await fetch(`${URL_BASE}/api/chat/conversacion/${activeChatId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const dataMsg = await resMsg.json()

        // B. Buscar Transacción Activa
        let transaccionActiva = null;
        try {
             const resTx = await fetch(`${URL_BASE}/api/transactions/check-active/${activeChatId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             const dataTx = await resTx.json();
             
             if(dataTx.ok && dataTx.transaction) {
                 transaccionActiva = {
                     id: dataTx.transaction.id,
                     producto: dataTx.transaction.producto,
                     estadoId: dataTx.transaction.estadoId,
                     esComprador: dataTx.transaction.compradorId === user?.id,
                     esVendedor: dataTx.transaction.vendedorId === user?.id,
                     confirmacionVendedor: dataTx.transaction.confirmacionVendedor,
                     confirmacionComprador: dataTx.transaction.confirmacionComprador
                 };
             }
        } catch (e) { console.log("Sin transacción activa o error al cargar", e); }

        if (dataMsg.ok) {
          const mensajesFormateados: Mensaje[] = dataMsg.mensajes.map((m: any) => {
            let metadata = null;
            if (m.tipo === 'sistema') { try { metadata = JSON.parse(m.contenido) } catch {} }
            return {
              id: m.id,
              texto: m.tipo === 'imagen' ? '' : (m.tipo === 'sistema' ? '' : m.contenido),
              imagenUrl: m.tipo === 'imagen' ? getFullImgUrl(m.contenido) : undefined,
              autor: m.remitenteId === user?.id ? 'yo' : 'otro',
              hora: new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              estado: m.leido ? 'leido' : 'recibido',
              tipo: m.tipo,
              metadata
            }
          })
          
          setChats(prev => prev.map(c => c.id === activeChatId ? { 
              ...c, 
              mensajes: mensajesFormateados, 
              noLeidos: 0,
              transaccion: transaccionActiva 
          } : c))
        }
        
        // Marcar leídos
        await fetch(`${URL_BASE}/api/chat/conversacion/${activeChatId}/mark-read`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch (error) { console.error(error) }
    }
    fetchHistoryAndTransaction()
  }, [activeChatId, token, user?.id])

  // 4. MANEJO DE MENSAJES ENTRANTES
  const handleIncomingMessage = (msgData: any) => {
    const remitenteId = msgData.remitente.id
    const isSystem = msgData.tipo === 'sistema'
    let metadata = null;
    if (isSystem) { try { metadata = JSON.parse(msgData.contenido) } catch {} }

    const nuevoMensaje: Mensaje = {
      id: msgData.id,
      texto: msgData.tipo === 'imagen' ? '' : msgData.contenido,
      autor: 'otro',
      hora: new Date(msgData.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'recibido',
      tipo: msgData.tipo,
      metadata
    }

    setChats(prev => {
       const chatExists = prev.find(c => c.id === remitenteId)
       if(chatExists) {
          return prev.map(c => c.id === remitenteId ? {
              ...c,
              mensajes: [...c.mensajes, nuevoMensaje],
              noLeidos: activeChatId === remitenteId ? 0 : (c.noLeidos || 0) + 1
          } : c)
       } else { 
           fetchConversations(); 
           return prev; 
       }
    })
  }

  // 5. MANEJO DE ACTUALIZACIONES DE TRANSACCIÓN (SOCKET)
  const handleTransactionUpdate = (data: any) => {
      if (!activeChatId) return;

      setChats((prev: Chat[]) => prev.map((c): Chat => {
          // Verificar que es el chat activo y que coincide la transacción
          if (c.id === activeChatId && c.transaccion?.id === data.transactionId) {
              
              const currentTx = c.transaccion!; 
              const txUpdate = { ...currentTx };
              
              if (data.type === 'DELIVERY_CONFIRMED') {
                  txUpdate.confirmacionVendedor = true;
              } else if (data.type === 'RECEIPT_CONFIRMED') {
                  txUpdate.confirmacionComprador = true;
                  txUpdate.estadoId = 2; // Completado
              }
              
              return { ...c, transaccion: txUpdate };
          }
          return c;
      }));
  };

  // 6. ENVIAR MENSAJE (IMPLEMENTADO AHORA)
  const handleSend = async (texto: string, file?: File | null) => {
      if ((!texto.trim() && !file) || !activeChatId || !token) return;

      setIsUploading(true);
      try {
          let contenido = texto;
          let tipo = 'texto';

          // A. Si hay imagen, subirla primero
          if (file) {
              const formData = new FormData();
              formData.append('image', file);
              
              const uploadRes = await fetch(`${URL_BASE}/api/upload/upload-image`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
              });
              const uploadData = await uploadRes.json();
              
              if (!uploadData.ok) throw new Error('Error subiendo imagen');
              contenido = uploadData.imageUrl; // Usar la URL retornada
              tipo = 'imagen';
          }

          // B. Enviar el mensaje al API
          const res = await fetch(`${URL_BASE}/api/chat/send`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  destinatarioId: activeChatId,
                  contenido: contenido,
                  tipo: tipo
              })
          });

          const data = await res.json();

          if (data.ok) {
              // C. Actualizar UI localmente
              const nuevoMensaje: Mensaje = {
                  id: data.mensaje.id,
                  texto: tipo === 'imagen' ? '' : contenido,
                  imagenUrl: tipo === 'imagen' ? getFullImgUrl(contenido) : undefined,
                  autor: 'yo',
                  hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  estado: 'enviado',
                  tipo: tipo
              };

              setChats(prev => prev.map(c => c.id === activeChatId ? {
                  ...c,
                  mensajes: [...c.mensajes, nuevoMensaje],
                  ultimoMensaje: tipo === 'imagen' ? '📷 Imagen' : contenido
              } : c));

              // D. Emitir evento socket para el destinatario
              socketRef.current?.emit('send_message', {
                  destinatarioId: activeChatId,
                  contenido: contenido,
                  tipo: tipo,
                  // Incluimos datos para que el socket receptor lo procese bien
                  remitente: { id: user?.id },
                  fechaEnvio: new Date()
              });
          }

      } catch (error) {
          console.error("Error al enviar:", error);
      } finally {
          setIsUploading(false);
      }
  }

  // --- ACCIONES DE TRANSACCIÓN ---

  const handleConfirmDelivery = async (transactionId: number) => {
      if(!token || !activeChatId) return;
      try {
          const res = await fetch(`${URL_BASE}/api/transactions/${transactionId}/confirm-delivery`, {
              method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if(res.ok) {
              setChats(prev => prev.map(c => c.id === activeChatId ? {
                  ...c,
                  transaccion: c.transaccion ? { ...c.transaccion, confirmacionVendedor: true } : null
              } : c));

              // Emitir evento socket específico
              socketRef.current?.emit('transaction_event', {
                  toUserId: activeChatId,
                  type: 'DELIVERY_CONFIRMED',
                  transactionId
              });

              // Mensaje de sistema
              const sysMsg = JSON.stringify({ type: 'SYSTEM_EVENT', text: '📦 El vendedor marcó el producto como entregado.' });
              socketRef.current?.emit('send_message', { destinatarioId: activeChatId, contenido: sysMsg, tipo: 'sistema' });
          }
      } catch(e) { console.error(e); }
  }

  const handleConfirmReceipt = async (transactionId: number) => {
      if(!token || !activeChatId) return;
      try {
          const res = await fetch(`${URL_BASE}/api/transactions/${transactionId}/confirm-receipt`, {
              method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
          });

          if(res.ok) {
              const activeChat = chats.find(c => c.id === activeChatId);
              
              setChats(prev => prev.map(c => c.id === activeChatId ? {
                  ...c,
                  transaccion: c.transaccion ? { ...c.transaccion, confirmacionComprador: true, estadoId: 2 } : null
              } : c));

              // Socket Update
              socketRef.current?.emit('transaction_event', {
                  toUserId: activeChatId,
                  type: 'RECEIPT_CONFIRMED',
                  transactionId
              });

              // Mensaje de sistema
              const sysMsg = JSON.stringify({ type: 'SYSTEM_EVENT', text: '✅ El comprador confirmó la recepción.' });
              socketRef.current?.emit('send_message', { destinatarioId: activeChatId, contenido: sysMsg, tipo: 'sistema' });

              // Abrir Modal
              if (activeChat) {
                  setPendingRatingData({ 
                      sellerId: activeChat.id, 
                      sellerName: activeChat.nombre,
                      transactionId: transactionId 
                  });
                  setIsRateModalOpen(true);
              }
          }
      } catch(e) { console.error(e); }
  }

  const activeChat = chats.find(c => c.id === activeChatId)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm m-4 md:m-6">
      {/* LISTA LATERAL */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white z-20`}>
         <div className="p-4 border-b">
             <h2 className="font-bold text-lg">Mensajes</h2>
         </div>
         <div className="flex-1 overflow-y-auto">
             {chats.map(chat => (
                 <div key={chat.id} onClick={() => { setActiveChatId(chat.id); setMobileView('chat'); }} className={`p-4 cursor-pointer hover:bg-slate-50 border-b ${activeChatId === chat.id ? 'bg-blue-50' : ''}`}>
                     <div className="flex items-center gap-3">
                        {chat.avatar ? 
                            <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" /> : 
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{chat.nombre[0]}</div>
                        }
                        <div className="flex-1 overflow-hidden">
                            <div className="font-bold truncate">{chat.nombre}</div>
                            <div className="text-sm text-slate-500 truncate">{chat.ultimoMensaje || '...'}</div>
                        </div>
                        {chat.noLeidos ? <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{chat.noLeidos}</div> : null}
                     </div>
                 </div>
             ))}
         </div>
      </div>
      
      {/* AREA DE CHAT */}
      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50/50 relative`}>
        {activeChat ? (
          <>
            {/* HEADER */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                 <button onClick={() => setMobileView('list')} className="md:hidden"><LuX /></button>
                 {activeChat.avatar ? 
                    <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover" /> : 
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{activeChat.nombre[0]}</div>
                 }
                 <div><h3 className="font-bold text-slate-800 text-sm">{activeChat.nombre}</h3></div>
              </div>
              
              {/* Botón manual de Calificar (Solo si ya completó y soy comprador) */}
              {activeChat.transaccion?.estadoId === 2 && activeChat.transaccion.esComprador && (
                  <button 
                      onClick={() => {
                          setPendingRatingData({ 
                              sellerId: activeChat.id, 
                              sellerName: activeChat.nombre,
                              transactionId: activeChat.transaccion!.id
                          });
                          setIsRateModalOpen(true);
                      }} 
                      className="flex items-center gap-2 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                      <LuStar size={16} className="fill-current" /> Calificar
                  </button>
              )}
            </div>
            
            {/* BARRA DE ESTADO DE TRANSACCIÓN */}
            {activeChat.transaccion && activeChat.transaccion.estadoId !== 3 && (
                <TransactionStatusBar 
                    tx={activeChat.transaccion}
                    onConfirmDelivery={() => handleConfirmDelivery(activeChat.transaccion!.id)}
                    onConfirmReceipt={() => handleConfirmReceipt(activeChat.transaccion!.id)}
                />
            )}
            
            {/* MENSAJES */}
            <ChatMessages 
                mensajes={activeChat.mensajes} 
                messagesEndRef={messagesEndRef} 
                currentUserId={user?.id}
            />
            
            {/* INPUT */}
            <ChatInputBox onSend={handleSend} isLoading={isUploading} />
          </>
        ) : (
           <div className="flex-1 flex items-center justify-center text-slate-400">Selecciona un chat</div>
        )}

        {/* MODAL CALIFICACIÓN */}
        {pendingRatingData && (
            <RateUserModal 
                isOpen={isRateModalOpen}
                onClose={() => setIsRateModalOpen(false)}
                sellerId={pendingRatingData.sellerId}
                sellerName={pendingRatingData.sellerName}
                transactionId={pendingRatingData.transactionId}
            />
        )}
      </div>
    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

const TransactionStatusBar = ({ tx, onConfirmDelivery, onConfirmReceipt }: { 
    tx: TransaccionActiva, 
    onConfirmDelivery: () => void, 
    onConfirmReceipt: () => void 
}) => {
    // Pendiente - Nadie confirmó
    if (tx.estadoId === 1 && !tx.confirmacionVendedor) {
        return (
            <div className="bg-blue-50 border-b border-blue-100 p-3 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><LuShoppingBag /></div>
                    <div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Transacción en curso</p>
                        <p className="text-sm text-slate-700">Venta de <b>{tx.producto.nombre}</b>.</p>
                    </div>
                </div>
                {tx.esVendedor && (
                    <button onClick={onConfirmDelivery} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
                        <LuTruck size={16} /> Ya lo entregué
                    </button>
                )}
                {tx.esComprador && <span className="text-xs text-slate-500 italic">Esperando envío...</span>}
            </div>
        )
    }
    // Vendedor confirmó, falta Comprador
    if (tx.estadoId === 1 && tx.confirmacionVendedor && !tx.confirmacionComprador) {
        return (
            <div className="bg-amber-50 border-b border-amber-100 p-3 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><LuTruck /></div>
                    <div>
                        <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">En camino</p>
                        <p className="text-sm text-slate-700">El vendedor marcó como entregado.</p>
                    </div>
                </div>
                {tx.esComprador && (
                    <button onClick={onConfirmReceipt} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2">
                        <LuPackageCheck size={16} /> Confirmar Recibido
                    </button>
                )}
                {tx.esVendedor && <span className="text-xs text-slate-500 italic">Esperando confirmación...</span>}
            </div>
        )
    }
    // Completado
    if (tx.estadoId === 2) {
        return (
            <div className="bg-green-50 border-b border-green-100 p-2 px-6 flex items-center justify-center text-green-700 gap-2 text-sm font-medium">
                <LuCheckCheck size={16} /> Transacción completada exitosamente.
            </div>
        )
    }
    return null;
}

const ChatMessages = ({ mensajes, messagesEndRef, currentUserId }: any) => {
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [mensajes])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#f8f9fc]">
      {mensajes.map((msg: any) => {
        if (msg.tipo === 'sistema') {
            return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-4">
                    <div className="bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-500 flex items-center gap-2">
                        <LuCircleAlert size={12} />
                        {(msg.metadata?.text) || msg.texto}
                    </div>
                </motion.div>
            );
        }
        const esPropio = msg.autor === 'yo'
        return (
          <motion.div key={msg.id} className={`flex w-full ${esPropio ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[75%] md:max-w-[60%] p-3 rounded-2xl text-sm relative shadow-sm ${
                 esPropio ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
             }`}>
                 {msg.tipo === 'imagen' ? (
                     <img src={msg.imagenUrl} alt="adjunto" className="rounded-lg max-w-full h-auto" />
                 ) : msg.texto}
                 <span className={`text-[10px] block text-right mt-1 opacity-70 ${esPropio ? 'text-blue-100' : 'text-slate-400'}`}>
                     {msg.hora}
                     {esPropio && (msg.estado === 'leido' ? <LuCheckCheck className="inline ml-1" size={12}/> : <LuCheck className="inline ml-1" size={12}/>)}
                 </span>
             </div>
          </motion.div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

const ChatInputBox = ({ onSend, isLoading }: any) => {
    const [text, setText] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleKeyDown = (e: any) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }

    const handleSubmit = () => {
        onSend(text, fileInputRef.current?.files?.[0]);
        setText('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    return (
        <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-600 transition-colors">
                    <LuImage size={24} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={() => handleSubmit()} />
                
                <textarea 
                    className="flex-1 bg-slate-100 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[48px]"
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button 
                    disabled={isLoading || (!text.trim() && !fileInputRef.current?.files?.length)}
                    onClick={handleSubmit}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                   {isLoading ? <LuLoader className="animate-spin" size={20}/> : <LuSend size={20} />}
                </button>
            </div>
        </div>
    )
}