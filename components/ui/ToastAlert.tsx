'use client';

import { useEffect } from 'react';
import { Alert } from './Alert';

interface ToastAlertProps {
  title: string;
  description?: string;
  onClose?: () => void;
  autoCloseMs?: number;
}

export function ToastAlert({ title, description, onClose, autoCloseMs = 5000 }: ToastAlertProps) {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
  }, [onClose, title, description, autoCloseMs]);

  return (
    <div className="fixed top-[88px] right-8 z-[60] w-[min(400px,calc(100vw-300px))] pointer-events-auto">
      <Alert title={title} description={description} onClose={onClose} />
    </div>
  );
}
