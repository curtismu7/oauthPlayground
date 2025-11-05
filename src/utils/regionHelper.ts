// src/utils/regionHelper.ts
// Helper utilities for PingOne region handling

/**
 * Map of PingOne regions to their authentication domains
 */
export const REGION_DOMAINS: Record<string, string> = {
	us: 'auth.pingone.com',
	eu: 'auth.pingone.eu',
	ap: 'auth.pingone.asia',
	ca: 'auth.pingone.ca',
	na: 'auth.pingone.com', // na is an alias for us
};

/**
 * Get the authentication domain for a given region
 * @param region - The PingOne region code (us, eu, ap, ca)
 * @returns The authentication domain (e.g., 'auth.pingone.com')
 */
export const getAuthDomain = (region?: string): string => {
	if (!region) return REGION_DOMAINS.us;
	return REGION_DOMAINS[region] || REGION_DOMAINS.us;
};

/**
 * Build authorization endpoint URL for a given environment and region
 * @param environmentId - The PingOne environment ID
 * @param region - The PingOne region code
 * @returns The full authorization endpoint URL
 */
export const buildAuthEndpoint = (environmentId: string, region?: string): string => {
	const domain = getAuthDomain(region);
	return `https://${domain}/${environmentId}/as/authorize`;
};

/**
 * Build token endpoint URL for a given environment and region
 * @param environmentId - The PingOne environment ID
 * @param region - The PingOne region code
 * @returns The full token endpoint URL
 */
export const buildTokenEndpoint = (environmentId: string, region?: string): string => {
	const domain = getAuthDomain(region);
	return `https://${domain}/${environmentId}/as/token`;
};

/**
 * Extract region from an existing PingOne URL
 * @param url - A PingOne URL containing a domain
 * @returns The region code (us, eu, ap, ca) or undefined if not found
 */
export const extractRegionFromUrl = (url: string): string | undefined => {
	for (const [region, domain] of Object.entries(REGION_DOMAINS)) {
		if (url.includes(domain)) {
			return region === 'na' ? 'us' : region;
		}
	}
	return undefined;
};

/**
 * Get region display name for UI
 * @param region - The PingOne region code
 * @returns Display name for the region
 */
export const getRegionDisplayName = (region?: string): string => {
	const domain = getAuthDomain(region);
	switch (region) {
		case 'us':
		case 'na':
			return `US (${domain})`;
		case 'eu':
			return `Europe (${domain})`;
		case 'ap':
			return `Asia Pacific (${domain})`;
		case 'ca':
			return `Canada (${domain})`;
		default:
			return `US (${domain})`;
	}
};

