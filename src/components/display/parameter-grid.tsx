import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ParameterGridProps extends React.HTMLAttributes<HTMLDivElement> {
	as?: React.ElementType;
	className?: string;
}

const ParameterGrid = React.forwardRef<HTMLDivElement, ParameterGridProps>(
	({ className, as: Component = 'div', ...props }, ref) => (
		<Component
			ref={ref}
			className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}
			{...props}
		/>
	)
);

ParameterGrid.displayName = 'ParameterGrid';

export { ParameterGrid };

export interface ParameterLabelProps extends React.HTMLAttributes<HTMLDivElement> {
	as?: React.ElementType;
	className?: string;
}

export const ParameterLabel = React.forwardRef<HTMLDivElement, ParameterLabelProps>(
	({ className, as: Component = 'div', ...props }, ref) => (
		<Component
			ref={ref}
			className={cn('text-sm font-medium text-muted-foreground', className)}
			{...props}
		/>
	)
);

ParameterLabel.displayName = 'ParameterLabel';

export interface ParameterValueProps extends React.HTMLAttributes<HTMLDivElement> {
	as?: React.ElementType;
	className?: string;
	monospace?: boolean;
}

export const ParameterValue = React.forwardRef<HTMLDivElement, ParameterValueProps>(
	({ className, monospace = true, as: Component = 'div', ...props }, ref) => (
		<Component
			ref={ref}
			className={cn('text-sm', monospace && 'font-mono', className)}
			{...props}
		/>
	)
);

ParameterValue.displayName = 'ParameterValue';
