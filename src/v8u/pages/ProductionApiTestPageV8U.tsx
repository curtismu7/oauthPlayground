/**
 * @file ProductionApiTestPageV8U.tsx
 * @module v8u/pages
 * @description Production API Test Page for v8 unified flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This page provides a comprehensive testing interface for production APIs
 * including MFA device management, unified OAuth flows, and PingOne platform APIs.
 * Features include:
 * - Test suite organization by category
 * - Detailed API request/response inspection
 * - Real-time test execution and results
 * - Worker token status monitoring
 * - User token monitoring
 */

import React, { useState, useCallback, useEffect } from 'react';
import { FiPlay, FiRefreshCw, FiCheck, FiX, FiCode, FiDatabase, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { WorkerTokenStatusServiceV8, type TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import WorkerTokenStatusDisplayV8 from '@/v8/components/WorkerTokenStatusDisplayV8';
import UserTokenStatusDisplayV8U from '@/v8u/components/UserTokenStatusDisplayV8U';

// Test interfaces
interface ApiTest {
	id: string;
	name: string;
	description: string;
	category: 'mfa' | 'unified' | 'common';
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	endpoint: string;
	headers?: Record<string, string> | undefined;
	body?: Record<string, unknown> | undefined;
	expectedStatus?: number;
	dependencies?: string[];
}

interface TestResult {
	testId: string;
	status: 'pending' | 'running' | 'success' | 'error';
	duration?: number;
	request?: {
		method: string;
		url: string;
		headers: Record<string, string>;
		body?: Record<string, unknown>;
	};
	response?: {
		status: number;
		statusText: string;
		headers: Record<string, string>;
		body: Record<string, unknown>;
	};
	error?: string;
}

// Styled components
const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const PageHeader = styled.div`
	margin-bottom: 32px;
`;

const PageTitle = styled.h1`
	font-size: 32px;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 8px 0;
`;

const PageDescription = styled.p`
	font-size: 16px;
	color: #6b7280;
	margin: 0;
	line-height: 1.6;
`;

const TestSuiteCard = styled.div`
	background: white;
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
`;

const TestSuiteHeader = styled.div`
	margin-bottom: 16px;
`;

const TestSuiteTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const TestSuiteDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 8px 0 0 0;
	line-height: 1.5;
`;

const RunButton = styled.button`
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: scale(1.02);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

// Test suites data
const testSuites: ApiTest[] = [
	{
		id: 'worker-token-monitoring',
		name: 'Worker Token Monitoring',
		description: 'Monitor and manage worker tokens for API authentication',
		category: 'common',
		method: 'GET',
		endpoint: '/api/worker-token/status',
		expectedStatus: 200,
	},
	{
		id: 'user-token-monitoring',
		name: 'User Token Monitoring',
		description: 'Monitor user authentication tokens from OAuth flows',
		category: 'unified',
		method: 'GET',
		endpoint: '/api/user-tokens/status',
		expectedStatus: 200,
	},
];

const ProductionApiTestPageV8U: React.FC = () => {
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>({
		isValid: false,
		status: 'missing',
		message: 'Checking...',
		expiresAt: null,
		minutesRemaining: 0,
	});

	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken?.silentApiRetrieval || false;
	});

	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken?.showTokenAtEnd || false;
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Update token status on mount and set up interval
	useEffect(() => {
		const updateTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error('[PRODUCTION-API-TEST-V8U] Failed to check token status:', error);
				setTokenStatus({
					isValid: false,
					status: 'error',
					message: 'Failed to check status',
					expiresAt: null,
					minutesRemaining: 0,
				});
			}
		};

		// Initial check
		updateTokenStatus();

		// Set up interval for periodic updates
		const interval = setInterval(updateTokenStatus, 5000);

		// Listen for configuration updates
		const handleConfigUpdate = () => {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			setSilentApiRetrieval(config.workerToken?.silentApiRetrieval || false);
			setShowTokenAtEnd(config.workerToken?.showTokenAtEnd || false);
		};

		const handleTokenUpdate = () => {
			updateTokenStatus();
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);

		return () => {
			clearInterval(interval);
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, []);

	const handleShowWorkerTokenModal = async () => {
		try {
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				setTokenStatus,
				silentApiRetrieval,
				showTokenAtEnd,
				false
			);
		} catch (error) {
			console.error('[PRODUCTION-API-TEST-V8U] Error showing worker token modal:', error);
		}
	};

	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>Production API Test Suite</PageTitle>
				<PageDescription>
					Comprehensive testing interface for production APIs including MFA device management,
					unified OAuth flows, and PingOne platform APIs. Monitor tokens, execute tests, and inspect
					requests and responses in real-time.
				</PageDescription>
			</PageHeader>

			{/* Worker Token Monitoring Section */}
			<TestSuiteCard>
				<TestSuiteHeader>
					<TestSuiteTitle>
						<FiShield />
						Worker Token Monitoring
					</TestSuiteTitle>
				</TestSuiteHeader>
				<TestSuiteDescription>
					Monitor the worker token used for API authentication and management operations.
					Check token validity, expiration, and refresh status.
				</TestSuiteDescription>
				
				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<WorkerTokenStatusDisplayV8 mode="compact" showRefresh={true} />
					
					<div style={{ display: 'flex', gap: '8px' }}>
						<RunButton onClick={handleShowWorkerTokenModal}>
							<FiShield />
							Get Worker Token
						</RunButton>
					</div>

					{/* Detailed Worker Token Settings Checkboxes - Same as Main Page */}
					<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								userSelect: 'none',
								padding: '8px',
								borderRadius: '6px',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f3f4f6';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<input
								type="checkbox"
								checked={silentApiRetrieval}
								onChange={async (e) => {
									const newValue = e.target.checked;
									setSilentApiRetrieval(newValue);
									// Update config service immediately (no cache)
									const config = MFAConfigurationServiceV8.loadConfiguration();
									config.workerToken.silentApiRetrieval = newValue;
									MFAConfigurationServiceV8.saveConfiguration(config);
									// Dispatch event to notify other components
									window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
									
									// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
									if (newValue) {
										try {
											const currentStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
											if (!currentStatus.isValid) {
												console.log('[TOKEN-MONITORING-V8U] Silent API retrieval enabled, attempting to fetch token now...');
												const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
												await handleShowWorkerTokenModal(
													setShowWorkerTokenModal,
													setTokenStatus,
													newValue,  // Use new value
													showTokenAtEnd,
													false      // Not forced - respect silent setting
												);
											}
										} catch (error) {
											console.error('[TOKEN-MONITORING-V8U] Error in silent retrieval:', error);
										}
									}
								}}
								style={{
									width: '20px',
									height: '20px',
									cursor: 'pointer',
									accentColor: '#6366f1',
									flexShrink: 0,
								}}
							/>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
								<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
									Silent API Token Retrieval
								</span>
								<span style={{ fontSize: '12px', color: '#6b7280' }}>
									Automatically fetch worker token in the background without showing modals
								</span>
							</div>
						</label>

						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								userSelect: 'none',
								padding: '8px',
								borderRadius: '6px',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f3f4f6';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<input
								type="checkbox"
								checked={showTokenAtEnd}
								onChange={(e) => {
									const newValue = e.target.checked;
									setShowTokenAtEnd(newValue);
									// Update config service immediately (no cache)
									const config = MFAConfigurationServiceV8.loadConfiguration();
									config.workerToken.showTokenAtEnd = newValue;
									MFAConfigurationServiceV8.saveConfiguration(config);
									// Dispatch event to notify other components
									window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
								}}
								style={{
									width: '20px',
									height: '20px',
									cursor: 'pointer',
									accentColor: '#6366f1',
									flexShrink: 0,
								}}
							/>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
								<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
									Show Token After Generation
								</span>
								<span style={{ fontSize: '12px', color: '#6b7280' }}>
									Display the generated worker token in a modal after successful retrieval
								</span>
							</div>
						</label>
					</div>
				</div>
			</TestSuiteCard>

			{/* User Token Monitoring Section */}
			<TestSuiteCard>
				<TestSuiteHeader>
					<TestSuiteTitle>
						<FiCode />
						User Token Monitoring
					</TestSuiteTitle>
				</TestSuiteHeader>
				<TestSuiteDescription>
					Monitor user authentication tokens (Access, ID, and Refresh tokens) from OAuth flows and unified authentication.
				</TestSuiteDescription>
				
				<UserTokenStatusDisplayV8U showRefresh={true} refreshInterval={10} />
			</TestSuiteCard>
		</PageContainer>
	);
};

export default ProductionApiTestPageV8U;
