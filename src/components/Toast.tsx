import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border bg-surface-container-lowest border-surface-variant animate-in fade-in slide-in-from-bottom-4">
      <span
        className={`material-symbols-outlined text-[20px] ${
          type === 'success'
            ? 'text-[#5F8A72]'
            : type === 'error'
            ? 'text-error'
            : 'text-primary'
        }`}
      >
        {type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
      </span>
      <span className="font-label-md text-sm text-on-surface">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-outline hover:text-on-surface p-0.5 rounded"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
