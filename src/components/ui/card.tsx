import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-slate-200 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...rest }: CardProps) {
  return (
    <h3
      className={`text-base font-semibold text-slate-900 ${className}`}
      {...(rest as HTMLAttributes<HTMLHeadingElement>)}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...rest }: CardProps) {
  return (
    <p
      className={`mt-1 text-sm text-slate-500 ${className}`}
      {...(rest as HTMLAttributes<HTMLParagraphElement>)}
    >
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-slate-200 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
