import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

// Icons
import { 
  LuSearch, LuCheck, LuCheckCheck, LuImage, LuSmile, LuLoader, LuSend,
  LuShoppingBag, LuTruck, LuPackageCheck, LuStar, LuCircleAlert, LuMessageCircle,
  LuChevronLeft, LuX, LuGripHorizontal
} from "react-icons/lu";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Types
import type { Chat, Mensaje, TransaccionActiva } from "../chat.types";

// ============================================================================
// 1. WRAPPER DE LA VENTANA (DISEÑO LIMPIO)
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
      className="fixed right-6 bottom-24 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9999] overflow-hidden font-sans"
    >
      {/* HEADER MINIMALISTA */}
      <div 
        onPointerDown={(e) => dragControls.start(e)} 
        className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 cursor-move select-none shrink-0 relative z-20"
      >
         <div className="flex items-center gap-3 overflow-hidden">
            {view === 'chat' && (
                /* BOTÓN VOLVER: Solo icono, sin fondo */
                <button 
                    onClick={() => setView('list')} 
                    className="text-slate-400 hover:text-slate-800 transition-colors -ml-1"
                >
                    <LuChevronLeft size={26}/>
                </button>
            )}
            
            {view === 'chat' && activeChatInfo ? (
                <>
                  <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                      <AvatarImage src={activeChatInfo.avatar} />
                      <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">
                          {activeChatInfo.nombre?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate max-w-[140px]">
                      {activeChatInfo.nombre}
                    </h3>
                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> En línea
                    </span>
                  </div>
                </>
            ) : (
               <h3 className="font-bold text-slate-800 text-lg ml-1">Mensajes</h3>
            )}
         </div>
         
         <div className="flex items-center gap-3 text-slate-300">
            <LuGripHorizontal className="cursor-grab hover:text-slate-400" size={18} />
            {/* BOTÓN CERRAR: Solo icono, sin fondo */}
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                <LuX size={22} />
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
// 2. INPUT AREA (DISEÑO TIPO CHAT MODERNO)
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
        e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
    };

    return (
        <div className="p-3 bg-white border-t border-slate-100 relative shrink-0">
            {showEmoji && (
                <div className="absolute bottom-16 left-2 z-50 shadow-xl rounded-xl border border-slate-200 overflow-hidden">
                    <EmojiPicker onEmojiClick={(e) => setText(prev => prev + e.emoji)} width={300} height={300} theme={Theme.LIGHT} searchDisabled previewConfig={{showPreview: false}} />
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                {/* Botones Adjuntar (Simples y limpios) */}
                <div className="flex gap-1 items-center pb-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-slate-400 hover:text-blue-600 transition-colors p-1.5">
                        <LuImage size={22} />
                    </button>
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`text-slate-400 hover:text-yellow-500 transition-colors p-1.5`}>
                        <LuSmile size={22} />
                    </button>
                </div>
                
                <input type="file" hidden ref={fileRef} accept="image/*" onChange={handleFile} />
                
                {/* INPUT TEXTO: Borde integrado, sin outline azul por defecto */}
                <div className="flex-1 bg-slate-100 rounded-[20px] border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all flex items-center min-h-[40px] px-3 py-1.5 mb-1">
                    <textarea 
                        ref={textareaRef}
                        value={text} 
                        onChange={handleInput}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                        placeholder="Escribe un mensaje..." 
                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 resize-none max-h-[100px] placeholder:text-slate-400 leading-relaxed custom-scrollbar"
                        rows={1}
                        style={{ overflowY: text.length > 40 ? 'auto' : 'hidden' }}
                    />
                </div>
                
                {/* BOTÓN ENVIAR: Azul sólido */}
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={(!text.trim() && !fileRef.current?.files?.length) || isLoading} 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 shrink-0 shadow-md shadow-blue-200 mb-1 transition-all active:scale-95"
                >
                    {isLoading ? <LuLoader className="animate-spin" size={18}/> : <LuSend size={18} className="ml-0.5" />}
                </Button>
            </form>
        </div>
    );
};

// ============================================================================
// 3. LISTA Y MENSAJES (Reutilizamos o adaptamos ligeramente)
// ============================================================================

// La lista puede ser igual, quizás con menos padding
export const FloatingChatList = ({ chats, onSelect, hasNextPage, fetchNextPage, isFetchingNextPage }: any) => (
  <div className="flex flex-col h-full">
    <div className="px-3 py-2 bg-white sticky top-0 z-10">
       <div className="relative bg-slate-100 rounded-xl flex items-center px-3 h-9">
         <LuSearch className="text-slate-400 w-4 h-4 mr-2" />
         <input placeholder="Buscar..." className="bg-transparent text-sm w-full focus:outline-none placeholder:text-slate-400 text-slate-700" />
       </div>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs">
           <LuMessageCircle size={28} className="mb-2 opacity-30" /> No hay chats
        </div>
      ) : (
         chats.map((chat: Chat) => (
            <div key={chat.id} onClick={() => onSelect(chat.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors">
               <Avatar className="h-10 w-10"><AvatarImage src={chat.avatar}/><AvatarFallback>{chat.nombre[0]}</AvatarFallback></Avatar>
               <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-center">
                     <span className="font-bold text-sm text-slate-800 truncate">{chat.nombre}</span>
                     {chat.noLeidos! > 0 && <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{chat.noLeidos}</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{chat.ultimoMensaje}</p>
               </div>
            </div>
         ))
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="w-full py-2 text-xs text-blue-500 hover:bg-blue-50">
            {isFetchingNextPage ? 'Cargando...' : 'Ver más antiguos'}
        </button>
      )}
    </div>
  </div>
);

export const FloatingMessagesArea = ({ mensajes, currentUserId }: { mensajes: Mensaje[], currentUserId: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8F9FC]">
      {mensajes.map((msg) => {
        if (msg.tipo === 'sistema') return <div key={msg.id} className="text-center my-3"><span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">{msg.texto}</span></div>;
        
        const isMe = msg.autor === 'yo';
        return (
          <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm break-words ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}>
                 {msg.imagenUrl && <img src={msg.imagenUrl} className="rounded-lg mb-1 max-h-40 object-cover cursor-pointer" onClick={() => window.open(msg.imagenUrl, '_blank')} />}
                 <p className="leading-snug">{msg.texto}</p>
                 <div className={`text-[9px] text-right mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'} flex justify-end gap-1`}>
                    {msg.hora} {isMe && (msg.estado === 'leido' ? <LuCheckCheck size={12}/> : <LuCheck size={12}/>)}
                 </div>
             </div>
          </div>
        )
      })}
      <div ref={scrollRef} />
    </div>
  );
};

// Reexportamos la barra de transacción compartida porque esa sí sirve igual
export { TransactionStatusBar } from "../Chat.Components/Chat.Components";