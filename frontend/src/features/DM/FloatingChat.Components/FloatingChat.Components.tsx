import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

// Icons
import { 
  LuSearch, LuCheck, LuCheckCheck, LuImage, LuSmile, LuLoader, LuSend,
  LuShoppingBag, LuTruck, LuPackageCheck, LuStar, LuCircleAlert, LuChevronLeft, LuX, LuGripHorizontal,
  LuMessageCircle
} from "react-icons/lu";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Types
import type { Chat, Mensaje, TransaccionActiva } from "../chat.types";

// ============================================================================
// 1. BARRA DE TRANSACCIÓN (COMPARTIDA)
// ============================================================================
interface TransactionBarProps {
  tx: TransaccionActiva;
  onConfirmDelivery: () => void;
  onConfirmReceipt: () => void;
  onRate: () => void;
}

export const TransactionStatusBar = ({ tx, onConfirmDelivery, onConfirmReceipt, onRate }: TransactionBarProps) => {
  // Pendiente
  if (tx.estadoId === 1 && !tx.confirmacionVendedor) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-blue-100 p-1.5 rounded text-blue-600"><LuShoppingBag size={16} /></div>
          <div>
             <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Venta en curso</p>
             <p className="text-xs text-slate-700 truncate font-medium">{tx.producto.nombre}</p>
          </div>
        </div>
        {tx.esVendedor ? (
          <Button size="sm" onClick={onConfirmDelivery} className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs font-bold">Entregar</Button>
        ) : (
          <span className="text-xs text-slate-400 italic">Esperando envío...</span>
        )}
      </div>
    );
  }
  // En Camino
  if (tx.estadoId === 1 && tx.confirmacionVendedor && !tx.confirmacionComprador) {
    return (
      <div className="bg-amber-50 border-b border-amber-100 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-1.5 rounded text-amber-600"><LuTruck size={16} /></div>
          <div>
             <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">En camino</p>
             <p className="text-xs text-slate-700">Producto enviado</p>
          </div>
        </div>
        {tx.esComprador ? (
          <Button size="sm" onClick={onConfirmReceipt} className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs font-bold">Confirmar</Button>
        ) : (
          <span className="text-xs text-slate-400 italic">Esperando confirmación...</span>
        )}
      </div>
    );
  }
  // Completado
  if (tx.estadoId === 2) {
    return (
      <div className="bg-green-50 border-b border-green-100 p-2 flex items-center justify-center gap-2 text-green-700 text-xs font-medium">
        <LuCheckCheck size={14} /> Transacción finalizada
        {tx.esComprador && (
            <button onClick={onRate} className="ml-2 underline hover:text-green-800 flex items-center gap-1"><LuStar size={10}/> Calificar</button>
        )}
      </div>
    );
  }
  return null;
};

// ============================================================================
// 2. LISTA DE CHATS (SIDEBAR)
// ============================================================================
interface ChatListProps {
  chats: Chat[];
  activeChatId: number | null;
  onSelect: (id: number) => void;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

export const ChatListSidebar = ({ 
    chats, activeChatId, onSelect, hasNextPage, fetchNextPage, isFetchingNextPage 
}: ChatListProps) => (
  <div className="flex flex-col h-full bg-white">
    <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          placeholder="Buscar conversación..." 
          className="w-full bg-slate-50 text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400" 
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs">
              <LuMessageCircle size={32} className="mb-2 opacity-20" />
              No tienes conversaciones activas
          </div>
      ) : (
          chats.map((chat) => (
            <div 
            key={chat.id} 
            onClick={() => onSelect(chat.id)} 
            className={`flex items-center gap-3 p-4 cursor-pointer border-b border-slate-50 transition-all duration-200 hover:bg-slate-50 ${activeChatId === chat.id ? 'bg-blue-50/60 border-l-4 border-l-blue-500 pl-3' : 'border-l-4 border-l-transparent'}`}
            >
            <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-slate-100 bg-white">
                <AvatarImage src={chat.avatar} className="object-cover" />
                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">{chat.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {chat.noLeidos! > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                <h4 className={`text-sm truncate ${chat.noLeidos! > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{chat.nombre}</h4>
                {chat.noLeidos! > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">{chat.noLeidos}</span>}
                </div>
                <p className={`text-xs truncate ${chat.noLeidos ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{chat.ultimoMensaje || 'Imagen enviada'}</p>
            </div>
            </div>
        ))
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="p-3 text-center border-t border-slate-50">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchNextPage && fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="text-xs text-blue-600 w-full hover:bg-blue-50"
            >
                {isFetchingNextPage ? <LuLoader className="animate-spin w-4 h-4"/> : "Cargar anteriores..."}
            </Button>
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// 3. MENSAJES (BURBUJAS)
// ============================================================================
export const ChatMessagesArea = ({ mensajes, currentUserId }: { mensajes: Mensaje[], currentUserId: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Scroll al fondo solo si estamos cerca del final o es carga inicial
  useEffect(() => { 
      if(scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: "smooth" }); 
      }
  }, [mensajes.length]); // Solo scrollear si llegan mensajes nuevos, no al editar/leer

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FC]">
      {mensajes.map((msg) => {
        const isSystem = msg.tipo === 'sistema';
        if (isSystem) return (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={msg.id} className="flex justify-center my-4">
                <div className="bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                    <LuCircleAlert size={12} className="text-slate-400" /> {msg.texto}
                </div>
            </motion.div>
        );

        const isMe = msg.autor === 'yo';
        return (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
             {!isMe && (
                <Avatar className="h-6 w-6 mt-auto mb-1 shadow-sm border border-slate-200 shrink-0 mr-2 bg-white">
                    {/* Aquí podrías pasar el avatar del chat si lo tuvieras en las props */}
                    <AvatarFallback className="text-[9px] bg-white text-slate-500 font-bold">?</AvatarFallback> 
                </Avatar>
             )}
             <div className={`max-w-[80%] md:max-w-[70%] p-3 rounded-2xl text-sm shadow-sm relative group ${
                 isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
             }`}>
                 {msg.imagenUrl && (
                     <img src={msg.imagenUrl} alt="adjunto" className="rounded-lg mb-2 max-h-60 w-full object-cover cursor-pointer bg-black/5 hover:opacity-95 transition-opacity" onClick={() => window.open(msg.imagenUrl, '_blank')}/>
                 )}
                 {msg.texto && <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.texto}</p>}
                 <span className={`text-[10px] block text-right mt-1.5 opacity-70 ${isMe ? 'text-blue-100' : 'text-slate-400'} flex justify-end items-center gap-1`}>
                     {msg.hora}
                     {isMe && (msg.estado === 'leido' ? <LuCheckCheck className="inline" size={12}/> : <LuCheck className="inline" size={12}/>)}
                 </span>
             </div>
          </motion.div>
        )
      })}
      <div ref={scrollRef} />
    </div>
  );
};

// ============================================================================
// 4. INPUT AREA
// ============================================================================
interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
}

export const ChatInputArea = ({ onSend, isLoading }: ChatInputProps) => {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText('');
        setShowEmoji(false);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) onSend('', e.target.files[0]);
        e.target.value = '';
    };

    return (
        <div className="p-3 bg-white border-t border-slate-200 relative">
            {showEmoji && (
                <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-xl border border-slate-200 overflow-hidden">
                    <EmojiPicker onEmojiClick={(e) => setText(prev => prev + e.emoji)} width={300} height={350} theme={Theme.LIGHT} searchDisabled previewConfig={{showPreview: false}} />
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button type="button" onClick={() => fileRef.current?.click()} className="p-2 text-slate-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all shadow-sm hover:shadow">
                        <LuImage size={20} />
                    </button>
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-lg transition-all shadow-sm hover:shadow ${showEmoji ? 'bg-yellow-50 text-yellow-500' : 'text-slate-400 hover:bg-white'}`}>
                        <LuSmile size={20} />
                    </button>
                </div>
                
                <input type="file" hidden ref={fileRef} accept="image/*" onChange={handleFile} />
                
                <div className="flex-1 relative">
                    <textarea 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                        placeholder="Escribe un mensaje..." 
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none max-h-32 min-h-[46px] shadow-inner"
                        rows={1}
                    />
                </div>
                
                <Button type="submit" size="icon" disabled={isLoading || !text.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-[46px] w-[46px] shrink-0 shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                    {isLoading ? <LuLoader className="animate-spin" size={20}/> : <LuSend size={20} className="ml-0.5" />}
                </Button>
            </form>
        </div>
    );
};

// ============================================================================
// 5. VENTANA FLOTANTE (Wrapper Draggable)
// ============================================================================
interface FloatingWindowProps {
  children: React.ReactNode;
  view: "list" | "chat";
  setView: (v: "list" | "chat") => void;
  onClose: () => void;
  activeChatInfo?: Chat;
}

export const FloatingWindowWrapper = ({ children, view, setView, onClose, activeChatInfo }: FloatingWindowProps) => {
  const dragControls = useDragControls();
  
  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragConstraints={{ left: -window.innerWidth + 400, right: 20, top: -window.innerHeight + 500, bottom: 20 }}
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed right-6 bottom-24 w-[360px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[9999]"
    >
      {/* Header Draggable */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 cursor-move touch-none select-none shrink-0 shadow-sm relative z-20"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {view === "chat" && (
            <button 
                onClick={() => setView("list")} 
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0 -ml-2"
            >
              <LuChevronLeft size={22} />
            </button>
          )}
          
          {view === "chat" && activeChatInfo && (
             <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
               <AvatarImage src={activeChatInfo.avatar} />
               <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">{activeChatInfo.nombre.charAt(0)}</AvatarFallback>
             </Avatar>
          )}

          <div className="flex flex-col min-w-0">
             <h3 className="font-bold text-slate-800 text-sm truncate">
               {view === "chat" ? activeChatInfo?.nombre : "Mensajes"}
             </h3>
             {view === "chat" && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> En línea</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors">
             <LuGripHorizontal size={18} />
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <LuX size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white relative flex flex-col">
          {children}
      </div>
    </motion.div>
  );
};