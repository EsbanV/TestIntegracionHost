import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";

export default function LoginFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="fixed inset-x-0 bottom-6 w-full flex justify-center z-40 pointer-events-none"
      aria-label="Pie de página de inicio de sesión"
    >
      <div 
        className="
          pointer-events-auto 
          flex items-center gap-3 sm:gap-4 
          px-4 py-2 
          bg-white/80 backdrop-blur-md 
          border border-slate-200/60 
          rounded-full 
          shadow-sm hover:shadow-md 
          transition-all duration-300
        "
      >
        {/* Copyright */}
        <span className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide cursor-default">
          © {currentYear} MarketUCT
        </span>

        {/* Separador vertical */}
        <span className="h-3 w-px bg-slate-300 rounded-full" aria-hidden="true" />
      </div>
    </footer>
  );
}