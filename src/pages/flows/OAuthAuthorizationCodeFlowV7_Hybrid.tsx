// src/pages/flows/OAuthAuthorizationCodeFlowV7_Complete.tsx
// V7 Complete OAuth Authorization Code Flow - Based on V6 with V7 enhancements
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiPackage,
	FiRefreshCw,
	FiSend,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedSecurityFeaturesDemo from '../../components/EnhancedSecurityFeaturesDemo';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
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
import { CopyButtonService } from '../../services/copyButtonService';
import {
	EnhancedApiCallData,
	EnhancedApiCallDisplayService,
} from '../../services/enhancedApiCallDisplayService';
import FlowCredentialService from '../../services/flowCredentialService';
import { FlowHeader } from '../../services/flowHeaderService';
import FlowStorageService from '../../services/flowStorageService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { PKCEGenerationService } from '../../services/pkceGenerationService';
import { themeService } from '../../services/themeService';
import {
	IntrospectionApiCallData,
	TokenIntrospectionService,
} from '../../services/tokenIntrospectionService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { decodeJWTHeader } from '../../utils/jwks';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import {
	DEFAULT_APP_CONFIG,
	type IntroSectionKey,
	STEP_METADATA,
} from './config/OAuthAuthzCodeFlowV6.config';

type StepCompletionState = Record<number, boolean>;

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const StepHeader = styled.div<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'};
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span<{ $variant: 'oauth' | 'oidc' }>`
	align-self: flex-start;
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
`;

const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`;

const StepHeaderRight = styled.div`
	text-align: right;
`;

const RequirementsIndicator = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const RequirementsIcon = styled.div`
	color: #d97706;
	font-size: 1.25rem;
	margin-top: 0.125rem;
	flex-shrink: 0;
`;

// V7 Variant Selector Components
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

const RequirementsText = styled.div`
	color: #92400e;
	font-size: 0.875rem;
	line-height: 1.5;

	strong {
		font-weight: 600;
		display: block;
		margin-bottom: 0.5rem;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	li {
		margin-bottom: 0.25rem;
	}
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`;

const StepContentWrapper = styled.div`
	padding: 2rem;
	background: #ffffff;
`;

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const _Section = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
	overflow: hidden;
`;

const _SectionHeader = styled.div`
	background: #f8fafc;
	color: #374151;
	padding: 1.25rem 1.75rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	line-height: 1.35;
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;
	line-height: 1.4;
	min-height: 72px;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`;

// Theme-specific header variants
const _OrangeHeaderButton = styled(CollapsibleHeaderButton)`
	background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%);
	color: #7c2d12;
	
	&:hover {
		background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
	}
`;

const BlueHeaderButton = styled(CollapsibleHeaderButton)`
	background: linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%);
	color: #1e3a8a;
	
	&:hover {
		background: linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%);
	}
`;

const YellowHeaderButton = styled(CollapsibleHeaderButton)`
	background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
	color: #78350f;
	
	&:hover {
		background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
	}
`;

const GreenHeaderButton = styled(CollapsibleHeaderButton)`
	background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%);
	color: #065f46;
	
	&:hover {
		background: linear-gradient(135deg, #a7f3d0 0%, #34d399 100%);
	}
`;

const HighlightHeaderButton = styled(CollapsibleHeaderButton)`
	background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
	color: #1e40af;
	box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	
	&:hover {
		background: linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%);
		box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
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
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(180deg) scale(1.1)'};
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

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
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
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	margin: 0.5rem 0 0;
	padding-left: 1.5rem;
`;

const _FlowSuitability = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0 0;
`;

const _SuitabilityCard = styled.div<{ $variant: 'success' | 'warning' | 'danger' }>`
	border-radius: 1rem;
	padding: 1.25rem;
	border: 2px solid
		${({ $variant }) => {
			if ($variant === 'success') return '#34d399';
			if ($variant === 'warning') return '#fbbf24';
			return '#f87171';
		}};
	background:
		${({ $variant }) => {
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'warning') return '#fef3c7';
			return '#fee2e2';
		}};
	color: #1f2937;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);

	ul {
		margin: 0.75rem 0 0;
		padding-left: 1.25rem;
		line-height: 1.6;
	}
`;

const GeneratedContentBox = styled.div`
	background-color: #dcfce7;
	border: 1px solid #22c55e;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #16a34a;
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
	color: #16a34a;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background-color: #f0fdf4;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #bbf7d0;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

const _SaveAdvancedParamsButton = styled.button`
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
	margin-top: 2rem;

	&:hover {
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

const _SavedAdvancedParamsIndicator = styled.div`
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
	margin-top: 1rem;
	animation: slideIn 0.3s ease-out;

	svg {
		font-size: 1.25rem;
	}

	@keyframes slideIn {
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

const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #22c55e;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #16a34a;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #16a34a;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #15803d;
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
		color: #14532d;
		border-color: #bbf7d0;
		&:hover:not(:disabled) {
			background-color: #f0fdf4;
			border-color: #22c55e;
		}
	`}
`;

const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	background:
		${({ $priority }) =>
			$priority === 'primary'
				? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
				: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
	box-shadow:
		${({ $priority }) =>
			$priority === 'primary'
				? '0 6px 18px rgba(34, 197, 94, 0.35)'
				: '0 6px 18px rgba(16, 185, 129, 0.35)'};
	color: #ffffff;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background:
			${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.6) 100%)'
					: 'linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(5,150,105,0.6) 100%)'};
		box-shadow: none;
	}
`;

const HighlightBadge = styled.span`
	position: absolute;
	top: -10px;
	right: -10px;
	background: #22c55e;
	color: #ffffff;
	border-radius: 9999px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
`;

const GeneratedUrlDisplay = styled.div`
	background-color: #ecfdf3;
	border: 1px solid #bbf7d0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.9rem;
	word-break: break-all;
	position: relative;
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 3rem 2rem;
	color: #166534;
`;

const EmptyIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #ecfdf3;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #16a34a;
`;

const EmptyTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #14532d;
	margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
	font-size: 0.875rem;
	color: #166534;
	margin-bottom: 1rem;
`;

const _VariantToggleContainer = styled.div`
	display: inline-flex;
	border-radius: 9999px;
	border: 1px solid #d1d5db;
	background: #f8fafc;
	overflow: hidden;
	margin: 1.5rem 0;
`;

const _VariantToggleButton = styled.button<{ $active: boolean }>`
	appearance: none;
	border: none;
	padding: 0.65rem 1.4rem;
	font-weight: 600;
	font-size: 0.9rem;
	cursor: pointer;
	background: ${({ $active }) => ($active ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent')};
	color: ${({ $active }) => ($active ? '#ffffff' : '#1f2937')};
	transition: background 0.2s ease, color 0.2s ease;
	min-width: 140px;
	outline: none;

	&:hover {
		background: ${({ $active }) => ($active ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' : '#e5e7eb')};
	}
`;

const OAuthAuthorizationCodeFlowV7: React.FC = () => {
	console.log('🚀 [OAuthAuthorizationCodeFlowV7] V7 Complete Flow loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	// Scroll to top on page load
	usePageScroll({ pageName: 'OAuth Authorization Code Flow V7 - Complete', force: true });

	const manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'oauth-authorization-code-v7',
		defaultFlowVariant: 'oidc', // V7 defaults to OIDC
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(
		AuthorizationCodeSharedService.StepRestoration.getInitialStep()
	);
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
	const [_emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
	const [collapsedSections, setCollapsedSections] = useState(
		AuthorizationCodeSharedService.CollapsibleSections.getDefaultState()
	);
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	const [_copiedField, setCopiedField] = useState<string | null>(null);
	const [flowVariant, setFlowVariant] = useState<'oauth' | 'oidc'>(controller.flowVariant);

	useEffect(() => {
		setFlowVariant(controller.flowVariant);
	}, [controller.flowVariant]);

	const ensureOidcScopes = useCallback((scopeValue: string | undefined) => {
		const base = scopeValue?.split(' ').filter(Boolean) ?? [];
		const required = ['openid', 'profile', 'email']; // Consistent scopes for both OAuth 2.0 and OIDC variants
		required.forEach((scope) => {
			if (!base.includes(scope)) {
				base.push(scope);
			}
		});
		return base.join(' ');
	}, []);

	const handleFlowVariantChange = useCallback(
		(nextVariant: 'oauth' | 'oidc') => {
			// Preserve current PKCE codes and auth state
			const currentPkceCodes = controller.pkceCodes;

			setFlowVariant(nextVariant);
			controller.setFlowVariant(nextVariant);

			// Reload variant-specific credentials from standardized storage
			FlowCredentialService.loadSharedCredentials(`oauth-authorization-code-v7-${nextVariant}`)
				.then((reloadedCredentials) => {
					if (reloadedCredentials && Object.keys(reloadedCredentials).length > 0) {
						console.log(
							`[V7 AuthZ] Loading saved ${nextVariant.toUpperCase()} credentials:`,
							reloadedCredentials
						);
						controller.setCredentials({
							...controller.credentials,
							...reloadedCredentials,
						});
					}
				})
				.catch((error) => {
					console.warn('[V7 AuthZ] Failed to load shared credentials:', error);
				});

			// PingOne requires openid scope for both OAuth and OIDC variants
			const updatedScope = ensureOidcScopes(
				controller.credentials.scope || controller.credentials.scopes
			);
			controller.setCredentials({
				...controller.credentials,
				scope: updatedScope,
				scopes: updatedScope,
			});

			if (nextVariant === 'oidc') {
				controller.setFlowConfig({
					...controller.flowConfig,
					enableOIDC: true,
				});
			} else {
				controller.setFlowConfig({
					...controller.flowConfig,
					enableOIDC: false,
				});
			}

			// Restore PKCE codes and auth state to prevent mismatch errors
			if (currentPkceCodes.codeVerifier && currentPkceCodes.codeChallenge) {
				console.log(`[V7 AuthZ] Preserving PKCE codes during variant switch`);
				controller.setPkceCodes(currentPkceCodes);
			}

			// Show success message
			v4ToastManager.showSuccess(`Switched to ${nextVariant.toUpperCase()} variant`);
		},
		[controller, ensureOidcScopes]
	);

	// V7 Variant Selector Component
	const renderVariantSelector = () => (
		<VariantSelector>
			<VariantButton
				$selected={flowVariant === 'oauth'}
				onClick={() => handleFlowVariantChange('oauth')}
			>
				<VariantTitle>OAuth 2.0 Authorization Code</VariantTitle>
				<VariantDescription>Access token only - API authorization</VariantDescription>
			</VariantButton>
			<VariantButton
				$selected={flowVariant === 'oidc'}
				onClick={() => handleFlowVariantChange('oidc')}
			>
				<VariantTitle>OpenID Connect Authorization Code</VariantTitle>
				<VariantDescription>
					ID token + Access token - Authentication + Authorization
				</VariantDescription>
			</VariantButton>
		</VariantSelector>
	);

	// API call tracking for display
	const [tokenExchangeApiCall, setTokenExchangeApiCall] = useState<EnhancedApiCallData | null>(
		null
	);
	const [userInfoApiCall, setUserInfoApiCall] = useState<EnhancedApiCallData | null>(null);
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);

	// Advanced OAuth parameters
	const [audience, setAudience] = useState<string>('');
	const [resources, setResources] = useState<string[]>([]);
	const [promptValues, setPromptValues] = useState<string[]>([]);
	const [_isSavedAdvancedParams, setIsSavedAdvancedParams] = useState(false);

	// Load saved advanced parameters on mount
	useEffect(() => {
		const flowId = FlowStorageService.getFlowId('oauth-authorization-code-v7') ?? 'oauth-authz-v7';
		const saved = FlowStorageService.AdvancedParameters.get(flowId);
		if (saved) {
			console.log('[OAuth AuthZ V7] Loading saved advanced parameters:', saved);
			setAudience(saved.audience || '');
			setResources(saved.resources || []);
			setPromptValues(saved.promptValues || []);
		}
	}, []); // Only run once on mount

	// Ensure PKCE codes are properly restored on mount to prevent mismatch errors
	useEffect(() => {
		const pkceKey = `${controller.persistKey}-pkce-codes`;
		const storedPkce = sessionStorage.getItem(pkceKey);
		if (storedPkce && (!controller.pkceCodes.codeVerifier || !controller.pkceCodes.codeChallenge)) {
			try {
				const parsedPkce = JSON.parse(storedPkce);
				if (parsedPkce.codeVerifier && parsedPkce.codeChallenge) {
					console.log('[V7 AuthZ] Restoring PKCE codes from session storage');
					controller.setPkceCodes(parsedPkce);
				}
			} catch (error) {
				console.warn('[V7 AuthZ] Failed to parse stored PKCE codes:', error);
			}
		}
	}, [controller.persistKey, controller.pkceCodes, controller.setPkceCodes]);

	// Update flow config when advanced parameters change
	useEffect(() => {
		if (audience || promptValues.length > 0) {
			console.log('[OAuth AuthZ V6] Updating flow config with advanced parameters:', {
				audience,
				promptValues,
			});
			// Note: Resources are not sent for PingOne flows as they're not reliably supported
			controller.setFlowConfig({
				...controller.flowConfig,
				audience,
				prompt: promptValues.join(' '),
			});
		}
	}, [
		audience,
		promptValues,
		controller.flowConfig, // Note: Resources are not sent for PingOne flows as they're not reliably supported
		controller.setFlowConfig,
	]);

	// Save advanced parameters
	const _handleSaveAdvancedParams = useCallback(async () => {
		console.log('💾 [OAuth AuthZ V6] Saving advanced parameters:', {
			audience,
			resources,
			promptValues,
		});

		const flowId = FlowStorageService.getFlowId('oauth-authorization-code-v7') ?? 'oauth-authz-v7';
		FlowStorageService.AdvancedParameters.set(flowId, {
			audience,
			resources,
			promptValues,
		});
		setIsSavedAdvancedParams(true);
		v4ToastManager.showSuccess('Advanced parameters saved! Regenerating authorization URL...');

		// Regenerate authorization URL with new parameters
		await AuthorizationCodeSharedService.Authorization.generateAuthUrl(
			flowVariant,
			controller.credentials,
			controller
		);

		// Log what will actually be sent to PingOne
		if (controller.authUrl) {
			const urlParams = new URLSearchParams(controller.authUrl.split('?')[1] || '');
			const claimsParam = urlParams.get('claims');
			console.log('🌐 [OAuth AuthZ V6] ===== URL THAT WILL BE SENT TO PINGONE =====');
			console.log('🌐 Full URL:', controller.authUrl);
			console.log('🌐 Audience:', urlParams.get('audience') || 'Not included');
			console.log('🌐 Prompt:', urlParams.get('prompt') || 'Not included');
			console.log('🌐 Claims (raw):', claimsParam || 'Not included');
			if (claimsParam) {
				try {
					console.log('🌐 Claims (decoded):', JSON.parse(claimsParam));
				} catch (e) {
					console.log('🌐 Claims (decode failed):', e);
				}
			}
			console.log('🌐 Resources:', 'Not included (PingOne does not support RFC 8707)');
			console.log('🌐 =============================================');
		}

		// Hide the saved indicator after 3 seconds
		setTimeout(() => {
			setIsSavedAdvancedParams(false);
		}, 3000);
	}, [audience, resources, promptValues, controller, flowVariant]);

	// Scroll to top on step change
	useEffect(() => {
		AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange();
	}, []);

	// Response type selector state
	const [selectedResponseType, setSelectedResponseType] = useState<string>('code id_token');

	// Update controller credentials when response type changes
	useEffect(() => {
		controller.setCredentials({
			...controller.credentials,
			responseType: selectedResponseType,
		});
	}, [selectedResponseType, controller]);

	// Load PingOne configuration from sessionStorage on mount
	useEffect(() => {
		const stored = sessionStorage.getItem('oauth-authorization-code-v7-app-config');
		if (stored) {
			try {
				const config = JSON.parse(stored);
				setPingOneConfig(config);
				// Also update controller credentials with stored config
				const updatedCredentials = {
					...controller.credentials,
					responseTypeCode: config.responseTypeCode,
					responseTypeToken: config.responseTypeToken,
					responseTypeIdToken: config.responseTypeIdToken,
					initiateLoginUri: config.initiateLoginUri,
					targetLinkUri: config.targetLinkUri,
					signoffUrls: config.signoffUrls,
					requestParameterSignatureRequirement: config.requestParameterSignatureRequirement,
					additionalRefreshTokenReplayProtection: config.additionalRefreshTokenReplayProtection,
					includeX5tParameter: config.includeX5tParameter,
					oidcSessionManagement: config.oidcSessionManagement,
					requestScopesForMultipleResources: config.requestScopesForMultipleResources,
					terminateUserSessionByIdToken: config.terminateUserSessionByIdToken,
					corsOrigins: config.corsOrigins,
					corsAllowAnyOrigin: config.corsAllowAnyOrigin,
				};
				controller.setCredentials(updatedCredentials);
			} catch (error) {
				console.warn('[AuthorizationCodeFlowV5] Failed to parse stored PingOne config:', error);
			}
		}
	}, [controller.credentials, controller.setCredentials]); // Only run once on mount

	// Debug: Always log the current authorization code state
	console.log('🔍 [AuthorizationCodeFlowV5] Current controller.authCode:', {
		hasAuthCode: !!controller.authCode,
		authCodeLength: controller.authCode?.length || 0,
		authCodePreview: controller.authCode ? `${controller.authCode.substring(0, 10)}...` : 'Not set',
		currentStep,
		urlParams: window.location.search,
		localAuthCode: localAuthCode ? `${localAuthCode.substring(0, 10)}...` : 'Not set',
	});

	// Initialize current step and handle OAuth callback - runs only once on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const authCode = urlParams.get('code');
		const error = urlParams.get('error');
		const urlStep = urlParams.get('step');
		const storedStep = sessionStorage.getItem('oauth-authorization-code-v7-current-step');

		// Also check sessionStorage for auth code (from OAuth callback)
		const sessionAuthCode = sessionStorage.getItem('oauth_auth_code');

		console.log('🚀 [AuthorizationCodeFlowV5] Initialization check:', {
			hasCode: !!authCode,
			hasError: !!error,
			hasUrlStep: !!urlStep,
			hasStoredStep: !!storedStep,
			hasSessionAuthCode: !!sessionAuthCode,
			code: authCode ? `${authCode.substring(0, 10)}...` : 'none',
			error: error || 'none',
		});

		// Handle OAuth errors first
		if (error) {
			console.error('[AuthorizationCodeFlowV5] OAuth error in URL:', error);
			v4ToastManager.showError(`OAuth Error: ${error}`);
			// Clear URL parameters and reset to step 0
			window.history.replaceState({}, '', window.location.pathname);
			setCurrentStep(0);
			sessionStorage.setItem('oauth-authorization-code-v7-current-step', '0');
			return;
		}

		// Handle OAuth callback with authorization code - PRIORITY 1
		const finalAuthCode = authCode || sessionAuthCode;
		if (finalAuthCode) {
			console.log('🎉 [AuthorizationCodeFlowV5] Authorization code found!', {
				source: authCode ? 'URL' : 'sessionStorage',
				code: `${finalAuthCode.substring(0, 10)}...`,
			});
			setLocalAuthCode(finalAuthCode);
			// Also set it in the controller
			controller.setAuthCodeManually(finalAuthCode);
			// Show success modal
			console.log('🟢 [AuthorizationCodeFlowV5] Opening LoginSuccessModal');
			setShowLoginSuccessModal(true);
			v4ToastManager.showSuccess('Login Successful! You have been authenticated with PingOne.');
			// Navigate to step 4 and persist it
			setCurrentStep(4);
			sessionStorage.setItem('oauth-authorization-code-v7-current-step', '4');
			// Clear URL parameters and sessionStorage
			window.history.replaceState({}, '', window.location.pathname);
			sessionStorage.removeItem('oauth_auth_code');
			return;
		}

		// Handle URL step parameter - PRIORITY 2
		if (urlStep) {
			const stepIndex = parseInt(urlStep, 10);
			if (!Number.isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
				console.log('🎯 [AuthorizationCodeFlowV5] Using URL step parameter:', stepIndex);
				setCurrentStep(stepIndex);
				sessionStorage.setItem('oauth-authorization-code-v7-current-step', stepIndex.toString());
				return;
			}
		}

		// Handle stored step - PRIORITY 3
		if (storedStep) {
			const stepIndex = parseInt(storedStep, 10);
			if (!Number.isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
				console.log('🎯 [AuthorizationCodeFlowV5] Using stored step:', stepIndex);
				setCurrentStep(stepIndex);
				return;
			}
		}

		// Default to step 0 for fresh start - PRIORITY 4
		console.log('🔄 [AuthorizationCodeFlowV5] Fresh start - going to step 0');
		setCurrentStep(0);
		sessionStorage.setItem('oauth-authorization-code-v7-current-step', '0');
	}, [
		// Also set it in the controller
		controller.setAuthCodeManually,
	]); // Run only once on mount

	// Persist current step to session storage
	useEffect(() => {
		sessionStorage.setItem('oauth-authorization-code-v7-current-step', currentStep.toString());
	}, [currentStep]);

	// Additional auth code detection for controller updates (backup)
	useEffect(() => {
		// If we just received an auth code from the controller and haven't shown the modal yet
		if (controller.authCode && !showLoginSuccessModal && !localAuthCode) {
			console.log(
				'[AuthorizationCodeFlowV5] Auth code detected from controller:',
				`${controller.authCode.substring(0, 10)}...`
			);

			// Show success modal and toast
			setShowLoginSuccessModal(true);
			v4ToastManager.showSuccess('Login Successful! You have been authenticated with PingOne.');

			// Navigate to the next step (Token Exchange) and persist it
			setCurrentStep(4); // Step 4 is Token Exchange
			sessionStorage.setItem('oauth-authorization-code-v7-current-step', '4');
		}
	}, [controller.authCode, showLoginSuccessModal, localAuthCode]);

	// This effect is redundant - removing to prevent conflicts
	// The auth code detection is already handled in the other useEffect

	// Get flow sequence for Step 0 diagram (if needed)
	// const flowSequence = useMemo(() => {
	// 	return getFlowSequence('authorization-code');
	// }, []);

	const _stepCompletions = useMemo<StepCompletionState>(
		() => ({
			0: controller.hasStepResult('setup-credentials') || controller.hasCredentialsSaved,
			1: controller.hasStepResult('generate-pkce') || Boolean(controller.pkceCodes.codeVerifier),
			2: controller.hasStepResult('build-auth-url') || Boolean(controller.authUrl),
			3: controller.hasStepResult('handle-callback') || Boolean(controller.authCode),
			4: controller.hasStepResult('exchange-tokens') || Boolean(controller.tokens),
			5: controller.hasStepResult('validate-tokens') || Boolean(controller.userInfo),
			6: Boolean(controller.tokens?.access_token), // Token introspection available
			7:
				controller.hasStepResult('refresh-token-exchange') ||
				Boolean(controller.tokens && controller.userInfo),
		}),
		[
			controller.authCode,
			controller.authUrl,
			controller.hasCredentialsSaved,
			controller.hasStepResult,
			controller.pkceCodes.codeVerifier,
			controller.tokens,
			controller.userInfo,
		]
	);

	const toggleSection =
		AuthorizationCodeSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections);

	const handleFieldChange = useCallback(
		(field: keyof StepCredentials, value: string) => {
			const updatedCredentials = {
				...controller.credentials,
				[field]: value,
			};
			controller.setCredentials(updatedCredentials);
			// Save credentials with variant-specific key for better isolation
			FlowCredentialService.saveSharedCredentials(
				`oauth-authorization-code-v7-${flowVariant}`,
				updatedCredentials
			);
			// Also save to the main key for backward compatibility
			FlowCredentialService.saveSharedCredentials(
				'oauth-authorization-code-v7',
				updatedCredentials
			);
			if (typeof value === 'string' && value.trim()) {
				setEmptyRequiredFields((prevMissing) => {
					const next = new Set(prevMissing);
					next.delete(field as string);
					return next;
				});
			} else {
				setEmptyRequiredFields((prevMissing) => new Set(prevMissing).add(field as string));
			}
		},
		[controller, flowVariant]
	);

	const handleSaveConfiguration = useCallback(async () => {
		console.log('🔧 [handleSaveConfiguration] Starting save process...');
		console.log('🔧 [handleSaveConfiguration] Current credentials:', controller.credentials);

		const required: Array<keyof StepCredentials> = [
			'environmentId',
			'clientId',
			'clientSecret',
			'redirectUri',
		];
		const missing = required.filter((field) => {
			const value = controller.credentials[field];
			return !value || (typeof value === 'string' && !value.trim());
		});

		console.log('🔧 [handleSaveConfiguration] Missing fields:', missing);

		if (missing.length > 0) {
			setEmptyRequiredFields(new Set(missing.map((field) => field as string)));
			v4ToastManager.showError(
				'Missing required fields: Complete all required fields before saving.'
			);
			return;
		}

		try {
			console.log('🔧 [handleSaveConfiguration] Calling controller.saveCredentials()...');
			await controller.saveCredentials();
			console.log('🔧 [handleSaveConfiguration] Save completed successfully');
			v4ToastManager.showSuccess('Configuration saved successfully!');
		} catch (error) {
			console.error('🔧 [handleSaveConfiguration] Save failed:', error);
			v4ToastManager.showError('Failed to save configuration. Please try again.');
		}
	}, [controller]);

	const handleClearConfiguration = useCallback(() => {
		controller.setCredentials({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: 'https://localhost:3002/authz-callback',
			scope: 'openid profile email',
			responseType: 'code',
			grantType: 'authorization_code',
			clientAuthMethod: 'client_secret_post',
		});
		setEmptyRequiredFields(new Set(['environmentId', 'clientId', 'clientSecret', 'redirectUri']));
		sessionStorage.removeItem('oauth-authorization-code-v7-app-config');
		v4ToastManager.showSuccess('Configuration cleared. Enter PingOne credentials to continue.');
	}, [controller]);

	const savePingOneConfig = useCallback(
		(config: PingOneApplicationState) => {
			setPingOneConfig(config);
			sessionStorage.setItem('oauth-authorization-code-v7-app-config', JSON.stringify(config));

			// Update controller credentials with PingOne configuration
			const updatedCredentials = {
				...controller.credentials,
				// Client Authentication
				clientAuthMethod: config.clientAuthMethod,
				// JWT Authentication Settings
				privateKey: config.privateKey || '',
				keyId: config.keyId || '',
				// Response Types
				responseTypeCode: config.responseTypeCode,
				responseTypeToken: config.responseTypeToken,
				responseTypeIdToken: config.responseTypeIdToken,
				// Advanced OIDC Parameters
				initiateLoginUri: config.initiateLoginUri,
				targetLinkUri: config.targetLinkUri,
				signoffUrls: config.signoffUrls,
				// Request Parameter Signature
				requestParameterSignatureRequirement: config.requestParameterSignatureRequirement,
				// Advanced Security Settings
				additionalRefreshTokenReplayProtection: config.additionalRefreshTokenReplayProtection,
				includeX5tParameter: config.includeX5tParameter,
				oidcSessionManagement: config.oidcSessionManagement,
				requestScopesForMultipleResources: config.requestScopesForMultipleResources,
				terminateUserSessionByIdToken: config.terminateUserSessionByIdToken,
				// CORS Settings
				corsOrigins: config.corsOrigins,
				corsAllowAnyOrigin: config.corsAllowAnyOrigin,
			};
			controller.setCredentials(updatedCredentials);
		},
		[controller]
	);

	const _handleGeneratePkce = useCallback(async () => {
		console.log('[OAuth AuthZ V6] Generating PKCE codes...', {
			clientId: controller.credentials.clientId,
			environmentId: controller.credentials.environmentId,
			flowKey: 'oauth-authorization-code-v7',
		});

		const success = await AuthorizationCodeSharedService.PKCE.generatePKCE(
			'oauth',
			controller.credentials,
			controller
		);

		console.log('[OAuth AuthZ V6] PKCE generation result:', success);

		if (success) {
			console.log('[OAuth AuthZ V7] PKCE codes after generation:', {
				codeVerifier: controller.pkceCodes.codeVerifier
					? `${controller.pkceCodes.codeVerifier.substring(0, 10)}...`
					: 'none',
				codeChallenge: controller.pkceCodes.codeChallenge
					? `${controller.pkceCodes.codeChallenge.substring(0, 10)}...`
					: 'none',
				persistKey: controller.persistKey,
				flowVariant: flowVariant,
			});
		}
	}, [controller, flowVariant]);

	const handleGenerateAuthUrl = useCallback(async () => {
		await AuthorizationCodeSharedService.Authorization.generateAuthUrl(
			flowVariant,
			controller.credentials,
			controller
		);
	}, [controller, flowVariant]);

	const handleOpenAuthUrl = useCallback(() => {
		if (AuthorizationCodeSharedService.Authorization.openAuthUrl(controller.authUrl)) {
			console.log('🔧 [AuthorizationCodeFlowV5] Opening authentication modal...');
			setShowRedirectModal(true);
			// Modal will handle its own countdown and closing
		}
	}, [controller]);

	const handleExchangeTokens = useCallback(async () => {
		const authCode = controller.authCode || localAuthCode;
		if (!authCode) {
			v4ToastManager.showError(
				'Complete above action: Authorize the application first to get authorization code.'
			);
			return;
		}

		// If we have a local auth code but not in controller, set it first
		if (localAuthCode && !controller.authCode) {
			controller.setAuthCodeManually(localAuthCode);
		}

		// Create API call display for token exchange
		const tokenExchangeApiCallData: EnhancedApiCallData = {
			flowType: 'authorization-code',
			stepName: 'Exchange Authorization Code for Tokens',
			url: '/api/token-exchange',
			method: 'POST' as const,
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: {
				grant_type: 'authorization_code',
				code: authCode,
				redirect_uri: controller.credentials.redirectUri,
				client_id: controller.credentials.clientId,
				environment_id: controller.credentials.environmentId,
				code_verifier: controller.pkceCodes.codeVerifier,
				client_auth_method: controller.credentials.clientAuthMethod || 'client_secret_post',
				client_secret: '***REDACTED***',
				...(controller.credentials.includeX5tParameter && {
					includeX5tParameter: controller.credentials.includeX5tParameter,
				}),
			},
			timestamp: new Date(),
			description: 'Exchange authorization code for access token and refresh token',
		};

		try {
			await controller.exchangeTokens();

			// Update API call with success response
			const updatedTokenExchangeApiCall: EnhancedApiCallData = {
				...tokenExchangeApiCallData,
				response: {
					status: 200,
					statusText: 'OK',
					headers: { 'Content-Type': 'application/json' },
					data: controller.tokens,
				},
			};

			setTokenExchangeApiCall(updatedTokenExchangeApiCall);
			v4ToastManager.showSuccess('Tokens exchanged successfully!');
		} catch (error) {
			console.error('[AuthorizationCodeFlowV5] Token exchange failed:', error);

			// Update API call with error response
			const errorApiCall: EnhancedApiCallData = {
				...tokenExchangeApiCallData,
				response: {
					status: 400,
					statusText: 'Bad Request',
					headers: { 'Content-Type': 'application/json' },
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			};

			setTokenExchangeApiCall(errorApiCall);

			// Parse error message for better user feedback
			let errorMessage = 'Token exchange failed. Please try again.';

			if (error instanceof Error) {
				const errorText = error.message.toLowerCase();
				if (errorText.includes('invalid_client')) {
					errorMessage =
						'Invalid client credentials. Please check your Client ID and Client Secret.';
				} else if (errorText.includes('invalid_grant')) {
					errorMessage = 'Invalid authorization code. Please restart the flow.';
				} else if (errorText.includes('unauthorized_client')) {
					errorMessage =
						'Client not authorized for this grant type. Check your PingOne application configuration.';
				} else if (errorText.includes('unsupported_grant_type')) {
					errorMessage = 'Grant type not supported. Check your PingOne application configuration.';
				} else if (errorText.includes('invalid_scope')) {
					errorMessage = 'Invalid scope requested. Check your PingOne application scopes.';
				} else {
					// Try to extract more specific error from the message
					errorMessage = error.message;
				}
			}

			v4ToastManager.showError(errorMessage);
		}
	}, [controller, localAuthCode]);

	const handleFetchUserInfo = useCallback(async () => {
		if (!controller.tokens?.access_token) {
			v4ToastManager.showError('Access token missing: Exchange tokens before fetching user info.');
			return;
		}

		// Check if user has appropriate scopes for user info
		const currentScopes = controller.credentials.scopes || controller.credentials.scope || '';
		const hasProfileScope = currentScopes.includes('profile') || currentScopes.includes('openid');

		if (!hasProfileScope) {
			v4ToastManager.showWarning(
				'For user info to work, include "profile" scope in your configuration. Current scopes: ' +
					currentScopes
			);
		}

		// Create API call display for UserInfo request
		const userInfoApiCallData: EnhancedApiCallData = {
			flowType: 'authorization-code',
			stepName: 'Fetch User Information',
			url:
				controller.credentials.userInfoEndpoint ||
				`https://auth.pingone.com/${controller.credentials.environmentId}/as/userinfo`,
			method: 'GET' as const,
			headers: {
				Authorization: `Bearer ${controller.tokens.access_token}`,
				Accept: 'application/json',
			},
			body: null,
			timestamp: new Date(),
			description: 'Fetch user information using the access token',
		};

		try {
			await controller.fetchUserInfo();

			// Update API call with success response
			const updatedUserInfoApiCall: EnhancedApiCallData = {
				...userInfoApiCallData,
				response: {
					status: 200,
					statusText: 'OK',
					headers: { 'Content-Type': 'application/json' },
					data: controller.userInfo,
				},
			};

			setUserInfoApiCall(updatedUserInfoApiCall);
			v4ToastManager.showSuccess('User info fetched successfully!');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			let userFriendlyMessage = 'Failed to fetch user info';

			if (errorMessage.includes('401')) {
				userFriendlyMessage =
					'Access token expired or invalid. Try refreshing the token or re-running the flow.';
			} else if (errorMessage.includes('403')) {
				userFriendlyMessage =
					'Access token lacks required scopes. Ensure "profile" or "openid" scope is included.';
			} else if (errorMessage.includes('404')) {
				userFriendlyMessage =
					'User info endpoint not found. Check your Environment ID configuration.';
			}

			// Update API call with error response
			const errorApiCall: EnhancedApiCallData = {
				...userInfoApiCallData,
				response: {
					status: 401,
					statusText: 'Unauthorized',
					headers: { 'Content-Type': 'application/json' },
					error: errorMessage,
				},
			};

			setUserInfoApiCall(errorApiCall);
			v4ToastManager.showError(userFriendlyMessage);
		}
	}, [controller]);

	const _handleCopy = useCallback((text: string, label: string) => {
		v4ToastManager.handleCopyOperation(text, label);
		setCopiedField(label);
		setTimeout(() => setCopiedField(null), 1000);
	}, []);

	// Extract x5t parameter from JWT header
	const _getX5tParameter = useCallback((token: string) => {
		try {
			const header = decodeJWTHeader(token);
			return header.x5t || header['x5t#S256'] || null;
		} catch (error) {
			console.warn('[AuthorizationCodeFlowV5] Failed to decode JWT header for x5t:', error);
			return null;
		}
	}, []);

	const navigateToTokenManagement = useCallback(() => {
		AuthorizationCodeSharedService.TokenManagement.navigateToTokenManagement(
			'oauth',
			controller.tokens,
			controller.credentials,
			currentStep
		);

		// Additional component-specific logic for access token
		if (controller.tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', controller.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'oauth-authorization-code-v7');
			console.log(
				'🔍 [AuthorizationCodeFlowV5] Passing access token to Token Management via localStorage'
			);
		}

		// Store flow navigation state for back navigation
		storeFlowNavigationState('oauth-authorization-code-v7', currentStep, 'oauth');

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials, currentStep]);

	const _navigateToTokenManagementWithRefreshToken = useCallback(() => {
		AuthorizationCodeSharedService.TokenManagement.navigateToTokenManagement(
			'oauth',
			controller.tokens,
			controller.credentials,
			currentStep
		);

		// Additional component-specific logic for refresh token
		if (controller.tokens?.refresh_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', controller.tokens.refresh_token);
			localStorage.setItem('token_type', 'refresh');
			localStorage.setItem('flow_source', 'oauth-authorization-code-v7');
			console.log(
				'🔍 [AuthorizationCodeFlowV5] Passing refresh token to Token Management via localStorage'
			);
		}

		// Store flow navigation state for back navigation
		storeFlowNavigationState('oauth-authorization-code-v7', currentStep, 'oauth');

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials, currentStep]);

	const handleResetFlow = useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
	}, [controller]);

	const handleIntrospectToken = useCallback(
		async (token: string) => {
			// Wait 500ms for PingOne to register token
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Use credentials from the controller (same as the flow uses for token exchange)
			const credentials = controller.credentials;

			console.log('🔍 [V5 Flow] Using flow credentials for introspection:', {
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
			});

			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				const missing = [];
				if (!credentials.environmentId) missing.push('Environment ID');
				if (!credentials.clientId) missing.push('Client ID');
				if (!credentials.clientSecret) missing.push('Client Secret');

				throw new Error(
					`Missing required credentials for token introspection: ${missing.join(', ')}. Please configure all credentials in the Configuration & Setup section.`
				);
			}

			const request = {
				token: token,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				tokenTypeHint: 'access_token' as const,
			};

			try {
				// Use the reusable service to create API call data and execute introspection
				const result = await TokenIntrospectionService.introspectToken(
					request,
					'authorization-code',
					'/api/introspect-token',
					`https://auth.pingone.com/${credentials.environmentId}/as/introspect`,
					'client_secret_post'
				);

				// Set the API call data for display
				setIntrospectionApiCall(result.apiCall);

				return result.response;
			} catch (error) {
				// Create error API call using reusable service
				const errorApiCall = TokenIntrospectionService.createErrorApiCall(
					request,
					'authorization-code',
					error instanceof Error ? error.message : 'Unknown error',
					500,
					'/api/introspect-token'
				);

				setIntrospectionApiCall(errorApiCall);
				throw error;
			}
		},
		[controller.credentials]
	);

	// Step validation functions
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			// Enhanced validation - checks both controller state and session storage for PKCE codes
			const hasPkceCodes =
				!!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) ||
				!!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`);

			switch (stepIndex) {
				case 0: // Step 0: Introduction & Setup
					return true; // Always valid - introduction step
				case 1: // Step 1: PKCE Parameters
					return hasPkceCodes;
				case 2: // Step 2: Authorization Request
					return !!(controller.authUrl && hasPkceCodes);
				case 3: // Step 3: Authorization Response
					return !!(controller.authCode || localAuthCode);
				case 4: // Step 4: Token Exchange
					return !!controller.tokens?.access_token;
				case 5: // Step 5: Token Introspection
					return !!controller.tokens?.access_token;
				case 6: // Step 6: Flow Complete
					return true; // Always valid - completion step
				case 7: // Step 7: Security Features
					return true; // Always valid - demonstration step
				default:
					return false;
			}
		},
		[
			controller.pkceCodes,
			controller.authUrl,
			controller.authCode,
			localAuthCode,
			controller.tokens,
			controller.persistKey,
		]
	);

	// Get step completion requirements for user guidance
	const getStepRequirements = useCallback((stepIndex: number): string[] => {
		switch (stepIndex) {
			case 0: // Step 0: Introduction & Setup
				return ['Review the flow overview and setup credentials'];
			case 1: // Step 1: PKCE Parameters
				return ['Generate PKCE code verifier and code challenge'];
			case 2: // Step 2: Authorization Request
				return ['Generate authorization URL with PKCE parameters'];
			case 3: // Step 3: Authorization Response
				return ['Receive authorization code from PingOne callback'];
			case 4: // Step 4: Token Exchange
				return ['Exchange authorization code for access and refresh tokens'];
			case 5: // Step 5: Token Introspection
				return ['Introspect access token to validate and inspect claims'];
			case 6: // Step 6: Flow Complete
				return ['Flow completed successfully'];
			case 7: // Step 7: Security Features
				return ['Demonstrate advanced security implementations'];
			default:
				return [];
		}
	}, []);

	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	const handleNext = useCallback(() => {
		console.log('🔍 [OAuth AuthZ V6] handleNext called:', {
			currentStep,
			canNavigate: canNavigateNext(),
			isStepValid: isStepValid(currentStep),
			pkceCodes: {
				hasCodeVerifier: !!controller.pkceCodes.codeVerifier,
				hasCodeChallenge: !!controller.pkceCodes.codeChallenge,
			},
			authUrl: !!controller.authUrl,
			authCode: !!(controller.authCode || localAuthCode),
		});

		// Use service navigation manager for proper validation
		AuthorizationCodeSharedService.Navigation.handleNext(
			currentStep,
			controller.credentials,
			'oauth',
			controller,
			isStepValid,
			() => {
				console.log('✅ [OAuth AuthZ V6] Navigation allowed, moving to next step');
				const next = currentStep + 1;
				setCurrentStep(next);
			}
		);
	}, [
		currentStep,
		canNavigateNext,
		isStepValid,
		controller.pkceCodes,
		controller.authUrl,
		controller.authCode,
		localAuthCode,
		controller.credentials,
		controller,
	]);

	const handlePrev = useCallback(() => {
		if (currentStep <= 0) {
			return;
		}
		const previous = currentStep - 1;
		setCurrentStep(previous);
	}, [currentStep]);

	// Handle next button click with feedback even when disabled
	const handleNextClick = useCallback(() => {
		console.log('🔍 [AuthorizationCodeFlowV5] Next button clicked');

		if (!canNavigateNext()) {
			v4ToastManager.showError(`Complete the action above to continue.`);
			return;
		}

		handleNext();
	}, [canNavigateNext, handleNext]);

	// Determine if tokens should be displayed (only show if they were exchanged for the current auth code)
	const _shouldDisplayTokens = useMemo(() => {
		// Don't show tokens if we don't have any
		if (!controller.tokens?.access_token) {
			return false;
		}

		// Don't show tokens if we have an auth code but haven't exchanged it yet
		// (This prevents showing stale tokens from a previous run)
		if (controller.authCode || localAuthCode) {
			// Check if the token exchange step result exists for this session
			const hasExchangedThisSession = controller.hasStepResult('exchange-tokens');
			return hasExchangedThisSession;
		}

		// If no auth code, we can show tokens (user might be on a later step)
		return true;
	}, [controller.tokens, controller.authCode, localAuthCode, controller.hasStepResult]);

	const renderStepContent = useMemo(() => {
		const credentials = controller.credentials;
		const authCode = controller.authCode;
		const userInfo = controller.userInfo;
		const isFetchingUserInfo = controller.isFetchingUserInfo;

		switch (currentStep) {
			case 0:
				return (
					<>
						{/* CONDENSED V7: Quick Start & Overview - Collapsible */}

						{/* 1. QUICK START & OVERVIEW - Collapsible */}
						<CollapsibleHeader
							title={`Quick Start & Overview - ${flowVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Authorization Code`}
							subtitle="Learn the fundamentals of this flow"
							defaultCollapsed={false}
							icon={<FiBook />}
							theme="green"
						>
							<div style={{ padding: '0' }}>
								{/* Compact Overview */}
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
										gap: '1rem',
										marginBottom: '1.5rem',
									}}
								>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>What You'll Get</InfoTitle>
											<InfoText>
												{flowVariant === 'oidc'
													? '🎯 User authentication + API authorization with ID token and access token'
													: '🔑 API authorization with access token (PingOne requires openid scope)'}
											</InfoText>
										</div>
									</InfoBox>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Perfect For</InfoTitle>
											<InfoText>
												• Web apps with secure backends
												<br />• SPAs using PKCE
												<br />• Apps needing refresh tokens
											</InfoText>
										</div>
									</InfoBox>
								</div>

								{/* Requirements Notice */}
								<InfoBox $variant="warning" style={{ marginBottom: '1.5rem' }}>
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>⚠️ Required for Full Functionality</InfoTitle>
										<InfoText>
											<strong>Client Secret:</strong> Required for token introspection and refresh
											<br />
											<strong>Scopes:</strong> Include "profile" scope for user info endpoint
											<br />
											<strong>Environment ID:</strong> Must match your PingOne environment
										</InfoText>
									</div>
								</InfoBox>

								{/* Compact Comparison */}
								<GeneratedContentBox>
									<GeneratedLabel>OAuth vs OIDC - Key Differences</GeneratedLabel>
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
											gap: '1rem',
										}}
									>
										<div
											style={{
												padding: '1rem',
												border: `2px solid ${flowVariant === 'oauth' ? '#3b82f6' : '#e2e8f0'}`,
												borderRadius: '0.5rem',
												background: flowVariant === 'oauth' ? '#eff6ff' : 'white',
											}}
										>
											<h4>OAuth 2.0 Mode</h4>
											<p>
												<strong>Tokens:</strong> Access + Refresh
											</p>
											<p>
												<strong>Purpose:</strong> API access only
											</p>
											<p>
												<strong>PingOne:</strong> Requires openid scope
											</p>
										</div>
										<div
											style={{
												padding: '1rem',
												border: `2px solid ${flowVariant === 'oidc' ? '#3b82f6' : '#e2e8f0'}`,
												borderRadius: '0.5rem',
												background: flowVariant === 'oidc' ? '#eff6ff' : 'white',
											}}
										>
											<h4>OpenID Connect Mode</h4>
											<p>
												<strong>Tokens:</strong> Access + ID + Refresh
											</p>
											<p>
												<strong>Purpose:</strong> Authentication + API access
											</p>
											<p>
												<strong>Standard:</strong> Requires openid scope
											</p>
										</div>
									</div>
								</GeneratedContentBox>
							</div>
						</CollapsibleHeader>

						{/* 2. CONFIGURATION & SETUP - Collapsible */}
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('configuration')}
								aria-expanded={!collapsedSections.configuration}
								style={{ background: '#3b82f6', color: 'white' }}
							>
								<CollapsibleTitle>
									<FiSettings />
									<span style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
										🔧 Configuration & Setup - All Settings in One Place
									</span>
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.configuration}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.configuration && (
								<CollapsibleContent>
									<ComprehensiveCredentialsService
										// Discovery props
										onDiscoveryComplete={(result) => {
											console.log('[OAuth Authz V6] Discovery completed:', result);
											if (result.issuerUrl) {
												const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(
													result.issuerUrl
												);
												if (extractedEnvId) {
													handleFieldChange('environmentId', extractedEnvId);
													console.log(
														'[OAuth Authz V6] Auto-extracted Environment ID:',
														extractedEnvId
													);
												}
											}
										}}
										discoveryPlaceholder="Enter Environment ID, issuer URL, or provider..."
										showProviderInfo={true}
										// Credentials props
										environmentId={credentials.environmentId || ''}
										clientId={credentials.clientId || ''}
										clientSecret={credentials.clientSecret || ''}
										redirectUri={credentials.redirectUri || 'https://localhost:3002/authz-callback'}
										scopes={credentials.scopes || credentials.scope || ''}
										loginHint={credentials.loginHint || ''}
										postLogoutRedirectUri={
											credentials.postLogoutRedirectUri || 'https://localhost:3002/logout-callback'
										}
										// Change handlers
										onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
										onClientIdChange={(value) => handleFieldChange('clientId', value)}
										onClientSecretChange={(value) => handleFieldChange('clientSecret', value)}
										onRedirectUriChange={(value) => handleFieldChange('redirectUri', value)}
										onScopesChange={(value) => {
											// Convert comma-separated to space-separated if needed
											let normalizedValue = value;
											if (value.includes(',') && !value.includes(' ')) {
												// Convert comma-separated to space-separated
												normalizedValue = value
													.split(',')
													.map((s) => s.trim())
													.join(' ');
											}

											// Ensure openid is always included (PingOne requirement)
											const scopes = normalizedValue.split(/\s+/).filter((s) => s.length > 0);
											if (!scopes.includes('openid')) {
												scopes.unshift('openid');
												const finalScopes = scopes.join(' ');
												handleFieldChange('scopes', finalScopes);
												v4ToastManager.showWarning(
													'Added required "openid" scope for PingOne compatibility'
												);
											} else {
												handleFieldChange('scopes', normalizedValue);
											}
										}}
										onLoginHintChange={(value) => handleFieldChange('loginHint', value)}
										onPostLogoutRedirectUriChange={(value) =>
											handleFieldChange('postLogoutRedirectUri', value)
										}
										// Save handler
										onSave={handleSaveConfiguration}
										hasUnsavedChanges={false}
										isSaving={false}
										requireClientSecret={true}
										// PingOne Advanced Configuration
										pingOneAppState={pingOneConfig}
										onPingOneAppStateChange={setPingOneConfig}
										onPingOneSave={() => savePingOneConfig(pingOneConfig)}
										hasUnsavedPingOneChanges={false}
										isSavingPingOne={false}
										// UI config
										title="Application Configuration & Credentials"
										subtitle="Configure your application settings and credentials"
										showAdvancedConfig={true}
										defaultCollapsed={false}
									/>

									{/* Inline Advanced Options */}
									<div
										style={{
											marginTop: '1rem',
											padding: '1rem',
											background: '#fffbeb',
											border: '1px solid #fbbf24',
											borderRadius: '0.5rem',
										}}
									>
										<h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
											💡 Advanced Options
										</h4>
										<p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
											PKCE, custom parameters, and response modes are auto-configured based on your
											variant selection. Advanced OAuth parameters (audience, resources) can be
											configured in the flow execution steps.
										</p>
									</div>

									<ActionRow style={{ marginTop: '1rem' }}>
										<Button onClick={handleSaveConfiguration} $variant="success">
											<FiSettings /> Save Configuration
										</Button>
										<Button onClick={handleClearConfiguration} $variant="danger">
											<FiRefreshCw /> Clear Configuration
										</Button>
									</ActionRow>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{/* Condensed Educational Footer */}

						<EnhancedFlowInfoCard
							flowType={
								flowVariant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
							}
						/>
					</>
				);
			case 1:
				return (
					<>
						<CollapsibleSection>
							<GreenHeaderButton
								onClick={() => toggleSection('pkceOverview')}
								aria-expanded={!collapsedSections.pkceOverview}
							>
								<CollapsibleTitle>
									<FiBook /> What is PKCE?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pkceOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</GreenHeaderButton>
							{!collapsedSections.pkceOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>PKCE (Proof Key for Code Exchange)</InfoTitle>
											<InfoText>
												PKCE is a security extension for OAuth 2.0 that prevents authorization code
												interception attacks. It's required for public clients (like mobile apps)
												and highly recommended for all OAuth flows.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>The Security Problem PKCE Solves</InfoTitle>
											<InfoText>
												Without PKCE, if an attacker intercepts your authorization code (through app
												redirects, network sniffing, or malicious apps), they could exchange it for
												tokens. PKCE prevents this by requiring proof that the same client that
												started the flow is finishing it.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<YellowHeaderButton
								onClick={() => toggleSection('pkceDetails')}
								aria-expanded={!collapsedSections.pkceDetails}
							>
								<CollapsibleTitle>
									<FiBook /> Understanding Code Verifier & Code Challenge
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pkceDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</YellowHeaderButton>
							{!collapsedSections.pkceDetails && (
								<CollapsibleContent>
									<ParameterGrid>
										<InfoBox $variant="success">
											<FiKey size={20} />
											<div>
												<InfoTitle>Code Verifier</InfoTitle>
												<InfoText>
													A high-entropy cryptographic random string (43-128 chars) that stays
													secret in your app. Think of it as a temporary password that proves you're
													the same client that started the OAuth flow.
												</InfoText>
												<InfoList>
													<li>Generated fresh for each OAuth request</li>
													<li>Uses characters: A-Z, a-z, 0-9, -, ., _, ~</li>
													<li>Never sent in the authorization request</li>
													<li>Only revealed during token exchange</li>
												</InfoList>
											</div>
										</InfoBox>

										<InfoBox $variant="info">
											<FiShield size={20} />
											<div>
												<InfoTitle>Code Challenge</InfoTitle>
												<InfoText>
													A SHA256 hash of the code verifier, encoded in base64url format. This is
													sent publicly in the authorization URL but can't be reversed to get the
													original verifier.
												</InfoText>
												<InfoList>
													<li>Derived from: SHA256(code_verifier)</li>
													<li>Encoded in base64url (URL-safe)</li>
													<li>Safe to include in authorization URLs</li>
													<li>Used by PingOne to verify the verifier later</li>
												</InfoList>
											</div>
										</InfoBox>
									</ParameterGrid>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Best Practices</InfoTitle>
											<InfoList>
												<li>
													<strong>Generate Fresh Values:</strong> Create new PKCE parameters for
													every authorization request
												</li>
												<li>
													<strong>Secure Storage:</strong> Keep the code verifier in memory or
													secure storage, never log it
												</li>
												<li>
													<strong>Use S256 Method:</strong> Always use SHA256 hashing
													(code_challenge_method=S256)
												</li>
												<li>
													<strong>Sufficient Entropy:</strong> Use at least 43 characters of
													high-entropy randomness
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Generate PKCE Parameters
							</ResultsHeading>
							<HelperText>
								Generate fresh PKCE values for this authorization request. These will be used to
								secure the code exchange and prevent interception attacks.
							</HelperText>
							<PKCEGenerationService.showComponent
								controller={controller}
								credentials={controller.credentials}
								flowType={flowVariant}
								onPKCEGenerated={() => {
									console.log('[OAuth AuthZ V6] PKCE codes generated successfully');
								}}
							/>
						</ResultsSection>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleSection>
							<GreenHeaderButton
								onClick={() => toggleSection('authRequestOverview')}
								aria-expanded={!collapsedSections.authRequestOverview}
							>
								<CollapsibleTitle>
									<FiBook /> Understanding Authorization Requests
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</GreenHeaderButton>
							{!collapsedSections.authRequestOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiGlobe size={20} />
										<div>
											<InfoTitle>What is an Authorization Request?</InfoTitle>
											<InfoText>
												An authorization request redirects users to PingOne's authorization server
												where they authenticate and consent to sharing their information with your
												application. This is the first step in obtaining an authorization code.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Critical Security Considerations</InfoTitle>
											<InfoList>
												<li>
													<strong>State Parameter:</strong> Always include a unique state parameter
													to prevent CSRF attacks
												</li>
												<li>
													<strong>HTTPS Only:</strong> Authorization requests must use HTTPS in
													production
												</li>
												<li>
													<strong>Validate Redirect URI:</strong> Ensure redirect_uri exactly
													matches what's registered in PingOne
												</li>
												<li>
													<strong>Scope Limitation:</strong> Only request the minimum scopes your
													application needs
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<YellowHeaderButton
								onClick={() => toggleSection('authRequestDetails')}
								aria-expanded={!collapsedSections.authRequestDetails}
							>
								<CollapsibleTitle>
									<FiBook /> Authorization URL Parameters Deep Dive
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</YellowHeaderButton>
							{!collapsedSections.authRequestDetails && (
								<CollapsibleContent>
									{/* Response Type Configuration */}
									<InfoBox $variant="info" style={{ marginBottom: '1rem' }}>
										<FiSettings size={20} />
										<div>
											<InfoTitle>Response Type Configuration</InfoTitle>
											<div style={{ marginTop: '0.5rem' }}>
												<label
													htmlFor="response-type-select"
													style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
												>
													Choose Response Type:
												</label>
												<select
													id="response-type-select"
													value={selectedResponseType}
													onChange={(e) => setSelectedResponseType(e.target.value)}
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid #d1d5db',
														borderRadius: '0.375rem',
														fontSize: '0.875rem',
														backgroundColor: 'white',
													}}
												>
													<option value="code">
														code - Authorization Code only (OAuth 2.0 style)
													</option>
													<option value="code id_token">
														code id_token - Authorization Code + ID Token (OIDC hybrid)
													</option>
												</select>
												<div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
													{selectedResponseType === 'code' &&
														'Standard OAuth 2.0 flow - get authorization code, exchange for tokens'}
													{selectedResponseType === 'code id_token' &&
														'OIDC hybrid flow - get authorization code + ID token immediately'}
												</div>
											</div>
										</div>
									</InfoBox>

									<ParameterGrid>
										<InfoBox $variant="info">
											<FiKey size={20} />
											<div>
												<InfoTitle>Required Parameters</InfoTitle>
												<InfoList>
													<li>
														<strong>response_type={selectedResponseType}:</strong>{' '}
														{selectedResponseType === 'code'
															? 'Tells PingOne you want an authorization code (not tokens)'
															: 'Tells PingOne you want an authorization code + ID token immediately'}
													</li>
													<li>
														<strong>client_id:</strong> Your application's unique identifier in
														PingOne
													</li>
													<li>
														<strong>redirect_uri:</strong> Exact URL where PingOne sends the user
														back
													</li>
													<li>
														<strong>scope:</strong> Permissions you're requesting (openid, profile,
														email, etc.)
													</li>
												</InfoList>
											</div>
										</InfoBox>

										<InfoBox $variant="success">
											<FiShield size={20} />
											<div>
												<InfoTitle>Security Parameters</InfoTitle>
												<InfoList>
													<li>
														<strong>state:</strong> Random value to prevent CSRF attacks and
														maintain session state
													</li>
													<li>
														<strong>code_challenge:</strong> PKCE parameter for secure code exchange
													</li>
													<li>
														<strong>code_challenge_method:</strong> Always "S256" for SHA256 hashing
													</li>
													<li>
														<strong>nonce:</strong> (OIDC) Random value to prevent replay attacks on
														ID tokens
													</li>
												</InfoList>
											</div>
										</InfoBox>
									</ParameterGrid>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Optional But Recommended Parameters</InfoTitle>
											<InfoList>
												<li>
													<strong>prompt:</strong> Controls authentication behavior (none, login,
													consent, select_account)
												</li>
												<li>
													<strong>max_age:</strong> Maximum age of authentication session before
													re-auth required
												</li>
												<li>
													<strong>acr_values:</strong> Requested Authentication Context Class
													Reference values
												</li>
												<li>
													<strong>login_hint:</strong> Hint about the user identifier (email,
													username)
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Authorization URL Parameters</InfoTitle>
											<InfoText>The authorization URL includes these key parameters:</InfoText>
											<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
												<li>
													<strong>response_type={selectedResponseType}</strong> -{' '}
													{selectedResponseType === 'code'
														? 'Authorization Code flow'
														: 'OIDC Hybrid flow (Code + ID Token)'}
												</li>
												<li>
													<strong>client_id</strong> - Your PingOne application ID
												</li>
												<li>
													<strong>redirect_uri</strong> - Where to return after authorization
												</li>
												<li>
													<strong>scope</strong> - Permissions requested (openid, profile, email)
												</li>
												<li>
													<strong>state</strong> - CSRF protection token
												</li>
												<li>
													<strong>code_challenge</strong> - PKCE challenge (SHA256 hash)
												</li>
												<li>
													<strong>code_challenge_method=S256</strong> - PKCE method
												</li>
											</ul>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Build Your Authorization URL
							</ResultsHeading>
							<HelperText>
								Generate the authorization URL with all required parameters. Review it carefully
								before redirecting users to ensure all parameters are correct.
							</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handleGenerateAuthUrl}
									$priority="primary"
									disabled={
										!!controller.authUrl ||
										(!controller.pkceCodes.codeVerifier &&
											!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`))
									}
									title={
										!controller.pkceCodes.codeVerifier &&
										!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`)
											? 'Generate PKCE parameters first'
											: controller.authUrl
												? 'Authorization URL already generated'
												: 'Generate authorization URL'
									}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
									{controller.authUrl
										? 'Authorization URL Generated'
										: !controller.pkceCodes.codeVerifier &&
												!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`)
											? 'Complete above action'
											: 'Generate Authorization URL'}
									<HighlightBadge>1</HighlightBadge>
								</HighlightedActionButton>

								{controller.authUrl && (
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<HighlightedActionButton onClick={handleOpenAuthUrl} $priority="success">
											<FiExternalLink /> Redirect to PingOne
											<HighlightBadge>2</HighlightBadge>
										</HighlightedActionButton>
										<span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
											(Open Authorization URL)
										</span>
									</div>
								)}
							</ActionRow>

							{controller.authUrl ? (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Generated</GeneratedLabel>
									<div style={{ marginBottom: '1rem' }}>{controller.authUrl}</div>
									<CopyButtonService
										text={controller.authUrl ?? ''}
										label="Authorization URL"
										size="md"
										variant="primary"
										showLabel={true}
									/>
								</GeneratedUrlDisplay>
							) : (
								<HelperText>Generate an authorization URL above to continue to PingOne.</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<GreenHeaderButton
								onClick={() => toggleSection('authResponseOverview')}
								aria-expanded={!collapsedSections.authResponseOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Authorization Response Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</GreenHeaderButton>
							{!collapsedSections.authResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Authorization Response</InfoTitle>
											<InfoText>
												After authentication, PingOne returns you to the redirect URI with an
												authorization code or error message.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<HighlightHeaderButton
								onClick={() => toggleSection('authResponseDetails')}
								aria-expanded={!collapsedSections.authResponseDetails}
							>
								<CollapsibleTitle>
									<FiPackage /> Authorization Code Details
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authResponseDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</HighlightHeaderButton>
							{!collapsedSections.authResponseDetails && (
								<CollapsibleContent>
									<ResultsSection>
										<ResultsHeading>
											<FiCheckCircle size={18} /> Authorization Code
										</ResultsHeading>
										<HelperText>
											Use the authorization code immediately—it expires quickly. Copy it if you need
											to inspect the token exchange request.
										</HelperText>
										{authCode ? (
											<GeneratedContentBox>
												<GeneratedLabel>Received</GeneratedLabel>
												<ParameterGrid>
													<div>
														<ParameterLabel>Authorization Code</ParameterLabel>
														<ParameterValue>{authCode}</ParameterValue>
													</div>
												</ParameterGrid>
												<ActionRow>
													<CopyButtonService
														text={authCode}
														label="Authorization Code"
														size="sm"
														variant="outline"
														showLabel={true}
													/>
													<HighlightedActionButton
														onClick={handleNextClick}
														$priority="success"
														disabled={!canNavigateNext()}
														title={
															!canNavigateNext()
																? `Complete the action above to continue`
																: 'Proceed to next step'
														}
													>
														{isStepValid(currentStep)
															? 'Continue to Token Exchange'
															: 'Complete above action'}{' '}
														<FiArrowRight />
													</HighlightedActionButton>
												</ActionRow>
											</GeneratedContentBox>
										) : (
											<EmptyState>
												<EmptyIcon>
													<FiAlertCircle />
												</EmptyIcon>
												<EmptyTitle>Authorization Code Not Received</EmptyTitle>
												<EmptyText>
													No authorization code detected. You can paste one manually for testing.
												</EmptyText>
												<form style={{ maxWidth: '400px', margin: '0 auto' }}>
													<label
														htmlFor={manualAuthCodeId}
														style={{
															display: 'block',
															fontSize: '0.875rem',
															fontWeight: '600',
															color: '#374151',
															marginBottom: '0.5rem',
														}}
													>
														Manual Authorization Code
													</label>
													<input
														id={manualAuthCodeId}
														type="text"
														placeholder="Enter authorization code manually"
														value={authCode}
														onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
															const value = e.target.value;
															if (value) {
																controller.setAuthCodeManually(value);
															}
														}}
														style={{
															width: '100%',
															padding: '0.75rem',
															border: '1px solid #d1d5db',
															borderRadius: '0.5rem',
															fontSize: '0.875rem',
															backgroundColor: '#ffffff',
															marginBottom: '1rem',
														}}
													/>
												</form>
											</EmptyState>
										)}
									</ResultsSection>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<GreenHeaderButton
								onClick={() => toggleSection('tokenExchangeOverview')}
								aria-expanded={!collapsedSections.tokenExchangeOverview}
							>
								<CollapsibleTitle>
									<FiBook /> Token Exchange Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchangeOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</GreenHeaderButton>
							{!collapsedSections.tokenExchangeOverview && (
								<CollapsibleContent>
									<ExplanationSection>
										<ExplanationHeading>
											<FiKey /> Exchange Authorization Code for Tokens
										</ExplanationHeading>
										<InfoText>
											Call the backend token exchange endpoint to swap the authorization code for
											access and ID tokens.
										</InfoText>
									</ExplanationSection>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<BlueHeaderButton
								onClick={() => toggleSection('tokenExchangeDetails')}
								aria-expanded={!collapsedSections.tokenExchangeDetails}
							>
								<CollapsibleTitle>
									<FiSend /> Token Exchange Details
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchangeDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</BlueHeaderButton>
							{!collapsedSections.tokenExchangeDetails && (
								<CollapsibleContent>
									{/* Display Authorization Code if available */}
									{(controller.authCode || localAuthCode) && (
										<ResultsSection>
											<ResultsHeading>
												<FiCheckCircle size={18} /> Authorization Code Received
											</ResultsHeading>
											<HelperText>
												The authorization code has been received and is ready for token exchange.
											</HelperText>
											<GeneratedContentBox>
												<GeneratedLabel>Authorization Code</GeneratedLabel>
												<ParameterGrid>
													<div>
														<ParameterLabel>Code</ParameterLabel>
														<ParameterValue>{controller.authCode || localAuthCode}</ParameterValue>
													</div>
												</ParameterGrid>
												<ActionRow>
													<CopyButtonService
														text={controller.authCode || localAuthCode || ''}
														label="Authorization Code"
														size="sm"
														variant="outline"
														showLabel={true}
													/>
												</ActionRow>
											</GeneratedContentBox>
										</ResultsSection>
									)}

									<ActionRow style={{ justifyContent: 'center' }}>
										<HighlightedActionButton
											onClick={handleExchangeTokens}
											$priority="primary"
											disabled={!(controller.authCode || localAuthCode)}
										>
											<FiRefreshCw /> Exchange Authorization Code for Tokens
										</HighlightedActionButton>
									</ActionRow>

									<SectionDivider />

									{/* API Call Display for Token Exchange */}
									{tokenExchangeApiCall && (
										<EnhancedApiCallDisplay
											apiCall={tokenExchangeApiCall}
											options={{
												showEducationalNotes: true,
												showFlowContext: true,
												urlHighlightRules:
													EnhancedApiCallDisplayService.getDefaultHighlightRules(
														'authorization-code'
													),
											}}
										/>
									)}

									{/* Only show tokens if they were exchanged in this session */}
									{tokenExchangeApiCall &&
										controller.tokens &&
										UnifiedTokenDisplayService.showTokens(
											controller.tokens,
											flowVariant,
											'oauth-authorization-code-v7',
											{
												showCopyButtons: true,
												showDecodeButtons: true,
											}
										)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 5:
				return (
					<>
						<TokenIntrospect
							flowName="OAuth 2.0 Authorization Code Flow"
							flowVersion="V6"
							tokens={controller.tokens as unknown as Record<string, unknown>}
							credentials={controller.credentials as unknown as Record<string, unknown>}
							userInfo={userInfo}
							onFetchUserInfo={handleFetchUserInfo}
							isFetchingUserInfo={isFetchingUserInfo}
							onResetFlow={handleResetFlow}
							onNavigateToTokenManagement={navigateToTokenManagement}
							onIntrospectToken={handleIntrospectToken}
							collapsedSections={{
								completionOverview: collapsedSections.completionOverview,
								completionDetails: collapsedSections.completionDetails,
								introspectionDetails: collapsedSections.introspectionDetails,
								rawJson: false, // Show raw JSON expanded by default
							}}
							onToggleSection={(section) => {
								if (
									section === 'completionOverview' ||
									section === 'completionDetails' ||
									section === 'introspectionDetails'
								) {
									toggleSection(section as IntroSectionKey);
								}
							}}
							completionMessage="Nice work! You successfully completed the OAuth 2.0 Authorization Code Flow with PKCE using reusable V5 components."
							nextSteps={[
								'Inspect or decode tokens using the Token Management tools.',
								'Repeat the flow with different scopes or redirect URIs.',
								'Explore refresh tokens and introspection flows.',
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
										EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code'),
								}}
							/>
						)}

						{/* API Call Display for UserInfo Request */}
						{userInfoApiCall && (
							<EnhancedApiCallDisplay
								apiCall={userInfoApiCall}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									urlHighlightRules:
										EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code'),
								}}
							/>
						)}
					</>
				);

			case 6:
				return (
					<EnhancedSecurityFeaturesDemo
						tokens={controller.tokens as unknown as Record<string, unknown> | null}
						credentials={controller.credentials as unknown as Record<string, unknown>}
						pingOneConfig={pingOneConfig}
						onTerminateSession={() => {
							console.log('🚪 Session terminated via EnhancedSecurityFeaturesDemo');
							v4ToastManager.showSuccess('Session termination completed.');
						}}
						onRevokeTokens={() => {
							console.log('❌ Tokens revoked via EnhancedSecurityFeaturesDemo');
							v4ToastManager.showSuccess('Token revocation completed.');
						}}
						flowType="oauth-authorization-code-v7"
					/>
				);

			case 7:
				return (
					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>Flow Complete</InfoTitle>
							<InfoText>
								You've completed the Authorization Code flow. Tokens are available above and you can
								restart the flow anytime.
							</InfoText>
						</div>
					</InfoBox>
				);

			default:
				return null;
		}
	}, [
		collapsedSections,
		controller.authUrl,
		controller.authCode,
		controller.credentials,
		controller.pkceCodes,
		controller.tokens,
		currentStep,
		handleExchangeTokens,
		handleFetchUserInfo,
		handleGenerateAuthUrl,
		navigateToTokenManagement,
		toggleSection,
		canNavigateNext,
		controller.setAuthCodeManually,
		handleClearConfiguration,
		handleFieldChange,
		handleNextClick,
		handleOpenAuthUrl,
		handleResetFlow,
		handleSaveConfiguration,
		handleIntrospectToken,
		isStepValid,
		localAuthCode,
		pingOneConfig,
		savePingOneConfig,
		manualAuthCodeId,
		controller.isFetchingUserInfo,
		controller.userInfo,
		introspectionApiCall,
		tokenExchangeApiCall,
		userInfoApiCall,
		controller,
		flowVariant,
		selectedResponseType,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-authorization-code-v7" />

				<EnhancedFlowInfoCard
					flowType={flowVariant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'}
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<MainCard>
					<StepHeader $variant={flowVariant}>
						<StepHeaderLeft>
							<VersionBadge $variant={flowVariant}>
								Authorization Code Flow · V7 Unified
							</VersionBadge>
							<StepHeaderTitle>
								{flowVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'}{' '}
								{STEP_METADATA[currentStep].title}
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{flowVariant === 'oidc'
									? 'Authentication + Authorization with ID token and Access token'
									: 'API Authorization with Access token only'}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of 07</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					{/* V7 Variant Selector - Now inside MainCard below Step Header */}
					{renderVariantSelector()}

					{/* Step Requirements Indicator */}
					{!isStepValid(currentStep) && currentStep !== 0 && (
						<RequirementsIndicator>
							<RequirementsIcon>
								<FiAlertCircle />
							</RequirementsIcon>
							<RequirementsText>
								<strong>Complete this step to continue:</strong>
								<ul>
									{getStepRequirements(currentStep).map((requirement, index) => (
										<li key={index}>{requirement}</li>
									))}
								</ul>
							</RequirementsText>
						</RequirementsIndicator>
					)}
					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrev}
				onReset={handleResetFlow}
				onNext={handleNextClick}
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
				nextButtonText={isStepValid(currentStep) ? 'Next' : 'Complete above action'}
				disabledMessage="Complete the action above to continue"
			/>

			{AuthenticationModalService.showModal(
				showRedirectModal,
				() => {
					console.log('🔧 [OAuthAuthorizationCodeFlowV6] Modal cancelled by user');
					setShowRedirectModal(false);
				},
				() => {
					console.log(
						'🔧 [OAuthAuthorizationCodeFlowV6] User confirmed - continuing to PingOne authentication'
					);
					setShowRedirectModal(false);
					controller.handleRedirectAuthorization();
					// Open in new window (redirect mode)
					if (controller.authUrl) {
						window.location.href = controller.authUrl;
					}
				},
				controller.authUrl || '',
				'oauth',
				'OAuth 2.0 Authorization Code',
				{
					description:
						"You're about to be redirected to PingOne for OAuth 2.0 authorization. The page will redirect to PingOne for secure authentication.",
					redirectMode: 'redirect',
				}
			)}

			<LoginSuccessModal
				isOpen={showLoginSuccessModal}
				onClose={() => {
					console.log('🔴 [AuthorizationCodeFlowV5] Closing LoginSuccessModal', {
						currentStep,
						hasAuthCode: !!(controller.authCode || localAuthCode),
						storedStep: sessionStorage.getItem('oauth-authorization-code-v7-current-step'),
					});
					setShowLoginSuccessModal(false);
					// Ensure we stay on step 4 after modal closes
					if (currentStep !== 4) {
						console.log('🔧 [AuthorizationCodeFlowV5] Correcting step to 4 after modal close');
						setCurrentStep(4);
						sessionStorage.setItem('oauth-authorization-code-v7-current-step', '4');
					}
				}}
				title="Login Successful!"
				message="You have been successfully authenticated with PingOne. Your authorization code has been received and you can now proceed to exchange it for tokens."
				autoCloseDelay={5000}
			/>
		</Container>
	);
};

export default OAuthAuthorizationCodeFlowV7;
