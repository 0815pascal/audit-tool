import { useContext } from 'react';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { createContextHook } from '../types';

/**
 * Hook to use toast notifications
 * @returns Toast context with showToast function
 */
export const useToast = createContextHook<ToastContextType>(
  useContext,
  ToastContext,
  'useToast'
); 