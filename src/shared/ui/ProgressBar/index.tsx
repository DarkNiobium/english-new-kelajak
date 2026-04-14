import * as React from 'react';
import { cn } from '@/shared/lib/utils';
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
            showGlow && 'shadow-[0_0_15px_rgba(99,102,241,0.5)]',
            indicatorColor
          )}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {showGlow && (
            <div className="absolute top-0 right-0 h-full w-4 bg-white/30 blur-sm" />
          )}
        </motion.div>
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
