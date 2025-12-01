import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuMessageCircle, LuClock } from "react-icons/lu";

import { useAuth } from "@/app/context/AuthContext";
import RateUserModal from "@/features/DM/Chat.Components/RateUserModal";

import {
  useChatSocket,
  useChatList,
  useChatMessages,
  useChatTransactions,
  useChatActions,
  useRateLimiter,
} from "@/features/DM/chat.hooks";

import {
  ChatListSidebar,
  ChatMessagesArea,
  ChatInputArea,
  TransactionCarousel,
} from "@/features/DM/Chat.Components/Chat.Components";

import type { Chat } from "@/features/DM/chat.types";

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{
    sellerId: number;
    sellerName: string;
    transactionId: number;
  } | null>(null);

  // --- LIMITADOR DE VELOCIDAD ---
  const { isLimited, timeLeft, checkRateLimit } = useRateLimiter({
    maxRequests: 5,
    windowMs: 5000,
    cooldownMs: 10000,
  });

  // --- DATOS ---
  const { data: chatListData, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatList(true);
  const chats = chatListData?.allChats ?? [];

  const { data: messagesData } = useChatMessages(activeChatId, true);
  const messages = messagesData?.allMessages ?? [];

  const { data: transactions = [] } = useChatTransactions(activeChatId, true);
  const [currentTxIndex, setCurrentTxIndex] = useState(0);

  const safeTxIndex = transactions.length === 0 ? 0 : Math.min(currentTxIndex, transactions.length - 1);
  const currentTx = transactions.length > 0 ? transactions[safeTxIndex] ?? null : null;

  const activeChatInfo = chats.find((c) => c.id === activeChatId);
  const displayChatInfo: Chat | null = activeChatInfo ?? (activeChatId ? {
          id: activeChatId,
          nombre: "Cargando usuario...",
          avatar: undefined,
          mensajes: [],
          noLeidos: 0,
        } as unknown as Chat : null);

  const unreadCount = displayChatInfo?.noLeidos ?? 0;

  useChatSocket(activeChatId);

  const { sendMessage, markAsRead, confirmTransaction, cancelTransaction, isSending } = useChatActions();

  // --- HANDLERS ---
  const handleSend = async (text: string, file?: File) => {
    if (!checkRateLimit() || !activeChatId) return;
    try { await sendMessage({ chatId: activeChatId, text, file }); } catch (error) { console.error(error); }
  };

  const handleConfirmDelivery = async (tx: any) => {
    if (!tx || !activeChatId) return;
    try { await confirmTransaction({ txId: tx.id, type: "delivery", chatUserId: activeChatId }); } catch (error) { console.error(error); }
  };

  const handleConfirmReceipt = async (tx: any) => {
    if (!tx || !displayChatInfo || !activeChatId) return;
    try {
      await confirmTransaction({ txId: tx.id, type: "receipt", chatUserId: activeChatId });
      setPendingRatingData({ sellerId: activeChatId, sellerName: displayChatInfo.nombre, transactionId: tx.id });
      setIsRateModalOpen(true);
    } catch (error) { console.error(error); }
  };

  const handleCancelTx = async (tx: any) => {
    if (!tx || !activeChatId) return;
    try { await cancelTransaction({ txId: tx.id, chatUserId: activeChatId }); } catch (error) { console.error(error); }
  };

  useEffect(() => { setCurrentTxIndex(0); }, [activeChatId, transactions.length]);

  useEffect(() => {
    const state = location.state as { toUser?: { id: number } } | undefined;
    if (state?.toUser) {
      setActiveChatId(state.toUser.id);
      setMobileView("chat");
    }
  }, [location]);

  useEffect(() => {
    if (!activeChatId || unreadCount <= 0) return;
    markAsRead(activeChatId);
  }, [activeChatId, unreadCount, markAsRead]);

  return (
    // Contenedor principal: Ocupa el 100% del área disponible del layout padre
    // Sin márgenes externos para que se sienta como una app nativa
    <div className="flex h-full w-full bg-background overflow-hidden">
      
      {/* SIDEBAR */}
      <div className={`${mobileView === "list" ? "flex" : "hidden md:flex"} w-full md:w-80 lg:w-96 flex-col border-r border-border bg-card z-20`}>
        <div className="p-3 md:p-4 border-b border-border font-bold text-base md:text-lg text-foreground sticky top-0 bg-card z-10">
          Mensajes
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatListSidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelect={(id) => { setActiveChatId(id); setMobileView("chat"); }}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className={`${mobileView === "chat" ? "flex" : "hidden md:flex"} flex-1 flex-col bg-muted/5 relative`}>
        {activeChatId && displayChatInfo ? (
          <>
            {/* Header Chat */}
            <div className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <button onClick={() => setMobileView("list")} className="md:hidden p-2 hover:bg-muted rounded-full text-muted-foreground">
                  <LuX />
                </button>
                <div>
                  <h3 className="font-bold text-foreground text-sm md:text-base">
                    {displayChatInfo.nombre}
                  </h3>
                  <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> En línea
                  </p>
                </div>
              </div>

              {currentTx?.estadoId === 2 && currentTx.esComprador && (
                <button
                  onClick={() => {
                    setPendingRatingData({ sellerId: activeChatId!, sellerName: displayChatInfo.nombre, transactionId: currentTx.id });
                    setIsRateModalOpen(true);
                  }}
                  className="hidden sm:inline-flex text-[11px] px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 font-semibold"
                >
                  Calificar compra
                </button>
              )}
            </div>

            {/* Carrusel */}
            {transactions.length > 0 && (
              <TransactionCarousel
                transacciones={transactions}
                currentIndex={safeTxIndex}
                onChangeIndex={setCurrentTxIndex}
                onConfirmDelivery={handleConfirmDelivery}
                onConfirmReceipt={handleConfirmReceipt}
                onCancel={handleCancelTx}
                onRate={(tx) => {
                  setPendingRatingData({ sellerId: activeChatId!, sellerName: displayChatInfo!.nombre, transactionId: tx.id });
                  setIsRateModalOpen(true);
                }}
              />
            )}

            {/* Mensajes */}
            <ChatMessagesArea mensajes={messages} currentUserId={user?.id || 0} />

            {/* Input + Rate Limit */}
            <div className="relative">
              <AnimatePresence>
                {isLimited && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mx-3 md:mx-4 mb-2 bg-destructive/10 border border-destructive/20 text-destructive px-3 md:px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-20"
                  >
                    <div className="bg-destructive/20 p-1.5 rounded-full">
                      <LuClock className="w-4 h-4 text-destructive animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[11px] md:text-xs uppercase tracking-wide">Estás escribiendo muy rápido</p>
                      <p className="text-xs md:text-sm">Por favor espera <b>{timeLeft}s</b>.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ChatInputArea onSend={handleSend} isLoading={isSending || isLimited} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 px-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-card rounded-full shadow-sm flex items-center justify-center mb-4 border border-border">
              <LuMessageCircle size={40} className="text-muted-foreground/30 md:size-48" />
            </div>
            <p className="font-medium text-base md:text-lg text-muted-foreground text-center">
              Selecciona un chat para comenzar
            </p>
          </div>
        )}

        {pendingRatingData && (
          <RateUserModal
            isOpen={isRateModalOpen}
            onClose={() => setIsRateModalOpen(false)}
            sellerId={pendingRatingData.sellerId}
            sellerName={pendingRatingData.sellerName}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;