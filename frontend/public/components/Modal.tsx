import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, className = "" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative animate-fade-in ${className}`}>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          ×
        </button>
        {children}
      </div>
      <style>
        {`
          @keyframes fade-in { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in { animation: fade-in 0.2s; }
        `}
      </style>
    </div>
  );
};

export default Modal;