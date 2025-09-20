import React from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Info,
  X
} from 'lucide-react';

// Toast personalizado com design da aplicação
export const CustomToaster: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Configurações globais
        duration: 4000,
        style: {
          background: 'white',
          color: '#374151',
          border: '1px solid #E5E7EB',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          fontSize: '14px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '400px',
        },
        // Configurações por tipo
        success: {
          duration: 3000,
          style: {
            border: '1px solid #10B981',
            background: '#F0FDF4',
            color: '#065F46',
          },
        },
        error: {
          duration: 5000,
          style: {
            border: '1px solid #EF4444',
            background: '#FEF2F2',
            color: '#991B1B',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ message }) => (
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0">
                {t.type === 'success' && (
                  <CheckCircle className="h-5 w-5 text-mascate-green" />
                )}
                {t.type === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {t.type === 'loading' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-mascate-green border-t-transparent" />
                )}
                {!t.type && <Info className="h-5 w-5 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{message}</div>
              </div>
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Fechar notificação"
                  title="Fechar"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};