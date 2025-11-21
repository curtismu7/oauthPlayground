import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ContentWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
	as?: React.ElementType;
}

const ContentWrapper = React.forwardRef<HTMLDivElement, ContentWrapperProps>(
	({ className, as: Component = 'div', ...props }, ref) => {
		return <Component ref={ref} className={cn('w-full', className)} {...props} />;
	}
);

ContentWrapper.displayName = 'ContentWrapper';

export { ContentWrapper };
