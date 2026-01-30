/**
 * @file UnifiedDeviceSelectionStep.modern.tsx
 * @module v8/flows/unified/components
 * @description MODERNIZED Step 1: Device Selection - Modern card-based UI
 * @version 9.2.0
 * @since 2026-01-29
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/v8/components/Button';
import { PageTransition } from '@/v8/components/PageTransition';
import { LoadingSpinner } from '@/v8/components/LoadingSpinner';
import { EmptyState } from '@/v8/components/EmptyState';
import { useGlobalMFA } from '@/v8/contexts/GlobalMFAContext';
import { unifiedFlowServiceIntegration } from '@/v8/flows/unified/services/unifiedFlowServiceIntegration';
import { colors, spacing, borderRadius, typography } from '@/v8/design/tokens';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { FiSmartphone, FiMail, FiKey, FiPlus, FiCheck, FiArrowRight } from 'react-icons/fi';

const MODULE_TAG = '[🔍 DEVICE-SELECTION-MODERN]';

interface ExistingDevice {
	id: string;
	type: string;
	name?: string;
	status: string;
	phone?: string;
	email?: string;
	createdAt?: string;
}

export interface UnifiedDeviceSelectionStepProps extends MFAFlowBaseRenderProps {
	config: DeviceFlowConfig;
	deviceType: string;
}

export const UnifiedDeviceSelectionStepModern: React.FC<UnifiedDeviceSelectionStepProps> = ({
	credentials,
	setMfaState,
	nav,
	config,
}) => {
	console.log(`${MODULE_TAG} Rendering for:`, config.deviceType);

	const { isConfigured } = useGlobalMFA();
	const [existingDevices, setExistingDevices] = useState<ExistingDevice[]>([]);
	const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	// Load existing devices
	useEffect(() => {
		if (isConfigured && credentials.username) {
			loadDevices();
		}
	}, [isConfigured, credentials.username]);

	const loadDevices = async () => {
		setIsLoading(true);
		setLoadError(null);

		try {
			const devices = await unifiedFlowServiceIntegration.listDevices(
				credentials.username,
				`type eq "${config.deviceType}"`
			);
			
			setExistingDevices(devices as ExistingDevice[]);
			
			if (devices.length === 0) {
				toastV8.info(`No existing ${config.displayName} devices found`);
			}
		} catch (error: any) {
			const errorMsg = error.message || 'Failed to load devices';
			setLoadError(errorMsg);
			toastV8.error(errorMsg);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUseDevice = useCallback(() => {
		if (!selectedDeviceId) {
			toastV8.warning('Please select a device');
			return;
		}

		const device = existingDevices.find((d) => d.id === selectedDeviceId);
		if (!device) return;

		setMfaState((prev) => ({
			...prev,
			deviceId: device.id,
			deviceStatus: device.status,
		}));

		nav.markStepComplete();
		nav.goToStep(3); // Skip to activation
		toastV8.success(`Using ${device.name || config.displayName}`);
	}, [selectedDeviceId, existingDevices, config, setMfaState, nav]);

	const handleRegisterNew = useCallback(() => {
		setMfaState((prev) => ({
			...prev,
			deviceId: '',
			deviceStatus: '',
		}));

		nav.markStepComplete();
		nav.goToNext();
	}, [setMfaState, nav]);

	const getDeviceIcon = (type: string) => {
		switch (type.toUpperCase()) {
			case 'SMS':
			case 'MOBILE':
				return <FiSmartphone size={32} />;
			case 'EMAIL':
				return <FiMail size={32} />;
			case 'TOTP':
			case 'FIDO2':
				return <FiKey size={32} />;
			default:
				return <FiSmartphone size={32} />;
		}
	};

	if (isLoading) {
		return (
			<div style={{ padding: spacing['3xl'], textAlign: 'center' }}>
				<LoadingSpinner size="large" text="Loading devices..." />
			</div>
		);
	}

	return (
		<PageTransition>
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: spacing.xl }}>
				{/* Header */}
				<div
					style={{
						background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						marginBottom: spacing.xl,
						boxShadow: `0 4px 12px ${colors.primary[500]}33`,
					}}
				>
					<h2
						style={{
							margin: `0 0 ${spacing.sm} 0`,
							fontSize: typography.fontSize['3xl'],
							fontWeight: typography.fontWeight.bold,
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							gap: spacing.md,
						}}
					>
						{config.icon} Select {config.displayName} Device
					</h2>
					<p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
						Choose an existing device or register a new one
					</p>
				</div>

				{/* Error State */}
				{loadError && (
					<div
						style={{
							background: colors.error[50],
							border: `1px solid ${colors.error[500]}`,
							borderRadius: borderRadius.lg,
							padding: spacing.lg,
							marginBottom: spacing.xl,
							color: colors.error[900],
						}}
					>
						{loadError}
						<Button variant="outline" size="sm" onClick={loadDevices} style={{ marginLeft: spacing.md }}>
							Retry
						</Button>
					</div>
				)}

				{/* Existing Devices */}
				{existingDevices.length > 0 && (
					<div style={{ marginBottom: spacing.xl }}>
						<h3 style={{ margin: `0 0 ${spacing.lg} 0`, color: colors.neutral[900] }}>
							Existing Devices
						</h3>
						<div style={{ display: 'grid', gap: spacing.md }}>
							{existingDevices.map((device) => (
								<button
									key={device.id}
									onClick={() => setSelectedDeviceId(device.id)}
									style={{
										padding: spacing.lg,
										background: selectedDeviceId === device.id ? colors.primary[50] : 'white',
										border: `2px solid ${selectedDeviceId === device.id ? colors.primary[500] : colors.neutral[300]}`,
										borderRadius: borderRadius.lg,
										cursor: 'pointer',
										transition: 'all 0.2s',
										textAlign: 'left',
										display: 'flex',
										alignItems: 'center',
										gap: spacing.lg,
									}}
								>
									<div style={{ color: selectedDeviceId === device.id ? colors.primary[500] : colors.neutral[400] }}>
										{getDeviceIcon(device.type)}
									</div>
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: typography.fontWeight.semibold, color: colors.neutral[900] }}>
											{device.name || `${device.type} Device`}
										</div>
										<div style={{ fontSize: typography.fontSize.sm, color: colors.neutral[500] }}>
											{device.phone || device.email || device.id}
										</div>
										<div style={{ fontSize: typography.fontSize.xs, color: colors.neutral[400], marginTop: spacing.xs }}>
											Status: {device.status}
										</div>
									</div>
									{selectedDeviceId === device.id && (
										<FiCheck size={24} color={colors.primary[500]} />
									)}
								</button>
							))}
						</div>

						<div style={{ marginTop: spacing.lg }}>
							<Button
								variant="primary"
								size="lg"
								onClick={handleUseDevice}
								disabled={!selectedDeviceId}
								rightIcon={<FiArrowRight />}
								fullWidth
							>
								Use Selected Device
							</Button>
						</div>
					</div>
				)}

				{/* Empty State */}
				{existingDevices.length === 0 && !loadError && (
					<EmptyState
						icon={getDeviceIcon(config.deviceType)}
						title={`No ${config.displayName} Devices`}
						description={`You haven't registered any ${config.displayName} devices yet. Register a new device to get started.`}
					/>
				)}

				{/* Register New Device */}
				<div
					style={{
						background: 'white',
						borderRadius: borderRadius.xl,
						padding: spacing.xl,
						border: `2px dashed ${colors.neutral[300]}`,
						textAlign: 'center',
					}}
				>
					<h3 style={{ margin: `0 0 ${spacing.md} 0`, color: colors.neutral[900] }}>
						Register New Device
					</h3>
					<p style={{ margin: `0 0 ${spacing.lg} 0`, color: colors.neutral[600] }}>
						Add a new {config.displayName} device to your account
					</p>
					<Button
						variant="primary"
						size="lg"
						onClick={handleRegisterNew}
						leftIcon={<FiPlus />}
					>
						Register New {config.displayName}
					</Button>
				</div>
			</div>
		</PageTransition>
	);
};

export default UnifiedDeviceSelectionStepModern;
