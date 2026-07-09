'use client';

interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Small inline loading spinner. */
export function Spinner({ className = '', label }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label && <span>{label}</span>}
    </span>
  );
}

/** Full-screen centered loader for page-level loading states. */
export function PageLoader({ label = 'Chargement...' }: { label?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      <p className="text-text-dim text-sm">{label}</p>
    </main>
  );
}
