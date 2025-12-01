import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme } from "emoji-picker-react";

import {
  LuSearch, LuCheck, LuCheckCheck, LuImage, LuSmile,
  LuLoader, LuSend, LuShoppingBag, LuTruck, LuPackageCheck,
  LuStar, LuCircleAlert, LuMessageCircle, LuChevronLeft, LuChevronRight,
} from "react-icons/lu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import type { Chat, Mensaje, TransaccionActiva } from "../chat.types";

// ============================================================================
// 1. BARRA DE ESTADO DE TRANSACCIÓN (Semántica)
// ============================================================================

interface TransactionBarProps {
  tx: TransaccionActiva;
  onConfirmDelivery: () => void;
  onConfirmReceipt: () => void;
  onRate: () => void;
  onCancel?: () => void;
}

export const TransactionStatusBar: React.FC<TransactionBarProps> = ({
  tx, onConfirmDelivery, onConfirmReceipt, onRate, onCancel,
}) => {
  // Pendiente de envío (Azul -> Primary)
  if (tx.estadoId === 1 && !tx.confirmacionVendedor) {
    return (
      <div className="bg-primary/5 border-b border-primary/10 px-3 md:px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <LuShoppingBag className="text-primary" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary truncate">Compra en proceso</p>
            <p className="text-[11px] text-muted-foreground truncate">El vendedor debe confirmar la entrega.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tx.esVendedor ? (
            <Button size="sm" onClick={onConfirmDelivery} className="h-7 text-[11px] font-bold">Entregar</Button>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Esperando vendedor...</span>
          )}
          {onCancel && (tx.esComprador || tx.esVendedor) && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={onCancel}>Cancelar</Button>
          )}
        </div>
      </div>
    );
  }

  // En camino (Amber -> Warning/Yellow semantic or specific style)
  if (tx.estadoId === 1 && tx.confirmacionVendedor && !tx.confirmacionComprador) {
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-3 md:px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <LuTruck className="text-yellow-600 dark:text-yellow-500" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 truncate">Producto en camino</p>
            <p className="text-[11px] text-muted-foreground truncate">Confirma cuando recibas el producto.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tx.esComprador ? (
            <Button size="sm" onClick={onConfirmReceipt} className="bg-green-600 hover:bg-green-700 text-white h-7 text-[11px] font-bold border-0">Confirmar</Button>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Esperando confirmación...</span>
          )}
          {onCancel && (tx.esComprador || tx.esVendedor) && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={onCancel}>Cancelar</Button>
          )}
        </div>
      </div>
    );
  }

  // Completada (Green -> Success)
  if (tx.estadoId === 2) {
    return (
      <div className="bg-green-500/10 border-b border-green-500/20 px-2 md:px-3 py-2 flex items-center justify-center gap-2 text-green-700 dark:text-green-400 text-[11px] md:text-xs font-medium shrink-0 shadow-sm z-10">
        <LuPackageCheck size={14} /> Transacción finalizada
        {tx.esComprador && (
          <button onClick={onRate} className="ml-2 underline hover:text-green-800 dark:hover:text-green-300 flex items-center gap-1 font-bold">
            <LuStar size={12} /> Calificar vendedor
          </button>
        )}
      </div>
    );
  }

  return null;
};

// ============================================================================
// 2. CARRUSEL DE TRANSACCIONES
// ============================================================================

export const TransactionCarousel: React.FC<TransactionCarouselProps> = ({
  transacciones, currentIndex, onChangeIndex, onConfirmDelivery, onConfirmReceipt, onCancel, onRate,
}) => {
  if (!transacciones.length) return null;
  const tx = transacciones[currentIndex];
  if (!tx) return null;

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < transacciones.length - 1;

  return (
    <div className="bg-card border-b border-border shadow-sm shrink-0">
      <div className="flex items-center justify-between px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] text-muted-foreground bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground">Compra {currentIndex + 1} de {transacciones.length}</span>
          <span className="truncate max-w-[120px] text-muted-foreground">{tx.producto?.nombre}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded-full hover:bg-muted disabled:opacity-40 text-foreground" disabled={!canPrev} onClick={() => canPrev && onChangeIndex(currentIndex - 1)}>
            <LuChevronLeft className="w-3 h-3" />
          </button>
          <button className="p-1 rounded-full hover:bg-muted disabled:opacity-40 text-foreground" disabled={!canNext} onClick={() => canNext && onChangeIndex(currentIndex + 1)}>
            <LuChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <TransactionStatusBar tx={tx} onConfirmDelivery={() => onConfirmDelivery(tx)} onConfirmReceipt={() => onConfirmReceipt(tx)} onRate={() => onRate(tx)} onCancel={() => onCancel(tx)} />
    </div>
  );
};

// ============================================================================
// 3. SIDEBAR LISTA DE CHATS
// ============================================================================

interface ChatListProps {
  chats: Chat[];
  activeChatId: number | null;
  onSelect: (id: number) => void;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

export const ChatListSidebar: React.FC<ChatListProps> = ({
  chats, activeChatId, onSelect, hasNextPage, fetchNextPage, isFetchingNextPage,
}) => (
  <div className="flex flex-col h-full bg-card border-r border-border">
    <div className="p-3 border-b border-border sticky top-0 bg-card z-10">
      <div className="relative group">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
        <input
          placeholder="Buscar..."
          className="w-full bg-muted/50 text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground border border-transparent focus:border-primary/50 text-foreground"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs text-center p-4">
          <LuMessageCircle size={32} className="mb-2 opacity-20" />
          <p>No tienes conversaciones activas.</p>
        </div>
      ) : (
        <>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className={`flex items-center gap-3 p-3.5 cursor-pointer border-b border-border transition-all duration-200 hover:bg-muted/50 ${
                activeChatId === chat.id ? "bg-primary/5 border-l-4 border-l-primary pl-3" : "border-l-4 border-l-transparent pl-4"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={chat.avatar} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {chat.nombre ? chat.nombre.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                {chat.noLeidos! > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-card rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className={`text-sm truncate ${chat.noLeidos! > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                    {chat.nombre}
                  </h4>
                  {chat.noLeidos! > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                      {chat.noLeidos}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] md:text-xs truncate ${chat.noLeidos ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {chat.ultimoMensaje || "Imagen enviada"}
                </p>
              </div>
            </div>
          ))}
          {hasNextPage && (
            <div className="p-3 text-center border-t border-border bg-muted/20">
              <Button variant="ghost" size="sm" onClick={() => fetchNextPage && fetchNextPage()} disabled={isFetchingNextPage} className="text-xs text-primary w-full hover:bg-primary/10 hover:text-primary h-8">
                {isFetchingNextPage ? <span className="flex items-center gap-2"><LuLoader className="animate-spin w-3 h-3" /> Cargando...</span> : "Cargar anteriores"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

// ============================================================================
// 4. ÁREA DE MENSAJES
// ============================================================================

export const ChatMessagesArea: React.FC<{ mensajes: Mensaje[]; currentUserId: number }> = ({ mensajes, currentUserId }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length]);

  return (
    // bg-muted/10 para un fondo muy sutilmente diferente al blanco puro, pero limpio
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-muted/5">
      {mensajes.map((msg) => {
        const isSystem = msg.tipo === "sistema";
        if (isSystem) {
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-3">
              <div className="bg-muted border border-border rounded-full px-3 py-1.5 text-[10px] text-muted-foreground flex items-center gap-2 shadow-sm">
                <LuCircleAlert size={12} /> {msg.texto}
              </div>
            </motion.div>
          );
        }

        const isMe = msg.autor === "yo" || msg.autorId === currentUserId;

        return (
          <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] sm:text-sm shadow-sm relative group break-words ${
                isMe 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-card border border-border text-foreground rounded-bl-sm"
              }`}>
              {msg.imagenUrl && (
                <img src={msg.imagenUrl} alt="adjunto" className="rounded-lg mb-2 max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imagenUrl, "_blank")} />
              )}
              {msg.texto && <p className="whitespace-pre-wrap leading-relaxed">{msg.texto}</p>}
              <div className={`text-[9px] flex justify-end items-center gap-1 mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                <span>{msg.hora}</span>
                {isMe && (msg.estado === "leido" ? <LuCheckCheck className="inline text-current" size={12} /> : <LuCheck className="inline" size={12} />)}
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
// 5. INPUT DE MENSAJE
// ============================================================================

export const ChatInputArea: React.FC<{ onSend: (t: string, f?: File) => void; isLoading: boolean }> = ({ onSend, isLoading }) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
    setShowEmoji(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="p-2.5 sm:p-3 bg-card border-t border-border relative shrink-0 z-20">
      {showEmoji && (
        <div className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-xl border border-border overflow-hidden">
          <EmojiPicker onEmojiClick={(e) => setText((p) => p + e.emoji)} width={300} height={350} theme={Theme.AUTO} searchDisabled previewConfig={{ showPreview: false }} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border h-[42px] items-center shrink-0">
          <button type="button" onClick={() => fileRef.current?.click()} className="p-2 text-muted-foreground hover:bg-card hover:text-primary rounded-lg transition-all"><LuImage size={18} /></button>
          <button type="button" onClick={() => setShowEmoji((p) => !p)} className={`p-2 rounded-lg transition-all ${showEmoji ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:bg-card"}`}><LuSmile size={18} /></button>
        </div>
        <input type="file" hidden ref={fileRef} accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { onSend("", e.target.files[0]); e.target.value = ""; } }} />
        
        <div className="flex-1 bg-muted/30 rounded-2xl border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all flex items-center min-h-[42px] py-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Escribe un mensaje..."
            className="w-full bg-transparent border-none px-4 py-2 text-sm focus:ring-0 resize-none max-h-[120px] placeholder:text-muted-foreground text-foreground leading-normal custom-scrollbar"
            rows={1}
          />
        </div>

        <Button type="submit" size="icon" disabled={(!text.trim() && !fileRef.current?.files?.length) || isLoading} className="rounded-xl h-[42px] w-[42px] shrink-0 shadow-lg shadow-primary/20">
          {isLoading ? <LuLoader className="animate-spin" size={18} /> : <LuSend size={18} className="ml-0.5" />}
        </Button>
      </form>
    </div>
  );
};