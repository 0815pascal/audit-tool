/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';
import { ToastType, ToastData, ContextProviderProps } from '../types';
import { TOAST_TYPE } from '../enums';

// Define the context type
export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

// Create and export the context
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Export only the provider component
export const ToastProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: ToastType = TOAST_TYPE.SUCCESS) => {
    setToast({ message, type });
  }, []);

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
};

// Import the hook from the dedicated file to avoid Fast Refresh warnings
import { useToast } from '../hooks/useToast';
export { useToast }; 