// src/config/migrationStatus.ts
/**
 * Migration Status Tracker
 *
 * Tracks which V5 flows have been migrated to use ComprehensiveCredentialsService
 *
 * Status indicators:
 * - ✅ complete: Migrated to ComprehensiveCredentialsService
 * - 🚧 in-progress: Migration in progress
 * - ⏭️ pending: Not yet migrated
 */

export interface MigrationStatus {
	flowPath: string;
	flowName: string;
	status: 'complete' | 'in-progress' | 'pending';
	migratedDate?: string;
	codeReduction?: string;
	notes?: string;
}

export const V5_MIGRATION_STATUS: Record<string, MigrationStatus> = {
	'/flows/oauth-implicit-v5': {
		flowPath: '/flows/oauth-implicit-v5',
		flowName: 'OAuth Implicit V5',
		status: 'complete',
		migratedDate: '2025-10-08',
		codeReduction: '78%',
		notes: 'Pilot migration - successful with zero issues',
	},
	'/flows/oidc-implicit-v5': {
		flowPath: '/flows/oidc-implicit-v5',
		flowName: 'OIDC Implicit V5',
		status: 'complete',
		migratedDate: '2025-10-08',
		codeReduction: '75%',
		notes: 'Successfully migrated with OAuth-to-OIDC sync and distinct differences',
	},
	'/flows/oauth-authorization-code-v5': {
		flowPath: '/flows/oauth-authorization-code-v5',
		flowName: 'OAuth Authorization Code V5',
		status: 'pending',
	},
	'/flows/oidc-authorization-code-v5': {
		flowPath: '/flows/oidc-authorization-code-v5',
		flowName: 'OIDC Authorization Code V5',
		status: 'pending',
	},
	'/flows/client-credentials-v5': {
		flowPath: '/flows/client-credentials-v5',
		flowName: 'Client Credentials V5',
		status: 'pending',
	},
	'/flows/device-authorization-v6': {
		flowPath: '/flows/device-authorization-v6',
		flowName: 'Device Authorization V6',
		status: 'migrated',
	},
	'/flows/oidc-device-authorization-v6': {
		flowPath: '/flows/oidc-device-authorization-v6',
		flowName: 'OIDC Device Authorization V6',
		status: 'migrated',
	},
};

/**
 * Get migration status for a flow
 */
export const getMigrationStatus = (flowPath: string): MigrationStatus | null => {
	return V5_MIGRATION_STATUS[flowPath] || null;
};

/**
 * Check if a flow is migrated
 */
export const isFlowMigrated = (flowPath: string): boolean => {
	const status = getMigrationStatus(flowPath);
	return status?.status === 'complete';
};

/**
 * Get migration progress statistics
 */
export const getMigrationProgress = () => {
	const flows = Object.values(V5_MIGRATION_STATUS);
	const total = flows.length;
	const completed = flows.filter((f) => f.status === 'complete').length;
	const inProgress = flows.filter((f) => f.status === 'in-progress').length;
	const pending = flows.filter((f) => f.status === 'pending').length;

	return {
		total,
		completed,
		inProgress,
		pending,
		percentComplete: Math.round((completed / total) * 100),
	};
};
