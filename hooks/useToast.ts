
import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';

export const useToast = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((currentToast) => (currentToast?.id === id ? null : currentToast));
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
};
