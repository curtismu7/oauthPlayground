// src/v8/components/WhatsAppNotEnabledModalV8.tsx
// Modal for displaying WhatsApp MFA not enabled errors

import React, { useId } from 'react';
import { FiAlertCircle, FiExternalLink, FiInfo, FiX } from 'react-icons/fi';
import styled from 'styled-components';

interface WhatsAppNotEnabledModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	environmentId?: string;
}

const ModalOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1050;
	padding: 1.5rem;
`;

const ModalContent = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	max-width: 600px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	padding: 2rem;
	position: relative;
	border-top: 6px solid #f59e0b;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 1.25rem;
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.35rem;
	font-weight: 700;
	color: #92400e;
`;

const ModalBody = styled.div`
	color: #1f2937;
	font-size: 0.975rem;
	line-height: 1.6;
`;

const ModalFooter = styled.div`
	margin-top: 1.5rem;
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: transparent;
	border: none;
	color: #6b7280;
	width: 2rem;
	height: 2rem;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background 0.2s ease, color 0.2s ease;

	&:hover {
		background: rgba(148, 163, 184, 0.15);
		color: #374151;
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const PrimaryButton = styled.button`
	background: #f59e0b;
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		background: #d97706;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
	}

	&:active {
		transform: translateY(0);
	}

	&:focus-visible {
		outline: 3px solid rgba(245, 158, 11, 0.45);
		outline-offset: 2px;
	}
`;

const InfoCallout = styled.div`
	background: #fffbeb;
	border: 1px solid #fde68a;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	display: flex;
	gap: 0.75rem;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	color: #92400e;
	margin-bottom: 0.5rem;
	font-size: 0.95rem;
`;

const InfoList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	color: #78350f;
`;

const InfoListItem = styled.li`
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
	line-height: 1.5;

	&:last-child {
		margin-bottom: 0;
	}
`;

const LinkButton = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: #2563eb;
	text-decoration: none;
	font-weight: 500;
	font-size: 0.9rem;
	margin-top: 0.5rem;
	transition: color 0.2s ease;

	&:hover {
		color: #1d4ed8;
		text-decoration: underline;
	}
`;

export const WhatsAppNotEnabledModalV8: React.FC<WhatsAppNotEnabledModalV8Props> = ({
	isOpen,
	onClose,
	environmentId,
}) => {
	const modalTitleId = useId();

	if (!isOpen) return null;

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	// Construct PingOne Console URL for MFA settings
	const pingOneConsoleUrl = environmentId
		? `https://admin.pingone.com/webapp/${environmentId}/mfa/settings`
		: 'https://admin.pingone.com';

	return (
		<ModalOverlay role="presentation" onClick={onClose} onKeyDown={handleKeyDown}>
			<ModalContent
				role="dialog"
				aria-modal="true"
				aria-labelledby={modalTitleId}
				onClick={(event) => event.stopPropagation()}
			>
				<CloseButton type="button" aria-label="Close error details" onClick={onClose}>
					<FiX size={18} />
				</CloseButton>
				<ModalHeader>
					<FiAlertCircle size={28} color="#f59e0b" />
					<div>
						<ModalTitle id={modalTitleId}>WhatsApp MFA Not Enabled</ModalTitle>
						<p
							style={{
								margin: '0.5rem 0 0',
								color: '#6b7280',
								fontSize: '0.9rem',
								fontWeight: 'normal',
							}}
						>
							WhatsApp MFA must be enabled in your PingOne environment
						</p>
					</div>
				</ModalHeader>
				<ModalBody>
					<p style={{ marginTop: 0 }}>
						Your PingOne environment does not have WhatsApp MFA enabled. To register WhatsApp
						devices, you need to enable WhatsApp MFA in the PingOne Admin Console.
					</p>

					<InfoCallout>
						<InfoIcon>
							<FiInfo size={20} color="#f59e0b" />
						</InfoIcon>
						<InfoContent>
							<InfoTitle>How to Enable WhatsApp MFA:</InfoTitle>
							<InfoList>
								<InfoListItem>
									<strong>1. Open PingOne Admin Console:</strong> Navigate to your environment's MFA
									Settings page.
								</InfoListItem>
								<InfoListItem>
									<strong>2. Enable WhatsApp:</strong> In the MFA Settings, find the WhatsApp option
									and enable it for your environment.
								</InfoListItem>
								<InfoListItem>
									<strong>3. Configure WhatsApp Sender:</strong> Set up your WhatsApp sender
									credentials (WhatsApp Business API) in the PingOne Console. This is required for
									PingOne to send WhatsApp messages.
								</InfoListItem>
								<InfoListItem>
									<strong>4. Verify Device Authentication Policy:</strong> Ensure your Device
									Authentication Policy allows WhatsApp as a device type.
								</InfoListItem>
							</InfoList>
							<LinkButton
								href={pingOneConsoleUrl}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
							>
								<FiExternalLink size={16} />
								Open PingOne Admin Console - MFA Settings
							</LinkButton>
						</InfoContent>
					</InfoCallout>

					<div
						style={{
							background: '#f3f4f6',
							border: '1px solid #e5e7eb',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginTop: '1rem',
						}}
					>
						<p
							style={{
								margin: '0 0 0.5rem 0',
								fontWeight: '600',
								color: '#374151',
								fontSize: '0.9rem',
							}}
						>
							💡 Note:
						</p>
						<p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
							WhatsApp MFA requires a WhatsApp Business API account and proper configuration in
							PingOne. Once enabled, you can register WhatsApp devices and receive OTP codes via
							WhatsApp messages.
						</p>
					</div>
				</ModalBody>
				<ModalFooter>
					<PrimaryButton type="button" onClick={onClose}>
						Got it
					</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
