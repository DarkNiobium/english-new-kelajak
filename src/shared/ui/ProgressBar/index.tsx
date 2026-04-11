import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, indicatorColor, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800', className)}
        {...props}
      >
        <motion.div
          className={cn('h-full bg-[var(--primary)]', indicatorColor)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
