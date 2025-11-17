import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuStar, LuMessageCircle, LuClock, LuCircleAlert } from 'react-icons/lu';

import { useAuth } from '@/app/context/AuthContext';
import RateUserModal from '@/features/DM/Chat.Components/RateUserModal';

// --- HOOKS ---
import { 
  useChatSocket, 
  useChatList, 
  useChatMessages, 
  useChatTransaction, 
  useChatActions 
} from '@/features/DM/chat.hooks';

import { useRateLimiter } from '@/features/DM/chat.hooks'; // Asegúrate de tener este archivo creado

// --- COMPONENTES UI ---
import { 
  ChatListSidebar, 
  ChatMessagesArea, 
  ChatInputArea, 
  TransactionStatusBar 
} from '@/features/DM/Chat.Components/Chat.Components';

import type { Chat } from '@/features/DM/chat.types';

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  
  // --- ESTADOS ---
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{sellerId: number, sellerName: string, transactionId: number} | null>(null);

  // --- 1. LIMITADOR DE VELOCIDAD (Anti-Spam) ---
  const { isLimited, timeLeft, checkRateLimit } = useRateLimiter({
    maxRequests: 5,      // Máximo 5 mensajes...
    windowMs: 5000,      // ...en 5 segundos
    cooldownMs: 10000    // Castigo: 10 segundos de espera
  });

  // --- 2. DATOS ---
  const { 
      data: chatListData, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage 
  } = useChatList(true);

  const chats = chatListData?.allChats || [];

  const { data: messagesData } = useChatMessages(activeChatId, true);
  const messages = messagesData?.allMessages || [];

  const { data: transaction } = useChatTransaction(activeChatId, true);

  const activeChatInfo = chats.find(c => c.id === activeChatId);
  const displayChatInfo = activeChatInfo || (activeChatId ? { 
      nombre: "Cargando usuario...", 
      id: activeChatId, 
      mensajes: [], 
      noLeidos: 0, 
      avatar: undefined 
  } as unknown as Chat : null);

  // --- 3. SOCKETS & ACCIONES ---
  useChatSocket(activeChatId);
  const { sendMessage, markAsRead, confirmTransaction, isSending } = useChatActions();

  // --- HANDLERS ---

  const handleSend = async (texto: string, file?: File) => {
      // 1. Verificar Spam antes de intentar enviar
      if (!checkRateLimit()) return; 

      if (!activeChatId) return;
      
      try {
          await sendMessage({ chatId: activeChatId, text: texto, file });
      } catch (e) {
          console.error(e);
          // Si el error viene del backend (filtro de groserías), ya lanzará la alerta.
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

  // Efectos de navegación y lectura
  useEffect(() => {
      const state = location.state as { toUser?: any };
      if (state?.toUser) { setActiveChatId(state.toUser.id); setMobileView('chat'); }
  }, [location]);

  useEffect(() => {
      if (activeChatId) markAsRead(activeChatId);
  }, [activeChatId, messages.length]);


  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm m-4 md:m-6">
      
      {/* SIDEBAR */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white z-20`}>
         <div className="p-4 border-b border-slate-100 font-bold text-lg text-slate-800 sticky top-0 bg-white z-10">
             Mensajes
         </div>
         <div className="flex-1 overflow-hidden">
             <ChatListSidebar 
                chats={chats} 
                activeChatId={activeChatId} 
                onSelect={(id) => { setActiveChatId(id); setMobileView('chat'); }} 
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
             />
         </div>
      </div>
      
      {/* AREA DE CHAT */}
      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50/50 relative`}>
        {activeChatId && displayChatInfo ? (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                 <button onClick={() => setMobileView('list')} className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-600"><LuX /></button>
                 <div>
                    <h3 className="font-bold text-slate-800">{displayChatInfo.nombre}</h3>
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> En línea
                    </p>
                 </div>
              </div>
              
              {transaction?.estadoId === 2 && transaction.esComprador && (
                  <button 
                    onClick={() => { 
                        setPendingRatingData({ sellerId: activeChatId!, sellerName: displayChatInfo.nombre, transactionId: transaction.id }); 
                        setIsRateModalOpen(true); 
                    }} 
                    className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-amber-100 transition-colors"
                  >
                      <LuStar size={16} className="fill-amber-600" /> Calificar
                  </button>
              )}
            </div>
            
            {/* Barra de Transacción */}
            {transaction && (
                <TransactionStatusBar 
                    tx={transaction}
                    onConfirmDelivery={handleConfirmDelivery}
                    onConfirmReceipt={handleConfirmReceipt}
                    onRate={() => { 
                        setPendingRatingData({ sellerId: activeChatId!, sellerName: displayChatInfo.nombre, transactionId: transaction.id }); 
                        setIsRateModalOpen(true); 
                    }}
                />
            )}
            
            {/* Mensajes */}
            <ChatMessagesArea 
                mensajes={messages} 
                currentUserId={user?.id || 0} 
            />
            
            {/* Zona de Input con Alerta de Spam */}
            <div className="relative">
                <AnimatePresence>
                    {isLimited && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-20"
                        >
                            <div className="bg-red-100 p-1.5 rounded-full"><LuClock className="w-4 h-4 text-red-600 animate-pulse" /></div>
                            <div className="flex-1">
                                <p className="font-bold text-xs uppercase tracking-wide">Estás escribiendo muy rápido</p>
                                <p className="text-sm">Por favor espera <b>{timeLeft}s</b> para enviar más mensajes.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ChatInputArea 
                    onSend={handleSend} 
                    // Bloqueamos el input si está enviando O si está limitado por spam
                    isLoading={isSending || isLimited} 
                />
            </div>
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <LuMessageCircle size={48} className="text-slate-200" />
              </div>
              <p className="font-medium text-lg text-slate-500">Selecciona un chat para comenzar</p>
           </div>
        )}

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