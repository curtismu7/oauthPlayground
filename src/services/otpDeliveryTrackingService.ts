// src/services/otpDeliveryTrackingService.ts
// OTP Delivery Status Tracking and Management Service

import { logger } from '../utils/logger';

export interface OTPDeliveryStatus {
	challengeId: string;
	deviceId: string;
	deviceType: 'EMAIL' | 'SMS' | 'VOICE';
	status: 'PENDING' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'EXPIRED';
	sentAt?: Date;
	deliveredAt?: Date;
	failedAt?: Date;
	expiresAt: Date;
	attemptsCount: number;
	maxAttempts: number;
	lastAttemptAt?: Date;
	failureReason?: string;
	retryAllowed: boolean;
	nextRetryAt?: Date;
}

export interface DeliveryAttempt {
	attemptId: string;
	challengeId: string;
	timestamp: Date;
	status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
	deliveryMethod: 'EMAIL' | 'SMS' | 'VOICE';
	targetAddress: string;
	responseTime?: number;
	errorCode?: string;
	errorMessage?: string;
	providerResponse?: any;
}

export interface ResendConfig {
	minInterval: number; // Minimum seconds between resends
	maxAttempts: number; // Maximum resend attempts
	backoffMultiplier: number; // Exponential backoff multiplier
	maxBackoff: number; // Maximum backoff time in seconds
}

export interface DeliveryMetrics {
	totalSent: number;
	totalDelivered: number;
	totalFailed: number;
	averageDeliveryTime: number;
	successRate: number;
	failuresByReason: Record<string, number>;
	deliveryTimesByMethod: Record<string, number[]>;
}

class OTPDeliveryTrackingService {
	private static deliveryStatuses = new Map<string, OTPDeliveryStatus>();
	private static deliveryAttempts = new Map<string, DeliveryAttempt[]>();

	private static readonly DEFAULT_RESEND_CONFIG: ResendConfig = {
		minInterval: 60, // 1 minute
		maxAttempts: 5,
		backoffMultiplier: 1.5,
		maxBackoff: 300, // 5 minutes
	};

	/**
	 * Initialize delivery tracking for a new OTP challenge
	 */
	static initializeDeliveryTracking(
		challengeId: string,
		deviceId: string,
		deviceType: 'EMAIL' | 'SMS' | 'VOICE',
		expiresAt: Date,
		maxAttempts: number = 3
	): OTPDeliveryStatus {
		const status: OTPDeliveryStatus = {
			challengeId,
			deviceId,
			deviceType,
			status: 'PENDING',
			expiresAt,
			attemptsCount: 0,
			maxAttempts,
			retryAllowed: true,
		};

		OTPDeliveryTrackingService.deliveryStatuses.set(challengeId, status);
		OTPDeliveryTrackingService.deliveryAttempts.set(challengeId, []);

		logger.info('OTPDeliveryTrackingService', 'Initialized delivery tracking', {
			challengeId,
			deviceId,
			deviceType,
		});

		return status;
	}

	/**
	 * Update delivery status
	 */
	static updateDeliveryStatus(
		challengeId: string,
		status: OTPDeliveryStatus['status'],
		metadata?: {
			failureReason?: string;
			responseTime?: number;
			providerResponse?: any;
		}
	): OTPDeliveryStatus | null {
		const deliveryStatus = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!deliveryStatus) {
			logger.warn('OTPDeliveryTrackingService', 'Delivery status not found', { challengeId });
			return null;
		}

		const now = new Date();
		deliveryStatus.status = status;

		switch (status) {
			case 'SENDING':
				// No additional updates needed
				break;
			case 'SENT':
				deliveryStatus.sentAt = now;
				break;
			case 'DELIVERED':
				deliveryStatus.deliveredAt = now;
				if (!deliveryStatus.sentAt) {
					deliveryStatus.sentAt = now; // Fallback if sent timestamp missing
				}
				break;
			case 'FAILED':
				deliveryStatus.failedAt = now;
				deliveryStatus.failureReason = metadata?.failureReason;
				deliveryStatus.retryAllowed = OTPDeliveryTrackingService.canRetry(challengeId);
				if (deliveryStatus.retryAllowed) {
					deliveryStatus.nextRetryAt =
						OTPDeliveryTrackingService.calculateNextRetryTime(challengeId);
				}
				break;
			case 'EXPIRED':
				deliveryStatus.retryAllowed = false;
				break;
		}

		// Record delivery attempt
		if (status === 'SENT' || status === 'DELIVERED' || status === 'FAILED') {
			OTPDeliveryTrackingService.recordDeliveryAttempt(challengeId, status, metadata);
		}

		OTPDeliveryTrackingService.deliveryStatuses.set(challengeId, deliveryStatus);

		logger.info('OTPDeliveryTrackingService', 'Updated delivery status', {
			challengeId,
			status,
			metadata,
		});

		return deliveryStatus;
	}

	/**
	 * Get current delivery status
	 */
	static getDeliveryStatus(challengeId: string): OTPDeliveryStatus | null {
		return OTPDeliveryTrackingService.deliveryStatuses.get(challengeId) || null;
	}

	/**
	 * Check if resend is allowed
	 */
	static canResend(
		challengeId: string,
		config?: Partial<ResendConfig>
	): {
		allowed: boolean;
		reason?: string;
		nextRetryAt?: Date;
		attemptsRemaining?: number;
	} {
		const status = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!status) {
			return { allowed: false, reason: 'Challenge not found' };
		}

		const resendConfig = { ...OTPDeliveryTrackingService.DEFAULT_RESEND_CONFIG, ...config };
		const now = new Date();

		// Check if expired
		if (now > status.expiresAt) {
			return { allowed: false, reason: 'Challenge expired' };
		}

		// Check max attempts
		if (status.attemptsCount >= resendConfig.maxAttempts) {
			return {
				allowed: false,
				reason: 'Maximum resend attempts reached',
				attemptsRemaining: 0,
			};
		}

		// Check retry interval
		if (status.nextRetryAt && now < status.nextRetryAt) {
			return {
				allowed: false,
				reason: 'Too soon to retry',
				nextRetryAt: status.nextRetryAt,
				attemptsRemaining: resendConfig.maxAttempts - status.attemptsCount,
			};
		}

		return {
			allowed: true,
			attemptsRemaining: resendConfig.maxAttempts - status.attemptsCount,
		};
	}

	/**
	 * Record a resend attempt
	 */
	static recordResendAttempt(challengeId: string): OTPDeliveryStatus | null {
		const status = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!status) {
			return null;
		}

		status.attemptsCount += 1;
		status.lastAttemptAt = new Date();
		status.status = 'SENDING';

		// Calculate next retry time
		status.nextRetryAt = OTPDeliveryTrackingService.calculateNextRetryTime(challengeId);
		status.retryAllowed = OTPDeliveryTrackingService.canRetry(challengeId);

		OTPDeliveryTrackingService.deliveryStatuses.set(challengeId, status);

		logger.info('OTPDeliveryTrackingService', 'Recorded resend attempt', {
			challengeId,
			attemptsCount: status.attemptsCount,
			nextRetryAt: status.nextRetryAt,
		});

		return status;
	}

	/**
	 * Get delivery metrics for analytics
	 */
	static getDeliveryMetrics(
		deviceType?: 'EMAIL' | 'SMS' | 'VOICE',
		timeRange?: { start: Date; end: Date }
	): DeliveryMetrics {
		const attempts = Array.from(OTPDeliveryTrackingService.deliveryAttempts.values()).flat();

		let filteredAttempts = attempts;

		if (deviceType) {
			filteredAttempts = filteredAttempts.filter(
				(attempt) => attempt.deliveryMethod === deviceType
			);
		}

		if (timeRange) {
			filteredAttempts = filteredAttempts.filter(
				(attempt) => attempt.timestamp >= timeRange.start && attempt.timestamp <= timeRange.end
			);
		}

		const totalSent = filteredAttempts.length;
		const totalDelivered = filteredAttempts.filter((a) => a.status === 'SUCCESS').length;
		const totalFailed = filteredAttempts.filter((a) => a.status === 'FAILED').length;

		const successfulAttempts = filteredAttempts.filter(
			(a) => a.status === 'SUCCESS' && a.responseTime
		);
		const averageDeliveryTime =
			successfulAttempts.length > 0
				? successfulAttempts.reduce((sum, a) => sum + (a.responseTime || 0), 0) /
					successfulAttempts.length
				: 0;

		const successRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

		const failuresByReason: Record<string, number> = {};
		filteredAttempts
			.filter((a) => a.status === 'FAILED' && a.errorMessage)
			.forEach((a) => {
				const reason = a.errorMessage || 'Unknown';
				failuresByReason[reason] = (failuresByReason[reason] || 0) + 1;
			});

		const deliveryTimesByMethod: Record<string, number[]> = {};
		filteredAttempts
			.filter((a) => a.status === 'SUCCESS' && a.responseTime)
			.forEach((a) => {
				const method = a.deliveryMethod;
				if (!deliveryTimesByMethod[method]) {
					deliveryTimesByMethod[method] = [];
				}
				deliveryTimesByMethod[method].push(a.responseTime!);
			});

		return {
			totalSent,
			totalDelivered,
			totalFailed,
			averageDeliveryTime,
			successRate,
			failuresByReason,
			deliveryTimesByMethod,
		};
	}

	/**
	 * Clean up expired delivery statuses
	 */
	static cleanupExpiredStatuses(): number {
		const now = new Date();
		let cleanedCount = 0;

		for (const [challengeId, status] of OTPDeliveryTrackingService.deliveryStatuses.entries()) {
			if (now > status.expiresAt) {
				OTPDeliveryTrackingService.deliveryStatuses.delete(challengeId);
				OTPDeliveryTrackingService.deliveryAttempts.delete(challengeId);
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			logger.info('OTPDeliveryTrackingService', 'Cleaned up expired statuses', {
				cleanedCount,
			});
		}

		return cleanedCount;
	}

	/**
	 * Get all active delivery statuses
	 */
	static getActiveDeliveryStatuses(): OTPDeliveryStatus[] {
		const now = new Date();
		return Array.from(OTPDeliveryTrackingService.deliveryStatuses.values()).filter(
			(status) => now <= status.expiresAt
		);
	}

	/**
	 * Get delivery attempts for a challenge
	 */
	static getDeliveryAttempts(challengeId: string): DeliveryAttempt[] {
		return OTPDeliveryTrackingService.deliveryAttempts.get(challengeId) || [];
	}

	// Private helper methods

	private static canRetry(challengeId: string): boolean {
		const status = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!status) return false;

		const now = new Date();
		return (
			now <= status.expiresAt &&
			status.attemptsCount < OTPDeliveryTrackingService.DEFAULT_RESEND_CONFIG.maxAttempts
		);
	}

	private static calculateNextRetryTime(challengeId: string): Date {
		const status = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!status) return new Date();

		const config = OTPDeliveryTrackingService.DEFAULT_RESEND_CONFIG;
		const backoffTime = Math.min(
			config.minInterval * config.backoffMultiplier ** status.attemptsCount,
			config.maxBackoff
		);

		return new Date(Date.now() + backoffTime * 1000);
	}

	private static recordDeliveryAttempt(
		challengeId: string,
		status: 'SENT' | 'DELIVERED' | 'FAILED',
		metadata?: {
			failureReason?: string;
			responseTime?: number;
			providerResponse?: any;
		}
	): void {
		const deliveryStatus = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!deliveryStatus) return;

		const attempt: DeliveryAttempt = {
			attemptId: `attempt_${challengeId}_${Date.now()}`,
			challengeId,
			timestamp: new Date(),
			status: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
			deliveryMethod: deliveryStatus.deviceType,
			targetAddress: OTPDeliveryTrackingService.getMaskedAddress(
				deliveryStatus.deviceId,
				deliveryStatus.deviceType
			),
			responseTime: metadata?.responseTime,
			errorCode: status === 'FAILED' ? 'DELIVERY_FAILED' : undefined,
			errorMessage: metadata?.failureReason,
			providerResponse: metadata?.providerResponse,
		};

		const attempts = OTPDeliveryTrackingService.deliveryAttempts.get(challengeId) || [];
		attempts.push(attempt);
		OTPDeliveryTrackingService.deliveryAttempts.set(challengeId, attempts);
	}

	private static getMaskedAddress(
		_deviceId: string,
		deviceType: 'EMAIL' | 'SMS' | 'VOICE'
	): string {
		// In a real implementation, this would get the actual address from the device
		// For now, return a masked placeholder
		switch (deviceType) {
			case 'EMAIL':
				return 'user@***.com';
			case 'SMS':
			case 'VOICE':
				return '+1***-***-1234';
			default:
				return '***';
		}
	}

	/**
	 * Start automatic cleanup of expired statuses
	 */
	static startCleanupScheduler(intervalMinutes: number = 30): void {
		setInterval(
			() => {
				OTPDeliveryTrackingService.cleanupExpiredStatuses();
			},
			intervalMinutes * 60 * 1000
		);

		logger.info('OTPDeliveryTrackingService', 'Started cleanup scheduler', {
			intervalMinutes,
		});
	}

	/**
	 * Get resend countdown for UI display
	 */
	static getResendCountdown(challengeId: string): number | null {
		const status = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!status || !status.nextRetryAt) return null;

		const now = new Date();
		const remaining = Math.max(
			0,
			Math.floor((status.nextRetryAt.getTime() - now.getTime()) / 1000)
		);

		return remaining > 0 ? remaining : null;
	}

	/**
	 * Get expiry countdown for UI display
	 */
	static getExpiryCountdown(challengeId: string): number | null {
		const status = OTPDeliveryTrackingService.deliveryStatuses.get(challengeId);
		if (!status) return null;

		const now = new Date();
		const remaining = Math.max(0, Math.floor((status.expiresAt.getTime() - now.getTime()) / 1000));

		return remaining > 0 ? remaining : null;
	}
}

export default OTPDeliveryTrackingService;
