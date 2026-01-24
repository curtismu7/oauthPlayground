/**
 * @file ProductionApiTestPageV8U.tsx
 * @module v8u/pages
 * @description Comprehensive API Testing Page for Production Group
 * @version 8.0.0
 * @since 2026-01-24
 *
 * Complete API testing interface for MFA and Unified flows with:
 * - Real PingOne API calls
 * - Headers and JSON body inspection
 * - Test execution and results tracking
 * - Production group menu integration
 */

import React, { useState, useCallback } from 'react';
import { FiPlay, FiRefreshCw, FiCheck, FiX, FiCode, FiDatabase, FiShield } from 'react-icons/fi';
import styled from 'styled-components';

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
		body?: unknown;
	};
	response?: {
		status: number;
		statusText: string;
		headers: Record<string, string>;
		body: unknown;
	};
	error?: string;
	timestamp: number;
}

interface CollapsibleState {
	[key: string]: boolean;
}

interface TestSuite {
	id: string;
	name: string;
	description: string;
	tests: ApiTest[];
}

// Styled components
const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`;

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const Subtitle = styled.p`
	color: #6b7280;
	font-size: 1.1rem;
`;

const TestSuiteGrid = styled.div`
	display: grid;
	gap: 2rem;
	margin-bottom: 2rem;
`;

const TestSuiteCard = styled.div`
	background: white;
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
`;

const TestSuiteHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const TestSuiteTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const TestSuiteDescription = styled.p`
	color: #6b7280;
	margin-bottom: 1.5rem;
`;

const TestList = styled.div`
	display: grid;
	gap: 1rem;
`;

const TestItem = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 1rem;
`;

const TestHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const TestName = styled.div`
	font-weight: 600;
	color: #1f2937;
`;

const TestMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.875rem;
	color: #6b7280;
`;

const MethodBadge = styled.span<{ method: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
	background: ${props => {
		switch (props.method) {
			case 'GET': return '#dbeafe';
			case 'POST': return '#dcfce7';
			case 'PUT': return '#fef3c7';
			case 'DELETE': return '#fee2e2';
			default: return '#f3f4f6';
		}
	}};
	color: ${props => {
		switch (props.method) {
			case 'GET': return '#1e40af';
			case 'POST': return '#166534';
			case 'PUT': return '#92400e';
			case 'DELETE': return '#991b1b';
			default: return '#374151';
		}
	}};
`;

const CategoryBadge = styled.span<{ category: string }>`
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${props => {
		switch (props.category) {
			case 'mfa': return '#fce7f3';
			case 'unified': return '#e0e7ff';
			case 'common': return '#f0fdf4';
			default: return '#f3f4f6';
		}
	}};
	color: ${props => {
		switch (props.category) {
			case 'mfa': return '#9f1239';
			case 'unified': return '#3730a3';
			case 'common': return '#166534';
			default: return '#374151';
		}
	}};
`;

const TestDescription = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin-bottom: 0.5rem;
`;

const TestEndpoint = styled.code`
	background: #f3f4f6;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	color: #1f2937;
	font-family: 'Monaco', 'Menlo', monospace;
`;

const ActionButtons = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const RunButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: none;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	${props => {
		if (props.disabled) {
			return `
				background: #f3f4f6;
				color: #9ca3af;
				cursor: not-allowed;
			`;
		}
		return `
			background: #3b82f6;
			color: white;
			&:hover {
				background: #2563eb;
			}
		`;
	}}
`;

const StatusIcon = styled.div<{ status: string }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	border-radius: 50%;
	font-size: 0.75rem;

	${props => {
		switch (props.status) {
			case 'success':
				return `
					background: #dcfce7;
					color: #166534;
				`;
			case 'error':
				return `
					background: #fee2e2;
					color: #991b1b;
				`;
			case 'running':
				return `
					background: #fef3c7;
					color: #92400e;
				`;
			default:
				return `
					background: #f3f4f6;
					color: #6b7280;
				`;
		}
	}}
`;

const ResultsSection = styled.div`
	margin-top: 2rem;
`;

const ResultsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const ResultsList = styled.div`
	display: grid;
	gap: 1rem;
`;

const ResultItem = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 1rem;
`;

const ResultHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const ResultDetails = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const ResultSection = styled.div`
	background: #f9fafb;
	padding: 1rem;
	border-radius: 6px;
`;

const ResultSectionTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const JsonCode = styled.pre<{ $collapsible?: boolean }>`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 6px;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	overflow-x: auto;
	max-height: ${props => props.$collapsible ? '200px' : 'none'};
	overflow-y: ${props => props.$collapsible ? 'auto' : 'visible'};
`;

const CollapsibleSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	margin-bottom: 1rem;
`;

const CollapsibleHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1rem;
	background: #f9fafb;
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	user-select: none;

	&:hover {
		background: #f3f4f6;
	}
`;

const CollapsibleTitle = styled.div`
	font-weight: 600;
	color: #1f2937;
	font-size: 0.875rem;
`;

const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
	display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const ApiCallSection = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 6px;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const ApiCallTitle = styled.h4`
	color: #166534;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
`;

const ApiCallDetails = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.75rem;
	color: #166534;
	background: #f0fdf4;
	padding: 0.5rem;
	border-radius: 4px;
	word-break: break-all;
`;

const HeaderCode = styled.pre`
	background: #f3f4f6;
	color: #1f2937;
	padding: 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	overflow-x: auto;
`;

// Test definitions - organized by OAuth and MFA sections
const testSuites: TestSuite[] = [
	{
		id: 'oauth-flows',
		name: 'OAuth & OIDC Flows',
		description: 'Test OAuth 2.0 and OpenID Connect authorization flows and token operations',
		tests: [
			{
				id: 'oauth-discovery',
				name: 'OIDC Discovery Document',
				description: 'Fetch the OpenID Connect discovery document to get all OAuth/OIDC endpoints',
				category: 'unified',
				method: 'GET',
				endpoint: 'https://auth.pingone.com/{{environmentId}}/.well-known/openid_configuration',
				expectedStatus: 200
			},
			{
				id: 'oauth-jwks',
				name: 'JSON Web Key Set (JWKS)',
				description: 'Retrieve the public keys used to verify JWT tokens from the authorization server',
				category: 'unified',
				method: 'GET',
				endpoint: 'https://auth.pingone.com/{{environmentId}}/.well-known/jwks.json',
				expectedStatus: 200
			},
			{
				id: 'oauth-userinfo',
				name: 'User Information Endpoint',
				description: 'Get the authenticated user\'s profile information using the access token',
				category: 'unified',
				method: 'GET',
				endpoint: 'https://auth.pingone.com/{{environmentId}}/as/userinfo',
				headers: {
					'Authorization': 'Bearer {{accessToken}}'
				},
				expectedStatus: 200
			},
			{
				id: 'oauth-introspect',
				name: 'Token Introspection',
				description: 'Validate and get metadata about an access token using client credentials',
				category: 'unified',
				method: 'POST',
				endpoint: 'https://auth.pingone.com/{{environmentId}}/as/introspect',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': 'Basic {{basicAuth}}'
				},
				body: {
					token: '{{accessToken}}',
					token_type_hint: 'access_token'
				},
				expectedStatus: 200
			},
			{
				id: 'oauth-revoke',
				name: 'Token Revocation',
				description: 'Revoke an access token to invalidate it for future use',
				category: 'unified',
				method: 'POST',
				endpoint: 'https://auth.pingone.com/{{environmentId}}/as/revoke',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': 'Basic {{basicAuth}}'
				},
				body: {
					token: '{{accessToken}}',
					token_type_hint: 'access_token'
				},
				expectedStatus: 200
			}
		]
	},
	{
		id: 'mfa-device-management',
		name: 'MFA Device Management',
		description: 'Test Multi-Factor Authentication device registration, activation, and management APIs',
		tests: [
			{
				id: 'mfa-lookup-user',
				name: 'User Lookup by Username',
				description: 'Find a PingOne user by their username to get their user ID for device operations',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/lookup-user',
				body: {
					environmentId: '{{environmentId}}',
					username: '{{username}}',
					workerToken: '{{workerToken}}'
				},
				expectedStatus: 200
			},
			{
				id: 'mfa-register-sms',
				name: 'Register SMS Device',
				description: 'Register a new SMS device for MFA that can receive one-time passcodes via text message',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/register-device',
				body: {
					environmentId: '{{environmentId}}',
					userId: '{{userId}}',
					type: 'SMS',
					phone: '+1234567890',
					workerToken: '{{workerToken}}'
				},
				expectedStatus: 201,
				dependencies: ['mfa-lookup-user']
			},
			{
				id: 'mfa-register-email',
				name: 'Register Email Device',
				description: 'Register a new email device for MFA that can receive one-time passcodes via email',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/register-device',
				body: {
					environmentId: '{{environmentId}}',
					userId: '{{userId}}',
					type: 'EMAIL',
					email: 'test@example.com',
					workerToken: '{{workerToken}}'
				},
				expectedStatus: 201,
				dependencies: ['mfa-lookup-user']
			},
			{
				id: 'mfa-register-totp',
				name: 'Register TOTP Device',
				description: 'Register a new Time-based One-Time Password (TOTP) device for authenticator app MFA',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/register-device',
				body: {
					environmentId: '{{environmentId}}',
					userId: '{{userId}}',
					type: 'TOTP',
					policy: { id: '{{policyId}}' },
					workerToken: '{{workerToken}}'
				},
				expectedStatus: 201,
				dependencies: ['mfa-lookup-user']
			},
			{
				id: 'mfa-list-users',
				name: 'List Users with Pagination',
				description: 'Search and list users in the environment with pagination support',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/list-users',
				body: {
					environmentId: '{{environmentId}}',
					workerToken: '{{workerToken}}',
					limit: 10,
					offset: 0
				},
				expectedStatus: 200
			},
			{
				id: 'mfa-allow-bypass',
				name: 'Allow MFA Bypass',
				description: 'Grant MFA bypass permission to a user so they can skip MFA during login',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/allow-bypass',
				body: {
					environmentId: '{{environmentId}}',
					userId: '{{userId}}',
					workerToken: '{{workerToken}}'
				},
				expectedStatus: 200,
				dependencies: ['mfa-lookup-user']
			},
			{
				id: 'mfa-check-bypass',
				name: 'Check MFA Bypass Status',
				description: 'Check if a user has MFA bypass permissions and their bypass status',
				category: 'mfa',
				method: 'POST',
				endpoint: '/api/pingone/mfa/check-bypass',
				body: {
					environmentId: '{{environmentId}}',
					userId: '{{userId}}',
					workerToken: '{{workerToken}}'
				},
				expectedStatus: 200,
				dependencies: ['mfa-lookup-user']
			}
		]
	},
	{
		id: 'pingone-platform-apis',
		name: 'PingOne Platform APIs',
		description: 'Test core PingOne platform management APIs for environments, applications, and users',
		tests: [
			{
				id: 'platform-environments',
				name: 'List All Environments',
				description: 'Get a list of all PingOne environments accessible with the worker token',
				category: 'common',
				method: 'GET',
				endpoint: 'https://api.pingone.com/v1/environments',
				headers: {
					'Authorization': 'Bearer {{workerToken}}'
				},
				expectedStatus: 200
			},
			{
				id: 'platform-applications',
				name: 'List Applications in Environment',
				description: 'Get all applications configured in a specific PingOne environment',
				category: 'common',
				method: 'GET',
				endpoint: 'https://api.pingone.com/v1/environments/{{environmentId}}/applications',
				headers: {
					'Authorization': 'Bearer {{workerToken}}'
				},
				expectedStatus: 200
			},
			{
				id: 'platform-users',
				name: 'List Users in Environment',
				description: 'Get all users in a specific PingOne environment with pagination',
				category: 'common',
				method: 'GET',
				endpoint: 'https://api.pingone.com/v1/environments/{{environmentId}}/users',
				headers: {
					'Authorization': 'Bearer {{workerToken}}'
				},
				expectedStatus: 200
			},
			{
				id: 'platform-activities',
				name: 'List Audit Activities',
				description: 'Get audit trail and activity logs for monitoring and compliance',
				category: 'common',
				method: 'GET',
				endpoint: 'https://api.pingone.com/v1/environments/{{environmentId}}/activities',
				headers: {
					'Authorization': 'Bearer {{workerToken}}'
				},
				expectedStatus: 200
			}
		]
	}
];

const ProductionApiTestPageV8U: React.FC = () => {
	const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
	const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
	const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
	const [collapsedSections, setCollapsedSections] = useState<CollapsibleState>({});

	// Toggle collapsible sections
	const toggleSection = useCallback((sectionId: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}));
	}, []);

	// Replace template variables in test definitions
	const processTest = useCallback((test: ApiTest, context: Record<string, string>): ApiTest => {
		const replaceTemplate = (str: string): string => {
			return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
				return context[key] || match;
			});
		};

		const processObject = (obj: Record<string, unknown>): Record<string, unknown> => {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'string') {
					result[key] = replaceTemplate(value);
				} else if (typeof value === 'object' && value !== null) {
					result[key] = processObject(value as Record<string, unknown>);
				} else {
					result[key] = value;
				}
			}
			return result;
		};

		return {
			...test,
			endpoint: replaceTemplate(test.endpoint),
			headers: test.headers ? processObject(test.headers) as Record<string, string> : undefined,
			body: test.body ? processObject(test.body) : undefined
		};
	}, []);

	// Execute a single test
	const executeTest = useCallback(async (test: ApiTest, context: Record<string, string>) => {
		const processedTest = processTest(test, context);
		const testId = processedTest.id;

		setRunningTests(prev => new Set(prev).add(testId));
		setTestResults(prev => ({
			...prev,
			[testId]: {
				testId,
				status: 'running',
				timestamp: Date.now()
			}
		}));

		try {
			const startTime = Date.now();
			const fetchOptions: RequestInit = {
				method: processedTest.method
			};

			if (processedTest.headers) {
				fetchOptions.headers = processedTest.headers;
			}

			if (processedTest.body) {
				fetchOptions.body = JSON.stringify(processedTest.body);
			}

			// Capture the full API call details
			const apiCallDetails = {
				method: processedTest.method,
				url: processedTest.endpoint,
				headers: processedTest.headers || {},
				body: processedTest.body
			};

			const response = await fetch(processedTest.endpoint, fetchOptions);

			const duration = Date.now() - startTime;
			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			let responseBody: unknown;
			try {
				responseBody = await response.json();
			} catch {
				responseBody = await response.text();
			}

			const result: TestResult = {
				testId,
				status: response.ok ? 'success' : 'error',
				duration,
				request: apiCallDetails,
				response: {
					status: response.status,
					statusText: response.statusText,
					headers: responseHeaders,
					body: responseBody
				},
				timestamp: Date.now()
			};

			if (!response.ok) {
				result.error = `HTTP ${response.status}: ${response.statusText}`;
			}

			setTestResults(prev => ({ ...prev, [testId]: result }));
		} catch (error) {
			const result: TestResult = {
				testId,
				status: 'error',
				error: error instanceof Error ? error.message : String(error),
				timestamp: Date.now()
			};

			setTestResults(prev => ({ ...prev, [testId]: result }));
		} finally {
			setRunningTests(prev => {
				const newSet = new Set(prev);
				newSet.delete(testId);
				return newSet;
			});
		}
	}, [processTest]);

	// Execute all tests in a suite
	const executeSuite = useCallback(async (suite: TestSuite, context: Record<string, string>) => {
		for (const test of suite.tests) {
			await executeTest(test, context);
			// Small delay between tests
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}, [executeTest]);

	// Execute all tests
	const executeAllTests = useCallback(async (context: Record<string, string>) => {
		for (const suite of testSuites) {
			await executeSuite(suite, context);
		}
	}, [executeSuite]);

	// Clear results
	const clearResults = useCallback(() => {
		setTestResults({});
		setExpandedResults(new Set());
	}, []);

	// Toggle result expansion
	const toggleResultExpansion = useCallback((testId: string) => {
		setExpandedResults(prev => {
			const newSet = new Set(prev);
			if (newSet.has(testId)) {
				newSet.delete(testId);
			} else {
				newSet.add(testId);
			}
			return newSet;
		});
	}, []);

	return (
		<PageContainer>
			<Header>
				<Title>
					<FiCode />
					Production API Tests
				</Title>
				<Subtitle>
					Comprehensive API testing for MFA and Unified flows with real PingOne APIs
				</Subtitle>
			</Header>

			<TestSuiteGrid>
				{testSuites.map(suite => (
					<TestSuiteCard key={suite.id}>
						<TestSuiteHeader>
							<TestSuiteTitle>
								{suite.id === 'mfa-device-management' && <FiShield />}
								{suite.id === 'unified-oauth-flows' && <FiCode />}
								{suite.id === 'pingone-platform-apis' && <FiDatabase />}
								{suite.name}
							</TestSuiteTitle>
						</TestSuiteHeader>
						<TestSuiteDescription>
							{suite.description}
						</TestSuiteDescription>
						<TestList>
							{suite.tests.map(test => {
								const result = testResults[test.id];
								const isRunning = runningTests.has(test.id);
								const isExpanded = expandedResults.has(test.id);

								return (
									<TestItem key={test.id}>
										<TestHeader>
											<TestName>{test.name}</TestName>
											<ActionButtons>
												<RunButton
													onClick={() => executeTest(test, {
														environmentId: 'your-env-id',
														username: 'test.user',
														workerToken: 'your-worker-token',
														accessToken: 'your-access-token',
														basicAuth: 'base64(client-id:client-secret)',
														policyId: 'your-policy-id',
														userId: (result?.response?.body as any)?.id || 'user-id'
													})}
													disabled={isRunning}
												>
													{isRunning ? (
														<>
															<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
															Running
														</>
													) : (
														<>
															<FiPlay />
															Run Test
														</>
													)}
												</RunButton>
												{result && (
													<StatusIcon status={result.status}>
														{result.status === 'success' && <FiCheck />}
														{result.status === 'error' && <FiX />}
														{result.status === 'running' && <FiRefreshCw />}
													</StatusIcon>
												)}
											</ActionButtons>
										</TestHeader>
										<TestDescription>{test.description}</TestDescription>
										<TestMeta>
											<MethodBadge method={test.method}>{test.method}</MethodBadge>
											<CategoryBadge category={test.category}>{test.category}</CategoryBadge>
											<TestEndpoint>{test.endpoint}</TestEndpoint>
											{test.expectedStatus && (
												<span>Expected: {test.expectedStatus}</span>
											)}
											{result?.duration && (
												<span>{result.duration}ms</span>
											)}
										</TestMeta>
										{result && isExpanded && (
											<ResultDetails>
												{result.response && (
													<>
														<ResultSection>
															<ResultSectionTitle>Response Headers</ResultSectionTitle>
															<HeaderCode>
																{JSON.stringify(result.response.headers, null, 2)}
															</HeaderCode>
														</ResultSection>
														<ResultSection>
															<ResultSectionTitle>Response Body</ResultSectionTitle>
															<JsonCode>
																{JSON.stringify(result.response.body, null, 2)}
															</JsonCode>
														</ResultSection>
													</>
												)}
												{result.error && (
													<ResultSection>
														<ResultSectionTitle>Error</ResultSectionTitle>
														<JsonCode style={{ background: '#fee2e2', color: '#991b1b' }}>
															{result.error}
														</JsonCode>
													</ResultSection>
												)}
											</ResultDetails>
										)}
										{result && (
											<RunButton
												onClick={() => toggleResultExpansion(test.id)}
												style={{ marginTop: '0.5rem' }}
											>
												{isExpanded ? 'Hide Details' : 'Show Details'}
											</RunButton>
										)}
									</TestItem>
								);
							})}
						</TestList>
						<ActionButtons style={{ marginTop: '1rem' }}>
							<RunButton
								onClick={() => executeSuite(suite, {
									environmentId: 'your-env-id',
									username: 'test.user',
									workerToken: 'your-worker-token',
									accessToken: 'your-access-token',
									basicAuth: 'base64(client-id:client-secret)',
									policyId: 'your-policy-id'
								})}
							>
								<FiPlay />
								Run Suite
							</RunButton>
						</ActionButtons>
					</TestSuiteCard>
				))}
			</TestSuiteGrid>

			<ResultsSection>
				<ResultsHeader>
					<h2>Test Results Summary</h2>
					<ActionButtons>
						<RunButton onClick={() => executeAllTests({
							environmentId: 'your-env-id',
							username: 'test.user',
							workerToken: 'your-worker-token',
							accessToken: 'your-access-token',
							basicAuth: 'base64(client-id:client-secret)',
							policyId: 'your-policy-id'
						})}>
							<FiPlay />
							Run All Tests
						</RunButton>
						<RunButton onClick={clearResults}>
							<FiRefreshCw />
							Clear Results
						</RunButton>
					</ActionButtons>
				</ResultsHeader>
				<ResultsList>
					{Object.values(testResults).map(result => (
						<ResultItem key={result.testId}>
							<ResultHeader>
								<TestName>{result.testId}</TestName>
								<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
									<StatusIcon status={result.status}>
										{result.status === 'success' && <FiCheck />}
										{result.status === 'error' && <FiX />}
										{result.status === 'running' && <FiRefreshCw />}
									</StatusIcon>
									<span>{result.status}</span>
									{result.duration && <span>{result.duration}ms</span>}
								</div>
							</ResultHeader>
							
							{result.request && (
								<ApiCallSection>
									<ApiCallTitle>🔍 Full API Call Details</ApiCallTitle>
									<CollapsibleSection>
										<CollapsibleHeader onClick={() => toggleSection(`request-${result.testId}`)}>
											<CollapsibleTitle>Request Details</CollapsibleTitle>
											<span>{collapsedSections[`request-${result.testId}`] ? '▼' : '▶'}</span>
										</CollapsibleHeader>
										<CollapsibleContent $isOpen={collapsedSections[`request-${result.testId}`] || false}>
											<ResultDetails>
												<ResultSection>
													<ResultSectionTitle>Method & URL</ResultSectionTitle>
													<ApiCallDetails>
														{result.request.method} {result.request.url}
													</ApiCallDetails>
												</ResultSection>
												{Object.keys(result.request.headers).length > 0 && (
													<ResultSection>
														<ResultSectionTitle>Request Headers</ResultSectionTitle>
														<HeaderCode>
															{JSON.stringify(result.request.headers, null, 2)}
														</HeaderCode>
													</ResultSection>
												)}
												{result.request.body && (
													<ResultSection>
														<ResultSectionTitle>Request Body</ResultSectionTitle>
														<JsonCode $collapsible>
															{JSON.stringify(result.request.body, null, 2)}
														</JsonCode>
													</ResultSection>
												)}
											</ResultDetails>
										</CollapsibleContent>
									</CollapsibleSection>
								</ApiCallSection>
							)}

							{result.response && (
								<ApiCallSection>
									<CollapsibleSection>
										<CollapsibleHeader onClick={() => toggleSection(`response-${result.testId}`)}>
											<CollapsibleTitle>Response Details</CollapsibleTitle>
											<span>{collapsedSections[`response-${result.testId}`] ? '▼' : '▶'}</span>
										</CollapsibleHeader>
										<CollapsibleContent $isOpen={collapsedSections[`response-${result.testId}`] || false}>
											<ResultDetails>
												<ResultSection>
													<ResultSectionTitle>Status</ResultSectionTitle>
													<ApiCallDetails>
														{result.response.status} {result.response.statusText}
													</ApiCallDetails>
												</ResultSection>
												{Object.keys(result.response.headers).length > 0 && (
													<ResultSection>
														<ResultSectionTitle>Response Headers</ResultSectionTitle>
														<HeaderCode>
															{JSON.stringify(result.response.headers, null, 2)}
														</HeaderCode>
													</ResultSection>
												)}
												<ResultSection>
													<ResultSectionTitle>Response Body</ResultSectionTitle>
													<JsonCode $collapsible>
														{JSON.stringify(result.response.body, null, 2)}
													</JsonCode>
												</ResultSection>
											</ResultDetails>
										</CollapsibleContent>
									</CollapsibleSection>
								</ApiCallSection>
							)}

							{result.error && (
								<ResultSection>
									<ResultSectionTitle>Error</ResultSectionTitle>
									<JsonCode style={{ background: '#fee2e2', color: '#991b1b' }}>
										{result.error}
									</JsonCode>
								</ResultSection>
							)}
						</ResultItem>
					))}
				</ResultsList>
			</ResultsSection>
		</PageContainer>
	);
};

export default ProductionApiTestPageV8U;
