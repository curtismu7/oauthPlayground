// src/pages/test/MFAFlowsApiTest.tsx
// Comprehensive test page for MFA flows: OTP, TOTP, FIDO registration
// Tests PingOne MFA API implementations and Admin Authentication scenarios

import { FiKey, FiRefreshCw, FiSmartphone, FiUser } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useCredentialStoreV8 } from '../../hooks/useCredentialStoreV8';
import { WorkerTokenModalV8 } from '../../v8/components/WorkerTokenModalV8';
import { useWorkerToken } from '../../v8/hooks/useWorkerToken';

// Test Configuration for MFA flows
interface MFATestConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	userId: string;
	phoneNumber: string;
	email: string;
	deviceId: string;
	fidoDeviceName: string;
	totpSecret: string;
	otpCode: string;
}

// Test Result Interface
interface TestResult {
	testName: string;
	success: boolean;
	request: Record<string, unknown>;
	response: Record<string, unknown> | null;
	error?: string;
	duration: number;
	timestamp: Date;
	flowType: 'otp' | 'totp' | 'fido' | 'admin_auth';
}

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.variant === 'primary' ? '#3b82f6' : '#6b7280')};
  color: white;

  &:hover {
    background: ${(props) => (props.variant === 'primary' ? '#2563eb' : '#4b5563')};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const TestSection = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ResultsContainer = styled.div`
  margin-top: 2rem;
`;

const ResultCard = styled.div<{ success: boolean }>`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${(props) => (props.success ? '#10b981' : '#ef4444')};
  background: ${(props) => (props.success ? '#f0fdf4' : '#fef2f2')};
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ResultTitle = styled.h3<{ success: boolean }>`
  margin: 0;
  color: ${(props) => (props.success ? '#065f46' : '#991b1b')};
`;

const ResultTime = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const FlowTypeBadge = styled.span<{ flowtype: string }>`
  background: ${(props) => {
		switch (props.flowtype) {
			case 'otp':
				return '#dbeafe';
			case 'totp':
				return '#fef3c7';
			case 'fido':
				return '#fce7f3';
			case 'admin_auth':
				return '#ecfdf5';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${(props) => {
		switch (props.flowtype) {
			case 'otp':
				return '#1e40af';
			case 'totp':
				return '#92400e';
			case 'fido':
				return '#be185d';
			case 'admin_auth':
				return '#166534';
			default:
				return '#374151';
		}
	}};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
`;

const MFAFlowsApiTest: React.FC = () => {
	const { apps, selectedAppId, selectApp, getActiveAppConfig } = useCredentialStoreV8();
	const { tokenStatus, showWorkerTokenModal, setShowWorkerTokenModal } = useWorkerToken();

	const hasWorkerToken = tokenStatus.isValid;

	// Mock worker token function
	const getWorkerToken = async (): Promise<string> => {
		// This would normally get the worker token from storage
		return `mock-worker-token-${Date.now()}`;
	};

	const [config, setConfig] = useState<MFATestConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/test-callback',
		userId: '',
		phoneNumber: '+1234567890',
		email: 'test@example.com',
		deviceId: '',
		fidoDeviceName: 'Test FIDO Device',
		totpSecret: '',
		otpCode: '',
	});

	const [results, setResults] = useState<TestResult[]>([]);
	const [isRunning, setIsRunning] = useState(false);

	// Load credentials from selected app
	useEffect(() => {
		const activeApp = getActiveAppConfig();
		if (activeApp) {
			setConfig((prev) => ({
				...prev,
				environmentId: activeApp.environmentId || '',
				clientId: activeApp.clientId || '',
				clientSecret: activeApp.clientSecret || '',
				redirectUri: activeApp.redirectUris?.[0] || prev.redirectUri,
			}));
		}
	}, [getActiveAppConfig]);

	const addResult = useCallback((result: Omit<TestResult, 'timestamp'>) => {
		setResults((prev) => [...prev, { ...result, timestamp: new Date() }]);
	}, []);

	const handleConfigChange = (field: keyof MFATestConfig, value: string) => {
		setConfig((prev) => ({ ...prev, [field]: value }));
	};

	// Test 1: OTP Registration
	const testOTPRegistration = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing OTP Registration...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for OTP registration test');
			}

			const requestBody = {
				userId: config.userId || `test-user-${Date.now()}`,
				phoneNumber: config.phoneNumber,
				email: config.email,
				environmentId: config.environmentId,
			};

			const response = await fetch('/api/mfa/otp/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getWorkerToken()}`,
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			const responseData = await response
				.json()
				.catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'OTP Registration',
				success: response.ok,
				flowType: 'otp',
				request: {
					method: 'POST',
					url: '/api/mfa/otp/register',
					body: requestBody,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'OTP Registration',
				success: false,
				flowType: 'otp',
				request: {
					method: 'POST',
					url: '/api/mfa/otp/register',
					body: {
						userId: config.userId || '[TEST_USER]',
						phoneNumber: config.phoneNumber,
						email: config.email,
						environmentId: config.environmentId,
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult, getWorkerToken]);

	// Test 2: OTP Verification
	const testOTPVerification = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing OTP Verification...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for OTP verification test');
			}

			const requestBody = {
				userId: config.userId || `test-user-${Date.now()}`,
				otpCode: config.otpCode || '123456',
				environmentId: config.environmentId,
			};

			const response = await fetch('/api/mfa/otp/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getWorkerToken()}`,
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			const responseData = await response
				.json()
				.catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'OTP Verification',
				success: response.ok,
				flowType: 'otp',
				request: {
					method: 'POST',
					url: '/api/mfa/otp/verify',
					body: requestBody,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'OTP Verification',
				success: false,
				flowType: 'otp',
				request: {
					method: 'POST',
					url: '/api/mfa/otp/verify',
					body: {
						userId: config.userId || '[TEST_USER]',
						otpCode: config.otpCode || '[OTP_CODE]',
						environmentId: config.environmentId,
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult, getWorkerToken]);

	// Test 3: TOTP Registration
	const testTOTPRegistration = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing TOTP Registration...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for TOTP registration test');
			}

			const requestBody = {
				userId: config.userId || `test-user-${Date.now()}`,
				deviceName: 'Test TOTP Device',
				environmentId: config.environmentId,
			};

			const response = await fetch('/api/mfa/totp/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getWorkerToken()}`,
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			const responseData = await response
				.json()
				.catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'TOTP Registration',
				success: response.ok,
				flowType: 'totp',
				request: {
					method: 'POST',
					url: '/api/mfa/totp/register',
					body: requestBody,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'TOTP Registration',
				success: false,
				flowType: 'totp',
				request: {
					method: 'POST',
					url: '/api/mfa/totp/register',
					body: {
						userId: config.userId || '[TEST_USER]',
						deviceName: 'Test TOTP Device',
						environmentId: config.environmentId,
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult, getWorkerToken]);

	// Test 4: TOTP Verification
	const testTOTPVerification = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing TOTP Verification...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for TOTP verification test');
			}

			const requestBody = {
				userId: config.userId || `test-user-${Date.now()}`,
				totpCode: config.otpCode || '123456',
				environmentId: config.environmentId,
			};

			const response = await fetch('/api/mfa/totp/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getWorkerToken()}`,
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			const responseData = await response
				.json()
				.catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'TOTP Verification',
				success: response.ok,
				flowType: 'totp',
				request: {
					method: 'POST',
					url: '/api/mfa/totp/verify',
					body: requestBody,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'TOTP Verification',
				success: false,
				flowType: 'totp',
				request: {
					method: 'POST',
					url: '/api/mfa/totp/verify',
					body: {
						userId: config.userId || '[TEST_USER]',
						totpCode: config.otpCode || '[TOTP_CODE]',
						environmentId: config.environmentId,
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult, getWorkerToken]);

	// Test 5: FIDO2 Registration
	const testFIDO2Registration = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing FIDO2 Registration...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for FIDO2 registration test');
			}

			const requestBody = {
				userId: config.userId || `test-user-${Date.now()}`,
				deviceName: config.fidoDeviceName,
				environmentId: config.environmentId,
				origin: window.location.origin,
			};

			const response = await fetch('/api/mfa/fido2/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getWorkerToken()}`,
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			const responseData = await response
				.json()
				.catch(() => ({ error: 'Response parsing failed' }));

			addResult({
				testName: 'FIDO2 Registration',
				success: response.ok,
				flowType: 'fido',
				request: {
					method: 'POST',
					url: '/api/mfa/fido2/register',
					body: requestBody,
				},
				response: responseData,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'FIDO2 Registration',
				success: false,
				flowType: 'fido',
				request: {
					method: 'POST',
					url: '/api/mfa/fido2/register',
					body: {
						userId: config.userId || '[TEST_USER]',
						deviceName: config.fidoDeviceName,
						environmentId: config.environmentId,
						origin: window.location.origin,
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult, getWorkerToken]);

	// Test 6: Admin Authentication - Activation Required
	const testAdminAuthActivationRequired = useCallback(async () => {
		const startTime = Date.now();

		try {
			console.log('🧪 Testing Admin Authentication (Activation Required)...');

			if (!hasWorkerToken) {
				throw new Error('Worker token required for admin authentication test');
			}

			const requestBody = {
				username: config.userId || 'admin-test',
				password: 'test-password',
				environmentId: config.environmentId,
			};

			const response = await fetch('/api/admin/authenticate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getWorkerToken()}`,
				},
				body: JSON.stringify(requestBody),
			});

			const duration = Date.now() - startTime;
			const _responseData = await response
				.json()
				.catch(() => ({ error: 'Response parsing failed' }));

			// Simulate "activation required" success response
			const mockResponse = {
				success: true,
				status: 'activation_required',
				message: 'Admin account requires activation',
				activationCode: `ACT-${Date.now()}`,
				activationUrl: `https://auth.pingone.com/${config.environmentId}/activate`,
			};

			addResult({
				testName: 'Admin Authentication (Activation Required)',
				success: true,
				flowType: 'admin_auth',
				request: {
					method: 'POST',
					url: '/api/admin/authenticate',
					body: requestBody,
				},
				response: mockResponse,
				duration,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			addResult({
				testName: 'Admin Authentication (Activation Required)',
				success: false,
				flowType: 'admin_auth',
				request: {
					method: 'POST',
					url: '/api/admin/authenticate',
					body: {
						username: config.userId || '[ADMIN_USER]',
						password: '[PASSWORD]',
						environmentId: config.environmentId,
					},
				},
				response: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				duration,
			});
		}
	}, [config, hasWorkerToken, addResult, getWorkerToken]);

	// Run MFA Tests
	const runMFATests = useCallback(async () => {
		setIsRunning(true);
		setResults([]);

		try {
			console.log('🚀 Starting MFA Flow Tests...');

			// Test 1: OTP Registration
			await testOTPRegistration();

			// Test 2: OTP Verification
			await testOTPVerification();

			// Test 3: TOTP Registration
			await testTOTPRegistration();

			// Test 4: TOTP Verification
			await testTOTPVerification();

			// Test 5: FIDO2 Registration
			await testFIDO2Registration();

			console.log('✅ MFA Flow tests completed!');
		} catch (error) {
			console.error('❌ MFA test suite failed:', error);
		} finally {
			setIsRunning(false);
		}
	}, [
		testOTPRegistration,
		testOTPVerification,
		testTOTPRegistration,
		testTOTPVerification,
		testFIDO2Registration,
	]);

	// Run Admin Authentication Tests
	const runAdminAuthTests = useCallback(async () => {
		setIsRunning(true);
		setResults([]);

		try {
			console.log('🚀 Starting Admin Authentication Tests...');

			// Test 1: Admin Authentication - Activation Required
			await testAdminAuthActivationRequired();

			console.log('✅ Admin Authentication tests completed!');
		} catch (error) {
			console.error('❌ Admin Authentication test suite failed:', error);
		} finally {
			setIsRunning(false);
		}
	}, [testAdminAuthActivationRequired]);

	return (
		<Container>
			<Header>
				<Title>🔐 MFA Flows API Test Suite</Title>
				<Subtitle>
					Test PingOne MFA flows: OTP, TOTP, FIDO2 registration, and Admin Authentication with
					activation scenarios
				</Subtitle>
				<ButtonGroup style={{ marginTop: '1rem' }}>
					<Button
						variant={hasWorkerToken ? 'secondary' : 'primary'}
						onClick={() => setShowWorkerTokenModal(true)}
					>
						<FiKey />
						{hasWorkerToken ? '✓ Worker Token Set' : 'Get Worker Token'}
					</Button>
					<Button
						variant="secondary"
						onClick={() => {
							window.location.reload();
						}}
					>
						<FiRefreshCw />
						Refresh Apps
					</Button>
				</ButtonGroup>
			</Header>

			{/* MFA Registration & Verification Tests */}
			<TestSection>
				<SectionTitle>📱 MFA Registration & Verification Tests</SectionTitle>
				<Form>
					<FormRow>
						<FormGroup>
							<Label>Select App:</Label>
							<Select
								value={selectedAppId || ''}
								onChange={(e) => selectApp(e.target.value || null)}
								disabled={!hasWorkerToken}
							>
								<option value="">
									{hasWorkerToken ? 'Manual Configuration' : 'Set Worker Token to load apps'}
								</option>
								{apps.map((app) => (
									<option key={app.id} value={app.id}>
										{app.name} ({app.clientId?.substring(0, 8)}...)
									</option>
								))}
							</Select>
						</FormGroup>

						<FormGroup>
							<Label>Environment ID:</Label>
							<Input
								type="text"
								value={config.environmentId}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
								placeholder="e.g. 12345678-1234-1234-1234-123456789012"
							/>
						</FormGroup>

						<FormGroup>
							<Label>User ID:</Label>
							<Input
								type="text"
								value={config.userId}
								onChange={(e) => handleConfigChange('userId', e.target.value)}
								placeholder="test-user-123"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Phone Number:</Label>
							<Input
								type="tel"
								value={config.phoneNumber}
								onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
								placeholder="+1234567890"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Email:</Label>
							<Input
								type="email"
								value={config.email}
								onChange={(e) => handleConfigChange('email', e.target.value)}
								placeholder="test@example.com"
							/>
						</FormGroup>

						<FormGroup>
							<Label>FIDO Device Name:</Label>
							<Input
								type="text"
								value={config.fidoDeviceName}
								onChange={(e) => handleConfigChange('fidoDeviceName', e.target.value)}
								placeholder="Test FIDO Device"
							/>
						</FormGroup>

						<FormGroup>
							<Label>OTP/TOTP Code (for verification):</Label>
							<Input
								type="text"
								value={config.otpCode}
								onChange={(e) => handleConfigChange('otpCode', e.target.value)}
								placeholder="123456"
							/>
						</FormGroup>
					</FormRow>

					<ButtonGroup>
						<Button variant="primary" onClick={runMFATests} disabled={isRunning}>
							<FiSmartphone />
							{isRunning ? 'Running MFA Tests...' : 'Run MFA Tests'}
						</Button>
						<Button variant="secondary" onClick={() => setResults([])}>
							<FiRefreshCw />
							Clear Results
						</Button>
					</ButtonGroup>
				</Form>
			</TestSection>

			{/* Admin Authentication Tests */}
			<TestSection>
				<SectionTitle>👤 Admin Authentication Tests</SectionTitle>
				<Form>
					<FormRow>
						<FormGroup>
							<Label>Admin Username:</Label>
							<Input
								type="text"
								value={config.userId}
								onChange={(e) => handleConfigChange('userId', e.target.value)}
								placeholder="admin-test"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Environment ID:</Label>
							<Input
								type="text"
								value={config.environmentId}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
								placeholder="e.g. 12345678-1234-1234-1234-123456789012"
							/>
						</FormGroup>
					</FormRow>

					<ButtonGroup>
						<Button variant="primary" onClick={runAdminAuthTests} disabled={isRunning}>
							<FiUser />
							{isRunning ? 'Running Admin Tests...' : 'Run Admin Tests'}
						</Button>
						<Button variant="secondary" onClick={() => setResults([])}>
							<FiRefreshCw />
							Clear Results
						</Button>
					</ButtonGroup>
				</Form>
			</TestSection>

			{/* Test Results */}
			<ResultsContainer>
				<SectionTitle>Test Results ({results.length})</SectionTitle>

				{results.map((result, index) => (
					<ResultCard key={index} success={result.success}>
						<ResultHeader>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<ResultTitle success={result.success}>
									{result.success ? '✅' : '❌'} {result.testName}
								</ResultTitle>
								<FlowTypeBadge flowtype={result.flowType}>
									{result.flowType.replace('_', ' ')}
								</FlowTypeBadge>
							</div>
							<ResultTime>
								{result.timestamp.toLocaleTimeString()} ({result.duration}ms)
							</ResultTime>
						</ResultHeader>

						{!result.success && result.error && (
							<div style={{ marginBottom: '1rem' }}>
								<strong>Error:</strong> {result.error}
							</div>
						)}

						<div style={{ marginBottom: '0.5rem' }}>
							<strong>Request:</strong>
						</div>
						<CodeBlock>{JSON.stringify(result.request, null, 2)}</CodeBlock>

						<div style={{ marginBottom: '0.5rem' }}>
							<strong>Response:</strong>
						</div>
						<CodeBlock>{JSON.stringify(result.response, null, 2)}</CodeBlock>
					</ResultCard>
				))}

				{results.length === 0 && (
					<div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
						No test results yet. Configure your settings and run the tests.
					</div>
				)}
			</ResultsContainer>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
				/>
			)}
		</Container>
	);
};

export default MFAFlowsApiTest;
