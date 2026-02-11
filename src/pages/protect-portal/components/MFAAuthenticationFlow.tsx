/**
 * @file MFAAuthenticationFlow.tsx
 * @module protect-portal/components
 * @description MFA authentication flow component
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component handles MFA authentication for medium risk evaluations,
 * including device selection and authentication methods.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiKey,
	FiLoader,
	FiLock,
	FiMail,
	FiShield,
	FiSmartphone,
} from 'react-icons/fi';
import styled from 'styled-components';
import CompanyLogoHeader from './CompanyLogoHeader';
import MFAAuthenticationService from '../services/mfaAuthenticationService';
import type {
	EducationalContent,
	MFADevice,
	PortalError,
	RiskEvaluationResult,
	TokenSet,
	UserContext,
} from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const MFAContainer = styled.div`
  width: 100%;
  max-width: 600px;
  text-align: center;
`;

const MFATitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--brand-text);
  margin: 0 0 1rem 0;
  font-family: var(--brand-heading-font);
`;

const MFADescription = styled.p`
  font-size: 1rem;
  color: var(--brand-text-secondary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
  font-family: var(--brand-body-font);
`;

const RiskWarning = styled.div`
  background: var(--brand-warning-light);
  border: 1px solid var(--brand-warning);
  border-radius: var(--brand-radius-md);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WarningIcon = styled.div`
  color: var(--brand-warning);
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const WarningContent = styled.div`
  text-align: left;
  flex: 1;
`;

const WarningTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--brand-warning-dark);
  margin: 0 0 0.5rem 0;
  font-family: var(--brand-heading-font);
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: var(--brand-warning-dark);
  margin: 0;
  line-height: 1.5;
  font-family: var(--brand-body-font);
`;

const DeviceSelectionContainer = styled.div`
  background: var(--brand-surface);
  border: 1px solid var(--brand-text-secondary);
  border-radius: var(--brand-radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const DeviceSelectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--brand-text);
  margin: 0 0 1.5rem 0;
  font-family: var(--brand-heading-font);
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DeviceCard = styled.button<{ selected?: boolean }>`
  background: ${(props) => (props.selected ? 'var(--brand-primary-light)' : 'var(--brand-surface)')};
  border: 2px solid ${(props) => (props.selected ? 'var(--brand-primary)' : 'var(--brand-text-secondary)')};
  border-radius: var(--brand-radius-md);
  padding: 1.5rem;
  cursor: pointer;
  transition: var(--brand-transition);
  width: 100%;
  text-align: center;

  &:hover {
    border-color: ${(props) => (props.selected ? 'var(--brand-primary)' : 'var(--brand-text)')};
    transform: translateY(-2px);
    box-shadow: var(--brand-shadow-md);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DeviceIcon = styled.div<{ deviceType: string }>`
  width: 48px;
  height: 48px;
  background: var(--brand-primary-light);
  border-radius: var(--brand-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-primary);
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const DeviceName = styled.div`
  font-weight: 600;
  color: var(--brand-text);
  margin-bottom: 0.25rem;
  font-family: var(--brand-heading-font);
`;

const DeviceStatus = styled.div`
  font-size: 0.75rem;
  color: var(--brand-text-secondary);
  font-family: var(--brand-body-font);
`;

const NoDevicesMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--brand-text-secondary);
  font-family: var(--brand-body-font);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 2rem;
  color: var(--brand-primary);

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: var(--brand-text-secondary);
  font-size: 1rem;
  margin: 0;
  font-family: var(--brand-body-font);
`;

const ErrorMessage = styled.div`
  background: var(--brand-error-light);
  border: 1px solid var(--brand-error);
  border-radius: var(--brand-radius-sm);
  padding: 1rem;
  color: var(--brand-error);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--brand-body-font);
`;

const EducationalSection = styled.div`
  background: var(--brand-surface);
  border: 1px solid var(--brand-primary);
  border-radius: var(--brand-radius-lg);
  padding: 1.5rem;
  text-align: left;
`;

const EducationalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const EducationalTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--brand-primary);
  margin: 0;
  font-family: var(--brand-heading-font);
`;

const EducationalDescription = styled.p`
  font-size: 0.875rem;
  color: var(--brand-primary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
  font-family: var(--brand-body-font);
`;

const KeyPoints = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const KeyPoint = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--brand-text);
  line-height: 1.4;
  font-family: var(--brand-body-font);
`;

const KeyPointIcon = styled(FiCheckCircle)`
  color: var(--brand-success);
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface MFAAuthenticationFlowProps {
	userContext: UserContext;
	riskEvaluation: RiskEvaluationResult;
	onComplete: (tokens: TokenSet) => void;
	onError: (error: PortalError) => void;
	mfaCredentials: {
		environmentId: string;
		accessToken: string;
		region: 'us' | 'eu' | 'ap' | 'ca';
	};
	loginContext: {
		ipAddress: string;
		userAgent: string;
	};
	educationalContent: EducationalContent;
}

// ============================================================================
// COMPONENT
// ============================================================================

const MFAAuthenticationFlow: React.FC<MFAAuthenticationFlowProps> = ({
	userContext,
	riskEvaluation,
	onComplete,
	onError,
	mfaCredentials,
	loginContext,
	educationalContent,
}) => {
	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	const [availableDevices, setAvailableDevices] = useState<MFADevice[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<MFADevice | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState<
		'loading' | 'device-selection' | 'authenticating' | 'complete'
	>('loading');

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	const loadDevices = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			console.log('[🔐 MFA-AUTHENTICATION] Loading MFA devices for user:', userContext.id);

			// Use real MFA service to get available devices
			const devicesResponse = await MFAAuthenticationService.getAvailableDevices(
				userContext,
				mfaCredentials
			);

			if (!devicesResponse.success || !devicesResponse.data) {
				throw new Error(devicesResponse.error?.message || 'Failed to load MFA devices');
			}

			setAvailableDevices(devicesResponse.data.devices);
			console.log('[🔐 MFA-AUTHENTICATION] Loaded devices:', devicesResponse.data.devices.length);
		} catch (err) {
			console.error('[🔐 MFA-AUTHENTICATION] Failed to load devices:', err);

			const errorMessage = err instanceof Error ? err.message : 'Failed to load MFA devices';
			setError(errorMessage);

			const portalError: PortalError = {
				code: 'DEVICE_LOAD_FAILED',
				message: errorMessage,
				recoverable: true,
				suggestedAction: 'Please try again or contact support',
			};

			onError(portalError);
		} finally {
			setIsLoading(false);
		}
	}, [userContext, mfaCredentials, onError]);

	const handleDeviceSelect = useCallback((device: MFADevice) => {
		setSelectedDevice(device);
		setError(null);
	}, []);

	const handleAuthenticate = useCallback(async () => {
		if (!selectedDevice) {
			setError('Please select a device');
			return;
		}

		setIsLoading(true);
		setError(null);
		setCurrentStep('authenticating');

		try {
			console.log(
				'[🔐 MFA-AUTHENTICATION] Starting authentication with device:',
				selectedDevice.id
			);

			// Use real MFA service to initiate authentication
			const authResponse = await MFAAuthenticationService.initiateAuthentication(
				userContext,
				selectedDevice,
				mfaCredentials,
				loginContext
			);

			if (!authResponse.success || !authResponse.data) {
				throw new Error(authResponse.error?.message || 'MFA authentication failed');
			}

			const authData = authResponse.data;

			if (authData.requiresChallenge && authData.challengeData) {
				// Handle challenge-based authentication (OTP, Push, Biometric)
				console.log('[🔐 MFA-AUTHENTICATION] Challenge required:', authData.challengeData.type);

				// TODO: Implement proper challenge UI based on challenge type
				// For now, we'll show a message indicating challenge is required
				setError(`Challenge required: ${authData.challengeData.message}`);

				// In a real implementation, you would:
				// 1. Show appropriate challenge UI (OTP input, push notification waiting, biometric prompt)
				// 2. Collect user response
				// 3. Call completeAuthentication with the actual response

				// For demo purposes, we'll simulate successful challenge completion
				setTimeout(async () => {
					try {
						const completeResponse = await MFAAuthenticationService.completeAuthentication(
							userContext,
							selectedDevice,
							'challenge-completed', // This would come from user input
							mfaCredentials
						);

						if (!completeResponse.success || !completeResponse.data) {
							throw new Error(completeResponse.error?.message || 'MFA completion failed');
						}

						setCurrentStep('complete');
						onComplete(completeResponse.data);
					} catch (completeErr) {
						const errorMessage =
							completeErr instanceof Error ? completeErr.message : 'MFA completion failed';
						setError(errorMessage);

						const portalError: PortalError = {
							code: 'MFA_COMPLETION_FAILED',
							message: errorMessage,
							recoverable: true,
							suggestedAction: 'Please try again',
						};
						onError(portalError);
					}
				}, 3000);
			} else if (authData.tokens) {
				// Direct authentication without challenge
				setCurrentStep('complete');
				onComplete(authData.tokens);
			} else {
				throw new Error('Authentication completed but no tokens received');
			}
		} catch (err) {
			console.error('[🔐 MFA-AUTHENTICATION] Authentication failed:', err);

			const errorMessage = err instanceof Error ? err.message : 'MFA authentication failed';
			setError(errorMessage);

			const portalError: PortalError = {
				code: 'MFA_AUTHENTICATION_FAILED',
				message: errorMessage,
				recoverable: true,
				suggestedAction: 'Please try again or contact support',
			};

			onError(portalError);
		} finally {
			setIsLoading(false);
		}
	}, [selectedDevice, userContext, mfaCredentials, loginContext, onComplete, onError]);

	const getDeviceIcon = (deviceType: string) => {
		switch (deviceType) {
			case 'SMS':
				return <FiSmartphone />;
			case 'EMAIL':
				return <FiMail />;
			case 'TOTP':
				return <FiKey />;
			case 'FIDO2':
				return <FiLock />;
			default:
				return <FiShield />;
		}
	};

	// ============================================================================
	// EFFECTS
	// ============================================================================

	useEffect(() => {
		console.log('[🔐 MFA-AUTHENTICATION] MFA flow initialized', {
			userId: userContext.id,
			riskLevel: riskEvaluation.result.level,
			mfaCredentials: !!mfaCredentials,
		});

		loadDevices();
	}, [loadDevices, userContext.id, riskEvaluation.result.level, mfaCredentials]);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<>
			<CompanyLogoHeader size="small" />
			<MFAContainer>
				<MFATitle>Multi-Factor Authentication</MFATitle>
				<MFADescription>Additional verification is required to protect your account</MFADescription>

				{/* Risk Warning */}
				<RiskWarning>
					<WarningIcon>
						<FiAlertTriangle />
					</WarningIcon>
					<WarningContent>
						<WarningTitle>Medium Risk Detected</WarningTitle>
						<WarningText>
							Your login attempt shows some unusual patterns. For your security, we require additional
							verification before proceeding.
						</WarningText>
					</WarningContent>
				</RiskWarning>

			{error && (
				<ErrorMessage>
					<FiAlertTriangle />
					{error}
				</ErrorMessage>
			)}

			{/* Loading State */}
			{currentStep === 'loading' && (
				<LoadingContainer>
					<LoadingSpinner />
					<LoadingText>Loading your authentication devices...</LoadingText>
				</LoadingContainer>
			)}

			{/* Device Selection */}
			{currentStep === 'device-selection' && (
				<DeviceSelectionContainer>
					<DeviceSelectionTitle>Select Authentication Method</DeviceSelectionTitle>

					{availableDevices.length > 0 ? (
						<>
							<DeviceGrid>
								{availableDevices.map((device) => (
									<DeviceCard
										key={device.id}
										selected={selectedDevice?.id === device.id}
										onClick={() => handleDeviceSelect(device)}
										disabled={isLoading}
									>
										<DeviceIcon deviceType={device.type}>{getDeviceIcon(device.type)}</DeviceIcon>
										<DeviceName>{device.name}</DeviceName>
										<DeviceStatus>
											{device.type} • {device.status.toLowerCase()}
										</DeviceStatus>
									</DeviceCard>
								))}
							</DeviceGrid>

							<button
								type="button"
								onClick={handleAuthenticate}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleAuthenticate();
									}
								}}
								disabled={!selectedDevice || isLoading}
								style={{
									width: '100%',
									maxWidth: '300px',
									padding: '1rem 2rem',
									background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
									color: 'white',
									border: 'none',
									borderRadius: '0.5rem',
									fontSize: '1.125rem',
									fontWeight: '600',
									cursor: isLoading || !selectedDevice ? 'not-allowed' : 'pointer',
									transition: 'all 0.2s ease',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
									margin: '0 auto',
								}}
							>
								{isLoading ? (
									<>
										<LoadingSpinner />
										Authenticating...
									</>
								) : (
									<>
										<FiShield />
										Authenticate with {selectedDevice?.name || 'Selected Device'}
									</>
								)}
							</button>
						</>
					) : (
						<NoDevicesMessage>
							<FiShield style={{ fontSize: '2rem', marginBottom: '1rem', color: '#9ca3af' }} />
							<p>No authentication devices found</p>
							<p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
								Please register an MFA device first
							</p>
						</NoDevicesMessage>
					)}
				</DeviceSelectionContainer>
			)}

			{/* Authenticating State */}
			{currentStep === 'authenticating' && (
				<LoadingContainer>
					<LoadingSpinner />
					<LoadingText>Authenticating with {selectedDevice?.name}...</LoadingText>
					<p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
						Please follow the instructions on your device
					</p>
				</LoadingContainer>
			)}

			{/* Educational Section */}
			<EducationalSection>
				<EducationalHeader>
					<FiShield style={{ color: '#3b82f6' }} />
					<EducationalTitle>{educationalContent.title}</EducationalTitle>
				</EducationalHeader>

				<EducationalDescription>{educationalContent.description}</EducationalDescription>

				<KeyPoints>
					{educationalContent.keyPoints.map((point, index) => (
						<KeyPoint key={index}>
							<KeyPointIcon />
							{point}
						</KeyPoint>
					))}
				</KeyPoints>
			</EducationalSection>
		</MFAContainer>
		</>
	);
};

export default MFAAuthenticationFlow;
