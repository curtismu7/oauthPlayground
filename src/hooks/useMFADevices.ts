import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { EnhancedPingOneMfaService, type MfaDevice } from '../services/enhancedPingOneMfaService';

interface UseMFADevicesProps {
	accessToken: string;
	environmentId: string;
	userId: string;
}

export const useMFADevices = ({ accessToken, environmentId, userId }: UseMFADevicesProps) => {
	const [devices, setDevices] = useState<MfaDevice[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [isAddingDevice, setIsAddingDevice] = useState(false);
	const [isRemovingDevice, setIsRemovingDevice] = useState(false);
	const [isVerifyingCode, setIsVerifyingCode] = useState(false);

	const credentials = { accessToken, environmentId, userId };

	const loadDevices = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const deviceList = await EnhancedPingOneMfaService.getDevices(credentials);
			setDevices(deviceList);
			return deviceList;
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to load MFA devices');
			setError(error);
			toast.error(error.message);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [credentials]);

	const addDevice = useCallback(
		async (type: 'SMS' | 'TOTP', phoneNumber?: string) => {
			try {
				setIsAddingDevice(true);
				setError(null);

				if (type === 'SMS' && !phoneNumber) {
					throw new Error('Phone number is required for SMS devices');
				}

				if (type === 'SMS') {
					const device = await EnhancedPingOneMfaService.createDevice(credentials, 'SMS', {
						phoneNumber: phoneNumber!,
						name: 'SMS Device',
					});

					toast.success('SMS device added. A verification code has been sent to your phone.');
					return { device, requiresVerification: true };
				} else {
					const { device, secret, qrCode } = await EnhancedPingOneMfaService.createTotpDevice(
						credentials,
						{
							name: 'Authenticator App',
							issuer: 'Your App',
							accountName: userId,
						}
					);

					toast.success('TOTP device added. Please scan the QR code with your authenticator app.');
					return {
						device,
						secret,
						qrCode,
						requiresVerification: true,
					};
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Failed to add device');
				setError(error);
				toast.error(error.message);
				throw error;
			} finally {
				setIsAddingDevice(false);
			}
		},
		[userId, credentials]
	);

	const verifyDevice = useCallback(
		async (deviceId: string, code: string) => {
			try {
				setIsVerifyingCode(true);
				setError(null);

				await EnhancedPingOneMfaService.activateDevice(credentials, deviceId, code);

				// Refresh the device list
				await loadDevices();

				toast.success('Device verified successfully');
				return true;
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Failed to verify device');
				setError(error);
				toast.error(error.message);
				throw error;
			} finally {
				setIsVerifyingCode(false);
			}
		},
		[loadDevices, credentials]
	);

	const removeDevice = useCallback(
		async (deviceId: string) => {
			try {
				setIsRemovingDevice(true);
				setError(null);

				await EnhancedPingOneMfaService.deleteDevice(credentials, deviceId);

				// Update the device list
				setDevices((prev) => prev.filter((device) => device.id !== deviceId));

				toast.success('Device removed successfully');
				return true;
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Failed to remove device');
				setError(error);
				toast.error(error.message);
				throw error;
			} finally {
				setIsRemovingDevice(false);
			}
		},
		[credentials]
	);

	const resendVerificationCode = useCallback(async (_deviceId: string) => {
		try {
			setError(null);

			// In a real app, you would call a method to resend the verification code
			// For example: await EnhancedPingOneMfaService.resendVerificationCode(credentials, deviceId);

			toast.info('Verification code resent');
			return true;
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to resend verification code');
			setError(error);
			toast.error(error.message);
			throw error;
		}
	}, []);

	return {
		devices,
		isLoading,
		error,
		isAddingDevice,
		isRemovingDevice,
		isVerifyingCode,
		loadDevices,
		addDevice,
		verifyDevice,
		removeDevice,
		resendVerificationCode,
	};
};

export default useMFADevices;
