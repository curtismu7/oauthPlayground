// src/pages/flows/DeviceAuthorizationFlowV9.tsx
// V9 Device Authorization Flow - Full PingOne UI Upgrade

import { BarChart3, Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
import DeviceTypeSelector from '../../components/DeviceTypeSelector';
import DynamicDeviceFlow from '../../components/DynamicDeviceFlow';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import InteractiveTutorial from '../../components/InteractiveTutorial';
import { LearningTooltip } from '../../components/LearningTooltip';
import OAuthErrorDisplay from '../../components/OAuthErrorDisplay';
import PerformanceMonitor from '../../components/PerformanceMonitor';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import SecurityAnalyticsDashboard from '../../components/SecurityAnalyticsDashboard';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useUISettings } from '../../contexts/UISettingsContext';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import {
	type DeviceAuthCredentials,
	useDeviceAuthorizationFlow,
} from '../../hooks/useDeviceAuthorizationFlow';

// MDI Icon Component for PingOne UI
const MDIIcon: React.FC<{ icon: string; size?: number; ariaLabel?: string; color?: string }> = ({ 
	icon, 
	size, 
	ariaLabel, 
	color 
}) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<i 
			className={`mdi ${iconClass}`} 
			style={{ 
				fontSize: `${size}px`,
				color: color || 'currentColor'
			}} 
			aria-label={ariaLabel}
		></i>
	);
};

// MDI Icon Mapping
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		'FiAlertCircle': 'mdi-alert-circle',
		'FiAlertTriangle': 'mdi-alert-triangle',
		'FiCheckCircle': 'mdi-check-circle',
		'FiChevronDown': 'mdi-chevron-down',
		'FiClock': 'mdi-clock',
		'FiCopy': 'mdi-content-copy',
		'FiExternalLink': 'mdi-open-in-new',
		'FiInfo': 'mdi-information',
		'FiKey': 'mdi-key',
		'FiMonitor': 'mdi-monitor',
		'FiRefreshCw': 'mdi-refresh',
		'FiShield': 'mdi-shield-check',
		'FiSmartphone': 'mdi-cellphone',
		'FiX': 'mdi-close',
		'FiZap': 'mdi-flash',
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

const QRCodeContainer = styled.div`
	background: white;
	border: 2px solid var(--ping-border-menu, rgba(229, 231, 235, 0.8));
	border-radius: 12px;
	padding: 2rem;
	text-align: center;
	display: inline-block;
	
	svg {
		border-radius: 8px;
		overflow: hidden;
	}
`;

const DeviceIcon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	background: var(--ping-primary-light, #dbeafe);
	border-radius: 12px;
	margin-bottom: 1rem;
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
const DeviceAuthorizationFlowV9: React.FC = () => {
	const location = useLocation();
	const isOIDC = location.search.includes('variant=oidc');
	
	// Component implementation would go here
	// This is a template showing the PingOne UI styling approach
	
	return (
		<FlowContainer className="end-user-nano">
			<FlowHeader>
				<FlowTitle>
					<DeviceIcon>
						<MDIIcon icon="FiSmartphone" size={24} color="var(--ping-primary, #3b82f6)" />
					</DeviceIcon>
					{isOIDC ? 'OIDC' : 'OAuth 2.0'} Device Authorization Flow V9
				</FlowTitle>
				<FlowSubtitle>
					{isOIDC 
						? 'Secure device authorization for OIDC with PingOne'
						: 'Secure device authorization for OAuth 2.0 with PingOne'
					}
				</FlowSubtitle>
			</FlowHeader>
			
			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiMonitor" size={20} color="var(--ping-primary, #3b82f6)" />
						Device Selection
					</StepTitle>
					<StepBadge variant="primary">Step 1</StepBadge>
				</StepHeader>
				
				<PingCard>
					<h3>Choose Device Type</h3>
					<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
						<PingButton variant="secondary">
							<MDIIcon icon="FiMonitor" size={16} />
							Smart TV
						</PingButton>
						<PingButton variant="secondary">
							<MDIIcon icon="FiSmartphone" size={16} />
							Mobile Device
						</PingButton>
						<PingButton variant="secondary">
							<MDIIcon icon="FiZap" size={16} />
							IoT Device
						</PingButton>
					</div>
					
					<div style={{ marginTop: '1rem' }}>
						<h4>Device Code</h4>
						<CodeBlock>
							{`Device Code: ABCD-EFGH-IJKL-MNOP
User Code: 1234-5678
Verification URL: https://example.com/device`}
						</CodeBlock>
						
						<PingButton variant="primary" style={{ marginTop: '1rem' }}>
							<MDIIcon icon="FiCopy" size={16} />
							Copy User Code
						</PingButton>
					</div>
				</PingCard>
			</StepContainer>
			
			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiClock" size={20} color="var(--ping-text-secondary, #6b7280)" />
						Awaiting User Authorization
					</StepTitle>
					<StepBadge variant="secondary">Step 2</StepBadge>
				</StepHeader>
				
				<PingCard>
					<h3>Scan QR Code or Visit URL</h3>
					<div style={{ textAlign: 'center', marginBottom: '1rem' }}>
						<QRCodeContainer>
							{/* QR Code would be generated here */}
							<div style={{ width: '200px', height: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<MDIIcon icon="FiMonitor" size={48} color="var(--ping-text-muted, #9ca3af)" />
							</div>
						</QRCodeContainer>
					</div>
					
					<div style={{ textAlign: 'center' }}>
						<p style={{ marginBottom: '1rem', color: 'var(--ping-text-secondary, #6b7280)' }}>
							Or visit: <strong>https://example.com/device</strong>
						</p>
						<p style={{ fontSize: '0.875rem', color: 'var(--ping-text-muted, #9ca3af)' }}>
							Enter user code: <strong>1234-5678</strong>
						</p>
					</div>
					
					<PingButton variant="secondary">
						<MDIIcon icon="FiRefreshCw" size={16} />
						Refresh Status
					</PingButton>
				</PingCard>
			</StepContainer>
			
			<StepContainer>
				<StepHeader>
					<StepTitle>
						<MDIIcon icon="FiCheckCircle" size={20} color="var(--ping-badge-success, #10b981)" />
						Authorization Complete
					</StepTitle>
					<StepBadge variant="success">Step 3</StepBadge>
				</StepHeader>
				
				<PingCard>
					<h3>Device Authorized Successfully</h3>
					<p>Device has been authorized and tokens are ready for exchange.</p>
					
					<CodeBlock>
{isOIDC ? `# Token Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "id_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}` : `# Token Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}`}
					</CodeBlock>
					
					<PingButton variant="primary" style={{ marginTop: '1rem' }}>
						<MDIIcon icon="FiKey" size={16} />
						Use Access Token
					</PingButton>
				</PingCard>
			</StepContainer>
		</FlowContainer>
	);
};

export default DeviceAuthorizationFlowV9;
