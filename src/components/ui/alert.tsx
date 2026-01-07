import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const classNames = (...values: Array<string | undefined>): string =>
	values.filter(Boolean).join(' ');

export const Alert: React.FC<DivProps> = ({ children, className, ...props }) => (
	<div
		className={classNames(
			'rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900',
			className
		)}
		role="alert"
		{...props}
	>
		{children}
	</div>
);

export const AlertDescription: React.FC<DivProps> = ({ children, className, ...props }) => (
	<div className={classNames('mt-1 leading-relaxed', className)} {...props}>
		{children}
	</div>
);

export default Alert;
