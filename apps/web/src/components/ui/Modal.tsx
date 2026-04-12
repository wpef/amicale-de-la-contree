'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-xl border border-border bg-surface p-6 text-text backdrop:bg-black/60"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-gold">{title}</h2>
        <button onClick={onClose} className="text-text-dim hover:text-text">
          &times;
        </button>
      </div>
      {children}
    </dialog>
  );
}
