/**
 * @file MFAAuthenticationFlow.PingUI.tsx
 * @module protect-portal/components
 * @description Ping UI migrated MFA authentication flow component
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component handles MFA authentication for medium risk evaluations,
 * including device selection and authentication methods.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React, { useCallback, useEffect, useState } from 'react';
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

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiCheckCircle: 'mdi-check-circle',
		FiKey: 'mdi-key',
		FiLoader: 'mdi-loading',
		FiLock: 'mdi-lock',
		FiMail: 'mdi-email',
		FiShield: 'mdi-shield',
		FiSmartphone: 'mdi-cellphone',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

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
  color: var(--ping-text-primary, #1e293b);
  margin: 0 0 var(--ping-spacing-md, 1rem) 0;
  font-family: var(--ping-font-family-heading, 'Inter', sans-serif);
`;

const MFASubtitle = styled.p`
  font-size: 1.125rem;
  color: var(--ping-text-secondary, #64748b);
  margin: 0 0 var(--ping-spacing-xl, 2rem) 0;
  line-height: 1.6;
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--ping-spacing-md, 1rem);
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const DeviceCard = styled.div<{ $selected?: boolean; $disabled?: boolean }>`
  background: ${({ $selected }) =>
		$selected ? 'var(--ping-primary-light, #dbeafe)' : 'var(--ping-surface-primary, white)'};
  border: 2px solid ${({ $selected }) =>
		$selected ? 'var(--ping-primary-color, #3b82f6)' : 'var(--ping-border-default, #e2e8f0)'};
  border-radius: var(--ping-border-radius-lg, 12px);
  padding: var(--ping-spacing-lg, 1.5rem);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover {
    ${({ $disabled }) =>
			!$disabled &&
			`
      transform: translateY(-2px);
      box-shadow: var(--ping-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
      border-color: var(--ping-primary-color, #3b82f6);
    `}
  }
`;

const DeviceIcon = styled.div<{ $deviceType: string }>`
  font-size: 2.5rem;
  margin-bottom: var(--ping-spacing-md, 1rem);
  color: ${({ $deviceType }) => {
		switch ($deviceType) {
			case 'mobile':
				return 'var(--ping-success-color, #10b981)';
			case 'email':
				return 'var(--ping-info-color, #3b82f6)';
			case 'hardware':
				return 'var(--ping-warning-color, #f59e0b)';
			default:
				return 'var(--ping-text-primary, #1e293b)';
		}
	}};
`;

const DeviceName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ping-text-primary, #1e293b);
  margin: 0 0 var(--ping-spacing-xs, 0.5rem) 0;
`;

const DeviceDescription = styled.p`
  font-size: 0.875rem;
  color: var(--ping-text-secondary, #64748b);
  margin: 0;
  line-height: 1.4;
`;

const AuthenticationForm = styled.div`
  background: var(--ping-surface-primary, white);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  border-radius: var(--ping-border-radius-lg, 12px);
  padding: var(--ping-spacing-xl, 2rem);
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const FormTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ping-text-primary, #1e293b);
  margin: 0 0 var(--ping-spacing-lg, 1.5rem) 0;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const InputGroup = styled.div`
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ping-text-primary, #1e293b);
  margin-bottom: var(--ping-spacing-xs, 0.5rem);
`;

const Input = styled.input`
  width: 100%;
  padding: var(--ping-spacing-md, 1rem);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 1rem;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--ping-primary-color, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--ping-spacing-md, 1rem);
  justify-content: center;
`;

const PrimaryButton = styled.button`
  background: var(--ping-primary-color, #3b82f6);
  color: white;
  border: none;
  padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);

  &:hover {
    background: var(--ping-primary-hover, #2563eb);
    transform: translateY(-1px);
  }

  &:disabled {
    background: var(--ping-border-default, #e2e8f0);
    color: var(--ping-text-secondary, #64748b);
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: var(--ping-text-primary, #1e293b);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

  &:hover {
    background: var(--ping-surface-secondary, #f8fafc);
    border-color: var(--ping-primary-color, #3b82f6);
    color: var(--ping-primary-color, #3b82f6);
  }
`;

const AlertBox = styled.div<{ $type: 'warning' | 'error' | 'success' | 'info' }>`
  background: ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return 'var(--ping-warning-light, #fef3c7)';
			case 'error':
				return 'var(--ping-error-light, #fef2f2)';
			case 'success':
				return 'var(--ping-success-light, #d1fae5)';
			case 'info':
				return 'var(--ping-info-light, #dbeafe)';
			default:
				return 'var(--ping-surface-secondary, #f8fafc)';
		}
	}};
  border: 1px solid ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return 'var(--ping-warning-color, #f59e0b)';
			case 'error':
				return 'var(--ping-error-color, #ef4444)';
			case 'success':
				return 'var(--ping-success-color, #10b981)';
			case 'info':
				return 'var(--ping-info-color, #3b82f6)';
			default:
				return 'var(--ping-border-default, #e2e8f0)';
		}
	}};
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-md, 1rem);
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
  display: flex;
  align-items: flex-start;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const AlertText = styled.div`
  color: ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return 'var(--ping-warning-dark, #92400e)';
			case 'error':
				return 'var(--ping-error-dark, #991b1b)';
			case 'success':
				return 'var(--ping-success-dark, #065f46)';
			case 'info':
				return 'var(--ping-info-dark, #1e40af)';
			default:
				return 'var(--ping-text-primary, #1e293b)';
		}
	}};
  font-size: 0.875rem;
  line-height: 1.5;
  flex: 1;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--ping-border-default, #e2e8f0);
  border-top: 2px solid var(--ping-primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: var(--ping-spacing-xs, 0.5rem);

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const _EducationalContentSection = styled.div`
  background: var(--ping-info-light, #dbeafe);
  border: 1px solid var(--ping-info-color, #3b82f6);
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-lg, 1.5rem);
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const EducationalTitle = styled.h4`
  color: var(--ping-info-dark, #1e40af);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--ping-spacing-sm, 0.75rem) 0;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.5rem);
`;

const EducationalText = styled.div`
  color: var(--ping-info-dark, #1e40af);
  font-size: 0.875rem;
  line-height: 1.5;
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface MFAAuthenticationFlowPingUIProps {
	userContext: UserContext;
	riskEvaluation: RiskEvaluationResult;
	onAuthenticationSuccess: (tokenSet: TokenSet) => void;
	onAuthenticationError: (error: PortalError) => void;
	onCancel: () => void;
	educationalContent?: EducationalContent;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MFAAuthenticationFlowPingUI: React.FC<MFAAuthenticationFlowPingUIProps> = ({
	userContext,
	riskEvaluation,
	onAuthenticationSuccess,
	onAuthenticationError,
	onCancel,
	educationalContent,
}) => {
	const [selectedDevice, setSelectedDevice] = useState<MFADevice | null>(null);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [authCode, setAuthCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [devices, setDevices] = useState<MFADevice[]>([]);

	// Load available devices
	useEffect(() => {
		const loadDevices = async () => {
			try {
				const availableDevices = await MFAAuthenticationService.getAvailableDevices(
					userContext.userId
				);
				setDevices(availableDevices);
			} catch (_err) {
				setError('Failed to load available devices');
			}
		};
		loadDevices();
	}, [userContext.userId]);

	const handleDeviceSelect = useCallback((device: MFADevice) => {
		if (device.status !== 'ACTIVE') return;
		setSelectedDevice(device);
		setError(null);
		setAuthCode('');
	}, []);

	const handleAuthenticate = useCallback(async () => {
		if (!selectedDevice || !authCode.trim()) {
			setError('Please select a device and enter authentication code');
			return;
		}

		setIsAuthenticating(true);
		setError(null);

		try {
			const tokenSet = await MFAAuthenticationService.authenticate(
				userContext.userId,
				selectedDevice.id,
				authCode.trim()
			);
			onAuthenticationSuccess(tokenSet);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
			setError(errorMessage);
			onAuthenticationError({ code: 'MFA_AUTH_FAILED', message: errorMessage });
		} finally {
			setIsAuthenticating(false);
		}
	}, [
		selectedDevice,
		authCode,
		userContext.userId,
		onAuthenticationSuccess,
		onAuthenticationError,
	]);

	const getDeviceIcon = (deviceType: string) => {
		switch (deviceType) {
			case 'mobile':
				return 'FiSmartphone';
			case 'email':
				return 'FiMail';
			case 'hardware':
				return 'FiKey';
			default:
				return 'FiShield';
		}
	};

	const getDeviceDescription = (device: MFADevice) => {
		switch (device.type) {
			case 'mobile':
				return `Use your mobile device (${device.platform}) to authenticate`;
			case 'email':
				return `Check your email (${device.email}) for authentication code`;
			case 'hardware':
				return `Use your hardware token (${device.model}) to generate code`;
			default:
				return 'Use this device to authenticate';
		}
	};

	return (
		<div className="end-user-nano">
			<MFAContainer>
				<CompanyLogoHeader />

				<MFATitle>Multi-Factor Authentication Required</MFATitle>
				<MFASubtitle>
					For your security, please verify your identity using one of your registered devices.
				</MFASubtitle>

				{educationalContent && (
					<EducationalContent>
						<EducationalTitle>
							<MDIIcon icon="FiShield" size={16} ariaLabel="Security Information" />
							{educationalContent.title}
						</EducationalTitle>
						<EducationalText>{educationalContent.content}</EducationalText>
					</EducationalContent>
				)}

				{error && (
					<AlertBox $type="error">
						<MDIIcon icon="FiAlertTriangle" size={20} ariaLabel="Error" />
						<AlertText $type="error">{error}</AlertText>
					</AlertBox>
				)}

				{!selectedDevice ? (
					<>
						<h3
							style={{
								textAlign: 'center',
								marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
								color: 'var(--ping-text-primary, #1e293b)',
							}}
						>
							Select Authentication Method
						</h3>
						<DeviceGrid>
							{devices.map((device) => (
								<DeviceCard
									key={device.id}
									$selected={selectedDevice?.id === device.id}
									$disabled={device.status !== 'ACTIVE'}
									onClick={() => handleDeviceSelect(device)}
								>
									<DeviceIcon $deviceType={device.type}>
										<MDIIcon
											icon={getDeviceIcon(device.type)}
											size={40}
											ariaLabel={`${device.type} device`}
										/>
									</DeviceIcon>
									<DeviceName>{device.name}</DeviceName>
									<DeviceDescription>{getDeviceDescription(device)}</DeviceDescription>
									{device.status !== 'ACTIVE' && (
										<div
											style={{
												marginTop: 'var(--ping-spacing-sm, 0.75rem)',
												fontSize: '0.75rem',
												color: 'var(--ping-warning-color, #f59e0b)',
												fontWeight: '500',
											}}
										>
											{device.status}
										</div>
									)}
								</DeviceCard>
							))}
						</DeviceGrid>
					</>
				) : (
					<AuthenticationForm>
						<FormTitle>
							<MDIIcon
								icon={getDeviceIcon(selectedDevice.type)}
								size={20}
								ariaLabel={selectedDevice.type}
							/>
							Authenticate with {selectedDevice.name}
						</FormTitle>

						<InputGroup>
							<InputLabel htmlFor="auth-code">Authentication Code</InputLabel>
							<Input
								id="auth-code"
								type="text"
								value={authCode}
								onChange={(e) => setAuthCode(e.target.value)}
								placeholder="Enter your authentication code"
								autoFocus
							/>
						</InputGroup>

						<ButtonGroup>
							<PrimaryButton
								onClick={handleAuthenticate}
								disabled={isAuthenticating || !authCode.trim()}
							>
								{isAuthenticating ? (
									<LoadingSpinner />
								) : (
									<MDIIcon icon="FiLock" size={16} ariaLabel="Authenticate" />
								)}
								{isAuthenticating ? 'Authenticating...' : 'Authenticate'}
							</PrimaryButton>
							<SecondaryButton onClick={() => setSelectedDevice(null)} disabled={isAuthenticating}>
								Back to Devices
							</SecondaryButton>
						</ButtonGroup>

						<div style={{ marginTop: 'var(--ping-spacing-lg, 1.5rem)' }}>
							<SecondaryButton
								onClick={onCancel}
								disabled={isAuthenticating}
								style={{ width: '100%' }}
							>
								Cancel Authentication
							</SecondaryButton>
						</div>
					</AuthenticationForm>
				)}
			</MFAContainer>
		</div>
	);
};

export default MFAAuthenticationFlowPingUI;
