// src/utils/apiCallTypeDetector.ts
// Utility for detecting and classifying API call types with color themes

export type ApiCallType = 'pingone' | 'frontend' | 'internal';

export interface CallTypeResult {
	type: ApiCallType;
	displayName: string;
	icon: string;
	description: string;
}

export interface ColorTheme {
	background: string;
	border: string;
	text: string;
	badgeBackground: string;
	headerGradient: string;
	hoverGradient: string;
}

/**
 * API Call Type Detector
 * Automatically classifies API calls and provides color themes
 */
export class ApiCallTypeDetector {
	/**
	 * Detect the type of API call based on URL and method
	 */
	static detectCallType(url: string, method: string): CallTypeResult {
		// Frontend/Client-side operations
		if (method === 'LOCAL' || !url || url === 'Client-side' || url.includes('Client-side')) {
			return {
				type: 'frontend',
				displayName: 'Frontend Client-Side',
				icon: '💻',
				description: 'Client-side operation (no network request)',
			};
		}

		// PingOne backend calls - direct domains
		if (
			url.includes('auth.pingone.com') ||
			url.includes('api.pingone.com') ||
			url.includes('auth.pingone.asia') ||
			url.includes('api.pingone.asia') ||
			url.includes('auth.pingone.eu') ||
			url.includes('api.pingone.eu') ||
			url.includes('pingone.com/') ||
			url.includes('pingone.asia/') ||
			url.includes('pingone.eu/')
		) {
			return {
				type: 'pingone',
				displayName: 'PingOne Backend API',
				icon: '🌐',
				description: 'Real HTTP request to PingOne servers',
			};
		}

		// PingOne backend calls routed through our API (proxy endpoints)
		if (
			url.startsWith('/api/pingone/') ||
			url.startsWith('/api/p1/') ||
			url.includes('/api/pingone/') ||
			url.includes('/pingone/redirectless') ||
			url.includes('/pingone/flows')
		) {
			return {
				type: 'pingone',
				displayName: 'PingOne Backend API',
				icon: '🌐',
				description: 'PingOne API call routed through the playground backend',
			};
		}

		// Internal/Proxy calls (default fallback)
		return {
			type: 'internal',
			displayName: 'Application Service',
			icon: '🔄',
			description: 'Internal playground service or utility request',
		};
	}

	/**
	 * Get color theme for call type
	 */
	static getColorTheme(callType: ApiCallType): ColorTheme {
		const themes: Record<ApiCallType, ColorTheme> = {
			pingone: {
				background: '#fef3c7', // Amber 100
				border: '#f59e0b', // Amber 500
				text: '#92400e', // Amber 800
				badgeBackground: '#fde68a', // Amber 200
				headerGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
				hoverGradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
			},
			frontend: {
				background: '#dbeafe', // Blue 100
				border: '#3b82f6', // Blue 500
				text: '#1e40af', // Blue 800
				badgeBackground: '#bfdbfe', // Blue 200
				headerGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
				hoverGradient: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)',
			},
			internal: {
				background: '#d1fae5', // Green 100
				border: '#10b981', // Green 500
				text: '#065f46', // Green 800
				badgeBackground: '#a7f3d0', // Green 200
				headerGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
				hoverGradient: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
			},
		};

		return themes[callType];
	}

	/**
	 * Get all available call types with their metadata
	 */
	static getAllCallTypes(): CallTypeResult[] {
		return [
			{
				type: 'pingone',
				displayName: 'PingOne Backend API',
				icon: '🌐',
				description: 'Real HTTP request to PingOne servers',
			},
			{
				type: 'frontend',
				displayName: 'Frontend Client-Side',
				icon: '💻',
				description: 'Client-side operation (no network request)',
			},
			{
				type: 'internal',
				displayName: 'Application Service',
				icon: '🔄',
				description: 'Internal playground service or utility request',
			},
		];
	}

	/**
	 * Validate if a string is a valid ApiCallType
	 */
	static isValidCallType(type: string): type is ApiCallType {
		return type === 'pingone' || type === 'frontend' || type === 'internal';
	}
}

// Export convenience functions
export const detectCallType = (url: string, method: string): CallTypeResult =>
	ApiCallTypeDetector.detectCallType(url, method);

export const getColorTheme = (callType: ApiCallType): ColorTheme =>
	ApiCallTypeDetector.getColorTheme(callType);

export const getAllCallTypes = (): CallTypeResult[] => ApiCallTypeDetector.getAllCallTypes();
