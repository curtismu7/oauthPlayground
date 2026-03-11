// src/components/WorkerTokenRequestModal.tsx
// lint-file-disable: token-value-in-jsx
// Educational modal showing worker token API request details

import React, { useState } from 'react';
import styled from 'styled-components';
import { useNotifications } from '../hooks/useNotifications';
import { FiRefreshCw } from '../icons';
import { logger } from '../utils/logger';
// import { createModuleLogger } from '../utils/consoleMigrationHelper'; // Temporarily commented - not used
import { ColoredUrlDisplay } from './ColoredUrlDisplay';

// Helper function to decode JWT
const decodeJWT = (token: string) => {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const hex = (c: string) => c.charCodeAt(0).toString(16).padStart(2, '0');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => `%${hex(c)}`)
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (error) {
		logger.error('WorkerTokenRequestModal', 'Failed to decode JWT:', undefined, error as Error);
		return { error: 'Invalid token format' };
	}
};

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
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.95);
		}
	}
`;

const ModalContainer = styled.div`
	background: linear-gradient(135deg, V9_COLORS.TEXT.WHITE 0%, V9_COLORS.BG.GRAY_LIGHT 100%);
	border-radius: 0.75rem;
	box-shadow:
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(255, 255, 255, 0.05);
	max-width: 700px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	position: relative;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.25rem 1.5rem 0.75rem 1.5rem;
	background: linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, V9_COLORS.BG.WARNING_BORDER 100%);
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const HeaderIcon = styled.div`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: linear-gradient(
		135deg,
		V9_COLORS.PRIMARY.YELLOW 0%,
		V9_COLORS.PRIMARY.YELLOW_DARK 100%
	);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
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
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin: 0.25rem 0 0 0;
	font-weight: 500;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
	min-height: 0;
`;

const Section = styled.div`
	margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h3`
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoBox = styled.div`
	background: linear-gradient(135deg, V9_COLORS.BG.SUCCESS 0%, V9_COLORS.BG.SUCCESS 100%);
	border: 1px solid V9_COLORS.PRIMARY.GREEN;
	border-radius: 0.5rem;
	padding: 0.75rem;
	margin-bottom: 1.25rem;
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
`;

const InfoIcon = styled.div`
	color: V9_COLORS.PRIMARY.GREEN_DARK;
	margin-top: 0.125rem;
`;

const InfoText = styled.div`
	color: V9_COLORS.PRIMARY.GREEN_DARK;
	font-size: 0.75rem;
	line-height: 1.4;

	strong {
		font-weight: 600;
	}
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 0.75rem;
	background: white;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	padding: 0.75rem;
`;

const ParameterLabel = styled.div`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	font-size: 0.8rem;
`;

const ParameterValue = styled.div`
	grid-column: 2;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: 'Fira Code', monospace;
	font-size: 0.8rem;
	color: #1e293b;
	background: V9_COLORS.BG.GRAY_LIGHT;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	overflow-x: auto;
	max-width: 100%;
	white-space: nowrap;
	position: relative;

	pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}
`;

const ToggleSecretButton = styled.button`
	background: none;
	border: none;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.25rem;
	transition: all 0.2s ease;
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);

	&:hover {
		background: V9_COLORS.TEXT.GRAY_LIGHTER;
		color: V9_COLORS.TEXT.GRAY_MEDIUM;
	}
`;

const FormField = styled.div`
	margin-bottom: 1rem;
`;

const FormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	color: #1e293b;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.625rem 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;
	background-color: V9_COLORS.TEXT.WHITE;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 1px V9_COLORS.PRIMARY.BLUE;
	}
`;

const PasswordToggle = styled.button`
	background: none;
	border: none;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.25rem;
	transition: all 0.2s ease;
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);

	&:hover {
		background: V9_COLORS.TEXT.GRAY_LIGHTER;
		color: V9_COLORS.TEXT.GRAY_MEDIUM;
	}
`;

const CodeBlock = styled.pre`
	background: #1e293b;
	color: V9_COLORS.TEXT.GRAY_LIGHTER;
	padding: 0.75rem;
	border-radius: 0.5rem;
	font-size: 0.75rem;
	overflow-x: auto;
	margin: 0;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	line-height: 1.4;
`;

const CopyButton = styled.button<{ $copied: boolean }>`
	padding: 0.4rem 0.75rem;
	background: ${({ $copied }) => ($copied ? '#10b981' : '#3b82f6')};
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.35rem;
	transition: all 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		background: ${({ $copied }) => ($copied ? '#059669' : '#2563eb')};
	}
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	padding: 1rem 1.5rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	margin-top: auto;
	background: #f9fafb;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary'; disabled?: boolean }>`
	opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1.25rem;
	border-radius: 0.375rem;
	border: none;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 100px;
	justify-content: center;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%);
					color: white;
					box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

					&:hover {
						background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%);
						transform: translateY(-1px);
					}
				`;
			case 'secondary':
				return `
					background: white;
					color: V9_COLORS.TEXT.GRAY_DARK;
					border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;

					&:hover {
						background: #f9fafb;
						border-color: V9_COLORS.TEXT.GRAY_LIGHT;
					}
				`;
		}
	}}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 0.5rem;
`;

interface WorkerTokenRequestModalProps {
	isOpen: boolean;
	onClose: () => void;
	onProceed: (token: string) => void;
	tokenEndpoint: string;
	requestParams: {
		grant_type: string;
		client_id: string;
		client_secret: string;
		scope?: string;
	};
	authMethod: string;
	region: string;
}

export const WorkerTokenRequestModal: React.FC<WorkerTokenRequestModalProps> = ({
	isOpen,
	onClose,
	onProceed,
	tokenEndpoint,
	requestParams,
	authMethod,
	region,
}) => {
	const { showSuccess } = useNotifications();
	const [copiedCurl, setCopiedCurl] = useState(false);
	const [showSecret, setShowSecret] = useState(false);
	const [generatedToken, setGeneratedToken] = useState<string>('');
	const [showToken, setShowToken] = useState(false);
	const [isTokenStep, setIsTokenStep] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleCopyCurl = () => {
		const curlCommand = generateCurlCommand();
		navigator.clipboard.writeText(curlCommand);
		setCopiedCurl(true);
		setTimeout(() => setCopiedCurl(false), 2000);
	};

	const handleSendRequest = async () => {
		try {
			setIsLoading(true);
			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					...(authMethod === 'client_secret_basic' && {
						Authorization: `Basic ${btoa(`${requestParams.client_id}:${requestParams.client_secret}`)}`,
					}),
				},
				body: new URLSearchParams({
					grant_type: 'client_credentials',
					...(authMethod !== 'client_secret_basic' && {
						client_id: requestParams.client_id,
						client_secret: requestParams.client_secret,
					}),
					...(requestParams.scope && { scope: requestParams.scope }),
				}).toString(),
			});

			const data = await response.json();
			if (data.access_token) {
				setGeneratedToken(data.access_token);
				setIsTokenStep(true);
			} else {
				throw new Error(data.error_description || 'Failed to get access token');
			}
		} catch (error) {
			logger.error('WorkerTokenRequestModal', 'Error generating token:', undefined, error as Error);
			// Handle error (show toast or error message)
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyToken = () => {
		navigator.clipboard.writeText(generatedToken);
		// Show notification that token was copied
		showSuccess('Token copied to clipboard');
	};

	const handleUseToken = () => {
		onProceed(generatedToken);
		onClose();
	};

	const generateCurlCommand = () => {
		const { client_id, client_secret, scope } = requestParams;

		if (authMethod === 'client_secret_basic') {
			// Basic auth - credentials in Authorization header
			return `curl -X POST '${tokenEndpoint}' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -H 'Authorization: Basic ${btoa(`${client_id}:${client_secret}`)}' \\
  -d 'grant_type=client_credentials${scope ? `&scope=${encodeURIComponent(scope)}` : ''}'`;
		} else {
			// Post auth - credentials in body
			return `curl -X POST '${tokenEndpoint}' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=client_credentials' \\
  -d 'client_id=${encodeURIComponent(client_id)}' \\
  -d 'client_secret=${encodeURIComponent(client_secret)}'${
		scope
			? ` \\
  -d 'scope=${encodeURIComponent(scope)}'`
			: ''
	}`;
		}
	};

	const getRegionDisplayName = (region: string): string => {
		switch (region.toLowerCase()) {
			case 'us':
				return 'US (auth.pingone.com)';
			case 'eu':
				return 'Europe (auth.pingone.eu)';
			case 'ap':
				return 'Asia Pacific (auth.pingone.asia)';
			case 'ca':
				return 'Canada (auth.pingone.ca)';
			default:
				return region;
		}
	};

	// Always return same structure (no early return) so React hook order is stable
	return (
		<ModalOverlay $isOpen={isOpen}>
			<ModalContainer>
				<ModalHeader>
					<HeaderContent>
						<HeaderIcon>
							<span style={{ fontSize: '24' }}>🔑</span>
						</HeaderIcon>
						<HeaderText>
							<ModalTitle>Worker Token API Request</ModalTitle>
							<ModalSubtitle>Review the Client Credentials Grant request</ModalSubtitle>
						</HeaderText>
					</HeaderContent>
					<CloseButton onClick={onClose} title="Close">
						<span style={{ fontSize: '20' }}>❌</span>
					</CloseButton>
				</ModalHeader>

				<ModalContent>
					{isTokenStep ? (
						<Section>
							<SectionTitle>
								<span style={{ fontSize: '14' }}>🔑</span>
								Generated Access Token
							</SectionTitle>
							<InfoBox>
								<InfoIcon>
									<span style={{ fontSize: '14' }}>ℹ️</span>
								</InfoIcon>
								<InfoText>
									<strong>Token Generated Successfully!</strong> This token will be used for API
									calls.
								</InfoText>
							</InfoBox>

							<FormField>
								<FormLabel>Access Token</FormLabel>
								<div style={{ position: 'relative' }}>
									<FormInput
										type={showToken ? 'text' : 'password'}
										value={generatedToken}
										readOnly
										style={{ paddingRight: '2.5rem' }}
									/>
									<PasswordToggle
										onClick={() => setShowToken(!showToken)}
										title={showToken ? 'Hide token' : 'Show token'}
									>
										{showToken ? (
											<span style={{ fontSize: '16' }}>🙈</span>
										) : (
											<span style={{ fontSize: '16' }}>👁️</span>
										)}
									</PasswordToggle>
								</div>
							</FormField>

							<Section>
								<SectionTitle>
									<i className="bi bi-question-circle" style={{ fontSize: '14' }}></i>
									Token Details
								</SectionTitle>
								<CodeBlock>
									<pre>{JSON.stringify(decodeJWT(generatedToken), null, 2)}</pre>
								</CodeBlock>
								<ButtonGroup>
									<ActionButton $variant="secondary" onClick={handleCopyToken} size="small">
										<span style={{ fontSize: '12' }}>📋</span>
										Copy Token
									</ActionButton>
								</ButtonGroup>
							</Section>
						</Section>
					) : (
						<>
							<InfoBox>
								<InfoIcon>
									<span style={{ fontSize: '14' }}>ℹ️</span>
								</InfoIcon>
								<InfoText>
									<strong>Client Credentials Grant:</strong> This machine-to-machine flow exchanges
									worker credentials for an access token.
								</InfoText>
							</InfoBox>

							<Section>
								<SectionTitle>
									<span style={{ fontSize: '14' }}>🛡️</span>
									Token Endpoint URL
								</SectionTitle>
								<ColoredUrlDisplay
									url={tokenEndpoint}
									label="PingOne Token Endpoint"
									showInfoButton={false}
									showCopyButton={true}
									showOpenButton={false}
								/>
								<div
									style={{
										marginTop: '0.5rem',
										fontSize: '0.75rem',
										color: '#6b7280',
									}}
								>
									<strong>Region:</strong> {getRegionDisplayName(region)}
								</div>
							</Section>

							<Section>
								<SectionTitle>
									<span style={{ fontSize: '14' }}>✅</span>
									Request Parameters
								</SectionTitle>
								<ParameterGrid>
									<ParameterLabel>Grant Type</ParameterLabel>
									<ParameterValue>client_credentials</ParameterValue>

									<ParameterLabel>Client ID</ParameterLabel>
									<ParameterValue>{requestParams.client_id}</ParameterValue>

									<ParameterLabel>Client Secret</ParameterLabel>
									<ParameterValue>
										<span style={{ flex: 1 }}>
											{showSecret
												? requestParams.client_secret
												: '•'.repeat(Math.min(requestParams.client_secret.length, 40))}
										</span>
										<ToggleSecretButton
											onClick={() => setShowSecret(!showSecret)}
											title={showSecret ? 'Hide secret' : 'Show secret'}
										>
											{showSecret ? (
												<span style={{ fontSize: '16' }}>🙈</span>
											) : (
												<span style={{ fontSize: '16' }}>👁️</span>
											)}
										</ToggleSecretButton>
									</ParameterValue>

									<ParameterLabel>Auth Method</ParameterLabel>
									<ParameterValue>
										{authMethod === 'client_secret_basic'
											? 'Basic (Authorization header)'
											: 'Post (Request body)'}
									</ParameterValue>

									{requestParams.scope && (
										<>
											<ParameterLabel>Scopes</ParameterLabel>
											<ParameterValue>{requestParams.scope}</ParameterValue>
										</>
									)}
								</ParameterGrid>
							</Section>

							<Section>
								<SectionTitle>
									<span style={{ fontSize: '14' }}>🔑</span>
									cURL Command
								</SectionTitle>
								<CodeBlock>{generateCurlCommand()}</CodeBlock>
								<CopyButton $copied={copiedCurl} onClick={handleCopyCurl}>
									{copiedCurl ? (
										<span style={{ fontSize: '12' }}>✅</span>
									) : (
										<span style={{ fontSize: '12' }}>📋</span>
									)}
									{copiedCurl ? 'Copied!' : 'Copy cURL'}
								</CopyButton>
							</Section>

							<InfoBox
								style={{
									background:
										'linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, V9_COLORS.BG.WARNING_BORDER 100%)',
									border: '1px solid V9_COLORS.PRIMARY.YELLOW',
									marginBottom: 0,
								}}
							>
								<InfoIcon style={{ color: '#d97706' }}>
									<span style={{ fontSize: '14' }}>ℹ️</span>
								</InfoIcon>
								<InfoText style={{ color: '#d97706' }}>
									<strong>Security:</strong> Sent securely over HTTPS. Credentials never logged.
								</InfoText>
							</InfoBox>
						</>
					)}
				</ModalContent>

				<ModalActions>
					<ActionButton $variant="secondary" onClick={onClose}>
						Cancel
					</ActionButton>
					<ActionButton
						$variant="primary"
						onClick={isTokenStep ? handleUseToken : handleSendRequest}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<FiRefreshCw className="animate-spin" size={14} />
								Generating...
							</>
						) : isTokenStep ? (
							<>
								<span style={{ fontSize: '14' }}>✅</span>
								Use Token
							</>
						) : (
							<>
								<span style={{ fontSize: '14' }}>🔑</span>
								Send Request
							</>
						)}
					</ActionButton>
				</ModalActions>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default WorkerTokenRequestModal;
