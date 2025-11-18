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

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();

  // --- ESTADOS ---
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{
    sellerId: number;
    sellerName: string;
    transactionId: number;
  } | null>(null);

  // --- LIMITADOR DE VELOCIDAD (Anti-Spam) ---
  const { isLimited, timeLeft, checkRateLimit } = useRateLimiter({
    maxRequests: 5,
    windowMs: 5000,
    cooldownMs: 10000,
  });

  // --- LISTA DE CHATS ---
  const {
    data: chatListData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatList(true);

  const chats = chatListData?.allChats || [];

  // --- MENSAJES ---
  const { data: messagesData } = useChatMessages(activeChatId, true);
  const messages = messagesData?.allMessages || [];

  // --- TRANSACCIONES ACTIVAS POR CHAT ---
  const { data: transactions = [] } = useChatTransactions(activeChatId, true);
  const [currentTxIndex, setCurrentTxIndex] = useState(0);

  // Índice seguro (por si cambia el largo del array)
  const safeTxIndex =
    transactions.length === 0
      ? 0
      : Math.min(currentTxIndex, transactions.length - 1);

  const currentTx =
    transactions.length > 0 ? transactions[safeTxIndex] ?? null : null;

  // Info del chat activo
  const activeChatInfo = chats.find((c) => c.id === activeChatId);
  const displayChatInfo =
    activeChatInfo ||
    (activeChatId
      ? ({
          nombre: "Cargando usuario...",
          id: activeChatId,
          mensajes: [],
          noLeidos: 0,
          avatar: undefined,
        } as unknown as Chat)
      : null);
    const unreadCount = displayChatInfo?.noLeidos ?? 0;


  // --- SOCKETS & ACCIONES ---
  useChatSocket(activeChatId);
  const { sendMessage, markAsRead, confirmTransaction, cancelTransaction, isSending } =
    useChatActions();

  // --- HANDLERS ---

  const handleSend = async (texto: string, file?: File) => {
    if (!checkRateLimit()) return; // anti-spam
    if (!activeChatId) return;

    try {
      await sendMessage({ chatId: activeChatId, text: texto, file });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelivery = async (tx: any) => {
    if (!tx || !activeChatId) return;
    try {
      await confirmTransaction({
        txId: tx.id,
        type: "delivery",
        chatUserId: activeChatId,
      });
    } catch (error) {
      console.error("Error al confirmar entrega:", error);
    }
  };

  const handleConfirmReceipt = async (tx: any) => {
    if (!tx || !displayChatInfo || !activeChatId) return;
    try {
      await confirmTransaction({
        txId: tx.id,
        type: "receipt",
        chatUserId: activeChatId,
      });

      setPendingRatingData({
        sellerId: activeChatId,
        sellerName: displayChatInfo.nombre,
        transactionId: tx.id,
      });
      setIsRateModalOpen(true);
    } catch (error) {
      console.error("Error al confirmar recibo:", error);
    }
  };

  const handleCancelTx = async (tx: any) => {
    if (!tx || !activeChatId) return;
    try {
      await cancelTransaction({
        txId: tx.id,
        chatUserId: activeChatId,
      });
    } catch (error) {
      console.error("Error al cancelar transacción:", error);
    }
  };

  // --- EFECTOS ---

  // Reset índice de carrusel cuando cambia de chat o cambia número de transacciones
  useEffect(() => {
    setCurrentTxIndex(0);
  }, [activeChatId, transactions.length]);

  // Navegar directo a un usuario desde el Home
  useEffect(() => {
    const state = location.state as { toUser?: any };
    if (state?.toUser) {
      setActiveChatId(state.toUser.id);
      setMobileView("chat");
    }
  }, [location]);

  // Marcar como leído al abrir el chat o recibir nuevos mensajes
// Marcar como leído al abrir el chat cuando hay mensajes sin leer
    useEffect(() => {
    if (!activeChatId) return;
    if (unreadCount <= 0) return;

    // Solo se ejecuta cuando entras a un chat que tiene noLeidos > 0
    markAsRead(activeChatId);
    }, [activeChatId, unreadCount]);


  // --- RENDER ---

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm m-4 md:m-6">
      {/* SIDEBAR */}
      <div
        className={`${
          mobileView === "list" ? "flex" : "hidden md:flex"
        } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white z-20`}
      >
        <div className="p-4 border-b border-slate-100 font-bold text-lg text-slate-800 sticky top-0 bg-white z-10">
          Mensajes
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatListSidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelect={(id) => {
              setActiveChatId(id);
              setMobileView("chat");
            }}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div
        className={`${
          mobileView === "chat" ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-slate-50/50 relative`}
      >
        {activeChatId && displayChatInfo ? (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-600"
                >
                  <LuX />
                </button>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {displayChatInfo.nombre}
                  </h3>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{" "}
                    En línea
                  </p>
                </div>
              </div>

              {/* Botón de calificar (solo cuando la transacción actual está completada y soy comprador) */}
              {currentTx?.estadoId === 2 && currentTx.esComprador && (
                <button
                  onClick={() => {
                    setPendingRatingData({
                      sellerId: activeChatId!,
                      sellerName: displayChatInfo.nombre,
                      transactionId: currentTx.id,
                    });
                    setIsRateModalOpen(true);
                  }}
                  className="hidden sm:inline-flex text-[11px] px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold"
                >
                  Calificar compra
                </button>
              )}
            </div>

            {/* Barra de Transacciones (carrusel) */}
            {transactions.length > 0 && (
              <TransactionCarousel
                transacciones={transactions}
                currentIndex={safeTxIndex}
                onChangeIndex={setCurrentTxIndex}
                onConfirmDelivery={handleConfirmDelivery}
                onConfirmReceipt={handleConfirmReceipt}
                onCancel={handleCancelTx}
                onRate={(tx) => {
                  setPendingRatingData({
                    sellerId: activeChatId!,
                    sellerName: displayChatInfo!.nombre,
                    transactionId: tx.id,
                  });
                  setIsRateModalOpen(true);
                }}
              />
            )}

            {/* Mensajes */}
            <ChatMessagesArea
              mensajes={messages}
              currentUserId={user?.id || 0}
            />

            {/* Input + aviso anti-spam */}
            <div className="relative">
              <AnimatePresence>
                {isLimited && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-20"
                  >
                    <div className="bg-red-100 p-1.5 rounded-full">
                      <LuClock className="w-4 h-4 text-red-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-xs uppercase tracking-wide">
                        Estás escribiendo muy rápido
                      </p>
                      <p className="text-sm">
                        Por favor espera <b>{timeLeft}s</b> para enviar más
                        mensajes.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ChatInputArea
                onSend={handleSend}
                isLoading={isSending || isLimited}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
              <LuMessageCircle size={48} className="text-slate-200" />
            </div>
            <p className="font-medium text-lg text-slate-500">
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
}
