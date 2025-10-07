// src/components/ComprehensiveDiscoveryInput.tsx
/**
 * Comprehensive OIDC Discovery Input Component
 * 
 * Supports multiple input types:
 * - PingOne Environment ID
 * - PingOne issuer URL
 * - Google OAuth
 * - Auth0 domain
 * - Microsoft tenant
 * - Generic OIDC provider URLs
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FiSearch, FiCheck, FiX, FiInfo, FiExternalLink } from 'react-icons/fi';
import { comprehensiveDiscoveryService, DiscoveryResult } from '../services/comprehensiveDiscoveryService';

interface ComprehensiveDiscoveryInputProps {
	onDiscoveryComplete: (result: DiscoveryResult) => void;
	initialInput?: string;
	placeholder?: string;
	showProviderInfo?: boolean;
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.5rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
`;

const InputGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const Input = styled.input`
	flex: 1;
	padding: 0.75rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const SearchButton = styled.button<{ $loading?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: background-color 0.2s;
	opacity: ${props => props.$loading ? 0.7 : 1};

	&:hover:not(:disabled) {
		background-color: #2563eb;
	}

	&:disabled {
		cursor: not-allowed;
	}
`;

const ProviderInfo = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-top: 1rem;
`;

const ProviderCard = styled.div`
	padding: 0.75rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	font-size: 0.75rem;
`;

const ProviderName = styled.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const ProviderDescription = styled.div`
	color: #6b7280;
	line-height: 1.4;
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;

	${({ $type }) => {
		switch ($type) {
			case 'success':
				return `
					background-color: #f0fdf4;
					color: #166534;
					border: 1px solid #bbf7d0;
				`;
			case 'error':
				return `
					background-color: #fef2f2;
					color: #991b1b;
					border: 1px solid #fecaca;
				`;
			case 'info':
				return `
					background-color: #eff6ff;
					color: #1e40af;
					border: 1px solid #bfdbfe;
				`;
		}
	}}
`;

const Examples = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 1rem;
`;

const ExampleTitle = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #374151;
`;

const ExampleList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const ExampleItem = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	padding: 0.25rem 0.5rem;
	background: #f3f4f6;
	border-radius: 0.25rem;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: #e5e7eb;
	}
`;

const ComprehensiveDiscoveryInput: React.FC<ComprehensiveDiscoveryInputProps> = ({
	onDiscoveryComplete,
	initialInput = '',
	placeholder = 'Enter Environment ID, issuer URL, or provider...',
	showProviderInfo = true
}) => {
	const [input, setInput] = useState(initialInput);
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

	const handleDiscover = useCallback(async () => {
		if (!input.trim()) {
			setStatus({ type: 'error', message: 'Please enter an Environment ID, issuer URL, or provider name' });
			return;
		}

		setIsLoading(true);
		setStatus(null);

		try {
			const result = await comprehensiveDiscoveryService.discover({
				input: input.trim(),
				timeout: 10000
			});

			if (result.success) {
				setStatus({ 
					type: 'success', 
					message: `Successfully discovered ${result.provider} endpoints` 
				});
				onDiscoveryComplete(result);
			} else {
				setStatus({ 
					type: 'error', 
					message: result.error || 'Discovery failed' 
				});
			}
		} catch (error) {
			setStatus({ 
				type: 'error', 
				message: error instanceof Error ? error.message : 'Discovery failed' 
			});
		} finally {
			setIsLoading(false);
		}
	}, [input, onDiscoveryComplete]);

	const handleExampleClick = useCallback((example: string) => {
		setInput(example);
	}, []);

	const supportedProviders = comprehensiveDiscoveryService.getSupportedProviders();

	return (
		<Container>
			<InputGroup>
				<Input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					disabled={isLoading}
					onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleDiscover()}
				/>
				<SearchButton 
					onClick={handleDiscover} 
					disabled={isLoading || !input.trim()}
					$loading={isLoading}
				>
					{isLoading ? <FiSearch className="animate-spin" /> : <FiSearch />}
					{isLoading ? 'Discovering...' : 'Discover'}
				</SearchButton>
			</InputGroup>

			{status && (
				<StatusMessage $type={status.type}>
					{status.type === 'success' ? <FiCheck /> : 
					 status.type === 'error' ? <FiX /> : <FiInfo />}
					{status.message}
				</StatusMessage>
			)}

			{showProviderInfo && (
				<>
					<ProviderInfo>
						{supportedProviders.map((provider) => (
							<ProviderCard key={provider.type}>
								<ProviderName>{provider.name}</ProviderName>
								<ProviderDescription>{provider.description}</ProviderDescription>
							</ProviderCard>
						))}
					</ProviderInfo>

					<Examples>
						<ExampleTitle>Examples:</ExampleTitle>
						<ExampleList>
							<ExampleItem onClick={() => handleExampleClick('12345678-1234-1234-1234-123456789012')}>
								PingOne Environment ID: 12345678-1234-1234-1234-123456789012
							</ExampleItem>
							<ExampleItem onClick={() => handleExampleClick('https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as')}>
								PingOne Issuer: https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as
							</ExampleItem>
							<ExampleItem onClick={() => handleExampleClick('https://accounts.google.com')}>
								Google OAuth: https://accounts.google.com
							</ExampleItem>
							<ExampleItem onClick={() => handleExampleClick('https://your-domain.auth0.com')}>
								Auth0 Domain: https://your-domain.auth0.com
							</ExampleItem>
							<ExampleItem onClick={() => handleExampleClick('https://login.microsoftonline.com/your-tenant-id/v2.0')}>
								Microsoft: https://login.microsoftonline.com/your-tenant-id/v2.0
							</ExampleItem>
						</ExampleList>
					</Examples>
				</>
			)}
		</Container>
	);
};

export default ComprehensiveDiscoveryInput;
