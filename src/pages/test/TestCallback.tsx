// src/pages/test/TestCallback.tsx
// Test callback page for test flows - no deprecation warnings
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

/**
 * Utility function to mask tokens for security
 * Shows first 8 characters, masks middle, shows last 4 characters
 */
const maskToken = (token: string): string => {
	if (!token || token.length <= 12) {
		return '••••••••';
	}
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

const Container = styled.div`
	max-width: 800px;
	margin: 2rem auto;
	padding: 2rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Card = styled.div<{ status: 'success' | 'error' | 'info' }>`
	padding: 2rem;
	border-radius: 0.5rem;
	border-left: 4px solid
		${(props) =>
			props.status === 'success' ? '#10b981' : props.status === 'error' ? '#ef4444' : '#3b82f6'};
	background: ${(props) =>
		props.status === 'success' ? '#f0fdf4' : props.status === 'error' ? '#fef2f2' : '#f8fafc'};
`;

const Title = styled.h1`
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 1rem;
	font-size: 1.5rem;
`;

const Message = styled.p`
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 1.5rem;
	font-size: 1.1rem;
`;

const TokenSection = styled.div`
	margin-top: 1.5rem;
`;

const TokenLabel = styled.div`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

const TokenValue = styled.div`
	font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
	background: V9_COLORS.TEXT.WHITE;
	padding: 0.75rem;
	border-radius: 0.25rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	word-break: break-all;
	margin-bottom: 1rem;
`;

const Button = styled.button`
	padding: 0.75rem 1.5rem;
	background: V9_COLORS.PRIMARY.BLUE;
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: V9_COLORS.PRIMARY.BLUE_DARK;
	}
`;

const TestCallback: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [status, setStatus] = useState<'success' | 'error' | 'info'>('info');
	const [message, setMessage] = useState('Processing callback...');
	const [tokens, setTokens] = useState<Record<string, string>>({});

	useEffect(() => {
		// Parse URL for tokens (fragment for implicit, query for code)
		const hash = location.hash.slice(1); // Remove #
		const search = location.search.slice(1); // Remove ?

		const params = new URLSearchParams(hash || search);
		const parsedTokens: Record<string, string> = {};

		// Extract all parameters
		for (const [key, value] of params.entries()) {
			parsedTokens[key] = value;
		}

		if (parsedTokens.access_token || parsedTokens.id_token || parsedTokens.code) {
			setStatus('success');
			setMessage('Test callback received successfully!');
			setTokens(parsedTokens);
		} else if (parsedTokens.error) {
			setStatus('error');
			setMessage(`Error: ${parsedTokens.error_description || parsedTokens.error}`);
			setTokens(parsedTokens);
		} else {
			setStatus('info');
			setMessage('No tokens or authorization code received in callback.');
		}
	}, [location]);

	const handleCopyToken = (value: string) => {
		navigator.clipboard.writeText(value);
	};

	const handleGoBack = () => {
		navigate(-1);
	};

	return (
		<Container>
			<Card status={status}>
				<Title>
					{status === 'success' && '✓ Test Callback Received'}
					{status === 'error' && '✗ Callback Error'}
					{status === 'info' && 'ℹ Test Callback'}
				</Title>
				<Message>{message}</Message>

				{Object.keys(tokens).length > 0 && (
					<TokenSection>
						{tokens.code && (
							<div>
								<TokenLabel>Authorization Code</TokenLabel>
								<TokenValue>{tokens.code}</TokenValue>
								<Button onClick={() => handleCopyToken(tokens.code)}>Copy Code</Button>
							</div>
						)}

						{tokens.access_token && (
							<div>
								<TokenLabel>Access Token</TokenLabel>
								<TokenValue>{maskToken(tokens.access_token)}</TokenValue>
								<Button onClick={() => handleCopyToken(tokens.access_token)}>Copy Token</Button>
							</div>
						)}

						{tokens.id_token && (
							<div>
								<TokenLabel>ID Token</TokenLabel>
								<TokenValue>{maskToken(tokens.id_token)}</TokenValue>
								<Button onClick={() => handleCopyToken(tokens.id_token)}>Copy Token</Button>
							</div>
						)}

						{tokens.refresh_token && (
							<div>
								<TokenLabel>Refresh Token</TokenLabel>
								<TokenValue>{maskToken(tokens.refresh_token)}</TokenValue>
								<Button onClick={() => handleCopyToken(tokens.refresh_token)}>Copy Token</Button>
							</div>
						)}

						{tokens.state && (
							<div>
								<TokenLabel>State</TokenLabel>
								<TokenValue>{tokens.state}</TokenValue>
							</div>
						)}

						{tokens.token_type && (
							<div>
								<TokenLabel>Token Type</TokenLabel>
								<TokenValue>{tokens.token_type}</TokenValue>
							</div>
						)}

						{tokens.expires_in && (
							<div>
								<TokenLabel>Expires In</TokenLabel>
								<TokenValue>{tokens.expires_in} seconds</TokenValue>
							</div>
						)}

						{tokens.scope && (
							<div>
								<TokenLabel>Scope</TokenLabel>
								<TokenValue>{tokens.scope}</TokenValue>
							</div>
						)}
					</TokenSection>
				)}

				<div style={{ marginTop: '1.5rem' }}>
					<Button onClick={handleGoBack}>← Back to Test Page</Button>
				</div>
			</Card>
		</Container>
	);
};

export default TestCallback;
