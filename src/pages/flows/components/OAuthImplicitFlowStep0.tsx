// src/pages/flows/components/OAuthImplicitFlowStep0.tsx
import React from 'react';
import { FiAlertCircle, FiInfo, FiSettings, FiShield } from 'react-icons/fi';
import { CredentialsInput } from '../../../components/CredentialsInput';
import EnvironmentIdInput from '../../../components/EnvironmentIdInput';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../../../components/PingOneApplicationConfig';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import type { IntroSectionKey } from '../config/OAuthImplicitFlow.config';
import {
	ActionRow,
	Button,
	CollapsibleContent,
	CollapsibleHeaderButton,
	CollapsibleSection,
	CollapsibleTitle,
	CollapsibleToggleIcon,
	ExplanationHeading,
	ExplanationSection,
	FlowDiagram,
	FlowStep,
	FlowStepContent,
	FlowStepNumber,
	GeneratedContentBox,
	GeneratedLabel,
	InfoBox,
	InfoText,
	InfoTitle,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	StrongText,
} from '../styles/OAuthImplicitFlow.styles';

interface Step0Props {
	collapsedSections: Record<string, boolean>;
	toggleSection: (key: IntroSectionKey) => void;
	credentials: StepCredentials;
	handleFieldChange: (field: keyof StepCredentials, value: string) => void;
	handleSaveConfiguration: () => void;
	handleClearConfiguration: () => void;
	pingOneConfig: PingOneApplicationState;
	savePingOneConfig: (config: PingOneApplicationState) => void;
	emptyRequiredFields: Set<string>;
	copiedField: string | null;
	handleCopy: (text: string, label: string) => void;
}

export const OAuthImplicitFlowStep0: React.FC<Step0Props> = ({
	collapsedSections,
	toggleSection,
	credentials,
	handleFieldChange,
	handleSaveConfiguration,
	handleClearConfiguration,
	pingOneConfig,
	savePingOneConfig,
	emptyRequiredFields,
	copiedField,
	handleCopy,
}) => {
	return (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('overview')}
					aria-expanded={!collapsedSections.overview}
				>
					<CollapsibleTitle>
						<FiInfo /> Implicit Flow Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
						<FiInfo />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.overview && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>OAuth 2.0 Implicit Flow</InfoTitle>
								<InfoText>
									This is the pure OAuth 2.0 Implicit Flow that returns{' '}
									<StrongText>Access Token only</StrongText>. It's designed for authorization and
									API access, not for user authentication.
								</InfoText>
							</div>
						</InfoBox>

						<InfoBox $variant="warning">
							<FiAlertCircle size={20} />
							<div>
								<InfoTitle>Legacy Flow - Use with Caution</InfoTitle>
								<InfoText>
									The Implicit Flow is considered legacy and less secure than Authorization Code
									with PKCE. Tokens are exposed in the URL, making them vulnerable to interception.
									Use this flow only if you have specific requirements that prevent using
									Authorization Code + PKCE.
								</InfoText>
							</div>
						</InfoBox>

						<GeneratedContentBox>
							<GeneratedLabel>OAuth vs OIDC Implicit</GeneratedLabel>
							<ParameterGrid>
								<div>
									<ParameterLabel>Tokens Returned</ParameterLabel>
									<ParameterValue>Access Token only</ParameterValue>
								</div>
								<div>
									<ParameterLabel>Purpose</ParameterLabel>
									<ParameterValue>Authorization (API access)</ParameterValue>
								</div>
								<div>
									<ParameterLabel>Spec Layer</ParameterLabel>
									<ParameterValue>Defined in OAuth 2.0</ParameterValue>
								</div>
								<div>
									<ParameterLabel>Nonce Requirement</ParameterLabel>
									<ParameterValue>Not required</ParameterValue>
								</div>
								<div style={{ gridColumn: '1 / -1' }}>
									<ParameterLabel>Validation</ParameterLabel>
									<ParameterValue>Validate access token with resource server</ParameterValue>
								</div>
							</ParameterGrid>
						</GeneratedContentBox>

						<ExplanationSection>
							<ExplanationHeading>
								<FiShield /> How Implicit Flow Works
							</ExplanationHeading>
							<InfoText>
								In the Implicit Flow, tokens are returned directly from the authorization endpoint
								in the URL fragment (#), without an intermediate authorization code exchange step.
								This makes it simpler but less secure.
							</InfoText>
						</ExplanationSection>

						<FlowDiagram>
							{[
								'User clicks login to start the flow',
								'App redirects to PingOne with authorization request',
								'User authenticates and approves scopes',
								'PingOne returns tokens directly in URL fragment',
								'App extracts and validates tokens from URL',
							].map((description, index) => (
								<FlowStep key={description}>
									<FlowStepNumber>{index + 1}</FlowStepNumber>
									<FlowStepContent>
										<StrongText>{description}</StrongText>
									</FlowStepContent>
								</FlowStep>
							))}
						</FlowDiagram>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('credentials')}
					aria-expanded={!collapsedSections.credentials}
				>
					<CollapsibleTitle>
						<FiSettings /> Application Configuration & Credentials
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
						<FiSettings />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.credentials && (
					<CollapsibleContent>
						<CredentialsInput
							environmentId={credentials.environmentId || ''}
							clientId={credentials.clientId || ''}
							clientSecret={''}
							redirectUri={credentials.redirectUri || ''}
							scopes={credentials.scopes || credentials.scope || ''}
							loginHint={credentials.loginHint || ''}
							onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
							onClientIdChange={(value) => handleFieldChange('clientId', value)}
							onClientSecretChange={() => {}} // Not used in Implicit
							onRedirectUriChange={(value) => handleFieldChange('redirectUri', value)}
							onScopesChange={(value) => handleFieldChange('scopes', value)}
							onLoginHintChange={(value) => handleFieldChange('loginHint', value)}
							onCopy={handleCopy}
							emptyRequiredFields={emptyRequiredFields}
							copiedField={copiedField}
							showClientSecret={false}
						/>

						<PingOneApplicationConfig
							value={pingOneConfig}
							onChange={savePingOneConfig}
							flowType="oauth-implicit"
						/>

						<ActionRow>
							<Button onClick={handleSaveConfiguration} $variant="primary">
								<FiSettings /> Save Configuration
							</Button>
							<Button onClick={handleClearConfiguration} $variant="danger">
								<FiSettings /> Clear Configuration
							</Button>
						</ActionRow>

						{(!credentials.clientId || !credentials.environmentId) && (
							<InfoBox $variant="warning" style={{ marginTop: '1.5rem' }}>
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Required: Fill in Credentials</InfoTitle>
									<InfoText>
										<StrongText>Environment ID</StrongText> and <StrongText>Client ID</StrongText>{' '}
										are required to continue. Fill these in above, then click "Save Configuration"
										before proceeding to Step 1.
									</InfoText>
								</div>
							</InfoBox>
						)}

						<InfoBox $variant="danger" style={{ marginTop: '2rem', color: '#7f1d1d' }}>
							<FiAlertCircle size={20} />
							<div>
								<InfoTitle style={{ color: '#7f1d1d' }}>Security Warning</InfoTitle>
								<InfoText style={{ color: '#7f1d1d' }}>
									Implicit Flow exposes tokens in the URL. Never use this for highly sensitive data.
									Consider migrating to Authorization Code + PKCE for better security.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{/* Environment ID Input */}
			<EnvironmentIdInput
				initialEnvironmentId={credentials.environmentId || ''}
				onEnvironmentIdChange={(newEnvId) => {
					onCredentialsChange({
						...credentials,
						environmentId: newEnvId,
					});
				}}
				onIssuerUrlChange={() => {}}
				showSuggestions={true}
				autoDiscover={false}
			/>

			{/* Credentials Input */}
			<CredentialsInput
				environmentId={credentials.environmentId || ''}
				clientId={credentials.clientId || ''}
				clientSecret={credentials.clientSecret || ''}
				scopes={credentials.scopes || 'openid profile email'}
				onEnvironmentIdChange={(newEnvId) => {
					onCredentialsChange({
						...credentials,
						environmentId: newEnvId,
					});
				}}
				onClientIdChange={(newClientId) => {
					onCredentialsChange({
						...credentials,
						clientId: newClientId,
					});
				}}
				onClientSecretChange={(newClientSecret) => {
					onCredentialsChange({
						...credentials,
						clientSecret: newClientSecret,
					});
				}}
				onScopesChange={(newScopes) => {
					onCredentialsChange({
						...credentials,
						scopes: newScopes,
					});
				}}
				onCopy={onCopy}
				showRedirectUri={true}
				showLoginHint={false}
			/>
		</>
	);
};
