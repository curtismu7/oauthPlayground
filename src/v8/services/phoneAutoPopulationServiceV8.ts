/**
 * @file phoneAutoPopulationServiceV8.ts
 * @module v8/services
 * @description Service for auto-populating phone numbers from PingOne user profile
 * @version 8.0.0
 */

import { MFAServiceV8, type UserLookupResult } from './mfaServiceV8';

const MODULE_TAG = '[📞 PHONE-AUTO-POPULATION-V8]';

/**
 * Extract phone number from PingOne user object
 * Looks for mobile or main phone number in phoneNumbers array
 * @param user - User object from PingOne API
 * @returns Phone number string or null if not found
 */
export function extractPhoneFromUser(user: UserLookupResult): string | null {
	try {
		// PingOne user object can have phoneNumbers as an array of objects
		// Each object has: { number: string, type?: string }
		// Types can be: "MOBILE", "MAIN", "HOME", "WORK", etc.
		const phoneNumbers = (user as { phoneNumbers?: Array<{ number?: string; type?: string }> }).phoneNumbers;

		if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
			return null;
		}

		// First, try to find MOBILE phone
		const mobilePhone = phoneNumbers.find((p) => p.type === 'MOBILE' && p.number?.trim());
		if (mobilePhone?.number) {
			return mobilePhone.number.trim();
		}

		// Second, try to find MAIN phone
		const mainPhone = phoneNumbers.find((p) => p.type === 'MAIN' && p.number?.trim());
		if (mainPhone?.number) {
			return mainPhone.number.trim();
		}

		// Fallback: use first phone number if available
		const firstPhone = phoneNumbers.find((p) => p.number?.trim());
		if (firstPhone?.number) {
			return firstPhone.number.trim();
		}

		return null;
	} catch (error) {
		console.error(`${MODULE_TAG} Error extracting phone from user object:`, error);
		return null;
	}
}

/**
 * Fetch and extract phone number from PingOne user profile
 * @param environmentId - PingOne environment ID
 * @param username - Username to lookup
 * @returns Phone number string or null if not found
 */
export async function fetchPhoneFromPingOne(
	environmentId: string,
	username: string
): Promise<string | null> {
	try {
		const user = await MFAServiceV8.lookupUserByUsername(environmentId, username);
		return extractPhoneFromUser(user);
	} catch (error) {
		console.error(`${MODULE_TAG} Failed to fetch user phone from PingOne:`, error);
		return null;
	}
}

