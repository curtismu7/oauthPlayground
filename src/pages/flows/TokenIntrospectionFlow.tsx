import type React from 'react';
import { useCallback } from 'react';
import styled from 'styled-components';
import ConfigurationButton from '../../components/ConfigurationButton';
import { type FlowStep, StepByStepFlow } from '../../components/StepByStepFlow';
import TokenIntrospectionStep from '../../components/TokenIntrospectionStep';
import { useAuth } from '../../contexts/NewAuthContext';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useTokenIntrospectionFlowController } from '../../hooks/useTokenIntrospectionFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';
import { V9ModernMessagingService } from '../../services/v9/V9ModernMessagingService';
import { logger } from '../../utils/logger';
import { isTokenExpired } from '../../utils/oauth';

const messagingService = V9ModernMessagingService.getInstance();

const FlowContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const ErrorMessage = styled.div`
	background: V9_COLORS.BG.ERROR;
	border: 1px solid V9_COLORS.BG.ERROR_BORDER;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: V9_COLORS.PRIMARY.RED_DARK;
`;

const TokenIntrospectionFlow: React.FC = () => {
	const { tokens, config } = useAuth();
	const { introspectToken, isLoading, result, error, clearResult } =
		useTokenIntrospectionFlowController();

	usePageScroll();

	// Check if tokens exist
	const hasTokens = tokens?.access_token && !isTokenExpired(tokens.access_token);

	const steps: FlowStep[] = [
		{
			id: 'step-1',
			title: 'Configure Token Introspection',
			description: 'Set up your OAuth client and token for introspection.',
			code: `// Token Introspection Configuration
const introspectionConfig = {
  clientId: '${config?.clientId || 'YOUR_CLIENT_ID'}',
  clientSecret: '${config?.clientSecret ? '••••••••' : 'YOUR_CLIENT_SECRET'}',
  token: '${tokens?.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'YOUR_ACCESS_TOKEN'}',
  introspectionEndpoint: '${config?.pingone?.introspectionEndpoint || 'https://auth.pingone.com/{envId}/as/introspection'}'
};

console.log('Token introspection configured:', introspectionConfig);`,
			execute: () => {
				logger.info('TokenIntrospectionFlow', 'Configuring token introspection');
				if (!config?.clientId || !config?.clientSecret) {
					messagingService.showBanner({
						type: 'error',
						title: 'Configuration Required',
						message: 'Please configure client ID and client secret in Configuration page.',
						dismissible: true,
					});
					return;
				}
				if (!hasTokens) {
					messagingService.showBanner({
						type: 'error',
						title: 'Token Required',
						message: 'Please obtain an access token through any OAuth flow first.',
						dismissible: true,
					});
					return;
				}
			},
		},
		{
			id: 'step-2',
			title: 'Execute Token Introspection',
			description: 'Send introspection request to validate and analyze the token.',
			code: `// Token Introspection Request
const response = await fetch('${config?.pingone?.introspectionEndpoint || 'https://auth.pingone.com/{envId}/as/introspection'}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + btoa('${config?.clientId || 'YOUR_CLIENT_ID'}:${config?.clientSecret ? '••••••••' : 'YOUR_CLIENT_SECRET'}')
  },
  body: new URLSearchParams({
    token: '${tokens?.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'YOUR_ACCESS_TOKEN'}'
  })
});

const introspectionResult = await response.json();
console.log('Token introspection result:', introspectionResult);`,
			execute: async () => {
				if (!config?.clientId || !config?.clientSecret) {
					messagingService.showBanner({
						type: 'error',
						title: 'Configuration Required',
						message: 'Please configure client ID and client secret.',
						dismissible: true,
					});
					return;
				}

				if (!hasTokens) {
					messagingService.showBanner({
						type: 'error',
						title: 'Token Required',
						message: 'Please obtain an access token first.',
						dismissible: true,
					});
					return;
				}

				try {
					await introspectToken({
						environmentId: config.pingone?.environmentId || '',
						clientId: config.clientId,
						clientSecret: config.clientSecret,
						token: tokens.access_token!,
						introspectionEndpoint: config.pingone?.introspectionEndpoint,
					});

					messagingService.showFooterMessage({
						type: 'success',
						message: 'Token introspection completed successfully',
						duration: 3000,
					});
				} catch (err) {
					logger.error('TokenIntrospectionFlow', 'Token introspection failed', err);
				}
			},
		},
		{
			id: 'step-3',
			title: 'Analyze Results',
			description: 'Review the token introspection response and validate token claims.',
			code: `// Analyze Token Introspection Results
if (introspectionResult.active) {
  console.log('✅ Token is valid and active');
  console.log('Scope:', introspectionResult.scope);
  console.log('Client ID:', introspectionResult.client_id);
  console.log('Token Type:', introspectionResult.token_type);
  console.log('Expires At:', new Date(introspectionResult.exp * 1000).toISOString());
} else {
  console.log('❌ Token is invalid or expired');
}

// Check specific claims
const hasRequiredScopes = introspectionResult.scope?.includes('openid');
console.log('Has required scopes:', hasRequiredScopes);`,
			execute: () => {
				if (!result) {
					messagingService.showBanner({
						type: 'error',
						title: 'No Results',
						message: 'Please execute token introspection first.',
						dismissible: true,
					});
					return;
				}

				logger.info('TokenIntrospectionFlow', 'Analyzing introspection results', result);
				messagingService.showFooterMessage({
					type: 'info',
					message: 'Token analysis completed - check results below',
					duration: 3000,
				});
			},
		},
	];

	const handleClearResults = useCallback(() => {
		clearResult();
		messagingService.showFooterMessage({
			type: 'info',
			message: 'Results cleared',
			duration: 2000,
		});
	}, [clearResult]);

	return (
		<FlowContainer>
			<FlowHeader
				flowType="token-introspection"
				title="Token Introspection Flow"
				description="Validate and analyze OAuth 2.0 tokens using the token introspection endpoint"
				configurationButton={<ConfigurationButton flowType="token-introspection" />}
			/>

			{!config && (
				<ErrorMessage>
					⚠️
					<strong>Configuration Required:</strong> Please configure your PingOne settings in the
					Configuration page before running this demo.
					<br />
					<button
						onClick={() => {
							window.location.reload();
						}}
						style={{
							marginTop: '10px',
							padding: '8px 16px',
							backgroundColor: V9_COLORS.PRIMARY.BLUE,
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
						type="button"
					>
						Refresh Page
					</button>
				</ErrorMessage>
			)}

			{!hasTokens && config && (
				<ErrorMessage>
					⚠️
					<strong>Token Required:</strong> Authentication mode is enabled. Complete an OAuth login
					to obtain a valid access token before calling Token Introspection.
					<br />
					<br />
					<strong>To get tokens:</strong>
					<ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
						<li>Go to any OAuth flow page (e.g., Authorization Code Flow)</li>
						<li>Complete the OAuth flow to get tokens</li>
						<li>Return here to use the Token Introspection</li>
					</ul>
				</ErrorMessage>
			)}

			{error && (
				<ErrorMessage>
					⚠️
					<strong>Error:</strong> {error}
					<button
						onClick={handleClearResults}
						style={{
							marginLeft: '10px',
							padding: '4px 8px',
							backgroundColor: V9_COLORS.PRIMARY.RED,
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px',
						}}
						type="button"
					>
						Clear
					</button>
				</ErrorMessage>
			)}

			<StepByStepFlow
				steps={steps}
				flowType="token-introspection"
				disabled={!config || !hasTokens}
				title="Token Introspection Flow"
				configurationButton={<ConfigurationButton flowType="token-introspection" />}
			/>

			{result && (
				<TokenIntrospectionStep
					introspectionResult={result}
					onClear={handleClearResults}
					isLoading={isLoading}
				/>
			)}
		</FlowContainer>
	);
};

export default TokenIntrospectionFlow;
