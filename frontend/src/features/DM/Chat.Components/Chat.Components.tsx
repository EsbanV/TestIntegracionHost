import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

// Icons
import {
  LuSearch,
  LuCheck,
  LuCheckCheck,
  LuImage,
  LuSmile,
  LuLoader,
  LuSend,
  LuShoppingBag,
  LuTruck,
  LuPackageCheck,
  LuStar,
  LuCircleAlert,
  LuMessageCircle,
  LuChevronLeft,
  LuChevronRight,
  LuX,
  LuGripHorizontal,
} from "react-icons/lu";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import type { Chat, Mensaje, TransaccionActiva } from "../chat.types";

interface TransactionBarProps {
  tx: TransaccionActiva;
  onConfirmDelivery: () => void;
  onConfirmReceipt: () => void;
  onRate: () => void;
  onCancel?: () => void;
}

// ============================================================================
// 1. BARRA DE TRANSACCIÓN
// ============================================================================

export const TransactionStatusBar: React.FC<TransactionBarProps> = ({
  tx,
  onConfirmDelivery,
  onConfirmReceipt,
  onRate,
  onCancel,
}: TransactionBarProps) => {
  // Pendiente
  if (tx.estadoId === 1 && !tx.confirmacionVendedor) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-3 md:px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* contenido original omitido para brevedad visual */}
          {/* ... */}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tx.esVendedor ? (
            <Button
              size="sm"
              onClick={onConfirmDelivery}
              className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-[11px] md:text-xs font-bold"
            >
              Entregar
            </Button>
          ) : (
            <span className="text-[11px] md:text-xs text-slate-400 italic">
              Esperando envío...
            </span>
          )}

          {onCancel && (tx.esComprador || tx.esVendedor) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] md:text-[11px] border-red-200 text-red-600 hover:bg-red-50"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // En Camino
  if (tx.estadoId === 1 && tx.confirmacionVendedor && !tx.confirmacionComprador) {
    return (
      <div className="bg-amber-50 border-b border-amber-100 px-3 md:px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* ... */}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tx.esComprador ? (
            <Button
              size="sm"
              onClick={onConfirmReceipt}
              className="bg-green-600 hover:bg-green-700 text-white h-7 text-[11px] md:text-xs font-bold"
            >
              Confirmar
            </Button>
          ) : (
            <span className="text-[11px] md:text-xs text-slate-400 italic">
              Esperando confirmación...
            </span>
          )}

          {onCancel && (tx.esComprador || tx.esVendedor) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] md:text-[11px] border-red-200 text-red-600 hover:bg-red-50"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Completado
  if (tx.estadoId === 2) {
    return (
      <div className="bg-green-50 border-b border-green-100 px-2 md:px-3 py-2 flex items-center justify-center gap-2 text-green-700 text-[11px] md:text-xs font-medium shrink-0 shadow-sm z-10">
        <LuCheckCheck size={14} /> Transacción finalizada
        {tx.esComprador && (
          <button
            onClick={onRate}
            className="ml-2 underline hover:text-green-800 flex items-center gap-1"
          >
            <LuStar size={10} /> Calificar
          </button>
        )}
      </div>
    );
  }
  return null;
};

interface TransactionCarouselProps {
  transacciones: TransaccionActiva[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  onConfirmDelivery: (tx: TransaccionActiva) => void;
  onConfirmReceipt: (tx: TransaccionActiva) => void;
  onCancel: (tx: TransaccionActiva) => void;
  onRate: (tx: TransaccionActiva) => void;
}

export const TransactionCarousel: React.FC<TransactionCarouselProps> = ({
  transacciones,
  currentIndex,
  onChangeIndex,
  onConfirmDelivery,
  onConfirmReceipt,
  onCancel,
  onRate,
}) => {
  if (!transacciones.length) return null;

  const tx = transacciones[currentIndex];
  if (!tx) return null;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < transacciones.length - 1;

  return (
    <div className="bg-white border-b border-slate-200/70 shadow-sm shrink-0">
      {/* Nav superior para elegir transacción */}
      <div className="flex items-center justify-between px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] text-slate-500 bg-slate-50/70">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-700">
            Compra {currentIndex + 1} de {transacciones.length}
          </span>
          <span className="truncate max-w-[120px] sm:max-w-[160px] text-slate-500">
            {tx.producto?.nombre}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-40"
            disabled={!canPrev}
            onClick={() => canPrev && onChangeIndex(currentIndex - 1)}
          >
            <LuChevronLeft className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-40"
            disabled={!canNext}
            onClick={() => canNext && onChangeIndex(currentIndex + 1)}
          >
            <LuChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <TransactionStatusBar
        tx={tx}
        onConfirmDelivery={() => onConfirmDelivery(tx)}
        onConfirmReceipt={() => onConfirmReceipt(tx)}
        onRate={() => onRate(tx)}
        onCancel={() => onCancel(tx)}
      />
    </div>
  );
};

// ============================================================================
// 2. LISTA DE CHATS
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
  chats,
  activeChatId,
  onSelect,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: ChatListProps) => (
  <div className="flex flex-col h-full bg-white">
    <div className="p-3 border-b border-slate-100 sticky top-0 bg-white z-10">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          placeholder="Buscar..."
          className="w-full bg-slate-50 text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 border border-slate-100"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs text-center p-4">
          <LuMessageCircle size={32} className="mb-2 opacity-20" />
          <p>No tienes conversaciones activas.</p>
        </div>
      ) : (
        <>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className={`flex items-center gap-3 p-3 md:p-3.5 cursor-pointer border-b border-slate-50 transition-all duration-200 hover:bg-slate-50 ${
                activeChatId === chat.id
                  ? "bg-blue-50/60 border-l-4 border-l-blue-500 pl-3"
                  : "border-l-4 border-l-transparent pl-4"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 md:h-10 md:w-10 border border-slate-100 bg-white">
                  <AvatarImage src={chat.avatar} className="object-cover" />
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">
                    {chat.nombre ? chat.nombre.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                {chat.noLeidos! > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4
                    className={`text-sm truncate ${
                      chat.noLeidos! > 0
                        ? "font-bold text-slate-900"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {chat.nombre}
                  </h4>
                  {chat.noLeidos! > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                      {chat.noLeidos}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] md:text-xs truncate ${
                    chat.noLeidos
                      ? "text-slate-800 font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {chat.ultimoMensaje || "Imagen enviada"}
                </p>
              </div>
            </div>
          ))}

          {hasNextPage && (
            <div className="p-3 text-center border-t border-slate-50 bg-slate-50/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage && fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs text-blue-600 w-full hover:bg-blue-50 hover:text-blue-700 transition-colors h-8"
              >
                {isFetchingNextPage ? (
                  <span className="flex items-center gap-2">
                    <LuLoader className="animate-spin w-3 h-3" /> Cargando...
                  </span>
                ) : (
                  "Cargar anteriores"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

// ============================================================================
// 3. MENSAJES
// ============================================================================

export const ChatMessagesArea = ({
  mensajes,
  currentUserId,
}: {
  mensajes: Mensaje[];
  currentUserId: number;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes.length]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-[#F8F9FC]">
      {mensajes.map((msg, index) => {
        const isSystem = msg.tipo === "sistema";
        if (isSystem)
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className="flex justify-center my-3 sm:my-4"
            >
              <div className="bg-slate-100 border border-slate-200 rounded-full px-3 sm:px-4 py-1.5 text-[10px] text-slate-500 flex items-center gap-2 shadow-sm">
                <LuCircleAlert size={12} className="text-slate-400" />{" "}
                {msg.texto}
              </div>
            </motion.div>
          );

        const isMe = msg.autor === "yo";

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={msg.id}
            className={`flex w-full ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[85%] md:max-w-[70%] px-3 sm:px-3.5 py-2.5 rounded-2xl text-[13px] sm:text-sm shadow-sm relative group break-words ${
                isMe
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white border border-slate-100 text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.imagenUrl && (
                <img
                  src={msg.imagenUrl}
                  alt="adjunto"
                  className="rounded-lg mb-2 max-h-60 w-full object-cover cursor-pointer bg-black/5 hover:opacity-95 transition-opacity"
                  onClick={() => window.open(msg.imagenUrl, "_blank")}
                />
              )}

              {msg.texto && (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.texto}
                </p>
              )}

              <div
                className={`text-[9px] flex justify-end items-center gap-1 mt-1 ${
                  isMe ? "text-blue-100/80" : "text-slate-400"
                }`}
              >
                <span>{msg.hora}</span>
                {isMe &&
                  (msg.estado === "leido" ? (
                    <LuCheckCheck className="inline text-blue-200" size={12} />
                  ) : (
                    <LuCheck className="inline" size={12} />
                  ))}
              </div>
            </div>
          </motion.div>
        );
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
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
    setShowEmoji(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onSend("", e.target.files[0]);
    e.target.value = "";
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 relative shrink-0 shadow-inner-sm z-20">
      {showEmoji && (
        <div className="absolute bottom-16 left-2 sm:left-4 z-50 shadow-2xl rounded-xl border border-slate-200 overflow-hidden">
          <EmojiPicker
            onEmojiClick={(e) => setText((prev) => prev + e.emoji)}
            width={280}
            height={320}
            theme={Theme.LIGHT}
            searchDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-1.5 sm:gap-2"
      >
        {/* Botones Adjuntar */}
        <div className="flex gap-0.5 bg-slate-50 p-1 rounded-xl border border-slate-100 h-[40px] sm:h-[44px] items-center shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-1.5 sm:p-2 text-slate-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all shadow-sm hover:shadow"
          >
            {/* Icono tamaño fijo (no gigante en escritorio) */}
            <LuImage size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-1.5 sm:p-2 rounded-lg transition-all shadow-sm hover:shadow ${
              showEmoji
                ? "bg-yellow-50 text-yellow-500"
                : "text-slate-400 hover:bg-white"
            }`}
          >
            {/* Icono tamaño fijo */}
            <LuSmile size={18} />
          </button>
        </div>

        <input
          type="file"
          hidden
          ref={fileRef}
          accept="image/*"
          onChange={handleFile}
        />

        {/* Input Wrapper */}
        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 focus-within:bg-white transition-all flex items-center min-h-[40px] sm:min-h-[44px] py-0.5 sm:py-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Escribe un mensaje..."
            className="w-full bg-transparent border-none px-3 sm:px-4 py-2 text-sm focus:ring-0 resize-none max-h-[120px] placeholder:text-slate-400 leading-normal custom-scrollbar"
            rows={1}
            style={{ overflowY: text.length > 50 ? "auto" : "hidden" }}
          />
        </div>

        {/* Botón Enviar */}
        <Button
          type="submit"
          size="icon"
          disabled={(!text.trim() && !fileRef.current?.files?.length) || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] shrink-0 shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
        >
          {isLoading ? (
            <LuLoader className="animate-spin" size={18} />
          ) : (
            <LuSend size={18} className="ml-0.5" />
          )}
        </Button>
      </form>
    </div>
  );
};
