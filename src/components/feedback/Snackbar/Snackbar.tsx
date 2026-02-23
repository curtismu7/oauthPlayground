/**
 * @file Snackbar.tsx
 * @module components/feedback/Snackbar
 * @description Snackbar component for brief process feedback
 * @version 9.3.6
 * @since 2026-02-23
 *
 * Provides Material Design-compliant snackbars for brief confirmations,
 * process feedback, and quick notifications. Replaces toast notifications
 * with better UX patterns and accessibility.
 *
 * @example
 * <Snackbar
 *   message="Configuration saved"
 *   type="success"
 *   action={{ label: 'Undo', onClick: handleUndo }}
 *   duration={4000}
 * />
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	title?: string;
}> = ({ icon, size = 16, title }) => {
	const iconClass = getMDIIconClass(icon);
	return <i className={`mdi ${iconClass}`} style={{ fontSize: `${size}px` }} title={title} />;
};

// Helper function to map Fi icons to MDI icons
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiCheckCircle: 'mdi-check-circle',
		FiInfo: 'mdi-information',
		FiAlertTriangle: 'mdi-alert-triangle',
		FiX: 'mdi-close',
		FiRefreshCw: 'mdi-refresh',
		FiDownload: 'mdi-download',
		FiCopy: 'mdi-content-copy',
	};
	return iconMap[fiIcon] || fiIcon.replace('Fi', '').toLowerCase();
};

// Styled components
const SnackbarContainer = styled.div<{
	$type: 'success' | 'info' | 'warning';
	$isVisible: boolean;
}>`
	position: fixed;
	bottom: var(--ping-spacing-lg, 1.5rem);
	left: 50%;
	transform: translateX(-50%) translateY(${(props) => (props.$isVisible ? '0' : '100px')});
	opacity: ${(props) => (props.$isVisible ? 1 : 0)};
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	z-index: 1000;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.5rem);
	padding: var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem);
	border-radius: var(--ping-border-radius-md, 8px);
	background: var(--ping-surface-elevated, #ffffff);
	border: 1px solid var(--ping-border-color, #e5e7eb);
	box-shadow: var(--ping-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
	color: var(--ping-text-primary, #1a1a1a);
	font-size: var(--ping-font-size-sm, 0.875rem);
	line-height: 1.5;
	min-width: 300px;
	max-width: 600px;

	&:hover {
		box-shadow: var(--ping-shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
	}
`;

const IconContainer = styled.div<{ $type: 'success' | 'info' | 'warning' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	color: ${(props) => {
		switch (props.$type) {
			case 'success':
				return 'var(--ping-success-color, #059669)';
			case 'warning':
				return 'var(--ping-warning-color, #d97706)';
			case 'info':
				return 'var(--ping-info-color, #1d4ed8)';
			default:
				return 'var(--ping-primary-color, #3b82f6)';
		}
	}};
`;

const MessageContainer = styled.div`
	flex: 1;
	min-width: 0;
`;

const ActionsContainer = styled.div`
	display: flex;
	gap: var(--ping-spacing-sm, 0.5rem);
	align-items: center;
	flex-shrink: 0;
`;

const ActionButton = styled.button`
	padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem);
	border: 1px solid var(--ping-border-color, #e5e7eb);
	border-radius: var(--ping-border-radius-sm, 4px);
	background: var(--ping-surface-primary, #ffffff);
	color: var(--ping-primary-color, #3b82f6);
	font-size: var(--ping-font-size-xs, 0.75rem);
	font-weight: 500;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-primary-color, #3b82f6);
		color: var(--ping-surface-primary, #ffffff);
		border-color: var(--ping-primary-color, #3b82f6);
	}

	&:focus {
		outline: 2px solid var(--ping-primary-color, #3b82f6);
		outline-offset: 2px;
	}
`;

const DismissButton = styled.button`
	background: none;
	border: none;
	color: var(--ping-text-secondary, #6b7280);
	cursor: pointer;
	padding: var(--ping-spacing-xs, 0.25rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-surface-secondary, #f9fafb);
		color: var(--ping-text-primary, #1a1a1a);
	}

	&:focus {
		outline: 2px solid var(--ping-primary-color, #3b82f6);
		outline-offset: 2px;
	}
`;

// Props interface
export interface SnackbarProps {
	message: string;
	type: 'success' | 'info' | 'warning';
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
	onDismiss?: () => void;
	manualDismiss?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

// Main component
export const Snackbar: React.FC<SnackbarProps> = ({
	message,
	type,
	duration = 4000,
	action,
	onDismiss,
	manualDismiss = false,
	className,
	style,
}) => {
	const [isVisible, setIsVisible] = useState(false);

	const handleDismiss = useCallback(() => {
		setIsVisible(false);
		// Call onDismiss after exit animation
		setTimeout(() => {
			onDismiss?.();
		}, 150); // Match transition duration
	}, [onDismiss]);

	useEffect(() => {
		// Trigger entrance animation
		setIsVisible(true);

		// Auto-dismiss logic
		if (!manualDismiss && duration > 0) {
			const timer = setTimeout(() => {
				handleDismiss();
			}, duration);

			return () => clearTimeout(timer);
		}
		
		// Return empty cleanup function for manual dismiss case
		return () => {};
	}, [duration, manualDismiss, handleDismiss]);

	const getIcon = () => {
		switch (type) {
			case 'success':
				return 'FiCheckCircle';
			case 'warning':
				return 'FiAlertTriangle';
			case 'info':
				return 'FiInfo';
			default:
				return 'FiInfo';
		}
	};

	return (
		<div className={`end-user-nano ${className || ''}`} style={style}>
			<SnackbarContainer
				$type={type}
				$isVisible={isVisible}
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				<IconContainer $type={type}>
					<MDIIcon icon={getIcon()} size={16} title={`${type} notification`} />
				</IconContainer>
				<MessageContainer>{message}</MessageContainer>
				{(action || manualDismiss) && (
					<ActionsContainer>
						{action && (
							<ActionButton
								type="button"
								onClick={action.onClick}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										action.onClick();
									}
								}}
							>
								{action.label}
							</ActionButton>
						)}
						{manualDismiss && (
							<DismissButton
								onClick={handleDismiss}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleDismiss();
									}
								}}
								title="Dismiss notification"
							>
								<MDIIcon icon="FiX" size={12} title="Dismiss" />
							</DismissButton>
						)}
					</ActionsContainer>
				)}
			</SnackbarContainer>
		</div>
	);
};

export default Snackbar;
