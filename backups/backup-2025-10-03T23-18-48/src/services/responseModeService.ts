// src/services/responseModeService.ts
// Comprehensive response mode service for PingOne OAuth/OIDC flows

export type ResponseMode = 'query' | 'fragment' | 'form_post' | 'pi.flow';

export interface ResponseModeInfo {
	mode: ResponseMode;
	name: string;
	description: string;
	useCase: string;
	securityNotes: string[];
	implementation: {
		urlParameter: string;
		responseFormat: string;
		handlingMethod: string;
	};
	compatibility: {
		responseTypes: string[];
		clientTypes: string[];
		platforms: string[];
	};
}

export const RESPONSE_MODE_CONFIG: Record<ResponseMode, ResponseModeInfo> = {
	query: {
		mode: 'query',
		name: 'Query String',
		description:
			'Authorization response parameters are encoded in the query string added to the redirect_uri when redirecting back to the application.',
		useCase: 'Traditional web applications with server-side handling',
		securityNotes: [
			'✅ Standard OAuth 2.0 response mode',
			'Parameters visible in server logs',
			'Requires secure server-side handling',
			'Most compatible with existing OAuth implementations',
		],
		implementation: {
			urlParameter: 'response_mode=query',
			responseFormat: 'https://yourapp.com/callback?code=abc123&state=xyz789',
			handlingMethod: 'Server-side parameter extraction from query string',
		},
		compatibility: {
			responseTypes: ['code', 'code id_token', 'code token', 'code id_token token'],
			clientTypes: ['confidential', 'public'],
			platforms: ['web', 'mobile', 'desktop'],
		},
	},
	fragment: {
		mode: 'fragment',
		name: 'URL Fragment',
		description:
			'Authorization response parameters are encoded in the fragment added to the redirect_uri when redirecting back to the application.',
		useCase: 'Single Page Applications (SPAs) and client-side applications',
		securityNotes: [
			'✅ Standard OAuth 2.0 response mode',
			'Parameters not sent to server (client-side only)',
			'Requires JavaScript to extract parameters',
			'Recommended for public clients and SPAs',
		],
		implementation: {
			urlParameter: 'response_mode=fragment',
			responseFormat:
				'https://yourapp.com/callback#access_token=abc123&token_type=Bearer&expires_in=3600',
			handlingMethod: 'Client-side JavaScript fragment parsing',
		},
		compatibility: {
			responseTypes: ['token', 'id_token', 'token id_token'],
			clientTypes: ['public', 'confidential'],
			platforms: ['web', 'mobile', 'desktop'],
		},
	},
	form_post: {
		mode: 'form_post',
		name: 'Form POST',
		description:
			'Authorization response parameters are encoded as HTML form values that are auto-submitted in the browser, transmitted through HTTP POST to the application.',
		useCase: 'Applications requiring secure parameter transmission without URL exposure',
		securityNotes: [
			'✅ Standard OAuth 2.0 response mode',
			'Parameters not exposed in URL',
			'Requires server-side form processing',
			'More secure than query string for sensitive data',
		],
		implementation: {
			urlParameter: 'response_mode=form_post',
			responseFormat: 'HTTP POST with application/x-www-form-urlencoded body',
			handlingMethod: 'Server-side form data processing',
		},
		compatibility: {
			responseTypes: ['code', 'code id_token', 'code token', 'code id_token token'],
			clientTypes: ['confidential', 'public'],
			platforms: ['web', 'mobile'],
		},
	},
	'pi.flow': {
		mode: 'pi.flow',
		name: 'PingOne Flow Object',
		description:
			'PingOne proprietary redirectless flow that returns a flow object instead of redirecting. Enables embedded authentication without browser redirects.',
		useCase: 'Embedded authentication, mobile apps, headless applications, IoT devices',
		securityNotes: [
			'🔒 PingOne proprietary response mode',
			'No browser redirects required',
			'Requires PingOne-specific implementation',
			'Flow object contains authentication UI details',
			'Tokens returned directly in JSON response',
		],
		implementation: {
			urlParameter: 'response_mode=pi.flow',
			responseFormat: 'JSON flow object with UI details and authentication state',
			handlingMethod: 'Process flow object and render embedded authentication UI',
		},
		compatibility: {
			responseTypes: ['code', 'code id_token', 'code token', 'code id_token token'],
			clientTypes: ['confidential', 'public'],
			platforms: ['web', 'mobile', 'desktop', 'iot'],
		},
	},
};

export class ResponseModeService {
	/**
	 * Get all available response modes
	 */
	static getAllModes(): ResponseModeInfo[] {
		return Object.values(RESPONSE_MODE_CONFIG);
	}

	/**
	 * Get response mode information by mode
	 */
	static getModeInfo(mode: ResponseMode): ResponseModeInfo | undefined {
		return RESPONSE_MODE_CONFIG[mode];
	}

	/**
	 * Get response modes compatible with specific response type
	 */
	static getCompatibleModes(responseType: string): ResponseModeInfo[] {
		return ResponseModeService.getAllModes().filter((mode) =>
			mode.compatibility.responseTypes.includes(responseType)
		);
	}

	/**
	 * Get response modes compatible with specific client type
	 */
	static getModesForClientType(clientType: 'confidential' | 'public'): ResponseModeInfo[] {
		return ResponseModeService.getAllModes().filter((mode) =>
			mode.compatibility.clientTypes.includes(clientType)
		);
	}

	/**
	 * Get response modes compatible with specific platform
	 */
	static getModesForPlatform(platform: 'web' | 'mobile' | 'desktop' | 'iot'): ResponseModeInfo[] {
		return ResponseModeService.getAllModes().filter((mode) =>
			mode.compatibility.platforms.includes(platform)
		);
	}

	/**
	 * Build authorization URL with response mode parameter
	 */
	static buildAuthUrl(
		baseUrl: string,
		responseMode: ResponseMode,
		additionalParams: Record<string, string> = {}
	): string {
		const url = new URL(baseUrl);
		url.searchParams.set('response_mode', responseMode);

		// Add additional parameters
		Object.entries(additionalParams).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});

		return url.toString();
	}

	/**
	 * Get recommended response mode for use case
	 */
	static getRecommendedMode(useCase: {
		platform: 'web' | 'mobile' | 'desktop' | 'iot';
		clientType: 'confidential' | 'public';
		responseType: string;
		requiresRedirectless?: boolean;
		requiresSecurity?: boolean;
	}): ResponseMode {
		const { platform, clientType, responseType, requiresRedirectless, requiresSecurity } = useCase;

		// PingOne redirectless flow
		if (requiresRedirectless) {
			return 'pi.flow';
		}

		// High security requirements
		if (requiresSecurity && clientType === 'confidential') {
			return 'form_post';
		}

		// SPA or client-side applications
		if (platform === 'web' && clientType === 'public' && responseType.includes('token')) {
			return 'fragment';
		}

		// Traditional web applications
		if (platform === 'web' && clientType === 'confidential') {
			return 'query';
		}

		// Mobile applications
		if (platform === 'mobile') {
			return 'fragment';
		}

		// Default fallback
		return 'query';
	}

	/**
	 * Validate response mode compatibility
	 */
	static validateCompatibility(
		responseMode: ResponseMode,
		responseType: string,
		clientType: 'confidential' | 'public'
	): { valid: boolean; issues: string[] } {
		const modeInfo = ResponseModeService.getModeInfo(responseMode);
		if (!modeInfo) {
			return { valid: false, issues: ['Unknown response mode'] };
		}

		const issues: string[] = [];

		// Check response type compatibility
		if (!modeInfo.compatibility.responseTypes.includes(responseType)) {
			issues.push(
				`Response mode '${responseMode}' is not compatible with response type '${responseType}'`
			);
		}

		// Check client type compatibility
		if (!modeInfo.compatibility.clientTypes.includes(clientType)) {
			issues.push(
				`Response mode '${responseMode}' is not compatible with client type '${clientType}'`
			);
		}

		return {
			valid: issues.length === 0,
			issues,
		};
	}

	/**
	 * Get response mode display name with icon
	 */
	static getDisplayInfo(mode: ResponseMode): { name: string; icon: string; color: string } {
		const modeInfo = ResponseModeService.getModeInfo(mode);
		if (!modeInfo) {
			return { name: 'Unknown', icon: '❓', color: '#6b7280' };
		}

		const displayMap: Record<ResponseMode, { icon: string; color: string }> = {
			query: { icon: '🔗', color: '#3b82f6' },
			fragment: { icon: '🧩', color: '#8b5cf6' },
			form_post: { icon: '📝', color: '#10b981' },
			'pi.flow': { icon: '⚡', color: '#f59e0b' },
		};

		const display = displayMap[mode] || { icon: '❓', color: '#6b7280' };
		return {
			name: modeInfo.name,
			icon: display.icon,
			color: display.color,
		};
	}
}

export default ResponseModeService;
