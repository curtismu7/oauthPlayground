import * as React from 'react';
import { cn } from '../../lib/utils';

export interface GeneratedContentBoxProps extends React.HTMLAttributes<HTMLDivElement> {
	as?: React.ElementType;
	title?: string;
	actions?: React.ReactNode;
	className?: string;
	contentClassName?: string;
}

const GeneratedContentBox = React.forwardRef<HTMLDivElement, GeneratedContentBoxProps>(
	(
		{ as: Component = 'div', title, actions, children, className, contentClassName, ...props },
		ref
	) => {
		return (
			<Component
				ref={ref}
				className={cn('bg-card rounded-lg border overflow-hidden', className)}
				{...props}
			>
				{(title || actions) && (
					<div className="px-4 py-3 border-b flex items-center justify-between bg-muted/10">
						{title && <h3 className="text-sm font-medium">{title}</h3>}
						{actions && <div className="flex items-center space-x-2">{actions}</div>}
					</div>
				)}
				<div className={cn('p-4 overflow-auto', contentClassName)}>{children}</div>
			</Component>
		);
	}
);

GeneratedContentBox.displayName = 'GeneratedContentBox';

export { GeneratedContentBox };
