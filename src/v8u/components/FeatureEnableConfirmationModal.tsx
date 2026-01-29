/**
 * @file FeatureEnableConfirmationModal.tsx
 * @module v8u/components
 * @description Modal for confirming advanced OAuth feature enable/disable with PingOne client updates
 * @version 8.0.0
 * @since 2024-11-19
 */

import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiGlobe, FiSettings, FiX } from 'react-icons/fi';
import styled from 'styled-components';

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
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 16px;
	max-width: 600px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	animation: slideUp 0.3s ease;

	@keyframes slideUp {
		from { transform: translateY(20px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}
`;

const ModalHeader = styled.div`
	padding: 24px;
	border-bottom: 1px solid #e2e8f0;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const ModalBody = styled.div`
	padding: 24px;
`;

const ModalFooter = styled.div`
	padding: 24px;
	border-top: 1px solid #e2e8f0;
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	color: #6b7280;
	cursor: pointer;
	padding: 4px;
	border-radius: 8px;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`;

const Section = styled.div`
	margin-bottom: 24px;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h4`
	margin: 0 0 12px 0;
	font-size: 16px;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const ChangeList = styled.ul`
	margin: 0;
	padding: 0 0 0 20px;
	color: #4b5563;
	line-height: 1.6;
`;

const ChangeItem = styled.li`
	margin-bottom: 8px;

	&:last-child {
		margin-bottom: 0;
	}
`;

const InfoBox = styled.div`
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 16px;
`;

const WarningBox = styled.div`
	background: #fef3c7;
	border: 1px solid #fbbf24;
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 16px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 10px 20px;
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;

	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover { background: #2563eb; }
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover { background: #dc2626; }
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
					border: 1px solid #d1d5db;
					&:hover { background: #e5e7eb; }
				`;
		}
	}}
`;

const CodeBlock = styled.code`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	padding: 2px 6px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 13px;
	color: #1f2937;
`;

export interface FeatureEnableConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	featureName: string;
	featureId: string;
	isEnabling: boolean;
	appName: string;
	changes: {
		pingOneChanges: string[];
		appChanges: string[];
	};
	isLoading?: boolean;
}

export const FeatureEnableConfirmationModal: React.FC<FeatureEnableConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	featureName,
	featureId,
	isEnabling,
	appName,
	changes,
	isLoading = false,
}) => {
	if (!isOpen) return null;

	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						{isEnabling ? <FiCheckCircle color="#10b981" /> : <FiAlertTriangle color="#f59e0b" />}
						{isEnabling ? 'Enable' : 'Disable'} Advanced OAuth Feature
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<InfoBox>
						<strong>Feature:</strong> {featureName}
						<br />
						<strong>Application:</strong> {appName}
						<br />
						<strong>Action:</strong> {isEnabling ? 'Enable' : 'Disable'} feature in PingOne client
						and application
					</InfoBox>

					{!isEnabling && (
						<WarningBox>
							<strong>⚠️ Warning:</strong> Disabling this feature will remove it from your PingOne
							client configuration and may affect existing integrations that depend on it.
						</WarningBox>
					)}

					<Section>
						<SectionTitle>
							<FiGlobe />
							PingOne Client Changes
						</SectionTitle>
						<ChangeList>
							{changes.pingOneChanges.map((change, index) => (
								<ChangeItem key={index}>
									{change.includes('client_id') ||
									change.includes('redirect_uris') ||
									change.includes('grant_types')
										? change
												.split(' ')
												.map((part, i) =>
													part.includes('client_id') ||
													part.includes('redirect_uris') ||
													part.includes('grant_types') ? (
														<CodeBlock key={i}>{part}</CodeBlock>
													) : (
														` ${part} `
													)
												)
										: change}
								</ChangeItem>
							))}
						</ChangeList>
					</Section>

					<Section>
						<SectionTitle>
							<FiSettings />
							Application Configuration Changes
						</SectionTitle>
						<ChangeList>
							{changes.appChanges.map((change, index) => (
								<ChangeItem key={index}>{change}</ChangeItem>
							))}
						</ChangeList>
					</Section>

					{isEnabling && (
						<Section>
							<SectionTitle>
								<FiCheckCircle />
								Benefits
							</SectionTitle>
							<ChangeList>
								<ChangeItem>Enhanced security with {featureName}</ChangeItem>
								<ChangeItem>Improved OAuth flow compliance</ChangeItem>
								<ChangeItem>Better user experience with advanced features</ChangeItem>
							</ChangeList>
						</Section>
					)}
				</ModalBody>

				<ModalFooter>
					<Button onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						$variant={isEnabling ? 'primary' : 'danger'}
						onClick={handleConfirm}
						disabled={isLoading}
					>
						{isLoading ? 'Processing...' : isEnabling ? 'Enable Feature' : 'Disable Feature'}
					</Button>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

export default FeatureEnableConfirmationModal;
