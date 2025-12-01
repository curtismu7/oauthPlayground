/**
 * @file MFAConfigurationPageV8.tsx
 * @module v8/flows
 * @description MFA Configuration Page for managing MFA-specific settings
 * @version 8.0.0
 * @since 2025-01-XX
 */

import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiRefreshCw, FiDownload, FiUpload, FiInfo } from 'react-icons/fi';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import {
	MFAConfigurationServiceV8,
	type MFAConfiguration,
} from '@/v8/services/mfaConfigurationServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { ApiDisplayCheckbox, SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

const MODULE_TAG = '[⚙️ MFA-CONFIG-PAGE-V8]';

export const MFAConfigurationPageV8: React.FC = () => {
	const [config, setConfig] = useState<MFAConfiguration>(() => MFAConfigurationServiceV8.loadConfiguration());
	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(apiDisplayServiceV8.isVisible());

	// Listen for configuration updates
	useEffect(() => {
		const handleConfigUpdate = (event: CustomEvent) => {
			setConfig(event.detail as MFAConfiguration);
			setHasChanges(false);
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	// Subscribe to API display visibility changes
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	const handleSave = () => {
		setIsSaving(true);
		try {
			MFAConfigurationServiceV8.saveConfiguration(config);
			setHasChanges(false);
			toastV8.success('MFA configuration saved successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save configuration`, error);
			toastV8.error('Failed to save configuration');
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = () => {
		if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
			MFAConfigurationServiceV8.resetToDefaults();
			setConfig(MFAConfigurationServiceV8.loadConfiguration());
			setHasChanges(false);
			toastV8.success('Configuration reset to defaults');
		}
	};

	const handleExport = () => {
		try {
			const json = MFAConfigurationServiceV8.exportConfiguration();
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `mfa-config-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toastV8.success('Configuration exported successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to export configuration`, error);
			toastV8.error('Failed to export configuration');
		}
	};

	const handleImport = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const json = event.target?.result as string;
					if (MFAConfigurationServiceV8.importConfiguration(json)) {
						setConfig(MFAConfigurationServiceV8.loadConfiguration());
						setHasChanges(false);
						toastV8.success('Configuration imported successfully');
					} else {
						toastV8.error('Failed to import configuration. Invalid format.');
					}
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to import configuration`, error);
					toastV8.error('Failed to import configuration');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	};

	const updateConfig = <K extends keyof MFAConfiguration>(key: K, value: MFAConfiguration[K]) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setHasChanges(true);
	};

	const updateNestedConfig = <
		K extends keyof MFAConfiguration,
		NK extends keyof MFAConfiguration[K],
	>(
		key: K,
		nestedKey: NK,
		value: MFAConfiguration[K][NK]
	) => {
		setConfig((prev) => ({
			...prev,
			[key]: { ...(prev[key] as any), [nestedKey]: value },
		}));
		setHasChanges(true);
	};

	return (
		<div style={{ 
			padding: '24px', 
			paddingBottom: isApiDisplayVisible ? '450px' : '24px',
			maxWidth: '1200px', 
			margin: '0 auto',
			transition: 'padding-bottom 0.3s ease',
		}}>
			<MFANavigationV8 currentPage="settings" showBackToMain={true} />
			
			{/* API Display Toggle - Top */}
			<div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
				<ApiDisplayCheckbox />
			</div>
			
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			{/* Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
					borderRadius: '12px',
					padding: '32px',
					marginBottom: '24px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: 'white' }}>
					MFA Configuration
				</h1>
				<p style={{ margin: 0, fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>
					Manage MFA-specific settings for authentication flows, device management, and user experience
				</p>
			</div>

			{/* Action Buttons */}
			<div
				style={{
					display: 'flex',
					gap: '12px',
					marginBottom: '24px',
					flexWrap: 'wrap',
				}}
			>
				<button
					type="button"
					onClick={handleSave}
					disabled={!hasChanges || isSaving}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: hasChanges ? '#10b981' : '#9ca3af',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: hasChanges ? 'pointer' : 'not-allowed',
					}}
				>
					<FiCheck size={16} />
					{isSaving ? 'Saving...' : 'Save Changes'}
				</button>

				<button
					type="button"
					onClick={handleReset}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: 'white',
						color: '#dc2626',
						border: '1px solid #dc2626',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<FiRefreshCw size={16} />
					Reset to Defaults
				</button>

				<button
					type="button"
					onClick={handleExport}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: 'white',
						color: '#3b82f6',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<FiDownload size={16} />
					Export
				</button>

				<button
					type="button"
					onClick={handleImport}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: 'white',
						color: '#3b82f6',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<FiUpload size={16} />
					Import
				</button>
			</div>

			{/* Configuration Sections */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				{/* Worker Token Settings */}
				<ConfigSection
					title="Worker Token Settings"
					description="Configure automatic renewal of worker tokens during MFA flows"
				>
					<ToggleSetting
						label="Auto-Renewal"
						value={config.workerToken.autoRenewal}
						onChange={(value) => updateNestedConfig('workerToken', 'autoRenewal', value)}
						description="Automatically renew worker tokens when they expire or are about to expire"
					/>
					<NumberSetting
						label="Renewal Threshold (seconds)"
						value={config.workerToken.renewalThreshold}
						onChange={(value) => updateNestedConfig('workerToken', 'renewalThreshold', value)}
						min={60}
						max={3600}
						description="How many seconds before token expiry to trigger auto-renewal"
					/>
					<NumberSetting
						label="Retry Attempts"
						value={config.workerToken.retryAttempts}
						onChange={(value) => updateNestedConfig('workerToken', 'retryAttempts', value)}
						min={1}
						max={10}
						description="Number of times to retry token renewal if it fails"
					/>
					<NumberSetting
						label="Retry Delay (milliseconds)"
						value={config.workerToken.retryDelay}
						onChange={(value) => updateNestedConfig('workerToken', 'retryDelay', value)}
						min={500}
						max={10000}
						description="Base delay between retry attempts (uses exponential backoff)"
					/>
				</ConfigSection>

				{/* Default Policies */}
				<ConfigSection
					title="Default Policies"
					description="Set default policies for authentication and device registration"
				>
					<ToggleSetting
						label="Auto-Select Default Policies"
						value={config.autoSelectDefaultPolicies}
						onChange={(value) => updateConfig('autoSelectDefaultPolicies', value)}
						description="Automatically select default policies when available"
					/>
				</ConfigSection>

				{/* Device Selection Behavior */}
				<ConfigSection
					title="Device Selection Behavior"
					description="Control how users select devices during authentication"
				>
					<ToggleSetting
						label="Auto-Select First Device"
						value={config.autoSelectFirstDevice}
						onChange={(value) => updateConfig('autoSelectFirstDevice', value)}
						description="Automatically select the first available device when only one device exists"
					/>
					<ToggleSetting
						label="Always Show Device Selection"
						value={config.alwaysShowDeviceSelection}
						onChange={(value) => updateConfig('alwaysShowDeviceSelection', value)}
						description="Always display device selection modal, even when policy suggests auto-selection"
					/>
					<NumberSetting
						label="Device Selection Timeout (seconds)"
						value={config.deviceSelectionTimeout}
						onChange={(value) => updateConfig('deviceSelectionTimeout', value)}
						min={10}
						max={300}
						description="Maximum time to wait for user to select a device"
					/>
				</ConfigSection>

				{/* OTP Settings */}
				<ConfigSection title="OTP Settings" description="Configure OTP code handling and validation">
					<SelectSetting
						label="OTP Code Length"
						value={config.otpCodeLength}
						onChange={(value) => updateConfig('otpCodeLength', value as 4 | 6 | 8)}
						options={[
							{ value: 4, label: '4 digits' },
							{ value: 6, label: '6 digits' },
							{ value: 8, label: '8 digits' },
						]}
						description="Expected length of OTP codes"
					/>
					<ToggleSetting
						label="OTP Input Auto-Focus"
						value={config.otpInputAutoFocus}
						onChange={(value) => updateConfig('otpInputAutoFocus', value)}
						description="Automatically focus OTP input field when modal opens"
					/>
					<ToggleSetting
						label="OTP Input Auto-Submit"
						value={config.otpInputAutoSubmit}
						onChange={(value) => updateConfig('otpInputAutoSubmit', value)}
						description="Automatically submit OTP when all digits are entered"
					/>
					<NumberSetting
						label="OTP Validation Timeout (seconds)"
						value={config.otpValidationTimeout}
						onChange={(value) => updateConfig('otpValidationTimeout', value)}
						min={60}
						max={1800}
						description="Maximum time to wait for OTP validation"
					/>
					<NumberSetting
						label="OTP Resend Delay (seconds)"
						value={config.otpResendDelay}
						onChange={(value) => updateConfig('otpResendDelay', value)}
						min={10}
						max={300}
						description="Minimum time between OTP resend requests"
					/>
				</ConfigSection>

				{/* FIDO2/WebAuthn Settings */}
				<ConfigSection
					title="FIDO2/WebAuthn Settings"
					description="Configure FIDO2 and WebAuthn authentication settings"
				>
					<SelectSetting
						label="Preferred Authenticator Type"
						value={config.fido2.preferredAuthenticatorType}
						onChange={(value) => updateNestedConfig('fido2', 'preferredAuthenticatorType', value)}
						options={[
							{ value: 'platform', label: 'Platform (Touch ID, Face ID, Windows Hello)' },
							{ value: 'cross-platform', label: 'Cross-Platform (Security Keys)' },
							{ value: 'both', label: 'Both (Let user choose)' },
						]}
						description="Preferred authenticator type for FIDO2 registration"
					/>
					<ToggleSetting
						label="Require User Verification"
						value={config.fido2.requireUserVerification}
						onChange={(value) => updateNestedConfig('fido2', 'requireUserVerification', value)}
						description="Require user verification (PIN, biometric) for FIDO2 operations"
					/>
					<SelectSetting
						label="Discoverable Credentials"
						value={config.fido2.discoverableCredentials}
						onChange={(value) => updateNestedConfig('fido2', 'discoverableCredentials', value)}
						options={[
							{ value: 'discouraged', label: 'Discouraged (Server-side storage)' },
							{ value: 'preferred', label: 'Preferred (Client-side storage)' },
							{ value: 'required', label: 'Required (Client-side storage)' },
						]}
						description="Whether to use discoverable (resident) credentials"
					/>
					<TextSetting
						label="Relying Party ID"
						value={config.fido2.relyingPartyId}
						onChange={(value) => updateNestedConfig('fido2', 'relyingPartyId', value)}
						description="Relying Party ID for WebAuthn operations (usually your domain)"
					/>
				</ConfigSection>

				{/* Push Notification Settings */}
				<ConfigSection
					title="Push Notification Settings"
					description="Configure push notification handling and polling"
				>
					<NumberSetting
						label="Push Notification Timeout (seconds)"
						value={config.pushNotificationTimeout}
						onChange={(value) => updateConfig('pushNotificationTimeout', value)}
						min={30}
						max={600}
						description="Maximum time to wait for push notification approval"
					/>
					<NumberSetting
						label="Push Polling Interval (seconds)"
						value={config.pushPollingInterval}
						onChange={(value) => updateConfig('pushPollingInterval', value)}
						min={1}
						max={10}
						description="How often to poll for push notification status"
					/>
					<ToggleSetting
						label="Auto-Start Push Polling"
						value={config.autoStartPushPolling}
						onChange={(value) => updateConfig('autoStartPushPolling', value)}
						description="Automatically start polling when push notification is sent"
					/>
					<ToggleSetting
						label="Show Push Notification Instructions"
						value={config.showPushNotificationInstructions}
						onChange={(value) => updateConfig('showPushNotificationInstructions', value)}
						description="Display instructions for approving push notifications"
					/>
				</ConfigSection>

				{/* Performance Settings */}
				<ConfigSection
					title="Performance Settings"
					description="Optimize performance with caching and debouncing"
				>
					<ToggleSetting
						label="Debounce Device Loading"
						value={config.debounceDeviceLoading}
						onChange={(value) => updateConfig('debounceDeviceLoading', value)}
						description="Debounce device list loading to prevent excessive API calls"
					/>
					<NumberSetting
						label="Device Loading Debounce Delay (milliseconds)"
						value={config.deviceLoadingDebounceDelay}
						onChange={(value) => updateConfig('deviceLoadingDebounceDelay', value)}
						min={100}
						max={2000}
						description="Delay before loading devices after user input changes"
					/>
					<ToggleSetting
						label="Cache Device List"
						value={config.cacheDeviceList}
						onChange={(value) => updateConfig('cacheDeviceList', value)}
						description="Cache device list to reduce API calls"
					/>
					<NumberSetting
						label="Cache Duration (seconds)"
						value={config.cacheDuration}
						onChange={(value) => updateConfig('cacheDuration', value)}
						min={10}
						max={600}
						description="How long to cache device list"
					/>
				</ConfigSection>

				{/* UI/UX Settings */}
				<ConfigSection title="UI/UX Settings" description="Customize the user interface experience">
					<ToggleSetting
						label="Show Device Icons"
						value={config.ui.showDeviceIcons}
						onChange={(value) => updateNestedConfig('ui', 'showDeviceIcons', value)}
						description="Display icons for different device types"
					/>
					<ToggleSetting
						label="Show Device Status Badges"
						value={config.ui.showDeviceStatusBadges}
						onChange={(value) => updateNestedConfig('ui', 'showDeviceStatusBadges', value)}
						description="Display status badges (ACTIVE, INACTIVE, etc.) on devices"
					/>
					<NumberSetting
						label="Modal Animation Duration (milliseconds)"
						value={config.ui.modalAnimationDuration}
						onChange={(value) => updateNestedConfig('ui', 'modalAnimationDuration', value)}
						min={0}
						max={1000}
						description="Duration of modal open/close animations (0 = instant)"
					/>
					<ToggleSetting
						label="Show Loading Spinners"
						value={config.ui.showLoadingSpinners}
						onChange={(value) => updateNestedConfig('ui', 'showLoadingSpinners', value)}
						description="Display loading spinners during async operations"
					/>
				</ConfigSection>

				{/* Security Settings */}
				<ConfigSection title="Security Settings" description="Security-related configuration options">
					<ToggleSetting
						label="Require Username for Authentication"
						value={config.security.requireUsernameForAuthentication}
						onChange={(value) => updateNestedConfig('security', 'requireUsernameForAuthentication', value)}
						description="Require username input before starting authentication"
					/>
					<ToggleSetting
						label="Allow Usernameless FIDO2"
						value={config.security.allowUsernamelessFido2}
						onChange={(value) => updateNestedConfig('security', 'allowUsernamelessFido2', value)}
						description="Allow FIDO2 authentication without username (passkeys)"
					/>
					<ToggleSetting
						label="Validate Device IDs"
						value={config.security.validateDeviceIds}
						onChange={(value) => updateNestedConfig('security', 'validateDeviceIds', value)}
						description="Validate device IDs before using them in API calls"
					/>
					<ToggleSetting
						label="Sanitize Device Names"
						value={config.security.sanitizeDeviceNames}
						onChange={(value) => updateNestedConfig('security', 'sanitizeDeviceNames', value)}
						description="Sanitize device names to prevent XSS"
					/>
				</ConfigSection>
			</div>
		</div>
	);
};

// Helper Components
interface ConfigSectionProps {
	title: string;
	description: string;
	children: React.ReactNode;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ title, description, children }) => {
	return (
		<div
			style={{
				background: 'white',
				borderRadius: '12px',
				padding: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			}}
		>
			<h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
				{title}
			</h2>
			<p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>{description}</p>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{children}</div>
		</div>
	);
};

interface SettingProps {
	label: string;
	description?: string;
}

interface ToggleSettingProps extends SettingProps {
	value: boolean;
	onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, value, onChange }) => {
	return (
		<div>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
				<label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>
					{label}
				</label>
				<button
					type="button"
					onClick={() => onChange(!value)}
					style={{
						width: '44px',
						height: '24px',
						borderRadius: '12px',
						border: 'none',
						background: value ? '#10b981' : '#d1d5db',
						cursor: 'pointer',
						position: 'relative',
						transition: 'background 0.2s ease',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '2px',
							left: value ? '22px' : '2px',
							width: '20px',
							height: '20px',
							borderRadius: '50%',
							background: 'white',
							transition: 'left 0.2s ease',
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
						}}
					/>
				</button>
			</div>
			{description && (
				<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

interface NumberSettingProps extends SettingProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
}

const NumberSetting: React.FC<NumberSettingProps> = ({
	label,
	description,
	value,
	onChange,
	min,
	max,
}) => {
	return (
		<div>
			<label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
				{label}
			</label>
			<input
				type="number"
				value={value}
				onChange={(e) => {
					const num = parseInt(e.target.value, 10);
					if (!isNaN(num)) {
						const clamped = min !== undefined && max !== undefined ? Math.max(min, Math.min(max, num)) : num;
						onChange(clamped);
					}
				}}
				min={min}
				max={max}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
				}}
			/>
			{description && (
				<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

interface SelectSettingProps extends SettingProps {
	value: string | number;
	onChange: (value: string | number) => void;
	options: Array<{ value: string | number; label: string }>;
}

const SelectSetting: React.FC<SelectSettingProps> = ({ label, description, value, onChange, options }) => {
	return (
		<div>
			<label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
				{label}
			</label>
			<select
				value={value}
				onChange={(e) => {
					const selectedOption = options.find((opt) => String(opt.value) === e.target.value);
					if (selectedOption) {
						onChange(selectedOption.value);
					}
				}}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
					background: 'white',
				}}
			>
				{options.map((option) => (
					<option key={String(option.value)} value={String(option.value)}>
						{option.label}
					</option>
				))}
			</select>
			{description && (
				<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

interface TextSettingProps extends SettingProps {
	value: string;
	onChange: (value: string) => void;
}

const TextSetting: React.FC<TextSettingProps> = ({ label, description, value, onChange }) => {
	return (
		<div>
			<label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
				{label}
			</label>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
				}}
			/>
			{description && (
				<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
			
			{/* API Display Toggle - Bottom */}
			<div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
				<ApiDisplayCheckbox />
			</div>
		</div>
	);
};

export default MFAConfigurationPageV8;

