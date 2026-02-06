// src/pages/ApplicationGenerator.tsx
// Application creation page - handles app type selection and configuration

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiArrowLeft,
	FiChevronLeft,
	FiChevronRight,
	FiCloud,
	FiCode,
	FiGlobe,
	FiInfo,
	FiServer,
	FiSettings,
	FiShield,
	FiSmartphone,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { ExportImportPanel } from '../components/ExportImportPanel';
import { PresetSelector } from '../components/PresetSelector';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import {
	type AppCreationResult,
	type OIDCNativeAppConfig,
	type OIDCWebAppConfig,
	pingOneAppCreationService,
	type ServiceAppConfig,
	type SinglePageAppConfig,
	type WorkerAppConfig,
} from '../services/pingOneAppCreationService';
import {
	type BuilderAppType,
	type FormDataState,
	presetManagerService,
} from '../services/presetManagerService';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';
import V7StepperService, { type StepMetadata } from '../services/v7StepperService';
import { clearAllTokens } from '../utils/tokenCleaner';
import { v4ToastManager } from '../utils/v4ToastMessages';
import '../utils/testPresets'; // Auto-run preset tests in development
import '../utils/testExportImport'; // Auto-run export/import tests in development
import '../utils/testAppGeneratorTokenDisplay'; // Auto-run token display tests in development
import '../utils/testConfigChecker'; // Auto-run config checker tests in development

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem;
  min-height: calc(100vh - 4rem);
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 1.75rem;
  box-shadow: 0 28px 80px -40px rgba(15, 23, 42, 0.38);
  position: relative;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 0.75rem;
  }
`;

const _Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(2px);
`;

const AppTypeCard = styled.div<{ selected: boolean }>`
  background: linear-gradient(160deg, #ffffff 0%, #f4f7ff 100%);
  border: 2px solid ${({ selected, theme }) => (selected ? theme.colors.primary : 'rgba(148, 163, 184, 0.25)')};
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 18px 45px -35px rgba(15, 23, 42, 0.5);

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-3px);
    box-shadow: 0 25px 55px -35px rgba(79, 70, 229, 0.55);
  }

  .icon {
    font-size: 2rem;
    color: ${({ selected, theme }) => (selected ? theme.colors.primary : '#6b7280')};
    margin-bottom: 1rem;
  }

  .title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }
`;

const FormContainer = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 255, 0.92) 100%);
  border-radius: 1.25rem;
  padding: 2.5rem;
  box-shadow: 0 28px 75px -40px rgba(15, 23, 42, 0.45);
  margin-bottom: 2.5rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  backdrop-filter: blur(6px);
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${({ $hasError }) => ($hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.4)')};
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: ${({ $hasError }) => ($hasError ? '#fef2f2' : 'rgba(255, 255, 255, 0.92)')};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 12px 30px -22px rgba(15, 23, 42, 0.45);

  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) => ($hasError ? '#ef4444' : theme.colors.primary)};
    box-shadow: ${({ $hasError }) =>
			$hasError
				? '0 0 0 3px rgba(239, 68, 68, 0.18), 0 20px 30px -30px rgba(239, 68, 68, 0.6)'
				: '0 0 0 3px rgba(79, 70, 229, 0.18), 0 20px 30px -30px rgba(79, 70, 229, 0.6)'};
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${({ $hasError }) => ($hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.4)')};
  border-radius: 0.75rem;
  font-size: 0.875rem;
  min-height: 150px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: ${({ $hasError }) => ($hasError ? '#fef2f2' : 'rgba(255, 255, 255, 0.92)')};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 12px 30px -22px rgba(15, 23, 42, 0.45);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.18), 0 20px 30px -30px rgba(79, 70, 229, 0.6);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 12px 30px -22px rgba(15, 23, 42, 0.45);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.18), 0 20px 30px -30px rgba(79, 70, 229, 0.6);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  ${({ variant, theme }) => {
		if (variant === 'primary') {
			return `
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
    color: white;
    &:hover {
      background: linear-gradient(135deg, ${theme.colors.primaryDark} 0%, ${theme.colors.primary} 100%);
      transform: translateY(-1px);
      box-shadow: 0 15px 35px -20px rgba(79, 70, 229, 0.6);
    }
  `;
		}

		if (variant === 'danger') {
			return `
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    color: white;
    box-shadow: 0 15px 35px -22px rgba(239, 68, 68, 0.6);
    &:hover {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      transform: translateY(-1px);
      box-shadow: 0 18px 40px -24px rgba(185, 28, 28, 0.7);
    }
  `;
		}

		if (variant === 'success') {
			return `
    background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
    color: white;
    box-shadow: 0 15px 35px -22px rgba(34, 197, 94, 0.6);
    &:hover {
      background: linear-gradient(135deg, #16a34a 0%, #166534 100%);
      transform: translateY(-1px);
      box-shadow: 0 18px 40px -24px rgba(22, 101, 52, 0.7);
    }
  `;
		}

		return `
    background: rgba(255, 255, 255, 0.92);
    color: ${theme.colors.gray700};
    border-color: rgba(148, 163, 184, 0.4);
    box-shadow: 0 14px 30px -28px rgba(15, 23, 42, 0.45);
    &:hover {
      background: rgba(255, 255, 255, 0.98);
      border-color: rgba(99, 102, 241, 0.45);
      transform: translateY(-1px);
    }
  `;
	}}
`;

const _ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const _LoadingSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const _ResultCard = styled.div<{ type: 'success' | 'error' }>`
  background: ${({ type }) => (type === 'success' ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ type }) => (type === 'success' ? '#22c55e' : '#ef4444')};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const _ResultTitle = styled.h3<{ $type: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ $type }) => ($type === 'success' ? '#166534' : '#dc2626')};
  margin-bottom: 1rem;
`;

const _ResultDetails = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

type TokenEndpointMethod =
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt'
	| 'none';
type PkceOption = 'OPTIONAL' | 'REQUIRED';

type SavedAppConfiguration = FormDataState & {
	selectedAppType: BuilderAppType | null;
};

const APP_GENERATOR_STORAGE_KEY = 'app-generator-configuration';

const stepperLayout = V7StepperService.createStepLayout({ theme: 'blue', showProgress: true });

const createDefaultFormData = (): FormDataState => {
	// Generate default app name with PingOne and random 3-digit code
	const generateDefaultAppName = () => {
		const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
		return `pingone-oauth-playground-${uniqueId}`;
	};

	return {
		// Basic Settings
		name: generateDefaultAppName(),
		description: '',
		enabled: true,
		redirectUris: ['https://localhost:3000/callback/oauth-playground-123'],
		postLogoutRedirectUris: ['http://localhost:3000'],
		grantTypes: ['authorization_code'],
		responseTypes: ['code'],
		tokenEndpointAuthMethod: 'client_secret_basic',
		pkceEnforcement: 'OPTIONAL',
		scopes: ['openid', 'profile', 'email'],
		accessTokenValiditySeconds: 3600,
		refreshTokenValiditySeconds: 2592000,
		idTokenValiditySeconds: 3600,

		// Advanced Settings - Default values from PingOne
		refreshTokenDuration: 30, // 30 days
		refreshTokenRollingDuration: 180, // 180 days
		refreshTokenRollingGracePeriod: 0, // 0 seconds
		allowRedirectUriPatterns: false,
		jwksUrl: '',
		pushedAuthorizationRequestStatus: 'OPTIONAL',
		parReferenceTimeout: 60, // 60 seconds
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
	};
};

// NOTE: refresh_token is NOT a grant type - it's a token type returned by the authorization server
// Refresh tokens are automatically returned when using authorization_code or client_credentials grant types
const WEB_APP_GRANT_OPTIONS = ['authorization_code', 'implicit', 'client_credentials'] as const;
const NATIVE_APP_GRANT_OPTIONS = ['authorization_code', 'implicit'] as const;
const SPA_GRANT_OPTIONS = ['authorization_code', 'implicit'] as const;
const WORKER_GRANT_OPTIONS = ['client_credentials', 'authorization_code', 'implicit'] as const;
const SERVICE_GRANT_OPTIONS = ['client_credentials', 'authorization_code'] as const;

const RESPONSE_TYPE_OPTIONS = ['code', 'token', 'id_token'] as const;

function filterAllowedValues<T extends readonly string[]>(
	values: string[] | undefined,
	allowed: T,
	fallback: T[number]
): T[number][] {
	if (!Array.isArray(values) || values.length === 0) {
		return [fallback];
	}

	const filtered = values.filter((value): value is T[number] =>
		allowed.includes(value as T[number])
	);
	return filtered.length > 0 ? filtered : [fallback];
}

function normalizeTokenEndpointMethod(value: string | undefined): TokenEndpointMethod {
	const allowed: TokenEndpointMethod[] = [
		'client_secret_basic',
		'client_secret_post',
		'client_secret_jwt',
		'private_key_jwt',
		'none',
	];
	return allowed.includes(value as TokenEndpointMethod)
		? (value as TokenEndpointMethod)
		: 'client_secret_basic';
}

function normalizePkceEnforcement(value: string | undefined): PkceOption {
	return value === 'REQUIRED' ? 'REQUIRED' : 'OPTIONAL';
}

function normalizeWebAppTokenMethod(
	value: TokenEndpointMethod
): OIDCWebAppConfig['tokenEndpointAuthMethod'] {
	switch (value) {
		case 'client_secret_basic':
		case 'client_secret_post':
		case 'client_secret_jwt':
		case 'private_key_jwt':
		case 'none':
			return value;
		default:
			return 'client_secret_basic';
	}
}

function normalizeNativeTokenMethod(
	value: TokenEndpointMethod
): OIDCNativeAppConfig['tokenEndpointAuthMethod'] {
	switch (value) {
		case 'client_secret_basic':
		case 'client_secret_post':
		case 'client_secret_jwt':
		case 'private_key_jwt':
		case 'none':
			return value;
		default:
			return 'client_secret_basic';
	}
}

function normalizeWorkerTokenMethod(
	value: TokenEndpointMethod
): WorkerAppConfig['tokenEndpointAuthMethod'] {
	if (value === 'client_secret_post') return 'client_secret_post';
	if (value === 'client_secret_jwt') return 'client_secret_jwt';
	if (value === 'private_key_jwt') return 'private_key_jwt';
	return 'client_secret_basic';
}

function normalizeServiceTokenMethod(
	value: TokenEndpointMethod
): ServiceAppConfig['tokenEndpointAuthMethod'] {
	if (value === 'client_secret_post') return 'client_secret_post';
	if (value === 'client_secret_jwt') return 'client_secret_jwt';
	if (value === 'private_key_jwt') return 'private_key_jwt';
	return 'client_secret_basic';
}

const toErrorDetails = (error: unknown) => {
	if (error instanceof Error) {
		return {
			message: error.message,
			stack: error.stack,
			name: error.name,
		};
	}
	return error ?? null;
};

const ApplicationGenerator: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const workerToken = location.state?.workerToken;
	const environmentId = location.state?.environmentId;
	const region = location.state?.region ?? 'NA';

	// usePageScroll({ pageName: 'Application Generator' }); // Disabled to prevent jumping

	// Prevent scroll restoration
	useEffect(() => {
		if ('scrollRestoration' in history) {
			history.scrollRestoration = 'manual';
		}
		return () => {
			if ('scrollRestoration' in history) {
				history.scrollRestoration = 'auto';
			}
		};
	}, []);

	const [selectedAppType, setSelectedAppType] = useState<BuilderAppType | null>(null);
	const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [creationResult, setCreationResult] = useState<AppCreationResult | null>(null);
	const [creationErrorDetails, setCreationErrorDetails] = useState<unknown>(null);
	const [_isSavedIndicator, setIsSavedIndicator] = useState(false);
	const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

	const [currentStep, setCurrentStep] = useState(1); // Always start on step 1

	// Clear all tokens and reset to step 1 on component mount
	useEffect(() => {
		console.log('🧹 [App Generator] Clearing all tokens and resetting to step 1');
		clearAllTokens();
		setCurrentStep(1);
		setCreationResult(null);
		setCreationErrorDetails(null);
		setIsSavedIndicator(false);
		setValidationErrors(new Set());
	}, []); // Empty dependency array ensures this runs only on mount

	// Save currentStep to localStorage
	useEffect(() => {
		try {
			localStorage.setItem('app-generator-current-step', currentStep.toString());
		} catch (error) {
			console.warn('Failed to save current step:', error);
		}
	}, [currentStep]);

	const [formData, setFormData] = useState<FormDataState>(() => createDefaultFormData());

	// Define stepper steps
	const stepMetadata: StepMetadata[] = [
		{
			id: 'app-type',
			title: 'Select Application Type',
			subtitle: 'Choose the type of application you want to create',
		},
		{
			id: 'configuration',
			title: 'Configure Application',
			subtitle: 'Set up your application settings and choose presets',
		},
		{
			id: 'review',
			title: 'Review & Create',
			subtitle: 'Review your configuration and create the application',
		},
		{
			id: 'results',
			title: 'Application Created',
			subtitle: 'View your new application details and next steps',
		},
	];

	// Clear all tokens when the page loads
	useEffect(() => {
		console.log('[ApplicationGenerator] Starting comprehensive token cleanup on page load...');

		// Force clear tokens immediately
		const result = clearAllTokens();

		console.log('[ApplicationGenerator] Token clearing result:', result);

		if (result.success) {
			console.log(`[ApplicationGenerator] Successfully cleared ${result.clearedCount} token items`);
			if (result.clearedCount > 0) {
				v4ToastManager.showSuccess(`🧹 Cleared ${result.clearedCount} tokens for fresh start`);
			} else {
				console.log('[ApplicationGenerator] No tokens found to clear');
			}
		} else {
			console.error('[ApplicationGenerator] Token clearing completed with errors:', result.errors);
			v4ToastManager.showError('⚠️ Some tokens could not be cleared');
		}

		// Additional cleanup - clear any remaining token-related items
		try {
			// Clear any flow-specific storage
			sessionStorage.removeItem('oauth-authorization-code-v6-tokens');
			sessionStorage.removeItem('oidc-authorization-code-v6-tokens');
			sessionStorage.removeItem('current-flow-tokens');
			sessionStorage.removeItem('flow-tokens');

			// Clear localStorage token items
			localStorage.removeItem('oauth_tokens');
			localStorage.removeItem('auth_tokens');
			localStorage.removeItem('pingone_tokens');

			console.log('[ApplicationGenerator] Additional token cleanup completed');
		} catch (error) {
			console.warn('[ApplicationGenerator] Additional cleanup warning:', error);
		}
	}, []);

	// Load saved configuration on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(APP_GENERATOR_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as Partial<SavedAppConfiguration>;
				const defaults = createDefaultFormData();

				const merged: FormDataState = {
					...defaults,
					...parsed,
					tokenEndpointAuthMethod: normalizeTokenEndpointMethod(
						parsed.tokenEndpointAuthMethod ?? defaults.tokenEndpointAuthMethod
					),
					pkceEnforcement: normalizePkceEnforcement(
						parsed.pkceEnforcement ?? defaults.pkceEnforcement
					),
					grantTypes:
						Array.isArray(parsed.grantTypes) && parsed.grantTypes.length > 0
							? parsed.grantTypes
							: defaults.grantTypes,
					responseTypes:
						Array.isArray(parsed.responseTypes) && parsed.responseTypes.length > 0
							? parsed.responseTypes
							: defaults.responseTypes,
					redirectUris:
						Array.isArray(parsed.redirectUris) && parsed.redirectUris.length > 0
							? parsed.redirectUris
							: defaults.redirectUris,
					postLogoutRedirectUris:
						Array.isArray(parsed.postLogoutRedirectUris) && parsed.postLogoutRedirectUris.length > 0
							? parsed.postLogoutRedirectUris
							: defaults.postLogoutRedirectUris,
					scopes:
						Array.isArray(parsed.scopes) && parsed.scopes.length > 0
							? parsed.scopes
							: defaults.scopes,
				};

				setFormData(merged);

				if (parsed.selectedAppType) {
					setSelectedAppType(parsed.selectedAppType);
				}
			}
		} catch (error) {
			console.warn('[ApplicationGenerator] Failed to load saved configuration:', error);
		}
	}, []);

	const _handleSaveConfiguration = useCallback(() => {
		try {
			const payload: SavedAppConfiguration = {
				...formData,
				selectedAppType,
			};

			localStorage.setItem(APP_GENERATOR_STORAGE_KEY, JSON.stringify(payload));

			setIsSavedIndicator(true);
			v4ToastManager.showSuccess('Application configuration saved');
			setTimeout(() => setIsSavedIndicator(false), 3000);
		} catch (error) {
			console.error('[ApplicationGenerator] Failed to save configuration:', error);
			v4ToastManager.showError('Failed to save configuration');
		}
	}, [formData, selectedAppType]);

	const _handleClearSavedConfiguration = useCallback(() => {
		try {
			localStorage.removeItem(APP_GENERATOR_STORAGE_KEY);
			localStorage.removeItem('app-generator-current-step');
			setFormData(createDefaultFormData());
			setSelectedAppType(null);
			setCreationResult(null);
			setIsSavedIndicator(false);
			setCurrentStep(1);
			v4ToastManager.showSuccess('Saved configuration cleared');
		} catch (error) {
			console.error('[ApplicationGenerator] Failed to clear saved configuration:', error);
			v4ToastManager.showError('Failed to clear configuration');
		}
	}, []);

	const appTypes: {
		type: BuilderAppType;
		icon: React.ReactNode;
		title: string;
		description: string;
	}[] = [
		{
			type: 'OIDC_WEB_APP',
			icon: <FiGlobe />,
			title: 'OIDC Web App',
			description:
				'Traditional web applications using authorization code flow with server-side processing.',
		},
		{
			type: 'OIDC_NATIVE_APP',
			icon: <FiSmartphone />,
			title: 'OIDC Native App',
			description: 'Mobile and desktop applications using OAuth 2.0 and OpenID Connect.',
		},
		{
			type: 'SINGLE_PAGE_APP',
			icon: <FiCode />,
			title: 'Single Page App',
			description: 'JavaScript-based applications running entirely in the browser.',
		},
		{
			type: 'WORKER',
			icon: <FiServer />,
			title: 'Worker App',
			description: 'Server-to-server applications using client credentials flow.',
		},
		{
			type: 'SERVICE',
			icon: <FiCloud />,
			title: 'Service App',
			description: 'Machine-to-machine applications with automated authentication.',
		},
		{
			type: 'SAML_APP',
			icon: <FiShield />,
			title: 'SAML App',
			description: 'SAML-based applications for enterprise SSO and federated authentication.',
		},
	];

	// Redirect back if no worker token
	useEffect(() => {
		if (!workerToken) {
			navigate('/client-generator');
		}
	}, [workerToken, navigate]);

	// Step navigation functions
	const handleNextStep = () => {
		if (currentStep === 1 && !selectedAppType) {
			handleAppTypeSelect('OIDC_WEB_APP');
		}

		if (currentStep < stepMetadata.length) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleAppTypeSelect = (type: BuilderAppType) => {
		setSelectedAppType(type);
		setSelectedPreset(null); // Clear preset when app type changes
		setCreationResult(null);

		// Auto-advance to next step when app type is selected
		if (currentStep === 1) {
			setTimeout(() => handleNextStep(), 300);
		}

		// Set default values based on app type
		switch (type) {
			case 'OIDC_WEB_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code', 'refresh_token'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'client_secret_basic',
					pkceEnforcement: 'OPTIONAL',
				});
				break;
			case 'OIDC_NATIVE_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code', 'refresh_token'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'none',
					pkceEnforcement: 'REQUIRED',
					redirectUris: ['com.example.app://callback'],
				});
				break;
			case 'SINGLE_PAGE_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code', 'refresh_token'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'none',
					pkceEnforcement: 'REQUIRED',
				});
				break;
			case 'WORKER':
				setFormData({
					...formData,
					grantTypes: ['client_credentials'],
					responseTypes: [],
					tokenEndpointAuthMethod: 'client_secret_post',
					redirectUris: [],
					postLogoutRedirectUris: [],
				});
				break;
			case 'SERVICE':
				setFormData({
					...formData,
					grantTypes: ['client_credentials'],
					responseTypes: [],
					tokenEndpointAuthMethod: 'client_secret_jwt',
					redirectUris: [],
					postLogoutRedirectUris: [],
				});
				break;
			case 'SAML_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'client_secret_basic',
					pkceEnforcement: 'OPTIONAL',
					redirectUris: ['https://app.company.com/saml/acs'],
					postLogoutRedirectUris: ['https://app.company.com/saml/sls'],
					signoffUrls: ['https://app.company.com/saml/sls'],
				});
				break;
		}
	};

	const handleInputChange = useCallback(
		(
			field: string,
			value: any,
			event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
		) => {
			if (event) {
				event.stopPropagation();
			}
			setFormData((prev) => ({ ...prev, [field]: value }));
			// Clear validation error when user starts typing (only if it exists)
			setValidationErrors((prev) => {
				if (prev.has(field)) {
					const newErrors = new Set(prev);
					newErrors.delete(field);
					return newErrors;
				}
				return prev;
			});
		},
		[]
	);

	const handleArrayChange = useCallback((field: string, values: string[]) => {
		setFormData((prev) => ({ ...prev, [field]: values }));
		// Clear validation error when user starts typing
		setValidationErrors((prev) => {
			if (prev.has(field)) {
				const newErrors = new Set(prev);
				newErrors.delete(field);
				return newErrors;
			}
			return prev;
		});
	}, []);

	// Preset handling functions
	const handlePresetSelect = (presetId: string | null) => {
		setSelectedPreset(presetId);
	};

	const handlePresetApply = (presetId: string) => {
		try {
			const appliedFormData = presetManagerService.applyPreset(presetId);
			if (appliedFormData) {
				setFormData(appliedFormData);
				setValidationErrors(new Set()); // Clear validation errors
				v4ToastManager.showSuccess('Preset applied successfully!');
			} else {
				v4ToastManager.showError('Failed to apply preset');
			}
		} catch (error) {
			console.error('[ApplicationGenerator] Failed to apply preset:', error);
			v4ToastManager.showError('Failed to apply preset');
		}
	};

	const _handleSaveAsPreset = async () => {
		if (!selectedAppType) {
			v4ToastManager.showError('Please select an application type first');
			return;
		}

		const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');

		const presetName = await uiNotificationServiceV8.prompt({
			title: 'Save Preset',
			message: 'Enter a name for this preset:',
			placeholder: 'My Custom Preset',
			confirmText: 'Continue',
			cancelText: 'Cancel',
		});
		if (!presetName?.trim()) return;

		// Check if preset with this name already exists
		const existingPresets = presetManagerService.getCustomPresets();
		const existingPreset = existingPresets.find(
			(p) =>
				p.name.toLowerCase() === presetName.trim().toLowerCase() && p.appType === selectedAppType
		);

		if (existingPreset) {
			const shouldUpdate = await uiNotificationServiceV8.confirm({
				title: 'Preset Already Exists',
				message: `A preset named "${presetName.trim()}" already exists for ${selectedAppType.replace(/_/g, ' ')}. Do you want to update it?`,
				confirmText: 'Update',
				cancelText: 'Cancel',
				severity: 'warning',
			});
			if (!shouldUpdate) return;
		}

		const presetDescription =
			(await uiNotificationServiceV8.prompt({
				title: 'Preset Description',
				message: 'Enter a description for this preset (optional):',
				placeholder: 'Description...',
				confirmText: 'Save',
				cancelText: 'Skip',
			})) || '';

		try {
			const savedPreset = presetManagerService.saveCustomPreset({
				name: presetName.trim(),
				description: presetDescription.trim(),
				appType: selectedAppType,
				configuration: formData,
			});

			if (existingPreset) {
				v4ToastManager.showSuccess(`Preset "${savedPreset.name}" updated successfully!`);
			} else {
				v4ToastManager.showSuccess(`Preset "${savedPreset.name}" created successfully!`);
			}
		} catch (error) {
			console.error('[ApplicationGenerator] Failed to save preset:', error);
			v4ToastManager.showError('Failed to save preset');
		}
	};

	const handleImportConfiguration = (importedConfig: FormDataState, metadata: any) => {
		try {
			setFormData(importedConfig);
			setValidationErrors(new Set()); // Clear validation errors

			// If the imported config has a different app type, update it
			if (metadata?.appType && metadata.appType !== selectedAppType) {
				setSelectedAppType(metadata.appType);
			}

			v4ToastManager.showSuccess(
				`Configuration "${metadata?.name || 'imported'}" applied successfully!`
			);
		} catch (error) {
			console.error('[ApplicationGenerator] Failed to apply imported configuration:', error);
			v4ToastManager.showError('Failed to apply imported configuration');
		}
	};

	// Form validation with field highlighting
	const validateForm = () => {
		const errors: string[] = [];
		const fieldErrors = new Set<string>();

		if (!formData.name.trim()) {
			errors.push('Application name is required');
			fieldErrors.add('name');
		}

		if (!formData.description.trim()) {
			errors.push('Description is required');
			fieldErrors.add('description');
		}

		// Validate grant types - convert to uppercase for PingOne
		if (formData.grantTypes.length === 0) {
			errors.push('At least one grant type is required');
			fieldErrors.add('grantTypes');
		}

		// Validate response types if applicable
		if (
			(selectedAppType === 'OIDC_WEB_APP' ||
				selectedAppType === 'OIDC_NATIVE_APP' ||
				selectedAppType === 'SINGLE_PAGE_APP') &&
			formData.responseTypes.length === 0
		) {
			errors.push('At least one response type is required for this app type');
			fieldErrors.add('responseTypes');
		}

		// Validate redirect URIs for apps that need them
		if (
			(selectedAppType === 'OIDC_WEB_APP' ||
				selectedAppType === 'OIDC_NATIVE_APP' ||
				selectedAppType === 'SINGLE_PAGE_APP') &&
			formData.redirectUris.length === 0
		) {
			errors.push('At least one redirect URI is required for this app type');
			fieldErrors.add('redirectUris');
		}

		setValidationErrors(fieldErrors);
		return errors;
	};

	const _handleCreateApp = async () => {
		if (!selectedAppType) return;

		// Validate form
		const validationErrors = validateForm();
		if (validationErrors.length > 0) {
			v4ToastManager.showError(validationErrors.join(', '));
			return;
		}

		setIsCreating(true);
		setCreationResult(null);

		try {
			// Use the Worker token passed from the previous page
			if (!workerToken) {
				throw new Error(
					'No worker token available. Please go back and obtain a worker token first.'
				);
			}

			if (!environmentId) {
				throw new Error('Environment ID is required.');
			}

			console.log('[App Generator] Creating app with worker token in environment:', environmentId);

			// Initialize the service with the worker token
			pingOneAppCreationService.initialize(workerToken, environmentId);

			// Create the app based on type
			let result: AppCreationResult;

			const baseConfig = {
				name: formData.name,
				description: formData.description,
				enabled: formData.enabled,
			};

			switch (selectedAppType) {
				case 'OIDC_WEB_APP': {
					const payload: OIDCWebAppConfig = {
						...baseConfig,
						type: 'OIDC_WEB_APP',
						redirectUris: formData.redirectUris,
						postLogoutRedirectUris: formData.postLogoutRedirectUris,
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							WEB_APP_GRANT_OPTIONS,
							'authorization_code'
						),
						responseTypes: filterAllowedValues(
							formData.responseTypes,
							RESPONSE_TYPE_OPTIONS,
							'code'
						),
						tokenEndpointAuthMethod: normalizeWebAppTokenMethod(formData.tokenEndpointAuthMethod),
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: 7200,
						refreshTokenValiditySeconds: 2592000,
						idTokenValiditySeconds: 7200,
					};
					result = await pingOneAppCreationService.createOIDCWebApp(payload);
					break;
				}
				case 'OIDC_NATIVE_APP': {
					const nativePayload: OIDCNativeAppConfig = {
						...baseConfig,
						type: 'OIDC_NATIVE_APP',
						redirectUris: formData.redirectUris,
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							NATIVE_APP_GRANT_OPTIONS,
							'authorization_code'
						),
						responseTypes: filterAllowedValues(
							formData.responseTypes,
							RESPONSE_TYPE_OPTIONS,
							'code'
						),
						tokenEndpointAuthMethod: normalizeNativeTokenMethod(formData.tokenEndpointAuthMethod),
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createOIDCNativeApp(nativePayload);
					break;
				}
				case 'SINGLE_PAGE_APP': {
					const spaPayload: SinglePageAppConfig = {
						...baseConfig,
						type: 'SINGLE_PAGE_APP',
						redirectUris: formData.redirectUris,
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							SPA_GRANT_OPTIONS,
							'authorization_code'
						),
						responseTypes: filterAllowedValues(
							formData.responseTypes,
							RESPONSE_TYPE_OPTIONS,
							'code'
						),
						tokenEndpointAuthMethod: 'none',
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createSinglePageApp(spaPayload);
					break;
				}
				case 'WORKER': {
					const workerPayload: WorkerAppConfig = {
						...baseConfig,
						type: 'WORKER',
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							WORKER_GRANT_OPTIONS,
							'client_credentials'
						),
						tokenEndpointAuthMethod: normalizeWorkerTokenMethod(formData.tokenEndpointAuthMethod),
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createWorkerApp(workerPayload);
					break;
				}
				case 'SERVICE': {
					const servicePayload: ServiceAppConfig = {
						...baseConfig,
						type: 'SERVICE',
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							SERVICE_GRANT_OPTIONS,
							'client_credentials'
						),
						tokenEndpointAuthMethod: normalizeServiceTokenMethod(formData.tokenEndpointAuthMethod),
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createServiceApp(servicePayload);
					break;
				}
				case 'SAML_APP': {
					// For SAML apps, we'll use OIDC Web App as the base and configure SAML-specific settings
					const samlPayload: OIDCWebAppConfig = {
						...baseConfig,
						type: 'OIDC_WEB_APP', // PingOne API uses OIDC_WEB_APP as base for SAML
						redirectUris: formData.redirectUris,
						postLogoutRedirectUris: formData.postLogoutRedirectUris,
						grantTypes: ['authorization_code'],
						responseTypes: ['code'],
						tokenEndpointAuthMethod: 'client_secret_basic',
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createOIDCWebApp(samlPayload);
					break;
				}
				default:
					throw new Error('Unsupported application type');
			}

			setCreationResult(result);
			setCreationErrorDetails(null);

			if (result.success) {
				v4ToastManager.showSuccess(`Application "${formData.name}" created successfully!`);
				// Advance to results step
				setCurrentStep(4);
				// DON'T reset form - keep fields on screen for user reference
				// setFormData(createDefaultFormData()); // REMOVED - Issue #3 fix
			} else {
				// Check if it's a name conflict error and provide helpful message
				const errorMsg = result.error || '';
				if (errorMsg.includes('name already exists') || errorMsg.includes('already exists')) {
					v4ToastManager.showError(
						`Application name "${formData.name}" already exists. Please try a different name.`
					);
				} else {
					v4ToastManager.showError(`Failed to create application: ${result.error}`);
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

			// Check if it's a name conflict error in the exception
			if (errorMessage.includes('name already exists') || errorMessage.includes('already exists')) {
				const betterMessage = `Application name "${formData.name}" already exists. Please try a different name.`;
				setCreationResult({ success: false, error: betterMessage });
				setCreationErrorDetails(toErrorDetails(error));
				v4ToastManager.showError(betterMessage);
			} else {
				setCreationResult({ success: false, error: errorMessage });
				setCreationErrorDetails(toErrorDetails(error));
				v4ToastManager.showError(errorMessage);
			}
		} finally {
			setIsCreating(false);
		}
	};

	const handleCreateApplication = async (modalData?: {
		name: string;
		description: string;
		redirectUri?: string;
		tokenEndpointAuthMethod?: string;
	}) => {
		if (!selectedAppType) return;

		// Use modal data if provided, otherwise use form data
		const appName = modalData?.name || formData.name;
		const appDescription = modalData?.description || formData.description;
		const redirectUri =
			modalData?.redirectUri ||
			(Array.isArray(formData.redirectUris)
				? formData.redirectUris[0]
				: 'https://localhost:3000/callback');
		const _tokenAuthMethod = modalData?.tokenEndpointAuthMethod || formData.tokenEndpointAuthMethod;

		// Validate required fields
		if (!appName.trim()) {
			v4ToastManager.showError('Application name is required');
			return;
		}
		if (!redirectUri.trim()) {
			v4ToastManager.showError('Redirect URI is required');
			return;
		}

		setIsCreating(true);

		try {
			// Initialize the service with the worker token
			pingOneAppCreationService.initialize(workerToken, environmentId);

			// Create the app based on type
			let result: AppCreationResult;

			// Make application name unique by adding timestamp if it's a common test name
			const uniqueName =
				appName.toLowerCase().includes('test') ||
				appName.toLowerCase().includes('template') ||
				appName.toLowerCase().includes('sample') ||
				appName.toLowerCase().includes('demo')
					? `${appName}-${Date.now()}`
					: appName;

			const baseConfig = {
				name: uniqueName,
				description: appDescription,
				enabled: true,
			};

			switch (selectedAppType) {
				case 'OIDC_WEB_APP': {
					const payload: OIDCWebAppConfig = {
						...baseConfig,
						type: 'OIDC_WEB_APP',
						redirectUris: formData.redirectUris,
						postLogoutRedirectUris: formData.postLogoutRedirectUris,
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							WEB_APP_GRANT_OPTIONS,
							'authorization_code'
						),
						responseTypes: filterAllowedValues(
							formData.responseTypes,
							RESPONSE_TYPE_OPTIONS,
							'code'
						),
						tokenEndpointAuthMethod: normalizeWebAppTokenMethod(formData.tokenEndpointAuthMethod),
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: 7200,
						refreshTokenValiditySeconds: 2592000,
						idTokenValiditySeconds: 7200,
					};
					result = await pingOneAppCreationService.createOIDCWebApp(payload);
					break;
				}
				case 'OIDC_NATIVE_APP': {
					const nativePayload: OIDCNativeAppConfig = {
						...baseConfig,
						type: 'OIDC_NATIVE_APP',
						redirectUris: formData.redirectUris,
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							NATIVE_APP_GRANT_OPTIONS,
							'authorization_code'
						),
						responseTypes: filterAllowedValues(
							formData.responseTypes,
							RESPONSE_TYPE_OPTIONS,
							'code'
						),
						tokenEndpointAuthMethod: normalizeNativeTokenMethod(formData.tokenEndpointAuthMethod),
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createOIDCNativeApp(nativePayload);
					break;
				}
				case 'SINGLE_PAGE_APP': {
					const spaPayload: SinglePageAppConfig = {
						...baseConfig,
						type: 'SINGLE_PAGE_APP',
						redirectUris: formData.redirectUris,
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							SPA_GRANT_OPTIONS,
							'authorization_code'
						),
						responseTypes: filterAllowedValues(
							formData.responseTypes,
							RESPONSE_TYPE_OPTIONS,
							'code'
						),
						tokenEndpointAuthMethod: 'none',
						pkceEnforcement: 'REQUIRED',
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createSinglePageApp(spaPayload);
					break;
				}
				case 'WORKER': {
					const workerPayload: WorkerAppConfig = {
						...baseConfig,
						type: 'WORKER',
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							WORKER_GRANT_OPTIONS,
							'client_credentials'
						),
						tokenEndpointAuthMethod: normalizeWorkerTokenMethod(formData.tokenEndpointAuthMethod),
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createWorkerApp(workerPayload);
					break;
				}
				case 'SERVICE': {
					const servicePayload: ServiceAppConfig = {
						...baseConfig,
						type: 'SERVICE',
						grantTypes: filterAllowedValues(
							formData.grantTypes,
							SERVICE_GRANT_OPTIONS,
							'client_credentials'
						),
						tokenEndpointAuthMethod: normalizeServiceTokenMethod(formData.tokenEndpointAuthMethod),
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createServiceApp(servicePayload);
					break;
				}
				case 'SAML_APP': {
					// For SAML apps, we'll use OIDC Web App as the base and configure SAML-specific settings
					const samlPayload: OIDCWebAppConfig = {
						...baseConfig,
						type: 'OIDC_WEB_APP', // PingOne API uses OIDC_WEB_APP as base for SAML
						redirectUris: formData.redirectUris,
						postLogoutRedirectUris: formData.postLogoutRedirectUris,
						grantTypes: ['authorization_code'],
						responseTypes: ['code'],
						tokenEndpointAuthMethod: 'client_secret_basic',
						pkceEnforcement: formData.pkceEnforcement,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					result = await pingOneAppCreationService.createOIDCWebApp(samlPayload);
					break;
				}
				default:
					throw new Error('Unsupported application type');
			}

			setCreationResult(result);

			if (result.success && result.app) {
				// Update form data with new credentials
				setFormData((prev) => ({
					...prev,
					clientId: result.app!.clientId,
					clientSecret: result.app!.clientSecret || prev.clientSecret,
					redirectUris: [redirectUri], // Update with the redirect URI from modal or form
				}));

				console.log('[ApplicationGenerator] Updated form with new app credentials:', {
					clientId: result.app.clientId,
					redirectUri: redirectUri,
					hasSecret: !!result.app.clientSecret,
				});

				v4ToastManager.showSuccess(
					`Application "${formData.name}" created successfully! Credentials updated.`
				);
				// Advance to results step
				setCurrentStep(4);
				// DON'T reset form - keep fields on screen for user reference
			} else if (result.success) {
				v4ToastManager.showSuccess(`Application "${formData.name}" created successfully!`);
				setCurrentStep(4);
			} else {
				v4ToastManager.showError(`Failed to create application: ${result.error}`);
			}
		} catch (error) {
			console.error('[ApplicationGenerator] Application creation failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			setCreationResult({
				success: false,
				error: errorMessage,
			});
			setCreationErrorDetails(toErrorDetails(error));
			v4ToastManager.showError(`Application creation failed: ${errorMessage}`);
		} finally {
			setIsCreating(false);
		}
	};

	// Render step content based on current step
	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<div>
						{/* Config Checker - Available on first page */}
						<ConfigCheckerButtons
							formData={formData}
							selectedAppType={selectedAppType}
							workerToken={workerToken}
							environmentId={environmentId}
							region={region}
							isCreating={isCreating}
							onCreateApplication={handleCreateApplication}
							onGenerateWorkerToken={() => {
								v4ToastManager.showInfo(
									'Please go to the Client Generator to create a new worker token.'
								);
							}}
							onImportConfig={(importedConfig) => {
								// Update form data with imported PingOne configuration
								setFormData((prev) => ({
									...prev,
									redirectUris: (importedConfig.redirectUris as string[]) || prev.redirectUris,
									scopes: (importedConfig.scopes as string[]) || prev.scopes,
									tokenEndpointAuthMethod: String(
										importedConfig.tokenEndpointAuthMethod || prev.tokenEndpointAuthMethod
									),
									grantTypes: (importedConfig.grantTypes as string[]) || prev.grantTypes,
									responseTypes: (importedConfig.responseTypes as string[]) || prev.responseTypes,
								}));
								v4ToastManager.showSuccess('Configuration imported from PingOne!');
							}}
						/>

						<CardGrid>
							{appTypes.map((appType) => (
								<AppTypeCard
									key={appType.type}
									selected={selectedAppType === appType.type}
									onClick={() => handleAppTypeSelect(appType.type)}
								>
									<div className="icon">{appType.icon}</div>
									<div className="title">{appType.title}</div>
									<div className="description">{appType.description}</div>
								</AppTypeCard>
							))}
						</CardGrid>
					</div>
				);

			case 2:
				if (!selectedAppType) {
					return (
						<FormContainer>
							<FormTitle>
								<FiInfo /> Select an application type to continue
							</FormTitle>
							<p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.6 }}>
								Step 2 customizes settings for the application type you choose on Step 1. Please
								return to the previous step and pick an application type so we can load the
								appropriate configuration fields.
							</p>
							<Button onClick={() => setCurrentStep(1)} variant="secondary">
								<FiChevronLeft /> Back to application types
							</Button>
						</FormContainer>
					);
				}

				return (
					<div>
						{/* Configuration Presets */}
						<PresetSelector
							selectedAppType={selectedAppType}
							selectedPreset={selectedPreset}
							onPresetSelect={handlePresetSelect}
							onPresetApply={handlePresetApply}
						/>

						{/* Export/Import Configuration */}
						<ExportImportPanel
							formData={formData}
							appType={selectedAppType}
							onImport={handleImportConfiguration}
							disabled={isCreating}
						/>

						<div onScroll={(e) => e.preventDefault()} style={{ overflow: 'visible' }}>
							<FormContainer key={`form-${selectedAppType}`}>
								<FormTitle>
									Configure {appTypes.find((t) => t.type === selectedAppType)?.title}
								</FormTitle>
								<FormGrid>
									{/* Basic Settings */}
									<FormGroup key="app-name">
										<Label>Application Name *</Label>
										<Input
											key="name-input"
											type="text"
											value={formData.name}
											onChange={(e) => handleInputChange('name', e.target.value, e)}
											placeholder="My Application"
											$hasError={validationErrors.has('name')}
											autoComplete="off"
										/>
										{validationErrors.has('name') && (
											<div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
												Application name is required
											</div>
										)}
									</FormGroup>

									<FormGroup key="app-description">
										<Label>Description</Label>
										<TextArea
											key="description-input"
											value={formData.description}
											onChange={(e) => handleInputChange('description', e.target.value, e)}
											placeholder="Brief description of your application"
										/>
									</FormGroup>

									{/* Grant Types */}
									<FormGroup>
										<Label>Grant Types *</Label>
										<CheckboxGroup>
											{(() => {
												let allowedGrants: readonly string[] = [];
												switch (selectedAppType) {
													case 'OIDC_WEB_APP':
														allowedGrants = WEB_APP_GRANT_OPTIONS;
														break;
													case 'OIDC_NATIVE_APP':
														allowedGrants = NATIVE_APP_GRANT_OPTIONS;
														break;
													case 'SINGLE_PAGE_APP':
														allowedGrants = SPA_GRANT_OPTIONS;
														break;
													case 'WORKER':
														allowedGrants = WORKER_GRANT_OPTIONS;
														break;
													case 'SERVICE':
														allowedGrants = SERVICE_GRANT_OPTIONS;
														break;
													default:
														allowedGrants = WEB_APP_GRANT_OPTIONS;
												}
												return allowedGrants.map((grant) => (
													<CheckboxLabel key={grant}>
														<Checkbox
															type="checkbox"
															checked={formData.grantTypes.includes(grant)}
															onChange={(e) => {
																if (e.target.checked) {
																	handleArrayChange('grantTypes', [...formData.grantTypes, grant]);
																} else {
																	handleArrayChange(
																		'grantTypes',
																		formData.grantTypes.filter((g) => g !== grant)
																	);
																}
															}}
														/>
														{grant.replace(/_/g, ' ')}
													</CheckboxLabel>
												));
											})()}
										</CheckboxGroup>
										{validationErrors.has('grantTypes') && (
											<div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
												At least one grant type is required
											</div>
										)}
									</FormGroup>

									{/* Response Types */}
									{(selectedAppType === 'OIDC_WEB_APP' ||
										selectedAppType === 'OIDC_NATIVE_APP' ||
										selectedAppType === 'SINGLE_PAGE_APP') && (
										<FormGroup>
											<Label>Response Types *</Label>
											<CheckboxGroup>
												{RESPONSE_TYPE_OPTIONS.map((responseType) => (
													<CheckboxLabel key={responseType}>
														<Checkbox
															type="checkbox"
															checked={formData.responseTypes.includes(responseType)}
															onChange={(e) => {
																if (e.target.checked) {
																	handleArrayChange('responseTypes', [
																		...formData.responseTypes,
																		responseType,
																	]);
																} else {
																	handleArrayChange(
																		'responseTypes',
																		formData.responseTypes.filter((r) => r !== responseType)
																	);
																}
															}}
														/>
														{responseType}
													</CheckboxLabel>
												))}
											</CheckboxGroup>
											{validationErrors.has('responseTypes') && (
												<div
													style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}
												>
													At least one response type is required for this app type
												</div>
											)}
										</FormGroup>
									)}

									{/* Token Endpoint Auth Method */}
									<FormGroup>
										<Label>Token Endpoint Auth Method</Label>
										<Select
											value={formData.tokenEndpointAuthMethod}
											onChange={(e) =>
												handleInputChange(
													'tokenEndpointAuthMethod',
													e.target.value as TokenEndpointMethod
												)
											}
										>
											<option value="client_secret_basic">Client Secret Basic</option>
											<option value="client_secret_post">Client Secret Post</option>
											<option
												value="client_secret_jwt"
												disabled={selectedAppType === 'SINGLE_PAGE_APP'}
											>
												Client Secret JWT
											</option>
											<option
												value="private_key_jwt"
												disabled={selectedAppType === 'SINGLE_PAGE_APP'}
											>
												Private Key JWT
											</option>
											<option
												value="none"
												disabled={
													!(
														selectedAppType === 'OIDC_NATIVE_APP' ||
														selectedAppType === 'SINGLE_PAGE_APP'
													)
												}
											>
												None (Public Client)
											</option>
										</Select>
									</FormGroup>

									{/* PKCE Enforcement */}
									{(selectedAppType === 'OIDC_WEB_APP' ||
										selectedAppType === 'OIDC_NATIVE_APP' ||
										selectedAppType === 'SINGLE_PAGE_APP') && (
										<FormGroup>
											<Label>PKCE Enforcement</Label>
											<Select
												value={formData.pkceEnforcement}
												onChange={(e) =>
													handleInputChange('pkceEnforcement', e.target.value as PkceOption)
												}
											>
												<option value="OPTIONAL">Optional</option>
												<option value="REQUIRED">Required</option>
											</Select>
										</FormGroup>
									)}

									{/* Redirect URIs */}
									{(selectedAppType === 'OIDC_WEB_APP' ||
										selectedAppType === 'OIDC_NATIVE_APP' ||
										selectedAppType === 'SINGLE_PAGE_APP' ||
										selectedAppType === 'SAML_APP') && (
										<FormGroup>
											<Label>Redirect URIs *</Label>
											<TextArea
												value={formData.redirectUris.join('\n')}
												onChange={(e) =>
													handleArrayChange(
														'redirectUris',
														e.target.value.split('\n').filter((uri) => uri.trim())
													)
												}
												placeholder="https://localhost:3000/callback&#10;https://myapp.com/callback"
												$hasError={validationErrors.has('redirectUris')}
											/>
											{validationErrors.has('redirectUris') && (
												<div
													style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}
												>
													At least one redirect URI is required for this app type
												</div>
											)}
										</FormGroup>
									)}

									{/* Post Logout Redirect URIs */}
									{(selectedAppType === 'OIDC_WEB_APP' ||
										selectedAppType === 'OIDC_NATIVE_APP' ||
										selectedAppType === 'SINGLE_PAGE_APP') && (
										<FormGroup>
											<Label>Post Logout Redirect URIs</Label>
											<TextArea
												value={formData.postLogoutRedirectUris.join('\n')}
												onChange={(e) =>
													handleArrayChange(
														'postLogoutRedirectUris',
														e.target.value.split('\n').filter((uri) => uri.trim())
													)
												}
												placeholder="http://localhost:3000&#10;https://myapp.com"
											/>
										</FormGroup>
									)}

									{/* Scopes */}
									<FormGroup>
										<Label>Scopes</Label>
										<TextArea
											value={formData.scopes.join('\n')}
											onChange={(e) =>
												handleArrayChange(
													'scopes',
													e.target.value.split('\n').filter((scope) => scope.trim())
												)
											}
											placeholder="openid&#10;profile&#10;email"
										/>
									</FormGroup>

									{/* Token Validity Settings */}
									<FormGroup>
										<Label>Access Token Validity (seconds)</Label>
										<Input
											type="number"
											value={formData.accessTokenValiditySeconds}
											onChange={(e) =>
												handleInputChange(
													'accessTokenValiditySeconds',
													parseInt(e.target.value, 10) || 3600
												)
											}
											min="60"
											max="86400"
										/>
									</FormGroup>

									{formData.grantTypes.includes('refresh_token') && (
										<FormGroup>
											<Label>Refresh Token Validity (seconds)</Label>
											<Input
												type="number"
												value={formData.refreshTokenValiditySeconds}
												onChange={(e) =>
													handleInputChange(
														'refreshTokenValiditySeconds',
														parseInt(e.target.value, 10) || 2592000
													)
												}
												min="3600"
												max="31536000"
											/>
										</FormGroup>
									)}

									{(selectedAppType === 'OIDC_WEB_APP' ||
										selectedAppType === 'OIDC_NATIVE_APP' ||
										selectedAppType === 'SINGLE_PAGE_APP') && (
										<FormGroup>
											<Label>ID Token Validity (seconds)</Label>
											<Input
												type="number"
												value={formData.idTokenValiditySeconds}
												onChange={(e) =>
													handleInputChange(
														'idTokenValiditySeconds',
														parseInt(e.target.value, 10) || 3600
													)
												}
												min="60"
												max="86400"
											/>
										</FormGroup>
									)}

									{/* Advanced Settings - Always Visible */}
									<FormGroup style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
										<Label
											style={{
												fontSize: '1.125rem',
												fontWeight: '600',
												color: '#374151',
												marginBottom: '1rem',
											}}
										>
											Advanced Settings
										</Label>
									</FormGroup>

									<FormGroup>
										<Label>JWKS URL</Label>
										<Input
											type="url"
											value={formData.jwksUrl}
											onChange={(e) => handleInputChange('jwksUrl', e.target.value)}
											placeholder="https://example.com/.well-known/jwks.json"
										/>
									</FormGroup>

									<FormGroup>
										<Label>Initiate Login URI</Label>
										<Input
											type="url"
											value={formData.initiateLoginUri}
											onChange={(e) => handleInputChange('initiateLoginUri', e.target.value)}
											placeholder="https://example.com/login"
										/>
									</FormGroup>

									<FormGroup>
										<Label>Target Link URI</Label>
										<Input
											type="url"
											value={formData.targetLinkUri}
											onChange={(e) => handleInputChange('targetLinkUri', e.target.value)}
											placeholder="https://example.com/target"
										/>
									</FormGroup>

									<FormGroup>
										<Label>Refresh Token Duration (days)</Label>
										<Input
											type="number"
											value={formData.refreshTokenDuration}
											onChange={(e) =>
												handleInputChange(
													'refreshTokenDuration',
													parseInt(e.target.value, 10) || 30
												)
											}
											min="1"
											max="365"
										/>
									</FormGroup>

									<FormGroup>
										<Label>Refresh Token Rolling Duration (days)</Label>
										<Input
											type="number"
											value={formData.refreshTokenRollingDuration}
											onChange={(e) =>
												handleInputChange(
													'refreshTokenRollingDuration',
													parseInt(e.target.value, 10) || 180
												)
											}
											min="1"
											max="365"
										/>
									</FormGroup>

									<FormGroup>
										<Label>PAR Reference Timeout (seconds)</Label>
										<Input
											type="number"
											value={formData.parReferenceTimeout}
											onChange={(e) =>
												handleInputChange('parReferenceTimeout', parseInt(e.target.value, 10) || 60)
											}
											min="10"
											max="600"
										/>
									</FormGroup>
								</FormGrid>
							</FormContainer>
						</div>
					</div>
				);

			case 3:
				return (
					<div>
						<FormContainer>
							<FormTitle>Review Your Configuration</FormTitle>
							<div
								style={{
									background: '#f8fafc',
									padding: '1.5rem',
									borderRadius: '0.75rem',
									marginBottom: '2rem',
								}}
							>
								<h4>Application Details</h4>
								<p>
									<strong>Type:</strong> {appTypes.find((t) => t.type === selectedAppType)?.title}
								</p>
								<p>
									<strong>Name:</strong> {formData.name || 'Not specified'}
								</p>
								<p>
									<strong>Description:</strong> {formData.description || 'No description'}
								</p>
								{formData.redirectUris.length > 0 && (
									<p>
										<strong>Redirect URIs:</strong> {formData.redirectUris.join(', ')}
									</p>
								)}
								{formData.scopes.length > 0 && (
									<p>
										<strong>Scopes:</strong> {formData.scopes.join(' ')}
									</p>
								)}
							</div>

							<Button
								onClick={handleCreateApplication}
								disabled={isCreating || !selectedAppType || !formData.name.trim()}
								variant="primary"
								style={{
									padding: '0.75rem 2rem',
									fontSize: '0.875rem',
									fontWeight: '600',
									borderRadius: '8px',
									margin: '0 auto',
									display: 'block',
								}}
							>
								{isCreating ? 'Creating Application...' : 'Create Application'}
							</Button>
						</FormContainer>
					</div>
				);

			case 4:
				return creationResult ? (
					<div>
						<FormContainer>
							<FormTitle>
								{creationResult.success ? (
									<span style={{ color: '#16a34a' }}>✅ Application Created Successfully!</span>
								) : (
									<span style={{ color: '#ef4444' }}>❌ Application Creation Failed</span>
								)}
							</FormTitle>

							{creationResult.success && creationResult.app ? (
								<div
									style={{
										background: '#f0fdf4',
										padding: '1.5rem',
										borderRadius: '0.75rem',
										border: '1px solid #16a34a',
									}}
								>
									<h4>Your New Application</h4>
									<p>
										<strong>Application ID:</strong> {creationResult.app.id}
									</p>
									<p>
										<strong>Client ID:</strong> {creationResult.app.clientId}
									</p>
									{creationResult.app.clientSecret && (
										<p>
											<strong>Client Secret:</strong> {creationResult.app.clientSecret}
										</p>
									)}
									<p>
										<strong>Environment:</strong> {creationResult.app.environment?.id ?? 'Unknown'}
									</p>
								</div>
							) : (
								<div
									style={{
										background: '#fef2f2',
										padding: '1.5rem',
										borderRadius: '0.75rem',
										border: '1px solid #ef4444',
									}}
								>
									<h4>Error Details</h4>
									<p>{creationResult.error}</p>
									{creationErrorDetails && (
										<pre
											style={{
												background: '#fff',
												padding: '1rem',
												borderRadius: '0.5rem',
												overflow: 'auto',
											}}
										>
											{JSON.stringify(creationErrorDetails, null, 2)}
										</pre>
									)}
								</div>
							)}

							<div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
								<Button onClick={() => setCurrentStep(1)} variant="secondary">
									Create Another Application
								</Button>
								{creationResult.success &&
									creationResult.app?.environment?.id &&
									creationResult.app.id && (
										<Button
											onClick={() => {
												const envId = creationResult.app?.environment?.id;
												const appId = creationResult.app?.id;
												if (!envId || !appId) {
													return;
												}
												window.open(
													`https://console.pingone.com/${envId}/applications/${appId}`,
													'_blank'
												);
											}}
										>
											View in PingOne Console
										</Button>
									)}
							</div>
						</FormContainer>
					</div>
				) : null;

			default:
				return null;
		}
	};

	if (!workerToken) {
		return null; // Redirect handled in useEffect
	}

	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		StepHeaderRight,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepNumber,
		StepTotal,
		StepContent,
		StepNavigation,
		NavigationButton,
		StepProgress,
		ProgressBar,
		ProgressText,
	} = stepperLayout;

	const stepProgressPercent = Math.min(Math.max((currentStep / stepMetadata.length) * 100, 0), 100);

	return (
		<Container style={{ scrollBehavior: 'auto' }}>
			<FlowHeader flowId="configuration" />

			<BackButton
				onClick={() => navigate('/client-generator', { state: { workerToken, environmentId } })}
			>
				<FiArrowLeft /> Back to Credentials
			</BackButton>

			{/* Worker Token Display */}
			{workerToken && (
				<div style={{ marginBottom: '2rem' }}>
					<CollapsibleHeader
						title="Worker Token"
						subtitle="Authentication token for PingOne API operations"
						theme="blue"
						defaultCollapsed={true}
						icon={<FiSettings />}
					>
						{UnifiedTokenDisplayService.showTokens(
							{ access_token: workerToken },
							'oauth',
							'app-generator-worker-token',
							{
								showCopyButtons: true,
								showDecodeButtons: true,
							}
						)}
					</CollapsibleHeader>
				</div>
			)}

			{/* V5 Stepper */}
			<StepContainer>
				<StepHeader>
					<StepHeaderLeft>
						<StepHeaderTitle>{stepMetadata[currentStep - 1]?.title}</StepHeaderTitle>
						<StepHeaderSubtitle>{stepMetadata[currentStep - 1]?.subtitle}</StepHeaderSubtitle>
					</StepHeaderLeft>
					<StepHeaderRight>
						<StepProgress>
							<StepNumber>{currentStep}</StepNumber>
							<StepTotal>of {stepMetadata.length}</StepTotal>
						</StepProgress>
						<StepProgress
							style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}
						>
							<ProgressBar $progress={stepProgressPercent} style={{ width: '160px' }} />
							<ProgressText>{Math.round(stepProgressPercent)}% complete</ProgressText>
						</StepProgress>
					</StepHeaderRight>
				</StepHeader>

				<StepContent>{renderStepContent()}</StepContent>

				<StepNavigation>
					<NavigationButton
						onClick={handlePrevStep}
						disabled={currentStep === 1}
						style={{ opacity: currentStep === 1 ? 0.5 : 1 }}
					>
						<FiChevronLeft /> Previous
					</NavigationButton>

					<div style={{ flex: 1 }} />

					<NavigationButton
						onClick={handleNextStep}
						disabled={
							currentStep === stepMetadata.length ||
							(currentStep === 1 && !selectedAppType) ||
							(currentStep === 2 && !formData.name.trim())
						}
						style={{
							opacity:
								currentStep === stepMetadata.length ||
								(currentStep === 1 && !selectedAppType) ||
								(currentStep === 2 && !formData.name.trim())
									? 0.5
									: 1,
						}}
					>
						Next <FiChevronRight />
					</NavigationButton>
				</StepNavigation>
			</StepContainer>
		</Container>
	);
};

export default ApplicationGenerator;
