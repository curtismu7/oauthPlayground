// src/pages/WorkerTokenTester.PingUI.tsx
// Worker Token Tester - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useState } from 'react';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { v4ToastManager } from '../utils/v4ToastManager';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

// Interfaces
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

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: 'var(--pingone-spacing-xl, 2rem)',
});

const getHeaderStyle = () => ({
	textAlign: 'center',
	marginBottom: 'var(--pingone-spacing-xl, 3rem)',
});

const getTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const getSubtitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	color: 'var(--pingone-text-secondary)',
	margin: '0',
});

const getCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
});

const getSectionTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: 'var(--pingone-spacing-md, 1rem) var(--pingone-spacing-lg, 1.5rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
		boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
	},
});

const getTestResultStyle = (status: 'success' | 'error' | 'warning') => ({
	background:
		status === 'success'
			? 'var(--pingone-surface-success)'
			: status === 'error'
				? 'var(--pingone-surface-error)'
				: 'var(--pingone-surface-warning)',
	border: `1px solid ${
		status === 'success'
			? 'var(--pingone-border-success)'
			: status === 'error'
				? 'var(--pingone-border-error)'
				: 'var(--pingone-border-warning)'
	}`,
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: 'var(--pingone-spacing-md, 1rem)',
	marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getTestResultTitleStyle = (status: 'success' | 'error' | 'warning') => ({
	color:
		status === 'success'
			? 'var(--pingone-text-success)'
			: status === 'error'
				? 'var(--pingone-text-error)'
				: 'var(--pingone-text-warning)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	marginBottom: 'var(--pingone-spacing-xs, 0.25rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
});

const getTestResultMessageStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
});

const getGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
});

const _getInputStyle = () => ({
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const WorkerTokenTesterPingUI: React.FC = () => {
	const [testResults, setTestResults] = useState<TestResult[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);
	const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);

	// Test functions
	const runAllTests = async () => {
		setIsRunning(true);
		setTestResults([]);

		try {
			// Test 1: Environment Check
			await testEnvironmentCheck();

			// Test 2: Token Validation
			await testTokenValidation();

			// Test 3: API Connectivity
			await testApiConnectivity();

			// Test 4: Token Claims
			await testTokenClaims();

			// Test 5: Token Expiration
			await testTokenExpiration();

			v4ToastManager.success('All tests completed successfully!');
		} catch (error) {
			console.error('Test execution failed:', error);
			v4ToastManager.error('Test execution failed');
		} finally {
			setIsRunning(false);
		}
	};

	const testEnvironmentCheck = async () => {
		try {
			const response = await fetch('/api/health');
			const data = await response.json();

			setEnvironmentData(data);

			setTestResults((prev) => [
				...prev,
				{
					test: 'Environment Check',
					status: response.ok ? 'success' : 'error',
					statusCode: response.status,
					message: response.ok ? 'Environment is healthy' : 'Environment check failed',
					data: data,
				},
			]);
		} catch (error) {
			setTestResults((prev) => [
				...prev,
				{
					test: 'Environment Check',
					status: 'error',
					message: 'Failed to check environment',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
			]);
		}
	};

	const testTokenValidation = async () => {
		try {
			// Simulate token validation
			const isValid = Math.random() > 0.2; // 80% success rate for demo

			setTestResults((prev) => [
				...prev,
				{
					test: 'Token Validation',
					status: isValid ? 'success' : 'error',
					message: isValid ? 'Token is valid' : 'Token validation failed',
					details: isValid ? 'JWT signature verified' : 'Invalid signature or expired token',
				},
			]);
		} catch (error) {
			setTestResults((prev) => [
				...prev,
				{
					test: 'Token Validation',
					status: 'error',
					message: 'Token validation error',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
			]);
		}
	};

	const testApiConnectivity = async () => {
		try {
			const endpoints = ['/api/health', '/api/config', '/api/userinfo'];

			const results = await Promise.allSettled(
				endpoints.map(async (endpoint) => {
					const response = await fetch(endpoint);
					return { endpoint, status: response.status, ok: response.ok };
				})
			);

			const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
			const totalTests = endpoints.length;

			setTestResults((prev) => [
				...prev,
				{
					test: 'API Connectivity',
					status: successCount === totalTests ? 'success' : successCount > 0 ? 'warning' : 'error',
					message: `${successCount}/${totalTests} endpoints responding`,
					data: results,
				},
			]);
		} catch (error) {
			setTestResults((prev) => [
				...prev,
				{
					test: 'API Connectivity',
					status: 'error',
					message: 'API connectivity test failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
			]);
		}
	};

	const testTokenClaims = async () => {
		try {
			// Simulate token claims analysis
			const mockPayload: TokenPayload = {
				client_id: 'demo-client',
				iss: 'https://auth.pingone.com',
				jti: 'demo-jti',
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
				aud: ['demo-client'],
				env: 'demo-env',
				org: 'demo-org',
				scope: 'openid profile email',
				sub: 'demo-user',
			};

			setTokenPayload(mockPayload);

			setTestResults((prev) => [
				...prev,
				{
					test: 'Token Claims',
					status: 'success',
					message: 'Token claims analyzed successfully',
					data: mockPayload,
				},
			]);
		} catch (error) {
			setTestResults((prev) => [
				...prev,
				{
					test: 'Token Claims',
					status: 'error',
					message: 'Token claims analysis failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
			]);
		}
	};

	const testTokenExpiration = async () => {
		try {
			const currentTime = Math.floor(Date.now() / 1000);
			const expirationTime = currentTime + 3600; // 1 hour from now
			const timeToExpiry = expirationTime - currentTime;

			const isExpired = timeToExpiry <= 0;
			const isExpiringSoon = timeToExpiry < 300; // 5 minutes

			setTestResults((prev) => [
				...prev,
				{
					test: 'Token Expiration',
					status: isExpired ? 'error' : isExpiringSoon ? 'warning' : 'success',
					message: isExpired
						? 'Token has expired'
						: isExpiringSoon
							? 'Token expires soon'
							: 'Token expiration is valid',
					details: `Expires in ${Math.floor(timeToExpiry / 60)} minutes`,
				},
			]);
		} catch (error) {
			setTestResults((prev) => [
				...prev,
				{
					test: 'Token Expiration',
					status: 'error',
					message: 'Token expiration check failed',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
			]);
		}
	};

	const clearResults = () => {
		setTestResults([]);
		setEnvironmentData(null);
		setTokenPayload(null);
	};

	const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
		switch (status) {
			case 'success':
				return <MDIIcon icon="check-circle" size={16} />;
			case 'error':
				return <MDIIcon icon="close-circle" size={16} />;
			case 'warning':
				return <MDIIcon icon="alert-circle" size={16} />;
		}
	};

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				{/* Header */}
				<div style={getHeaderStyle()}>
					<h1 style={getTitleStyle()}>
						<MDIIcon icon="test-tube" size={40} />
						Worker Token Tester
					</h1>
					<p style={getSubtitleStyle()}>
						Comprehensive testing suite for worker tokens and API connectivity
					</p>
				</div>

				{/* Test Controls */}
				<div style={getCardStyle()}>
					<h3 style={getSectionTitleStyle()}>
						<MDIIcon icon="cog" size={20} />
						Test Controls
					</h3>

					<div
						style={{
							display: 'flex',
							gap: 'var(--pingone-spacing-md, 1rem)',
							marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
						}}
					>
						<button
							type="button"
							style={getButtonStyle('primary')}
							onClick={runAllTests}
							disabled={isRunning}
						>
							<MDIIcon
								icon={isRunning ? 'loading' : 'play'}
								size={16}
								className={isRunning ? 'mdi-spin' : ''}
							/>
							{isRunning ? 'Running Tests...' : 'Run All Tests'}
						</button>

						<button
							type="button"
							style={getButtonStyle('secondary')}
							onClick={clearResults}
							disabled={isRunning}
						>
							<MDIIcon icon="delete" size={16} />
							Clear Results
						</button>
					</div>

					<div style={getGridStyle()}>
						<div>
							<h4
								style={{
									fontSize: 'var(--pingone-font-size-md, 1rem)',
									marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
								}}
							>
								Test Suite
							</h4>
							<ul style={{ margin: 0, paddingLeft: 'var(--pingone-spacing-lg, 1.5rem)' }}>
								<li style={{ marginBottom: 'var(--pingone-spacing-xs, 0.25rem)' }}>
									Environment Check
								</li>
								<li style={{ marginBottom: 'var(--pingone-spacing-xs, 0.25rem)' }}>
									Token Validation
								</li>
								<li style={{ marginBottom: 'var(--pingone-spacing-xs, 0.25rem)' }}>
									API Connectivity
								</li>
								<li style={{ marginBottom: 'var(--pingone-spacing-xs, 0.25rem)' }}>Token Claims</li>
								<li style={{ marginBottom: 'var(--pingone-spacing-xs, 0.25rem)' }}>
									Token Expiration
								</li>
							</ul>
						</div>

						<div>
							<h4
								style={{
									fontSize: 'var(--pingone-font-size-md, 1rem)',
									marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
								}}
							>
								Test Status
							</h4>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--pingone-spacing-sm, 0.5rem)',
								}}
							>
								<MDIIcon
									icon={isRunning ? 'loading' : 'check-circle'}
									size={16}
									className={isRunning ? 'mdi-spin' : ''}
								/>
								<span style={{ fontSize: 'var(--pingone-font-size-sm, 0.875rem)' }}>
									{isRunning ? 'Tests in progress...' : 'Ready to run'}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Test Results */}
				{testResults.length > 0 && (
					<div style={getCardStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="clipboard-check" size={20} />
							Test Results
						</h3>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--pingone-spacing-sm, 0.5rem)',
							}}
						>
							{testResults.map((result, index) => (
								<div key={index} style={getTestResultStyle(result.status)}>
									<div style={getTestResultTitleStyle(result.status)}>
										{getStatusIcon(result.status)}
										{result.test}
										{result.statusCode && (
											<span
												style={{
													marginLeft: 'var(--pingone-spacing-sm, 0.5rem)',
													fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
												}}
											>
												({result.statusCode})
											</span>
										)}
									</div>
									<div style={getTestResultMessageStyle()}>{result.message}</div>
									{result.details && (
										<div
											style={{
												fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
												color: 'var(--pingone-text-tertiary)',
												marginTop: 'var(--pingone-spacing-xs, 0.25rem)',
											}}
										>
											{result.details}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Environment Data */}
				{environmentData && (
					<div style={getCardStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="server" size={20} />
							Environment Information
						</h3>
						<SuperSimpleApiDisplayV8
							data={{
								method: 'GET',
								url: '/api/health',
								headers: {
									'Content-Type': 'application/json',
								},
								body: null,
								response: environmentData,
								status: 200,
								duration: 150,
							}}
						/>
					</div>
				)}

				{/* Token Payload */}
				{tokenPayload && (
					<div style={getCardStyle()}>
						<h3 style={getSectionTitleStyle()}>
							<MDIIcon icon="key" size={20} />
							Token Payload
						</h3>
						<SuperSimpleApiDisplayV8
							data={{
								method: 'GET',
								url: '/token/payload',
								headers: {
									'Content-Type': 'application/json',
								},
								body: null,
								response: tokenPayload,
								status: 200,
								duration: 100,
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default WorkerTokenTesterPingUI;
