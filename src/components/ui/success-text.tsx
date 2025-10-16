import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SuccessTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: React.ElementType;
}

const SuccessText = React.forwardRef<HTMLParagraphElement, SuccessTextProps>(
  ({ className, as: Component = 'p', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('text-sm font-medium text-green-600 dark:text-green-400', className)}
        {...props}
      />
    );
  }
);

SuccessText.displayName = 'SuccessText';

export { SuccessText };
