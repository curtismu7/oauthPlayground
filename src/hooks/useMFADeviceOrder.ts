import { useState } from 'react';
import { toast } from 'react-toastify';
import { MfaAuthenticationServiceV8 } from '../apps/mfa/services/mfaAuthenticationServiceV8';

interface UseMFADeviceOrderProps {
	environmentId: string;
	userId: string;
}

export const useMFADeviceOrder = ({ environmentId, userId }: UseMFADeviceOrderProps) => {
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const updateDeviceOrder = async (deviceIds: string[]) => {
		if (!deviceIds?.length) {
			throw new Error('No device IDs provided');
		}

		try {
			setIsUpdating(true);
			setError(null);

			const result = await MfaAuthenticationServiceV8.setUserMfaDeviceOrder(
				environmentId,
				userId,
				deviceIds
			);

			toast.success('Device order updated successfully');
			return result;
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Failed to update device order');
			setError(error);
			toast.error(error.message);
			throw error;
		} finally {
			setIsUpdating(false);
		}
	};

	return {
		updateDeviceOrder,
		isUpdating,
		error,
	};
};

export default useMFADeviceOrder;
