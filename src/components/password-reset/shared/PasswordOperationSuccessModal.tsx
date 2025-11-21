// src/components/password-reset/shared/PasswordOperationSuccessModal.tsx
// Generic success modal for password operations

import React from 'react';
import styled from 'styled-components';
import {
	FiCheckCircle,
	FiInfo,
	FiKey,
	FiMail,
	FiUnlock,
	FiUser,
	FiX,
} from '../../../services/commonImportsService';
import type { PingOneUser } from './useUserLookup';

export type OperationType =
	| 'check'
	| 'unlock'
	| 'force-change'
	| 'recover'
	| 'set'
	| 'read-state'
	| 'send-code';

interface PasswordOperationSuccessModalProps {
	user: PingOneUser;
	operationType: OperationType;
	onClose: () => void;
	additionalData?: Record<string, any>; // For operation-specific data like password state
}

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.2s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	max-width: 500px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
	animation: slideUp 0.3s ease-out;

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
`;

const ModalHeader = styled.div`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	padding: 2rem;
	border-radius: 16px 16px 0 0;
	position: relative;
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: rgba(255, 255, 255, 0.2);
	border: none;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: white;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const SuccessIcon = styled.div`
	width: 64px;
	height: 64px;
	background: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	color: #10b981;
	font-size: 2rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const ModalTitle = styled.h2`
	color: white;
	font-size: 1.5rem;
	font-weight: 700;
	text-align: center;
	margin: 0;
`;

const ModalSubtitle = styled.p`
	color: rgba(255, 255, 255, 0.9);
	text-align: center;
	margin: 0.5rem 0 0 0;
	font-size: 0.875rem;
`;

const ModalBody = styled.div`
	padding: 2rem;
`;

const UserInfoSection = styled.div`
	background: #f9fafb;
	border-radius: 12px;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
	font-size: 0.875rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 1rem 0;
`;

const InfoRow = styled.div`
	display: flex;
	align-items: start;
	gap: 0.75rem;
	margin-bottom: 1rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const InfoIcon = styled.div`
	color: #10b981;
	font-size: 1.25rem;
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
	font-size: 1rem;
	color: #111827;
	font-weight: 500;
	word-break: break-word;
`;

const MessageBox = styled.div`
	background: #ecfdf5;
	border: 1px solid #a7f3d0;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

const MessageText = styled.p`
	color: #065f46;
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 0;
`;

const AccomplishmentsList = styled.ul`
	margin: 0.75rem 0 0 1.25rem;
	padding: 0;
	color: #065f46;
	font-size: 0.875rem;
	line-height: 1.6;
`;

const AdditionalDataSection = styled.div`
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

const DataLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #0369a1;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const DataValue = styled.div`
	font-size: 0.875rem;
	color: #0c4a6e;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	background: white;
	padding: 0.5rem;
	border-radius: 4px;
	word-break: break-word;
`;

const ActionButton = styled.button`
	width: 100%;
	padding: 0.75rem 1.5rem;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 8px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: #059669;
	}
`;

// Operation-specific configurations
const operationConfig = {
	check: {
		icon: FiKey,
		title: 'Password Verified Successfully!',
		subtitle: "The password matches the user's current password",
		message:
			"✅ The password you provided is correct and matches the user's current password. The user can authenticate with this password.",
		accomplishments: null,
	},
	unlock: {
		icon: FiUnlock,
		title: 'Account Unlocked Successfully!',
		subtitle: 'The user can now sign in to their account',
		message:
			'✅ Account unlocked! The user account has been successfully unlocked and is now accessible.',
		accomplishments: [
			'Account lock has been removed',
			'Failed login attempt counters have been reset',
			'User can now sign in with their credentials',
		],
	},
	'force-change': {
		icon: FiKey,
		title: 'Password Change Forced Successfully!',
		subtitle: 'User must change password on next sign-in',
		message:
			'✅ Password change forced! The user will be required to change their password on their next sign-in.',
		accomplishments: [
			'User account marked for password change',
			'User must provide new password on next login',
			'User cannot access account until password is changed',
		],
	},
	recover: {
		icon: FiCheckCircle,
		title: 'Password Recovered Successfully!',
		subtitle: 'The user can now sign in with the new password',
		message: "✅ Password recovered! The user's password has been successfully reset.",
		accomplishments: [
			'Password has been updated',
			'User can sign in with new password',
			'Recovery code has been consumed',
		],
	},
	set: {
		icon: FiKey,
		title: 'Password Set Successfully!',
		subtitle: 'The new password is now active',
		message: "✅ Password set! The user's password has been successfully updated.",
		accomplishments: [
			'New password is now active',
			'User can sign in with new password',
			'Password policy requirements met',
		],
	},
	'read-state': {
		icon: FiInfo,
		title: 'Password State Retrieved!',
		subtitle: 'Current password status information',
		message: '✅ Password state retrieved successfully. See details below.',
		accomplishments: null,
	},
	'send-code': {
		icon: FiCheckCircle,
		title: 'Recovery Code Sent!',
		subtitle: 'Check email/SMS for the recovery code',
		message: '✅ Recovery code sent! The user will receive a code via email or SMS.',
		accomplishments: [
			'Recovery code generated',
			"Code sent to user's registered contact",
			'Code is valid for limited time',
		],
	},
};

export const PasswordOperationSuccessModal: React.FC<PasswordOperationSuccessModalProps> = ({
	user,
	operationType,
	onClose,
	additionalData,
}) => {
	const config = operationConfig[operationType];
	const Icon = config.icon;

	// Close on escape key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	// Close on overlay click
	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const displayName =
		user.name?.given || user.name?.family
			? [user.name.given, user.name.family].filter(Boolean).join(' ')
			: user.username || user.email || 'User';

	return (
		<ModalOverlay onClick={handleOverlayClick}>
			<ModalContent>
				<ModalHeader>
					<CloseButton onClick={onClose} aria-label="Close">
						<FiX size={20} />
					</CloseButton>
					<SuccessIcon>
						<Icon />
					</SuccessIcon>
					<ModalTitle>{config.title}</ModalTitle>
					<ModalSubtitle>{config.subtitle}</ModalSubtitle>
				</ModalHeader>

				<ModalBody>
					<MessageBox>
						<MessageText>
							{config.message}
							{config.accomplishments && (
								<AccomplishmentsList>
									{config.accomplishments.map((item, index) => (
										<li key={index}>{item}</li>
									))}
								</AccomplishmentsList>
							)}
						</MessageText>
					</MessageBox>

					{additionalData && Object.keys(additionalData).length > 0 && (
						<AdditionalDataSection>
							<SectionTitle>Additional Information</SectionTitle>
							{Object.entries(additionalData).map(([key, value]) => (
								<div key={key} style={{ marginBottom: '0.75rem' }}>
									<DataLabel>{key.replace(/([A-Z])/g, ' $1').trim()}</DataLabel>
									<DataValue>
										{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
									</DataValue>
								</div>
							))}
						</AdditionalDataSection>
					)}

					<UserInfoSection>
						<SectionTitle>User Information</SectionTitle>

						{user.username && (
							<InfoRow>
								<InfoIcon>
									<FiUser />
								</InfoIcon>
								<InfoContent>
									<InfoLabel>Username</InfoLabel>
									<InfoValue>{user.username}</InfoValue>
								</InfoContent>
							</InfoRow>
						)}

						{user.email && (
							<InfoRow>
								<InfoIcon>
									<FiMail />
								</InfoIcon>
								<InfoContent>
									<InfoLabel>Email</InfoLabel>
									<InfoValue>{user.email}</InfoValue>
								</InfoContent>
							</InfoRow>
						)}

						<InfoRow>
							<InfoIcon>
								<FiUser />
							</InfoIcon>
							<InfoContent>
								<InfoLabel>User ID</InfoLabel>
								<InfoValue style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '0.875rem' }}>
									{user.id}
								</InfoValue>
							</InfoContent>
						</InfoRow>

						{user.name && (user.name.given || user.name.family) && (
							<InfoRow>
								<InfoIcon>
									<FiUser />
								</InfoIcon>
								<InfoContent>
									<InfoLabel>Full Name</InfoLabel>
									<InfoValue>{displayName}</InfoValue>
								</InfoContent>
							</InfoRow>
						)}
					</UserInfoSection>

					<ActionButton onClick={onClose}>Close</ActionButton>
				</ModalBody>
			</ModalContent>
		</ModalOverlay>
	);
};
