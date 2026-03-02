// V9 Flow Restart Button Component
// Provides consistent restart functionality for all stepper flows

import React from 'react';

import { getButtonStyles } from './V9ColorStandards';

interface V9FlowRestartButtonProps {
	onRestart: () => void;
	currentStep: number;
	totalSteps: number;
	disabled?: boolean;
	position?: 'header' | 'footer' | 'inline';
}

export const V9FlowRestartButton: React.FC<V9FlowRestartButtonProps> = ({
	onRestart,
	currentStep,
	totalSteps,
	disabled = false,
	position = 'header',
}) => {
	const handleRestart = () => {
		// Confirm restart if not on first step
		if (currentStep > 0) {
			const confirmMessage = `Are you sure you want to restart the flow? This will reset all progress and return to step 1.`;
			if (window.confirm(confirmMessage)) {
				onRestart();
			}
		} else {
			onRestart();
		}
	};

	const getButtonStyle = () => {
		const baseStyle = {
			...getButtonStyles('danger', disabled),
			fontSize: '0.875rem',
			padding: '0.5rem 1rem',
			display: 'inline-flex',
			alignItems: 'center',
			gap: '0.5rem',
		};

		// Position-specific styling
		switch (position) {
			case 'header':
				return {
					...baseStyle,
					marginBottom: '1rem',
				};
			case 'footer':
				return {
					...baseStyle,
					marginLeft: 'auto',
				};
			case 'inline':
				return {
					...baseStyle,
					margin: '0.5rem 0',
				};
			default:
				return baseStyle;
		}
	};

	const getButtonText = () => {
		if (currentStep === 0) {
			return '↻ Reset Flow';
		}
		return `↻ Restart (Step ${currentStep + 1}/${totalSteps})`;
	};

	return (
		<button
			type="button"
			onClick={handleRestart}
			disabled={disabled}
			style={getButtonStyle()}
			title={
				currentStep > 0
					? `Restart flow from step 1 (currently on step ${currentStep + 1})`
					: 'Reset flow'
			}
		>
			{getButtonText()}
		</button>
	);
};

// Hook for restart functionality
export const useFlowRestart = (resetFunctions: (() => void)[]) => {
	const restartFlow = React.useCallback(() => {
		// Reset all state
		resetFunctions.forEach((resetFn) => {
			resetFn();
		});

		// Show notification (if messaging service is available)
		try {
			// Dynamic import to avoid require issues
			import('./V9ModernMessagingService')
				.then(({ modernMessaging }) => {
					modernMessaging.showBanner({
						type: 'info',
						title: 'Flow Restarted',
						message: 'All progress has been reset. You can start again from step 1.',
						dismissible: true,
					});
				})
				.catch(() => {
					// Silently fail if messaging service is not available
					console.log('Flow restarted');
				});
		} catch {
			// Silently fail if messaging service is not available
			console.log('Flow restarted');
		}
	}, [resetFunctions]);

	return { restartFlow };
};
