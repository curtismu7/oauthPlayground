// src/hooks/useOTPDeliveryTracking.ts
// React Hook for OTP Delivery Status Tracking

import { useCallback, useEffect, useRef, useState } from 'react';
import OTPDeliveryTrackingService, {
	type DeliveryAttempt,
	type OTPDeliveryStatus,
	type ResendConfig,
} from '../services/otpDeliveryTrackingService';
import { logger } from '../utils/logger';

export interface UseOTPDeliveryTrackingOptions {
	challengeId?: string;
	deviceId?: string;
	deviceType?: 'EMAIL' | 'SMS' | 'VOICE';
	expiresAt?: Date;
	maxAttempts?: number;
	resendConfig?: Partial<ResendConfig>;
	onStatusChange?: (status: OTPDeliveryStatus) => void;
	onResendAllowed?: () => void;
	onExpired?: () => void;
}

export interface OTPDeliveryTrackingState {
	// Status
	deliveryStatus: OTPDeliveryStatus | null;
	deliveryAttempts: DeliveryAttempt[];

	// Countdown timers
	resendCountdown: number | null;
	expiryCountdown: number | null;

	// Capabilities
	canResend: boolean;
	resendReason?: string;
	attemptsRemaining: number;

	// Loading states
	isInitializing: boolean;
	isUpdating: boolean;

	// Actions
	initializeTracking: (
		challengeId: string,
		deviceId: string,
		deviceType: 'EMAIL' | 'SMS' | 'VOICE',
		expiresAt: Date
	) => void;
	updateStatus: (status: OTPDeliveryStatus['status'], metadata?: any) => void;
	recordResend: () => void;
	cleanup: () => void;
}

export const useOTPDeliveryTracking = (
	options: UseOTPDeliveryTrackingOptions = {}
): OTPDeliveryTrackingState => {
	const {
		challengeId: initialChallengeId,
		deviceId: initialDeviceId,
		deviceType: initialDeviceType,
		expiresAt: initialExpiresAt,
		maxAttempts = 3,
		resendConfig,
		onStatusChange,
		onResendAllowed,
		onExpired,
	} = options;

	// State
	const [deliveryStatus, setDeliveryStatus] = useState<OTPDeliveryStatus | null>(null);
	const [deliveryAttempts, setDeliveryAttempts] = useState<DeliveryAttempt[]>([]);
	const [resendCountdown, setResendCountdown] = useState<number | null>(null);
	const [expiryCountdown, setExpiryCountdown] = useState<number | null>(null);
	const [isInitializing, setIsInitializing] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	// Refs for cleanup
	const resendTimerRef = useRef<NodeJS.Timeout | null>(null);
	const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
	const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

	// Initialize tracking if initial data provided
	useEffect(() => {
		if (initialChallengeId && initialDeviceId && initialDeviceType && initialExpiresAt) {
			initializeTracking(initialChallengeId, initialDeviceId, initialDeviceType, initialExpiresAt);
		}
	}, [
		initialChallengeId,
		initialDeviceId,
		initialDeviceType,
		initialExpiresAt,
		initializeTracking,
	]);

	// Update delivery attempts when status changes
	useEffect(() => {
		if (deliveryStatus?.challengeId) {
			const attempts = OTPDeliveryTrackingService.getDeliveryAttempts(deliveryStatus.challengeId);
			setDeliveryAttempts(attempts);
		}
	}, [deliveryStatus]);

	// Handle status change callback
	useEffect(() => {
		if (deliveryStatus && onStatusChange) {
			onStatusChange(deliveryStatus);
		}
	}, [deliveryStatus, onStatusChange]);

	// Resend countdown timer
	useEffect(() => {
		if (deliveryStatus?.challengeId) {
			const updateResendCountdown = () => {
				const countdown = OTPDeliveryTrackingService.getResendCountdown(deliveryStatus.challengeId);
				setResendCountdown(countdown);

				if (countdown === null && resendCountdown !== null && onResendAllowed) {
					onResendAllowed();
				}
			};

			updateResendCountdown();
			resendTimerRef.current = setInterval(updateResendCountdown, 1000);

			return () => {
				if (resendTimerRef.current) {
					clearInterval(resendTimerRef.current);
					resendTimerRef.current = null;
				}
			};
		}
	}, [deliveryStatus?.challengeId, resendCountdown, onResendAllowed]);

	// Expiry countdown timer
	useEffect(() => {
		if (deliveryStatus?.challengeId) {
			const updateExpiryCountdown = () => {
				const countdown = OTPDeliveryTrackingService.getExpiryCountdown(deliveryStatus.challengeId);
				setExpiryCountdown(countdown);

				if (countdown === 0 && expiryCountdown !== 0) {
					updateStatus('EXPIRED');
					if (onExpired) {
						onExpired();
					}
				}
			};

			updateExpiryCountdown();
			expiryTimerRef.current = setInterval(updateExpiryCountdown, 1000);

			return () => {
				if (expiryTimerRef.current) {
					clearInterval(expiryTimerRef.current);
					expiryTimerRef.current = null;
				}
			};
		}
	}, [deliveryStatus?.challengeId, expiryCountdown, onExpired, updateStatus]);

	// Periodic status refresh
	useEffect(() => {
		if (deliveryStatus?.challengeId) {
			const refreshStatus = () => {
				const currentStatus = OTPDeliveryTrackingService.getDeliveryStatus(
					deliveryStatus.challengeId
				);
				if (currentStatus && JSON.stringify(currentStatus) !== JSON.stringify(deliveryStatus)) {
					setDeliveryStatus(currentStatus);
				}
			};

			statusCheckRef.current = setInterval(refreshStatus, 5000); // Check every 5 seconds

			return () => {
				if (statusCheckRef.current) {
					clearInterval(statusCheckRef.current);
					statusCheckRef.current = null;
				}
			};
		}
	}, [deliveryStatus]);

	// Initialize tracking
	const initializeTracking = useCallback(
		(
			challengeId: string,
			deviceId: string,
			deviceType: 'EMAIL' | 'SMS' | 'VOICE',
			expiresAt: Date
		) => {
			setIsInitializing(true);

			try {
				const status = OTPDeliveryTrackingService.initializeDeliveryTracking(
					challengeId,
					deviceId,
					deviceType,
					expiresAt,
					maxAttempts
				);

				setDeliveryStatus(status);

				logger.info('useOTPDeliveryTracking', 'Initialized tracking', {
					challengeId,
					deviceId,
					deviceType,
				});
			} catch (error) {
				logger.error('useOTPDeliveryTracking', 'Failed to initialize tracking', {
					challengeId,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			} finally {
				setIsInitializing(false);
			}
		},
		[maxAttempts]
	);

	// Update status
	const updateStatus = useCallback(
		(status: OTPDeliveryStatus['status'], metadata?: any) => {
			if (!deliveryStatus?.challengeId) {
				logger.warn('useOTPDeliveryTracking', 'Cannot update status: no active tracking');
				return;
			}

			setIsUpdating(true);

			try {
				const updatedStatus = OTPDeliveryTrackingService.updateDeliveryStatus(
					deliveryStatus.challengeId,
					status,
					metadata
				);

				if (updatedStatus) {
					setDeliveryStatus(updatedStatus);
				}

				logger.info('useOTPDeliveryTracking', 'Updated status', {
					challengeId: deliveryStatus.challengeId,
					status,
					metadata,
				});
			} catch (error) {
				logger.error('useOTPDeliveryTracking', 'Failed to update status', {
					challengeId: deliveryStatus.challengeId,
					status,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			} finally {
				setIsUpdating(false);
			}
		},
		[deliveryStatus?.challengeId]
	);

	// Record resend attempt
	const recordResend = useCallback(() => {
		if (!deliveryStatus?.challengeId) {
			logger.warn('useOTPDeliveryTracking', 'Cannot record resend: no active tracking');
			return;
		}

		try {
			const updatedStatus = OTPDeliveryTrackingService.recordResendAttempt(
				deliveryStatus.challengeId
			);

			if (updatedStatus) {
				setDeliveryStatus(updatedStatus);
			}

			logger.info('useOTPDeliveryTracking', 'Recorded resend attempt', {
				challengeId: deliveryStatus.challengeId,
				attemptsCount: updatedStatus?.attemptsCount,
			});
		} catch (error) {
			logger.error('useOTPDeliveryTracking', 'Failed to record resend', {
				challengeId: deliveryStatus.challengeId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}, [deliveryStatus?.challengeId]);

	// Cleanup
	const cleanup = useCallback(() => {
		// Clear timers
		if (resendTimerRef.current) {
			clearInterval(resendTimerRef.current);
			resendTimerRef.current = null;
		}
		if (expiryTimerRef.current) {
			clearInterval(expiryTimerRef.current);
			expiryTimerRef.current = null;
		}
		if (statusCheckRef.current) {
			clearInterval(statusCheckRef.current);
			statusCheckRef.current = null;
		}

		// Reset state
		setDeliveryStatus(null);
		setDeliveryAttempts([]);
		setResendCountdown(null);
		setExpiryCountdown(null);
		setIsInitializing(false);
		setIsUpdating(false);

		logger.info('useOTPDeliveryTracking', 'Cleaned up tracking state');
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return cleanup;
	}, [cleanup]);

	// Calculate resend capability
	const resendCapability = deliveryStatus?.challengeId
		? OTPDeliveryTrackingService.canResend(deliveryStatus.challengeId, resendConfig)
		: { allowed: false, reason: 'No active challenge' };

	return {
		// Status
		deliveryStatus,
		deliveryAttempts,

		// Countdown timers
		resendCountdown,
		expiryCountdown,

		// Capabilities
		canResend: resendCapability.allowed,
		resendReason: resendCapability.reason,
		attemptsRemaining: resendCapability.attemptsRemaining || 0,

		// Loading states
		isInitializing,
		isUpdating,

		// Actions
		initializeTracking,
		updateStatus,
		recordResend,
		cleanup,
	};
};

export default useOTPDeliveryTracking;
