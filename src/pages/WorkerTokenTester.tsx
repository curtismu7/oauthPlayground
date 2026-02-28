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
} from '@icons';
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

const styles = {
	container: {
		width: '100%',
		maxWidth: '100%',
		padding: '2rem',
		boxSizing: 'border-box',
		overflowX: 'auto',
		overflowY: 'auto',
		minWidth: 0,
	} as React.CSSProperties,
	header: {
		marginBottom: '2rem',
	} as React.CSSProperties,
	title: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		fontSize: '2rem',
		fontWeight: 600,
		color: '#1a1a1a',
		margin: '0 0 0.5rem 0',
	} as React.CSSProperties,
	subtitle: {
		color: '#666',
		fontSize: '1rem',
		margin: 0,
	} as React.CSSProperties,
	section: {
		background: 'white',
		borderRadius: '8px',
		padding: '1.5rem',
		marginBottom: '1.5rem',
		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	} as React.CSSProperties,
	sectionTitle: {
		fontSize: '1.25rem',
		fontWeight: 600,
		color: '#1a1a1a',
		margin: '0 0 1rem 0',
	} as React.CSSProperties,
	tokenInput: {
		width: '100%',
		padding: '1rem',
		border: '2px solid #e0e0e0',
		borderRadius: '6px',
		fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
		fontSize: '0.875rem',
		resize: 'vertical',
	} as React.CSSProperties,
	errorMessage: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: '#d32f2f',
		background: '#ffebee',
		padding: '0.75rem 1rem',
		borderRadius: '6px',
		marginTop: '1rem',
		fontSize: '0.875rem',
	} as React.CSSProperties,
	warningMessage: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: '#f57c00',
		background: '#fff3e0',
		padding: '0.75rem 1rem',
		borderRadius: '6px',
		marginTop: '1rem',
		fontSize: '0.875rem',
	} as React.CSSProperties,
	tokenInfo: {} as React.CSSProperties,
	infoGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
		gap: '1rem',
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	infoCard: {
		display: 'flex',
		gap: '1rem',
		padding: '1rem',
		background: '#f5f5f5',
		borderRadius: '6px',
	} as React.CSSProperties,
	infoIcon: (status: 'success' | 'error' | 'info'): React.CSSProperties => ({
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '48px',
		height: '48px',
		borderRadius: '50%',
		flexShrink: 0,
		background: status === 'success' ? '#e8f5e9' : status === 'error' ? '#ffebee' : '#e3f2fd',
		color: status === 'success' ? '#4caf50' : status === 'error' ? '#d32f2f' : '#2196f3',
	}),
	infoContent: {
		flex: 1,
		minWidth: 0,
	} as React.CSSProperties,
	infoLabel: {
		fontSize: '0.75rem',
		color: '#666',
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
		marginBottom: '0.25rem',
	} as React.CSSProperties,
	infoValue: (status?: 'success' | 'error'): React.CSSProperties => ({
		fontSize: '1rem',
		fontWeight: 600,
		color: status === 'success' ? '#4caf50' : status === 'error' ? '#d32f2f' : '#1a1a1a',
		wordBreak: 'break-all',
		marginBottom: '0.25rem',
	}),
	infoDetail: {
		fontSize: '0.75rem',
		color: '#999',
	} as React.CSSProperties,
	detailsList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
	} as React.CSSProperties,
	detailsRow: {
		display: 'flex',
		gap: '1rem',
		padding: '0.75rem',
		background: '#fafafa',
		borderRadius: '4px',
	} as React.CSSProperties,
	detailsLabel: {
		fontWeight: 600,
		color: '#666',
		minWidth: '120px',
		flexShrink: 0,
	} as React.CSSProperties,
	detailsValue: {
		color: '#1a1a1a',
		wordBreak: 'break-all',
		fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
		fontSize: '0.875rem',
	} as React.CSSProperties,
	testButton: {
		width: '100%',
		padding: '1rem',
		background: '#2196f3',
		color: 'white',
		border: 'none',
		borderRadius: '6px',
		fontSize: '1rem',
		fontWeight: 600,
		cursor: 'pointer',
	} as React.CSSProperties,
	testResults: {
		marginTop: '1.5rem',
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	} as React.CSSProperties,
	testResultCard: (status: 'success' | 'error' | 'warning'): React.CSSProperties => ({
		padding: '1rem',
		borderLeft: `4px solid ${status === 'success' ? '#4caf50' : status === 'error' ? '#d32f2f' : '#ff9800'}`,
		background: status === 'success' ? '#f1f8f4' : status === 'error' ? '#fef5f5' : '#fff8f0',
		borderRadius: '6px',
	}),
	testResultHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	testResultIcon: (status: 'success' | 'error' | 'warning'): React.CSSProperties => ({
		color: status === 'success' ? '#4caf50' : status === 'error' ? '#d32f2f' : '#ff9800',
	}),
	testResultTitle: {
		fontWeight: 600,
		color: '#1a1a1a',
		flex: 1,
	} as React.CSSProperties,
	statusCode: (status: 'success' | 'error' | 'warning'): React.CSSProperties => ({
		padding: '0.25rem 0.75rem',
		borderRadius: '4px',
		fontSize: '0.875rem',
		fontWeight: 600,
		background: status === 'success' ? '#4caf50' : status === 'error' ? '#d32f2f' : '#ff9800',
		color: 'white',
	}),
	testResultMessage: {
		color: '#1a1a1a',
		marginBottom: '0.25rem',
	} as React.CSSProperties,
	testResultDetails: {
		color: '#666',
		fontSize: '0.875rem',
	} as React.CSSProperties,
	environmentInfo: {
		overflowX: 'auto',
	} as React.CSSProperties,
	envTable: {
		width: '100%',
		borderCollapse: 'collapse',
		background: 'white',
		borderRadius: '8px',
		overflow: 'hidden',
		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	} as React.CSSProperties,
	envTableRow: {
		borderBottom: '1px solid #e5e7eb',
	} as React.CSSProperties,
	envTableLabel: {
		padding: '1rem 1.5rem',
		fontWeight: 600,
		fontSize: '0.875rem',
		color: '#374151',
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
		width: '200px',
		background: '#f3f4f6',
		borderRight: '2px solid #e5e7eb',
	} as React.CSSProperties,
	envTableValue: (highlight?: boolean, mono?: boolean): React.CSSProperties => ({
		padding: '1rem 1.5rem',
		fontSize: highlight ? '1.25rem' : mono ? '0.875rem' : '1rem',
		fontWeight: highlight ? 700 : 500,
		color: highlight ? '#1f2937' : mono ? '#6b7280' : '#4b5563',
		wordBreak: mono ? 'break-all' : 'break-word',
		overflowWrap: 'break-word',
		...(mono && {
			fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
		}),
	}),
	typeBadge: (type?: string): React.CSSProperties => ({
		display: 'inline-block',
		padding: '0.5rem 1rem',
		borderRadius: '6px',
		fontWeight: 700,
		fontSize: '0.875rem',
		textTransform: 'uppercase',
		letterSpacing: '1px',
		background: type === 'PRODUCTION' ? '#dc2626' : type === 'SANDBOX' ? '#3b82f6' : '#10b981',
		color: 'white',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
	}),
};

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
						v4ToastManager.showWarning('\u26a0\ufe0f Token decoded but it is EXPIRED');
					} else {
						v4ToastManager.showInfo('\u2713 Token decoded successfully');
					}
				} else {
					v4ToastManager.showInfo('\u2713 Token decoded successfully');
				}
			} else {
				setPayload(null);
				setError('Invalid JWT token format');
				v4ToastManager.showError('\u274c Invalid JWT token format');
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

				v4ToastManager.showSuccess(`\u2705 Token is valid! Environment: ${envData.name}`);
			} else {
				results.push({
					test: 'Get Environment',
					status: 'error',
					statusCode: envResponse.status,
					message: envData.message || 'Failed to get environment',
					details: envData.details || envData.error_description,
				});

				if (envResponse.status === 401) {
					v4ToastManager.showError('\u274c Token is invalid or expired');
				} else if (envResponse.status === 403) {
					v4ToastManager.showWarning('\u26a0\ufe0f Token lacks environment read permissions');
				} else {
					v4ToastManager.showError(
						`\u274c Validation failed: ${envData.message || 'Unknown error'}`
					);
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

			v4ToastManager.showError(`\u274c Network error: ${errorMessage}`);
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
		<div style={styles.container}>
			<div style={styles.header}>
				<h1 style={styles.title}>
					<FiKey size={32} />
					Worker Token Tester
				</h1>
				<p style={styles.subtitle}>
					Paste a PingOne worker token to decode and validate it against the PingOne API
				</p>
			</div>

			<div style={styles.section}>
				<h2 style={styles.sectionTitle}>Token Input</h2>
				<textarea
					style={styles.tokenInput}
					placeholder="Paste your PingOne worker token here (JWT format: eyJhbGc...)"
					value={token}
					onChange={(e) => handleTokenChange(e.target.value)}
					rows={6}
				/>
				{error && (
					<div style={styles.errorMessage}>
						<FiXCircle /> {error}
					</div>
				)}
			</div>

			{payload && (
				<>
					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>Token Information</h2>
						<div style={styles.tokenInfo}>
							<div style={styles.infoGrid}>
								<div style={styles.infoCard}>
									<div style={styles.infoIcon(isExpired ? 'error' : 'success')}>
										<FiClock size={24} />
									</div>
									<div style={styles.infoContent}>
										<div style={styles.infoLabel}>Status</div>
										<div style={styles.infoValue(isExpired ? 'error' : 'success')}>
											{isExpired ? 'EXPIRED' : 'VALID'}
										</div>
										{timeRemaining !== null && (
											<div style={styles.infoDetail}>
												{isExpired ? 'Expired ' : 'Expires in '}
												{formatTimeRemaining(timeRemaining)}
											</div>
										)}
									</div>
								</div>

								<div style={styles.infoCard}>
									<div style={styles.infoIcon('info')}>
										<FiKey size={24} />
									</div>
									<div style={styles.infoContent}>
										<div style={styles.infoLabel}>Client ID</div>
										<div style={styles.infoValue()}>{payload.client_id || 'N/A'}</div>
										<div style={styles.infoDetail}>OAuth Client Identifier</div>
									</div>
								</div>

								<div style={styles.infoCard}>
									<div style={styles.infoIcon('info')}>
										<FiGlobe size={24} />
									</div>
									<div style={styles.infoContent}>
										<div style={styles.infoLabel}>Environment ID</div>
										<div style={styles.infoValue()}>{payload.env || 'N/A'}</div>
										<div style={styles.infoDetail}>PingOne Environment</div>
									</div>
								</div>

								<div style={styles.infoCard}>
									<div style={styles.infoIcon('info')}>
										<FiUser size={24} />
									</div>
									<div style={styles.infoContent}>
										<div style={styles.infoLabel}>Organization ID</div>
										<div style={styles.infoValue()}>{payload.org || 'N/A'}</div>
										<div style={styles.infoDetail}>PingOne Organization</div>
									</div>
								</div>
							</div>

							<div style={styles.detailsList}>
								<div style={styles.detailsRow}>
									<div style={styles.detailsLabel}>Issued At:</div>
									<div style={styles.detailsValue}>
										{payload.iat ? formatDate(payload.iat) : 'N/A'}
									</div>
								</div>
								<div style={styles.detailsRow}>
									<div style={styles.detailsLabel}>Expires At:</div>
									<div style={styles.detailsValue}>
										{payload.exp ? formatDate(payload.exp) : 'N/A'}
									</div>
								</div>
								<div style={styles.detailsRow}>
									<div style={styles.detailsLabel}>Issuer:</div>
									<div style={styles.detailsValue}>{payload.iss || 'N/A'}</div>
								</div>
								<div style={styles.detailsRow}>
									<div style={styles.detailsLabel}>Audience:</div>
									<div style={styles.detailsValue}>
										{Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud || 'N/A'}
									</div>
								</div>
								{payload.scope && (
									<div style={styles.detailsRow}>
										<div style={styles.detailsLabel}>Scope:</div>
										<div style={styles.detailsValue}>{payload.scope}</div>
									</div>
								)}
								<div style={styles.detailsRow}>
									<div style={styles.detailsLabel}>JWT ID:</div>
									<div style={styles.detailsValue}>{payload.jti || 'N/A'}</div>
								</div>
							</div>
						</div>
					</div>

					{environmentData && (
						<div style={styles.section}>
							<h2 style={styles.sectionTitle}>Environment Details</h2>
							<div style={styles.environmentInfo}>
								<table style={styles.envTable}>
									<tbody>
										<tr style={styles.envTableRow}>
											<td style={styles.envTableLabel}>Environment Name</td>
											<td style={styles.envTableValue(true)}>{environmentData.name || 'N/A'}</td>
										</tr>
										<tr style={styles.envTableRow}>
											<td style={styles.envTableLabel}>Environment Type</td>
											<td style={styles.envTableValue()}>
												{environmentData.type ? (
													<span style={styles.typeBadge(environmentData.type)}>
														{environmentData.type}
													</span>
												) : (
													'N/A'
												)}
											</td>
										</tr>
										<tr style={styles.envTableRow}>
											<td style={styles.envTableLabel}>Region</td>
											<td style={styles.envTableValue()}>
												{environmentData.region === 'NA' && 'U0001f1faU0001f1f8 NA (North America)'}
												{environmentData.region === 'EU' && 'U0001f1eaU0001f1fa EU (Europe)'}
												{environmentData.region === 'AP' && 'U0001f30f AP (Asia Pacific)'}
												{environmentData.region === 'CA' && 'U0001f1e8U0001f1e6 CA (Canada)'}
												{!['NA', 'EU', 'AP', 'CA'].includes(environmentData.region || '') &&
													(environmentData.region || 'N/A')}
											</td>
										</tr>
										{environmentData.description && (
											<tr style={styles.envTableRow}>
												<td style={styles.envTableLabel}>Description</td>
												<td style={styles.envTableValue()}>{environmentData.description}</td>
											</tr>
										)}
										{environmentData.license?.name && (
											<tr style={styles.envTableRow}>
												<td style={styles.envTableLabel}>License</td>
												<td style={styles.envTableValue()}>{environmentData.license.name}</td>
											</tr>
										)}
										<tr style={styles.envTableRow}>
											<td style={styles.envTableLabel}>Environment ID</td>
											<td style={styles.envTableValue(undefined, true)}>{payload?.env || 'N/A'}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					)}

					<div style={styles.section}>
						<h2 style={styles.sectionTitle}>API Validation</h2>
						<button
							type="button"
							style={{
								...styles.testButton,
								...(isTesting || isExpired ? { background: '#ccc', cursor: 'not-allowed' } : {}),
							}}
							onClick={testToken}
							disabled={isTesting || isExpired}
						>
							{isTesting ? 'Testing...' : 'Test Token Against PingOne API'}
						</button>

						{isExpired && (
							<div style={styles.warningMessage}>
								<FiAlertCircle /> This token is expired and will fail API validation
							</div>
						)}

						{testResults.length > 0 && (
							<div style={styles.testResults}>
								{testResults.map((result, index) => (
									<div key={index} style={styles.testResultCard(result.status)}>
										<div style={styles.testResultHeader}>
											<div style={styles.testResultIcon(result.status)}>
												{result.status === 'success' && <FiCheckCircle size={20} />}
												{result.status === 'error' && <FiXCircle size={20} />}
												{result.status === 'warning' && <FiAlertCircle size={20} />}
											</div>
											<div style={styles.testResultTitle}>{result.test}</div>
											{result.statusCode && (
												<div style={styles.statusCode(result.status)}>{result.statusCode}</div>
											)}
										</div>
										<div style={styles.testResultMessage}>{result.message}</div>
										{result.details && <div style={styles.testResultDetails}>{result.details}</div>}
									</div>
								))}
							</div>
						)}
					</div>

					<SuperSimpleApiDisplayV8 />
				</>
			)}
		</div>
	);
};

export default WorkerTokenTester;
