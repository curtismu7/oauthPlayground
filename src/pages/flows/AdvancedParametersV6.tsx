import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiSettings, FiArrowLeft, FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Import all the advanced parameter components
import { ClaimsRequestBuilder, ClaimsRequestStructure } from '../../components/ClaimsRequestBuilder';
import { ResourceParameterInput } from '../../components/ResourceParameterInput';
import { EnhancedPromptSelector, type PromptValue } from '../../components/EnhancedPromptSelector';
import { DisplayParameterSelector, type DisplayMode } from '../../components/DisplayParameterSelector';
import { AudienceParameterInput } from '../../components/AudienceParameterInput';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';

// Import services
import EducationalContentService from '../../services/educationalContentService';
import flowHeaderService from '../../services/flowHeaderService';
import { UISettingsService } from '../../services/uiSettingsService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowStorageService, type FlowId, type AdvancedParametersData } from '../../services/flowStorageService';

// Styled components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: #ffffff;
	min-height: 100vh;
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' }>`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${props => {
		switch (props.$variant) {
			case 'success': return '#f0fdf4';
			case 'warning': return '#fffbeb';
			default: return '#eff6ff';
		}
	}};
	border: 1px solid ${props => {
		switch (props.$variant) {
			case 'success': return '#bbf7d0';
			case 'warning': return '#fed7aa';
			default: return '#bfdbfe';
		}
	}};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: ${props => {
		switch (props.$variant) {
			case 'success': return '#166534';
			case 'warning': return '#92400e';
			default: return '#1e40af';
		}
	}};
	line-height: 1.5;
	margin-bottom: 1rem;
`;

const BackButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #0284c7;
	background: #ffffff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	margin-bottom: 1rem;

	&:hover {
		background: #f0f9ff;
		border-color: #0284c7;
	}
`;

const SaveButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 1rem 2rem;
	font-size: 1rem;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	width: 100%;
	max-width: 400px;
	margin: 2rem auto;

	&:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
	}

	&:active {
		transform: translateY(0);
	}

	svg {
		font-size: 1.25rem;
	}
`;

const SavedIndicator = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 1rem;
	background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
	border: 2px solid #34d399;
	border-radius: 0.75rem;
	color: #065f46;
	font-weight: 600;
	font-size: 0.9375rem;
	margin: 1rem auto;
	max-width: 400px;
	animation: fadeIn 0.3s ease-in;

	svg {
		color: #10b981;
		font-size: 1.25rem;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 3rem;
	padding: 2rem;
	border-top: 3px solid #10b981;
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border-radius: 1rem;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
`;

interface AdvancedParametersV6Props {
	onClaimsChange?: (claims: ClaimsRequestStructure | null) => void;
	onResourcesChange?: (resources: string[]) => void;
	onPromptChange?: (prompts: string[]) => void;
	onDisplayChange?: (display: string) => void;
	onAudienceChange?: (audience: string) => void;
	initialClaims?: ClaimsRequestStructure | null;
	initialResources?: string[];
	initialPrompts?: string[];
	initialDisplay?: string;
	initialAudience?: string;
}

export const AdvancedParametersV6: React.FC<AdvancedParametersV6Props> = ({
	onClaimsChange,
	onResourcesChange,
	onPromptChange,
	onDisplayChange,
	onAudienceChange,
	initialClaims = null,
	initialResources = [],
	initialPrompts = [],
	initialDisplay = '',
	initialAudience = ''
}) => {
	const { flowType } = useParams<{ flowType: string }>();
	const navigate = useNavigate();
	
	// Fallback for missing flowType
	const actualFlowType = flowType || 'oauth-authorization-code';
	
	// Default all sections to collapsed (user clicks to expand)
	const collapsedSections = {
		claims: true,
		resource: true,
		prompt: true,
		display: true,
		audience: true,
		education: true
	};

	// State for all parameters
	const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(initialClaims);
	const [resources, setResources] = useState<string[]>(initialResources);
	const [promptValues, setPromptValues] = useState<PromptValue[]>(initialPrompts as PromptValue[]);
	const [displayMode, setDisplayMode] = useState<DisplayMode>(initialDisplay as DisplayMode);
	const [audience, setAudience] = useState<string>(initialAudience);
	const [isSaved, setIsSaved] = useState(false);

	// Get flow ID for storage
	const getFlowId = (): FlowId | null => {
		const mapping: Record<string, FlowId> = {
			'oauth-authorization-code': 'oauth-authz-v6',
			'oidc-authorization-code': 'oidc-authz-v6',
			'oauth-implicit': 'oauth-implicit-v6',
			'oidc-implicit': 'oidc-implicit-v6',
			'device-authorization': 'oauth-device-auth-v6',
			'oidc-device-authorization': 'oidc-device-auth-v6',
		};
		return mapping[actualFlowType] || null;
	};

	// Load saved parameters on mount
	useEffect(() => {
		const flowId = getFlowId();
		if (!flowId) return;

		const saved = FlowStorageService.AdvancedParameters.get(flowId);
		if (saved) {
			console.log('[AdvancedParameters] Loading saved parameters:', saved);
			if (saved.audience !== undefined) setAudience(saved.audience);
			if (saved.resources !== undefined) setResources(saved.resources);
			if (saved.displayMode !== undefined) setDisplayMode(saved.displayMode as DisplayMode);
			if (saved.promptValues !== undefined) setPromptValues(saved.promptValues as PromptValue[]);
			if (saved.claimsRequest !== undefined) setClaimsRequest(saved.claimsRequest as ClaimsRequestStructure | null);
		}
	}, [actualFlowType]);

	// Save parameters to storage
	const handleSave = () => {
		const flowId = getFlowId();
		if (!flowId) {
			console.error('[AdvancedParameters] Cannot save: invalid flow ID');
			return;
		}

		const params: AdvancedParametersData = {
			audience,
			resources,
			displayMode,
			promptValues,
			claimsRequest: claimsRequest as Record<string, unknown> | null,
		};

		FlowStorageService.AdvancedParameters.set(flowId, params);
		setIsSaved(true);

		// Hide saved indicator after 3 seconds
		setTimeout(() => {
			setIsSaved(false);
		}, 3000);
	};

	// Notify parent components of changes
	useEffect(() => {
		onClaimsChange?.(claimsRequest);
	}, [claimsRequest, onClaimsChange]);

	useEffect(() => {
		onResourcesChange?.(resources);
	}, [resources, onResourcesChange]);

	useEffect(() => {
		onPromptChange?.(promptValues);
	}, [promptValues, onPromptChange]);

	useEffect(() => {
		onDisplayChange?.(displayMode);
	}, [displayMode, onDisplayChange]);

	useEffect(() => {
		onAudienceChange?.(audience);
	}, [audience, onAudienceChange]);

	const getFlowTitle = () => {
		switch (actualFlowType) {
			case 'oidc-authorization-code': return 'OIDC Authorization Code Flow';
			case 'oidc-implicit': return 'OIDC Implicit Flow';
			case 'oidc-hybrid': return 'OIDC Hybrid Flow';
			case 'oauth-authorization-code': return 'OAuth Authorization Code Flow';
			case 'oauth-implicit': return 'OAuth Implicit Flow';
			case 'client-credentials': return 'Client Credentials Flow';
			case 'device-authorization': return 'Device Authorization Flow';
			default: return 'OAuth/OIDC Flow';
		}
	};

	const isOIDCFlow = actualFlowType.startsWith('oidc');
	const isDeviceFlow = actualFlowType.includes('device');
	// PingOne flows - only show parameters that are well-supported
	const isPingOneFlow = actualFlowType.includes('authorization-code') && 
	                      (actualFlowType.includes('oauth') || actualFlowType.includes('oidc'));

	const handleBackToFlow = () => {
		navigate(`/flows/${actualFlowType}`);
	};

	return (
		<Container>
			<BackButton onClick={handleBackToFlow}>
				<FiArrowLeft />
				Back to {getFlowTitle()}
			</BackButton>

			<flowHeaderService.FlowHeader
				flowId={`${actualFlowType}-advanced-parameters`}
				customConfig={{
					flowType: isOIDCFlow ? 'oidc' : 'oauth',
					title: `${getFlowTitle()} - Advanced ${isOIDCFlow ? 'OIDC' : 'OAuth'} Parameters`,
					subtitle: isPingOneFlow
						? (isOIDCFlow 
							? "Configure PingOne-supported OIDC parameters: claims, audience, and prompt"
							: "Configure PingOne-supported OAuth parameters: audience and prompt")
						: (isOIDCFlow 
							? "Configure advanced OIDC parameters: claims, display, audience, resources, and prompt"
							: "Configure advanced OAuth 2.0 parameters: audience, resources, and prompt")
				}}
			/>

			{/* V5 Stepper - Show flow sequence */}
			<FlowSequenceDisplay flowType="authorization-code" />

			<Content>
				{/* PingOne Flow Notice */}
				{isPingOneFlow && (
					<InfoBox style={{ 
						background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
						border: '2px solid #fb923c',
						marginBottom: '2rem'
					}}>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
							<FiAlertCircle style={{ flexShrink: 0, marginTop: '0.25rem', color: '#ea580c' }} size={24} />
							<div>
								<strong style={{ color: '#ea580c' }}>Note: PingOne Flow</strong>
								<p style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
									This page shows only parameters that are well-supported by PingOne. 
									Some advanced OAuth/OIDC parameters (like <strong>Resource Indicators RFC 8707</strong> and <strong>Display Parameter</strong>) 
									are not reliably supported and have been hidden.
								</p>
								<p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
									To learn about these advanced parameters and see how they work, visit the{' '}
									<Link 
										to="/flows/advanced-oauth-params-demo" 
										style={{ 
											color: '#ea580c', 
											fontWeight: 600,
											textDecoration: 'underline' 
										}}
									>
										Advanced OAuth Parameters Demo Flow
									</Link>.
								</p>
							</div>
						</div>
					</InfoBox>
				)}

				{/* Educational Content */}
				<EducationalContentService 
					flowType={actualFlowType} 
					defaultCollapsed={collapsedSections.education}
				/>

				{/* OIDC-specific parameters */}
				{isOIDCFlow && (
					<>
						{/* Claims Request Builder */}
						<CollapsibleHeader
							title="Advanced Claims Request Builder"
							icon={<FiSettings />}
							theme="orange"
							defaultCollapsed={collapsedSections.claims}
						>
							<ClaimsRequestBuilder
								value={claimsRequest}
								onChange={setClaimsRequest}
							/>
						</CollapsibleHeader>

					{/* Display Parameter (OIDC only) - Hide for PingOne flows */}
					{!isPingOneFlow && (
						<CollapsibleHeader
							title="Display Parameter (OIDC)"
							icon={<FiSettings />}
							theme="orange"
							defaultCollapsed={collapsedSections.display}
						>
							<InfoBox $variant="warning">
								<strong>⚠️ Limited Support:</strong> The display parameter is not widely supported 
								by authorization servers, including PingOne. It may be ignored.
							</InfoBox>
							<DisplayParameterSelector
								value={displayMode}
								onChange={setDisplayMode}
							/>
						</CollapsibleHeader>
					)}
					</>
				)}

				{/* OAuth Parameters */}
				{!isDeviceFlow && (
					<>
						{/* Resource Indicators (RFC 8707) - Hide for PingOne flows */}
						{!isPingOneFlow && (
							<CollapsibleHeader
								title="Resource Indicators (RFC 8707)"
								icon={<FiSettings />}
								theme="orange"
								defaultCollapsed={collapsedSections.resource}
							>
								<InfoBox $variant="warning">
									<strong>⚠️ Limited Support:</strong> RFC 8707 Resource Indicators are not widely supported. 
									PingOne and many authorization servers do not honor this parameter. 
									See the <Link to="/flows/advanced-oauth-params-demo" style={{ color: '#0284c7', textDecoration: 'underline' }}>
										Advanced OAuth Parameters Demo
									</Link> to learn how it works.
								</InfoBox>
								<ResourceParameterInput
									value={resources}
									onChange={setResources}
								/>
							</CollapsibleHeader>
						)}

						{/* Enhanced Prompt Selector */}
						<CollapsibleHeader
							title="Enhanced Prompt Parameter"
							icon={<FiSettings />}
							theme="orange"
							defaultCollapsed={collapsedSections.prompt}
						>
							<InfoBox>
								<strong>About Prompt Parameter:</strong> Controls authentication and consent UI behavior. 
								{isOIDCFlow ? ' OIDC extends this with additional values like select_account and create.' : ''}
							</InfoBox>
							<EnhancedPromptSelector
								value={promptValues}
								onChange={setPromptValues}
							/>
						</CollapsibleHeader>
					</>
				)}

				{/* Audience Parameter (available for most flows) */}
				<CollapsibleHeader
					title="Audience Parameter"
					icon={<FiSettings />}
					theme="orange"
					defaultCollapsed={collapsedSections.audience}
				>
					<InfoBox>
						<strong>About Audience Parameter:</strong> Specifies the target API for the access token. 
						This helps authorization servers issue tokens with the correct audience claim.
					</InfoBox>
					<AudienceParameterInput
						value={audience}
						onChange={setAudience}
					/>
				</CollapsibleHeader>

				{/* Save Button - Always visible at bottom */}
				<ButtonContainer>
					{isSaved && (
						<SavedIndicator>
							<FiCheckCircle />
							Parameters saved successfully!
						</SavedIndicator>
					)}
					<SaveButton onClick={handleSave}>
						<FiSave />
						Save Advanced Parameters
					</SaveButton>
					<InfoBox style={{ maxWidth: '600px', marginTop: '1rem' }}>
						<strong>💡 Tip:</strong> Save your advanced parameters to persist them across browser refreshes. 
						Your saved settings will automatically load next time you visit this flow.
					</InfoBox>
				</ButtonContainer>
			</Content>
		</Container>
	);
};

export default AdvancedParametersV6;
