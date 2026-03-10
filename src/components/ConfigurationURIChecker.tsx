// src/components/ConfigurationURIChecker.tsx
// Component to display and check redirect and logout URIs against PingOne configuration

import { FiInfo } from '../icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { callbackUriService } from '../services/callbackUriService';
import { fetchApplications } from '../services/pingOneApplicationService';
import { logger } from '../utils/logger';
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';
import { WorkerTokenModal } from './WorkerTokenModal';
export interface ConfigurationURICheckerProps {
	flowType?: string;
	environmentId?: string;
	clientId?: string;
	workerToken?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	region?: string;
}

interface URIStatus {
	uri: string;
	existsInPingOne: boolean | null; // null = not checked, true = exists, false = doesn't exist
	isChecking: boolean;
}

const Container = styled.div`
	margin: 1.5rem 0;
	padding: 1.5rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.75rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const Title = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`;

const InfoIcon = styled.span`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	cursor: help;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 1rem 0;
`;

const TableHeader = styled.thead`
	background: V9_COLORS.TEXT.WHITE;
`;

const TableRow = styled.tr<{ $isEven?: boolean }>`
	background: ${({ $isEven }) => ($isEven ? '#f8f9fa' : '#ffffff')};

	&:hover {
		background: V9_COLORS.BG.GRAY_MEDIUM;
	}
`;

const TableBody = styled.tbody``;

const TableCell = styled.td`
	padding: 0.75rem;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const TableHeaderCell = styled.th`
	padding: 0.75rem;
	text-align: left;
	font-size: 0.875rem;
	font-weight: 700;
	color: V9_COLORS.TEXT.GRAY_DARK;
	border-bottom: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const URICell = styled(TableCell)`
	font-family: 'Courier New', monospace;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 400px;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
`;

const StatusCell = styled(TableCell)`
	text-align: center;
`;

const StatusIndicator = styled.div<{ $status: boolean | null }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	color: ${({ $status }) => {
		if ($status === null) return '#6b7280';
		return $status ? '#059669' : '#dc2626';
	}};
`;

const ActionBar = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	border: none;
	background: ${({ $variant }) => ($variant === 'secondary' ? '#e5e7eb' : '#2563eb')};
	color: ${({ $variant }) => ($variant === 'secondary' ? '#1f2937' : '#ffffff')};
	font-weight: 600;
	cursor: pointer;
	transition: background 120ms ease;
	font-size: 0.875rem;

	&:hover {
		background: ${({ $variant }) => ($variant === 'secondary' ? '#e5e7eb' : '#2563eb')};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const LoadingSpinner = styled.span`
	animation: spin 1s linear infinite;

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const ErrorMessage = styled.div`
	color: V9_COLORS.PRIMARY.RED_DARK;
	font-size: 0.875rem;
	margin-top: 0.5rem;
`;

const HelperText = styled.p`
	margin: 0;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-size: 0.875rem;
`;

const CopyButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.25rem;
	background: white;
	color: V9_COLORS.TEXT.GRAY_DARK;
	cursor: pointer;
	transition: background 120ms ease;
	font-size: 0.75rem;
	margin-left: 0.5rem;

	&:hover {
		background: #f9fafb;
		border-color: V9_COLORS.TEXT.GRAY_LIGHT;
	}
`;

const ConfigurationURIChecker: React.FC<ConfigurationURICheckerProps> = ({
	flowType,
	environmentId,
	clientId,
	workerToken,
	redirectUri,
	postLogoutRedirectUri,
	region = 'NA',
}) => {
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [retrievedWorkerToken, setRetrievedWorkerToken] = useState<string>('');

	const [redirectURIStatus, setRedirectURIStatus] = useState<URIStatus>({
		uri: redirectUri || '',
		existsInPingOne: null,
		isChecking: false,
	});

	const [logoutURIStatus, setLogoutURIStatus] = useState<URIStatus>({
		uri: postLogoutRedirectUri || '',
		existsInPingOne: null,
		isChecking: false,
	});

	const [error, setError] = useState<string>('');

	// Check for worker token on mount from global service
	useEffect(() => {
		const checkWorkerToken = async () => {
			try {
				const token = await workerTokenServiceV8.getToken();
				if (token) {
					logger.info(
						'[Config URI Checker] ✅ Worker token valid from global service',
						'Logger info'
					);
					setRetrievedWorkerToken(token);
				} else {
					logger.info(
						'[Config URI Checker] ⚠️ No worker token found in global service',
						'Logger info'
					);
					setRetrievedWorkerToken('');
				}
			} catch (error) {
				logger.error(
					'ConfigurationURIChecker',
					'[Config URI Checker] Failed to check worker token:',
					undefined,
					error as Error
				);
				setRetrievedWorkerToken('');
			}
		};

		checkWorkerToken();

		// Listen for token updates
		const handleTokenUpdate = () => {
			checkWorkerToken();
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		window.addEventListener('storage', handleTokenUpdate);

		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
			window.removeEventListener('storage', handleTokenUpdate);
		};
	}, []);

	const effectiveWorkerToken = workerToken || retrievedWorkerToken;

	// Fetch applications and check URIs
	const checkURIs = useCallback(async () => {
		if (!effectiveWorkerToken || !environmentId) {
			if (!effectiveWorkerToken) {
				setShowWorkerTokenModal(true);
			} else {
				modernMessaging.showBanner({
					type: 'warning',
					title: 'Warning',
					message: 'Environment ID is required to check URIs',
					dismissible: true,
				});
			}
			return;
		}

		setError('');
		setRedirectURIStatus((prev) => ({ ...prev, isChecking: true }));
		setLogoutURIStatus((prev) => ({ ...prev, isChecking: true }));

		try {
			const fetchedApps = await fetchApplications({
				environmentId,
				region,
				workerToken: effectiveWorkerToken,
			});

			// Find the application that matches our clientId
			const matchedApp = clientId ? fetchedApps.find((app) => app.clientId === clientId) : null;

			// Check redirect URI
			if (redirectUri) {
				const redirectExists = matchedApp?.redirectUris?.includes(redirectUri) || false;
				setRedirectURIStatus({
					uri: redirectUri,
					existsInPingOne: redirectExists,
					isChecking: false,
				});
			} else {
				setRedirectURIStatus((prev) => ({ ...prev, isChecking: false }));
			}

			// Check logout URI
			if (postLogoutRedirectUri) {
				const logoutExists =
					matchedApp?.postLogoutRedirectUris?.includes(postLogoutRedirectUri) || false;
				setLogoutURIStatus({
					uri: postLogoutRedirectUri,
					existsInPingOne: logoutExists,
					isChecking: false,
				});
			} else {
				setLogoutURIStatus((prev) => ({ ...prev, isChecking: false }));
			}

			if (matchedApp) {
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'URI check completed',
					duration: 4000,
				});
			} else if (clientId) {
				modernMessaging.showBanner({
					type: 'warning',
					title: 'Warning',
					message: `Application with Client ID ${clientId.substring(0, 8)}... not found in PingOne`,
					dismissible: true,
				});
			}
		} catch (err) {
			logger.error(
				'ConfigurationURIChecker',
				'[ConfigurationURIChecker] Error checking URIs:',
				undefined,
				err as Error
			);
			setError(err instanceof Error ? err.message : 'Failed to check URIs');
			setRedirectURIStatus((prev) => ({ ...prev, isChecking: false }));
			setLogoutURIStatus((prev) => ({ ...prev, isChecking: false }));
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to check URIs against PingOne',
				dismissible: true,
			});
		}
	}, [effectiveWorkerToken, environmentId, clientId, redirectUri, postLogoutRedirectUri, region]);

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: `${label} copied to clipboard`,
			duration: 4000,
		});
	};

	// Get the flow type for display
	const getFlowDisplayName = () => {
		if (!flowType) return 'OAuth';

		// Handle v7 flow types
		if (flowType.includes('authorization-code')) return 'Authorization Code Flow';
		if (flowType.includes('implicit')) return 'Implicit Flow';
		if (flowType.includes('hybrid')) return 'Hybrid Flow';
		if (flowType.includes('device') || flowType.includes('device-authorization'))
			return 'Device Authorization Flow';
		if (flowType.includes('client-credentials')) return 'Client Credentials Flow';
		if (flowType.includes('worker-token')) return 'Worker Token Flow';
		if (flowType.includes('par') || flowType.includes('pushed-auth'))
			return 'Pushed Authorization Request (PAR) Flow';
		if (flowType.includes('rar') || flowType.includes('resource-authorization'))
			return 'Rich Authorization Request (RAR) Flow';
		if (flowType.includes('ciba')) return 'Client Initiated Backchannel Authentication (CIBA) Flow';
		if (flowType.includes('redirectless')) return 'Redirectless Flow';
		if (flowType.includes('oauth')) return 'OAuth Flow';
		if (flowType.includes('oidc')) return 'OIDC Flow';

		return 'OAuth Flow';
	};

	// Determine if redirect URI is used for this flow
	const requiresRedirectUri =
		!flowType?.includes('client-credentials') && !flowType?.includes('worker-token');

	// Determine if logout URI is used for this flow
	// All flows can have logout URIs according to callbackUriService
	const requiresLogoutUri = true;

	const hasURIToCheck =
		(redirectUri && requiresRedirectUri) || (postLogoutRedirectUri && requiresLogoutUri);

	return (
		<Container>
			<Header>
				<Title>Configuration URI Status</Title>
				<InfoIcon
					title={`Check if the configured URIs for ${getFlowDisplayName()} are registered in your PingOne application`}
				/>
			</Header>

			<HelperText>
				Verify that your URIs are properly configured in PingOne. This check requires a worker
				token.
			</HelperText>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHeaderCell>URI Type</TableHeaderCell>
						<TableHeaderCell>URI Value</TableHeaderCell>
						<TableHeaderCell>Status</TableHeaderCell>
					</TableRow>
				</TableHeader>
				<TableBody>
					{requiresRedirectUri && (
						<TableRow $isEven={false}>
							<TableCell>Redirect URI</TableCell>
							<URICell>
								{redirectUri || 'Not configured'}
								{redirectUri && (
									<CopyButton onClick={() => handleCopy(redirectUri, 'Redirect URI')}>
										<span style={{ fontSize: '12px' }}>📋</span>
									</CopyButton>
								)}
							</URICell>
							<StatusCell>
								{redirectUri ? (
									<StatusIndicator $status={redirectURIStatus.existsInPingOne}>
										{redirectURIStatus.isChecking ? (
											<>
												<LoadingSpinner size={14} />
												Checking...
											</>
										) : redirectURIStatus.existsInPingOne === null ? (
											<>
												<span style={{ fontSize: '14px' }}>ℹ️</span>
												Not checked
											</>
										) : redirectURIStatus.existsInPingOne ? (
											<>
												<span style={{ fontSize: '14px' }}>✅</span>
												Registered
											</>
										) : (
											<>
												<span style={{ fontSize: '14px' }}>❌</span>
												Not registered
											</>
										)}
									</StatusIndicator>
								) : (
									<span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>N/A</span>
								)}
							</StatusCell>
						</TableRow>
					)}

					{!requiresRedirectUri && (
						<TableRow $isEven={false}>
							<TableCell>Redirect URI</TableCell>
							<TableCell colSpan={2} style={{ color: '#9ca3af', fontStyle: 'italic' }}>
								Not used for {getFlowDisplayName()}
							</TableCell>
						</TableRow>
					)}

					{requiresLogoutUri && (
						<TableRow $isEven={true}>
							<TableCell>Post-Logout Redirect URI</TableCell>
							<URICell>
								{postLogoutRedirectUri || 'Not configured'}
								{postLogoutRedirectUri && (
									<CopyButton
										onClick={() => handleCopy(postLogoutRedirectUri, 'Post-Logout Redirect URI')}
									>
										<span style={{ fontSize: '12px' }}>📋</span>
									</CopyButton>
								)}
							</URICell>
							<StatusCell>
								{postLogoutRedirectUri ? (
									<StatusIndicator $status={logoutURIStatus.existsInPingOne}>
										{logoutURIStatus.isChecking ? (
											<>
												<LoadingSpinner size={14} />
												Checking...
											</>
										) : logoutURIStatus.existsInPingOne === null ? (
											<>
												<span style={{ fontSize: '14px' }}>ℹ️</span>
												Not checked
											</>
										) : logoutURIStatus.existsInPingOne ? (
											<>
												<span style={{ fontSize: '14px' }}>✅</span>
												Registered
											</>
										) : (
											<>
												<span style={{ fontSize: '14px' }}>❌</span>
												Not registered
											</>
										)}
									</StatusIndicator>
								) : (
									<span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>N/A</span>
								)}
							</StatusCell>
						</TableRow>
					)}

					{!requiresLogoutUri && (
						<TableRow $isEven={true}>
							<TableCell>Post-Logout Redirect URI</TableCell>
							<TableCell colSpan={2} style={{ color: '#9ca3af', fontStyle: 'italic' }}>
								Not used for {getFlowDisplayName()}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{error && <ErrorMessage>{error}</ErrorMessage>}

			{/* All V7 Flow URI Reference Table */}
			<div
				style={{
					marginTop: '2rem',
					paddingTop: '2rem',
					borderTop: '2px solid V9_COLORS.TEXT.GRAY_LIGHTER',
				}}
			>
				<div style={{ marginBottom: '1rem' }}>
					<h3
						style={{
							margin: 0,
							fontSize: '1rem',
							fontWeight: 600,
							color: '#1f2937',
						}}
					>
						All V7 Flow URIs Reference
					</h3>
					<p
						style={{
							margin: '0.25rem 0 0 0',
							fontSize: '0.875rem',
							color: '#6b7280',
						}}
					>
						Complete list of redirect and logout URIs for all V7 flows
					</p>
					<p
						style={{
							margin: '0.25rem 0 0 0',
							fontSize: '0.75rem',
							color: '#9ca3af',
							fontStyle: 'italic',
						}}
					>
						Note: Additional V7 flows (PAR, RAR, CIBA, Redirectless, Worker Token) use the
						Authorization Code or Implicit flow URIs above
					</p>
				</div>

				<Table style={{ marginTop: '1rem' }}>
					<TableHeader>
						<TableRow>
							<TableHeaderCell style={{ width: '25%' }}>Flow Type</TableHeaderCell>
							<TableHeaderCell style={{ width: '35%' }}>Redirect URI</TableHeaderCell>
							<TableHeaderCell style={{ width: '35%' }}>Logout URI</TableHeaderCell>
							<TableHeaderCell style={{ width: '5%' }}></TableHeaderCell>
						</TableRow>
					</TableHeader>
					<TableBody>
						{callbackUriService.getAllRedirectUriInfo().map((flowInfo, index) => (
							<TableRow key={flowInfo.flowType} $isEven={index % 2 === 1}>
								<TableCell style={{ fontWeight: 500 }}>{flowInfo.description}</TableCell>
								<URICell>
									{flowInfo.redirectUri}
									<CopyButton
										onClick={() =>
											handleCopy(flowInfo.redirectUri, `${flowInfo.description} Redirect URI`)
										}
									>
										<span style={{ fontSize: '12px' }}>📋</span>
									</CopyButton>
								</URICell>
								<URICell>
									{flowInfo.logoutUri}
									<CopyButton
										onClick={() =>
											handleCopy(flowInfo.logoutUri, `${flowInfo.description} Logout URI`)
										}
									>
										<span style={{ fontSize: '12px' }}>📋</span>
									</CopyButton>
								</URICell>
								<TableCell style={{ textAlign: 'center' }}>
									<FiInfo
										size={14}
										style={{ color: '#9ca3af', cursor: 'help' }}
										title={`${flowInfo.note} ${flowInfo.logoutNote}`}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<ActionBar>
				{!effectiveWorkerToken ? (
					<ActionButton onClick={() => setShowWorkerTokenModal(true)}>
						<span style={{ fontSize: '16px' }}>🔑</span>
						Get Worker Token
					</ActionButton>
				) : (
					<ActionButton
						onClick={checkURIs}
						disabled={
							!environmentId ||
							!clientId ||
							!hasURIToCheck ||
							redirectURIStatus.isChecking ||
							logoutURIStatus.isChecking
						}
					>
						<span style={{ fontSize: '16px' }}>🔄</span>
						Check URIs Against PingOne
					</ActionButton>
				)}

				{(redirectURIStatus.existsInPingOne === false ||
					logoutURIStatus.existsInPingOne === false) && (
					<HelperText style={{ margin: 0 }}>
						⚠️ Add missing URIs to your PingOne application's configuration
					</HelperText>
				)}
			</ActionBar>

			{showWorkerTokenModal && (
				<WorkerTokenModal
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onContinue={() => {
						setShowWorkerTokenModal(false);
						// Re-check worker token
						const stored = localStorage.getItem('worker_token');
						if (stored) {
							setRetrievedWorkerToken(stored);
							// Auto-trigger check after getting token
							setTimeout(() => {
								if (environmentId && clientId && (redirectUri || postLogoutRedirectUri)) {
									checkURIs();
								}
							}, 500);
						}
					}}
					flowType={flowType || 'flow'}
					environmentId={environmentId || ''}
				/>
			)}
		</Container>
	);
};

export default ConfigurationURIChecker;
