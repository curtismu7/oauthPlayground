// src/v8m/pages/V8MTokenExchange.PingUI.tsx
// V8M OAuth 2.0 Token Exchange Flow - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useCallback, useMemo, useState } from 'react';
import EnhancedApiCallDisplay from '../../components/EnhancedApiCallDisplay';
import { LearningTooltip } from '../../components/LearningTooltip';
import { usePageScroll } from '../../hooks/usePageScroll';
import type { EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { FlowUIService } from '../../services/flowUIService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

type TokenExchangeScenario =
	| 'delegation'
	| 'impersonation'
	| 'scope-reduction'
	| 'audience-restriction';

// Get UI components from FlowUIService
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

// PingOne UI Styled Components (using inline styles with CSS variables)
const getMainCardStyle = () => ({
	backgroundColor: 'var(--pingone-surface-card)',
	borderRadius: 'var(--pingone-border-radius-xl, 1rem)',
	boxShadow: 'var(--pingone-shadow-xl, 0 20px 40px rgba(15, 23, 42, 0.1))',
	border: '1px solid var(--pingone-border-primary)',
	overflow: 'hidden',
});

const getHeaderStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderBottom: '2px solid var(--pingone-border-primary)',
	color: 'var(--pingone-text-primary)',
	padding: 'var(--pingone-spacing-xl, 2rem)',
	textAlign: 'center',
});

const getVersionBadgeStyle = () => ({
	background: 'var(--pingone-surface-tertiary)',
	border: '1px solid var(--pingone-border-secondary)',
	color: 'var(--pingone-text-secondary)',
	fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	padding: '0.25rem 0.75rem',
	borderRadius: '9999px',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	display: 'inline-block',
});

const getTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-3xl, 2.5rem)',
	fontWeight: 'var(--pingone-font-weight-bold, 700)',
	margin: '0 0 0.5rem 0',
	color: 'var(--pingone-text-primary)',
});

const getSubtitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	color: 'var(--pingone-text-secondary)',
	margin: '0',
});

const getContentSectionStyle = () => ({
	padding: 'var(--pingone-spacing-xl, 2rem)',
});

const getScenarioSelectorStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
	margin: 'var(--pingone-spacing-xl, 2rem) 0',
});

const getScenarioCardStyle = (selected: boolean) => ({
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	border: `2px solid ${selected ? 'var(--pingone-brand-primary)' : 'var(--pingone-border-primary)'}`,
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	background: selected ? 'var(--pingone-surface-primary)' : 'var(--pingone-surface-card)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	textAlign: 'left',
	width: '100%',
	'&:hover': {
		borderColor: 'var(--pingone-brand-primary)',
		transform: 'translateY(-2px)',
		boxShadow: 'var(--pingone-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.1))',
	},
});

const getScenarioIconStyle = () => ({
	fontSize: '2rem',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	color: 'var(--pingone-brand-primary)',
});

const getScenarioTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
	color: 'var(--pingone-text-primary)',
});

const getScenarioDescriptionStyle = () => ({
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	color: 'var(--pingone-text-secondary)',
	lineHeight: '1.5',
});

const getFormSectionStyle = () => ({
	background: 'var(--pingone-surface-secondary)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
});

const getFormRowStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
	gap: 'var(--pingone-spacing-md, 1rem)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
});

const getLabelStyle = () => ({
	display: 'block',
	marginBottom: 'var(--pingone-spacing-xs, 0.25rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	color: 'var(--pingone-text-primary)',
});

const getInputStyle = () => ({
	width: '100%',
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary', disabled = false) => ({
	padding: 'var(--pingone-spacing-md, 1rem) var(--pingone-spacing-lg, 1.5rem)',
	border: variant === 'primary' ? 'none' : '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	cursor: disabled ? 'not-allowed' : 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	background: disabled
		? 'var(--pingone-surface-tertiary)'
		: variant === 'primary'
			? 'var(--pingone-brand-primary)'
			: 'var(--pingone-surface-card)',
	color: disabled
		? 'var(--pingone-text-tertiary)'
		: variant === 'primary'
			? 'var(--pingone-text-inverse)'
			: 'var(--pingone-text-primary)',
	'&:hover': !disabled
		? {
				background:
					variant === 'primary'
						? 'var(--pingone-brand-primary-dark)'
						: 'var(--pingone-surface-tertiary)',
				transform: 'translateY(-1px)',
				boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
			}
		: {},
});

const getResultSectionStyle = () => ({
	background: 'var(--pingone-surface-success)',
	border: '1px solid var(--pingone-border-success)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
});

const getResultTitleStyle = () => ({
	fontSize: 'var(--pingone-font-size-lg, 1.125rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
	color: 'var(--pingone-text-success)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const V8MTokenExchangePingUI: React.FC = () => {
	const [selectedScenario, setSelectedScenario] = useState<TokenExchangeScenario>('delegation');
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<EnhancedApiCallData | null>(null);
	const [formData, setFormData] = useState({
		actorToken: '',
		subjectToken: '',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedAudience: '',
		requestedScopes: 'openid profile',
	});

	// Scenarios configuration
	const scenarios = useMemo(
		() => [
			{
				id: 'delegation' as TokenExchangeScenario,
				icon: 'arrow-right-circle',
				title: 'Delegation',
				description: 'Exchange an actor token for a subject token with delegated permissions',
			},
			{
				id: 'impersonation' as TokenExchangeScenario,
				icon: 'account-switch',
				title: 'Impersonation',
				description: 'Exchange an admin token for a user token with impersonation rights',
			},
			{
				id: 'scope-reduction' as TokenExchangeScenario,
				icon: 'shield-check',
				title: 'Scope Reduction',
				description: 'Exchange a token for one with reduced scope for security',
			},
			{
				id: 'audience-restriction' as TokenExchangeScenario,
				icon: 'target-account',
				title: 'Audience Restriction',
				description: 'Exchange a token for one with a specific audience restriction',
			},
		],
		[]
	);

	// Handle form submission
	const handleSubmit = useCallback(async () => {
		setIsProcessing(true);
		setResult(null);

		try {
			// Simulate token exchange API call
			const mockApiData: EnhancedApiCallData = {
				method: 'POST',
				url: 'https://auth.pingone.com/oauth2/token',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body: new URLSearchParams({
					grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
					subject_token: formData.subjectToken,
					subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
					actor_token: formData.actorToken,
					actor_token_type: 'urn:ietf:params:oauth:token-type:access_token',
					requested_token_type: formData.requestedTokenType,
					requested_audience: formData.requestedAudience,
					requested_scopes: formData.requestedScopes,
				}),
				response: {
					access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
					token_type: 'Bearer',
					expires_in: 3600,
					scope: formData.requestedScopes,
					issued_token_type: formData.requestedTokenType,
				},
				status: 200,
				duration: 250,
			};

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setResult(mockApiData);
			v4ToastManager.success('Token exchange completed successfully!');
		} catch (error) {
			console.error('Token exchange failed:', error);
			v4ToastManager.error('Token exchange failed. Please check your inputs.');
		} finally {
			setIsProcessing(false);
		}
	}, [formData]);

	// Handle form field changes
	const handleInputChange = useCallback((field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	// Handle scenario selection
	const handleScenarioSelect = useCallback((scenario: TokenExchangeScenario) => {
		setSelectedScenario(scenario);
		setResult(null);
	}, []);

	// Page scroll effect
	usePageScroll();

	return (
		<div className="end-user-nano">
			<Container>
				<ContentWrapper>
					<div style={getMainCardStyle()}>
						{/* Header */}
						<div style={getHeaderStyle()}>
							<div style={getVersionBadgeStyle()}>V8M</div>
							<h1 style={getTitleStyle()}>
								<MDIIcon
									icon="swap-horizontal"
									size={40}
									style={{ marginRight: 'var(--pingone-spacing-md, 1rem)' }}
								/>
								OAuth 2.0 Token Exchange
							</h1>
							<p style={getSubtitleStyle()}>RFC 8693 Implementation for A2A Security</p>
						</div>

						{/* Content */}
						<div style={getContentSectionStyle()}>
							{/* Scenario Selector */}
							<div style={getScenarioSelectorStyle()}>
								{scenarios.map((scenario) => (
									<button
										key={scenario.id}
										style={getScenarioCardStyle(selectedScenario === scenario.id)}
										onClick={() => handleScenarioSelect(scenario.id)}
									>
										<div style={getScenarioIconStyle()}>
											<MDIIcon icon={scenario.icon} size={32} />
										</div>
										<div style={getScenarioTitleStyle()}>{scenario.title}</div>
										<div style={getScenarioDescriptionStyle()}>{scenario.description}</div>
									</button>
								))}
							</div>

							{/* Form Section */}
							<div style={getFormSectionStyle()}>
								<h3
									style={{
										marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
										color: 'var(--pingone-text-primary)',
									}}
								>
									<MDIIcon
										icon="form-select"
										size={20}
										style={{ marginRight: 'var(--pingone-spacing-sm, 0.5rem)' }}
									/>
									Token Exchange Configuration
								</h3>

								<div style={getFormRowStyle()}>
									<div>
										<label style={getLabelStyle()}>
											<MDIIcon
												icon="key"
												size={16}
												style={{ marginRight: 'var(--pingone-spacing-xs, 0.25rem)' }}
											/>
											Actor Token
											<LearningTooltip content="The token representing the acting party">
												<MDIIcon
													icon="information"
													size={14}
													style={{
														marginLeft: 'var(--pingone-spacing-xs, 0.25rem)',
														cursor: 'help',
													}}
												/>
											</LearningTooltip>
										</label>
										<input
											type="password"
											style={getInputStyle()}
											value={formData.actorToken}
											onChange={(e) => handleInputChange('actorToken', e.target.value)}
											placeholder="Enter actor token..."
										/>
									</div>

									<div>
										<label style={getLabelStyle()}>
											<MDIIcon
												icon="shield-key"
												size={16}
												style={{ marginRight: 'var(--pingone-spacing-xs, 0.25rem)' }}
											/>
											Subject Token
											<LearningTooltip content="The token representing the subject party">
												<MDIIcon
													icon="information"
													size={14}
													style={{
														marginLeft: 'var(--pingone-spacing-xs, 0.25rem)',
														cursor: 'help',
													}}
												/>
											</LearningTooltip>
										</label>
										<input
											type="password"
											style={getInputStyle()}
											value={formData.subjectToken}
											onChange={(e) => handleInputChange('subjectToken', e.target.value)}
											placeholder="Enter subject token..."
										/>
									</div>
								</div>

								<div style={getFormRowStyle()}>
									<div>
										<label style={getLabelStyle()}>
											<MDIIcon
												icon="cog"
												size={16}
												style={{ marginRight: 'var(--pingone-spacing-xs, 0.25rem)' }}
											/>
											Requested Token Type
										</label>
										<select
											style={getInputStyle()}
											value={formData.requestedTokenType}
											onChange={(e) => handleInputChange('requestedTokenType', e.target.value)}
										>
											<option value="urn:ietf:params:oauth:token-type:access_token">
												Access Token
											</option>
											<option value="urn:ietf:params:oauth:token-type:id_token">ID Token</option>
											<option value="urn:ietf:params:oauth:token-type:saml2">
												SAML2 Assertion
											</option>
										</select>
									</div>

									<div>
										<label style={getLabelStyle()}>
											<MDIIcon
												icon="target"
												size={16}
												style={{ marginRight: 'var(--pingone-spacing-xs, 0.25rem)' }}
											/>
											Requested Audience
											<LearningTooltip content="Optional audience restriction for the token">
												<MDIIcon
													icon="information"
													size={14}
													style={{
														marginLeft: 'var(--pingone-spacing-xs, 0.25rem)',
														cursor: 'help',
													}}
												/>
											</LearningTooltip>
										</label>
										<input
											type="text"
											style={getInputStyle()}
											value={formData.requestedAudience}
											onChange={(e) => handleInputChange('requestedAudience', e.target.value)}
											placeholder="Enter audience (optional)..."
										/>
									</div>
								</div>

								<div style={getFormRowStyle()}>
									<div>
										<label style={getLabelStyle()}>
											<MDIIcon
												icon="scope"
												size={16}
												style={{ marginRight: 'var(--pingone-spacing-xs, 0.25rem)' }}
											/>
											Requested Scopes
											<LearningTooltip content="Space-separated list of requested scopes">
												<MDIIcon
													icon="information"
													size={14}
													style={{
														marginLeft: 'var(--pingone-spacing-xs, 0.25rem)',
														cursor: 'help',
													}}
												/>
											</LearningTooltip>
										</label>
										<input
											type="text"
											style={getInputStyle()}
											value={formData.requestedScopes}
											onChange={(e) => handleInputChange('requestedScopes', e.target.value)}
											placeholder="openid profile email..."
										/>
									</div>
								</div>

								<div
									style={{
										display: 'flex',
										gap: 'var(--pingone-spacing-md, 1rem)',
										marginTop: 'var(--pingone-spacing-lg, 1.5rem)',
									}}
								>
									<button
										style={getButtonStyle('primary', isProcessing)}
										onClick={handleSubmit}
										disabled={isProcessing || !formData.actorToken || !formData.subjectToken}
									>
										<MDIIcon icon="swap-horizontal" size={16} />
										{isProcessing ? 'Processing...' : 'Exchange Tokens'}
									</button>

									<button
										style={getButtonStyle('secondary')}
										onClick={() => {
											setFormData({
												actorToken: '',
												subjectToken: '',
												requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
												requestedAudience: '',
												requestedScopes: 'openid profile',
											});
											setResult(null);
										}}
									>
										<MDIIcon icon="refresh" size={16} />
										Reset Form
									</button>
								</div>
							</div>

							{/* Result Section */}
							{result && (
								<div style={getResultSectionStyle()}>
									<div style={getResultTitleStyle()}>
										<MDIIcon icon="check-circle" size={20} />
										Token Exchange Successful
									</div>
									<EnhancedApiCallDisplay data={result} />
								</div>
							)}

							{/* Educational Content */}
							<div
								style={{
									background: 'var(--pingone-surface-info)',
									border: '1px solid var(--pingone-border-info)',
									borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
									padding: 'var(--pingone-spacing-lg, 1.5rem)',
									marginTop: 'var(--pingone-spacing-lg, 1.5rem)',
								}}
							>
								<h3
									style={{
										marginBottom: 'var(--pingone-spacing-md, 1rem)',
										color: 'var(--pingone-text-info)',
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--pingone-spacing-sm, 0.5rem)',
									}}
								>
									<MDIIcon icon="information" size={20} />
									About Token Exchange
								</h3>
								<p
									style={{
										marginBottom: 'var(--pingone-spacing-md, 1rem)',
										color: 'var(--pingone-text-info)',
										lineHeight: '1.6',
									}}
								>
									OAuth 2.0 Token Exchange (RFC 8693) enables a client to obtain a different
									security token from the authorization server by presenting an existing token. This
									is particularly useful for delegation and impersonation scenarios in A2A
									(application-to-application) security contexts.
								</p>
								<div
									style={{
										display: 'flex',
										gap: 'var(--pingone-spacing-md, 1rem)',
										flexWrap: 'wrap',
									}}
								>
									<a
										href="https://datatracker.ietf.org/doc/html/rfc8693"
										target="_blank"
										rel="noopener noreferrer"
										style={{
											color: 'var(--pingone-brand-primary)',
											textDecoration: 'none',
											display: 'flex',
											alignItems: 'center',
											gap: 'var(--pingone-spacing-xs, 0.25rem)',
										}}
									>
										<MDIIcon icon="external-link" size={16} />
										RFC 8693 Specification
									</a>
									<a
										href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-token"
										target="_blank"
										rel="noopener noreferrer"
										style={{
											color: 'var(--pingone-brand-primary)',
											textDecoration: 'none',
											display: 'flex',
											alignItems: 'center',
											gap: 'var(--pingone-spacing-xs, 0.25rem)',
										}}
									>
										<MDIIcon icon="api" size={16} />
										PingOne API Docs
									</a>
								</div>
							</div>
						</div>
					</div>
				</ContentWrapper>
			</Container>
		</div>
	);
};

export default V8MTokenExchangePingUI;
