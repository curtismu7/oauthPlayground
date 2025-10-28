import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SetStateAction } from 'react';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { FlowCredentialService } from '../services/flowCredentialService';
import type { SAMLApplicationConfig } from '../services/samlService';
import { pingOneSamlService } from '../services/pingoneSamlService';
import type { PingOneAdminCredentials, PingOneSamlApp } from '../services/pingoneSamlService';

const FLOW_KEY = 'saml-sp-dynamic-acs';

export const DEFAULT_SAML_SP_CONFIG: SAMLApplicationConfig = {
	entityId: 'https://sp.example.com/metadata',
	acsUrls: ['https://sp.example.com/saml/acs'],
	ssoUrl: 'https://sp.example.com/saml/sso',
	enableAlwaysAcceptAcsUrlInSignedAuthnRequest: false,
	nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
};

const normalizeConfig = (config: Partial<SAMLApplicationConfig>): SAMLApplicationConfig => {
	const entityId = config.entityId?.trim() || DEFAULT_SAML_SP_CONFIG.entityId;
	const ssoUrl = config.ssoUrl?.trim() || DEFAULT_SAML_SP_CONFIG.ssoUrl;
	const nameIdFormat = config.nameIdFormat?.trim() || DEFAULT_SAML_SP_CONFIG.nameIdFormat;
	const acsUrls = (config.acsUrls ?? DEFAULT_SAML_SP_CONFIG.acsUrls)
		.map((url) => url.trim())
		.filter((url) => url.length > 0);
	const enableDynamic =
		config.enableAlwaysAcceptAcsUrlInSignedAuthnRequest ??
		DEFAULT_SAML_SP_CONFIG.enableAlwaysAcceptAcsUrlInSignedAuthnRequest;
	const signingCertificate = config.signingCertificate?.trim();
	const encryptionCertificate = config.encryptionCertificate?.trim();

	const normalized: SAMLApplicationConfig = {
		entityId,
		acsUrls: acsUrls.length > 0 ? acsUrls : DEFAULT_SAML_SP_CONFIG.acsUrls,
		ssoUrl,
		enableAlwaysAcceptAcsUrlInSignedAuthnRequest: enableDynamic,
		nameIdFormat,
	};

	if (signingCertificate) {
		normalized.signingCertificate = signingCertificate;
	}

	if (encryptionCertificate) {
		normalized.encryptionCertificate = encryptionCertificate;
	}

	return normalized;
};

const configFromCredentials = (credentials: StepCredentials | null): SAMLApplicationConfig => {
	if (!credentials) {
		return DEFAULT_SAML_SP_CONFIG;
	}

	const partial: Partial<SAMLApplicationConfig> = {
		entityId: credentials.clientId,
		ssoUrl: credentials.redirectUri?.replace('/saml/acs', '/saml/sso'),
	};

	if (credentials.redirectUri) {
		partial.acsUrls = [credentials.redirectUri];
	}

	const scopeValue = credentials.scope || credentials.scopes;
	if (typeof scopeValue === 'string' && scopeValue.trim()) {
		partial.nameIdFormat = scopeValue.trim();
	}

	return normalizeConfig(partial);
};

export const buildSamlPlaceholderCredentials = (config: SAMLApplicationConfig): StepCredentials => {
	const primaryAcs = config.acsUrls[0] || '';
	const scope = config.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';

	return {
		environmentId: '',
		clientId: config.entityId,
		clientSecret: '',
		redirectUri: primaryAcs,
		scope,
		scopes: scope,
	};
};

export interface SamlSpFlowController {
	config: SAMLApplicationConfig;
	updateConfig: (updater: SetStateAction<SAMLApplicationConfig>) => void;
	resetConfig: () => void;
	saveConfig: (options?: { showToast?: boolean }) => Promise<boolean>;
	isSaving: boolean;
	isLoading: boolean;
	hasSavedConfig: boolean;
	hasUnsavedChanges: boolean;
	lastSavedAt: number | null;
	credentials: StepCredentials;
	pingOneAdmin: PingOneAdminCredentials | null;
	setPingOneAdmin: (updates: Partial<PingOneAdminCredentials>) => void;
	savePingOneAdmin: (options?: { showToast?: boolean }) => Promise<boolean>;
	syncDynamicAcsWithPingOne: (options: {
		applicationId: string;
		allowOverride: boolean;
		signingCertificate?: string;
	}) => Promise<PingOneSamlApp | null>;
	fetchPingOneApplication: (applicationId: string) => Promise<PingOneSamlApp | null>;
}

export const useSamlSpFlowController = (): SamlSpFlowController => {
	const [config, setConfig] = useState<SAMLApplicationConfig>(DEFAULT_SAML_SP_CONFIG);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [hasSavedConfig, setHasSavedConfig] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
	const [pingOneAdmin, setPingOneAdminState] = useState<PingOneAdminCredentials | null>(null);

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				const [flowData, adminData] = await Promise.all([
					FlowCredentialService.loadFlowCredentials<SAMLApplicationConfig>({
						flowKey: FLOW_KEY,
						defaultCredentials: buildSamlPlaceholderCredentials(DEFAULT_SAML_SP_CONFIG),
						disableSharedFallback: true,
					}),
					FlowCredentialService.loadFlowCredentials({
						flowKey: 'pingone-admin',
						defaultCredentials: {},
						disableSharedFallback: true,
					}),
				]);

				if (!active) return;

				const { credentials, flowState } = flowData;

				if (flowState?.flowConfig) {
					setConfig(normalizeConfig(flowState.flowConfig));
					setHasSavedConfig(true);
					setLastSavedAt(flowState.timestamp ?? null);
					setHasUnsavedChanges(false);
				} else if (credentials) {
					setConfig(configFromCredentials(credentials));
					setHasSavedConfig(true);
					setHasUnsavedChanges(false);
				}

				const adminCredentials = adminData.credentials as StepCredentials | null;
				if (adminCredentials && (adminCredentials.environmentId || adminCredentials.clientId || adminCredentials.clientSecret)) {
					setPingOneAdminState({
						environmentId: adminCredentials.environmentId ?? '',
						clientId: adminCredentials.clientId ?? '',
						clientSecret: adminCredentials.clientSecret ?? '',
					});
				}
			} catch (error) {
				console.error('[useSamlSpFlowController] load error:', error);
			} finally {
				if (active) setIsLoading(false);
			}
		};

		load();

		return () => {
			active = false;
		};
	}, []);

	const updateConfig = useCallback((updater: SetStateAction<SAMLApplicationConfig>) => {
		setConfig((prev) =>
			typeof updater === 'function'
				? (updater as (p: SAMLApplicationConfig) => SAMLApplicationConfig)(prev)
				: updater
		);
		setHasUnsavedChanges(true);
	}, []);

	const resetConfig = useCallback(() => {
		setConfig(DEFAULT_SAML_SP_CONFIG);
		setHasUnsavedChanges(true);
	}, []);

	const saveConfig = useCallback(
		async (options?: { showToast?: boolean }) => {
			setIsSaving(true);
			const timestamp = Date.now();
			const normalized = normalizeConfig(config);

			try {
				const placeholder = buildSamlPlaceholderCredentials(normalized);
				const success = await FlowCredentialService.saveFlowCredentials(
					FLOW_KEY,
					placeholder,
					normalized,
					{ flowVariant: 'saml-sp', timestamp },
					options ?? { showToast: true }
				);

				if (success) {
					setConfig(normalized);
					setHasSavedConfig(true);
					setHasUnsavedChanges(false);
					setLastSavedAt(timestamp);
				}

				return success;
			} catch (error) {
				console.error('[useSamlSpFlowController] save error:', error);
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[config]
	);

	const credentials = useMemo(() => buildSamlPlaceholderCredentials(normalizeConfig(config)), [config]);

	const setPingOneAdmin = useCallback((updates: Partial<PingOneAdminCredentials>) => {
		setPingOneAdminState(prev => {
			const next: PingOneAdminCredentials = {
				environmentId: updates.environmentId ?? prev?.environmentId ?? '',
				clientId: updates.clientId ?? prev?.clientId ?? '',
				clientSecret: updates.clientSecret ?? prev?.clientSecret ?? '',
			};
			const hasAny = !!(next.environmentId || next.clientId || next.clientSecret);
			return hasAny ? next : null;
		});
	}, []);

	const savePingOneAdmin = useCallback(
		async (options?: { showToast?: boolean }) => {
			if (!pingOneAdmin) {
				console.warn('[useSamlSpFlowController] No PingOne admin credentials to save');
				return false;
			}

			const stepCredentials: StepCredentials = {
				environmentId: pingOneAdmin.environmentId,
				clientId: pingOneAdmin.clientId,
				clientSecret: pingOneAdmin.clientSecret,
				redirectUri: '',
				scope: '',
				scopes: '',
			};

			try {
				await FlowCredentialService.saveFlowCredentials('pingone-admin', stepCredentials, undefined, { flowVariant: 'pingone-admin' }, options ?? { showToast: true });
				return true;
			} catch (error) {
				console.error('[useSamlSpFlowController] Failed to save PingOne admin credentials', error);
				return false;
			}
		},
		[pingOneAdmin]
	);

	const syncDynamicAcsWithPingOne = useCallback(
		async ({ applicationId, allowOverride, signingCertificate }: { applicationId: string; allowOverride: boolean; signingCertificate?: string }) => {
			if (!pingOneAdmin) {
				console.warn('[useSamlSpFlowController] Missing PingOne admin credentials');
				return null;
			}

			try {
				const updatedApp = await pingOneSamlService.updateDynamicAcs({
					credentials: pingOneAdmin,
					applicationId,
					allowOverride,
					signingCertificate,
				});
				if (updatedApp?.assertionConsumerService) {
					setConfig(prev => {
						const next = normalizeConfig({
							...prev,
							pingOneApplicationId: applicationId,
							enableAlwaysAcceptAcsUrlInSignedAuthnRequest:
								updatedApp.assertionConsumerService.allowSignedRequestOverride,
						});
						return next;
					});
					setHasUnsavedChanges(true);
				}
				return updatedApp;
			} catch (error) {
				console.error('[useSamlSpFlowController] Failed to sync dynamic ACS toggle', error);
				return null;
			}
		},
		[pingOneAdmin]
	);

	const fetchPingOneApplication = useCallback(
		async (applicationId: string) => {
			if (!pingOneAdmin) {
				console.warn('[useSamlSpFlowController] Missing PingOne admin credentials');
				return null;
			}

			try {
				const app = await pingOneSamlService.fetchApplication(pingOneAdmin, applicationId);
				if (app?.assertionConsumerService) {
					setConfig(prev => {
						const next = normalizeConfig({
							...prev,
							pingOneApplicationId: applicationId,
							enableAlwaysAcceptAcsUrlInSignedAuthnRequest:
								app.assertionConsumerService.allowSignedRequestOverride,
						});
						return next;
					});
					setHasUnsavedChanges(true);
				}
				return app;
			} catch (error) {
				console.error('[useSamlSpFlowController] Failed to fetch PingOne application', error);
				return null;
			}
		},
		[pingOneAdmin]
	);

	return {
		config,
		updateConfig,
		resetConfig,
		saveConfig,
		isSaving,
		isLoading,
		hasSavedConfig,
		hasUnsavedChanges,
		lastSavedAt,
		credentials,
		pingOneAdmin,
		setPingOneAdmin,
		savePingOneAdmin,
		syncDynamicAcsWithPingOne,
		fetchPingOneApplication,
	};
};
