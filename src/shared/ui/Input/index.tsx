import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-4 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-[var(--primary)]">
              {icon}
            </div>
          )}
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type={type}
            className={cn(
              'flex h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm text-[var(--foreground)] placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm group-hover:border-slate-400 dark:group-hover:border-slate-700',
              icon && 'pl-12',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...(props as any)}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs font-bold text-red-500 ml-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
