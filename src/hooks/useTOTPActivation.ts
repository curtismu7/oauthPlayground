// src/hooks/useTOTPActivation.ts
// React Hook for TOTP Device Activation and Backup Code Management

import { useCallback, useEffect, useState } from 'react';
import TOTPActivationService, {
	type BackupCode,
	type BackupCodeValidationResult,
	type TOTPActivationConfig,
	type TOTPActivationResult,
	type TOTPValidationAttempt,
} from '../services/totpActivationService';
import { logger } from '../utils/logger';

export interface UseTOTPActivationOptions {
	deviceId?: string;
	userId?: string;
	onActivationSuccess?: (result: TOTPActivationResult) => void;
	onActivationError?: (error: string) => void;
	onBackupCodeUsed?: (result: BackupCodeValidationResult) => void;
	autoGenerateBackupCodes?: boolean;
}

export interface TOTPActivationState {
	// Activation state
	isActivating: boolean;
	activationResult: TOTPActivationResult | null;
	activationError: string | null;

	// Backup codes
	backupCodes: BackupCode[] | null;
	backupCodeStats: {
		total: number;
		used: number;
		remaining: number;
		lastUsed?: Date;
		shouldRegenerate: boolean;
	} | null;

	// Validation attempts
	validationAttempts: TOTPValidationAttempt[];
	deviceLockStatus: {
		locked: boolean;
		attemptsRemaining?: number;
		lockoutTime?: Date;
	};

	// Loading states
	isGeneratingBackupCodes: boolean;
	isValidatingBackupCode: boolean;

	// Actions
	activateDevice: (config: TOTPActivationConfig, code: string) => Promise<TOTPActivationResult>;
	validateTOTPCode: (
		secret: string,
		code: string
	) => Promise<{ valid: boolean; timeWindow?: number; error?: string }>;
	validateBackupCode: (code: string) => BackupCodeValidationResult | null;
	generateBackupCodes: () => Promise<BackupCode[] | null>;
	regenerateBackupCodes: () => Promise<BackupCode[] | null>;
	exportBackupCodes: (deviceNickname?: string) => string | null;
	clearValidationAttempts: () => void;
	refreshStats: () => void;
}

export const useTOTPActivation = (options: UseTOTPActivationOptions = {}): TOTPActivationState => {
	const {
		deviceId,
		userId,
		onActivationSuccess,
		onActivationError,
		onBackupCodeUsed,
		autoGenerateBackupCodes = true,
	} = options;

	// State
	const [isActivating, setIsActivating] = useState(false);
	const [activationResult, setActivationResult] = useState<TOTPActivationResult | null>(null);
	const [activationError, setActivationError] = useState<string | null>(null);
	const [backupCodes, setBackupCodes] = useState<BackupCode[] | null>(null);
	const [backupCodeStats, setBackupCodeStats] =
		useState<TOTPActivationState['backupCodeStats']>(null);
	const [validationAttempts, setValidationAttempts] = useState<TOTPValidationAttempt[]>([]);
	const [deviceLockStatus, setDeviceLockStatus] = useState<TOTPActivationState['deviceLockStatus']>(
		{
			locked: false,
		}
	);
	const [isGeneratingBackupCodes, setIsGeneratingBackupCodes] = useState(false);
	const [isValidatingBackupCode, setIsValidatingBackupCode] = useState(false);

	// Load initial data when deviceId and userId are available
	useEffect(() => {
		if (deviceId && userId) {
			refreshStats();
		}
	}, [deviceId, userId, refreshStats]);

	// Refresh statistics and status
	const refreshStats = useCallback(() => {
		if (!deviceId || !userId) return;

		try {
			// Get backup codes and stats
			const codes = TOTPActivationService.getBackupCodes(deviceId, userId);
			setBackupCodes(codes);

			const stats = TOTPActivationService.getBackupCodeStats(deviceId, userId);
			setBackupCodeStats(stats);

			// Get validation attempts
			const attempts = TOTPActivationService.getValidationAttempts(deviceId);
			setValidationAttempts(attempts);

			// Check device lock status
			const lockStatus = TOTPActivationService.isDeviceLocked(deviceId);
			setDeviceLockStatus(lockStatus);
		} catch (error) {
			logger.error('useTOTPActivation', 'Failed to refresh stats', {
				deviceId,
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}, [deviceId, userId]);

	// Activate TOTP device
	const activateDevice = useCallback(
		async (config: TOTPActivationConfig, code: string): Promise<TOTPActivationResult> => {
			setIsActivating(true);
			setActivationError(null);

			try {
				logger.info('useTOTPActivation', 'Activating TOTP device', {
					deviceId: config.deviceId,
					userId: config.userId,
				});

				const result = await TOTPActivationService.activateTOTPDevice(config, code, {
					generateBackupCodes: autoGenerateBackupCodes,
					validateTimeWindow: true,
					allowedTimeSkew: 1,
				});

				setActivationResult(result);

				if (result.success) {
					if (result.backupCodes) {
						setBackupCodes(result.backupCodes);
					}

					// Refresh stats after successful activation
					setTimeout(refreshStats, 100);

					if (onActivationSuccess) {
						onActivationSuccess(result);
					}
				} else {
					setActivationError(result.error || 'Activation failed');
					if (onActivationError) {
						onActivationError(result.error || 'Activation failed');
					}
				}

				return result;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Activation failed';
				setActivationError(errorMessage);

				if (onActivationError) {
					onActivationError(errorMessage);
				}

				logger.error('useTOTPActivation', 'Device activation failed', {
					deviceId: config.deviceId,
					error: errorMessage,
				});

				return {
					success: false,
					deviceId: config.deviceId,
					error: errorMessage,
				};
			} finally {
				setIsActivating(false);
			}
		},
		[autoGenerateBackupCodes, onActivationSuccess, onActivationError, refreshStats]
	);

	// Validate TOTP code
	const validateTOTPCode = useCallback(
		async (
			secret: string,
			code: string
		): Promise<{ valid: boolean; timeWindow?: number; error?: string }> => {
			try {
				const result = await TOTPActivationService.validateTOTPCode(secret, code, {
					allowedTimeSkew: 1,
					validateTimeWindow: true,
				});

				// Refresh stats after validation attempt
				if (deviceId) {
					setTimeout(refreshStats, 100);
				}

				return result;
			} catch (error) {
				logger.error('useTOTPActivation', 'TOTP validation failed', {
					error: error instanceof Error ? error.message : 'Unknown error',
				});

				return {
					valid: false,
					error: 'Validation failed due to technical error',
				};
			}
		},
		[deviceId, refreshStats]
	);

	// Validate backup code
	const validateBackupCode = useCallback(
		(code: string): BackupCodeValidationResult | null => {
			if (!deviceId || !userId) {
				return {
					valid: false,
					error: 'Device ID and User ID are required',
				};
			}

			setIsValidatingBackupCode(true);

			try {
				const result = TOTPActivationService.validateBackupCode(deviceId, userId, code);

				// Refresh stats after validation
				setTimeout(refreshStats, 100);

				if (onBackupCodeUsed) {
					onBackupCodeUsed(result);
				}

				return result;
			} catch (error) {
				logger.error('useTOTPActivation', 'Backup code validation failed', {
					deviceId,
					userId,
					error: error instanceof Error ? error.message : 'Unknown error',
				});

				return {
					valid: false,
					error: 'Backup code validation failed',
				};
			} finally {
				setIsValidatingBackupCode(false);
			}
		},
		[deviceId, userId, onBackupCodeUsed, refreshStats]
	);

	// Generate backup codes
	const generateBackupCodes = useCallback(async (): Promise<BackupCode[] | null> => {
		if (!deviceId || !userId) {
			logger.warn('useTOTPActivation', 'Cannot generate backup codes: missing deviceId or userId');
			return null;
		}

		setIsGeneratingBackupCodes(true);

		try {
			const codes = await TOTPActivationService.generateBackupCodes(deviceId, userId);
			setBackupCodes(codes);

			// Refresh stats after generation
			setTimeout(refreshStats, 100);

			return codes;
		} catch (error) {
			logger.error('useTOTPActivation', 'Failed to generate backup codes', {
				deviceId,
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		} finally {
			setIsGeneratingBackupCodes(false);
		}
	}, [deviceId, userId, refreshStats]);

	// Regenerate backup codes
	const regenerateBackupCodes = useCallback(async (): Promise<BackupCode[] | null> => {
		if (!deviceId || !userId) {
			logger.warn(
				'useTOTPActivation',
				'Cannot regenerate backup codes: missing deviceId or userId'
			);
			return null;
		}

		setIsGeneratingBackupCodes(true);

		try {
			const codes = await TOTPActivationService.regenerateBackupCodes(deviceId, userId);
			setBackupCodes(codes);

			// Refresh stats after regeneration
			setTimeout(refreshStats, 100);

			return codes;
		} catch (error) {
			logger.error('useTOTPActivation', 'Failed to regenerate backup codes', {
				deviceId,
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		} finally {
			setIsGeneratingBackupCodes(false);
		}
	}, [deviceId, userId, refreshStats]);

	// Export backup codes
	const exportBackupCodes = useCallback(
		(deviceNickname?: string): string | null => {
			if (!deviceId || !userId) {
				return null;
			}

			try {
				return TOTPActivationService.exportBackupCodes(deviceId, userId, deviceNickname);
			} catch (error) {
				logger.error('useTOTPActivation', 'Failed to export backup codes', {
					deviceId,
					userId,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				return null;
			}
		},
		[deviceId, userId]
	);

	// Clear validation attempts
	const clearValidationAttempts = useCallback(() => {
		if (!deviceId) return;

		try {
			TOTPActivationService.clearValidationAttempts(deviceId);
			setValidationAttempts([]);
			setDeviceLockStatus({ locked: false });

			logger.info('useTOTPActivation', 'Cleared validation attempts', { deviceId });
		} catch (error) {
			logger.error('useTOTPActivation', 'Failed to clear validation attempts', {
				deviceId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}, [deviceId]);

	return {
		// Activation state
		isActivating,
		activationResult,
		activationError,

		// Backup codes
		backupCodes,
		backupCodeStats,

		// Validation attempts
		validationAttempts,
		deviceLockStatus,

		// Loading states
		isGeneratingBackupCodes,
		isValidatingBackupCode,

		// Actions
		activateDevice,
		validateTOTPCode,
		validateBackupCode,
		generateBackupCodes,
		regenerateBackupCodes,
		exportBackupCodes,
		clearValidationAttempts,
		refreshStats,
	};
};

export default useTOTPActivation;
