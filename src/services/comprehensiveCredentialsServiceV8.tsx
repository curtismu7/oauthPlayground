// src/services/comprehensiveCredentialsServiceV8.tsx
//
// Simplified Comprehensive Credentials Service V8
//
// DEBUGGING NOTES:
// ================
// 1. PURPOSE:
//    - Compact UI for credential entry in V8 flows
//    - Sections: OIDC Discovery, Basics, Advanced, Config Checker
//    - Auto-saves credentials to unifiedTokenStorageService (debounced 2s)
//    - Loads saved credentials on mount
//
// 2. STORAGE ARCHITECTURE:
//    - unifiedTokenStorageService handles persistence:
//      * Discovery: IndexedDB 'oauth_credentials' type
//      * Credentials: IndexedDB 'oauth_credentials' type
//      * Advanced: IndexedDB 'oauth_credentials' type
//      * Automatic SQLite backup for redundancy
//
// 3. DATA FLOW:
//    - User input -> updateField() -> updates local state
//    - onCredentialsChange() -> parent component (e.g., controller.setCredentials())
//    - Auto-save useEffect -> unifiedTokenStorageService.saveV8Credentials()
//    - On mount: unifiedTokenStorageService.loadV8FlowData() -> merge into state
//
// 4. CREDENTIAL RESOLUTION:
//    - resolved = useMemo(() => merge(credentials, props), [credentials, props])
//    - Priority: props (passed from parent) > credentials (from state)
//    - Used throughout UI to display current values
//
// 5. AUTHENTICATION METHODS:
//    - Filtered by flow type via getFlowAuthMethods()
//    - Implicit flow: Only 'none' (public client)
//    - Authorization code: All methods except 'none'
//    - Auto-reset if current method not allowed for flow type
//
// 6. OIDC DISCOVERY:
//    - ComprehensiveDiscoveryInput component handles discovery
//    - Results populate: issuerUrl, authorizationEndpoint, tokenEndpoint, jwksUrl
//    - Also extracts environmentId from issuer URL
//    - Can be saved separately via "Save Discovery" button
//
// 7. CONFIG CHECKER:
//    - Compares form data against live PingOne applications
//    - Requires worker token (PingOne Admin API)
//    - Can create/update PingOne apps
//    - Can import PingOne config into form
//
// 8. COMMON DEBUGGING POINTS:
//    - Check console for [ComprehensiveCredentialsServiceV8] logs
//    - Verify localStorage keys: 'v8:{flowType}:*'
//    - Auto-save logs: "Auto-saving credentials for {flowType}..."
//    - Load logs: "Loading saved credentials for {flowType}..."
//    - Field updates trigger onCredentialsChange callback
//
// Goals:
// - Greatly reduce inline UI footprint.
// - Single compact section with popups / slide-outs / collapsibles.
// - Keep advanced features (OIDC discovery, JWKS, client auth, etc.).
// - Preserve education content but move it into on-demand surfaces.
// - Do NOT modify the existing V7 service – this is a new, V8-style version.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiInfo,
	FiKey,
	FiSave,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';

// Reuse existing components where possible.
import ClientAuthMethodSelector from '../components/ClientAuthMethodSelector';
import ComprehensiveDiscoveryInput from '../components/ComprehensiveDiscoveryInput';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { DraggableModal } from '../components/DraggableModal';
import { InfoPopover } from '../components/InfoPopover';
import { JWTConfigV8 } from '../components/JWTConfigV8';
import JwksKeySourceSelector from '../components/JwksKeySourceSelector';
import { pingOneAppCreationService } from '../services/pingOneAppCreationService';
import type { ClientAuthMethod } from '../utils/clientAuthentication';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { DiscoveryResult } from './comprehensiveDiscoveryService';
import type {
	V8AdvancedData,
	V8CredentialsData,
	V8DiscoveryData,
	V8FlowData,
} from './unifiedTokenStorageService';
import { unifiedTokenStorage } from './unifiedTokenStorageService';

// Flow-specific authentication method configuration
const getFlowAuthMethods = (flowType?: string): ClientAuthMethod[] => {
	if (!flowType) {
		// Default: allow all methods except none (for safety)
		return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
	}

	const normalizedFlowType = flowType.toLowerCase().replace(/[-_]/g, '-');

	// Implicit flow - public client only (no secret)
	if (normalizedFlowType.includes('implicit')) {
		return ['none'];
	}

	// Client Credentials flow - must have authentication (no 'none')
	if (
		normalizedFlowType.includes('client-credentials') ||
		normalizedFlowType.includes('client_credentials') ||
		normalizedFlowType.includes('worker-token') ||
		normalizedFlowType.includes('worker_token')
	) {
		return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
	}

	// CIBA flow - requires client authentication (RFC 9436), cannot use 'none'
	if (normalizedFlowType.includes('ciba')) {
		return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
	}

	// Resource Owner Password Credentials (ROPC) - requires authentication
	if (
		normalizedFlowType.includes('ropc') ||
		normalizedFlowType.includes('resource-owner-password') ||
		normalizedFlowType.includes('password')
	) {
		return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
	}

	// Device Authorization - usually public (none) but can be confidential
	if (
		normalizedFlowType.includes('device') ||
		normalizedFlowType.includes('device-authorization')
	) {
		return ['none', 'client_secret_basic', 'client_secret_post'];
	}

	// Authorization Code flow - supports both public (with PKCE) and confidential clients
	if (
		normalizedFlowType.includes('authorization-code') ||
		normalizedFlowType.includes('authorization_code') ||
		normalizedFlowType.includes('oidc-authorization-code') ||
		normalizedFlowType.includes('oauth-authorization-code')
	) {
		// Allow all methods including 'none' for public clients with PKCE
		return [
			'none',
			'client_secret_basic',
			'client_secret_post',
			'client_secret_jwt',
			'private_key_jwt',
		];
	}

	// Hybrid flow - typically confidential but can be public with PKCE
	if (normalizedFlowType.includes('hybrid')) {
		return [
			'none',
			'client_secret_basic',
			'client_secret_post',
			'client_secret_jwt',
			'private_key_jwt',
		];
	}

	// Default: allow all methods except none (safer default)
	return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
};

// ---------- Styled layout primitives ----------

const Container = styled.div`
  margin-top: 1rem;
`;

const SummaryBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  color: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.3);
  gap: 0.75rem;
`;

const SummaryMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const SummaryIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  padding: 0.4rem;
`;

const SummaryText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const SummaryTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const SummaryLine = styled.div`
  font-size: 0.78rem;
  color: #475569;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  min-width: 0;
  flex: 1;

  span {
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
  }
`;

const SummaryBadge = styled.span<{ $variant?: 'ok' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  border: 1px solid
    ${({ $variant }) => ($variant === 'ok' ? 'rgba(74, 222, 128, 0.5)' : 'rgba(251, 191, 36, 0.5)')};
  background: ${({ $variant }) => ($variant === 'ok' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)')};
  color: ${({ $variant }) => ($variant === 'ok' ? '#16a34a' : '#d97706')};

  svg {
    font-size: 0.8rem;
  }
`;

const SummaryActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const SmallButton = styled.button`
  border-radius: 0.5rem;
  padding: 0.625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #2563eb;
  background: #3b82f6;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2563eb;
    border-color: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Drawer = styled.div<{ $open: boolean }>`
  margin-top: ${({ $open }) => ($open ? '0.75rem' : '0')};
  max-height: ${({ $open }) => ($open ? 'none' : '0px')};
  overflow: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition: ${({ $open }) => ($open ? 'none' : 'max-height 0.25s ease, margin-top 0.25s ease')};
  border-radius: 0.75rem;
  border: ${({ $open }) => ($open ? '1px solid rgba(148, 163, 184, 0.3)' : 'none')};
  background: #ffffff;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
`;

const DrawerInner = styled.div`
  padding: 1.25rem 1.25rem 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
`;

const SectionHeader = styled.div`
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.75rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1e293b;
  border-radius: 0.375rem;
`;

const SectionHeaderToggle = styled.button`
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #1e293b;
  transition: background-color 0.2s ease;
  border-radius: 0.375rem;
  text-align: left;

  &:hover {
    background-color: #f8fafc;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
`;

const SectionBody = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => ($open ? '5000px' : '0px')};
  overflow: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition: max-height 0.3s ease;
`;

const SectionBodyInner = styled.div`
  padding: 0.75rem 0.5rem 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.2fr);
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const FieldLabel = styled.label`
  font-size: 0.75rem;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const FieldInput = styled.input`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const FieldSelect = styled.select`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

// Simple inline environment/region selector
const EnvironmentRegionContainer = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const EnvironmentInput = styled(FieldInput)`
  flex: 1;
`;

const RegionSelect = styled(FieldSelect)`
  min-width: 120px;
`;

// Tiny inline educational tooltip/popover - made more obvious
const InfoDot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #3b82f6;
  transition: color 0.2s ease;
  
  &:hover {
    color: #2563eb;
  }
`;

// Very lightweight inline "tooltip"; you can swap this out for your real InfoPopover
const TinyTooltip = styled.div`
  position: absolute;
  z-index: 40;
  min-width: 200px;
  max-width: 280px;
  padding: 0.5rem 0.65rem;
  font-size: 0.7rem;
  background: #ffffff;
  color: #1e293b;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
`;

// ---------- Main component ----------

// DEBUG: Main Component - Comprehensive Credentials Service V8
// =============================================================
// Props:
//   - credentials: Primary credential object (from parent/controller)
//   - onCredentialsChange: Callback when any field changes (updates parent state)
//   - onSaveCredentials: Manual save handler (also saves to FlowCredentialService)
//   - Legacy props: Individual field props for backward compatibility
//   - rest.flowType: Required - determines allowed auth methods, storage keys
const ComprehensiveCredentialsServiceV8: React.FC<ComprehensiveCredentialsProps> = ({
	credentials,
	onCredentialsChange,
	onSaveCredentials,
	// discovery-related
	onDiscoveryComplete,
	initialDiscoveryInput,
	discoveryPlaceholder,
	showProviderInfo,
	// legacy fallback props (env/client/redirect/etc.)
	environmentId,
	region,
	issuerUrl,
	authorizationEndpoint,
	tokenEndpoint,
	jwksUrl,
	clientId,
	clientSecret,
	redirectUri,
	scopes,
	defaultScopes,
	loginHint,
	postLogoutRedirectUri,
	clientAuthMethod,
	// advanced key/JWKS
	privateKey,
	onPrivateKeyChange,
	...rest
}) => {
	// DEBUG: Get flow type - used for storage keys, auth method filtering
	// Storage key format: 'v8:{flowType}:{section}'
	// Examples: 'v8:oauth-authorization-code-v8:credentials'
	const flowTypeFromProps = (rest as any).flowType || '';

	// DEBUG: Load Saved Credentials on Mount
	// ======================================
	// Loads from unifiedTokenStorageService (IndexedDB + SQLite backup)
	// Merges discovery, credentials, and advanced sections
	// Only updates if meaningful data found (has environmentId or clientId)
	// Logs: "[ComprehensiveCredentialsServiceV8] Loading saved credentials..."
	useEffect(() => {
		const loadSavedCredentials = async () => {
			if (!flowTypeFromProps) {
				console.log(
					'[ComprehensiveCredentialsServiceV8] No flow type specified, skipping credential load'
				);
				return;
			}

			try {
				console.log(
					`[ComprehensiveCredentialsServiceV8] Loading saved credentials for ${flowTypeFromProps}...`
				);
				const flowData = await unifiedTokenStorage.loadV8FlowData(flowTypeFromProps);

				if (flowData && (flowData.discovery || flowData.credentials || flowData.advanced)) {
					console.log(
						`[ComprehensiveCredentialsServiceV8] Found saved data for ${flowTypeFromProps}`,
						{
							hasDiscovery: !!flowData.discovery,
							hasCredentials: !!flowData.credentials,
							hasAdvanced: !!flowData.advanced,
						}
					);

					// Merge saved data into current credentials
					const merged: any = { ...credentials };

					// Load discovery data
					if (flowData.discovery) {
						if (flowData.discovery.issuerUrl) merged.issuerUrl = flowData.discovery.issuerUrl;
						if (flowData.discovery.authorizationEndpoint)
							merged.authorizationEndpoint = flowData.discovery.authorizationEndpoint;
						if (flowData.discovery.tokenEndpoint)
							merged.tokenEndpoint = flowData.discovery.tokenEndpoint;
						if (flowData.discovery.jwksUrl) merged.jwksUrl = flowData.discovery.jwksUrl;
						if (flowData.discovery.environmentId)
							merged.environmentId = flowData.discovery.environmentId;
					}

					// Load credentials data
					if (flowData.credentials) {
						if (flowData.credentials.environmentId)
							merged.environmentId = flowData.credentials.environmentId;
						if (flowData.credentials.region) merged.region = flowData.credentials.region;
						if (flowData.credentials.clientId) merged.clientId = flowData.credentials.clientId;
						if (flowData.credentials.clientSecret)
							merged.clientSecret = flowData.credentials.clientSecret;
						if (flowData.credentials.redirectUri)
							merged.redirectUri = flowData.credentials.redirectUri;
						if (flowData.credentials.postLogoutRedirectUri)
							merged.postLogoutRedirectUri = flowData.credentials.postLogoutRedirectUri;
						if (flowData.credentials.scopes) merged.scopes = flowData.credentials.scopes;
						if (flowData.credentials.loginHint) merged.loginHint = flowData.credentials.loginHint;
						if (flowData.credentials.clientAuthMethod)
							merged.clientAuthMethod = flowData.credentials.clientAuthMethod;
					}

					// Load advanced data
					if (flowData.advanced) {
						if (flowData.advanced.clientAuthMethod)
							merged.clientAuthMethod = flowData.advanced.clientAuthMethod;
						if (flowData.advanced.privateKey) merged.privateKey = flowData.advanced.privateKey;
						if (flowData.advanced.jwksUrl) merged.jwksUrl = flowData.advanced.jwksUrl;
					}

					// Only update if we have meaningful data
					if (Object.keys(merged).length > 0 && (merged.environmentId || merged.clientId)) {
						console.log(
							`[ComprehensiveCredentialsServiceV8] Applying loaded credentials for ${flowTypeFromProps}`
						);
						onCredentialsChange?.(merged as any);
					} else {
						console.log(
							`[ComprehensiveCredentialsServiceV8] Loaded data but no meaningful credentials found`
						);
					}
				} else {
					console.log(
						`[ComprehensiveCredentialsServiceV8] No saved data found for ${flowTypeFromProps}`
					);
				}
			} catch (error) {
				console.error(
					`[ComprehensiveCredentialsServiceV8] Failed to load credentials for ${flowTypeFromProps}:`,
					error
				);
			}
		};

		loadSavedCredentials();
		// Only run on mount and when flowType changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flowTypeFromProps, credentials, onCredentialsChange]);

	const resolved = useMemo(() => {
		// Prefer unified credentials object, fall back to legacy props.
		const base = credentials ?? {};
		return {
			environmentId: base.environmentId ?? environmentId ?? '',
			region: base.region ?? region ?? 'us',
			issuerUrl: base.issuerUrl ?? issuerUrl ?? '',
			authorizationEndpoint: base.authorizationEndpoint ?? authorizationEndpoint ?? '',
			tokenEndpoint: base.tokenEndpoint ?? tokenEndpoint ?? '',
			jwksUrl: base.jwksUrl ?? jwksUrl ?? '',
			clientId: base.clientId ?? clientId ?? '',
			clientSecret: base.clientSecret ?? clientSecret ?? '',
			redirectUri: base.redirectUri ?? redirectUri ?? '',
			scopes: base.scopes ?? scopes ?? defaultScopes ?? '',
			loginHint: base.loginHint ?? loginHint ?? '',
			postLogoutRedirectUri: base.postLogoutRedirectUri ?? postLogoutRedirectUri ?? '',
			clientAuthMethod: base.clientAuthMethod ?? clientAuthMethod ?? 'none',
			privateKey: privateKey ?? (base as any).privateKey ?? '',
		};
	}, [
		credentials,
		environmentId,
		region,
		issuerUrl,
		authorizationEndpoint,
		tokenEndpoint,
		jwksUrl,
		clientId,
		clientSecret,
		redirectUri,
		scopes,
		defaultScopes,
		loginHint,
		postLogoutRedirectUri,
		clientAuthMethod,
		privateKey,
	]);

	const updateField = useCallback(
		(field: string, value: unknown) => {
			const next = { ...(credentials ?? {}), [field]: value };
			onCredentialsChange?.(next as any);
		},
		[credentials, onCredentialsChange]
	);

	// DEBUG: Auto-Save Credentials on Change (Debounced)
	// ==================================================
	// Triggers when credentials or flowType changes
	// Debounce: 2 seconds (prevents excessive saves during typing)
	// Only saves if meaningful data exists (has environmentId or clientId)
	// Storage: IndexedDB + SQLite backup via unifiedTokenStorageService.saveV8Credentials()
	// Logs: "[ComprehensiveCredentialsServiceV8] Auto-saving credentials..."
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (!flowTypeFromProps || !credentials) return;

		// Clear existing timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// DEBUG: Only auto-save if we have meaningful credentials
		// Prevents saving empty/default state
		const hasMeaningfulCredentials =
			(credentials.environmentId || credentials.clientId || credentials.issuerUrl) &&
			(credentials.environmentId || credentials.clientId);

		if (!hasMeaningfulCredentials) {
			return;
		}

		// Debounce auto-save by 2 seconds
		saveTimeoutRef.current = setTimeout(async () => {
			try {
				console.log(
					`[ComprehensiveCredentialsServiceV8] Auto-saving credentials for ${flowTypeFromProps}...`
				);

				// Save credentials section - only include defined values
				const credentialsData: Record<string, unknown> = {};
				if (credentials.environmentId) credentialsData.environmentId = credentials.environmentId;
				if (credentials.region) credentialsData.region = credentials.region;
				if (credentials.clientId) credentialsData.clientId = credentials.clientId;
				if (credentials.clientSecret) credentialsData.clientSecret = credentials.clientSecret;
				if (credentials.redirectUri) credentialsData.redirectUri = credentials.redirectUri;
				if (credentials.postLogoutRedirectUri)
					credentialsData.postLogoutRedirectUri = credentials.postLogoutRedirectUri;
				if (credentials.scopes) credentialsData.scopes = credentials.scopes;
				if (credentials.loginHint) credentialsData.loginHint = credentials.loginHint;
				if (credentials.clientAuthMethod)
					credentialsData.clientAuthMethod = credentials.clientAuthMethod;

				await unifiedTokenStorage.saveV8Credentials(flowTypeFromProps, credentialsData as any);
				console.log(
					`[ComprehensiveCredentialsServiceV8] Auto-saved credentials for ${flowTypeFromProps}`
				);

				// Also trigger the onSaveCredentials callback to save to FlowCredentialService for callback compatibility
				if (onSaveCredentials) {
					await onSaveCredentials();
					console.log(
						`[ComprehensiveCredentialsServiceV8] Also saved to FlowCredentialService via onSaveCredentials`
					);
				}
			} catch (error) {
				console.error(
					`[ComprehensiveCredentialsServiceV8] Failed to auto-save credentials:`,
					error
				);
			}
		}, 2000); // 2 second debounce

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [credentials, flowTypeFromProps, onSaveCredentials]);

	const allowedAuthMethods = useMemo(
		() => getFlowAuthMethods(flowTypeFromProps),
		[flowTypeFromProps]
	);

	// If current auth method is not allowed, reset to first allowed method
	useEffect(() => {
		if (
			allowedAuthMethods.length > 0 &&
			!allowedAuthMethods.includes(resolved.clientAuthMethod as ClientAuthMethod)
		) {
			console.log(
				`[ComprehensiveCredentialsServiceV8] Current auth method "${resolved.clientAuthMethod}" not allowed for flow "${flowTypeFromProps}". Resetting to "${allowedAuthMethods[0]}".`
			);
			updateField('clientAuthMethod', allowedAuthMethods[0]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allowedAuthMethods, resolved.clientAuthMethod, flowTypeFromProps, updateField]);
	// Drawer open/close
	const [openDrawer, setOpenDrawer] = useState(false);

	// Collapsibles - Discovery should be first and open by default
	const [openDiscovery, setOpenDiscovery] = useState(true);
	const [openBasics, setOpenBasics] = useState(false);
	const [openAdvanced, setOpenAdvanced] = useState(false);
	const [openConfigChecker, setOpenConfigChecker] = useState(false);

	// JWT Configuration modals
	const [showPrivateKeyJwtModal, setShowPrivateKeyJwtModal] = useState(false);
	const [showClientSecretJwtModal, setShowClientSecretJwtModal] = useState(false);
	const [showPrivateKey, setShowPrivateKey] = useState(false);

	// Tiny inline tooltip for education snippets
	const [tooltip, setTooltip] = useState<null | {
		text: string;
		x: number;
		y: number;
	}>(null);

	// Use flowType from props (already defined above as flowTypeFromProps)
	const flowType = flowTypeFromProps;

	// Save handlers for each section
	const handleSaveDiscovery = async () => {
		if (!flowType) {
			v4ToastManager.showWarning('Flow type not specified. Cannot save discovery data.');
			return;
		}

		try {
			const discoveryData = {
				issuerUrl: resolved.issuerUrl,
				authorizationEndpoint: resolved.authorizationEndpoint,
				tokenEndpoint: resolved.tokenEndpoint,
				jwksUrl: resolved.jwksUrl,
				environmentId: resolved.environmentId,
			};

			const success = await unifiedTokenStorage.saveV8Discovery(flowType, discoveryData);
			if (success) {
				v4ToastManager.showSuccess('OIDC Discovery data saved successfully!');
			} else {
				v4ToastManager.showError('Failed to save OIDC Discovery data.');
			}
		} catch (err: any) {
			v4ToastManager.showError(`Failed to save discovery: ${err?.message || 'Unknown error'}`);
		}
	};

	const handleSaveCredentials = async () => {
		if (!flowType) {
			v4ToastManager.showWarning('Flow type not specified. Cannot save credentials.');
			return;
		}

		try {
			const credentialsData = {
				environmentId: resolved.environmentId,
				region: resolved.region,
				clientId: resolved.clientId,
				clientSecret: resolved.clientSecret,
				redirectUri: resolved.redirectUri,
				postLogoutRedirectUri: resolved.postLogoutRedirectUri,
				scopes: resolved.scopes,
				loginHint: resolved.loginHint,
			};

			const success = await unifiedTokenStorage.saveV8Credentials(flowType, credentialsData);
			if (success) {
				v4ToastManager.showSuccess('Credentials saved successfully!');
			} else {
				v4ToastManager.showError('Failed to save credentials.');
			}
		} catch (err: any) {
			v4ToastManager.showError(`Failed to save credentials: ${err?.message || 'Unknown error'}`);
		}
	};

	const handleSaveAdvanced = async () => {
		if (!flowType) {
			v4ToastManager.showWarning('Flow type not specified. Cannot save advanced settings.');
			return;
		}

		try {
			const advancedData = {
				clientAuthMethod: resolved.clientAuthMethod,
				privateKey: resolved.privateKey,
				jwksUrl: resolved.jwksUrl,
			};

			const success = await unifiedTokenStorage.saveV8Advanced(flowType, advancedData);
			if (success) {
				v4ToastManager.showSuccess('Advanced settings saved successfully!');
			} else {
				v4ToastManager.showError('Failed to save advanced settings.');
			}
		} catch (err: any) {
			v4ToastManager.showError(`Failed to save advanced: ${err?.message || 'Unknown error'}`);
		}
	};

	const handleSaveAll = async () => {
		if (!flowType) {
			v4ToastManager.showWarning('Flow type not specified. Cannot save configuration.');
			return;
		}

		try {
			const allData: V8FlowData = {
				flowType,
				discovery: {
					issuerUrl: resolved.issuerUrl,
					authorizationEndpoint: resolved.authorizationEndpoint,
					tokenEndpoint: resolved.tokenEndpoint,
					jwksUrl: resolved.jwksUrl,
					environmentId: resolved.environmentId,
				},
				credentials: {
					environmentId: resolved.environmentId,
					region: resolved.region,
					clientId: resolved.clientId,
					clientSecret: resolved.clientSecret,
					redirectUri: resolved.redirectUri,
					postLogoutRedirectUri: resolved.postLogoutRedirectUri,
					scopes: resolved.scopes,
					loginHint: resolved.loginHint,
				},
				advanced: {
					clientAuthMethod: resolved.clientAuthMethod,
					privateKey: resolved.privateKey,
					jwksUrl: resolved.jwksUrl,
				},
			};

			const success = await unifiedTokenStorage.saveV8FlowData(flowType, allData);
			if (success) {
				v4ToastManager.showSuccess('All configuration saved successfully!');
			} else {
				v4ToastManager.showError('Failed to save all configuration.');
			}
		} catch (err: any) {
			v4ToastManager.showError(`Failed to save all: ${err?.message || 'Unknown error'}`);
		}
	};

	const handleSave = async () => {
		// Legacy save handler - calls save all
		await handleSaveAll();
		// Also call the original onSaveCredentials if provided
		try {
			await onSaveCredentials?.();
		} catch (_err) {
			// Ignore errors from legacy handler
		}
	};

	const hasMinimumConfig =
		!!resolved.environmentId && !!resolved.clientId && !!resolved.redirectUri;

	// ---------- summary line text ----------

	const summaryLine = useMemo(() => {
		const bits: string[] = [];
		if (resolved.environmentId) bits.push(`Env: ${resolved.environmentId}`);
		if (resolved.clientId) bits.push(`Client: ${resolved.clientId}`);
		if (resolved.redirectUri) bits.push(`Redirect: ${resolved.redirectUri}`);
		if (!bits.length) return { text: 'No credentials configured yet.', isPlaceholder: true };
		return { text: bits.join(' • '), isPlaceholder: false };
	}, [resolved]);

	// ---------- tiny tooltip handling ----------

	const openTooltip = (event: React.MouseEvent, text: string) => {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		setTooltip({
			text,
			x: rect.left + window.scrollX,
			y: rect.bottom + window.scrollY + 6,
		});
	};

	const closeTooltip = () => setTooltip(null);

	// ---------- render ----------

	return (
		<Container>
			<SummaryBar>
				<SummaryMain>
					<SummaryIcon>
						<FiSettings />
					</SummaryIcon>
					<SummaryText>
						<SummaryTitle>Credentials & Discovery</SummaryTitle>
						<SummaryLine>
							{summaryLine.isPlaceholder ? (
								<span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{summaryLine.text}</span>
							) : (
								<span>
									{summaryLine.text.split(' • ').map((part, index, array) => {
										const colonIndex = part.indexOf(': ');
										if (colonIndex === -1) return <span key={index}>{part}</span>;
										const label = part.substring(0, colonIndex + 2);
										const value = part.substring(colonIndex + 2);
										return (
											<span key={index}>
												<span style={{ color: '#475569' }}>{label}</span>
												<span style={{ color: '#dc2626', fontWeight: 'bold' }}>{value}</span>
												{index < array.length - 1 && <span style={{ color: '#475569' }}> • </span>}
											</span>
										);
									})}
								</span>
							)}
							{hasMinimumConfig ? (
								<SummaryBadge $variant="ok">
									<FiCheckCircle />
									Ready
								</SummaryBadge>
							) : (
								<SummaryBadge $variant="warn">
									<FiAlertCircle />
									Setup needed
								</SummaryBadge>
							)}
						</SummaryLine>
					</SummaryText>
				</SummaryMain>
				<SummaryActions>
					<SmallButton
						type="button"
						onClick={() => setOpenDrawer((o) => !o)}
						aria-expanded={openDrawer}
					>
						<FiKey />
						{openDrawer ? 'Hide details' : 'Configure'}
					</SmallButton>
				</SummaryActions>
			</SummaryBar>

			<Drawer $open={openDrawer}>
				{openDrawer && (
					<DrawerInner>
						{/* OIDC DISCOVERY SECTION - FIRST */}
						<section
							style={{
								borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
								paddingBottom: '0.5rem',
							}}
						>
							<SectionHeader>
								<SectionHeaderToggle
									type="button"
									onClick={() => setOpenDiscovery((o) => !o)}
									aria-expanded={openDiscovery}
								>
									<SectionTitle>
										{openDiscovery ? <FiChevronDown /> : <FiChevronRight />}
										OIDC Discovery & Endpoints
									</SectionTitle>
								</SectionHeaderToggle>
								{openDiscovery && (
									<SmallButton
										type="button"
										onClick={handleSaveDiscovery}
										style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', flexShrink: 0 }}
									>
										<FiSave size={14} />
										Save Discovery
									</SmallButton>
								)}
							</SectionHeader>
							<SectionBody $open={openDiscovery}>
								<SectionBodyInner>
									<ComprehensiveDiscoveryInput
										onDiscoveryComplete={(result: DiscoveryResult) => {
											onDiscoveryComplete?.(result);
											// Always populate fields from discovery results
											if (result.environmentId) {
												updateField('environmentId', result.environmentId);
											}
											if (result.issuer) {
												updateField('issuerUrl', result.issuer);
											}
											if (result.authorizationEndpoint) {
												updateField('authorizationEndpoint', result.authorizationEndpoint);
											}
											if (result.tokenEndpoint) {
												updateField('tokenEndpoint', result.tokenEndpoint);
											}
											if (result.jwksUri) {
												updateField('jwksUrl', result.jwksUri);
											}
										}}
										initialInput={initialDiscoveryInput}
										placeholder={discoveryPlaceholder}
										showProviderInfo={showProviderInfo}
									/>

									<FieldRow>
										<Field>
											<FieldLabel>Issuer URL</FieldLabel>
											<FieldInput
												value={resolved.issuerUrl}
												onChange={(e) => updateField('issuerUrl', e.target.value)}
												placeholder="https://auth.pingone.com/{envId}"
												style={{
													color:
														resolved.issuerUrl &&
														!resolved.issuerUrl.includes('{envId}') &&
														resolved.issuerUrl !== 'https://auth.pingone.com/{envId}'
															? '#dc2626' // Red for filled values
															: '#94a3b8', // Grey for placeholders/examples
													fontFamily:
														'SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
													fontWeight:
														resolved.issuerUrl &&
														!resolved.issuerUrl.includes('{envId}') &&
														resolved.issuerUrl !== 'https://auth.pingone.com/{envId}'
															? 'bold' // Bold for filled values
															: 'normal',
												}}
											/>
										</Field>
										<Field>
											<FieldLabel>Authorization endpoint</FieldLabel>
											<FieldInput
												value={resolved.authorizationEndpoint}
												onChange={(e) => updateField('authorizationEndpoint', e.target.value)}
												placeholder="https://auth.pingone.com/{envId}/as/authorize"
												style={{
													color:
														resolved.authorizationEndpoint &&
														!resolved.authorizationEndpoint.includes('{envId}') &&
														resolved.authorizationEndpoint !==
															'https://auth.pingone.com/{envId}/as/authorize'
															? '#dc2626' // Red for filled values
															: '#94a3b8', // Grey for placeholders/examples
													fontFamily:
														'SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
													fontWeight:
														resolved.authorizationEndpoint &&
														!resolved.authorizationEndpoint.includes('{envId}') &&
														resolved.authorizationEndpoint !==
															'https://auth.pingone.com/{envId}/as/authorize'
															? 'bold' // Bold for filled values
															: 'normal',
												}}
											/>
										</Field>
									</FieldRow>

									<FieldRow>
										<Field>
											<FieldLabel>Token endpoint</FieldLabel>
											<FieldInput
												value={resolved.tokenEndpoint}
												onChange={(e) => updateField('tokenEndpoint', e.target.value)}
												placeholder="https://auth.pingone.com/{envId}/as/token"
												style={{
													color:
														resolved.tokenEndpoint &&
														!resolved.tokenEndpoint.includes('{envId}') &&
														resolved.tokenEndpoint !== 'https://auth.pingone.com/{envId}/as/token'
															? '#dc2626' // Red for filled values
															: '#94a3b8', // Grey for placeholders/examples
													fontFamily:
														'SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
													fontWeight:
														resolved.tokenEndpoint &&
														!resolved.tokenEndpoint.includes('{envId}') &&
														resolved.tokenEndpoint !== 'https://auth.pingone.com/{envId}/as/token'
															? 'bold' // Bold for filled values
															: 'normal',
												}}
											/>
										</Field>
										<Field>
											<FieldLabel>JWKS URL</FieldLabel>
											<FieldInput
												value={resolved.jwksUrl}
												onChange={(e) => updateField('jwksUrl', e.target.value)}
												placeholder="https://auth.pingone.com/{envId}/as/jwks"
												style={{
													color:
														resolved.jwksUrl &&
														!resolved.jwksUrl.includes('{envId}') &&
														resolved.jwksUrl !== 'https://auth.pingone.com/{envId}/as/jwks'
															? '#dc2626' // Red for filled values
															: '#94a3b8', // Grey for placeholders/examples
													fontFamily:
														'SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
													fontWeight:
														resolved.jwksUrl &&
														!resolved.jwksUrl.includes('{envId}') &&
														resolved.jwksUrl !== 'https://auth.pingone.com/{envId}/as/jwks'
															? 'bold' // Bold for filled values
															: 'normal',
												}}
											/>
										</Field>
									</FieldRow>
								</SectionBodyInner>
							</SectionBody>
						</section>

						{/* BASICS SECTION - SECOND */}
						<section
							style={{
								borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
								paddingBottom: '0.5rem',
								marginTop: '0.5rem',
							}}
						>
							<SectionHeader>
								<SectionHeaderToggle
									type="button"
									onClick={() => setOpenBasics((o) => !o)}
									aria-expanded={openBasics}
								>
									<SectionTitle>
										{openBasics ? <FiChevronDown /> : <FiChevronRight />}
										Basics (env, client, redirect, scopes)
									</SectionTitle>
								</SectionHeaderToggle>
								{openBasics && (
									<SmallButton
										type="button"
										onClick={handleSaveCredentials}
										style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', flexShrink: 0 }}
									>
										<FiSave size={14} />
										Save Credentials
									</SmallButton>
								)}
							</SectionHeader>
							<SectionBody $open={openBasics}>
								<SectionBodyInner>
									<FieldRow>
										<Field>
											<FieldLabel>
												Environment & Region
												<InfoDot
													onMouseEnter={(e) =>
														openTooltip(
															e,
															'Choose the PingOne environment and region where this app lives.'
														)
													}
													onMouseLeave={closeTooltip}
												>
													<FiInfo size={16} />
												</InfoDot>
											</FieldLabel>
											<EnvironmentRegionContainer>
												<EnvironmentInput
													value={resolved.environmentId}
													onChange={(e) => updateField('environmentId', e.target.value)}
													placeholder="Environment ID"
												/>
												<RegionSelect
													value={resolved.region}
													onChange={(e) => updateField('region', e.target.value)}
												>
													<option value="us">US</option>
													<option value="eu">EU</option>
													<option value="ap">AP</option>
													<option value="ca">CA</option>
												</RegionSelect>
											</EnvironmentRegionContainer>
										</Field>

										<Field>
											<FieldLabel>
												Client ID
												<InfoDot
													onMouseEnter={(e) =>
														openTooltip(e, 'Client ID from your PingOne application configuration.')
													}
													onMouseLeave={closeTooltip}
												>
													<FiInfo size={16} />
												</InfoDot>
											</FieldLabel>
											<FieldInput
												value={resolved.clientId}
												onChange={(e) => updateField('clientId', e.target.value)}
												placeholder="Client ID"
											/>
										</Field>
									</FieldRow>

									<FieldRow>
										<Field>
											<FieldLabel>
												Client Secret
												<InfoPopover title="Client Secret">
													<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
														<div>
															<strong>What is a Client Secret?</strong>
															<p
																style={{
																	marginTop: '0.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																}}
															>
																A client secret is a confidential credential used by your
																application to authenticate with the authorization server when
																exchanging authorization codes for tokens or making other protected
																API requests. It proves that the request is coming from your
																authorized application, not an impersonator.
															</p>
														</div>

														<div>
															<strong>Security Importance:</strong>
															<ul
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>
																	Client secrets are used for confidential clients (server-side
																	applications)
																</li>
																<li>
																	Never expose client secrets in client-side code (browsers, mobile
																	apps)
																</li>
																<li>
																	Store secrets securely and never commit them to version control
																</li>
																<li>
																	For public clients (SPAs, mobile apps), use PKCE instead of client
																	secrets
																</li>
															</ul>
														</div>

														<div>
															<strong>How to get your client secret:</strong>
															<ol
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>Log in to your PingOne Admin Console</li>
																<li>Navigate to your application</li>
																<li>Open the application settings</li>
																<li>Find the Client Secret field (it may be masked)</li>
																<li>Click "Show" or "Reveal" to view the secret (if available)</li>
																<li>Copy the client secret value</li>
																<li>Paste it here</li>
															</ol>
														</div>

														<div
															style={{
																marginTop: '0.5rem',
																padding: '0.75rem',
																background: '#fef3c7',
																border: '1px solid #fbbf24',
																borderRadius: '0.375rem',
																fontSize: '0.875rem',
																color: '#92400e',
																lineHeight: 1.6,
															}}
														>
															<strong>⚠️ Important Security Notice:</strong>
															<ul
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>Client secrets are only shown once when created in PingOne</li>
																<li>
																	If you don't have your secret, you'll need to regenerate it in
																	PingOne (this invalidates the old secret)
																</li>
																<li>
																	We cannot retrieve your client secret from PingOne for security
																	reasons - you must copy it yourself
																</li>
																<li>Keep your client secret secure and never share it publicly</li>
															</ul>
														</div>

														<div
															style={{
																marginTop: '0.5rem',
																padding: '0.75rem',
																background: '#eff6ff',
																border: '1px solid #bfdbfe',
																borderRadius: '0.375rem',
																fontSize: '0.875rem',
																color: '#1e40af',
																lineHeight: 1.6,
															}}
														>
															<strong>💡 Authentication Methods:</strong>
															<p style={{ marginTop: '0.5rem' }}>
																The client secret is used with authentication methods like{' '}
																<code>client_secret_basic</code>,<code>client_secret_post</code>, or{' '}
																<code>client_secret_jwt</code>. Choose the authentication method
																that matches your PingOne application configuration in the
																"Advanced" section.
															</p>
														</div>
													</div>
													<FiInfo size={16} style={{ cursor: 'pointer', color: '#3b82f6' }} />
												</InfoPopover>
											</FieldLabel>
											<FieldInput
												type="password"
												value={resolved.clientSecret}
												onChange={(e) => updateField('clientSecret', e.target.value)}
												placeholder="••••••••••••"
											/>
										</Field>
										<Field>{/* Empty field for grid alignment */}</Field>
									</FieldRow>

									<FieldRow>
										<Field>
											<FieldLabel>
												Redirect URI
												<InfoPopover title="Redirect URI">
													<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
														<div>
															<strong>What is a Redirect URI?</strong>
															<p
																style={{
																	marginTop: '0.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																}}
															>
																The redirect URI is the URL where PingOne sends the user after
																authentication. This is where your application receives the
																authorization code or tokens.
															</p>
														</div>

														<div
															style={{
																padding: '0.75rem',
																background: '#fef3c7',
																border: '1px solid #fbbf24',
																borderRadius: '0.375rem',
																fontSize: '0.875rem',
																color: '#92400e',
																lineHeight: 1.6,
															}}
														>
															<strong>⚠️ Critical: Exact Match Required</strong>
															<ul
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>
																	The URI you enter here must <strong>exactly match</strong> one of
																	the redirect URIs configured in your PingOne application
																</li>
																<li>
																	PingOne performs a{' '}
																	<strong>case-sensitive, character-by-character comparison</strong>
																</li>
																<li>
																	Trailing slashes, query parameters, and fragments must match
																	exactly
																</li>
																<li>
																	If there's any mismatch, authentication will fail with an "invalid
																	redirect_uri" error
																</li>
															</ul>
														</div>

														<div>
															<strong>Examples:</strong>
															<ul
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>
																	<code>https://app.example.com/callback</code> - Exact match
																	required
																</li>
																<li>
																	<code>https://app.example.com/callback/</code> - Different
																	(trailing slash)
																</li>
																<li>
																	<code>http://app.example.com/callback</code> - Different (http vs
																	https)
																</li>
															</ul>
														</div>

														<div
															style={{
																marginTop: '0.5rem',
																padding: '0.75rem',
																background: '#eff6ff',
																border: '1px solid #bfdbfe',
																borderRadius: '0.375rem',
																fontSize: '0.875rem',
																color: '#1e40af',
																lineHeight: 1.6,
															}}
														>
															<strong>💡 Best Practice:</strong>
															<p style={{ marginTop: '0.5rem' }}>
																Copy the exact URI from your PingOne application configuration to
																ensure a perfect match. Use the "View Redirect/Logout URIs" button
																above to see examples and select from configured URIs.
															</p>
														</div>
													</div>
													<FiInfo size={16} style={{ cursor: 'pointer', color: '#3b82f6' }} />
												</InfoPopover>
											</FieldLabel>
											<FieldInput
												value={resolved.redirectUri}
												onChange={(e) => updateField('redirectUri', e.target.value)}
												placeholder="https://app.example.com/callback"
											/>
										</Field>

										<Field>
											<FieldLabel>
												Post-logout Redirect URI
												<InfoPopover title="Post-logout Redirect URI">
													<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
														<div>
															<strong>What is a Post-logout Redirect URI?</strong>
															<p
																style={{
																	marginTop: '0.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																}}
															>
																The post-logout redirect URI is the URL where PingOne sends the user
																after they log out. This is optional but recommended for a smooth
																user experience.
															</p>
														</div>

														<div
															style={{
																padding: '0.75rem',
																background: '#fef3c7',
																border: '1px solid #fbbf24',
																borderRadius: '0.375rem',
																fontSize: '0.875rem',
																color: '#92400e',
																lineHeight: 1.6,
															}}
														>
															<strong>⚠️ Critical: Exact Match Required</strong>
															<ul
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>
																	The URI you enter here must <strong>exactly match</strong> one of
																	the post-logout redirect URIs configured in your PingOne
																	application
																</li>
																<li>
																	PingOne performs a{' '}
																	<strong>case-sensitive, character-by-character comparison</strong>
																</li>
																<li>
																	Trailing slashes, query parameters, and fragments must match
																	exactly
																</li>
																<li>
																	If there's any mismatch, logout will fail or redirect to a default
																	page
																</li>
															</ul>
														</div>

														<div>
															<strong>When to use:</strong>
															<ul
																style={{
																	marginTop: '0.5rem',
																	paddingLeft: '1.5rem',
																	fontSize: '0.875rem',
																	lineHeight: 1.6,
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '0.25rem',
																}}
															>
																<li>
																	After a user logs out, redirect them to a "logged out"
																	confirmation page
																</li>
																<li>Return users to your application's home page</li>
																<li>Show a "session ended" message</li>
															</ul>
														</div>

														<div
															style={{
																marginTop: '0.5rem',
																padding: '0.75rem',
																background: '#eff6ff',
																border: '1px solid #bfdbfe',
																borderRadius: '0.375rem',
																fontSize: '0.875rem',
																color: '#1e40af',
																lineHeight: 1.6,
															}}
														>
															<strong>💡 Best Practice:</strong>
															<p style={{ marginTop: '0.5rem' }}>
																Copy the exact URI from your PingOne application configuration. Use
																the "View Redirect/Logout URIs" button above to see examples and
																select from configured URIs.
															</p>
														</div>
													</div>
													<FiInfo size={16} style={{ cursor: 'pointer', color: '#3b82f6' }} />
												</InfoPopover>
											</FieldLabel>
											<FieldInput
												value={resolved.postLogoutRedirectUri}
												onChange={(e) => updateField('postLogoutRedirectUri', e.target.value)}
												placeholder="Optional - https://app.example.com/logout-callback"
											/>
										</Field>
									</FieldRow>

									<FieldRow>
										<Field>
											<FieldLabel>
												Scopes
												<InfoDot
													onMouseEnter={(e) =>
														openTooltip(
															e,
															'Space-delimited list of scopes. For OIDC, include at least "openid".'
														)
													}
													onMouseLeave={closeTooltip}
												>
													<FiInfo size={16} />
												</InfoDot>
											</FieldLabel>
											<FieldInput
												value={resolved.scopes}
												onChange={(e) => updateField('scopes', e.target.value)}
												placeholder={defaultScopes || 'openid profile email'}
											/>
										</Field>
										<Field>{/* Empty field for grid alignment */}</Field>
									</FieldRow>
								</SectionBodyInner>
							</SectionBody>
						</section>

						{/* ADVANCED SECTION - THIRD */}
						<section
							style={{
								borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
								paddingBottom: '0.5rem',
								marginTop: '0.5rem',
							}}
						>
							<SectionHeader>
								<SectionHeaderToggle
									type="button"
									onClick={() => setOpenAdvanced((o) => !o)}
									aria-expanded={openAdvanced}
								>
									<SectionTitle>
										{openAdvanced ? <FiChevronDown /> : <FiChevronRight />}
										Advanced (auth method, secrets, JWKS / keys)
									</SectionTitle>
								</SectionHeaderToggle>
								{openAdvanced && (
									<SmallButton
										type="button"
										onClick={handleSaveAdvanced}
										style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', flexShrink: 0 }}
									>
										<FiSave size={14} />
										Save Advanced
									</SmallButton>
								)}
							</SectionHeader>
							<SectionBody $open={openAdvanced}>
								<SectionBodyInner>
									<FieldRow>
										<Field>
											<FieldLabel>
												Client Authentication
												<InfoPopover title="Client Authentication Methods">
													<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
														<div>
															<strong>None (Public Client):</strong> For public clients (SPAs,
															mobile apps). No credentials sent. PKCE required for security.
														</div>
														<div>
															<strong>Client Secret Basic:</strong> Client credentials sent via HTTP
															Basic Authorization header. Secure, standard method.
														</div>
														<div>
															<strong>Client Secret Post:</strong> Client credentials sent in POST
															body. Suitable when Basic Auth is not available.
														</div>
														<div>
															<strong>Client Secret JWT:</strong> Client authenticates using a JWT
															signed with the client secret (HMAC-SHA256). More secure than sending
															secrets directly.
														</div>
														<div>
															<strong>Private Key JWT:</strong> Client authenticates using a JWT
															signed with a private key (RSA/ECDSA). Highest security, requires key
															pair management.
														</div>
													</div>
													<FiInfo size={16} style={{ cursor: 'pointer', color: '#3b82f6' }} />
												</InfoPopover>
											</FieldLabel>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
												<ClientAuthMethodSelector
													value={resolved.clientAuthMethod}
													onChange={(method: any) => updateField('clientAuthMethod', method)}
													allowedMethods={allowedAuthMethods}
												/>
												{resolved.clientAuthMethod === 'private_key_jwt' && (
													<SmallButton
														type="button"
														onClick={() => setShowPrivateKeyJwtModal(true)}
														style={{ alignSelf: 'flex-start' }}
													>
														<FiKey size={14} />
														Configure Private Key JWT
													</SmallButton>
												)}
												{resolved.clientAuthMethod === 'client_secret_jwt' && (
													<SmallButton
														type="button"
														onClick={() => setShowClientSecretJwtModal(true)}
														style={{ alignSelf: 'flex-start' }}
													>
														<FiShield size={14} />
														Configure Client Secret JWT
													</SmallButton>
												)}
											</div>
										</Field>
									</FieldRow>

									<FieldRow>
										<Field>
											<FieldLabel>Login hint</FieldLabel>
											<FieldInput
												value={resolved.loginHint}
												onChange={(e) => updateField('loginHint', e.target.value)}
												placeholder="Optional username/email hint"
											/>
										</Field>
										<Field>{/* Empty field for grid alignment */}</Field>
									</FieldRow>

									{resolved.clientAuthMethod === 'private_key_jwt' && (
										<JwksKeySourceSelector
											value={resolved.jwksUrl ? 'remote' : 'local'}
											jwksUrl={resolved.jwksUrl}
											environmentId={resolved.environmentId}
											issuer={resolved.issuerUrl}
											onCopyJwksUrlSuccess={(url: string) => {
												v4ToastManager.showSuccess(`JWKS URL copied: ${url}`);
											}}
											onCopyJwksUrlError={(error: string) => {
												v4ToastManager.showError(`Failed to copy JWKS URL: ${error}`);
											}}
											privateKey={resolved.privateKey}
											onPrivateKeyChange={(key: string) => {
												onPrivateKeyChange?.(key);
												updateField('privateKey', key);
											}}
											onGenerateKey={() => {
												// Leave logic to the selector; if it returns keys via callbacks,
												// make sure they update credentials.
											}}
											showPrivateKey={showPrivateKey}
											onTogglePrivateKey={() => setShowPrivateKey(!showPrivateKey)}
											isGeneratingKey={false}
											showConfigurationWarning={true}
											copyButtonLabel="Copy JWKS URL"
											generateKeyLabel="Generate RSA Key Pair"
											privateKeyLabel="Private Key (PEM)"
										/>
									)}
								</SectionBodyInner>
							</SectionBody>
						</section>

						{/* CONFIG CHECKER SECTION - FOURTH */}
						{(rest as any).showConfigChecker && (
							<section style={{ marginTop: '0.5rem' }}>
								<SectionHeader>
									<SectionHeaderToggle
										type="button"
										onClick={() => setOpenConfigChecker((o) => !o)}
										aria-expanded={openConfigChecker}
									>
										<SectionTitle>
											{openConfigChecker ? <FiChevronDown /> : <FiChevronRight />}
											Configuration Checker
										</SectionTitle>
									</SectionHeaderToggle>
								</SectionHeader>
								<SectionBody $open={openConfigChecker}>
									<SectionBodyInner>
										<ConfigCheckerButtons
											formData={(() => {
												// Helper: Determine if flow uses redirects
												const flowType = (rest as any).flowType || '';
												const normalizedFlowType =
													flowType?.toLowerCase().replace(/[-_]/g, '-') || '';
												const flowUsesRedirects =
													!normalizedFlowType.includes('client-credentials') &&
													!normalizedFlowType.includes('client_credentials') &&
													!normalizedFlowType.includes('ropc') &&
													!normalizedFlowType.includes('resource-owner-password') &&
													!normalizedFlowType.includes('ciba') &&
													!normalizedFlowType.includes('device') &&
													!normalizedFlowType.includes('device-authorization');

												const tokenEndpointAuthMethod =
													typeof resolved.clientAuthMethod === 'string'
														? resolved.clientAuthMethod
														: (resolved.clientAuthMethod as any)?.value || 'client_secret_post';

												const baseFormData: any = {
													environmentId: resolved.environmentId,
													clientId: resolved.clientId,
													clientSecret: resolved.clientSecret || '',
													tokenEndpointAuthMethod,
													scopes: Array.isArray(resolved.scopes)
														? resolved.scopes
														: typeof resolved.scopes === 'string'
															? resolved.scopes.split(/\s+/).filter(Boolean)
															: [],
												};

												if (flowUsesRedirects && resolved.redirectUri) {
													baseFormData.redirectUri = resolved.redirectUri;
												}

												if (resolved.postLogoutRedirectUri) {
													baseFormData.postLogoutRedirectUri = resolved.postLogoutRedirectUri;
												}

												return baseFormData;
											})()}
											selectedAppType={(rest as any).selectedAppType || 'OIDC_WEB_APP'}
											workerToken={(rest as any).workerToken || ''}
											environmentId={resolved.environmentId}
											region={
												resolved.region === 'us' ? 'NA' : resolved.region?.toUpperCase() || 'NA'
											}
											flowType={(rest as any).flowType}
											onGenerateWorkerToken={(rest as any).onGenerateWorkerToken}
											onCreateApplication={async (appData?: {
												name: string;
												description: string;
												redirectUri?: string;
												tokenEndpointAuthMethod?: string;
												responseTypes?: string[];
												grantTypes?: string[];
												refreshTokenEnabled?: boolean;
											}) => {
												// Create a new PingOne application using the current flow configuration
												try {
													const effectiveWorkerToken = (rest as any).workerToken || '';
													if (!effectiveWorkerToken) {
														v4ToastManager.showError(
															'Worker token is required to create applications.'
														);
														return { success: false, error: 'Worker token is required' };
													}

													// Initialize the service with worker token
													await pingOneAppCreationService.initialize(
														effectiveWorkerToken,
														resolved.environmentId || '',
														resolved.region === 'us' ? 'NA' : resolved.region?.toUpperCase() || 'NA'
													);

													// Determine app type based on flow type
													const flowTypeValue = (rest as any).flowType || '';
													const selectedAppTypeValue =
														(rest as any).selectedAppType || 'OIDC_WEB_APP';

													let appType:
														| 'OIDC_WEB_APP'
														| 'OIDC_NATIVE_APP'
														| 'SINGLE_PAGE_APP'
														| 'WORKER'
														| 'SERVICE' = 'OIDC_WEB_APP';

													if (selectedAppTypeValue) {
														appType = selectedAppTypeValue as any;
													} else if (flowTypeValue?.includes('implicit')) {
														appType = 'OIDC_NATIVE_APP';
													}

													// Use provided appData or build from current credentials
													const redirectUris = appData?.redirectUri
														? [appData.redirectUri]
														: resolved.redirectUri
															? [resolved.redirectUri]
															: [];

													const scopes = Array.isArray(resolved.scopes)
														? resolved.scopes
														: typeof resolved.scopes === 'string'
															? resolved.scopes.split(/\s+/).filter(Boolean)
															: [];

													const grantTypes = appData?.grantTypes || ['authorization_code'];
													const responseTypes = appData?.responseTypes || ['code'];
													const tokenEndpointAuthMethod = (appData?.tokenEndpointAuthMethod ||
														resolved.clientAuthMethod ||
														'client_secret_post') as any;

													// Build the app configuration
													const appConfig: any = {
														name:
															appData?.name ||
															`pingone-app-${Math.floor(Math.random() * 900) + 100}`,
														description:
															appData?.description ||
															`Created from ${flowTypeValue || 'OAuth Playground'}`,
														type: appType,
														redirectUris,
														grantTypes,
														responseTypes,
														tokenEndpointAuthMethod,
														refreshTokenEnabled: appData?.refreshTokenEnabled ?? true,
													};

													if (resolved.postLogoutRedirectUri) {
														appConfig.postLogoutRedirectUris = [resolved.postLogoutRedirectUri];
													}

													if (scopes.length > 0) {
														appConfig.scopes = scopes;
													}

													// Create the application using the appropriate method based on app type
													let result;
													if (appType === 'OIDC_WEB_APP') {
														result = await pingOneAppCreationService.createOIDCWebApp(
															appConfig as any
														);
													} else if (appType === 'OIDC_NATIVE_APP') {
														result = await pingOneAppCreationService.createOIDCNativeApp(
															appConfig as any
														);
													} else if (appType === 'SINGLE_PAGE_APP') {
														result = await pingOneAppCreationService.createSinglePageApp(
															appConfig as any
														);
													} else if (appType === 'WORKER') {
														result = await pingOneAppCreationService.createWorkerApp(
															appConfig as any
														);
													} else if (appType === 'SERVICE') {
														result = await pingOneAppCreationService.createServiceApp(
															appConfig as any
														);
													} else {
														// Default to OIDC Web App
														result = await pingOneAppCreationService.createOIDCWebApp(
															appConfig as any
														);
													}

													if (result.success && result.app) {
														v4ToastManager.showSuccess(
															`Application "${result.app.name}" created successfully!`
														);
														return { success: true, application: result.app };
													} else {
														v4ToastManager.showError(
															`Failed to create application: ${result.error || 'Unknown error'}`
														);
														return { success: false, error: result.error || 'Unknown error' };
													}
												} catch (error) {
													const errorMessage =
														error instanceof Error ? error.message : 'Unknown error occurred';
													v4ToastManager.showError(`Application creation failed: ${errorMessage}`);
													console.error(
														'[ComprehensiveCredentialsServiceV8] Application creation failed:',
														error
													);
													return { success: false, error: errorMessage };
												}
											}}
											onImportConfig={(importedConfig: Record<string, unknown>) => {
												// Import configuration from PingOne
												if (onCredentialsChange) {
													const updated: any = { ...credentials };

													if (importedConfig.redirectUri) {
														updated.redirectUri = importedConfig.redirectUri;
													}
													if (
														importedConfig.redirectUris &&
														Array.isArray(importedConfig.redirectUris)
													) {
														updated.redirectUri = importedConfig.redirectUris[0];
													}
													if (importedConfig.scopes) {
														updated.scopes = Array.isArray(importedConfig.scopes)
															? importedConfig.scopes.join(' ')
															: String(importedConfig.scopes);
													}
													if (importedConfig.tokenEndpointAuthMethod) {
														updated.clientAuthMethod = importedConfig.tokenEndpointAuthMethod;
													}

													onCredentialsChange(updated);
													v4ToastManager.showSuccess('Configuration imported from PingOne!');
												}
											}}
											style={{ fontSize: '0.85rem' }}
										/>
									</SectionBodyInner>
								</SectionBody>
							</section>
						)}

						<div
							style={{
								display: 'flex',
								justifyContent: 'flex-end',
								gap: '0.5rem',
								marginTop: '1rem',
								paddingTop: '1rem',
								borderTop: '1px solid rgba(148, 163, 184, 0.2)',
							}}
						>
							<SmallButton type="button" onClick={() => setOpenDrawer(false)}>
								Cancel
							</SmallButton>
							<SmallButton
								type="button"
								onClick={handleSaveAll}
								style={{ background: '#10b981', borderColor: '#059669' }}
							>
								<FiSave size={14} />
								Save All Sections
							</SmallButton>
							<SmallButton type="button" onClick={handleSave}>
								Save & Close
							</SmallButton>
						</div>
					</DrawerInner>
				)}
			</Drawer>

			{tooltip && (
				<div
					style={{
						position: 'absolute',
						left: tooltip.x,
						top: tooltip.y,
					}}
				>
					<TinyTooltip>{tooltip.text}</TinyTooltip>
				</div>
			)}

			{/* Private Key JWT Configuration Modal */}
			<DraggableModal
				isOpen={showPrivateKeyJwtModal}
				onClose={() => setShowPrivateKeyJwtModal(false)}
				title="Private Key JWT Configuration"
				width="900px"
				maxHeight="90vh"
			>
				<div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<div>
						<h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
							About Private Key JWT
						</h3>
						<p
							style={{
								fontSize: '0.875rem',
								color: '#475569',
								lineHeight: 1.6,
								marginBottom: '1rem',
							}}
						>
							Private Key JWT authentication uses a JWT signed with an RSA or ECDSA private key.
							This provides the highest level of security as it uses asymmetric cryptography. The
							authorization server validates the JWT using the corresponding public key (provided
							via JWKS endpoint or certificate).
						</p>
					</div>

					<div>
						<h4
							style={{
								marginBottom: '0.75rem',
								fontSize: '0.875rem',
								fontWeight: 600,
								color: '#1e293b',
							}}
						>
							JWT Generator
						</h4>
						<JWTConfigV8
							type="private_key_jwt"
							initialConfig={{
								clientId: resolved.clientId,
								tokenEndpoint: resolved.tokenEndpoint || '',
								privateKey: resolved.privateKey,
								issuer: resolved.issuerUrl || undefined,
								subject: resolved.clientId || undefined,
							}}
							onJWTGenerated={(jwt, result) => {
								if (result.success && result.jwt) {
									console.log(
										'[ComprehensiveCredentialsServiceV8] Private Key JWT generated:',
										jwt
									);
								}
							}}
						/>
					</div>

					<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
						<h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
							JWKS Configuration
						</h4>
						<JwksKeySourceSelector
							value={resolved.jwksUrl ? 'remote' : 'local'}
							jwksUrl={resolved.jwksUrl}
							environmentId={resolved.environmentId}
							issuer={resolved.issuerUrl}
							onCopyJwksUrlSuccess={(url: string) => {
								v4ToastManager.showSuccess(`JWKS URL copied: ${url}`);
							}}
							onCopyJwksUrlError={(error: string) => {
								v4ToastManager.showError(`Failed to copy JWKS URL: ${error}`);
							}}
							privateKey={resolved.privateKey}
							onPrivateKeyChange={(key: string) => {
								onPrivateKeyChange?.(key);
								updateField('privateKey', key);
							}}
							onGenerateKey={() => {
								// Leave logic to the selector; if it returns keys via callbacks,
								// make sure they update credentials.
							}}
							showPrivateKey={showPrivateKey}
							onTogglePrivateKey={() => setShowPrivateKey(!showPrivateKey)}
							isGeneratingKey={false}
							showConfigurationWarning={true}
							copyButtonLabel="Copy JWKS URL"
							generateKeyLabel="Generate RSA Key Pair"
							privateKeyLabel="Private Key (PEM)"
						/>
					</div>

					<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
						<h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
							How it works:
						</h4>
						<ol
							style={{
								fontSize: '0.875rem',
								color: '#475569',
								lineHeight: 1.8,
								paddingLeft: '1.5rem',
							}}
						>
							<li>Generate an RSA or ECDSA key pair (or use an existing one)</li>
							<li>Configure the public key in your PingOne application's JWKS endpoint</li>
							<li>Use the private key here to sign JWTs for authentication</li>
							<li>Each token request includes a signed JWT assertion in the request</li>
						</ol>
					</div>

					<div
						style={{
							marginTop: '1.5rem',
							paddingTop: '1rem',
							borderTop: '1px solid #e2e8f0',
							display: 'flex',
							justifyContent: 'flex-end',
							gap: '0.5rem',
						}}
					>
						<SmallButton type="button" onClick={() => setShowPrivateKeyJwtModal(false)}>
							Close
						</SmallButton>
						<SmallButton type="button" onClick={() => setShowPrivateKeyJwtModal(false)}>
							OK
						</SmallButton>
					</div>
				</div>
			</DraggableModal>

			{/* Client Secret JWT Configuration Modal */}
			<DraggableModal
				isOpen={showClientSecretJwtModal}
				onClose={() => setShowClientSecretJwtModal(false)}
				title="Client Secret JWT Configuration"
				width="900px"
				maxHeight="90vh"
			>
				<div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<div>
						<h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
							About Client Secret JWT
						</h3>
						<p
							style={{
								fontSize: '0.875rem',
								color: '#475569',
								lineHeight: 1.6,
								marginBottom: '1rem',
							}}
						>
							Client Secret JWT authentication uses a JWT signed with the client secret using
							HMAC-SHA256. This method provides better security than sending the client secret
							directly in the request body or header, as the secret is used only for signing, not
							transmission.
						</p>
					</div>

					<div>
						<h4
							style={{
								marginBottom: '0.75rem',
								fontSize: '0.875rem',
								fontWeight: 600,
								color: '#1e293b',
							}}
						>
							JWT Generator
						</h4>
						<JWTConfigV8
							type="client_secret_jwt"
							initialConfig={{
								clientId: resolved.clientId,
								tokenEndpoint: resolved.tokenEndpoint || '',
								clientSecret: resolved.clientSecret,
								issuer: resolved.issuerUrl || undefined,
								subject: resolved.clientId || undefined,
							}}
							onJWTGenerated={(jwt, result) => {
								if (result.success && result.jwt) {
									console.log(
										'[ComprehensiveCredentialsServiceV8] Client Secret JWT generated:',
										jwt
									);
								}
							}}
						/>
					</div>

					<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
						<h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
							How it works:
						</h4>
						<ol
							style={{
								fontSize: '0.875rem',
								color: '#475569',
								lineHeight: 1.8,
								paddingLeft: '1.5rem',
							}}
						>
							<li>Enter your client secret (must match PingOne application)</li>
							<li>
								Each token request generates a JWT signed with HMAC-SHA256 using the client secret
							</li>
							<li>
								The JWT assertion is sent in the request body as <code>client_assertion</code>
							</li>
							<li>
								The authorization server validates the JWT signature using the same client secret
							</li>
						</ol>
					</div>

					<div
						style={{
							marginTop: '1rem',
							padding: '0.75rem',
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '0.5rem',
							fontSize: '0.875rem',
							color: '#1e40af',
							lineHeight: 1.6,
						}}
					>
						<strong>Note:</strong> Client Secret JWT is more secure than{' '}
						<code>client_secret_post</code> because the secret is used for signing, not sent
						directly. However, Private Key JWT provides even better security through asymmetric
						cryptography.
					</div>

					<div
						style={{
							marginTop: '1.5rem',
							paddingTop: '1rem',
							borderTop: '1px solid #e2e8f0',
							display: 'flex',
							justifyContent: 'flex-end',
							gap: '0.5rem',
						}}
					>
						<SmallButton type="button" onClick={() => setShowClientSecretJwtModal(false)}>
							Close
						</SmallButton>
						<SmallButton type="button" onClick={() => setShowClientSecretJwtModal(false)}>
							OK
						</SmallButton>
					</div>
				</div>
			</DraggableModal>
		</Container>
	);
};

export default ComprehensiveCredentialsServiceV8;
