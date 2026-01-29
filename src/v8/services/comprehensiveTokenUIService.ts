/**
 * @file comprehensiveTokenUIService.ts
 * @module v8/services
 * @description Comprehensive Token UI Service for MFA flows with global token sync
 * @version 8.0.0
 */

import { unifiedWorkerTokenService } from '../../services/unifiedWorkerTokenService';
import { WorkerTokenStatusServiceV8 } from './workerTokenStatusServiceV8';

// Token Types
export type TokenStatus = 'valid' | 'expiring-soon' | 'expired' | 'missing';

export interface TokenInfo {
	expiresAt: number | null;
	duration: string | null;
	permissions: string | null;
	environment: string | null;
	lastUpdated: number | null;
	tokenId: string | null;
	tokenType: 'worker' | 'user';
	status: TokenStatus;
	scopes: string[] | null;
	issuer: string | null;
	audience: string | null;
	algorithm: string | null;
	keyId: string | null;
	createdAt: number | null;
	issuedAt: number | null;
	notBefore: number | null;
	subject: string | null;
	username?: string | null;
	userId?: string | null;
	email?: string | null;
	roles?: string[] | null;
	groups?: string[] | null;
	department?: string | null;
	grantTypes?: string[] | null;
	riskScore?: string | null;
	mfaRequired?: boolean;
	encryptionMethod?: string | null;
	lastSecurityCheck?: number | null;
	apiVersion?: string | null;
	region?: string | null;
	tenantId?: string | null;
	sessionId?: string | null;
	refreshCount?: number;
	clientInfo?: string | null;
	deviceInfo?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export interface TokenState {
	hasWorkerToken: boolean;
	hasUserToken: boolean;
	workerTokenValid: boolean;
	userTokenValid: boolean;
	workerTokenInfo: TokenInfo;
	userTokenInfo: TokenInfo;
	lastChoice: 'worker' | 'user';
}

export interface CollapsibleState {
	worker: { isExpanded: boolean; toggleCount: number };
	user: { isExpanded: boolean; toggleCount: number };
}

export interface StatusCardInfo {
	type: 'success' | 'warning' | 'error' | 'info';
	title: string;
	message: string;
	badge: string;
	details: string[];
}

export interface TokenUIConfig {
	collapsibleStatusBoxes: boolean;
	autoCollapse: boolean;
	autoCollapseDelay: number;
	persistChoice: boolean;
	refreshInterval: number;
}

const DEFAULT_CONFIG: TokenUIConfig = {
	collapsibleStatusBoxes: true,
	autoCollapse: false,
	autoCollapseDelay: 30000,
	persistChoice: true,
	refreshInterval: 30000,
};

/**
 * Comprehensive Token UI Service
 * Manages token states, collapsible UI, and synchronization with global tokens
 */
export class ComprehensiveTokenUIService {
	private config: TokenUIConfig;
	private tokenState: TokenState;
	private collapsibleState: CollapsibleState;
	private refreshTimer: NodeJS.Timeout | null = null;
	private listeners: ((state: TokenState) => void)[] = [];
	private environmentId: string | null = null;

	constructor(config: Partial<TokenUIConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.tokenState = this.initializeTokenState();
		this.collapsibleState = this.initializeCollapsibleState();

		// Sync with existing global tokens on initialization
		this.syncWithGlobalTokens();
		this.startPeriodicRefresh();
		this.loadPersistedChoice();
	}

	/**
	 * Initialize token state with default values
	 */
	private initializeTokenState(): TokenState {
		return {
			hasWorkerToken: false,
			hasUserToken: false,
			workerTokenValid: false,
			userTokenValid: false,
			workerTokenInfo: this.createEmptyTokenInfo('worker'),
			userTokenInfo: this.createEmptyTokenInfo('user'),
			lastChoice: 'user',
		};
	}

	/**
	 * Initialize collapsible state
	 */
	private initializeCollapsibleState(): CollapsibleState {
		return {
			worker: { isExpanded: true, toggleCount: 0 },
			user: { isExpanded: true, toggleCount: 0 },
		};
	}

	/**
	 * Create empty token info object
	 */
	private createEmptyTokenInfo(tokenType: 'worker' | 'user'): TokenInfo {
		const baseInfo: TokenInfo = {
			expiresAt: null,
			duration: null,
			permissions: null,
			environment: null,
			lastUpdated: null,
			tokenId: null,
			tokenType,
			status: 'missing',
			scopes: null,
			issuer: null,
			audience: null,
			algorithm: null,
			keyId: null,
			createdAt: null,
			issuedAt: null,
			notBefore: null,
			subject: null,
			username: null,
			userId: null,
			email: null,
			roles: null,
			groups: null,
			department: null,
			grantTypes: null,
			riskScore: null,
			mfaRequired: false,
			encryptionMethod: null,
			lastSecurityCheck: null,
			apiVersion: null,
			region: null,
			tenantId: null,
			sessionId: null,
			refreshCount: 0,
			clientInfo: null,
			deviceInfo: null,
			ipAddress: null,
			userAgent: null,
		};

		if (tokenType === 'user') {
			baseInfo.username = null;
			baseInfo.userId = null;
			baseInfo.email = null;
			baseInfo.roles = null;
			baseInfo.groups = null;
			baseInfo.department = null;
		}

		return baseInfo;
	}

	/**
	 * Sync with existing global worker token and environment ID
	 */
	private async syncWithGlobalTokens(): Promise<void> {
		try {
			// Get global environment ID from unified worker token service
			const globalEnvId = await this.getGlobalEnvironmentId();
			if (globalEnvId) {
				this.environmentId = globalEnvId;
				this.tokenState.workerTokenInfo.environment = globalEnvId;
			}

			// Check for existing worker token
			const workerTokenStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();

			if (workerTokenStatus.isValid && workerTokenStatus.token) {
				// Get detailed token info from unified service
				const tokenDetails = await unifiedWorkerTokenService.getToken();
				const statusDetails = await unifiedWorkerTokenService.getStatus();

				this.setWorkerToken({
					tokenId: workerTokenStatus.token,
					status: workerTokenStatus.status,
					expiresAt: workerTokenStatus.expiresAt || null,
					duration: workerTokenStatus.minutesRemaining
						? `${workerTokenStatus.minutesRemaining} minutes`
						: null,
					environment: globalEnvId || null,
					lastUpdated: statusDetails?.lastFetchedAt || Date.now(),
					isValid: workerTokenStatus.isValid,
					// Add any additional details from unified service
					...(tokenDetails && { subject: tokenDetails.sub }),
					...(tokenDetails && { audience: tokenDetails.aud }),
					...(tokenDetails && { issuer: tokenDetails.iss }),
					...(statusDetails?.lastFetchedAt && { issuedAt: statusDetails.lastFetchedAt }),
				});
			}

			// Notify listeners of the sync
			this.notifyListeners();
			this.notifyTokenUpdate('sync');
		} catch (error) {
			console.error('[ComprehensiveTokenUIService] Failed to sync with global tokens:', error);
		}
	}

	/**
	 * Get global environment ID from unified worker token service
	 */
	private async getGlobalEnvironmentId(): Promise<string | null> {
		try {
			// Try to get environment ID from unified worker token service
			const status = await unifiedWorkerTokenService.getStatus();
			return status.environmentId || null;
		} catch (error) {
			console.error('[ComprehensiveTokenUIService] Failed to get global environment ID:', error);
			return null;
		}
	}

	/**
	 * Get current environment ID
	 */
	public getEnvironmentId(): string | null {
		return this.environmentId;
	}

	/**
	 * Set environment ID
	 */
	public setEnvironmentId(environmentId: string): void {
		this.environmentId = environmentId;
		this.tokenState.workerTokenInfo.environment = environmentId;
		this.tokenState.userTokenInfo.environment = environmentId;
		this.notifyListeners();
	}

	/**
	 * Start periodic refresh of token status
	 */
	private startPeriodicRefresh(): void {
		if (this.config.refreshInterval > 0) {
			this.refreshTimer = setInterval(() => {
				this.syncWithGlobalTokens();
			}, this.config.refreshInterval);
		}
	}

	/**
	 * Notify all listeners of state changes
	 */
	private notifyListeners(): void {
		this.listeners.forEach((listener) => {
			listener(this.getTokenState());
		});
	}

	/**
	 * Notify token update event
	 */
	private notifyTokenUpdate(tokenType: string): void {
		const event = new CustomEvent('tokenUIUpdate', {
			detail: { type: 'token', tokenType },
		});
		window.dispatchEvent(event);
	}

	/**
	 * Notify collapsible update event
	 */
	private notifyCollapsibleUpdate(tokenType: string): void {
		const event = new CustomEvent('tokenUIUpdate', {
			detail: { type: 'collapsible', tokenType },
		});
		window.dispatchEvent(event);
	}

	/**
	 * Notify choice update event
	 */
	private notifyChoiceUpdate(choice: string): void {
		const event = new CustomEvent('tokenUIUpdate', {
			detail: { type: 'choice', choice },
		});
		window.dispatchEvent(event);
	}

	/**
	 * Get current token state
	 */
	public getTokenState(): TokenState {
		return { ...this.tokenState };
	}

	/**
	 * Set worker token
	 */
	public setWorkerToken(tokenInfo: Partial<TokenInfo>): void {
		this.tokenState.hasWorkerToken = true;
		this.tokenState.workerTokenValid = this.isTokenValid(tokenInfo.expiresAt);
		this.tokenState.workerTokenInfo = { ...this.tokenState.workerTokenInfo, ...tokenInfo };
		this.notifyListeners();
		this.notifyTokenUpdate('worker');
	}

	/**
	 * Set user token
	 */
	public setUserToken(tokenInfo: Partial<TokenInfo>): void {
		this.tokenState.userTokenInfo = { ...this.tokenState.userTokenInfo, ...tokenInfo };
		this.tokenState.hasUserToken = true;
		this.tokenState.userTokenValid = this.isTokenValid(tokenInfo.expiresAt);
		this.notifyListeners();
		this.notifyTokenUpdate('user');
	}

	/**
	 * Clear worker token
	 */
	public clearWorkerToken(): void {
		this.tokenState.workerTokenInfo = this.createEmptyTokenInfo('worker');
		this.tokenState.hasWorkerToken = false;
		this.tokenState.workerTokenValid = false;
		this.notifyListeners();
		this.notifyTokenUpdate('worker');
	}

	/**
	 * Clear user token
	 */
	public clearUserToken(): void {
		this.tokenState.userTokenInfo = this.createEmptyTokenInfo('user');
		this.tokenState.hasUserToken = false;
		this.tokenState.userTokenValid = false;
		this.notifyListeners();
		this.notifyTokenUpdate('user');
	}

	/**
	 * Clear all tokens
	 */
	public clearAllTokens(): void {
		this.clearWorkerToken();
		this.clearUserToken();
	}

	/**
	 * Check if token is valid based on expiration
	 */
	private isTokenValid(expiresAt: number | null | undefined): boolean {
		if (!expiresAt) return false;
		return Date.now() < expiresAt;
	}

	/**
	 * Get status card info
	 */
	public getStatusCardInfo(): StatusCardInfo {
		const hasBothValid = this.tokenState.workerTokenValid && this.tokenState.userTokenValid;
		const hasValidWorker = this.tokenState.workerTokenValid;
		const hasValidUser = this.tokenState.userTokenValid;

		if (hasBothValid) {
			return {
				type: 'success',
				title: '✅ All Tokens Ready',
				message: 'Both worker and user tokens are active and valid',
				badge: 'COMPLETE',
				details: ['Worker token: Active', 'User token: Authenticated', 'MFA registration: Ready'],
			};
		} else if (hasValidWorker) {
			return {
				type: 'warning',
				title: '⚠️ User Token Required',
				message: 'Worker token is ready, but user authentication is needed',
				badge: 'PARTIAL',
				details: ['Worker token: Active', 'User token: Missing', 'Action: Complete user login'],
			};
		} else if (hasValidUser) {
			return {
				type: 'warning',
				title: '⚠️ Worker Token Required',
				message: 'User is authenticated, but worker token is needed',
				badge: 'PARTIAL',
				details: ['Worker token: Missing', 'User token: Active', 'Action: Generate worker token'],
			};
		} else {
			return {
				type: 'error',
				title: '❌ Tokens Required',
				message: 'Both worker and user tokens are needed for MFA registration',
				badge: 'MISSING',
				details: [
					'Worker token: Required for device registration',
					'User token: Required for MFA authentication',
					'Action: Generate both tokens',
				],
			};
		}
	}

	/**
	 * Toggle collapsible status
	 */
	public toggleCollapsibleStatus(tokenType: 'worker' | 'user'): void {
		const state = this.collapsibleState[tokenType];
		if (state) {
			state.isExpanded = !state.isExpanded;
			state.toggleCount++;
			this.notifyCollapsibleUpdate(tokenType);
		}
	}

	/**
	 * Expand all status boxes
	 */
	public expandAllStatusBoxes(): void {
		Object.keys(this.collapsibleState).forEach((tokenType) => {
			this.collapsibleState[tokenType as keyof CollapsibleState].isExpanded = true;
		});
		this.notifyCollapsibleUpdate('all');
	}

	/**
	 * Collapse all status boxes
	 */
	public collapseAllStatusBoxes(): void {
		Object.keys(this.collapsibleState).forEach((tokenType) => {
			this.collapsibleState[tokenType as keyof CollapsibleState].isExpanded = false;
		});
		this.notifyCollapsibleUpdate('all');
	}

	/**
	 * Get collapsible state
	 */
	public getCollapsibleState(tokenType: 'worker' | 'user'): boolean {
		return this.collapsibleState[tokenType]?.isExpanded ?? true;
	}

	/**
	 * Get all collapsible states
	 */
	public getAllCollapsibleStates(): CollapsibleState {
		return { ...this.collapsibleState };
	}

	/**
	 * Set user choice
	 */
	public setUserChoice(choice: 'worker' | 'user'): void {
		this.tokenState.lastChoice = choice;
		if (this.config.persistChoice) {
			this.persistChoice(choice);
		}
		this.notifyChoiceUpdate(choice);
	}

	/**
	 * Get user choice
	 */
	public getUserChoice(): 'worker' | 'user' {
		return this.tokenState.lastChoice;
	}

	/**
	 * Persist user choice to localStorage
	 */
	private persistChoice(choice: 'worker' | 'user'): void {
		try {
			localStorage.setItem('tokenUIChoice', choice);
		} catch (error) {
			console.error('[ComprehensiveTokenUIService] Failed to persist choice:', error);
		}
	}

	/**
	 * Load persisted choice from localStorage
	 */
	private loadPersistedChoice(): void {
		try {
			const savedChoice = localStorage.getItem('tokenUIChoice');
			if (savedChoice === 'worker' || savedChoice === 'user') {
				this.tokenState.lastChoice = savedChoice;
			}
		} catch (error) {
			console.error('[ComprehensiveTokenUIService] Failed to load persisted choice:', error);
		}
	}

	/**
	 * Format token ID for display
	 */
	public formatTokenId(tokenId: string): string {
		if (!tokenId || tokenId === 'N/A') return 'N/A';
		if (tokenId.length <= 8) return tokenId;
		return `${tokenId.substring(0, 4)}...${tokenId.substring(tokenId.length - 4)}`;
	}

	/**
	 * Format time remaining for display
	 */
	public formatTimeRemaining(expiresAt: number): string {
		if (!expiresAt) return 'N/A';

		const now = Date.now();
		const diff = expiresAt - now;

		if (diff <= 0) return 'Expired';

		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
		return 'Less than 1 minute';
	}

	/**
	 * Format date time for display
	 */
	public formatDateTime(timestamp: number): string {
		if (!timestamp) return 'N/A';
		return new Date(timestamp).toLocaleString();
	}

	/**
	 * Format scopes for display
	 */
	public formatScopes(scopes: string[]): string {
		if (!scopes || scopes.length === 0) return 'N/A';
		return scopes.join(', ');
	}

	/**
	 * Format roles for display
	 */
	public formatRoles(roles: string[]): string {
		if (!roles || roles.length === 0) return 'N/A';
		return roles.join(', ');
	}

	/**
	 * Destroy service and cleanup timers
	 */
	public destroy(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = null;
		}
		this.listeners = [];
	}

	/**
	 * Static factory method for default instance
	 */
	public static createDefault(): ComprehensiveTokenUIService {
		return new ComprehensiveTokenUIService({
			collapsibleStatusBoxes: true,
			autoCollapse: false,
			persistChoice: true,
			refreshInterval: 30000,
		});
	}
}

// Export singleton instance
export const comprehensiveTokenUIService = new ComprehensiveTokenUIService();
