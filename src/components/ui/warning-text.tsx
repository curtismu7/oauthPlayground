import * as React from 'react';
import { cn } from '../../lib/utils';

export interface WarningTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
	as?: React.ElementType;
}

const WarningText = React.forwardRef<HTMLParagraphElement, WarningTextProps>(
	({ className, as: Component = 'p', ...props }, ref) => {
		return (
			<Component
				ref={ref}
				className={cn('text-sm font-medium text-amber-600 dark:text-amber-400', className)}
				{...props}
			/>
		);
	}
);

WarningText.displayName = 'WarningText';

export { WarningText };
