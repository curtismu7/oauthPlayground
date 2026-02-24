// src/pages/flows/ClientCredentialsFlowV9.tsx
// V9 Client Credentials Flow - Full PingOne UI Upgrade

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { EducationModeToggle } from '../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../components/education/MasterEducationSection';
import { LearningTooltip } from '../../components/LearningTooltip';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { usePageScroll } from '../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { CopyButtonService } from '../../services/copyButtonService';
import { FlowCredentialService } from '../../services/flowCredentialService';
import FlowUIService from '../../services/flowUIService';
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
		FiCheckCircle: 'mdi-check-circle',
		FiChevronDown: 'mdi-chevron-down',
		FiCode: 'mdi-code-tags',
		FiExternalLink: 'mdi-open-in-new',
		FiInfo: 'mdi-information',
		FiKey: 'mdi-key',
		FiRefreshCw: 'mdi-refresh',
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
	background: linear-gradient(135deg, var(--ping-primary, #3b82f6) 0%, #2563eb 100%);
	color: #ffffff;
	padding: 2rem;
	border-radius: 12px 12px 0 0;
	margin: -2rem -2rem 2rem -2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
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
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	
	${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return ``;
			case 'secondary':
				return `
					background: rgba(255, 255, 255, 0.1);
					border: 1px solid rgba(255, 255, 255, 0.2);
				`;
			case 'success':
				return `
					background: rgba(16, 185, 129, 0.2);
					border: 1px solid rgba(16, 185, 129, 0.3);
				`;
			default:
				return ``;
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
					background: rgba(255, 255, 255, 0.2);
					color: white;
					border: 1px solid rgba(255, 255, 255, 0.3);
					
					&:hover {
						background: rgba(255, 255, 255, 0.3);
						transform: translateY(-1px);
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

const ServerIcon = styled.div`
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
const ClientCredentialsFlowV9: React.FC = () => {
	// Component implementation would go here
	// This is a template showing the PingOne UI styling approach

	return (
		<FlowContainer className="end-user-nano">
			<FlowHeader>
				<FlowTitle>
					<ServerIcon>
						<MDIIcon icon="FiSettings" size={24} color="var(--ping-primary, #3b82f6)" />
					</ServerIcon>
					OAuth 2.0 Client Credentials Flow V9
				</FlowTitle>
				<FlowSubtitle>Machine-to-machine authentication without user interaction</FlowSubtitle>
			</FlowHeader>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiKey" size={20} color="white" />
						Application Configuration
					</StepTitle>
					<StepBadge variant="primary">M2M</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Client Credentials</h3>
					<div style={{ display: 'grid', gap: '1rem' }}>
						<PingInput placeholder="Client ID" />
						<PingInput placeholder="Client Secret" type="password" />
						<PingInput placeholder="Token URL" />
					</div>

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
							M2M Authentication
						</h4>
						<p style={{ margin: 0 }}>
							Perfect for server-to-server communication and background processes.
						</p>
					</div>

					<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
						<PingButton variant="primary">
							<MDIIcon icon="FiRefreshCw" size={16} />
							Request Token
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
						<MDIIcon icon="FiCheckCircle" size={20} color="white" />
						Token Received
					</StepTitle>
					<StepBadge variant="success">Success</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Access Token Generated</h3>
					<CodeBlock>
						{`# Token Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write admin"
}`}
					</CodeBlock>

					<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
						<PingButton variant="primary">
							<MDIIcon icon="FiCode" size={16} />
							View Token Details
						</PingButton>
						<PingButton variant="secondary">
							<MDIIcon icon="FiCopy" size={16} />
							Copy Token
						</PingButton>
					</div>
				</PingCard>
			</StepContainer>

			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiShield" size={20} color="white" />
						Security Information
					</StepTitle>
					<StepBadge variant="secondary">Secure</StepBadge>
				</StepHeader>

				<PingCard>
					<h3>Client Credentials Security</h3>
					<ul style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>
						<li>Never expose client secrets in frontend code</li>
						<li>Use secure storage for credentials</li>
						<li>Implement proper token validation</li>
						<li>Rotate credentials regularly</li>
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
							<MDIIcon icon="FiAlertCircle" size={16} />
							Security Best Practice
						</h4>
						<p style={{ margin: 0 }}>
							Store client credentials securely using environment variables or secret management
							systems.
						</p>
					</div>
				</PingCard>
			</StepContainer>
		</FlowContainer>
	);
};

export default ClientCredentialsFlowV9;
