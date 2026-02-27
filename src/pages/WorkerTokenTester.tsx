// src/pages/WorkerTokenTester.tsx
import React, { useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiClock,
	FiGlobe,
	FiKey,
	FiUser,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import { v4ToastManager } from '../utils/v4ToastMessages';

interface TokenPayload {
	client_id?: string;
	iss?: string;
	jti?: string;
	iat?: number;
	exp?: number;
	aud?: string[];
	env?: string;
	org?: string;
	scope?: string;
	sub?: string;
	[key: string]: unknown;
}

interface TestResult {
	test: string;
	status: 'success' | 'error' | 'warning';
	statusCode?: number;
	message: string;
	details?: string;
	data?: unknown;
}

interface EnvironmentData {
	name?: string;
	type?: string;
	region?: string;
	description?: string;
	license?: {
		name?: string;
	};
}

const WorkerTokenTester: React.FC = () => {
	const [token, setToken] = useState('');
	const [payload, setPayload] = useState<TokenPayload | null>(null);
	const [isExpired, setIsExpired] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [isTesting, setIsTesting] = useState(false);
	const [testResults, setTestResults] = useState<TestResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);

	const decodeToken = (tokenString: string): TokenPayload | null => {
		try {
			const parts = tokenString.trim().split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid JWT format - must have 3 parts separated by dots');
			}

			const payloadBase64 = parts[1];
			const payloadJson = atob(payloadBase64);
			const decoded = JSON.parse(payloadJson) as TokenPayload;

			// Check expiration
			if (decoded.exp) {
				const now = Math.floor(Date.now() / 1000);
				const expired = now > decoded.exp;
				const remaining = decoded.exp - now;
				setIsExpired(expired);
				setTimeRemaining(remaining);
			}

			return decoded;
		} catch (err) {
			console.error('Failed to decode token:', err);
			return null;
		}
	};

	const handleTokenChange = (value: string) => {
		setToken(value);
		setError(null);
		setTestResults([]);
		setEnvironmentData(null);

		if (value.trim()) {
			const decoded = decodeToken(value);
			if (decoded) {
				setPayload(decoded);

				// Show toast based on token status
				if (decoded.exp) {
					const now = Math.floor(Date.now() / 1000);
					const isTokenExpired = now > decoded.exp;

					if (isTokenExpired) {
						v4ToastManager.showWarning('⚠️ Token decoded but it is EXPIRED');
					} else {
						v4ToastManager.showInfo('✓ Token decoded successfully');
					}
				} else {
					v4ToastManager.showInfo('✓ Token decoded successfully');
				}
			} else {
				setPayload(null);
				setError('Invalid JWT token format');
				v4ToastManager.showError('❌ Invalid JWT token format');
			}
		} else {
			setPayload(null);
		}
	};

	const testToken = async () => {
		if (!payload?.env) {
			setError('Token must contain an environment ID (env claim)');
			v4ToastManager.showError('Invalid token: Missing environment ID');
			return;
		}

		if (isExpired) {
			v4ToastManager.showWarning('Token is expired - validation will likely fail');
		}

		setIsTesting(true);
		setTestResults([]);
		setError(null);

		const results: TestResult[] = [];
		const environmentId = payload.env;

		try {
			// Test 1: Get Environment
			const envUrl = '/api/pingone/worker-test/environment';
			const envCallId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: envUrl,
				headers: {
					'Content-Type': 'application/json',
				},
				body: {
					environmentId,
					token: `${token.substring(0, 20)}...`,
				},
			});

			const envResponse = await fetch(envUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					token,
				}),
			});

			const envData = await envResponse.json();

			apiCallTrackerService.updateApiCallResponse(envCallId, {
				status: envResponse.status,
				statusText: envResponse.statusText,
				data: envData,
			});

			if (envResponse.ok) {
				// Store environment data for display
				setEnvironmentData(envData);

				results.push({
					test: 'Get Environment',
					status: 'success',
					statusCode: envResponse.status,
					message: 'Token is valid and can read environment',
					details: `Environment: ${envData.name} (${envData.type})`,
					data: envData,
				});

				v4ToastManager.showSuccess(`✅ Token is valid! Environment: ${envData.name}`);
			} else {
				results.push({
					test: 'Get Environment',
					status: 'error',
					statusCode: envResponse.status,
					message: envData.message || 'Failed to get environment',
					details: envData.details || envData.error_description,
				});

				if (envResponse.status === 401) {
					v4ToastManager.showError('❌ Token is invalid or expired');
				} else if (envResponse.status === 403) {
					v4ToastManager.showWarning('⚠️ Token lacks environment read permissions');
				} else {
					v4ToastManager.showError(`❌ Validation failed: ${envData.message || 'Unknown error'}`);
				}
			}

			// Test 2: List Users (if first test passed)
			if (envResponse.ok) {
				const usersUrl = '/api/pingone/worker-test/users';
				const usersCallId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: usersUrl,
					headers: {
						'Content-Type': 'application/json',
					},
					body: {
						environmentId,
						token: `${token.substring(0, 20)}...`,
					},
				});

				const usersResponse = await fetch(usersUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
						token,
					}),
				});

				const usersData = await usersResponse.json();

				apiCallTrackerService.updateApiCallResponse(usersCallId, {
					status: usersResponse.status,
					statusText: usersResponse.statusText,
					data: usersData,
				});

				if (usersResponse.ok) {
					results.push({
						test: 'List Users',
						status: 'success',
						statusCode: usersResponse.status,
						message: 'Token has user read permissions',
						details: `Found ${usersData._embedded?.users?.length || 0} users`,
						data: usersData,
					});
				} else if (usersResponse.status === 403) {
					results.push({
						test: 'List Users',
						status: 'warning',
						statusCode: usersResponse.status,
						message: 'Token lacks user read permissions',
						details: 'This is normal for some worker apps',
					});
				} else {
					results.push({
						test: 'List Users',
						status: 'error',
						statusCode: usersResponse.status,
						message: usersData.message || 'Failed to list users',
						details: usersData.details || usersData.error_description,
					});
				}

				// Test 3: List Applications
				const appsUrl = '/api/pingone/worker-test/applications';
				const appsCallId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: appsUrl,
					headers: {
						'Content-Type': 'application/json',
					},
					body: {
						environmentId,
						token: `${token.substring(0, 20)}...`,
					},
				});

				const appsResponse = await fetch(appsUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
						token,
					}),
				});

				const appsData = await appsResponse.json();

				apiCallTrackerService.updateApiCallResponse(appsCallId, {
					status: appsResponse.status,
					statusText: appsResponse.statusText,
					data: appsData,
				});

				if (appsResponse.ok) {
					results.push({
						test: 'List Applications',
						status: 'success',
						statusCode: appsResponse.status,
						message: 'Token has application read permissions',
						details: `Found ${appsData._embedded?.applications?.length || 0} applications`,
						data: appsData,
					});
				} else if (appsResponse.status === 403) {
					results.push({
						test: 'List Applications',
						status: 'warning',
						statusCode: appsResponse.status,
						message: 'Token lacks application read permissions',
						details: 'This is normal for some worker apps',
					});
				} else {
					results.push({
						test: 'List Applications',
						status: 'error',
						statusCode: appsResponse.status,
						message: appsData.message || 'Failed to list applications',
						details: appsData.details || appsData.error_description,
					});
				}
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			results.push({
				test: 'API Test',
				status: 'error',
				message: 'Network error or CORS issue',
				details: errorMessage,
			});

			v4ToastManager.showError(`❌ Network error: ${errorMessage}`);
		}

		setTestResults(results);
		setIsTesting(false);
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleString();
	};

	const formatTimeRemaining = (seconds: number) => {
		if (seconds < 0) {
			const absSeconds = Math.abs(seconds);
			if (absSeconds < 60) return `${absSeconds}s ago`;
			if (absSeconds < 3600) return `${Math.floor(absSeconds / 60)}m ago`;
			return `${Math.floor(absSeconds / 3600)}h ago`;
		}

		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
		return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
	};

	return (
		<Container>
			<Header>
				<Title>
					<FiKey size={32} />
					Worker Token Tester
				</Title>
				<Subtitle>
					Paste a PingOne worker token to decode and validate it against the PingOne API
				</Subtitle>
			</Header>

			<Section>
				<SectionTitle>Token Input</SectionTitle>
				<TokenInput
					placeholder="Paste your PingOne worker token here (JWT format: eyJhbGc...)"
					value={token}
					onChange={(e) => handleTokenChange(e.target.value)}
					rows={6}
				/>
				{error && (
					<ErrorMessage>
						<FiXCircle /> {error}
					</ErrorMessage>
				)}
			</Section>

			{payload && (
				<>
					<Section>
						<SectionTitle>Token Information</SectionTitle>
						<TokenInfo>
							<InfoGrid>
								<InfoCard>
									<InfoIcon status={isExpired ? 'error' : 'success'}>
										<FiClock size={24} />
									</InfoIcon>
									<InfoContent>
										<InfoLabel>Status</InfoLabel>
										<InfoValue status={isExpired ? 'error' : 'success'}>
											{isExpired ? 'EXPIRED' : 'VALID'}
										</InfoValue>
										{timeRemaining !== null && (
											<InfoDetail>
												{isExpired ? 'Expired ' : 'Expires in '}
												{formatTimeRemaining(timeRemaining)}
											</InfoDetail>
										)}
									</InfoContent>
								</InfoCard>

								<InfoCard>
									<InfoIcon status="info">
										<FiKey size={24} />
									</InfoIcon>
									<InfoContent>
										<InfoLabel>Client ID</InfoLabel>
										<InfoValue>{payload.client_id || 'N/A'}</InfoValue>
										<InfoDetail>OAuth Client Identifier</InfoDetail>
									</InfoContent>
								</InfoCard>

								<InfoCard>
									<InfoIcon status="info">
										<FiGlobe size={24} />
									</InfoIcon>
									<InfoContent>
										<InfoLabel>Environment ID</InfoLabel>
										<InfoValue>{payload.env || 'N/A'}</InfoValue>
										<InfoDetail>PingOne Environment</InfoDetail>
									</InfoContent>
								</InfoCard>

								<InfoCard>
									<InfoIcon status="info">
										<FiUser size={24} />
									</InfoIcon>
									<InfoContent>
										<InfoLabel>Organization ID</InfoLabel>
										<InfoValue>{payload.org || 'N/A'}</InfoValue>
										<InfoDetail>PingOne Organization</InfoDetail>
									</InfoContent>
								</InfoCard>
							</InfoGrid>

							<DetailsList>
								<DetailsRow>
									<DetailsLabel>Issued At:</DetailsLabel>
									<DetailsValue>{payload.iat ? formatDate(payload.iat) : 'N/A'}</DetailsValue>
								</DetailsRow>
								<DetailsRow>
									<DetailsLabel>Expires At:</DetailsLabel>
									<DetailsValue>{payload.exp ? formatDate(payload.exp) : 'N/A'}</DetailsValue>
								</DetailsRow>
								<DetailsRow>
									<DetailsLabel>Issuer:</DetailsLabel>
									<DetailsValue>{payload.iss || 'N/A'}</DetailsValue>
								</DetailsRow>
								<DetailsRow>
									<DetailsLabel>Audience:</DetailsLabel>
									<DetailsValue>
										{Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud || 'N/A'}
									</DetailsValue>
								</DetailsRow>
								{payload.scope && (
									<DetailsRow>
										<DetailsLabel>Scope:</DetailsLabel>
										<DetailsValue>{payload.scope}</DetailsValue>
									</DetailsRow>
								)}
								<DetailsRow>
									<DetailsLabel>JWT ID:</DetailsLabel>
									<DetailsValue>{payload.jti || 'N/A'}</DetailsValue>
								</DetailsRow>
							</DetailsList>
						</TokenInfo>
					</Section>

					{environmentData && (
						<Section>
							<SectionTitle>Environment Details</SectionTitle>
							<EnvironmentInfo>
								<EnvTable>
									<tbody>
										<EnvTableRow>
											<EnvTableLabel>Environment Name</EnvTableLabel>
											<EnvTableValue highlight>{environmentData.name || 'N/A'}</EnvTableValue>
										</EnvTableRow>
										<EnvTableRow>
											<EnvTableLabel>Environment Type</EnvTableLabel>
											<EnvTableValue>
												{environmentData.type ? (
													<TypeBadge type={environmentData.type}>{environmentData.type}</TypeBadge>
												) : (
													'N/A'
												)}
											</EnvTableValue>
										</EnvTableRow>
										<EnvTableRow>
											<EnvTableLabel>Region</EnvTableLabel>
											<EnvTableValue>
												{environmentData.region === 'NA' && '🇺🇸 NA (North America)'}
												{environmentData.region === 'EU' && '🇪🇺 EU (Europe)'}
												{environmentData.region === 'AP' && '🌏 AP (Asia Pacific)'}
												{environmentData.region === 'CA' && '🇨🇦 CA (Canada)'}
												{!['NA', 'EU', 'AP', 'CA'].includes(environmentData.region || '') &&
													(environmentData.region || 'N/A')}
											</EnvTableValue>
										</EnvTableRow>
										{environmentData.description && (
											<EnvTableRow>
												<EnvTableLabel>Description</EnvTableLabel>
												<EnvTableValue>{environmentData.description}</EnvTableValue>
											</EnvTableRow>
										)}
										{environmentData.license?.name && (
											<EnvTableRow>
												<EnvTableLabel>License</EnvTableLabel>
												<EnvTableValue>{environmentData.license.name}</EnvTableValue>
											</EnvTableRow>
										)}
										<EnvTableRow>
											<EnvTableLabel>Environment ID</EnvTableLabel>
											<EnvTableValue mono>{payload?.env || 'N/A'}</EnvTableValue>
										</EnvTableRow>
									</tbody>
								</EnvTable>
							</EnvironmentInfo>
						</Section>
					)}

					<Section>
						<SectionTitle>API Validation</SectionTitle>
						<TestButton onClick={testToken} disabled={isTesting || isExpired}>
							{isTesting ? 'Testing...' : 'Test Token Against PingOne API'}
						</TestButton>

						{isExpired && (
							<WarningMessage>
								<FiAlertCircle /> This token is expired and will fail API validation
							</WarningMessage>
						)}

						{testResults.length > 0 && (
							<TestResults>
								{testResults.map((result, index) => (
									<TestResultCard key={index} status={result.status}>
										<TestResultHeader>
											<TestResultIcon status={result.status}>
												{result.status === 'success' && <FiCheckCircle size={20} />}
												{result.status === 'error' && <FiXCircle size={20} />}
												{result.status === 'warning' && <FiAlertCircle size={20} />}
											</TestResultIcon>
											<TestResultTitle>{result.test}</TestResultTitle>
											{result.statusCode && (
												<StatusCode status={result.status}>{result.statusCode}</StatusCode>
											)}
										</TestResultHeader>
										<TestResultMessage>{result.message}</TestResultMessage>
										{result.details && <TestResultDetails>{result.details}</TestResultDetails>}
									</TestResultCard>
								))}
							</TestResults>
						)}
					</Section>

					<SuperSimpleApiDisplayV8 />
				</>
			)}
		</Container>
	);
};

// Styled Components
const Container = styled.div`
	width: 100%;
	max-width: 100%;
	padding: 2rem;
	box-sizing: border-box;
	overflow-x: auto;
	overflow-y: auto;
	min-width: 0; /* Allow flex items to shrink below content size */
	
	@media (max-width: 1024px) {
		padding: 1rem;
	}
`;

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 2rem;
	font-weight: 600;
	color: #1a1a1a;
	margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
	color: #666;
	font-size: 1rem;
	margin: 0;
`;

const Section = styled.div`
	background: white;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1a1a1a;
	margin: 0 0 1rem 0;
`;

const TokenInput = styled.textarea`
	width: 100%;
	padding: 1rem;
	border: 2px solid #e0e0e0;
	border-radius: 6px;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	resize: vertical;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #2196f3;
	}
`;

const ErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #d32f2f;
	background: #ffebee;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	margin-top: 1rem;
	font-size: 0.875rem;
`;

const WarningMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #f57c00;
	background: #fff3e0;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	margin-top: 1rem;
	font-size: 0.875rem;
`;

const TokenInfo = styled.div``;

const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-bottom: 1.5rem;
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const InfoCard = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	background: #f5f5f5;
	border-radius: 6px;
`;

const InfoIcon = styled.div<{ status: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 50%;
	flex-shrink: 0;
	background: ${(props) =>
		props.status === 'success' ? '#e8f5e9' : props.status === 'error' ? '#ffebee' : '#e3f2fd'};
	color: ${(props) =>
		props.status === 'success' ? '#4caf50' : props.status === 'error' ? '#d32f2f' : '#2196f3'};
`;

const InfoContent = styled.div`
	flex: 1;
	min-width: 0;
`;

const InfoLabel = styled.div`
	font-size: 0.75rem;
	color: #666;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 0.25rem;
`;

const InfoValue = styled.div<{ status?: 'success' | 'error' }>`
	font-size: 1rem;
	font-weight: 600;
	color: ${(props) =>
		props.status === 'success' ? '#4caf50' : props.status === 'error' ? '#d32f2f' : '#1a1a1a'};
	word-break: break-all;
	margin-bottom: 0.25rem;
`;

const InfoDetail = styled.div`
	font-size: 0.75rem;
	color: #999;
`;

const DetailsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const DetailsRow = styled.div`
	display: flex;
	gap: 1rem;
	padding: 0.75rem;
	background: #fafafa;
	border-radius: 4px;
`;

const DetailsLabel = styled.div`
	font-weight: 600;
	color: #666;
	min-width: 120px;
	flex-shrink: 0;
`;

const DetailsValue = styled.div`
	color: #1a1a1a;
	word-break: break-all;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
`;

const TestButton = styled.button`
	width: 100%;
	padding: 1rem;
	background: #2196f3;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;

	&:hover:not(:disabled) {
		background: #1976d2;
	}

	&:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
`;

const TestResults = styled.div`
	margin-top: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TestResultCard = styled.div<{ status: 'success' | 'error' | 'warning' }>`
	padding: 1rem;
	border-left: 4px solid
		${(props) =>
			props.status === 'success' ? '#4caf50' : props.status === 'error' ? '#d32f2f' : '#ff9800'};
	background: ${(props) =>
		props.status === 'success' ? '#f1f8f4' : props.status === 'error' ? '#fef5f5' : '#fff8f0'};
	border-radius: 6px;
`;

const TestResultHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.5rem;
`;

const TestResultIcon = styled.div<{ status: 'success' | 'error' | 'warning' }>`
	color: ${(props) =>
		props.status === 'success' ? '#4caf50' : props.status === 'error' ? '#d32f2f' : '#ff9800'};
`;

const TestResultTitle = styled.div`
	font-weight: 600;
	color: #1a1a1a;
	flex: 1;
`;

const StatusCode = styled.div<{ status: 'success' | 'error' | 'warning' }>`
	padding: 0.25rem 0.75rem;
	border-radius: 4px;
	font-size: 0.875rem;
	font-weight: 600;
	background: ${(props) =>
		props.status === 'success' ? '#4caf50' : props.status === 'error' ? '#d32f2f' : '#ff9800'};
	color: white;
`;

const TestResultMessage = styled.div`
	color: #1a1a1a;
	margin-bottom: 0.25rem;
`;

const TestResultDetails = styled.div`
	color: #666;
	font-size: 0.875rem;
`;

const EnvironmentInfo = styled.div`
	overflow-x: auto;
`;

const EnvTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	background: white;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const EnvTableRow = styled.tr`
	border-bottom: 1px solid #e5e7eb;
	
	&:last-child {
		border-bottom: none;
	}
	
	&:hover {
		background: #f9fafb;
	}
`;

const EnvTableLabel = styled.td`
	padding: 1rem 1.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	color: #374151;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	width: 200px;
	background: #f3f4f6;
	border-right: 2px solid #e5e7eb;
`;

const EnvTableValue = styled.td<{ highlight?: boolean; mono?: boolean }>`
	padding: 1rem 1.5rem;
	font-size: ${(props) => (props.highlight ? '1.25rem' : '1rem')};
	font-weight: ${(props) => (props.highlight ? '700' : '500')};
	color: ${(props) => (props.highlight ? '#1f2937' : '#4b5563')};
	word-break: break-word;
	overflow-wrap: break-word;
	${(props) =>
		props.mono &&
		`
		font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
		font-size: 0.875rem;
		color: #6b7280;
		word-break: break-all;
	`}
`;

const TypeBadge = styled.span<{ type?: string }>`
	display: inline-block;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 700;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 1px;
	background: ${(props) =>
		props.type === 'PRODUCTION' ? '#dc2626' : props.type === 'SANDBOX' ? '#3b82f6' : '#10b981'};
	color: white;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export default WorkerTokenTester;
