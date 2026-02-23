/**
 * @file InlineMessage.tsx
 * @module components/feedback/InlineMessage
 * @description Inline message component for contextual feedback
 * @version 9.3.6
 * @since 2026-02-23
 *
 * Provides inline feedback messages for form validation, contextual help,
 * and per-field errors. Replaces toast notifications with contextual
 * feedback that stays visible while users work.
 *
 * @example
 * <InlineMessage
 *   type="error"
 *   message="This field is required"
 *   field="environmentId"
 *   dismissible
 * />
 */

import React from 'react';
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
		FiAlertCircle: 'mdi-alert-circle',
		FiCheckCircle: 'mdi-check-circle',
		FiInfo: 'mdi-information',
		FiAlertTriangle: 'mdi-alert-triangle',
		FiX: 'mdi-close',
		FiRefreshCw: 'mdi-refresh',
	};
	return iconMap[fiIcon] || fiIcon.replace('Fi', '').toLowerCase();
};

// Styled components
const InlineMessageContainer = styled.div<{ $type: 'error' | 'warning' | 'info' | 'success' }>`
	padding: var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem);
	border-radius: var(--ping-border-radius-md, 8px);
	margin-top: var(--ping-spacing-xs, 0.25rem);
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-sm, 0.5rem);
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
`;

const MessageContent = styled.div`
	flex: 1;
`;

const MessageTitle = styled.div`
	font-weight: 600;
	margin-bottom: var(--ping-spacing-xs, 0.25rem);
`;

const MessageText = styled.div`
	color: var(--ping-text-secondary, #6b7280);
`;

const ActionsContainer = styled.div`
	display: flex;
	gap: var(--ping-spacing-sm, 0.5rem);
	margin-left: auto;
`;

const ActionButton = styled.button`
	padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem);
	border: 1px solid var(--ping-border-color, #e5e7eb);
	border-radius: var(--ping-border-radius-sm, 4px);
	background: var(--ping-surface-primary, #ffffff);
	color: var(--ping-text-primary, #1a1a1a);
	font-size: var(--ping-font-size-xs, 0.75rem);
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
export interface InlineMessageProps {
	type: 'error' | 'warning' | 'info' | 'success';
	message: string;
	title?: string;
	field?: string;
	dismissible?: boolean;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
	style?: React.CSSProperties;
}

// Main component
export const InlineMessage: React.FC<InlineMessageProps> = ({
	type,
	message,
	title,
	field,
	dismissible = false,
	action,
	className,
	style,
}) => {
	const handleDismiss = () => {
		// Inline messages are typically handled by parent components
		// This could be expanded to support dismiss callbacks
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

	return (
		<div className={`end-user-nano ${className || ''}`} style={style}>
			<InlineMessageContainer $type={type}>
				<MDIIcon icon={getIcon()} size={16} title={`${type} message`} />
				<MessageContent>
					{title && <MessageTitle>{title}</MessageTitle>}
					{field && <MessageText>Field: {field}</MessageText>}
					<MessageText>{message}</MessageText>
				</MessageContent>
				{(dismissible || action) && (
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
						{dismissible && (
							<DismissButton
								$type={type}
								onClick={handleDismiss}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleDismiss();
									}
								}}
								title="Dismiss message"
							>
								<MDIIcon icon="FiX" size={12} title="Dismiss" />
							</DismissButton>
						)}
					</ActionsContainer>
				)}
			</InlineMessageContainer>
		</div>
	);
};

export default InlineMessage;
