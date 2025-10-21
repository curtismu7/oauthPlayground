// src/components/ConfigCheckerButtons.tsx
// Config Checker component for comparing form data against live PingOne applications

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiCheckCircle, FiCopy, FiDownload, FiLoader, FiX, FiSave, FiKey, FiMonitor } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { pingOneAppCreationService } from '../services/pingOneAppCreationService';
import { ConfigComparisonService, ConfigDiffResult } from '../services/configComparisonService';
import { logger } from '../utils/logger';

// Custom P1 Logo Component
const P1Logo = ({ size = 14, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: 'inline-block', marginRight: '4px', ...style }}
  >
    <rect width="24" height="24" fill="#dc2626" rx="2" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="bold"
      fontFamily="sans-serif"
    >
      P1
    </text>
  </svg>
);

// Helper function to format JSON values more compactly
const formatCompactJson = (value: any) => {
  const jsonStr = JSON.stringify(value);
  if (jsonStr.length > 80) {
    // For long arrays, show first few items + count
    if (Array.isArray(value) && value.length > 3) {
      const preview = value.slice(0, 2);
      return `[${preview.map(v => JSON.stringify(v)).join(', ')}, ...+${value.length - 2} more]`;
    }
    // For long strings, truncate
    if (typeof value === 'string' && value.length > 60) {
      return `"${value.substring(0, 57)}..."`;
    }
  }
  return jsonStr;
};

const ConfigCheckerHeader = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const ConfigCheckerTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const ConfigCheckerDescription = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1rem 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
  background: ${({ $variant }) => ($variant === 'secondary' ? '#e5e7eb' : '#2563eb')};
  color: ${({ $variant }) => ($variant === 'secondary' ? '#1f2937' : '#ffffff')};
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.875rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ $variant }) => ($variant === 'secondary' ? '#d1d5db' : '#1e40af')};
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  width: min(1000px, calc(100vw - 2rem));
  max-height: calc(100vh - 4rem);
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const Badge = styled.span<{ $tone: 'warning' | 'success' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $tone }) => ($tone === 'warning' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)')};
  color: ${({ $tone }) => ($tone === 'warning' ? '#92400e' : '#065f46')};
  margin-top: 0.5rem;
`;

const ScrollArea = styled.pre`
  margin: 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  font-family: 'Fira Code', 'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  max-height: 18rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const DiffSummary = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const DiffItem = styled.div<{ $change: 'added' | 'removed' | 'mismatch' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: ${({ $change }) => 
    $change === 'added' ? 'rgba(16, 185, 129, 0.1)' :
    $change === 'removed' ? 'rgba(239, 68, 68, 0.1)' :
    'rgba(251, 191, 36, 0.1)'
  };
  margin-bottom: 0.5rem;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DiffPath = styled.span`
  font-weight: 600;
  color: #374151;
  min-width: 120px;
  flex-shrink: 0;
`;

const DiffValue = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  color: #6b7280;
  flex: 1;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  line-height: 1.2;
  max-height: 3.6rem;
  overflow-y: auto;
`;

const DiffChange = styled.span<{ $change: 'added' | 'removed' | 'mismatch' }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: ${({ $change }) => 
    $change === 'added' ? 'rgba(16, 185, 129, 0.2)' :
    $change === 'removed' ? 'rgba(239, 68, 68, 0.2)' :
    'rgba(251, 191, 36, 0.2)'
  };
  color: ${({ $change }) => 
    $change === 'added' ? '#065f46' :
    $change === 'removed' ? '#991b1b' :
    '#92400e'
  };
  white-space: nowrap;
  flex-shrink: 0;
`;

interface Props {
  formData: Record<string, unknown>;
  selectedAppType?: string;
  workerToken: string;
  environmentId: string;
  region?: string;
  isCreating?: boolean;
  onCreateApplication?: (appData?: { name: string; description: string }) => void;
  onImportConfig?: (config: Record<string, unknown>) => void;
  onGenerateWorkerToken?: () => void;
}

export const ConfigCheckerButtons: React.FC<Props> = ({ 
  formData, 
  selectedAppType = 'OIDC_WEB_APP',
  workerToken, 
  environmentId, 
  region = 'NA',
  isCreating = false,
  onCreateApplication,
  onImportConfig,
  onGenerateWorkerToken
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'check' | 'create' | null>(null);
  const [diffs, setDiffs] = useState<ConfigDiffResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
  const [showCreationResultModal, setShowCreationResultModal] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [createFormData, setCreateFormData] = useState(() => {
    // Generate default app name with PingOne and flow type
    const generateDefaultAppName = (appType: string) => {
      // Map app types to flow types
      const flowTypeMap: Record<string, string> = {
        'OIDC_WEB_APP': 'authorization-code',
        'OIDC_NATIVE_APP': 'authorization-code',
        'SINGLE_PAGE_APP': 'implicit',
        'WORKER': 'client-credentials',
        'SERVICE': 'client-credentials',
      };
      
      const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
      const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
      return `pingone-${flowName}-${uniqueId}`;
    };

    // Generate redirect URI with same unique ID as app name
    const generateRedirectUri = (appType: string) => {
      const flowTypeMap: Record<string, string> = {
        'OIDC_WEB_APP': 'authorization-code',
        'OIDC_NATIVE_APP': 'authorization-code',
        'SINGLE_PAGE_APP': 'implicit',
        'WORKER': 'client-credentials',
        'SERVICE': 'client-credentials',
      };
      
      const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
      const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
      return `https://localhost:3000/callback/${flowName}-${uniqueId}`;
    };

    return {
      name: generateDefaultAppName(selectedAppType), // Always generate new unique name
      description: `Created via OAuth Playground - ${selectedAppType}`,
      redirectUri: formData.redirectUri as string || generateRedirectUri(selectedAppType),
      tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as string || 'client_secret_basic',
      responseTypes: formData.responseTypes as string[] || ['code'],
      grantTypes: formData.grantTypes as string[] || ['authorization_code'],
    };
  });

  const comparisonService = useMemo(() => 
    new ConfigComparisonService(workerToken, environmentId, region), 
    [workerToken, environmentId, region]
  );

  // Get allowed token auth methods for the selected app type
  const getAllowedTokenAuthMethods = (appType: string) => {
    switch (appType) {
      case 'OIDC_WEB_APP':
        return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'none'];
      case 'OIDC_NATIVE_APP':
        return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'none'];
      case 'SINGLE_PAGE_APP':
        return ['none']; // SPA only supports 'none'
      case 'WORKER':
        return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
      case 'SERVICE':
        return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
      // Handle Implicit flow cases
      case 'implicit-oauth-v7':
      case 'implicit-oidc-v7':
        return ['none']; // Implicit flow only supports 'none'
      default:
        return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'none'];
    }
  };

  // Get allowed response types for the selected app type
  const getAllowedResponseTypes = (appType: string) => {
    switch (appType) {
      case 'OIDC_WEB_APP':
        return ['code', 'id_token']; // Authorization Code flow
      case 'OIDC_NATIVE_APP':
        return ['code', 'id_token']; // Authorization Code flow
      case 'SINGLE_PAGE_APP':
        return ['token', 'id_token']; // Implicit flow
      case 'WORKER':
        return []; // No response types for worker apps
      case 'SERVICE':
        return []; // No response types for service apps
      default:
        return ['code', 'token', 'id_token'];
    }
  };

  // Get allowed grant types for the selected app type
  const getAllowedGrantTypes = (appType: string) => {
    switch (appType) {
      case 'OIDC_WEB_APP':
        return ['authorization_code', 'refresh_token']; // Authorization Code flow
      case 'OIDC_NATIVE_APP':
        return ['authorization_code', 'refresh_token']; // Authorization Code flow
      case 'SINGLE_PAGE_APP':
        return ['implicit']; // Implicit flow
      case 'WORKER':
        return ['client_credentials']; // Client Credentials flow
      case 'SERVICE':
        return ['client_credentials']; // Client Credentials flow
      default:
        return ['authorization_code', 'implicit', 'client_credentials', 'refresh_token'];
    }
  };

  const allowedTokenAuthMethods = getAllowedTokenAuthMethods(selectedAppType);
  const shouldShowTokenAuthSelector = allowedTokenAuthMethods.length > 1;

  const handleCheck = async () => {
    const clientId = formData.clientId as string;
    if (!clientId) {
      v4ToastManager.showError('Enter a client ID before checking.');
      return;
    }

    // Debug: Check if worker token is present
    console.log('[CONFIG-CHECKER] Worker token present:', !!workerToken);
    console.log('[CONFIG-CHECKER] Worker token length:', workerToken?.length || 0);
    console.log('[CONFIG-CHECKER] Worker token (first 50 chars):', workerToken?.substring(0, 50) + '...');

    setLoading('check');
    logger.info('CONFIG-CHECKER', 'Starting configuration check', { 
      clientId, 
      selectedAppType,
      hasWorkerToken: !!workerToken,
      workerTokenLength: workerToken?.length || 0
    });

    try {
      const startTime = Date.now();
      const result = await comparisonService.compare(clientId, formData);
      const elapsed = Date.now() - startTime;

      setDiffs(result);
      setOpen(true);

      if (!result.hasDiffs) {
        v4ToastManager.showSuccess('No differences detected.');
        logger.info('CONFIG-CHECKER', 'Configuration check completed - no differences', { 
          clientId, 
          selectedAppType, 
          elapsed 
        });
      } else {
        logger.info('CONFIG-CHECKER', 'Configuration check completed - differences found', { 
          clientId, 
          selectedAppType, 
          elapsed,
          diffCount: result.diffs.length
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for specific authentication errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        // Clear expired token from localStorage
        console.log('[CONFIG-CHECKER] Clearing expired worker token from localStorage');
        localStorage.removeItem('worker_token');
        localStorage.removeItem('worker_token_expires_at');
        
        // Show both toast and modal for authentication errors
        v4ToastManager.showError(
          'Worker token expired. Please generate a new worker token.',
          { duration: 8000 }
        );
        setShowAuthErrorModal(true);
        logger.error('CONFIG-CHECKER', 'Authentication failed - worker token expired or invalid', { 
          clientId, 
          selectedAppType, 
          error: errorMessage 
        });
      } else if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
        v4ToastManager.showError(
          'Network error. Please check your connection and try again.',
          { duration: 6000 }
        );
        logger.error('CONFIG-CHECKER', 'CORS/Network error', { 
          clientId, 
          selectedAppType, 
          error: errorMessage 
        });
      } else {
        v4ToastManager.showError(`Configuration check failed: ${errorMessage}`);
        logger.error('CONFIG-CHECKER', 'Configuration check failed', { 
          clientId, 
          selectedAppType, 
          error: errorMessage 
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const handleCreate = () => {
    if (!onCreateApplication) {
      v4ToastManager.showError('Application creation not available.');
      return;
    }

    // Show the create modal instead of directly creating
    setShowCreateModal(true);
  };

  const handleCreateConfirm = async () => {
    if (!onCreateApplication) {
      v4ToastManager.showError('Application creation not available.');
      return;
    }

    setLoading('create');
    setShowCreateModal(false);
    logger.info('CONFIG-CHECKER', 'Starting application creation', { selectedAppType, createFormData });

    try {
      const startTime = Date.now();
      
      // Pass the form data to the application creation handler
      const result = await onCreateApplication(createFormData);
      
      const elapsed = Date.now() - startTime;
      logger.info('CONFIG-CHECKER', 'Application creation completed', { 
        selectedAppType, 
        elapsed 
      });
      
      // Show creation result modal if successful
      if (result && result.success) {
        setCreationResult(result);
        setShowCreationResultModal(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      v4ToastManager.showError(`Application creation failed: ${errorMessage}`);
      logger.error('CONFIG-CHECKER', 'Application creation failed', { 
        selectedAppType, 
        error: errorMessage 
      });
    } finally {
      setLoading(null);
    }
  };

  const handleImportConfig = () => {
    if (!diffs || !onImportConfig) return;
    
    // Convert PingOne config back to flow format
    const importedConfig = {
      clientId: formData.clientId,
      environmentId: formData.environmentId,
      redirectUri: Array.isArray(diffs.normalizedRemote.redirectUris) 
        ? diffs.normalizedRemote.redirectUris[0] 
        : formData.redirectUri,
      scopes: Array.isArray(diffs.normalizedRemote.scopes) 
        ? diffs.normalizedRemote.scopes.join(' ') 
        : formData.scopes,
      tokenEndpointAuthMethod: diffs.normalizedRemote.tokenEndpointAuthMethod || formData.tokenEndpointAuthMethod,
    };
    
    onImportConfig(importedConfig);
    v4ToastManager.showSuccess('Configuration imported successfully!');
    setOpen(false);
  };

  const handleUpdateConfig = async () => {
    if (!diffs || !diffs.hasDiffs) return;
    
    setIsUpdating(true);
    
    try {
      // Initialize the service
      pingOneAppCreationService.initialize(workerToken, environmentId, region);
      
      // Get the application ID from the comparison result
      // We need to find the app ID from the client ID
      const clientId = formData.clientId as string;
      if (!clientId) {
        v4ToastManager.showError('Client ID is required to update configuration');
        return;
      }

      // Get applications to find the app ID
      const applications = await pingOneAppCreationService.getApplications();
      const app = applications.find((app: any) => app.clientId === clientId);
      
      if (!app) {
        v4ToastManager.showError('Application not found in PingOne');
        return;
      }

      // Prepare update payload with the desired configuration
      const updatePayload = {
        name: formData.name || app.name,
        description: formData.description || app.description,
        redirectUris: formData.redirectUris || [],
        postLogoutRedirectUris: formData.postLogoutRedirectUris || [],
        grantTypes: formData.grantTypes || [],
        responseTypes: formData.responseTypes || [],
        tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod || 'client_secret_basic',
        scopes: formData.scopes || [],
        pkceEnforcement: formData.pkceEnforcement || 'OPTIONAL',
        accessTokenValiditySeconds: formData.accessTokenValiditySeconds || 3600,
        refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds || 2592000,
        idTokenValiditySeconds: formData.idTokenValiditySeconds || 3600,
      };

      console.log('[CONFIG-CHECKER] Updating application with payload:', updatePayload);

      const result = await pingOneAppCreationService.updateApplication(app.id, updatePayload);
      
      if (result.success) {
        v4ToastManager.showSuccess('PingOne application updated successfully!');
        setOpen(false);
        setDiffs(null);
      } else {
        v4ToastManager.showError(`Failed to update application: ${result.error}`);
      }
    } catch (error) {
      console.error('[CONFIG-CHECKER] Failed to update application:', error);
      v4ToastManager.showError(`Failed to update application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setDiffs(null);
  };

  const copyToClipboard = async () => {
    if (!diffs) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(diffs, null, 2));
      v4ToastManager.showSuccess('Configuration differences copied to clipboard');
    } catch (error) {
      v4ToastManager.showError('Failed to copy to clipboard');
    }
  };

  return (
    <>
      <ConfigCheckerHeader>
        <ConfigCheckerTitle>
          <FiAlertTriangle size={20} />
          PingOne Configuration Checker
        </ConfigCheckerTitle>
        <ConfigCheckerDescription>
          <strong>Check Config:</strong> Compare your current flow settings with existing PingOne applications to identify differences.
          <br />
          <strong>Create App:</strong> Automatically create a new PingOne application with your current configuration.
        </ConfigCheckerDescription>
      </ConfigCheckerHeader>

      <ActionBar>
        <Button 
          onClick={handleCheck} 
          disabled={!workerToken || loading !== null || isCreating}
          style={{
            background: '#3b82f6', // Blue background
            color: 'white',         // White text
            border: '1px solid #3b82f6',
            fontWeight: '600'
          }}
        >
          {loading === 'check' && <FiLoader className="spinner" />}
          Check Config
        </Button>
        <Button 
          onClick={handleCreate} 
          disabled={loading !== null || isCreating}
          style={{
            background: '#22c55e', // Green background
            color: 'white',         // White text
            border: '1px solid #22c55e',
            fontWeight: '600'
          }}
        >
          {loading === 'create' && <FiLoader className="spinner" />}
          Create App
        </Button>
        <Button 
          onClick={() => {
            if (onGenerateWorkerToken) {
              onGenerateWorkerToken();
            } else {
              v4ToastManager.showInfo('Please go to the Client Generator to create a new worker token.');
            }
          }}
          style={{
            background: '#f59e0b', // Orange background
            color: 'white',         // White text
            border: '1px solid #f59e0b',
            fontWeight: '600'
          }}
        >
          <FiKey />
          Get New Worker Token
        </Button>
      </ActionBar>

      {open && (
        <ModalBackdrop role="dialog" aria-modal="true" aria-labelledby="config-checker-title">
          <ModalContent>
            <ModalHeader>
              <div>
                <ModalTitle id="config-checker-title">PingOne Configuration Differences</ModalTitle>
                {diffs && (
                  <Badge $tone={diffs.hasDiffs ? 'warning' : 'success'}>
                    {diffs.hasDiffs ? <FiAlertTriangle /> : <FiCheckCircle />}
                    {diffs.hasDiffs ? 'Differences detected' : 'No differences'}
                  </Badge>
                )}
              </div>
              <CloseButton onClick={closeModal} aria-label="Close modal">
                <FiX size={20} />
              </CloseButton>
            </ModalHeader>

            {/* Client ID Display */}
            {formData.clientId && (
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '1px solid #cbd5e1',
                borderRadius: '0.75rem',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.25rem'
                }}>
                  🔑
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    PingOne Client ID
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    wordBreak: 'break-all'
                  }}>
                    {formData.clientId}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(formData.clientId));
                    v4ToastManager.showSuccess('Client ID copied to clipboard');
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}
                >
                  <FiCopy size={14} />
                  Copy
                </button>
              </div>
            )}

            {diffs && diffs.hasDiffs && (
              <DiffSummary>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  Summary of Differences:
                </h4>
                {diffs.diffs.map((diff, index) => (
                  <DiffItem key={index} $change={diff.change}>
                    <DiffPath>{diff.path}</DiffPath>
                    <DiffValue>
                      {diff.change === 'added' && (
                        <>
                          <P1Logo size={14} />
                          PingOne: {formatCompactJson(diff.expected)}
                        </>
                      )}
                      {diff.change === 'removed' && (
                        <>
                          <FiMonitor size={14} style={{ marginRight: '4px', color: '#2563eb' }} />
                          Our App: {formatCompactJson(diff.actual)}
                        </>
                      )}
                      {diff.change === 'mismatch' && (
                        <>
                          <P1Logo size={14} />
                          PingOne: {formatCompactJson(diff.expected)}<br />
                          <FiMonitor size={14} style={{ marginRight: '4px', color: '#2563eb' }} />
                          Our App: {formatCompactJson(diff.actual)}
                        </>
                      )}
                    </DiffValue>
                    <DiffChange $change={diff.change}>
                      {diff.change === 'mismatch' ? 'Mismatch' : diff.change}
                    </DiffChange>
                  </DiffItem>
                ))}
              </DiffSummary>
            )}

            {diffs && (
              <ScrollArea>{JSON.stringify(diffs, null, 2)}</ScrollArea>
            )}

            <ModalFooter>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  onClick={copyToClipboard}
                  disabled={!diffs}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: '1px solid #3b82f6',
                    fontWeight: '600'
                  }}
                >
                  <FiCopy /> Copy JSON
                </Button>
                {onImportConfig && diffs && (
                  <Button
                    onClick={handleImportConfig}
                    disabled={!diffs}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: '1px solid #10b981',
                      fontWeight: '600'
                    }}
                  >
                    <FiDownload /> Import Config
                  </Button>
                )}
                {diffs && diffs.hasDiffs && (
                  <Button
                    onClick={handleUpdateConfig}
                    disabled={isUpdating}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: '1px solid #f59e0b',
                      fontWeight: '600'
                    }}
                  >
                    {isUpdating && <FiLoader className="spinner" />}
                    <FiSave /> Update PingOne Config
                  </Button>
                )}
              </div>
              <Button 
                onClick={closeModal}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: '1px solid #6b7280',
                  fontWeight: '600'
                }}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalBackdrop>
      )}

      {/* Create Application Modal */}
      {showCreateModal && (
        <ModalBackdrop onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Create PingOne Application</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <FiX />
              </button>
            </ModalHeader>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Application Name *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter application name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Description
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter application description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Redirect URI *
                </label>
                <input
                  type="url"
                  value={createFormData.redirectUri}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, redirectUri: e.target.value }))}
                  placeholder="http://localhost:3000/callback"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {shouldShowTokenAuthSelector && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Token Endpoint Authentication Method
                  </label>
                  <select
                    value={createFormData.tokenEndpointAuthMethod}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, tokenEndpointAuthMethod: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      background: 'white',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    {allowedTokenAuthMethods.map((method) => (
                      <option key={method} value={method}>
                        {method === 'client_secret_basic' && 'Client Secret Basic'}
                        {method === 'client_secret_post' && 'Client Secret Post'}
                        {method === 'client_secret_jwt' && 'Client Secret JWT'}
                        {method === 'private_key_jwt' && 'Private Key JWT'}
                        {method === 'none' && 'None (Public Client)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!shouldShowTokenAuthSelector && (
                <div style={{ 
                  background: '#f0f9ff', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #bae6fd',
                  fontSize: '0.875rem',
                  color: '#0c4a6e'
                }}>
                  <strong>Token Authentication:</strong> {selectedAppType === 'SINGLE_PAGE_APP' ? 'None (Public Client)' : 'Client Secret Basic'}
                  <br/>
                  <em>This app type only supports one authentication method.</em>
                </div>
              )}

              {/* OIDC Settings Section */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginTop: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    OIDC Settings
                  </h4>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Configure OIDC settings for the application
                  </span>
                </div>

                {/* Response Types */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Response Type
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {['code', 'token', 'id_token'].map((type) => {
                      const isAllowed = getAllowedResponseTypes(selectedAppType).includes(type);
                      return (
                        <label key={type} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          background: isAllowed ? 'white' : '#f3f4f6',
                          border: isAllowed ? '1px solid #d1d5db' : '1px solid #e5e7eb',
                          cursor: isAllowed ? 'pointer' : 'not-allowed',
                          opacity: isAllowed ? 1 : 0.5
                        }}>
                          <input
                            type="checkbox"
                            checked={createFormData.responseTypes.includes(type)}
                            onChange={(e) => {
                              if (!isAllowed) return;
                              const newResponseTypes = e.target.checked
                                ? [...createFormData.responseTypes, type]
                                : createFormData.responseTypes.filter(t => t !== type);
                              setCreateFormData(prev => ({ ...prev, responseTypes: newResponseTypes }));
                            }}
                            disabled={!isAllowed}
                            style={{ margin: 0 }}
                          />
                          <span style={{ 
                            textTransform: 'capitalize',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {type === 'id_token' ? 'ID Token' : type}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Grant Types */}
                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.75rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Grant Type
                    <span style={{ 
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      cursor: 'help'
                    }}>?</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {['authorization_code', 'implicit', 'client_credentials', 'device_authorization', 'refresh_token'].map((type) => {
                      const isAllowed = getAllowedGrantTypes(selectedAppType).includes(type);
                      return (
                        <label key={type} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          background: isAllowed ? 'white' : '#f3f4f6',
                          border: isAllowed ? '1px solid #d1d5db' : '1px solid #e5e7eb',
                          cursor: isAllowed ? 'pointer' : 'not-allowed',
                          opacity: isAllowed ? 1 : 0.5
                        }}>
                          <input
                            type="checkbox"
                            checked={createFormData.grantTypes.includes(type)}
                            onChange={(e) => {
                              if (!isAllowed) return;
                              const newGrantTypes = e.target.checked
                                ? [...createFormData.grantTypes, type]
                                : createFormData.grantTypes.filter(t => t !== type);
                              setCreateFormData(prev => ({ ...prev, grantTypes: newGrantTypes }));
                            }}
                            disabled={!isAllowed}
                            style={{ margin: 0 }}
                          />
                          <span style={{ 
                            textTransform: 'capitalize',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {type.replace('_', ' ')}
                          </span>
                          {type === 'device_authorization' && (
                            <span style={{ 
                              background: '#f3f4f6',
                              color: '#6b7280',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              cursor: 'help'
                            }}>?</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                <strong>Application Type:</strong> {selectedAppType}<br/>
                <strong>Client ID:</strong> {formData.clientId}<br/>
                <strong>Environment:</strong> {environmentId}
              </div>
            </div>

            <ModalFooter>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  onClick={handleCreateConfirm}
                  disabled={!createFormData.name.trim() || !createFormData.redirectUri.trim() || loading === 'create'}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: '1px solid #22c55e',
                    fontWeight: '600'
                  }}
                >
                  {loading === 'create' && <FiLoader className="spinner" />}
                  <FiSave /> Create Application
                </Button>
                <Button
                  $variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading === 'create'}
                >
                  Cancel
                </Button>
              </div>
            </ModalFooter>
          </ModalContent>
        </ModalBackdrop>
      )}

      {/* Authentication Error Modal */}
      {showAuthErrorModal && (
        <ModalBackdrop onClick={() => setShowAuthErrorModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: '#dc2626',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.25rem'
                }}>
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                    Authentication Failed
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Worker token is invalid or expired
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAuthErrorModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}
              >
                <FiX size={20} />
              </button>
            </ModalHeader>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                color: '#991b1b'
              }}>
                <strong>What happened?</strong><br/>
                Your worker token has expired or is invalid. The Config Checker needs a valid worker token to access PingOne's Management API.
              </div>
              
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem',
                padding: '1rem',
                color: '#0c4a6e'
              }}>
                <strong>How to fix:</strong><br/>
                1. Go to the <strong>Client Generator</strong> or use the <strong>Worker Token Modal</strong><br/>
                2. Generate a new worker token with appropriate scopes<br/>
                3. Return here and try the Config Checker again
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'flex-end',
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowAuthErrorModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAuthErrorModal(false);
                  if (onGenerateWorkerToken) {
                    onGenerateWorkerToken();
                  } else {
                    // Fallback: Show instructions to go to Client Generator
                    v4ToastManager.showInfo('Please go to the Client Generator to create a new worker token.');
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <FiKey style={{ marginRight: '0.5rem' }} />
                Generate Worker Token
              </button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}

      {/* Application Creation Result Modal */}
      {showCreationResultModal && creationResult && (
        <ModalBackdrop onClick={() => setShowCreationResultModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.25rem'
                }}>
                  ✅
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                    Application Created Successfully
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Your PingOne application has been created
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreationResultModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: '#6b7280'
                }}
              >
                <FiX size={20} />
              </button>
            </ModalHeader>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Application Details */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#0c4a6e' }}>
                  Application Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Name:</span>
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>{creationResult.app?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Type:</span>
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>{creationResult.app?.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Client ID:</span>
                    <span style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}>{creationResult.app?.clientId}</span>
                  </div>
                  {creationResult.app?.clientSecret && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Client Secret:</span>
                      <span style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}>
                        {creationResult.app.clientSecret.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '0.5rem',
                padding: '1rem',
                color: '#92400e'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Next Steps
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.875rem' }}>
                  <li>Your credentials have been automatically updated</li>
                  <li>You can now use the "Check Config" button to verify settings</li>
                  <li>Test your application with the OAuth flows</li>
                </ul>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowCreationResultModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCreationResultModal(false);
                  // Copy client ID to clipboard
                  if (creationResult.app?.clientId) {
                    navigator.clipboard.writeText(creationResult.app.clientId);
                    v4ToastManager.showSuccess('Client ID copied to clipboard!');
                  }
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <FiCopy style={{ marginRight: '0.5rem' }} />
                Copy Client ID
              </button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}
    </>
  );
};
