// src/v8/components/NicknamePromptModalV8.tsx
// Modal for prompting user to set device nickname after pairing

import { FiCheck, FiInfo, FiX } from '@icons';
import React, { useEffect, useId, useState } from 'react';
import styled from 'styled-components';

interface NicknamePromptModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onSave: (nickname: string) => Promise<void>;
	currentNickname?: string;
	deviceType?: string;
	isLoading?: boolean;
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
	max-width: 500px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	padding: 2rem;
	position: relative;
	border-top: 6px solid #3b82f6;
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
	color: #1e40af;
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
	background: #3b82f6;
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

	&:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const SecondaryButton = styled.button`
	background: transparent;
	color: #6b7280;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, color 0.2s ease;

	&:hover:not(:disabled) {
		background: #f3f4f6;
		color: #374151;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.95rem;
	margin-top: 0.75rem;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const InfoCallout = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
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
	color: #1e40af;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const getDeviceTypeDisplay = (deviceType?: string): string => {
	if (!deviceType) return 'device';
	const typeMap: Record<string, string> = {
		SMS: 'SMS',
		EMAIL: 'Email',
		TOTP: 'TOTP',
		FIDO2: 'FIDO2',
		WHATSAPP: 'WhatsApp',
		VOICE: 'Voice',
	};
	return typeMap[deviceType] || deviceType;
};

export const NicknamePromptModalV8: React.FC<NicknamePromptModalV8Props> = ({
	isOpen,
	onClose,
	onSave,
	currentNickname,
	deviceType,
	isLoading = false,
}) => {
	// Handle ESC key to close modal
	useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	const modalTitleId = useId();
	const [nickname, setNickname] = useState(currentNickname || '');
	const [error, setError] = useState<string | null>(null);

	// Reset nickname when modal opens or currentNickname changes
	useEffect(() => {
		if (isOpen) {
			setNickname(currentNickname || '');
			setError(null);
		}
	}, [isOpen, currentNickname]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape' && !isLoading) {
			onClose();
		}
	};

	const handleSave = async () => {
		const trimmedNickname = nickname.trim();

		if (!trimmedNickname) {
			setError('Nickname is required');
			return;
		}

		if (trimmedNickname.length > 100) {
			setError('Nickname must be 100 characters or less');
			return;
		}

		setError(null);
		try {
			await onSave(trimmedNickname);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update nickname');
		}
	};

	if (!isOpen) return null;

	const deviceTypeDisplay = getDeviceTypeDisplay(deviceType);

	return (
		<ModalOverlay
			role="presentation"
			onClick={isLoading ? undefined : onClose}
			onKeyDown={handleKeyDown}
		>
			<ModalContent
				role="dialog"
				aria-modal="true"
				aria-labelledby={modalTitleId}
				onClick={(event) => event.stopPropagation()}
			>
				<CloseButton type="button" aria-label="Close modal" onClick={onClose} disabled={isLoading}>
					<FiX size={18} />
				</CloseButton>
				<ModalHeader>
					<FiInfo size={28} color="#3b82f6" />
					<div>
						<ModalTitle id={modalTitleId}>Set Device Nickname</ModalTitle>
						<p
							style={{
								margin: '0.5rem 0 0',
								color: '#6b7280',
								fontSize: '0.9rem',
								fontWeight: 'normal',
							}}
						>
							Your {deviceTypeDisplay} device has been registered. Please set a nickname for easy
							identification.
						</p>
					</div>
				</ModalHeader>
				<ModalBody>
					<label
						htmlFor="nickname-input"
						style={{
							display: 'block',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '0.5rem',
							fontSize: '0.95rem',
						}}
					>
						Device Nickname
					</label>
					<Input
						id="nickname-input"
						type="text"
						value={nickname}
						onChange={(e) => {
							setNickname(e.target.value);
							setError(null);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !isLoading) {
								handleSave();
							}
						}}
						placeholder={`Enter a nickname for your ${deviceTypeDisplay} device`}
						disabled={isLoading}
						maxLength={100}
						autoFocus
					/>
					{error && (
						<div
							style={{
								marginTop: '0.5rem',
								color: '#dc2626',
								fontSize: '0.875rem',
								fontWeight: '500',
							}}
						>
							{error}
						</div>
					)}
					<InfoCallout>
						<InfoIcon>
							<FiInfo size={20} color="#3b82f6" />
						</InfoIcon>
						<InfoContent>
							<strong>Why set a nickname?</strong>
							<br />
							Nicknames help you identify your devices easily. For example: "Work Phone", "Personal
							Email", or "Backup TOTP".
						</InfoContent>
					</InfoCallout>
				</ModalBody>
				<ModalFooter>
					<SecondaryButton type="button" onClick={onClose} disabled={isLoading}>
						Skip
					</SecondaryButton>
					<PrimaryButton
						type="button"
						onClick={handleSave}
						disabled={isLoading || !nickname.trim()}
					>
						{isLoading ? (
							<>
								<span style={{ display: 'inline-block', marginRight: '0.5rem' }}>⏳</span>
								Saving...
							</>
						) : (
							<>
								<FiCheck size={16} style={{ marginRight: '0.5rem' }} />
								Save Nickname
							</>
						)}
					</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
