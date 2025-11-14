// src/services/pingOneLogoutService.ts
// Reusable helper to initiate PingOne logout flows across the application

import SessionTerminationService, {
	type BuildLogoutUrlOptions,
	buildLogoutUrl,
} from './sessionTerminationService';

export type PingOneLogoutOpenTarget = 'same-tab' | 'new-tab';

export interface PingOneLogoutOptions extends BuildLogoutUrlOptions {
	/**
	 * When true (default) the service will immediately open the logout URL.
	 * Set to false to only generate the URL.
	 */
	autoOpen?: boolean;
	/**
	 * Determines where the logout request is sent when autoOpen is true.
	 * Defaults to opening in a new browser tab.
	 */
	openIn?: PingOneLogoutOpenTarget;
	/**
	 * Clears known local/session storage keys related to PingOne playground flows.
	 * Uses the defaults from SessionTerminationService when true.
	 */
	clearClientStorage?: boolean;
}

export interface PingOneLogoutResult {
	success: boolean;
	url?: string | null;
	error?: string;
	message: string;
	opened?: boolean;
}

const openLogoutUrl = (url: string, target: PingOneLogoutOpenTarget): boolean => {
	if (typeof window === 'undefined') {
		return false;
	}

	if (target === 'same-tab') {
		window.location.href = url;
		return true;
	}

	// Try to open in new tab with better popup blocker handling
	try {
		const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
		
		// Check if popup was blocked
		if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
			console.warn('[pingOneLogoutService] Popup may have been blocked by browser');
			return false;
		}
		
		// Focus the new window
		newWindow.focus();
		return true;
	} catch (error) {
		console.error('[pingOneLogoutService] Failed to open logout URL:', error);
		return false;
	}
};

export const pingOneLogoutService = {
	/**
	 * Builds a PingOne logout URL using the shared session termination helpers.
	 */
	buildLogoutUrl(options: PingOneLogoutOptions): string | null {
		return buildLogoutUrl(options);
	},

	/**
	 * Generates a logout URL (and optionally opens it) for PingOne,
	 * returning a structured result that can be surfaced in the UI.
	 */
	async logout(options: PingOneLogoutOptions): Promise<PingOneLogoutResult> {
		const url = buildLogoutUrl(options);

		if (!url) {
			return {
				success: false,
				error:
					'Unable to build logout URL. Ensure an environment ID (or issuer) and ID token are provided.',
				message: 'Logout URL generation failed',
			};
		}

		if (options.clearClientStorage) {
			SessionTerminationService.clearClientStorage();
		}

		if (options.autoOpen === false) {
			return {
				success: true,
				url,
				opened: false,
				message: 'Logout URL generated',
			};
		}

		const target = options.openIn ?? 'new-tab';
		const opened = openLogoutUrl(url, target);

		return {
			success: true,
			url,
			opened,
			message: opened
				? 'Logout initiated in a new browser window'
				: 'Logout URL generated; please open it manually',
		};
	},
};

export default pingOneLogoutService;




