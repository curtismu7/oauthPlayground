// src/components/AdvancedParametersSection.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSettings, FiCode, FiShield, FiGlobe } from 'react-icons/fi';

// Import all the advanced parameter components
import { ClaimsRequestBuilder, ClaimsRequestStructure } from './ClaimsRequestBuilder';
import { ResourceParameterInput } from './ResourceParameterInput';
import { EnhancedPromptSelector } from './EnhancedPromptSelector';
import { DisplayParameterSelector } from './DisplayParameterSelector';
import { AudienceParameterInput } from './AudienceParameterInput';

// Import services
import { CollapsibleHeader } from '../services/collapsibleHeaderService';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
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

const InnerContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding: 1rem 0;
`;

interface AdvancedParametersSectionProps {
	flowType: string;
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
	defaultCollapsed?: boolean;
}

/**
 * Advanced Parameters Section
 * A collapsible section containing all advanced OAuth/OIDC parameters
 * Can be embedded directly into flow pages instead of navigating to a separate page
 */
export const AdvancedParametersSection: React.FC<AdvancedParametersSectionProps> = ({
	flowType,
	onClaimsChange,
	onResourcesChange,
	onPromptChange,
	onDisplayChange,
	onAudienceChange,
	initialClaims = null,
	initialResources = [],
	initialPrompts = [],
	initialDisplay = '',
	initialAudience = '',
	defaultCollapsed = true
}) => {
	// State for all parameters
	const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(initialClaims);
	const [resources, setResources] = useState<string[]>(initialResources);
	const [promptValues, setPromptValues] = useState<string[]>(initialPrompts);
	const [displayMode, setDisplayMode] = useState<string>(initialDisplay);
	const [audience, setAudience] = useState<string>(initialAudience);

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

	const isOIDCFlow = flowType.toLowerCase().includes('oidc');
	const isDeviceFlow = flowType.toLowerCase().includes('device');

	return (
		<CollapsibleHeader
			title="Configure Advanced Parameters"
			icon={<FiSettings />}
			defaultCollapsed={defaultCollapsed}
		>
			<InnerContent>
				{/* OIDC-specific parameters */}
				{isOIDCFlow && (
					<>
						{/* Claims Request Builder */}
						<CollapsibleHeader
							title="Advanced Claims Request Builder"
							icon={<FiCode />}
							defaultCollapsed={true}
						>
							<ClaimsRequestBuilder
								value={claimsRequest}
								onChange={setClaimsRequest}
							/>
						</CollapsibleHeader>

						{/* Display Parameter (OIDC only) */}
						<CollapsibleHeader
							title="Display Parameter (OIDC)"
							icon={<FiGlobe />}
							defaultCollapsed={true}
						>
							<DisplayParameterSelector
								value={displayMode as any}
								onChange={setDisplayMode}
							/>
						</CollapsibleHeader>
					</>
				)}

				{/* OAuth Parameters */}
				{!isDeviceFlow && (
					<>
						{/* Resource Indicators (RFC 8707) */}
						<CollapsibleHeader
							title="Resource Indicators (RFC 8707)"
							icon={<FiShield />}
							defaultCollapsed={true}
						>
							<InfoBox>
								<strong>About Resource Indicators:</strong> The <code>resource</code> parameter 
								specifies the target resource server(s) for the access token. This helps 
								authorization servers issue tokens with appropriate scopes and audiences.
							</InfoBox>
							<ResourceParameterInput
								value={resources}
								onChange={setResources}
							/>
						</CollapsibleHeader>

						{/* Enhanced Prompt Selector */}
						<CollapsibleHeader
							title="Enhanced Prompt Parameter"
							icon={<FiSettings />}
							defaultCollapsed={true}
						>
							<InfoBox>
								<strong>About Prompt Parameter:</strong> Controls authentication and consent UI behavior. 
								{isOIDCFlow ? ' OIDC extends this with additional values like select_account and create.' : ''}
							</InfoBox>
							<EnhancedPromptSelector
								value={promptValues as any}
								onChange={setPromptValues}
							/>
						</CollapsibleHeader>
					</>
				)}

				{/* Audience Parameter (available for most flows) */}
				<CollapsibleHeader
					title="Audience Parameter"
					icon={<FiShield />}
					defaultCollapsed={true}
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
			</InnerContent>
		</CollapsibleHeader>
	);
};

export default AdvancedParametersSection;

