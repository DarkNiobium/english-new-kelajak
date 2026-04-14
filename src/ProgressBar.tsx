import * as React from 'react';
import { cn } from '@/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
  showGlow?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, indicatorColor, showGlow = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
        {...props}
      >
        <motion.div
          className={cn(
            'h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] relative',
            indicatorColor
          )}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
        </motion.div>
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
