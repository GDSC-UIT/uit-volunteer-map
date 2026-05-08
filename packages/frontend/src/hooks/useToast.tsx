import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const success = useCallback((message: string) => toast(message, 'success'), [toast]);
  const error = useCallback((message: string) => toast(message, 'error'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[250px]
                transform transition-all duration-300 ease-in-out translate-y-0 opacity-100 animate-slide-up
                ${t.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
              `}
            >
              {t.type === 'success' ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${t.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {t.message}
              </span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
