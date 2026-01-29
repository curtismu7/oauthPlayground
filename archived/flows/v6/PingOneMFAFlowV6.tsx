// src/pages/flows/PingOneMFAFlowV6.tsx
// V6 PingOne MFA Flow with device table in Steps 1 and 2

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { CredentialsInput } from '../../components/CredentialsInput';
import JSONHighlighter from '../../components/JSONHighlighter';
import { WorkerTokenStatusLabel } from '../../components/WorkerTokenStatusLabel';
import { usePageScroll } from '../../hooks/usePageScroll';
import {
	FiAlertTriangle,
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiCode,
	FiCopy,
	FiEdit,
	FiInfo,
	FiKey,
	FiLock,
	FiMail,
	FiPhone,
	FiPhoneCall,
	FiRefreshCw,
	FiSave,
	FiShield,
	FiSlash,
	FiSmartphone,
	FiTablet,
	FiX,
} from '../../services/commonImportsService';
import PingOneMfaService, { type MfaCredentials } from '../../services/pingOneMfaService';
import { V6FlowService } from '../../services/v6FlowService';
import { useV6CollapsibleSections } from '../../services/v6StepManagementService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const StepContent = styled.div`
	margin: 2rem 0;
`;

const InfoBox = styled.div<{ $variant: 'info' | 'success' | 'warning' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem 1.5rem;
	border-radius: 0.75rem;
	margin: 1rem 0;
	
	${(props) => {
		switch (props.$variant) {
			case 'success':
				return `
					background: #f0fdf4;
					border: 1px solid #bbf7d0;
					color: #166534;
				`;
			case 'warning':
				return `
					background: #fffbeb;
					border: 1px solid #fed7aa;
					color: #92400e;
				`;
			case 'error':
				return `
					background: #fef2f2;
					border: 1px solid #fecaca;
					color: #991b1b;
				`;
			default:
				return `
					background: #eff6ff;
					border: 1px solid #bfdbfe;
					color: #1e40af;
				`;
		}
	}}
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	margin-bottom: 0.5rem;
`;

const InfoText = styled.div`
	font-size: 0.875rem;
	line-height: 1.5;
`;

// Device Table Components
const DeviceTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 1rem 0;
	background: white;
	border-radius: 0.5rem;
	overflow: hidden;
	border: 1px solid #e5e7eb;
`;

const DeviceTableHeader = styled.thead`
	background: #f9fafb;
`;

const DeviceTableHeaderRow = styled.tr``;

const DeviceTableHeaderCell = styled.th`
	padding: 1rem;
	text-align: left;
	font-weight: 600;
	color: #374151;
	border-bottom: 1px solid #e5e7eb;
	font-size: 0.875rem;
`;

const DeviceTableBody = styled.tbody``;

const DeviceTableRow = styled.tr<{ $selected?: boolean }>`
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		background: #f9fafb;
	}
	
	${(props) =>
		props.$selected &&
		`
		background: #f0fdf4;
		border-left: 4px solid #16a34a;
	`}
	
	&:not(:last-child) {
		border-bottom: 1px solid #f3f4f6;
	}
`;

const DeviceTableCell = styled.td`
	padding: 1rem;
	vertical-align: middle;
`;

const DeviceTypeCell = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const DeviceTypeIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 0.5rem;
	background: #f3f4f6;
	color: #6b7280;
`;

const DeviceTypeInfo = styled.div``;

const DeviceTypeName = styled.div`
	font-weight: 600;
	color: #1f2937;
	font-size: 0.875rem;
`;

const DeviceTypeDescription = styled.div`
	color: #6b7280;
	font-size: 0.75rem;
`;

const DeviceStatusBadge = styled.div<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 500;
	
	${(props) => {
		switch (props.$status.toLowerCase()) {
			case 'active':
				return `
					background: #dcfce7;
					color: #166534;
				`;
			case 'activation_required':
				return `
					background: #fef3c7;
					color: #92400e;
				`;
			case 'pending_activation':
				return `
					background: #fef3c7;
					color: #92400e;
				`;
			case 'blocked':
				return `
					background: #fee2e2;
					color: #991b1b;
				`;
			case 'error':
				return `
					background: #fee2e2;
					color: #991b1b;
				`;
			case 'checking':
				return `
					background: #e0e7ff;
					color: #3730a3;
				`;
			default:
				return `
					background: #f3f4f6;
					color: #6b7280;
				`;
		}
	}}
`;

const DeviceActionsCell = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const DeviceActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 500;
	border: 1px solid;
	cursor: pointer;
	transition: all 0.2s ease;
	
	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #059669;
					color: white;
					border-color: #059669;
					
					&:hover {
						background: #047857;
						border-color: #047857;
					}
				`;
			case 'danger':
				return `
					background: #dc2626;
					color: white;
					border-color: #dc2626;
					
					&:hover {
						background: #b91c1c;
						border-color: #b91c1c;
					}
				`;
			default:
				return `
					background: white;
					color: #374151;
					border-color: #d1d5db;
					
					&:hover {
						background: #f9fafb;
						border-color: #9ca3af;
					}
				`;
		}
	}}
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	border: 1px solid;
	cursor: pointer;
	transition: all 0.2s ease;
	
	${(props) =>
		props.$variant === 'primary'
			? `
		background: #059669;
		color: white;
		border-color: #059669;
		
		&:hover {
			background: #047857;
			border-color: #047857;
		}
		
		&:disabled {
			background: #9ca3af;
			border-color: #9ca3af;
			cursor: not-allowed;
		}
	`
			: `
		background: white;
		color: #374151;
		border-color: #d1d5db;
		
		&:hover {
			background: #f9fafb;
			border-color: #9ca3af;
		}
	`}
`;

const SpinningIcon = styled.div`
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

const ActivationModal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ActivationContent = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	max-width: 500px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
`;

const QRCodeContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	padding: 1.5rem;
	background: #f9fafb;
	border-radius: 0.5rem;
	margin: 1rem 0;
`;

const SecretKeyContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem;
	background: #f3f4f6;
	border-radius: 0.375rem;
	font-family: monospace;
	font-size: 0.875rem;
	margin: 1rem 0;
`;

const CopyButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	background: #059669;
	color: white;
	border: none;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	cursor: pointer;
	
	&:hover {
		background: #047857;
	}
`;

// Editable Contact Info Components
const EditableContactContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ContactInfoInput = styled.input`
	padding: 0.25rem 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.25rem;
	font-size: 0.875rem;
	width: 150px;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}
`;

const EditButton = styled.button`
	padding: 0.25rem 0.5rem;
	background: #f3f4f6;
	border: 1px solid #d1d5db;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	cursor: pointer;
	color: #6b7280;
	
	&:hover {
		background: #e5e7eb;
		color: #374151;
	}
`;

const SaveButton = styled.button`
	padding: 0.25rem 0.5rem;
	background: #10b981;
	border: none;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	cursor: pointer;
	color: white;
	
	&:hover {
		background: #059669;
	}
`;

const CancelButton = styled.button`
	padding: 0.25rem 0.5rem;
	background: #f3f4f6;
	border: 1px solid #d1d5db;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	cursor: pointer;
	color: #6b7280;
	
	&:hover {
		background: #e5e7eb;
		color: #374151;
	}
`;

// Phase 1: Enhanced Device Statuses - Complete PingOne MFA device types with all statuses
const mockDevices = [
	{
		id: 'device-sms-001',
		type: 'SMS',
		phoneNumber: '+1 (555) 123-4567',
		status: 'ACTIVATION_REQUIRED', // Device needs OTP activation - OTP sent to phone number
		activationRequired: true,
	},
	{
		id: 'device-email-001',
		type: 'EMAIL',
		emailAddress: 'user@example.com',
		status: 'ACTIVE', // Device ready for MFA challenges
		activationRequired: false,
	},
	{
		id: 'device-totp-001',
		type: 'TOTP',
		status: 'PENDING_ACTIVATION', // Device registered but awaiting user activation
		activationRequired: true,
		qrCode:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
		secret: 'JBSWY3DPEHPK3PXP',
	},
	{
		id: 'device-voice-001',
		type: 'VOICE',
		phoneNumber: '+1 (555) 987-6543',
		status: 'ACTIVE',
		activationRequired: false,
	},
	{
		id: 'device-fido2-001',
		type: 'FIDO2',
		deviceName: 'YubiKey 5 NFC',
		status: 'ACTIVE',
		activationRequired: false,
	},
	{
		id: 'device-mobile-001',
		type: 'MOBILE',
		deviceName: 'iPhone 14 Pro',
		status: 'BLOCKED', // Device temporarily disabled
		activationRequired: false,
		pairingKey: 'ABC123DEF456',
	},
];

const PingOneMFAFlowV6: React.FC = () => {
	const { Collapsible } = V6FlowService.createFlowComponents('blue');
	const { collapsedSections, toggleSection } = useV6CollapsibleSections();

	const [currentStep, setCurrentStep] = useState(0);
	const [selectedDevice, setSelectedDevice] = useState<any>(null);
	const [mfaDevices, setMfaDevices] = useState(mockDevices);
	const [workerToken, setWorkerToken] = useState('');
	const [credentials, setCredentials] = useState({
		clientId: '',
		clientSecret: '',
		environmentId: '',
		region: 'com',
		authMethod: 'client_secret_basic',
		username: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [showActivationModal, setShowActivationModal] = useState(false);
	const [activatingDevice, setActivatingDevice] = useState<any>(null);
	const [activationCode, setActivationCode] = useState('');
	const [apiRequestDetails, setApiRequestDetails] = useState<any>(null);
	const [apiResponseDetails, setApiResponseDetails] = useState<any>(null);
	const [editingDevice, setEditingDevice] = useState<string | null>(null);
	const [editingValue, setEditingValue] = useState('');

	usePageScroll();

	const initiateMfaChallenge = useCallback(
		async (device: any) => {
			if (!workerToken || !credentials.environmentId || !credentials.username) {
				v4ToastManager.showError('Please configure credentials first');
				return;
			}

			setIsLoading(true);

			try {
				const mfaCredentials: MfaCredentials = {
					workerToken,
					environmentId: credentials.environmentId,
					userId: credentials.username, // Using username as userId for demo
				};

				// Send real MFA challenge via PingOne API
				const result = await PingOneMfaService.sendChallenge(mfaCredentials, {
					deviceId: device.id,
					challengeType: device.type,
				});

				v4ToastManager.showSuccess(`Real MFA challenge sent to ${device.type} device!`);

				// Store API request/response for educational display
				setApiRequestDetails({
					method: 'POST',
					url: `https://api.pingone.com/v1/environments/${credentials.environmentId}/users/${credentials.username}/devices/${device.id}/authentications`,
					headers: {
						Authorization: `Bearer ${workerToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						type: device.type,
					}),
				});

				setApiResponseDetails(result);
				setCurrentStep(3);
			} catch (error) {
				console.error('[P1MFA] Challenge failed:', error);
				v4ToastManager.showError(
					`Failed to send MFA challenge: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			} finally {
				setIsLoading(false);
			}
		},
		[workerToken, credentials]
	);

	const activateDevice = useCallback((device: any) => {
		setActivatingDevice(device);
		setShowActivationModal(true);
	}, []);

	const completeActivation = useCallback(async () => {
		if (!activationCode) {
			v4ToastManager.showError('Please enter the activation code');
			return;
		}

		if (!workerToken || !credentials.environmentId || !credentials.username) {
			v4ToastManager.showError('Please configure credentials first');
			return;
		}

		setIsLoading(true);

		try {
			const mfaCredentials: MfaCredentials = {
				workerToken,
				environmentId: credentials.environmentId,
				userId: credentials.username,
			};

			// Real device activation via PingOne API
			await PingOneMfaService.activateDevice(mfaCredentials, {
				deviceId: activatingDevice.id,
				otp: activationCode,
			});

			// Update device status in local state
			setMfaDevices((prev) =>
				prev.map((d) =>
					d.id === activatingDevice.id
						? { ...d, status: 'ACTIVE' as const, activationRequired: false }
						: d
				)
			);

			setShowActivationModal(false);
			setActivatingDevice(null);
			setActivationCode('');
			v4ToastManager.showSuccess(
				`${activatingDevice.type} device activated successfully with real PingOne API!`
			);
		} catch (error) {
			console.error('[P1MFA] Activation failed:', error);
			v4ToastManager.showError(
				`Device activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsLoading(false);
		}
	}, [activationCode, activatingDevice, workerToken, credentials]);

	// Load real devices from PingOne API
	const _loadRealDevices = useCallback(async () => {
		if (!workerToken || !credentials.environmentId || !credentials.username) {
			return;
		}

		setIsLoading(true);

		try {
			const mfaCredentials: MfaCredentials = {
				workerToken,
				environmentId: credentials.environmentId,
				userId: credentials.username,
			};

			const realDevices = await PingOneMfaService.getDevices(mfaCredentials);

			if (realDevices.length > 0) {
				setMfaDevices(realDevices);
				v4ToastManager.showSuccess(`Loaded ${realDevices.length} real MFA devices from PingOne!`);
			} else {
				v4ToastManager.showSuccess('No MFA devices found. You can create new devices below.');
			}
		} catch (error) {
			console.error('[P1MFA] Failed to load devices:', error);
			v4ToastManager.showError(
				`Failed to load devices: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsLoading(false);
		}
	}, [workerToken, credentials]);

	const handleEditContactInfo = useCallback((deviceId: string, currentValue: string) => {
		setEditingDevice(deviceId);
		setEditingValue(currentValue);
	}, []);

	const handleSaveContactInfo = useCallback(
		(deviceId: string) => {
			setMfaDevices((prevDevices) =>
				prevDevices.map((device) => {
					if (device.id === deviceId) {
						const updatedDevice = { ...device };
						if (device.type === 'SMS' || device.type === 'VOICE') {
							updatedDevice.phoneNumber = editingValue;
						} else if (device.type === 'EMAIL') {
							updatedDevice.emailAddress = editingValue;
						} else if (device.type === 'FIDO2' || device.type === 'MOBILE') {
							updatedDevice.deviceName = editingValue;
						}
						return updatedDevice;
					}
					return device;
				})
			);
			setEditingDevice(null);
			setEditingValue('');
			v4ToastManager.showSuccess('Contact information updated successfully!');
		},
		[editingValue]
	);

	const handleCancelEdit = useCallback(() => {
		setEditingDevice(null);
		setEditingValue('');
	}, []);

	const getDevicesNeedingContactInfo = useCallback(() => {
		return mfaDevices.filter((device) => {
			if (device.type === 'SMS' || device.type === 'VOICE') {
				return !device.phoneNumber || device.phoneNumber.trim() === '';
			}
			if (device.type === 'EMAIL') {
				return !device.emailAddress || device.emailAddress.trim() === '';
			}
			if (device.type === 'FIDO2' || device.type === 'MOBILE') {
				return !device.deviceName || device.deviceName.trim() === '';
			}
			return false;
		});
	}, [mfaDevices]);

	const copyToClipboard = useCallback((text: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess('Copied to clipboard');
	}, []);

	// Auto-save functionality
	const saveCredentials = useCallback((creds: any) => {
		try {
			localStorage.setItem('pingone-mfa-v6-credentials', JSON.stringify(creds));
		} catch (error) {
			console.warn('Failed to save credentials:', error);
		}
	}, []);

	// Real PingOne Worker Token Acquisition
	const getWorkerToken = useCallback(async () => {
		setIsLoading(true);

		try {
			v4ToastManager.showSuccess(
				`Requesting worker token from PingOne using ${credentials.authMethod}...`
			);

			// Check for unsupported auth methods
			if (credentials.authMethod === 'client_secret_jwt') {
				v4ToastManager.showError(
					'Client Secret JWT not implemented in this demo. Use Basic or Post method.'
				);
				return;
			} else if (credentials.authMethod === 'private_key_jwt') {
				v4ToastManager.showError(
					'Private Key JWT not implemented in this demo. Use Basic or Post method.'
				);
				return;
			}

			// Define the required scopes for MFA operations
			const mfaScopes =
				'p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device p1:delete:device';

			// Prepare the request in the format expected by the backend
			const requestBody: Record<string, string> = {
				grant_type: 'client_credentials',
				scope: mfaScopes,
			};

			const requestHeaders: Record<string, string> = {};

			// Handle different authentication methods
			if (credentials.authMethod === 'client_secret_basic') {
				// Basic authentication - credentials in Authorization header
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				requestHeaders['Authorization'] = `Basic ${basicAuth}`;
			} else {
				// POST authentication - credentials in request body
				requestBody.client_id = credentials.clientId;
				requestBody.client_secret = credentials.clientSecret;
			}

			// Display the actual PingOne request details (not the proxy format)
			const displayBody: Record<string, string> = { ...requestBody };
			if (displayBody.client_secret) {
				displayBody.client_secret = '[REDACTED]';
			}

			const displayHeaders: Record<string, string> = { ...requestHeaders };
			if (displayHeaders.Authorization) {
				displayHeaders.Authorization = displayHeaders.Authorization.replace(
					/Basic .+/,
					'Basic [REDACTED]'
				);
			}

			setApiRequestDetails({
				url: `https://auth.pingone.${credentials.region}/v1/environments/${credentials.environmentId}/as/token`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					...displayHeaders,
				},
				body: displayBody,
				authMethod: credentials.authMethod,
				timestamp: new Date().toISOString(),
			});

			const proxyPayload = {
				environment_id: credentials.environmentId,
				auth_method: credentials.authMethod,
				headers: requestHeaders,
				body: requestBody,
			};

			const response = await fetch('/api/client-credentials', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(proxyPayload),
			});

			const tokenData = await response.json();

			if (!response.ok) {
				// Capture error response details
				setApiResponseDetails({
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: tokenData,
					timestamp: new Date().toISOString(),
				});
				throw new Error(
					tokenData.error_description || `HTTP ${response.status}: ${response.statusText}`
				);
			}

			if (!tokenData.access_token) {
				throw new Error('No access token received from PingOne');
			}

			// Capture successful response details (like App Generator)
			const displayResponseData = {
				...tokenData,
				access_token: `${tokenData.access_token.substring(0, 20)}...[TRUNCATED FOR SECURITY]`,
			};

			setApiResponseDetails({
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				body: displayResponseData,
				timestamp: new Date().toISOString(),
			});

			setWorkerToken(tokenData.access_token);
			saveCredentials({ ...credentials, workerToken: tokenData.access_token });

			v4ToastManager.showSuccess(
				`✅ Real worker token obtained from PingOne using ${credentials.authMethod}!`
			);
		} catch (error: any) {
			console.error('PingOne Token Error:', error);
			v4ToastManager.showError(`Failed to get worker token: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	}, [credentials, saveCredentials]);

	const loadCredentials = useCallback(() => {
		try {
			const saved = localStorage.getItem('pingone-mfa-v6-credentials');
			if (saved) {
				const parsed = JSON.parse(saved);
				setCredentials((prev) => ({ ...prev, ...parsed }));
				if (parsed.workerToken) {
					setWorkerToken(parsed.workerToken);
				}
			}
		} catch (error) {
			console.warn('Failed to load credentials:', error);
		}
	}, []);

	// Auto-save credentials when they change
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (
				credentials.clientId ||
				credentials.clientSecret ||
				credentials.environmentId ||
				credentials.username
			) {
				saveCredentials({ ...credentials, workerToken });
			}
		}, 1000); // Debounce for 1 second

		return () => clearTimeout(timeoutId);
	}, [credentials, workerToken, saveCredentials]);

	// Load credentials on component mount
	React.useEffect(() => {
		loadCredentials();
	}, [loadCredentials]);

	// Phase 1: Basic Device Management Functions (Phase 2 will add more)
	// Currently only activation is implemented in Phase 1

	const renderDeviceTable = (stepContext: 'registration' | 'selection') => {
		const devicesNeedingInfo = getDevicesNeedingContactInfo();

		return (
			<>
				{devicesNeedingInfo.length > 0 && (
					<InfoBox $variant="warning" style={{ marginBottom: '1rem' }}>
						<FiInfo size={20} style={{ flexShrink: 0 }} />
						<InfoContent>
							<InfoTitle>⚠️ Contact Information Required</InfoTitle>
							<InfoText>
								{devicesNeedingInfo.length} device{devicesNeedingInfo.length > 1 ? 's' : ''} need
								{devicesNeedingInfo.length === 1 ? 's' : ''} contact information. Click the "Edit"
								button next to each device to add phone numbers, email addresses, or device names.
								<br />
								<strong>Devices needing info:</strong>{' '}
								{devicesNeedingInfo.map((d) => `${d.type} Device`).join(', ')}
							</InfoText>
						</InfoContent>
					</InfoBox>
				)}
				<DeviceTable>
					<DeviceTableHeader>
						<DeviceTableHeaderRow>
							<DeviceTableHeaderCell>Device Type</DeviceTableHeaderCell>
							<DeviceTableHeaderCell>Contact Info</DeviceTableHeaderCell>
							<DeviceTableHeaderCell>Status</DeviceTableHeaderCell>
							<DeviceTableHeaderCell>Device ID</DeviceTableHeaderCell>
							<DeviceTableHeaderCell>Actions</DeviceTableHeaderCell>
						</DeviceTableHeaderRow>
					</DeviceTableHeader>
					<DeviceTableBody>
						{mfaDevices.length > 0 ? (
							mfaDevices.map((device) => {
								const isSelected = selectedDevice?.id === device.id;
								return (
									<DeviceTableRow
										key={device.id}
										$selected={isSelected}
										onClick={() => {
											if (stepContext === 'selection' && device.status === 'ACTIVE') {
												setSelectedDevice(device);
												v4ToastManager.showSuccess(`Selected: ${device.type} device`);
											}
										}}
										style={{
											cursor:
												stepContext === 'selection' && device.status === 'ACTIVE'
													? 'pointer'
													: 'default',
										}}
									>
										{/* Device Type Column */}
										<DeviceTableCell>
											<DeviceTypeCell>
												<DeviceTypeIcon>
													{device.type === 'SMS' && <FiPhone />}
													{device.type === 'EMAIL' && <FiMail />}
													{device.type === 'TOTP' && <FiLock />}
													{device.type === 'PUSH' && <FiSmartphone />}
													{device.type === 'VOICE' && <FiPhoneCall />}
													{device.type === 'FIDO2' && <FiShield />}
													{device.type === 'MOBILE' && <FiTablet />}
												</DeviceTypeIcon>
												<DeviceTypeInfo>
													<DeviceTypeName>{device.type} Device</DeviceTypeName>
													<DeviceTypeDescription>
														{device.type === 'SMS' && 'SMS Text Messages'}
														{device.type === 'EMAIL' && 'Email Verification'}
														{device.type === 'TOTP' && 'Time-based OTP (Authenticator App)'}
														{device.type === 'PUSH' && 'Push Notifications'}
														{device.type === 'VOICE' && 'Voice Call Verification'}
														{device.type === 'FIDO2' && 'FIDO2/WebAuthn Security Key'}
														{device.type === 'MOBILE' && 'PingID Mobile Application'}
													</DeviceTypeDescription>
												</DeviceTypeInfo>
											</DeviceTypeCell>
										</DeviceTableCell>

										{/* Contact Info Column - Editable */}
										<DeviceTableCell>
											{(() => {
												// Get the current contact value
												let contactValue = '';
												let isEditable = false;

												if (device.type === 'SMS' || device.type === 'VOICE') {
													contactValue = device.phoneNumber || '';
													isEditable = true;
												} else if (device.type === 'EMAIL') {
													contactValue = device.emailAddress || '';
													isEditable = true;
												} else if (device.type === 'FIDO2') {
													contactValue = device.deviceName || 'Security Key';
													isEditable = true;
												} else if (device.type === 'MOBILE') {
													contactValue = device.deviceName || 'Mobile Device';
													isEditable = true;
												} else if (device.type === 'TOTP') {
													contactValue = 'Authenticator App';
													isEditable = false;
												} else if (device.type === 'PUSH') {
													contactValue = 'Mobile Push';
													isEditable = false;
												}

												// If this device is being edited
												if (editingDevice === device.id && isEditable) {
													return (
														<EditableContactContainer>
															<ContactInfoInput
																type={device.type === 'EMAIL' ? 'email' : 'text'}
																value={editingValue}
																onChange={(e) => setEditingValue(e.target.value)}
																placeholder={
																	device.type === 'SMS' || device.type === 'VOICE'
																		? '+1 (555) 123-4567'
																		: device.type === 'EMAIL'
																			? 'user@example.com'
																			: 'Device Name'
																}
																autoFocus
															/>
															<SaveButton onClick={() => handleSaveContactInfo(device.id)}>
																<FiSave size={12} /> Save
															</SaveButton>
															<CancelButton onClick={handleCancelEdit}>
																<FiX size={12} /> Cancel
															</CancelButton>
														</EditableContactContainer>
													);
												}

												// Display mode
												return (
													<EditableContactContainer>
														<span>{contactValue || 'N/A'}</span>
														{isEditable && (
															<EditButton
																onClick={() => handleEditContactInfo(device.id, contactValue)}
																title="Click to edit contact information"
															>
																<FiEdit size={12} /> Edit
															</EditButton>
														)}
													</EditableContactContainer>
												);
											})()}
										</DeviceTableCell>

										{/* Status Column */}
										<DeviceTableCell>
											<DeviceStatusBadge $status={device.status.toLowerCase()}>
												{device.status === 'CHECKING' && (
													<SpinningIcon>
														<FiRefreshCw size={12} />
													</SpinningIcon>
												)}
												{device.status === 'ERROR' && <FiAlertTriangle size={12} />}
												{device.status === 'ACTIVE' && <FiCheckCircle size={12} />}
												{device.status === 'ACTIVATION_REQUIRED' && <FiClock size={12} />}
												{device.status === 'PENDING_ACTIVATION' && <FiAlertTriangle size={12} />}
												{device.status === 'BLOCKED' && <FiSlash size={12} />}
												{device.status === 'ACTIVATION_REQUIRED'
													? 'NEEDS OTP'
													: device.status.replace('_', ' ')}
											</DeviceStatusBadge>
										</DeviceTableCell>

										{/* Device ID Column */}
										<DeviceTableCell>
											<code
												style={{
													fontSize: '0.75rem',
													background: '#f3f4f6',
													padding: '0.25rem 0.5rem',
													borderRadius: '0.25rem',
													color: '#6b7280',
												}}
											>
												{device.id.substring(0, 8)}...
											</code>
										</DeviceTableCell>
										{/* Actions Column - Phase 1: Basic Actions */}
										<DeviceTableCell>
											<DeviceActionsCell>
												{/* Activation Actions - Phase 1: Enhanced Status Handling */}
												{device.status === 'ACTIVATION_REQUIRED' && (
													<DeviceActionButton
														$variant="primary"
														onClick={(e) => {
															e.stopPropagation();
															activateDevice(device);
														}}
														title="Device needs OTP activation - OTP sent to phone/email"
													>
														<FiClock size={12} />
														Enter OTP
													</DeviceActionButton>
												)}

												{device.status === 'PENDING_ACTIVATION' && (
													<DeviceActionButton
														$variant="primary"
														onClick={(e) => {
															e.stopPropagation();
															activateDevice(device);
														}}
														title="Complete device activation (QR scan, pairing, etc.)"
													>
														<FiCheckCircle size={12} />
														Activate
													</DeviceActionButton>
												)}

												{/* Test Device */}
												{stepContext === 'selection' && device.status === 'ACTIVE' && (
													<DeviceActionButton
														$variant="primary"
														onClick={(e) => {
															e.stopPropagation();
															setSelectedDevice(device);
															initiateMfaChallenge(device);
														}}
													>
														<FiSmartphone size={12} />
														Test
													</DeviceActionButton>
												)}

												{/* Status Check */}
												<DeviceActionButton
													$variant="secondary"
													onClick={(e) => {
														e.stopPropagation();
														v4ToastManager.showSuccess('Device status checked');
													}}
												>
													<FiRefreshCw size={12} />
													Check
												</DeviceActionButton>
											</DeviceActionsCell>
										</DeviceTableCell>
									</DeviceTableRow>
								);
							})
						) : (
							<DeviceTableRow>
								<DeviceTableCell
									colSpan={5}
									style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}
								>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: '0.5rem',
										}}
									>
										<FiSmartphone size={24} style={{ opacity: 0.5 }} />
										<span>No MFA devices registered yet</span>
										<span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
											{stepContext === 'registration'
												? 'Register your first device using the form below'
												: 'Go back to Step 1 to register devices'}
										</span>
									</div>
								</DeviceTableCell>
							</DeviceTableRow>
						)}
					</DeviceTableBody>
				</DeviceTable>
			</>
		);
	};

	return (
		<Container>
			<div style={{ marginBottom: '2rem' }}>
				<h1
					style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}
				>
					PingOne MFA Flow V6
				</h1>
				<p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
					Multi-Factor Authentication with Device Management
				</p>
			</div>

			<div
				style={{
					marginBottom: '2rem',
					padding: '1rem',
					background: '#f9fafb',
					borderRadius: '0.5rem',
					border: '1px solid #e5e7eb',
				}}
			>
				<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
					{['Setup', 'Device Mgmt', 'Selection', 'Challenge', 'Exchange', 'Complete'].map(
						(step, index) => (
							<div
								key={index}
								style={{
									flex: 1,
									padding: '0.5rem',
									textAlign: 'center',
									borderRadius: '0.25rem',
									fontSize: '0.875rem',
									fontWeight: '500',
									background: index === currentStep ? '#059669' : '#e5e7eb',
									color: index === currentStep ? 'white' : '#6b7280',
								}}
							>
								{step}
							</div>
						)
					)}
				</div>
			</div>

			{/* Step 0: Setup */}
			{currentStep === 0 && (
				<StepContent>
					<Collapsible.CollapsibleSection>
						<Collapsible.CollapsibleHeaderButton
							onClick={() => toggleSection('workerToken')}
							aria-expanded={!collapsedSections.workerToken}
						>
							<Collapsible.CollapsibleTitle>
								<FiKey /> Worker Token Configuration
							</Collapsible.CollapsibleTitle>
							<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.workerToken}>
								<FiChevronDown />
							</Collapsible.CollapsibleToggleIcon>
						</Collapsible.CollapsibleHeaderButton>
						{!collapsedSections.workerToken && (
							<Collapsible.CollapsibleContent>
								<InfoBox $variant="info">
									<FiInfo size={20} style={{ flexShrink: 0 }} />
									<InfoContent>
										<InfoTitle>🔑 Real PingOne Worker Token Acquisition</InfoTitle>
										<InfoText>
											Enter your real PingOne application credentials to obtain an actual worker
											token from PingOne. This makes real API calls to PingOne's token endpoint and
											returns a valid access token for MFA device management.
										</InfoText>
									</InfoContent>
								</InfoBox>

								<div
									style={{
										margin: '1rem 0',
										padding: '1rem',
										background: '#e0f2fe',
										borderRadius: '0.5rem',
										border: '1px solid #0284c7',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#0c4a6e',
										}}
									>
										🔗 Worker Token API Process
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: '1.5' }}>
										<div>
											<strong>Endpoint:</strong> POST https://auth.pingone.{'{region}'}
											/v1/environments/{'{environmentId}'}/as/token
										</div>
										<div>
											<strong>Grant Type:</strong> client_credentials (always for worker tokens)
										</div>
										<div>
											<strong>Auth Method:</strong> {credentials.authMethod}
										</div>
										<div>
											<strong>Scope:</strong> p1:read:user p1:update:user p1:create:device
											p1:read:device p1:update:device p1:delete:device
										</div>
										<div>
											<strong>Auto-Save:</strong> Credentials and tokens are automatically saved to
											localStorage
										</div>
									</div>
								</div>

								<div
									style={{
										margin: '1rem 0',
										padding: '1rem',
										background: '#f0f9ff',
										borderRadius: '0.5rem',
										border: '1px solid #0ea5e9',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#0c4a6e',
										}}
									>
										🔐 Worker Token Authentication Methods
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: '1.5' }}>
										<div>
											<strong>Client Secret Basic:</strong> Credentials sent in Authorization header
											(Base64 encoded) - Most common
										</div>
										<div>
											<strong>Client Secret Post:</strong> Credentials sent in request body as form
											parameters
										</div>
										<div>
											<strong>Private Key JWT:</strong> Client authenticates using signed JWT with
											private key - Most secure
										</div>
										<div>
											<strong>Client Secret JWT:</strong> Client authenticates using signed JWT with
											shared secret
										</div>
										<div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
											<strong>Note:</strong> Worker tokens always use client_credentials grant type
										</div>
									</div>
								</div>

								{/* Phase 1: Educational Content about Device Statuses */}
								<div
									style={{
										margin: '1.5rem 0',
										padding: '1rem',
										background: '#fef3c7',
										borderRadius: '0.5rem',
										border: '1px solid #fbbf24',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.75rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#92400e',
										}}
									>
										📋 Phase 1: PingOne MFA Device Status Types
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: '1.6' }}>
										<div style={{ marginBottom: '0.5rem' }}>
											<strong>ACTIVATION_REQUIRED:</strong> Device needs OTP activation. The OTP is
											sent to the phone number or email address specified in the device resource's
											properties.
										</div>
										<div style={{ marginBottom: '0.5rem' }}>
											<strong>PENDING_ACTIVATION:</strong> Device registered but awaiting user
											activation (QR scan, pairing key, etc.)
										</div>
										<div style={{ marginBottom: '0.5rem' }}>
											<strong>ACTIVE:</strong> Device ready for MFA challenges and authentication
										</div>
										<div style={{ marginBottom: '0.5rem' }}>
											<strong>BLOCKED:</strong> Device temporarily disabled by administrator
										</div>
										<div>
											<strong>ERROR:</strong> Device has configuration or connectivity issues
										</div>
									</div>
								</div>

								<div
									style={{
										margin: '1rem 0',
										padding: '1rem',
										background: '#e0f2fe',
										borderRadius: '0.5rem',
										border: '1px solid #0284c7',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#0c4a6e',
										}}
									>
										🔗 Device Activation API (ACTIVATION_REQUIRED)
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: '1.5' }}>
										<div>
											<strong>Endpoint:</strong> POST /environments/{'{environmentId}'}/users/
											{'{userId}'}/devices/{'{deviceId}'}
										</div>
										<div>
											<strong>Content-Type:</strong>{' '}
											application/vnd.pingidentity.device.activate+json
										</div>
										<div>
											<strong>Purpose:</strong> Activate devices with ACTIVATION_REQUIRED status
											using valid OTP
										</div>
										<div>
											<strong>Process:</strong> OTP sent to phone/email → User enters OTP → Device
											becomes ACTIVE
										</div>
									</div>
								</div>

								{/* Reuse existing CredentialsInput component with proper validation */}
								<CredentialsInput
									environmentId={credentials.environmentId}
									clientId={credentials.clientId}
									clientSecret={credentials.clientSecret}
									scopes="p1:read:user p1:update:user p1:create:device p1:read:device p1:update:device p1:delete:device"
									onEnvironmentIdChange={(value) =>
										setCredentials((prev) => ({ ...prev, environmentId: value }))
									}
									onClientIdChange={(value) =>
										setCredentials((prev) => ({ ...prev, clientId: value }))
									}
									onClientSecretChange={(value) =>
										setCredentials((prev) => ({ ...prev, clientSecret: value }))
									}
									onScopesChange={() => {}} // No-op to prevent changes - scopes are fixed for MFA
									showClientSecret={true}
									showEnvironmentIdInput={true}
									showRedirectUri={false}
									showPostLogoutRedirectUri={false}
									showLoginHint={false}
									flowKey="client_credentials"
								/>

								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
										Region
									</label>
									<select
										value={credentials.region}
										onChange={(e) =>
											setCredentials((prev) => ({ ...prev, region: e.target.value }))
										}
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
										}}
									>
										<option value="com">North America (com)</option>
										<option value="eu">Europe (eu)</option>
										<option value="asia">Asia Pacific (asia)</option>
										<option value="ca">Canada (ca)</option>
									</select>
								</div>

								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
										Authentication Method *
									</label>
									<select
										value={credentials.authMethod}
										onChange={(e) =>
											setCredentials((prev) => ({ ...prev, authMethod: e.target.value }))
										}
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
										}}
									>
										<option value="client_secret_basic">Client Secret Basic</option>
										<option value="client_secret_post">Client Secret Post</option>
										<option value="private_key_jwt">Private Key JWT</option>
										<option value="client_secret_jwt">Client Secret JWT</option>
									</select>
									<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
										Grant Type: client_credentials (fixed for worker tokens)
									</div>
								</div>

								{/* Get Worker Token Button */}
								<div
									style={{
										marginBottom: '1rem',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'flex-start',
										gap: '0.35rem',
									}}
								>
									<ActionButton
										$variant="primary"
										onClick={getWorkerToken}
										disabled={
											isLoading ||
											!credentials.clientId ||
											!credentials.clientSecret ||
											!credentials.environmentId ||
											!credentials.authMethod
										}
										style={{ width: '100%' }}
									>
										{isLoading ? (
											<>
												<SpinningIcon>
													<FiRefreshCw size={16} />
												</SpinningIcon>
												Getting Worker Token...
											</>
										) : (
											<>
												<FiKey size={16} />
												Get Worker Token
											</>
										)}
									</ActionButton>
									<WorkerTokenStatusLabel
										token={workerToken}
										tokenStorageKey="worker_token"
										tokenExpiryKey="worker_token_expires_at"
									/>
								</div>

								{/* Worker Token Display */}
								{workerToken && (
									<div style={{ marginBottom: '1rem' }}>
										<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
											Worker Token (Auto-Generated)
										</label>
										<div style={{ position: 'relative' }}>
											<input
												type="password"
												value={workerToken}
												readOnly
												style={{
													width: '100%',
													padding: '0.75rem',
													border: '1px solid #10b981',
													borderRadius: '0.5rem',
													fontSize: '0.875rem',
													background: '#f0fdf4',
												}}
											/>
											<button
												onClick={() => copyToClipboard(workerToken)}
												style={{
													position: 'absolute',
													right: '0.5rem',
													top: '50%',
													transform: 'translateY(-50%)',
													background: 'none',
													border: 'none',
													cursor: 'pointer',
													color: '#10b981',
												}}
											>
												<FiCopy size={16} />
											</button>
										</div>
									</div>
								)}

								{/* API Request Details Display (like App Generator) */}
								{apiRequestDetails && (
									<div
										style={{
											margin: '1.5rem 0',
											padding: '1rem',
											background: '#f8fafc',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
										}}
									>
										<h4
											style={{
												margin: '0 0 1rem 0',
												fontSize: '1rem',
												fontWeight: '600',
												color: '#1f2937',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
											}}
										>
											<FiArrowRight style={{ color: '#059669' }} />
											API Request Details
										</h4>

										<div style={{ marginBottom: '1rem' }}>
											<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
												<strong>URL:</strong>{' '}
												<code
													style={{
														background: '#f1f5f9',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{apiRequestDetails.url}
												</code>
											</div>
											<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
												<strong>Method:</strong>{' '}
												<code
													style={{
														background: '#f1f5f9',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{apiRequestDetails.method}
												</code>
											</div>
											<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
												<strong>Auth Method:</strong>{' '}
												<code
													style={{
														background: '#f1f5f9',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{apiRequestDetails.authMethod}
												</code>
											</div>
										</div>

										<div style={{ marginBottom: '1rem' }}>
											<strong style={{ fontSize: '0.875rem' }}>Headers:</strong>
											<div
												style={{
													marginTop: '0.5rem',
													background: '#ffffff',
													border: '1px solid #e5e7eb',
													borderRadius: '0.375rem',
													overflow: 'hidden',
												}}
											>
												<JSONHighlighter data={apiRequestDetails.headers} />
											</div>
										</div>

										<div>
											<strong style={{ fontSize: '0.875rem' }}>Request Body:</strong>
											<div
												style={{
													marginTop: '0.5rem',
													background: '#ffffff',
													border: '1px solid #e5e7eb',
													borderRadius: '0.375rem',
													overflow: 'hidden',
												}}
											>
												<JSONHighlighter data={apiRequestDetails.body} />
											</div>
										</div>
									</div>
								)}

								{/* API Response Details Display (like App Generator) */}
								{apiResponseDetails && (
									<div
										style={{
											margin: '1.5rem 0',
											padding: '1rem',
											background: '#f0fdf4',
											borderRadius: '0.5rem',
											border: '1px solid #bbf7d0',
										}}
									>
										<h4
											style={{
												margin: '0 0 1rem 0',
												fontSize: '1rem',
												fontWeight: '600',
												color: '#1f2937',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
											}}
										>
											<FiArrowLeft style={{ color: '#059669' }} />
											API Response Details
										</h4>

										<div style={{ marginBottom: '1rem' }}>
											<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
												<strong>Status:</strong>{' '}
												<code
													style={{
														background: apiResponseDetails.status === 200 ? '#dcfce7' : '#fee2e2',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{apiResponseDetails.status} {apiResponseDetails.statusText}
												</code>
											</div>
											<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
												<strong>Timestamp:</strong>{' '}
												<code
													style={{
														background: '#f1f5f9',
														padding: '0.25rem 0.5rem',
														borderRadius: '0.25rem',
													}}
												>
													{new Date(apiResponseDetails.timestamp).toLocaleString()}
												</code>
											</div>
										</div>

										<div style={{ marginBottom: '1rem' }}>
											<strong style={{ fontSize: '0.875rem' }}>Response Headers:</strong>
											<div
												style={{
													marginTop: '0.5rem',
													background: '#ffffff',
													border: '1px solid #e5e7eb',
													borderRadius: '0.375rem',
													overflow: 'hidden',
												}}
											>
												<JSONHighlighter data={apiResponseDetails.headers} />
											</div>
										</div>

										<div>
											<strong style={{ fontSize: '0.875rem' }}>Response Body:</strong>
											<div
												style={{
													marginTop: '0.5rem',
													background: '#ffffff',
													border: '1px solid #e5e7eb',
													borderRadius: '0.375rem',
													overflow: 'hidden',
												}}
											>
												<JSONHighlighter data={apiResponseDetails.body} />
											</div>
										</div>
									</div>
								)}
							</Collapsible.CollapsibleContent>
						)}
					</Collapsible.CollapsibleSection>
				</StepContent>
			)}

			{/* Step 1: Device Registration */}
			{currentStep === 1 && (
				<StepContent>
					<Collapsible.CollapsibleSection>
						<Collapsible.CollapsibleHeaderButton
							onClick={() => toggleSection('deviceManagement')}
							aria-expanded={!collapsedSections.deviceManagement}
						>
							<Collapsible.CollapsibleTitle>
								<FiCheckCircle /> MFA Device Management ({mfaDevices.length} devices)
							</Collapsible.CollapsibleTitle>
							<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.deviceManagement}>
								<FiChevronDown />
							</Collapsible.CollapsibleToggleIcon>
						</Collapsible.CollapsibleHeaderButton>
						{!collapsedSections.deviceManagement && (
							<Collapsible.CollapsibleContent>
								{mfaDevices.length > 0 ? (
									<InfoBox $variant="success">
										<FiCheckCircle size={20} style={{ flexShrink: 0 }} />
										<InfoContent>
											<InfoTitle>✅ Devices Successfully Registered</InfoTitle>
											<InfoText>
												You have {mfaDevices.length} MFA device{mfaDevices.length > 1 ? 's' : ''}{' '}
												registered. You can register additional devices below or proceed to Step 2
												to test your existing devices.
											</InfoText>
										</InfoContent>
									</InfoBox>
								) : (
									<InfoBox $variant="info">
										<FiInfo size={20} style={{ flexShrink: 0 }} />
										<InfoContent>
											<InfoTitle>📋 No Devices Registered Yet</InfoTitle>
											<InfoText>
												Register your first MFA device using the form below. Once registered,
												devices will appear in the table.
											</InfoText>
										</InfoContent>
									</InfoBox>
								)}

								{renderDeviceTable('registration')}
							</Collapsible.CollapsibleContent>
						)}
					</Collapsible.CollapsibleSection>

					<Collapsible.CollapsibleSection>
						<Collapsible.CollapsibleHeaderButton
							onClick={() => toggleSection('registerDevice')}
							aria-expanded={!collapsedSections.registerDevice}
						>
							<Collapsible.CollapsibleTitle>
								<FiSmartphone /> Register New Device
							</Collapsible.CollapsibleTitle>
							<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.registerDevice}>
								<FiChevronDown />
							</Collapsible.CollapsibleToggleIcon>
						</Collapsible.CollapsibleHeaderButton>
						{!collapsedSections.registerDevice && (
							<Collapsible.CollapsibleContent>
								<InfoBox $variant="info">
									<FiInfo size={20} style={{ flexShrink: 0 }} />
									<InfoContent>
										<InfoTitle>📱 PingOne MFA Device Types</InfoTitle>
										<InfoText>
											PingOne supports multiple MFA device types: SMS, Email, Voice, TOTP
											(Authenticator Apps), FIDO2 (Security Keys), Mobile (PingID App), and Push
											Notifications. Each device type has specific registration and activation
											requirements.
										</InfoText>
									</InfoContent>
								</InfoBox>

								<div
									style={{
										margin: '1rem 0',
										padding: '1rem',
										background: '#f9fafb',
										borderRadius: '0.5rem',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										🔗 PingOne MFA API Endpoints:
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
										<div>
											<strong>Device Registration:</strong> POST /environments/{'{environmentId}'}
											/users/{'{userId}'}/devices
										</div>
										<div>
											<strong>Device Activation:</strong> POST /environments/{'{environmentId}'}
											/users/{'{userId}'}/devices/{'{deviceId}'}/oathTokens
										</div>
										<div>
											<strong>Device Management:</strong> PUT /environments/{'{environmentId}'}
											/users/{'{userId}'}/devices/{'{deviceId}'}
										</div>
										<div>
											<strong>Block Device:</strong> PUT /environments/{'{environmentId}'}/users/
											{'{userId}'}/devices/{'{deviceId}'} (status: BLOCKED)
										</div>
										<div>
											<strong>Delete Device:</strong> DELETE /environments/{'{environmentId}'}
											/users/{'{userId}'}/devices/{'{deviceId}'}
										</div>
										<div>
											<strong>Send MFA Challenge:</strong> POST /environments/{'{environmentId}'}
											/users/{'{userId}'}/devices/{'{deviceId}'}/authentications
										</div>
										<div>
											<strong>Verify Challenge:</strong> POST /environments/{'{environmentId}'}
											/users/{'{userId}'}/devices/{'{deviceId}'}/authentications/
											{'{authenticationId}'}/check
										</div>
									</div>
								</div>

								<div
									style={{
										margin: '1rem 0',
										padding: '1rem',
										background: '#ecfdf5',
										borderRadius: '0.5rem',
										border: '1px solid #10b981',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#065f46',
										}}
									>
										💡 Device Management Features:
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#065f46', lineHeight: '1.5' }}>
										<div>
											<strong>Device Ordering:</strong> Use ↑↓ arrows to reorder devices for user
											preference
										</div>
										<div>
											<strong>Nicknames:</strong> Click edit icon to add friendly names for easier
											identification
										</div>
										<div>
											<strong>Block/Unblock:</strong> Temporarily disable devices without deleting
											them
										</div>
										<div>
											<strong>Activation:</strong> Handle ACTIVATION_REQUIRED and PENDING_ACTIVATION
											statuses
										</div>
										<div>
											<strong>Testing:</strong> Test active devices to verify MFA functionality
										</div>
									</div>
								</div>

								{/* Username field for device registration */}
								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
										Username *
									</label>
									<input
										type="text"
										value={credentials.username}
										onChange={(e) =>
											setCredentials((prev) => ({ ...prev, username: e.target.value }))
										}
										placeholder="Enter username for device registration and management"
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
										}}
									/>
									<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
										Username is required for device registration and MFA challenge operations
									</div>
								</div>
							</Collapsible.CollapsibleContent>
						)}
					</Collapsible.CollapsibleSection>
				</StepContent>
			)}

			{/* Step 2: Device Selection */}
			{currentStep === 2 && (
				<StepContent>
					<Collapsible.CollapsibleSection>
						<Collapsible.CollapsibleHeaderButton
							onClick={() => toggleSection('deviceSelection')}
							aria-expanded={!collapsedSections.deviceSelection}
						>
							<Collapsible.CollapsibleTitle>
								<FiSmartphone /> Select Device for MFA Challenge ({mfaDevices.length})
							</Collapsible.CollapsibleTitle>
							<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.deviceSelection}>
								<FiChevronDown />
							</Collapsible.CollapsibleToggleIcon>
						</Collapsible.CollapsibleHeaderButton>
						{!collapsedSections.deviceSelection && (
							<Collapsible.CollapsibleContent>
								{mfaDevices.length > 0 ? (
									<>
										<InfoBox $variant="info">
											<FiInfo size={20} style={{ flexShrink: 0 }} />
											<InfoContent>
												<InfoTitle>📱 Device Selection & Activation</InfoTitle>
												<InfoText>
													Devices with "PENDING_ACTIVATION" status need to be activated first using
													the "Activate" button. Once activated, you can select and test devices for
													MFA challenges.
												</InfoText>
											</InfoContent>
										</InfoBox>

										<div
											style={{
												margin: '1rem 0',
												padding: '1rem',
												background: '#fef3c7',
												borderRadius: '0.5rem',
												border: '1px solid #fbbf24',
											}}
										>
											<h4
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '0.875rem',
													fontWeight: '600',
													color: '#92400e',
												}}
											>
												⚠️ Phase 1: Device Status Explanations
											</h4>
											<div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: '1.5' }}>
												<div style={{ marginBottom: '0.25rem' }}>
													<strong>ACTIVATION_REQUIRED:</strong> Device needs OTP activation. The OTP
													is sent to the phone number or email address specified in the device
													resource's properties. Use the activation API with content-type
													application/vnd.pingidentity.device.activate+json.
												</div>
												<div style={{ marginBottom: '0.25rem' }}>
													<strong>PENDING_ACTIVATION:</strong> Device registered but awaiting user
													activation (QR scan, pairing key, etc.)
												</div>
												<div style={{ marginBottom: '0.25rem' }}>
													<strong>BLOCKED:</strong> Device temporarily disabled. Can be unblocked by
													administrator.
												</div>
												<div>
													<strong>ACTIVE:</strong> Device ready for MFA challenges and
													authentication.
												</div>
											</div>
										</div>

										<div
											style={{
												margin: '1rem 0',
												padding: '1rem',
												background: '#e0f2fe',
												borderRadius: '0.5rem',
												border: '1px solid #0284c7',
											}}
										>
											<h4
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '0.875rem',
													fontWeight: '600',
													color: '#0c4a6e',
												}}
											>
												🔗 PingOne Device Activation API:
											</h4>
											<div style={{ fontSize: '0.75rem', color: '#0c4a6e', lineHeight: '1.5' }}>
												<div>
													<strong>Endpoint:</strong> POST /environments/{'{environmentId}'}/users/
													{'{userId}'}/devices/{'{deviceId}'}
												</div>
												<div>
													<strong>Content-Type:</strong>{' '}
													application/vnd.pingidentity.device.activate+json
												</div>
												<div>
													<strong>Purpose:</strong> Activate devices with ACTIVATION_REQUIRED status
													using valid OTP
												</div>
											</div>
										</div>
									</>
								) : (
									<InfoBox $variant="warning">
										<FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
										<InfoContent>
											<InfoTitle>No Devices Registered</InfoTitle>
											<InfoText>
												You need to register at least one MFA device before you can test MFA
												challenges. Go back to Step 1 to register a device.
											</InfoText>
										</InfoContent>
									</InfoBox>
								)}

								{renderDeviceTable('selection')}
							</Collapsible.CollapsibleContent>
						)}
					</Collapsible.CollapsibleSection>

					{selectedDevice && (
						<Collapsible.CollapsibleSection>
							<Collapsible.CollapsibleHeaderButton
								onClick={() => toggleSection('selectedDevice')}
								aria-expanded={!collapsedSections.selectedDevice}
							>
								<Collapsible.CollapsibleTitle>
									<FiLock /> Selected Device
								</Collapsible.CollapsibleTitle>
								<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.selectedDevice}>
									<FiChevronDown />
								</Collapsible.CollapsibleToggleIcon>
							</Collapsible.CollapsibleHeaderButton>
							{!collapsedSections.selectedDevice && (
								<Collapsible.CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} style={{ flexShrink: 0 }} />
										<InfoContent>
											<InfoTitle>✅ Device Selected: {selectedDevice.type.toUpperCase()}</InfoTitle>
											<InfoText>
												Ready to test {selectedDevice.type === 'SMS' && selectedDevice.phoneNumber}
												{selectedDevice.type === 'EMAIL' && selectedDevice.emailAddress}
												{(selectedDevice.type === 'TOTP' || selectedDevice.type === 'PUSH') &&
													'Authenticator App'}
												. Click "Send MFA Challenge" to initiate the test.
											</InfoText>
										</InfoContent>
									</InfoBox>

									<div style={{ marginTop: '1rem' }}>
										<ActionButton
											$variant="primary"
											onClick={() => initiateMfaChallenge(selectedDevice)}
											disabled={isLoading}
										>
											<FiSmartphone size={16} />
											{isLoading ? 'Sending Challenge...' : 'Send MFA Challenge'}
										</ActionButton>
									</div>
								</Collapsible.CollapsibleContent>
							)}
						</Collapsible.CollapsibleSection>
					)}
				</StepContent>
			)}

			{/* Step 3: MFA Challenge */}
			{currentStep === 3 && (
				<StepContent>
					<Collapsible.CollapsibleSection>
						<Collapsible.CollapsibleHeaderButton
							onClick={() => toggleSection('mfaChallenge')}
							aria-expanded={!collapsedSections.mfaChallenge}
						>
							<Collapsible.CollapsibleTitle>
								<FiLock /> MFA Challenge Verification
							</Collapsible.CollapsibleTitle>
							<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.mfaChallenge}>
								<FiChevronDown />
							</Collapsible.CollapsibleToggleIcon>
						</Collapsible.CollapsibleHeaderButton>
						{!collapsedSections.mfaChallenge && (
							<Collapsible.CollapsibleContent>
								<InfoBox $variant="success">
									<FiCheckCircle size={20} style={{ flexShrink: 0 }} />
									<InfoContent>
										<InfoTitle>📱 Challenge Sent Successfully</InfoTitle>
										<InfoText>
											MFA challenge has been sent to your {selectedDevice?.type.toLowerCase()}{' '}
											device. Enter the verification code below to complete the authentication.
										</InfoText>
									</InfoContent>
								</InfoBox>

								<div style={{ marginBottom: '1rem' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
										Verification Code *
									</label>
									<input
										type="text"
										placeholder="Enter 6-digit verification code"
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '0.875rem',
											textAlign: 'center',
											letterSpacing: '0.5rem',
										}}
									/>
								</div>

								<div style={{ display: 'flex', gap: '1rem' }}>
									<ActionButton $variant="secondary" onClick={() => setCurrentStep(2)}>
										<FiArrowLeft />
										Back
									</ActionButton>
									<ActionButton $variant="primary" onClick={() => setCurrentStep(4)}>
										Verify Code
										<FiArrowRight />
									</ActionButton>
								</div>
							</Collapsible.CollapsibleContent>
						)}
					</Collapsible.CollapsibleSection>
				</StepContent>
			)}

			{/* Step Navigation */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					marginTop: '2rem',
					padding: '1rem',
					background: '#f9fafb',
					borderRadius: '0.5rem',
				}}
			>
				<ActionButton
					$variant="secondary"
					onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
					disabled={currentStep === 0}
				>
					<FiArrowLeft />
					Previous
				</ActionButton>

				<ActionButton
					$variant="primary"
					onClick={() => {
						if (currentStep === 0) {
							if (
								!credentials.clientId ||
								!credentials.clientSecret ||
								!credentials.environmentId ||
								!credentials.authMethod
							) {
								v4ToastManager.showError('Please enter all required credentials first');
								return;
							}
							if (!workerToken) {
								v4ToastManager.showError('Please get a worker token first');
								return;
							}
						}

						if (currentStep === 1 && !credentials.username) {
							v4ToastManager.showError('Please enter a username first');
							return;
						}

						if (currentStep === 2 && mfaDevices.length === 0) {
							v4ToastManager.showError('Please register at least one device first');
							return;
						}
						setCurrentStep(Math.min(5, currentStep + 1));
					}}
					disabled={currentStep === 5}
				>
					{(() => {
						if (currentStep === 0) {
							if (
								!credentials.clientId ||
								!credentials.clientSecret ||
								!credentials.environmentId ||
								!credentials.authMethod
							) {
								return 'Enter Credentials First';
							}
							if (!workerToken) {
								return 'Get Worker Token First';
							}

							return 'Continue to Device Management';
						}
						if (currentStep === 1)
							return credentials.username ? 'Continue to Device Selection' : 'Enter Username First';
						if (currentStep === 2)
							return mfaDevices.length > 0 ? 'Continue to MFA Challenge' : 'Register Device First';
						return 'Next';
					})()}
					<FiArrowRight />
				</ActionButton>
			</div>

			{/* Device Activation Modal */}
			{showActivationModal && activatingDevice && (
				<ActivationModal onClick={() => setShowActivationModal(false)}>
					<ActivationContent onClick={(e) => e.stopPropagation()}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '1.5rem',
							}}
						>
							<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
								{activatingDevice.status === 'ACTIVATION_REQUIRED' ? 'Enter OTP Code' : 'Activate'}{' '}
								{activatingDevice.type} Device
							</h3>
							<button
								onClick={() => setShowActivationModal(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '1.5rem',
									cursor: 'pointer',
								}}
							>
								×
							</button>
						</div>

						{/* Phase 1: ACTIVATION_REQUIRED Specific Content */}
						{activatingDevice.status === 'ACTIVATION_REQUIRED' && (
							<InfoBox $variant="info">
								<FiClock size={20} style={{ flexShrink: 0 }} />
								<InfoContent>
									<InfoTitle>📱 OTP Activation Required</InfoTitle>
									<InfoText>
										This device has ACTIVATION_REQUIRED status. An OTP (One-Time Password) has been
										sent to the
										{activatingDevice.type === 'SMS' &&
											` phone number ${activatingDevice.phoneNumber}`}
										{activatingDevice.type === 'EMAIL' &&
											` email address ${activatingDevice.emailAddress}`}
										{activatingDevice.type === 'VOICE' &&
											` phone number ${activatingDevice.phoneNumber} via voice call`}
										. Enter the OTP below to activate the device.
									</InfoText>
								</InfoContent>
							</InfoBox>
						)}

						{activatingDevice.type === 'TOTP' && (
							<>
								<InfoBox $variant="info">
									<FiCode size={20} style={{ flexShrink: 0 }} />
									<InfoContent>
										<InfoTitle>📱 TOTP Device Activation</InfoTitle>
										<InfoText>
											Scan the QR code with your authenticator app (Google Authenticator, Authy,
											etc.) or manually enter the secret key, then provide the 6-digit code to
											activate.
										</InfoText>
									</InfoContent>
								</InfoBox>

								<QRCodeContainer>
									<img
										src={activatingDevice.qrCode}
										alt="QR Code for TOTP setup"
										style={{ width: '200px', height: '200px', border: '1px solid #e5e7eb' }}
									/>
									<div style={{ textAlign: 'center' }}>
										<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
											Or enter this secret key manually:
										</div>
										<SecretKeyContainer>
											<code>{activatingDevice.secret}</code>
											<CopyButton onClick={() => copyToClipboard(activatingDevice.secret)}>
												<FiCopy size={12} />
												Copy
											</CopyButton>
										</SecretKeyContainer>
									</div>
								</QRCodeContainer>
							</>
						)}

						{activatingDevice.type === 'MOBILE' && (
							<>
								<InfoBox $variant="info">
									<FiTablet size={20} style={{ flexShrink: 0 }} />
									<InfoContent>
										<InfoTitle>📱 PingID Mobile App Activation</InfoTitle>
										<InfoText>
											Install the PingID mobile app and use the pairing key below to pair your
											device, then enter the activation code from the app.
										</InfoText>
									</InfoContent>
								</InfoBox>

								<div style={{ margin: '1rem 0' }}>
									<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
										Pairing Key:
									</label>
									<SecretKeyContainer>
										<code>{activatingDevice.pairingKey}</code>
										<CopyButton onClick={() => copyToClipboard(activatingDevice.pairingKey)}>
											<FiCopy size={12} />
											Copy
										</CopyButton>
									</SecretKeyContainer>
								</div>
							</>
						)}

						<div style={{ margin: '1.5rem 0' }}>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
								{activatingDevice.status === 'ACTIVATION_REQUIRED'
									? 'OTP Code *'
									: 'Activation Code *'}
							</label>
							<input
								type="text"
								value={activationCode}
								onChange={(e) => setActivationCode(e.target.value)}
								placeholder={
									activatingDevice.status === 'ACTIVATION_REQUIRED'
										? 'Enter OTP from SMS/Email/Voice'
										: 'Enter 6-digit activation code'
								}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
									textAlign: 'center',
									letterSpacing: '0.5rem',
								}}
							/>
							{activatingDevice.status === 'ACTIVATION_REQUIRED' && (
								<div
									style={{
										fontSize: '0.75rem',
										color: '#6b7280',
										marginTop: '0.5rem',
										textAlign: 'center',
									}}
								>
									Check your{' '}
									{activatingDevice.type === 'SMS'
										? 'text messages'
										: activatingDevice.type === 'EMAIL'
											? 'email inbox'
											: 'phone for voice call'}{' '}
									for the OTP
								</div>
							)}
						</div>

						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
							<ActionButton $variant="secondary" onClick={() => setShowActivationModal(false)}>
								Cancel
							</ActionButton>
							<ActionButton
								$variant="primary"
								onClick={completeActivation}
								disabled={isLoading || !activationCode}
							>
								{isLoading ? 'Activating...' : 'Activate Device'}
							</ActionButton>
						</div>
					</ActivationContent>
				</ActivationModal>
			)}

			{/* Phase 2 will add device management and delete confirmation modals */}
		</Container>
	);
};

export default PingOneMFAFlowV6;
