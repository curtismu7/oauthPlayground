// src/v8/utils/workerTokenModalHelperV8_SIMPLE.ts
// DEAD SIMPLE version: If creds exist → no modal, if no creds → modal

import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';

const MODULE_TAG = '[🔑 SIMPLE-WORKER-TOKEN-MODAL]';

/**
 * DEAD SIMPLE worker token modal logic:
 * 1. Check if credentials exist (browser storage or sqlite)
 * 2. If credentials exist → NO MODAL (let silent API work)
 * 3. If no credentials → SHOW MODAL (tell user they need to enter creds)
 *
 * This bypasses all the complex silentApiRetrieval/showTokenAtEnd logic
 * and just focuses on the core issue: credentials vs no credentials.
 */
export async function handleShowWorkerTokenModalSimple(
	setShowModal: (show: boolean) => void,
	forceShowModal: boolean = false // User explicitly clicked button
): Promise<void> {
	try {
		console.log(`${MODULE_TAG} Starting simple modal check`);

		// If user explicitly clicked button, always show modal
		if (forceShowModal) {
			console.log(`${MODULE_TAG} User clicked button → showing modal`);
			setShowModal(true);
			return;
		}

		// DEAD SIMPLE: Check if credentials exist
		const credentials = await workerTokenServiceV8.loadCredentials();
		const hasCredentials = credentials !== null;

		console.log(`${MODULE_TAG} Credentials check:`, { hasCredentials });

		if (hasCredentials) {
			// Credentials exist → NO MODAL
			// Let the silent API do its thing in the background
			console.log(`${MODULE_TAG} Credentials exist → no modal needed`);
			setShowModal(false);
			return;
		} else {
			// No credentials → SHOW MODAL
			// Tell user they need to enter credentials
			console.log(`${MODULE_TAG} No credentials → showing modal for credential entry`);
			setShowModal(true);
			return;
		}
	} catch (error) {
		console.error(`${MODULE_TAG} Error in simple modal logic:`, error);
		// On error, show modal to be safe
		setShowModal(true);
	}
}

/**
 * Simple synchronous check for immediate decisions
 */
export function hasCredentialsSync(): boolean {
	try {
		const stored = localStorage.getItem('unified_worker_token');
		if (!stored) return false;

		const data = JSON.parse(stored);
		const credentials = data.credentials || data.data?.credentials;
		return credentials !== null && typeof credentials === 'object';
	} catch (error) {
		console.error(`${MODULE_TAG} Error checking credentials sync:`, error);
		return false;
	}
}
