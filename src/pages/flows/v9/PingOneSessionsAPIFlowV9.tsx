// src/pages/flows/v9/PingOneSessionsAPIFlowV9.tsx

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../../../components/Card';
import { ColoredJsonDisplay } from '../../../components/ColoredJsonDisplay';
import { WorkerTokenSectionV9 } from '../../../components/WorkerTokenSectionV9';
import { showGlobalError, showGlobalSuccess } from '../../../contexts/NotificationSystem';
import { unifiedWorkerTokenService } from '../../../services/unifiedWorkerTokenService';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionsApiCredentials {
	environmentId: string;
	userId: string;
	sessionId: string;
	accessToken: string;
}

interface ApiResponse {
	status: number;
	statusText: string;
	data: unknown;
	headers: Record<string, string>;
}

interface EnvironmentSession {
	id: string;
	userId: string;
	applicationId: string;
	applicationName?: string;
	deviceId?: string;
	deviceName?: string;
	createdAt: string;
	expiresAt?: string;
	lastAccessAt?: string;
	status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

interface WorkerTokenStatus {
	hasToken: boolean;
	isValid: boolean;
	expiresAt?: number;
	environmentId?: string;
	clientId?: string;
}

interface RawPingOneSession {
	id: string;
	createdAt: string;
	expiresAt?: string;
	lastAccessAt?: string;
	status?: string;
	_embedded?: {
		user?: { id?: string };
		application?: { id?: string; name?: string };
		device?: { id?: string; name?: string };
	};
}

// ─── Styled Components (V9 Color Standards) ───────────────────────────────────

const Container = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 1.5rem;
`;

const OverviewCard = styled(Card)`
	margin-bottom: 2rem;
	border-left: 4px solid ${V9_COLORS.PRIMARY.BLUE};
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-top: 2rem;
`;

const FeatureCard = styled(Card)`
	border-left: 4px solid ${V9_COLORS.BORDER.INFO};
	transition:
		transform 0.2s,
		box-shadow 0.2s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
`;

const CodeBlock = styled.pre`
	background-color: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const PingOneNote = styled.div`
	background-color: ${V9_COLORS.BG.INFO_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.INFO};
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0 2rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: ${V9_COLORS.TEXT.INFO};
		flex-shrink: 0;
		margin-top: 0.1rem;
	}
`;

const SecurityNote = styled.div`
	background-color: ${V9_COLORS.BG.ERROR_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.ERROR};
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0 2rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: ${V9_COLORS.TEXT.ERROR};
		flex-shrink: 0;
		margin-top: 0.1rem;
	}
`;

const EndpointBadge = styled.span<{ method: string }>`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	margin-right: 0.5rem;
	background-color: ${({ method }) => {
		switch (method) {
			case 'GET':
				return V9_COLORS.STATUS.SUCCESS;
			case 'POST':
				return V9_COLORS.PRIMARY.BLUE;
			case 'DELETE':
				return V9_COLORS.TEXT.ERROR;
			case 'PUT':
				return V9_COLORS.STATUS.WARNING;
			default:
				return V9_COLORS.TEXT.GRAY_MEDIUM;
		}
	}};
	color: white;
`;

const InputGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background-color: white;
	cursor: pointer;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: none;

	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
					background-color: ${V9_COLORS.PRIMARY.BLUE};
					color: white;
					&:hover:not(:disabled) {
						background-color: ${V9_COLORS.PRIMARY.BLUE_DARK};
					}
				`;
			case 'secondary':
				return `
					background-color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
					color: white;
					&:hover:not(:disabled) {
						background-color: #4b5563;
					}
				`;
			case 'danger':
				return `
					background-color: ${V9_COLORS.TEXT.ERROR};
					color: white;
					&:hover:not(:disabled) {
						background-color: ${V9_COLORS.PRIMARY.RED_DARK};
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const RequestDetailsBox = styled.div`
	background-color: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const StatusBadge = styled.span<{ status: number }>`
	display: inline-block;
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${({ status }) => {
		if (status >= 200 && status < 300) return V9_COLORS.STATUS.SUCCESS;
		if (status >= 400 && status < 500) return V9_COLORS.STATUS.WARNING;
		if (status >= 500) return V9_COLORS.TEXT.ERROR;
		return V9_COLORS.TEXT.GRAY_MEDIUM;
	}};
	color: white;
`;

const CredentialsTypeIndicator = styled.div<{ type: 'worker' | 'authz' | 'manual' }>`
	background-color: ${({ type }) => {
		switch (type) {
			case 'worker':
				return V9_COLORS.BG.SUCCESS_LIGHT;
			case 'authz':
				return V9_COLORS.BG.INFO_LIGHT;
			case 'manual':
				return V9_COLORS.BG.WARNING_LIGHT;
		}
	}};
	border: 1px solid
		${({ type }) => {
			switch (type) {
				case 'worker':
					return V9_COLORS.BORDER.SUCCESS;
				case 'authz':
					return V9_COLORS.BORDER.INFO;
				case 'manual':
					return V9_COLORS.BORDER.WARNING;
			}
		}};
	border-radius: 0.375rem;
	padding: 0.5rem 1rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ type }) => {
		switch (type) {
			case 'worker':
				return V9_COLORS.TEXT.SUCCESS;
			case 'authz':
				return V9_COLORS.TEXT.INFO;
			case 'manual':
				return V9_COLORS.STATUS.WARNING;
		}
	}};
`;

const _EnvironmentSessionsContainer = styled.div`
	margin-top: 2rem;
`;

const SessionsTable = styled.div`
	background: white;
	border: 1px solid ${V9_COLORS.BORDER.GRAY};
	border-radius: 0.5rem;
	overflow: hidden;
	margin-top: 1rem;
`;

const TableHeader = styled.div`
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border-bottom: 1px solid ${V9_COLORS.BORDER.GRAY};
	padding: 1rem;
	display: grid;
	grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr 1fr;
	gap: 1rem;
	font-weight: 600;
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const TableRow = styled.div`
	border-bottom: 1px solid ${V9_COLORS.BORDER.GRAY_LIGHT};
	padding: 1rem;
	display: grid;
	grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr 1fr;
	gap: 1rem;
	font-size: 0.875rem;
	transition: background-color 0.2s;

	&:hover {
		background-color: ${V9_COLORS.BG.GRAY_LIGHT};
	}

	&:last-child {
		border-bottom: none;
	}
`;

const SessionId = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	word-break: break-all;
`;

const SessionStatusBadge = styled.span<{ status: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background-color: ${({ status }) => {
		switch (status) {
			case 'ACTIVE':
				return V9_COLORS.BG.SUCCESS_LIGHT;
			case 'EXPIRED':
				return V9_COLORS.BG.WARNING_LIGHT;
			case 'REVOKED':
				return V9_COLORS.BG.ERROR_LIGHT;
			default:
				return V9_COLORS.BG.GRAY_LIGHT;
		}
	}};
	color: ${({ status }) => {
		switch (status) {
			case 'ACTIVE':
				return V9_COLORS.TEXT.SUCCESS;
			case 'EXPIRED':
				return V9_COLORS.STATUS.WARNING;
			case 'REVOKED':
				return V9_COLORS.TEXT.ERROR;
			default:
				return V9_COLORS.TEXT.GRAY_MEDIUM;
		}
	}};
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 3rem;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};

	h4 {
		margin: 0 0 0.5rem 0;
		color: ${V9_COLORS.TEXT.GRAY_DARK};
	}

	p {
		margin: 0;
		font-size: 0.875rem;
	}
`;

// ─── Component ─────────────────────────────────────────────────────────────

const PingOneSessionsAPIFlowV9: React.FC = () => {
	const [credentials, setCredentials] = useState<SessionsApiCredentials>({
		environmentId: '',
		userId: '',
		sessionId: '',
		accessToken: '',
	});
	const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedEndpoint, setSelectedEndpoint] = useState<string>('read-all');
	const [workerTokenStatus, setWorkerTokenStatus] = useState<WorkerTokenStatus>({
		hasToken: false,
		isValid: false,
	});
	const [credentialsType, setCredentialsType] = useState<'worker' | 'authz' | 'manual'>('manual');
	const [environmentSessions, setEnvironmentSessions] = useState<EnvironmentSession[]>([]);
	const [isLoadingEnvironmentSessions, setIsLoadingEnvironmentSessions] = useState(false);

	// Check worker token status on mount
	useEffect(() => {
		const checkWorkerToken = async () => {
			try {
				const tokenData = await unifiedWorkerTokenService.getTokenData();
				if (tokenData.success && tokenData.data) {
					const token = tokenData.data;
					setWorkerTokenStatus({
						hasToken: true,
						isValid: token.expiresAt ? token.expiresAt > Date.now() : false,
						expiresAt: token.expiresAt,
						environmentId: token.credentials.environmentId,
						clientId: token.credentials.clientId,
					});

					// Auto-populate environment ID from worker token
					if (token.credentials.environmentId && !credentials.environmentId) {
						setCredentials((prev) => ({
							...prev,
							environmentId: token.credentials.environmentId,
							accessToken: token.token,
						}));
						setCredentialsType('worker');
					}
				}
			} catch (error) {
				console.error('Failed to check worker token status:', error);
			}
		};

		checkWorkerToken();
	}, [credentials.environmentId]);

	// Auto-populate access token from worker token when available
	useEffect(() => {
		if (workerTokenStatus.hasToken && workerTokenStatus.isValid && !credentials.accessToken) {
			setCredentials((prev) => ({
				...prev,
				accessToken: 'WORKER_TOKEN', // Placeholder - will be replaced with actual token
			}));
		}
	}, [workerTokenStatus.hasToken, workerTokenStatus.isValid, credentials.accessToken]);

	const getWorkerToken = useCallback(async () => {
		try {
			const tokenData = await unifiedWorkerTokenService.getTokenData();
			if (tokenData.success && tokenData.data) {
				const token = tokenData.data;
				setCredentials((prev) => ({
					...prev,
					environmentId: token.credentials.environmentId,
					accessToken: token.token,
				}));
				setCredentialsType('worker');
				setWorkerTokenStatus({
					hasToken: true,
					isValid: token.expiresAt ? token.expiresAt > Date.now() : false,
					expiresAt: token.expiresAt,
					environmentId: token.credentials.environmentId,
					clientId: token.credentials.clientId,
				});
				showGlobalSuccess('Worker token loaded successfully');
			} else {
				showGlobalError('No worker token available. Please configure worker token first.');
			}
		} catch {
			showGlobalError('Failed to load worker token');
		}
	}, []);

	// Fetch all sessions in the environment
	const fetchEnvironmentSessions = useCallback(async () => {
		if (!credentials.environmentId || !credentials.accessToken) {
			showGlobalError('Environment ID and access token are required to fetch sessions');
			return;
		}

		setIsLoadingEnvironmentSessions(true);
		try {
			const response = await fetch(
				`https://api.pingone.com/v1/environments/${credentials.environmentId}/sessions`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${credentials.accessToken}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			const sessions: EnvironmentSession[] = (data._embedded?.sessions || []).map(
				(session: RawPingOneSession) => ({
					id: session.id,
					userId: session._embedded?.user?.id || 'Unknown',
					applicationId: session._embedded?.application?.id || 'Unknown',
					applicationName: session._embedded?.application?.name || 'Unknown App',
					deviceId: session._embedded?.device?.id,
					deviceName: session._embedded?.device?.name || 'Unknown Device',
					createdAt: session.createdAt,
					expiresAt: session.expiresAt,
					lastAccessAt: session.lastAccessAt,
					status: session.status || 'ACTIVE',
				})
			);

			setEnvironmentSessions(sessions);
			showGlobalSuccess(`Loaded ${sessions.length} sessions from environment`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			showGlobalError(`Failed to fetch environment sessions: ${errorMessage}`);
			setEnvironmentSessions([]);
		} finally {
			setIsLoadingEnvironmentSessions(false);
		}
	}, [credentials.environmentId, credentials.accessToken]);

	// API call handler
	const handleApiCall = async (endpoint: string) => {
		setIsLoading(true);
		setApiResponse(null);

		try {
			let url = '';
			let method = 'GET';
			let body: string | undefined;

			switch (endpoint) {
				case 'read-all':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions`;
					method = 'GET';
					break;
				case 'read-one':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions/${credentials.sessionId}`;
					method = 'GET';
					break;
				case 'delete':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions/${credentials.sessionId}`;
					method = 'DELETE';
					break;
				case 'delete-all':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions`;
					method = 'DELETE';
					break;
				default:
					throw new Error('Unknown endpoint');
			}

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${credentials.accessToken}`,
			};

			const response = await fetch(url, {
				method,
				headers,
				body,
			});

			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			const data = response.status === 204 ? null : await response.json().catch(() => null);

			setApiResponse({
				status: response.status,
				statusText: response.statusText,
				data,
				headers: responseHeaders,
			});

			if (response.ok) {
				showGlobalSuccess(`API call successful: ${response.status} ${response.statusText}`);
			} else {
				showGlobalError(`API call failed: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setApiResponse({
				status: 0,
				statusText: errorMessage,
				data: { error: errorMessage },
				headers: {},
			});
			showGlobalError(`API call failed: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	};

	const renderCredentialsIndicator = () => {
		if (credentialsType === 'worker' && workerTokenStatus.hasToken) {
			return (
				<CredentialsTypeIndicator type="worker">
					<span>🔑</span>
					Using Worker Token Credentials
					{workerTokenStatus.environmentId && (
						<span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
							(Env: {workerTokenStatus.environmentId})
						</span>
					)}
				</CredentialsTypeIndicator>
			);
		}

		if (credentialsType === 'authz') {
			return (
				<CredentialsTypeIndicator type="authz">
					<span>🔐</span>
					Using Authorization Code Flow Credentials
				</CredentialsTypeIndicator>
			);
		}

		return (
			<CredentialsTypeIndicator type="manual">
				<span>✏️</span>
				Using Manual Credentials
			</CredentialsTypeIndicator>
		);
	};

	return (
		<Container>
			<V9FlowHeader
				title="PingOne Sessions API"
				subtitle="Interactive API testing for PingOne Sessions management endpoints"
				flowId="pingone-sessions-api"
				showRestart={true}
			/>

			{/* Overview */}
			<OverviewCard>
				<CardBody>
					<h3>What is the PingOne Sessions API?</h3>
					<p>
						The PingOne Sessions API allows you to manage user sessions programmatically. You can
						view all active sessions, retrieve specific session details, and revoke sessions as
						needed.
					</p>

					{renderCredentialsIndicator()}

					<FeatureGrid>
						<FeatureCard>
							<CardBody>
								<h4>📋 Read All Sessions</h4>
								<p>
									Retrieve all active sessions for a specific user across all devices and
									applications.
								</p>
								<CodeBlock>{`GET /v1/environments/{envId}/users/{userId}/sessions`}</CodeBlock>
							</CardBody>
						</FeatureCard>

						<FeatureCard>
							<CardBody>
								<h4>🔍 Read Single Session</h4>
								<p>
									Get detailed information about a specific session, including device and
									application details.
								</p>
								<CodeBlock>{`GET /v1/environments/{envId}/users/{userId}/sessions/{sessionId}`}</CodeBlock>
							</CardBody>
						</FeatureCard>

						<FeatureCard>
							<CardBody>
								<h4>🗑️ Revoke Session</h4>
								<p>Revoke a specific session to immediately terminate access for that session.</p>
								<CodeBlock>{`DELETE /v1/environments/{envId}/users/{userId}/sessions/{sessionId}`}</CodeBlock>
							</CardBody>
						</FeatureCard>

						<FeatureCard>
							<CardBody>
								<h4>🚫 Revoke All Sessions</h4>
								<p>
									Revoke all active sessions for a user, forcing them to re-authenticate on next
									access.
								</p>
								<CodeBlock>{`DELETE /v1/environments/{envId}/users/{userId}/sessions`}</CodeBlock>
							</CardBody>
						</FeatureCard>
					</FeatureGrid>
				</CardBody>
			</OverviewCard>

			{/* Worker Token Section */}
			<WorkerTokenSectionV9 $compact={true} />

			{/* Environment Sessions Section */}
			<Card>
				<CardBody>
					<h3>Environment Sessions Overview</h3>
					<p>View all active sessions across your entire PingOne environment.</p>

					<Button
						variant="primary"
						onClick={fetchEnvironmentSessions}
						disabled={
							isLoadingEnvironmentSessions || !credentials.environmentId || !credentials.accessToken
						}
						style={{ marginBottom: '1rem' }}
					>
						{isLoadingEnvironmentSessions ? (
							<>
								<span>⏳</span>
								Loading Sessions...
							</>
						) : (
							<>
								<span>🌐</span>
								Load Environment Sessions
							</>
						)}
					</Button>

					{environmentSessions.length > 0 && (
						<SessionsTable>
							<TableHeader>
								<div>Session ID</div>
								<div>User ID</div>
								<div>Application</div>
								<div>Device</div>
								<div>Created</div>
								<div>Status</div>
							</TableHeader>
							{environmentSessions.map((session) => (
								<TableRow key={session.id}>
									<div>
										<SessionId>{session.id}</SessionId>
									</div>
									<div>{session.userId}</div>
									<div>{session.applicationName}</div>
									<div>{session.deviceName}</div>
									<div>
										{new Date(session.createdAt).toLocaleDateString()}
										<br />
										<small style={{ color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
											{new Date(session.createdAt).toLocaleTimeString()}
										</small>
									</div>
									<div>
										<SessionStatusBadge status={session.status}>
											{session.status}
										</SessionStatusBadge>
									</div>
								</TableRow>
							))}
						</SessionsTable>
					)}

					{!isLoadingEnvironmentSessions &&
						environmentSessions.length === 0 &&
						credentials.environmentId && (
							<EmptyState>
								<h4>No Sessions Found</h4>
								<p>
									Either there are no active sessions in this environment or you don't have
									permission to view them.
								</p>
							</EmptyState>
						)}

					{!credentials.environmentId && (
						<EmptyState>
							<h4>Environment ID Required</h4>
							<p>Please configure your environment ID and access token to load sessions.</p>
						</EmptyState>
					)}
				</CardBody>
			</Card>

			{/* API Testing Interface */}
			<Card>
				<CardBody>
					<h3>API Testing Interface</h3>
					<p>Test the PingOne Sessions API endpoints with your credentials.</p>

					{/* Worker Token Quick Access */}
					{workerTokenStatus.hasToken && (
						<div style={{ marginBottom: '1rem' }}>
							<Button variant="secondary" onClick={getWorkerToken} disabled={isLoading}>
								<span>🔑</span>
								Use Worker Token Credentials
							</Button>
						</div>
					)}

					{/* Endpoint Selection */}
					<InputGroup>
						<Label>Select Endpoint:</Label>
						<Select
							value={selectedEndpoint}
							onChange={(e) => setSelectedEndpoint(e.target.value)}
							disabled={isLoading}
						>
							<option value="read-all">Read All Sessions</option>
							<option value="read-one">Read Single Session</option>
							<option value="delete">Delete Single Session</option>
							<option value="delete-all">Delete All Sessions</option>
						</Select>
					</InputGroup>

					{/* Credentials Input */}
					<InputGroup>
						<Label>Environment ID:</Label>
						<Input
							type="text"
							value={credentials.environmentId}
							onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
							placeholder="Your PingOne Environment ID"
							disabled={isLoading || credentialsType === 'worker'}
						/>
					</InputGroup>

					<InputGroup>
						<Label>User ID:</Label>
						<Input
							type="text"
							value={credentials.userId}
							onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
							placeholder="PingOne User ID"
							disabled={isLoading}
						/>
					</InputGroup>

					{(selectedEndpoint === 'read-one' || selectedEndpoint === 'delete') && (
						<InputGroup>
							<Label>Session ID:</Label>
							<Input
								type="text"
								value={credentials.sessionId}
								onChange={(e) => setCredentials({ ...credentials, sessionId: e.target.value })}
								placeholder="Session ID to target"
								disabled={isLoading}
							/>
						</InputGroup>
					)}

					<InputGroup>
						<Label>Access Token:</Label>
						<Input
							type="password"
							value={credentials.accessToken}
							onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
							placeholder="Bearer token (or leave empty to use worker token)"
							disabled={isLoading || credentialsType === 'worker'}
						/>
						{credentialsType === 'worker' && (
							<small style={{ color: V9_COLORS.TEXT.INFO }}>Using worker token automatically</small>
						)}
					</InputGroup>

					{/* Execute Button */}
					<Button
						variant="primary"
						onClick={() => handleApiCall(selectedEndpoint)}
						disabled={
							isLoading ||
							!credentials.environmentId ||
							!credentials.userId ||
							((selectedEndpoint === 'read-one' || selectedEndpoint === 'delete') &&
								!credentials.sessionId)
						}
					>
						{isLoading ? (
							<>
								<span>⏳</span>
								Executing...
							</>
						) : (
							<>
								<span>🚀</span>
								Execute API Call
							</>
						)}
					</Button>

					{/* Request Details */}
					{credentials.environmentId && (
						<RequestDetailsBox>
							<strong>Request Details:</strong>
							<br />
							Method: <EndpointBadge method="GET">GET</EndpointBadge>
							<br />
							URL:{' '}
							<code>{`https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions${selectedEndpoint === 'read-one' || selectedEndpoint === 'delete' ? `/${credentials.sessionId}` : ''}`}</code>
							<br />
							Authorization: Bearer {credentials.accessToken ? '••••••••••••••••' : 'Worker Token'}
						</RequestDetailsBox>
					)}

					{/* API Response */}
					{apiResponse && (
						<div style={{ marginTop: '2rem' }}>
							<h4>
								Response{' '}
								<StatusBadge status={apiResponse.status}>
									{apiResponse.status} {apiResponse.statusText}
								</StatusBadge>
							</h4>

							<ColoredJsonDisplay data={apiResponse.data} title="Response Body" copyable={true} />

							<details style={{ marginTop: '1rem' }}>
								<summary style={{ cursor: 'pointer', fontWeight: '600' }}>Response Headers</summary>
								<CodeBlock>{JSON.stringify(apiResponse.headers, null, 2)}</CodeBlock>
							</details>
						</div>
					)}
				</CardBody>
			</Card>

			{/* Important Notes */}
			<PingOneNote>
				<span>ℹ️</span>
				<div>
					<h4>Authentication Requirements</h4>
					<p>
						<strong>Recommended:</strong> Use Worker Token credentials for seamless authentication.
						The worker token provides the necessary permissions to access the Sessions API.
					</p>
					<p>
						<strong>Alternative:</strong> Use an access token from an Authorization Code flow with
						the appropriate scopes for session management.
					</p>
				</div>
			</PingOneNote>

			<SecurityNote>
				<span>⚠️</span>
				<div>
					<h4>Security Considerations</h4>
					<p>
						• Sessions API calls require appropriate permissions and should only be used by
						authorized applications.
					</p>
					<p>
						• Revoking sessions will immediately terminate user access and may require users to
						re-authenticate.
					</p>
					<p>• Always validate user permissions before performing session management operations.</p>
				</div>
			</SecurityNote>

			<V9FlowRestartButton flowId="pingone-sessions-api" />
		</Container>
	);
};

export default PingOneSessionsAPIFlowV9;
