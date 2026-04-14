import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import { motion } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 duration-200',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-white hover:opacity-90 shadow-sm',
        accent: 'bg-[var(--accent)] text-white hover:opacity-90 shadow-sm',
        outline: 'border-2 border-[var(--border)] bg-transparent hover:bg-white/5 text-[var(--foreground)]',
        secondary: 'bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--border)]',
        ghost: 'hover:bg-white/5 text-[var(--foreground)]',
        glass: 'glass text-[var(--foreground)] hover:bg-white/10 border-[var(--border)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-8 py-2',
        sm: 'h-10 rounded-xl px-4 text-xs',
        lg: 'h-14 rounded-xl px-10 text-base',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
