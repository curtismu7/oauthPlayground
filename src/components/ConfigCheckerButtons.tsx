// src/components/ConfigCheckerButtons.tsx
// Config Checker component for comparing form data against live PingOne applications

import React, { useMemo, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiCheckCircle, FiCopy, FiDownload, FiLoader, FiX, FiSave, FiKey, FiMonitor, FiMinimize2, FiMaximize2, FiMove } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { pingOneAppCreationService } from '../services/pingOneAppCreationService';
import { ConfigComparisonService, ConfigDiffResult } from '../services/configComparisonService';
import { logger } from '../utils/logger';
import { DraggableModal } from './DraggableModal';

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

const ModalContent = styled.div<{ $isMinimized: boolean; $position: { x: number; y: number }; $isDragging: boolean }>`
  width: ${props => props.$isMinimized ? '300px' : 'min(1000px, calc(100vw - 2rem))'};
  max-height: ${props => props.$isMinimized ? 'auto' : 'calc(100vh - 4rem)'};
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  padding: ${props => props.$isMinimized ? '0.75rem' : '1.5rem'};
  display: flex;
  flex-direction: column;
  gap: ${props => props.$isMinimized ? '0.5rem' : '1.25rem'};
  overflow: hidden;
  position: ${props => props.$isMinimized ? 'fixed' : 'relative'};
  top: ${props => props.$isMinimized ? `${props.$position.y}px` : 'auto'};
  left: ${props => props.$isMinimized ? `${props.$position.x}px` : 'auto'};
  cursor: ${props => props.$isDragging ? 'grabbing' : 'default'};
  transition: ${props => props.$isDragging ? 'none' : 'all 0.2s ease'};
  z-index: 1001;
`;

const ModalHeader = styled.div<{ $isMinimized: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #cbd5e1;
  margin: ${props => props.$isMinimized ? '-0.75rem -0.75rem 0.5rem -0.75rem' : '-1.5rem -1.5rem 1.25rem -1.5rem'};
  padding: ${props => props.$isMinimized ? '0.75rem' : '1.5rem'};
  border-radius: ${props => props.$isMinimized ? '0.75rem' : '0.75rem 0.75rem 0 0'};
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: grab;
  user-select: none;
  flex: 1;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f1f5f9;
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  
  &:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
  
  &:active {
    transform: scale(0.95);
  }
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
  padding: 0.375rem;
  margin-bottom: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  @media (max-width: 768px) {
    max-height: 150px;
    padding: 0.375rem;
  }
  
  @media (max-width: 480px) {
    max-height: 120px;
    padding: 0.375rem;
  }
`;

const DiffItem = styled.div<{ $change: 'added' | 'removed' | 'mismatch' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.375rem;
  border-radius: 0.375rem;
  background: ${({ $change }) => 
    $change === 'added' ? 'rgba(16, 185, 129, 0.1)' :
    $change === 'removed' ? 'rgba(239, 68, 68, 0.1)' :
    'rgba(251, 191, 36, 0.1)'
  };
  margin-bottom: 0.375rem;
  overflow: hidden;
  border: 1px solid ${({ $change }) => 
    $change === 'added' ? 'rgba(16, 185, 129, 0.2)' :
    $change === 'removed' ? 'rgba(239, 68, 68, 0.2)' :
    'rgba(251, 191, 36, 0.2)'
  };

  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const DiffContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DiffLabel = styled.div`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const DiffSource = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const DiffValue = styled.div<{ $isRedirectUri?: boolean }>`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.375rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.7rem;
  color: #374151;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  word-break: break-all;
  max-height: ${props => props.$isRedirectUri ? 'none' : '60px'};
  overflow-y: ${props => props.$isRedirectUri ? 'visible' : 'auto'};
  
  &::-webkit-scrollbar {
    height: 3px;
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const DiffPath = styled.span`
  font-weight: 600;
  color: #374151;
  min-width: 120px;
  flex-shrink: 0;
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
  const [loading, setLoading] = useState<'check' | 'create' | 'refresh' | null>(null);
  const [diffs, setDiffs] = useState<ConfigDiffResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
  const [showCreationResultModal, setShowCreationResultModal] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number | null>(null);
  const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(new Set());
  const [isJsonCollapsed, setIsJsonCollapsed] = useState(true);
  const [refreshWorkerToken, setRefreshWorkerToken] = useState(false);
  const [hasUsedTokenRefresh, setHasUsedTokenRefresh] = useState(false);
  const [createFormData, setCreateFormData] = useState(() => {
    // Generate default app name with PingOne and flow type
    const generateDefaultAppName = (appType: string | null | undefined) => {
      // Handle null/undefined appType
      if (!appType) {
        const uniqueId = Math.floor(Math.random() * 900) + 100;
        return `pingone-app-${uniqueId}`;
      }
      
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
    const generateRedirectUri = (appType: string | null | undefined) => {
      // Handle null/undefined appType
      if (!appType) {
        const uniqueId = Math.floor(Math.random() * 900) + 100;
        return `https://localhost:3000/callback/app-${uniqueId}`;
      }
      
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

  // Map selectedAppType to flow type for comparison service
  const flowTypeForComparison = useMemo(() => {
    // Map app types to flow types
    const appTypeToFlowType: Record<string, string> = {
      'WORKER': 'client-credentials',
      'OIDC_WEB_APP': 'authorization-code',
      'SINGLE_PAGE_APP': 'implicit',
      'NATIVE_APP': 'authorization-code',
      'SERVICE': 'client-credentials',
    };
    
    // Try to extract flow type from formData or selectedAppType
    const grantTypes = formData.grantTypes as string[] | undefined;
    
    console.log('[CONFIG-CHECKER] Determining flow type for comparison:', {
      selectedAppType,
      grantTypes,
      formDataGrantTypes: formData.grantTypes
    });
    
    // If grant types include client_credentials, it's a client credentials flow
    if (grantTypes && grantTypes.some(gt => gt.toLowerCase() === 'client_credentials')) {
      console.log('[CONFIG-CHECKER] Detected client-credentials flow');
      return 'client-credentials';
    }
    
    // Check if this is a hybrid flow (has both authorization_code and implicit)
    if (grantTypes && grantTypes.some(gt => gt.toLowerCase() === 'authorization_code') && 
        grantTypes.some(gt => gt.toLowerCase() === 'implicit')) {
      console.log('[CONFIG-CHECKER] Detected hybrid flow (authorization_code + implicit)');
      return 'hybrid';
    }
    
    // Otherwise, use the app type mapping
    const result = appTypeToFlowType[selectedAppType || ''] || selectedAppType;
    console.log('[CONFIG-CHECKER] Using app type mapping result:', result);
    return result;
  }, [selectedAppType, formData.grantTypes]);
  
  const comparisonService = useMemo(() => {
    console.log('[CONFIG-CHECKER] Creating ConfigComparisonService with:', {
      workerToken: workerToken ? `${workerToken.substring(0, 20)}...` : 'undefined',
      environmentId,
      region,
      clientId: formData.clientId,
      clientSecret: formData.clientSecret ? `${formData.clientSecret.substring(0, 10)}...` : 'undefined',
      flowType: flowTypeForComparison
    });
    
    // Use the application's clientId and clientSecret from formData (which now contains application credentials)
    const applicationClientId = formData.clientId as string;
    const applicationClientSecret = formData.clientSecret as string;
    
    console.log('[CONFIG-CHECKER] Using application credentials for comparison:', {
      applicationClientId: applicationClientId ? `${applicationClientId.substring(0, 10)}...` : 'undefined',
      applicationClientSecret: applicationClientSecret ? `${applicationClientSecret.substring(0, 10)}...` : 'undefined',
      workerToken: workerToken ? `${workerToken.substring(0, 20)}...` : 'undefined'
    });
    
    return new ConfigComparisonService(workerToken, environmentId, region, applicationClientId, applicationClientSecret, flowTypeForComparison);
  }, [workerToken, environmentId, region, formData.clientId, formData.clientSecret, flowTypeForComparison]);

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
  
  // Determine if the flow type needs redirect URIs
  const flowNeedsRedirectUri = useMemo(() => {
    // Check selectedAppType
    if (selectedAppType === 'WORKER' || selectedAppType === 'SERVICE') {
      return false;
    }
    
    // Check grant types in formData
    const grantTypes = formData.grantTypes as string[] | undefined;
    if (grantTypes) {
      const hasClientCredentials = grantTypes.some(gt => 
        gt.toLowerCase() === 'client_credentials'
      );
      const hasROPC = grantTypes.some(gt => 
        gt.toLowerCase().includes('password')
      );
      if (hasClientCredentials && !hasROPC) {
        return false;
      }
    }
    
    return true;
  }, [selectedAppType, formData.grantTypes]);

  // Toggle selection of a specific diff
  const toggleDiffSelection = (path: string) => {
    setSelectedDiffs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  // Select all diffs
  const selectAllDiffs = () => {
    if (diffs) {
      setSelectedDiffs(new Set(diffs.diffs.map(diff => diff.path)));
    }
  };
  
  // Deselect all diffs
  const deselectAllDiffs = () => {
    setSelectedDiffs(new Set());
  };

  // Handle refresh - force a new check from PingOne
  const handleRefresh = async () => {
    setLoading('refresh');
    setLastCheckTime(null); // Clear last check time to force fresh data
    v4ToastManager.showInfo('Refreshing configuration from PingOne...');
    
    // Wait a moment to ensure the message is seen
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger a new check
    setLoading('check');
    await handleCheck();
  };

  const handleCheck = async () => {
    const clientId = formData.clientId as string;
    if (!clientId) {
      v4ToastManager.showError('Enter a client ID before checking.');
      return;
    }

    // Handle worker token refresh if requested and not already used
    if (refreshWorkerToken && !hasUsedTokenRefresh && onGenerateWorkerToken) {
      console.log('[CONFIG-CHECKER] Refreshing worker token before config check...');
      setHasUsedTokenRefresh(true); // Mark as used to prevent multiple refreshes
      setRefreshWorkerToken(false); // Uncheck the checkbox
      
      try {
        // Call the worker token generation function
        onGenerateWorkerToken();
        v4ToastManager.showInfo('Worker token refreshed! Proceeding with config check...');
        
        // Wait a moment for the token to be generated
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('[CONFIG-CHECKER] Failed to refresh worker token:', error);
        v4ToastManager.showError('Failed to refresh worker token. Proceeding with existing token...');
      }
    }

    // Debug: Check if worker token is present
    console.log('[CONFIG-CHECKER] Worker token present:', !!workerToken);
    console.log('[CONFIG-CHECKER] Worker token length:', workerToken?.length || 0);
    console.log('[CONFIG-CHECKER] Worker token (first 50 chars):', workerToken?.substring(0, 50) + '...');
    
    // Debug: Check credentials being passed to ConfigComparisonService
    console.log('[CONFIG-CHECKER] Credentials being passed:', {
      clientId: formData.clientId,
      clientSecret: formData.clientSecret ? `${formData.clientSecret.substring(0, 10)}...` : 'undefined',
      environmentId,
      region
    });

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
      setLastCheckTime(Date.now());
      
      // Initialize all diffs as selected by default
      setSelectedDiffs(new Set(result.diffs.map(diff => diff.path)));

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

    // Generate app name with PingOne and flow type
    const generateDefaultAppName = (appType: string, grantTypes?: string[]) => {
      // Map app types to flow types
      const flowTypeMap: Record<string, string> = {
        'OIDC_WEB_APP': 'authorization-code',
        'OIDC_NATIVE_APP': 'authorization-code',
        'SINGLE_PAGE_APP': 'implicit',
        'WORKER': 'client-credentials',
        'SERVICE': 'client-credentials',
      };
      
      // Check grant types to override if necessary
      if (grantTypes) {
        if (grantTypes.some(gt => gt.toLowerCase() === 'client_credentials')) {
          const uniqueId = Math.floor(Math.random() * 900) + 100;
          return `pingone-client-credentials-${uniqueId}`;
        }
      }
      
      const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
      const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
      return `pingone-${flowName}-${uniqueId}`;
    };

    // Generate redirect URI with same pattern
    const generateRedirectUri = (appType: string, grantTypes?: string[]) => {
      const flowTypeMap: Record<string, string> = {
        'OIDC_WEB_APP': 'authorization-code',
        'OIDC_NATIVE_APP': 'authorization-code',
        'SINGLE_PAGE_APP': 'implicit',
        'WORKER': 'client-credentials',
        'SERVICE': 'client-credentials',
      };
      
      // Check grant types to override if necessary
      if (grantTypes) {
        if (grantTypes.some(gt => gt.toLowerCase() === 'client_credentials')) {
          const uniqueId = Math.floor(Math.random() * 900) + 100;
          return `https://localhost:3000/callback/client-credentials-${uniqueId}`;
        }
      }
      
      const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
      const uniqueId = Math.floor(Math.random() * 900) + 100;
      return `https://localhost:3000/callback/${flowName}-${uniqueId}`;
    };

    // Regenerate form data with current selectedAppType and grantTypes
    const grantTypes = formData.grantTypes as string[] | undefined;
    setCreateFormData({
      name: generateDefaultAppName(selectedAppType, grantTypes),
      description: `Created via OAuth Playground - ${selectedAppType}`,
      redirectUri: formData.redirectUri as string || generateRedirectUri(selectedAppType, grantTypes),
      tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as string || 'client_secret_basic',
      responseTypes: formData.responseTypes as string[] || ['code'],
      grantTypes: grantTypes || ['authorization_code'],
    });

    // Show the create modal
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
    
    // Check if any fields are selected
    if (selectedDiffs.size === 0) {
      v4ToastManager.showWarning('Please select at least one field to update');
      return;
    }
    
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

      // Prepare update payload with ONLY SELECTED fields
      const updatePayload: Record<string, unknown> = {};
      
      // Only include SAFE fields that are selected by the user
      // Limited to: redirectUris, tokenEndpointAuthMethod, and scopes (resources)
      if (selectedDiffs.has('redirectUris') && flowNeedsRedirectUri) {
        updatePayload.redirectUris = formData.redirectUris || [];
      }
      if (selectedDiffs.has('tokenEndpointAuthMethod')) {
        updatePayload.tokenEndpointAuthMethod = formData.tokenEndpointAuthMethod || 'client_secret_basic';
      }
      if (selectedDiffs.has('scopes')) {
        updatePayload.scopes = formData.scopes || [];
      }
      
      // Check if any unsafe fields are selected
      const unsafeFields = ['grantTypes', 'pkceEnforcement', 'postLogoutRedirectUris', 'responseTypes'];
      const hasUnsafeFields = unsafeFields.some(field => selectedDiffs.has(field));
      
      if (hasUnsafeFields) {
        v4ToastManager.showWarning('Only redirect URIs, token auth method, and scopes can be updated in PingOne for safety. Other fields are read-only.');
        return;
      }

      console.log('[CONFIG-CHECKER] Updating application with selected fields:', {
        appId: app.id,
        selectedFields: Array.from(selectedDiffs),
        payload: updatePayload
      });

      const result = await pingOneAppCreationService.updateApplication(app.id, updatePayload);
      
      if (result.success) {
        const fieldCount = selectedDiffs.size;
        const fieldLabel = fieldCount === 1 ? 'field' : 'fields';
        v4ToastManager.showSuccess(`Successfully updated ${fieldCount} ${fieldLabel} in PingOne!`);
        
        // Re-check config to show updated state
        setOpen(false);
        setDiffs(null);
        setSelectedDiffs(new Set());
        
        // Trigger a refresh to show new state
        setTimeout(() => {
          handleCheck();
        }, 1000);
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

  const handleUpdateOurApp = async () => {
    if (!diffs || !diffs.hasDiffs) return;
    
    // Check if any fields are selected
    if (selectedDiffs.size === 0) {
      v4ToastManager.showWarning('Please select at least one field to update');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Create update payload with PingOne's values for selected fields
      const updatePayload: Record<string, unknown> = {};
      
      // Only include fields that are selected by the user, using PingOne's values
      if (selectedDiffs.has('grantTypes')) {
        updatePayload.grantTypes = diffs.normalizedRemote.grantTypes || [];
      }
      if (selectedDiffs.has('tokenEndpointAuthMethod')) {
        updatePayload.tokenEndpointAuthMethod = diffs.normalizedRemote.tokenEndpointAuthMethod || 'client_secret_basic';
      }
      if (selectedDiffs.has('scopes')) {
        updatePayload.scopes = diffs.normalizedRemote.scopes || [];
      }
      if (selectedDiffs.has('pkceEnforcement')) {
        updatePayload.pkceEnforcement = diffs.normalizedRemote.pkceEnforcement || 'OPTIONAL';
      }
      if (selectedDiffs.has('redirectUris')) {
        updatePayload.redirectUris = diffs.normalizedRemote.redirectUris || [];
      }
      if (selectedDiffs.has('postLogoutRedirectUris')) {
        updatePayload.postLogoutRedirectUris = diffs.normalizedRemote.postLogoutRedirectUris || [];
      }
      if (selectedDiffs.has('responseTypes')) {
        updatePayload.responseTypes = diffs.normalizedRemote.responseTypes || [];
      }
      
      console.log('[CONFIG-CHECKER] Updating Our App with PingOne values:', {
        selectedFields: Array.from(selectedDiffs),
        payload: updatePayload
      });
      
      // Use the existing onImportConfig callback to update our app
      if (onImportConfig) {
        onImportConfig(updatePayload);
        const fieldCount = selectedDiffs.size;
        const fieldLabel = fieldCount === 1 ? 'field' : 'fields';
        v4ToastManager.showSuccess(`Successfully updated ${fieldCount} ${fieldLabel} in Our App with PingOne values!`);
        
        // Clear selected diffs after successful update
        setSelectedDiffs(new Set());
        
        // Auto-refresh the configuration check to show updated values
        console.log('[CONFIG-CHECKER] Auto-refreshing after updating Our App...');
        setTimeout(() => {
          handleRefresh();
        }, 1000); // Wait 1 second for the update to propagate
      } else {
        throw new Error('Import configuration callback not available');
      }
      
    } catch (error) {
      console.error('[CONFIG-CHECKER] Error updating Our App:', error);
      v4ToastManager.showError(`Failed to update Our App: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setDiffs(null);
    
    // Refresh the main application to show any updates made via Config Checker
    console.log('[CONFIG-CHECKER] Modal closed, refreshing main application...');
    if (onImportConfig) {
      // Trigger a refresh of the main application state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
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

  const exportPingOneConfig = async () => {
    if (!diffs || !diffs.normalizedRemote) {
      v4ToastManager.showError('No PingOne configuration available to export');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Create a comprehensive export object with metadata
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'PingOne Application',
          environmentId: environmentId,
          clientId: formData.clientId,
          flowType: flowTypeForComparison,
          version: '1.0'
        },
        pingOneConfig: diffs.normalizedRemote,
        localConfig: diffs.normalizedDesired,
        differences: diffs.diffs
      };

      // Create and download the JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `pingone-config-${formData.clientId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      v4ToastManager.showSuccess('PingOne configuration exported successfully!');
      
    } catch (error) {
      console.error('[CONFIG-CHECKER] Error exporting configuration:', error);
      v4ToastManager.showError(`Failed to export configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
          
          {/* Worker Token Refresh Checkbox */}
          {onGenerateWorkerToken && !hasUsedTokenRefresh && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.5rem',
              background: '#fef3c7',
              borderRadius: '0.375rem',
              border: '1px solid #f59e0b'
            }}>
              <input
                type="checkbox"
                id="refresh-worker-token"
                checked={refreshWorkerToken}
                onChange={(e) => setRefreshWorkerToken(e.target.checked)}
                disabled={loading !== null || isCreating}
                style={{ margin: 0 }}
              />
              <label 
                htmlFor="refresh-worker-token" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: '#92400e', 
                  fontWeight: '500',
                  cursor: 'pointer',
                  margin: 0
                }}
              >
                <FiKey size={14} style={{ marginRight: '0.25rem' }} />
                Refresh worker token (one-time)
              </label>
            </div>
          )}
          
          {/* Show message if token refresh was already used */}
          {hasUsedTokenRefresh && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.5rem',
              background: '#f3f4f6',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db'
            }}>
              <FiCheckCircle size={14} color="#10b981" />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Worker token refreshed
              </span>
            </div>
          )}
          {lastCheckTime && (
            <Button 
              onClick={handleRefresh} 
              disabled={!workerToken || loading !== null || isCreating}
              style={{
                background: '#06b6d4', // Cyan background
                color: 'white',
                border: '1px solid #06b6d4',
                fontWeight: '600'
              }}
              title={`Last checked: ${new Date(lastCheckTime).toLocaleTimeString()}`}
            >
              {loading === 'refresh' && <FiLoader className="spinner" />}
              Refresh
            </Button>
          )}
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
        </div>
      </ActionBar>

      <DraggableModal
        isOpen={open}
        onClose={closeModal}
        title="PingOne Configuration Differences"
        headerContent={diffs && (
          <Badge $tone={diffs.hasDiffs ? 'warning' : 'success'}>
            {diffs.hasDiffs ? <FiAlertTriangle /> : <FiCheckCircle />}
            {diffs.hasDiffs ? 'Differences detected' : 'No differences'}
          </Badge>
        )}
      >
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
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Summary of Differences ({selectedDiffs.size} of {diffs.diffs.length} selected):
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={selectAllDiffs}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllDiffs}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                {diffs.diffs.map((diff, index) => (
                  <DiffItem key={index} $change={diff.change}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      width: '100%',
                      cursor: 'pointer',
                      gap: '0.75rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedDiffs.has(diff.path)}
                        onChange={() => toggleDiffSelection(diff.path)}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginTop: '0.25rem',
                          cursor: 'pointer',
                          accentColor: '#3b82f6'
                        }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                        <DiffPath>{diff.path}</DiffPath>
                        <DiffValue $isRedirectUri={diff.path === 'redirectUris'}>
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
                      </div>
                      <DiffChange $change={diff.change}>
                        {diff.change === 'mismatch' ? 'Mismatch' : diff.change}
                      </DiffChange>
                    </label>
                  </DiffItem>
                ))}
              </DiffSummary>
            )}

            {diffs && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Raw JSON Data
                  </h4>
                  <button
                    onClick={() => setIsJsonCollapsed(!isJsonCollapsed)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    {isJsonCollapsed ? 'Show JSON' : 'Hide JSON'}
                    {isJsonCollapsed ? '▼' : '▲'}
                  </button>
                </div>
                {!isJsonCollapsed && (
                  <ScrollArea>{JSON.stringify(diffs, null, 2)}</ScrollArea>
                )}
              </div>
            )}

              <ModalFooter>
              {/* Data Management Group */}
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Data Management
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.75rem'
                }}>
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
                      onClick={exportPingOneConfig}
                      disabled={isUpdating}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: '1px solid #10b981',
                        fontWeight: '600'
                      }}
                    >
                      {isUpdating && <FiLoader className="spinner" />}
                      <FiDownload /> Export Config
                    </Button>
                  )}
                </div>
              </div>

              {/* Update Actions Group */}
              {diffs && diffs.hasDiffs && (
                <div style={{ 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.5rem',
                  border: '1px solid #fbbf24'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '0.8rem', 
                    fontWeight: '600', 
                    color: '#92400e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Update Actions
                  </h4>
                  <div style={{ 
                    padding: '0.75rem', 
                    background: '#fef3c7', 
                    borderRadius: '0.5rem', 
                    marginBottom: '1rem',
                    border: '1px solid #f59e0b'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#92400e', fontWeight: '600' }}>
                      ⚠️ Update Limitations
                    </p>
                    <p style={{ margin: '0', fontSize: '0.8rem', color: '#92400e' }}>
                      <strong>Update Our App:</strong> Updates all selected fields in your local configuration<br/>
                      <strong>Update PingOne:</strong> Only updates redirect URIs, token auth method, and scopes for safety
                    </p>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.75rem'
                  }}>
                    <Button
                      onClick={handleUpdateOurApp}
                      disabled={isUpdating || selectedDiffs.size === 0}
                      style={{
                        background: selectedDiffs.size === 0 ? '#9ca3af' : '#8b5cf6',
                        color: 'white',
                        border: selectedDiffs.size === 0 ? '1px solid #9ca3af' : '1px solid #8b5cf6',
                        fontWeight: '600'
                      }}
                    >
                      {isUpdating && <FiLoader className="spinner" />}
                      <FiMonitor /> Update Our App ({selectedDiffs.size} selected)
                    </Button>
                    {/* Option 1: Limited Update PingOne (current implementation) */}
                    <Button
                      onClick={handleUpdateConfig}
                      disabled={isUpdating || selectedDiffs.size === 0}
                      style={{
                        background: selectedDiffs.size === 0 ? '#9ca3af' : '#f59e0b',
                        color: 'white',
                        border: selectedDiffs.size === 0 ? '1px solid #9ca3af' : '1px solid #f59e0b',
                        fontWeight: '600'
                      }}
                    >
                      {isUpdating && <FiLoader className="spinner" />}
                      <FiSave /> Update PingOne (Safe Fields Only) ({selectedDiffs.size} selected)
                    </Button>
                    
                    {/* Option 2: Completely remove Update PingOne button - uncomment to use this approach instead:
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#fee2e2', 
                      borderRadius: '0.5rem', 
                      border: '1px solid #fca5a5',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: '0', fontSize: '0.875rem', color: '#dc2626', fontWeight: '600' }}>
                        🔒 PingOne updates disabled for safety
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#dc2626' }}>
                        Use "Update Our App" to sync your local configuration instead
                      </p>
                    </div>
                    */}
                  </div>
                </div>
              )}
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
      </DraggableModal>

      {/* Create Application Modal */}
      <DraggableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create PingOne Application"
      >
            
            <div style={{ 
              padding: '1rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              maxHeight: 'calc(100vh - 8rem)',
              overflowY: 'auto'
            }}>
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

              {flowNeedsRedirectUri && (
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
              )}

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
                  disabled={
                    !createFormData.name.trim() || 
                    (flowNeedsRedirectUri && !createFormData.redirectUri.trim()) || 
                    loading === 'create'
                  }
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
      </DraggableModal>

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
