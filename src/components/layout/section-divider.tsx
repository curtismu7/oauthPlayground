import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SectionDividerProps extends React.HTMLAttributes<HTMLHRElement> {
	as?: React.ElementType;
	className?: string;
}

const SectionDivider = React.forwardRef<HTMLHRElement, SectionDividerProps>(
	({ className, as: Component = 'hr', ...props }, ref) => {
		return (
			<Component
				ref={ref}
				className={cn('border-t border-gray-200 dark:border-gray-800 my-8', className)}
				{...props}
			/>
		);
	}
);

SectionDivider.displayName = 'SectionDivider';

export { SectionDivider };
