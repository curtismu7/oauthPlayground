import * as React from 'react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconTone = 'default' | 'muted' | 'danger' | 'success' | 'warning' | 'info';

const sizeToEm: Record<IconSize, string> = {
	xs: '0.75em',
	sm: '0.875em',
	md: '1em',
	lg: '1.25em',
	xl: '1.5em',
};

const toneToClass: Record<IconTone, string> = {
	default: '',
	muted: 'text-muted',
	danger: 'text-danger',
	success: 'text-success',
	warning: 'text-warning',
	info: 'text-info',
};

export type IconProps = {
	name: string; // token without prefix, e.g. "check-circle"
	size?: IconSize;
	tone?: IconTone;

	decorative?: boolean; // default true
	label?: string; // required if decorative=false

	title?: string;
	className?: string;
	style?: React.CSSProperties;
	'data-testid'?: string;
	as?: 'i' | 'span';
};

export function Icon({
	name,
	size = 'md',
	tone = 'default',
	decorative = true,
	label,
	title,
	className,
	style,
	as = 'i',
	...rest
}: IconProps) {
	if (!decorative && !label && process.env.NODE_ENV !== 'production') {
		// Fail fast in dev

		console.error(`Icon("${name}") requires 'label' when decorative={false}`);
	}

	const classes = ['mdi', `mdi-${name}`, toneToClass[tone], className].filter(Boolean).join(' ');

	const a11yProps = decorative
		? { 'aria-hidden': true as const }
		: { role: 'img' as const, 'aria-label': label || '' };

	const Comp = as;

	return (
		<Comp
			className={classes}
			title={title}
			{...a11yProps}
			{...rest}
			style={{
				display: 'inline-block',
				lineHeight: 1,
				verticalAlign: '-0.125em',
				fontSize: sizeToEm[size],
				...style,
			}}
		/>
	);
}
