import React from 'react';

type MessageBoxType = 'success' | 'warning' | 'error' | 'info';

interface MessageBoxProps {
	/** Message type determines color scheme */
	type: MessageBoxType;
	/** Optional icon (emoji or string) */
	icon?: string;
	/** Message content */
	children: React.ReactNode;
	/** Whether message can be dismissed */
	dismissible?: boolean;
	/** Callback when dismissed */
	onDismiss?: () => void;
	/** Additional CSS classes */
	className?: string;
	/** Custom title */
	title?: string;
}

/**
 * MessageBox Component
 *
 * Consistent message/alert component with semantic color coding.
 *
 * Color Standards:
 * - Success (green): Completed operations, positive confirmations
 * - Warning (amber): Cautions, non-critical issues, optional actions
 * - Error (red): Failures, critical issues, validation errors
 * - Info (blue): Informational messages, tips, neutral notifications
 *
 * @example
 * <MessageBox type="success" icon="✅">
 *   Device registered successfully
 * </MessageBox>
 *
 * <MessageBox type="error" icon="❌" dismissible onDismiss={() => console.log('Dismissed')}>
 *   Authentication failed: Invalid code
 * </MessageBox>
 */
export const MessageBoxV8: React.FC<MessageBoxProps> = ({
	type,
	icon,
	children,
	dismissible = false,
	onDismiss,
	className = '',
	title,
}) => {
	const [isDismissed, setIsDismissed] = React.useState(false);

	const handleDismiss = () => {
		setIsDismissed(true);
		if (onDismiss) {
			onDismiss();
		}
	};

	if (isDismissed) {
		return null;
	}

	// Color schemes based on type
	const colorSchemes: Record<
		MessageBoxType,
		{ bg: string; border: string; text: string; icon: string }
	> = {
		success: {
			bg: '#d1fae5',
			border: '#10b981',
			text: '#064e3b',
			icon: '✅',
		},
		warning: {
			bg: '#fef3c7',
			border: '#f59e0b',
			text: '#78350f',
			icon: '⚠️',
		},
		error: {
			bg: '#fee2e2',
			border: '#ef4444',
			text: '#7f1d1d',
			icon: '❌',
		},
		info: {
			bg: '#dbeafe',
			border: '#3b82f6',
			text: '#1e3a8a',
			icon: 'ℹ️',
		},
	};

	const scheme = colorSchemes[type];
	const displayIcon = icon || scheme.icon;

	return (
		<div
			className={`message-box message-box-${type} ${className}`}
			style={{
				backgroundColor: scheme.bg,
				border: `2px solid ${scheme.border}`,
				borderRadius: '8px',
				padding: '1rem',
				marginBottom: '1rem',
				display: 'flex',
				alignItems: 'flex-start',
				gap: '0.75rem',
				position: 'relative',
			}}
			role="alert"
			aria-live={type === 'error' ? 'assertive' : 'polite'}
		>
			{/* Icon */}
			{displayIcon && (
				<span
					style={{
						fontSize: '1.25rem',
						lineHeight: 1,
						flexShrink: 0,
					}}
				>
					{displayIcon}
				</span>
			)}

			{/* Content */}
			<div style={{ flex: 1, color: scheme.text }}>
				{title && (
					<div
						style={{
							fontWeight: 600,
							marginBottom: '0.25rem',
							fontSize: '1rem',
						}}
					>
						{title}
					</div>
				)}
				<div
					style={{
						fontSize: '0.875rem',
						lineHeight: 1.5,
					}}
				>
					{children}
				</div>
			</div>

			{/* Dismiss button */}
			{dismissible && (
				<button
					type="button"
					onClick={handleDismiss}
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						padding: '0.25rem',
						color: scheme.text,
						opacity: 0.6,
						transition: 'opacity 0.2s ease',
						fontSize: '1.25rem',
						lineHeight: 1,
						flexShrink: 0,
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.opacity = '1';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.opacity = '0.6';
					}}
					aria-label="Dismiss message"
					title="Dismiss"
				>
					×
				</button>
			)}
		</div>
	);
};

// Convenience components for common use cases
export const SuccessMessage: React.FC<Omit<MessageBoxProps, 'type'>> = (props) => (
	<MessageBoxV8 type="success" {...props} />
);

export const WarningMessage: React.FC<Omit<MessageBoxProps, 'type'>> = (props) => (
	<MessageBoxV8 type="warning" {...props} />
);

export const ErrorMessage: React.FC<Omit<MessageBoxProps, 'type'>> = (props) => (
	<MessageBoxV8 type="error" {...props} />
);

export const InfoMessage: React.FC<Omit<MessageBoxProps, 'type'>> = (props) => (
	<MessageBoxV8 type="info" {...props} />
);

export default MessageBoxV8;
