import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LuX, LuStar, LuMessageCircle } from 'react-icons/lu';

import { useAuth } from '@/app/context/AuthContext';
import RateUserModal from '@/features/DM/Chat.Components/RateUserModal';

// --- 1. HOOKS ROBUSTOS (Nuevos Nombres) ---
import { 
  useChatSocket, 
  useChatList,        // Antes useChatListInfinite
  useChatMessages,    // Antes parte de useConversation
  useChatTransaction, // Antes parte de useConversation
  useChatActions      // Nuevo hook de acciones
} from '@/features/DM/chat.hooks';

// --- 2. COMPONENTES UI ---
import { 
  ChatListSidebar, 
  ChatMessagesArea, 
  ChatInputArea, 
  TransactionStatusBar 
} from '@/features/DM/Chat.Components/Chat.Components';

import type { Chat } from '@/features/DM/chat.types';

export default function ChatPage() {
  const { user } = useAuth(); // Ya no necesitamos 'token' aquí, los hooks lo manejan
  const location = useLocation();
  
  // --- ESTADOS LOCALES ---
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [pendingRatingData, setPendingRatingData] = useState<{sellerId: number, sellerName: string, transactionId: number} | null>(null);

  // --- 3. DATOS (Usando los hooks nuevos) ---

  // A. Lista de Chats (Paginada)
  const { 
      data: chatListData, 
      fetchNextPage, 
      hasNextPage, 
      isFetchingNextPage 
  } = useChatList(true); // isOpen = true

  const chats = chatListData?.allChats || [];

  // B. Conversación Activa (Mensajes)
  const { data: messagesData } = useChatMessages(activeChatId, true);
  const messages = messagesData?.allMessages || [];

  // C. Transacción Activa
  const { data: transaction } = useChatTransaction(activeChatId, true);

  // D. Información del Usuario Activo
  const activeChatInfo = chats.find(c => c.id === activeChatId);
  
  // Fallback visual si el chat no está en la lista inicial
  const displayChatInfo = activeChatInfo || (activeChatId ? { 
      nombre: "Cargando usuario...", 
      id: activeChatId, 
      mensajes: [], 
      noLeidos: 0, 
      online: false, 
      avatar: undefined 
  } as unknown as Chat : null);

  // --- 4. SOCKETS & ACCIONES ---
  
  // Inicializar Socket (maneja invalidaciones internamente)
  useChatSocket(activeChatId);

  // Importar acciones encapsuladas
  const { sendMessage, markAsRead, confirmTransaction, isSending } = useChatActions();

  // --- HANDLERS ---

  const handleSend = async (texto: string, file?: File) => {
      if (!activeChatId) return;
      try {
          await sendMessage({ chatId: activeChatId, text: texto, file });
      } catch (e) {
          console.error("Error al enviar:", e);
          alert("No se pudo enviar el mensaje");
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
          // Abrir modal al confirmar recepción
          setPendingRatingData({ 
              sellerId: activeChatId!, 
              sellerName: displayChatInfo.nombre, 
              transactionId: transaction.id 
          }); 
          setIsRateModalOpen(true);
      } catch (e) {}
  };

  // Efecto: Navegación externa
  useEffect(() => {
      const state = location.state as { toUser?: any };
      if (state?.toUser) { 
          setActiveChatId(state.toUser.id); 
          setMobileView('chat'); 
      }
  }, [location]);

  // Efecto: Marcar leído al abrir
  useEffect(() => {
      if (activeChatId) {
          markAsRead(activeChatId);
      }
  }, [activeChatId, messages.length]); // Se ejecuta al cambiar de chat o recibir mensajes nuevos


  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm m-4 md:m-6">
      
      {/* SIDEBAR (Lista) */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white z-20`}>
         <div className="p-4 border-b border-slate-100 font-bold text-lg text-slate-800 sticky top-0 bg-white z-20">
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
      
      {/* AREA PRINCIPAL (Conversación) */}
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
              
              {/* Botón Calificar Manual */}
              {transaction?.estadoId === 2 && transaction.esComprador && (
                  <button 
                    onClick={() => { 
                        setPendingRatingData({ sellerId: activeChatId!, sellerName: displayChatInfo.nombre, transactionId: transaction.id }); 
                        setIsRateModalOpen(true); 
                    }} 
                    className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-amber-100 transition-colors"
                  >
                      <LuStar size={16} className="fill-amber-600" /> Calificar Vendedor
                  </button>
              )}
            </div>
            
            {/* Barra Estado */}
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
            
            {/* Input */}
            <ChatInputArea 
                onSend={handleSend} 
                isLoading={isSending} 
            />
          </>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <LuMessageCircle size={48} className="text-slate-200" />
              </div>
              <p className="font-medium text-lg text-slate-500">Selecciona un chat para comenzar</p>
              <p className="text-sm text-slate-400">O busca un usuario nuevo en el panel izquierdo</p>
           </div>
        )}

        {/* Modal */}
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