/**
 * @file phoneValidationV8.ts
 * @module v8/utils
 * @description Phone number validation and normalization utilities
 * @version 8.0.0
 *
 * Accepts multiple phone number formats:
 * - +1.5125201234
 * - +15125201234
 * - +1.512.520.1234
 * - +1 (512) 520-1234
 */

export interface PhoneValidationResult {
	isValid: boolean;
	error?: string;
	normalizedPhone?: string; // Phone number without country code (digits only)
	normalizedFullPhone?: string; // Full phone with country code in PingOne format (+1.5125201234)
	detectedCountryCode?: string; // Country code detected from phone number
}

/**
 * Normalize and validate phone number
 * Handles phone numbers that may include country code in various formats
 *
 * @param phoneNumber - Phone number input (may include country code)
 * @param countryCode - Expected country code (e.g., "+1")
 * @returns Validation result with normalized phone numbers
 */
export function validateAndNormalizePhone(
	phoneNumber: string,
	countryCode: string = '+1'
): PhoneValidationResult {
	if (!phoneNumber?.trim()) {
		return {
			isValid: false,
			error: 'Phone number is required',
		};
	}

	// Remove all whitespace
	const trimmed = phoneNumber.trim();

	// Check if phone number starts with + (includes country code)
	const hasCountryCode = trimmed.startsWith('+');

	// Extract all digits
	const allDigits = trimmed.replace(/[^\d]/g, '');

	// For US/Canada (+1)
	if (countryCode === '+1') {
		let phoneDigits: string;
		let detectedCountryCode = '+1';

		if (hasCountryCode) {
			// Phone number includes country code
			if (allDigits.startsWith('1') && allDigits.length === 11) {
				// Format: +15125201234 (11 digits starting with 1)
				phoneDigits = allDigits.substring(1); // Remove leading 1
			} else if (allDigits.length === 10) {
				// Format: +1.5125201234 where country code is separate, or just 10 digits
				// Check if it starts with country code pattern
				if (trimmed.match(/^\+1[.\s(]/)) {
					// Country code is present but separated: +1.5125201234 or +1 (512) 520-1234
					phoneDigits = allDigits.substring(1); // Remove leading 1
				} else {
					// Just 10 digits, no country code
					phoneDigits = allDigits;
				}
			} else {
				return {
					isValid: false,
					error: `US/Canada phone numbers must be 10 digits (after country code). Found ${allDigits.length} digit${allDigits.length !== 1 ? 's' : ''}`,
				};
			}
		} else {
			// No + prefix, assume just phone digits
			if (allDigits.length === 10) {
				phoneDigits = allDigits;
			} else if (allDigits.length === 11 && allDigits.startsWith('1')) {
				// 11 digits starting with 1, treat as country code included
				phoneDigits = allDigits.substring(1);
				detectedCountryCode = '+1';
			} else {
				return {
					isValid: false,
					error: `US/Canada phone numbers must be exactly 10 digits (you have ${allDigits.length})`,
				};
			}
		}

		if (phoneDigits.length !== 10) {
			return {
				isValid: false,
				error: `US/Canada phone numbers must be exactly 10 digits (you have ${phoneDigits.length})`,
			};
		}

		// Normalize to PingOne format: +1.5125201234
		const normalizedFullPhone = `${detectedCountryCode}.${phoneDigits}`;

		return {
			isValid: true,
			normalizedPhone: phoneDigits,
			normalizedFullPhone,
			detectedCountryCode,
		};
	} else {
		// International numbers
		let phoneDigits: string;
		let detectedCountryCode = countryCode;

		if (hasCountryCode) {
			// Extract country code from phone number
			// For simplicity, assume country code is at the start
			// This is a simplified approach - in production, you might want to use a library
			// to properly parse international numbers
			const countryCodeDigits = countryCode.replace(/[^\d]/g, '');
			if (allDigits.startsWith(countryCodeDigits)) {
				phoneDigits = allDigits.substring(countryCodeDigits.length);
				detectedCountryCode = countryCode;
			} else {
				// Try to detect country code from the + prefix
				// For now, use the provided country code
				phoneDigits = allDigits;
			}
		} else {
			phoneDigits = allDigits;
		}

		if (phoneDigits.length < 6) {
			return {
				isValid: false,
				error: 'Phone number is too short (minimum 6 digits)',
			};
		} else if (phoneDigits.length > 15) {
			return {
				isValid: false,
				error: 'Phone number is too long (maximum 15 digits)',
			};
		}

		// Normalize to PingOne format: +countryCode.phonedigits
		const normalizedFullPhone = `${detectedCountryCode}.${phoneDigits}`;

		return {
			isValid: true,
			normalizedPhone: phoneDigits,
			normalizedFullPhone,
			detectedCountryCode,
		};
	}
}

/**
 * Check if a phone number is valid (quick validation without normalization)
 */
export function isValidPhoneFormat(phoneNumber: string, countryCode: string = '+1'): boolean {
	const result = validateAndNormalizePhone(phoneNumber, countryCode);
	return result.isValid;
}
