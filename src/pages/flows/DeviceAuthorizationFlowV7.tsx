// src/pages/flows/DeviceAuthorizationFlowV7_New.tsx
// V7 Unified OAuth/OIDC Device Authorization Grant (RFC 8628) - Complete Implementation

import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-icons/fi';
import { themeService } from '../../services/themeService';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useUISettings } from '../../contexts/UISettingsContext';
import { useDeviceAuthorizationFlow, type DeviceAuthCredentials } from '../../hooks/useDeviceAuthorizationFlow';
import { FlowHeader as StandardFlowHeader } from '../../services/flowHeaderService';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import {
	TokenIntrospectionService,
	IntrospectionApiCallData,
} from '../../services/tokenIntrospectionService';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import { UISettingsService } from '../../services/uiSettingsService';
import { usePageScroll } from '../../hooks/usePageScroll';
import { DeviceTypeSelector } from '../../components/DeviceTypeSelector';
import { deviceTypeService } from '../../services/deviceTypeService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';

// Styled Components (V5 Parity)
const FlowContainer = styled.div`
	min-height: 100vh;
	background-color: var(--color-background, #f9fafb);
	padding: 2rem 0 6rem;
`;

const FlowContent = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const FlowHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 1rem 1rem 0 0;
	box-shadow: 0 10px 25px rgba(22, 163, 74, 0.2);
	max-width: 64rem;
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

const StepBadge = styled.span`
	background: rgba(22, 163, 74, 0.2);
	border: 1px solid #4ade80;
	color: #bbf7d0;
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
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0c4a6e;
	transition: background 0.2s ease;

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
	{ title: 'Step 5: Flow Complete', subtitle: 'Summary and next steps' },
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

const SmartTVContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
	margin: 2rem 0;
`;

const SmartTV = styled.div<{
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

const TVScreen = styled.div<{ $showContent?: boolean }>`
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

const TVStatusIndicator = styled.div<{
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

const ScrollIndicator = styled.div`
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

const ScrollText = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`;

const ScrollArrow = styled.div`
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

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	animation: slideUp 0.3s ease;

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
	margin-bottom: 1rem;
	color: #1e293b;
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
	margin-bottom: 1.5rem;
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
`;

const QRSection = styled.div`
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
	border: 2px solid ${props => props.$selected ? '#3b82f6' : '#cbd5e1'};
	background: ${props => props.$selected ? '#dbeafe' : 'white'};
	color: ${props => props.$selected ? '#1e40af' : '#475569'};
	font-weight: ${props => props.$selected ? '600' : '500'};
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

const DeviceAuthorizationFlowV7: React.FC = () => {
	// V7 Variant State
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>('oidc');
	
	const deviceFlow = useDeviceAuthorizationFlow();

	const ensureCredentials = useCallback(
		(updates: Partial<DeviceAuthCredentials>) => {
			const current = deviceFlow.credentials ?? {
				environmentId: '',
				clientId: '',
				scopes: 'openid',
			};

			const next: DeviceAuthCredentials = {
				environmentId: updates.environmentId ?? current.environmentId ?? '',
				clientId: updates.clientId ?? current.clientId ?? '',
				scopes: updates.scopes ?? current.scopes ?? 'openid',
			};

			const optionalFields: Array<keyof Pick<DeviceAuthCredentials, 'clientSecret' | 'loginHint' | 'postLogoutRedirectUri'>> = [
				'clientSecret',
				'loginHint',
				'postLogoutRedirectUri',
			];

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
		[deviceFlow]
	);

	// V7 Variant Change Handler
	const handleVariantChange = useCallback((variant: 'oauth' | 'oidc') => {
		setSelectedVariant(variant);
		
		// Update scopes based on variant
		const currentCredentials = deviceFlow.credentials || { environmentId: '', clientId: '', scopes: '' };
		const updatedScopes = variant === 'oidc' 
			? 'openid profile email' 
			: 'read write'; // Default OAuth scopes
			
		ensureCredentials({
			...currentCredentials,
			scopes: updatedScopes
		});
		
		v4ToastManager.showSuccess(`Switched to ${variant.toUpperCase()} Device Authorization variant`);
	}, [deviceFlow.credentials, ensureCredentials]);

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
				<VariantDescription>ID token + Access token - Authentication + Authorization</VariantDescription>
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
		uiSettings: true,  // Collapsed by default
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
		return stored && deviceTypeService.getDeviceType(stored) ? stored : 'streaming-tv';
	});
	const deviceConfig = useMemo(
		() => deviceTypeService.getDeviceType(selectedDevice),
		[selectedDevice]
	);
	const instructionMessage = useMemo(
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
	const deviceApps = useMemo(() => deviceTypeService.getDeviceApps(selectedDevice), [selectedDevice]);
	const deviceOptions = useMemo(() => deviceTypeService.getDeviceTypeOptions(), []);

	React.useEffect(() => {
		localStorage.setItem('device_flow_selected_device', selectedDevice);
	}, [selectedDevice]);
	const brandGradient = useMemo(
		() => `linear-gradient(135deg, ${deviceConfig.color} 0%, ${deviceConfig.secondaryColor} 100%)`,
		[deviceConfig.color, deviceConfig.secondaryColor]
	);

	usePageScroll({ pageName: 'Device Authorization Flow V7 - Unified', force: true });

	// Explicit scroll to top for step 2 (User Authorization)
	React.useEffect(() => {
		if (currentStep === 2) {
			// Force scroll to top when entering User Authorization step
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	}, [currentStep]);

	// Note: Credential loading is now handled automatically by ComprehensiveCredentialsService
	// The V6 service architecture provides automatic persistence and cross-flow credential sharing

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
		deviceFlow.startPolling();
		// Stay on current step (User Authorization - step 2) so user can see Smart TV update
		// Don't advance to step 3 - let user see the real-time polling results on the TV display
	}, [deviceFlow]);

	const handleDismissModal = useCallback(() => {
		setShowPollingModal(false);
	}, []);

	const handleReset = useCallback(() => {
		deviceFlow.reset();
		setCurrentStep(0);
		setShowPollingModal(false);
		setUserInfo(null);
		setIntrospectionResult(null);
		setHasScrolledToTV(false);
	}, [deviceFlow]);

	// Step validation
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					return true; // Introduction
				case 1:
					return !!deviceFlow.credentials;
				case 2:
					return !!deviceFlow.deviceCodeData;
				case 3:
					return !!deviceFlow.tokens; // Tokens (old step 4)
				case 4:
					return !!deviceFlow.tokens; // Introspection (old step 5)
				case 5:
					return true; // Completion (old step 6)
				default:
					return false;
			}
		},
		[deviceFlow.credentials, deviceFlow.deviceCodeData, deviceFlow.tokens]
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
									The user authorized on their secondary device. Tokens have been issued to this device.
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
											url: `https://auth.pingone.com/${deviceFlow.credentials?.environmentId || '[environmentId]'}/as/token`,
											headers: {
												'Content-Type': 'application/x-www-form-urlencoded'
											},
											body: {
												grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
												device_code: '[device_code_from_step_1]',
												client_id: deviceFlow.credentials?.clientId || '[clientId]'
											},
											response: {
												status: 200,
												statusText: 'OK',
												headers: {
													'Content-Type': 'application/json',
													'Cache-Control': 'no-store',
													'Pragma': 'no-cache'
												},
												data: selectedVariant === 'oidc' ? {
													access_token: deviceFlow.tokens?.access_token || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
													id_token: deviceFlow.tokens?.id_token || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
													refresh_token: deviceFlow.tokens?.refresh_token || 'rt_eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
													token_type: 'Bearer',
													expires_in: 3600,
													scope: deviceFlow.tokens?.scope || 'openid profile email'
												} : {
													access_token: deviceFlow.tokens?.access_token || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
													refresh_token: deviceFlow.tokens?.refresh_token || 'rt_eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
													token_type: 'Bearer',
													expires_in: 3600,
													scope: deviceFlow.tokens?.scope || 'read write'
												}
											},
											flowType: 'device-code',
											stepName: 'token-exchange',
											description: `${selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Device Token Exchange`,
											educationalNotes: [
												'This request exchanges the device_code for access tokens',
												'The device polls this endpoint until the user completes authorization',
												`${selectedVariant === 'oidc' ? 'OIDC response includes ID token for user identity' : 'OAuth response includes access token for API access'}`,
												'Polling continues until success, error, or timeout'
											]
										}}
										options={{
											showEducationalNotes: true,
											showFlowContext: true,
											urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('device-code')
										}}
									/>
								</div>

								<ResultsSection style={{ marginTop: '1.5rem' }}>
									<ResultsHeading>
										<FiKey size={18} /> {selectedVariant === 'oidc' ? 'Tokens Received' : 'Access Token'}
									</ResultsHeading>
									<GeneratedContentBox>
										<ParameterGrid>
											{/* Access Token - Always present */}
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Access Token</ParameterLabel>
												<ParameterValue
													style={{
														wordBreak: 'break-all',
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
															wordBreak: 'break-all',
															fontFamily: 'monospace',
															fontSize: '0.75rem',
															backgroundColor: '#f0f9ff',
															border: '1px solid #0ea5e9',
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
															wordBreak: 'break-all',
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
										<ActionRow style={{ justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
													onClick={() => handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')}
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
										<InfoTitle>OAuth vs OIDC Tokens</InfoTitle>
										<InfoText>
											<strong>OAuth 2.0 Device Flow</strong> returns an `access_token` and often a
											`refresh_token`. For ID Tokens and UserInfo, use the OIDC Device Authorization Flow which adds the
											`openid` scope.
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
															wordBreak: 'break-all',
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
													onClick={() => handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')}
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
								<FiInfo /> What is Device Authorization Flow?
							</ExplanationHeading>
							<InfoText>
								The Device Authorization Grant (RFC 8628) enables OAuth clients on input-constrained
								devices to obtain user authorization without a browser. Perfect for smart TVs, IoT
								devices, CLI tools, and gaming consoles.
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
									<InfoTitle>RFC 8628 Specification:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>Device Code</strong>: Short-lived code displayed to user
										</li>
										<li>
											<strong>User Code</strong>: Human-readable code for user verification
										</li>
										<li>
											<strong>Verification URI</strong>: URL where user completes authorization
										</li>
										<li>
											<strong>Polling</strong>: Client polls token endpoint until authorized
										</li>
										<li>
											<strong>Timeout</strong>: Codes expire after 10-15 minutes
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
									<InfoTitle>OAuth vs OIDC Device Flow:</InfoTitle>
									<InfoText style={{ marginTop: '0.5rem' }}>
										<strong>Important:</strong> OIDC doesn't define a separate "Device Flow"
										specification. It reuses the OAuth 2.0 Device Authorization Grant (RFC 8628) and
										adds the usual OIDC semantics:
									</InfoText>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>
											<strong>OAuth Device Flow</strong>: Returns access_token and refresh_token
											only
										</li>
										<li>
											<strong>OIDC Device Flow</strong>: Adds ID Token, UserInfo endpoint, and
											requires <code>openid</code> scope
										</li>
										<li>Both flows use the same RFC 8628 device authorization mechanism</li>
										<li>OIDC adds identity layer on top of OAuth's authorization framework</li>
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
										<strong>1. Device requests device code</strong> - Device calls the device
										authorization endpoint with client_id and scopes
										<br />
										<code
											style={{
												background: '#e2e8f0',
												padding: '0.25rem 0.5rem',
												borderRadius: '0.25rem',
												fontSize: '0.85em',
											}}
										>
											POST /device_authorization
										</code>
										<br />
										<small style={{ color: '#64748b' }}>
											Server responds with: device_code, user_code, verification_uri, expires_in,
											interval
										</small>
									</li>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>2. Display user code</strong> - Device shows user_code and
										verification_uri to user on screen (e.g., "Visit example.com and enter code:
										ABCD-1234")
										<br />
										<small style={{ color: '#64748b' }}>
											Example display: "Go to https://auth.pingone.com/activate and enter:
											WDJB-MJHT"
										</small>
									</li>
									<li style={{ marginBottom: '1.5rem' }}>
										<strong>3. User authorizes on secondary device</strong> - User visits URL on
										phone/computer, enters code, and authorizes the application
										<br />
										<small style={{ color: '#64748b' }}>
											User sees: "Authorize 'Smart TV App' to access your account?"
										</small>
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Device polls for tokens</strong> - Device continuously polls token
										endpoint until user completes authorization
									</li>
									<li>
										<strong>Tokens received</strong> - Device receives access token, ID token, and
										optionally refresh token
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
			<FlowConfigurationRequirements flowType="device-authorization" variant="oauth" />

			{/* Flow Walkthrough */}
			<EnhancedFlowWalkthrough flowId={selectedVariant === 'oidc' ? 'oidc-device-authorization' : 'oauth-device-authorization'} />
			<FlowSequenceDisplay flowType="device-authorization" />

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
				scopes={deviceFlow.credentials?.scopes || 'openid profile email'}
				
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
					// PingOne requires 'openid' scope even for OAuth flows
					let finalScopes = newScopes;
					if (!newScopes.includes('openid')) {
						finalScopes = `openid ${newScopes}`.trim();
						v4ToastManager.showWarning('Added "openid" scope (required by PingOne)');
					}
					ensureCredentials({ scopes: finalScopes });
				}}
				
				// Save handler (setCredentials already persists to localStorage)
				onSave={() => {
					// Trigger a re-save by setting credentials again
					if (deviceFlow.credentials) {
						ensureCredentials(deviceFlow.credentials);
						v4ToastManager.showSuccess('Credentials saved successfully!');
					}
				}}
				hasUnsavedChanges={false}
				isSaving={false}
				requireClientSecret={false}  // Device flows don't need client secret
				
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
			/>

			{/* Info about Device Flow Requirements */}
			<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
				<FiInfo style={{ flexShrink: 0, color: '#3b82f6' }} />
				<div>
					<InfoTitle>Device Flow Requirements</InfoTitle>
					<InfoText>
						<strong>Redirect URI:</strong> Not required for Device Authorization Flow (designed for 
						devices that cannot handle browser redirects like smart TVs, IoT devices, or CLI tools).
						<br /><br />
						<strong>Scopes:</strong> PingOne requires the <code>openid</code> scope even for OAuth flows. 
						It will be automatically added if you remove it. You can add additional scopes like 
						<code>profile</code>, <code>email</code>, <code>offline_access</code>, or custom API scopes.
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
											url: `https://auth.pingone.com/${deviceFlow.credentials?.environmentId || '[environmentId]'}/as/device_authorization`,
											headers: {
												'Content-Type': 'application/x-www-form-urlencoded'
											},
											body: {
												client_id: deviceFlow.credentials?.clientId || '[clientId]',
												scope: deviceFlow.credentials?.scopes || (selectedVariant === 'oidc' ? 'openid profile email' : 'read write')
											},
											response: deviceFlow.deviceCodeData ? {
												status: 200,
												statusText: 'OK',
												headers: {
													'Content-Type': 'application/json',
													'Cache-Control': 'no-store'
												},
												data: {
													device_code: deviceFlow.deviceCodeData.device_code,
													user_code: deviceFlow.deviceCodeData.user_code,
													verification_uri: deviceFlow.deviceCodeData.verification_uri,
													verification_uri_complete: deviceFlow.deviceCodeData.verification_uri_complete,
													expires_in: deviceFlow.deviceCodeData.expires_in,
													interval: deviceFlow.deviceCodeData.interval
												}
											} : undefined,
											flowType: 'device-code',
											stepName: 'device-authorization-request',
											description: `${selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Device Authorization Request`,
											educationalNotes: [
												'This endpoint initiates the device authorization flow',
												`For ${selectedVariant === 'oidc' ? 'OIDC' : 'OAuth 2.0'}: Returns device_code, user_code, and verification_uri`,
												'The device will poll the token endpoint using the device_code',
												'The user will enter the user_code at the verification_uri'
											]
										}}
										options={{
											showEducationalNotes: true,
											showFlowContext: true,
											urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('device-code')
										}}
									/>
								</div>
							</InfoBox>

							<InfoBox $variant="success" style={{ marginTop: '1rem' }}>
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
									2
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
									style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
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
													wordBreak: 'break-all',
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

	const handleOpenOnThisDevice = useCallback(() => {
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
			deviceFlow.deviceCodeData.verification_uri_complete || deviceFlow.deviceCodeData.verification_uri;
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
			<WelcomeMessage style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: deviceConfig.color }}>
				{welcomeMessage}
			</WelcomeMessage>
			<div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Welcome Back, Demo User 👋</div>
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
			<div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>AUTHORIZATION...</div>
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
					marginBottom: '0.5rem',
				}}
			>
				Enter this code on your phone:
			</div>
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

	const renderDeviceSuccessContent = () => {
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

	const renderDeviceDisplay = (tokens: any) => {
		if (tokens) {
			return renderGenericSuccessContent();
		}
		return renderGenericPreAuthContent();
	};

	const renderDevicePendingContent = () => {
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
								<span>Enter code • <strong>{deviceFlow.deviceCodeData?.user_code}</strong></span>
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
									<KioskValue>Scan QR or visit {deviceFlow.deviceCodeData?.verification_uri}</KioskValue>
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

							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
									gap: '0.5rem',
									marginTop: '1.5rem',
								}}
							>
								<label style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
									Simulate Device View
								</label>
								<select
									value={selectedDevice}
									onChange={(e) => setSelectedDevice(e.target.value)}
									style={{
										padding: '0.65rem 0.85rem',
										borderRadius: '0.5rem',
										border: '2px solid #cbd5f5',
										fontSize: '0.95rem',
										fontWeight: 500,
										color: '#1e293b',
										backgroundColor: '#ffffff',
									}}
								>
									{deviceOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.emoji} {option.label}
										</option>
									))}
								</select>
							</div>

							<SmartTVContainer>
								<QRSection>
									<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1e293b' }}>
										📱 Step 1: Scan with Your Device
									</h3>
									<p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
										{instructionMessage}
									</p>

									<div
										style={{
											padding: '1rem',
											backgroundColor: '#f8fafc',
											borderRadius: '0.5rem',
											marginBottom: '1rem',
										}}
									>
										{deviceFlow.deviceCodeData.verification_uri_complete ? (
											<QRCodeSVG
												value={deviceFlow.deviceCodeData.verification_uri_complete}
												size={200}
												level="H"
												includeMargin={true}
												style={{ display: 'block', margin: '0 auto' }}
											/>
										) : (
											<p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
												QR code will appear here when available
											</p>
										)}
									</div>

									<div
										style={{
											padding: '1rem',
											backgroundColor: '#eff6ff',
											borderRadius: '0.5rem',
											border: '1px solid #bfdbfe',
											marginBottom: '1rem',
										}}
									>
										<p
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.75rem',
												color: '#64748b',
												textTransform: 'uppercase',
												fontWeight: '600',
											}}
										>
											Or visit manually:
										</p>
										<code
											style={{ fontSize: '0.875rem', color: '#1e40af', wordBreak: 'break-all' }}
										>
											{deviceFlow.deviceCodeData.verification_uri}
										</code>
										<p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
											Enter code:{' '}
											<strong
												style={{ color: '#1e40af', fontSize: '1rem', letterSpacing: '0.1rem' }}
											>
												{deviceFlow.deviceCodeData.user_code}
											</strong>
										</p>
									</div>

									<ActionRow style={{ justifyContent: 'center' }}>
										<Button onClick={handleOpenOnThisDevice} $variant="primary">
											<FiExternalLink /> Open on This Device
										</Button>
									</ActionRow>
								</QRSection>

								{/* Scroll Indicator */}
								<ScrollIndicator>
									<ScrollText>👇 Scroll down to see your {deviceConfig.name} display 👇</ScrollText>
									<ScrollArrow>⬇️</ScrollArrow>
								</ScrollIndicator>

								{/* Device Display - Shows result after authorization */}
								<SmartTV
									$isWaiting={deviceFlow.pollingStatus.isPolling || !deviceFlow.tokens}
									$accentStart={deviceConfig.color}
									$accentEnd={deviceConfig.secondaryColor}
									data-tv-display
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											marginBottom: '1rem',
										}}
									>
										<TVStatusIndicator
											$active={!!deviceFlow.tokens}
											$activeColor={deviceConfig.color}
											$inactiveColor="#ef4444"
										/>
										<h3 style={{ margin: 0, fontSize: '1.25rem', color: '#94a3b8' }}>
											{deviceConfig.icon} {deviceConfig.displayName}
										</h3>
									</div>
									<TVScreen $showContent={!!deviceFlow.tokens}>
										{renderDeviceDisplay(deviceFlow.tokens)}
									</TVScreen>
								</SmartTV>
							</SmartTVContainer>

							{deviceFlow.timeRemaining > 0 && (
								<CountdownTimer>
									⏱️ Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
								</CountdownTimer>
							)}

							{/* Cancel Polling Button */}
							{deviceFlow.pollingStatus.isPolling && (
								<ActionRow style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
									<Button onClick={deviceFlow.stopPolling} $variant="danger">
										<FiX /> Cancel Polling
									</Button>
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
			const result = await TokenIntrospectionService.introspectToken(
				request,
				'device-code',
				`https://auth.pingone.com/${deviceFlow.credentials.environmentId}/as/introspect`
			);

			// Set the API call data for display
			setIntrospectionApiCall(result.apiCall);

			return result.response;
		} catch (error) {
			// Create error API call using reusable service
			const errorApiCall = TokenIntrospectionService.createErrorApiCall(
				request,
				'device-code',
				error instanceof Error ? error.message : 'Unknown error',
				500,
				`https://auth.pingone.com/${deviceFlow.credentials.environmentId}/as/introspect`
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
				<StandardFlowHeader flowId="device-authorization-v7" />
				
				{UISettingsService.getFlowSpecificSettingsPanel('device-authorization')}
				
				<EnhancedFlowInfoCard
					flowType={selectedVariant === 'oidc' ? 'oidc-device-code' : 'device-code'}
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				{/* V7 Variant Selector */}
				{renderVariantSelector()}

				<FlowHeader>
					<div>
						<StepBadge>
							{selectedVariant === 'oidc' ? 'OPENID CONNECT' : 'OAUTH 2.0'} DEVICE AUTHORIZATION • V7 UNIFIED
						</StepBadge>
						<FlowTitle>
							{selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} {STEP_METADATA[currentStep].title}
						</FlowTitle>
						<FlowSubtitle>
							{selectedVariant === 'oidc' 
								? 'Authentication + Authorization with ID token and Access token'
								: 'API Authorization with Access token only'
							}
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

				{renderStepContent()}

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() => setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep + 1)}
					isFirstStep={currentStep === 0}
					nextButtonText={isStepValid(currentStep + 1) ? 'Next' : 'Complete above action'}
					disabledMessage="Complete the action above to continue"
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
										🎮 Choose Your Device
									</InfoTitle>
									<InfoText style={{ marginTop: '0.75rem', color: '#0c4a6e' }}>
										Select the type of device you want to simulate. This updates the entire flow’s visuals and messaging.
									</InfoText>
									<div style={{ marginTop: '1rem' }}>
										<DeviceTypeSelector
											value={selectedDevice}
											onChange={setSelectedDevice}
											label="Select Device Type"
											showInfo={true}
										/>
									</div>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			</FlowContent>

			{/* Polling Prompt Modal */}
			<ModalOverlay $isOpen={showPollingModal}>
				<ModalContent>
					<ModalHeader>
						<FiClock size={32} color="#3b82f6" />
						<ModalTitle>Ready to Start Polling?</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>
							The device code has been generated and displayed on the {deviceConfig.displayName}. The user
							can now scan the QR code or enter the code on their phone.
						</p>
						<p style={{ marginTop: '1rem' }}>
							<strong>Next step:</strong> Start polling the authorization server to check if the
							user has completed authorization. The app will automatically check every{' '}
							{deviceFlow.deviceCodeData?.interval || 5} seconds.
						</p>
						<p
							style={{
								marginTop: '1rem',
								padding: '0.75rem',
								backgroundColor: '#eff6ff',
								borderRadius: '0.5rem',
								border: '1px solid #bfdbfe',
							}}
						>
							{deviceConfig.emoji}{' '}
							<strong>Watch the {deviceConfig.name} display update in real-time</strong> as the user
							authorizes on their phone!
						</p>
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

export default DeviceAuthorizationFlowV7;
