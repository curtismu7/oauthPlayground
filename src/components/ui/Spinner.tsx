import React from 'react';

interface SpinnerProps {
	size?: number;
	variant?: 'spin' | 'pulse' | 'dots';
	color?: string;
	className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
	size = 16,
	variant = 'spin',
	color = 'currentColor',
	className = '',
}) => {
	const getIcon = () => {
		switch (variant) {
			case 'pulse':
				return <span>🔄</span>;
			case 'dots':
				return <span>❓</span>;
			default:
				return <span>🔄</span>;
		}
	};

	return (
		<output
			className={`spinner spinner--${variant} ${className}`}
			style={{
				width: size,
				height: size,
				color,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'transparent',
			}}
		>
			{getIcon()}
		</output>
	);
};

// Predefined spinner sizes for consistency
export const SmallSpinner = (props: Omit<SpinnerProps, 'size'>) => <Spinner size={12} {...props} />;

export const MediumSpinner = (props: Omit<SpinnerProps, 'size'>) => (
	<Spinner size={16} {...props} />
);

export const LargeSpinner = (props: Omit<SpinnerProps, 'size'>) => <Spinner size={24} {...props} />;

export const FullSpinner = (props: Omit<SpinnerProps, 'size'>) => <Spinner size={32} {...props} />;

export default Spinner;
