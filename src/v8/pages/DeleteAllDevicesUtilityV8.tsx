/**
 * @file DeleteAllDevicesUtilityV8.tsx
 * @module v8/pages
 * @description Utility to delete all MFA devices for a user, with optional device type filtering
 * @version 8.0.0
 * @since 2025-01-07
 *
 * Features:
 * - Delete all devices for a user
 * - Filter by device type (SMS, EMAIL, FIDO2, TOTP, WHATSAPP, etc.)
 * - Worker token and username input
 * - Clear success/error messages
 * - Shows device count before deletion
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiKey, FiLoader, FiTrash2, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { UnifiedWorkerTokenBackupServiceV8 } from '@/services/unifiedWorkerTokenBackupServiceV8';
import type { SearchableDropdownOption } from '@/v8/components/SearchableDropdownV8';
import { SearchableDropdownV8 } from '@/v8/components/SearchableDropdownV8';
import { ShowTokenConfigCheckboxV8 } from '@/v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '@/v8/components/SilentApiConfigCheckboxV8';
import {
	ApiDisplayCheckbox,
	SuperSimpleApiDisplayV8,
} from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';
import type { DeviceAuthenticationPolicy } from '@/v8/flows/shared/MFATypes';
import { useUserSearch } from '@/v8/hooks/useUserSearch';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { StorageServiceV8 } from '@/v8/services/storageServiceV8';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🗑️ DELETE-DEVICES-V8]';

type DeviceType = 'ALL' | 'SMS' | 'EMAIL' | 'FIDO2' | 'TOTP' | 'WHATSAPP' | 'VOICE' | 'OATH';
type DeviceStatus =
	| 'ALL'
	| 'ACTIVE'
	| 'ACTIVATION_REQUIRED'
	| 'BLOCKED'
	| 'LOCKED'
	| 'PENDING'
	| 'SUSPENDED'
	| 'EXPIRED';

const DEVICE_TYPES: Array<{ value: DeviceType; label: string }> = [
	{ value: 'ALL', label: 'All Device Types' },
	{ value: 'SMS', label: 'SMS' },
	{ value: 'EMAIL', label: 'Email' },
	{ value: 'FIDO2', label: 'FIDO2 / Passkey' },
	{ value: 'TOTP', label: 'TOTP' },
	{ value: 'WHATSAPP', label: 'WhatsApp' },
	{ value: 'VOICE', label: 'Voice' },
	{ value: 'OATH', label: 'OATH Token' },
];

const DEVICE_STATUSES: Array<{ value: DeviceStatus; label: string }> = [
	{ value: 'ALL', label: 'All Statuses' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'ACTIVATION_REQUIRED', label: 'Activation Required' },
	{ value: 'BLOCKED', label: 'Blocked' },
	{ value: 'LOCKED', label: 'Locked' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'SUSPENDED', label: 'Suspended' },
	{ value: 'EXPIRED', label: 'Expired' },
];

const PAGE_STORAGE_KEY = 'v8:delete-all-devices';
const PAGE_STORAGE_VERSION = 1;

interface DeleteAllDevicesPageState {
	environmentId: string;
	username: string;
	selectedDeviceType: DeviceType;
	selectedDeviceStatus: DeviceStatus;
}

export const DeleteAllDevicesUtilityV8: React.FC = () => {
	const location = useLocation();
	const locationState = location.state as {
		environmentId?: string;
		username?: string;
		deviceType?: DeviceType;
		deviceStatus?: DeviceStatus;
	} | null;

	const [environmentId, setEnvironmentId] = useState(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.environmentId) {
			return locationState.environmentId;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.environmentId) {
				return stored.environmentId;
			}
			const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
			if (globalEnvId) {
				return globalEnvId;
			}
			// Try synchronous check from localStorage for worker token credentials
			try {
				const stored = localStorage.getItem('unified_worker_token');
				if (stored) {
					const data = JSON.parse(stored);
					if (data.credentials?.environmentId) {
						return data.credentials.environmentId;
					}
				}
			} catch (syncError) {
				console.log(`${MODULE_TAG} Sync worker token check failed:`, syncError);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved environment ID`, error);
		}
		return '';
	});
	const [username, setUsername] = useState(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.username) {
			return locationState.username;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.username) {
				return stored.username;
			}
			// Note: Username is user-specific, not stored in worker token credentials
			// So we don't auto-populate it from worker token
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved username`, error);
		}
		return '';
	});
	const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.deviceType && locationState.deviceType !== 'ALL') {
			return locationState.deviceType;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.selectedDeviceType) {
				return stored.selectedDeviceType;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved device type filter`, error);
		}
		return 'ALL';
	});
	const [selectedDeviceStatus, setSelectedDeviceStatus] = useState<DeviceStatus>(() => {
		// Check location.state first (passed from TOTP flow)
		if (locationState?.deviceStatus && locationState.deviceStatus !== 'ALL') {
			return locationState.deviceStatus;
		}
		try {
			const stored = StorageServiceV8.load<DeleteAllDevicesPageState>(PAGE_STORAGE_KEY);
			if (stored?.selectedDeviceStatus) {
				return stored.selectedDeviceStatus;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved device status filter`, error);
		}
		return 'ALL';
	});
	const [policy, setPolicy] = useState<DeviceAuthenticationPolicy | null>(null);
	const [mfaSettings, setMfaSettings] = useState<{
		maxAllowedDevices: number;
		loading: boolean;
		error: string | null;
	}>({
		maxAllowedDevices: 20, // Default fallback value
		loading: false,
		error: null,
	});

	const loadingSpinnerConfig = useMemo(
		() => ({
			message: 'Loading devices...',
		}),
		[]
	);

	const deletingSpinnerConfig = useMemo(
		() => ({
			message: 'Deleting devices...',
		}),
		[]
	);

	// Use CommonSpinnerService for loading states (Production menu group standard)
	const loadingSpinner = useProductionSpinner('delete-all-devices-loading', loadingSpinnerConfig);
	const deletingSpinner = useProductionSpinner(
		'delete-all-devices-deleting',
		deletingSpinnerConfig
	);
	const [devices, setDevices] = useState<Array<Record<string, unknown>>>([]);
	const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [deletionResults, setDeletionResults] = useState<{
		successful: number;
		failed: number;
		results: Array<{ deviceId: string; success: boolean; error?: string }>;
	} | null>(null);

	// Track if devices have been loaded at least once to prevent infinite loops
	const hasLoadedDevicesRef = useRef(false);
	const lastAutoReloadKeyRef = useRef<string>('');

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Worker Token Settings State
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			return config.workerToken.silentApiRetrieval;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			return config.workerToken.showTokenAtEnd;
		} catch {
			return false;
		}
	});

	// Get worker token status
	const [tokenStatus, setTokenStatus] = useState<{
		isValid: boolean;
		minutesRemaining: number;
	}>({
		isValid: false,
		minutesRemaining: 0,
	});

	// User search functionality for username dropdown
	const {
		users,
		isLoading: isLoadingUsers,
		setSearchQuery,
	} = useUserSearch({
		environmentId: environmentId || '',
		tokenValid: tokenStatus.isValid,
		maxPages: 100,
	});

	// Format users for dropdown
	const userOptions: SearchableDropdownOption[] = useMemo(
		() =>
			Array.from(
				new Map(
					(Array.isArray(users) ? users : []).map((user) => [
						user.username,
						{
							value: user.username,
							label: user.username,
							...(user.email ? { secondaryLabel: user.email } : {}),
						} as SearchableDropdownOption,
					])
				).values()
			),
		[users]
	);

	// Update token status periodically
	useEffect(() => {
		const updateTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to check token status`, error);
				setTokenStatus({ isValid: false, minutesRemaining: 0 });
			}
		};

		// Listen for configuration updates
		const handleConfigUpdate = (event: Event) => {
			const customEvent = event as CustomEvent<{
				workerToken?: { silentApiRetrieval?: boolean; showTokenAtEnd?: boolean };
			}>;
			if (customEvent.detail?.workerToken) {
				if (customEvent.detail.workerToken.silentApiRetrieval !== undefined) {
					setSilentApiRetrieval(customEvent.detail.workerToken.silentApiRetrieval);
				}
				if (customEvent.detail.workerToken.showTokenAtEnd !== undefined) {
					setShowTokenAtEnd(customEvent.detail.workerToken.showTokenAtEnd);
				}
			}
		};

		// Listen for token updates
		const handleTokenUpdate = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to check token status in event handler:`, error);
			}
		};

		updateTokenStatus();
		const interval = setInterval(updateTokenStatus, 30000); // Update every 30 seconds

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		window.addEventListener('workerTokenUpdated', handleTokenUpdate);

		return () => {
			clearInterval(interval);
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, []);

	// Auto-populate environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = async () => {
			try {
				// If environment ID is empty, try to populate from worker token credentials
				if (!environmentId.trim()) {
					const credentials = await unifiedWorkerTokenService.loadCredentials();
					if (credentials?.environmentId) {
						setEnvironmentId(credentials.environmentId);
						console.log(
							`${MODULE_TAG} Auto-populated environment ID from worker token: ${credentials.environmentId}`
						);
					}
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to auto-populate environment ID:`, error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, [environmentId]);

	const selectedCount = devices.filter((device) =>
		selectedDeviceIds.has(device.id as string)
	).length;

	// Load devices for the user
	const handleLoadDevices = useCallback(async () => {
		if (!environmentId.trim() || !username.trim() || !tokenStatus.isValid) {
			setError('Please provide environment ID, username, and a valid worker token');
			return;
		}

		loadingSpinner.showSpinner();
		setError(null);
		setDevices([]);
		setDeletionResults(null);

		try {
			const allDevices = await MFAServiceV8.getAllDevices({
				environmentId: environmentId.trim(),
				username: username.trim(),
			});

			// Filter by device type if not 'ALL'
			let filteredDevices = allDevices;
			if (selectedDeviceType !== 'ALL') {
				filteredDevices = filteredDevices.filter(
					(d) => (d.type as string)?.toUpperCase() === selectedDeviceType
				);
			}

			// Filter by device status if not 'ALL'
			if (selectedDeviceStatus !== 'ALL') {
				filteredDevices = filteredDevices.filter((d) => {
					const deviceStatus = (d.status as string)?.toUpperCase();
					return deviceStatus === selectedDeviceStatus.toUpperCase();
				});
			}

			setDevices(filteredDevices);
			setSelectedDeviceIds(new Set(filteredDevices.map((d) => d.id as string)));
			hasLoadedDevicesRef.current = true; // Mark that devices have been loaded
			lastAutoReloadKeyRef.current = `${environmentId.trim()}|${username.trim()}|${selectedDeviceType}|${selectedDeviceStatus}|${String(tokenStatus.isValid)}`;
			console.log(`${MODULE_TAG} ✅ Loaded ${filteredDevices.length} devices`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load devices:`, error);
			setError(error instanceof Error ? error.message : 'Failed to load devices');
		} finally {
			loadingSpinner.hideSpinner();
		}
	}, [
		environmentId,
		username,
		tokenStatus.isValid,
		selectedDeviceType,
		selectedDeviceStatus,
		loadingSpinner.hideSpinner,
		loadingSpinner.showSpinner,
	]); // Use tokenStatus.isValid instead of entire object

	// Persist form state when it changes
	useEffect(() => {
		try {
			const state: DeleteAllDevicesPageState = {
				environmentId: environmentId.trim(),
				username: username.trim(),
				selectedDeviceType,
				selectedDeviceStatus,
			};

			StorageServiceV8.save(PAGE_STORAGE_KEY, state, PAGE_STORAGE_VERSION);

			if (state.environmentId) {
				EnvironmentIdServiceV8.saveEnvironmentId(state.environmentId);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save delete-all-devices state`, error);
		}
	}, [environmentId, username, selectedDeviceType, selectedDeviceStatus]);

	// Auto-reload devices when filters change (if we already have devices loaded)
	useEffect(() => {
		// Only auto-reload if we have already loaded devices at least once
		// This prevents auto-loading on initial page load
		const hasLoadedDevices = hasLoadedDevicesRef.current;
		const hasRequiredFields = environmentId.trim() && username.trim() && tokenStatus.isValid;
		const currentAutoReloadKey = `${environmentId.trim()}|${username.trim()}|${selectedDeviceType}|${selectedDeviceStatus}|${String(tokenStatus.isValid)}`;

		if (
			hasLoadedDevices &&
			hasRequiredFields &&
			lastAutoReloadKeyRef.current !== currentAutoReloadKey
		) {
			lastAutoReloadKeyRef.current = currentAutoReloadKey;
			handleLoadDevices();
		}
	}, [
		environmentId,
		username,
		tokenStatus.isValid,
		selectedDeviceType,
		selectedDeviceStatus,
		handleLoadDevices,
	]);

	// Fetch policy information when devices are loaded
	useEffect(() => {
		const fetchPolicyInfo = async () => {
			if (!environmentId || !username || !tokenStatus.isValid || devices.length === 0) return;

			// Policy loading - no spinner needed for this quick operation
			try {
				// For now, we'll try to get a default policy. In a real implementation,
				// you might need to determine which policy applies to this user
				const config = MFAConfigurationServiceV8.loadConfiguration();

				if (config.defaultMfaPolicyId) {
					const policyData = await MFAServiceV8.readDeviceAuthenticationPolicy(
						environmentId,
						config.defaultMfaPolicyId
					);
					setPolicy(policyData);
					console.log(`${MODULE_TAG} ✅ Policy loaded:`, policyData.name);
				} else {
					console.log(`${MODULE_TAG} ℹ️ No default policy configured`);
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to fetch policy information:`, error);
			} finally {
				// Policy loading complete
			}
		};

		fetchPolicyInfo();
	}, [environmentId, username, tokenStatus.isValid, devices.length]);

	// Fetch MFA Settings when environment ID changes
	useEffect(() => {
		const fetchMfaSettings = async () => {
			if (!environmentId || !tokenStatus.isValid) return;

			setMfaSettings((prev) => ({ ...prev, loading: true, error: null }));

			try {
				console.log(`${MODULE_TAG} Loading MFA settings for environment: ${environmentId}`);
				const settings = await MFAServiceV8.getMFASettings(environmentId);

				const maxDevices = settings.pairing?.maxAllowedDevices || 20; // Default fallback
				setMfaSettings({
					maxAllowedDevices: maxDevices,
					loading: false,
					error: null,
				});

				console.log(`${MODULE_TAG} ✅ MFA Settings loaded:`, {
					maxAllowedDevices: maxDevices,
					pairingKeyFormat: settings.pairing?.pairingKeyFormat,
				});
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to fetch MFA settings:`, error);
				setMfaSettings((prev) => ({
					...prev,
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to load MFA settings',
				}));
			}
		};

		fetchMfaSettings();
	}, [environmentId, tokenStatus.isValid]);

	const handleToggleDeviceSelection = useCallback((deviceId: string) => {
		setSelectedDeviceIds((prev) => {
			const next = new Set(prev);
			if (next.has(deviceId)) {
				next.delete(deviceId);
			} else {
				next.add(deviceId);
			}
			return next;
		});
	}, []);

	const handleSelectAll = useCallback(() => {
		setSelectedDeviceIds(new Set(devices.map((d) => d.id as string)));
	}, [devices]);

	const handleClearSelection = useCallback(() => {
		setSelectedDeviceIds(new Set());
	}, []);

	// Handle worker token modal
	const handleShowWorkerTokenModal = async () => {
		const { handleShowWorkerTokenModal: showModal } = await import(
			'@/v8/utils/workerTokenModalHelperV8'
		);
		await showModal(
			setShowWorkerTokenModal,
			setTokenStatus,
			silentApiRetrieval,
			showTokenAtEnd,
			true // Force show modal - user clicked button
		);
	};

	// Delete all devices
	const handleDeleteAll = useCallback(async () => {
		if (devices.length === 0) {
			toastV8.warning('No devices to delete');
			return;
		}

		const devicesToDelete = devices.filter((device) => selectedDeviceIds.has(device.id as string));

		if (devicesToDelete.length === 0) {
			toastV8.warning('No devices selected for deletion');
			return;
		}

		if (!environmentId.trim() || !username.trim() || !tokenStatus.isValid) {
			setError('Please provide environment ID, username, and a valid worker token');
			return;
		}

		// Confirm deletion using custom modal
		const confirmed = await uiNotificationServiceV8.confirm({
			message: `Are you sure you want to delete ${devicesToDelete.length} selected device(s)? This action cannot be undone.`,
			title: 'Confirm Device Deletion',
			severity: 'danger',
			confirmText: 'Delete',
			cancelText: 'Cancel',
		});
		if (!confirmed) {
			return;
		}

		deletingSpinner.showSpinner();
		setError(null);
		setDeletionResults(null);

		const results = {
			success: 0,
			failed: 0,
			errors: [] as Array<{ deviceId: string; error: string }>,
		};

		try {
			// Delete devices one by one
			for (const device of devicesToDelete) {
				const deviceId = device.id as string;
				const deviceType = device.type as string;
				const deviceNickname = (device.nickname || device.name || deviceType) as string;

				try {
					await MFAServiceV8.deleteDevice({
						environmentId: environmentId.trim(),
						username: username.trim(),
						deviceId,
					});
					results.success++;
					console.log(`${MODULE_TAG} ✅ Deleted device: ${deviceNickname} (${deviceType})`);
				} catch (deleteError) {
					results.failed++;
					const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
					results.errors.push({ deviceId, error: errorMessage });
					console.error(`${MODULE_TAG} ❌ Failed to delete device ${deviceNickname}:`, deleteError);
				}
			}

			setDeletionResults(results);

			// Show summary toast
			if (results.failed === 0) {
				toastV8.success(`Successfully deleted ${results.success} device(s)`);
			} else {
				toastV8.warning(
					`Deleted ${results.success} device(s), but ${results.failed} failed. Check details below.`
				);
			}

			// Reload devices to show updated list
			await handleLoadDevices();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete devices';
			setError(errorMessage);
			toastV8.error(`Failed to delete devices: ${errorMessage}`);
		} finally {
			deletingSpinner.hideSpinner();
		}
	}, [
		devices,
		selectedDeviceIds,
		environmentId,
		username,
		tokenStatus.isValid,
		handleLoadDevices,
		deletingSpinner.hideSpinner,
		deletingSpinner.showSpinner,
	]);

	return (
		<div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
			{/* Header */}
			<div style={{ marginBottom: '32px' }}>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
					🗑️ Delete All Devices Utility
				</h1>
				<p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
					Delete all MFA devices for a user, with optional filtering by device type and status
				</p>
			</div>

			{/* MFA Settings Information */}
			{environmentId && (
				<div
					style={{
						background: '#f0f9ff',
						border: '1px solid #bae6fd',
						borderRadius: '8px',
						padding: '16px',
						marginBottom: '24px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
						<span style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
							📋 MFA Settings for Environment
						</span>
						<span style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace' }}>
							{environmentId}
						</span>
					</div>

					{mfaSettings.loading ? (
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<div
								style={{
									width: '16px',
									height: '16px',
									border: '2px solid #3b82f6',
									borderTop: '2px solid transparent',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							></div>
							<span style={{ color: '#64748b', fontSize: '14px' }}>Loading MFA settings...</span>
						</div>
					) : mfaSettings.error ? (
						<div style={{ color: '#dc2626', fontSize: '14px' }}>
							⚠️ Failed to load MFA settings: {mfaSettings.error}
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
								<span style={{ color: '#374151', fontSize: '14px' }}>
									<strong>Max Allowed Devices:</strong>
								</span>
								<span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
									{mfaSettings.maxAllowedDevices}
								</span>
							</div>
							<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
								Source: PingOne MFA Settings API (GET /environments/{environmentId}/mfaSettings)
							</div>
						</div>
					)}
				</div>
			)}

			{/* Device Policy Information */}
			{devices.length > 0 && (
				<div
					style={{
						background: '#f8fafc',
						border: '1px solid #e2e8f0',
						borderRadius: '8px',
						padding: '16px',
						marginBottom: '24px',
					}}
				>
					<h3
						style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}
					>
						📊 Device Usage Information
					</h3>

					{/* Device Count and Limits */}
					<div
						style={{
							display: 'flex',
							gap: '24px',
							alignItems: 'center',
							flexWrap: 'wrap',
							marginBottom: '12px',
						}}
					>
						<div>
							<span style={{ color: '#6b7280', fontSize: '14px' }}>Current Devices:</span>
							<span
								style={{ marginLeft: '8px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}
							>
								{devices.length}
							</span>
						</div>

						{/* MFA Settings Limits */}
						<div>
							<span style={{ color: '#6b7280', fontSize: '14px' }}>
								Max Allowed per MFA settings:
							</span>
							{mfaSettings.loading ? (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										fontWeight: '500',
										color: '#6b7280',
									}}
								>
									Loading...
								</span>
							) : mfaSettings.error ? (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										fontWeight: '500',
										color: '#dc2626',
									}}
								>
									Error
								</span>
							) : (
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										fontWeight: '500',
										color: '#059669',
									}}
								>
									{mfaSettings.maxAllowedDevices} devices
								</span>
							)}
						</div>

						{policy && (
							<div>
								<span style={{ color: '#6b7280', fontSize: '14px' }}>Policy:</span>
								<span
									style={{
										marginLeft: '8px',
										fontSize: '14px',
										fontWeight: '500',
										color: '#059669',
									}}
								>
									{policy.name}
								</span>
							</div>
						)}
					</div>

					{/* Device Usage Progress Bar */}
					<div style={{ marginBottom: '12px' }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '4px',
							}}
						>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>Device Usage</span>
							<span style={{ fontSize: '12px', color: '#6b7280' }}>
								{Math.round((devices.length / 50) * 100)}% (50 device limit)
							</span>
						</div>
						<div
							style={{
								width: '100%',
								height: '8px',
								background: '#e5e7eb',
								borderRadius: '4px',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									width: `${Math.min((devices.length / 50) * 100, 100)}%`,
									height: '100%',
									background:
										devices.length > 40 ? '#ef4444' : devices.length > 25 ? '#f59e0b' : '#10b981',
									transition: 'width 0.3s ease, background 0.3s ease',
								}}
							/>
						</div>
						<div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
							{devices.length > 40 ? (
								<span style={{ color: '#dc2626' }}>⚠️ Approaching device limit</span>
							) : devices.length > 25 ? (
								<span style={{ color: '#d97706' }}>⚡ Moderate device usage</span>
							) : (
								<span style={{ color: '#059669' }}>✅ Healthy device usage</span>
							)}
						</div>
					</div>

					{/* Policy Information */}
					{policy && (
						<div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
							{policy.pairingDisabled ? (
								<span style={{ color: '#dc2626' }}>
									⚠️ Device pairing is disabled in this policy
								</span>
							) : (
								<span style={{ color: '#059669' }}>✅ Device pairing is enabled</span>
							)}
							{policy.promptForNicknameOnPairing && (
								<span style={{ marginLeft: '16px' }}>
									• Users will be prompted for device nicknames
								</span>
							)}
							<span style={{ marginLeft: '16px' }}>• Max 20 valid pairing keys per user</span>
							<span style={{ marginLeft: '16px' }}>
								• Devices in ACTIVATION_REQUIRED expire after 24 hours
							</span>
						</div>
					)}

					{!policy && (
						<div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
							<span style={{ color: '#059669' }}>✅ Using PingOne standard device limits</span>
							<span style={{ marginLeft: '16px' }}>
								• Max 20 devices per user (configurable in MFA Settings)
							</span>
							<span style={{ marginLeft: '16px' }}>• Max 20 valid pairing keys per user</span>
							<span style={{ marginLeft: '16px' }}>
								• ACTIVATION_REQUIRED devices expire after 24 hours
							</span>
						</div>
					)}
				</div>
			)}

			{/* Configuration Section */}
			<div
				style={{
					background: 'white',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
					Configuration
				</h2>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					{/* Environment ID */}
					<div>
						<label
							htmlFor="delete-devices-env-id"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Environment ID *
						</label>
						<input
							id="delete-devices-env-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter environment ID"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'monospace',
							}}
						/>
					</div>

					{/* Username */}
					<div>
						<label
							htmlFor="delete-devices-username"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Username *
						</label>
						{environmentId && tokenStatus.isValid ? (
							<SearchableDropdownV8
								id="username"
								value={username || ''}
								options={userOptions}
								onChange={setUsername}
								onSearchChange={setSearchQuery}
								placeholder="Search for username..."
								isLoading={isLoadingUsers}
								style={{
									width: '100%',
								}}
							/>
						) : (
							<input
								id="delete-devices-username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter username (requires valid worker token for search)"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: username.trim() ? '1px solid #d1d5db' : '2px solid #ef4444',
									borderRadius: '6px',
									fontSize: '14px',
									background: '#f9fafb',
								}}
								disabled
							/>
						)}
						{!username.trim() && (
							<div style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
								Username is required
							</div>
						)}
					</div>

					{/* Device Type Filter */}
					<div>
						<label
							htmlFor="delete-devices-type-filter"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Device Type Filter
						</label>
						<select
							id="delete-devices-type-filter"
							value={selectedDeviceType}
							onChange={(e) => setSelectedDeviceType(e.target.value as DeviceType)}
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
							}}
						>
							{DEVICE_TYPES.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
					</div>

					{/* Device Status Filter */}
					<div>
						<label
							htmlFor="delete-devices-status-filter"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Device Status Filter
						</label>
						<select
							id="delete-devices-status-filter"
							value={selectedDeviceStatus}
							onChange={(e) => setSelectedDeviceStatus(e.target.value as DeviceStatus)}
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
							}}
						>
							{DEVICE_STATUSES.map((status) => (
								<option key={status.value} value={status.value}>
									{status.label}
								</option>
							))}
						</select>
					</div>

					{/* Cool 3D Worker Token Status Display */}
					<WorkerTokenStatusDisplayV8 mode="detailed" showRefresh={true} />

					{/* Get Worker Token Button */}
					<button
						type="button"
						onClick={handleShowWorkerTokenModal}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '8px',
							background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
							color: 'white',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
							transition: 'all 0.2s ease',
							marginBottom: '12px',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
						}}
						title="Get Worker Token for API Authentication"
					>
						<FiKey style={{ fontSize: '16px' }} />
						Get Worker Token
					</button>

					{/* Worker Token Configuration Checkboxes */}
					<div
						style={{
							marginTop: '12px',
							padding: '12px',
							background: '#f8fafc',
							borderRadius: '6px',
							border: '1px solid #e2e8f0',
						}}
					>
						{/* Silent API Retrieval Checkbox - Centralized Component */}
						<SilentApiConfigCheckboxV8
							onChange={async (newValue) => {
								// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
								if (newValue) {
									try {
										const currentStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
										if (!currentStatus.isValid) {
											console.log(
												'[DELETE-DEVICES-V8] Silent API retrieval enabled, attempting to fetch token now...'
											);
											const { handleShowWorkerTokenModal: showModal } = await import(
												'@/v8/utils/workerTokenModalHelperV8'
											);
											await showModal(
												setShowWorkerTokenModal,
												setTokenStatus,
												newValue,
												showTokenAtEnd,
												false // Not forced - respect silent setting
											);
										}
									} catch (error) {
										console.error('[DELETE-DEVICES-V8] Error checking token status:', error);
									}
								}
							}}
							style={{ marginBottom: '12px' }}
						/>

						{/* Show Token After Generation Checkbox - Centralized Component */}
						<ShowTokenConfigCheckboxV8
							onChange={async (newValue) => {
								// Additional logic can be added here if needed
								console.log(
									'[DELETE-DEVICES-V8] Show Token After Generation changed to:',
									newValue
								);
							}}
						/>
					</div>

					{/* Load Devices Button */}
					<button
						type="button"
						onClick={handleLoadDevices}
						disabled={
							loadingSpinner.isLoading ||
							!environmentId.trim() ||
							!username.trim() ||
							!tokenStatus.isValid
						}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								loadingSpinner.isLoading ||
								!environmentId.trim() ||
								!username.trim() ||
								!tokenStatus.isValid
									? '#9ca3af'
									: '#3b82f6',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								loadingSpinner.isLoading ||
								!environmentId.trim() ||
								!username.trim() ||
								!tokenStatus.isValid
									? 'not-allowed'
									: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
						}}
					>
						{loadingSpinner.isLoading ? (
							<>
								<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
								Loading Devices...
							</>
						) : (
							<>🔍 Get Devices</>
						)}
					</button>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div
					style={{
						padding: '16px',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '8px',
						marginBottom: '24px',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					<FiAlertCircle style={{ color: '#dc2626', fontSize: '20px', flexShrink: 0 }} />
					<div style={{ flex: 1 }}>
						<strong style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>
							Error
						</strong>
						<span style={{ color: '#991b1b' }}>{error}</span>
					</div>
					<button
						type="button"
						onClick={() => setError(null)}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#991b1b',
							padding: '4px',
						}}
					>
						<FiX />
					</button>
				</div>
			)}

			{/* Devices List */}
			{devices.length > 0 && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '20px',
							gap: '12px',
							flexWrap: 'wrap',
						}}
					>
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
							Devices to Delete ({devices.length} total, {selectedCount} selected)
						</h2>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
							<button
								type="button"
								onClick={handleSelectAll}
								style={{
									padding: '6px 10px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									background: '#f9fafb',
									fontSize: '12px',
									cursor: 'pointer',
								}}
							>
								Select All
							</button>
							<button
								type="button"
								onClick={handleClearSelection}
								style={{
									padding: '6px 10px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									background: '#f9fafb',
									fontSize: '12px',
									cursor: 'pointer',
								}}
							>
								Clear Selection
							</button>
							<button
								type="button"
								onClick={handleDeleteAll}
								disabled={deletingSpinner.isLoading || devices.length === 0 || selectedCount === 0}
								style={{
									padding: '10px 20px',
									border: 'none',
									borderRadius: '6px',
									background:
										deletingSpinner.isLoading || devices.length === 0 || selectedCount === 0
											? '#9ca3af'
											: '#ef4444',
									color: 'white',
									fontSize: '16px',
									fontWeight: '600',
									cursor:
										deletingSpinner.isLoading || devices.length === 0 || selectedCount === 0
											? 'not-allowed'
											: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								{deletingSpinner.isLoading ? (
									<>
										<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
										Deleting...
									</>
								) : (
									<>
										<FiTrash2 />
										Delete Selected ({selectedCount})
									</>
								)}
							</button>
						</div>
					</div>

					<div style={{ display: 'grid', gap: '12px' }}>
						{devices.map((device) => {
							const deviceId = device.id as string;
							const isSelected = selectedDeviceIds.has(deviceId);
							const label = (device.nickname || device.name || deviceId) as string;
							return (
								<div
									key={deviceId}
									style={{
										padding: '16px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
										<input
											type="checkbox"
											checked={isSelected}
											onChange={() => handleToggleDeviceSelection(deviceId)}
											aria-label={`Select device ${label}`}
											style={{ marginTop: '2px' }}
										/>
										<div>
											<div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
												{device.type as string} - {label}
											</div>
											<div style={{ fontSize: '12px', color: '#6b7280' }}>
												ID: <code style={{ fontSize: '11px' }}>{deviceId}</code>
												{typeof device.status !== 'undefined' && (
													<span style={{ marginLeft: '12px' }}>
														Status: <strong>{device.status as string}</strong>
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Deletion Results */}
			{deletionResults && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h2
						style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}
					>
						Deletion Results
					</h2>

					<div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
						<div
							style={{
								padding: '16px',
								background: '#ecfccb',
								border: '1px solid #bef264',
								borderRadius: '8px',
								flex: 1,
							}}
						>
							<div
								style={{
									fontSize: '24px',
									fontWeight: '700',
									color: '#16a34a',
									marginBottom: '4px',
								}}
							>
								{deletionResults.success}
							</div>
							<div style={{ fontSize: '14px', color: '#365314' }}>Successfully Deleted</div>
						</div>
						{deletionResults.failed > 0 && (
							<div
								style={{
									padding: '16px',
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '8px',
									flex: 1,
								}}
							>
								<div
									style={{
										fontSize: '24px',
										fontWeight: '700',
										color: '#dc2626',
										marginBottom: '4px',
									}}
								>
									{deletionResults.failed}
								</div>
								<div style={{ fontSize: '14px', color: '#991b1b' }}>Failed</div>
							</div>
						)}
					</div>

					{deletionResults.errors.length > 0 && (
						<div>
							<h3
								style={{
									margin: '0 0 12px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								Errors:
							</h3>
							<div style={{ display: 'grid', gap: '8px' }}>
								{deletionResults.errors.map((err, index) => (
									<div
										key={index}
										style={{
											padding: '12px',
											background: '#fef2f2',
											border: '1px solid #fecaca',
											borderRadius: '6px',
											fontSize: '13px',
										}}
									>
										<strong style={{ color: '#991b1b' }}>Device {err.deviceId}:</strong>{' '}
										<span style={{ color: '#991b1b' }}>{err.error}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Info Box */}
			<div
				style={{
					marginTop: '32px',
					padding: '16px',
					background: '#eff6ff',
					border: '1px solid #bfdbfe',
					borderRadius: '8px',
					fontSize: '14px',
					color: '#1e40af',
				}}
			>
				<strong>💡 Note:</strong> This utility uses the PingOne MFA API to delete devices. Make sure
				you have the appropriate permissions and that the worker token has the necessary scopes.
				Deleted devices cannot be recovered.
			</div>

			{/* PingOne API Call Display */}
			<div
				style={{
					marginTop: '24px',
					padding: '16px',
					background: '#f8fafc',
					border: '1px solid #e2e8f0',
					borderRadius: '8px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<div>
						<strong style={{ color: '#1f2937' }}>PingOne API Calls</strong>
						<div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
							Shows the live PingOne MFA API requests executed by this page.
						</div>
					</div>
					<ApiDisplayCheckbox />
				</div>
			</div>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" reserveSpace={true} />

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={async () => {
						setShowWorkerTokenModal(false);
						// Update token status after modal closes
						try {
							const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
							setTokenStatus(status);
						} catch (error) {
							console.error(`${MODULE_TAG} Failed to check token status after modal`, error);
							setTokenStatus({ isValid: false, minutesRemaining: 0 });
						}
					}}
					showTokenOnly={(() => {
						if (!showWorkerTokenModal) return false;
						try {
							const config = MFAConfigurationServiceV8.loadConfiguration();
							// For showTokenOnly, we need to check synchronously for the modal display logic
							// Use a simple status check that doesn't require async
							const currentStatus = {
								isValid: false,
								status: 'missing' as const,
								message: 'Checking...',
								expiresAt: null as number | null,
								minutesRemaining: 0,
							};
							return config.workerToken.showTokenAtEnd && currentStatus.isValid;
						} catch {
							return false;
						}
					})()}
				/>
			)}
		</div>
	);
};

export default DeleteAllDevicesUtilityV8;
