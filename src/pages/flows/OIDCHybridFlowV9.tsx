// src/pages/flows/OIDCHybridFlowV9.tsx
// V9 OIDC Hybrid Flow - Full PingOne UI Upgrade

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import { LearningTooltip } from '../../components/LearningTooltip';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { useHybridFlowControllerV7 } from '../../hooks/useHybridFlowControllerV7';
import { usePageScroll } from '../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { CopyButtonService } from '../../services/copyButtonService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import { FlowCredentialService } from '../../services/flowCredentialService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import {
	HybridFlowCollapsibleSectionsManager,
	HybridFlowDefaults,
	HybridFlowEducationalContent,
	HybridFlowResponseTypeManager,
	HybridFlowTokenProcessor,
	log,
} from '../../services/hybridFlowSharedService';
import type { V7FlowName } from '../../services/sharedService';
// Import V7 Shared Service for compliance features
import { V7SharedService } from '../../services/sharedService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

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
		FiExternalLink: 'mdi-open-in-new',
		FiGlobe: 'mdi-earth',
		FiInfo: 'mdi-information',
		FiKey: 'mdi-key',
		FiRefreshCw: 'mdi-refresh',
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

const HybridIcon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	background: var(--ping-primary-light, #dbeafe);
	border-radius: 12px;
	margin-bottom: 1rem;
`;

// Main Component
const OIDCHybridFlowV9: React.FC = () => {
	// Component implementation would go here
	// This is a template showing the PingOne UI styling approach

	return (
		<FlowContainer className="end-user-nano">
			<FlowHeader>
				<FlowTitle>
					<HybridIcon>
						<MDIIcon icon="FiGlobe" size={24} color="var(--ping-primary, #3b82f6)" />
					</HybridIcon>
					OIDC Hybrid Flow V9
				</FlowTitle>
				<FlowSubtitle>
					Combination of authorization code and implicit flows for advanced OIDC scenarios
				</FlowSubtitle>
			</FlowHeader>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiKey" size={20} color="var(--ping-primary, #3b82f6)" />
						Hybrid Authorization
					</StepTitle>
					<StepBadge variant="primary">Advanced</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Hybrid Flow Overview</h3>
					<p>
						The OIDC Hybrid Flow combines the security of authorization code flow with the immediacy
						of implicit flow.
					</p>

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
							Response Types
						</h4>
						<p style={{ margin: 0 }}>
							Uses <code>code id_token token</code> response type for maximum flexibility.
						</p>
					</div>

					<CodeBlock style={{ marginTop: '1rem' }}>
						{`# Authorization Request
GET /authorize?
  response_type=code%20id_token%20token
  client_id=your_client_id
  redirect_uri=https://example.com/callback
  scope=openid%20profile%20email
  state=xyz123
  nonce=abc456`}
					</CodeBlock>
				</PingCard>
			</StepContainer>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiCheckCircle" size={20} color="var(--ping-badge-success, #10b981)" />
						Token Response
					</StepTitle>
					<StepBadge variant="success">Complete</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Hybrid Flow Response</h3>
					<CodeBlock>
						{`# URL Fragment Response
https://example.com/callback#
  code=SplxlOBeZQQYbYS6WxSbIA
  id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  access_token=SlAV32hkKG...
  token_type=Bearer
  expires_in=3600
  state=xyz123`}
					</CodeBlock>

					<div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
						<div
							style={{
								padding: '0.75rem',
								background: 'var(--ping-bg-component, rgba(229, 231, 235, 0.4))',
								borderRadius: '6px',
							}}
						>
							<strong>Authorization Code:</strong> Exchange for refresh tokens
						</div>
						<div
							style={{
								padding: '0.75rem',
								background: 'var(--ping-bg-component, rgba(229, 231, 235, 0.4))',
								borderRadius: '6px',
							}}
						>
							<strong>ID Token:</strong> User authentication verified
						</div>
						<div
							style={{
								padding: '0.75rem',
								background: 'var(--ping-bg-component, rgba(229, 231, 235, 0.4))',
								borderRadius: '6px',
							}}
						>
							<strong>Access Token:</strong> Immediate API access
						</div>
					</div>
				</PingCard>
			</StepContainer>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiShield" size={20} color="var(--ping-text-secondary, #6b7280)" />
						Security Considerations
					</StepTitle>
					<StepBadge variant="secondary">Security</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Hybrid Flow Security</h3>
					<ul style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>
						<li>Requires nonce parameter for replay protection</li>
						<li>ID Token validation is mandatory</li>
						<li>Authorization code should be exchanged for refresh tokens</li>
						<li>More complex than standard flows</li>
					</ul>

					<div
						style={{
							marginTop: '1rem',
							padding: '1rem',
							background: 'var(--ping-badge-warning, #f59e0b)',
							borderRadius: '8px',
							color: 'white',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>
							<MDIIcon icon="FiAlertTriangle" size={16} />
							Use Cases
						</h4>
						<p style={{ margin: 0 }}>
							Best for applications needing immediate access tokens while maintaining refresh token
							capability.
						</p>
					</div>

					<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
						<PingButton variant="primary">
							<MDIIcon icon="FiExternalLink" size={16} />
							Learn More
						</PingButton>
						<PingButton variant="secondary">
							<MDIIcon icon="FiRefreshCw" size={16} />
							Test Flow
						</PingButton>
					</div>
				</PingCard>
			</StepContainer>
		</FlowContainer>
	);
};

export default OIDCHybridFlowV9;
