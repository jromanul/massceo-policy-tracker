'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  asChild?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

// Commonwealth-style buttons: navy primary, restrained neutrals for the rest.
// Rounded 4 px (not pill), 1 px ring on focus for institutional precision.
const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--ma-navy)] text-white hover:bg-[var(--ma-navy-deep)] focus:ring-[var(--ma-blue)]',
  secondary:
    'bg-[var(--muted)] text-[var(--ma-navy-ink)] hover:bg-[#e9ecf3] focus:ring-[var(--ma-blue)]',
  outline:
    'border border-[var(--border-strong)] bg-white text-[var(--ma-navy-ink)] hover:bg-[var(--muted)] focus:ring-[var(--ma-blue)]',
  ghost:
    'bg-transparent text-[var(--ma-navy-ink)] hover:bg-[var(--muted)] focus:ring-[var(--ma-blue)]',
  destructive:
    'bg-[#8b2a1f] text-white hover:bg-[#751f14] focus:ring-[#a6493e]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  asChild = false,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[3px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
