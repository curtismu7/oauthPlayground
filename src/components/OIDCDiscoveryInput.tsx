// src/components/OIDCDiscoveryInput.tsx
/**
 * OIDC Discovery Input Component
 *
 * Provides a user-friendly interface for entering issuer URLs and automatically
 * discovering OIDC endpoints. Includes validation, suggestions, and real-time
 * feedback on discovery status.
 */

import { FiLoader } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { type DiscoveryResult, oidcDiscoveryService } from '../services/oidcDiscoveryService';

import { logger } from '../utils/logger';

interface OIDCDiscoveryInputProps {
	onDiscoveryComplete?: (result: DiscoveryResult) => void;
	onCredentialsGenerated?: (credentials: any) => void;
	initialIssuerUrl?: string;
	className?: string;
	disabled?: boolean;
	showSuggestions?: boolean;
	autoDiscover?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const Description = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  line-height: 1.5;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input.withConfig({
	shouldForwardProp: (prop) => !['hasError', 'hasSuccess'].includes(prop),
})<{ hasError?: boolean; hasSuccess?: boolean }>`
  flex: 1;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid ${(props) =>
		props.hasError ? '#ef4444' : props.hasSuccess ? '#10b981' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: V9_COLORS.TEXT.GRAY_DARK;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${(props) =>
			props.hasError ? '#ef4444' : props.hasSuccess ? '#10b981' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${(props) =>
			props.hasError
				? 'rgba(239, 68, 68, 0.1)'
				: props.hasSuccess
					? 'rgba(16, 185, 129, 0.1)'
					: 'rgba(59, 130, 246, 0.1)'};
  }

  &:disabled {
    background: #f9fafb;
    color: V9_COLORS.TEXT.GRAY_LIGHT;
    cursor: not-allowed;
  }
`;

const InputIcon = styled.div.withConfig({
	shouldForwardProp: (prop) => !['hasError', 'hasSuccess', 'isLoading'].includes(prop),
})<{ hasError?: boolean; hasSuccess?: boolean; isLoading?: boolean }>`
  position: absolute;
  left: 0.75rem;
  color: ${(props) => {
		if (props.isLoading) return '#3b82f6';
		if (props.hasError) return '#ef4444';
		if (props.hasSuccess) return '#10b981';
		return '#6b7280';
	}};
  z-index: 1;
`;

const DiscoverButton = styled.button.withConfig({
	shouldForwardProp: (prop) => !['isLoading'].includes(prop),
})<{ isLoading?: boolean }>`
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
  background: ${(props) => (props.isLoading ? '#f3f4f6' : '#3b82f6')};
  color: ${(props) => (props.isLoading ? '#6b7280' : 'white')};
  border: none;
  border-radius: 4px;
  cursor: ${(props) => (props.isLoading ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover:not(:disabled) {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  padding: 0.5rem 1rem;
  background: V9_COLORS.BG.GRAY_LIGHT;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;

  &:hover {
    background: V9_COLORS.BG.GRAY_MEDIUM;
    border-color: #cbd5e1;
    color: V9_COLORS.TEXT.GRAY_MEDIUM;
  }

  &:active {
    background: V9_COLORS.TEXT.GRAY_LIGHTER;
  }
`;

const SuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SuggestionsLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SuggestionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SuggestionButton = styled.button`
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: V9_COLORS.TEXT.GRAY_LIGHT;
  }
`;

const StatusContainer = styled.div<{ type: 'success' | 'error' | 'info' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			case 'info':
				return '#f8fafc';
			case 'loading':
				return '#f8fafc';
			default:
				return '#f8fafc';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.type) {
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			case 'info':
				return '#e5e7eb';
			case 'loading':
				return '#e5e7eb';
			default:
				return '#e5e7eb';
		}
	}};
  color: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#10b981';
			case 'error':
				return '#dc2626';
			case 'info':
				return '#2563eb';
			case 'loading':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	}};
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  line-height: 1.4;
`;

const EndpointsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const EndpointItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const EndpointLabel = styled.span`
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
  min-width: 120px;
`;

const EndpointUrl = styled.span`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
`;

const ErrorMessage = styled.div`
  color: V9_COLORS.PRIMARY.RED_DARK;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const ResultsToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 6px;
`;

const ResultsToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: V9_COLORS.PRIMARY.BLUE;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
  }

  &:disabled {
    background: V9_COLORS.TEXT.GRAY_LIGHT;
    cursor: not-allowed;
  }
`;

const ResultsCollapsible = styled.div<{ isOpen: boolean }>`
  overflow: hidden;
  transition: all 0.3s ease;
  max-height: ${(props) => (props.isOpen ? '1000px' : '0')};
  opacity: ${(props) => (props.isOpen ? '1' : '0')};
`;

const OIDCDiscoveryInput: React.FC<OIDCDiscoveryInputProps> = ({
	onDiscoveryComplete,
	onCredentialsGenerated,
	initialIssuerUrl = '',
	className,
	disabled = false,
	showSuggestions = true,
	autoDiscover = false,
}) => {
	// Load saved settings from localStorage
	const loadSavedSettings = useCallback(() => {
		try {
			const saved = localStorage.getItem('oidc-discovery-settings');
			if (saved) {
				const settings = JSON.parse(saved);
				return {
					issuerUrl: settings.issuerUrl || initialIssuerUrl || '',
					discoveryResult: settings.discoveryResult || null,
					error: settings.error || null,
				};
			}
		} catch (error) {
			logger.warn('OIDCDiscoveryInput', 'Failed to load OIDC Discovery settings:', { error });
		}
		return {
			issuerUrl: initialIssuerUrl || '',
			discoveryResult: null,
			error: null,
		};
	}, [initialIssuerUrl]);

	const [issuerUrl, setIssuerUrl] = useState(initialIssuerUrl);
	const [isDiscovering, setIsDiscovering] = useState(false);
	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showResults, setShowResults] = useState(false);

	// Initialize state from saved settings
	useEffect(() => {
		const savedSettings = loadSavedSettings();
		setIssuerUrl(savedSettings.issuerUrl);
		setDiscoveryResult(savedSettings.discoveryResult);
		setError(savedSettings.error);
	}, [loadSavedSettings]);

	// Save settings to localStorage whenever they change
	useEffect(() => {
		const settings = {
			issuerUrl,
			discoveryResult,
			error,
		};
		try {
			localStorage.setItem('oidc-discovery-settings', JSON.stringify(settings));
		} catch (error) {
			logger.warn('OIDCDiscoveryInput', 'Failed to save OIDC Discovery settings:', { error });
		}
	}, [issuerUrl, discoveryResult, error]);

	const suggestedIssuers = oidcDiscoveryService.getSuggestedIssuers();

	// Clear saved settings
	const clearSavedSettings = useCallback(() => {
		try {
			localStorage.removeItem('oidc-discovery-settings');
			setIssuerUrl(initialIssuerUrl);
			setDiscoveryResult(null);
			setError(null);
			setShowResults(false);
		} catch (error) {
			logger.warn('OIDCDiscoveryInput', 'Failed to clear OIDC Discovery settings:', { error });
		}
	}, [initialIssuerUrl]);

	const handleDiscover = useCallback(async () => {
		if (!issuerUrl.trim()) {
			setError('Please enter an issuer URL');
			return;
		}

		// Validate URL format before attempting discovery
		try {
			const url = new URL(issuerUrl.trim());
			if (!url.hostname.includes('pingone')) {
				setError(
					'Only PingOne issuer URLs are supported. Please use a URL like https://auth.pingone.com/{environment-id}'
				);
				return;
			}
		} catch (_urlError) {
			setError('Please enter a valid URL');
			return;
		}

		setIsDiscovering(true);
		setError(null);
		setDiscoveryResult(null);
		setShowResults(false);

		try {
			const result = await oidcDiscoveryService.discover({ issuerUrl: issuerUrl.trim() });
			setDiscoveryResult(result);

			if (result.success) {
				onDiscoveryComplete?.(result);
			} else {
				setError(result.error?.message || 'Discovery failed');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Discovery failed';
			logger.error('OIDCDiscoveryInput', '[OIDC Discovery Input] Discovery failed:', {
				message: errorMessage,
			});
			setError(errorMessage);
		} finally {
			setIsDiscovering(false);
		}
	}, [issuerUrl, onDiscoveryComplete]);

	const handleSuggestionClick = useCallback((suggestion: string) => {
		setIssuerUrl(suggestion);
		setError(null);
		setDiscoveryResult(null);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setIssuerUrl(e.target.value);
			setError(null);
			if (discoveryResult) {
				setDiscoveryResult(null);
			}
		},
		[discoveryResult]
	);

	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !isDiscovering && !disabled) {
				handleDiscover();
			}
		},
		[handleDiscover, isDiscovering, disabled]
	);

	// Auto-discover on mount if autoDiscover is enabled and we have an initial URL
	useEffect(() => {
		if (autoDiscover && initialIssuerUrl && !discoveryResult) {
			handleDiscover();
		}
	}, [autoDiscover, initialIssuerUrl, discoveryResult, handleDiscover]);

	const renderStatus = () => {
		if (isDiscovering) {
			return (
				<StatusContainer type="loading">
					<FiLoader className="animate-spin" />
					<StatusText>Discovering OIDC endpoints...</StatusText>
				</StatusContainer>
			);
		}

		if (discoveryResult?.success) {
			return (
				<StatusContainer type="success">
					<span>✅</span>
					<StatusText>
						Successfully discovered OIDC endpoints
						{discoveryResult.data?.cached && ' (cached)'}
					</StatusText>
				</StatusContainer>
			);
		}

		if (discoveryResult && !discoveryResult.success) {
			return (
				<StatusContainer type="error">
					<span>⚠️</span>
					<StatusText>Discovery failed: {discoveryResult.error?.message}</StatusText>
				</StatusContainer>
			);
		}

		return null;
	};

	const renderEndpoints = () => {
		if (!discoveryResult?.success) {
			return null;
		}

		const doc = discoveryResult.data;
		const endpoints = [
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
			<EndpointsList>
				{endpoints.map((endpoint, index) => (
					<EndpointItem key={index}>
						<EndpointLabel>{endpoint.label}:</EndpointLabel>
						<EndpointUrl>{endpoint.url}</EndpointUrl>
					</EndpointItem>
				))}
			</EndpointsList>
		);
	};

	return (
		<Container className={className}>
			<Header>
				<span>🌐</span>
				<Title>OIDC Discovery</Title>
			</Header>

			<Description>
				Enter your OIDC issuer URL to automatically discover all available endpoints. This
				eliminates the need to manually configure authorization, token, and other endpoints.
			</Description>

			<InputContainer>
				<Label htmlFor="issuer-url">Issuer URL</Label>
				<InputGroup>
					<InputIcon
						hasError={!!error}
						hasSuccess={discoveryResult?.success}
						isLoading={isDiscovering}
					>
						{isDiscovering ? <FiLoader className="animate-spin" /> : <span>🌐</span>}
					</InputIcon>

					<Input
						id="issuer-url"
						type="url"
						value={issuerUrl}
						onChange={handleInputChange}
						onKeyPress={handleKeyPress}
						placeholder="https://auth.pingone.com/your-environment-id"
						hasError={!!error}
						hasSuccess={discoveryResult?.success}
						disabled={disabled || isDiscovering}
					/>

					<DiscoverButton
						onClick={handleDiscover}
						disabled={disabled || isDiscovering || !issuerUrl.trim()}
						isLoading={isDiscovering}
						title="Discover OIDC endpoints"
					>
						{isDiscovering ? <FiLoader className="animate-spin" /> : <span>🔄</span>}
					</DiscoverButton>
				</InputGroup>

				{error && <ErrorMessage>{error}</ErrorMessage>}
			</InputContainer>

			{showSuggestions && (
				<SuggestionsContainer>
					<SuggestionsLabel>Suggested PingOne Issuers</SuggestionsLabel>
					<SuggestionsList>
						{suggestedIssuers.map((suggestion, index) => (
							<SuggestionButton
								key={index}
								onClick={() => handleSuggestionClick(suggestion.value)}
								disabled={disabled}
								title={`${suggestion.label} - ${suggestion.region.toUpperCase()} region`}
							>
								{suggestion.label}
							</SuggestionButton>
						))}
					</SuggestionsList>
				</SuggestionsContainer>
			)}

			{/* Clear Settings Button */}
			{(issuerUrl || discoveryResult || error) && (
				<ClearButton onClick={clearSavedSettings}>
					<span style={{ fontSize: '16px' }}>🔄</span>
					Clear Settings
				</ClearButton>
			)}

			{renderStatus()}

			{/* Results Toggle Button - Only show if we have results */}
			{discoveryResult?.success && discoveryResult.data && (
				<ResultsToggleContainer>
					<ResultsToggleButton onClick={() => setShowResults(!showResults)}>
						{showResults ? (
							<span style={{ fontSize: '16px' }}>🙈</span>
						) : (
							<span style={{ fontSize: '16px' }}>👁️</span>
						)}
						{showResults ? 'Hide Results' : 'Show Results'}
					</ResultsToggleButton>
					<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
						Click to {showResults ? 'hide' : 'show'} discovered endpoints
					</span>
				</ResultsToggleContainer>
			)}

			{/* Collapsible Results Section */}
			<ResultsCollapsible isOpen={showResults}>{renderEndpoints()}</ResultsCollapsible>
		</Container>
	);
};

export default OIDCDiscoveryInput;
