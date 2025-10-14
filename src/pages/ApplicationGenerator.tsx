// src/pages/ApplicationGenerator.tsx
// Application creation page - handles app type selection and configuration

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiX, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import {
  pingOneAppCreationService,
  type AppCreationResult,
  type OIDCWebAppConfig,
  type OIDCNativeAppConfig,
  type SinglePageAppConfig,
  type WorkerAppConfig,
  type ServiceAppConfig,
} from '../services/pingOneAppCreationService';
import { usePageScroll } from '../hooks/usePageScroll';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { FlowHeader } from '../services/flowHeaderService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem;
  min-height: calc(100vh - 4rem);
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  border-radius: 1.75rem;
  box-shadow: 0 28px 80px -40px rgba(15, 23, 42, 0.38);
  position: relative;
`;

const Header = styled.div`
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
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 0.75rem;
  color: #1f2937;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 2.5rem;
  box-shadow: 0 15px 35px -25px rgba(15, 23, 42, 0.4);

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(99, 102, 241, 0.55);
    transform: translateY(-1px);
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

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 12px 30px -22px rgba(15, 23, 42, 0.45);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.18), 0 20px 30px -30px rgba(79, 70, 229, 0.6);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: rgba(255, 255, 255, 0.92);
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const LoadingSpinner = styled.div`
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

const ResultCard = styled.div<{ type: 'success' | 'error' }>`
  background: ${({ type }) => (type === 'success' ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ type }) => (type === 'success' ? '#22c55e' : '#ef4444')};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const ResultTitle = styled.h3<{ $type: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ $type }) => ($type === 'success' ? '#166534' : '#dc2626')};
  margin-bottom: 1rem;
`;

const ResultDetails = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

type BuilderAppType = 'OIDC_WEB_APP' | 'OIDC_NATIVE_APP' | 'SINGLE_PAGE_APP' | 'WORKER' | 'SERVICE';

type TokenEndpointMethod = 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt' | 'none';
type PkceOption = 'OPTIONAL' | 'REQUIRED';

type FormDataState = {
  name: string;
  description: string;
  enabled: boolean;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: TokenEndpointMethod;
  pkceEnforcement: PkceOption;
  scopes: string[];
  accessTokenValiditySeconds: number;
  refreshTokenValiditySeconds: number;
  idTokenValiditySeconds: number;
};

type SavedAppConfiguration = FormDataState & {
  selectedAppType: BuilderAppType | null;
};

const APP_GENERATOR_STORAGE_KEY = 'app-generator-configuration';

const createDefaultFormData = (): FormDataState => ({
  name: '',
  description: '',
  enabled: true,
  redirectUris: ['http://localhost:3000/callback'],
  postLogoutRedirectUris: ['http://localhost:3000'],
  grantTypes: ['authorization_code'],
  responseTypes: ['code'],
  tokenEndpointAuthMethod: 'client_secret_basic',
  pkceEnforcement: 'OPTIONAL',
  scopes: ['openid', 'profile', 'email'],
  accessTokenValiditySeconds: 3600,
  refreshTokenValiditySeconds: 2592000,
  idTokenValiditySeconds: 3600,
});

const WEB_APP_GRANT_OPTIONS = ['authorization_code', 'implicit', 'refresh_token', 'client_credentials'] as const;
const NATIVE_APP_GRANT_OPTIONS = ['authorization_code', 'implicit', 'refresh_token'] as const;
const SPA_GRANT_OPTIONS = ['authorization_code', 'implicit', 'refresh_token'] as const;
const WORKER_GRANT_OPTIONS = ['client_credentials', 'authorization_code', 'implicit'] as const;
const SERVICE_GRANT_OPTIONS = ['client_credentials', 'authorization_code'] as const;

const RESPONSE_TYPE_OPTIONS = ['code', 'token', 'id_token'] as const;

function filterAllowedValues<T extends readonly string[]>(values: string[] | undefined, allowed: T, fallback: T[number]): T[number][] {
  if (!Array.isArray(values) || values.length === 0) {
    return [fallback];
  }

  const filtered = values.filter((value): value is T[number] => allowed.includes(value as T[number]));
  return filtered.length > 0 ? filtered : [fallback];
}

function normalizeTokenEndpointMethod(value: string | undefined): TokenEndpointMethod {
  const allowed: TokenEndpointMethod[] = ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'none'];
  return allowed.includes(value as TokenEndpointMethod) ? (value as TokenEndpointMethod) : 'client_secret_basic';
}

function normalizePkceEnforcement(value: string | undefined): PkceOption {
  return value === 'REQUIRED' ? 'REQUIRED' : 'OPTIONAL';
}

function normalizeWebAppTokenMethod(value: TokenEndpointMethod): OIDCWebAppConfig['tokenEndpointAuthMethod'] {
  if (value === 'client_secret_post') return 'client_secret_post';
  if (value === 'none') return 'none';
  return 'client_secret_basic';
}

function normalizeNativeTokenMethod(value: TokenEndpointMethod): OIDCNativeAppConfig['tokenEndpointAuthMethod'] {
  if (value === 'client_secret_post') return 'client_secret_post';
  if (value === 'none') return 'none';
  return 'client_secret_basic';
}

function normalizeWorkerTokenMethod(value: TokenEndpointMethod): WorkerAppConfig['tokenEndpointAuthMethod'] {
  if (value === 'client_secret_post') return 'client_secret_post';
  if (value === 'client_secret_jwt') return 'client_secret_jwt';
  if (value === 'private_key_jwt') return 'private_key_jwt';
  return 'client_secret_basic';
}

function normalizeServiceTokenMethod(value: TokenEndpointMethod): ServiceAppConfig['tokenEndpointAuthMethod'] {
  if (value === 'client_secret_post') return 'client_secret_post';
  if (value === 'client_secret_jwt') return 'client_secret_jwt';
  if (value === 'private_key_jwt') return 'private_key_jwt';
  return 'client_secret_basic';
}

const ApplicationGenerator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const workerToken = location.state?.workerToken;
  const environmentId = location.state?.environmentId;

  usePageScroll({ pageName: 'Application Generator', force: true });

  const [selectedAppType, setSelectedAppType] = useState<BuilderAppType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<AppCreationResult | null>(null);
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  const [formData, setFormData] = useState<FormDataState>(() => createDefaultFormData());

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
          tokenEndpointAuthMethod: normalizeTokenEndpointMethod(parsed.tokenEndpointAuthMethod ?? defaults.tokenEndpointAuthMethod),
          pkceEnforcement: normalizePkceEnforcement(parsed.pkceEnforcement ?? defaults.pkceEnforcement),
          grantTypes: Array.isArray(parsed.grantTypes) && parsed.grantTypes.length > 0 ? parsed.grantTypes : defaults.grantTypes,
          responseTypes: Array.isArray(parsed.responseTypes) && parsed.responseTypes.length > 0 ? parsed.responseTypes : defaults.responseTypes,
          redirectUris: Array.isArray(parsed.redirectUris) && parsed.redirectUris.length > 0 ? parsed.redirectUris : defaults.redirectUris,
          postLogoutRedirectUris: Array.isArray(parsed.postLogoutRedirectUris) && parsed.postLogoutRedirectUris.length > 0 ? parsed.postLogoutRedirectUris : defaults.postLogoutRedirectUris,
          scopes: Array.isArray(parsed.scopes) && parsed.scopes.length > 0 ? parsed.scopes : defaults.scopes,
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

  const handleSaveConfiguration = useCallback(() => {
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

  const handleClearSavedConfiguration = useCallback(() => {
    try {
      localStorage.removeItem(APP_GENERATOR_STORAGE_KEY);
      setFormData(createDefaultFormData());
      setSelectedAppType(null);
      setCreationResult(null);
      setIsSavedIndicator(false);
      v4ToastManager.showSuccess('Saved configuration cleared');
    } catch (error) {
      console.error('[ApplicationGenerator] Failed to clear saved configuration:', error);
      v4ToastManager.showError('Failed to clear configuration');
    }
  }, []);

  const appTypes: { type: BuilderAppType; icon: React.ReactNode; title: string; description: string }[] = [
    {
      type: 'OIDC_WEB_APP',
      icon: <FiSettings />,
      title: 'OIDC Web App',
      description:
        'Traditional web applications using authorization code flow with server-side processing.',
    },
    {
      type: 'OIDC_NATIVE_APP',
      icon: <FiSettings />,
      title: 'OIDC Native App',
      description: 'Mobile and desktop applications using OAuth 2.0 and OpenID Connect.',
    },
    {
      type: 'SINGLE_PAGE_APP',
      icon: <FiSettings />,
      title: 'Single Page App',
      description: 'JavaScript-based applications running entirely in the browser.',
    },
    {
      type: 'WORKER',
      icon: <FiSettings />,
      title: 'Worker App',
      description: 'Server-to-server applications using client credentials flow.',
    },
    {
      type: 'SERVICE',
      icon: <FiSettings />,
      title: 'Service App',
      description: 'Machine-to-machine applications with automated authentication.',
    },
  ];

  // Redirect back if no worker token
  useEffect(() => {
    if (!workerToken) {
      navigate('/client-generator');
    }
  }, [workerToken, navigate]);

  const handleAppTypeSelect = (type: BuilderAppType) => {
    setSelectedAppType(type);
    setCreationResult(null);

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
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, values: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: values }));
  };

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Application name is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    // Validate grant types - convert to uppercase for PingOne
    if (formData.grantTypes.length === 0) {
      errors.push('At least one grant type is required');
    }

    // Validate response types if applicable
    if ((selectedAppType === 'OIDC_WEB_APP' || selectedAppType === 'OIDC_NATIVE_APP' || selectedAppType === 'SINGLE_PAGE_APP') && formData.responseTypes.length === 0) {
      errors.push('At least one response type is required for this app type');
    }

    return errors;
  };

  const handleCreateApp = async () => {
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
        throw new Error('No worker token available. Please go back and obtain a worker token first.');
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
            grantTypes: filterAllowedValues(formData.grantTypes, WEB_APP_GRANT_OPTIONS, 'authorization_code'),
            responseTypes: filterAllowedValues(formData.responseTypes, RESPONSE_TYPE_OPTIONS, 'code'),
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
            grantTypes: filterAllowedValues(formData.grantTypes, NATIVE_APP_GRANT_OPTIONS, 'authorization_code'),
            responseTypes: filterAllowedValues(formData.responseTypes, RESPONSE_TYPE_OPTIONS, 'code'),
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
            grantTypes: filterAllowedValues(formData.grantTypes, SPA_GRANT_OPTIONS, 'authorization_code'),
            responseTypes: filterAllowedValues(formData.responseTypes, RESPONSE_TYPE_OPTIONS, 'code'),
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
            grantTypes: filterAllowedValues(formData.grantTypes, WORKER_GRANT_OPTIONS, 'client_credentials'),
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
            grantTypes: filterAllowedValues(formData.grantTypes, SERVICE_GRANT_OPTIONS, 'client_credentials'),
            tokenEndpointAuthMethod: normalizeServiceTokenMethod(formData.tokenEndpointAuthMethod),
            scopes: formData.scopes,
            accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
            refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
          };
          result = await pingOneAppCreationService.createServiceApp(servicePayload);
          break;
        }
        default:
          throw new Error('Unsupported application type');
      }

      setCreationResult(result);

      if (result.success) {
        v4ToastManager.showSuccess(`Application "${formData.name}" created successfully!`);
        // Reset form
        setFormData(createDefaultFormData());
      } else {
        v4ToastManager.showError(`Failed to create application: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCreationResult({ success: false, error: errorMessage });
      v4ToastManager.showError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (!workerToken) {
    return null; // Will redirect in useEffect
  }

  return (
    <Container>
      <FlowHeader flowId="configuration" />

      <BackButton onClick={() => navigate('/client-generator', { state: { workerToken, environmentId } })}>
        <FiArrowLeft /> Back to Worker Token
      </BackButton>

      <Header>
        <h1>PingOne Application Generator</h1>
        <p>Create OAuth 2.0 and OpenID Connect applications using your worker token</p>
      </Header>

      {/* App Type Selection */}
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

      {selectedAppType && (
        <FormContainer>
          <FormTitle>Configure {appTypes.find((t) => t.type === selectedAppType)?.title}</FormTitle>

          <FormGrid>
            <FormGroup>
              <Label>Application Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Awesome App"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description *</Label>
              <Input
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description"
              />
            </FormGroup>

            {(selectedAppType === 'OIDC_WEB_APP' ||
              selectedAppType === 'OIDC_NATIVE_APP' ||
              selectedAppType === 'SINGLE_PAGE_APP') && (
              <>
                <FormGroup>
                  <Label>Redirect URIs</Label>
                  <TextArea
                    value={formData.redirectUris.join('\n')}
                    onChange={(e) =>
                      handleArrayChange(
                        'redirectUris',
                        e.target.value.split('\n').filter((uri) => uri.trim())
                      )
                    }
                    placeholder="http://localhost:3000/callback&#10;https://myapp.com/callback"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Post-Logout Redirect URIs</Label>
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
              </>
            )}

            <FormGroup>
              <Label>Grant Types</Label>
              <CheckboxGroup>
                {['authorization_code', 'implicit', 'refresh_token', 'client_credentials'].map(
                  (grantType) => (
                    <CheckboxLabel key={grantType}>
                      <Checkbox
                        type="checkbox"
                        checked={formData.grantTypes.includes(grantType)}
                        onChange={(e) => {
                          const newGrants = e.target.checked
                            ? [...formData.grantTypes, grantType]
                            : formData.grantTypes.filter((g) => g !== grantType);
                          handleArrayChange('grantTypes', newGrants);
                        }}
                      />
                      {grantType.replace('_', ' ')}
                    </CheckboxLabel>
                  )
                )}
              </CheckboxGroup>
            </FormGroup>

            {(selectedAppType === 'OIDC_WEB_APP' ||
              selectedAppType === 'OIDC_NATIVE_APP' ||
              selectedAppType === 'SINGLE_PAGE_APP') && (
              <FormGroup>
                <Label>Response Types</Label>
                <CheckboxGroup>
                  {['code', 'token', 'id_token'].map((responseType) => (
                    <CheckboxLabel key={responseType}>
                      <Checkbox
                        type="checkbox"
                        checked={formData.responseTypes.includes(responseType)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...formData.responseTypes, responseType]
                            : formData.responseTypes.filter((t) => t !== responseType);
                          handleArrayChange('responseTypes', newTypes);
                        }}
                      />
                      {responseType}
                    </CheckboxLabel>
                  ))}
                </CheckboxGroup>
              </FormGroup>
            )}

            <FormGroup>
              <Label>Token Endpoint Auth Method</Label>
              <Select
                value={formData.tokenEndpointAuthMethod}
                onChange={(e) => handleInputChange('tokenEndpointAuthMethod', e.target.value)}
              >
                {selectedAppType === 'OIDC_NATIVE_APP' || selectedAppType === 'SINGLE_PAGE_APP' ? (
                  <>
                    <option value="none">None (Public Client)</option>
                    <option value="client_secret_basic">Client Secret Basic</option>
                    <option value="client_secret_post">Client Secret Post</option>
                  </>
                ) : (
                  <>
                    <option value="none">None</option>
                    <option value="client_secret_basic">Client Secret Basic</option>
                    <option value="client_secret_post">Client Secret Post</option>
                    <option value="client_secret_jwt">Client Secret JWT</option>
                    <option value="private_key_jwt">Private Key JWT</option>
                  </>
                )}
              </Select>
            </FormGroup>

            {(selectedAppType === 'OIDC_WEB_APP' ||
              selectedAppType === 'OIDC_NATIVE_APP' ||
              selectedAppType === 'SINGLE_PAGE_APP') && (
              <FormGroup>
                <Label>PKCE Enforcement</Label>
                <Select
                  value={formData.pkceEnforcement}
                  onChange={(e) => handleInputChange('pkceEnforcement', e.target.value)}
                >
                  <option value="OPTIONAL">Optional</option>
                  <option value="REQUIRED">Required</option>
                </Select>
              </FormGroup>
            )}

            <FormGroup>
              <Label>Scopes</Label>
              <TextArea
                value={formData.scopes.join(' ')}
                onChange={(e) =>
                  handleArrayChange(
                    'scopes',
                    e.target.value.split(' ').filter((scope) => scope.trim())
                  )
                }
                placeholder="openid profile email"
              />
            </FormGroup>

            <FormGroup>
              <Label>Access Token Validity (seconds)</Label>
              <Input
                type="number"
                value={formData.accessTokenValiditySeconds}
                onChange={(e) =>
                  handleInputChange('accessTokenValiditySeconds', parseInt(e.target.value))
                }
              />
            </FormGroup>
          </FormGrid>

          <ButtonGroup>
            {isSavedIndicator && (
              <span style={{ alignSelf: 'center', color: '#16a34a', fontWeight: 500 }}>
                Saved!
              </span>
            )}
            <Button variant="success" onClick={handleSaveConfiguration}>
              Save Configuration
            </Button>
            <Button variant="danger" onClick={handleClearSavedConfiguration}>
              Clear Saved Configuration
            </Button>
            <Button variant="secondary" onClick={() => setSelectedAppType(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateApp}
              disabled={isCreating || !formData.name.trim() || !formData.description.trim()}
            >
              {isCreating ? <LoadingSpinner /> : <FiCheckCircle />}
              Create Application
            </Button>
          </ButtonGroup>
        </FormContainer>
      )}

      {creationResult && (
        <ResultCard type={creationResult.success ? 'success' : 'error'}>
          <ResultTitle $type={creationResult.success ? 'success' : 'error'}>
            {creationResult.success ? <FiCheckCircle /> : <FiX />}
            {creationResult.success
              ? 'Application Created Successfully!'
              : 'Application Creation Failed'}
          </ResultTitle>
          <div>
            {creationResult.success ? (
              <div>
                <p>Your application has been created in PingOne with the following details:</p>
                {creationResult.app && (
                  <ResultDetails>
                    <strong>Application ID:</strong> {creationResult.app.id}
                    <br />
                    <strong>Client ID:</strong> {creationResult.app.clientId}
                    <br />
                    <strong>Name:</strong> {creationResult.app.name}
                    <br />
                    <strong>Type:</strong> {creationResult.app.type}
                    <br />
                    <strong>Created:</strong>{' '}
                    {new Date(creationResult.app.createdAt).toLocaleString()}
                  </ResultDetails>
                )}
              </div>
            ) : (
              <div>
                <p>Failed to create the application:</p>
                <ResultDetails>{creationResult.error}</ResultDetails>
              </div>
            )}
          </div>
        </ResultCard>
      )}
    </Container>
  );
};

export default ApplicationGenerator;
