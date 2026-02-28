import React, { useState } from 'react';
import {
	FiClock,
	FiCode,
	FiDatabase,
	FiExternalLink,
	FiInfo,
	FiLogOut,
	FiMonitor,
	FiPlay,
	FiRefreshCw,
	FiShield,
	FiTrash,
	FiTrash2,
	FiUsers
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import CollapsibleSection from '../components/CollapsibleSection';
import { ColoredJsonDisplay } from '../components/ColoredJsonDisplay';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';
import { SuperSimpleApiDisplayV8 } from '../v8/components/SuperSimpleApiDisplayV8';
import { toastV8 } from '../v8/utils/toastNotificationsV8';

const WhiteContainer = styled.div`
	background-color: white;
	min-height: 100vh;
	color: #1f2937;
	line-height: 1.6;
	padding-top: 100px;
	padding-bottom: 4rem;
	overflow-x: hidden;

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		color: #111827;
	}

	p {
		color: #374151;
	}
`;

const OverviewCard = styled(Card)`
	margin-bottom: 2rem;
	border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-top: 2rem;
`;

const FeatureCard = styled(Card)`
	border-left: 4px solid ${({ theme }) => theme.colors.info};
	transition: transform 0.2s, box-shadow 0.2s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
`;

const CodeBlock = styled.pre`
	background-color: ${({ theme }) => theme.colors.gray100};
	border: 1px solid ${({ theme }) => theme.colors.gray300};
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const PingOneNote = styled.div`
	background-color: ${({ theme }) => theme.colors.info}10;
	border: 1px solid ${({ theme }) => theme.colors.info}30;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0 2rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: ${({ theme }) => theme.colors.info};
		flex-shrink: 0;
		margin-top: 0.1rem;
	}
`;

const SecurityNote = styled.div`
	background-color: #fdecea;
	border: 1px solid #f5c2c7;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0 2rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		color: #dc3545;
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
				return '#10b981';
			case 'POST':
				return '#3b82f6';
			case 'DELETE':
				return '#ef4444';
			case 'PUT':
				return '#f59e0b';
			default:
				return '#6b7280';
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
	color: #374151;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background-color: white;
	cursor: pointer;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
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
					background-color: #3b82f6;
					color: white;
					&:hover:not(:disabled) {
						background-color: #2563eb;
					}
				`;
			case 'secondary':
				return `
					background-color: #6b7280;
					color: white;
					&:hover:not(:disabled) {
						background-color: #4b5563;
					}
				`;
			case 'danger':
				return `
					background-color: #ef4444;
					color: white;
					&:hover:not(:disabled) {
						background-color: #dc2626;
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
	background-color: #f9fafb;
	border: 1px solid #e5e7eb;
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
		if (status >= 200 && status < 300) return '#10b981';
		if (status >= 400 && status < 500) return '#f59e0b';
		if (status >= 500) return '#ef4444';
		return '#6b7280';
	}};
	color: white;
`;

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

const PingOneSessionsAPI: React.FC = () => {
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [credentials, setCredentials] = useState<SessionsApiCredentials>({
		environmentId: '',
		userId: '',
		sessionId: '',
		accessToken: '',
	});
	const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedEndpoint, setSelectedEndpoint] = useState<string>('read-all');

	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem',
		showHeader: true,
		showFooter: false,
		responsive: true,
	};

	const { PageContainer, PageHeader, ContentWrapper } =
		PageLayoutService.createPageLayout(pageConfig);

	// API call handler
	const handleApiCall = async (endpoint: string) => {
		setIsLoading(true);
		setApiResponse(null);

		try {
			let url = '';
			let method = 'GET';

			switch (endpoint) {
				case 'read-all':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions`;
					method = 'GET';
					break;
				case 'read-one':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions/${credentials.sessionId}`;
					method = 'GET';
					break;
				case 'delete-one':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions/${credentials.sessionId}`;
					method = 'DELETE';
					break;
				case 'delete-all':
					url = `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions`;
					method = 'DELETE';
					break;
			}

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`,
					'Content-Type': 'application/json',
				},
			});

			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			let data: unknown = null;
			const contentType = response.headers.get('content-type');
			if (contentType?.includes('application/json')) {
				data = await response.json();
			} else {
				const text = await response.text();
				data = text || 'No content';
			}

			setApiResponse({
				status: response.status,
				statusText: response.statusText,
				data,
				headers: responseHeaders,
			});

			if (response.ok) {
				toastV8.success(`API call successful: ${response.status} ${response.statusText}`);
			} else {
				toastV8.error(`API call failed: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toastV8.error(`API call failed: ${errorMessage}`);
			setApiResponse({
				status: 0,
				statusText: 'Error',
				data: { error: errorMessage },
				headers: {},
			});
		} finally {
			setIsLoading(false);
		}
	};

	const copyToClipboard = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopiedCode(id);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const renderCodeExample = (title: string, code: string, id: string) => (
		<div style={{ marginBottom: '1.5rem' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '0.5rem',
				}}
			>
				<h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#1f2937' }}>
					{title}
				</h4>
				<button
					onClick={() => copyToClipboard(code, id)}
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: copiedCode === id ? '#10b981' : '#6b7280',
						display: 'flex',
						alignItems: 'center',
						gap: '0.25rem',
						fontSize: '0.875rem',
						padding: '0.25rem 0.5rem',
					}}
					type="button"
				>
					<FiCode size={16} />
					{copiedCode === id ? 'Copied!' : 'Copy'}
				</button>
			</div>
			<CodeBlock>{code}</CodeBlock>
		</div>
	);

	return (
		<WhiteContainer>
			<PageContainer>
				{PageHeader ? (
					<PageHeader>
						<h1>PingOne Sessions API</h1>
						<p>Manage user sessions programmatically with the PingOne Platform Sessions API</p>
					</PageHeader>
				) : (
					<div
						style={{
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							padding: '3rem 2rem',
							borderRadius: '1rem 1rem 0 0',
						}}
					>
						<h1 style={{ color: 'white', margin: 0, fontSize: '2.5rem' }}>PingOne Sessions API</h1>
						<p
							style={{
								color: 'rgba(255, 255, 255, 0.9)',
								margin: '0.5rem 0 0 0',
								fontSize: '1.1rem',
							}}
						>
							Manage user sessions programmatically with the PingOne Platform Sessions API
						</p>
					</div>
				)}

				<ContentWrapper>
					{/* Overview Section */}
					<CollapsibleHeader
						title="What is the PingOne Sessions API?"
						subtitle="The Sessions API provides programmatic access to manage user authentication sessions in PingOne"
						icon={<FiUsers />}
						defaultCollapsed={false}
					>
						<div style={{ padding: '1.5rem' }}>
							<OverviewCard>
								<CardHeader>
									<h2>Sessions API Overview</h2>
								</CardHeader>
								<CardBody>
									<p>
										The <strong>PingOne Sessions API</strong> allows you to programmatically manage
										user authentication sessions within your PingOne environment. This REST API
										provides endpoints to retrieve session information, revoke sessions, and manage
										session lifecycle across your applications.
									</p>

									<PingOneNote>
										<FiInfo size={20} />
										<div>
											<h4>Key Capabilities</h4>
											<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
												<li>Retrieve active user sessions</li>
												<li>Get detailed session information</li>
												<li>Revoke individual sessions</li>
												<li>Delete all sessions for a user</li>
												<li>Monitor session activity and metadata</li>
											</ul>
										</div>
									</PingOneNote>

									<h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Use Cases</h3>
									<FeatureGrid>
										<FeatureCard>
											<CardBody>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '0.75rem',
														marginBottom: '0.75rem',
													}}
												>
													<FiShield size={24} color="#3b82f6" />
													<h4 style={{ margin: 0 }}>Security Management</h4>
												</div>
												<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
													Force logout users when suspicious activity is detected or when security
													policies require immediate session termination
												</p>
											</CardBody>
										</FeatureCard>

										<FeatureCard>
											<CardBody>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '0.75rem',
														marginBottom: '0.75rem',
													}}
												>
													<FiMonitor size={24} color="#3b82f6" />
													<h4 style={{ margin: 0 }}>Session Monitoring</h4>
												</div>
												<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
													Track active sessions, monitor login patterns, and audit user access
													across multiple applications and devices
												</p>
											</CardBody>
										</FeatureCard>

										<FeatureCard>
											<CardBody>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '0.75rem',
														marginBottom: '0.75rem',
													}}
												>
													<FiLogOut size={24} color="#3b82f6" />
													<h4 style={{ margin: 0 }}>Admin Controls</h4>
												</div>
												<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
													Provide administrators with tools to manage user sessions, enforce
													policies, and maintain compliance requirements
												</p>
											</CardBody>
										</FeatureCard>
									</FeatureGrid>
								</CardBody>
							</OverviewCard>
						</div>
					</CollapsibleHeader>

					{/* API Endpoints Section */}
					<CollapsibleSection title="📡 API Endpoints" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
								The Sessions API provides four main endpoints for managing user sessions. All
								endpoints require proper authentication and authorization.
							</p>

							{/* Read All Sessions */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
										<FiDatabase size={20} />
										<h3 style={{ margin: 0 }}>Read All Sessions</h3>
									</div>
								</CardHeader>
								<CardBody>
									<div style={{ marginBottom: '1rem' }}>
										<EndpointBadge method="GET">GET</EndpointBadge>
										<code style={{ fontSize: '0.9rem' }}>
											/environments/{'{environmentId}'}/users/{'{userId}'}/sessions
										</code>
									</div>

									<p>
										Retrieves all active sessions for a specific user in an environment. Returns an
										array of session objects with metadata including creation time, last accessed
										time, and associated application information.
									</p>

									{renderCodeExample(
										'cURL Example',
										`curl -X GET \\
  'https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/sessions' \\
  -H 'Authorization: Bearer {accessToken}' \\
  -H 'Content-Type: application/json'`,
										'read-all-sessions-curl'
									)}

									{renderCodeExample(
										'Response Example',
										`{
  "_embedded": {
    "sessions": [
      {
        "id": "abc123-session-id",
        "createdAt": "2026-02-17T10:00:00.000Z",
        "expiresAt": "2026-02-17T18:00:00.000Z",
        "lastAccessedAt": "2026-02-17T15:30:00.000Z",
        "idleTimeoutSeconds": 3600,
        "maxTimeoutSeconds": 28800,
        "application": {
          "id": "app-id-123",
          "name": "My Application"
        },
        "_links": {
          "self": {
            "href": "https://api.pingone.com/v1/environments/{envId}/users/{userId}/sessions/abc123"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "https://api.pingone.com/v1/environments/{envId}/users/{userId}/sessions"
    }
  }
}`,
										'read-all-sessions-response'
									)}

									<PingOneNote>
										<FiInfo size={18} />
										<div>
											<h4>Session Properties</h4>
											<p style={{ margin: 0, fontSize: '0.9rem' }}>
												Each session includes creation time, expiration, idle timeout, max timeout,
												and associated application details. Use this data for auditing and
												monitoring.
											</p>
										</div>
									</PingOneNote>
								</CardBody>
							</Card>

							{/* Read One Session */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
										<FiMonitor size={20} />
										<h3 style={{ margin: 0 }}>Read One Session</h3>
									</div>
								</CardHeader>
								<CardBody>
									<div style={{ marginBottom: '1rem' }}>
										<EndpointBadge method="GET">GET</EndpointBadge>
										<code style={{ fontSize: '0.9rem' }}>
											/environments/{'{environmentId}'}/users/{'{userId}'}/sessions/{'{sessionId}'}
										</code>
									</div>

									<p>
										Retrieves detailed information about a specific session. Useful for inspecting
										individual session properties and determining session state.
									</p>

									{renderCodeExample(
										'cURL Example',
										`curl -X GET \\
  'https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/sessions/{sessionId}' \\
  -H 'Authorization: Bearer {accessToken}' \\
  -H 'Content-Type: application/json'`,
										'read-one-session-curl'
									)}

									{renderCodeExample(
										'Response Example',
										`{
  "id": "abc123-session-id",
  "createdAt": "2026-02-17T10:00:00.000Z",
  "expiresAt": "2026-02-17T18:00:00.000Z",
  "lastAccessedAt": "2026-02-17T15:30:00.000Z",
  "idleTimeoutSeconds": 3600,
  "maxTimeoutSeconds": 28800,
  "application": {
    "id": "app-id-123",
    "name": "My Application",
    "description": "Production application"
  },
  "environment": {
    "id": "env-id-456"
  },
  "user": {
    "id": "user-id-789"
  },
  "_links": {
    "self": {
      "href": "https://api.pingone.com/v1/environments/{envId}/users/{userId}/sessions/abc123"
    }
  }
}`,
										'read-one-session-response'
									)}
								</CardBody>
							</Card>

							{/* Delete One Session */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
										<FiLogOut size={20} />
										<h3 style={{ margin: 0 }}>Delete One Session (Revoke)</h3>
									</div>
								</CardHeader>
								<CardBody>
									<div style={{ marginBottom: '1rem' }}>
										<EndpointBadge method="DELETE">DELETE</EndpointBadge>
										<code style={{ fontSize: '0.9rem' }}>
											/environments/{'{environmentId}'}/users/{'{userId}'}/sessions/{'{sessionId}'}
										</code>
									</div>

									<p>
										Revokes a specific user session, forcing the user to re-authenticate. This is
										useful for security scenarios where you need to immediately terminate a session.
									</p>

									{renderCodeExample(
										'cURL Example',
										`curl -X DELETE \\
  'https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/sessions/{sessionId}' \\
  -H 'Authorization: Bearer {accessToken}'`,
										'delete-one-session-curl'
									)}

									<SecurityNote>
										<FiShield size={18} />
										<div>
											<h4>Security Consideration</h4>
											<p style={{ margin: 0, fontSize: '0.9rem' }}>
												Deleting a session immediately revokes access. The user will need to
												re-authenticate to continue using the application. This action cannot be
												undone.
											</p>
										</div>
									</SecurityNote>

									{renderCodeExample(
										'Success Response',
										`HTTP/1.1 204 No Content

// No response body - session successfully deleted`,
										'delete-one-session-response'
									)}
								</CardBody>
							</Card>

							{/* Delete All Sessions */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
										<FiTrash2 size={20} />
										<h3 style={{ margin: 0 }}>Delete All Sessions</h3>
									</div>
								</CardHeader>
								<CardBody>
									<div style={{ marginBottom: '1rem' }}>
										<EndpointBadge method="DELETE">DELETE</EndpointBadge>
										<code style={{ fontSize: '0.9rem' }}>
											/environments/{'{environmentId}'}/users/{'{userId}'}/sessions
										</code>
									</div>

									<p>
										Revokes all active sessions for a user across all applications. This is a
										powerful operation typically used for security incidents, account compromise, or
										when a user reports unauthorized access.
									</p>

									{renderCodeExample(
										'cURL Example',
										`curl -X DELETE \\
  'https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/sessions' \\
  -H 'Authorization: Bearer {accessToken}'`,
										'delete-all-sessions-curl'
									)}

									<SecurityNote>
										<FiShield size={18} />
										<div>
											<h4>Critical Action</h4>
											<p style={{ margin: 0, fontSize: '0.9rem' }}>
												This deletes ALL sessions for the user across ALL applications. Use with
												caution. The user will be logged out everywhere and must re-authenticate on
												all devices.
											</p>
										</div>
									</SecurityNote>

									{renderCodeExample(
										'Success Response',
										`HTTP/1.1 204 No Content

// No response body - all sessions successfully deleted`,
										'delete-all-sessions-response'
									)}
								</CardBody>
							</Card>
						</div>
					</CollapsibleSection>

					{/* Authentication & Authorization */}
					<CollapsibleSection title="🔐 Authentication & Authorization" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
								The Sessions API requires proper authentication using OAuth 2.0 access tokens with
								appropriate scopes.
							</p>

							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>Required Scopes</h3>
								</CardHeader>
								<CardBody>
									<p>
										To access the Sessions API, your access token must include the following scope:
									</p>

									<div
										style={{
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '0.5rem',
											padding: '1rem',
											marginTop: '1rem',
										}}
									>
										<code style={{ fontSize: '1rem', fontWeight: '600', color: '#3b82f6' }}>
											p1:read:sessions
										</code>
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
											Grants read access to user session information
										</p>
									</div>

									<div
										style={{
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '0.5rem',
											padding: '1rem',
											marginTop: '1rem',
										}}
									>
										<code style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444' }}>
											p1:delete:sessions
										</code>
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
											Grants permission to revoke/delete user sessions
										</p>
									</div>

									{renderCodeExample(
										'Getting an Access Token',
										`// Client Credentials Flow
POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={clientId}
&client_secret={clientSecret}
&scope=p1:read:sessions p1:delete:sessions`,
										'get-access-token'
									)}

									<PingOneNote>
										<FiInfo size={18} />
										<div>
											<h4>Worker Application</h4>
											<p style={{ margin: 0, fontSize: '0.9rem' }}>
												Sessions API is typically accessed by backend services using a Worker
												application type in PingOne. Configure your Worker app with the appropriate
												scopes in the PingOne console.
											</p>
										</div>
									</PingOneNote>
								</CardBody>
							</Card>
						</div>
					</CollapsibleSection>

					{/* Interactive API Testing */}
					<CollapsibleSection title="🧪 Interactive API Testing" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
								Test the Sessions API directly from this page. Enter your credentials and make live
								API calls to see request/response details.
							</p>

							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>API Credentials</h3>
								</CardHeader>
								<CardBody>
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
											gap: '1rem',
										}}
									>
										<InputGroup>
											<Label htmlFor="environmentId">Environment ID</Label>
											<Input
												id="environmentId"
												type="text"
												placeholder="e.g., 12345678-1234-1234-1234-123456789abc"
												value={credentials.environmentId}
												onChange={(e) =>
													setCredentials({ ...credentials, environmentId: e.target.value })
												}
											/>
										</InputGroup>

										<InputGroup>
											<Label htmlFor="userId">User ID</Label>
											<Input
												id="userId"
												type="text"
												placeholder="e.g., 87654321-4321-4321-4321-cba987654321"
												value={credentials.userId}
												onChange={(e) => setCredentials({ ...credentials, userId: e.target.value })}
											/>
										</InputGroup>

										<InputGroup>
											<Label htmlFor="sessionId">Session ID (for single session operations)</Label>
											<Input
												id="sessionId"
												type="text"
												placeholder="e.g., session-abc123"
												value={credentials.sessionId}
												onChange={(e) =>
													setCredentials({ ...credentials, sessionId: e.target.value })
												}
											/>
										</InputGroup>

										<InputGroup style={{ gridColumn: '1 / -1' }}>
											<Label htmlFor="accessToken">Access Token</Label>
											<Input
												id="accessToken"
												type="password"
												placeholder="Bearer token with p1:read:sessions and p1:delete:sessions scopes"
												value={credentials.accessToken}
												onChange={(e) =>
													setCredentials({ ...credentials, accessToken: e.target.value })
												}
											/>
										</InputGroup>
									</div>
								</CardBody>
							</Card>

							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>Select Endpoint</h3>
								</CardHeader>
								<CardBody>
									<InputGroup>
										<Label htmlFor="endpoint">API Endpoint</Label>
										<Select
											id="endpoint"
											value={selectedEndpoint}
											onChange={(e) => setSelectedEndpoint(e.target.value)}
										>
											<option value="read-all">GET - Read All Sessions</option>
											<option value="read-one">GET - Read One Session</option>
											<option value="delete-one">DELETE - Delete One Session</option>
											<option value="delete-all">DELETE - Delete All Sessions</option>
										</Select>
									</InputGroup>

									<div
										style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
									>
										<Button
											variant="primary"
											onClick={() => handleApiCall(selectedEndpoint)}
											disabled={
												isLoading ||
												!credentials.environmentId ||
												!credentials.userId ||
												!credentials.accessToken
											}
										>
											<FiPlay />
											{isLoading ? 'Testing...' : 'Test API'}
										</Button>

										{apiResponse && (
											<Button variant="secondary" onClick={() => setApiResponse(null)}>
												Clear Results
											</Button>
										)}
									</div>

									{selectedEndpoint === 'read-one' || selectedEndpoint === 'delete-one' ? (
										<PingOneNote style={{ marginTop: '1rem' }}>
											<FiInfo size={18} />
											<div>
												<h4>Session ID Required</h4>
												<p style={{ margin: 0, fontSize: '0.9rem' }}>
													This endpoint requires a Session ID. Make sure to fill in the Session ID
													field above.
												</p>
											</div>
										</PingOneNote>
									) : null}
								</CardBody>
							</Card>

							{apiResponse && (
								<>
									<Card style={{ marginBottom: '2rem' }}>
										<CardHeader>
											<h3>Request Details</h3>
										</CardHeader>
										<CardBody>
											<RequestDetailsBox>
												<div style={{ marginBottom: '0.5rem' }}>
													<strong>Method:</strong>{' '}
													<EndpointBadge
														method={selectedEndpoint.includes('delete') ? 'DELETE' : 'GET'}
													>
														{selectedEndpoint.includes('delete') ? 'DELETE' : 'GET'}
													</EndpointBadge>
												</div>
												<div style={{ marginBottom: '0.5rem' }}>
													<strong>URL:</strong>
												</div>
												<div
													style={{
														marginLeft: '1rem',
														marginBottom: '0.5rem',
														wordBreak: 'break-all',
													}}
												>
													{selectedEndpoint === 'read-all' &&
														`https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions`}
													{selectedEndpoint === 'read-one' &&
														`https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions/${credentials.sessionId}`}
													{selectedEndpoint === 'delete-one' &&
														`https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions/${credentials.sessionId}`}
													{selectedEndpoint === 'delete-all' &&
														`https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.userId}/sessions`}
												</div>
												<div style={{ marginBottom: '0.5rem' }}>
													<strong>Headers:</strong>
												</div>
												<div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
													<div>
														Authorization: Bearer {credentials.accessToken.substring(0, 20)}...
													</div>
													<div>Content-Type: application/json</div>
												</div>
											</RequestDetailsBox>
										</CardBody>
									</Card>

									<Card style={{ marginBottom: '2rem' }}>
										<CardHeader>
											<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
												<h3>Response</h3>
												<StatusBadge status={apiResponse.status}>
													{apiResponse.status} {apiResponse.statusText}
												</StatusBadge>
											</div>
										</CardHeader>
										<CardBody>
											<ColoredJsonDisplay
												data={apiResponse.data}
												label="Response Body"
												collapsible={true}
												defaultCollapsed={false}
												showCopyButton={true}
											/>

											{Object.keys(apiResponse.headers).length > 0 && (
												<ColoredJsonDisplay
													data={apiResponse.headers}
													label="Response Headers"
													collapsible={true}
													defaultCollapsed={true}
													showCopyButton={true}
												/>
											)}
										</CardBody>
									</Card>
								</>
							)}

							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>API Call History</h3>
								</CardHeader>
								<CardBody>
									<SuperSimpleApiDisplayV8 />
								</CardBody>
							</Card>
						</div>
					</CollapsibleSection>

					{/* Implementation Examples */}
					<CollapsibleSection title="💻 Implementation Examples" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
								Practical examples for implementing common session management scenarios.
							</p>

							{/* Example 1: List Active Sessions */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>Example 1: List All Active Sessions for a User</h3>
								</CardHeader>
								<CardBody>
									{renderCodeExample(
										'Node.js / JavaScript',
										`async function getUserSessions(environmentId, userId, accessToken) {
  const response = await fetch(
    \`https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/sessions\`,
    {
      method: 'GET',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(\`Failed to get sessions: \${response.statusText}\`);
  }

  const data = await response.json();
  return data._embedded.sessions;
}

// Usage
const sessions = await getUserSessions('env-123', 'user-456', 'access-token');
console.log(\`User has \${sessions.length} active sessions\`);

sessions.forEach(session => {
  console.log(\`Session ID: \${session.id}\`);
  console.log(\`Application: \${session.application.name}\`);
  console.log(\`Created: \${session.createdAt}\`);
  console.log(\`Last Accessed: \${session.lastAccessedAt}\`);
});`,
										'example-list-sessions-js'
									)}

									{renderCodeExample(
										'Python',
										`import requests

def get_user_sessions(environment_id, user_id, access_token):
    url = f"https://api.pingone.com/v1/environments/{environment_id}/users/{user_id}/sessions"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    return data.get("_embedded", {}).get("sessions", [])

# Usage
sessions = get_user_sessions("env-123", "user-456", "access-token")
print(f"User has {len(sessions)} active sessions")

for session in sessions:
    print(f"Session ID: {session['id']}")
    print(f"Application: {session['application']['name']}")
    print(f"Created: {session['createdAt']}")
    print(f"Last Accessed: {session['lastAccessedAt']}")`,
										'example-list-sessions-python'
									)}
								</CardBody>
							</Card>

							{/* Example 2: Revoke Specific Session */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>Example 2: Revoke a Specific Session</h3>
								</CardHeader>
								<CardBody>
									{renderCodeExample(
										'Node.js / JavaScript',
										`async function revokeSession(environmentId, userId, sessionId, accessToken) {
  const response = await fetch(
    \`https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/sessions/\${sessionId}\`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`
      }
    }
  );

  if (!response.ok) {
    throw new Error(\`Failed to revoke session: \${response.statusText}\`);
  }

  console.log('Session successfully revoked');
  return true;
}

// Usage - Revoke a suspicious session
try {
  await revokeSession('env-123', 'user-456', 'session-789', 'access-token');
  console.log('User has been logged out of that session');
} catch (error) {
  console.error('Failed to revoke session:', error);
}`,
										'example-revoke-session-js'
									)}
								</CardBody>
							</Card>

							{/* Example 3: Force Logout All Sessions */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>Example 3: Force Logout (Delete All Sessions)</h3>
								</CardHeader>
								<CardBody>
									<p style={{ marginBottom: '1rem', color: '#64748b' }}>
										Use this when you need to immediately log out a user from all devices and
										applications, such as after a password reset or security incident.
									</p>

									{renderCodeExample(
										'Node.js / JavaScript',
										`async function forceLogoutUser(environmentId, userId, accessToken) {
  const response = await fetch(
    \`https://api.pingone.com/v1/environments/\${environmentId}/users/\${userId}/sessions\`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`
      }
    }
  );

  if (!response.ok) {
    throw new Error(\`Failed to delete sessions: \${response.statusText}\`);
  }

  console.log('All user sessions successfully deleted');
  return true;
}

// Usage - Force logout after password reset
async function handlePasswordReset(userId) {
  // 1. Reset password
  await resetUserPassword(userId);
  
  // 2. Force logout from all sessions
  await forceLogoutUser('env-123', userId, 'access-token');
  
  // 3. Notify user
  await sendEmail(userId, 'Your password has been reset. Please log in again.');
}`,
										'example-force-logout-js'
									)}

									<SecurityNote>
										<FiShield size={18} />
										<div>
											<h4>Security Best Practice</h4>
											<p style={{ margin: 0, fontSize: '0.9rem' }}>
												Always force logout all sessions after critical security events like
												password resets, account recovery, or when suspicious activity is detected.
											</p>
										</div>
									</SecurityNote>
								</CardBody>
							</Card>

							{/* Example 4: Session Monitoring Dashboard */}
							<Card style={{ marginBottom: '2rem' }}>
								<CardHeader>
									<h3>Example 4: Session Monitoring Dashboard</h3>
								</CardHeader>
								<CardBody>
									<p style={{ marginBottom: '1rem', color: '#64748b' }}>
										Build an admin dashboard to monitor and manage user sessions across your
										organization.
									</p>

									{renderCodeExample(
										'Node.js / Express API',
										`// Admin API endpoint for session management
app.get('/api/admin/users/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;
    const accessToken = await getWorkerToken(); // Get worker app token
    
    // Get all sessions
    const sessions = await getUserSessions(
      process.env.PINGONE_ENV_ID,
      userId,
      accessToken
    );
    
    // Enrich with additional data
    const enrichedSessions = sessions.map(session => ({
      ...session,
      isIdle: isSessionIdle(session),
      isExpiringSoon: isExpiringSoon(session),
      deviceInfo: parseDeviceInfo(session),
      location: getLocationFromIP(session)
    }));
    
    res.json({
      userId,
      totalSessions: enrichedSessions.length,
      activeSessions: enrichedSessions.filter(s => !s.isIdle).length,
      sessions: enrichedSessions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function isSessionIdle(session) {
  const idleMinutes = (Date.now() - new Date(session.lastAccessedAt)) / 60000;
  return idleMinutes > 30;
}

function isExpiringSoon(session) {
  const minutesUntilExpiry = (new Date(session.expiresAt) - Date.now()) / 60000;
  return minutesUntilExpiry < 60;
}`,
										'example-monitoring-dashboard'
									)}
								</CardBody>
							</Card>
						</div>
					</CollapsibleSection>

					{/* Best Practices */}
					<CollapsibleSection title="✅ Best Practices" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<FeatureGrid>
								<FeatureCard>
									<CardBody>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '0.75rem',
											}}
										>
											<FiShield size={24} color="#10b981" />
											<h4 style={{ margin: 0 }}>Secure Token Storage</h4>
										</div>
										<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
											Store access tokens securely on the backend. Never expose worker app
											credentials or tokens to client-side code. Use environment variables and
											secure vaults.
										</p>
									</CardBody>
								</FeatureCard>

								<FeatureCard>
									<CardBody>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '0.75rem',
											}}
										>
											<FiClock size={24} color="#10b981" />
											<h4 style={{ margin: 0 }}>Rate Limiting</h4>
										</div>
										<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
											Implement rate limiting when polling for session status. Avoid excessive API
											calls that could impact performance or trigger rate limits.
										</p>
									</CardBody>
								</FeatureCard>

								<FeatureCard>
									<CardBody>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '0.75rem',
											}}
										>
											<FiRefreshCw size={24} color="#10b981" />
											<h4 style={{ margin: 0 }}>Error Handling</h4>
										</div>
										<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
											Implement robust error handling for API failures. Handle 401 (unauthorized),
											403 (forbidden), 404 (not found), and 429 (rate limit) responses
											appropriately.
										</p>
									</CardBody>
								</FeatureCard>

								<FeatureCard>
									<CardBody>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '0.75rem',
											}}
										>
											<FiMonitor size={24} color="#10b981" />
											<h4 style={{ margin: 0 }}>Audit Logging</h4>
										</div>
										<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
											Log all session management operations (especially deletions) for security
											auditing and compliance. Include who performed the action and why.
										</p>
									</CardBody>
								</FeatureCard>

								<FeatureCard>
									<CardBody>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '0.75rem',
											}}
										>
											<FiUsers size={24} color="#10b981" />
											<h4 style={{ margin: 0 }}>User Notifications</h4>
										</div>
										<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
											Notify users when their sessions are revoked, especially for security-related
											actions. Provide clear instructions on what they need to do next.
										</p>
									</CardBody>
								</FeatureCard>

								<FeatureCard>
									<CardBody>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '0.75rem',
											}}
										>
											<FiDatabase size={24} color="#10b981" />
											<h4 style={{ margin: 0 }}>Caching Strategy</h4>
										</div>
										<p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
											Cache session data appropriately but with short TTLs. Session state can change
											quickly, so balance performance with data freshness.
										</p>
									</CardBody>
								</FeatureCard>
							</FeatureGrid>
						</div>
					</CollapsibleSection>

					{/* Resources */}
					<CollapsibleSection title="📚 Resources & Documentation" defaultCollapsed={false}>
						<div style={{ marginTop: '1rem' }}>
							<Card>
								<CardBody>
									<h3 style={{ marginTop: 0 }}>Official Documentation</h3>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
										<a
											href="https://developer.pingidentity.com/pingone-api/platform/sessions.html"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												color: '#3b82f6',
												textDecoration: 'none',
												fontSize: '1rem',
											}}
										>
											<FiExternalLink />
											PingOne Sessions API Documentation
										</a>
										<a
											href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#sessions"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												color: '#3b82f6',
												textDecoration: 'none',
												fontSize: '1rem',
											}}
										>
											<FiExternalLink />
											PingOne API Reference - Sessions
										</a>
										<a
											href="https://developer.pingidentity.com/pingone-api/getting-started/introduction.html"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												color: '#3b82f6',
												textDecoration: 'none',
												fontSize: '1rem',
											}}
										>
											<FiExternalLink />
											PingOne Platform API - Getting Started
										</a>
									</div>

									<h3 style={{ marginTop: '2rem' }}>Related Topics</h3>
									<ul style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
										<li style={{ marginBottom: '0.5rem' }}>
											<a
												href="/oidc-session-management"
												style={{ color: '#3b82f6', textDecoration: 'none' }}
											>
												OpenID Connect Session Management
											</a>
										</li>
										<li style={{ marginBottom: '0.5rem' }}>Worker Applications & Authentication</li>
										<li style={{ marginBottom: '0.5rem' }}>OAuth 2.0 Scopes & Permissions</li>
										<li style={{ marginBottom: '0.5rem' }}>Security Best Practices</li>
									</ul>
								</CardBody>
							</Card>
						</div>
					</CollapsibleSection>
				</ContentWrapper>
			</PageContainer>
		</WhiteContainer>
	);
};

export default PingOneSessionsAPI;
