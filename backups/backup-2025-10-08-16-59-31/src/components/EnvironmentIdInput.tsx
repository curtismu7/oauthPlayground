import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiChevronDown,
	FiCopy,
	FiGlobe,
	FiInfo,
	FiLoader,
	FiRefreshCw,
	FiSave,
	FiSearch,
} from 'react-icons/fi';
import styled from 'styled-components';
import { type DiscoveryResult, oidcDiscoveryService } from '../services/oidcDiscoveryService';

interface EnvironmentIdInputProps {
	onDiscoveryComplete?: (result: DiscoveryResult) => void;
	onEnvironmentIdChange?: (envId: string) => void;
	onIssuerUrlChange?: (issuerUrl: string) => void;
	initialEnvironmentId?: string;
	className?: string;
	disabled?: boolean;
	showSuggestions?: boolean;
	autoDiscover?: boolean;
	region?: 'us' | 'eu' | 'ap' | 'ca';
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  color: #64748b;
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
  color: #374151;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const RegionSelector = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Input = styled.input.withConfig({
	shouldForwardProp: (prop) => !['hasError', 'hasSuccess'].includes(prop),
})<{ hasError?: boolean; hasSuccess?: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid ${(props) =>
		props.hasError ? '#ef4444' : props.hasSuccess ? '#10b981' : '#d1d5db'};
  border-radius: 0 6px 6px 0;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
  font-family: monospace;
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
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const DiscoverButton = styled.button.withConfig({
	shouldForwardProp: (prop) => !['isLoading'].includes(prop),
})<{ isLoading?: boolean }>`
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
  background: ${(props) => (props.isLoading ? '#f3f4f6' : '#10b981')};
  color: ${(props) => (props.isLoading ? '#6b7280' : 'white')};
  border: 1px solid ${(props) => (props.isLoading ? '#d1d5db' : '#059669')};
  border-radius: 0.375rem;
  cursor: ${(props) => (props.isLoading ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button<{ $isSaved?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) => (props.$isSaved ? '#10b981' : '#3b82f6')};
  color: white;
  border: 1px solid ${(props) => (props.$isSaved ? '#059669' : '#2563eb')};
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background: ${(props) => (props.$isSaved ? '#059669' : '#2563eb')};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const IssuerUrlDisplay = styled.div`
  padding: 0.75rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
  color: #334155;
  word-break: break-all;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
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
				return '#eff6ff';
			case 'loading':
				return '#f8fafc';
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
			case 'loading':
				return '#e2e8f0';
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
			case 'loading':
				return '#475569';
			default:
				return '#475569';
		}
	}};
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  line-height: 1.4;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const RegionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #1e40af;
`;

const DiscoveryResultsBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const DiscoveryResultsHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #2563eb;
  }
`;

const DiscoveryResultsHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DiscoveryResultsToggleIcon = styled.span<{ $collapsed: boolean }>`
  display: inline-flex;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
  }
`;

const DiscoveryResultsContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DiscoveryResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.4;
  
  strong {
    color: #374151;
    font-weight: 600;
  }
  
  &:not(:last-child) {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const EnvironmentIdInput: React.FC<EnvironmentIdInputProps> = ({
	onDiscoveryComplete,
	onEnvironmentIdChange,
	onIssuerUrlChange,
	initialEnvironmentId = '',
	className,
	disabled = false,
	showSuggestions = true,
	autoDiscover = false,
	region = 'us',
}) => {
	const [environmentId, setEnvironmentId] = useState(initialEnvironmentId);
	const [selectedRegion, setSelectedRegion] = useState<'us' | 'eu' | 'ap' | 'ca'>(region);
	const [isDiscovering, setIsDiscovering] = useState(false);
	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isApplying, setIsApplying] = useState(false);
	const [isDiscoveryResultsCollapsed, setIsDiscoveryResultsCollapsed] = useState(false);

	const regionUrls = {
		us: 'https://auth.pingone.com',
		eu: 'https://auth.pingone.eu',
		ap: 'https://auth.pingone.asia',
		ca: 'https://auth.pingone.ca',
	};

	const regionLabels = {
		us: 'US (North America)',
		eu: 'EU (Europe)',
		ap: 'AP (Asia Pacific)',
		ca: 'CA (Canada)',
	};

	const issuerUrl = environmentId ? `${regionUrls[selectedRegion]}/${environmentId}` : '';

	// Load saved settings on mount
	useEffect(() => {
		const savedConfig = localStorage.getItem('oidc-discovery-config');
		if (savedConfig) {
			try {
				const config = JSON.parse(savedConfig);
				if (config.environmentId && config.discoveryResult) {
					setEnvironmentId(config.environmentId);
					setSelectedRegion(config.region || 'us');
					setDiscoveryResult({
						success: true,
						document: config.discoveryResult,
					});
				}
			} catch (err) {
				console.error('Failed to load saved OIDC discovery config:', err);
			}
		}
	}, []);

	const handleEnvironmentIdChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setEnvironmentId(value);
			setError(null);
			if (discoveryResult) {
				setDiscoveryResult(null);
			}
			onEnvironmentIdChange?.(value);
			onIssuerUrlChange?.(value ? `${regionUrls[selectedRegion]}/${value}` : '');
		},
		[selectedRegion, discoveryResult, onEnvironmentIdChange, onIssuerUrlChange]
	);

	const handleRegionChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const newRegion = e.target.value as 'us' | 'eu' | 'ap' | 'ca';
			setSelectedRegion(newRegion);
			if (environmentId) {
				const newIssuerUrl = `${regionUrls[newRegion]}/${environmentId}`;
				onIssuerUrlChange?.(newIssuerUrl);
			}
			// Clear previous discovery results when region changes
			if (discoveryResult) {
				setDiscoveryResult(null);
			}
		},
		[environmentId, discoveryResult, onIssuerUrlChange]
	);

	const handleDiscover = useCallback(async () => {
		if (!environmentId.trim()) {
			setError('Please enter an environment ID');
			return;
		}

		setIsDiscovering(true);
		setError(null);
		setDiscoveryResult(null);

		try {
			const result = await oidcDiscoveryService.discover({ issuerUrl: issuerUrl.trim() });
			setDiscoveryResult(result);

			if (result.success && result.document) {
				onDiscoveryComplete?.(result);
			} else {
				setError(result.error || 'Discovery failed');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Discovery failed';
			setError(errorMessage);
			setDiscoveryResult({
				success: false,
				error: errorMessage,
			});
		} finally {
			setIsDiscovering(false);
		}
	}, [environmentId, issuerUrl, onDiscoveryComplete]);

	const handleCopyIssuerUrl = async () => {
		try {
			await navigator.clipboard.writeText(issuerUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy issuer URL:', err);
		}
	};

	const handleSave = useCallback(async () => {
		if (!discoveryResult?.success || !discoveryResult.document) {
			return;
		}

		try {
			// Save the discovered configuration to localStorage
			const config = {
				environmentId,
				region: selectedRegion,
				issuerUrl,
				discoveryResult: discoveryResult.document,
				timestamp: Date.now(),
			};

			localStorage.setItem('oidc-discovery-config', JSON.stringify(config));
			setIsSaved(true);

			// Reset saved state after 3 seconds
			setTimeout(() => setIsSaved(false), 3000);
		} catch (err) {
			console.error('Failed to save OIDC discovery configuration:', err);
			setError('Failed to save configuration');
		}
	}, [discoveryResult, environmentId, selectedRegion, issuerUrl]);

	const handleSaveAndApply = useCallback(async () => {
		if (!discoveryResult?.success || !discoveryResult.document) {
			return;
		}

		try {
			setIsApplying(true);

			// Save the discovered configuration to localStorage
			const config = {
				environmentId,
				region: selectedRegion,
				issuerUrl,
				discoveryResult: discoveryResult.document,
				timestamp: Date.now(),
			};

			localStorage.setItem('oidc-discovery-config', JSON.stringify(config));
			setIsSaved(true);

			// Call the discovery complete callback to notify parent components and apply the configuration
			onDiscoveryComplete?.(discoveryResult);

			// Reset states after 3 seconds
			setTimeout(() => {
				setIsSaved(false);
				setIsApplying(false);
			}, 3000);
		} catch (err) {
			console.error('Failed to save and apply OIDC discovery configuration:', err);
			setError('Failed to save and apply configuration');
			setIsApplying(false);
		}
	}, [discoveryResult, environmentId, selectedRegion, issuerUrl, onDiscoveryComplete]);

	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !isDiscovering && !disabled) {
				handleDiscover();
			}
		},
		[handleDiscover, isDiscovering, disabled]
	);

	const handleReset = useCallback(() => {
		setEnvironmentId('');
		setDiscoveryResult(null);
		setError(null);
		setIsSaved(false);
		setIsApplying(false);
		setCopied(false);
		onEnvironmentIdChange?.('');
		onIssuerUrlChange?.('');
	}, [onEnvironmentIdChange, onIssuerUrlChange]);

	// Auto-discover on mount if autoDiscover is enabled and we have an initial environment ID
	useEffect(() => {
		if (autoDiscover && initialEnvironmentId && !discoveryResult) {
			handleDiscover();
		}
	}, [autoDiscover, initialEnvironmentId, discoveryResult, handleDiscover]);

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
					<FiCheck />
					<StatusText>
						Successfully discovered OIDC endpoints
						{discoveryResult.cached && ' (cached)'}
					</StatusText>
				</StatusContainer>
			);
		}

		if (discoveryResult && !discoveryResult.success) {
			return (
				<StatusContainer type="error">
					<FiAlertCircle />
					<StatusText>Discovery failed: {discoveryResult.error}</StatusText>
				</StatusContainer>
			);
		}

		return null;
	};

	return (
		<Container className={className}>
			<Header>
				<FiGlobe />
				<Title>PingOne Environment Configuration</Title>
			</Header>

			<Description>
				Enter your PingOne environment ID and select your region. We'll construct the issuer URL and
				discover all available OIDC endpoints automatically.
			</Description>

			<InputContainer>
				<Label htmlFor="environment-id">Environment ID</Label>
				<InputGroup>
					<RegionSelector value={selectedRegion} onChange={handleRegionChange} disabled={disabled}>
						<option value="us">US - North America</option>
						<option value="eu">EU - Europe</option>
						<option value="ap">AP - Asia Pacific</option>
						<option value="ca">CA - Canada</option>
					</RegionSelector>

					<Input
						id="environment-id"
						type="text"
						value={environmentId}
						onChange={handleEnvironmentIdChange}
						onKeyPress={handleKeyPress}
						placeholder="your-environment-id"
						hasError={!!error}
						hasSuccess={discoveryResult?.success}
						disabled={disabled || isDiscovering}
					/>

					<DiscoverButton
						onClick={handleDiscover}
						disabled={disabled || isDiscovering || !environmentId.trim()}
						isLoading={isDiscovering}
						title="Discover OIDC endpoints"
					>
						{isDiscovering ? <FiLoader className="animate-spin" /> : <FiSearch />}
					</DiscoverButton>
				</InputGroup>

				{error && <ErrorMessage>{error}</ErrorMessage>}
			</InputContainer>

			{issuerUrl && (
				<div>
					<Label>Generated Issuer URL</Label>
					<IssuerUrlDisplay>
						{issuerUrl}
						<CopyButton onClick={handleCopyIssuerUrl}>
							{copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
							{copied ? 'Copied!' : 'Copy'}
						</CopyButton>
					</IssuerUrlDisplay>
				</div>
			)}

			{discoveryResult?.success && discoveryResult.document && (
				<div style={{ marginTop: '1rem' }}>
					{/* Discovery Results Display */}
					<DiscoveryResultsBox>
						<DiscoveryResultsHeader
							onClick={() => setIsDiscoveryResultsCollapsed(!isDiscoveryResultsCollapsed)}
							aria-expanded={!isDiscoveryResultsCollapsed}
						>
							<DiscoveryResultsHeaderLeft>
								<FiGlobe size={18} />
								<span>OIDC Discovery Results</span>
							</DiscoveryResultsHeaderLeft>
							<DiscoveryResultsToggleIcon $collapsed={isDiscoveryResultsCollapsed}>
								<FiChevronDown />
							</DiscoveryResultsToggleIcon>
						</DiscoveryResultsHeader>
						{!isDiscoveryResultsCollapsed && (
							<DiscoveryResultsContent>
								<DiscoveryResultItem>
									<strong>Issuer:</strong> {discoveryResult.document.issuer}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Authorization Endpoint:</strong>{' '}
									{discoveryResult.document.authorization_endpoint}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Token Endpoint:</strong> {discoveryResult.document.token_endpoint}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>UserInfo Endpoint:</strong> {discoveryResult.document.userinfo_endpoint}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>JWKS URI:</strong> {discoveryResult.document.jwks_uri}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Response Types Supported:</strong>{' '}
									{discoveryResult.document.response_types_supported?.join(', ')}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Scopes Supported:</strong>{' '}
									{discoveryResult.document.scopes_supported?.join(', ')}
								</DiscoveryResultItem>
							</DiscoveryResultsContent>
						)}
					</DiscoveryResultsBox>

					<ButtonGroup>
						<ResetButton onClick={handleReset} disabled={isApplying}>
							<FiRefreshCw size={16} />
							Reset
						</ResetButton>

						<SaveButton onClick={handleSave} $isSaved={isSaved} disabled={isSaved || isApplying}>
							<FiSave size={16} />
							{isSaved ? 'Configuration Saved!' : 'Save Only'}
						</SaveButton>

						<SaveButton
							onClick={handleSaveAndApply}
							$isSaved={isSaved}
							disabled={isSaved || isApplying}
							style={{
								background: isApplying ? '#f59e0b' : '#10b981',
								borderColor: isApplying ? '#d97706' : '#059669',
							}}
						>
							{isApplying ? <FiLoader className="animate-spin" size={16} /> : <FiCheck size={16} />}
							{isApplying ? 'Applying...' : isSaved ? 'Applied!' : 'Save & Apply'}
						</SaveButton>
					</ButtonGroup>
				</div>
			)}

			<RegionInfo>
				<FiInfo size={14} />
				<span>
					Selected region: <strong>{regionLabels[selectedRegion]}</strong> -{' '}
					{regionUrls[selectedRegion]}
				</span>
			</RegionInfo>

			{renderStatus()}
		</Container>
	);
};

export default EnvironmentIdInput;
