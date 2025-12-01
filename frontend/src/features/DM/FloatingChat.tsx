import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuMessageCircle, LuClock } from "react-icons/lu";
import { useAuth } from "@/app/context/AuthContext";

import {
  useChatSocket,
  useChatList,
  useChatMessages,
  useChatTransactions,
  useChatActions,
  useRateLimiter,
} from "@/features/DM/chat.hooks";

import {
  FloatingWindowWrapper,
  FloatingChatInput,
  FloatingChatList,
  FloatingMessagesArea,
  TransactionCarousel,
} from "./FloatingChat.Components/FloatingChat.Components";

import RateUserModal from "@/features/DM/Chat.Components/RateUserModal";
import type { Chat } from "@/features/DM/chat.types";

export default function FloatingChat() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{
    sellerId: number;
    sellerName: string;
    transactionId: number;
  } | null>(null);

  // Anti-spam
  const { isLimited, timeLeft, checkRateLimit } = useRateLimiter({
    maxRequests: 5,
    windowMs: 5000,
    cooldownMs: 10000,
  });

  // Lista de chats
  const { data: chatListData, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatList(isOpen);
  const chats = chatListData?.allChats || [];
  const totalUnread = chats.reduce((acc, c) => acc + (c.noLeidos || 0), 0);

  // Mensajes
  const { data: messagesData } = useChatMessages(activeChatId, isOpen && view === "chat");
  const messages = messagesData?.allMessages || [];

  // Transacciones
  const { data: transactions = [] } = useChatTransactions(activeChatId, isOpen && view === "chat");
  const [currentTxIndex, setCurrentTxIndex] = useState(0);

  const safeTxIndex = transactions.length === 0 ? 0 : Math.min(currentTxIndex, transactions.length - 1);
  const currentTx = transactions.length > 0 ? transactions[safeTxIndex] ?? null : null;

  useEffect(() => { setCurrentTxIndex(0); }, [activeChatId, transactions.length]);

  const activeChatInfo = chats.find((c) => c.id === activeChatId);
  const displayChatInfo = activeChatInfo || (activeChatId ? ({ nombre: "...", id: activeChatId } as unknown as Chat) : null);
  const unreadCount = activeChatInfo?.noLeidos ?? 0;

  useChatSocket(activeChatId);

  const { sendMessage, markAsRead, confirmTransaction, cancelTransaction, isSending } = useChatActions();

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
    setView("chat");
  };

  const handleSend = async (texto: string, file?: File) => {
    if (!checkRateLimit() || !activeChatId) return;
    try { await sendMessage({ chatId: activeChatId, text: texto, file }); } catch {}
  };

  const handleConfirmDelivery = async (tx: any) => {
    if (!tx || !activeChatId) return;
    await confirmTransaction({ txId: tx.id, type: "delivery", chatUserId: activeChatId });
  };

  const handleConfirmReceipt = async (tx: any) => {
    if (!tx || !activeChatId) return;
    await confirmTransaction({ txId: tx.id, type: "receipt", chatUserId: activeChatId });
    if (displayChatInfo) {
      setPendingRatingData({ sellerId: activeChatId, sellerName: displayChatInfo.nombre, transactionId: tx.id });
      setIsRateModalOpen(true);
    }
  };

  const handleCancelTx = async (tx: any) => {
    if (!tx || !activeChatId) return;
    await cancelTransaction({ txId: tx.id, chatUserId: activeChatId });
  };

  useEffect(() => {
    if (!activeChatId || !isOpen || view !== "chat" || unreadCount <= 0) return;
    markAsRead(activeChatId);
  }, [activeChatId, isOpen, view, unreadCount, markAsRead]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <FloatingWindowWrapper view={view} setView={setView} onClose={() => setIsOpen(false)} activeChatInfo={displayChatInfo as Chat | undefined}>
            {view === "list" ? (
              <FloatingChatList chats={chats} onSelect={handleSelectChat} hasNextPage={hasNextPage} fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
            ) : (
              // Fondo sutilmente diferente al de las burbujas
              <div className="flex flex-col h-full bg-muted/5 relative">
                {transactions.length > 0 && (
                  <TransactionCarousel
                    transacciones={transactions}
                    currentIndex={safeTxIndex}
                    onChangeIndex={setCurrentTxIndex}
                    onConfirmDelivery={handleConfirmDelivery}
                    onConfirmReceipt={handleConfirmReceipt}
                    onCancel={handleCancelTx}
                    onRate={(tx) => {
                      if (!activeChatId || !displayChatInfo) return;
                      setPendingRatingData({ sellerId: activeChatId, sellerName: displayChatInfo.nombre, transactionId: tx.id });
                      setIsRateModalOpen(true);
                    }}
                  />
                )}

                <FloatingMessagesArea mensajes={messages} currentUserId={user?.id || 0} />

                <AnimatePresence>
                  {isLimited && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-[70px] left-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-xl text-xs flex gap-2 items-center z-20 shadow-lg backdrop-blur">
                      <LuClock />
                      <span>Espera <b>{timeLeft}s</b> para enviar más.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <FloatingChatInput onSend={handleSend} isLoading={isSending || isLimited} />
              </div>
            )}
          </FloatingWindowWrapper>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            // Botón primario sólido (Indigo)
            className="fixed bottom-20 right-6 z-[9990] bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95"
          >
            <LuMessageCircle size={28} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                {totalUnread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {pendingRatingData && (
        <RateUserModal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} sellerId={pendingRatingData.sellerId} sellerName={pendingRatingData.sellerName} />
      )}
    </>
  );
}