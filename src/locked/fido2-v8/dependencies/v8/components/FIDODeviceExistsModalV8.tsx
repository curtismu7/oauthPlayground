/**
 * @file FIDODeviceExistsModalV8.tsx
 * @module v8/components
 * @description Modal for when user already has a FIDO device registered
 * @version 8.0.0
 */

import React, { useEffect, useId, useState } from 'react';
import { FiAlertCircle, FiArrowLeft, FiInfo, FiTrash2, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

interface FIDODeviceExistsModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onBackToSelection: () => void;
	onBackToHub?: () => void;
	onDeviceDeleted?: () => void;
	environmentId?: string;
	username?: string;
	deviceId?: string;
	deviceNickname?: string;
}

const ModalOverlay = styled.div<{ $hasPosition: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	display: ${(props) => (props.$hasPosition ? 'block' : 'flex')};
	align-items: ${(props) => (props.$hasPosition ? 'normal' : 'center')};
	justify-content: ${(props) => (props.$hasPosition ? 'normal' : 'center')};
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
	border-top: 6px solid #f59e0b;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 1.25rem;
	cursor: grab;
	user-select: none;

	&:active {
		cursor: grabbing;
	}
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
	flex-wrap: wrap;
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
	background: #3b82f6;
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(17, 24, 39, 0.1);
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const SecondaryButton = styled.button`
	background: #f3f4f6;
	color: #374151;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease;

	&:hover {
		background: #e5e7eb;
		transform: translateY(-1px);
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const DangerButton = styled.button`
	background: #ef4444;
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	&:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	&:focus-visible {
		outline: 3px solid rgba(239, 68, 68, 0.45);
		outline-offset: 2px;
	}

	&:disabled {
		background: #d1d5db;
		color: #9ca3af;
		cursor: not-allowed;
		transform: none;
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

export const FIDODeviceExistsModalV8: React.FC<FIDODeviceExistsModalV8Props> = ({
	isOpen,
	onClose,
	onBackToSelection,
	onBackToHub,
	onDeviceDeleted,
	environmentId,
	username,
	deviceId,
	deviceNickname,
}) => {
	const [isDeleting, setIsDeleting] = useState(false);
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
	const { modalRef, modalPosition, handleMouseDown, modalStyle } = useDraggableModal(isOpen);

	const handleDeleteDevice = async () => {
		if (!environmentId || !username || !deviceId) {
			toastV8.error('Missing required information to delete device');
			return;
		}

		const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
		const confirmed = await uiNotificationServiceV8.confirm({
			title: 'Delete FIDO2 Device',
			message: `Are you sure you want to delete ${deviceNickname || 'this FIDO2 device'}? This action cannot be undone. You will be able to register a new FIDO2 device after deletion.`,
			confirmText: 'Delete Device',
			cancelText: 'Cancel',
			severity: 'danger',
		});

		if (!confirmed) {
			return;
		}

		setIsDeleting(true);
		try {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FIDODeviceExistsModalV8.tsx:218',message:'Deleting FIDO2 device',data:{environmentId,username,deviceId,deviceNickname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
			// #endregion
			await MFAServiceV8.deleteDevice({
				environmentId,
				username,
				deviceId,
			});

			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FIDODeviceExistsModalV8.tsx:228',message:'Device deleted successfully',data:{deviceId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
			// #endregion
			toastV8.success('FIDO2 device deleted successfully. You can now register a new device.');
			onClose();
			if (onDeviceDeleted) {
				onDeviceDeleted();
			}
		} catch (error) {
			console.error('[FIDODeviceExistsModal] Failed to delete device', error);
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FIDODeviceExistsModalV8.tsx:237',message:'Delete device failed',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
			// #endregion
			toastV8.error(
				`Failed to delete device: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsDeleting(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	const hasPosition = modalPosition.x !== 0 || modalPosition.y !== 0;

	return (
		<ModalOverlay role="presentation" onClick={onClose} $hasPosition={hasPosition}>
			<ModalContent
				ref={modalRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={modalTitleId}
				onClick={(event) => event.stopPropagation()}
				style={modalStyle}
			>
				<CloseButton type="button" aria-label="Close modal" onClick={onClose}>
					<FiX size={18} />
				</CloseButton>
				<ModalHeader onMouseDown={handleMouseDown}>
					<FiAlertCircle size={28} color="#f59e0b" />
					<div>
						<ModalTitle id={modalTitleId}>FIDO Device Already Registered</ModalTitle>
						<p
							style={{
								margin: '0.5rem 0 0',
								color: '#6b7280',
								fontSize: '0.9rem',
								fontWeight: 'normal',
							}}
						>
							You can only register one FIDO device per user
						</p>
					</div>
				</ModalHeader>
				<ModalBody>
					<p style={{ marginTop: 0 }}>
						You already have a FIDO2 device registered. PingOne allows only one FIDO device per user
						account. To register a different FIDO device, you'll need to delete your existing device
						first.
					</p>

					<InfoCallout>
						<InfoIcon>
							<FiInfo size={20} color="#2563eb" />
						</InfoIcon>
						<InfoContent>
							<InfoTitle>What you can do:</InfoTitle>
							<ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: '#1e40af' }}>
								<li style={{ marginBottom: '0.35rem' }}>
									<strong>Use your existing device:</strong> You can use your registered FIDO device
									for authentication without registering a new one.
								</li>
								<li style={{ marginBottom: '0.35rem' }}>
									<strong>Delete and re-register:</strong> If you want to register a different FIDO
									device, delete your existing device first, then register the new one.
								</li>
								<li style={{ marginBottom: '0.35rem' }}>
									<strong>Choose a different device type:</strong> You can register multiple devices
									of other types (SMS, Email, TOTP) if needed.
								</li>
							</ul>
						</InfoContent>
					</InfoCallout>
				</ModalBody>
				<ModalFooter>
					{onBackToHub && (
						<SecondaryButton type="button" onClick={onBackToHub}>
							Back to Device Selection
						</SecondaryButton>
					)}
					{environmentId && username && deviceId && (
						<DangerButton
							type="button"
							onClick={handleDeleteDevice}
							disabled={isDeleting}
						>
							<FiTrash2 size={16} />
							{isDeleting ? 'Deleting...' : 'Delete Device'}
						</DangerButton>
					)}
					<PrimaryButton type="button" onClick={onBackToSelection}>
						<FiArrowLeft size={16} />
						Back to Registration
					</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

export default FIDODeviceExistsModalV8;
