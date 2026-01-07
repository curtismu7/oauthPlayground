import React from 'react';

type SpanProps = React.HTMLAttributes<HTMLSpanElement>;

const classNames = (...values: Array<string | undefined>): string =>
	values.filter(Boolean).join(' ');

interface BadgeProps extends SpanProps {
	variant?: 'default' | 'outline' | 'secondary';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
	default: 'bg-blue-600 text-white',
	outline: 'border border-blue-600 text-blue-700',
	secondary: 'bg-gray-200 text-gray-800',
};

export const Badge: React.FC<BadgeProps> = ({
	children,
	className,
	variant = 'default',
	...props
}) => (
	<span
		className={classNames(
			'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
			variantClasses[variant],
			className
		)}
		{...props}
	>
		{children}
	</span>
);

export default Badge;
