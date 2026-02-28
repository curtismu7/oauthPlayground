/**
 * @file PingOneLogoutFlow.tsx
 * @module pages/flows
 * @description PingOne Logout Flow - Demonstrates how to implement logout with PingOne SSO
 * @version 1.0.0
 *
 * This flow demonstrates:
 * - How to build PingOne logout URLs
 * - RP-initiated logout flow
 * - Post-logout redirect handling
 * - Session termination
 * - Code examples for implementation
 */

import type React from 'react';
import { useCallback, useState } from 'react';
import { FiCopy, FiExternalLink, FiInfo, FiLogOut } from '@icons';
import styled from 'styled-components';
import { ColoredUrlDisplay } from '../../components/ColoredUrlDisplay';
import FlowCredentials from '../../components/FlowCredentials';
import JSONHighlighter from '../../components/JSONHighlighter';
import { StepByStepFlow } from '../../components/StepByStepFlow';
import { pingOneLogoutService } from '../../services/pingOneLogoutService';
import { logger } from '../../utils/logger';
import { buildPingOneLogoutUrl, generateState } from '../../utils/pingone-url-builders';

const FlowContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const FlowTitle = styled.h1`
	color: #1f2937;
	font-size: 2rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
`;

const FlowDescription = styled.p`
	color: #6b7280;
	font-size: 1.125rem;
	margin-bottom: 2rem;
	line-height: 1.6;
`;

const FormContainer = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #374151;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	min-height: 120px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{
	$variant: 'primary' | 'secondary' | 'success' | 'danger';
}>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case 'secondary':
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
			case 'danger':
				return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
        `;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ResponseContainer = styled.div`
	background: #f0fdf4;
	border: 1px solid #86efac;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const ErrorContainer = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #991b1b;
`;

const InfoContainer = styled.div`
	background: #dbeafe;
	border: 1px solid #93c5fd;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #1e40af;
`;

const WarningContainer = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #92400e;
`;

const LogoutUrlContainer = styled.div`
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const LogoutUrlTitle = styled.h4`
	margin: 0 0 1rem 0;
	color: #1f2937;
	font-size: 1.125rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

interface PingOneLogoutFlowProps {
	credentials?: {
		clientId: string;
		clientSecret: string;
		environmentId: string;
	};
}

const PingOneLogoutFlow: React.FC<PingOneLogoutFlowProps> = ({ credentials }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [formData, setFormData] = useState({
		environmentId: credentials?.environmentId || '',
		clientId: credentials?.clientId || '',
		idToken: '',
		postLogoutRedirectUri: 'https://localhost:3000/logout-callback',
		state: generateState(),
	});
	const [logoutUrl, setLogoutUrl] = useState<string | null>(null);
	const [response, setResponse] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);

	const steps = [
		{
			id: 'step-1',
			title: 'Configure Logout Settings',
			description: 'Set up your PingOne environment and logout parameters.',
			code: `// PingOne Logout Configuration
const logoutConfig = {
  environmentId: '${formData.environmentId}',
  clientId: '${formData.clientId}',
  idToken: '${formData.idToken ? `${formData.idToken.substring(0, 50)}...` : 'YOUR_ID_TOKEN'}',
  postLogoutRedirectUri: '${formData.postLogoutRedirectUri}',
  state: '${formData.state}'
};

console.log('Logout configuration:', logoutConfig);`,
			execute: async () => {
				logger.info('PingOneLogoutFlow', 'Configuring logout settings');
			},
		},
		{
			id: 'step-2',
			title: 'Build Logout URL',
			description: 'Construct the PingOne logout URL with required parameters.',
			code: `// Build PingOne Logout URL
import { buildPingOneLogoutUrl } from '@/utils/pingone-url-builders';

const logoutUrl = buildPingOneLogoutUrl(environmentId, {
  idTokenHint: idToken,
  postLogoutRedirectUri: postLogoutRedirectUri,
  state: state
});

console.log('Logout URL:', logoutUrl);
// Example: https://auth.pingone.com/{envId}/as/logout?id_token_hint=...&post_logout_redirect_uri=...&state=...`,
			execute: async () => {
				logger.info('PingOneLogoutFlow', 'Building logout URL');
				setDemoStatus('loading');

				try {
					if (!formData.environmentId) {
						throw new Error('Environment ID is required');
					}

					if (!formData.idToken) {
						throw new Error('ID Token is required for logout');
					}

					const url = buildPingOneLogoutUrl(formData.environmentId, {
						idTokenHint: formData.idToken,
						postLogoutRedirectUri: formData.postLogoutRedirectUri,
						state: formData.state,
					});

					setLogoutUrl(url);
					setResponse({
						success: true,
						logoutUrl: url,
						message: 'Logout URL generated successfully',
					});
					setDemoStatus('success');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					setDemoStatus('error');
					throw error;
				}
			},
		},
		{
			id: 'step-3',
			title: 'Initiate Logout',
			description: 'Redirect user to PingOne logout endpoint to terminate session.',
			code: `// Initiate Logout
// Option 1: Redirect in same tab
window.location.href = logoutUrl;

// Option 2: Open in new tab (recommended for better UX)
window.open(logoutUrl, '_blank');

// Option 3: Using pingOneLogoutService
import { pingOneLogoutService } from '@/services/pingOneLogoutService';

const result = await pingOneLogoutService.logout({
  environmentId: environmentId,
  idToken: idToken,
  postLogoutRedirectUri: postLogoutRedirectUri,
  autoOpen: true,
  openIn: 'new-tab',
  clearClientStorage: true
});

if (result.success) {
  console.log('Logout initiated:', result.message);
} else {
  console.error('Logout failed:', result.error);
}`,
			execute: async () => {
				logger.info('PingOneLogoutFlow', 'Initiating logout');
				setDemoStatus('loading');

				try {
					if (!logoutUrl) {
						throw new Error('Logout URL not generated. Please complete step 2 first.');
					}

					const result = await pingOneLogoutService.logout({
						environmentId: formData.environmentId,
						idToken: formData.idToken,
						postLogoutRedirectUri: formData.postLogoutRedirectUri,
						autoOpen: true,
						openIn: 'new-tab',
						clearClientStorage: false, // Don't clear storage in demo
					});

					if (result.success) {
						setResponse({
							success: true,
							message: result.message,
							url: result.url,
							opened: result.opened,
						});
						setDemoStatus('success');
					} else {
						throw new Error(result.error || 'Logout failed');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setError(errorMessage);
					setDemoStatus('error');
					throw error;
				}
			},
		},
		{
			id: 'step-4',
			title: 'Handle Post-Logout Redirect',
			description: 'Process the redirect after logout and clear local session data.',
			code: `// Handle Post-Logout Redirect
// This code runs on your post-logout redirect URI page

// 1. Verify state parameter (CSRF protection)
const urlParams = new URLSearchParams(window.location.search);
const returnedState = urlParams.get('state');
const storedState = sessionStorage.getItem('logout_state');

if (returnedState !== storedState) {
  console.error('Logout state mismatch - possible CSRF attack');
  return;
}

// 2. Clear local session data
localStorage.removeItem('access_token');
localStorage.removeItem('id_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user_info');
sessionStorage.removeItem('logout_state');

// 3. Clear any other application-specific storage
// ... your cleanup code ...

// 4. Redirect to login or show confirmation
console.log('User logged out successfully');
window.location.href = '/login'; // or show logout confirmation`,
			execute: async () => {
				logger.info('PingOneLogoutFlow', 'Processing post-logout redirect');
				setResponse((prev) => ({
					...prev,
					postLogoutHandled: true,
					message: 'Post-logout redirect handler ready',
				}));
			},
		},
		{
			id: 'step-5',
			title: 'Complete Logout Flow',
			description: 'Verify logout completion and session termination.',
			code: `// Verify Logout Completion
// After logout, verify that:
// 1. PingOne session is terminated
// 2. Local storage is cleared
// 3. User is redirected appropriately

// Check if user is still authenticated
const idToken = localStorage.getItem('id_token');
if (idToken) {
  console.warn('ID token still exists - logout may not have completed');
} else {
  console.log('✅ Logout successful - all tokens cleared');
}

// Optional: Verify PingOne session termination
// Try to access a protected resource to confirm session is ended`,
			execute: async () => {
				logger.info('PingOneLogoutFlow', 'Completing logout flow');
				setResponse((prev) => ({
					...prev,
					completed: true,
					message: 'Logout flow completed successfully',
				}));
			},
		},
	];

	const handleStepChange = useCallback((step: number) => {
		setCurrentStep(step);
		setDemoStatus('idle');
		setResponse(null);
		setError(null);
	}, []);

	const handleStepResult = useCallback((step: number, result: unknown) => {
		logger.info('PingOneLogoutFlow', `Step ${step + 1} completed`, result);
	}, []);

	const handleBuildLogoutUrl = async () => {
		try {
			setDemoStatus('loading');
			setError(null);

			if (!formData.environmentId) {
				throw new Error('Environment ID is required');
			}

			if (!formData.idToken) {
				throw new Error('ID Token is required');
			}

			const url = buildPingOneLogoutUrl(formData.environmentId, {
				idTokenHint: formData.idToken,
				postLogoutRedirectUri: formData.postLogoutRedirectUri,
				state: formData.state,
			});

			setLogoutUrl(url);
			setResponse({
				success: true,
				logoutUrl: url,
				message: 'Logout URL generated successfully',
			});
			setDemoStatus('success');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setError(errorMessage);
			setDemoStatus('error');
		}
	};

	const handleInitiateLogout = async () => {
		try {
			setDemoStatus('loading');
			setError(null);

			if (!logoutUrl) {
				throw new Error('Please generate logout URL first');
			}

			const result = await pingOneLogoutService.logout({
				environmentId: formData.environmentId,
				idToken: formData.idToken,
				postLogoutRedirectUri: formData.postLogoutRedirectUri,
				autoOpen: true,
				openIn: 'new-tab',
				clearClientStorage: false,
			});

			if (result.success) {
				setResponse({
					success: true,
					message: result.message,
					url: result.url,
					opened: result.opened,
				});
				setDemoStatus('success');
			} else {
				throw new Error(result.error || 'Logout failed');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setError(errorMessage);
			setDemoStatus('error');
		}
	};

	const handleCopyUrl = () => {
		if (logoutUrl) {
			navigator.clipboard.writeText(logoutUrl);
			logger.info('PingOneLogoutFlow', 'Logout URL copied to clipboard');
		}
	};

	return (
		<FlowContainer>
			<FlowTitle>🚪 PingOne Logout Flow</FlowTitle>
			<FlowDescription>
				This flow demonstrates how to implement logout with PingOne SSO. Learn how to build logout
				URLs, initiate session termination, and handle post-logout redirects.
			</FlowDescription>

			<InfoContainer>
				<h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiInfo /> About PingOne Logout
				</h4>
				<p>
					PingOne supports RP-initiated logout (Relying Party initiated logout) where your
					application can terminate the user's PingOne session. The logout flow involves:
				</p>
				<ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
					<li>Building a logout URL with the ID token and post-logout redirect URI</li>
					<li>Redirecting the user to PingOne's logout endpoint</li>
					<li>PingOne terminates the session and redirects back to your app</li>
					<li>Your app clears local session data and shows logout confirmation</li>
				</ol>
			</InfoContainer>

			<WarningContainer>
				<h4 style={{ marginTop: 0 }}>⚠️ Important Requirements</h4>
				<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
					<li>
						<strong>ID Token Required:</strong> You must have an ID token from the authentication
						session to initiate logout
					</li>
					<li>
						<strong>Post-Logout Redirect URI:</strong> Must be registered in your PingOne
						application's "Sign Off URLs" configuration
					</li>
					<li>
						<strong>State Parameter:</strong> Recommended for CSRF protection (optional but
						recommended)
					</li>
				</ul>
			</WarningContainer>

			<FlowCredentials
				flowType="pingone-logout"
				onCredentialsChange={(newCredentials) => {
					setFormData((prev) => ({
						...prev,
						clientId: newCredentials.clientId || prev.clientId,
						clientSecret: newCredentials.clientSecret || prev.clientSecret,
						environmentId: newCredentials.environmentId || prev.environmentId,
					}));
				}}
			/>

			<StepByStepFlow
				steps={steps}
				currentStep={currentStep}
				onStepChange={handleStepChange}
				onStepResult={handleStepResult}
				onStart={() => setDemoStatus('loading')}
				onReset={() => {
					setCurrentStep(0);
					setDemoStatus('idle');
					setResponse(null);
					setError(null);
					setLogoutUrl(null);
					setFormData((prev) => ({ ...prev, state: generateState() }));
				}}
				status={demoStatus}
				disabled={demoStatus === 'loading'}
				title="PingOne Logout Flow Steps"
			/>

			{logoutUrl && (
				<LogoutUrlContainer>
					<LogoutUrlTitle>
						<FiLogOut /> Generated Logout URL
					</LogoutUrlTitle>
					<ColoredUrlDisplay
						url={logoutUrl}
						label="Logout URL"
						showCopyButton={true}
						showInfoButton={false}
						showOpenButton={true}
						height="150px"
					/>
					<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
						<Button $variant="primary" onClick={handleInitiateLogout}>
							<FiExternalLink /> Initiate Logout
						</Button>
						<Button $variant="secondary" onClick={handleCopyUrl}>
							<FiCopy /> Copy URL
						</Button>
					</div>
				</LogoutUrlContainer>
			)}

			<FormContainer>
				<h3>Manual Logout Configuration</h3>
				<p>You can also manually configure and test the logout flow:</p>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '1rem',
						marginBottom: '1rem',
					}}
				>
					<FormGroup>
						<Label>Environment ID</Label>
						<Input
							type="text"
							value={formData.environmentId}
							onChange={(e) => setFormData((prev) => ({ ...prev, environmentId: e.target.value }))}
							placeholder="12345678-1234-1234-1234-123456789abc"
						/>
					</FormGroup>

					<FormGroup>
						<Label>Client ID</Label>
						<Input
							type="text"
							value={formData.clientId}
							onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
							placeholder="Enter your client ID"
						/>
					</FormGroup>
				</div>

				<FormGroup>
					<Label>ID Token (Required)</Label>
					<TextArea
						value={formData.idToken}
						onChange={(e) => setFormData((prev) => ({ ...prev, idToken: e.target.value }))}
						placeholder="Paste your ID token here (from authentication response)"
					/>
					<small style={{ color: '#6b7280', display: 'block', marginTop: '0.5rem' }}>
						💡 Get this from your authentication flow's token response
					</small>
				</FormGroup>

				<FormGroup>
					<Label>Post-Logout Redirect URI</Label>
					<Input
						type="text"
						value={formData.postLogoutRedirectUri}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, postLogoutRedirectUri: e.target.value }))
						}
						placeholder="https://localhost:3000/logout-callback"
					/>
					<small style={{ color: '#6b7280', display: 'block', marginTop: '0.5rem' }}>
						⚠️ Must be registered in PingOne application's "Sign Off URLs"
					</small>
				</FormGroup>

				<FormGroup>
					<Label>State (CSRF Protection)</Label>
					<Input
						type="text"
						value={formData.state}
						onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
						placeholder="Random state value"
					/>
					<small style={{ color: '#6b7280', display: 'block', marginTop: '0.5rem' }}>
						💡 Store this in sessionStorage and verify on redirect
					</small>
				</FormGroup>

				<Button $variant="primary" onClick={handleBuildLogoutUrl}>
					<FiLogOut /> Generate Logout URL
				</Button>
			</FormContainer>

			{response && (
				<ResponseContainer>
					<h4>Response:</h4>
					<CodeBlock>
						<JSONHighlighter data={response} />
					</CodeBlock>
				</ResponseContainer>
			)}

			{error && (
				<ErrorContainer>
					<h4>Error:</h4>
					<p>{error}</p>
				</ErrorContainer>
			)}
		</FlowContainer>
	);
};

export default PingOneLogoutFlow;
