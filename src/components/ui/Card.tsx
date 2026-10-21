import { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${
        hoverable
          ? 'transition-all duration-300 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
