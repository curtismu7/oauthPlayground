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
import MFAAuthenticationService from '../services/mfaAuthenticationService';
import type {
	EducationalContent,
	MFADevice,
	PortalError,
	RiskEvaluationResult,
	TokenSet,
	UserContext,
} from '../types/protectPortal.types';
import CompanyLogoHeader from './CompanyLogoHeader';

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

const _DeviceSelectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--brand-text);
  margin: 0 0 1.5rem 0;
  font-family: var(--brand-heading-font);
`;

const _DeviceGrid = styled.div`
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

const _DeviceStatus = styled.div`
  font-size: 0.75rem;
  color: var(--brand-text-secondary);
  font-family: var(--brand-body-font);
`;

const _NoDevicesMessage = styled.div`
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

const _LoadingSpinner = styled(FiLoader)`
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

	const [challengeData, setChallengeData] = useState<{
		type: string;
		message: string;
		timeout?: number;
	} | null>(null);
	const [otpValue, setOtpValue] = useState('');

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

			// If no devices found, show registration option
			if (devicesResponse.data.devices.length === 0) {
				console.log('[🔐 MFA-AUTHENTICATION] No MFA devices found - user needs to register device');
				setError('No MFA devices registered. Please register an MFA device first.');
			} else {
				console.log('[🔐 MFA-AUTHENTICATION] Loaded devices:', devicesResponse.data.devices.length);
			}
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

	const handleOtpSubmit = useCallback(async () => {
		if (!otpValue.trim()) {
			setError('Please enter the OTP code');
			return;
		}

		if (!selectedDevice) {
			setError('No device selected');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			console.log('[🔐 MFA-AUTHENTICATION] Submitting OTP code for device:', selectedDevice.id);

			const completeResponse = await MFAAuthenticationService.completeAuthentication(
				userContext,
				selectedDevice,
				otpValue.trim(),
				mfaCredentials
			);

			if (!completeResponse.success || !completeResponse.data) {
				throw new Error(completeResponse.error?.message || 'MFA completion failed');
			}

			setCurrentStep('complete');
			onComplete(completeResponse.data);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
			setError(errorMessage);

			const portalError: PortalError = {
				code: 'OTP_VERIFICATION_FAILED',
				message: errorMessage,
				recoverable: true,
				suggestedAction: 'Please check your OTP code and try again',
			};
			onError(portalError);
		} finally {
			setIsLoading(false);
		}
	}, [otpValue, selectedDevice, userContext, mfaCredentials, onComplete, onError]);

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
				{
					flowSubtype: 'MFA_AUTHENTICATION',
					origin: window.location.origin,
					timestamp: new Date().toISOString(),
				}
			);

			if (!authResponse.success || !authResponse.data) {
				throw new Error(authResponse.error?.message || 'MFA authentication failed');
			}

			const authData = authResponse.data;

			if (authData.requiresChallenge && authData.challengeData) {
				// Handle challenge-based authentication (OTP, Push, Biometric)
				console.log('[🔐 MFA-AUTHENTICATION] Challenge required:', authData.challengeData.type);

				// Set challenge data to show OTP input UI
				setChallengeData({
					type: authData.challengeData.type,
					message: authData.challengeData.message || 'Please enter the code sent to your device',
					timeout: authData.challengeData.timeout || undefined,
				});

				// Set step to authenticating to show OTP input
				setCurrentStep('authenticating');
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
	}, [selectedDevice, userContext, mfaCredentials, onError]);

	const handleStartRegistration = useCallback(() => {
		// Redirect to MFA registration or show registration modal
		// For now, we'll show an alert with instructions
		alert(
			'MFA Registration: Please visit the MFA registration page to set up your authentication devices.'
		);
	}, []);

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
				<MFADescription>
					For your security, we need to verify your identity using an additional authentication
					method.
				</MFADescription>

				{/* Risk Warning */}
				{!challengeData && (
					<RiskWarning>
						<WarningIcon>
							<FiAlertTriangle />
						</WarningIcon>
						<WarningContent>
							<WarningTitle>Medium Risk Detected</WarningTitle>
							<WarningText>
								Your login attempt shows some unusual patterns. For your security, we require
								additional verification before proceeding.
							</WarningText>
						</WarningContent>
					</RiskWarning>
				)}

				{/* Challenge Warning */}
				{challengeData && (
					<RiskWarning>
						<WarningIcon>
							<FiAlertTriangle />
						</WarningIcon>
						<WarningContent>
							<WarningTitle>Verification Required</WarningTitle>
							<WarningText>{challengeData.message}</WarningText>
						</WarningContent>
					</RiskWarning>
				)}

				{/* OTP Input Form */}
				{challengeData && (
					<div style={{ marginTop: '2rem' }}>
						<InputLabel htmlFor="otp-input">Enter OTP Code</InputLabel>
						<InputGroup>
							<StyledInput
								id="otp-input"
								type="text"
								value={otpValue}
								onChange={(e) => setOtpValue(e.target.value)}
								placeholder="Enter the code from your device"
								maxLength={10}
								autoFocus
								required
								disabled={isLoading}
							/>
						</InputGroup>

						<ActionButton
							onClick={handleOtpSubmit}
							disabled={isLoading || !otpValue.trim()}
							style={{ marginTop: '1rem', width: '100%' }}
						>
							{isLoading ? (
								<>
									<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
									Verifying...
								</>
							) : (
								<>
									<FiCheckCircle />
									Verify Code
								</>
							)}
						</ActionButton>
					</div>
				)}

				{/* Device Selection */}
				{currentStep === 'device-selection' && availableDevices.length > 0 && !challengeData && (
					<>
						<MFATitle style={{ fontSize: '1.5rem', marginTop: '2rem' }}>
							Select Authentication Method
						</MFATitle>

						<DeviceSelectionContainer>
							{availableDevices.map((device) => (
								<DeviceCard
									key={device.id}
									onClick={() => handleDeviceSelect(device)}
									$isSelected={selectedDevice?.id === device.id}
								>
									<DeviceIcon>{getDeviceIcon(device.type)}</DeviceIcon>
									<DeviceInfo>
										<DeviceName>{device.name || `${device.type} Device`}</DeviceName>
										<DeviceType>
											{device.type} • {device.status}
										</DeviceType>
									</DeviceInfo>
									{selectedDevice?.id === device.id && (
										<FiCheckCircle
											style={{
												color: 'var(--brand-primary)',
												fontSize: '1.25rem',
												marginLeft: 'auto',
											}}
										/>
									)}
								</DeviceCard>
							))}
						</DeviceSelectionContainer>

						{selectedDevice && (
							<ActionButton
								onClick={handleAuthenticate}
								disabled={isLoading}
								style={{ marginTop: '2rem', width: '100%' }}
							>
								{isLoading ? (
									<>
										<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
										Authenticating...
									</>
								) : (
									<>
										<FiLock />
										Authenticate
									</>
								)}
							</ActionButton>
						)}
					</>
				)}

				{/* No Devices Found - Registration Required */}
				{currentStep === 'device-selection' && availableDevices.length === 0 && !challengeData && (
					<div
						style={{
							textAlign: 'center',
							padding: '2rem',
							background: 'var(--brand-surface)',
							borderRadius: 'var(--brand-radius-lg)',
							border: '1px solid var(--brand-primary)',
							marginTop: '2rem',
						}}
					>
						<FiAlertTriangle
							style={{
								fontSize: '3rem',
								color: 'var(--brand-warning)',
								marginBottom: '1rem',
							}}
						/>
						<h3 style={{ color: 'var(--brand-text)', marginBottom: '1rem' }}>
							No MFA Devices Registered
						</h3>
						<p style={{ color: 'var(--brand-text-secondary)', marginBottom: '2rem' }}>
							You need to register an MFA device before you can authenticate. Please visit the MFA
							registration page to set up your authentication method.
						</p>
						<ActionButton onClick={handleStartRegistration}>
							<FiShield />
							Register MFA Device
						</ActionButton>
					</div>
				)}

				{/* Loading State */}
				{currentStep === 'loading' && (
					<LoadingContainer>
						<FiLoader
							style={{
								fontSize: '2rem',
								color: 'var(--brand-primary)',
								animation: 'spin 1s linear infinite',
							}}
						/>
						<LoadingText>Loading MFA devices...</LoadingText>
					</LoadingContainer>
				)}

				{/* Authenticating State */}
				{currentStep === 'authenticating' && !challengeData && (
					<LoadingContainer>
						<FiLoader
							style={{
								fontSize: '2rem',
								color: 'var(--brand-primary)',
								animation: 'spin 1s linear infinite',
							}}
						/>
						<LoadingText>Authenticating...</LoadingText>
					</LoadingContainer>
				)}

				{/* Complete State */}
				{currentStep === 'complete' && (
					<SuccessContainer>
						<FiCheckCircle
							style={{
								fontSize: '3rem',
								color: 'var(--brand-success)',
								marginBottom: '1rem',
							}}
						/>
						<SuccessTitle>Authentication Successful</SuccessTitle>
						<SuccessText>
							You have been successfully authenticated. Proceeding to the secure portal.
						</SuccessText>
					</SuccessContainer>
				)}

				{error && !challengeData && (
					<ErrorMessage>
						<FiAlertTriangle />
						{error}
					</ErrorMessage>
				)}
			</MFAContainer>

			{/* Educational Content */}
			<EducationalSection>
				<EducationalHeader>
					<EducationalTitle>
						<FiBook />
						Multi-Factor Authentication
					</EducationalTitle>
				</EducationalHeader>

				<EducationalDescription>
					MFA adds an extra layer of security by requiring additional verification beyond just your
					password. This helps protect against unauthorized access even if your password is
					compromised.
				</EducationalDescription>

				<KeyPoints>
					<KeyPoint>
						<KeyPointIcon />
						<span>
							<strong>Enhanced Security:</strong> MFA significantly reduces the risk of unauthorized
							access
						</span>
					</KeyPoint>
					<KeyPoint>
						<KeyPointIcon />
						<span>
							<strong>Multiple Methods:</strong> Choose from SMS, email, authenticator apps, or
							hardware keys
						</span>
					</KeyPoint>
					<KeyPoint>
						<KeyPointIcon />
						<span>
							<strong>Convenient:</strong> Modern MFA methods are quick and easy to use
						</span>
					</KeyPoint>
				</KeyPoints>
			</EducationalSection>
		</>
	);
};

export default MFAAuthenticationFlow;
