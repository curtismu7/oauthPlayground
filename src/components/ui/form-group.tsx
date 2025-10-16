import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  row?: boolean;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, row = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mb-4',
          row ? 'flex items-center space-x-4' : 'space-y-2',
          className
        )}
        {...props}
      />
    );
  }
);

FormGroup.displayName = 'FormGroup';

export { FormGroup };
