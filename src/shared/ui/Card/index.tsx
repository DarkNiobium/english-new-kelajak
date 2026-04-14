import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { glass?: boolean; hoverable?: boolean }>(
  ({ className, glass, hoverable, ...props }, ref) => {
    const Component = hoverable ? motion.div : 'div';
    const motionProps = hoverable ? { 
      whileHover: { y: -8, scale: 1.01 },
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    } : {};

    return (
      <Component
        ref={ref as any}
        className={cn(
          'rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm overflow-hidden transition-all duration-300',
          glass && 'glass',
          hoverable && 'hover:shadow-2xl hover:shadow-primary/10 cursor-pointer bento-card',
          className
        )}
        {...motionProps}
        {...(props as any)}
      />
    );  
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-8', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-bold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-base text-slate-500 font-medium leading-relaxed', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-8 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-8 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
