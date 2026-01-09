/**
 * @file PostmanCollectionGenerator.tsx
 * @module pages
 * @description Dedicated page for generating custom Postman collections
 * @version 8.0.0
 * 
 * Allows users to select:
 * - All collections (Unified + MFA)
 * - Just MFA (all or individual device types)
 * - Just Unified (all, OAuth 2.0, OAuth 2.1, OIDC, or combinations)
 */

import React, { useState } from 'react';
import { FiPackage, FiDownload, FiCheck, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { usePageScroll } from '@/hooks/usePageScroll';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { SpecVersionServiceV8, type SpecVersion, type FlowType } from '@/v8/services/specVersionServiceV8';
import {
	generateComprehensiveUnifiedPostmanCollection,
	generateComprehensiveMFAPostmanCollection,
	generateCompletePostmanCollection,
	downloadPostmanCollectionWithEnvironment,
	type PostmanCollection,
} from '@/services/postmanCollectionGeneratorV8';
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

export const PostmanCollectionGenerator: React.FC = () => {
	usePageScroll({ pageName: 'Postman Collection Generator', force: true });

	// Collection type selection
	const [includeUnified, setIncludeUnified] = useState(true);
	const [includeMFA, setIncludeMFA] = useState(true);

	// Unified spec version selection
	const [includeOAuth20, setIncludeOAuth20] = useState(true);
	const [includeOAuth21, setIncludeOAuth21] = useState(true);
	const [includeOIDC, setIncludeOIDC] = useState(true);

	// Unified variation selection (multiselect)
	const [selectedUnifiedVariations, setSelectedUnifiedVariations] = useState<Set<UnifiedVariation>>(
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
		new Map(['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'].map((dt) => [dt as DeviceType, false]))
	);

	const [isGenerating, setIsGenerating] = useState(false);

	// Get credentials
	const getCredentials = () => {
		const environmentId = EnvironmentIdServiceV8.getEnvironmentId();
		const flowKey = 'oauth-authz-v8u';
		
		// Get flow config with proper fallback
		let config = CredentialsServiceV8.getFlowConfig(flowKey);
		if (!config) {
			config = {
				flowKey,
				flowType: 'oauth' as const,
				includeClientSecret: true,
				includeScopes: true,
				includeRedirectUri: true,
				includeLogoutUri: false,
			};
		}
		
		const unifiedCreds = CredentialsServiceV8.loadCredentials(flowKey, config);
		
		// Load MFA credentials with proper flowKey and config
		const mfaFlowKey = 'mfa-flow-v8';
		const mfaConfig = CredentialsServiceV8.getFlowConfig(mfaFlowKey) || {
			flowKey: mfaFlowKey,
			flowType: 'oidc' as const,
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		};
		const mfaCreds = CredentialsServiceV8.loadCredentials(mfaFlowKey, mfaConfig);

		return {
			environmentId: environmentId || unifiedCreds?.environmentId || mfaCreds?.environmentId,
			clientId: unifiedCreds?.clientId,
			clientSecret: unifiedCreds?.clientSecret,
			username: mfaCreds?.username,
		};
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
		allSpecVersions.forEach((spec) => {
			SpecVersionServiceV8.getAvailableFlows(spec).forEach((flow) => allFlows.add(flow));
		});

		// Generate comprehensive collection
		const collection = generateComprehensiveUnifiedPostmanCollection(credentials);

		// Filter items based on selected spec versions
		// The collection structure is: [Registration folder, Authentication folder]
		// Each folder contains items for different flows
		const filteredItems: PostmanCollectionItem[] = [];

		collection.item.forEach((folder) => {
			if (folder.item) {
				const filteredFolderItems: PostmanCollectionItem[] = [];

				folder.item.forEach((item) => {
					// Check if this item belongs to a selected flow
					const itemName = item.name.toLowerCase();
					let shouldInclude = false;

					// Check each flow type
					if (allFlows.has('oauth-authz')) {
						if (itemName.includes('authorization code') || itemName.includes('authz')) {
							shouldInclude = true;
						}
					}
					if (allFlows.has('implicit')) {
						if (itemName.includes('implicit')) {
							shouldInclude = true;
						}
					}
					if (allFlows.has('client-credentials')) {
						if (itemName.includes('client credentials')) {
							shouldInclude = true;
						}
					}
					if (allFlows.has('device-code')) {
						if (itemName.includes('device code') || itemName.includes('device-code')) {
							shouldInclude = true;
						}
					}
					if (allFlows.has('hybrid')) {
						if (itemName.includes('hybrid')) {
							shouldInclude = true;
						}
					}

					// Also check nested items (for Authorization Code variations)
					if (item.item) {
						const filteredNestedItems = item.item.filter(() => {
							// Authorization Code variations are always included if oauth-authz is selected
							return allFlows.has('oauth-authz');
						});

						if (filteredNestedItems.length > 0) {
							filteredFolderItems.push({
								...item,
								item: filteredNestedItems,
							});
							shouldInclude = true;
						}
					} else if (shouldInclude) {
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

		// Update description to reflect selected spec versions
		const specNames = allSpecVersions.map((spec) => {
			switch (spec) {
				case 'oauth2.0':
					return 'OAuth 2.0';
				case 'oauth2.1':
					return 'OAuth 2.1';
				case 'oidc':
					return 'OpenID Connect';
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
	};

	// Unselect all Unified spec versions
	const unselectAllUnifiedSpecs = () => {
		setIncludeOAuth20(false);
		setIncludeOAuth21(false);
		setIncludeOIDC(false);
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
			newMap.set(deviceType, new Set<MFAUseCase>(['user-flow', 'admin-flow', 'registration', 'authentication']));
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

	// Generate and download collection
	const handleGenerateCollection = async () => {
		if (!includeUnified && !includeMFA) {
			toastV8.error('Please select at least one collection type (Unified or MFA)');
			return;
		}

		if (includeUnified && !includeOAuth20 && !includeOAuth21 && !includeOIDC) {
			toastV8.error('Please select at least one Unified spec version (OAuth 2.0, OAuth 2.1, or OIDC)');
			return;
		}

		if (includeMFA && selectedDeviceTypes.size === 0) {
			toastV8.error('Please select at least one MFA device type');
			return;
		}

		setIsGenerating(true);
		try {
			const credentials = getCredentials();

			let collection: PostmanCollection | null = null;

			if (includeUnified && includeMFA) {
				// Generate complete collection (both)
				collection = generateCompletePostmanCollection(credentials);
			} else if (includeUnified) {
				// Generate only Unified
				collection = generateFilteredUnifiedCollection(credentials);
			} else if (includeMFA) {
				// Generate only MFA
				collection = generateFilteredMFACollection(credentials);
			}

			if (!collection) {
				toastV8.error('Failed to generate collection. Please check your selections.');
				return;
			}

			// Generate filename
			const date = new Date().toISOString().split('T')[0];
			let filename = 'pingone';
			if (includeUnified && includeMFA) {
				filename += '-complete-unified-mfa';
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
			filename += `-${date}-collection.json`;

			const environmentName = `${collection.info.name} Environment`;

			// Download
			downloadPostmanCollectionWithEnvironment(collection, filename, environmentName);

			toastV8.success('Postman collection and environment downloaded! Import both files into Postman.');
		} catch (error) {
			console.error(`${MODULE_TAG} Error generating collection:`, error);
			toastV8.error('Failed to generate Postman collection. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const deviceTypes: DeviceType[] = ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'];

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
				<h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
					<FiPackage size={32} />
					Postman Collection Generator
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
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
					<p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>
						Select which OAuth/OIDC specification versions to include:
					</p>
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
								onChange={(e) => setIncludeOAuth20(e.target.checked)}
								style={{ width: '18px', height: '18px', cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '0.95rem', fontWeight: '500' }}>OAuth 2.0</span>
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
								onChange={(e) => setIncludeOAuth21(e.target.checked)}
								style={{ width: '18px', height: '18px', cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '0.95rem', fontWeight: '500' }}>OAuth 2.1</span>
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
								onChange={(e) => setIncludeOIDC(e.target.checked)}
								style={{ width: '18px', height: '18px', cursor: 'pointer' }}
							/>
							<span style={{ fontSize: '0.95rem', fontWeight: '500' }}>OpenID Connect (OIDC)</span>
						</label>
					</div>

					{/* Unified Flow Variations */}
					<div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
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
							{expandedUnifiedVariations ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
							<span>Select Specific Flow Variations</span>
						</button>
						{expandedUnifiedVariations && (
							<div style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
								<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
									<button
										type="button"
										onClick={selectAllUnifiedVariations}
										style={{
											padding: '4px 8px',
											border: '1px solid #3b82f6',
											borderRadius: '4px',
											background: 'white',
											color: '#3b82f6',
											fontSize: '0.75rem',
											fontWeight: '500',
											cursor: 'pointer',
										}}
									>
										Select All
									</button>
									<button
										type="button"
										onClick={unselectAllUnifiedVariations}
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
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
									{[
										{ key: 'authz-client-secret-post', label: 'Authorization Code - Client Secret Post' },
										{ key: 'authz-client-secret-basic', label: 'Authorization Code - Client Secret Basic' },
										{ key: 'authz-client-secret-jwt', label: 'Authorization Code - Client Secret JWT' },
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
												background: selectedUnifiedVariations.has(variation.key as UnifiedVariation) ? '#eff6ff' : 'white',
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
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
						<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
							MFA Device Types
						</h2>
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
													{ key: 'user-flow', label: 'User Flow (OAuth login, ACTIVATION_REQUIRED)' },
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
															background: useCases.has(useCase.key as MFAUseCase) ? '#ecfdf5' : 'white',
															transition: 'all 0.2s',
														}}
													>
														<input
															type="checkbox"
															checked={useCases.has(useCase.key as MFAUseCase)}
															onChange={() => toggleMFAUseCase(deviceType, useCase.key as MFAUseCase)}
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
					marginTop: '2rem',
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
							Generate & Download Postman Collection
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
				</ul>
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
