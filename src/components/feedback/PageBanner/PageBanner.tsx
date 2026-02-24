/**
 * @file PageBanner.tsx
 * @module components/feedback/PageBanner
 * @description Page banner component for system-wide messages
 * @version 9.3.6
 * @since 2026-02-23
 *
 * Provides persistent page-level banners for system-wide messages,
 * global state issues, and important notifications that apply to
 * the entire page or application.
 *
 * @example
 * <PageBanner
 *   type="warning"
 *   title="Connection Issues Detected"
 *   message="Some features may be unavailable"
 *   dismissible
 *   action={{ label: 'Retry', onClick: handleRetry }}
 * />
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	title?: string;
}> = ({ icon, size = 20, title }) => {
	const iconClass = getMDIIconClass(icon);
	return <i className={`mdi ${iconClass}`} style={{ fontSize: `${size}px` }} title={title} />;
};

// Helper function to map Fi icons to MDI icons
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertCircle: 'mdi-alert-circle',
		FiCheckCircle: 'mdi-check-circle',
		FiInfo: 'mdi-information',
		FiAlertTriangle: 'mdi-alert-triangle',
		FiX: 'mdi-close',
		FiRefreshCw: 'mdi-refresh',
		FiWifiOff: 'mdi-wifi-off',
		FiShield: 'mdi-shield',
		FiClock: 'mdi-clock',
	};
	return iconMap[fiIcon] || fiIcon.replace('Fi', '').toLowerCase();
};

// Styled components
const PageBannerContainer = styled.div<{ $type: 'error' | 'warning' | 'info' | 'success' }>`
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem);
	border-radius: var(--ping-border-radius-md, 8px);
	margin: var(--ping-spacing-md, 1rem) 0;
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-md, 1rem);
	background: ${(props) => {
		switch (props.$type) {
			case 'error':
				return 'var(--ping-error-light, #fef2f2)';
			case 'warning':
				return 'var(--ping-warning-light, #fffbeb)';
			case 'info':
				return 'var(--ping-info-light, #eff6ff)';
			case 'success':
				return 'var(--ping-success-light, #f0fdf4)';
			default:
				return 'var(--ping-surface-secondary, #f9fafb)';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$type) {
			case 'error':
				return 'var(--ping-error-border, #fecaca)';
			case 'warning':
				return 'var(--ping-warning-border, #fed7aa)';
			case 'info':
				return 'var(--ping-info-border, #dbeafe)';
			case 'success':
				return 'var(--ping-success-border, #bbf7d0)';
			default:
				return 'var(--ping-border-color, #e5e7eb)';
		}
	}};
	border-left: 4px solid ${(props) => {
		switch (props.$type) {
			case 'error':
				return 'var(--ping-error-color, #dc2626)';
			case 'warning':
				return 'var(--ping-warning-color, #d97706)';
			case 'info':
				return 'var(--ping-info-color, #1d4ed8)';
			case 'success':
				return 'var(--ping-success-color, #059669)';
			default:
				return 'var(--ping-primary-color, #3b82f6)';
		}
	}};
	color: ${(props) => {
		switch (props.$type) {
			case 'error':
				return 'var(--ping-error-text, #dc2626)';
			case 'warning':
				return 'var(--ping-warning-text, #d97706)';
			case 'info':
				return 'var(--ping-info-text, #1d4ed8)';
			case 'success':
				return 'var(--ping-success-text, #059669)';
			default:
				return 'var(--ping-text-primary, #1a1a1a)';
		}
	}};
	font-size: var(--ping-font-size-sm, 0.875rem);
	line-height: 1.5;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
	}
`;

const IconContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
`;

const ContentContainer = styled.div`
	flex: 1;
	min-width: 0;
`;

const BannerTitle = styled.h3`
	margin: 0 0 var(--ping-spacing-xs, 0.25rem) 0;
	font-size: var(--ping-font-size-base, 1rem);
	font-weight: 600;
	color: var(--ping-text-primary, #1a1a1a);
`;

const BannerMessage = styled.p`
	margin: 0;
	color: var(--ping-text-secondary, #6b7280);
`;

const ActionsContainer = styled.div`
	display: flex;
	gap: var(--ping-spacing-sm, 0.5rem);
	align-items: center;
	flex-shrink: 0;
`;

const ActionButton = styled.button`
	padding: var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem);
	border: 1px solid var(--ping-border-color, #e5e7eb);
	border-radius: var(--ping-border-radius-md, 8px);
	background: var(--ping-surface-primary, #ffffff);
	color: var(--ping-text-primary, #1a1a1a);
	font-size: var(--ping-font-size-sm, 0.875rem);
	font-weight: 500;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-surface-secondary, #f9fafb);
		border-color: var(--ping-border-color-hover, #d1d5db);
	}

	&:focus {
		outline: 2px solid var(--ping-primary-color, #3b82f6);
		outline-offset: 2px;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const DismissButton = styled.button<{ $type: 'error' | 'warning' | 'info' | 'success' }>`
	background: none;
	border: none;
	color: ${(props) => {
		switch (props.$type) {
			case 'error':
				return 'var(--ping-error-text, #dc2626)';
			case 'warning':
				return 'var(--ping-warning-text, #d97706)';
			case 'info':
				return 'var(--ping-info-text, #1d4ed8)';
			case 'success':
				return 'var(--ping-success-text, #059669)';
			default:
				return 'var(--ping-text-primary, #1a1a1a)';
		}
	}};
	cursor: pointer;
	padding: var(--ping-spacing-xs, 0.25rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-surface-secondary, #f9fafb);
	}

	&:focus {
		outline: 2px solid var(--ping-primary-color, #3b82f6);
		outline-offset: 2px;
	}
`;

// Props interface
export interface PageBannerProps {
	type: 'error' | 'warning' | 'info' | 'success';
	title: string;
	message?: string;
	dismissible?: boolean;
	persistent?: boolean;
	action?: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
	};
	className?: string;
	style?: React.CSSProperties;
	role?: 'alert' | 'status';
}

// Main component
export const PageBanner: React.FC<PageBannerProps> = ({
	type,
	title,
	message,
	dismissible = false,
	persistent = false,
	action,
	className,
	style,
	role,
}) => {
	const [isVisible, setIsVisible] = useState(true);

	const handleDismiss = () => {
		if (!persistent) {
			setIsVisible(false);
		}
	};

	const getIcon = () => {
		switch (type) {
			case 'error':
				return 'FiAlertCircle';
			case 'warning':
				return 'FiAlertTriangle';
			case 'info':
				return 'FiInfo';
			case 'success':
				return 'FiCheckCircle';
			default:
				return 'FiInfo';
		}
	};

	const getAriaRole = (): 'alert' | 'status' => {
		if (role) return role;
		return type === 'error' ? 'alert' : 'status';
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div className={`end-user-nano ${className || ''}`} style={style}>
			<PageBannerContainer
				$type={type}
				role={getAriaRole()}
				aria-live={type === 'error' ? 'assertive' : 'polite'}
			>
				<IconContainer>
					<MDIIcon icon={getIcon()} size={20} title={`${type} notification`} />
				</IconContainer>
				<ContentContainer>
					<BannerTitle>{title}</BannerTitle>
					{message && <BannerMessage>{message}</BannerMessage>}
				</ContentContainer>
				{(dismissible || action) && (
					<ActionsContainer>
						{action && (
							<ActionButton
								type="button"
								onClick={action.onClick}
								disabled={action.disabled}
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
						{dismissible && !persistent && (
							<DismissButton
								$type={type}
								onClick={handleDismiss}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleDismiss();
									}
								}}
								title="Dismiss notification"
							>
								<MDIIcon icon="FiX" size={16} title="Dismiss" />
							</DismissButton>
						)}
					</ActionsContainer>
				)}
			</PageBannerContainer>
		</div>
	);
};

export default PageBanner;
