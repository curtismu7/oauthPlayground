// src/components/DiscoveryBasedConfiguration.tsx
/**
 * Discovery-Based Configuration Component
 *
 * This component provides a modern, discovery-first approach to configuring
 * OAuth/OIDC flows. Users only need to provide their issuer URL and client
 * credentials, and all endpoints are automatically discovered.
 */

import React, { useCallback, useEffect, useId, useState } from 'react';
import { FiAlertCircle, FiCopy, FiRefreshCw, FiSave } from 'react-icons/fi';
import styled from 'styled-components';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';
import type { DiscoveryResult } from '../services/oidcDiscoveryService';
import type { PermanentCredentials } from '../utils/credentialManager';
import { credentialManager } from '../utils/credentialManager';
import EnvironmentIdInput from './EnvironmentIdInput';

interface DiscoveryBasedConfigurationProps {
	onConfigurationComplete?: (credentials: PermanentCredentials) => void;
	className?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1rem;
  color: #64748b;
  line-height: 1.5;
`;

const ConfigurationForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ClientCredentialsSection = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        `;
			case 'success':
				return `
          background: #10b981;
          color: white;
          &:hover:not(:disabled) {
            background: #059669;
          }
        `;
			default:
				return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) {
            background: #f9fafb;
          }
        `;
		}
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusContainer = styled.div<{ type: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 6px;
  background: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			case 'info':
				return '#eff6ff';
			default:
				return '#f8fafc';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.type) {
			case 'success':
				return '#bbf7d0';
			case 'error':
				return '#fecaca';
			case 'info':
				return '#bfdbfe';
			default:
				return '#e2e8f0';
		}
	}};
  color: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#166534';
			case 'error':
				return '#dc2626';
			case 'info':
				return '#1d4ed8';
			default:
				return '#475569';
		}
	}};
`;

const EndpointsPreview = styled.div`
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.75rem;
`;

const EndpointItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const EndpointLabel = styled.span`
  font-weight: 500;
  color: #374151;
  min-width: 120px;
`;

const EndpointUrl = styled.span`
  color: #6b7280;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
`;

const CopyButton = styled.button`
  padding: 0.25rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const DiscoveryBasedConfiguration: React.FC<DiscoveryBasedConfigurationProps> = ({
	onConfigurationComplete,
	className,
}) => {
	const clientIdId = useId();
	const clientSecretId = useId();
	const redirectUriId = useId();
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [redirectUri, setRedirectUri] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Load existing credentials on mount
	useEffect(() => {
		const existingCredentials = credentialManager.loadPermanentCredentials();
		if (existingCredentials) {
			setClientId(existingCredentials.clientId || '');
			setClientSecret(existingCredentials.clientSecret || '');
			setRedirectUri(existingCredentials.redirectUri || '');
		}
	}, []);

	const handleDiscoveryComplete = useCallback(
		(result: DiscoveryResult) => {
			setDiscoveryResult(result);
			setError(null);

			if (result.success && result.document) {
				showGlobalSuccess('OIDC endpoints discovered successfully!');

				// Auto-populate redirect URI if not set
				if (!redirectUri && result.document.authorization_endpoint) {
					// Extract environment ID and create callback URL
					const envId = credentialManager.loadPermanentCredentials()?.environmentId;
					if (envId) {
						setRedirectUri(`http://localhost:3000/callback`);
					}
				}
			}
		},
		[redirectUri]
	);

	const handleSaveConfiguration = useCallback(async () => {
		if (!discoveryResult?.success || !discoveryResult.document) {
			setError('Please complete OIDC discovery first');
			return;
		}

		if (!clientId.trim()) {
			setError('Client ID is required');
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			const result = await credentialManager.discoverAndUpdateCredentials(
				discoveryResult.document.issuer,
				clientId.trim(),
				clientSecret.trim() || undefined,
				redirectUri.trim() || undefined
			);

			if (result.success && result.credentials) {
				showGlobalSuccess('Configuration saved successfully!');
				onConfigurationComplete?.(result.credentials);
			} else {
				setError(result.error || 'Failed to save configuration');
				showGlobalError(result.error || 'Failed to save configuration');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
			setError(errorMessage);
			showGlobalError(errorMessage);
		} finally {
			setIsSaving(false);
		}
	}, [discoveryResult, clientId, clientSecret, redirectUri, onConfigurationComplete]);

	const handleCopyEndpoint = useCallback((url: string) => {
		navigator.clipboard.writeText(url);
		showGlobalSuccess('Endpoint URL copied to clipboard');
	}, []);

	const renderEndpointsPreview = () => {
		if (!discoveryResult?.success || !discoveryResult.document) {
			return null;
		}

		const doc = discoveryResult.document;
		const endpoints = [
			{ label: 'Issuer', url: doc.issuer },
			{ label: 'Authorization', url: doc.authorization_endpoint },
			{ label: 'Token', url: doc.token_endpoint },
			...(doc.userinfo_endpoint ? [{ label: 'UserInfo', url: doc.userinfo_endpoint }] : []),
			...(doc.end_session_endpoint
				? [{ label: 'End Session', url: doc.end_session_endpoint }]
				: []),
			...(doc.device_authorization_endpoint
				? [{ label: 'Device Auth', url: doc.device_authorization_endpoint }]
				: []),
			...(doc.pushed_authorization_request_endpoint
				? [{ label: 'PAR', url: doc.pushed_authorization_request_endpoint }]
				: []),
		];

		return (
			<EndpointsPreview>
				{endpoints.map((endpoint, index) => (
					<EndpointItem key={index}>
						<EndpointLabel>{endpoint.label}:</EndpointLabel>
						<EndpointUrl>{endpoint.url}</EndpointUrl>
						<CopyButton onClick={() => handleCopyEndpoint(endpoint.url)} title="Copy URL">
							<FiCopy size={12} />
						</CopyButton>
					</EndpointItem>
				))}
			</EndpointsPreview>
		);
	};

	const canSave = discoveryResult?.success && clientId.trim() && !isSaving;

	return (
		<Container className={className}>
			<Header>
				<Title>OIDC Discovery Configuration</Title>
				<Subtitle>
					Configure your OAuth/OIDC flows using automatic endpoint discovery. Just provide your
					issuer URL and client credentials - we'll handle the rest!
				</Subtitle>
			</Header>

			<ConfigurationForm>
				<EnvironmentIdInput
					onDiscoveryComplete={handleDiscoveryComplete}
					showSuggestions={true}
					autoDiscover={false}
				/>

				{discoveryResult?.success && (
					<>
						<ClientCredentialsSection>
							<SectionTitle>Client Credentials</SectionTitle>

							<InputGroup>
								<Label htmlFor={clientIdId}>Client ID *</Label>
								<Input
									id={clientIdId}
									type="text"
									value={clientId}
									onChange={(e) => setClientId(e.target.value)}
									placeholder="your-client-id"
								/>
							</InputGroup>

							<InputGroup>
								<Label htmlFor={clientSecretId}>Client Secret</Label>
								<Input
									id={clientSecretId}
									type="password"
									value={clientSecret}
									onChange={(e) => setClientSecret(e.target.value)}
									placeholder="your-client-secret (optional for public clients)"
								/>
							</InputGroup>

							<InputGroup>
								<Label htmlFor={redirectUriId}>Redirect URI</Label>
								<Input
									id={redirectUriId}
									type="url"
									value={redirectUri}
									onChange={(e) => setRedirectUri(e.target.value)}
									placeholder="http://localhost:3000/callback"
								/>
							</InputGroup>
						</ClientCredentialsSection>

						{renderEndpointsPreview()}

						{error && (
							<StatusContainer type="error">
								<FiAlertCircle />
								<span>{error}</span>
							</StatusContainer>
						)}

						<ButtonGroup>
							<Button variant="success" onClick={handleSaveConfiguration} disabled={!canSave}>
								{isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
								{isSaving ? 'Saving...' : 'Save Configuration'}
							</Button>
						</ButtonGroup>
					</>
				)}
			</ConfigurationForm>
		</Container>
	);
};

export default DiscoveryBasedConfiguration;
