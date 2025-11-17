import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { LuMessageCircle, LuX, LuChevronLeft, LuGripHorizontal, LuClock } from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/app/context/AuthContext";

// --- 1. HOOKS ROBUSTOS ---
import { 
  useChatSocket, 
  useChatList, 
  useChatMessages, 
  useChatTransaction,
  useChatActions 
} from '@/features/DM/chat.hooks';

// Importamos el limitador (Asegúrate de que la ruta sea correcta)
import { useRateLimiter } from '@/features/DM/chat.hooks'; 

// --- 2. COMPONENTES UI UNIFICADOS ---
import { 
  ChatListSidebar, 
  ChatMessagesArea, 
  ChatInputArea, 
  TransactionStatusBar 
} from '@/features/DM/Chat.Components/Chat.Components';

import RateUserModal from "@/features/DM/Chat.Components/RateUserModal";
import type { Chat } from '@/features/DM/chat.types';

export default function FloatingChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // --- ESTADOS LOCALES ---
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{sellerId: number, sellerName: string, transactionId: number} | null>(null);

  // --- RATE LIMITER (ANTI-SPAM) ---
  const { isLimited, timeLeft, checkRateLimit } = useRateLimiter({
    maxRequests: 5,      // 5 mensajes...
    windowMs: 5000,      // ...en 5 segundos
    cooldownMs: 10000    // Bloqueo de 10s
  });

  // --- 3. DATOS (Hooks) ---
  const { 
      data: chatListData, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage 
  } = useChatList(isOpen); 

  const chats = chatListData?.allChats || [];
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0);

  const { data: messagesData } = useChatMessages(activeChatId, isOpen && view === 'chat');
  const messages = messagesData?.allMessages || [];

  const { data: transaction } = useChatTransaction(activeChatId, isOpen && view === 'chat');

  const activeChatInfo = chats.find(c => c.id === activeChatId);
  const displayChatInfo = activeChatInfo || (activeChatId ? { 
      nombre: "Cargando...", 
      id: activeChatId, 
      mensajes: [], 
      noLeidos: 0, 
      avatar: undefined 
  } as unknown as Chat : null);

  // --- 4. SOCKETS & ACCIONES ---
  useChatSocket(activeChatId);
  const { sendMessage, markAsRead, confirmTransaction, isSending } = useChatActions();

  // --- HANDLERS ---

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
    setView("chat");
    markAsRead(id);
  };

  const handleSend = async (texto: string, file?: File) => {
      // 🚫 1. Verificar Spam
      if (!checkRateLimit()) return; 

      if (!activeChatId) return;
      try {
          await sendMessage({ chatId: activeChatId, text: texto, file });
      } catch (e) {
          console.error(e);
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
            view={view} 
            setView={setView} 
            onClose={() => setIsOpen(false)}
            activeChatInfo={displayChatInfo}
          >
            {view === 'list' ? (
               <div className="h-full flex flex-col">
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
               <div className="flex flex-col h-full bg-[#F8F9FC] relative">
                  {transaction && (
                     <TransactionStatusBar 
                        tx={transaction} 
                        onConfirmDelivery={handleConfirmDelivery} 
                        onConfirmReceipt={handleConfirmReceipt} 
                        onRate={() => { 
                            setPendingRatingData({ 
                                sellerId: activeChatId!, 
                                sellerName: displayChatInfo!.nombre, 
                                transactionId: transaction.id 
                            }); 
                            setIsRateModalOpen(true); 
                        }} 
                     />
                  )}
                  
                  <ChatMessagesArea 
                      mensajes={messages} 
                      currentUserId={user?.id || 0} 
                  />
                  
                  {/* ALERTA DE SPAM (Overlay) */}
                  <AnimatePresence>
                    {isLimited && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-[70px] left-4 right-4 bg-red-500/90 backdrop-blur text-white p-3 rounded-xl shadow-lg z-20 flex items-center gap-3 border border-red-400"
                        >
                            <div className="bg-white/20 p-1.5 rounded-full"><LuClock size={16} className="animate-pulse" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs uppercase tracking-wide">Chat en enfriamiento</p>
                                <p className="text-xs opacity-90 truncate">Espera <b>{timeLeft}s</b> para enviar más.</p>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  <ChatInputArea 
                      onSend={handleSend} 
                      // Bloqueamos visualmente el input si hay spam
                      isLoading={isSending || isLimited} 
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

// --- WRAPPER VISUAL ---
const FloatingWindowWrapper = ({ children, view, setView, onClose, activeChatInfo }: any) => {
  const dragControls = useDragControls();
  return (
    <motion.div
      drag dragListener={false} dragControls={dragControls} dragMomentum={false}
      dragConstraints={{ left: -window.innerWidth + 400, right: 20, top: -window.innerHeight + 500, bottom: 20 }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed right-6 bottom-24 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[9999] overflow-hidden"
    >
      <div onPointerDown={(e) => dragControls.start(e)} className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 cursor-move select-none shrink-0 shadow-sm relative z-20">
         <div className="flex items-center gap-3 overflow-hidden">
            {view === 'chat' && (
                <button onClick={() => setView('list')} className="p-1 hover:bg-slate-100 rounded-full -ml-2 text-slate-500 transition-colors">
                    <LuChevronLeft size={22}/>
                </button>
            )}
            {view === 'chat' && activeChatInfo && (
                <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                    <AvatarImage src={activeChatInfo.avatar} />
                    <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-bold">{activeChatInfo.nombre?.charAt(0).toUpperCase()}</AvatarFallback>
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
            <div className="cursor-grab hover:text-slate-600 p-1"><LuGripHorizontal /></div>
            <button onClick={onClose} className="hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"><LuX size={18} /></button>
         </div>
      </div>
      <div className="flex-1 overflow-hidden bg-white relative flex flex-col">
          {children}
      </div>
    </motion.div>
  );
};