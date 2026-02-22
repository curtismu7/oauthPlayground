/**
 * @file LoadingSpinnerModalV8U.PingUI.tsx
 * @module apps/oauth/components
 * @description Reusable loading spinner modal component with backdrop - Ping UI Version
 * @version 8.0.0
 *
 * Based on the SPIFFE flow spinner design, but with configurable colors.
 * Used for showing loading states during API calls and async operations.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';

interface LoadingSpinnerModalV8UProps {
	/** Whether to show the modal */
	show: boolean;
	/** Message to display */
	message: string;
	/** Optional icon component (defaults to MDI loader) */
	icon?: React.ReactNode;
	/** Color theme: 'blue' (default), 'green', 'orange', 'purple' */
	theme?: 'blue' | 'green' | 'orange' | 'purple';
}

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	const iconClass = icon.startsWith('mdi-') ? icon : `mdi-${icon}`;
	return (
		<i
			className={`mdi ${iconClass} ${className}`}
			style={{ fontSize: `${size}px` }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

const getBackdropStyle = () => ({
	position: 'fixed' as const,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'rgba(0, 0, 0, 0.5)',
	zIndex: 10001,
	animation: 'fadeIn 0.3s ease-out',
});

const getModalStyle = (theme: 'blue' | 'green' | 'orange' | 'purple') => {
	let background;
	switch (theme) {
		case 'green':
			background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			break;
		case 'orange':
			background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			break;
		case 'purple':
			background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
			break;
		default:
			background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
	}

	return {
		position: 'fixed' as const,
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		background,
		color: 'white',
		padding: '2rem 3rem',
		borderRadius: '1rem',
		fontSize: '1.5rem',
		fontWeight: '700',
		boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
		zIndex: 10002,
		animation: 'phaseSlideIn 0.5s ease-out',
		display: 'flex',
		alignItems: 'center' as const,
		gap: '1rem',
		transition: 'all 0.15s ease-in-out',
	};
};

export const LoadingSpinnerModalV8U: React.FC<LoadingSpinnerModalV8UProps> = ({
	show,
	message,
	icon,
	theme = 'blue',
}) => {
	if (!show) return null;

	return (
		<div className="end-user-nano">
			<style>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				@keyframes phaseSlideIn {
					from {
						opacity: 0;
						transform: translate(-50%, -50%) scale(0.8);
					}
					to {
						opacity: 1;
						transform: translate(-50%, -50%) scale(1);
					}
				}

				@keyframes spin {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}

				.mdi-spinning {
					animation: spin 1s linear infinite;
					font-size: 2rem;
				}
			`}</style>
			<div style={getBackdropStyle()} />
			<div style={getModalStyle(theme)}>
				{icon || <MDIIcon icon="loading" className="mdi-spinning" aria-hidden={true} />}
				{message}
			</div>
		</div>
	);
};

export default LoadingSpinnerModalV8U;
