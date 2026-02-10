/**
 * @file ProductionSpinnerWrapper.tsx
 * @module components/common
 * @description Higher-order component for Production apps with spinner support
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import type { CommonSpinnerConfig, ProductionSpinnerWrapperProps } from '@/types/spinner';
import { CommonSpinner } from './CommonSpinner';

/**
 * Higher-order component that wraps Production apps with consistent spinner behavior
 * Provides automatic spinner management and consistent loading states
 */
export const ProductionSpinnerWrapper: React.FC<ProductionSpinnerWrapperProps> = ({
	appId,
	children,
	fallbackMessage = 'Loading...',
	customTheme = 'blue',
	onSpinnerShow,
	onSpinnerHide,
}) => {
	const { spinnerState, isLoading } = useProductionSpinner(appId, {
		theme: customTheme,
		type: 'modal',
		allowDismiss: false,
	});

	// Call callbacks when spinner state changes
	useEffect(() => {
		if (spinnerState.show && onSpinnerShow) {
			const config: CommonSpinnerConfig = {
				message: spinnerState.message,
				type: spinnerState.type,
				theme: spinnerState.theme,
				size: spinnerState.size || 'md',
			};

			if (spinnerState.progress !== undefined) {
				config.progress = spinnerState.progress;
			}

			if (spinnerState.allowDismiss !== undefined) {
				config.allowDismiss = spinnerState.allowDismiss;
			}

			onSpinnerShow(config);
		} else if (!spinnerState.show && onSpinnerHide) {
			onSpinnerHide();
		}
	}, [spinnerState, onSpinnerShow, onSpinnerHide]);

	return (
		<>
			{children}

			{isLoading && (
				<CommonSpinner
					message={spinnerState.message || fallbackMessage}
					size={spinnerState.size || 'md'}
					theme={spinnerState.theme || customTheme}
					variant={spinnerState.type || 'modal'}
					showProgress={spinnerState.progress !== undefined}
					progress={spinnerState.progress || 0}
					allowDismiss={spinnerState.allowDismiss || false}
				/>
			)}
		</>
	);
};

/**
 * Higher-order component function for easy wrapping
 */
export const withProductionSpinner = <P extends object>(
	Component: React.ComponentType<P>,
	appId: string,
	spinnerConfig?: Partial<{
		fallbackMessage: string;
		customTheme: 'blue' | 'green' | 'orange' | 'purple';
		onSpinnerShow: (config: CommonSpinnerConfig) => void;
		onSpinnerHide: () => void;
	}>
) => {
	const WrappedComponent = (props: P) => {
		return (
			<ProductionSpinnerWrapper
				appId={appId}
				fallbackMessage={spinnerConfig?.fallbackMessage || 'Loading...'}
				customTheme={spinnerConfig?.customTheme || 'blue'}
				onSpinnerShow={spinnerConfig?.onSpinnerShow || (() => {})}
				onSpinnerHide={spinnerConfig?.onSpinnerHide || (() => {})}
			>
				<Component {...props} />
			</ProductionSpinnerWrapper>
		);
	};

	WrappedComponent.displayName = `withProductionSpinner(${Component.displayName || Component.name})`;

	return WrappedComponent;
};

export default ProductionSpinnerWrapper;
