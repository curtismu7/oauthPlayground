// src/pages/flows/DeviceAuthorizationFlowV9_New.tsx
// V7 Unified OAuth/OIDC Device Authorization Grant (RFC 8628) - Complete Implementation

import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiMonitor,
	FiRefreshCw,
	FiShield,
	FiSmartphone,
	FiX,
	FiZap,
} from '@icons';
import { BarChart3, Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import AnalyticsDashboard from '../../../components/AnalyticsDashboard';
import DeviceTypeSelector from '../../../components/DeviceTypeSelector';
import DynamicDeviceFlow from '../../../components/DynamicDeviceFlow';
import { EnhancedApiCallDisplay } from '../../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../../components/InfoBlocks';
import InteractiveTutorial from '../../../components/InteractiveTutorial';
import { LearningTooltip } from '../../../components/LearningTooltip';
import OAuthErrorDisplay from '../../../components/OAuthErrorDisplay';
import PerformanceMonitor from '../../../components/PerformanceMonitor';
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../../components/ResultsPanel';
import SecurityAnalyticsDashboard from '../../../components/SecurityAnalyticsDashboard';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import TokenIntrospect from '../../../components/TokenIntrospect';
import { useUISettings } from '../../../contexts/UISettingsContext';
import { useCredentialBackup } from '../../../hooks/useCredentialBackup';
import {
	type DeviceAuthCredentials,
	useDeviceAuthorizationFlow,
} from '../../../hooks/useDeviceAuthorizationFlow';
import { usePageScroll } from '../../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../../services/comprehensiveFlowDataService';
import { deviceTypeService } from '../../../services/deviceTypeService';
import { EnhancedApiCallDisplayService } from '../../../services/enhancedApiCallDisplayService';
import { FlowCredentialService } from '../../../services/flowCredentialService';
import { FlowHeader as StandardFlowHeader } from '../../../services/flowHeaderService';
import { FlowUIService } from '../../../services/flowUIService';
import {
	OAuthErrorDetails,
	OAuthErrorHandlingService,
} from '../../../services/oauthErrorHandlingService';
import { oidcDiscoveryService } from '../../../services/oidcDiscoveryService';
import { themeService } from '../../../services/themeService';
import {
	IntrospectionApiCallData,
	TokenIntrospectionService,
} from '../../../services/tokenIntrospectionService';
// V9 credential validation is not used in this flow yet
import { checkCredentialsAndWarn } from '../../../utils/credentialsWarningService';
import { storeFlowNavigationState } from '../../../utils/flowNavigation';
import { logger } from '../../../utils/logger';
import { v4ToastManager } from '../../../utils/v4ToastMessages';

// Get UI components from FlowUIService
const FlowContainer = FlowUIService.getContainer();
const FlowContent = FlowUIService.getContentWrapper();

const FlowHeader = styled.div<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'};
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 1rem 1rem 0 0;
	box-shadow: ${(props) =>
		props.$variant === 'oidc'
			? '0 10px 25px rgba(59, 130, 246, 0.2)'
			: '0 10px 25px rgba(22, 163, 74, 0.2)'};
	max-width: 90rem;
	margin: 0 auto;
`;

const FlowTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
	color: #ffffff;
`;

const FlowSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0.5rem 0 0 0;
`;

const StepBadge = styled.span<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(22, 163, 74, 0.2)'};
	border: 1px solid ${(props) => (props.$variant === 'oidc' ? '#60a5fa' : '#4ade80')};
	color: ${(props) => (props.$variant === 'oidc' ? '#dbeafe' : '#bbf7d0')};
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	display: inline-block;
	margin-bottom: 0.5rem;
`;

const CollapsibleSection = styled.section`
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: var(--color-surface, #ffffff);
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0c4a6e;
	transition: background 0.2s ease;
	line-height: 1.4;
	min-height: 72px;
	gap: 0.75rem;

	&:hover {
		background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: transform 0.2s ease;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			if ($variant === 'error') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'error') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: var(--font-size-base, 1rem);
	font-weight: 600;
	color: var(--color-text-primary, #0f172a);
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: var(--font-size-sm, 0.95rem);
	color: var(--color-text-secondary, #3f3f46);
	line-height: 1.7;
	margin: 0;
`;

const GeneratedContentBox = styled.div`
	background-color: #dbeafe;
	border: 1px solid #3b82f6;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #3b82f6;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #3b82f6;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #1e3a8a;
	word-break: break-all;
	background-color: #eff6ff;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #bfdbfe;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: var(--font-size-sm, 0.875rem);
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #22c55e;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #16a34a;
		}
	`}

	${({ $variant }) =>
		$variant === 'secondary' &&
		`
		background-color: #0ea5e9;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #0284c7;
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: #ef4444;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #dc2626;
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: transparent;
		color: #1e40af;
		border-color: #bfdbfe;
		&:hover:not(:disabled) {
			background-color: #eff6ff;
			border-color: #3b82f6;
		}
	`}

	${({ $variant }) =>
		!$variant &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}
`;

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the Device Authorization Code Flow',
	},
	{ title: 'Step 1: Request Device Code', subtitle: 'Initiate device authorization' },
	{ title: 'Step 2: User Authorization & Polling', subtitle: 'Scan QR code and watch TV update' },
	{ title: 'Step 3: Tokens Received', subtitle: 'View and analyze tokens' },
	{ title: 'Step 4: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{
		title: 'Step 5: Analytics & Monitoring',
		subtitle: 'View flow analytics and performance metrics',
	},
	{ title: 'Step 6: Flow Complete', subtitle: 'Summary and next steps' },
] as const;

type SectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'deviceCodeOverview'
	| 'deviceCodeDetails'
	| 'userAuthOverview'
	| 'userAuthDetails'
	| 'pollingOverview'
	| 'pollingDetails'
	| 'tokensOverview'
	| 'tokensDetails'
	| 'userInfoOverview'
	| 'userInfoDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails'
	| 'analytics'
	| 'tutorial'
	| 'uiSettings'
	| 'deviceSelection';

// Styled Components
const CountdownTimer = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #3b82f6;
	text-align: center;
	padding: 1.5rem;
	font-family: 'Courier New', monospace;
	background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
	border-radius: 0.5rem;
	border: 2px solid #3b82f6;
	margin: 1rem 0;
`;

const _SmartTVContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
	margin: 2rem 0;
`;

const _SmartTV = styled.div<{
	$isWaiting: boolean;
	$accentStart: string;
	$accentEnd: string;
}>`
	width: 100%;
	max-width: 900px;
	margin: 0 auto;
	background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
	border-radius: 1rem;
	padding: 2rem;
	color: #ffffff;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	position: relative;
	overflow: visible;
	border: 12px solid #0f172a;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: ${({ $accentStart, $accentEnd }) =>
			`linear-gradient(90deg, ${$accentStart} 0%, ${$accentEnd} 100%)`};
		animation: ${({ $isWaiting }) => ($isWaiting ? 'shimmer 2s infinite' : 'none')};
		background-size: 200% 100%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -30px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 30px;
		background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
		border-radius: 0 0 12px 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
`;

const _TVScreen = styled.div<{ $showContent?: boolean }>`
	background: ${({ $showContent }) =>
		$showContent ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)' : '#000000'};
	border: 2px solid #1e293b;
	border-radius: 0.5rem;
	padding: ${({ $showContent }) => ($showContent ? '2rem' : '3rem')};
	margin-bottom: 1rem;
	min-height: 350px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
	position: relative;
	overflow: hidden;
`;

const TVDisplay = styled.div<{ $primaryColor: string }>`
	font-family: 'Courier New', monospace;
	font-size: 1.25rem;
	color: ${({ $primaryColor }) => $primaryColor};
	line-height: 1.8;
`;

const _TVStatusIndicator = styled.div<{
	$active?: boolean;
	$activeColor: string;
	$inactiveColor: string;
}>`
	background-color: ${({ $active, $activeColor, $inactiveColor }) =>
		$active ? $activeColor : $inactiveColor};
	border-radius: 50%;
	width: 12px;
	height: 12px;
	display: inline-block;
	margin-right: 0.5rem;
	box-shadow: 0 0 10px
		${({ $active, $activeColor, $inactiveColor }) => ($active ? $activeColor : $inactiveColor)};
	transition: all 0.3s ease;

	${({ $active }) =>
		$active &&
		`
		animation: pulse 2s infinite;
	`}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
`;

const AppGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 0.75rem;
	width: 100%;
	padding: 0.5rem;
`;

const AppIcon = styled.div<{ $color: string }>`
	aspect-ratio: 1;
	background: ${({ $color }) => $color};
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: bold;
	color: white;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	cursor: pointer;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.05);
	}
`;

const WelcomeMessage = styled.div`
	font-size: 1.5rem;
	font-weight: 600;
	color: #ffffff;
	margin-bottom: 1rem;
	text-align: center;
`;

const ConsoleLayout = styled.div`
	width: 100%;
	background: radial-gradient(circle at top, rgba(59, 130, 246, 0.4), transparent 55%),
		linear-gradient(135deg, #0f172a 0%, #1f3460 60%, #111827 100%);
	border-radius: 1.25rem;
	padding: 1.75rem;
	box-shadow: inset 0 0 40px rgba(15, 23, 42, 0.6);
	color: #e2e8f0;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const ConsoleTopBar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 0.95rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: #93c5fd;
`;

const StatusDot = styled.span<{ $active?: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 999px;
	margin-left: 0.5rem;
	background: ${({ $active }) => ($active ? '#34d399' : '#f87171')};
	box-shadow: 0 0 10px ${({ $active }) => ($active ? '#34d399' : '#f87171')};
`;

const ConsoleTileGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 1rem;
`;

const ConsoleTile = styled.div<{ $featured?: boolean }>`
	background: ${({ $featured }) =>
		$featured
			? 'linear-gradient(135deg, rgba(147, 197, 253, 0.15), rgba(59, 130, 246, 0.35))'
			: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(17, 24, 39, 0.8))'};
	border-radius: 1rem;
	padding: ${({ $featured }) => ($featured ? '1.5rem' : '1rem')};
	min-height: ${({ $featured }) => ($featured ? '200px' : '110px')};
	display: flex;
	flex-direction: column;
	justify-content: ${({ $featured }) => ($featured ? 'flex-end' : 'space-between')};
	box-shadow: 0 18px 30px rgba(15, 23, 42, 0.4);
	border: 1px solid rgba(148, 163, 184, 0.25);
	position: relative;
	overflow: hidden;
`;

const ConsoleTileTitle = styled.h4`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 700;
	color: #f8fafc;
`;

const ConsoleTileMeta = styled.span`
	font-size: 0.75rem;
	color: rgba(148, 163, 184, 0.8);
`;

const ConsoleTileBadge = styled.span`
	position: absolute;
	top: 1rem;
	left: 1rem;
	padding: 0.35rem 0.75rem;
	font-size: 0.7rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	border-radius: 999px;
	background: rgba(96, 165, 250, 0.35);
	border: 1px solid rgba(191, 219, 254, 0.3);
	color: #bfdbfe;
`;

const ConsoleHero = styled.div`
	background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(30, 64, 175, 0.4));
	border-radius: 1.25rem;
	padding: 2rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	box-shadow: inset 0 0 30px rgba(15, 23, 42, 0.6);
`;

const ConsoleHeroTitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: #f8fafc;
`;

const ConsoleHeroSubtitle = styled.p`
	margin: 0;
	font-size: 0.95rem;
	color: rgba(191, 219, 254, 0.85);
`;

const ConsoleHintRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	font-size: 0.8rem;
	color: rgba(148, 163, 184, 0.85);
`;

const KioskScreen = styled.div`
	width: 100%;
	background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
	border-radius: 1.25rem;
	padding: 2rem;
	box-shadow: 0 30px 40px rgba(15, 23, 42, 0.1);
	color: #1e293b;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const KioskHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const KioskBranding = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-weight: 700;
	font-size: 1.1rem;
`;

const KioskLogo = styled.span`
	font-size: 1.75rem;
	line-height: 1;
`;

const KioskFlightIndicator = styled.div`
	font-size: 0.85rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: #1d4ed8;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.2);
	padding: 0.4rem 0.8rem;
	border-radius: 999px;
`;

const KioskBody = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1.5rem;
	align-items: stretch;
`;

const KioskForm = styled.div`
	background: #f8fafc;
	border-radius: 1rem;
	padding: 1.5rem;
	border: 1px solid #e2e8f0;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const KioskRow = styled.div`
	display: flex;
	justify-content: space-between;
	font-size: 0.9rem;
	color: #334155;
`;

const KioskLabel = styled.span`
	font-weight: 600;
`;

const KioskValue = styled.span`
	font-weight: 500;
	color: #0f172a;
`;

const KioskBoardingPass = styled.div`
	background: radial-gradient(circle at top, rgba(30, 64, 175, 0.85), rgba(30, 58, 138, 0.95));
	border-radius: 1rem;
	padding: 1.75rem;
	color: #e2e8f0;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	position: relative;
	box-shadow: 0 25px 35px rgba(15, 23, 42, 0.3);
`;

const KioskBoardingTitle = styled.span`
	font-size: 0.75rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: rgba(191, 219, 254, 0.75);
`;

const KioskBoardingValue = styled.span`
	font-size: 1.4rem;
	font-weight: 700;
	color: #ffffff;
`;

const KioskDivider = styled.div`
	height: 1px;
	background: rgba(148, 163, 184, 0.3);
	margin: 0.25rem 0 0.5rem;
`;

const KioskCodeBox = styled.div`
	margin-top: auto;
	background: rgba(15, 23, 42, 0.4);
	border-radius: 0.75rem;
	padding: 0.9rem 1.1rem;
	font-size: 1rem;
	letter-spacing: 0.25em;
	font-weight: 700;
	text-align: center;
`;

const KioskActionRow = styled.div`
	display: flex;
	justify-content: space-between;
	font-size: 0.8rem;
	color: #475569;
`;

const _ScrollIndicator = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 1.5rem 0;
	padding: 1rem;
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border: 2px solid #3b82f6;
	border-radius: 0.75rem;
	animation: pulse 2s ease-in-out infinite;

	@keyframes pulse {
		0%, 100% {
			transform: translateY(0);
			opacity: 1;
		}
		50% {
			transform: translateY(5px);
			opacity: 0.8;
		}
	}
`;

const _ScrollText = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`;

const _ScrollArrow = styled.div`
	font-size: 2rem;
	color: #3b82f6;
	animation: bounce 1.5s ease-in-out infinite;

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(8px);
		}
	}
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 1000;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
`;

const ModalContent = styled.div<{ $position?: { x: number; y: number }; $isDragging?: boolean }>`
	background: white;
	border-radius: 1rem;
	padding: 0;
	max-width: 500px;
	width: 100%;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	animation: slideUp 0.3s ease;
	position: ${(props) => (props.$position ? 'fixed' : 'relative')};
	top: ${(props) => (props.$position ? `${props.$position.y}px` : 'auto')};
	left: ${(props) => (props.$position ? `${props.$position.x}px` : 'auto')};
	cursor: ${(props) => (props.$isDragging ? 'grabbing' : 'default')};
	transition: ${(props) => (props.$isDragging ? 'none' : 'all 0.2s ease')};

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 0;
	padding: 1.25rem 2rem;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	border-radius: 1rem 1rem 0 0;
	cursor: grab;
	user-select: none;
	
	&:active {
		cursor: grabbing;
	}
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
`;

const ModalBody = styled.div`
	color: #475569;
	font-size: 1rem;
	line-height: 1.6;
	margin: 0;
	padding: 2rem;
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	padding: 0 2rem 2rem 2rem;
`;

const _QRSection = styled.div`
	width: 100%;
	max-width: 500px;
	margin: 0 auto;
	background-color: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 1rem;
	padding: 2rem;
	text-align: center;
`;

// V7 Variant Selector Components (matching authorization flow V7)
const VariantSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 0.75rem;
	border: 1px solid #cbd5e1;
`;

const VariantButton = styled.button<{ $selected: boolean }>`
	flex: 1;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#cbd5e1')};
	background: ${(props) => (props.$selected ? '#dbeafe' : 'white')};
	color: ${(props) => (props.$selected ? '#1e40af' : '#475569')};
	font-weight: ${(props) => (props.$selected ? '600' : '500')};
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		border-color: #3b82f6;
		background: #dbeafe;
	}
`;

const VariantTitle = styled.div`
	font-size: 1.1rem;
	margin-bottom: 0.25rem;
`;

const VariantDescription = styled.div`
	font-size: 0.875rem;
	opacity: 0.8;
`;

const DeviceAuthorizationFlowV9: React.FC = () => {
	const location = useLocation();

	// Detect default variant based on navigation context
	const getDefaultVariant = (): 'oauth' | 'oidc' => {
		// Check if there's a variant specified in the URL params
		const urlParams = new URLSearchParams(location.search);
		const urlVariant = urlParams.get('variant');
		if (urlVariant === 'oidc' || urlVariant === 'oauth') {
			return urlVariant as 'oauth' | 'oidc';
		}

		// Check navigation state for context
		const state = location.state as { fromSection?: string } | null;
		if (state?.fromSection === 'oidc') {
			return 'oidc';
		}

		// Default to OAuth (base protocol for Device Authorization Grant)
		return 'oauth';
	};

	// V7 Variant State
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());

	const deviceFlow = useDeviceAuthorizationFlow();

	const ensureCredentials = useCallback(
		(updates: Partial<DeviceAuthCredentials>) => {
			const current = deviceFlow.credentials ?? {
				environmentId: '',
				clientId: '',
				scopes: selectedVariant === 'oidc' ? 'openid profile email' : 'openid',
			};

			const next: DeviceAuthCredentials = {
				environmentId: updates.environmentId ?? current.environmentId ?? '',
				clientId: updates.clientId ?? current.clientId ?? '',
				scopes:
					updates.scopes ??
					current.scopes ??
					(selectedVariant === 'oidc' ? 'openid profile email' : 'openid'),
			};

			const optionalFields: Array<
				keyof Pick<DeviceAuthCredentials, 'clientSecret' | 'loginHint' | 'postLogoutRedirectUri'>
			> = ['clientSecret', 'loginHint', 'postLogoutRedirectUri'];

			optionalFields.forEach((field) => {
				const updatedValue = updates[field];
				const existingValue = current[field];
				if (updatedValue !== undefined) {
					(next as Record<typeof field, string>)[field] = updatedValue;
				} else if (existingValue !== undefined) {
					(next as Record<typeof field, string>)[field] = existingValue;
				}
			});

			deviceFlow.setCredentials(next);
		},
		[deviceFlow.credentials, selectedVariant, deviceFlow.setCredentials]
	);

	// V7 Variant Change Handler
	const handleVariantChange = useCallback(
		(variant: 'oauth' | 'oidc') => {
			setSelectedVariant(variant);

			// Update scopes based on variant to meet PingOne requirements
			const currentCredentials = deviceFlow.credentials || {
				environmentId: '',
				clientId: '',
				scopes: '',
			};
			const updatedScopes =
				variant === 'oidc'
					? 'openid profile email' // OIDC MUST include 'openid' scope per spec
					: 'openid'; // PingOne requires 'openid' scope even for OAuth 2.0

			ensureCredentials({
				...currentCredentials,
				scopes: updatedScopes,
			});

			v4ToastManager.showSuccess(
				`Switched to ${variant.toUpperCase()} Device Authorization variant`
			);
		},
		[deviceFlow.credentials, ensureCredentials]
	);

	// V7 Variant Selector Component
	const renderVariantSelector = () => (
		<VariantSelector>
			<VariantButton
				$selected={selectedVariant === 'oauth'}
				onClick={() => handleVariantChange('oauth')}
			>
				<VariantTitle>OAuth 2.0 Device Authorization</VariantTitle>
				<VariantDescription>Access token only - API authorization for devices</VariantDescription>
			</VariantButton>
			<VariantButton
				$selected={selectedVariant === 'oidc'}
				onClick={() => handleVariantChange('oidc')}
			>
				<VariantTitle>OpenID Connect Device Authorization</VariantTitle>
				<VariantDescription>
					ID token + Access token - Authentication + Authorization
				</VariantDescription>
			</VariantButton>
		</VariantSelector>
	);

	// PingOne Advanced Configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'none', // Device flow is public client
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'OPTIONAL',
		responseTypeCode: false,
		responseTypeToken: false,
		responseTypeIdToken: false,
		grantTypeAuthorizationCode: false,
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
		requestParameterSignatureRequirement: 'DEFAULT',
		enableJWKS: false,
		jwksMethod: 'JWKS_URL',
		jwksUrl: '',
		jwks: '',
		requirePushedAuthorizationRequest: false,
		enableDPoP: false,
		dpopAlgorithm: 'ES256',
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});

	const [currentStep, setCurrentStep] = useState(() => {
		// Check for restore_step from token management navigation
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step'); // Clear after use
			console.log('🔗 [DeviceAuthorizationFlowV6] Restoring to step:', step);
			return step;
		}
		return 0;
	});

	// API call tracking for display
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);
	const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
		overview: false,
		flowDiagram: true,
		credentials: false,
		deviceCodeOverview: false,
		deviceCodeDetails: false,
		userAuthOverview: false,
		userAuthDetails: false,
		pollingOverview: false,
		pollingDetails: false,
		tokensOverview: false,
		tokensDetails: false,
		userInfoOverview: false,
		userInfoDetails: false,
		introspectionOverview: false,
		introspectionDetails: false,
		completionOverview: false,
		completionDetails: false,
		analytics: false,
		tutorial: false,
		uiSettings: true, // Collapsed by default
		deviceSelection: false,
	});
	const [_copiedField, setCopiedField] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<unknown>(null);
	const [introspectionResult, setIntrospectionResult] = useState<unknown>(null);
	const [showPollingModal, setShowPollingModal] = useState(false);
	const [hasScrolledToTV, setHasScrolledToTV] = useState(false);
	const { settings } = useUISettings();
	const [selectedDevice, setSelectedDevice] = useState(() => {
		const stored = localStorage.getItem('device_flow_selected_device');
		// Check if the stored device ID exists in the deviceTypeService
		if (stored && deviceTypeService.getDeviceType(stored).id === stored) {
			return stored;
		}
		// Clear invalid stored device ID and use default
		if (stored) {
			localStorage.removeItem('device_flow_selected_device');
		}
		return 'streaming-tv';
	});

	// Error handling state
	const [errorDetails, setErrorDetails] = useState<OAuthErrorDetails | null>(null);
	const deviceConfig = useMemo(
		() => deviceTypeService.getDeviceType(selectedDevice),
		[selectedDevice]
	);
	const _instructionMessage = useMemo(
		() => deviceTypeService.getInstructionMessage(selectedDevice),
		[selectedDevice]
	);
	const waitingMessage = useMemo(
		() => deviceTypeService.getWaitingMessage(selectedDevice),
		[selectedDevice]
	);
	const welcomeMessage = useMemo(
		() => deviceTypeService.getWelcomeMessage(selectedDevice),
		[selectedDevice]
	);
	const deviceApps = useMemo(
		() => deviceTypeService.getDeviceApps(selectedDevice),
		[selectedDevice]
	);
	const lastParsedErrorSignatureRef = useRef<string | null>(null);

	// Modal drag state
	const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const modalRef = useRef<HTMLDivElement>(null);

	// Monitor deviceFlow polling status for errors
	React.useEffect(() => {
		if (deviceFlow.pollingStatus.error) {
			// Parse the error using OAuth Error Handling Service
			const parsedError = OAuthErrorHandlingService.parseOAuthError(
				new Error(deviceFlow.pollingStatus.error),
				{
					flowType: 'device_authorization',
					stepId: 'token-exchange',
					operation: 'pollForTokens',
					credentials: {
						hasClientId: !!deviceFlow.credentials.clientId,
						hasClientSecret: !!deviceFlow.credentials.clientSecret,
						hasEnvironmentId: !!deviceFlow.credentials.environmentId,
						hasRedirectUri: !!deviceFlow.credentials.redirectUri,
						hasScope: !!deviceFlow.credentials.scopes,
					},
					metadata: {
						deviceCode: deviceFlow.deviceCodeData?.device_code ? 'present' : 'missing',
						flowVariant: selectedVariant,
						grantType: 'urn:ietf:params:oauth:grant-type:device_code',
					},
				}
			);
			const signature = JSON.stringify(parsedError);

			if (lastParsedErrorSignatureRef.current !== signature) {
				lastParsedErrorSignatureRef.current = signature;
				setErrorDetails(parsedError);
			}
		} else if (lastParsedErrorSignatureRef.current !== null) {
			// Clear error details on success (only when previously set)
			lastParsedErrorSignatureRef.current = null;
			setErrorDetails(null);
		}
	}, [
		deviceFlow.pollingStatus.error,
		deviceFlow.deviceCodeData?.device_code,
		selectedVariant,
		deviceFlow.credentials.clientId,
		deviceFlow.credentials.clientSecret,
		deviceFlow.credentials.environmentId,
		deviceFlow.credentials.redirectUri,
		deviceFlow.credentials.scopes,
		// Note: Removed credential dependencies to prevent infinite loop
		// The credentials are only used for hasXXX checks in parsedError metadata
		// and don't affect the core error parsing logic
	]);
	const _deviceOptions = useMemo(() => deviceTypeService.getDeviceTypeOptions(), []);

	React.useEffect(() => {
		localStorage.setItem('device_flow_selected_device', selectedDevice);
	}, [selectedDevice]);
	const brandGradient = useMemo(
		() => `linear-gradient(135deg, ${deviceConfig.color} 0%, ${deviceConfig.secondaryColor} 100%)`,
		[deviceConfig.color, deviceConfig.secondaryColor]
	);

	usePageScroll({ pageName: 'Device Authorization Flow V9 - Unified', force: true });

	// Check credentials on mount and show warning if missing
	React.useEffect(() => {
		checkCredentialsAndWarn(deviceFlow.credentials, {
			flowName: 'Device Authorization Flow',
			requiredFields: ['environmentId', 'clientId'],
			showToast: true,
		});
	}, [deviceFlow.credentials]); // Only run once on mount

	// Explicit scroll to top for step 2 (User Authorization)
	React.useEffect(() => {
		if (currentStep === 2) {
			// Force scroll to top when entering User Authorization step
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	}, [currentStep]);

	// Load credentials using V7 standardized storage
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('🔄 [DeviceAuth-V7] Loading credentials with comprehensive service...');

			const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
				flowKey: 'device-authorization-v9',
				useSharedEnvironment: true,
				useSharedDiscovery: true,
			});

			if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
				console.log('✅ [DeviceAuth-V7] Found flow-specific credentials');
				const updatedCredentials = {
					environmentId: flowData.sharedEnvironment?.environmentId || '',
					clientId: flowData.flowCredentials.clientId,
					clientSecret: flowData.flowCredentials.clientSecret,
					redirectUri: flowData.flowCredentials.redirectUri,
					scopes: flowData.flowCredentials.scopes,
				};
				ensureCredentials(updatedCredentials);
			} else if (flowData.sharedEnvironment?.environmentId) {
				console.log('ℹ️ [DeviceAuth-V7] Using shared environment data only');
				const updatedCredentials = {
					environmentId: flowData.sharedEnvironment.environmentId,
				};
				ensureCredentials(updatedCredentials);
			} else {
				console.log('ℹ️ [DeviceAuth-V7] No saved credentials found, using defaults');
			}
		};

		loadCredentials();
	}, [ensureCredentials]); // Empty dependency array - only run once on mount

	// Show polling prompt modal when device code is received
	React.useEffect(() => {
		if (
			deviceFlow.deviceCodeData &&
			!deviceFlow.pollingStatus.isPolling &&
			!deviceFlow.tokens &&
			settings.showPollingPrompt
		) {
			setShowPollingModal(true);
		}
	}, [
		deviceFlow.deviceCodeData,
		deviceFlow.pollingStatus.isPolling,
		deviceFlow.tokens,
		settings.showPollingPrompt,
	]);

	const toggleSection = useCallback((section: SectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(label);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
		setTimeout(() => setCopiedField(null), 2000);
	}, []);

	// Note: Credential handlers are now managed by ComprehensiveCredentialsService
	// The V6 service architecture provides unified credential management with OIDC discovery

	// Load credentials using V7 standardized storage
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('🔄 [DeviceAuth-V7] Loading credentials with comprehensive service...');

			try {
				const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
					flowKey: 'device-authorization-v9',
					useSharedEnvironment: true,
					useSharedDiscovery: true,
				});

				if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
					console.log('✅ [DeviceAuth-V7] Found flow-specific credentials:', {
						hasClientId: !!flowData.flowCredentials.clientId,
						hasEnvironmentId: !!flowData.sharedEnvironment?.environmentId,
						clientIdLength: flowData.flowCredentials.clientId?.length || 0,
					});
					const updatedCredentials = {
						environmentId:
							flowData.sharedEnvironment?.environmentId ||
							flowData.flowCredentials.environmentId ||
							'',
						clientId: flowData.flowCredentials.clientId || '',
						clientSecret: flowData.flowCredentials.clientSecret || '',
						redirectUri: flowData.flowCredentials.redirectUri || '',
						scopes:
							flowData.flowCredentials.scopes ||
							(selectedVariant === 'oidc' ? 'openid profile email' : 'openid'),
					};
					console.log('🔧 [DeviceAuth-V7] Setting loaded credentials:', {
						environmentId: updatedCredentials.environmentId ? '***' : '',
						clientId: updatedCredentials.clientId
							? `${updatedCredentials.clientId.substring(0, 8)}...`
							: 'MISSING',
					});
					deviceFlow.setCredentials(updatedCredentials);
				} else if (flowData.sharedEnvironment?.environmentId) {
					console.log('ℹ️ [DeviceAuth-V7] Using shared environment data only');
					const updatedCredentials = {
						environmentId: flowData.sharedEnvironment.environmentId,
					};
					deviceFlow.setCredentials(updatedCredentials);
				} else {
					console.log('ℹ️ [DeviceAuth-V7] No saved credentials found, using defaults');
				}
			} catch (error) {
				console.error('[DeviceAuth-V7] Failed to load credentials:', error);
			}
		};

		loadCredentials();
	}, [deviceFlow.setCredentials, selectedVariant]);

	// Ensure Device Authorization Flow V9 uses its own credential storage
	// Use JSON.stringify to track actual credential changes, not object reference changes
	useEffect(() => {
		// Save current credentials to flow-specific storage using comprehensiveFlowDataService
		if (
			deviceFlow.credentials &&
			(deviceFlow.credentials.environmentId || deviceFlow.credentials.clientId)
		) {
			console.log('🔧 [Device Authorization V7] Saving credentials to comprehensive service:', {
				flowKey: 'device-authorization-v9',
				environmentId: deviceFlow.credentials.environmentId,
				clientId: `${deviceFlow.credentials.clientId?.substring(0, 8)}...`,
				scopes: deviceFlow.credentials.scopes,
			});

			// Save to comprehensive service with complete isolation (same pattern as other V7 flows)
			try {
				const success = comprehensiveFlowDataService.saveFlowDataComprehensive(
					'device-authorization-v9',
					{
						...(deviceFlow.credentials.environmentId && {
							sharedEnvironment: {
								environmentId: deviceFlow.credentials.environmentId,
								region: deviceFlow.credentials.region || 'us',
								issuerUrl: (() => {
									const regionDomains: Record<string, string> = {
										us: 'auth.pingone.com',
										eu: 'auth.pingone.eu',
										ap: 'auth.pingone.asia',
										ca: 'auth.pingone.ca',
										na: 'auth.pingone.com',
									};
									const domain =
										regionDomains[deviceFlow.credentials.region || 'us'] || 'auth.pingone.com';
									return `https://${domain}/${deviceFlow.credentials.environmentId}`;
								})(),
							},
						}),
						flowCredentials: {
							clientId: deviceFlow.credentials.clientId,
							clientSecret: deviceFlow.credentials.clientSecret,
							redirectUri: deviceFlow.credentials.redirectUri,
							scopes: Array.isArray(deviceFlow.credentials.scopes)
								? deviceFlow.credentials.scopes
								: typeof deviceFlow.credentials.scopes === 'string'
									? deviceFlow.credentials.scopes.split(/\s+/).filter(Boolean)
									: [],
							tokenEndpointAuthMethod: 'client_secret_basic',
							lastUpdated: Date.now(),
						},
					},
					{ showToast: false }
				);

				if (!success) {
					console.error(
						'[Device Authorization V7] Failed to save credentials to comprehensive service'
					);
					v4ToastManager.showError('Failed to save credentials. Please try again.');
				} else {
					console.log('✅ [Device Authorization V7] Credentials saved successfully');
				}
			} catch (error) {
				console.error('[Device Authorization V7] Failed to save credentials:', error);
				v4ToastManager.showError('Failed to save credentials. Please try again.');
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		deviceFlow.credentials?.environmentId,
		deviceFlow.credentials?.clientId,
		deviceFlow.credentials?.clientSecret,
		deviceFlow.credentials?.scopes,
		deviceFlow.credentials?.redirectUri,
		deviceFlow.credentials,
	]);

	const { clearBackup } = useCredentialBackup({
		flowKey: 'device-authorization-v9',
		credentials: deviceFlow.credentials,
		setCredentials: deviceFlow.setCredentials,
		enabled: true,
	});

	const { validateCredentialsAndProceed, CredentialValidationModal } = useV7CredentialValidation({
		flowKey: 'device-authorization-v9',
		credentials: deviceFlow.credentials ?? {},
		currentStep,
		onValidationFailure: (missingFields) => {
			logger.warn('[Device Authorization V7] Missing required credentials:', missingFields);
		},
	});

	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('device-authorization-v6', currentStep, 'oauth');

		// Set flow source for Token Management page
		sessionStorage.setItem('flow_source', 'device-authorization-v6');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'device-authorization-v6',
			tokens: deviceFlow.tokens,
			credentials: deviceFlow.credentials,
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have tokens, pass them to Token Management
		if (deviceFlow.tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', deviceFlow.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'device-authorization-v6');
			console.log(
				'🔍 [DeviceAuthorizationFlowV6] Passing access token to Token Management via localStorage'
			);
		}

		window.location.href = '/token-management';
	}, [deviceFlow.tokens, deviceFlow.credentials, currentStep]);

	const navigateToTokenManagementWithRefreshToken = useCallback(() => {
		// Set flow source for Token Management page
		sessionStorage.setItem('flow_source', 'device-authorization-v6');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'device-authorization-v6',
			tokens: deviceFlow.tokens,
			credentials: deviceFlow.credentials,
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have refresh token, pass it to Token Management
		if (deviceFlow.tokens?.refresh_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', deviceFlow.tokens.refresh_token);
			localStorage.setItem('token_type', 'refresh');
			localStorage.setItem('flow_source', 'device-authorization-v6');
			console.log(
				'🔍 [DeviceAuthorizationFlowV6] Passing refresh token to Token Management via localStorage'
			);
		}

		window.location.href = '/token-management';
	}, [deviceFlow.tokens, deviceFlow.credentials]);

	const handleRequestDeviceCode = useCallback(async () => {
		try {
			await deviceFlow.requestDeviceCode();
			setCurrentStep(2); // Auto-advance to User Authorization step
		} catch (_error) {
			// Error already handled in hook
		}
	}, [deviceFlow]);

	const handleStartPolling = useCallback(() => {
		setShowPollingModal(false);
		// Clear any previous error details
		setErrorDetails(null);
		deviceFlow.startPolling();
		// Stay on current step (User Authorization - step 2) so user can see Smart TV update
		// Don't advance to step 3 - let user see the real-time polling results on the TV display
	}, [deviceFlow]);

	const handleDismissModal = useCallback(() => {
		setShowPollingModal(false);
		setModalPosition(null);
	}, []);

	// Modal drag handlers
	const handleModalMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// Only start drag if clicking on the header, not on buttons or interactive elements
			if (
				(e.target as HTMLElement).closest('button') ||
				(e.target as HTMLElement).closest('select')
			) {
				return;
			}

			if (!modalRef.current) return;

			const rect = modalRef.current.getBoundingClientRect();
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			setIsDragging(true);

			// Initialize position if not set
			if (!modalPosition) {
				const centerX = (window.innerWidth - rect.width) / 2;
				const centerY = (window.innerHeight - rect.height) / 2;
				setModalPosition({ x: centerX, y: centerY });
			}
		},
		[modalPosition]
	);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging || !modalPosition) return;

			const newX = e.clientX - dragOffset.x;
			const newY = e.clientY - dragOffset.y;

			// Keep modal within viewport bounds
			const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 500);
			const maxY = window.innerHeight - (modalRef.current?.offsetHeight || 400);

			setModalPosition({
				x: Math.max(0, Math.min(newX, maxX)),
				y: Math.max(0, Math.min(newY, maxY)),
			});
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, dragOffset, modalPosition]);

	// Center modal when it opens
	useEffect(() => {
		if (showPollingModal && !modalPosition && modalRef.current) {
			const rect = modalRef.current.getBoundingClientRect();
			const centerX = (window.innerWidth - rect.width) / 2;
			const centerY = (window.innerHeight - rect.height) / 2;
			setModalPosition({ x: centerX, y: centerY });
		}
	}, [showPollingModal, modalPosition]);

	const handleReset = useCallback(() => {
		deviceFlow.reset();
		setCurrentStep(0);
		setShowPollingModal(false);
		setUserInfo(null);
		setIntrospectionResult(null);
		setHasScrolledToTV(false);

		// Clear any potential ConfigChecker-related state or cached data
		try {
			// Clear any comparison results or cached application data
			sessionStorage.removeItem('config-checker-diffs');
			sessionStorage.removeItem('config-checker-last-check');
			sessionStorage.removeItem('pingone-app-cache');
			localStorage.removeItem('pingone-applications-cache');

			// Clear any worker token related cache that might be used for pre-flight checks
			sessionStorage.removeItem('worker-token-cache');
			localStorage.removeItem('worker-apps-cache');

			console.log(
				'🔄 [DeviceAuthorizationFlowV9] Reset: cleared ConfigChecker and pre-flight cache data'
			);
		} catch (error) {
			console.warn('[DeviceAuthorizationFlowV9] Failed to clear cache data:', error);
		}

		// Clear Device Authorization Flow V9-specific storage with error handling
		try {
			FlowCredentialService.clearFlowState('device-authorization-v9');
			console.log('🔧 [Device Authorization V7] Cleared flow-specific storage');
		} catch (error) {
			console.error('[Device Authorization V7] Failed to clear flow state:', error);
			v4ToastManager.showError('Failed to clear flow state. Please refresh the page.');
		}

		// Clear credential backup when flow is reset
		try {
			clearBackup();
			console.log('🔧 [Device Authorization V7] Cleared credential backup');
		} catch (error) {
			console.error('[Device Authorization V7] Failed to clear credential backup:', error);
		}
	}, [deviceFlow, clearBackup]);

	// Step validation with enhanced error messages
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					// Step 0: Introduction is always valid
					return true;
				case 1: {
					// Step 1: Must have valid credentials with required fields
					if (!deviceFlow.credentials) return false;
					const creds = deviceFlow.credentials;
					// Check for required fields: environmentId and clientId
					return !!(
						creds.environmentId &&
						creds.environmentId.trim() !== '' &&
						creds.clientId &&
						creds.clientId.trim() !== ''
					);
				}
				case 2:
					// Step 2: Must have device code data
					return !!deviceFlow.deviceCodeData;
				case 3:
					// Step 3: Must have tokens from successful polling
					return !!deviceFlow.tokens;
				case 4:
					// Step 4: Must have tokens for introspection
					return !!deviceFlow.tokens;
				case 5:
					// Step 5: Analytics & Monitoring is always valid
					return true;
				case 6:
					// Step 6: Flow Complete is always valid
					return true;
				default:
					return false;
			}
		},
		[deviceFlow.credentials, deviceFlow.deviceCodeData, deviceFlow.tokens]
	);

	// Get step validation error message
	const getStepValidationMessage = useCallback(
		(stepIndex: number): string => {
			switch (stepIndex) {
				case 1:
					if (!deviceFlow.credentials)
						return 'Credentials are required. Please configure your environment and client settings.';
					return '';
				case 2:
					if (!deviceFlow.deviceCodeData)
						return 'Device code is required. Please request a device code first.';
					return '';
				case 3:
				case 4:
					if (!deviceFlow.tokens)
						return 'Tokens are required. Please complete the device authorization process first.';
					return '';
				default:
					return '';
			}
		},
		[deviceFlow]
	);

	// Don't auto-advance - let user see the TV update and click Next manually
	// This provides better educational experience to see the full authorization flow

	// Show toast when tokens received to draw attention to TV update
	React.useEffect(() => {
		if (deviceFlow.tokens && !hasScrolledToTV) {
			// Scroll to TV display when tokens are received (regardless of current step)
			const tvElement = document.querySelector('[data-tv-display]');
			if (tvElement) {
				tvElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
				setHasScrolledToTV(true);
			}

			v4ToastManager.showSuccess(
				`${deviceConfig.emoji} Authorization successful! Check out your ${deviceConfig.name} display below!`
			);
		}
	}, [deviceFlow.tokens, hasScrolledToTV, deviceConfig]);

	// 20-second fallback scroll timer when polling starts
	React.useEffect(() => {
		if (deviceFlow.pollingStatus.isPolling && !hasScrolledToTV && !deviceFlow.tokens) {
			const fallbackTimer = setTimeout(() => {
				const tvElement = document.querySelector('[data-tv-display]');
				if (tvElement && !hasScrolledToTV) {
					tvElement.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
					});
					setHasScrolledToTV(true);
					v4ToastManager.showSuccess(`👇 Check out your ${deviceConfig.name} display below!`);
				}
			}, 20000); // 20 seconds

			return () => clearTimeout(fallbackTimer);
		}
		return undefined;
	}, [deviceFlow.pollingStatus.isPolling, hasScrolledToTV, deviceFlow.tokens, deviceConfig.name]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return renderIntroduction();
			case 1:
				return renderRequestDeviceCode();
			case 2:
				return renderUserAuthorization(); // Includes polling
			case 3:
				return renderTokensOverview();
			case 4:
				return renderIntrospection(); // Old step 5
			case 5:
				return renderAnalyticsAndMonitoring(); // New analytics step
			case 6:
				return renderCompletion(); // Old step 6

			default:
				return null;
		}
	};

	const renderTokensOverview = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokensOverview')}
					aria-expanded={!collapsedSections.tokensOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Tokens Received
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokensOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokensOverview && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Authorization Complete!</InfoTitle>
								<InfoText>
									The user authorized on their secondary device. Tokens have been issued to this
									device.
								</InfoText>
							</div>
						</InfoBox>

						{deviceFlow.tokens && (
							<>
								{/* Enhanced API Call Display for Token Exchange */}
								<div style={{ marginTop: '1.5rem' }}>
									<EnhancedApiCallDisplay
										apiCall={{
											method: 'POST',
											url: (() => {
												const regionDomains: Record<string, string> = {
													us: 'auth.pingone.com',
													eu: 'auth.pingone.eu',
													ap: 'auth.pingone.asia',
													ca: 'auth.pingone.ca',
													na: 'auth.pingone.com',
												};
												const domain =
													regionDomains[deviceFlow.credentials?.region || 'us'] ||
													'auth.pingone.com';
												return `https://${domain}/${deviceFlow.credentials?.environmentId || '[environmentId]'}/as/token`;
											})(),
											headers: {
												'Content-Type': 'application/x-www-form-urlencoded',
											},
											body: {
												grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
												device_code: '[device_code_from_step_1]',
												client_id: deviceFlow.credentials?.clientId || '[clientId]',
											},
											response: {
												status: 200,
												statusText: 'OK',
												headers: {
													'Content-Type': 'application/json',
													'Cache-Control': 'no-store',
													Pragma: 'no-cache',
												},
												data:
													selectedVariant === 'oidc'
														? {
																access_token:
																	deviceFlow.tokens?.access_token ||
																	'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
																id_token:
																	deviceFlow.tokens?.id_token ||
																	'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
																refresh_token:
																	deviceFlow.tokens?.refresh_token ||
																	'rt_eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
																token_type: 'Bearer',
																expires_in: 3600,
																scope: deviceFlow.tokens?.scope || 'openid profile email',
															}
														: {
																access_token:
																	deviceFlow.tokens?.access_token ||
																	'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
																refresh_token:
																	deviceFlow.tokens?.refresh_token ||
																	'rt_eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
																token_type: 'Bearer',
																expires_in: 3600,
																scope: deviceFlow.tokens?.scope || 'read write',
															},
											},
											flowType: 'device-code',
											stepName: 'token-exchange',
											description: `${selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Device Token Exchange`,
											educationalNotes: [
												'This request exchanges the device_code for access tokens',
												'The device polls this endpoint until the user completes authorization',
												`${selectedVariant === 'oidc' ? 'OIDC response includes ID token for user identity' : 'OAuth response includes access token for API access'}`,
												'Polling continues until success, error, or timeout',
											],
										}}
										options={{
											showEducationalNotes: true,
											showFlowContext: true,
											urlHighlightRules:
												EnhancedApiCallDisplayService.getDefaultHighlightRules('device-code'),
										}}
									/>
								</div>

								{/* Error Display for Token Exchange */}
								{errorDetails && (
									<OAuthErrorDisplay
										errorDetails={errorDetails}
										onDismiss={() => setErrorDetails(null)}
										onRetry={() => {
											setErrorDetails(null);
											handleStartPolling();
										}}
										showCorrelationId={true}
									/>
								)}

								<ResultsSection style={{ marginTop: '1.5rem' }}>
									<ResultsHeading>
										<FiKey size={18} />{' '}
										{selectedVariant === 'oidc' ? 'Tokens Received' : 'Access Token'}
									</ResultsHeading>
									<GeneratedContentBox>
										<ParameterGrid>
											{/* Access Token - Always present */}
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Access Token</ParameterLabel>
												<ParameterValue
													style={{
														fontFamily: 'monospace',
														fontSize: '0.75rem',
													}}
												>
													{deviceFlow.tokens.access_token}
												</ParameterValue>
											</div>

											{/* ID Token - Only for OIDC flows */}
											{selectedVariant === 'oidc' && deviceFlow.tokens.id_token && (
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>ID Token (OIDC)</ParameterLabel>
													<ParameterValue
														style={{
															fontFamily: 'monospace',
															fontSize: '0.75rem',
															backgroundColor: '#f0f9ff',
														}}
													>
														{deviceFlow.tokens.id_token}
													</ParameterValue>
												</div>
											)}

											{/* Refresh Token - If present */}
											{deviceFlow.tokens.refresh_token && (
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Refresh Token</ParameterLabel>
													<ParameterValue
														style={{
															fontFamily: 'monospace',
															fontSize: '0.75rem',
														}}
													>
														{deviceFlow.tokens.refresh_token}
													</ParameterValue>
												</div>
											)}

											{deviceFlow.tokens.token_type && (
												<div>
													<ParameterLabel>Token Type</ParameterLabel>
													<ParameterValue>{deviceFlow.tokens.token_type}</ParameterValue>
												</div>
											)}
											{deviceFlow.tokens.expires_in && (
												<div>
													<ParameterLabel>Expires In</ParameterLabel>
													<ParameterValue>{deviceFlow.tokens.expires_in} seconds</ParameterValue>
												</div>
											)}
											{deviceFlow.tokens.scope && (
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Scope</ParameterLabel>
													<ParameterValue>{deviceFlow.tokens.scope}</ParameterValue>
												</div>
											)}
										</ParameterGrid>
										<ActionRow
											style={{ justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
										>
											<Button onClick={navigateToTokenManagement} $variant="primary">
												<FiExternalLink /> Open Token Management
											</Button>
											<Button
												onClick={() => handleCopy(deviceFlow.tokens!.access_token, 'Access Token')}
												$variant="outline"
											>
												<FiCopy /> Copy Access Token
											</Button>
											{selectedVariant === 'oidc' && deviceFlow.tokens.id_token && (
												<Button
													onClick={() => handleCopy(deviceFlow.tokens!.id_token!, 'ID Token')}
													$variant="outline"
													style={{ backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }}
												>
													<FiCopy /> Copy ID Token
												</Button>
											)}
											{deviceFlow.tokens.refresh_token && (
												<Button
													onClick={() =>
														handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')
													}
													$variant="outline"
												>
													<FiCopy /> Copy Refresh Token
												</Button>
											)}
										</ActionRow>
									</GeneratedContentBox>
								</ResultsSection>

								<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
									<FiInfo size={20} />
									<div>
										<InfoTitle>
											{selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Token Response
											(PingOne)
										</InfoTitle>
										<InfoText>
											{selectedVariant === 'oidc' ? (
												<>
													<strong>OpenID Connect Device Flow</strong> returns an{' '}
													<code>access_token</code>, <code>id_token</code> (for user identity), and
													optionally a <code>refresh_token</code>. The <code>openid</code> scope is
													mandatory per OIDC Core 1.0 specification.
												</>
											) : (
												<>
													<strong>OAuth 2.0 Device Flow (PingOne)</strong> returns an{' '}
													<code>access_token</code> and optionally a <code>refresh_token</code>. No
													ID tokens or identity information, but PingOne still requires the{' '}
													<code>openid</code> scope (non-standard requirement).
												</>
											)}
										</InfoText>
									</div>
								</InfoBox>

								{deviceFlow.tokens.refresh_token && (
									<ResultsSection>
										<ResultsHeading>
											<FiRefreshCw size={18} /> Refresh Token
										</ResultsHeading>
										<GeneratedContentBox>
											<ParameterGrid>
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Refresh Token</ParameterLabel>
													<ParameterValue
														style={{
															fontFamily: 'monospace',
															fontSize: '0.75rem',
														}}
													>
														{deviceFlow.tokens.refresh_token}
													</ParameterValue>
												</div>
											</ParameterGrid>
											<ActionRow style={{ justifyContent: 'center', gap: '0.75rem' }}>
												<Button
													onClick={navigateToTokenManagementWithRefreshToken}
													$variant="primary"
													style={{
														fontSize: '0.9rem',
														fontWeight: '600',
														padding: '0.75rem 1rem',
														backgroundColor: '#f59e0b',
														borderColor: '#f59e0b',
														color: '#ffffff',
													}}
												>
													<FiRefreshCw /> Decode Refresh Token
												</Button>
												<Button
													onClick={() =>
														handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')
													}
													$variant="outline"
												>
													<FiCopy /> Copy Refresh Token
												</Button>
											</ActionRow>
										</GeneratedContentBox>
									</ResultsSection>
								)}
							</>
						)}
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderIntroduction = () => (
		<>
			{/* Device flow already has comprehensive educational content in the sections below */}
			<SectionDivider />

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('overview')}
					aria-expanded={!collapsedSections.overview}
				>
					<CollapsibleTitle>
						<FiMonitor /> Device Authorization Flow Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.overview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiInfo /> What is{' '}
								<LearningTooltip
									variant="learning"
									title="Device Authorization Flow"
									content="OAuth 2.0 grant type (RFC 8628) for devices without browsers. Uses device_code and user_code for authorization."
									placement="top"
								>
									Device Authorization Flow
								</LearningTooltip>
								?
							</ExplanationHeading>
							<InfoText>
								The{' '}
								<LearningTooltip
									variant="learning"
									title="Device Authorization Grant"
									content="RFC 8628 - OAuth 2.0 extension for input-constrained devices. No browser required."
									placement="top"
								>
									Device Authorization Grant (RFC 8628)
								</LearningTooltip>{' '}
								enables{' '}
								<LearningTooltip
									variant="info"
									title="OAuth Client"
									content="Application requesting access"
									placement="top"
								>
									OAuth clients
								</LearningTooltip>{' '}
								on{' '}
								<LearningTooltip
									variant="info"
									title="Input-Constrained Devices"
									content="Devices without keyboards or browsers (smart TVs, IoT, gaming consoles)"
									placement="top"
								>
									input-constrained devices
								</LearningTooltip>{' '}
								to obtain{' '}
								<LearningTooltip
									variant="info"
									title="User Authorization"
									content="User grants permission for app to access resources"
									placement="top"
								>
									user authorization
								</LearningTooltip>{' '}
								without a browser. Perfect for{' '}
								<LearningTooltip
									variant="info"
									title="Smart TVs"
									content="TVs with limited input capabilities"
									placement="top"
								>
									smart TVs
								</LearningTooltip>
								,{' '}
								<LearningTooltip
									variant="info"
									title="IoT Devices"
									content="Internet of Things devices without keyboards"
									placement="top"
								>
									IoT devices
								</LearningTooltip>
								,{' '}
								<LearningTooltip
									variant="info"
									title="CLI Tools"
									content="Command-line interface applications"
									placement="top"
								>
									CLI tools
								</LearningTooltip>
								, and{' '}
								<LearningTooltip
									variant="info"
									title="Gaming Consoles"
									content="Game consoles with limited input"
									placement="top"
								>
									gaming consoles
								</LearningTooltip>
								.
							</InfoText>

							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiSmartphone size={20} />
								<div>
									<InfoTitle>Perfect for:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>Smart TVs and streaming devices</li>
										<li>Command-line tools and scripts</li>
										<li>IoT devices without keyboards</li>
										<li>Gaming consoles</li>
										<li>Devices with limited input capabilities</li>
									</ul>
								</div>
							</InfoBox>

							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiShield size={20} />
								<div>
									<InfoTitle>
										<LearningTooltip
											variant="info"
											title="RFC 8628"
											content="OAuth 2.0 Device Authorization Grant specification - defines device flow for input-constrained devices"
											placement="top"
										>
											RFC 8628
										</LearningTooltip>{' '}
										Specification:
									</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="Device Code"
													content="Long secret code used by device to poll token endpoint. Not shown to user."
													placement="top"
												>
													Device Code
												</LearningTooltip>
											</strong>
											: Short-lived code used for{' '}
											<LearningTooltip
												variant="info"
												title="Polling"
												content="Device repeatedly requests tokens until user authorizes"
												placement="top"
											>
												polling
											</LearningTooltip>{' '}
											token endpoint
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="User Code"
													content="Short, human-readable code displayed to user (e.g., 'WDJB-MJHT'). User enters this on verification URL."
													placement="top"
												>
													User Code
												</LearningTooltip>
											</strong>
											: Human-readable code for{' '}
											<LearningTooltip
												variant="info"
												title="User Verification"
												content="User enters code on verification URL to authorize device"
												placement="top"
											>
												user verification
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="Verification URI"
													content="URL where user visits and enters user_code to authorize the device"
													placement="top"
												>
													Verification URI
												</LearningTooltip>
											</strong>
											: URL where user completes{' '}
											<LearningTooltip
												variant="info"
												title="Authorization"
												content="User grants permission"
												placement="top"
											>
												authorization
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="Polling"
													content="Device repeatedly requests tokens from token endpoint until user authorizes or codes expire"
													placement="top"
												>
													Polling
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="info"
												title="OAuth Client"
												content="Device application"
												placement="top"
											>
												Client
											</LearningTooltip>{' '}
											polls{' '}
											<LearningTooltip
												variant="info"
												title="Token Endpoint"
												content="OAuth endpoint where tokens are requested"
												placement="top"
											>
												token endpoint
											</LearningTooltip>{' '}
											until{' '}
											<LearningTooltip
												variant="info"
												title="Authorized"
												content="User completes authorization on verification URL"
												placement="top"
											>
												authorized
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="Timeout"
													content="Device and user codes expire after specified time (typically 10-15 minutes)"
													placement="top"
												>
													Timeout
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="learning"
												title="Codes Expire"
												content="Device and user codes have limited lifetime - typically 10-15 minutes"
												placement="top"
											>
												Codes expire
											</LearningTooltip>{' '}
											after 10-15 minutes
										</li>
									</ul>
								</div>
							</InfoBox>

							<InfoBox $variant="warning" style={{ marginTop: '1rem' }}>
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Considerations:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>Short-lived codes</strong>: Device/user codes expire quickly
										</li>
										<li>
											<strong>Polling frequency</strong>: Follow server rate limits (typically 5-10
											seconds)
										</li>
										<li>
											<strong>User verification</strong>: Ensure codes are displayed securely
										</li>
										<li>
											<strong>Transport security</strong>: Always use HTTPS for all requests
										</li>
									</ul>
								</div>
							</InfoBox>

							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiShield size={20} />
								<div>
									<InfoTitle>
										<LearningTooltip
											variant="info"
											title="OAuth 2.0"
											content="RFC 6749 - Authorization framework"
											placement="top"
										>
											OAuth
										</LearningTooltip>{' '}
										vs{' '}
										<LearningTooltip
											variant="info"
											title="OIDC"
											content="OpenID Connect - authentication layer"
											placement="top"
										>
											OIDC
										</LearningTooltip>{' '}
										Device Flow (PingOne Implementation):
									</InfoTitle>
									<InfoText style={{ marginTop: '0.5rem' }}>
										<strong>Important:</strong>{' '}
										<LearningTooltip
											variant="info"
											title="OIDC"
											content="OpenID Connect specification"
											placement="top"
										>
											OIDC
										</LearningTooltip>{' '}
										doesn't define a separate "Device Flow" specification. It reuses the{' '}
										<LearningTooltip
											variant="learning"
											title="OAuth 2.0 Device Authorization Grant"
											content="RFC 8628 - Device flow specification"
											placement="top"
										>
											OAuth 2.0 Device Authorization Grant (RFC 8628)
										</LearningTooltip>{' '}
										and adds the usual{' '}
										<LearningTooltip
											variant="info"
											title="OIDC Semantics"
											content="OIDC adds ID token, userinfo endpoint, and openid scope requirements"
											placement="top"
										>
											OIDC semantics
										</LearningTooltip>
										.{' '}
										<strong>
											<LearningTooltip
												variant="info"
												title="PingOne"
												content="Identity platform"
												placement="top"
											>
												PingOne
											</LearningTooltip>{' '}
											requires the{' '}
											<LearningTooltip
												variant="info"
												title="openid scope"
												content="OIDC scope required by PingOne even for OAuth flows"
												placement="top"
											>
												openid scope
											</LearningTooltip>{' '}
											for both variants:
										</strong>
									</InfoText>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="OAuth 2.0"
													content="Authorization framework"
													placement="top"
												>
													OAuth
												</LearningTooltip>{' '}
												Device Flow (PingOne)
											</strong>
											: Returns{' '}
											<LearningTooltip
												variant="learning"
												title="Access Token"
												content="Bearer token for API access"
												placement="top"
											>
												access_token
											</LearningTooltip>{' '}
											and{' '}
											<LearningTooltip
												variant="learning"
												title="Refresh Token"
												content="Long-lived token for token refresh"
												placement="top"
											>
												refresh_token
											</LearningTooltip>{' '}
											only, but still requires{' '}
											<code>
												<LearningTooltip
													variant="info"
													title="openid scope"
													content="Required by PingOne even for OAuth flows"
													placement="top"
												>
													openid
												</LearningTooltip>
											</code>{' '}
											scope
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="OIDC Device Flow"
													content="Device flow with OIDC identity layer"
													placement="top"
												>
													OIDC Device Flow
												</LearningTooltip>
											</strong>
											: Adds{' '}
											<LearningTooltip
												variant="learning"
												title="ID Token"
												content="OIDC JWT with user identity"
												placement="top"
											>
												ID Token
											</LearningTooltip>
											,{' '}
											<LearningTooltip
												variant="info"
												title="UserInfo Endpoint"
												content="OIDC endpoint returning user profile"
												placement="top"
											>
												UserInfo endpoint
											</LearningTooltip>
											, and requires{' '}
											<code>
												<LearningTooltip
													variant="info"
													title="openid scope"
													content="Mandatory for OIDC flows"
													placement="top"
												>
													openid
												</LearningTooltip>
											</code>{' '}
											scope (standard{' '}
											<LearningTooltip
												variant="info"
												title="OIDC Requirement"
												content="OIDC requires openid scope to receive ID token"
												placement="top"
											>
												OIDC requirement
											</LearningTooltip>
											)
										</li>
										<li>
											Both flows use the same{' '}
											<LearningTooltip
												variant="info"
												title="RFC 8628"
												content="Device Authorization Grant specification"
												placement="top"
											>
												RFC 8628
											</LearningTooltip>{' '}
											device authorization mechanism
										</li>
										<li>
											<LearningTooltip
												variant="info"
												title="OIDC"
												content="OpenID Connect"
												placement="top"
											>
												OIDC
											</LearningTooltip>{' '}
											adds{' '}
											<LearningTooltip
												variant="info"
												title="Identity Layer"
												content="Authentication and user identity on top of OAuth authorization"
												placement="top"
											>
												identity layer
											</LearningTooltip>{' '}
											on top of{' '}
											<LearningTooltip
												variant="info"
												title="OAuth Authorization Framework"
												content="OAuth 2.0 provides authorization only"
												placement="top"
											>
												OAuth's authorization framework
											</LearningTooltip>
										</li>
										<li>
											<strong>PingOne Specific:</strong> Unlike standard{' '}
											<LearningTooltip
												variant="info"
												title="OAuth 2.0"
												content="RFC 6749"
												placement="top"
											>
												OAuth 2.0
											</LearningTooltip>
											,{' '}
											<LearningTooltip
												variant="info"
												title="PingOne"
												content="Identity platform"
												placement="top"
											>
												PingOne
											</LearningTooltip>{' '}
											requires{' '}
											<LearningTooltip
												variant="info"
												title="openid scope"
												content="OIDC scope"
												placement="top"
											>
												openid scope
											</LearningTooltip>{' '}
											for all flows
										</li>
									</ul>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('flowDiagram')}
					aria-expanded={!collapsedSections.flowDiagram}
				>
					<CollapsibleTitle>
						<FiZap /> How It Works
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.flowDiagram && (
					<CollapsibleContent>
						<ExplanationSection>
							<div
								style={{
									backgroundColor: '#f8fafc',
									padding: '2rem',
									borderRadius: '0.75rem',
									border: '2px solid #e2e8f0',
								}}
							>
								<ExplanationHeading style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
									<FiZap /> Complete Flow Sequence
								</ExplanationHeading>

								<ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>
											1. Device requests{' '}
											<LearningTooltip
												variant="learning"
												title="Device Code"
												content="Secret code used for polling token endpoint"
												placement="top"
											>
												device code
											</LearningTooltip>
										</strong>{' '}
										-{' '}
										<LearningTooltip
											variant="info"
											title="Device"
											content="Input-constrained device (TV, IoT, etc.)"
											placement="top"
										>
											Device
										</LearningTooltip>{' '}
										calls the{' '}
										<LearningTooltip
											variant="info"
											title="Device Authorization Endpoint"
											content="OAuth endpoint that issues device_code and user_code"
											placement="top"
										>
											device authorization endpoint
										</LearningTooltip>{' '}
										with{' '}
										<LearningTooltip
											variant="learning"
											title="client_id"
											content="Application identifier"
											placement="top"
										>
											client_id
										</LearningTooltip>{' '}
										and{' '}
										<LearningTooltip
											variant="learning"
											title="Scopes"
											content="Requested permissions"
											placement="top"
										>
											scopes
										</LearningTooltip>
										<br />
										<code
											style={{
												background: '#e2e8f0',
												padding: '0.25rem 0.5rem',
												borderRadius: '0.25rem',
												fontSize: '0.85em',
											}}
										>
											POST{' '}
											<LearningTooltip
												variant="info"
												title="Device Authorization Endpoint"
												content="Endpoint that issues device and user codes"
												placement="top"
											>
												/device_authorization
											</LearningTooltip>
										</code>
										<br />
										<small style={{ color: '#64748b' }}>
											Server responds with:{' '}
											<LearningTooltip
												variant="learning"
												title="device_code"
												content="Secret code for polling"
												placement="top"
											>
												device_code
											</LearningTooltip>
											,{' '}
											<LearningTooltip
												variant="learning"
												title="user_code"
												content="Human-readable code for user"
												placement="top"
											>
												user_code
											</LearningTooltip>
											,{' '}
											<LearningTooltip
												variant="info"
												title="verification_uri"
												content="URL for user to visit"
												placement="top"
											>
												verification_uri
											</LearningTooltip>
											,{' '}
											<LearningTooltip
												variant="info"
												title="expires_in"
												content="How long codes are valid (seconds)"
												placement="top"
											>
												expires_in
											</LearningTooltip>
											,{' '}
											<LearningTooltip
												variant="info"
												title="interval"
												content="Polling interval in seconds"
												placement="top"
											>
												interval
											</LearningTooltip>
										</small>
									</li>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>
											2. Display{' '}
											<LearningTooltip
												variant="learning"
												title="User Code"
												content="Human-readable code shown to user"
												placement="top"
											>
												user code
											</LearningTooltip>
										</strong>{' '}
										- Device shows{' '}
										<LearningTooltip
											variant="learning"
											title="User Code"
											content="Short code user enters on verification URL"
											placement="top"
										>
											user_code
										</LearningTooltip>{' '}
										and{' '}
										<LearningTooltip
											variant="info"
											title="Verification URI"
											content="URL where user enters code"
											placement="top"
										>
											verification_uri
										</LearningTooltip>{' '}
										to user on screen (e.g., "Visit example.com and enter code: ABCD-1234")
										<br />
										<small style={{ color: '#64748b' }}>
											Example display: "Go to https://auth.pingone.com/activate and enter:
											WDJB-MJHT"
										</small>
									</li>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>
											3. User authorizes on{' '}
											<LearningTooltip
												variant="info"
												title="Secondary Device"
												content="Phone, computer, or tablet with browser"
												placement="top"
											>
												secondary device
											</LearningTooltip>
										</strong>{' '}
										- User visits{' '}
										<LearningTooltip
											variant="info"
											title="Verification URI"
											content="URL where user completes authorization"
											placement="top"
										>
											URL
										</LearningTooltip>{' '}
										on phone/computer, enters{' '}
										<LearningTooltip
											variant="learning"
											title="User Code"
											content="Code displayed on device"
											placement="top"
										>
											code
										</LearningTooltip>
										, and{' '}
										<LearningTooltip
											variant="info"
											title="Authorizes"
											content="Grants permission for app to access resources"
											placement="top"
										>
											authorizes
										</LearningTooltip>{' '}
										the{' '}
										<LearningTooltip
											variant="info"
											title="Application"
											content="OAuth client requesting access"
											placement="top"
										>
											application
										</LearningTooltip>
										<br />
										<small style={{ color: '#64748b' }}>
											User sees: "Authorize 'Smart TV App' to access your account?"
										</small>
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>
											<LearningTooltip
												variant="info"
												title="Device"
												content="Input-constrained device"
												placement="top"
											>
												Device
											</LearningTooltip>{' '}
											polls for{' '}
											<LearningTooltip
												variant="learning"
												title="Tokens"
												content="Access token, ID token, refresh token"
												placement="top"
											>
												tokens
											</LearningTooltip>
										</strong>{' '}
										- Device{' '}
										<LearningTooltip
											variant="info"
											title="Continuously Polls"
											content="Repeatedly requests tokens at specified interval"
											placement="top"
										>
											continuously polls
										</LearningTooltip>{' '}
										<LearningTooltip
											variant="info"
											title="Token Endpoint"
											content="OAuth endpoint where tokens are requested"
											placement="top"
										>
											token endpoint
										</LearningTooltip>{' '}
										until user{' '}
										<LearningTooltip
											variant="info"
											title="Completes Authorization"
											content="User authorizes on verification URL"
											placement="top"
										>
											completes authorization
										</LearningTooltip>
									</li>
									<li>
										<strong>
											<LearningTooltip
												variant="learning"
												title="Tokens Received"
												content="Access token, ID token (OIDC), and optionally refresh token"
												placement="top"
											>
												Tokens received
											</LearningTooltip>
										</strong>{' '}
										- Device receives{' '}
										<LearningTooltip
											variant="learning"
											title="Access Token"
											content="Bearer token for API access"
											placement="top"
										>
											access token
										</LearningTooltip>
										,{' '}
										<LearningTooltip
											variant="learning"
											title="ID Token"
											content="OIDC JWT with user identity (if OIDC flow)"
											placement="top"
										>
											ID token
										</LearningTooltip>
										, and optionally{' '}
										<LearningTooltip
											variant="learning"
											title="Refresh Token"
											content="Long-lived token for getting new access tokens"
											placement="top"
										>
											refresh token
										</LearningTooltip>
									</li>
								</ol>
							</div>
							<InfoBox $variant="success" style={{ marginTop: '1.5rem' }}>
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Key Benefits</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>No browser required on the device</li>
										<li>Secure - uses standard OAuth 2.0</li>
										<li>User-friendly - simple code entry</li>
										<li>Works on any device with a display</li>
									</ul>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{/* Configuration Requirements */}
			<FlowConfigurationRequirements flowType="device-authorization" variant={selectedVariant} />

			{/* Flow Walkthrough */}
			<EnhancedFlowWalkthrough
				flowId={
					selectedVariant === 'oidc' ? 'oidc-device-authorization' : 'oauth-device-authorization'
				}
			/>
			<FlowSequenceDisplay
				flowType={
					selectedVariant === 'oidc' ? 'oidc-device-authorization' : 'oauth-device-authorization'
				}
			/>

			{/* V6 Comprehensive Credentials Service */}
			<ComprehensiveCredentialsService
				flowType="device-authorization-v6"
				// Discovery props
				onDiscoveryComplete={(result) => {
					console.log('[Device Authz V6] Discovery completed:', result);
					// Extract environment ID from issuer URL using the standard service
					if (result.issuerUrl) {
						const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.issuerUrl);
						if (extractedEnvId) {
							ensureCredentials({ environmentId: extractedEnvId });
							console.log('[Device Authz V6] Auto-extracted Environment ID:', extractedEnvId);
							if (extractedEnvId && (deviceFlow.credentials?.clientId || '')) {
								v4ToastManager.showSuccess('Credentials auto-saved from discovery');
							}
						}
					}
				}}
				discoveryPlaceholder="Enter Environment ID, issuer URL, or provider..."
				showProviderInfo={true}
				// Credentials props
				environmentId={deviceFlow.credentials?.environmentId || ''}
				clientId={deviceFlow.credentials?.clientId || ''}
				clientSecret={deviceFlow.credentials?.clientSecret || ''}
				scopes={
					deviceFlow.credentials?.scopes ||
					(selectedVariant === 'oidc' ? 'openid profile email' : 'openid')
				}
				// Change handlers
				onEnvironmentIdChange={(newEnvId) => {
					ensureCredentials({ environmentId: newEnvId });
					if (newEnvId.trim() && (deviceFlow.credentials?.clientId || '').trim()) {
						v4ToastManager.showSuccess('Credentials auto-saved');
					}
				}}
				onClientIdChange={(newClientId) => {
					ensureCredentials({ clientId: newClientId });
					if ((deviceFlow.credentials?.environmentId || '').trim() && newClientId.trim()) {
						v4ToastManager.showSuccess('Credentials auto-saved');
					}
				}}
				onClientSecretChange={(newClientSecret) => {
					ensureCredentials({ clientSecret: newClientSecret });
				}}
				onScopesChange={(newScopes) => {
					let finalScopes = newScopes;

					if (selectedVariant === 'oidc') {
						// OIDC MUST include 'openid' scope per OpenID Connect Core 1.0 spec
						if (!newScopes.includes('openid')) {
							finalScopes = `openid ${newScopes}`.trim();
							v4ToastManager.showWarning(
								'Added "openid" scope (required by OpenID Connect specification)'
							);
						}
					} else {
						// PingOne requires 'openid' scope even for OAuth 2.0 flows (non-standard)
						if (!newScopes.includes('openid')) {
							finalScopes = `openid ${newScopes}`.trim();
							v4ToastManager.showInfo(
								'Added "openid" scope (required by PingOne for all flows, including OAuth 2.0)'
							);
						}
					}

					ensureCredentials({ scopes: finalScopes });
				}}
				// Save handler - save to V7 standardized storage only
				onSave={async () => {
					try {
						if (deviceFlow.credentials) {
							const credentialsForStorage: StepCredentials = {
								clientId: deviceFlow.credentials.clientId ?? '',
								clientSecret: deviceFlow.credentials.clientSecret ?? '',
								redirectUri: '',
								scope: deviceFlow.credentials.scopes ?? '',
								scopes: deviceFlow.credentials.scopes ?? '',
								clientAuthMethod: 'none',
							};

							if (deviceFlow.credentials.environmentId) {
								credentialsForStorage.environmentId = deviceFlow.credentials.environmentId;
							}

							if (deviceFlow.credentials.loginHint) {
								credentialsForStorage.loginHint = deviceFlow.credentials.loginHint;
							}

							if (deviceFlow.credentials.postLogoutRedirectUri) {
								credentialsForStorage.postLogoutRedirectUri =
									deviceFlow.credentials.postLogoutRedirectUri;
							}

							const success = await FlowCredentialService.saveFlowCredentials(
								'device-authorization-v9',
								credentialsForStorage,
								undefined,
								undefined,
								{ showToast: true }
							);

							if (!success) {
								throw new Error('FlowCredentialService reported failure');
							}
						}
					} catch (error) {
						console.error('[Device Authz V7] Failed to save credentials:', error);
						v4ToastManager.showError('Failed to save credentials');
					}
				}}
				hasUnsavedChanges={false}
				isSaving={false}
				requireClientSecret={false} // Device flows don't need client secret
				// Hide redirect URI fields (not needed for device flows)
				showRedirectUri={false}
				showPostLogoutRedirectUri={false}
				showLoginHint={false}
				// PingOne Advanced Configuration
				pingOneAppState={pingOneConfig}
				onPingOneAppStateChange={setPingOneConfig}
				onPingOneSave={() => {
					console.log('[Device Authz V6] PingOne config saved:', pingOneConfig);
					v4ToastManager.showSuccess('PingOne configuration saved successfully!');
				}}
				hasUnsavedPingOneChanges={false}
				isSavingPingOne={false}
				// Config Checker props - Disabled to remove pre-flight API calls
				showConfigChecker={false}
				workerToken={localStorage.getItem('worker_token') || ''}
				region="NA"
			/>

			{/* Info about Device Flow Requirements */}
			<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
				<FiInfo style={{ flexShrink: 0, color: '#3b82f6' }} />
				<div>
					<InfoTitle>Device Flow Requirements</InfoTitle>
					<InfoText>
						<strong>Redirect URI:</strong>{' '}
						<span>
							Not required for Device Authorization Flow (designed for devices that cannot handle
							browser redirects like smart TVs, IoT devices, or CLI tools).
						</span>
					</InfoText>
					<InfoText as="div" style={{ marginTop: '0.75rem' }}>
						<strong>Scopes (PingOne Implementation):</strong>{' '}
						<span>
							{selectedVariant === 'oidc'
								? 'OpenID Connect REQUIRES the openid scope per OIDC Core 1.0 specification. Additional scopes like profile, email, offline_access are optional.'
								: 'PingOne requires the openid scope even for OAuth 2.0 flows (this is a PingOne-specific requirement, not standard OAuth 2.0). Additional API scopes can be included.'}
						</span>
					</InfoText>
				</div>
			</InfoBox>
		</>
	);

	const renderRequestDeviceCode = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('deviceCodeOverview')}
					aria-expanded={!collapsedSections.deviceCodeOverview}
				>
					<CollapsibleTitle>
						<FiKey /> Request Device Code
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.deviceCodeOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.deviceCodeOverview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiKey /> Initiate Device Authorization
							</ExplanationHeading>
							<InfoText>
								Request a device code and user code from PingOne's device authorization endpoint.
								This is the first step in the device authorization flow.
							</InfoText>
							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiInfo size={20} />
								<div>
									<InfoTitle>What happens:</InfoTitle>
									<InfoText>
										The device sends a POST request to the device authorization endpoint with the
										client_id and requested scopes. PingOne responds with a device_code, user_code,
										verification_uri, and polling interval.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="info" style={{ marginTop: '1.5rem' }}>
								<div
									style={{
										background: '#3b82f6',
										color: 'white',
										borderRadius: '50%',
										width: '24px',
										height: '24px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '0.875rem',
										fontWeight: 'bold',
										flexShrink: 0,
									}}
								>
									1
								</div>
								<div style={{ width: '100%' }}>
									<EnhancedApiCallDisplay
										apiCall={{
											method: 'POST',
											url: (() => {
												const regionDomains: Record<string, string> = {
													us: 'auth.pingone.com',
													eu: 'auth.pingone.eu',
													ap: 'auth.pingone.asia',
													ca: 'auth.pingone.ca',
													na: 'auth.pingone.com',
												};
												const domain =
													regionDomains[deviceFlow.credentials?.region || 'us'] ||
													'auth.pingone.com';
												return `https://${domain}/${deviceFlow.credentials?.environmentId || '[environmentId]'}/as/device_authorization`;
											})(),
											headers: {
												'Content-Type': 'application/x-www-form-urlencoded',
											},
											body: {
												client_id: deviceFlow.credentials?.clientId || '[clientId]',
												scope:
													deviceFlow.credentials?.scopes ||
													(selectedVariant === 'oidc' ? 'openid profile email' : 'openid'),
											},
											response: deviceFlow.deviceCodeData
												? {
														status: 200,
														statusText: 'OK',
														headers: {
															'Content-Type': 'application/json',
															'Cache-Control': 'no-store',
														},
														data: {
															device_code: deviceFlow.deviceCodeData.device_code,
															user_code: deviceFlow.deviceCodeData.user_code,
															verification_uri: deviceFlow.deviceCodeData.verification_uri,
															verification_uri_complete:
																deviceFlow.deviceCodeData.verification_uri_complete,
															expires_in: deviceFlow.deviceCodeData.expires_in,
															interval: deviceFlow.deviceCodeData.interval,
														},
													}
												: undefined,
											flowType: 'device-code',
											stepName: 'device-authorization-request',
											description: `${selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Device Authorization Request`,
											educationalNotes: [
												'This endpoint initiates the device authorization flow',
												`For ${selectedVariant === 'oidc' ? 'OIDC' : 'OAuth 2.0'}: Returns device_code, user_code, and verification_uri`,
												'The device will poll the token endpoint using the device_code',
												'The user will enter the user_code at the verification_uri',
											],
										}}
										options={{
											showEducationalNotes: true,
											showFlowContext: true,
											urlHighlightRules:
												EnhancedApiCallDisplayService.getDefaultHighlightRules('device-code'),
										}}
									/>
								</div>
							</InfoBox>

							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<div
									style={{
										background: '#3b82f6',
										color: 'white',
										borderRadius: '50%',
										width: '24px',
										height: '24px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '0.875rem',
										fontWeight: 'bold',
										flexShrink: 0,
									}}
								>
									2
								</div>
								<div>
									<InfoTitle>Choose Your Device Type</InfoTitle>
									<InfoText>
										Select the type of device you want to simulate for the authorization flow. This
										will determine the visual interface and user experience.
									</InfoText>
								</div>
							</InfoBox>

							{/* Device Type Selector */}
							<div style={{ marginTop: '1.5rem' }}>
								<DeviceTypeSelector
									selectedDevice={selectedDevice}
									onDeviceChange={setSelectedDevice}
								/>
							</div>

							<InfoBox $variant="success" style={{ marginTop: '1.5rem' }}>
								<div
									style={{
										background: '#22c55e',
										color: 'white',
										borderRadius: '50%',
										width: '24px',
										height: '24px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '0.875rem',
										fontWeight: 'bold',
										flexShrink: 0,
									}}
								>
									3
								</div>
								<div>
									<InfoTitle>Make the Device Code Request</InfoTitle>
									<InfoText>
										Click the button below to send the POST request to PingOne and receive your
										device code, user code, and verification URI.
									</InfoText>
								</div>
							</InfoBox>

							<ActionRow
								style={{
									marginTop: '1.5rem',
									flexDirection: 'column',
									alignItems: 'flex-start',
									gap: '0.75rem',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '1rem',
										flexWrap: 'wrap',
										justifyContent: 'center',
									}}
								>
									<Button
										onClick={handleRequestDeviceCode}
										disabled={
											!deviceFlow.credentials?.environmentId ||
											!deviceFlow.credentials?.clientId ||
											!!deviceFlow.deviceCodeData
										}
										$variant="primary"
									>
										<FiKey /> Request Device Code
									</Button>
									{deviceFlow.deviceCodeData && (
										<Button onClick={handleReset} $variant="danger">
											<FiRefreshCw /> Start Over
										</Button>
									)}
								</div>

								{(!deviceFlow.credentials?.environmentId || !deviceFlow.credentials?.clientId) &&
									!deviceFlow.deviceCodeData && (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												padding: '0.75rem 1rem',
												background: '#fef3c7',
												border: '1px solid #fbbf24',
												borderRadius: '0.5rem',
												fontSize: '0.875rem',
												color: '#92400e',
											}}
										>
											<FiAlertTriangle style={{ flexShrink: 0, color: '#f59e0b' }} />
											<span>
												<strong>Button disabled:</strong> Please configure your{' '}
												{!deviceFlow.credentials?.environmentId && !deviceFlow.credentials?.clientId
													? 'Environment ID and Client ID'
													: !deviceFlow.credentials?.environmentId
														? 'Environment ID'
														: 'Client ID'}{' '}
												in the credentials section above to enable this button.
											</span>
										</div>
									)}
							</ActionRow>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{deviceFlow.deviceCodeData && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('deviceCodeDetails')}
						aria-expanded={!collapsedSections.deviceCodeDetails}
					>
						<CollapsibleTitle>
							<FiCheckCircle /> Device Code Received
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.deviceCodeDetails}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.deviceCodeDetails && (
						<CollapsibleContent>
							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Success!</InfoTitle>
									<InfoText>
										Device code received from PingOne. You can now display the user code to the
										user.
									</InfoText>
								</div>
							</InfoBox>
							<ResultsSection style={{ marginTop: '1rem' }}>
								<GeneratedContentBox>
									<GeneratedLabel>Device Code Response</GeneratedLabel>
									<ParameterGrid>
										<div style={{ gridColumn: '1 / -1' }}>
											<ParameterLabel>Device Code (Internal - Do Not Display)</ParameterLabel>
											<ParameterValue
												style={{
													fontFamily: 'monospace',
													fontSize: '0.75rem',
													color: '#64748b',
												}}
											>
												{deviceFlow.deviceCodeData.device_code.substring(0, 20)}...
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Expires In</ParameterLabel>
											<ParameterValue>
												{deviceFlow.deviceCodeData.expires_in} seconds
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Poll Interval</ParameterLabel>
											<ParameterValue>{deviceFlow.deviceCodeData.interval} seconds</ParameterValue>
										</div>
									</ParameterGrid>
								</GeneratedContentBox>
							</ResultsSection>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);

	const _handleOpenOnThisDevice = useCallback(() => {
		if (!deviceFlow.deviceCodeData) {
			return;
		}

		setSelectedDevice('smartphone');
		setCollapsedSections((prev) => ({ ...prev, deviceSelection: false }));

		setTimeout(() => {
			const tvElement = document.querySelector('[data-tv-display]');
			if (tvElement) {
				tvElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 150);

		const targetUrl =
			deviceFlow.deviceCodeData.verification_uri_complete ||
			deviceFlow.deviceCodeData.verification_uri;
		window.open(targetUrl, '_blank');
	}, [deviceFlow.deviceCodeData]);

	const renderGenericSuccessContent = () => (
		<>
			<div
				style={{
					background: brandGradient,
					padding: '0.75rem 1.5rem',
					borderRadius: '0.5rem',
					marginBottom: '1.5rem',
					fontSize: '1.5rem',
					fontWeight: 'bold',
					color: 'white',
					textAlign: 'center',
					fontFamily: 'Arial, sans-serif',
					letterSpacing: '0.1rem',
				}}
			>
				{deviceConfig.brandName.toUpperCase()}
			</div>
			<div
				style={{
					fontSize: '2rem',
					marginBottom: '1rem',
					animation: 'fadeIn 0.5s ease',
				}}
			>
				✅
			</div>
			<WelcomeMessage
				style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: deviceConfig.color }}
			>
				{welcomeMessage}
			</WelcomeMessage>
			<div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
				Welcome Back, Demo User 👋
			</div>
			<AppGrid>
				{deviceApps.map((app) => (
					<AppIcon key={app.label} $color={app.color}>
						<div style={{ fontSize: '1.5rem' }}>{app.icon}</div>
						<div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>{app.label}</div>
					</AppIcon>
				))}
			</AppGrid>
			<div
				style={{
					fontSize: '0.75rem',
					color: deviceConfig.color,
					marginTop: '1rem',
					padding: '0.5rem',
					backgroundColor: `${deviceConfig.color}1a`,
					borderRadius: '0.5rem',
					border: `1px solid ${deviceConfig.color}4d`,
				}}
			>
				✅ Login Successful • Ready to go
			</div>
		</>
	);

	const renderGenericPollingContent = () => (
		<>
			<div
				style={{
					background: brandGradient,
					padding: '0.5rem 1rem',
					borderRadius: '0.5rem',
					marginBottom: '1.5rem',
					fontSize: '1.25rem',
					fontWeight: 'bold',
					color: 'white',
					fontFamily: 'Arial, sans-serif',
					letterSpacing: '0.1rem',
				}}
			>
				{deviceConfig.brandName.toUpperCase()}
			</div>
			<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
			<div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{waitingMessage}</div>
			<div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
				AUTHORIZATION...
			</div>
			<div
				style={{
					fontSize: '0.875rem',
					marginTop: '1rem',
					color: '#94a3b8',
				}}
			>
				Complete sign-in on your phone
			</div>
		</>
	);

	const renderGenericPreAuthContent = () => (
		<>
			<div
				style={{
					background: brandGradient,
					padding: '0.5rem 1rem',
					borderRadius: '0.5rem',
					marginBottom: '1rem',
					fontSize: '1.25rem',
					fontWeight: 'bold',
					color: 'white',
					fontFamily: 'Arial, sans-serif',
					letterSpacing: '0.1rem',
				}}
			>
				{deviceConfig.brandName.toUpperCase()}
			</div>
			<div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{deviceConfig.icon}</div>
			<div
				style={{
					fontSize: '1.25rem',
					marginBottom: '0.5rem',
					fontWeight: '600',
				}}
			>
				Activate Your Device
			</div>
			<div
				style={{
					fontSize: '0.875rem',
					color: '#94a3b8',
					marginBottom: '1.5rem',
				}}
			>
				Sign in to start streaming
			</div>
			<div
				style={{
					fontSize: '0.75rem',
					color: '#64748b',
					marginBottom: '1rem',
				}}
			>
				Scan QR code or enter this code on your phone:
			</div>
			{deviceFlow.deviceCodeData?.verification_uri_complete && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						marginBottom: '1rem',
						padding: '1rem',
						backgroundColor: 'white',
						borderRadius: '0.5rem',
						border: `2px solid ${deviceConfig.color}`,
					}}
				>
					<QRCodeSVG
						value={deviceFlow.deviceCodeData.verification_uri_complete}
						size={200}
						level="M"
						includeMargin={true}
					/>
				</div>
			)}
			<div
				style={{
					fontSize: '2.5rem',
					fontWeight: 'bold',
					letterSpacing: '0.5rem',
					color: deviceConfig.color,
					padding: '0.5rem 1rem',
					backgroundColor: `${deviceConfig.color}1a`,
					borderRadius: '0.5rem',
					border: `1px solid ${deviceConfig.color}4d`,
				}}
			>
				{deviceFlow.deviceCodeData?.user_code}
			</div>
		</>
	);

	const _renderDeviceSuccessContent = () => {
		switch (selectedDevice) {
			case 'gaming-console':
				return (
					<ConsoleLayout>
						<ConsoleTopBar>
							<span>PlaySphere Network</span>
							<span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
								Signed In
								<StatusDot $active={true} />
							</span>
						</ConsoleTopBar>
						<ConsoleHero>
							<ConsoleHeroTitle>Welcome back, Demo Player</ConsoleHeroTitle>
							<ConsoleHeroSubtitle>
								Your {deviceConfig.brandName} services are connected.
							</ConsoleHeroSubtitle>
							<ConsoleHintRow>
								<span>✓ Cloud saves synced</span>
								<span>✓ Friends list updated</span>
							</ConsoleHintRow>
						</ConsoleHero>
						<ConsoleTileGrid>
							<ConsoleTile $featured>
								<ConsoleTileBadge>Featured</ConsoleTileBadge>
								<ConsoleTileTitle>Cosmic Drift 2</ConsoleTileTitle>
								<ConsoleTileMeta>Continue campaign • 78%</ConsoleTileMeta>
							</ConsoleTile>
							<ConsoleTile>
								<ConsoleTileTitle>Arcade</ConsoleTileTitle>
								<ConsoleTileMeta>Multiplayer lobbies online</ConsoleTileMeta>
							</ConsoleTile>
							<ConsoleTile>
								<ConsoleTileTitle>Store</ConsoleTileTitle>
								<ConsoleTileMeta>Fall sale now live</ConsoleTileMeta>
							</ConsoleTile>
							<ConsoleTile>
								<ConsoleTileTitle>Media</ConsoleTileTitle>
								<ConsoleTileMeta>Watch trailers & streams</ConsoleTileMeta>
							</ConsoleTile>
						</ConsoleTileGrid>
						<ConsoleHintRow>
							<span>Press Ⓧ to launch • Controller connected</span>
						</ConsoleHintRow>
					</ConsoleLayout>
				);
			case 'airport-kiosk':
				return (
					<KioskScreen>
						<KioskHeader>
							<KioskBranding>
								<KioskLogo>🛫</KioskLogo>
								{deviceConfig.brandName}
							</KioskBranding>
							<KioskFlightIndicator>Check-in Complete</KioskFlightIndicator>
						</KioskHeader>
						<KioskBody>
							<KioskForm>
								<KioskRow>
									<KioskLabel>Passenger</KioskLabel>
									<KioskValue>Demo Traveler</KioskValue>
								</KioskRow>
								<KioskRow>
									<KioskLabel>Flight</KioskLabel>
									<KioskValue>P1 204 → San Francisco</KioskValue>
								</KioskRow>
								<KioskRow>
									<KioskLabel>Seat</KioskLabel>
									<KioskValue>12A • Window</KioskValue>
								</KioskRow>
								<KioskRow>
									<KioskLabel>Bags</KioskLabel>
									<KioskValue>2 Checked • 1 Carry-on</KioskValue>
								</KioskRow>
							</KioskForm>
							<KioskBoardingPass>
								<div>
									<KioskBoardingTitle>Boarding Group</KioskBoardingTitle>
									<KioskBoardingValue>Sky Priority</KioskBoardingValue>
								</div>
								<KioskDivider />
								<div>
									<KioskBoardingTitle>Gate</KioskBoardingTitle>
									<KioskBoardingValue>B12</KioskBoardingValue>
								</div>
								<KioskDivider />
								<div>
									<KioskBoardingTitle>Boarding Starts</KioskBoardingTitle>
									<KioskBoardingValue>10:20 AM</KioskBoardingValue>
								</div>
								<KioskCodeBox>AUTH OK • {deviceFlow.deviceCodeData?.user_code}</KioskCodeBox>
							</KioskBoardingPass>
						</KioskBody>
						<KioskActionRow>
							<span>Bag tags printed</span>
							<span>Proceed to security</span>
						</KioskActionRow>
					</KioskScreen>
				);
			default:
				return renderGenericSuccessContent();
		}
	};

	const _renderDeviceDisplay = (tokens: Record<string, unknown>) => {
		if (tokens) {
			return renderGenericSuccessContent();
		}
		return renderGenericPreAuthContent();
	};

	const _renderDevicePendingContent = () => {
		const isPolling = deviceFlow.pollingStatus.isPolling;
		switch (selectedDevice) {
			case 'gaming-console':
				return (
					<ConsoleLayout>
						<ConsoleTopBar>
							<span>PlaySphere Network</span>
							<span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
								{isPolling ? 'Connecting…' : 'Awaiting Code'}
								<StatusDot $active={false} />
							</span>
						</ConsoleTopBar>
						<ConsoleHero>
							<ConsoleHeroTitle>Link your console</ConsoleHeroTitle>
							<ConsoleHeroSubtitle>
								On your phone, open {deviceFlow.deviceCodeData?.verification_uri}
							</ConsoleHeroSubtitle>
							<ConsoleHintRow>
								<span>
									Enter code • <strong>{deviceFlow.deviceCodeData?.user_code}</strong>
								</span>
								<span>Keep this screen open while we verify your account.</span>
							</ConsoleHintRow>
						</ConsoleHero>
						<ConsoleHintRow>
							<span>
								{isPolling
									? `Checking authorization every ${deviceFlow.deviceCodeData?.interval || 5}s…`
									: 'Press Start after approval to finish linking.'}
							</span>
						</ConsoleHintRow>
					</ConsoleLayout>
				);
			case 'airport-kiosk':
				return (
					<KioskScreen>
						<KioskHeader>
							<KioskBranding>
								<KioskLogo>🛫</KioskLogo>
								{deviceConfig.brandName}
							</KioskBranding>
							<KioskFlightIndicator>
								{isPolling ? 'Authorizing Booking…' : 'Enter Code to Continue'}
							</KioskFlightIndicator>
						</KioskHeader>
						<KioskBody>
							<KioskForm>
								<KioskRow>
									<KioskLabel>Instructions</KioskLabel>
									<KioskValue>
										Scan QR or visit {deviceFlow.deviceCodeData?.verification_uri}
									</KioskValue>
								</KioskRow>
								<KioskRow>
									<KioskLabel>Authorization Code</KioskLabel>
									<KioskValue>{deviceFlow.deviceCodeData?.user_code}</KioskValue>
								</KioskRow>
								<KioskRow>
									<KioskLabel>Status</KioskLabel>
									<KioskValue>
										{isPolling ? 'Waiting for confirmation…' : 'Ready when you are'}
									</KioskValue>
								</KioskRow>
							</KioskForm>
							<KioskBoardingPass>
								<KioskBoardingTitle>Next Steps</KioskBoardingTitle>
								<KioskBoardingValue>
									Confirm on your phone to generate boarding passes.
								</KioskBoardingValue>
								<KioskDivider />
								<KioskCodeBox>{deviceFlow.deviceCodeData?.user_code}</KioskCodeBox>
							</KioskBoardingPass>
						</KioskBody>
						<KioskActionRow>
							<span>Need help? Flag an agent.</span>
							<span>Printer will start automatically.</span>
						</KioskActionRow>
					</KioskScreen>
				);
			default:
				return (
					<TVDisplay $primaryColor={deviceConfig.color}>
						{isPolling ? renderGenericPollingContent() : renderGenericPreAuthContent()}
					</TVDisplay>
				);
		}
	};

	const renderUserAuthorization = () => (
		<>
			{deviceFlow.deviceCodeData && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('userAuthOverview')}
						aria-expanded={!collapsedSections.userAuthOverview}
					>
						<CollapsibleTitle>
							<FiSmartphone /> User Authorization Required
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.userAuthOverview}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.userAuthOverview && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Real-World Scenario: {deviceConfig.name}</InfoTitle>
									<InfoText>{deviceConfig.description}</InfoText>
									<InfoText style={{ marginTop: '0.5rem', color: '#64748b' }}>
										💡 {deviceConfig.useCase}
									</InfoText>
								</div>
							</InfoBox>

							{/* Device Type Selector */}
							<DeviceTypeSelector
								selectedDevice={selectedDevice}
								onDeviceChange={setSelectedDevice}
							/>

							{/* Dynamic Device Authorization Interface */}
							<DynamicDeviceFlow
								deviceType={selectedDevice}
								state={{
									deviceCode: deviceFlow.deviceCodeData?.device_code || '',
									userCode: deviceFlow.deviceCodeData?.user_code || '',
									verificationUri: deviceFlow.deviceCodeData?.verification_uri || '',
									verificationUriComplete:
										deviceFlow.deviceCodeData?.verification_uri_complete || '',
									expiresIn: deviceFlow.deviceCodeData?.expires_in || 0,
									interval: deviceFlow.deviceCodeData?.interval || 5,
									expiresAt: deviceFlow.deviceCodeData?.expires_at || new Date(),
									status: deviceFlow.tokens
										? 'authorized'
										: deviceFlow.pollingStatus.isPolling
											? 'pending'
											: 'pending',
									tokens: deviceFlow.tokens,
									lastPolled: deviceFlow.pollingStatus.lastPolled,
									pollCount: deviceFlow.pollingStatus.pollCount || 0,
								}}
								onStateUpdate={(newState) => {
									// Handle state updates if needed
									logger.info('DynamicDeviceFlow', 'State updated', newState);
								}}
								onComplete={(tokens) => {
									// Handle completion
									logger.info('DynamicDeviceFlow', 'Authorization completed', tokens);
								}}
								onError={(error) => {
									// Handle errors
									logger.error('DynamicDeviceFlow', 'Authorization error', error);
								}}
							/>

							{deviceFlow.timeRemaining > 0 && (
								<CountdownTimer>
									⏱️ Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
								</CountdownTimer>
							)}

							{/* Polling Control Buttons */}
							{deviceFlow.deviceCodeData && !deviceFlow.tokens && (
								<ActionRow
									style={{ justifyContent: 'center', marginTop: '1.5rem', gap: '0.75rem' }}
								>
									{deviceFlow.pollingStatus.isPolling ? (
										<Button onClick={deviceFlow.stopPolling} $variant="danger">
											<FiX /> Cancel Polling
										</Button>
									) : (
										<Button onClick={deviceFlow.refreshAuthorizationStatus} $variant="primary">
											<FiRefreshCw /> Check Authorization Status
										</Button>
									)}
								</ActionRow>
							)}
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);

	// OAuth 2.0 Device Authorization Code Flow does not include UserInfo endpoint
	// UserInfo is only available in OIDC flows

	const handleIntrospectToken = async (token: string) => {
		if (!deviceFlow.credentials?.environmentId || !deviceFlow.credentials?.clientId) {
			throw new Error('Missing credentials for introspection');
		}

		const request = {
			token: token,
			clientId: deviceFlow.credentials.clientId,
			// No client secret for device flow (public client)
			tokenTypeHint: 'access_token' as const,
		};

		try {
			// Use the reusable service to create API call data and execute introspection
			// Construct region-aware introspection endpoint
			const regionDomains: Record<string, string> = {
				us: 'auth.pingone.com',
				eu: 'auth.pingone.eu',
				ap: 'auth.pingone.asia',
				ca: 'auth.pingone.ca',
				na: 'auth.pingone.com',
			};
			const domain = regionDomains[deviceFlow.credentials.region || 'us'] || 'auth.pingone.com';
			const introspectionEndpoint = `https://${domain}/${deviceFlow.credentials.environmentId}/as/introspect`;

			const result = await TokenIntrospectionService.introspectToken(
				request,
				'device-code',
				introspectionEndpoint
			);

			// Set the API call data for display
			setIntrospectionApiCall(result.apiCall);

			return result.response;
		} catch (error) {
			// Construct region-aware introspection endpoint for error
			const regionDomains: Record<string, string> = {
				us: 'auth.pingone.com',
				eu: 'auth.pingone.eu',
				ap: 'auth.pingone.asia',
				ca: 'auth.pingone.ca',
				na: 'auth.pingone.com',
			};
			const domain = regionDomains[deviceFlow.credentials.region || 'us'] || 'auth.pingone.com';
			const introspectionEndpoint = `https://${domain}/${deviceFlow.credentials.environmentId}/as/introspect`;

			// Create error API call using reusable service
			const errorApiCall = TokenIntrospectionService.createErrorApiCall(
				request,
				'device-code',
				error instanceof Error ? error.message : 'Unknown error',
				500,
				introspectionEndpoint
			);

			setIntrospectionApiCall(errorApiCall);
			throw error;
		}
	};

	const renderIntrospection = () => (
		<>
			<TokenIntrospect
				flowName={`${selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Device Authorization Flow`}
				flowVersion="V7"
				tokens={deviceFlow.tokens as unknown as Record<string, unknown>}
				credentials={deviceFlow.credentials as unknown as Record<string, unknown>}
				onResetFlow={handleReset}
				onNavigateToTokenManagement={navigateToTokenManagement}
				onIntrospectToken={handleIntrospectToken}
				collapsedSections={{
					introspectionDetails: collapsedSections.introspectionDetails || false,
					rawJson: false,
				}}
				onToggleSection={(section) => {
					if (section === 'introspectionDetails') {
						toggleSection('introspectionDetails');
					}
				}}
				completionMessage="Token introspection allows you to validate and inspect your access tokens."
				nextSteps={[
					'Use the introspection results to verify token validity and permissions',
					'Check token expiration and active status',
					'View granted scopes and client information',
				]}
			/>

			{/* API Call Display for Token Introspection */}
			{introspectionApiCall && (
				<EnhancedApiCallDisplay
					apiCall={introspectionApiCall}
					options={{
						showEducationalNotes: true,
						showFlowContext: true,
						urlHighlightRules:
							EnhancedApiCallDisplayService.getDefaultHighlightRules('device-code'),
					}}
				/>
			)}
		</>
	);

	const renderAnalyticsAndMonitoring = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('analytics')}
					aria-expanded={!collapsedSections.analytics}
				>
					<CollapsibleTitle>
						<BarChart3 size={16} /> Analytics & Monitoring
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.analytics}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.analytics && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<BarChart3 size={16} /> Flow Analytics & Performance Monitoring
							</ExplanationHeading>
							<InfoText>
								Monitor the performance and analytics of your device authorization flow. Track
								completion rates, device usage patterns, and security metrics.
							</InfoText>

							{/* Analytics Dashboard */}
							<div style={{ marginTop: '1.5rem' }}>
								<AnalyticsDashboard />
							</div>

							{/* Performance Monitor */}
							<div style={{ marginTop: '1.5rem' }}>
								<PerformanceMonitor />
							</div>

							{/* Security Analytics */}
							<div style={{ marginTop: '1.5rem' }}>
								<SecurityAnalyticsDashboard />
							</div>

							<InfoBox $variant="info" style={{ marginTop: '1.5rem' }}>
								<FiInfo size={20} />
								<div>
									<InfoTitle>Analytics Features:</InfoTitle>
									<InfoText>
										• Flow completion tracking and success rates
										<br />• Device usage patterns and preferences
										<br />• Performance metrics and response times
										<br />• Security analytics and threat detection
										<br />• User behavior insights and learning progress
									</InfoText>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{/* Interactive Tutorial Section */}
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tutorial')}
					aria-expanded={!collapsedSections.tutorial}
				>
					<CollapsibleTitle>
						<Play size={16} /> Interactive Tutorial
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tutorial}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tutorial && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<Play size={16} /> Learn More About Device Authorization
							</ExplanationHeading>
							<InfoText>
								Take an interactive tutorial to deepen your understanding of device authorization
								flows, security considerations, and best practices.
							</InfoText>

							<div style={{ marginTop: '1.5rem' }}>
								<InteractiveTutorial />
							</div>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderCompletion = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('completionOverview')}
					aria-expanded={!collapsedSections.completionOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Flow Complete
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.completionOverview && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={24} />
							<div>
								<InfoTitle>Device Authorization Flow Complete!</InfoTitle>
								<InfoText>
									You've successfully completed the OAuth Device Authorization Grant flow. The
									device has been authorized and tokens have been received.
								</InfoText>
							</div>
						</InfoBox>

						<ExplanationSection style={{ marginTop: '1.5rem' }}>
							<ExplanationHeading>
								<FiInfo /> Summary
							</ExplanationHeading>
							<div
								style={{
									backgroundColor: '#f8fafc',
									padding: '1.5rem',
									borderRadius: '0.5rem',
									border: '1px solid #e2e8f0',
								}}
							>
								<ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
									<li>✅ Device code requested and received</li>
									<li>✅ User code displayed to user</li>
									<li>✅ User authorized on secondary device</li>
									<li>✅ Tokens received via polling</li>
									{Boolean(userInfo) && <li>✅ User information retrieved</li>}
									{Boolean(introspectionResult) && <li>✅ Token introspected and validated</li>}
								</ul>
							</div>
						</ExplanationSection>

						<ExplanationSection style={{ marginTop: '1.5rem' }}>
							<ExplanationHeading>
								<FiZap /> Next Steps
							</ExplanationHeading>
							<InfoText>In a production application, you would:</InfoText>
							<ul style={{ marginTop: '0.75rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
								<li>Store the access token securely</li>
								<li>Use the access token to call protected APIs</li>
								<li>Refresh the token when it expires (if refresh token provided)</li>
								<li>Handle token expiration and re-authorization</li>
								<li>Implement proper error handling and retry logic</li>
							</ul>
						</ExplanationSection>

						<ActionRow style={{ marginTop: '1.5rem' }}>
							<Button onClick={handleReset} $variant="danger">
								<FiRefreshCw /> Start New Flow
							</Button>
						</ActionRow>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	return (
		<FlowContainer>
			<FlowContent>
				<StandardFlowHeader flowId="device-authorization-v9" />

				<EnhancedFlowInfoCard
					flowType={selectedVariant === 'oidc' ? 'oidc-device-code' : 'device-code'}
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowHeader $variant={selectedVariant}>
					<div>
						<StepBadge $variant={selectedVariant}>
							{selectedVariant === 'oidc' ? 'OPENID CONNECT' : 'OAUTH 2.0'} DEVICE AUTHORIZATION •
							V7 UNIFIED
						</StepBadge>
						<FlowTitle>
							{selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'}{' '}
							{STEP_METADATA[currentStep].title}
						</FlowTitle>
						<FlowSubtitle>
							{selectedVariant === 'oidc'
								? 'Authentication + Authorization with ID token and Access token'
								: 'API Authorization with Access token only'}
						</FlowSubtitle>
					</div>
					<div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
						{String(currentStep + 1).padStart(2, '0')}
						<span style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.75)' }}>
							{' '}
							of {STEP_METADATA.length}
						</span>
					</div>
				</FlowHeader>

				{/* V7 Variant Selector - Now below Flow Header */}
				{renderVariantSelector()}

				{renderStepContent()}

				<CredentialValidationModal />

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() =>
						validateCredentialsAndProceed(() =>
							setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))
						)
					}
					canNavigateNext={isStepValid(currentStep + 1)}
					isFirstStep={currentStep === 0}
					nextButtonText={isStepValid(currentStep + 1) ? 'Next' : 'Complete above action'}
					disabledMessage={
						getStepValidationMessage(currentStep + 1) || 'Complete the action above to continue'
					}
				/>

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('deviceSelection')}
						aria-expanded={!collapsedSections.deviceSelection}
					>
						<CollapsibleTitle>
							<FiMonitor /> Device Simulator
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.deviceSelection}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.deviceSelection && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiMonitor style={{ flexShrink: 0, color: '#3b82f6' }} />
								<div>
									<InfoTitle style={{ fontSize: '1rem', fontWeight: 600, color: '#0369a1' }}>
										🎮 Device Selection
									</InfoTitle>
									<InfoText style={{ marginTop: '0.75rem', color: '#0c4a6e' }}>
										Device selection is available in the main flow area above. Choose your device
										type to see the appropriate authorization interface.
									</InfoText>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			</FlowContent>

			{/* Polling Prompt Modal */}
			<ModalOverlay $isOpen={showPollingModal}>
				<ModalContent
					ref={modalRef}
					$position={modalPosition || undefined}
					$isDragging={isDragging}
				>
					<ModalHeader onMouseDown={handleModalMouseDown}>
						<FiClock size={32} color="white" />
						<ModalTitle style={{ color: 'white' }}>Ready to Start Polling?</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>
							The device code has been generated and displayed on the {deviceConfig.displayName}.
							The user can now scan the QR code or enter the code on their phone.
						</p>
						<p style={{ marginTop: '1rem' }}>
							<strong>Next step:</strong> Start polling the authorization server to check if the
							user has completed authorization. The app will automatically check every{' '}
							{deviceFlow.deviceCodeData?.interval || 5} seconds.
						</p>
						<div
							style={{
								marginTop: '1rem',
								padding: '0.75rem',
								backgroundColor: '#eff6ff',
								borderRadius: '0.5rem',
								border: '1px solid #bfdbfe',
							}}
						>
							<div style={{ marginBottom: '0.75rem' }}>
								<DeviceTypeSelector
									selectedDevice={selectedDevice}
									onDeviceChange={(deviceType) => {
										setSelectedDevice(deviceType);
										localStorage.setItem('device_flow_selected_device', deviceType);
									}}
									variant="compact"
								/>
							</div>
							<p style={{ margin: 0 }}>
								{deviceConfig.emoji}{' '}
								<strong>Watch the {deviceConfig.name} display update in real-time</strong> as the
								user authorizes on their phone!
							</p>
						</div>
						<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
							<FiInfo size={18} />
							<div>
								<InfoText style={{ fontSize: '0.875rem', margin: 0 }}>
									💡 <strong>Tip:</strong> You can disable this prompt in UI Settings if you prefer
									to start polling manually.
								</InfoText>
							</div>
						</InfoBox>
					</ModalBody>
					<ModalActions>
						<Button onClick={handleDismissModal} $variant="outline">
							Cancel
						</Button>
						<Button onClick={handleStartPolling} $variant="primary">
							<FiRefreshCw /> Start Polling Now
						</Button>
					</ModalActions>
				</ModalContent>
			</ModalOverlay>
		</FlowContainer>
	);
};

export default DeviceAuthorizationFlowV9;
