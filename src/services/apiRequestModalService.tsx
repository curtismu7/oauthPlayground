// src/services/apiRequestModalService.tsx
// Unified educational modal service for all API requests (OAuth, PingOne Management API, etc.)

import React, { useCallback, useState } from 'react';
import {
	FiCheck,
	FiCode,
	FiCopy,
	FiDatabase,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiSend,
	FiShield,
	FiX,
} from '@icons';
import styled from 'styled-components';
import { ColoredUrlDisplay } from '../components/ColoredUrlDisplay';
import { v4ToastManager } from '../utils/v4ToastMessages';

// ============================================================================
// TYPES
// ============================================================================

export type ApiRequestType =
	| 'oauth_token' // OAuth 2.0 Token Endpoint
	| 'oauth_authorize' // OAuth 2.0 Authorization Endpoint
	| 'data_api_get' // PingOne Management API GET
	| 'data_api_post' // PingOne Management API POST
	| 'data_api_put' // PingOne Management API PUT
	| 'data_api_delete'; // PingOne Management API DELETE

export interface ApiRequestConfig {
	type: ApiRequestType;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	url: string;
	headers?: Record<string, string>;
	body?: string | Record<string, unknown>;
	description: string;
	educationalNotes?: string[];
	onProceed: () => void;
	onCancel?: () => void;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 10000;
	padding: 1rem;
	animation: ${({ $isOpen }) => ($isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.2s ease-in')};

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}

	@keyframes fadeOut {
		from { opacity: 1; transform: scale(1); }
		to { opacity: 0; transform: scale(0.95); }
	}
`;

const ModalContainer = styled.div`
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border-radius: 0.75rem;
	box-shadow: 
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(255, 255, 255, 0.05);
	max-width: 800px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	position: relative;
`;

const ModalHeader = styled.div<{ $type: ApiRequestType }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.25rem 1.5rem 0.75rem 1.5rem;
	background: ${({ $type }) => {
		switch ($type) {
			case 'oauth_token':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
			case 'oauth_authorize':
				return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
			case 'data_api_get':
				return 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
			case 'data_api_post':
				return 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)';
			case 'data_api_put':
				return 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)';
			case 'data_api_delete':
				return 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
			default:
				return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
		}
	}};
	border-bottom: 1px solid #e2e8f0;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div<{ $type: ApiRequestType }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: ${({ $type }) => {
		switch ($type) {
			case 'oauth_token':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'oauth_authorize':
				return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
			case 'data_api_get':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			case 'data_api_post':
				return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
			case 'data_api_put':
				return 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
			case 'data_api_delete':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
		}
	}};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const HeaderText = styled.div`
	flex: 1;
`;

const ModalTitle = styled.h2`
	font-size: 1.125rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	line-height: 1.2;
`;

const ModalSubtitle = styled.p`
	font-size: 0.8rem;
	color: #64748b;
	margin: 0.25rem 0 0 0;
	font-weight: 500;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1e293b;
	}
`;

const ModalContent = styled.div`
	padding: 1.25rem 1.5rem;
	flex: 1;
	overflow-y: auto;
`;

const Section = styled.div`
	margin-bottom: 1.25rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.div`
	font-size: 0.875rem;
	font-weight: 700;
	color: #1e293b;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoBox = styled.div`
	padding: 0.75rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	margin-bottom: 1.25rem;
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const InfoIcon = styled.div`
	color: #3b82f6;
	margin-top: 0.1rem;
`;

const InfoText = styled.p`
	font-size: 0.75rem;
	color: #1e40af;
	margin: 0;
	line-height: 1.5;
	flex: 1;
`;

const MethodBadge = styled.span<{ $method: string }>`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.7rem;
	font-weight: 700;
	font-family: 'Monaco', 'Courier New', monospace;
	background: ${({ $method }) => {
		switch ($method) {
			case 'GET':
				return '#10b981';
			case 'POST':
				return '#6366f1';
			case 'PUT':
				return '#ec4899';
			case 'DELETE':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
	color: white;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 0.75rem;
	padding: 0.75rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	font-size: 0.75rem;
`;

const ParameterLabel = styled.div`
	font-weight: 600;
	color: #64748b;
`;

const ParameterValue = styled.div`
	color: #1e293b;
	word-break: break-all;
	font-family: 'Monaco', 'Courier New', monospace;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CodeBlock = styled.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 0.75rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-size: 0.7rem;
	font-family: 'Monaco', 'Courier New', monospace;
	margin: 0;
	line-height: 1.5;
`;

const CopyButton = styled.button<{ $copied: boolean }>`
	padding: 0.4rem 0.75rem;
	background: ${({ $copied }) => ($copied ? '#10b981' : '#475569')};
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.7rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.35rem;
	transition: all 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		background: ${({ $copied }) => ($copied ? '#059669' : '#334155')};
	}
`;

const ToggleSecretButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.25rem;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`;

const EducationalNotesList = styled.ul`
	margin: 0.5rem 0 0 0;
	padding-left: 1.25rem;
	font-size: 0.75rem;
	color: #475569;
	line-height: 1.5;

	li {
		margin-bottom: 0.25rem;

		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const ModalActions = styled.div`
	padding: 1rem 1.5rem;
	background: #f9fafb;
	border-top: 1px solid #e2e8f0;
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.625rem 1.25rem;
	font-size: 0.8rem;
	font-weight: 600;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;

	${({ $variant }) => {
		if ($variant === 'primary') {
			return `
				background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
				color: white;
				box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

				&:hover {
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
				}
			`;
		} else {
			return `
				background: white;
				color: #475569;
				border: 1px solid #cbd5e1;

				&:hover {
					background: #f8fafc;
					border-color: #94a3b8;
				}
			`;
		}
	}}
`;

// ============================================================================
// MODAL COMPONENT
// ============================================================================

interface ApiRequestModalProps {
	isOpen: boolean;
	config: ApiRequestConfig | null;
	onClose: () => void;
}

const ApiRequestModal: React.FC<ApiRequestModalProps> = ({ isOpen, config, onClose }) => {
	const [copiedCurl, setCopiedCurl] = useState(false);
	const [showSecrets, setShowSecrets] = useState(false);

	if (!config) return null;

	// Get icon based on request type
	const getIcon = () => {
		switch (config.type) {
			case 'oauth_token':
				return <FiKey size={20} />;
			case 'oauth_authorize':
				return <FiShield size={20} />;
			case 'data_api_get':
				return <FiDatabase size={20} />;
			case 'data_api_post':
				return <FiSend size={20} />;
			case 'data_api_put':
				return <FiCode size={20} />;
			case 'data_api_delete':
				return <FiX size={20} />;
			default:
				return <FiSend size={20} />;
		}
	};

	// Get title based on request type
	const getTitle = () => {
		switch (config.type) {
			case 'oauth_token':
				return 'OAuth 2.0 Token Request';
			case 'oauth_authorize':
				return 'OAuth 2.0 Authorization Request';
			case 'data_api_get':
				return 'PingOne API GET Request';
			case 'data_api_post':
				return 'PingOne API POST Request';
			case 'data_api_put':
				return 'PingOne API PUT Request';
			case 'data_api_delete':
				return 'PingOne API DELETE Request';
			default:
				return 'API Request';
		}
	};

	// Generate cURL command
	const generateCurlCommand = () => {
		let curl = `curl -X ${config.method} \\\n  '${config.url}'`;

		if (config.headers) {
			Object.entries(config.headers).forEach(([key, value]) => {
				// Mask sensitive headers
				const displayValue =
					key.toLowerCase() === 'authorization' && !showSecrets
						? `Bearer ${value.split(' ')[1]?.substring(0, 20)}...`
						: value;
				curl += ` \\\n  -H '${key}: ${displayValue}'`;
			});
		}

		if (config.body) {
			const bodyStr =
				typeof config.body === 'string' ? config.body : JSON.stringify(config.body, null, 2);
			curl += ` \\\n  -d '${bodyStr}'`;
		}

		return curl;
	};

	const handleCopyCurl = () => {
		const curlCommand = generateCurlCommand();
		navigator.clipboard.writeText(curlCommand);
		setCopiedCurl(true);
		v4ToastManager.showSuccess('cURL command copied to clipboard');
		setTimeout(() => setCopiedCurl(false), 2000);
	};

	const handleProceed = () => {
		config.onProceed();
		onClose();
	};

	const handleCancel = () => {
		if (config.onCancel) {
			config.onCancel();
		}
		onClose();
	};

	return (
		<ModalOverlay $isOpen={isOpen} onClick={handleCancel}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader $type={config.type}>
					<HeaderContent>
						<HeaderIcon $type={config.type}>{getIcon()}</HeaderIcon>
						<HeaderText>
							<ModalTitle>{getTitle()}</ModalTitle>
							<ModalSubtitle>Review request details before sending</ModalSubtitle>
						</HeaderText>
					</HeaderContent>
					<CloseButton onClick={handleCancel} title="Close">
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalContent>
					<InfoBox>
						<InfoIcon>
							<FiInfo size={14} />
						</InfoIcon>
						<InfoText>
							<strong>Educational Preview:</strong> {config.description}
						</InfoText>
					</InfoBox>

					<Section>
						<SectionTitle>
							<FiSend size={14} />
							HTTP Request Details
						</SectionTitle>
						<ParameterGrid>
							<ParameterLabel>Method</ParameterLabel>
							<ParameterValue>
								<MethodBadge $method={config.method}>{config.method}</MethodBadge>
							</ParameterValue>

							<ParameterLabel>URL</ParameterLabel>
							<ParameterValue style={{ gridColumn: '1 / -1' }}>
								<ColoredUrlDisplay
									url={config.url}
									label="API Endpoint"
									showInfoButton={false}
									showCopyButton={true}
									showOpenButton={false}
								/>
							</ParameterValue>
						</ParameterGrid>
					</Section>

					{config.headers && Object.keys(config.headers).length > 0 && (
						<Section>
							<SectionTitle>
								<FiShield size={14} />
								Request Headers
							</SectionTitle>
							<ParameterGrid>
								{Object.entries(config.headers).map(([key, value]) => (
									<React.Fragment key={key}>
										<ParameterLabel>{key}</ParameterLabel>
										<ParameterValue>
											{key.toLowerCase() === 'authorization' && !showSecrets ? (
												<>
													<span>
														{value.split(' ')[0]} {value.split(' ')[1]?.substring(0, 20)}...
													</span>
													<ToggleSecretButton
														onClick={() => setShowSecrets(!showSecrets)}
														title={showSecrets ? 'Hide token' : 'Show token'}
													>
														{showSecrets ? <FiEyeOff size={14} /> : <FiEye size={14} />}
													</ToggleSecretButton>
												</>
											) : (
												value
											)}
										</ParameterValue>
									</React.Fragment>
								))}
							</ParameterGrid>
						</Section>
					)}

					{config.body && (
						<Section>
							<SectionTitle>
								<FiCode size={14} />
								Request Body
							</SectionTitle>
							<CodeBlock>
								{typeof config.body === 'string'
									? config.body
									: JSON.stringify(config.body, null, 2)}
							</CodeBlock>
						</Section>
					)}

					{config.educationalNotes && config.educationalNotes.length > 0 && (
						<Section>
							<SectionTitle>
								<FiInfo size={14} />
								Learning Notes
							</SectionTitle>
							<EducationalNotesList>
								{config.educationalNotes.map((note, index) => (
									<li key={index}>{note}</li>
								))}
							</EducationalNotesList>
						</Section>
					)}

					<Section>
						<SectionTitle>
							<FiCode size={14} />
							cURL Command
						</SectionTitle>
						<CodeBlock>{generateCurlCommand()}</CodeBlock>
						<CopyButton $copied={copiedCurl} onClick={handleCopyCurl}>
							{copiedCurl ? <FiCheck size={12} /> : <FiCopy size={12} />}
							{copiedCurl ? 'Copied!' : 'Copy cURL'}
						</CopyButton>
					</Section>
				</ModalContent>

				<ModalActions>
					<ActionButton $variant="secondary" onClick={handleCancel}>
						Cancel
					</ActionButton>
					<ActionButton $variant="primary" onClick={handleProceed}>
						<FiSend size={14} />
						Send Request
					</ActionButton>
				</ModalActions>
			</ModalContainer>
		</ModalOverlay>
	);
};

// ============================================================================
// SERVICE
// ============================================================================

class ApiRequestModalService {
	private listeners: Array<(config: ApiRequestConfig | null) => void> = [];
	private isOpenListeners: Array<(isOpen: boolean) => void> = [];

	showModal(config: ApiRequestConfig) {
		this.notifyListeners(config);
		this.notifyIsOpenListeners(true);
	}

	hideModal() {
		this.notifyListeners(null);
		this.notifyIsOpenListeners(false);
	}

	subscribe(listener: (config: ApiRequestConfig | null) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	subscribeIsOpen(listener: (isOpen: boolean) => void) {
		this.isOpenListeners.push(listener);
		return () => {
			this.isOpenListeners = this.isOpenListeners.filter((l) => l !== listener);
		};
	}

	private notifyListeners(config: ApiRequestConfig | null) {
		this.listeners.forEach((listener) => {
			listener(config);
		});
	}

	private notifyIsOpenListeners(isOpen: boolean) {
		this.isOpenListeners.forEach((listener) => {
			listener(isOpen);
		});
	}
}

// Export singleton instance
export const apiRequestModalService = new ApiRequestModalService();

// Provider component to render the modal
export const ApiRequestModalProvider: React.FC = () => {
	const [config, setConfig] = useState<ApiRequestConfig | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	React.useEffect(() => {
		const unsubscribeConfig = apiRequestModalService.subscribe(setConfig);
		const unsubscribeIsOpen = apiRequestModalService.subscribeIsOpen(setIsOpen);

		return () => {
			unsubscribeConfig();
			unsubscribeIsOpen();
		};
	}, []);

	const handleClose = useCallback(() => {
		apiRequestModalService.hideModal();
	}, []);

	return <ApiRequestModal isOpen={isOpen} config={config} onClose={handleClose} />;
};

export default apiRequestModalService;
