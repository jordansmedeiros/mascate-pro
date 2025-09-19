import React from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  AlertCircle 
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

// Funções utilitárias para diferentes tipos de toast
export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },
  
  error: (message: string) => {
    toast.error(message);
  },
  
  warning: (message: string) => {
    toast(message, {
      icon: <AlertTriangle className="h-5 w-5 text-mascate-yellow" />,
      style: {
        border: '1px solid #F59E0B',
        background: '#FFFBEB',
        color: '#92400E',
      },
    });
  },
  
  info: (message: string) => {
    toast(message, {
      icon: <Info className="h-5 w-5 text-blue-500" />,
      style: {
        border: '1px solid #3B82F6',
        background: '#EFF6FF',
        color: '#1E40AF',
      },
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message);
  },
  
  // Função para atualizar um toast de loading
  updateLoading: (toastId: string, type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      toast.success(message, { id: toastId });
    } else {
      toast.error(message, { id: toastId });
    }
  },
  
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  }
};

// Componente de confirmação personalizado
interface ConfirmToastProps {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger';
}

const ConfirmToastContent: React.FC<ConfirmToastProps> = ({
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  const handleConfirm = () => {
    onConfirm();
    toast.dismiss();
  };

  const handleCancel = () => {
    onCancel();
    toast.dismiss();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        {type === 'danger' ? (
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-mascate-yellow flex-shrink-0 mt-0.5" />
        )}
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
      </div>
      <div className="flex space-x-2 justify-end">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors ${
            type === 'danger' 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-mascate-green hover:bg-green-700'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

// Função para mostrar toast de confirmação
export const showConfirmToast = (options: {
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger';
}): Promise<boolean> => {
  return new Promise((resolve) => {
    const handleConfirm = () => resolve(true);
    const handleCancel = () => resolve(false);

    toast(
      () => (
        <ConfirmToastContent
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          type={options.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ),
      {
        duration: Infinity, // Não remove automaticamente
        style: {
          maxWidth: '500px',
          padding: '16px',
          border: options.type === 'danger' ? '1px solid #EF4444' : '1px solid #F59E0B',
          background: options.type === 'danger' ? '#FEF2F2' : '#FFFBEB',
        }
      }
    );
  });
};