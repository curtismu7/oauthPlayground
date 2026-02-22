/**
 * @file LoadingSpinnerModalV8U.PingUI.tsx
 * @module v8u/components
 * @description Ping UI migrated reusable loading spinner modal component with backdrop
 * @version 8.0.0
 *
 * Based on the SPIFFE flow spinner design, but with configurable colors.
 * Used for showing loading states during API calls and async operations.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
import styled from 'styled-components';

interface LoadingSpinnerModalV8UPingUIProps {
	/** Whether to show the modal */
	show: boolean;
	/** Message to display */
	message: string;
	/** Optional icon component (defaults to MDI spinner) */
	icon?: React.ReactNode;
	/** Color theme: 'blue' (default), 'green', 'orange', 'purple' */
	theme?: 'blue' | 'green' | 'orange' | 'purple';
}

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiLoader: 'mdi-loading',
	};
	return iconMap[iconName] || 'mdi-loading';
};

const Backdrop = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 10001;
	animation: fadeIn var(--ping-transition-medium, 0.3s) ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const Modal = styled.div<{ $theme: 'blue' | 'green' | 'orange' | 'purple' }>`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: ${(props) => {
		switch (props.$theme) {
			case 'green':
				return 'linear-gradient(135deg, var(--ping-success-color, #10b981) 0%, var(--ping-success-dark, #059669) 100%)';
			case 'orange':
				return 'linear-gradient(135deg, var(--ping-warning-color, #f59e0b) 0%, var(--ping-warning-dark, #d97706) 100%)';
			case 'purple':
				return 'linear-gradient(135deg, var(--ping-purple-color, #667eea) 0%, var(--ping-purple-dark, #764ba2) 100%)';
			default:
				return 'linear-gradient(135deg, var(--ping-primary-color, #3b82f6) 0%, var(--ping-primary-hover, #2563eb) 100%)';
		}
	}};
	color: white;
	padding: var(--ping-spacing-xl, 2rem) var(--ping-spacing-xxl, 3rem);
	border-radius: var(--ping-border-radius-lg, 1rem);
	font-size: 1.5rem;
	font-weight: 700;
	box-shadow: var(--ping-shadow-xl, 0 10px 40px rgba(0, 0, 0, 0.3));
	z-index: 10002;
	animation: phaseSlideIn var(--ping-transition-slow, 0.5s) ease-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-md, 1rem);

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

	svg, i {
		font-size: 2rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

export const LoadingSpinnerModalV8UPingUI: React.FC<LoadingSpinnerModalV8UPingUIProps> = ({
	show,
	message,
	icon,
	theme = 'blue',
}) => {
	if (!show) return null;

	return (
		<div className="end-user-nano">
			<Backdrop />
			<Modal $theme={theme}>
				{icon || <MDIIcon icon="FiLoader" size={32} ariaLabel="Loading" />}
				{message}
			</Modal>
		</div>
	);
};

export default LoadingSpinnerModalV8UPingUI;
