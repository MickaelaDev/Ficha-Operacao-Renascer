import { useCallback, useState } from 'react';
import { uid } from '../lib/sheet.js';

const TOAST_TTL = 3400;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((message, variant = 'info') => {
    const id = uid('toast');
    setToasts((list) => [...list.slice(-2), { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((toast) => toast.id !== id));
    }, TOAST_TTL);
  }, []);

  return { toasts, push, dismiss };
}
