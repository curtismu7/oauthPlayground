// src/components/ConfigCheckerButtons.tsx
// Config Checker component for comparing form data against live PingOne applications

import React, { useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiDownload,
	FiKey,
	FiLoader,
	FiMonitor,
	FiSave,
	FiX,
} from '@icons';
import styled from 'styled-components';
import { ConfigComparisonService, ConfigDiffResult } from '../services/configComparisonService';
import { pingOneAppCreationService } from '../services/pingOneAppCreationService';
import { getAppOrigin } from '../utils/flowRedirectUriMapping';
import { logger } from '../utils/logger';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { DraggableModal } from './DraggableModal';

// Custom P1 Logo Component
const P1Logo = ({ size = 14, style = {} }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		style={{ display: 'inline-block', marginRight: '4px', ...style }}
		aria-hidden
	>
		<title>P1 Logo</title>
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
const formatCompactJson = (value: unknown) => {
	const jsonStr = JSON.stringify(value);
	if (jsonStr.length > 80) {
		// For long arrays, show first few items + count
		if (Array.isArray(value) && value.length > 3) {
			const preview = value.slice(0, 2);
			return `[${preview.map((v) => JSON.stringify(v)).join(', ')}, ...+${value.length - 2} more]`;
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

const ModalContent = styled.div<{
	$isMinimized: boolean;
	$position: { x: number; y: number };
	$isDragging: boolean;
}>`
  width: ${(props) => (props.$isMinimized ? '300px' : 'min(1000px, calc(100vw - 2rem))')};
  max-height: ${(props) => (props.$isMinimized ? 'auto' : 'calc(100vh - 4rem)')};
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  padding: ${(props) => (props.$isMinimized ? '0.75rem' : '1.5rem')};
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.$isMinimized ? '0.5rem' : '1.25rem')};
  overflow: hidden;
  position: ${(props) => (props.$isMinimized ? 'fixed' : 'relative')};
  top: ${(props) => (props.$isMinimized ? `${props.$position.y}px` : 'auto')};
  left: ${(props) => (props.$isMinimized ? `${props.$position.x}px` : 'auto')};
  cursor: ${(props) => (props.$isDragging ? 'grabbing' : 'default')};
  transition: ${(props) => (props.$isDragging ? 'none' : 'all 0.2s ease')};
  z-index: 1001;
`;

const ModalHeader = styled.div<{ $isMinimized: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #cbd5e1;
  margin: ${(props) => (props.$isMinimized ? '-0.75rem -0.75rem 0.5rem -0.75rem' : '-1.5rem -1.5rem 1.25rem -1.5rem')};
  padding: ${(props) => (props.$isMinimized ? '0.75rem' : '1.5rem')};
  border-radius: ${(props) => (props.$isMinimized ? '0.75rem' : '0.75rem 0.75rem 0 0')};
`;

const _DragHandle = styled.div`
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

const _HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const _ControlButton = styled.button`
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

const _ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`;

const _CloseButton = styled.button`
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
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1e293b;
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const DiffSummary = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const DiffItem = styled.div<{ $change: 'added' | 'removed' | 'mismatch' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 0.5rem;
  background: ${({ $change }) =>
		$change === 'added'
			? 'rgba(16, 185, 129, 0.08)'
			: $change === 'removed'
				? 'rgba(239, 68, 68, 0.08)'
				: 'rgba(251, 191, 36, 0.08)'};
  border: 1px solid ${({ $change }) =>
		$change === 'added'
			? 'rgba(16, 185, 129, 0.3)'
			: $change === 'removed'
				? 'rgba(239, 68, 68, 0.3)'
				: 'rgba(251, 191, 36, 0.3)'};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $change }) =>
			$change === 'added'
				? 'rgba(16, 185, 129, 0.12)'
				: $change === 'removed'
					? 'rgba(239, 68, 68, 0.12)'
					: 'rgba(251, 191, 36, 0.12)'};
    border-color: ${({ $change }) =>
			$change === 'added'
				? 'rgba(16, 185, 129, 0.4)'
				: $change === 'removed'
					? 'rgba(239, 68, 68, 0.4)'
					: 'rgba(251, 191, 36, 0.4)'};
  }
`;

const _DiffContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const _DiffLabel = styled.div`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const _DiffSource = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const DiffValue = styled.div<{ $isRedirectUri?: boolean }>`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.625rem 0.75rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  color: #1e293b;
  line-height: 1.5;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &::-webkit-scrollbar {
    height: 4px;
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
`;

const DiffPath = styled.span`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #0f172a;
  text-transform: capitalize;
  letter-spacing: 0.01em;
  margin-bottom: 0.5rem;
  display: inline-block;
`;

const DiffChange = styled.span<{ $change: 'added' | 'removed' | 'mismatch' }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  background: ${({ $change }) =>
		$change === 'added'
			? 'rgba(16, 185, 129, 0.15)'
			: $change === 'removed'
				? 'rgba(239, 68, 68, 0.15)'
				: 'rgba(251, 191, 36, 0.15)'};
  color: ${({ $change }) =>
		$change === 'added' ? '#047857' : $change === 'removed' ? '#dc2626' : '#d97706'};
  border: 1px solid ${({ $change }) =>
		$change === 'added'
			? 'rgba(16, 185, 129, 0.3)'
			: $change === 'removed'
				? 'rgba(239, 68, 68, 0.3)'
				: 'rgba(251, 191, 36, 0.3)'};
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: capitalize;
`;

interface Props {
	formData: Record<string, unknown>;
	selectedAppType?: string;
	workerToken: string;
	environmentId: string;
	region?: string;
	isCreating?: boolean;
	onCreateApplication?: (appData?: {
		name: string;
		description: string;
		redirectUri?: string;
		tokenEndpointAuthMethod?: string;
		responseTypes?: string[];
		grantTypes?: string[];
		refreshTokenEnabled?: boolean;
	}) => void;
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
	onGenerateWorkerToken,
}) => {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState<'check' | 'create' | 'refresh' | null>(null);
	const [diffs, setDiffs] = useState<ConfigDiffResult | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
	const [showCreationResultModal, setShowCreationResultModal] = useState(false);
	const [creationResult, setCreationResult] = useState<{
		success: boolean;
		[key: string]: unknown;
	} | null>(null);
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
				OIDC_WEB_APP: 'authorization-code',
				OIDC_NATIVE_APP: 'authorization-code',
				SINGLE_PAGE_APP: 'implicit',
				WORKER: 'client-credentials',
				SERVICE: 'client-credentials',
			};

			const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
			const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
			return `pingone-${flowName}-${uniqueId}`;
		};

		// Generate redirect URI with same unique ID as app name
		const generateRedirectUri = (appType: string | null | undefined) => {
			const base = getAppOrigin();
			if (!appType) {
				const uniqueId = Math.floor(Math.random() * 900) + 100;
				return `${base}/callback/app-${uniqueId}`;
			}

			const flowTypeMap: Record<string, string> = {
				OIDC_WEB_APP: 'authorization-code',
				OIDC_NATIVE_APP: 'authorization-code',
				SINGLE_PAGE_APP: 'implicit',
				WORKER: 'client-credentials',
				SERVICE: 'client-credentials',
			};

			const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
			const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
			return `${base}/callback/${flowName}-${uniqueId}`;
		};

		return {
			name: generateDefaultAppName(selectedAppType), // Always generate new unique name
			description: `Created via OAuth Playground - ${selectedAppType}`,
			redirectUri: (formData.redirectUri as string) || generateRedirectUri(selectedAppType),
			tokenEndpointAuthMethod:
				(formData.tokenEndpointAuthMethod as string) || 'client_secret_basic',
			responseTypes: (formData.responseTypes as string[]) || ['code'],
			grantTypes: (formData.grantTypes as string[]) || ['authorization_code'],
			refreshTokenEnabled: true, // Default to enabled (refresh tokens are commonly used)
		};
	});

	// Map selectedAppType to flow type for comparison service
	const flowTypeForComparison = useMemo(() => {
		// Map app types to flow types
		const appTypeToFlowType: Record<string, string> = {
			WORKER: 'client-credentials',
			OIDC_WEB_APP: 'authorization-code',
			SINGLE_PAGE_APP: 'implicit',
			NATIVE_APP: 'authorization-code',
			SERVICE: 'client-credentials',
		};

		// Try to extract flow type from formData or selectedAppType
		const grantTypes = formData.grantTypes as string[] | undefined;

		// If grant types include client_credentials, it's a client credentials flow
		if (grantTypes?.some((gt) => gt.toLowerCase() === 'client_credentials')) {
			return 'client-credentials';
		}

		// Check if this is a hybrid flow (has both authorization_code and implicit)
		if (
			grantTypes?.some((gt) => gt.toLowerCase() === 'authorization_code') &&
			grantTypes.some((gt) => gt.toLowerCase() === 'implicit')
		) {
			return 'hybrid';
		}

		// Otherwise, use the app type mapping
		const result = appTypeToFlowType[selectedAppType || ''] || selectedAppType;
		return result;
	}, [selectedAppType, formData.grantTypes]);

	const comparisonService = useMemo(() => {
		// Use the application's clientId and clientSecret from formData (which now contains application credentials)
		const applicationClientId = formData.clientId as string;
		const applicationClientSecret = formData.clientSecret as string;

		return new ConfigComparisonService(
			workerToken,
			environmentId,
			region,
			applicationClientId,
			applicationClientSecret,
			flowTypeForComparison
		);
	}, [
		workerToken,
		environmentId,
		region,
		formData.clientId,
		formData.clientSecret,
		flowTypeForComparison,
	]);

	// Get allowed token auth methods for the selected app type
	const getAllowedTokenAuthMethods = (appType: string) => {
		switch (appType) {
			case 'OIDC_WEB_APP':
				return [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
					'none',
				];
			case 'OIDC_NATIVE_APP':
				return [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
					'none',
				];
			case 'SINGLE_PAGE_APP':
				return ['none']; // SPA only supports 'none'
			case 'WORKER':
				return [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				];
			case 'SERVICE':
				return [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				];
			// Handle Implicit flow cases
			case 'implicit-oauth-v7':
			case 'implicit-oidc-v7':
				return ['none']; // Implicit flow only supports 'none'
			default:
				return [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
					'none',
				];
		}
	};

	// Get allowed response types for the selected app type
	const _getAllowedResponseTypes = (_appType: string) => {
		// For create app modal, allow all response types for maximum flexibility
		// Users should be able to create apps with any combination they need
		// Note: Some combinations may not be valid (e.g., 'token' alone without 'id_token' in implicit flow)
		// but we allow selection here and let PingOne API validate
		return ['code', 'token', 'id_token'];
	};

	// Get allowed grant types for the selected app type
	const getAllowedGrantTypes = (_appType: string) => {
		// For create app modal, allow all grant types for maximum flexibility
		// Users should be able to create apps with any combination they need
		// NOTE: refresh_token is NOT a grant type - it's a token returned by the authorization server
		// Refresh tokens are automatically returned when using authorization_code or client_credentials grant types
		const allGrantTypes = [
			'authorization_code',
			'implicit',
			'client_credentials',
			'urn:ietf:params:oauth:grant-type:device_code', // RFC 8628: Device Authorization Flow
			'urn:openid:params:grant-type:ciba', // RFC 9436: CIBA
		];

		// Return all grant types - allow maximum flexibility in create app modal
		// Users can select any combination they need for their use case
		return allGrantTypes;
	};

	const allowedTokenAuthMethods = getAllowedTokenAuthMethods(selectedAppType);
	const shouldShowTokenAuthSelector = allowedTokenAuthMethods.length > 1;

	// Determine if the flow type needs redirect URIs
	// Grant types that REQUIRE redirect URIs: authorization_code, implicit
	// Grant types that DON'T use redirect URIs: client_credentials, device_code, ciba, password (ROPC)
	// NOTE: refresh_token is NOT a grant type - it's a token type returned by the authorization server
	// Refresh tokens are automatically returned when using authorization_code or client_credentials grant types
	const flowNeedsRedirectUri = useMemo(() => {
		// Check selectedAppType - WORKER and SERVICE apps don't use redirect URIs
		if (selectedAppType === 'WORKER' || selectedAppType === 'SERVICE') {
			return false;
		}

		// Check grant types - use createFormData if available (modal), otherwise formData
		const grantTypes = createFormData.grantTypes || (formData.grantTypes as string[] | undefined);
		if (!grantTypes || grantTypes.length === 0) {
			// Default: show redirect URI if no grant types specified (safer default)
			return true;
		}

		// Grant types that REQUIRE redirect URIs (user interaction via browser)
		const grantTypesRequiringRedirect = ['authorization_code', 'implicit'];

		// Grant types that DON'T use redirect URIs (no browser redirect)
		const grantTypesWithoutRedirect = [
			'client_credentials',
			'urn:ietf:params:oauth:grant-type:device_code', // RFC 8628: Device Authorization
			'urn:openid:params:grant-type:ciba', // RFC 9436: CIBA
			'password', // ROPC (deprecated, but still valid)
		];

		// Check if any grant type requires redirect URI
		const hasRedirectRequired = grantTypes.some((gt) =>
			grantTypesRequiringRedirect.includes(gt.toLowerCase())
		);

		// Check if ONLY grant types without redirect are selected
		const hasOnlyNoRedirect = grantTypes.every(
			(gt) =>
				grantTypesWithoutRedirect.includes(gt) ||
				grantTypesWithoutRedirect.some((noRedirect) =>
					gt.toLowerCase().includes(noRedirect.toLowerCase())
				)
		);

		// If we have grant types that require redirect, show redirect URI
		if (hasRedirectRequired) {
			return true;
		}

		// If ONLY grant types that don't need redirect are selected, hide redirect URI
		if (hasOnlyNoRedirect && grantTypes.length > 0) {
			return false;
		}

		// Default: show redirect URI (safer for edge cases)
		return true;
	}, [selectedAppType, formData.grantTypes, createFormData.grantTypes]);

	// Toggle selection of a specific diff
	const toggleDiffSelection = (path: string) => {
		setSelectedDiffs((prev) => {
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
			setSelectedDiffs(new Set(diffs.diffs.map((diff) => diff.path)));
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
		await new Promise((resolve) => setTimeout(resolve, 500));

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
			setHasUsedTokenRefresh(true); // Mark as used to prevent multiple refreshes
			setRefreshWorkerToken(false); // Uncheck the checkbox

			try {
				// Call the worker token generation function
				onGenerateWorkerToken();
				v4ToastManager.showInfo('Worker token refreshed! Proceeding with config check...');

				// Wait a moment for the token to be generated
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				console.error('[CONFIG-CHECKER] Failed to refresh worker token:', error);
				v4ToastManager.showError(
					'Failed to refresh worker token. Proceeding with existing token...'
				);
			}
		}

		setLoading('check');
		logger.info('CONFIG-CHECKER', 'Starting configuration check', {
			clientId,
			selectedAppType,
			hasWorkerToken: !!workerToken,
			workerTokenLength: workerToken?.length || 0,
		});

		try {
			const startTime = Date.now();
			const result = await comparisonService.compare(clientId, formData);
			const elapsed = Date.now() - startTime;

			setDiffs(result);
			setOpen(true);
			setLastCheckTime(Date.now());

			// Initialize all diffs as selected by default
			setSelectedDiffs(new Set(result.diffs.map((diff) => diff.path)));

			if (!result.hasDiffs) {
				v4ToastManager.showSuccess('No differences detected.');
				logger.info('CONFIG-CHECKER', 'Configuration check completed - no differences', {
					clientId,
					selectedAppType,
					elapsed,
				});
			} else {
				logger.info('CONFIG-CHECKER', 'Configuration check completed - differences found', {
					clientId,
					selectedAppType,
					elapsed,
					diffCount: result.diffs.length,
				});
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);

			// Check for specific authentication errors
			if (
				errorMessage.includes('Failed to fetch') ||
				errorMessage.includes('401') ||
				errorMessage.includes('Unauthorized')
			) {
				// Clear expired token from localStorage
				localStorage.removeItem('worker_token');
				localStorage.removeItem('worker_token_expires_at');

				// Show both toast and modal for authentication errors
				v4ToastManager.showError('Worker token expired. Please generate a new worker token.', {
					duration: 8000,
				});
				setShowAuthErrorModal(true);
				logger.error('CONFIG-CHECKER', 'Authentication failed - worker token expired or invalid', {
					clientId,
					selectedAppType,
					error: errorMessage,
				});
			} else if (
				errorMessage.includes('CORS') ||
				errorMessage.includes('Access-Control-Allow-Origin')
			) {
				v4ToastManager.showError('Network error. Please check your connection and try again.', {
					duration: 6000,
				});
				logger.error('CONFIG-CHECKER', 'CORS/Network error', {
					clientId,
					selectedAppType,
					error: errorMessage,
				});
			} else {
				v4ToastManager.showError(`Configuration check failed: ${errorMessage}`);
				logger.error('CONFIG-CHECKER', 'Configuration check failed', {
					clientId,
					selectedAppType,
					error: errorMessage,
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
				OIDC_WEB_APP: 'authorization-code',
				OIDC_NATIVE_APP: 'authorization-code',
				SINGLE_PAGE_APP: 'implicit',
				WORKER: 'client-credentials',
				SERVICE: 'client-credentials',
			};

			// Check grant types to override if necessary
			if (grantTypes) {
				if (grantTypes.some((gt) => gt.toLowerCase() === 'client_credentials')) {
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
				OIDC_WEB_APP: 'authorization-code',
				OIDC_NATIVE_APP: 'authorization-code',
				SINGLE_PAGE_APP: 'implicit',
				WORKER: 'client-credentials',
				SERVICE: 'client-credentials',
			};

			// Check grant types to override if necessary
			const base = getAppOrigin();
			if (grantTypes) {
				if (grantTypes.some((gt) => gt.toLowerCase() === 'client_credentials')) {
					const uniqueId = Math.floor(Math.random() * 900) + 100;
					return `${base}/callback/client-credentials-${uniqueId}`;
				}
			}

			const flowName = flowTypeMap[appType] || appType.replace(/[-_]/g, '-').toLowerCase();
			const uniqueId = Math.floor(Math.random() * 900) + 100;
			return `${base}/callback/${flowName}-${uniqueId}`;
		};

		// Regenerate form data with current selectedAppType and grantTypes
		const grantTypes = formData.grantTypes as string[] | undefined;
		setCreateFormData({
			name: generateDefaultAppName(selectedAppType, grantTypes),
			description: `Created via OAuth Playground - ${selectedAppType}`,
			redirectUri:
				(formData.redirectUri as string) || generateRedirectUri(selectedAppType, grantTypes),
			tokenEndpointAuthMethod:
				(formData.tokenEndpointAuthMethod as string) || 'client_secret_basic',
			responseTypes: (formData.responseTypes as string[]) || ['code'],
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
		logger.info('CONFIG-CHECKER', 'Starting application creation', {
			selectedAppType,
			createFormData,
		});

		try {
			const startTime = Date.now();

			// Pass the form data to the application creation handler
			const result = await onCreateApplication(createFormData);

			const elapsed = Date.now() - startTime;
			logger.info('CONFIG-CHECKER', 'Application creation completed', {
				selectedAppType,
				elapsed,
			});

			// Show creation result modal if successful
			if (result?.success) {
				setCreationResult(result);
				setShowCreationResultModal(true);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			v4ToastManager.showError(`Application creation failed: ${errorMessage}`);
			logger.error('CONFIG-CHECKER', 'Application creation failed', {
				selectedAppType,
				error: errorMessage,
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
			tokenEndpointAuthMethod:
				diffs.normalizedRemote.tokenEndpointAuthMethod || formData.tokenEndpointAuthMethod,
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
			const app = applications.find((a: { clientId?: string }) => a.clientId === clientId);

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
				updatePayload.tokenEndpointAuthMethod =
					formData.tokenEndpointAuthMethod || 'client_secret_basic';
			}
			if (selectedDiffs.has('scopes')) {
				updatePayload.scopes = formData.scopes || [];
			}

			// Check if any unsafe fields are selected
			const unsafeFields = [
				'grantTypes',
				'pkceEnforcement',
				'postLogoutRedirectUris',
				'responseTypes',
			];
			const hasUnsafeFields = unsafeFields.some((field) => selectedDiffs.has(field));

			if (hasUnsafeFields) {
				v4ToastManager.showWarning(
					'Only redirect URIs, token auth method, and scopes can be updated in PingOne for safety. Other fields are read-only.'
				);
				return;
			}

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
			v4ToastManager.showError(
				`Failed to update application: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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
				updatePayload.tokenEndpointAuthMethod =
					diffs.normalizedRemote.tokenEndpointAuthMethod || 'client_secret_basic';
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

			// Use the existing onImportConfig callback to update our app
			if (onImportConfig) {
				onImportConfig(updatePayload);
				const fieldCount = selectedDiffs.size;
				const fieldLabel = fieldCount === 1 ? 'field' : 'fields';
				v4ToastManager.showSuccess(
					`Successfully updated ${fieldCount} ${fieldLabel} in Our App with PingOne values!`
				);

				// Clear selected diffs after successful update
				setSelectedDiffs(new Set());

				// Auto-refresh the configuration check to show updated values
				setTimeout(() => {
					handleRefresh();
				}, 1000); // Wait 1 second for the update to propagate
			} else {
				throw new Error('Import configuration callback not available');
			}
		} catch (error) {
			console.error('[CONFIG-CHECKER] Error updating Our App:', error);
			v4ToastManager.showError(
				`Failed to update Our App: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const closeModal = () => {
		setOpen(false);
		setDiffs(null);

		// Refresh the main application to show any updates made via Config Checker
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
		} catch (_error) {
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
					version: '1.0',
				},
				pingOneConfig: diffs.normalizedRemote,
				localConfig: diffs.normalizedDesired,
				differences: diffs.diffs,
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
			v4ToastManager.showError(
				`Failed to export configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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
					<strong>Check Config:</strong> Compare your current flow settings with existing PingOne
					applications to identify differences.
					<br />
					<strong>Create App:</strong> Automatically create a new PingOne application with your
					current configuration.
				</ConfigCheckerDescription>
			</ConfigCheckerHeader>

			<ActionBar>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
					<Button
						onClick={handleCheck}
						disabled={!workerToken || loading !== null || isCreating}
						style={{
							background: '#3b82f6', // Blue background
							color: 'white', // White text
							border: '1px solid #3b82f6',
							fontWeight: '600',
						}}
					>
						{loading === 'check' && <FiLoader className="spinner" />}
						Check Config
					</Button>

					{/* Worker Token Refresh Checkbox */}
					{onGenerateWorkerToken && !hasUsedTokenRefresh && (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.5rem',
								background: '#fef3c7',
								borderRadius: '0.375rem',
								border: '1px solid #f59e0b',
							}}
						>
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
									margin: 0,
								}}
							>
								<FiKey size={14} style={{ marginRight: '0.25rem' }} />
								Refresh worker token (one-time)
							</label>
						</div>
					)}

					{/* Show message if token refresh was already used */}
					{hasUsedTokenRefresh && (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.5rem',
								background: '#f3f4f6',
								borderRadius: '0.375rem',
								border: '1px solid #d1d5db',
							}}
						>
							<FiCheckCircle size={14} color="#10b981" />
							<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Worker token refreshed</span>
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
								fontWeight: '600',
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
							color: 'white', // White text
							border: '1px solid #22c55e',
							fontWeight: '600',
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
								v4ToastManager.showInfo(
									'Please go to the Client Generator to create a new worker token.'
								);
							}
						}}
						style={{
							background: '#f59e0b', // Orange background
							color: 'white', // White text
							border: '1px solid #f59e0b',
							fontWeight: '600',
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
				headerContent={
					diffs && (
						<Badge $tone={diffs.hasDiffs ? 'warning' : 'success'}>
							{diffs.hasDiffs ? <FiAlertTriangle /> : <FiCheckCircle />}
							{diffs.hasDiffs ? 'Differences detected' : 'No differences'}
						</Badge>
					)
				}
			>
				{/* Client ID Display */}
				{formData.clientId && (
					<div
						style={{
							background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
							border: '1px solid #bfdbfe',
							borderRadius: '0.75rem',
							padding: '1.125rem 1.5rem',
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
							marginBottom: '1.5rem',
						}}
					>
						<div
							style={{
								background: '#3b82f6',
								color: 'white',
								padding: '0.625rem',
								borderRadius: '0.5rem',
								fontSize: '1.5rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: '48px',
								height: '48px',
							}}
						>
							<FiKey size={24} />
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontSize: '0.8125rem',
									fontWeight: '600',
									color: '#1e40af',
									marginBottom: '0.375rem',
									letterSpacing: '0.01em',
								}}
							>
								PingOne Client ID
							</div>
							<div
								style={{
									fontFamily:
										"'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
									fontSize: '0.875rem',
									color: '#1e293b',
									wordBreak: 'break-all',
									lineHeight: 1.5,
								}}
							>
								{formData.clientId}
							</div>
						</div>
						<Button
							onClick={() => {
								navigator.clipboard.writeText(String(formData.clientId));
								v4ToastManager.showSuccess('Client ID copied to clipboard');
							}}
							style={{
								background: '#3b82f6',
								color: '#ffffff',
								border: '1px solid #2563eb',
								padding: '0.625rem 1rem',
								fontSize: '0.8125rem',
							}}
						>
							<FiCopy size={14} />
							Copy
						</Button>
					</div>
				)}

				{diffs && !diffs.hasDiffs && (
					<div
						style={{
							background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
							border: '1px solid #86efac',
							borderRadius: '0.75rem',
							padding: '2rem',
							textAlign: 'center',
							marginBottom: '1.5rem',
						}}
					>
						<FiCheckCircle
							size={48}
							style={{
								color: '#16a34a',
								marginBottom: '1rem',
								display: 'block',
								margin: '0 auto 1rem',
							}}
						/>
						<h3
							style={{
								margin: '0 0 0.5rem 0',
								fontSize: '1.125rem',
								fontWeight: 600,
								color: '#166534',
							}}
						>
							Configuration Match ✓
						</h3>
						<p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d' }}>
							Your application configuration matches PingOne. No differences detected.
						</p>
					</div>
				)}

				{diffs?.hasDiffs && (
					<DiffSummary>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								paddingBottom: '0.75rem',
								borderBottom: '1px solid #e2e8f0',
								marginBottom: '0.75rem',
							}}
						>
							<h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
								Differences Found ({selectedDiffs.size} of {diffs.diffs.length} selected)
							</h4>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<Button
									onClick={selectAllDiffs}
									$variant="secondary"
									style={{
										padding: '0.5rem 0.875rem',
										fontSize: '0.8125rem',
										background: '#3b82f6',
										color: '#ffffff',
										border: '1px solid #2563eb',
									}}
								>
									Select All
								</Button>
								<Button
									onClick={deselectAllDiffs}
									$variant="secondary"
									style={{
										padding: '0.5rem 0.875rem',
										fontSize: '0.8125rem',
										background: '#3b82f6',
										color: '#ffffff',
										border: '1px solid #2563eb',
									}}
								>
									Deselect All
								</Button>
							</div>
						</div>
						{diffs.diffs.map((diff, index) => (
							<DiffItem key={index} $change={diff.change}>
								<label
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										width: '100%',
										cursor: 'pointer',
										gap: '0.75rem',
									}}
								>
									<input
										type="checkbox"
										checked={selectedDiffs.has(diff.path)}
										onChange={() => toggleDiffSelection(diff.path)}
										style={{
											width: '18px',
											height: '18px',
											marginTop: '0.25rem',
											cursor: 'pointer',
											accentColor: '#3b82f6',
										}}
									/>
									<div
										style={{
											flex: 1,
											display: 'flex',
											flexDirection: 'column',
											gap: '0.625rem',
											minWidth: 0,
										}}
									>
										<DiffPath>{diff.path.replace(/([A-Z])/g, ' $1').trim()}</DiffPath>
										<DiffValue $isRedirectUri={diff.path === 'redirectUris'}>
											{diff.change === 'added' && (
												<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
													<P1Logo size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
													<div style={{ flex: 1 }}>
														<div
															style={{
																fontSize: '0.6875rem',
																fontWeight: 600,
																color: '#64748b',
																marginBottom: '0.25rem',
															}}
														>
															PingOne
														</div>
														<div style={{ color: '#0f172a' }}>
															{formatCompactJson(diff.expected)}
														</div>
													</div>
												</div>
											)}
											{diff.change === 'removed' && (
												<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
													<FiMonitor
														size={16}
														style={{ flexShrink: 0, marginTop: '0.125rem', color: '#3b82f6' }}
													/>
													<div style={{ flex: 1 }}>
														<div
															style={{
																fontSize: '0.6875rem',
																fontWeight: 600,
																color: '#64748b',
																marginBottom: '0.25rem',
															}}
														>
															Our App
														</div>
														<div style={{ color: '#0f172a' }}>{formatCompactJson(diff.actual)}</div>
													</div>
												</div>
											)}
											{diff.change === 'mismatch' && (
												<>
													<div
														style={{
															display: 'flex',
															alignItems: 'flex-start',
															gap: '0.5rem',
															marginBottom: '0.75rem',
														}}
													>
														<P1Logo size={16} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
														<div style={{ flex: 1 }}>
															<div
																style={{
																	fontSize: '0.6875rem',
																	fontWeight: 600,
																	color: '#64748b',
																	marginBottom: '0.25rem',
																}}
															>
																PingOne
															</div>
															<div style={{ color: '#0f172a' }}>
																{formatCompactJson(diff.expected)}
															</div>
														</div>
													</div>
													<div
														style={{
															display: 'flex',
															alignItems: 'flex-start',
															gap: '0.5rem',
															paddingTop: '0.75rem',
															borderTop: '1px solid #e2e8f0',
														}}
													>
														<FiMonitor
															size={16}
															style={{ flexShrink: 0, marginTop: '0.125rem', color: '#3b82f6' }}
														/>
														<div style={{ flex: 1 }}>
															<div
																style={{
																	fontSize: '0.6875rem',
																	fontWeight: 600,
																	color: '#64748b',
																	marginBottom: '0.25rem',
																}}
															>
																Our App
															</div>
															<div style={{ color: '#0f172a' }}>
																{formatCompactJson(diff.actual)}
															</div>
														</div>
													</div>
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
					<div style={{ marginTop: '1.5rem' }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '0.75rem',
								padding: '0.875rem 1rem',
								background: '#f8fafc',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
								Raw JSON Data
							</h4>
							<Button
								onClick={() => setIsJsonCollapsed(!isJsonCollapsed)}
								$variant="secondary"
								style={{
									padding: '0.5rem 0.875rem',
									fontSize: '0.8125rem',
									background: '#3b82f6',
									color: '#ffffff',
									border: '1px solid #2563eb',
								}}
							>
								{isJsonCollapsed ? 'Show JSON' : 'Hide JSON'}
							</Button>
						</div>
						{!isJsonCollapsed && (
							<ScrollArea style={{ maxHeight: '400px', marginTop: '0.5rem' }}>
								{JSON.stringify(diffs, null, 2)}
							</ScrollArea>
						)}
					</div>
				)}

				<ModalFooter>
					{/* Data Management Group */}
					<div
						style={{
							marginBottom: '1rem',
							padding: '0.75rem',
							backgroundColor: '#f8fafc',
							borderRadius: '0.5rem',
							border: '1px solid #e2e8f0',
						}}
					>
						<h4
							style={{
								margin: '0 0 0.5rem 0',
								fontSize: '0.8rem',
								fontWeight: '600',
								color: '#374151',
								textTransform: 'uppercase',
								letterSpacing: '0.05em',
							}}
						>
							Data Management
						</h4>
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: '0.75rem',
							}}
						>
							<Button
								onClick={copyToClipboard}
								disabled={!diffs}
								style={{
									background: '#3b82f6',
									color: 'white',
									border: '1px solid #3b82f6',
									fontWeight: '600',
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
										fontWeight: '600',
									}}
								>
									<FiDownload /> Import Config
								</Button>
							)}
							{diffs?.hasDiffs && (
								<Button
									onClick={exportPingOneConfig}
									disabled={isUpdating}
									style={{
										background: '#10b981',
										color: 'white',
										border: '1px solid #10b981',
										fontWeight: '600',
									}}
								>
									{isUpdating && <FiLoader className="spinner" />}
									<FiDownload /> Export Config
								</Button>
							)}
						</div>
					</div>

					{/* Update Actions Group */}
					{diffs?.hasDiffs && (
						<div
							style={{
								marginBottom: '1rem',
								padding: '0.75rem',
								backgroundColor: '#fef3c7',
								borderRadius: '0.5rem',
								border: '1px solid #fbbf24',
							}}
						>
							<h4
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.8rem',
									fontWeight: '600',
									color: '#92400e',
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
								}}
							>
								Update Actions
							</h4>
							<div
								style={{
									padding: '0.75rem',
									background: '#fef3c7',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									border: '1px solid #f59e0b',
								}}
							>
								<p
									style={{
										margin: '0 0 0.5rem 0',
										fontSize: '0.875rem',
										color: '#92400e',
										fontWeight: '600',
									}}
								>
									⚠️ Update Limitations
								</p>
								<p style={{ margin: '0', fontSize: '0.8rem', color: '#92400e' }}>
									<strong>Update Our App:</strong> Updates all selected fields in your local
									configuration
									<br />
									<strong>Update PingOne:</strong> Only updates redirect URIs, token auth method,
									and scopes for safety
								</p>
							</div>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: '0.75rem',
								}}
							>
								<Button
									onClick={handleUpdateOurApp}
									disabled={isUpdating || selectedDiffs.size === 0}
									style={{
										background: selectedDiffs.size === 0 ? '#9ca3af' : '#8b5cf6',
										color: 'white',
										border: selectedDiffs.size === 0 ? '1px solid #9ca3af' : '1px solid #8b5cf6',
										fontWeight: '600',
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
										fontWeight: '600',
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
							background: '#3b82f6',
							color: '#ffffff',
							border: '1px solid #2563eb',
							fontWeight: '600',
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
				<div
					style={{
						padding: '1rem',
						display: 'flex',
						flexDirection: 'column',
						gap: '0.75rem',
						maxHeight: 'calc(100vh - 8rem)',
						overflowY: 'auto',
					}}
				>
					<div>
						<label
							htmlFor="create-app-name"
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Application Name *
						</label>
						<input
							id="create-app-name"
							type="text"
							value={createFormData.name}
							onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
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
							onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
							onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
						/>
					</div>

					<div>
						<label
							htmlFor="create-app-description"
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Description
						</label>
						<textarea
							id="create-app-description"
							value={createFormData.description}
							onChange={(e) =>
								setCreateFormData((prev) => ({ ...prev, description: e.target.value }))
							}
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
							onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
							onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
						/>
					</div>

					{flowNeedsRedirectUri && (
						<div>
							<label
								htmlFor="create-app-redirect-uri"
								style={{
									display: 'block',
									marginBottom: '0.5rem',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Redirect URI *
							</label>
							<input
								id="create-app-redirect-uri"
								type="url"
								value={createFormData.redirectUri}
								onChange={(e) =>
									setCreateFormData((prev) => ({ ...prev, redirectUri: e.target.value }))
								}
								placeholder={`${getAppOrigin()}/callback`}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
									outline: 'none',
									transition: 'border-color 0.2s',
								}}
								onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
								onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
							/>
						</div>
					)}

					{shouldShowTokenAuthSelector && (
						<div>
							<label
								htmlFor="create-app-token-auth"
								style={{
									display: 'block',
									marginBottom: '0.5rem',
									fontWeight: '600',
									color: '#374151',
								}}
							>
								Token Endpoint Authentication Method
							</label>
							<select
								id="create-app-token-auth"
								value={createFormData.tokenEndpointAuthMethod}
								onChange={(e) =>
									setCreateFormData((prev) => ({
										...prev,
										tokenEndpointAuthMethod: e.target.value,
									}))
								}
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
								onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
								onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
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
						<div
							style={{
								background: '#f0f9ff',
								padding: '0.75rem',
								borderRadius: '0.5rem',
								border: '1px solid #bae6fd',
								fontSize: '0.875rem',
								color: '#0c4a6e',
							}}
						>
							<strong>Token Authentication:</strong>{' '}
							{selectedAppType === 'SINGLE_PAGE_APP'
								? 'None (Public Client)'
								: 'Client Secret Basic'}
							<br />
							<em>This app type only supports one authentication method.</em>
						</div>
					)}

					{/* OIDC Settings Section */}
					<div
						style={{
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '0.75rem',
							padding: '1.5rem',
							marginTop: '1rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '1.5rem',
							}}
						>
							<h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
								OIDC Settings
							</h4>
							<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								Configure OIDC settings for the application
							</span>
						</div>

						{/* Response Types */}
						<div style={{ marginBottom: '1.5rem' }}>
							<label
								htmlFor="create-app-response-type"
								style={{
									display: 'block',
									marginBottom: '0.75rem',
									fontWeight: '600',
									color: '#374151',
									fontSize: '0.875rem',
								}}
							>
								Response Type *
							</label>
							<select
								id="create-app-response-type"
								value={
									createFormData.responseTypes.length > 0 ? createFormData.responseTypes[0] : 'code'
								}
								onChange={(e) => {
									setCreateFormData((prev) => ({ ...prev, responseTypes: [e.target.value] }));
								}}
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
								onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
								onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
							>
								<option value="code">code (Authorization Code)</option>
								<option value="token">token (Implicit OAuth)</option>
								<option value="id_token">id_token (Implicit OIDC)</option>
								<option value="id_token token">id_token token (Implicit OIDC)</option>
								<option value="code id_token">code id_token (Hybrid)</option>
								<option value="code token">code token (Hybrid)</option>
								<option value="code id_token token">code id_token token (Hybrid)</option>
							</select>
							<div
								style={{
									marginTop: '0.5rem',
									fontSize: '0.75rem',
									color: '#6b7280',
									fontStyle: 'italic',
								}}
							>
								Select the OAuth/OIDC response type for this application
							</div>
						</div>

						{/* Refresh Token Configuration */}
						<div style={{ marginBottom: '1.5rem' }}>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '0.75rem',
									fontWeight: '600',
									color: '#374151',
									fontSize: '0.875rem',
								}}
							>
								<input
									type="checkbox"
									checked={createFormData.refreshTokenEnabled}
									onChange={(e) => {
										setCreateFormData((prev) => ({
											...prev,
											refreshTokenEnabled: e.target.checked,
										}));
									}}
									style={{ margin: 0 }}
								/>
								<span>Enable Refresh Token</span>
							</label>
							<div
								style={{
									marginTop: '0.5rem',
									padding: '0.75rem',
									background: '#f8fafc',
									borderRadius: '0.5rem',
									border: '1px solid #e2e8f0',
									fontSize: '0.75rem',
									color: '#475569',
								}}
							>
								<strong>Note:</strong> Refresh tokens are not a grant type. They are automatically
								returned by the authorization server when using <code>authorization_code</code> or{' '}
								<code>client_credentials</code> grant types. This setting controls whether your app
								configuration supports refresh tokens.
							</div>
						</div>

						{/* Grant Types */}
						<div>
							<span
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.25rem',
									marginBottom: '0.75rem',
									fontWeight: '600',
									color: '#374151',
									fontSize: '0.875rem',
								}}
							>
								Grant Type
								<span
									style={{
										background: '#f3f4f6',
										color: '#6b7280',
										borderRadius: '50%',
										width: '16px',
										height: '16px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '0.75rem',
										cursor: 'help',
									}}
								>
									?
								</span>
							</span>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(2, 1fr)',
									gap: '0.5rem',
								}}
							>
								{[
									'authorization_code',
									'implicit',
									'client_credentials',
									'urn:ietf:params:oauth:grant-type:device_code',
									'urn:openid:params:grant-type:ciba',
								].map((type) => {
									const isAllowed = getAllowedGrantTypes(selectedAppType).includes(type);
									return (
										<label
											key={type}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												padding: '0.5rem',
												borderRadius: '0.5rem',
												background: isAllowed ? 'white' : '#f3f4f6',
												border: isAllowed ? '1px solid #d1d5db' : '1px solid #e5e7eb',
												cursor: isAllowed ? 'pointer' : 'not-allowed',
												opacity: isAllowed ? 1 : 0.5,
											}}
										>
											<input
												type="checkbox"
												checked={createFormData.grantTypes.includes(type)}
												onChange={(e) => {
													if (!isAllowed) return;
													const newGrantTypes = e.target.checked
														? [...createFormData.grantTypes, type]
														: createFormData.grantTypes.filter((t) => t !== type);
													setCreateFormData((prev) => ({ ...prev, grantTypes: newGrantTypes }));
												}}
												disabled={!isAllowed}
												style={{ margin: 0 }}
											/>
											<span
												style={{
													textTransform: 'capitalize',
													fontSize: '0.875rem',
													fontWeight: '500',
													flex: 1,
												}}
											>
												{type === 'urn:openid:params:grant-type:ciba'
													? 'CIBA'
													: type === 'urn:ietf:params:oauth:grant-type:device_code'
														? 'Device Authorization'
														: type.replace('_', ' ')}
											</span>
											{(type === 'urn:ietf:params:oauth:grant-type:device_code' ||
												type === 'urn:openid:params:grant-type:ciba') && (
												<span
													style={{
														background: '#f3f4f6',
														color: '#6b7280',
														borderRadius: '50%',
														width: '16px',
														height: '16px',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '0.75rem',
														cursor: 'help',
														flexShrink: 0,
													}}
													title={
														type === 'urn:openid:params:grant-type:ciba'
															? 'CIBA (RFC 9436): Client Initiated Backchannel Authentication - Enables decoupled authentication where the user approves on a different device'
															: 'Device Authorization Flow (RFC 8628): For input-constrained devices like smart TVs, printers, IoT devices, gaming consoles, etc.'
													}
												>
													?
												</span>
											)}
										</label>
									);
								})}
							</div>
						</div>
					</div>

					<div
						style={{
							background: '#f8fafc',
							padding: '1rem',
							borderRadius: '0.5rem',
							border: '1px solid #e2e8f0',
							fontSize: '0.875rem',
							color: '#64748b',
						}}
					>
						<strong>Application Type:</strong> {selectedAppType}
						<br />
						<strong>Client ID:</strong> {formData.clientId}
						<br />
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
								fontWeight: '600',
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
								<div
									style={{
										background: '#dc2626',
										color: 'white',
										padding: '0.5rem',
										borderRadius: '0.5rem',
										fontSize: '1.25rem',
									}}
								>
									⚠️
								</div>
								<div>
									<h3
										style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}
									>
										Authentication Failed
									</h3>
									<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Worker token is invalid or expired
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setShowAuthErrorModal(false)}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: '0.5rem',
									borderRadius: '0.5rem',
									color: '#6b7280',
								}}
							>
								<FiX size={20} />
							</button>
						</ModalHeader>

						<div
							style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
						>
							<div
								style={{
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '0.5rem',
									padding: '1rem',
									color: '#991b1b',
								}}
							>
								<strong>What happened?</strong>
								<br />
								Your worker token has expired or is invalid. The Config Checker needs a valid worker
								token to access PingOne's Management API.
							</div>

							<div
								style={{
									background: '#f0f9ff',
									border: '1px solid #bae6fd',
									borderRadius: '0.5rem',
									padding: '1rem',
									color: '#0c4a6e',
								}}
							>
								<strong>How to fix:</strong>
								<br />
								1. Go to the <strong>Client Generator</strong> or use the{' '}
								<strong>Worker Token Modal</strong>
								<br />
								2. Generate a new worker token with appropriate scopes
								<br />
								3. Return here and try the Config Checker again
							</div>
						</div>

						<div
							style={{
								display: 'flex',
								gap: '0.75rem',
								justifyContent: 'flex-end',
								padding: '1.5rem',
								borderTop: '1px solid #e5e7eb',
							}}
						>
							<button
								type="button"
								onClick={() => setShowAuthErrorModal(false)}
								style={{
									padding: '0.75rem 1.5rem',
									borderRadius: '0.5rem',
									border: '1px solid #d1d5db',
									background: '#ffffff',
									color: '#374151',
									cursor: 'pointer',
									fontWeight: '600',
								}}
							>
								Close
							</button>
							<button
								type="button"
								onClick={() => {
									setShowAuthErrorModal(false);
									if (onGenerateWorkerToken) {
										onGenerateWorkerToken();
									} else {
										// Fallback: Show instructions to go to Client Generator
										v4ToastManager.showInfo(
											'Please go to the Client Generator to create a new worker token.'
										);
									}
								}}
								style={{
									padding: '0.75rem 1.5rem',
									borderRadius: '0.5rem',
									border: 'none',
									background: '#2563eb',
									color: '#ffffff',
									cursor: 'pointer',
									fontWeight: '600',
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
								<div
									style={{
										background: '#10b981',
										color: 'white',
										padding: '0.5rem',
										borderRadius: '0.5rem',
										fontSize: '1.25rem',
									}}
								>
									✅
								</div>
								<div>
									<h3
										style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}
									>
										Application Created Successfully
									</h3>
									<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Your PingOne application has been created
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setShowCreationResultModal(false)}
								style={{
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: '0.5rem',
									borderRadius: '0.5rem',
									color: '#6b7280',
								}}
							>
								<FiX size={20} />
							</button>
						</ModalHeader>

						<div
							style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
						>
							{/* Application Details */}
							<div
								style={{
									background: '#f0f9ff',
									border: '1px solid #bae6fd',
									borderRadius: '0.5rem',
									padding: '1rem',
								}}
							>
								<h4
									style={{
										margin: '0 0 0.75rem 0',
										fontSize: '0.875rem',
										fontWeight: '600',
										color: '#0c4a6e',
									}}
								>
									Application Details
								</h4>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '0.5rem',
										fontSize: '0.875rem',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<span style={{ color: '#6b7280' }}>Name:</span>
										<span style={{ fontWeight: '500', color: '#1f2937' }}>
											{creationResult.app?.name}
										</span>
									</div>
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<span style={{ color: '#6b7280' }}>Type:</span>
										<span style={{ fontWeight: '500', color: '#1f2937' }}>
											{creationResult.app?.type}
										</span>
									</div>
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<span style={{ color: '#6b7280' }}>Client ID:</span>
										<span style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}>
											{creationResult.app?.clientId}
										</span>
									</div>
									{creationResult.app?.clientSecret && (
										<div style={{ display: 'flex', justifyContent: 'space-between' }}>
											<span style={{ color: '#6b7280' }}>Client Secret:</span>
											<span
												style={{ fontWeight: '500', color: '#1f2937', fontFamily: 'monospace' }}
											>
												{creationResult.app.clientSecret.substring(0, 8)}...
											</span>
										</div>
									)}
								</div>
							</div>

							{/* Next Steps */}
							<div
								style={{
									background: '#fef3c7',
									border: '1px solid #fde68a',
									borderRadius: '0.5rem',
									padding: '1rem',
									color: '#92400e',
								}}
							>
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

						<div
							style={{
								display: 'flex',
								gap: '0.75rem',
								justifyContent: 'flex-end',
								padding: '1.5rem',
								borderTop: '1px solid #e5e7eb',
							}}
						>
							<button
								type="button"
								onClick={() => setShowCreationResultModal(false)}
								style={{
									padding: '0.75rem 1.5rem',
									borderRadius: '0.5rem',
									border: '1px solid #d1d5db',
									background: '#ffffff',
									color: '#374151',
									cursor: 'pointer',
									fontWeight: '600',
								}}
							>
								Close
							</button>
							<button
								type="button"
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
									fontWeight: '600',
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
