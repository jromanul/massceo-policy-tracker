import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

/**
 * Commonwealth-style card: white surface, single-pixel hairline border
 * using the institutional gray, no drop shadow. Designed to screenshot
 * cleanly into a briefing deck.
 */
export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[4px] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-[var(--border)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }: CardProps) {
  return (
    <h3
      className={`text-[15px] font-semibold text-[var(--ma-navy-ink)] tracking-tight ${className}`}
      {...(rest as HTMLAttributes<HTMLHeadingElement>)}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...rest }: CardProps) {
  return (
    <p
      className={`mt-1 text-sm text-[var(--foreground-muted)] leading-relaxed ${className}`}
      {...(rest as HTMLAttributes<HTMLParagraphElement>)}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`px-6 py-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-[var(--border)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
