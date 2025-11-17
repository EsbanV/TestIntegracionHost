import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuMessageCircle, LuClock } from "react-icons/lu";
import { useAuth } from "@/app/context/AuthContext";

// Hooks
import { 
  useChatSocket, useChatList, useChatMessages, 
  useChatTransaction, useChatActions 
} from '@/features/DM/chat.hooks';
import { useRateLimiter } from '@/features/DM/chat.hooks';

// ✅ IMPORTAR COMPONENTES ESPECÍFICOS DEL FLOTANTE
import { 
  FloatingWindowWrapper, 
  FloatingChatInput, 
  FloatingChatList, 
  FloatingMessagesArea,
  TransactionStatusBar // Este es compartido
} from './FloatingChat.Components/FloatingChat.Components'; // Ajusta la ruta

import RateUserModal from "@/features/DM/Chat.Components/RateUserModal";
import type { Chat } from '@/features/DM/chat.types';

export default function FloatingChat() {
  // ... (Toda la lógica de hooks se mantiene IGUAL, no la cambies) ...
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<any>(null);

  const { isLimited, timeLeft, checkRateLimit } = useRateLimiter({ maxRequests: 5, windowMs: 5000, cooldownMs: 10000 });
  const { data: chatListData, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatList(isOpen);
  const chats = chatListData?.allChats || [];
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0);

  const { data: messagesData } = useChatMessages(activeChatId, isOpen && view === 'chat');
  const messages = messagesData?.allMessages || [];
  const { data: transaction } = useChatTransaction(activeChatId, isOpen && view === 'chat');
  
  const activeChatInfo = chats.find(c => c.id === activeChatId);
  const displayChatInfo = activeChatInfo || (activeChatId ? { nombre: "...", id: activeChatId } as any : null);

  useChatSocket(activeChatId);
  const { sendMessage, markAsRead, confirmTransaction, isSending } = useChatActions();

  const handleSelectChat = (id: number) => { setActiveChatId(id); setView("chat"); markAsRead(id); };
  const handleSend = async (texto: string, file?: File) => {
      if (!checkRateLimit()) return;
      if (!activeChatId) return;
      try { await sendMessage({ chatId: activeChatId, text: texto, file }); } catch (e) {}
  };
  
  // ... (Funciones de transacción iguales) ...
  const handleConfirmDelivery = async () => { if(transaction) confirmTransaction({ txId: transaction.id, type: 'delivery' }); };
  const handleConfirmReceipt = async () => { 
      if(transaction) { 
          await confirmTransaction({ txId: transaction.id, type: 'receipt' }); 
          setPendingRatingData({ sellerId: activeChatId, sellerName: displayChatInfo.nombre, transactionId: transaction.id });
          setIsRateModalOpen(true);
      } 
  };


  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <FloatingWindowWrapper
            view={view} setView={setView} onClose={() => setIsOpen(false)}
            activeChatInfo={displayChatInfo}
          >
            {view === 'list' ? (
               <FloatingChatList 
                   chats={chats} 
                   onSelect={handleSelectChat} 
                   hasNextPage={hasNextPage} 
                   fetchNextPage={fetchNextPage} 
                   isFetchingNextPage={isFetchingNextPage} 
               />
            ) : (
               <div className="flex flex-col h-full bg-[#F8F9FC] relative">
                  {transaction && (
                     <TransactionStatusBar 
                        tx={transaction} 
                        onConfirmDelivery={handleConfirmDelivery} 
                        onConfirmReceipt={handleConfirmReceipt} 
                        onRate={() => setIsRateModalOpen(true)} 
                     />
                  )}
                  
                  <FloatingMessagesArea 
                      mensajes={messages} 
                      currentUserId={user?.id || 0} 
                  />

                  <AnimatePresence>
                    {isLimited && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-[70px] left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-xs flex gap-2 items-center z-20 shadow-lg backdrop-blur">
                            <LuClock /> <span>Espera <b>{timeLeft}s</b> para enviar más.</span>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Usamos el nuevo Input */}
                  <FloatingChatInput 
                      onSend={handleSend} 
                      isLoading={isSending || isLimited} 
                  />
               </div>
            )}
          </FloatingWindowWrapper>
        )}
      </AnimatePresence>

      {/* Botón Launcher */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9990] bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            <LuMessageCircle size={28} />
            {totalUnread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{totalUnread}</span>}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal */}
      {pendingRatingData && <RateUserModal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} {...pendingRatingData} />}
    </>
  );
}