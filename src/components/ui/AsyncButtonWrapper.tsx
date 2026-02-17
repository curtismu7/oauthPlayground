/**
 * @file AsyncButtonWrapper.tsx
 * @module components/ui
 * @description Wrapper component that adds ButtonSpinner behavior to any button
 * @version 1.0.0
 */

import React from 'react';
import { ButtonSpinner } from './ButtonSpinner';

interface AsyncButtonWrapperProps {
	children: React.ReactNode;
	isLoading: boolean;
	loadingText?: string;
	spinnerSize?: number;
	spinnerPosition?: 'left' | 'right' | 'center';
	disabled?: boolean;
	className?: string;
	style?: React.CSSProperties;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	// Pass through any button props
	[key: string]: any;
}

/**
 * A wrapper that automatically adds ButtonSpinner behavior to any existing button
 * without breaking the current implementation.
 */
export const AsyncButtonWrapper: React.FC<AsyncButtonWrapperProps> = ({
	children,
	isLoading,
	loadingText = 'Loading...',
	spinnerSize = 16,
	spinnerPosition = 'left',
	disabled,
	className = '',
	style,
	onClick,
	...buttonProps
}) => {
	// If loading, use ButtonSpinner, otherwise render original button
	if (isLoading) {
		return (
			<ButtonSpinner
				loading={true}
				onClick={onClick}
				disabled={disabled}
				spinnerSize={spinnerSize}
				spinnerPosition={spinnerPosition}
				loadingText={loadingText}
				className={className}
				style={style}
				{...buttonProps}
			>
				{children}
			</ButtonSpinner>
		);
	}

	// When not loading, render the original button unchanged
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={className}
			style={style}
			{...buttonProps}
		>
			{children}
		</button>
	);
};

/**
 * Higher-order component to wrap existing button implementations
 */
export const withAsyncButton = <P extends object>(
	ButtonComponent: React.ComponentType<P>
) => {
	const WrappedComponent = ({
		isLoading,
		loadingText,
		spinnerSize,
		spinnerPosition,
		...props
	}: P & {
		isLoading?: boolean;
		loadingText?: string;
		spinnerSize?: number;
		spinnerPosition?: 'left' | 'right' | 'center';
	}) => {
		if (isLoading) {
			return (
				<ButtonSpinner
					loading={true}
					onClick={(props as any).onClick}
					disabled={(props as any).disabled}
					spinnerSize={spinnerSize || 16}
					spinnerPosition={spinnerPosition || 'left'}
					loadingText={loadingText || 'Loading...'}
					className={(props as any).className}
					style={(props as any).style}
				>
					{(props as any).children}
				</ButtonSpinner>
			);
		}

		return <ButtonComponent {...(props as P)} />;
	};

	WrappedComponent.displayName = `withAsyncButton(${
		ButtonComponent.displayName || ButtonComponent.name || 'Component'
	})`;

	return WrappedComponent;
};
