/**
 * @file WorkerTokenPromptModalV8.PingUI.tsx
 * @module v8/components
 * @description PingOne UI version of Modal that prompts user to get a new worker token when one is missing
 * @version 8.0.0-PingUI
 *
 * PingOne UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React from 'react';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: `${size}px`, ...style }}
			title={title}
		/>
	);
};

// PingOne UI Helper Functions
const getOverlayStyle = (isOpen: boolean): React.CSSProperties => ({
	display: isOpen ? 'flex' : 'none',
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'rgba(0, 0, 0, 0.5)',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1000,
	padding: 'var(--ping-spacing-lg, 1rem)',
});

const getModalStyle = (): React.CSSProperties => ({
	background: 'var(--ping-secondary-color, white)',
	borderRadius: 'var(--ping-border-radius-lg, 1rem)',
	maxWidth: '500px',
	width: '100%',
	boxShadow: 'var(--ping-shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.3))',
});

const getModalHeaderStyle = (): React.CSSProperties => ({
	background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
	color: 'white',
	padding: 'var(--ping-spacing-xl, 1.5rem)',
	borderRadius: 'var(--ping-border-radius-lg, 1rem) var(--ping-border-radius-lg, 1rem) 0 0',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
});

const getModalTitleStyle = (): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--ping-spacing-sm, 0.5rem)',
	fontSize: 'var(--ping-font-size-lg, 1.25rem)',
	fontWeight: '600',
	margin: 0,
});

const getCloseButtonStyle = (): React.CSSProperties => ({
	background: 'none',
	border: 'none',
	color: 'white',
	cursor: 'pointer',
	padding: 'var(--ping-spacing-sm, 0.25rem)',
	borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
});

const getModalContentStyle = (): React.CSSProperties => ({
	padding: 'var(--ping-spacing-xl, 1.5rem)',
});

const getAlertBoxStyle = (): React.CSSProperties => ({
	background: 'var(--ping-warning-bg, #fef3c7)',
	border: '1px solid var(--ping-warning-border, #f59e0b)',
	borderRadius: 'var(--ping-border-radius-md, 0.5rem)',
	padding: 'var(--ping-spacing-md, 1rem)',
	display: 'flex',
	gap: 'var(--ping-spacing-sm, 0.75rem)',
	alignItems: 'flex-start',
	marginBottom: 'var(--ping-spacing-lg, 1rem)',
	color: 'var(--ping-warning-text, #92400e)',
});

const getWarningTextStyle = (): React.CSSProperties => ({
	margin: 0,
	lineHeight: '1.6',
});

const getScopeBoxStyle = (): React.CSSProperties => ({
	background: 'var(--ping-surface-color, #f9fafb)',
	border: '1px solid var(--ping-border-color, #e5e7eb)',
	borderRadius: 'var(--ping-border-radius-md, 0.5rem)',
	padding: 'var(--ping-spacing-md, 1rem)',
	marginBottom: 'var(--ping-spacing-lg, 1rem)',
});

const getScopeTitleStyle = (): React.CSSProperties => ({
	fontWeight: '600',
	color: 'var(--ping-text-color, #1f2937)',
	marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
});

const getScopeTextStyle = (): React.CSSProperties => ({
	fontFamily: 'monospace',
	fontSize: 'var(--ping-font-size-sm, 0.875rem)',
	background: 'var(--ping-code-bg, #1f2937)',
	color: 'var(--ping-code-text, #f3f4f6)',
	padding: 'var(--ping-spacing-sm, 0.5rem)',
	borderRadius: 'var(--ping-border-radius-sm, 0.375rem)',
	wordBreak: 'break-all',
});

const getButtonContainerStyle = (): React.CSSProperties => ({
	display: 'flex',
	gap: 'var(--ping-spacing-md, 1rem)',
	justifyContent: 'flex-end',
	marginTop: 'var(--ping-spacing-lg, 1rem)',
});

const getButtonStyle = (variant: 'primary' | 'secondary'): React.CSSProperties => ({
	padding: 'var(--ping-spacing-md, 0.75rem) var(--ping-spacing-lg, 1.5rem)',
	borderRadius: 'var(--ping-border-radius-md, 0.5rem)',
	fontWeight: '500',
	cursor: 'pointer',
	transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
	border: 'none',
	fontSize: 'var(--ping-font-size-base, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--ping-spacing-xs, 0.25rem)',
	...(variant === 'primary' && {
		background: 'var(--ping-primary-color, #3b82f6)',
		color: 'white',
	}),
	...(variant === 'secondary' && {
		background: 'var(--ping-surface-color, #f9fafb)',
		color: 'var(--ping-text-color, #1f2937)',
		border: '1px solid var(--ping-border-color, #e5e7eb)',
	}),
});

interface WorkerTokenPromptModalV8PingUIProps {
	isOpen: boolean;
	onClose: () => void;
	onGetToken: () => void;
}

export const WorkerTokenPromptModalV8PingUI: React.FC<WorkerTokenPromptModalV8PingUIProps> = ({
	isOpen,
	onClose,
	onGetToken,
}) => {
	const handleGetToken = () => {
		onGetToken();
		onClose();
	};

	const handleCancel = () => {
		onClose();
	};

	// Handle ESC key - moved before conditional return
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="end-user-nano">
			{/* Overlay */}
			<div 
				style={getOverlayStyle(isOpen)} 
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						onClose();
					}
				}}
				role="dialog"
				aria-modal="true"
				aria-labelledby="worker-token-modal-title"
			>
				{/* Modal */}
				<main 
					style={getModalStyle()} 
					onClick={(e) => e.stopPropagation()}
					role="document"
					tabIndex={-1}
				>
					{/* Header */}
					<div style={getModalHeaderStyle()}>
						<h2 id="worker-token-modal-title" style={getModalTitleStyle()}>
							<MDIIcon 
								icon="alert" 
								size={24} 
								title="Warning icon"
							/>
							Worker Token Required
						</h2>
						<button
							type="button"
							style={getCloseButtonStyle()}
							onClick={onClose}
							aria-label="Close modal"
							title="Close modal"
						>
							<MDIIcon 
								icon="close" 
								size={24} 
								title="Close"
							/>
						</button>
					</div>

					{/* Content */}
					<div style={getModalContentStyle()}>
						{/* Warning Message */}
						<div style={getAlertBoxStyle()}>
							<MDIIcon 
								icon="alert" 
								size={20} 
								title="Warning icon"
							/>
							<p style={getWarningTextStyle()}>
								<strong>Worker Token Missing</strong><br />
								This operation requires a worker token with the correct MFA scopes. 
								Please generate a new worker token to continue.
							</p>
						</div>

						{/* Required Scope */}
						<div style={getScopeBoxStyle()}>
							<h3 style={getScopeTitleStyle()}>Required Scope:</h3>
							<div style={getScopeTextStyle()}>
								{PINGONE_WORKER_MFA_SCOPE_STRING}
							</div>
						</div>

						{/* Action Buttons */}
						<div style={getButtonContainerStyle()}>
							<button
								type="button"
								style={getButtonStyle('secondary')}
								onClick={handleCancel}
								aria-label="Cancel getting worker token"
							>
								Cancel
							</button>
							<button
								type="button"
								style={getButtonStyle('primary')}
								onClick={handleGetToken}
								aria-label="Get new worker token"
							>
								Get Worker Token
							</button>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default WorkerTokenPromptModalV8PingUI;
