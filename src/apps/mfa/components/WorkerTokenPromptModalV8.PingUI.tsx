/**
 * @file WorkerTokenPromptModalV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migrated modal that prompts user to get a new worker token when one is missing
 * @version 8.0.0
 *
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
import styled from 'styled-components';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';

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
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiX: 'mdi-close',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface WorkerTokenPromptModalV8PingUIProps {
	isOpen: boolean;
	onClose: () => void;
	onGetToken: () => void;
}

// Styled Components
const Overlay = styled.div<{ $isOpen: boolean }>`
	display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--ping-spacing-md, 1rem);
`;

const ModalContainer = styled.div`
	background: var(--ping-surface-primary, white);
	border-radius: var(--ping-border-radius-xl, 1rem);
	max-width: 500px;
	width: 100%;
	box-shadow: var(--ping-shadow-xl, 0 20px 40px rgba(0, 0, 0, 0.3));
`;

const ModalHeader = styled.div`
	background: linear-gradient(135deg, var(--ping-warning-color, #f59e0b) 0%, var(--ping-warning-dark, #d97706) 100%);
	color: white;
	padding: var(--ping-spacing-xl, 1.5rem);
	border-radius: var(--ping-border-radius-xl, 1rem) var(--ping-border-radius-xl, 1rem) 0 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const CloseButton = styled.button`
	background: transparent;
	border: none;
	color: white;
	font-size: 1.25rem;
	cursor: pointer;
	padding: var(--ping-spacing-xs, 0.25rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const ModalBody = styled.div`
	padding: var(--ping-spacing-xl, 2rem);
`;

const AlertBox = styled.div`
	background: var(--ping-warning-light, #fef3c7);
	border: 1px solid var(--ping-warning-color, #f59e0b);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-lg, 1.5rem);
	margin-bottom: var(--ping-spacing-xl, 2rem);
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const AlertText = styled.div`
	color: var(--ping-warning-dark, #92400e);
	font-size: 0.875rem;
	line-height: 1.5;
	flex: 1;
`;

const InfoSection = styled.div`
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const InfoTitle = styled.h3`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 var(--ping-spacing-md, 1rem) 0;
`;

const InfoText = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 0 0 var(--ping-spacing-md, 1rem) 0;
`;

const ScopeInfo = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
`;

const ScopeTitle = styled.div`
	color: var(--ping-text-primary, #1e293b);
	font-size: 0.875rem;
	font-weight: 600;
	margin: 0 0 var(--ping-spacing-xs, 0.5rem) 0;
`;

const ScopeValue = styled.code`
	background: var(--ping-code-background, #1e293b);
	color: var(--ping-code-text, #e2e8f0);
	padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	word-break: break-all;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: var(--ping-spacing-md, 1rem);
	justify-content: center;
`;

const PrimaryButton = styled.button`
	background: var(--ping-primary-color, #3b82f6);
	color: white;
	border: none;
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-primary-hover, #2563eb);
		transform: translateY(-1px);
	}
`;

const SecondaryButton = styled.button`
	background: transparent;
	color: var(--ping-text-primary, #1e293b);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-surface-secondary, #f8fafc);
		border-color: var(--ping-primary-color, #3b82f6);
		color: var(--ping-primary-color, #3b82f6);
	}
`;

export const WorkerTokenPromptModalV8PingUI: React.FC<WorkerTokenPromptModalV8PingUIProps> = ({
	isOpen,
	onClose,
	onGetToken,
}) => {
	// Handle ESC key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
		return undefined;
	}, [isOpen]);

	if (!isOpen) return null;

	const handleGetToken = () => {
		onGetToken();
		onClose();
	};

	const handleCancel = () => {
		onClose();
	};

	return (
		<div className="end-user-nano">
			<Overlay $isOpen={isOpen}>
				<ModalContainer>
					<ModalHeader>
						<ModalTitle>
							<MDIIcon icon="FiAlertTriangle" size={20} ariaLabel="Warning" />
							Worker Token Required
						</ModalTitle>
						<CloseButton onClick={handleCancel} aria-label="Close modal">
							<MDIIcon icon="FiX" size={16} ariaLabel="Close" style={{ color: 'white' }} />
						</CloseButton>
					</ModalHeader>

					<ModalBody>
						<AlertBox>
							<MDIIcon icon="FiAlertTriangle" size={20} ariaLabel="Alert" />
							<AlertText>
								<strong>Worker Token Missing:</strong> A valid worker token is required to perform
								this operation. Please obtain a new worker token to continue.
							</AlertText>
						</AlertBox>

						<InfoSection>
							<InfoTitle>What is a Worker Token?</InfoTitle>
							<InfoText>
								A worker token is a special access token that allows applications to perform
								administrative operations on behalf of the system. It's required for:
							</InfoText>
							<ul
								style={{
									color: 'var(--ping-text-secondary, #64748b)',
									fontSize: '0.875rem',
									lineHeight: '1.5',
									margin: '0 0 var(--ping-spacing-md, 1rem) 0',
									paddingLeft: 'var(--ping-spacing-lg, 1.5rem)',
								}}
							>
								<li>Managing MFA device registrations</li>
								<li>Accessing user authentication endpoints</li>
								<li>Performing administrative operations</li>
								<li>Accessing protected API resources</li>
							</ul>
						</InfoSection>

						<InfoSection>
							<InfoTitle>Required Scopes</InfoTitle>
							<InfoText>
								The worker token must include the following scope to access MFA operations:
							</InfoText>
							<ScopeInfo>
								<ScopeTitle>Required Scope:</ScopeTitle>
								<ScopeValue>{PINGONE_WORKER_MFA_SCOPE_STRING}</ScopeValue>
							</ScopeInfo>
						</InfoSection>

						<InfoSection>
							<InfoTitle>Security Notice</InfoTitle>
							<InfoText>
								Worker tokens have elevated permissions and should be handled securely. They will be
								stored securely and used only for the intended operations.
							</InfoText>
						</InfoSection>

						<ActionButtons>
							<PrimaryButton onClick={handleGetToken}>Get Worker Token</PrimaryButton>
							<SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
						</ActionButtons>
					</ModalBody>
				</ModalContainer>
			</Overlay>
		</div>
	);
};

export default WorkerTokenPromptModalV8PingUI;
