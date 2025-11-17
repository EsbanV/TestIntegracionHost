import React, { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { LuMessageCircle, LuX, LuChevronLeft, LuGripHorizontal } from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/app/context/AuthContext";

// --- HOOKS ROBUSTOS ---
import { 
  useChatSocket, 
  useChatList, 
  useChatMessages, 
  useChatTransaction,
  useChatActions 
} from '@/features/DM/chat.hooks';

// --- COMPONENTES UI UNIFICADOS ---
import { 
  ChatListSidebar, // Usaremos este como base pero adaptado visualmente si es necesario, o el mismo componente
  ChatMessagesArea, 
  ChatInputArea, 
  TransactionStatusBar 
} from '@/features/DM/Chat.Components/Chat.Components';

import RateUserModal from "@/features/DM/Chat.Components/RateUserModal";
import type { Chat } from '@/features/DM/chat.types';

export default function FloatingChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{sellerId: number, sellerName: string, transactionId: number} | null>(null);

  // --- 1. DATOS ---
  
  // Lista de Chats (Paginada)
  const { 
      data: chatListData, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage 
  } = useChatList(isOpen); // Solo carga si está abierto

  const chats = chatListData?.allChats || [];
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0);

  // Conversación Activa
  const { data: messagesData } = useChatMessages(activeChatId, isOpen && view === 'chat');
  const messages = messagesData?.allMessages || [];

  const { data: transaction } = useChatTransaction(activeChatId, isOpen && view === 'chat');

  const activeChatInfo = chats.find(c => c.id === activeChatId);
  const displayChatInfo = activeChatInfo || (activeChatId ? { nombre: "Cargando...", id: activeChatId, mensajes: [], noLeidos: 0, avatar: undefined } as unknown as Chat : null);

  // --- 2. SOCKETS & ACCIONES ---
  
  useChatSocket(activeChatId);
  const { sendMessage, markAsRead, confirmTransaction, isSending } = useChatActions();

  // --- HANDLERS ---

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
    setView("chat");
    markAsRead(id);
  };

  const handleSend = async (texto: string, file?: File) => {
      if (!activeChatId) return;
      try {
          await sendMessage({ chatId: activeChatId, text: texto, file });
      } catch (e) {
          console.error(e);
          alert("Error al enviar mensaje");
      }
  };

  const handleConfirmDelivery = async () => {
      if (!transaction) return;
      try { await confirmTransaction({ txId: transaction.id, type: 'delivery' }); } catch (e) {}
  };

  const handleConfirmReceipt = async () => {
      if (!transaction || !displayChatInfo) return;
      try { 
          await confirmTransaction({ txId: transaction.id, type: 'receipt' });
          setPendingRatingData({ 
              sellerId: activeChatId!, 
              sellerName: displayChatInfo.nombre, 
              transactionId: transaction.id 
          }); 
          setIsRateModalOpen(true);
      } catch (e) {}
  };


  return (
    <>
      {/* Ventana Flotante */}
      <AnimatePresence>
        {isOpen && (
          <FloatingWindowWrapper
            view={view} setView={setView} onClose={() => setIsOpen(false)}
            activeChatInfo={displayChatInfo}
          >
            {view === 'list' ? (
               /* Usamos el componente unificado pero le pasamos props de paginación */
               <div className="h-full flex flex-col">
                  {/* Nota: ChatListSidebar ya incluye un buscador y la lista scrollable */}
                  <ChatListSidebar 
                      chats={chats} 
                      activeChatId={activeChatId} 
                      onSelect={handleSelectChat}
                      hasNextPage={hasNextPage}
                      fetchNextPage={fetchNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                  />
               </div>
            ) : (
               <div className="flex flex-col h-full bg-[#F8F9FC]">
                  {transaction && (
                     <TransactionStatusBar 
                        tx={transaction} 
                        onConfirmDelivery={handleConfirmDelivery} 
                        onConfirmReceipt={handleConfirmReceipt} 
                        onRate={() => { 
                            setPendingRatingData({ sellerId: activeChatId!, sellerName: displayChatInfo!.nombre, transactionId: transaction.id }); 
                            setIsRateModalOpen(true); 
                        }} 
                     />
                  )}
                  
                  <ChatMessagesArea 
                      mensajes={messages} 
                      currentUserId={user?.id || 0} 
                  />
                  
                  <ChatInputArea 
                      onSend={handleSend} 
                      isLoading={isSending} 
                  />
               </div>
            )}
          </FloatingWindowWrapper>
        )}
      </AnimatePresence>

      {/* Botón Burbuja */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9990] bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            <LuMessageCircle size={28} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal Calificación */}
      {pendingRatingData && (
        <RateUserModal 
            isOpen={isRateModalOpen} 
            onClose={() => setIsRateModalOpen(false)} 
            sellerId={pendingRatingData.sellerId} 
            sellerName={pendingRatingData.sellerName} 
            transactionId={pendingRatingData.transactionId} 
        />
      )}
    </>
  );
}

// --- WRAPPER VISUAL (Draggable) ---
// Este componente es específico del flotante, por lo que se queda aquí o en un archivo ui/FloatingChat/FloatingWrapper.tsx
const FloatingWindowWrapper = ({ children, view, setView, onClose, activeChatInfo }: any) => {
  const dragControls = useDragControls();
  return (
    <motion.div
      drag dragListener={false} dragControls={dragControls} dragMomentum={false}
      initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed right-6 bottom-24 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9999] overflow-hidden"
    >
      {/* Header Draggable Personalizado */}
      <div onPointerDown={(e) => dragControls.start(e)} className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 cursor-move select-none shrink-0 shadow-sm relative z-20">
         <div className="flex items-center gap-3 overflow-hidden">
            {view === 'chat' && (
                <button onClick={() => setView('list')} className="p-1 hover:bg-slate-100 rounded-full -ml-2 text-slate-500">
                    <LuChevronLeft size={22}/>
                </button>
            )}
            
            {view === 'chat' && activeChatInfo && (
                <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                    <AvatarImage src={activeChatInfo.avatar} />
                    <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">{activeChatInfo.nombre?.charAt(0)}</AvatarFallback>
                </Avatar>
            )}

            <div className="flex flex-col min-w-0">
               <h3 className="font-bold text-slate-800 text-sm truncate max-w-[160px]">
                 {view === 'chat' ? activeChatInfo?.nombre : 'Mensajes'}
               </h3>
               {view === 'chat' && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> En línea</span>}
            </div>
         </div>
         <div className="flex items-center gap-2 text-slate-400">
            <LuGripHorizontal className="cursor-grab hover:text-slate-600" />
            <button onClick={onClose} className="hover:text-red-500 transition-colors"><LuX size={18} /></button>
         </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-white relative flex flex-col">
          {children}
      </div>
    </motion.div>
  );
};