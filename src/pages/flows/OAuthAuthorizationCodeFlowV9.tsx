// src/pages/flows/OAuthAuthorizationCodeFlowV9.tsx
// V9 OAuth Authorization Code Flow - Full PingOne UI Upgrade
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import CodeExamplesDisplay from '../../components/CodeExamplesDisplay';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedSecurityFeaturesDemo from '../../components/EnhancedSecurityFeaturesDemo';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import KrogerLoginPopup, { type KrogerLoginCredentials } from '../../components/KrogerLoginPopup';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { AuthenticationModalService } from '../../services/authenticationModalService';
import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { CopyButtonService } from '../../services/copyButtonService';
import {
	EnhancedApiCallData,
	EnhancedApiCallDisplayService,
} from '../../services/enhancedApiCallDisplayService';

// MDI Icon Component for PingOne UI
const MDIIcon: React.FC<{ icon: string; size?: number; ariaLabel?: string; color?: string }> = ({
	icon,
	size,
	ariaLabel,
	color,
}) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<i
			className={`mdi ${iconClass}`}
			style={{
				fontSize: `${size}px`,
				color: color || 'currentColor',
			}}
			aria-label={ariaLabel}
		></i>
	);
};

// MDI Icon Mapping
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertCircle: 'mdi-alert-circle',
		FiArrowRight: 'mdi-arrow-right',
		FiBook: 'mdi-book-open-variant',
		FiCheckCircle: 'mdi-check-circle',
		FiChevronDown: 'mdi-chevron-down',
		FiCode: 'mdi-code-tags',
		FiExternalLink: 'mdi-open-in-new',
		FiGlobe: 'mdi-earth',
		FiInfo: 'mdi-information',
		FiKey: 'mdi-key',
		FiPackage: 'mdi-package-variant',
		FiRefreshCw: 'mdi-refresh',
		FiSend: 'mdi-send',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield-check',
	};
	return iconMap[fiIcon] || fiIcon.replace('Fi', 'mdi-').toLowerCase();
};

// PingOne UI Styled Components
const FlowContainer = styled.div`
	background: #ffffff;
	color: #1a1a1a;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	line-height: 1.6;
	min-height: 100vh;
	padding: 2rem;
	
	.end-user-nano & {
		background: var(--ping-bg-default, #ffffff);
		color: var(--ping-text-primary, #1a1a1a);
	}
`;

const FlowHeader = styled.div`
	text-align: center;
	margin-bottom: 3rem;
	padding: 2rem;
	background: var(--ping-primary-light, #dbeafe);
	border-radius: 12px;
	border: 1px solid var(--ping-primary, #3b82f6);
`;

const FlowTitle = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--ping-primary, #3b82f6);
	margin: 0 0 1rem 0;
`;

const FlowSubtitle = styled.p`
	font-size: 1.125rem;
	color: var(--ping-text-secondary, #6b7280);
	margin: 0;
	max-width: 600px;
	margin: 0 auto;
`;

const StepContainer = styled.div`
	background: var(--ping-bg-menu, rgba(249, 250, 251, 0.8));
	border: 1px solid var(--ping-border-menu, rgba(229, 231, 235, 0.8));
	border-radius: 12px;
	padding: 2rem;
	margin-bottom: 2rem;
	transition: all var(--ping-transition-fast, 0.15s ease-in-out);
	
	&:hover {
		border-color: var(--ping-primary, #3b82f6);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
	}
`;

const StepHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid var(--ping-border-submenu, rgba(209, 213, 219, 0.6));
`;

const StepTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--ping-text-primary, #1a1a1a);
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const StepBadge = styled.span<{ variant?: 'primary' | 'secondary' | 'success' }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.025em;
	
	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
					background: var(--ping-badge-primary, #3b82f6);
					color: white;
				`;
			case 'secondary':
				return `
					background: var(--ping-badge-secondary, #6b7280);
					color: white;
				`;
			case 'success':
				return `
					background: var(--ping-badge-success, #10b981);
					color: white;
				`;
			default:
				return `
					background: var(--ping-badge-default, #f3f4f6);
					color: var(--ping-text-secondary, #6b7280);
				`;
		}
	}}
`;

const PingButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 8px;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s ease-in-out);
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	
	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
					background: var(--ping-primary, #3b82f6);
					color: white;
					
					&:hover {
						background: var(--ping-primary-hover, #2563eb);
						transform: translateY(-1px);
						box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
					}
				`;
			case 'secondary':
				return `
					background: white;
					color: var(--ping-text-primary, #1a1a1a);
					border: 1px solid var(--ping-border-menu, rgba(229, 231, 235, 0.8));
					
					&:hover {
						background: var(--ping-bg-component, rgba(229, 231, 235, 0.4));
						border-color: var(--ping-primary, #3b82f6);
					}
				`;
			default:
				return '';
		}
	}}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

const PingInput = styled.input`
	padding: 0.75rem 1rem;
	border: 1px solid var(--ping-border-submenu, rgba(209, 213, 219, 0.6));
	border-radius: 8px;
	font-size: 1rem;
	background: white;
	color: var(--ping-text-primary, #1a1a1a);
	transition: all var(--ping-transition-fast, 0.15s ease-in-out);
	
	&:focus {
		outline: none;
		border-color: var(--ping-primary, #3b82f6);
		box-shadow: 0 0 0 3px var(--ping-primary-light, #dbeafe);
	}
	
	&::placeholder {
		color: var(--ping-text-muted, #9ca3af);
	}
`;

const PingCard = styled.div`
	background: white;
	border: 1px solid var(--ping-border-submenu, rgba(209, 213, 219, 0.6));
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: all var(--ping-transition-fast, 0.15s ease-in-out);
	
	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: var(--ping-primary, #3b82f6);
	}
`;

// Main Component
const OAuthAuthorizationCodeFlowV9: React.FC = () => {
	// Component implementation would go here
	// This is a template showing the PingOne UI styling approach

	return (
		<FlowContainer className="end-user-nano">
			<FlowHeader>
				<FlowTitle>
					<MDIIcon icon="FiShield" size={32} color="var(--ping-primary, #3b82f6)" />
					OAuth 2.0 Authorization Code Flow V9
				</FlowTitle>
				<FlowSubtitle>
					Secure OAuth 2.0 authorization code flow with PingOne UI upgrade
				</FlowSubtitle>
			</FlowHeader>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiKey" size={20} color="var(--ping-primary, #3b82f6)" />
						Application Configuration
					</StepTitle>
					<StepBadge variant="primary">Step 1</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Client Configuration</h3>
					<PingInput placeholder="Client ID" />
					<PingInput placeholder="Client Secret" type="password" />
					<PingInput placeholder="Redirect URI" />

					<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
						<PingButton variant="primary">
							<MDIIcon icon="FiSend" size={16} />
							Start Authorization
						</PingButton>
						<PingButton variant="secondary">
							<MDIIcon icon="FiSettings" size={16} />
							Advanced Settings
						</PingButton>
					</div>
				</PingCard>
			</StepContainer>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiCheckCircle" size={20} color="var(--ping-badge-success, #10b981)" />
						Authorization Complete
					</StepTitle>
					<StepBadge variant="success">Step 2</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Authorization Code Received</h3>
					<p>Successfully obtained authorization code from PingOne</p>

					<PingButton variant="primary">
						<MDIIcon icon="FiArrowRight" size={16} />
						Exchange for Tokens
					</PingButton>
				</PingCard>
			</StepContainer>
		</FlowContainer>
	);
};

export default OAuthAuthorizationCodeFlowV9;
