// src/services/passwordResetService.version.ts
// Version tracking for Password Reset Service

/**
 * Password Reset Service Version
 *
 * Version History:
 * - 1.0.0 (2025-11-07): Initial release with basic password operations
 * - 1.1.0 (2025-11-07): Added error message extraction and user-friendly messages
 * - 1.1.1 (2025-11-07): Fixed password check field name (currentPassword -> password)
 * - 1.2.0 (2025-11-07): Enhanced error handling for all operations
 */

export const PASSWORD_RESET_SERVICE_VERSION = '1.2.0';

export interface ServiceVersion {
	version: string;
	releaseDate: string;
	features: string[];
	breaking: boolean;
}

export const VERSION_HISTORY: ServiceVersion[] = [
	{
		version: '1.2.0',
		releaseDate: '2025-11-07',
		features: [
			'Enhanced error message extraction',
			'User-friendly error messages for all operations',
			'Comprehensive error handling',
			'Support for password policy violations',
			'Support for password reuse detection',
		],
		breaking: false,
	},
	{
		version: '1.1.1',
		releaseDate: '2025-11-07',
		features: ['Fixed password check API field name', 'Corrected request body format'],
		breaking: false,
	},
	{
		version: '1.1.0',
		releaseDate: '2025-11-07',
		features: [
			'Added extractErrorMessage helper',
			'Improved error descriptions',
			'Better validation error handling',
		],
		breaking: false,
	},
	{
		version: '1.0.0',
		releaseDate: '2025-11-07',
		features: [
			'Send recovery code',
			'Recover password with code',
			'Check password validity',
			'Force password change',
			'Unlock password',
			'Read password state',
			'Set password (admin)',
			'Set password (general)',
			'Set password value',
			'Set password via LDAP Gateway',
		],
		breaking: false,
	},
];

/**
 * Get current service version
 */
export function getServiceVersion(): string {
	return PASSWORD_RESET_SERVICE_VERSION;
}

/**
 * Get version history
 */
export function getVersionHistory(): ServiceVersion[] {
	return VERSION_HISTORY;
}

/**
 * Check if version is compatible
 */
export function isCompatibleVersion(requiredVersion: string): boolean {
	const [reqMajor, reqMinor] = requiredVersion.split('.').map(Number);
	const [curMajor, curMinor] = PASSWORD_RESET_SERVICE_VERSION.split('.').map(Number);

	// Major version must match, minor version must be >= required
	return curMajor === reqMajor && curMinor >= reqMinor;
}

/**
 * Get breaking changes since version
 */
export function getBreakingChangesSince(version: string): ServiceVersion[] {
	const versionIndex = VERSION_HISTORY.findIndex((v) => v.version === version);
	if (versionIndex === -1) return [];

	return VERSION_HISTORY.slice(0, versionIndex).filter((v) => v.breaking);
}
