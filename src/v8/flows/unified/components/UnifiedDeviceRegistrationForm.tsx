/**
 * @file UnifiedDeviceRegistrationForm.tsx
 * @module v8/flows/unified/components
 * @description Combined device type selection + info input form
 * @version 9.2.0
 * @since 2026-01-29
 *
 * Purpose: Single form showing all device types with their input fields
 * Users can see all options and fill in the appropriate fields in one view
 */

import React, { useState, useCallback } from 'react';
import { getDeviceConfig } from '@/v8/config/deviceFlowConfigs';
import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';
import { Button } from '@/v8/components/Button';
import { PageTransition } from '@/v8/components/PageTransition';
import { colors, spacing } from '@/v8/design/tokens';
import { DynamicFormRenderer } from './DynamicFormRenderer';

const MODULE_TAG = '[📝 UNIFIED-DEVICE-REG-FORM]';

interface DeviceTypeTab {
	key: DeviceConfigKey;
	icon: string;
	label: string;
	description: string;
}

const DEVICE_TABS: DeviceTypeTab[] = [
	{ key: 'SMS', icon: '📱', label: 'SMS', description: 'Text message verification' },
	{ key: 'EMAIL', icon: '✉️', label: 'Email', description: 'Email verification' },
	{ key: 'TOTP', icon: '🔐', label: 'Authenticator', description: 'App-based codes' },
	{ key: 'MOBILE', icon: '📲', label: 'Mobile Push', description: 'Push notifications' },
	{ key: 'WHATSAPP', icon: '💬', label: 'WhatsApp', description: 'WhatsApp messages' },
	{ key: 'FIDO2', icon: '🔑', label: 'Security Key', description: 'Hardware key/passkey' },
];

export interface UnifiedDeviceRegistrationFormProps {
	onSubmit: (deviceType: DeviceConfigKey, fields: Record<string, string>) => void;
	onCancel: () => void;
	isLoading?: boolean;
}

export const UnifiedDeviceRegistrationForm: React.FC<UnifiedDeviceRegistrationFormProps> = ({
	onSubmit,
	onCancel,
	isLoading = false,
}) => {
	const [selectedTab, setSelectedTab] = useState<DeviceConfigKey>('SMS');
	const [deviceFields, setDeviceFields] = useState<Record<DeviceConfigKey, Record<string, string>>>({
		SMS: {},
		EMAIL: {},
		TOTP: {},
		MOBILE: {},
		WHATSAPP: {},
		FIDO2: {},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const config = getDeviceConfig(selectedTab);

	const handleFieldChange = useCallback((field: string, value: string) => {
		setDeviceFields((prev) => ({
			...prev,
			[selectedTab]: {
				...prev[selectedTab],
				[field]: value,
			},
		}));
		// Clear error for this field
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	}, [selectedTab, errors]);

	const handleSubmit = useCallback(() => {
		console.log(`${MODULE_TAG} Submitting registration for:`, selectedTab);
		const fields = deviceFields[selectedTab];
		
		// Basic validation
		const requiredFields = config.requiredFields || [];
		const newErrors: Record<string, string> = {};
		
		requiredFields.forEach((field) => {
			if (!fields[field]?.trim()) {
				newErrors[field] = `${field} is required`;
			}
		});

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		onSubmit(selectedTab, fields);
	}, [selectedTab, deviceFields, config, onSubmit]);

	return (
		<PageTransition>
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: spacing.xl }}>
				{/* Header */}
				<div style={{ marginBottom: spacing.xl }}>
					<h2 style={{ margin: `0 0 ${spacing.sm}`, fontSize: '24px', fontWeight: '700', color: colors.neutral[900] }}>
						Register MFA Device
					</h2>
					<p style={{ margin: 0, fontSize: '14px', color: colors.neutral[600] }}>
						Select a device type and enter the required information
					</p>
				</div>

				{/* Device Type Tabs */}
				<div
					style={{
						display: 'flex',
						gap: spacing.sm,
						marginBottom: spacing.lg,
						borderBottom: `2px solid ${colors.neutral[200]}`,
						overflowX: 'auto',
						paddingBottom: spacing.sm,
					}}
				>
					{DEVICE_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setSelectedTab(tab.key)}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: spacing.xs,
								padding: `${spacing.sm} ${spacing.md}`,
								background: selectedTab === tab.key ? colors.primary[50] : 'transparent',
								border: 'none',
								borderBottom: selectedTab === tab.key ? `3px solid ${colors.primary[600]}` : '3px solid transparent',
								borderRadius: '8px 8px 0 0',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								minWidth: '100px',
								marginBottom: '-2px',
							}}
						>
							<span style={{ fontSize: '24px' }}>{tab.icon}</span>
							<span
								style={{
									fontSize: '13px',
									fontWeight: selectedTab === tab.key ? '600' : '500',
									color: selectedTab === tab.key ? colors.primary[700] : colors.neutral[600],
									whiteSpace: 'nowrap',
								}}
							>
								{tab.label}
							</span>
						</button>
					))}
				</div>

				{/* Device Description */}
				<div
					style={{
						background: colors.primary[50],
						border: `1px solid ${colors.primary[200]}`,
						borderRadius: '8px',
						padding: spacing.md,
						marginBottom: spacing.lg,
					}}
				>
					<p style={{ margin: 0, fontSize: '14px', color: colors.primary[900] }}>
						<strong>{config.displayName}:</strong> {config.description || DEVICE_TABS.find(t => t.key === selectedTab)?.description}
					</p>
				</div>

				{/* Device-Specific Form */}
				<div
					style={{
						background: '#ffffff',
						border: `1px solid ${colors.neutral[200]}`,
						borderRadius: '12px',
						padding: spacing.lg,
						marginBottom: spacing.xl,
					}}
				>
					{config.deviceType === 'TOTP' || config.deviceType === 'FIDO2' || config.deviceType === 'MOBILE' ? (
						<div
							style={{
								padding: spacing.xl,
								textAlign: 'center',
								color: colors.neutral[600],
							}}
						>
							<p style={{ fontSize: '48px', margin: `0 0 ${spacing.md}` }}>
								{config.deviceType === 'TOTP' ? '🔐' : config.deviceType === 'FIDO2' ? '🔑' : '📲'}
							</p>
							<p style={{ margin: 0, fontSize: '14px' }}>
								{config.deviceType} requires a custom registration flow.
								<br />
								This device type will use a specialized component.
							</p>
						</div>
					) : (
						<DynamicFormRenderer
							config={config}
							values={deviceFields[selectedTab]}
							onChange={handleFieldChange}
							errors={errors}
						/>
					)}
				</div>

				{/* Action Buttons */}
				<div
					style={{
						display: 'flex',
						gap: spacing.md,
						justifyContent: 'flex-end',
						paddingTop: spacing.lg,
						borderTop: `1px solid ${colors.neutral[200]}`,
					}}
				>
					<Button
						variant="secondary"
						onClick={onCancel}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleSubmit}
						disabled={isLoading}
						loading={isLoading}
					>
						Register {config.displayName} →
					</Button>
				</div>
			</div>
		</PageTransition>
	);
};

export default UnifiedDeviceRegistrationForm;
