import React from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

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