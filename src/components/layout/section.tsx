import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: 'default' | 'sm' | 'lg' | 'xl';
  className?: string;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, as: Component = 'section', size = 'default', ...props }, ref) => {
    const sizeClasses = {
      default: 'py-12 md:py-16',
      sm: 'py-8 md:py-12',
      lg: 'py-16 md:py-20',
      xl: 'py-20 md:py-24',
    };

    return (
      <Component
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    );
  }
);

Section.displayName = 'Section';

export { Section };
