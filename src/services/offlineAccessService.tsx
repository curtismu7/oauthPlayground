// src/services/offlineAccessService.tsx
// Shared helpers for managing PingOne offline_access scope behavior across flows.

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

export type OfflineAccessSettings = {
	refreshGrantEnabled: boolean;
	offlineAccessAllowed: boolean;
};

export type GuidanceVariant = 'info' | 'success' | 'warning' | 'danger';

const DEFAULT_SETTINGS: OfflineAccessSettings = {
	refreshGrantEnabled: true,
	offlineAccessAllowed: false,
};

const STORAGE_PREFIX = 'pingone-offline-access-settings';
const DEFAULT_STORAGE_KEY = `${STORAGE_PREFIX}:global`;

const isBrowser = typeof window !== 'undefined';

/**
 * Normalize arbitrary scope input into a lowercase array of scope strings.
 */
const normalizeScopeInput = (input: unknown): string[] => {
	if (Array.isArray(input)) {
		return input
			.map((value) => (typeof value === 'string' ? value.trim() : String(value).trim()))
			.filter(Boolean)
			.map((scope) => scope.toLowerCase());
	}

	if (typeof input === 'string') {
		return input
			.split(/\s+/)
			.map((scope) => scope.trim())
			.filter(Boolean)
			.map((scope) => scope.toLowerCase());
	}

	return [];
};

/**
 * Load persisted offline_access settings for a flow.
 */
const loadSettings = (storageKey: string = DEFAULT_STORAGE_KEY): OfflineAccessSettings => {
	if (!isBrowser) {
		return { ...DEFAULT_SETTINGS };
	}

	try {
		const rawValue = window.localStorage.getItem(storageKey);
		if (!rawValue) {
			return { ...DEFAULT_SETTINGS };
		}

		const parsed = JSON.parse(rawValue) as Partial<OfflineAccessSettings>;
		return {
			refreshGrantEnabled:
				typeof parsed.refreshGrantEnabled === 'boolean'
					? parsed.refreshGrantEnabled
					: DEFAULT_SETTINGS.refreshGrantEnabled,
			offlineAccessAllowed:
				typeof parsed.offlineAccessAllowed === 'boolean'
					? parsed.offlineAccessAllowed
					: DEFAULT_SETTINGS.offlineAccessAllowed,
		};
	} catch (error) {
		console.error('[OfflineAccessService] Failed to load settings', error);
		return { ...DEFAULT_SETTINGS };
	}
};

/**
 * Persist offline_access settings to localStorage.
 */
const saveSettings = (
	storageKey: string = DEFAULT_STORAGE_KEY,
	settings: OfflineAccessSettings
): void => {
	if (!isBrowser) {
		return;
	}

	try {
		window.localStorage.setItem(storageKey, JSON.stringify(settings));
	} catch (error) {
		console.error('[OfflineAccessService] Failed to persist settings', error);
	}
};

/**
 * Determine whether offline_access is present within a scope set.
 */
const hasOfflineAccess = (input: unknown): boolean => {
	return normalizeScopeInput(input).includes('offline_access');
};

export interface AuthorizationOfflineAccessEvaluation {
	includesOffline: boolean;
	refreshGrantEnabled: boolean;
	offlineAccessAllowed: boolean;
	autoIssued: boolean;
	requiresExplicitScope: boolean;
	missingRequiredScope: boolean;
	shouldRemoveScope: boolean;
	guidance: GuidanceMessage;
	addToastMessage: string;
	removeToastMessage: string;
}

export interface GuidanceMessage {
	title: string;
	description: string;
	variant: GuidanceVariant;
}

/**
 * Evaluate how PingOne will treat offline_access for Authorization Code style flows.
 */
const evaluateAuthorizationCode = (
	scopes: unknown,
	settings: OfflineAccessSettings
): AuthorizationOfflineAccessEvaluation => {
	const refreshGrantEnabled = settings.refreshGrantEnabled;
	const offlineAccessAllowed = settings.offlineAccessAllowed;
	const scopeArray = normalizeScopeInput(scopes);
	const includesOffline = scopeArray.includes('offline_access');

	let variant: GuidanceVariant = 'info';
	let title = 'Refresh Token Behavior';
	let description =
		'Let the playground know how your PingOne app is configured so we can coach you on requesting refresh tokens.';
	let addToastMessage =
		'offline_access detected. PingOne will issue refresh tokens when the Refresh Token grant is enabled.';
	let removeToastMessage =
		'Removed offline_access. Refresh tokens will continue to be issued according to your PingOne settings.';

	if (!refreshGrantEnabled) {
		variant = 'danger';
		description =
			'Refresh Token grant is disabled in your PingOne application. Enable it under OIDC Settings → Grant Types → Refresh Token to receive refresh tokens.';
		addToastMessage =
			'Refresh Token grant is disabled in PingOne. Enable it before requesting offline_access.';
		removeToastMessage =
			'Refresh Token grant is disabled. PingOne will not issue refresh tokens until it is enabled.';
	} else if (!offlineAccessAllowed) {
		variant = 'info';
		description = includesOffline
			? 'PingOne issues refresh tokens automatically because offline_access is not gated in Allowed Scopes. You can remove offline_access from the request to simplify consent.'
			: 'PingOne will return refresh tokens automatically when the Refresh Token grant is enabled and offline_access is not gated. No extra scope is required.';
		addToastMessage =
			'PingOne already issues refresh tokens automatically; offline_access is optional for this app.';
		removeToastMessage =
			'Refresh tokens will continue to be issued automatically without offline_access.';
	} else if (includesOffline) {
		variant = 'success';
		description =
			'Great! offline_access is included and PingOne is configured to require it. Expect a refresh token when you exchange the authorization code.';
		addToastMessage =
			'offline_access detected. PingOne will issue refresh tokens now that the scope is present.';
		removeToastMessage =
			'Removed offline_access. Add it back to continue receiving refresh tokens.';
	} else {
		variant = 'warning';
		description =
			'Because offline_access is listed under Allowed Scopes, PingOne withholds refresh tokens until you request it. Add offline_access to the scope list before continuing.';
		addToastMessage =
			'offline_access detected. PingOne will issue refresh tokens when the scope is present.';
		removeToastMessage =
			'PingOne still requires offline_access when it is listed in Allowed Scopes. Add it back to receive refresh tokens.';
	}

	const requiresExplicitScope = refreshGrantEnabled && offlineAccessAllowed;
	const missingRequiredScope = requiresExplicitScope && !includesOffline;
	const autoIssued = refreshGrantEnabled && !offlineAccessAllowed;
	const shouldRemoveScope = refreshGrantEnabled && !offlineAccessAllowed && includesOffline;

	return {
		includesOffline,
		refreshGrantEnabled,
		offlineAccessAllowed,
		autoIssued,
		requiresExplicitScope,
		missingRequiredScope,
		shouldRemoveScope,
		guidance: {
			title,
			description,
			variant,
		},
		addToastMessage,
		removeToastMessage,
	};
};

/**
 * Produce guidance text for implicit flows where refresh tokens are never issued.
 */
const getImplicitGuidance = (settings: OfflineAccessSettings): GuidanceMessage => {
	if (!settings.refreshGrantEnabled) {
		return {
			title: 'Implicit Flow & Refresh Tokens',
			description:
				'Implicit Flow returns tokens directly in the browser and never issues refresh tokens. Enable the Refresh Token grant and switch to Authorization Code flow if you need offline sessions.',
			variant: 'warning',
		};
	}

	if (settings.offlineAccessAllowed) {
		return {
			title: 'offline_access Requires Authorization Code',
			description:
				'PingOne requires the offline_access scope when it is listed under Allowed Scopes, but Implicit Flow never returns refresh tokens. Use the Authorization Code + PKCE flow if you need offline sessions.',
			variant: 'warning',
		};
	}

	return {
		title: 'Implicit Flow Reminder',
		description:
			'Even though PingOne can issue refresh tokens without offline_access, Implicit Flow responses do not include them. Use Authorization Code flow for long-lived sessions or background processing.',
		variant: 'info',
	};
};

export interface SanitizeImplicitResult {
	sanitizedScopes: string[];
	removed: boolean;
}

/**
 * Remove offline_access from scopes for flows that cannot use refresh tokens.
 */
const sanitizeImplicitScopes = (input: unknown): SanitizeImplicitResult => {
	const scopeArray = normalizeScopeInput(input);
	const sanitizedScopes = scopeArray.filter((scope) => scope !== 'offline_access');
	return {
		sanitizedScopes,
		removed: sanitizedScopes.length !== scopeArray.length,
	};
};

/**
 * React hook to manage offline_access settings with persistence.
 */
export const useOfflineAccessSettings = (
	storageKey: string = DEFAULT_STORAGE_KEY
): readonly [OfflineAccessSettings, (updates: Partial<OfflineAccessSettings>) => void] => {
	const [settings, setSettings] = useState<OfflineAccessSettings>(() => loadSettings(storageKey));

	const updateSettings = useCallback(
		(updates: Partial<OfflineAccessSettings>) => {
			setSettings((previous) => {
				const next = {
					...previous,
					...updates,
				};
				saveSettings(storageKey, next);
				return next;
			});
		},
		[storageKey]
	);

	return [settings, updateSettings] as const;
};

const PanelContainer = styled.div`
	margin: 1.5rem 0;
	padding: 1.25rem 1.5rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
`;

const PanelTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	color: #0f172a;
	font-size: 1rem;
	font-weight: 600;
`;

const PanelSubtitle = styled.p`
	margin: 0 0 1rem 0;
	color: #475569;
	font-size: 0.85rem;
	line-height: 1.6;
`;

const CheckboxRow = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
	font-size: 0.875rem;
	color: #1f2937;
	cursor: pointer;
`;

const CheckboxInput = styled.input`
	margin-top: 0.25rem;
`;

const CheckboxDescription = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
`;

const CheckboxHelper = styled.span`
	font-size: 0.75rem;
	color: #64748b;
	line-height: 1.45;
`;

export interface OfflineAccessSettingsPanelProps {
	settings: OfflineAccessSettings;
	onSettingsChange: (updates: Partial<OfflineAccessSettings>) => void;
	title?: string;
	subtitle?: string;
}

/**
 * Present a shared settings panel so flows can capture PingOne refresh token configuration.
 */
export const OfflineAccessSettingsPanel: React.FC<OfflineAccessSettingsPanelProps> = ({
	settings,
	onSettingsChange,
	title = 'PingOne Refresh Token Setup',
	subtitle = 'Tell the playground how your PingOne application is configured so we can coach you on offline_access usage.',
}) => {
	return (
		<PanelContainer>
			<PanelTitle>{title}</PanelTitle>
			<PanelSubtitle>{subtitle}</PanelSubtitle>

			<CheckboxRow htmlFor="offline-access-refresh-grant">
				<CheckboxInput
					id="offline-access-refresh-grant"
					type="checkbox"
					checked={settings.refreshGrantEnabled}
					onChange={() =>
						onSettingsChange({ refreshGrantEnabled: !settings.refreshGrantEnabled })
					}
				/>
				<CheckboxDescription>
					<strong>Refresh Token grant is enabled on this application</strong>
					<CheckboxHelper>
						PingOne Console → Applications → OIDC Settings → check <em>Refresh Token</em>. If this
						grant is disabled, PingOne will never issue refresh tokens.
					</CheckboxHelper>
				</CheckboxDescription>
			</CheckboxRow>

			<CheckboxRow htmlFor="offline-access-allowed-scope">
				<CheckboxInput
					id="offline-access-allowed-scope"
					type="checkbox"
					checked={settings.offlineAccessAllowed}
					onChange={() =>
						onSettingsChange({ offlineAccessAllowed: !settings.offlineAccessAllowed })
					}
				/>
				<CheckboxDescription>
					<strong>offline_access is listed under Allowed Scopes</strong>
					<CheckboxHelper>
						PingOne Console → Applications → Resources tab → Assign the <code>offline_access</code>{' '}
						scope. When it is assigned, PingOne requires you to request it during authorization.
					</CheckboxHelper>
				</CheckboxDescription>
			</CheckboxRow>
		</PanelContainer>
	);
};

export const OfflineAccessService = {
	normalizeScopeInput,
	hasOfflineAccess,
	loadSettings,
	saveSettings,
	evaluateAuthorizationCode,
	getImplicitGuidance,
	sanitizeImplicitScopes,
};


