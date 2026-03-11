import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiLoader } from '../icons';
import { type DiscoveryResult, oidcDiscoveryService } from '../services/oidcDiscoveryService';
import { PINGONE_AUTH_REGION_MAP, type PingOneRegion } from '../services/regionService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';
import { logger } from '../utils/logger';
import { RegionSelect } from './RegionSelect';

interface EnvironmentIdInputProps {
	onDiscoveryComplete?: (result: DiscoveryResult) => void;
	onEnvironmentIdChange?: (envId: string) => void;
	onIssuerUrlChange?: (issuerUrl: string) => void;
	initialEnvironmentId?: string;
	className?: string;
	disabled?: boolean;
	autoDiscover?: boolean;
	region?: 'us' | 'eu' | 'ap' | 'ca' | 'au' | 'sg';
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.5rem;
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 8px;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.BLACK};
`;

const Description = styled.p`
	margin: 0 0 1rem 0;
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.BLACK};
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
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const InputGroup = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const RegionSelector = styled.select`
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-right: none;
	border-radius: 6px 0 0 6px;
	font-size: 0.875rem;
	background: ${V9_COLORS.BG.WHITE};
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	min-width: 120px;

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Input = styled.input<{ hasError?: boolean; hasSuccess?: boolean }>`
	flex: 1;
	padding: 0.75rem;
	border: 1px solid
		${(props) =>
			props.hasError
				? V9_COLORS.PRIMARY.RED_DARK
				: props.hasSuccess
					? V9_COLORS.PRIMARY.GREEN
					: V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 0 6px 6px 0;
	font-size: 0.875rem;
	background: ${V9_COLORS.BG.WHITE};
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	font-family: monospace;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${(props) =>
			props.hasError
				? V9_COLORS.PRIMARY.RED_DARK
				: props.hasSuccess
					? V9_COLORS.PRIMARY.GREEN
					: V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px
			${(props) =>
				props.hasError
					? 'rgba(239, 68, 68, 0.1)'
					: props.hasSuccess
						? 'rgba(16, 185, 129, 0.1)'
						: 'rgba(59, 130, 246, 0.1)'};
	}

	&:disabled {
		background: ${V9_COLORS.BG.GRAY_MEDIUM};
		color: ${V9_COLORS.TEXT.GRAY_LIGHT};
		cursor: not-allowed;
	}
`;

const DiscoverButton = styled.button.withConfig({
	shouldForwardProp: (prop) => !['isLoading'].includes(prop),
})<{ isLoading?: boolean }>`
	position: absolute;
	right: 0.5rem;
	padding: 0.5rem;
	background: ${(props) =>
		props.isLoading ? V9_COLORS.TEXT.GRAY_LIGHTER : V9_COLORS.PRIMARY.GREEN};
	color: ${(props) => (props.isLoading ? V9_COLORS.TEXT.GRAY_MEDIUM : V9_COLORS.TEXT.WHITE)};
	border: 1px solid
		${(props) => (props.isLoading ? V9_COLORS.TEXT.GRAY_LIGHTER : V9_COLORS.PRIMARY.GREEN_DARK)};
	border-radius: 0.375rem;
	cursor: ${(props) => (props.isLoading ? 'not-allowed' : 'pointer')};
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

	&:hover:not(:disabled) {
		background: ${V9_COLORS.PRIMARY.GREEN_DARK};
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
	background: ${(props) =>
		props.$isSaved ? V9_COLORS.PRIMARY.GREEN_DARK : V9_COLORS.PRIMARY.GREEN};
	color: ${V9_COLORS.TEXT.WHITE};
	border: 1px solid ${(props) => (props.$isSaved ? '#047857' : V9_COLORS.PRIMARY.GREEN_DARK)};
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
		background: ${(props) =>
			props.$isSaved ? V9_COLORS.PRIMARY.GREEN_DARK : V9_COLORS.PRIMARY.BLUE};
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
	background: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	color: ${V9_COLORS.TEXT.WHITE};
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
	background: ${V9_COLORS.BG.GRAY_MEDIUM};
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
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
	background: ${V9_COLORS.PRIMARY.BLUE};
	color: ${V9_COLORS.TEXT.WHITE};
	border: none;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	transition: background-color 0.2s;

	&:hover {
		background: ${V9_COLORS.PRIMARY.BLUE_DARK};
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
				return V9_COLORS.BG.SUCCESS;
			case 'error':
				return V9_COLORS.BG.ERROR;
			case 'info':
				return V9_COLORS.BG.GRAY_LIGHT;
			case 'loading':
				return V9_COLORS.BG.GRAY_LIGHT;
			default:
				return V9_COLORS.BG.GRAY_LIGHT;
		}
	}};
	border: 1px solid
		${(props) => {
			switch (props.type) {
				case 'success':
					return V9_COLORS.BG.SUCCESS_BORDER;
				case 'error':
					return V9_COLORS.BG.ERROR_BORDER;
				case 'info':
					return V9_COLORS.PRIMARY.BLUE;
				case 'loading':
					return V9_COLORS.TEXT.GRAY_LIGHTER;
				default:
					return V9_COLORS.TEXT.GRAY_LIGHTER;
			}
		}};
	color: ${(props) => {
		switch (props.type) {
			case 'success':
				return '#10b981';
			case 'error':
				return V9_COLORS.PRIMARY.RED;
			case 'info':
				return V9_COLORS.PRIMARY.BLUE_DARK;
			case 'loading':
				return V9_COLORS.TEXT.GRAY_MEDIUM;
			default:
				return V9_COLORS.TEXT.GRAY_MEDIUM;
		}
	}};
`;

const StatusText = styled.div`
	font-size: 0.875rem;
	line-height: 1.4;
`;

const ErrorMessage = styled.div`
	color: ${V9_COLORS.PRIMARY.RED};
	font-size: 0.875rem;
	margin-top: 0.5rem;
`;

const RegionInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.PRIMARY.BLUE};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	color: ${V9_COLORS.TEXT.BLACK};
`;

const DiscoveryResultsBox = styled.div`
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 8px;
	margin-bottom: 1rem;
	overflow: hidden;
`;

const DiscoveryResultsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	width: 100%;
	padding: 1rem;
	background: ${V9_COLORS.PRIMARY.BLUE};
	color: ${V9_COLORS.TEXT.WHITE};
	font-weight: 600;
	font-size: 0.875rem;
	transition: background-color 0.2s ease;

	&:hover {
		background: ${V9_COLORS.PRIMARY.BLUE_DARK};
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
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
	}
`;

const DiscoveryResultsContent = styled.div`
	padding: 1rem;
	display: flex;
	flex-direction: column;
`;

const DiscoveryResultItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	font-size: 0.875rem;
	line-height: 1.4;

	strong {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
		font-weight: 600;
	}

	&:not(:last-child) {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	}
`;

export const EnvironmentIdInput: React.FC<EnvironmentIdInputProps> = ({
	onDiscoveryComplete,
	onEnvironmentIdChange,
	onIssuerUrlChange,
	initialEnvironmentId = '',
	className = '',
	disabled = false,
	autoDiscover = false,
	region = 'us',
}) => {
	const [environmentId, setEnvironmentId] = useState(initialEnvironmentId);
	const [selectedRegion, setSelectedRegion] = useState<PingOneRegion>(region as PingOneRegion);
	const [isDiscovering, setIsDiscovering] = useState(false);
	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isApplying, setIsApplying] = useState(false);
	const [isDiscoveryResultsCollapsed, setIsDiscoveryResultsCollapsed] = useState(false);

	const regionUrls = PINGONE_AUTH_REGION_MAP;
	const regionLabels = {
		us: 'US (North America)',
		eu: 'EU (Europe)',
		ap: 'AP (Asia Pacific)',
		ca: 'CA (Canada)',
		au: 'AU (Australia)',
		sg: 'SG (Singapore)',
	};

	const issuerUrl = environmentId
		? `${regionUrls[selectedRegion] ?? regionUrls.us}/${environmentId}`
		: '';

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
						data: config.discoveryResult,
					});
				}
			} catch (err) {
				logger.error(
					'EnvironmentIdInput',
					'Failed to load saved OIDC discovery config:',
					undefined,
					err as Error
				);
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
		[selectedRegion, discoveryResult, onEnvironmentIdChange, onIssuerUrlChange, regionUrls]
	);

	const handleRegionChange = useCallback(
		(newRegion: PingOneRegion) => {
			setSelectedRegion(newRegion);
			if (environmentId) {
				const newIssuerUrl = `${regionUrls[newRegion] ?? regionUrls.us}/${environmentId}`;
				onIssuerUrlChange?.(newIssuerUrl);
			}
			// Clear previous discovery results when region changes
			if (discoveryResult) {
				setDiscoveryResult(null);
			}
		},
		[environmentId, discoveryResult, onIssuerUrlChange, regionUrls]
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

			if (result.success) {
				onDiscoveryComplete?.(result);
			} else {
				setError(result.error?.message || 'Discovery failed');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Discovery failed';
			setError(errorMessage);
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
			logger.error('EnvironmentIdInput', 'Failed to copy issuer URL:', undefined, err as Error);
		}
	};

	const handleSave = useCallback(async () => {
		if (!discoveryResult?.success) {
			return;
		}

		try {
			// Save the discovered configuration to localStorage
			const config = {
				environmentId,
				region: selectedRegion,
				issuerUrl,
				discoveryResult: discoveryResult.data,
				timestamp: Date.now(),
			};

			localStorage.setItem('oidc-discovery-config', JSON.stringify(config));
			setIsSaved(true);

			// Reset saved state after 3 seconds
			setTimeout(() => setIsSaved(false), 3000);
		} catch (err) {
			logger.error(
				'EnvironmentIdInput',
				'Failed to save OIDC discovery configuration:',
				undefined,
				err as Error
			);
			setError('Failed to save configuration');
		}
	}, [discoveryResult, environmentId, selectedRegion, issuerUrl]);

	const handleSaveAndApply = useCallback(async () => {
		if (!discoveryResult?.success) {
			return;
		}

		try {
			setIsApplying(true);

			// Save the discovered configuration to localStorage
			const config = {
				environmentId,
				region: selectedRegion,
				issuerUrl,
				discoveryResult: discoveryResult.data,
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
			logger.error(
				'EnvironmentIdInput',
				'Failed to save and apply OIDC discovery configuration:',
				undefined,
				err as Error
			);
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

	// Auto-discover when environment ID changes (debounced)
	useEffect(() => {
		logger.info('[EnvironmentIdInput] Auto-discovery check:', {
			autoDiscover,
			environmentId,
			envIdLength: environmentId?.length,
			hasDiscoveryResult: !!discoveryResult,
			shouldTrigger: autoDiscover && environmentId && environmentId.length > 10,
		});

		// Trigger discovery if we have a valid environment ID, regardless of existing discovery result
		if (autoDiscover && environmentId && environmentId.length > 10) {
			logger.info('[EnvironmentIdInput] Triggering auto-discovery in 1 second...', 'Logger info');
			const timeoutId = setTimeout(() => {
				logger.info(
					'[EnvironmentIdInput] Auto-discovery timeout triggered, calling handleDiscover'
				);
				handleDiscover();
			}, 1000); // 1 second delay

			return () => clearTimeout(timeoutId);
		}
		return undefined;
	}, [autoDiscover, environmentId, handleDiscover, discoveryResult]);

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

	return (
		<Container className={className}>
			<Header>
				<span>🌐</span>
				<Title>PingOne Environment Configuration</Title>
			</Header>

			<Description>
				Enter your PingOne environment ID and select your region. We'll construct the issuer URL and
				discover all available OIDC endpoints automatically.
			</Description>

			<InputContainer>
				<Label htmlFor="environment-id">Environment ID</Label>
				<InputGroup>
					<RegionSelect
						as={RegionSelector}
						value={selectedRegion}
						onChange={handleRegionChange}
						disabled={disabled}
						variant="compact"
					/>

					<Input
						id="environment-id"
						type="text"
						value={environmentId}
						onChange={handleEnvironmentIdChange}
						onKeyPress={handleKeyPress}
						placeholder="your-environment-id"
						hasError={!!error}
						hasSuccess={discoveryResult?.success || false}
						disabled={disabled || isDiscovering}
					/>

					{autoDiscover && (
						<DiscoverButton
							onClick={handleDiscover}
							disabled={disabled || isDiscovering || !environmentId.trim()}
							isLoading={isDiscovering}
							title="Discover OIDC endpoints"
						>
							{isDiscovering ? <FiLoader className="animate-spin" /> : <span>🔍</span>}
						</DiscoverButton>
					)}
				</InputGroup>

				{error && <ErrorMessage>{error}</ErrorMessage>}
			</InputContainer>

			{issuerUrl && (
				<div>
					<Label>Generated Issuer URL</Label>
					<IssuerUrlDisplay>
						{issuerUrl}
						<CopyButton onClick={handleCopyIssuerUrl}>
							{copied ? (
								<span style={{ fontSize: '12px' }}>✅</span>
							) : (
								<span style={{ fontSize: '12px' }}>📋</span>
							)}
							{copied ? 'Copied!' : 'Copy'}
						</CopyButton>
					</IssuerUrlDisplay>
				</div>
			)}

			{autoDiscover && discoveryResult?.success && discoveryResult.data && (
				<div style={{ marginTop: '1rem' }}>
					{/* Discovery Results Display */}
					<DiscoveryResultsBox>
						<DiscoveryResultsHeader
							onClick={() => setIsDiscoveryResultsCollapsed(!isDiscoveryResultsCollapsed)}
							aria-expanded={!isDiscoveryResultsCollapsed}
						>
							<DiscoveryResultsHeaderLeft>
								<span style={{ fontSize: '18px' }}>🌐</span>
								<span>OIDC Discovery Results</span>
							</DiscoveryResultsHeaderLeft>
							<DiscoveryResultsToggleIcon $collapsed={isDiscoveryResultsCollapsed}>
								<span>⬇️</span>
							</DiscoveryResultsToggleIcon>
						</DiscoveryResultsHeader>
						{!isDiscoveryResultsCollapsed && (
							<DiscoveryResultsContent>
								<DiscoveryResultItem>
									<strong>Issuer:</strong> {discoveryResult.data.issuer}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Authorization Endpoint:</strong>{' '}
									{discoveryResult.data.authorization_endpoint}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Token Endpoint:</strong> {discoveryResult.data.token_endpoint}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>UserInfo Endpoint:</strong> {discoveryResult.data.userinfo_endpoint}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>JWKS URI:</strong> {discoveryResult.data.jwks_uri}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Response Types Supported:</strong>{' '}
									{discoveryResult.data.response_types_supported?.join(', ')}
								</DiscoveryResultItem>
								<DiscoveryResultItem>
									<strong>Scopes Supported:</strong>{' '}
									{discoveryResult.data.scopes_supported?.join(', ')}
								</DiscoveryResultItem>
							</DiscoveryResultsContent>
						)}
					</DiscoveryResultsBox>

					<ButtonGroup>
						<ResetButton onClick={handleReset} disabled={isApplying}>
							<span style={{ fontSize: '16px' }}>🔄</span>
							Reset
						</ResetButton>

						<SaveButton onClick={handleSave} $isSaved={isSaved} disabled={isSaved || isApplying}>
							<span style={{ fontSize: '16px' }}>💾</span>
							{isSaved ? 'Configuration Saved!' : 'Save Only'}
						</SaveButton>

						<SaveButton
							onClick={handleSaveAndApply}
							$isSaved={isSaved}
							disabled={isSaved || isApplying}
							style={{
								background: isApplying ? V9_COLORS.PRIMARY.YELLOW : V9_COLORS.PRIMARY.GREEN,
								borderColor: isApplying
									? V9_COLORS.PRIMARY.YELLOW_DARK
									: V9_COLORS.PRIMARY.GREEN_DARK,
							}}
						>
							{isApplying ? (
								<FiLoader className="animate-spin" size={16} />
							) : (
								<span style={{ fontSize: '16px' }}>✅</span>
							)}
							{isApplying ? 'Applying...' : isSaved ? 'Applied!' : 'Save & Apply'}
						</SaveButton>
					</ButtonGroup>
				</div>
			)}

			<RegionInfo>
				<span style={{ fontSize: '14px' }}>ℹ️</span>
				<span>
					Selected region: <strong>{regionLabels[selectedRegion] ?? selectedRegion}</strong> -{' '}
					{regionUrls[selectedRegion] ?? regionUrls.us}
				</span>
			</RegionInfo>

			{renderStatus()}
		</Container>
	);
};

export default EnvironmentIdInput;
