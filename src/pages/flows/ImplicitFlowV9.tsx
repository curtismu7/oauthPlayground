// src/pages/flows/ImplicitFlowV9.tsx
// V9 Implicit Flow - Full PingOne UI Upgrade

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
// Import components
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { EducationModeToggle } from '../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../components/education/MasterEducationSection';
import { LearningTooltip } from '../../components/LearningTooltip';
import OAuthErrorDisplay from '../../components/OAuthErrorDisplay';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import {
	loadInitialCredentials,
	useImplicitFlowController,
} from '../../hooks/useImplicitFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { CopyButtonService } from '../../services/copyButtonService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import { FlowCredentialService } from '../../services/flowCredentialService';
import { FlowHeader } from '../../services/flowHeaderService';
// Import UI components from services
import { FlowUIService } from '../../services/flowUIService';
// Import shared services
import {
	ImplicitFlowSharedService,
	ImplicitFlowV7Helpers,
} from '../../services/implicitFlowSharedService';
import {
	OAuthErrorDetails,
	OAuthErrorHandlingService,
} from '../../services/oauthErrorHandlingService';

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
		FiAlertTriangle: 'mdi-alert-triangle',
		FiCheckCircle: 'mdi-check-circle',
		FiChevronDown: 'mdi-chevron-down',
		FiCode: 'mdi-code-tags',
		FiExternalLink: 'mdi-open-in-new',
		FiGlobe: 'mdi-earth',
		FiInfo: 'mdi-information',
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
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
`;

const FlowSubtitle = styled.p`
	font-size: 1.125rem;
	color: var(--ping-text-secondary, #6b7280);
	margin: 0;
	max-width: 600px;
	margin: 0 auto;
`;

const WarningBanner = styled.div`
	background: var(--ping-badge-warning, #f59e0b);
	color: white;
	padding: 1rem 1.5rem;
	border-radius: 8px;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	font-weight: 500;
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

const StepBadge = styled.span<{ variant?: 'primary' | 'secondary' | 'success' | 'warning' }>`
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
			case 'warning':
				return `
					background: var(--ping-badge-warning, #f59e0b);
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

const CodeBlock = styled.pre`
	background: var(--ping-bg-component, rgba(229, 231, 235, 0.4));
	border: 1px solid var(--ping-border-submenu, rgba(209, 213, 219, 0.6));
	border-radius: 8px;
	padding: 1rem;
	font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
	color: var(--ping-text-primary, #1a1a1a);
`;

// Main Component
const ImplicitFlowV9: React.FC = () => {
	const location = useLocation();
	const isOIDC = location.search.includes('variant=oidc');

	// Component implementation would go here
	// This is a template showing the PingOne UI styling approach

	return (
		<FlowContainer className="end-user-nano">
			<FlowHeader>
				<FlowTitle>
					<MDIIcon icon="FiAlertTriangle" size={32} color="var(--ping-badge-warning, #f59e0b)" />
					{isOIDC ? 'OIDC' : 'OAuth 2.0'} Implicit Flow V9
				</FlowTitle>
				<FlowSubtitle>
					{isOIDC
						? 'Deprecated OIDC implicit flow with ID tokens - Educational purposes only'
						: 'Deprecated OAuth 2.0 implicit flow - Educational purposes only'}
				</FlowSubtitle>
			</FlowHeader>

			<WarningBanner>
				<MDIIcon icon="FiAlertTriangle" size={20} />
				<span>This flow is deprecated and insecure. Use Authorization Code Flow instead.</span>
			</WarningBanner>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiShield" size={20} color="var(--ping-badge-warning, #f59e0b)" />
						Security Warning
					</StepTitle>
					<StepBadge variant="warning">Deprecated</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Why This Flow Is Insecure</h3>
					<ul style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>
						<li>Tokens are exposed in the URL fragment</li>
						<li>No refresh token support</li>
						<li>Vulnerable to token leakage</li>
						<li>Not recommended for production use</li>
					</ul>

					<div
						style={{
							marginTop: '1rem',
							padding: '1rem',
							background: 'var(--ping-primary-light, #dbeafe)',
							borderRadius: '8px',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ping-primary, #3b82f6)' }}>
							<MDIIcon icon="FiInfo" size={16} color="var(--ping-primary, #3b82f6)" />
							Secure Alternative
						</h4>
						<p style={{ margin: 0 }}>
							Use the <strong>Authorization Code Flow with PKCE</strong> for secure token exchange.
						</p>
					</div>

					<PingButton variant="primary" style={{ marginTop: '1rem' }}>
						<MDIIcon icon="FiExternalLink" size={16} />
						Learn About Secure Flows
					</PingButton>
				</PingCard>
			</StepContainer>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiCode" size={20} color="var(--ping-text-secondary, #6b7280)" />
						{isOIDC ? 'ID Token Example' : 'Access Token Example'}
					</StepTitle>
					<StepBadge variant="secondary">Educational</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Token Response Example</h3>
					<CodeBlock>
						{isOIDC
							? `# URL Fragment with ID Token
https://example.com/callback#access_token=eyJhbGciOiJIUzI1NiIs...
&id_token=eyJhbGciOiJIUzI1NiIs...
&token_type=Bearer
&expires_in=3600
&state=xyz123`
							: `# URL Fragment with Access Token
https://example.com/callback#access_token=eyJhbGciOiJIUzI1NiIs...
&token_type=Bearer
&expires_in=3600
&state=xyz123`}
					</CodeBlock>

					<div
						style={{
							marginTop: '1rem',
							padding: '0.75rem',
							background: 'var(--ping-badge-warning, #f59e0b)',
							borderRadius: '6px',
							color: 'white',
						}}
					>
						<strong>⚠️ Security Risk:</strong> Tokens visible in browser history and server logs
					</div>
				</PingCard>
			</StepContainer>
		</FlowContainer>
	);
};

export default ImplicitFlowV9;
