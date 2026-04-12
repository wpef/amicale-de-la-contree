'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'error' | 'success';
  duration?: number;
  onDismiss: () => void;
}

const typeClasses = {
  info: 'border-border bg-surface',
  error: 'border-accent-red bg-accent-red/10',
  success: 'border-accent-green bg-accent-green/10',
};

export function Toast({ message, type = 'info', duration = 3000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-text shadow-lg transition-opacity duration-300 ${typeClasses[type]} ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {message}
    </div>
  );
}
