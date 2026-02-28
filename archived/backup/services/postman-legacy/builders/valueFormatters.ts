// src/services/builders/valueFormatters.ts

/**
 * Format JSON body values to preserve variables and avoid undefined/null strings.
 */
export const formatJsonBodyValue = (value: unknown): unknown => {
	if (value === undefined || value === null) return '<<MISSING_VALUE>>';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((item) => formatJsonBodyValue(item));
	}
	if (typeof value === 'object') {
		const result: Record<string, unknown> = {};
		Object.entries(value as Record<string, unknown>).forEach(([key, entryValue]) => {
			result[key] = formatJsonBodyValue(entryValue);
		});
		return result;
	}
	return String(value);
};

/**
 * Format header values to avoid undefined/null strings.
 */
export const formatHeaderValue = (value: unknown): string => {
	if (value === undefined || value === null) return '<<MISSING_VALUE>>';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return String(value);
};

/**
 * Format urlencoded values to avoid undefined/null strings.
 */
export const formatUrlEncodedValue = (value: unknown): string => {
	if (value === undefined || value === null) return '<<MISSING_VALUE>>';
	if (typeof value === 'string') return value;
	return String(value);
};

/**
 * Format form values while avoiding blank/undefined strings.
 */
export const formatFormValue = (value: unknown): string => {
	return formatUrlEncodedValue(value);
};
