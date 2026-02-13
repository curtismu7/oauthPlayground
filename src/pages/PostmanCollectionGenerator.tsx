/**
 * @file PostmanCollectionGenerator.tsx
 * @module pages
 * @description Dedicated page for generating custom Postman collections
 * @version 9.0.0
 *
 * Allows users to select:
 * - All collections (Unified + MFA)
 * - Just MFA (all or individual device types)
 * - Just Unified (all, OAuth 2.0 Authorization Framework (RFC 6749), OpenID Connect Core 1.0, OAuth 2.1 Authorization Framework (draft), or combinations)
 */

import React, { useRef, useState } from 'react';
import { FiChevronDown, FiChevronRight, FiDownload, FiPackage } from 'react-icons/fi';
import { usePageScroll } from '@/hooks/usePageScroll';
import {
	COLLECTION_VERSION,
	downloadPostmanCollection,
	downloadPostmanCollectionWithEnvironment,
	downloadPostmanEnvironment,
	generateCompletePostmanCollection,
	generateComprehensiveMFAPostmanCollection,
	generateComprehensiveUnifiedPostmanCollection,
	generatePostmanEnvironment,
	generateUseCasesPostmanCollection,
	type PostmanCollection,
	type PostmanCollectionItem,
} from '@/services/postmanCollectionGeneratorV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📦 POSTMAN-COLLECTION-GENERATOR]';

type DeviceType = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'TOTP' | 'FIDO2' | 'MOBILE';

type UnifiedVariation =
	| 'authz-client-secret-post'
	| 'authz-client-secret-basic'
	| 'authz-client-secret-jwt'
	| 'authz-private-key-jwt'
	| 'authz-pi-flow'
	| 'authz-pkce'
	| 'authz-pkce-par'
	| 'implicit'
	| 'client-credentials'
	| 'device-code'
	| 'hybrid';

type MFAUseCase = 'user-flow' | 'admin-flow' | 'registration' | 'authentication';

type UseCaseType =
	| 'signup'
	| 'signin'
	| 'mfa-enrollment'
	| 'mfa-challenge'
	| 'stepup'
	| 'password-reset'
	| 'account-recovery'
	| 'change-credentials'
	| 'social-login'
	| 'federation'
	| 'oauth-login'
	| 'risk-checks'
	| 'logout'
	| 'user-sessions'
	| 'transaction-approval'
	| 'pingone-metadata';

export const PostmanCollectionGenerator: React.FC = () => {
	usePageScroll({ pageName: 'Postman Collection Generator', force: true });

	// Collection type selection
	const [includeUnified, setIncludeUnified] = useState(true);
	const [includeMFA, setIncludeMFA] = useState(true);
	const [includeUseCases, setIncludeUseCases] = useState(true);

	// Use case selection
	const useCaseTypes: UseCaseType[] = [
		'signup',
		'signin',
		'mfa-enrollment',
		'mfa-challenge',
		'stepup',
		'password-reset',
		'account-recovery',
		'change-credentials',
		'social-login',
		'federation',
		'oauth-login',
		'risk-checks',
		'logout',
		'user-sessions',
		'transaction-approval',
		'pingone-metadata',
	];

	const [selectedUseCases, setSelectedUseCases] = useState<Set<UseCaseType>>(
		new Set(useCaseTypes) // All use cases selected by default when Use Cases is enabled
	);

	// Unified spec version selection
	const [includeOAuth20, setIncludeOAuth20] = useState(true);
	const [includeOAuth21, setIncludeOAuth21] = useState(true);
	const [includeOIDC, setIncludeOIDC] = useState(true);

	// Map FlowType to UnifiedVariation types
	const flowTypeToVariations = (
		flowType: FlowType,
		specVersion?: SpecVersion
	): UnifiedVariation[] => {
		switch (flowType) {
			case 'oauth-authz':
				// OAuth 2.1 (draft) requires PKCE for Authorization Code flow, so only PKCE variations. When used with OIDC Core 1.0, this is "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 (draft) baseline)".
				if (specVersion === 'oauth2.1') {
					return ['authz-pkce', 'authz-pkce-par'];
				}
				// For other spec versions, include all authz variations
				return [
					'authz-client-secret-post',
					'authz-client-secret-basic',
					'authz-client-secret-jwt',
					'authz-private-key-jwt',
					'authz-pkce',
					'authz-pkce-par',
					'authz-pi-flow',
				];
			case 'implicit':
				return ['implicit'];
			case 'hybrid':
				return ['hybrid'];
			case 'client-credentials':
				return ['client-credentials'];
			case 'device-code':
				return ['device-code'];
			default:
				return [];
		}
	};

	// Get all variations for a spec version
	const getVariationsForSpec = (specVersion: SpecVersion): UnifiedVariation[] => {
		const flows = SpecVersionServiceV8.getAvailableFlows(specVersion);
		const variations: UnifiedVariation[] = [];
		flows.forEach((flow) => {
			variations.push(...flowTypeToVariations(flow, specVersion));
		});
		// #region agent log - commented out to prevent connection errors
		// fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c', {
		// 	method: 'POST',
		// 	headers: { 'Content-Type': 'application/json' },
		// 	body: JSON.stringify({
		// 		location: 'PostmanCollectionGenerator.tsx:94',
		// 		message: 'Getting variations for spec version',
		// 		data: { specVersion, flows: Array.from(flows), variations: Array.from(variations) },
		// 		timestamp: Date.now(),
		// 		sessionId: 'debug-session',
		// 		hypothesisId: 'B',
		// 	}),
		// }).catch(() => {});
		// #endregion
		return variations;
	};

	// Handle spec version change with auto-selection of flow variations
	const handleSpecVersionChange = (
		specVersion: 'oauth2.0' | 'oauth2.1' | 'oidc',
		checked: boolean
	) => {
		// Calculate new spec version states
		const newOAuth20 = specVersion === 'oauth2.0' ? checked : includeOAuth20;
		const newOAuth21 = specVersion === 'oauth2.1' ? checked : includeOAuth21;
		const newOIDC = specVersion === 'oidc' ? checked : includeOIDC;

		// Update spec version states
		setIncludeOAuth20(newOAuth20);
		setIncludeOAuth21(newOAuth21);
		setIncludeOIDC(newOIDC);

		// Auto-select/deselect flow variations based on all selected spec versions
		setSelectedUnifiedVariations((prev) => {
			const newSet = new Set(prev);

			// Collect all variations from all selected spec versions (after the change)
			const allSelectedVariations = new Set<UnifiedVariation>();
			if (newOAuth20) {
				for (const variation of getVariationsForSpec('oauth2.0')) {
					allSelectedVariations.add(variation);
				}
			}
			if (newOAuth21) {
				for (const variation of getVariationsForSpec('oauth2.1')) {
					allSelectedVariations.add(variation);
				}
			}
			if (newOIDC) {
				for (const variation of getVariationsForSpec('oidc')) {
					allSelectedVariations.add(variation);
				}
			}

			// If checking, add all variations from this spec version
			if (checked) {
				const variations = getVariationsForSpec(specVersion);
				// #region agent log - commented out to prevent connection errors
				// fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c', {
				// 	method: 'POST',
				// 	headers: { 'Content-Type': 'application/json' },
				// 	body: JSON.stringify({
				// 		location: 'PostmanCollectionGenerator.tsx:135',
				// 		message: 'Adding variations for spec version',
				// 		data: { specVersion, checked, variations: Array.from(variations) },
				// 		timestamp: Date.now(),
				// 		sessionId: 'debug-session',
				// 		hypothesisId: 'A',
				// 	}),
				// }).catch(() => {});
				// #endregion
				for (const variation of variations) {
					newSet.add(variation);
				}
			} else {
				// If unchecking, remove variations from this spec version
				// but only if they're not supported by any other selected spec version
				const unselectedSpecVariations = getVariationsForSpec(specVersion);
				unselectedSpecVariations.forEach((variation) => {
					// Only remove if not in the allSelectedVariations set (i.e., not supported by other specs)
					if (!allSelectedVariations.has(variation)) {
						newSet.delete(variation);
					}
				});
			}

			return newSet;
		});
	};

	// Initialize selected variations based on initial spec version selections
	const getInitialVariations = (): Set<UnifiedVariation> => {
		const variations = new Set<UnifiedVariation>();
		// Start with all three specs selected by default
		for (const variation of getVariationsForSpec('oauth2.0')) {
			variations.add(variation);
		}
		for (const variation of getVariationsForSpec('oauth2.1')) {
			variations.add(variation);
		}
		for (const variation of getVariationsForSpec('oidc')) {
			variations.add(variation);
		}
		return variations;
	};

	// Unified variation selection (multiselect)
	const [selectedUnifiedVariations, setSelectedUnifiedVariations] = useState<Set<UnifiedVariation>>(
		getInitialVariations()
	);

	// MFA device type selection
	const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<DeviceType>>(
		new Set(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'])
	);

	// MFA use case selection per device type (multiselect)
	const [selectedMFAUseCases, setSelectedMFAUseCases] = useState<Map<DeviceType, Set<MFAUseCase>>>(
		new Map(
			['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [
				dt as DeviceType,
				new Set<MFAUseCase>(['user-flow', 'admin-flow', 'registration', 'authentication']),
			])
		)
	);

	// Expanded sections state
	const [expandedUnifiedVariations, setExpandedUnifiedVariations] = useState(false); // Collapsed by default
	const [expandedMFADeviceList, setExpandedMFADeviceList] = useState(false); // Collapsed by default
	const [expandedMFAUseCases, setExpandedMFAUseCases] = useState<Map<DeviceType, boolean>>(
		new Map(
			['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [dt as DeviceType, false])
		)
	);
	const [expandedUseCases, setExpandedUseCases] = useState(false); // Collapsed by default - for Use Cases selection

	const [isGenerating, setIsGenerating] = useState(false);
	const [_validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

	// Refs for input fields
	const environmentIdRef = useRef<HTMLInputElement>(null);
	const clientIdRef = useRef<HTMLInputElement>(null);
	const _clientSecretRef = useRef<HTMLInputElement>(null);
	const _usernameRef = useRef<HTMLInputElement>(null);

	// Helper function to find and highlight blank fields
	const validateAndHighlightFields = (
		credentials: {
			environmentId?: string;
			clientId?: string;
			clientSecret?: string;
			username?: string;
		},
		requiredFields: Array<{
			key: keyof typeof credentials;
			ref: React.RefObject<HTMLInputElement>;
			label: string;
		}>
	): boolean => {
		const errors: Record<string, boolean> = {};
		let firstBlankField: {
			ref: React.RefObject<HTMLInputElement>;
			label: string;
			key: string;
		} | null = null;

		// Check each required field
		for (const field of requiredFields) {
			const value = credentials[field.key];
			if (!value || value.trim() === '') {
				errors[field.key] = true;
				if (!firstBlankField) {
					firstBlankField = { ...field, key: field.key as string };
				}
			}
		}

		setValidationErrors(errors);

		// If there are errors, scroll to and highlight the first blank field
		if (firstBlankField) {
			// Try to find the input element using multiple strategies
			let inputElement: HTMLInputElement | null = null;

			// Strategy 1: Use ref if available
			if (firstBlankField.ref.current) {
				inputElement = firstBlankField.ref.current;
			} else {
				// Strategy 2: Try various selectors
				const fieldKey = firstBlankField.key.toLowerCase();
				const labelText = firstBlankField.label.toLowerCase();

				const selectors = [
					`input[data-field="${fieldKey}"]`,
					`input[data-field="${firstBlankField.key}"]`,
					`input[id*="${fieldKey}"]`,
					`input[id*="${firstBlankField.key}"]`,
					`input[name*="${fieldKey}"]`,
					`input[name*="${firstBlankField.key}"]`,
					`input[placeholder*="${labelText}"]`,
					`input[placeholder*="${firstBlankField.label}"]`,
				];

				// Also try finding by label text
				const labels = document.querySelectorAll('label');
				for (const label of labels) {
					const labelTextContent = label.textContent?.toLowerCase() || '';
					if (labelTextContent.includes(labelText) || labelTextContent.includes(fieldKey)) {
						const labelFor = label.getAttribute('for');
						if (labelFor) {
							const found = document.getElementById(labelFor) as HTMLInputElement;
							if (found && found.tagName === 'INPUT') {
								inputElement = found;
								break;
							}
						}
						// Try finding input next to or inside the label
						const nearbyInput =
							label.querySelector('input') || label.nextElementSibling?.querySelector('input');
						if (nearbyInput && nearbyInput.tagName === 'INPUT') {
							inputElement = nearbyInput as HTMLInputElement;
							break;
						}
					}
				}

				// If still not found, try the selectors
				if (!inputElement) {
					for (const selector of selectors) {
						const found = document.querySelector<HTMLInputElement>(selector);
						if (found) {
							inputElement = found;
							break;
						}
					}
				}

				// Last resort: search all inputs and try to match by placeholder or nearby label
				if (!inputElement) {
					const allInputs = document.querySelectorAll<HTMLInputElement>(
						'input[type="text"], input[type="email"], input:not([type="hidden"])'
					);
					for (const input of allInputs) {
						const placeholder = input.placeholder?.toLowerCase() || '';
						if (placeholder.includes(fieldKey) || placeholder.includes(labelText)) {
							inputElement = input;
							break;
						}
					}
				}
			}

			// If we found the input, highlight it
			if (inputElement) {
				// Scroll to the element
				inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

				// Wait a bit for scroll to complete, then focus and highlight
				setTimeout(() => {
					inputElement?.focus();

					// Store original styles
					const originalBorder = inputElement.style.border;
					const originalBoxShadow = inputElement.style.boxShadow;

					// Apply red highlight
					inputElement.style.border = '2px solid #ef4444';
					inputElement.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
					inputElement.style.transition = 'border 0.2s ease, box-shadow 0.2s ease';

					// Remove highlight after 3 seconds
					setTimeout(() => {
						inputElement.style.border = originalBorder;
						inputElement.style.boxShadow = originalBoxShadow;
					}, 3000);
				}, 300);

				toastV8.error(`${firstBlankField.label} is required. Please fill in this field.`);
				return false;
			} else {
				// If we can't find the input, at least show the error
				toastV8.error(`${firstBlankField.label} is required. Please fill in this field.`);
				return false;
			}
		}

		return true;
	};

	// Validate credentials based on selected collection types
	const validateCredentials = (credentials: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		username?: string;
	}): boolean => {
		const requiredFields: Array<{
			key: keyof typeof credentials;
			ref: React.RefObject<HTMLInputElement>;
			label: string;
		}> = [];

		// Environment ID is always required
		requiredFields.push({
			key: 'environmentId',
			ref: environmentIdRef,
			label: 'Environment ID',
		});

		// If Unified or Use Cases are included, Client ID is required
		if (includeUnified || includeUseCases) {
			requiredFields.push({
				key: 'clientId',
				ref: clientIdRef,
				label: 'Client ID',
			});
		}

		return validateAndHighlightFields(credentials, requiredFields);
	};

	// Get credentials
	const getCredentials = () => {
		const environmentId = EnvironmentIdServiceV8.getEnvironmentId();
		const flowKey = 'oauth-authz-v8u';

		// Get flow config with proper fallback
		const unifiedConfig = {
			flowKey,
			flowType: 'oauth' as const,
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
		};

		const unifiedCreds = CredentialsServiceV8.loadCredentials(flowKey, unifiedConfig);

		// MFA flow config
		const mfaFlowKey = 'mfa-hub-v8';
		const mfaConfig = {
			flowKey: mfaFlowKey,
			flowType: 'oidc' as const,
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		};

		const mfaCreds = CredentialsServiceV8.loadCredentials(mfaFlowKey, mfaConfig);

		// Try worker token credentials as fallback
		let workerTokenEnvId = '';
		try {
			const stored = localStorage.getItem('unified_worker_token');
			if (stored) {
				const data = JSON.parse(stored);
				workerTokenEnvId = data.credentials?.environmentId || '';
			}
		} catch (error) {
			console.log('Failed to load environment ID from worker token:', error);
		}

		const credentials: {
			environmentId?: string;
			clientId?: string;
			clientSecret?: string;
			username?: string;
		} = {};
		const resolvedEnvironmentId =
			environmentId || unifiedCreds?.environmentId || mfaCreds?.environmentId || workerTokenEnvId;
		if (resolvedEnvironmentId) credentials.environmentId = resolvedEnvironmentId;
		if (unifiedCreds?.clientId) credentials.clientId = unifiedCreds.clientId;
		if (unifiedCreds?.clientSecret) credentials.clientSecret = unifiedCreds.clientSecret;
		if (mfaCreds?.username) credentials.username = mfaCreds.username;

		return credentials;
	};

	// Generate filtered Unified collection
	const generateFilteredUnifiedCollection = (credentials: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
	}): PostmanCollection | null => {
		const allSpecVersions: SpecVersion[] = [];
		if (includeOAuth20) allSpecVersions.push('oauth2.0');
		if (includeOAuth21) allSpecVersions.push('oauth2.1');
		if (includeOIDC) allSpecVersions.push('oidc');

		if (allSpecVersions.length === 0) return null;

		// Get all flows for selected spec versions
		const allFlows = new Set<FlowType>();
		for (const spec of allSpecVersions) {
			for (const flow of SpecVersionServiceV8.getAvailableFlows(spec)) {
				allFlows.add(flow);
			}
		}

		// Generate comprehensive collection
		const collection = generateComprehensiveUnifiedPostmanCollection(credentials);

		// Filter items based on selected spec versions
		// The collection structure is: [Use Cases, Worker Token, OAuth 2.0 Authorization Framework (RFC 6749), OpenID Connect Core 1.0, OAuth 2.1 Authorization Framework (draft) with OpenID Connect Core 1.0, Redirectless (PingOne pi.flow)]
		// Filter by folder name (spec version) - each folder contains all flows for that spec version
		const filteredItems: PostmanCollectionItem[] = [];

		collection.item.forEach((folder) => {
			const folderName = folder.name;

			// Always exclude Use Cases folder when filtering (will be added separately if includeUseCases is true)
			if (folderName === 'Use Cases') {
				return;
			}

			// Always include Worker Token and Redirectless folders
			if (folderName === 'Worker Token' || folderName.includes('Redirectless')) {
				filteredItems.push(folder);
				return;
			}

			// Check if folder matches selected spec versions (exact match by folder name)
			let shouldInclude = false;

			// OAuth 2.0 folder: include if OAuth 2.0 is selected
			if (includeOAuth20 && folderName === 'OAuth 2.0 Authorization Framework (RFC 6749)') {
				shouldInclude = true;
			}

			// OIDC folder (not OIDC 2.1): include if OIDC is selected
			if (includeOIDC && folderName === 'OpenID Connect Core 1.0') {
				shouldInclude = true;
			}

			// OAuth 2.1 / OIDC 2.1 folder: include if OAuth 2.1 is selected
			if (
				includeOAuth21 &&
				folderName === 'OAuth 2.1 Authorization Framework (draft) with OpenID Connect Core 1.0'
			) {
				shouldInclude = true;
			}

			if (shouldInclude) {
				// Include entire folder with all its flows (all flows in that spec version are included)
				filteredItems.push(folder);
			}
		});

		// Update description to reflect selected spec versions
		const specNames = allSpecVersions.map((spec) => {
			switch (spec) {
				case 'oauth2.0':
					return 'OAuth 2.0 Authorization Framework (RFC 6749)';
				case 'oauth2.1':
					return 'OAuth 2.1 Authorization Framework (draft)';
				case 'oidc':
					return 'OpenID Connect Core 1.0';
				default:
					return spec;
			}
		});

		return {
			...collection,
			info: {
				...collection.info,
				name: `PingOne Unified OAuth/OIDC Flows - ${specNames.join(', ')}`,
				description: `Postman collection for PingOne Unified OAuth/OIDC flows. Includes flows from: ${specNames.join(', ')}. Generated from OAuth Playground.`,
			},
			item: filteredItems,
		};
	};

	// Generate filtered MFA collection
	const generateFilteredMFACollection = (credentials: {
		environmentId?: string;
		username?: string;
	}): PostmanCollection | null => {
		if (selectedDeviceTypes.size === 0) return null;

		// Generate comprehensive MFA collection
		const collection = generateComprehensiveMFAPostmanCollection(credentials);

		// Filter items based on selected device types
		// The collection structure is: [Registration folder, Authentication folder]
		// Each folder contains items for different device types
		const filteredItems: PostmanCollectionItem[] = [];

		collection.item.forEach((folder) => {
			if (folder.item) {
				const filteredFolderItems: PostmanCollectionItem[] = [];

				folder.item.forEach((item) => {
					// Check if this item belongs to a selected device type
					const itemName = item.name.toUpperCase();
					if (selectedDeviceTypes.has(itemName as DeviceType)) {
						filteredFolderItems.push(item);
					}
				});

				if (filteredFolderItems.length > 0) {
					filteredItems.push({
						...folder,
						item: filteredFolderItems,
					});
				}
			}
		});

		// Update description to reflect selected device types
		const deviceNames = Array.from(selectedDeviceTypes).join(', ');

		return {
			...collection,
			info: {
				...collection.info,
				name: `PingOne MFA Flows - ${deviceNames}`,
				description: `Postman collection for PingOne MFA flows. Includes device types: ${deviceNames}. Generated from OAuth Playground.`,
			},
			item: filteredItems,
		};
	};

	// Handle device type toggle
	const toggleDeviceType = (deviceType: DeviceType) => {
		setSelectedDeviceTypes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(deviceType)) {
				newSet.delete(deviceType);
			} else {
				newSet.add(deviceType);
			}
			return newSet;
		});
	};

	// Select all device types
	const selectAllDeviceTypes = () => {
		setSelectedDeviceTypes(new Set(deviceTypes));
	};

	// Unselect all device types
	const unselectAllDeviceTypes = () => {
		setSelectedDeviceTypes(new Set());
	};

	// Select all Unified spec versions
	const selectAllUnifiedSpecs = () => {
		setIncludeOAuth20(true);
		setIncludeOAuth21(true);
		setIncludeOIDC(true);

		// Select all variations from all spec versions
		setSelectedUnifiedVariations((prev) => {
			const newSet = new Set(prev);
			for (const variation of getVariationsForSpec('oauth2.0')) {
				newSet.add(variation);
			}
			for (const variation of getVariationsForSpec('oauth2.1')) {
				newSet.add(variation);
			}
			for (const variation of getVariationsForSpec('oidc')) {
				newSet.add(variation);
			}
			return newSet;
		});
	};

	// Unselect all Unified spec versions
	const unselectAllUnifiedSpecs = () => {
		setIncludeOAuth20(false);
		setIncludeOAuth21(false);
		setIncludeOIDC(false);

		// Unselect all variations
		setSelectedUnifiedVariations(new Set());
	};

	// Unified variation handlers
	const toggleUnifiedVariation = (variation: UnifiedVariation) => {
		setSelectedUnifiedVariations((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(variation)) {
				newSet.delete(variation);
			} else {
				newSet.add(variation);
			}
			return newSet;
		});
	};

	const selectAllUnifiedVariations = () => {
		setSelectedUnifiedVariations(
			new Set([
				'authz-client-secret-post',
				'authz-client-secret-basic',
				'authz-client-secret-jwt',
				'authz-private-key-jwt',
				'authz-pi-flow',
				'authz-pkce',
				'authz-pkce-par',
				'implicit',
				'client-credentials',
				'device-code',
				'hybrid',
			])
		);
	};

	const unselectAllUnifiedVariations = () => {
		setSelectedUnifiedVariations(new Set());
	};

	// MFA use case handlers
	const toggleMFAUseCase = (deviceType: DeviceType, useCase: MFAUseCase) => {
		setSelectedMFAUseCases((prev) => {
			const newMap = new Map(prev);
			const currentSet = newMap.get(deviceType) || new Set<MFAUseCase>();
			const newSet = new Set(currentSet);
			if (newSet.has(useCase)) {
				newSet.delete(useCase);
			} else {
				newSet.add(useCase);
			}
			newMap.set(deviceType, newSet);
			return newMap;
		});
	};

	const selectAllMFAUseCases = (deviceType: DeviceType) => {
		setSelectedMFAUseCases((prev) => {
			const newMap = new Map(prev);
			newMap.set(
				deviceType,
				new Set<MFAUseCase>(['user-flow', 'admin-flow', 'registration', 'authentication'])
			);
			return newMap;
		});
	};

	const unselectAllMFAUseCases = (deviceType: DeviceType) => {
		setSelectedMFAUseCases((prev) => {
			const newMap = new Map(prev);
			newMap.set(deviceType, new Set<MFAUseCase>());
			return newMap;
		});
	};

	const toggleExpandedMFAUseCases = (deviceType: DeviceType) => {
		setExpandedMFAUseCases((prev) => {
			const newMap = new Map(prev);
			newMap.set(deviceType, !(newMap.get(deviceType) || false));
			return newMap;
		});
	};

	// Use case handlers
	const toggleUseCase = (useCase: UseCaseType) => {
		setSelectedUseCases((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(useCase)) {
				newSet.delete(useCase);
			} else {
				newSet.add(useCase);
			}
			return newSet;
		});
	};

	const selectAllUseCases = () => {
		setSelectedUseCases(new Set(useCaseTypes));
	};

	const unselectAllUseCases = () => {
		setSelectedUseCases(new Set());
	};

	// Use case labels mapping
	const useCaseLabels: Record<UseCaseType, string> = {
		signup: '1. Sign-up (Registration)',
		signin: '2. Sign-in',
		'mfa-enrollment': '3. MFA Enrollment',
		'mfa-challenge': '4. MFA Challenge',
		stepup: '5. Step-up Authentication',
		'password-reset': '6. Forgot Password / Password Reset',
		'account-recovery': '7. Account Recovery',
		'change-credentials': '8. Change Credentials & Factors',
		'social-login': '9. Social Login',
		federation: '10. Partner / Enterprise Federation',
		'oauth-login': '11. OIDC/OAuth Login (Web app)',
		'risk-checks': '12. Risk-based Checks',
		logout: '13. Logout',
		'user-sessions': '14. User Sessions',
		'transaction-approval': '15. Transaction Approval Flows',
		'pingone-metadata': '16. PingOne Endpoints - Metadata',
	};

	// Helper function to generate collection based on selections
	const generateCollectionBasedOnSelections = (credentials: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		username?: string;
	}): PostmanCollection | null => {
		// Ensure we only pass defined values when exactOptionalPropertyTypes is enabled
		const buildUseCaseCredentials = (): {
			environmentId?: string;
			clientId?: string;
			clientSecret?: string;
			username?: string;
		} => {
			const result: {
				environmentId?: string;
				clientId?: string;
				clientSecret?: string;
				username?: string;
			} = {};
			if (credentials.environmentId) result.environmentId = credentials.environmentId;
			if (credentials.clientId) result.clientId = credentials.clientId;
			if (credentials.clientSecret) result.clientSecret = credentials.clientSecret;
			if (credentials.username) result.username = credentials.username;
			return result;
		};

		// If only Use Cases is selected
		if (includeUseCases && !includeUnified && !includeMFA) {
			return generateUseCasesPostmanCollection(buildUseCaseCredentials(), selectedUseCases);
		}

		// If Use Cases + Unified + MFA
		if (includeUnified && includeMFA && includeUseCases) {
			const unified = generateCompletePostmanCollection(credentials);
			const useCases = generateUseCasesPostmanCollection(
				buildUseCaseCredentials(),
				selectedUseCases
			);

			const variableMap = new Map<string, { key: string; value: string; type?: string }>();
			for (const variable of unified.variable) {
				variableMap.set(variable.key, variable);
			}
			for (const variable of useCases.variable) {
				variableMap.set(variable.key, variable);
			}

			// Extract Worker Token from Use Cases collection (it's the first item)
			const workerTokenItem = useCases.item.find((item) => item.name === 'Worker Token');
			const useCasesItemsWithoutWorkerToken = useCases.item.filter(
				(item) => item.name !== 'Worker Token'
			);

			// Filter out "Use Cases" and "Worker Token" from unified.item (already extracted Worker Token from Use Cases)
			const filteredUnifiedItems = unified.item.filter(
				(item) => item.name !== 'Use Cases' && item.name !== 'Worker Token'
			);

			// Build final structure: Worker Token FIRST, then Use Cases, then Unified and MFA folders
			const finalItems: PostmanCollectionItem[] = [];
			if (workerTokenItem) {
				finalItems.push(workerTokenItem); // Worker Token at top level, first
			}
			finalItems.push(...useCasesItemsWithoutWorkerToken); // Use Cases (without Worker Token)
			finalItems.push(...filteredUnifiedItems); // Unified and MFA folders (without Worker Token and Use Cases)

			return {
				...unified,
				variable: Array.from(variableMap.values()),
				item: finalItems,
				info: {
					...unified.info,
					name: `PingOne Complete Collection - Use Cases, Unified & MFA v${COLLECTION_VERSION}`,
					description: `${unified.info.description}\n\n${useCases.info.description}`,
				},
			};
		}

		// If Unified + Use Cases
		if (includeUnified && includeUseCases && !includeMFA) {
			const unified = generateFilteredUnifiedCollection(credentials);
			const useCases = generateUseCasesPostmanCollection(
				buildUseCaseCredentials(),
				selectedUseCases
			);

			if (!unified) return null;

			const variableMap = new Map<string, { key: string; value: string; type?: string }>();
			for (const variable of unified.variable) {
				variableMap.set(variable.key, variable);
			}
			for (const variable of useCases.variable) {
				variableMap.set(variable.key, variable);
			}

			// Extract Worker Token from Use Cases collection (it's the first item)
			const workerTokenItem = useCases.item.find((item) => item.name === 'Worker Token');
			const useCasesItemsWithoutWorkerToken = useCases.item.filter(
				(item) => item.name !== 'Worker Token'
			);

			// Filter out "Use Cases" and "Worker Token" from unified.item (already extracted Worker Token from Use Cases)
			const filteredUnifiedItems = unified.item.filter(
				(item) => item.name !== 'Use Cases' && item.name !== 'Worker Token'
			);

			// Build final structure: Worker Token FIRST, then Use Cases, then Unified folders
			const finalItems: PostmanCollectionItem[] = [];
			if (workerTokenItem) {
				finalItems.push(workerTokenItem); // Worker Token at top level, first
			}
			finalItems.push(...useCasesItemsWithoutWorkerToken); // Use Cases (without Worker Token)
			finalItems.push(...filteredUnifiedItems); // Unified folders (without Worker Token and Use Cases)

			return {
				...unified,
				variable: Array.from(variableMap.values()),
				item: finalItems,
				info: {
					...unified.info,
					name: 'PingOne Unified OAuth/OIDC & Use Cases',
					description: `${unified.info.description}\n\n${useCases.info.description}`,
				},
			};
		}

		// If MFA + Use Cases
		if (includeMFA && includeUseCases && !includeUnified) {
			const mfa = generateFilteredMFACollection(credentials);
			const useCases = generateUseCasesPostmanCollection(
				buildUseCaseCredentials(),
				selectedUseCases
			);

			if (!mfa) return null;

			const variableMap = new Map<string, { key: string; value: string; type?: string }>();
			for (const variable of mfa.variable) {
				variableMap.set(variable.key, variable);
			}
			for (const variable of useCases.variable) {
				variableMap.set(variable.key, variable);
			}

			// Extract Worker Token from Use Cases collection (it's the first item)
			const workerTokenItem = useCases.item.find((item) => item.name === 'Worker Token');
			const useCasesItemsWithoutWorkerToken = useCases.item.filter(
				(item) => item.name !== 'Worker Token'
			);

			// Filter out "Worker Token" from mfa.item (already extracted Worker Token from Use Cases)
			const filteredMFAItems = mfa.item.filter((item) => item.name !== 'Worker Token');

			// Build final structure: Worker Token FIRST, then Use Cases, then MFA folders
			const finalItems: PostmanCollectionItem[] = [];
			if (workerTokenItem) {
				finalItems.push(workerTokenItem); // Worker Token at top level, first
			}
			finalItems.push(...useCasesItemsWithoutWorkerToken); // Use Cases (without Worker Token)
			finalItems.push(...filteredMFAItems); // MFA folders (without Worker Token)

			return {
				...mfa,
				variable: Array.from(variableMap.values()),
				item: finalItems,
				info: {
					...mfa.info,
					name: 'PingOne MFA & Use Cases',
					description: `${mfa.info.description}\n\n${useCases.info.description}`,
				},
			};
		}

		// If Unified + MFA (no Use Cases)
		if (includeUnified && includeMFA && !includeUseCases) {
			return generateCompletePostmanCollection(credentials);
		}

		// If only Unified
		if (includeUnified && !includeMFA && !includeUseCases) {
			return generateFilteredUnifiedCollection(credentials);
		}

		// If only MFA
		if (includeMFA && !includeUnified && !includeUseCases) {
			return generateFilteredMFACollection(credentials);
		}

		return null;
	};

	// Helper function to generate filename based on selections
	const generateFilename = (extension: 'collection.json' | 'environment.json'): string => {
		const date = new Date().toISOString().split('T')[0];
		let filename = 'pingone';

		if (includeUnified && includeMFA && includeUseCases) {
			filename += '-complete-all';
		} else if (includeUnified && includeMFA) {
			filename += '-complete-unified-mfa';
		} else if (includeUnified && includeUseCases) {
			filename += '-unified-use-cases';
			if (includeOAuth20 && !includeOAuth21 && !includeOIDC) {
				filename += '-oauth20';
			} else if (includeOAuth21 && !includeOAuth20 && !includeOIDC) {
				filename += '-oauth21';
			} else if (includeOIDC && !includeOAuth20 && !includeOAuth21) {
				filename += '-oidc';
			} else {
				filename += '-custom';
			}
		} else if (includeMFA && includeUseCases) {
			filename += '-mfa-use-cases';
			if (selectedDeviceTypes.size < 6) {
				filename += `-${Array.from(selectedDeviceTypes).join('-').toLowerCase()}`;
			}
		} else if (includeUseCases) {
			filename += '-use-cases';
		} else if (includeUnified) {
			filename += '-unified';
			if (includeOAuth20 && !includeOAuth21 && !includeOIDC) {
				filename += '-oauth20';
			} else if (includeOAuth21 && !includeOAuth20 && !includeOIDC) {
				filename += '-oauth21';
			} else if (includeOIDC && !includeOAuth20 && !includeOAuth21) {
				filename += '-oidc';
			} else {
				filename += '-custom';
			}
		} else if (includeMFA) {
			filename += '-mfa';
			if (selectedDeviceTypes.size < 6) {
				filename += `-${Array.from(selectedDeviceTypes).join('-').toLowerCase()}`;
			}
		}

		filename += `-${date}-${extension}`;
		return filename;
	};

	// Generate and download collection
	const handleGenerateCollection = async () => {
		if (!includeUnified && !includeMFA && !includeUseCases) {
			toastV8.error('Please select at least one collection type (Use Cases, Unified, or MFA)');
			return;
		}

		// Validate Unified selection if included
		if (includeUnified && !includeOAuth20 && !includeOAuth21 && !includeOIDC) {
			toastV8.error(
				'Please select at least one Unified spec version (OAuth 2.0 Authorization Framework (RFC 6749), OpenID Connect Core 1.0, or OAuth 2.1 Authorization Framework (draft))'
			);
			return;
		}

		// Validate MFA selection if included
		if (includeMFA && selectedDeviceTypes.size === 0) {
			toastV8.error('Please select at least one MFA device type');
			return;
		}

		// Validate Use Cases selection if included
		if (includeUseCases && selectedUseCases.size === 0) {
			toastV8.error('Please select at least one Use Case');
			return;
		}

		// Validate credentials
		const credentials = getCredentials();
		if (!validateCredentials(credentials)) {
			return;
		}

		setIsGenerating(true);
		try {
			const collection = generateCollectionBasedOnSelections(credentials);

			if (!collection) {
				toastV8.error('Failed to generate collection. Please check your selections.');
				return;
			}

			// Generate filename
			const filename = generateFilename('collection.json');
			const environmentName = `${collection.info.name} Environment`;

			// Download
			downloadPostmanCollectionWithEnvironment(collection, filename, environmentName);

			toastV8.success(
				'Postman collection and environment downloaded! Import both files into Postman.'
			);
		} catch (error) {
			console.error(`${MODULE_TAG} Error generating collection:`, error);
			toastV8.error('Failed to generate Postman collection. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	// Download only the collection file (without environment)
	const handleDownloadCollectionOnly = async () => {
		if (!includeUnified && !includeMFA && !includeUseCases) {
			toastV8.error('Please select at least one collection type (Use Cases, Unified, or MFA)');
			return;
		}

		if (includeUnified && !includeOAuth20 && !includeOAuth21 && !includeOIDC) {
			toastV8.error(
				'Please select at least one Unified spec version (OAuth 2.0 Authorization Framework (RFC 6749), OpenID Connect Core 1.0, or OAuth 2.1 Authorization Framework (draft))'
			);
			return;
		}

		if (includeMFA && selectedDeviceTypes.size === 0) {
			toastV8.error('Please select at least one MFA device type');
			return;
		}

		if (includeUseCases && selectedUseCases.size === 0) {
			toastV8.error('Please select at least one Use Case');
			return;
		}

		// Validate credentials
		const credentials = getCredentials();
		if (!validateCredentials(credentials)) {
			return;
		}

		setIsGenerating(true);
		try {
			const collection = generateCollectionBasedOnSelections(credentials);

			if (!collection) {
				toastV8.error('Failed to generate collection. Please check your selections.');
				return;
			}

			// Generate filename
			const filename = generateFilename('collection.json');

			// Download only the collection file
			downloadPostmanCollection(collection, filename);

			toastV8.success('Postman collection downloaded! Import into Postman to use the collection.');
		} catch (error) {
			console.error(`${MODULE_TAG} Error generating collection:`, error);
			toastV8.error('Failed to generate Postman collection. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	// Download only the environment/variables file
	const handleDownloadVariables = async () => {
		if (!includeUnified && !includeMFA && !includeUseCases) {
			toastV8.error('Please select at least one collection type (Use Cases, Unified, or MFA)');
			return;
		}

		if (includeUnified && !includeOAuth20 && !includeOAuth21 && !includeOIDC) {
			toastV8.error(
				'Please select at least one Unified spec version (OAuth 2.0 Authorization Framework (RFC 6749), OpenID Connect Core 1.0, or OAuth 2.1 Authorization Framework (draft))'
			);
			return;
		}

		if (includeMFA && selectedDeviceTypes.size === 0) {
			toastV8.error('Please select at least one MFA device type');
			return;
		}

		if (includeUseCases && selectedUseCases.size === 0) {
			toastV8.error('Please select at least one Use Case');
			return;
		}

		// Validate credentials
		const credentials = getCredentials();
		if (!validateCredentials(credentials)) {
			return;
		}

		setIsGenerating(true);
		try {
			const collection = generateCollectionBasedOnSelections(credentials);

			if (!collection) {
				toastV8.error('Failed to generate environment. Please check your selections.');
				return;
			}

			// Generate filename
			const filename = generateFilename('environment.json');

			const environmentName = `${collection.info.name} Environment`;

			// Generate and download only the environment file
			const environment = generatePostmanEnvironment(collection, environmentName);
			downloadPostmanEnvironment(environment, filename);

			toastV8.success(
				'Postman environment/variables file downloaded! Import into Postman to use the variables.'
			);
		} catch (error) {
			console.error(`${MODULE_TAG} Error generating environment:`, error);
			toastV8.error('Failed to generate Postman environment. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const deviceTypes: DeviceType[] = ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'];

	// Quick download handlers
	const handleQuickDownloadMFAOnly = async () => {
		const credentials = getCredentials();
		if (!validateCredentials(credentials)) {
			return;
		}

		setIsGenerating(true);
		try {
			const collection = generateComprehensiveMFAPostmanCollection(credentials);
			const date = new Date().toISOString().split('T')[0];
			const filename = `pingone-mfa-all-${date}-collection.json`;
			const environmentName = `${collection.info.name} Environment`;
			downloadPostmanCollectionWithEnvironment(collection, filename, environmentName);
			toastV8.success('MFA Flows Postman collection downloaded!');
		} catch (error) {
			console.error(`${MODULE_TAG} Error downloading MFA collection:`, error);
			toastV8.error('Failed to download MFA collection. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleQuickDownloadComplete = async () => {
		const credentials = getCredentials();
		if (!validateCredentials(credentials)) {
			return;
		}

		setIsGenerating(true);
		try {
			const collection = generateCompletePostmanCollection(credentials);
			const date = new Date().toISOString().split('T')[0];
			const filename = `pingone-complete-unified-mfa-${date}-collection.json`;
			const environmentName = `${collection.info.name} Environment`;
			downloadPostmanCollectionWithEnvironment(collection, filename, environmentName);
			toastV8.success('Complete Collection downloaded!');
		} catch (error) {
			console.error(`${MODULE_TAG} Error downloading complete collection:`, error);
			toastV8.error('Failed to download complete collection. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div
			style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '2rem',
				background: '#f8fafc',
				minHeight: '100vh',
			}}
		>
			{/* Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
					color: 'white',
					padding: '2rem',
					borderRadius: '12px',
					marginBottom: '2rem',
					boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
				}}
			>
				<h1
					style={{
						margin: 0,
						fontSize: '2rem',
						fontWeight: '700',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					<FiPackage size={32} />
					Postman Collection Generator
					<span
						style={{
							fontSize: '1.2rem',
							fontWeight: '900',
							color: '#dc2626',
							marginLeft: '8px',
							backgroundColor: '#fef2f2',
							padding: '4px 8px',
							borderRadius: '6px',
							border: '1px solid #fecaca',
						}}
					>
						v{COLLECTION_VERSION}
					</span>
				</h1>
				<p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
					Generate custom Postman collections for PingOne OAuth/OIDC and MFA flows
				</p>
			</div>

			{/* Collection Type Selection */}
			<div
				style={{
					background: 'white',
					padding: '2rem',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					marginBottom: '2rem',
				}}
			>
				<h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
					Collection Type
				</h2>
				<div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							cursor: 'pointer',
							padding: '12px 20px',
							border: `2px solid ${includeUseCases ? '#8b5cf6' : '#e5e7eb'}`,
							borderRadius: '8px',
							background: includeUseCases ? '#f3f4f6' : 'white',
							transition: 'all 0.2s',
						}}
					>
						<input
							type="checkbox"
							checked={includeUseCases}
							onChange={(e) => setIncludeUseCases(e.target.checked)}
							style={{ width: '20px', height: '20px', cursor: 'pointer' }}
						/>
						<span style={{ fontSize: '1rem', fontWeight: '500' }}>Use Cases</span>
					</label>
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							cursor: 'pointer',
							padding: '12px 20px',
							border: `2px solid ${includeUnified ? '#8b5cf6' : '#e5e7eb'}`,
							borderRadius: '8px',
							background: includeUnified ? '#f3f4f6' : 'white',
							transition: 'all 0.2s',
						}}
					>
						<input
							type="checkbox"
							checked={includeUnified}
							onChange={(e) => setIncludeUnified(e.target.checked)}
							style={{ width: '20px', height: '20px', cursor: 'pointer' }}
						/>
						<span style={{ fontSize: '1rem', fontWeight: '500' }}>Unified OAuth/OIDC Flows</span>
					</label>
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							cursor: 'pointer',
							padding: '12px 20px',
							border: `2px solid ${includeMFA ? '#8b5cf6' : '#e5e7eb'}`,
							borderRadius: '8px',
							background: includeMFA ? '#f3f4f6' : 'white',
							transition: 'all 0.2s',
						}}
					>
						<input
							type="checkbox"
							checked={includeMFA}
							onChange={(e) => setIncludeMFA(e.target.checked)}
							style={{ width: '20px', height: '20px', cursor: 'pointer' }}
						/>
						<span style={{ fontSize: '1rem', fontWeight: '500' }}>MFA Flows</span>
					</label>
				</div>
			</div>

			{/* Use Cases Selection */}
			{includeUseCases && (
				<div
					style={{
						background: 'white',
						padding: '2rem',
						borderRadius: '12px',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
						marginBottom: '2rem',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1.5rem',
						}}
					>
						<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
							Use Cases Selection
						</h2>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<button
								type="button"
								onClick={selectAllUseCases}
								style={{
									padding: '6px 12px',
									border: '1px solid #10b981',
									borderRadius: '6px',
									background: 'white',
									color: '#10b981',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#ecfdf5';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'white';
								}}
							>
								Select All
							</button>
							<button
								type="button"
								onClick={unselectAllUseCases}
								style={{
									padding: '6px 12px',
									border: '1px solid #ef4444',
									borderRadius: '6px',
									background: 'white',
									color: '#ef4444',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#fef2f2';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'white';
								}}
							>
								Unselect All
							</button>
						</div>
					</div>
					<p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>
						Select which customer identity flow use cases to include:
					</p>
					<button
						type="button"
						onClick={() => setExpandedUseCases(!expandedUseCases)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '8px 0',
							fontSize: '1rem',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '1rem',
						}}
					>
						{expandedUseCases ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
						<span>
							Use Cases ({selectedUseCases.size} of {useCaseTypes.length} selected)
						</span>
					</button>
					{expandedUseCases && (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '0.75rem',
								paddingLeft: '1.5rem',
							}}
						>
							{useCaseTypes.map((useCase) => (
								<label
									key={useCase}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										cursor: 'pointer',
										padding: '8px 12px',
										border: `1px solid ${selectedUseCases.has(useCase) ? '#10b981' : '#e5e7eb'}`,
										borderRadius: '6px',
										background: selectedUseCases.has(useCase) ? '#ecfdf5' : 'white',
										transition: 'all 0.2s',
									}}
								>
									<input
										type="checkbox"
										checked={selectedUseCases.has(useCase)}
										onChange={() => toggleUseCase(useCase)}
										style={{ width: '16px', height: '16px', cursor: 'pointer' }}
									/>
									<span style={{ fontSize: '0.9rem' }}>{useCaseLabels[useCase]}</span>
								</label>
							))}
						</div>
					)}
				</div>
			)}

			{/* Unified Spec Version Selection */}
			{includeUnified && (
				<div
					style={{
						background: 'white',
						padding: '2rem',
						borderRadius: '12px',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
						marginBottom: '2rem',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1.5rem',
						}}
					>
						<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
							Unified Spec Versions
						</h2>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<button
								type="button"
								onClick={selectAllUnifiedSpecs}
								style={{
									padding: '6px 12px',
									border: '1px solid #3b82f6',
									borderRadius: '6px',
									background: 'white',
									color: '#3b82f6',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#eff6ff';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'white';
								}}
							>
								Select All
							</button>
							<button
								type="button"
								onClick={unselectAllUnifiedSpecs}
								style={{
									padding: '6px 12px',
									border: '1px solid #ef4444',
									borderRadius: '6px',
									background: 'white',
									color: '#ef4444',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#fef2f2';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'white';
								}}
							>
								Unselect All
							</button>
						</div>
					</div>
					<p style={{ marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
						Select which OAuth/OIDC specification versions to include:
					</p>
					<div
						style={{
							marginBottom: '1rem',
							padding: '12px',
							background: '#f0f9ff',
							border: '1px solid #bfdbfe',
							borderRadius: '6px',
							fontSize: '0.875rem',
							color: '#1e40af',
						}}
					>
						<strong style={{ display: 'block', marginBottom: '6px' }}>
							📚 Understanding Protocol Names:
						</strong>
						<ul style={{ margin: '0 0 0 20px', padding: 0, lineHeight: '1.6' }}>
							<li>
								<strong>OAuth 2.0 Authorization Framework (RFC 6749):</strong> Baseline OAuth
								framework standard. Provides authorization without authentication. Supports all flow
								types.
							</li>
							<li>
								<strong>OpenID Connect Core 1.0:</strong> Authentication layer on top of OAuth 2.0.
								Adds ID Tokens, openid scope, UserInfo endpoint, and user authentication.
							</li>
							<li>
								<strong>OAuth 2.1 Authorization Framework (draft):</strong> Consolidated OAuth
								specification (IETF draft). Removes deprecated flows (Implicit, ROPC) and enforces
								modern security practices (PKCE required, HTTPS enforced).{' '}
								<em>Note: Still an Internet-Draft, not yet an RFC.</em>
							</li>
							<li>
								<strong>When using OAuth 2.1 with OpenID Connect:</strong> This means "OpenID
								Connect Core 1.0 using Authorization Code + PKCE (OAuth 2.1 (draft) baseline)".
							</li>
						</ul>
					</div>
					<div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								padding: '10px 16px',
								border: `2px solid ${includeOAuth20 ? '#3b82f6' : '#e5e7eb'}`,
								borderRadius: '8px',
								background: includeOAuth20 ? '#eff6ff' : 'white',
								transition: 'all 0.2s',
							}}
						>
							<input
								type="checkbox"
								checked={includeOAuth20}
								onChange={(e) => handleSpecVersionChange('oauth2.0', e.target.checked)}
								style={{ width: '18px', height: '18px', cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
								OAuth 2.0
								<br />
								<span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#6b7280' }}>
									(RFC 6749)
								</span>
							</span>
						</label>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								padding: '10px 16px',
								border: `2px solid ${includeOIDC ? '#3b82f6' : '#e5e7eb'}`,
								borderRadius: '8px',
								background: includeOIDC ? '#eff6ff' : 'white',
								transition: 'all 0.2s',
							}}
						>
							<input
								type="checkbox"
								checked={includeOIDC}
								onChange={(e) => handleSpecVersionChange('oidc', e.target.checked)}
								style={{ width: '18px', height: '18px', cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
								OpenID Connect
								<br />
								<span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#6b7280' }}>
									Core 1.0
								</span>
							</span>
						</label>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								cursor: 'pointer',
								padding: '10px 16px',
								border: `2px solid ${includeOAuth21 ? '#3b82f6' : '#e5e7eb'}`,
								borderRadius: '8px',
								background: includeOAuth21 ? '#eff6ff' : 'white',
								transition: 'all 0.2s',
							}}
						>
							<input
								type="checkbox"
								checked={includeOAuth21}
								onChange={(e) => handleSpecVersionChange('oauth2.1', e.target.checked)}
								style={{ width: '18px', height: '18px', cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
								OAuth 2.1 (draft)
								<br />
								<span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#6b7280' }}>
									with OIDC Core 1.0
								</span>
							</span>
						</label>
					</div>

					{/* Unified Flow Variations */}
					<div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<button
								type="button"
								onClick={() => setExpandedUnifiedVariations(!expandedUnifiedVariations)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: '8px 0',
									fontSize: '1rem',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								{expandedUnifiedVariations ? (
									<FiChevronDown size={20} />
								) : (
									<FiChevronRight size={20} />
								)}
								<span>Select Specific Flow Variations</span>
							</button>
							{expandedUnifiedVariations && (
								<div style={{ display: 'flex', gap: '0.5rem' }}>
									<button
										type="button"
										onClick={selectAllUnifiedVariations}
										style={{
											padding: '6px 12px',
											border: '1px solid #3b82f6',
											borderRadius: '6px',
											background: 'white',
											color: '#3b82f6',
											fontSize: '0.875rem',
											fontWeight: '500',
											cursor: 'pointer',
											transition: 'all 0.2s',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = '#eff6ff';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = 'white';
										}}
									>
										Select All
									</button>
									<button
										type="button"
										onClick={unselectAllUnifiedVariations}
										style={{
											padding: '6px 12px',
											border: '1px solid #ef4444',
											borderRadius: '6px',
											background: 'white',
											color: '#ef4444',
											fontSize: '0.875rem',
											fontWeight: '500',
											cursor: 'pointer',
											transition: 'all 0.2s',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = '#fef2f2';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = 'white';
										}}
									>
										Unselect All
									</button>
								</div>
							)}
						</div>
						{expandedUnifiedVariations && (
							<div style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
									{[
										{
											key: 'authz-client-secret-post',
											label: 'Authorization Code - Client Secret Post',
										},
										{
											key: 'authz-client-secret-basic',
											label: 'Authorization Code - Client Secret Basic',
										},
										{
											key: 'authz-client-secret-jwt',
											label: 'Authorization Code - Client Secret JWT',
										},
										{ key: 'authz-private-key-jwt', label: 'Authorization Code - Private Key JWT' },
										{ key: 'authz-pi-flow', label: 'Authorization Code - with pi.flow' },
										{ key: 'authz-pkce', label: 'Authorization Code - with PKCE' },
										{ key: 'authz-pkce-par', label: 'Authorization Code - with PKCE and PAR' },
										{ key: 'implicit', label: 'Implicit Flow' },
										{ key: 'client-credentials', label: 'Client Credentials Flow' },
										{ key: 'device-code', label: 'Device Code Flow' },
										{ key: 'hybrid', label: 'Hybrid Flow' },
									].map((variation) => (
										<label
											key={variation.key}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
												padding: '8px 12px',
												border: `1px solid ${selectedUnifiedVariations.has(variation.key as UnifiedVariation) ? '#3b82f6' : '#e5e7eb'}`,
												borderRadius: '6px',
												background: selectedUnifiedVariations.has(variation.key as UnifiedVariation)
													? '#eff6ff'
													: 'white',
												transition: 'all 0.2s',
											}}
										>
											<input
												type="checkbox"
												checked={selectedUnifiedVariations.has(variation.key as UnifiedVariation)}
												onChange={() => toggleUnifiedVariation(variation.key as UnifiedVariation)}
												style={{ width: '16px', height: '16px', cursor: 'pointer' }}
											/>
											<span style={{ fontSize: '0.9rem' }}>{variation.label}</span>
										</label>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* MFA Device Type Selection */}
			{includeMFA && (
				<div
					style={{
						background: 'white',
						padding: '2rem',
						borderRadius: '12px',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
						marginBottom: '2rem',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1.5rem',
						}}
					>
						<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>MFA Device Types</h2>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<button
								type="button"
								onClick={selectAllDeviceTypes}
								style={{
									padding: '6px 12px',
									border: '1px solid #10b981',
									borderRadius: '6px',
									background: 'white',
									color: '#10b981',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#ecfdf5';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'white';
								}}
							>
								Select All
							</button>
							<button
								type="button"
								onClick={unselectAllDeviceTypes}
								style={{
									padding: '6px 12px',
									border: '1px solid #ef4444',
									borderRadius: '6px',
									background: 'white',
									color: '#ef4444',
									fontSize: '0.875rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = '#fef2f2';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'white';
								}}
							>
								Unselect All
							</button>
						</div>
					</div>
					<p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>
						Select which MFA device types to include:
					</p>
					<button
						type="button"
						onClick={() => setExpandedMFADeviceList(!expandedMFADeviceList)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '8px 0',
							fontSize: '1rem',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '1rem',
						}}
					>
						{expandedMFADeviceList ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
						<span>Device Types</span>
					</button>
					{expandedMFADeviceList && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
							{deviceTypes.map((deviceType) => {
								const isSelected = selectedDeviceTypes.has(deviceType);
								const isExpanded = expandedMFAUseCases.get(deviceType) || false;
								const useCases = selectedMFAUseCases.get(deviceType) || new Set<MFAUseCase>();
								return (
									<div key={deviceType}>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
												padding: '8px 12px',
												border: `1px solid ${isSelected ? '#10b981' : '#e5e7eb'}`,
												borderRadius: '6px',
												background: isSelected ? '#ecfdf5' : 'white',
												transition: 'all 0.2s',
											}}
										>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => toggleDeviceType(deviceType)}
												style={{ width: '16px', height: '16px', cursor: 'pointer' }}
											/>
											<span style={{ fontSize: '0.9rem', flex: 1 }}>{deviceType}</span>
											{isSelected && (
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														toggleExpandedMFAUseCases(deviceType);
													}}
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '4px',
														padding: '4px 8px',
														border: '1px solid #10b981',
														borderRadius: '4px',
														background: 'white',
														color: '#10b981',
														cursor: 'pointer',
														fontSize: '0.75rem',
														fontWeight: '500',
													}}
												>
													{isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
													<span>Use Cases</span>
												</button>
											)}
										</label>
										{isSelected && isExpanded && (
											<div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
												<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
													<button
														type="button"
														onClick={() => selectAllMFAUseCases(deviceType)}
														style={{
															padding: '4px 8px',
															border: '1px solid #10b981',
															borderRadius: '4px',
															background: 'white',
															color: '#10b981',
															fontSize: '0.75rem',
															fontWeight: '500',
															cursor: 'pointer',
														}}
													>
														Select All
													</button>
													<button
														type="button"
														onClick={() => unselectAllMFAUseCases(deviceType)}
														style={{
															padding: '4px 8px',
															border: '1px solid #ef4444',
															borderRadius: '4px',
															background: 'white',
															color: '#ef4444',
															fontSize: '0.75rem',
															fontWeight: '500',
															cursor: 'pointer',
														}}
													>
														Unselect All
													</button>
												</div>
												<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
													{[
														{
															key: 'user-flow',
															label: 'User Flow (OAuth login, ACTIVATION_REQUIRED)',
														},
														{ key: 'admin-flow', label: 'Admin Flow (Worker token, ACTIVE)' },
														{ key: 'registration', label: 'Registration' },
														{ key: 'authentication', label: 'Authentication' },
													].map((useCase) => (
														<label
															key={useCase.key}
															style={{
																display: 'flex',
																alignItems: 'center',
																gap: '8px',
																cursor: 'pointer',
																padding: '6px 10px',
																border: `1px solid ${useCases.has(useCase.key as MFAUseCase) ? '#10b981' : '#e5e7eb'}`,
																borderRadius: '6px',
																background: useCases.has(useCase.key as MFAUseCase)
																	? '#ecfdf5'
																	: 'white',
																transition: 'all 0.2s',
															}}
														>
															<input
																type="checkbox"
																checked={useCases.has(useCase.key as MFAUseCase)}
																onChange={() =>
																	toggleMFAUseCase(deviceType, useCase.key as MFAUseCase)
																}
																style={{ width: '16px', height: '16px', cursor: 'pointer' }}
															/>
															<span style={{ fontSize: '0.85rem' }}>{useCase.label}</span>
														</label>
													))}
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Generate Button */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					gap: '16px',
					marginTop: '2rem',
					flexWrap: 'wrap',
				}}
			>
				<button
					type="button"
					onClick={handleGenerateCollection}
					disabled={isGenerating}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						padding: '16px 32px',
						background: isGenerating ? '#9ca3af' : '#8b5cf6',
						color: 'white',
						border: 'none',
						borderRadius: '10px',
						fontSize: '1.1rem',
						fontWeight: '600',
						cursor: isGenerating ? 'not-allowed' : 'pointer',
						boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
						transition: 'all 0.2s',
					}}
					onMouseEnter={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#7c3aed';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
						}
					}}
					onMouseLeave={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#8b5cf6';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
						}
					}}
					title="Download both Postman collection and environment files"
				>
					{isGenerating ? (
						<>
							<div
								style={{
									width: '20px',
									height: '20px',
									border: '3px solid rgba(255, 255, 255, 0.3)',
									borderTop: '3px solid white',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							/>
							Generating...
						</>
					) : (
						<>
							<FiDownload size={20} />
							Download Collection + Variables
						</>
					)}
				</button>
				<button
					type="button"
					onClick={handleDownloadCollectionOnly}
					disabled={isGenerating}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						padding: '16px 32px',
						background: isGenerating ? '#9ca3af' : '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '10px',
						fontSize: '1.1rem',
						fontWeight: '600',
						cursor: isGenerating ? 'not-allowed' : 'pointer',
						boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
						transition: 'all 0.2s',
					}}
					onMouseEnter={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#2563eb';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
						}
					}}
					onMouseLeave={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#3b82f6';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
						}
					}}
					title="Download only the Postman collection file (without environment)"
				>
					{isGenerating ? (
						<>
							<div
								style={{
									width: '20px',
									height: '20px',
									border: '3px solid rgba(255, 255, 255, 0.3)',
									borderTop: '3px solid white',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							/>
							Generating...
						</>
					) : (
						<>
							<FiPackage size={20} />
							Download Collection Only
						</>
					)}
				</button>
				<button
					type="button"
					onClick={handleDownloadVariables}
					disabled={isGenerating}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						padding: '16px 32px',
						background: isGenerating ? '#9ca3af' : '#10b981',
						color: 'white',
						border: 'none',
						borderRadius: '10px',
						fontSize: '1.1rem',
						fontWeight: '600',
						cursor: isGenerating ? 'not-allowed' : 'pointer',
						boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
						transition: 'all 0.2s',
					}}
					onMouseEnter={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#059669';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
						}
					}}
					onMouseLeave={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#10b981';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
						}
					}}
					title="Download only the Postman environment/variables file (without the collection)"
				>
					{isGenerating ? (
						<>
							<div
								style={{
									width: '20px',
									height: '20px',
									border: '3px solid rgba(255, 255, 255, 0.3)',
									borderTop: '3px solid white',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							/>
							Generating...
						</>
					) : (
						<>
							<FiPackage size={20} />
							Download Variables Only
						</>
					)}
				</button>
			</div>

			{/* Info Section */}
			<div
				style={{
					background: 'white',
					padding: '2rem',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					marginTop: '2rem',
				}}
			>
				<h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '600' }}>
					What's Included
				</h3>
				<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', lineHeight: '1.8' }}>
					<li>Educational comments on every API request</li>
					<li>Automatic variable extraction scripts</li>
					<li>Complete OAuth login steps for user flows</li>
					<li>Validated API calls matching PingOne documentation</li>
					<li>Both collection and environment files for easy import</li>
					<li>
						<strong>Version {COLLECTION_VERSION}</strong> - Check collection info for update
						tracking
					</li>
				</ul>
			</div>

			{/* Quick Download Buttons - Bottom of Page */}
			<div
				style={{
					background: 'white',
					padding: '2rem',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					marginTop: '2rem',
					display: 'flex',
					gap: '1rem',
					justifyContent: 'center',
					flexWrap: 'wrap',
				}}
			>
				<button
					type="button"
					onClick={handleQuickDownloadMFAOnly}
					disabled={isGenerating}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						padding: '16px 32px',
						background: isGenerating ? '#9ca3af' : '#8b5cf6',
						color: 'white',
						border: 'none',
						borderRadius: '10px',
						fontSize: '1.1rem',
						fontWeight: '600',
						cursor: isGenerating ? 'not-allowed' : 'pointer',
						boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
						transition: 'all 0.2s',
					}}
					onMouseEnter={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#7c3aed';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
						}
					}}
					onMouseLeave={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#8b5cf6';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
						}
					}}
				>
					<FiPackage size={20} />
					Download All MFA Flows Postman Collection
				</button>
				<button
					type="button"
					onClick={handleQuickDownloadComplete}
					disabled={isGenerating}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						padding: '16px 32px',
						background: isGenerating ? '#9ca3af' : '#10b981',
						color: 'white',
						border: 'none',
						borderRadius: '10px',
						fontSize: '1.1rem',
						fontWeight: '600',
						cursor: isGenerating ? 'not-allowed' : 'pointer',
						boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
						transition: 'all 0.2s',
					}}
					onMouseEnter={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#059669';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
						}
					}}
					onMouseLeave={(e) => {
						if (!isGenerating) {
							e.currentTarget.style.background = '#10b981';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
						}
					}}
				>
					<FiPackage size={20} />
					Download Complete Collection (Unified + MFA)
				</button>
			</div>

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
};
