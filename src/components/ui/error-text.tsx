import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
	as?: React.ElementType;
}

const ErrorText = React.forwardRef<HTMLParagraphElement, ErrorTextProps>(
	({ className, as: Component = 'p', ...props }, ref) => {
		return (
			<Component
				ref={ref}
				className={cn('text-sm font-medium text-destructive', className)}
				{...props}
			/>
		);
	}
);

ErrorText.displayName = 'ErrorText';

export { ErrorText };
