import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

// Icons
import { 
  LuSearch, LuCheck, LuCheckCheck, LuImage, LuSmile, LuLoader, LuSend,
  LuShoppingBag, LuTruck, LuCheckCheck as LuCheckCircle, LuStar, LuCircleAlert, LuMessageCircle,
  LuChevronLeft, LuX, LuGripHorizontal
} from "react-icons/lu";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Types
import type { Chat, Mensaje, TransaccionActiva } from "../chat.types";

// ============================================================================
// 1. WRAPPER DE LA VENTANA (Ajustes visuales Header)
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
      dragConstraints={{ left: -window.innerWidth + 380, right: 20, top: -window.innerHeight + 600, bottom: 20 }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed right-6 bottom-24 w-[340px] h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9999] overflow-hidden font-sans"
    >
      {/* HEADER COMPACTO */}
      <div 
        onPointerDown={(e) => dragControls.start(e)} 
        className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-3 cursor-move select-none shrink-0 relative z-20"
      >
         <div className="flex items-center gap-2 overflow-hidden">
            {view === 'chat' && (
                /* BOTÓN VOLVER: Icono negro, pequeño, transparente */
                <button 
                    onClick={() => setView('list')} 
                    className="text-slate-700 hover:bg-slate-100 p-1 rounded-full transition-colors"
                >
                    <LuChevronLeft size={20}/>
                </button>
            )}
            
            {view === 'chat' && activeChatInfo ? (
                <>
                  <Avatar className="h-7 w-7 border border-slate-100 shrink-0">
                      <AvatarImage src={activeChatInfo.avatar} />
                      <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-bold">
                          {activeChatInfo.nombre?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-slate-800 text-xs truncate max-w-[120px]">
                      {activeChatInfo.nombre}
                    </h3>
                    <span className="text-[9px] text-green-600 font-medium flex items-center gap-1">
                       <span className="w-1 h-1 rounded-full bg-green-500"></span> En línea
                    </span>
                  </div>
                </>
            ) : (
               <h3 className="font-bold text-slate-800 text-sm ml-1">Mensajes</h3>
            )}
         </div>
         
         <div className="flex items-center gap-1 text-slate-400">
            <LuGripHorizontal className="cursor-grab hover:text-slate-600" size={16} />
            {/* BOTÓN CERRAR: Icono negro, pequeño, transparente */}
            <button onClick={onClose} className="text-slate-700 hover:bg-slate-100 p-1 rounded-full transition-colors">
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

// ============================================================================
// 2. INPUT AREA (Ajustes: Botones pequeños y transparentes + Enviar Azul)
// ============================================================================
interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
}

export const FloatingChatInput = ({ onSend, isLoading }: ChatInputProps) => {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText('');
        setShowEmoji(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) onSend('', e.target.files[0]);
        e.target.value = '';
    };
    
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
    };

    return (
        <div className="px-2 py-2 bg-white border-t border-slate-100 relative shrink-0">
            {showEmoji && (
                <div className="absolute bottom-14 left-2 z-50 shadow-xl rounded-xl border border-slate-200 overflow-hidden">
                    <EmojiPicker onEmojiClick={(e) => setText(prev => prev + e.emoji)} width={280} height={280} theme={Theme.LIGHT} searchDisabled previewConfig={{showPreview: false}} />
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex items-end gap-1.5 bg-slate-50 p-1.5 rounded-[20px] border border-slate-100 focus-within:border-blue-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100/50 transition-all">
                
                {/* Botones Adjuntar: Pequeños y transparentes */}
                <div className="flex gap-0.5 items-center">
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                        <LuImage size={18} />
                    </button>
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-full transition-colors ${showEmoji ? 'text-yellow-500' : ''}`}>
                        <LuSmile size={18} />
                    </button>
                </div>
                
                <input type="file" hidden ref={fileRef} accept="image/*" onChange={handleFile} />
                
                {/* INPUT TEXTO */}
                <div className="flex-1 min-w-0 py-1">
                    <textarea 
                        ref={textareaRef}
                        value={text} 
                        onChange={handleInput}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                        placeholder="Escribe..." 
                        className="w-full bg-transparent border-none p-0 text-xs sm:text-sm focus:ring-0 resize-none max-h-[80px] placeholder:text-slate-400 leading-relaxed custom-scrollbar"
                        rows={1}
                        style={{ overflowY: text.length > 30 ? 'auto' : 'hidden' }}
                    />
                </div>
                
                {/* BOTÓN ENVIAR: Azul sólido y pequeño */}
                <button 
                    type="submit" 
                    disabled={(!text.trim() && !fileRef.current?.files?.length) || isLoading} 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LuLoader className="animate-spin" size={14}/> : <LuSend size={14} className="ml-0.5" />}
                </button>
            </form>
        </div>
    );
};

// ============================================================================
// 3. LISTA Y MENSAJES (Reutilizamos lógica visual del chat grande)
// ============================================================================

// Reexportamos TransactionStatusBar porque es idéntico
export { TransactionStatusBar } from "../Chat.Components/Chat.Components";

// Adaptamos la lista para el flotante (más compacta)
export const FloatingChatList = ({ chats, onSelect, hasNextPage, fetchNextPage, isFetchingNextPage }: any) => (
  <div className="flex flex-col h-full">
    <div className="px-3 py-2 bg-white sticky top-0 z-10 border-b border-slate-50">
       <div className="relative bg-slate-50 rounded-lg flex items-center px-2 h-8">
         <LuSearch className="text-slate-400 w-3.5 h-3.5 mr-2" />
         <input placeholder="Buscar..." className="bg-transparent text-xs w-full focus:outline-none placeholder:text-slate-400 text-slate-700" />
       </div>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs">
           <LuMessageCircle size={24} className="mb-2 opacity-20" /> No hay chats
        </div>
      ) : (
         chats.map((chat: Chat) => (
            <div key={chat.id} onClick={() => onSelect(chat.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50/50 last:border-0">
               <Avatar className="h-9 w-9 border border-slate-100"><AvatarImage src={chat.avatar}/><AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600">{chat.nombre[0]}</AvatarFallback></Avatar>
               <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                     <span className="font-semibold text-xs text-slate-800 truncate">{chat.nombre}</span>
                     {chat.noLeidos! > 0 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">{chat.noLeidos}</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{chat.ultimoMensaje}</p>
               </div>
            </div>
         ))
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="w-full py-2 text-[10px] text-blue-500 hover:bg-blue-50 font-medium">
            {isFetchingNextPage ? 'Cargando...' : 'Ver anteriores'}
        </button>
      )}
    </div>
  </div>
);

// Adaptamos los mensajes para el flotante (más compactos)
export const FloatingMessagesArea = ({ mensajes, currentUserId }: { mensajes: Mensaje[], currentUserId: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8F9FC]">
      {mensajes.map((msg) => {
        if (msg.tipo === 'sistema') return <div key={msg.id} className="text-center my-2"><span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full border border-slate-200">{msg.texto}</span></div>;
        
        const isMe = msg.autor === 'yo';
        return (
          <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs shadow-sm break-words ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}>
                 {msg.imagenUrl && <img src={msg.imagenUrl} className="rounded-lg mb-1 max-h-32 object-cover cursor-pointer border border-white/10" onClick={() => window.open(msg.imagenUrl, '_blank')} />}
                 <p className="leading-snug">{msg.texto}</p>
                 <div className={`text-[8px] text-right mt-0.5 ${isMe ? 'text-blue-100/80' : 'text-slate-300'} flex justify-end gap-0.5 items-center`}>
                    {msg.hora} {isMe && (msg.estado === 'leido' ? <LuCheckCheck size={10}/> : <LuCheck size={10}/>)}
                 </div>
             </div>
          </div>
        )
      })}
      <div ref={scrollRef} />
    </div>
  );
};