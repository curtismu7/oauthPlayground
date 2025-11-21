// src/v8/components/MFADeviceLimitModalV8.tsx
// Modal for displaying device limit exceeded errors in MFA flow

import React, { useEffect, useId } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiX, FiInfo } from '@/services/commonImportsService';

interface MFADeviceLimitModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	deviceType?: string;
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
	max-width: 560px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	padding: 2rem;
	position: relative;
	border-top: 6px solid #dc2626;
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
	color: #991b1b;
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
	background: #dc2626;
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(17, 24, 39, 0.1);
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const InfoCallout = styled.div`
	margin-top: 1.25rem;
	padding: 1rem;
	border-radius: 0.75rem;
	background: rgba(59, 130, 246, 0.08);
	color: #1e40af;
	border: 1px solid rgba(59, 130, 246, 0.25);
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	margin-top: 2px;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #1e3a8a;
`;

const InfoList = styled.ul`
	margin: 0.5rem 0 0 0;
	padding-left: 1.25rem;
	color: #1e40af;
`;

const InfoListItem = styled.li`
	margin-bottom: 0.35rem;
`;

export const MFADeviceLimitModalV8: React.FC<MFADeviceLimitModalV8Props> = ({
	isOpen,
	onClose,
	deviceType = 'device',
}) => {
	// Lock body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	const modalTitleId = useId();

	if (!isOpen) {
		return null;
	}

	const deviceTypeDisplay = deviceType === 'SMS' ? 'SMS' : deviceType === 'EMAIL' ? 'Email' : deviceType === 'TOTP' ? 'TOTP' : 'MFA';

	return (
		<ModalOverlay role="presentation" onClick={onClose}>
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
					<FiAlertCircle size={28} color="#dc2626" />
					<div>
						<ModalTitle id={modalTitleId}>Device Limit Reached</ModalTitle>
						<p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.9rem', fontWeight: 'normal' }}>
							You've reached the maximum number of {deviceTypeDisplay} devices allowed
						</p>
					</div>
				</ModalHeader>
				<ModalBody>
					<p style={{ marginTop: 0 }}>
						Your account has reached the maximum number of {deviceTypeDisplay} devices that can be registered. 
						To register a new device, you'll need to remove an existing one first.
					</p>

					<InfoCallout>
						<InfoIcon>
							<FiInfo size={20} color="#2563eb" />
						</InfoIcon>
						<InfoContent>
							<InfoTitle>What you can do:</InfoTitle>
							<InfoList>
								<InfoListItem>
									<strong>Delete an existing device:</strong> Go to your PingOne admin console and remove 
									an unused {deviceTypeDisplay.toLowerCase()} device from your account.
								</InfoListItem>
								<InfoListItem>
									<strong>Use an existing device:</strong> If you already have a registered device, 
									you can use it to receive OTP codes without registering a new one.
								</InfoListItem>
								<InfoListItem>
									<strong>Contact your administrator:</strong> If you need additional devices, 
									they may need to increase your account's device limit.
								</InfoListItem>
							</InfoList>
						</InfoContent>
					</InfoCallout>
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

export default MFADeviceLimitModalV8;

