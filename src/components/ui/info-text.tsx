import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InfoTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
	as?: React.ElementType;
}

const InfoText = React.forwardRef<HTMLParagraphElement, InfoTextProps>(
	({ className, as: Component = 'p', ...props }, ref) => {
		return (
			<Component ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
		);
	}
);

InfoText.displayName = 'InfoText';

export { InfoText };
