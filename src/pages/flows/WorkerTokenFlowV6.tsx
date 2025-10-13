// src/pages/flows/WorkerTokenFlowV6.tsx
// V6 PingOne Worker Token Flow - Using V5Stepper Service

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	FiBook,
	FiCheckCircle,
	FiPackage,
	FiSettings,
} from 'react-icons/fi';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import EducationalContentService from '../../services/educationalContentService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { SectionDivider } from '../../components/ResultsPanel';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { AudienceParameterInput } from '../../components/AudienceParameterInput';
import { ResourceParameterInput } from '../../components/ResourceParameterInput';
import { V5StepperService } from '../../services/v5StepperService';

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

// V5Stepper components - using NavigationButton for consistent styling
const { NavigationButton } = V5StepperService.createStepLayout({ theme: 'blue', showProgress: true });

const WorkerTokenFlowV6: React.FC = () => {
	usePageScroll({ pageName: 'WorkerTokenFlowV6', force: true });
	
	const navigate = useNavigate();
	const controller = useClientCredentialsFlowController();
	
	const [currentStep, setCurrentStep] = React.useState(0);
	// Removed PingOne app state for simplicity
	const [audience, setAudience] = React.useState('');
	const [resources, setResources] = React.useState<string[]>([]);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = React.useState(false);
	const [isSavingCredentials, setIsSavingCredentials] = React.useState(false);

	const handleDiscoveryComplete = React.useCallback((result: any) => {
		console.log('[Worker Token V6] Discovery complete:', result);
	}, []);

	const handleFieldChange = React.useCallback((field: string, value: string) => {
		controller.setCredentials({ ...controller.credentials, [field]: value });
		setHasUnsavedCredentialChanges(true);
	}, [controller]);

	const handleSaveCredentials = React.useCallback(async () => {
		setIsSavingCredentials(true);
		try {
			// Save to localStorage
			const credentialsToSave = {
				environmentId: controller.credentials.environmentId,
				clientId: controller.credentials.clientId,
				clientSecret: controller.credentials.clientSecret,
				scopes: controller.credentials.scopes || controller.credentials.scope,
			};
			localStorage.setItem('worker-token-v6-credentials', JSON.stringify(credentialsToSave));
			console.log('[Worker Token V6] Credentials saved to localStorage:', credentialsToSave);
			
			await new Promise(resolve => setTimeout(resolve, 500));
			setHasUnsavedCredentialChanges(false);
			v4ToastManager.showSuccess('Worker app credentials saved successfully!');
		} catch (error) {
			console.error('[Worker Token V6] Failed to save credentials:', error);
			v4ToastManager.showError('Failed to save credentials');
		} finally {
			setIsSavingCredentials(false);
		}
	}, [controller.credentials]);

	// Load saved credentials on mount
	React.useEffect(() => {
		try {
			const saved = localStorage.getItem('worker-token-v6-credentials');
			if (saved) {
				const credentials = JSON.parse(saved);
				console.log('[Worker Token V6] Loaded credentials from localStorage:', credentials);
				controller.setCredentials({
					...controller.credentials,
					...credentials,
				});
			}
		} catch (error) {
			console.error('[Worker Token V6] Failed to load credentials:', error);
		}
	}, []);

	const handleRequestToken = React.useCallback(async () => {
		try {
			await controller.requestToken();
			setCurrentStep(2);
			v4ToastManager.showSuccess('Worker access token obtained!');
		} catch (error) {
			console.error('[Worker Token V6] Token request failed:', error);
			v4ToastManager.showError('Failed to obtain worker token');
		}
	}, [controller]);

	const handleClearConfiguration = React.useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
		setAudience('');
		setResources([]);
		setHasUnsavedCredentialChanges(false);
		setIsSavingCredentials(false);
		v4ToastManager.showSuccess('Worker token configuration cleared');
	}, [controller]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="worker-token" variant="oauth" />
						<FlowSequenceDisplay flowType="client-credentials" />
						
						<SectionDivider />
						
						{/* Educational Content */}
						<CollapsibleHeader
							title="Worker Token Flow Education"
							subtitle="Learn how the Worker Token flow works and when to use it"
							icon={<FiBook size={20} />}
							theme="yellow"
							defaultCollapsed={false}
						>
							<EducationalContentService flowType="worker-token" />
						</CollapsibleHeader>
						
						<SectionDivider />
						
						{/* Worker App Configuration */}
						<ComprehensiveCredentialsService
							flowType="worker-token-v6"
							onDiscoveryComplete={handleDiscoveryComplete}
							discoveryPlaceholder="Enter Environment ID, issuer URL, or provider..."
							showProviderInfo={true}
							environmentId={controller.credentials.environmentId || ''}
							clientId={controller.credentials.clientId || ''}
							clientSecret={controller.credentials.clientSecret || ''}
							scopes={controller.credentials.scopes || controller.credentials.scope || ''}
							defaultScopes="openid"
							onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
							onClientIdChange={(value) => handleFieldChange('clientId', value)}
							onClientSecretChange={(value) => handleFieldChange('clientSecret', value)}
							onScopesChange={(value) => handleFieldChange('scopes', value)}
							showRedirectUri={false}
							showPostLogoutRedirectUri={false}
							showLoginHint={false}
							title="Worker App Configuration & Credentials"
							subtitle="Configure your PingOne Worker application credentials and settings"
							defaultCollapsed={false}
							onSave={handleSaveCredentials}
							hasUnsavedChanges={hasUnsavedCredentialChanges || controller.hasUnsavedCredentialChanges}
							isSaving={isSavingCredentials || controller.isSavingCredentials}
						/>

						<SectionDivider />

						{/* Advanced Parameters */}
						<CollapsibleHeader
							title="Advanced OAuth Parameters (Optional)"
							subtitle="Configure audience and resource indicators for your Worker app"
							icon={<FiSettings size={20} />}
							theme="orange"
							defaultCollapsed={true}
						>
							<AudienceParameterInput
								value={audience}
								onChange={setAudience}
							/>
							<div style={{ marginTop: '1.5rem' }} />
							<ResourceParameterInput
								value={resources}
								onChange={setResources}
							/>
						</CollapsibleHeader>

						<div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
							<NavigationButton
								onClick={() => {
									const clientId = controller.credentials.clientId || '';
									const clientSecret = controller.credentials.clientSecret || '';
									const environmentId = controller.credentials.environmentId || '';

									if (!clientId.trim() || !clientSecret.trim() || !environmentId.trim()) {
										v4ToastManager.showStepError();
										return;
									}
									setCurrentStep(1);
									v4ToastManager.showStepCompleted(1);
								}}
								disabled={!((controller.credentials.clientId || '').trim() && (controller.credentials.clientSecret || '').trim() && (controller.credentials.environmentId || '').trim())}
							>
								Next: Request Token →
							</NavigationButton>
						</div>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleHeader
							title="Token Request Education"
							subtitle="Understand the client credentials grant flow"
							icon={<FiBook size={20} />}
							theme="yellow"
							defaultCollapsed={false}
						>
							<EducationalContentService flowType="worker-token" />
						</CollapsibleHeader>

						<SectionDivider />

						<div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
							<NavigationButton $variant="secondary" onClick={() => setCurrentStep(0)}>
								← Back to Configuration
							</NavigationButton>
							<NavigationButton
								onClick={handleRequestToken}
								disabled={controller.isRequesting}
							>
								{controller.isRequesting ? 'Requesting Token...' : 'Request Worker Token'}
							</NavigationButton>
						</div>
					</>
				);

			case 2:
				return (
					<>
						{/* Display Access Token */}
						{controller.tokens && (
							<CollapsibleHeader
								title="Access Token"
								subtitle="Your Worker app access token with decode and copy functionality"
								icon={<FiPackage size={20} />}
								defaultCollapsed={false}
							>
								{UnifiedTokenDisplayService.showTokens(
									{
										access_token: controller.tokens.access_token,
										refresh_token: controller.tokens.refresh_token,
									},
									'oauth',
									'worker-token-v6'
								)}
							</CollapsibleHeader>
						)}

						<SectionDivider />

						{/* Token Introspection */}
						{controller.tokens?.access_token && (
							<CollapsibleHeader
								title="Token Introspection"
								subtitle="Validate and inspect your Worker access token"
								icon={<FiPackage size={20} />}
								defaultCollapsed={false}
							>
								<div>Token introspection coming soon</div>
							</CollapsibleHeader>
						)}

						<SectionDivider />

						{/* Flow Completion */}
						<CollapsibleHeader
							title="Next Steps"
							subtitle="Complete the flow and explore additional features"
							icon={<FiCheckCircle size={20} />}
							theme="green"
							defaultCollapsed={false}
						>
							<FlowCompletionService
								config={FlowCompletionConfigs.workerToken}
							/>
						</CollapsibleHeader>

						<div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
							<NavigationButton $variant="secondary" onClick={handleClearConfiguration}>
								Start Over
							</NavigationButton>
							<NavigationButton onClick={() => navigate('/dashboard')}>
								Return to Dashboard
							</NavigationButton>
						</div>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="worker-token-v6" />
				{renderStepContent()}
			</ContentWrapper>
		</Container>
	);
};

export default WorkerTokenFlowV6;
