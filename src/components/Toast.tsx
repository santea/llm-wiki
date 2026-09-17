import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1e1f26]/95 border border-[#7c3aed]/50 text-xs font-mono text-[#e2e2eb] shadow-[0_0_24px_rgba(124,58,237,0.35)] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
      <Sparkles className="w-4 h-4 text-[#4cd7f6] shrink-0" />
      <span className="leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="text-[#958da1] hover:text-[#e2e2eb] transition-colors ml-1 p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
