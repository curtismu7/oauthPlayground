import React from 'react';
import { Spinner } from './Spinner';

interface ButtonSpinnerProps {
	loading: boolean;
	children: React.ReactNode;
	disabled?: boolean;
	spinnerSize?: number;
	spinnerPosition?: 'left' | 'right' | 'center';
	loadingText?: string;
	className?: string;
	style?: React.CSSProperties;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({
	loading,
	children,
	disabled,
	spinnerSize = 16,
	spinnerPosition = 'left',
	loadingText,
	className = '',
	style,
	onClick,
	...buttonProps
}) => {
	const renderContent = () => {
		if (!loading) return children;

		if (spinnerPosition === 'center') {
			return (
				<>
					<Spinner size={spinnerSize} />
					{loadingText && <span style={{ marginLeft: 8 }}>{loadingText}</span>}
				</>
			);
		}

		return (
			<>
				{spinnerPosition === 'left' && <Spinner size={spinnerSize} />}
				{loadingText ? (
					<span style={{ marginLeft: spinnerPosition === 'left' ? 8 : 0 }}>{loadingText}</span>
				) : (
					children
				)}
				{spinnerPosition === 'right' && <Spinner size={spinnerSize} />}
			</>
		);
	};

	return (
		<button
			type="button"
			className={className}
			style={style}
			disabled={disabled || loading}
			onClick={onClick}
			{...buttonProps}
		>
			{renderContent()}
		</button>
	);
};

export default ButtonSpinner;
