import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gold text-bg hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'bg-surface-raised text-text hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed',
  ghost: 'text-text-dim hover:text-text',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-2 font-semibold transition ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
