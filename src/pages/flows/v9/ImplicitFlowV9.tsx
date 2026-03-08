// src/pages/flows/ImplicitFlowV9.tsx
// lint-file-disable: token-value-in-jsx
// Unified OAuth/OIDC Implicit Flow V9 - Single implementation supporting both variants

import type React from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
// Import components
import { EducationModeToggle } from '../../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../../components/education/MasterEducationSection';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import { useRedirectUriEducation } from '../../../hooks/useRedirectUriEducation';
import { RedirectUriEducationalModal } from '../../../components/RedirectUriEducationalModal';
import { RedirectUriEducationButton } from '../../../components/RedirectUriEducationButton';
import {
	loadInitialCredentials,
	useImplicitFlowController,
} from '../../../hooks/useImplicitFlowController';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { comprehensiveFlowDataService } from '../../../services/comprehensiveFlowDataService';
import { FlowHeader } from '../../../services/flowHeaderService';
// Import UI components from services
import { FlowUIService } from '../../../services/flowUIService';
// Import shared services
import { ImplicitFlowV9Helpers } from '../../../services/implicitFlowSharedService';
import { createModuleLogger } from '../../../utils/consoleMigrationHelper';
import { checkCredentialsAndWarn } from '../../../utils/credentialsWarningService';

// Get UI components
const {
	Container,
	ContentWrapper,
} = FlowUIService.getFlowUIComponents();

const log = createModuleLogger('src/pages/flows/v9/ImplicitFlowV9.tsx');

const ImplicitFlowV9: React.FC = () => {
	const location = useLocation();

	// Redirect URI educational integration
	const redirectUriEducation = useRedirectUriEducation({
		flowKey: 'ImplicitFlowV9',
	});

	// Detect default variant based on navigation context
	const getDefaultVariant = (): 'oauth' | 'oidc' => {
		// Check if there's a variant specified in the URL params
		const urlParams = new URLSearchParams(location.search);
		const urlVariant = urlParams.get('variant');
		if (urlVariant === 'oidc' || urlVariant === 'oauth') {
			return urlVariant as 'oauth' | 'oidc';
		}

		// Check navigation state for context
		const state = location.state as { fromSection?: string } | null;
		if (state?.fromSection === 'oidc') {
			return 'oidc';
		}

		// Default to OAuth (base protocol)
		return 'oauth';
	};

	const [selectedVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());
	const [, setWorkerToken] = useState<string>('');

	// Initialize controller with V7 flow key
	const controller = useImplicitFlowController({
		flowKey: 'implicit-v9',
		defaultFlowVariant: selectedVariant,
		enableDebugger: true,
	});

	const [credentials, setCredentials] = useState<StepCredentials>(() => {
		const initialCreds = controller.credentials || {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: 'https://localhost:3000/implicit-callback',
			scope: selectedVariant === 'oidc' ? 'openid profile email' : '',
			scopes: selectedVariant === 'oidc' ? 'openid profile email' : '',
			responseType: selectedVariant === 'oidc' ? 'id_token token' : 'token',
			grantType: '',
			clientAuthMethod: 'none',
		};
		log.info('ImplicitFlowV9', 'Initial credentials from controller', { initialCreds });
		return initialCreds;
	});


	const [currentStep, setCurrentStep] = useState(0);

	// Get worker token from location state or localStorage
	useEffect(() => {
		// First try to get from location state (if navigating from Configuration page)
		const tokenFromLocation = location.state?.workerToken;
		if (tokenFromLocation) {
			setWorkerToken(tokenFromLocation);
			log.info('ImplicitFlowV9', 'Worker token loaded from location state');
			return;
		}

		// If not in location state, try to load from localStorage
		const savedToken = localStorage.getItem('worker-token');
		const savedEnv = localStorage.getItem('worker-token-env');

		if (savedToken && savedEnv) {
			setWorkerToken(savedToken);
			log.info('ImplicitFlowV9', 'Worker token loaded from localStorage');
		} else {
			log.info('ImplicitFlowV9', 'No worker token found in location state or localStorage');
		}
	}, [location.state]);

	// Process tokens from URL fragment on mount or when tokens change
	useEffect(() => {
		const hash = window.location.hash;
		log.info('ImplicitFlowV9', 'Checking for tokens in URL fragment on mount', { hash });

		if (hash?.includes('access_token') && !controller.tokens) {
			log.info('ImplicitFlowV9', 'Found tokens in URL fragment, processing');
			controller.setTokensFromFragment(hash);
			// Clean up URL
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, [controller.tokens, controller.setTokensFromFragment]);

	// Handle token reception and step advancement
	useEffect(() => {
		if (controller.tokens && currentStep < 2) {
			log.info('ImplicitFlowV9', 'Tokens received, advancing to step 2');
			setCurrentStep(2);
		}
	}, [controller.tokens, currentStep]);

	// Sync local credentials with controller credentials
	useEffect(() => {
		if (
			controller.credentials &&
			(controller.credentials.environmentId !== credentials.environmentId ||
				controller.credentials.clientId !== credentials.clientId ||
				controller.credentials.redirectUri !== credentials.redirectUri ||
				controller.credentials.scope !== credentials.scope ||
				controller.credentials.scopes !== credentials.scopes)
		) {
			log.info('ImplicitFlowV9', 'Syncing credentials from controller', {
				controllerCredentials: controller.credentials,
			});
			log.info('ImplicitFlowV9', 'Current local credentials', { credentials });
			setCredentials(controller.credentials);
		}
	}, [controller.credentials, credentials]); // Removed credentials dependencies to prevent infinite loop

	// Load credentials on mount using V7 standardized storage
	useEffect(() => {
		const loadCredentials = async () => {
			log.info('ImplicitFlowV9', 'Loading credentials on mount');

			try {
				// Try V7 standardized storage first
				const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
					flowKey: 'implicit-flow-v7',
					useSharedEnvironment: true,
					useSharedDiscovery: true,
				});

				if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
					log.info('ImplicitFlowV9', 'Found flow-specific credentials');
					const updatedCredentials = {
						environmentId: flowData.sharedEnvironment?.environmentId || '',
						clientId: flowData.flowCredentials.clientId,
						clientSecret: flowData.flowCredentials.clientSecret,
						redirectUri: flowData.flowCredentials.redirectUri,
						scopes: Array.isArray(flowData.flowCredentials.scopes) 
							? flowData.flowCredentials.scopes 
							: (flowData.flowCredentials.scopes ? flowData.flowCredentials.scopes.split(' ') : []),
					};

					setCredentials(updatedCredentials);
					controller.setCredentials(updatedCredentials);
				} else if (flowData.sharedEnvironment?.environmentId) {
					log.info('ImplicitFlowV9', 'Using shared environment data only');
					const updatedCredentials = {
						...controller.credentials,
						environmentId: flowData.sharedEnvironment.environmentId,
					};
					setCredentials(updatedCredentials);
					controller.setCredentials(updatedCredentials);
				} else {
					log.info('ImplicitFlowV9', 'No saved credentials found, using defaults');
					const initialCredentials = loadInitialCredentials(selectedVariant, 'implicit-flow-v7');
					setCredentials(initialCredentials);
					controller.setCredentials(initialCredentials);
				}
			} catch {
				// Fallback to legacy method on error
				const initialCredentials = loadInitialCredentials(selectedVariant, 'implicit-v9');
				setCredentials(initialCredentials);
				controller.setCredentials(initialCredentials);
			}
		};

		loadCredentials();
	}, [selectedVariant, controller.credentials, controller.setCredentials]); // Only run on mount and when variant changes

	// Update controller when variant changes and reload credentials
	useEffect(() => {
		controller.setFlowVariant(selectedVariant);
		ImplicitFlowV9Helpers.getSessionHelpers(selectedVariant).setActiveFlow();

		// Reload variant-specific credentials
		const reloadedCredentials = loadInitialCredentials(selectedVariant, 'implicit-v9');
		controller.setCredentials(reloadedCredentials);
		setCredentials(reloadedCredentials);
		log.info('ImplicitFlowV9', 'Variant changed, reloaded credentials', { reloadedCredentials });
	}, [selectedVariant, controller.setCredentials, controller.setFlowVariant]); // Only run when variant changes

	// Sync credentials with variant
	useEffect(() => {
		const variantDefaults = ImplicitFlowV9Helpers.getFlowMetadata(selectedVariant);
		setCredentials((prev) => ({
			...prev,
			scope: variantDefaults.scopes || prev.scope || '',
			scopes: variantDefaults.scopes || prev.scopes || '',
			responseType: variantDefaults.responseType,
		}));
	}, [selectedVariant]);

	// Ensure Implicit Flow V9 uses its own credential storage
	useEffect(() => {
		// Save current credentials to flow-specific storage
		if (
			controller.credentials &&
			(controller.credentials.environmentId || controller.credentials.clientId)
		) {
			log.info('ImplicitFlowV9', 'Saving credentials to flow-specific storage', {
				flowKey: 'implicit-v9',
				environmentId: controller.credentials.environmentId,
				clientId: `${controller.credentials.clientId?.substring(0, 8)}...`,
				redirectUri: controller.credentials.redirectUri,
			});

			// Save to comprehensive service with complete isolation
			comprehensiveFlowDataService.saveFlowDataComprehensive('implicit-flow-v7', {
				sharedEnvironment: controller.credentials.environmentId
					? {
							environmentId: controller.credentials.environmentId,
							region: 'us', // Default region
							issuerUrl: `https://auth.pingone.com/${controller.credentials.environmentId}`,
						}
					: undefined,
				flowCredentials: {
					clientId: controller.credentials.clientId,
					redirectUri: controller.credentials.redirectUri,
					scopes: Array.isArray(controller.credentials.scopes) 
						? controller.credentials.scopes 
						: (controller.credentials.scopes ? controller.credentials.scopes.split(' ') : []),
					lastUpdated: Date.now(),
				},
			});
		}
	}, [controller.credentials]);


	usePageScroll({ pageName: 'Implicit Flow V9', force: true });

	// Check credentials on mount and show warning if missing
	useEffect(() => {
		checkCredentialsAndWarn(credentials, {
			flowName: `${selectedVariant.toUpperCase()} Implicit Flow`,
			requiredFields: ['environmentId', 'clientId'],
			showToast: true,
		});
	}, [credentials, selectedVariant]);







	return (
		<>
			<Container>
			<ContentWrapper>
				<FlowHeader flowId="implicit-v9" />
				
				{/* Educational URI Guide Button */}
				<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
					<RedirectUriEducationButton 
						flowKey="ImplicitFlowV9"
						variant="outline"
						size="sm"
					>
						📚 URI Guide
					</RedirectUriEducationButton>
				</div>

				{/* Education Mode Toggle */}
				<EducationModeToggle variant="buttons" />

				{/* Master Education Section */}
				<MasterEducationSection
					flowType="implicit"
					title="📚 Implicit Flow Education"
					sections={[
						{
							id: 'implicit-overview',
							title: 'Implicit Flow Overview',
							icon: <span>ℹ️</span>,
							summary:
								'Legacy OAuth flow - tokens returned directly in URL fragment (not recommended for new applications)',
							content: (
								<div>
									<p>
										<strong>The Implicit Flow</strong> is a legacy OAuth 2.0 flow where tokens are
										returned directly in the URL fragment:
									</p>
									<ul>
										<li>
											<strong>No Backend Required</strong> - Designed for browser-only applications
										</li>
										<li>
											<strong>Tokens in URL</strong> - Access tokens returned in URL fragment (#)
										</li>
										<li>
											<strong>No Refresh Tokens</strong> - Cannot securely store refresh tokens
										</li>
										<li>
											<strong>Security Concerns</strong> - Tokens exposed in browser history and
											logs
										</li>
									</ul>
									<p>
										<strong>⚠️ Not Recommended:</strong> OAuth 2.1 deprecates this flow. Use
										Authorization Code with PKCE instead.
									</p>
								</div>
							),
						},
						{
							id: 'oauth-vs-oidc',
							title: 'OAuth vs OIDC Variants',
							icon: <span>🛡️</span>,
							summary: 'OAuth returns access tokens, OIDC adds ID tokens for authentication',
							content: (
								<div>
									<p>
										<strong>Two Variants Available:</strong>
									</p>
									<ul>
										<li>
											<strong>OAuth Implicit</strong> - Returns access_token for API authorization
										</li>
										<li>
											<strong>OIDC Implicit</strong> - Returns id_token for user authentication
										</li>
									</ul>
									<p>Use the variant selector to switch between OAuth and OIDC modes.</p>
								</div>
							),
						},
					]}
				/>
			</ContentWrapper>
		</Container>
		{/* Redirect URI Educational Modal */}
		<RedirectUriEducationalModal
			flowKey="ImplicitFlowV9"
			isOpen={redirectUriEducation.showEducationalModal}
			onClose={redirectUriEducation.closeEducationalModal}
		/>
	</>
	);
};

export default ImplicitFlowV9;
