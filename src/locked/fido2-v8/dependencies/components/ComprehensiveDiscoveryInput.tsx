// src/components/ComprehensiveDiscoveryInput.tsx
/**
 * Comprehensive OIDC Discovery Input Component
 *
 * Supports multiple input types:
 * - PingOne Environment ID
 * - PingOne issuer URL
 * - Google OAuth
 * - Auth0 domain
 * - Microsoft tenant
 * - Generic OIDC provider URLs
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiInfo, FiSearch, FiX } from '@icons';
import styled from 'styled-components';
import {
	comprehensiveDiscoveryService,
	DiscoveryResult,
} from '../services/comprehensiveDiscoveryService';
import { CopyButtonVariants } from '../services/copyButtonService';
import {
	discoveryPersistenceService,
	PersistedDiscoveryData,
} from '../services/discoveryPersistenceService';

interface ComprehensiveDiscoveryInputProps {
	onDiscoveryComplete: (result: DiscoveryResult) => void;
	initialInput?: string;
	placeholder?: string;
	showProviderInfo?: boolean;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.5rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	position: relative;
	z-index: 1;
	min-width: 0;
	overflow: visible;
	width: 100%;
	box-sizing: border-box;
`;

const InputGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const Input = styled.input`
	flex: 1;
	padding: 0.75rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const SearchButton = styled.button<{ $loading?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: background-color 0.2s;
	opacity: ${(props) => (props.$loading ? 0.7 : 1)};

	&:hover:not(:disabled) {
		background-color: #2563eb;
	}

	&:disabled {
		cursor: not-allowed;
	}
`;

const ProviderInfo = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-top: 1rem;
`;

const ProviderCard = styled.div`
	padding: 0.75rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	font-size: 0.75rem;
`;

const ProviderName = styled.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const ProviderDescription = styled.div`
	color: #6b7280;
	line-height: 1.4;
`;

const Modal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	text-align: center;
	min-width: 300px;
	max-width: 500px;
`;

const Spinner = styled.div`
	width: 60px;
	height: 60px;
	border: 4px solid #e5e7eb;
	border-top-color: #3b82f6;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin: 0 auto 1.5rem;

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`;

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const ModalMessage = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin: 0;
`;

const PatienceMessage = styled.p<{ color: string }>`
	color: ${(props) => props.color};
	font-size: 0.875rem;
	margin: 0.5rem 0 0 0;
	font-weight: 500;
	transition: color 0.3s ease;
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;

	${({ $type }) => {
		switch ($type) {
			case 'success':
				return `
					background-color: #f0fdf4;
					color: #166534;
					border: 1px solid #bbf7d0;
				`;
			case 'error':
				return `
					background-color: #fef2f2;
					color: #991b1b;
					border: 1px solid #fecaca;
				`;
			case 'info':
				return `
					background-color: #eff6ff;
					color: #1e40af;
					border: 1px solid #bfdbfe;
				`;
		}
	}}
`;

const Examples = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 1rem;
`;

const ExampleTitle = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #374151;
`;

const ExampleList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const ExampleItem = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	padding: 0.25rem 0.5rem;
	background: #f3f4f6;
	border-radius: 0.25rem;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: #e5e7eb;
	}
`;

const LastEnvironmentIdCard = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #065f46;
`;

const LastEnvironmentIdLabel = styled.span`
	font-weight: 600;
	color: #047857;
`;

const LastEnvironmentIdValue = styled.span`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	word-break: break-all;
`;

const ResultsToggleContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 1rem;
	padding: 0.75rem;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const ResultsToggleButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #2563eb;
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
`;

const ResultsCollapsible = styled.div<{ $isOpen: boolean }>`
	overflow: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
	transition: ${(props) => (props.$isOpen ? 'opacity 0.3s ease' : 'all 0.3s ease')};
	max-height: ${(props) => (props.$isOpen ? 'none' : '0')};
	opacity: ${(props) => (props.$isOpen ? '1' : '0')};
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
`;

const ResultsContainer = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	overflow: visible;
`;

const ResultsTitle = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
`;

const EndpointsList = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 0.5rem;
`;

const EndpointItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.75rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	flex-wrap: wrap;
`;

const EndpointLabel = styled.span`
	font-weight: 500;
	color: #374151;
	min-width: 140px;
	flex-shrink: 0;
`;

const EndpointUrl = styled.span`
	color: #6b7280;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	word-break: break-all;
	word-wrap: break-word;
	flex: 1;
	min-width: 0;
	overflow-wrap: anywhere;
`;

const ProviderDetails = styled.div`
	margin-top: 1rem;
	padding: 0.75rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	color: #0c4a6e;
`;

const ComprehensiveDiscoveryInput: React.FC<ComprehensiveDiscoveryInputProps> = ({
	onDiscoveryComplete,
	initialInput = '',
	placeholder = 'Enter Environment ID, issuer URL, or provider...',
	showProviderInfo = true,
}) => {
	const [input, setInput] = useState(initialInput);
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
	const [showResults, setShowResults] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [patienceMessage, setPatienceMessage] = useState('');
	const [patienceColor, setPatienceColor] = useState('#6b7280');
	const [lastEnvironmentId, setLastEnvironmentId] = useState<string | null>(null);

	// Patience messages with different colors
	const patienceMessages = [
		{ text: 'Please be patient, discovering OIDC configuration...', color: '#6b7280' },
		{ text: 'Still working, fetching endpoints from server...', color: '#3b82f6' },
		{ text: 'Almost there, validating configuration...', color: '#10b981' },
		{ text: 'Finalizing discovery process...', color: '#f59e0b' },
		{ text: 'Processing OIDC metadata...', color: '#ef4444' },
		{ text: 'Connecting to authentication server...', color: '#8b5cf6' },
		{ text: 'Retrieving authorization endpoints...', color: '#06b6d4' },
		{ text: 'Loading token configuration...', color: '#84cc16' },
	];

	// Cycle through patience messages every 3 seconds when modal is showing
	useEffect(() => {
		if (!showModal) {
			setPatienceMessage('');
			return;
		}

		let messageIndex = 0;
		setPatienceMessage(patienceMessages[0].text);
		setPatienceColor(patienceMessages[0].color);

		const interval = setInterval(() => {
			messageIndex = (messageIndex + 1) % patienceMessages.length;
			setPatienceMessage(patienceMessages[messageIndex].text);
			setPatienceColor(patienceMessages[messageIndex].color);
		}, 3000);

		return () => clearInterval(interval);
	}, [showModal, patienceMessages]);

	// Auto-restore last used discovery on mount
	useEffect(() => {
		const lastUsed = discoveryPersistenceService.getLastUsedDiscovery();
		if (!lastUsed) {
			return;
		}

		setLastEnvironmentId(lastUsed.environmentId);

		if (!initialInput?.trim()) {
			setInput(lastUsed.environmentId);
			setStatus({
				type: 'info',
				message: `Restored last used: ${lastUsed.provider} (${lastUsed.environmentId.substring(0, 8)}...)`,
			});
		}
	}, [initialInput]);

	const handleDiscover = useCallback(async () => {
		if (!input.trim()) {
			setStatus({
				type: 'error',
				message: 'Please enter an Environment ID, issuer URL, or provider name',
			});
			return;
		}

		setIsLoading(true);
		setShowModal(true); // Show modal with spinner
		setStatus(null);
		setDiscoveryResult(null);
		setShowResults(false);

		try {
			const trimmedInput = input.trim();

			// Check if we have cached discovery first
			const cached =
				discoveryPersistenceService.getDiscovery(trimmedInput) ||
				discoveryPersistenceService.getDiscoveryByIssuer(trimmedInput);

			if (cached) {
				const cachedResult = {
					success: true,
					document: cached.document,
					issuerUrl: cached.issuerUrl,
					provider: cached.provider,
					cached: true,
				};

				// Add minimum delay to ensure spinner is visible
				await new Promise((resolve) => setTimeout(resolve, 500));

				setStatus({
					type: 'success',
					message: `Using cached ${cached.provider} endpoints`,
				});
				setDiscoveryResult(cachedResult);
				setLastEnvironmentId(cached.environmentId);
				onDiscoveryComplete(cachedResult);
				setIsLoading(false);
				setShowModal(false); // Hide modal before returning
				return;
			}

			// Perform fresh discovery
			const result = await comprehensiveDiscoveryService.discover({
				input: trimmedInput,
				timeout: 10000,
			});

			if (result.success && result.document && result.issuerUrl) {
				// Extract environment ID
				const envMatch = result.issuerUrl.match(
					/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
				);
				const envId = envMatch ? envMatch[1] : trimmedInput;

				// Save to persistence
				const dataToSave: PersistedDiscoveryData = {
					environmentId: envId,
					issuerUrl: result.issuerUrl,
					provider: result.provider || 'unknown',
					document: result.document,
					timestamp: Date.now(),
				};

				discoveryPersistenceService.saveDiscovery(dataToSave);

				setStatus({
					type: 'success',
					message: `Successfully discovered and saved ${result.provider} endpoints`,
				});
				setDiscoveryResult(result);
				setLastEnvironmentId(envId);
				onDiscoveryComplete(result);
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Discovery failed',
				});
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: error instanceof Error ? error.message : 'Discovery failed',
			});
		} finally {
			setIsLoading(false);
			setShowModal(false); // Hide modal
		}
	}, [input, onDiscoveryComplete]);

	const handleExampleClick = useCallback((example: string) => {
		setInput(example);
	}, []);

	const supportedProviders = comprehensiveDiscoveryService.getSupportedProviders();

	return (
		<Container>
			<InputGroup>
				<Input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					disabled={isLoading}
					onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleDiscover()}
				/>
				{input.trim() &&
					(() => {
						// Extract environment ID from input if it's a PingOne URL
						const envMatch = input.match(
							/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
						);
						if (envMatch) {
							return CopyButtonVariants.identifier(envMatch[1], 'Environment ID');
						}
						// For other inputs, copy the full input
						return CopyButtonVariants.identifier(input, 'Discovery Input');
					})()}
				<SearchButton
					onClick={handleDiscover}
					disabled={isLoading || !input.trim()}
					$loading={isLoading}
				>
					{isLoading ? <FiSearch className="animate-spin" /> : <FiSearch />}
					{isLoading ? 'Discovering...' : 'OIDC Discovery'}
				</SearchButton>
			</InputGroup>

			{lastEnvironmentId && (
				<LastEnvironmentIdCard>
					<LastEnvironmentIdLabel>Last Environment ID</LastEnvironmentIdLabel>
					<LastEnvironmentIdValue>
						{lastEnvironmentId}
						{CopyButtonVariants.identifier(lastEnvironmentId, 'Last Environment ID')}
					</LastEnvironmentIdValue>
				</LastEnvironmentIdCard>
			)}

			{status && (
				<StatusMessage $type={status.type}>
					{status.type === 'success' ? <FiCheck /> : status.type === 'error' ? <FiX /> : <FiInfo />}
					{status.message}
				</StatusMessage>
			)}

			{showProviderInfo && (
				<>
					<ProviderInfo>
						{supportedProviders.map((provider) => (
							<ProviderCard key={provider.type}>
								<ProviderName>{provider.name}</ProviderName>
								<ProviderDescription>{provider.description}</ProviderDescription>
							</ProviderCard>
						))}
					</ProviderInfo>

					<Examples>
						<ExampleTitle>Examples:</ExampleTitle>
						<ExampleList>
							<ExampleItem
								onClick={() => handleExampleClick('12345678-1234-1234-1234-123456789012')}
							>
								PingOne Environment ID: 12345678-1234-1234-1234-123456789012
							</ExampleItem>
							<ExampleItem
								onClick={() =>
									handleExampleClick(
										'https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as'
									)
								}
							>
								PingOne Issuer: https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as
							</ExampleItem>
							<ExampleItem onClick={() => handleExampleClick('https://accounts.google.com')}>
								Google OAuth: https://accounts.google.com
							</ExampleItem>
							<ExampleItem onClick={() => handleExampleClick('https://your-domain.auth0.com')}>
								Auth0 Domain: https://your-domain.auth0.com
							</ExampleItem>
							<ExampleItem
								onClick={() =>
									handleExampleClick('https://login.microsoftonline.com/your-tenant-id/v2.0')
								}
							>
								Microsoft: https://login.microsoftonline.com/your-tenant-id/v2.0
							</ExampleItem>
						</ExampleList>
					</Examples>
				</>
			)}

			{/* Results Toggle Button - Only show if we have successful results */}
			{discoveryResult?.success && discoveryResult.document && (
				<ResultsToggleContainer>
					<ResultsToggleButton onClick={() => setShowResults(!showResults)}>
						{showResults ? <FiEyeOff size={16} /> : <FiEye size={16} />}
						{showResults ? 'Hide Results' : 'Show Results'}
					</ResultsToggleButton>
					<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
						Click to {showResults ? 'hide' : 'show'} discovered endpoints
					</span>
				</ResultsToggleContainer>
			)}

			{/* Collapsible Results Section */}
			<ResultsCollapsible $isOpen={showResults}>
				{discoveryResult?.success && discoveryResult.document && (
					<ResultsContainer>
						<ResultsTitle>OIDC Discovery Results</ResultsTitle>

						{/* Provider Information */}
						{discoveryResult.provider && (
							<ProviderDetails>
								<strong>Provider:</strong> {discoveryResult.provider}
								{discoveryResult.cached && <span> (cached)</span>}
							</ProviderDetails>
						)}

						{/* Endpoints List */}
						<EndpointsList>
							{discoveryResult.document.authorization_endpoint && (
								<EndpointItem>
									<EndpointLabel>Authorization:</EndpointLabel>
									<EndpointUrl>{discoveryResult.document.authorization_endpoint}</EndpointUrl>
									{CopyButtonVariants.url(discoveryResult.document.authorization_endpoint)}
								</EndpointItem>
							)}

							{discoveryResult.document.token_endpoint && (
								<EndpointItem>
									<EndpointLabel>Token:</EndpointLabel>
									<EndpointUrl>{discoveryResult.document.token_endpoint}</EndpointUrl>
									{CopyButtonVariants.url(discoveryResult.document.token_endpoint)}
								</EndpointItem>
							)}

							{discoveryResult.document.userinfo_endpoint && (
								<EndpointItem>
									<EndpointLabel>UserInfo:</EndpointLabel>
									<EndpointUrl>{discoveryResult.document.userinfo_endpoint}</EndpointUrl>
									{CopyButtonVariants.url(discoveryResult.document.userinfo_endpoint)}
								</EndpointItem>
							)}

							{discoveryResult.document.jwks_uri && (
								<EndpointItem>
									<EndpointLabel>JWKS:</EndpointLabel>
									<EndpointUrl>{discoveryResult.document.jwks_uri}</EndpointUrl>
									{CopyButtonVariants.url(discoveryResult.document.jwks_uri)}
								</EndpointItem>
							)}

							{discoveryResult.document.end_session_endpoint && (
								<EndpointItem>
									<EndpointLabel>End Session:</EndpointLabel>
									<EndpointUrl>{discoveryResult.document.end_session_endpoint}</EndpointUrl>
									{CopyButtonVariants.url(discoveryResult.document.end_session_endpoint)}
								</EndpointItem>
							)}

							{discoveryResult.document.device_authorization_endpoint && (
								<EndpointItem>
									<EndpointLabel>Device Auth:</EndpointLabel>
									<EndpointUrl>
										{discoveryResult.document.device_authorization_endpoint}
									</EndpointUrl>
									{CopyButtonVariants.url(discoveryResult.document.device_authorization_endpoint)}
								</EndpointItem>
							)}

							{discoveryResult.document.pushed_authorization_request_endpoint && (
								<EndpointItem>
									<EndpointLabel>PAR:</EndpointLabel>
									<EndpointUrl>
										{discoveryResult.document.pushed_authorization_request_endpoint}
									</EndpointUrl>
									{CopyButtonVariants.url(
										discoveryResult.document.pushed_authorization_request_endpoint
									)}
								</EndpointItem>
							)}
						</EndpointsList>
					</ResultsContainer>
				)}
			</ResultsCollapsible>

			{/* Loading Modal */}
			{showModal && (
				<Modal>
					<ModalContent>
						<Spinner />
						<ModalTitle>Discovering OIDC Configuration</ModalTitle>
						<ModalMessage>
							Fetching configuration from {input}...
							<br />
							This may take a few moments.
						</ModalMessage>
						{patienceMessage && (
							<PatienceMessage color={patienceColor}>{patienceMessage}</PatienceMessage>
						)}
					</ModalContent>
				</Modal>
			)}
		</Container>
	);
};

export default ComprehensiveDiscoveryInput;
