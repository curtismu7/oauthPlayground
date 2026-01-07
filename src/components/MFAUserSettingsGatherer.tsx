// src/components/MFAUserSettingsGatherer.tsx
// Modern MFA User Settings Component with username input and MFA policy selection

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiChevronDown,
	FiKey,
	FiLock,
	FiMail,
	FiMessageSquare,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiUser,
} from 'react-icons/fi';
import styled from 'styled-components';
import { ClientCredentialsTokenRequest } from '../services/clientCredentialsSharedService';
import { workerTokenCredentialsService } from '../services/workerTokenCredentialsService';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Types
interface MFAUserSettings {
	username: string;
	mfaPolicy: string;
	deviceCreationMode: 'active' | 'authentication_required';
}

interface MFAPolicyOption {
	id: string;
	name: string;
	description: string;
	icon: React.ReactNode;
	devices: string[];
	requiresWorkerToken: boolean;
}

interface Props {
	onSettingsChange: (settings: MFAUserSettings) => void;
	onWorkerTokenObtained: (token: string) => void;
	initialSettings?: Partial<MFAUserSettings>;
	className?: string;
}

// Styled Components
const Container = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormInput = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled.button<{ $isOpen: boolean; $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid ${(props) => (props.$hasError ? '#ef4444' : '#e5e7eb')};
  border-radius: 0.5rem;
  background: #ffffff;
  font-size: 0.875rem;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  ${(props) =>
		props.$isOpen &&
		`
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  `}
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
  transform: translateY(${(props) => (props.$isOpen ? '0' : '-10px')});
  transition: all 0.2s ease;
`;

const DropdownItem = styled.div<{ $selected?: boolean }>`
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }

  ${(props) =>
		props.$selected &&
		`
    background: #eff6ff;
    border-left: 3px solid #3b82f6;
  `}
`;

const ItemContent = styled.div`
  flex: 1;
`;

const ItemTitle = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ItemDescription = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
`;

const DeviceTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const DeviceTag = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
`;

const WorkerTokenSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const WorkerTokenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const WorkerTokenTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WorkerTokenStatus = styled.div<{ $hasToken: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(props) => (props.$hasToken ? '#059669' : '#d97706')};
`;

const WorkerTokenActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${(props) => (props.$variant === 'primary' ? '#3b82f6' : '#d1d5db')};
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$variant === 'primary' ? '#3b82f6' : '#ffffff')};
  color: ${(props) => (props.$variant === 'primary' ? '#ffffff' : '#374151')};

  &:hover:not(:disabled) {
    background: ${(props) => (props.$variant === 'primary' ? '#2563eb' : '#f9fafb')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeviceCreationSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const DeviceCreationOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
`;

const DeviceCreationCard = styled.div<{ $selected?: boolean }>`
  border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#e5e7eb')};
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$selected ? '#eff6ff' : '#ffffff')};

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
`;

const DeviceCreationTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DeviceCreationDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// MFA Policy Options
const MFA_POLICY_OPTIONS: MFAPolicyOption[] = [
	{
		id: 'mfa-sms-email',
		name: 'SMS & Email MFA',
		description: 'Send verification codes via SMS and email for flexible authentication',
		icon: <FiMessageSquare />,
		devices: ['SMS', 'EMAIL'],
		requiresWorkerToken: true,
	},
	{
		id: 'mfa-totp',
		name: 'TOTP Authenticator',
		description: 'Time-based One-Time Password using authenticator apps',
		icon: <FiSmartphone />,
		devices: ['TOTP'],
		requiresWorkerToken: true,
	},
	{
		id: 'mfa-voice',
		name: 'Voice Call MFA',
		description: 'Receive verification codes through automated voice calls',
		icon: <FiLock />,
		devices: ['VOICE'],
		requiresWorkerToken: true,
	},
	{
		id: 'mfa-comprehensive',
		name: 'Comprehensive MFA',
		description: 'Multiple MFA methods including SMS, Email, TOTP, and Voice',
		icon: <FiShield />,
		devices: ['SMS', 'EMAIL', 'TOTP', 'VOICE'],
		requiresWorkerToken: true,
	},
];

export const MFAUserSettingsGatherer: React.FC<Props> = ({
	onSettingsChange,
	onWorkerTokenObtained,
	initialSettings = {},
	className,
}) => {
	const [settings, setSettings] = useState<MFAUserSettings>({
		username: initialSettings.username || '',
		mfaPolicy: initialSettings.mfaPolicy || '',
		deviceCreationMode: initialSettings.deviceCreationMode || 'authentication_required',
	});

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isGettingWorkerToken, setIsGettingWorkerToken] = useState(false);
	const [workerToken, setWorkerToken] = useState<string>('');
	const [errors, setErrors] = useState<Partial<Record<keyof MFAUserSettings, string>>>({});

	// Load worker token credentials
	const [workerTokenCredentials, setWorkerTokenCredentials] = useState(
		workerTokenCredentialsService.getDefaultCredentials()
	);

	useEffect(() => {
		const savedCredentials = workerTokenCredentialsService.loadCredentials();
		if (savedCredentials) {
			setWorkerTokenCredentials(savedCredentials);
		}
	}, []);

	// Update parent component when settings change
	useEffect(() => {
		onSettingsChange(settings);
	}, [settings, onSettingsChange]);

	// Validate settings
	const validateSettings = useCallback(() => {
		const newErrors: Partial<Record<keyof MFAUserSettings, string>> = {};

		if (!settings.username.trim()) {
			newErrors.username = 'Username is required';
		}

		if (!settings.mfaPolicy) {
			newErrors.mfaPolicy = 'MFA policy selection is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [settings]);

	// Handle username change
	const handleUsernameChange = useCallback(
		(value: string) => {
			setSettings((prev) => ({ ...prev, username: value }));
			if (errors.username) {
				setErrors((prev) => ({ ...prev, username: undefined }));
			}
		},
		[errors.username]
	);

	// Handle MFA policy selection
	const handlePolicySelect = useCallback(
		(policyId: string) => {
			const selectedPolicy = MFA_POLICY_OPTIONS.find((p) => p.id === policyId);
			if (selectedPolicy) {
				setSettings((prev) => ({ ...prev, mfaPolicy: policyId }));
				setIsDropdownOpen(false);
				if (errors.mfaPolicy) {
					setErrors((prev) => ({ ...prev, mfaPolicy: undefined }));
				}
			}
		},
		[errors.mfaPolicy]
	);

	// Handle device creation mode change
	const handleDeviceCreationModeChange = useCallback(
		(mode: 'active' | 'authentication_required') => {
			setSettings((prev) => ({ ...prev, deviceCreationMode: mode }));
		},
		[]
	);

	// Get worker token
	const handleGetWorkerToken = useCallback(async () => {
		if (
			!workerTokenCredentials.environmentId ||
			!workerTokenCredentials.clientId ||
			!workerTokenCredentials.clientSecret
		) {
			v4ToastManager.showError(
				'Please configure worker token credentials (Environment ID, Client ID, and Client Secret)'
			);
			return;
		}

		setIsGettingWorkerToken(true);
		try {
			const tokenData = await ClientCredentialsTokenRequest.executeTokenRequest(
				{
					environmentId: workerTokenCredentials.environmentId,
					clientId: workerTokenCredentials.clientId,
					clientSecret: workerTokenCredentials.clientSecret,
					scope: 'p1:read:user p1:update:user p1:read:device p1:update:device p1:create:device',
					tokenEndpoint: `https://auth.pingone.com/${workerTokenCredentials.environmentId}/as/token`,
				},
				'client_secret_post'
			);

			setWorkerToken(tokenData.access_token);
			onWorkerTokenObtained(tokenData.access_token);
			v4ToastManager.showSuccess('Worker token obtained successfully!');
		} catch (error) {
			console.error('Failed to get worker token:', error);
			v4ToastManager.showError('Failed to obtain worker token. Please check your credentials.');
		} finally {
			setIsGettingWorkerToken(false);
		}
	}, [workerTokenCredentials, onWorkerTokenObtained]);

	// Get selected policy
	const selectedPolicy = MFA_POLICY_OPTIONS.find((p) => p.id === settings.mfaPolicy);

	return (
		<Container className={className}>
			<SectionTitle>
				<FiUser />
				MFA User Configuration
			</SectionTitle>

			<FormGrid>
				{/* Username Input */}
				<FormGroup>
					<FormLabel>
						<FiUser />
						Username
					</FormLabel>
					<FormInput
						type="text"
						placeholder="Enter username for MFA authentication"
						value={settings.username}
						onChange={(e) => handleUsernameChange(e.target.value)}
						onBlur={validateSettings}
						$hasError={!!errors.username}
					/>
					{errors.username && (
						<ErrorMessage>
							<FiAlertCircle />
							{errors.username}
						</ErrorMessage>
					)}
				</FormGroup>

				{/* MFA Policy Dropdown */}
				<FormGroup>
					<FormLabel>
						<FiShield />
						MFA Policy
					</FormLabel>
					<DropdownContainer>
						<DropdownButton
							type="button"
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							$isOpen={isDropdownOpen}
							$hasError={!!errors.mfaPolicy}
						>
							<span>
								{selectedPolicy ? (
									<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										{selectedPolicy.icon}
										{selectedPolicy.name}
									</span>
								) : (
									'Select MFA Policy'
								)}
							</span>
							<FiChevronDown
								style={{
									transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
									transition: 'transform 0.2s ease',
								}}
							/>
						</DropdownButton>

						<DropdownMenu $isOpen={isDropdownOpen}>
							{MFA_POLICY_OPTIONS.map((policy) => (
								<DropdownItem
									key={policy.id}
									onClick={() => handlePolicySelect(policy.id)}
									$selected={settings.mfaPolicy === policy.id}
								>
									<div style={{ marginTop: '0.25rem' }}>{policy.icon}</div>
									<ItemContent>
										<ItemTitle>
											{policy.name}
											{settings.mfaPolicy === policy.id && <FiCheck color="#3b82f6" />}
										</ItemTitle>
										<ItemDescription>{policy.description}</ItemDescription>
										<DeviceTags>
											{policy.devices.map((device) => (
												<DeviceTag key={device}>{device}</DeviceTag>
											))}
										</DeviceTags>
									</ItemContent>
								</DropdownItem>
							))}
						</DropdownMenu>
					</DropdownContainer>
					{errors.mfaPolicy && (
						<ErrorMessage>
							<FiAlertCircle />
							{errors.mfaPolicy}
						</ErrorMessage>
					)}
				</FormGroup>
			</FormGrid>

			{/* Worker Token Section */}
			{selectedPolicy?.requiresWorkerToken && (
				<WorkerTokenSection>
					<WorkerTokenHeader>
						<WorkerTokenTitle>
							<FiKey />
							Worker Token Required
						</WorkerTokenTitle>
						<WorkerTokenStatus $hasToken={!!workerToken}>
							{workerToken ? <FiCheck /> : <FiAlertCircle />}
							{workerToken ? 'Token Available' : 'Token Needed'}
						</WorkerTokenStatus>
					</WorkerTokenHeader>

					<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
						This MFA policy requires a worker token to manage devices and policies. The worker token
						allows administrative operations on PingOne MFA services.
					</div>

					<WorkerTokenActions>
						<ActionButton
							$variant="primary"
							onClick={handleGetWorkerToken}
							disabled={isGettingWorkerToken}
						>
							{isGettingWorkerToken ? <LoadingSpinner /> : <FiKey />}
							{workerToken ? 'Refresh Worker Token' : 'Get Worker Token'}
						</ActionButton>

						{workerToken && (
							<ActionButton
								onClick={() => {
									navigator.clipboard.writeText(workerToken);
									v4ToastManager.showSuccess('Worker token copied to clipboard');
								}}
							>
								<FiCheck />
								Copy Token
							</ActionButton>
						)}
					</WorkerTokenActions>

					{workerTokenCredentials.environmentId && (
						<div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
							Using Environment: {workerTokenCredentials.environmentId}
						</div>
					)}
				</WorkerTokenSection>
			)}

			{/* Device Creation Options */}
			<DeviceCreationSection>
				<SectionTitle style={{ marginBottom: '1rem' }}>
					<FiSettings />
					Device Registration Method
				</SectionTitle>

				<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
					Choose how MFA devices should be registered for users
				</div>

				<DeviceCreationOptions>
					<DeviceCreationCard
						$selected={settings.deviceCreationMode === 'active'}
						onClick={() => handleDeviceCreationModeChange('active')}
					>
						<DeviceCreationTitle>
							<FiCheck />
							Active Registration
						</DeviceCreationTitle>
						<DeviceCreationDescription>
							Admin creates devices immediately without user verification. Suitable for
							corporate-managed devices and controlled environments.
						</DeviceCreationDescription>
					</DeviceCreationCard>

					<DeviceCreationCard
						$selected={settings.deviceCreationMode === 'authentication_required'}
						onClick={() => handleDeviceCreationModeChange('authentication_required')}
					>
						<DeviceCreationTitle>
							<FiLock />
							Authentication Required
						</DeviceCreationTitle>
						<DeviceCreationDescription>
							Users complete device registration with OTP verification. More secure with user
							participation, ideal for BYOD scenarios.
						</DeviceCreationDescription>
					</DeviceCreationCard>
				</DeviceCreationOptions>
			</DeviceCreationSection>
		</Container>
	);
};

export default MFAUserSettingsGatherer;
