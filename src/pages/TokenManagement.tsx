import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
	FiAlertTriangle,
	FiArrowLeft,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiDownload,
	FiEye,
	FiInfo,
	FiKey,
	FiMonitor,
	FiRefreshCw,
	FiShield,
	FiTrash2,
	FiX,
	FiXCircle,
	FiZap,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import ConfirmationModal from '../components/ConfirmationModal';
import StandardMessage from '../components/StandardMessage';
import { TokenSurface } from '../components/TokenSurface';
import { useAuth } from '../contexts/NewAuthContext';
import { useErrorDiagnosis } from '../hooks/useErrorDiagnosis';
import { usePageScroll } from '../hooks/usePageScroll';
import { useTokenAnalysis } from '../hooks/useTokenAnalysis';
import PageLayoutService from '../services/pageLayoutService';
import { createClientAssertion } from '../utils/clientAuthentication';
import {
	getFlowDisplayName,
	getFlowNavigationState,
	navigateBackToFlow,
} from '../utils/flowNavigation';
// JWT decoding functionality handled by token analysis service
import {
	clearTokenHistory,
	getFlowIcon,
	getTokenHistory,
	removeTokenFromHistory,
	type TokenHistoryEntry,
} from '../utils/tokenHistory';
import { getOAuthTokens } from '../utils/tokenStorage';
import { v4ToastManager } from '../utils/v4ToastMessages';

type TokenIntrospectionResult = {
	active?: boolean;
	scope?: string;
	client_id?: string;
	username?: string;
	token_type?: string;
	exp?: number;
	iat?: number;
	nbf?: number;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	jti?: string;
	auth_time?: number;
	nonce?: string;
	acr?: string;
	amr?: string | string[];
	at_hash?: string;
	c_hash?: string;
	email?: string;
	given_name?: string;
	family_name?: string;
};

type IntrospectionCredentials = {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	tokenAuthMethod?: string;
	privateKey?: string;
};

type IntrospectionRequestBody = {
	token: string;
	client_id: string;
	introspection_endpoint: string;
	token_auth_method: string;
	client_secret?: string;
	client_assertion?: string;
	client_assertion_type?: string;
};

const _Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;

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

const TokenSection = styled(Card)`
  margin-bottom: 2rem;
`;

const TokenStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  &.valid {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  &.expired {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }

  &.none {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &.valid { background-color: #22c55e; }
    &.expired { background-color: #ef4444; }
    &.none { background-color: #9ca3af; }
  }

  .text {
    font-weight: 500;
  }
`;

const TokenDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  .detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: ${({ theme }) => theme.colors.gray600};
    }

    .value {
      font-family: monospace;
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.gray900};
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &.primary {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};

    &:hover {
      background-color: ${({ theme }) => theme.colors.primary}10;
    }
  }

  &.danger {
    background-color: #dc2626;
    color: white;

    &:hover {
      background-color: #b91c1c;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HistoryTableHeader = styled.thead`
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
`;

const HistoryTableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
`;

const HistoryTableBody = styled.tbody`
  tr:nth-child(even) {
    background: #f9fafb;
  }
  
  tr:hover {
    background: #f1f5f9;
    cursor: pointer;
  }
`;

const HistoryTableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s ease;
`;

const HistoryTableCell = styled.td`
  padding: 1rem;
  vertical-align: middle;
  font-size: 0.875rem;
  color: #374151;
`;

const FlowBadge = styled.span<{ $flowType: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $flowType }) => {
		if ($flowType.includes('oauth-v3')) return '#dbeafe';
		if ($flowType.includes('oidc-v3')) return '#d1fae5';
		if ($flowType.includes('enhanced')) return '#e0f2fe';
		if ($flowType.includes('implicit')) return '#fee2e2';
		return '#f3f4f6';
	}};
  color: ${({ $flowType }) => {
		if ($flowType.includes('oauth-v3')) return '#1e40af';
		if ($flowType.includes('oidc-v3')) return '#065f46';
		if ($flowType.includes('enhanced')) return '#0369a1';
		if ($flowType.includes('implicit')) return '#dc2626';
		return '#374151';
	}};
  border: 1px solid ${({ $flowType }) => {
		if ($flowType.includes('oauth-v3')) return '#93c5fd';
		if ($flowType.includes('oidc-v3')) return '#6ee7b7';
		if ($flowType.includes('enhanced')) return '#7dd3fc';
		if ($flowType.includes('implicit')) return '#fecaca';
		return '#d1d5db';
	}};
`;

const TokenBadge = styled.span<{ $type: 'access' | 'id' | 'refresh' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.5rem;
  background: ${({ $type }) => {
		switch ($type) {
			case 'access':
				return '#dbeafe';
			case 'id':
				return '#fef3c7';
			case 'refresh':
				return '#d1fae5';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${({ $type }) => {
		switch ($type) {
			case 'access':
				return '#1e40af';
			case 'id':
				return '#92400e';
			case 'refresh':
				return '#065f46';
			default:
				return '#374151';
		}
	}};
  border: 1px solid ${({ $type }) => {
		switch ($type) {
			case 'access':
				return '#93c5fd';
			case 'id':
				return '#fcd34d';
			case 'refresh':
				return '#6ee7b7';
			default:
				return '#d1d5db';
		}
	}};
`;

const HistoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const HistoryButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          &:hover {
            background-color: #2563eb;
          }
        `;
			case 'danger':
				return `
          background-color: #dc2626;
          color: white;
          &:hover {
            background-color: #b91c1c;
          }
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: #374151;
          border-color: #d1d5db;
          &:hover {
            background-color: #e5e7eb;
          }
        `;
		}
	}}
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

// New styled components for enhanced features
const AnalysisSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SecurityScoreCard = styled.div<{ $score: number }>`
  padding: 1rem;
  border-radius: 0.5rem;
  background: ${({ $score }) => {
		if ($score >= 80) return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
		if ($score >= 60) return 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)';
		if ($score >= 40) return 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)';
		return 'linear-gradient(135deg, #fef2f2 0%, #fca5a5 100%)';
	}};
  border: 1px solid ${({ $score }) => {
		if ($score >= 80) return '#bbf7d0';
		if ($score >= 60) return '#fde68a';
		if ($score >= 40) return '#fecaca';
		return '#fca5a5';
	}};
`;

const ScoreCircle = styled.div<{ $score: number }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ $score }) => {
		if ($score >= 80) return '#16a34a';
		if ($score >= 60) return '#d97706';
		if ($score >= 40) return '#dc2626';
		return '#991b1b';
	}};
  background: ${({ $score }) => {
		if ($score >= 80) return '#dcfce7';
		if ($score >= 60) return '#fef3c7';
		if ($score >= 40) return '#fecaca';
		return '#fca5a5';
	}};
  margin: 0 auto 1rem;
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const IssueItem = styled.div<{
	$severity: 'low' | 'medium' | 'high' | 'critical';
}>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  border-left: 4px solid ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return '#dc2626';
			case 'high':
				return '#ea580c';
			case 'medium':
				return '#d97706';
			case 'low':
				return '#16a34a';
			default:
				return '#6b7280';
		}
	}};
  background-color: ${({ $severity }) => {
		switch ($severity) {
			case 'critical':
				return '#fef2f2';
			case 'high':
				return '#fff7ed';
			case 'medium':
				return '#fffbeb';
			case 'low':
				return '#f0fdf4';
			default:
				return '#f9fafb';
		}
	}};
`;

const FixList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FixItem = styled.div<{
	$priority: 'low' | 'medium' | 'high' | 'critical';
}>`
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid ${({ $priority }) => {
		switch ($priority) {
			case 'critical':
				return '#dc2626';
			case 'high':
				return '#ea580c';
			case 'medium':
				return '#d97706';
			case 'low':
				return '#16a34a';
			default:
				return '#d1d5db';
		}
	}};
  background-color: ${({ $priority }) => {
		switch ($priority) {
			case 'critical':
				return '#fef2f2';
			case 'high':
				return '#fff7ed';
			case 'medium':
				return '#fffbeb';
			case 'low':
				return '#f0fdf4';
			default:
				return '#ffffff';
		}
	}};
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: ${({ $active }) => ($active ? '#3b82f6' : '#6b7280')};
  border-bottom-color: ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
  
  &:hover {
    color: #3b82f6;
  }
`;

const TabContent = styled.div<{ $active: boolean }>`
  display: ${({ $active }) => ($active ? 'block' : 'none')};
`;

const RefreshStatus = styled.div<{
	$status: 'valid' | 'expiring' | 'expired' | 'unknown';
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${({ $status }) => {
		switch ($status) {
			case 'valid':
				return '#f0fdf4';
			case 'expiring':
				return '#fef3c7';
			case 'expired':
				return '#fef2f2';
			default:
				return '#f9fafb';
		}
	}};
  color: ${({ $status }) => {
		switch ($status) {
			case 'valid':
				return '#16a34a';
			case 'expiring':
				return '#d97706';
			case 'expired':
				return '#dc2626';
			default:
				return '#6b7280';
		}
	}};
  border: 1px solid ${({ $status }) => {
		switch ($status) {
			case 'valid':
				return '#bbf7d0';
			case 'expiring':
				return '#fde68a';
			case 'expired':
				return '#fecaca';
			default:
				return '#e5e7eb';
		}
	}};
`;

const TokenManagement = () => {
	const { tokens } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	// Token analysis hooks
	const { getTokenTypeInfo } = useTokenAnalysis();

	// Flow navigation state
	const [flowNavigationState] = useState(() => getFlowNavigationState());

	// Track the last user-selected token type
	const lastSelectedTokenType = useRef<string | null>(null);

	// Scroll to top when page loads
	// Use centralized scroll management
	usePageScroll({ pageName: 'Token Management', force: true });

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for token management (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'token-management', // Enables FlowHeader integration
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	// Track flow source so tokens passed from other flows persist after sessionStorage is cleared
	const [flowSourceState, setFlowSourceState] = useState(() => {
		// Check for new flow context first, then fall back to old flow_source
		const tokenManagementFlowContext = sessionStorage.getItem('tokenManagementFlowContext');
		if (tokenManagementFlowContext) {
			try {
				const context = JSON.parse(tokenManagementFlowContext);
				return context.flow || '';
			} catch (error) {
				console.warn('Failed to parse tokenManagementFlowContext:', error);
			}
		}
		// Check localStorage first (for cross-tab), then sessionStorage
		return localStorage.getItem('flow_source') || sessionStorage.getItem('flow_source') || '';
	});

	const isOAuthFlow = flowSourceState.includes('oauth') && !flowSourceState.includes('oidc');
	const isOIDCFlow = flowSourceState.includes('oidc') || flowSourceState.includes('enhanced');

	console.log(' [TokenManagement] Flow source detection:', {
		flowSource: flowSourceState,
		isOAuthFlow,
		isOIDCFlow,
		shouldShowIdToken: isOIDCFlow,
	});

	const [tokenString, setTokenString] = useState('');
	const [jwtHeader, setJwtHeader] = useState('');
	const [jwtPayload, setJwtPayload] = useState('');
	const [tokenStatus, setTokenStatus] = useState('none');
	const [isLoading, setIsLoading] = useState(false);
	const [tokenSource, setTokenSource] = useState<Record<string, unknown> | null>(null);
	const [tokenHistory, setTokenHistory] = useState<TokenHistoryEntry[]>([]);
	const [activeTab, setActiveTab] = useState<'analysis' | 'diagnosis'>('analysis');
	const [errorInput, setErrorInput] = useState('');

	// Determine if current token is an access token based on token source
	const isAccessToken =
		tokenSource?.description &&
		(tokenSource.description as string).toLowerCase().includes('access token');
	const [message, setMessage] = useState<{
		type: 'success' | 'error' | 'warning' | 'info';
		title?: string;
		message: string;
	} | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showRevokeModal, setShowRevokeModal] = useState(false);
	const [showClearModal, setShowClearModal] = useState(false);
	const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
	const [showRemoveHistoryModal, setShowRemoveHistoryModal] = useState(false);
	const [historyEntryToRemove, setHistoryEntryToRemove] = useState<string | null>(null);
	const [introspectionResults, setIntrospectionResults] = useState<TokenIntrospectionResult | null>(
		null
	);
	const introspectionSectionRef = useRef<HTMLDivElement>(null);

	// Token analysis hook
	const {
		analyzeToken,
		currentAnalysis,
		refreshInfo,
		getTokenExpirationStatus,
		getTokenSecurityScore,
		getCriticalIssues,
		getValidationErrors,
		isAnalyzing,
		hasIssues,
		hasErrors,
		canRefresh,
	} = useTokenAnalysis({ enabled: true, autoAnalyze: true });

	// Error diagnosis hook
	const {
		diagnoseError,
		currentDiagnosis,
		getSuggestedFixes,
		getErrorConfidence,
		getErrorSeverity,
		getErrorCategory,
		isDiagnosing,
		hasCurrentDiagnosis,
	} = useErrorDiagnosis({ enabled: true });

	// Mock token data for demonstration
	const mockTokenData = {
		access_token:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
		token_type: 'Bearer',
		expires_in: 3600,
		refresh_token: 'refresh-token-123',
		scope: 'openid profile email',
	};

	// Generate a realistic-looking but intentionally flawed PingOne token for security demonstration
	const generateBadSecurityToken = () => {
		const now = Math.floor(Date.now() / 1000);

		// Create a token with MAJOR security flaws that will definitely get a low score
		const header = {
			alg: 'none', // CRITICAL: No signature algorithm (most dangerous)
			typ: 'JWT',
			// Missing kid, iss, etc.
		};

		// Create a payload with multiple critical security issues
		const payload = {
			// CRITICAL ISSUES:
			iss: 'https://evil-site.com', // Malicious issuer
			sub: 'admin', // Weak subject
			aud: 'all-apps', // Overly broad audience
			exp: now + 86400 * 365, // Expires in 1 year (way too long)
			iat: now - 86400 * 30, // Issued 30 days ago (way too old)

			// HIGH RISK ISSUES:
			auth_time: now - 86400 * 7, // Auth time 7 days ago (too old)
			nonce: '123', // Extremely weak nonce

			// MISSING CRITICAL CLAIMS:
			// acr: missing (Authentication Context Class Reference)
			// amr: missing (Authentication Methods References)
			// azp: missing (Authorized Party)
			// at_hash: missing (Access Token hash)
			// c_hash: missing (Code hash)

			// SUSPICIOUS USER CLAIMS:
			name: 'Administrator',
			email: 'admin@evil.com',
			email_verified: false, // Email not verified
			picture: 'http://evil-site.com/avatar.jpg', // Insecure HTTP

			// DANGEROUS CUSTOM CLAIMS:
			'custom:role': 'super-admin', // Overly broad role
			'custom:permissions': ['*'], // All permissions
			'custom:bypass_security': true, // Security bypass flag
			'custom:internal_ip': '192.168.1.1', // Internal network info
			'custom:admin_override': true, // Admin override

			// WEAK JWT CLAIMS:
			jti: '1', // Extremely weak JTI
			nbf: now - 86400, // Not before in past

			// MALICIOUS CLAIMS:
			'malicious:inject': '<script>alert("xss")</script>', // XSS attempt
			'malicious:sql': "'; DROP TABLE users; --", // SQL injection attempt
		};

		// Encode header and payload
		const encodedHeader = btoa(JSON.stringify(header))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
		const encodedPayload = btoa(JSON.stringify(payload))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');

		// CRITICAL: No signature for 'none' algorithm
		const noSignature = '';

		return `${encodedHeader}.${encodedPayload}.${noSignature}`;
	};

	const decodeJWT = useCallback(
		(token: string) => {
			try {
				if (!token || token.trim() === '') {
					throw new Error('Please enter a JWT token');
				}

				console.log(
					' [TokenManagement] Attempting to decode token:',
					`${token.substring(0, 50)}...`
				);

				const parts = token.split('.');
				console.log(' [TokenManagement] Token parts count:', parts.length);

				if (parts.length !== 3) {
					throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
				}

				// Helper function to decode base64url
				const base64UrlDecode = (str: string): string => {
					// Add padding if needed
					const padding = '='.repeat((4 - (str.length % 4)) % 4);
					const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
					return atob(base64);
				};

				try {
					const headerDecoded = base64UrlDecode(parts[0]);
					const payloadDecoded = base64UrlDecode(parts[1]);

					console.log(' [TokenManagement] Successfully decoded JWT header');
					console.log(' [TokenManagement] Successfully decoded JWT payload');

					// Parse and format JSON for better display
					try {
						const headerJson = JSON.parse(headerDecoded);
						const payloadJson = JSON.parse(payloadDecoded);
						setJwtHeader(JSON.stringify(headerJson, null, 2));
						setJwtPayload(JSON.stringify(payloadJson, null, 2));
					} catch (jsonError) {
						// If parsing fails, use raw decoded strings
						console.warn(' [TokenManagement] Failed to parse JSON, using raw strings:', jsonError);
						setJwtHeader(headerDecoded);
						setJwtPayload(payloadDecoded);
					}

					setTokenStatus('valid');

					// Update token string only if it's different (to avoid unnecessary re-renders)
					if (tokenString !== token) {
						setTokenString(token);
					}
				} catch (parseError) {
					console.error(' [TokenManagement] Error parsing JWT:', parseError);
					setJwtHeader('');
					setJwtPayload('');
					setTokenStatus('invalid');
					throw new Error(`Failed to parse JWT: ${parseError}`);
				}
			} catch (error) {
				console.error(' [TokenManagement] JWT decode error:', error);
				setJwtHeader('');
				setJwtPayload('');
				setTokenStatus('invalid');

				if (error instanceof Error) {
					setTokenSource({
						source: 'Error',
						description: error.message,
						timestamp: new Date().toLocaleString(),
					});
				}

				throw error;
			}
		},
		[tokenString]
	);

	// Update the token type when user selects a specific token
	const updateSelectedTokenType = (type: string) => {
		lastSelectedTokenType.current = type;
	};

	useEffect(() => {
		const checkForPassedToken = () => {
			// Check location.state first (from UnifiedTokenDisplayService navigation)
			const locationState = location.state as any;
			if (locationState?.token) {
				console.log('✅ [TokenManagement] Found token from navigation state:', {
					tokenType: locationState.tokenType,
					label: locationState.label,
					source: locationState.source,
					tokenLength: locationState.token.length,
				});

				setTokenString(locationState.token);
				setTokenSource({
					source: 'Flow Navigation',
					description: `${locationState.label || 'Token'} from ${locationState.source || 'unknown'}`,
					timestamp: new Date().toLocaleString(),
				});
				setFlowSourceState(locationState.source || 'unknown');
				lastSelectedTokenType.current = locationState.tokenType || 'access';

				// Auto-decode the passed token
				setTimeout(() => decodeJWT(locationState.token), 100);
				setTokenStatus('valid');

				// Clear location state
				window.history.replaceState({}, document.title);

				return true; // Token was loaded from navigation state
			}

			// Check both localStorage (for cross-tab) and sessionStorage (for same-tab)
			const tokenToAnalyze =
				localStorage.getItem('token_to_analyze') || sessionStorage.getItem('token_to_analyze');
			const tokenType =
				localStorage.getItem('token_type') || sessionStorage.getItem('token_type') || 'access';
			const flowSource =
				localStorage.getItem('flow_source') || sessionStorage.getItem('flow_source') || 'unknown';

			// Update the last selected token type
			lastSelectedTokenType.current = tokenType;

			console.log(' [TokenManagement] Checking for passed token:', {
				hasToken: !!tokenToAnalyze,
				tokenType,
				flowSource,
				fromLocalStorage: !!localStorage.getItem('token_to_analyze'),
				fromSessionStorage: !!sessionStorage.getItem('token_to_analyze'),
			});

			if (tokenToAnalyze) {
				console.log(' [TokenManagement] Found token passed from flow:', {
					tokenType,
					flowSource,
					tokenLength: tokenToAnalyze.length,
					tokenPreview: `${tokenToAnalyze.substring(0, 20)}...`,
				});

				setTokenString(tokenToAnalyze);
				setTokenSource({
					source: 'Flow Navigation',
					description: `${tokenType.replace('_', ' ').toUpperCase()} from ${flowSource}`,
					timestamp: new Date().toLocaleString(),
				});
				setFlowSourceState(flowSource);

				// Auto-decode the passed token
				setTimeout(() => decodeJWT(tokenToAnalyze), 100);
				setTokenStatus('valid');

				// Clear both localStorage and sessionStorage after loading
				localStorage.removeItem('token_to_analyze');
				localStorage.removeItem('token_type');
				localStorage.removeItem('flow_source');
				sessionStorage.removeItem('token_to_analyze');
				sessionStorage.removeItem('token_type');
				sessionStorage.removeItem('flow_source');

				return true; // Token was loaded successfully
			}
			return false; // No token in sessionStorage
		};

		// Auto-load current Access Token from auth context or storage
		const loadCurrentToken = () => {
			try {
				console.log(' [TokenManagement] Loading current token from auth context:', tokens);

				// First check for token passed from other flows
				if (checkForPassedToken()) {
					return; // Token was loaded from sessionStorage, skip other loading
				}

				// First try to get token from auth context
				let currentTokens = tokens;

				// If no tokens in auth context or no access token, try to load from storage
				if (!currentTokens || !currentTokens.access_token) {
					console.log(' [TokenManagement] No access token in auth context, checking storage...');
					const storageTokens = getOAuthTokens();
					if (
						storageTokens &&
						(storageTokens.access_token || storageTokens.id_token || storageTokens.refresh_token)
					) {
						console.log(' [TokenManagement] Found tokens in secure storage:', storageTokens);
						currentTokens = storageTokens;
						// Only set storage/manual if no flow context exists
						if (
							!sessionStorage.getItem('tokenManagementFlowContext') &&
							!sessionStorage.getItem('flow_source') &&
							!localStorage.getItem('flow_source')
						) {
							setFlowSourceState('storage/manual');
						}
					} else {
						// Check localStorage for tokens from Authorization Code flow
						console.log(' [TokenManagement] Checking localStorage for oauth_tokens...');
						const localStorageTokens = localStorage.getItem('oauth_tokens');
						if (localStorageTokens) {
							try {
								const parsedTokens = JSON.parse(localStorageTokens);
								console.log(' [TokenManagement] Found tokens in localStorage:', parsedTokens);
								if (
									parsedTokens &&
									(parsedTokens.access_token || parsedTokens.id_token || parsedTokens.refresh_token)
								) {
									currentTokens = parsedTokens;
									// Only set storage/manual if no flow context exists
									if (
										!sessionStorage.getItem('tokenManagementFlowContext') &&
										!sessionStorage.getItem('flow_source') &&
										!localStorage.getItem('flow_source')
									) {
										setFlowSourceState('storage/manual');
									}
								}
							} catch (parseError) {
								console.error(' [TokenManagement] Error parsing localStorage tokens:', parseError);
							}
						}
					}
				}

				// Skip auto-loading if user has manually selected a token
				if (lastSelectedTokenType.current && tokenString) {
					console.log(
						`[TokenManagement] User has selected ${lastSelectedTokenType.current}, skipping auto-load`
					);
					return;
				}

				// Auto-load the best available token (prefer access token, then ID token, then refresh token)
				let tokenToLoad = null;
				let tokenTypeToLoad = '';

				if (currentTokens?.access_token) {
					tokenToLoad = currentTokens.access_token;
					tokenTypeToLoad = 'access_token';
				} else if (currentTokens?.id_token) {
					tokenToLoad = currentTokens.id_token;
					tokenTypeToLoad = 'id_token';
				} else if (currentTokens?.refresh_token) {
					tokenToLoad = currentTokens.refresh_token;
					tokenTypeToLoad = 'refresh_token';
				}

				if (tokenToLoad) {
					console.log(
						` [TokenManagement] Found current ${tokenTypeToLoad}, auto-loading and decoding`
					);
					setTokenString(tokenToLoad);
					setTokenSource({
						source: currentTokens === tokens ? 'Current Session' : 'Stored Tokens',
						description: `${tokenTypeToLoad.replace('_', ' ').toUpperCase()} from ${currentTokens.token_type || 'Bearer'} flow`,
						timestamp: new Date().toLocaleString(),
					});

					// Auto-decode the token
					setTimeout(() => decodeJWT(tokenToLoad), 100);

					// Update token status based on expiration
					if (currentTokens?.expires_at) {
						const now = Date.now();
						const expiresAt = new Date(currentTokens.expires_at).getTime();
						setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
					} else if (currentTokens?.expires_in) {
						// Calculate expiration from expires_in
						const now = Date.now();
						const expiresAt = now + currentTokens.expires_in * 1000;
						setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
					} else {
						setTokenStatus('valid');
					}
				} else {
					console.log(' [TokenManagement] No tokens found in auth context or storage');
					setTokenStatus('none');
				}
			} catch (error) {
				console.error(' [TokenManagement] Error loading current token:', error);
				setTokenStatus('none');
			}
		};

		const timer = setTimeout(loadCurrentToken, 100);

		const history = getTokenHistory();

		if (history.entries.length === 0 && tokens?.access_token) {
			console.log(
				' [TokenManagement] No history found, creating sample entries with current tokens'
			);

			// Create a history entry for the current OAuth session
			const { addTokenToHistory } = require('../utils/tokenHistory');
			const success = addTokenToHistory(
				'enhanced-authorization-code-v3',
				'Enhanced Authorization Code Flow V3',
				{
					access_token: tokens.access_token,
					id_token: tokens.id_token,
					refresh_token: tokens.refresh_token,
					token_type: tokens.token_type || 'Bearer',
					expires_in: tokens.expires_in || 3600,
					scope: tokens.scope || 'openid profile email',
				}
			);

			if (success) {
				// Reload history after adding current tokens
				const updatedHistory = getTokenHistory();
				setTokenHistory(updatedHistory.entries);
				console.log(' [TokenManagement] Added current tokens to history');
			}
		} else {
			setTokenHistory(history.entries);
			console.log(
				' [TokenManagement] Loaded existing token history:',
				history.entries.length,
				'entries'
			);
		}

		return () => clearTimeout(timer);
	}, [tokens, decodeJWT, tokenString, location]);

	const handleTokenInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { value } = e.target;
		setTokenString(value);
		setSuccessMessage(null); // Clear success message when user types

		const nativeEvent = e.nativeEvent as InputEvent | undefined;
		const inputType = nativeEvent?.inputType;
		const pasted = inputType === 'insertFromPaste' || inputType === 'insertReplacementText';

		if (pasted) {
			const trimmed = value.trim();
			if (trimmed) {
				setTimeout(() => decodeJWT(trimmed), 0);
			}
		}
	};

	const handleDecodeClick = () => {
		// If no token in input, try to get current token from auth context or storage
		if (!tokenString || tokenString.trim() === '') {
			console.log(' [TokenManagement] No token in input, attempting to load current token...');

			// Try to get token from auth context first
			console.log(' [TokenManagement] Auth context tokens:', tokens);
			if (tokens?.access_token) {
				console.log(' [TokenManagement] Loading token from auth context for decoding');
				setTokenString(tokens.access_token);
				setTimeout(() => decodeJWT(tokens.access_token), 100);
				return;
			}

			// Try to get token from storage
			const storedTokens = getOAuthTokens();
			console.log(' [TokenManagement] Stored tokens from getOAuthTokens():', storedTokens);
			if (storedTokens?.access_token) {
				console.log(' [TokenManagement] Loading token from storage for decoding');
				setTokenString(storedTokens.access_token);
				setTimeout(() => decodeJWT(storedTokens.access_token), 100);
				return;
			}

			// No token available
			console.log(' [TokenManagement] No token available in auth context or storage');
			v4ToastManager.showWarning('saveConfigurationStart');
			return;
		}

		decodeJWT(tokenString.trim());
	};

	const _handleGetToken = async () => {
		setIsLoading(true);
		try {
			console.log(' [TokenManagement] Getting current token from auth context:', tokens);

			let currentTokens = tokens;

			// If no tokens in auth context, try to load from storage
			if (!currentTokens || !currentTokens.access_token) {
				console.log(' [TokenManagement] No tokens in auth context, checking storage...');
				currentTokens = getOAuthTokens();
				if (currentTokens) {
					console.log(' [TokenManagement] Found tokens in storage:', currentTokens);
				}
			}

			if (currentTokens?.access_token) {
				console.log(' [TokenManagement] Loading current access token');
				setTokenString(currentTokens.access_token);
				setTokenSource({
					source: currentTokens === tokens ? 'Current Session' : 'Stored Tokens',
					description: `Access Token from ${currentTokens.token_type || 'Bearer'} flow`,
					timestamp: new Date().toLocaleString(),
				});

				// Auto-decode the token
				decodeJWT(currentTokens.access_token);

				// Update token status based on expiration
				if (currentTokens.expires_at) {
					const now = Date.now();
					const expiresAt = new Date(currentTokens.expires_at).getTime();
					setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
				} else if (currentTokens.expires_in) {
					const now = Date.now();
					const expiresAt = now + currentTokens.expires_in * 1000;
					setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
				} else {
					setTokenStatus('valid');
				}
			} else {
				console.log(' [TokenManagement] No current access token available');
				v4ToastManager.showError(
					'No access token found - please generate tokens first or load from storage'
				);
			}
		} catch (error) {
			console.error(' [TokenManagement] Error getting token:', error);
			v4ToastManager.showError('networkError');
		} finally {
			setIsLoading(false);
		}
	};

	const handleGetSpecificToken = async (
		tokenType: 'access_token' | 'id_token' | 'refresh_token'
	) => {
		setIsLoading(true);
		try {
			// Update the last selected token type
			updateSelectedTokenType(tokenType);
			console.log(` [TokenManagement] Getting ${tokenType} from auth context:`, tokens);

			let currentTokens = tokens;

			// If no tokens in auth context OR the specific token type is missing, try to load from storage
			if (!currentTokens || !currentTokens[tokenType]) {
				console.log(` [TokenManagement] No ${tokenType} in auth context, checking storage...`);
				const storageTokens = getOAuthTokens();
				if (storageTokens?.[tokenType]) {
					console.log(` [TokenManagement] Found ${tokenType} in secure storage:`, storageTokens);
					currentTokens = storageTokens;
				} else {
					// Check localStorage for tokens from Authorization Code flow
					console.log(' [TokenManagement] Checking localStorage for oauth_tokens...');
					const localStorageTokens = localStorage.getItem('oauth_tokens');
					if (localStorageTokens) {
						try {
							const parsedTokens = JSON.parse(localStorageTokens);
							console.log(' [TokenManagement] Found tokens in localStorage:', parsedTokens);
							if (parsedTokens?.[tokenType]) {
								currentTokens = parsedTokens;
							}
						} catch (parseError) {
							console.error(' [TokenManagement] Error parsing localStorage tokens:', parseError);
						}
					}
				}
			}

			// Debug: Log all available token types
			if (currentTokens) {
				console.log(' [TokenManagement] Available tokens:', {
					access_token: currentTokens.access_token ? '' : '',
					id_token: currentTokens.id_token ? '' : '',
					refresh_token: currentTokens.refresh_token ? '' : '',
					token_type: currentTokens.token_type || 'none',
					expires_in: currentTokens.expires_in || 'none',
				});
			}

			if (currentTokens?.[tokenType]) {
				console.log(` [TokenManagement] Loading current ${tokenType}`);
				setTokenString(currentTokens[tokenType]);
				setTokenSource({
					source: currentTokens === tokens ? 'Current Session' : 'Stored Tokens',
					description: `${tokenType.replace('_', ' ').toUpperCase()} from ${currentTokens.token_type || 'Bearer'} flow`,
					timestamp: new Date().toLocaleString(),
				});

				// Auto-decode the token
				decodeJWT(currentTokens[tokenType]);

				// Update token status based on expiration
				if (currentTokens.expires_at) {
					const now = Date.now();
					const expiresAt = new Date(currentTokens.expires_at).getTime();
					setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
				} else if (currentTokens.expires_in) {
					const now = Date.now();
					const expiresAt = now + currentTokens.expires_in * 1000;
					setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
				} else {
					setTokenStatus('valid');
				}

				// Show success message and update the last selected token type
				setSuccessMessage(` ${tokenType.replace('_', ' ').toUpperCase()} loaded successfully!`);
				updateSelectedTokenType(tokenType);
			} else {
				console.log(` [TokenManagement] No current ${tokenType} available`);
				console.log(' [TokenManagement] Current tokens object:', currentTokens);
				v4ToastManager.showError('saveConfigurationValidationError', {
					fields: tokenType.replace('_', ' '),
				});
			}
		} catch (error) {
			console.error(` [TokenManagement] Error getting ${tokenType}:`, error);
			v4ToastManager.showError('networkError');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyToken = async () => {
		if (tokenString) {
			try {
				await navigator.clipboard.writeText(tokenString);
				v4ToastManager.showCopySuccess('Token');
			} catch (error) {
				console.error('Error copying token:', error);
			}
		}
	};

	const handleIntrospectToken = async () => {
		if (!tokenString) {
			v4ToastManager.showError('stepError');
			return;
		}

		// Detect token type from JWT payload
		let tokenType = 'unknown';
		try {
			const parts = tokenString.split('.');
			if (parts.length === 3) {
				const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
				tokenType = payload.typ || (payload.aud && payload.nonce ? 'id_token' : 'access_token');
			}
		} catch (_e) {
			console.warn('[TokenManagement] Could not detect token type from payload');
		}

		// Check if token type can be introspected
		if (tokenType === 'id_token' || jwtPayload?.includes('"nonce"')) {
			v4ToastManager.showWarning('introspectionNotSupported');
			return;
		}

		setIsLoading(true);
		try {
			console.log(' [TokenManagement] Starting token introspection...');
			console.log(' [TokenManagement] Detected token type:', tokenType);

			// Get credentials based on flow source
			const { credentialManager } = await import('../utils/credentialManager');
			let allCredentials: IntrospectionCredentials = {};

			// Load credentials based on the flow source
			if (
				flowSourceState.includes('oidc-v3') ||
				flowSourceState.includes('oauth-v3') ||
				flowSourceState.includes('authorization-code-v5') ||
				flowSourceState.includes('oidc-authorization-code-v5') ||
				flowSourceState.includes('oauth-authorization-code-v5')
			) {
				// For OIDC/OAuth V3/V5 flows, use authz flow credentials
				allCredentials = credentialManager.loadAuthzFlowCredentials();
				console.log(' [TokenManagement] Loaded authz flow credentials for OIDC/OAuth V3/V5');
			} else if (
				flowSourceState.includes('worker-token-v3') ||
				flowSourceState.includes('worker-token-v5')
			) {
				// For Worker Token V3/V5, use worker flow credentials
				allCredentials = credentialManager.loadWorkerFlowCredentials();
				console.log(' [TokenManagement] Loaded worker flow credentials');
			} else if (flowSourceState.includes('implicit')) {
				// For Implicit flows, use implicit flow credentials
				allCredentials = credentialManager.loadImplicitFlowCredentials();
				console.log(' [TokenManagement] Loaded implicit flow credentials');
			} else {
				// Fallback to all credentials
				allCredentials = credentialManager.getAllCredentials();
				console.log(' [TokenManagement] Loaded all credentials as fallback');
			}

			// If we still don't have credentials, try to load from config credentials as last resort
			if (!allCredentials.environmentId || !allCredentials.clientId) {
				console.log(
					' [TokenManagement] Flow-specific credentials incomplete, trying config credentials...'
				);
				const configCredentials = credentialManager.loadConfigCredentials();
				if (configCredentials.environmentId && configCredentials.clientId) {
					allCredentials = { ...allCredentials, ...configCredentials };
					console.log(' [TokenManagement] Merged config credentials with flow credentials');
				}
			}

			console.log(' [TokenManagement] Credentials loaded for introspection:', {
				flowSource: flowSourceState,
				hasEnvironmentId: !!allCredentials.environmentId,
				hasClientId: !!allCredentials.clientId,
				hasClientSecret: !!allCredentials.clientSecret,
				hasTokenAuthMethod: !!allCredentials.tokenAuthMethod,
				environmentId: allCredentials.environmentId,
				clientId: allCredentials.clientId
					? `${allCredentials.clientId.substring(0, 8)}...`
					: 'MISSING',
				tokenAuthMethod: allCredentials.tokenAuthMethod || 'NOT_SET',
			});

			if (!allCredentials.environmentId) {
				v4ToastManager.showError('introspectionCredentialsRequired');
				return;
			}

			const environmentId = allCredentials.environmentId;

			// Get client credentials and authentication method from credential manager
			if (!allCredentials.clientId) {
				v4ToastManager.showError('introspectionCredentialsRequired');
				return;
			}

			const introspectionEndpoint = `https://auth.pingone.com/${environmentId}/as/introspect`;
			const tokenAuthMethod = allCredentials.tokenAuthMethod || 'client_secret_post';

			console.log(' [TokenManagement] Introspection endpoint:', introspectionEndpoint);
			console.log(' [TokenManagement] Token auth method:', tokenAuthMethod);

			// Prepare introspection request based on authentication method
			const introspectionBody: IntrospectionRequestBody = {
				token: tokenString,
				client_id: allCredentials.clientId,
				introspection_endpoint: introspectionEndpoint,
				token_auth_method: tokenAuthMethod,
			};

			// Add client secret for methods that require it
			if (tokenAuthMethod === 'client_secret_basic' || tokenAuthMethod === 'client_secret_post') {
				if (!allCredentials.clientSecret) {
					throw new Error(
						'Client secret not available for introspection. Please configure your credentials first.'
					);
				}
				introspectionBody.client_secret = allCredentials.clientSecret;
			}

			// For JWT-based methods, we need to generate a client assertion
			if (tokenAuthMethod === 'client_secret_jwt' || tokenAuthMethod === 'private_key_jwt') {
				const assertionType = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
				try {
					if (tokenAuthMethod === 'private_key_jwt') {
						if (!allCredentials.privateKey) {
							throw new Error(
								'Private key not available for private_key_jwt introspection. Please configure your credentials first.'
							);
						}
						const assertion = await createClientAssertion(
							allCredentials.clientId!,
							introspectionEndpoint,
							allCredentials.privateKey,
							'RS256'
						);
						console.log(
							' [TokenManagement] Generated private_key_jwt assertion for introspection',
							{
								assertionLength: assertion.length,
							}
						);
						introspectionBody.client_assertion_type = assertionType;
						introspectionBody.client_assertion = assertion;
					} else {
						if (!allCredentials.clientSecret) {
							throw new Error(
								'Client secret not available for client_secret_jwt introspection. Please configure your credentials first.'
							);
						}
						const assertion = await createClientAssertion(
							allCredentials.clientId!,
							introspectionEndpoint,
							allCredentials.clientSecret,
							'HS256'
						);
						console.log(
							' [TokenManagement] Generated client_secret_jwt assertion for introspection',
							{
								assertionLength: assertion.length,
							}
						);
						introspectionBody.client_assertion_type = assertionType;
						introspectionBody.client_assertion = assertion;
					}
				} catch (assertionError) {
					console.error(
						' [TokenManagement] Failed to generate client assertion for introspection',
						assertionError
					);
					v4ToastManager.showError('Failed to generate client assertion for introspection.');
					return;
				}
			}

			const response = await fetch('/api/introspect-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(introspectionBody),
			});

			const data = await response.json();

			if (!response.ok) {
				console.error(' [TokenManagement] Introspection failed:', data);
				throw new Error(data.error_description || data.error || 'Introspection failed');
			}

			console.log(' [TokenManagement] Introspection successful:', data);

			v4ToastManager.showSuccess('introspectionSuccess');

			// Store introspection results for display
			setIntrospectionResults(data);

			// Scroll to introspection results section
			setTimeout(() => {
				if (introspectionSectionRef.current) {
					introspectionSectionRef.current.scrollIntoView({
						behavior: 'smooth',
						block: 'start',
					});
				}
			}, 100);
		} catch (error) {
			console.error(' [TokenManagement] Token introspection error:', error);
			v4ToastManager.showError('networkError');
		} finally {
			setIsLoading(false);
		}
	};
	const handleCopyHeader = async () => {
		if (jwtHeader) {
			try {
				await navigator.clipboard.writeText(jwtHeader);
				v4ToastManager.showCopySuccess('JWT Header');
			} catch (error) {
				console.error('Error copying header:', error);
			}
		}
	};

	const handleCopyPayload = async () => {
		if (jwtPayload) {
			try {
				await navigator.clipboard.writeText(jwtPayload);
				v4ToastManager.showCopySuccess('JWT Payload');
			} catch (error) {
				console.error('Error copying payload:', error);
			}
		}
	};

	const _handleValidateToken = async () => {
		if (!tokenString) {
			v4ToastManager.showError('stepError');
			return;
		}

		setIsLoading(true);
		try {
			// Simulate token validation
			setTimeout(() => {
				setTokenStatus('valid');
				v4ToastManager.showSuccess('saveConfigurationSuccess');
				setIsLoading(false);
			}, 500);
		} catch (error) {
			console.error('Error validating token:', error);
			setIsLoading(false);
		}
	};

	const _handleTestConnection = async () => {
		setIsLoading(true);
		try {
			// Simulate connection test
			setTimeout(() => {
				v4ToastManager.showSuccess('saveConfigurationSuccess');
				setIsLoading(false);
			}, 1000);
		} catch (error) {
			console.error('Error testing connection:', error);
			setIsLoading(false);
		}
	};

	const _handleRevokeToken = async () => {
		setShowRevokeModal(true);
	};

	const confirmRevokeToken = async () => {
		setIsLoading(true);
		try {
			// Simulate token revocation
			setTimeout(() => {
				setTokenString('');
				setJwtHeader('');
				setJwtPayload('');
				setTokenStatus('none');
				v4ToastManager.showSuccess('saveConfigurationSuccess');
				setIsLoading(false);
			}, 500);
		} catch (error) {
			console.error('Error revoking token:', error);
			setIsLoading(false);
		}
	};

	const _handleClearToken = () => {
		setShowClearModal(true);
	};

	const confirmClearToken = () => {
		setTokenString('');
		setJwtHeader('');
		setJwtPayload('');
		setTokenStatus('none');
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	};

	const handleClearDecoder = () => {
		setTokenString('');
		setJwtHeader('');
		setJwtPayload('');
		setTokenStatus('none');
		setTokenSource(null);
		setMessage(null);
		setSuccessMessage(null);
		v4ToastManager.showSuccess('Token decoder cleared');
	};

	const handleClearHistory = () => {
		setShowClearHistoryModal(true);
	};

	const confirmClearHistory = () => {
		clearTokenHistory();
		setTokenHistory([]);
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	};

	const _handleRemoveHistoryEntry = (entryId: string) => {
		setHistoryEntryToRemove(entryId);
		setShowRemoveHistoryModal(true);
	};

	const confirmRemoveHistoryEntry = () => {
		if (historyEntryToRemove) {
			removeTokenFromHistory(historyEntryToRemove);
			setTokenHistory((prev) => prev.filter((entry) => entry.id !== historyEntryToRemove));
			v4ToastManager.showSuccess('saveConfigurationSuccess');
		}
	};

	const handleLoadTokenFromHistory = (entry: TokenHistoryEntry) => {
		if (entry.tokens.access_token) {
			setTokenString(entry.tokens.access_token);
			setTokenSource({
				source: 'Token History',
				description: `Token from ${entry.flowName} (${entry.timestampFormatted})`,
				timestamp: entry.timestampFormatted,
			});
			setTimeout(() => decodeJWT(entry.tokens.access_token), 100);
		}
	};

	// New functions for enhanced features
	const handleAnalyzeToken = useCallback(async () => {
		if (!tokenString.trim()) return;

		try {
			await analyzeToken(tokenString);
		} catch (error) {
			console.error('Token analysis failed:', error);
		}
	}, [tokenString, analyzeToken]);

	const handleDiagnoseError = async () => {
		if (!errorInput.trim()) return;

		try {
			await diagnoseError(errorInput);
		} catch (error) {
			console.error('Error diagnosis failed:', error);
		}
	};

	const handleRefreshToken = async () => {
		if (!canRefresh || !refreshInfo?.refreshToken) return;

		setIsLoading(true);
		try {
			// In a real implementation, this would call the refresh endpoint
			console.log('Refreshing token...');

			// Simulate token refresh for now
			setTimeout(() => {
				const newToken = mockTokenData.access_token.replace(
					'1234567890',
					Date.now().toString().slice(-10)
				);
				setTokenString(newToken);
				setTokenSource({
					source: 'Token Refresh',
					description: 'Token refreshed from analysis system',
					timestamp: new Date().toLocaleString(),
				});
				decodeJWT(newToken);
				setIsLoading(false);
			}, 1000);

			// await refreshToken(tokenString, refreshInfo.refreshToken);
		} catch (error) {
			console.error('Token refresh failed:', error);
			setIsLoading(false);
		}
	};

	const _handleLoadFromStorage = () => {
		console.log(' [TokenManagement] Loading tokens from storage...');
		const storedTokens = getOAuthTokens();

		console.log(' [TokenManagement] Stored tokens from getOAuthTokens():', storedTokens);

		if (storedTokens?.access_token) {
			console.log(' [TokenManagement] Found stored tokens, loading...');
			setTokenString(storedTokens.access_token);
			setTokenSource({
				source: 'Stored Tokens',
				description: `Access Token from ${storedTokens.token_type || 'Bearer'} flow`,
				timestamp: new Date().toLocaleString(),
			});

			// Auto-decode the token
			setTimeout(() => decodeJWT(storedTokens.access_token), 100);

			// Update token status
			if (storedTokens.expires_at) {
				const now = Date.now();
				const expiresAt = new Date(storedTokens.expires_at).getTime();
				setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
			} else if (storedTokens.expires_in) {
				const now = Date.now();
				const expiresAt = now + storedTokens.expires_in * 1000;
				setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
			} else {
				setTokenStatus('valid');
			}
		} else {
			console.log(' [TokenManagement] No stored tokens found');
			setTokenStatus('none');
		}
	};

	// Auto-analyze token when it changes
	useEffect(() => {
		if (tokenString.trim()) {
			handleAnalyzeToken();
		}
	}, [tokenString, handleAnalyzeToken]);

	// Function to refresh token history
	const refreshTokenHistory = useCallback(() => {
		console.log(' [TokenManagement] Manually refreshing token history...');
		const history = getTokenHistory();

		console.log(' [TokenManagement] Refreshed token history:', {
			totalEntries: history.entries.length,
			entries: history.entries.map((entry) => ({
				id: entry.id,
				flowType: entry.flowType,
				flowName: entry.flowName,
				timestamp: entry.timestampFormatted,
				hasAccessToken: entry.hasAccessToken,
				hasIdToken: entry.hasIdToken,
				hasRefreshToken: entry.hasRefreshToken,
			})),
		});

		setTokenHistory(history.entries);
		return history.entries.length;
	}, []);

	// Load token history on component mount
	useEffect(() => {
		console.log(' [TokenManagement] Loading token history on mount...');
		const history = getTokenHistory();

		console.log(' [TokenManagement] Mount - Retrieved token history:', {
			totalEntries: history.entries.length,
			storageKey: 'pingone_playground_token_history',
			hasEntries: history.entries.length > 0,
			entries: history.entries.map((entry) => ({
				id: entry.id,
				flowType: entry.flowType,
				flowName: entry.flowName,
				timestamp: entry.timestampFormatted,
				hasAccessToken: entry.hasAccessToken,
				hasIdToken: entry.hasIdToken,
				hasRefreshToken: entry.hasRefreshToken,
			})),
		});

		setTokenHistory(history.entries);

		if (history.entries.length > 0) {
			console.log(' [TokenManagement] Loaded', history.entries.length, 'history entries on mount');
		} else {
			console.log(' [TokenManagement] No token history found on mount');
		}
	}, []); // Run only on mount

	// Refresh token history when tokens change (but don't create duplicate entries)
	useEffect(() => {
		if (tokens?.access_token) {
			console.log(' [TokenManagement] Tokens changed, refreshing history...');
			const history = getTokenHistory();

			// Only add to history if this token isn't already in history
			const tokenAlreadyInHistory = history.entries.some(
				(entry) => entry.tokens?.access_token === tokens.access_token
			);

			if (!tokenAlreadyInHistory) {
				console.log(' [TokenManagement] New token detected, adding to history');

				// Determine flow type from flow source
				const currentFlowSource = sessionStorage.getItem('flow_source') || 'unknown';
				const flowName = currentFlowSource.includes('oauth-v3')
					? 'OAuth 2.0 Authorization Code Flow V3'
					: currentFlowSource.includes('oidc-v3')
						? 'OpenID Connect Authorization Code Flow V3'
						: 'Enhanced Authorization Code Flow V3';

				// Create a history entry for the current OAuth session
				const { addTokenToHistory } = require('../utils/tokenHistory');
				const success = addTokenToHistory(currentFlowSource, flowName, {
					access_token: tokens.access_token,
					id_token: tokens.id_token,
					refresh_token: tokens.refresh_token,
					token_type: tokens.token_type || 'Bearer',
					expires_in: tokens.expires_in || 3600,
					scope: tokens.scope || 'openid profile email',
				});

				if (success) {
					// Reload history after adding current tokens
					const updatedHistory = getTokenHistory();
					setTokenHistory(updatedHistory.entries);
					console.log(
						' [TokenManagement] Added new tokens to history, total entries:',
						updatedHistory.entries.length
					);
				}
			} else {
				console.log(' [TokenManagement] Token already exists in history, skipping');
			}
		}
	}, [tokens]); // Re-run when tokens change

	// Determine token source display
	const getTokenSourceInfo = () => {
		if (flowSourceState.includes('worker-token-v3')) {
			return {
				type: 'Worker Token Flow V3',
				description: 'Tokens from Worker Token Flow V3',
				color: '#16a34a',
				icon: <FiKey />,
			};
		} else if (flowSourceState.includes('oidc-authorization-code-v5')) {
			return {
				type: 'OIDC Authorization Code Flow V5',
				description: 'Tokens from OpenID Connect Authorization Code Flow V5',
				color: '#059669',
				icon: <FiShield />,
			};
		} else if (flowSourceState.includes('oauth-authorization-code-v5')) {
			return {
				type: 'OAuth 2.0 Authorization Code Flow V5',
				description: 'Tokens from OAuth 2.0 Authorization Code Flow V5',
				color: '#0369a1',
				icon: <FiKey />,
			};
		} else if (flowSourceState.includes('authorization-code-v5')) {
			// Fallback for old flow_source values that don't specify variant
			return {
				type: 'Authorization Code Flow V5',
				description: 'Tokens from Authorization Code Flow V5',
				color: '#0369a1',
				icon: <FiKey />,
			};
		} else if (flowSourceState.includes('worker-token-v5')) {
			return {
				type: 'Worker Token Flow V5',
				description: 'Tokens from Worker Token Flow V5',
				color: '#16a34a',
				icon: <FiKey />,
			};
		} else if (
			flowSourceState.includes('device-authorization-v6') ||
			flowSourceState.includes('device-authorization-v5')
		) {
			return {
				type: 'OAuth Device Authorization Code Flow V5',
				description: 'Tokens from OAuth Device Authorization Code Flow V5',
				color: '#8b5cf6',
				icon: <FiMonitor />,
			};
		} else if (
			flowSourceState.includes('oidc-device-authorization-v6') ||
			flowSourceState.includes('oidc-device-authorization-v5')
		) {
			return {
				type: 'OIDC Device Authorization Code Flow V5',
				description: 'Tokens from OIDC Device Authorization Code Flow V5',
				color: '#a855f7',
				icon: <FiMonitor />,
			};
		} else if (flowSourceState.includes('hybrid-v5')) {
			return {
				type: 'OIDC Hybrid Flow V5',
				description: 'Tokens from OIDC Hybrid Flow V5',
				color: '#ef4444',
				icon: <FiZap />,
			};
		} else if (flowSourceState.includes('oauth-v3')) {
			return {
				type: 'OAuth 2.0 V3',
				description: 'Tokens from OAuth 2.0 Authorization Code Flow V3',
				color: '#0369a1',
				icon: <FiKey />,
			};
		} else if (flowSourceState.includes('oidc-v3')) {
			return {
				type: 'OpenID Connect V3',
				description: 'Tokens from OIDC Authorization Code Flow V3',
				color: '#059669',
				icon: <FiShield />,
			};
		} else if (flowSourceState.includes('enhanced')) {
			return {
				type: 'Enhanced Authorization Code',
				description: 'Tokens from Enhanced Authorization Code Flow',
				color: '#0891b2',
				icon: <FiShield />,
			};
		} else if (flowSourceState.includes('implicit')) {
			return {
				type: 'Implicit Grant',
				description: 'Tokens from Implicit Grant Flow (deprecated)',
				color: '#dc2626',
				icon: <FiAlertTriangle />,
			};
		} else if (tokens) {
			return {
				type: 'Dashboard Login',
				description: 'Tokens from Dashboard login session',
				color: '#0070cc',
				icon: <FiKey />,
			};
		} else {
			return {
				type: 'Storage/Manual',
				description: 'Tokens loaded from storage or manually entered',
				color: '#6b7280',
				icon: <FiDownload />,
			};
		}
	};

	const tokenTypeInfo = getTokenTypeInfo;
	const tokenSourceInfo = getTokenSourceInfo();
	const tokenTextareaId = useId();
	const getAccessTokenButtonId = useId();
	const getIdTokenButtonId = useId();
	const getRefreshTokenButtonId = useId();
	const copyTokenButtonId = useId();
	const introspectTokenButtonId = useId();
	const decodeTokenButtonId = useId();
	const jwtHeaderId = useId();
	const jwtPayloadId = useId();
	const renderIssueKey = useCallback(
		(prefix: string, index: number, text: string) => `${prefix}-${index}-${text.length}`,
		[]
	);

	// Back to flow navigation handler
	const handleBackToFlow = useCallback(() => {
		const success = navigateBackToFlow(navigate);
		if (!success) {
			v4ToastManager.showError(
				'Unable to navigate back to the originating flow. The flow state may have expired.'
			);
		}
	}, [navigate]);

	const formatTimestamp = (seconds?: number) => {
		if (!seconds) {
			return undefined;
		}
		return new Date(seconds * 1000).toLocaleString();
	};

	const renderIntrospectionItem = (label: string, value?: string) => {
		if (!value) {
			return null;
		}
		return (
			<div>
				<div
					style={{
						color: '#475569',
						fontSize: '0.75rem',
						textTransform: 'uppercase',
						letterSpacing: '0.04em',
						marginBottom: '0.25rem',
					}}
				>
					{label}
				</div>
				<div
					style={{
						color: '#0f172a',
						fontSize: '0.9rem',
						fontWeight: 500,
						wordBreak: 'break-all',
					}}
				>
					{value}
				</div>
			</div>
		);
	};

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

				{/* Back to Flow Button */}
				{flowNavigationState && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-start',
							marginBottom: '1.5rem',
						}}
					>
						<button
							onClick={handleBackToFlow}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '0.9rem',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
								transition: 'all 0.2s ease',
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.backgroundColor = '#2563eb';
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.backgroundColor = '#3b82f6';
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
							}}
						>
							<FiArrowLeft size={16} />
							Back to {getFlowDisplayName(flowNavigationState.flowSource)} (Step{' '}
							{flowNavigationState.stepIndex + 1})
						</button>
					</div>
				)}

				{/* Token Source Indicator */}
				<div
					style={{
						background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
						border: `2px solid ${tokenSourceInfo.color}`,
						borderRadius: '12px',
						padding: '1.5rem',
						marginBottom: '2rem',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
							marginBottom: '0.5rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '3rem',
								height: '3rem',
								borderRadius: '50%',
								background: `${tokenSourceInfo.color}20`,
								color: tokenSourceInfo.color,
								fontSize: '1.5rem',
							}}
						>
							{tokenSourceInfo.icon}
						</div>
						<div>
							<h3
								style={{
									margin: 0,
									color: tokenSourceInfo.color,
									fontSize: '1.25rem',
									fontWeight: '600',
								}}
							>
								Token Source: {tokenSourceInfo.type}
							</h3>
							<p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
								{tokenSourceInfo.description}
							</p>
						</div>
					</div>
					{flowSourceState && (
						<div
							style={{
								fontSize: '0.875rem',
								color: '#6b7280',
								fontFamily: 'system-ui, -apple-system, sans-serif',
								background: '#f8fafc',
								padding: '0.75rem',
								borderRadius: '6px',
								border: '1px solid #e2e8f0',
								marginTop: '0.75rem',
							}}
						>
							<strong>Flow Source:</strong>{' '}
							{flowSourceState.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
						</div>
					)}
				</div>

				{/* Current Token Status Section - Merged */}
				<TokenSection>
					<CardHeader>
						<h2>Current Token Status</h2>
					</CardHeader>
					<CardBody>
						<TokenStatus className={tokenStatus}>
							<div className={`indicator ${tokenStatus}`}></div>
							<div className="text">
								<strong>
									{tokenStatus === 'valid' && 'Active Access Token Available'}
									{tokenStatus === 'expired' && 'Token has expired'}
									{tokenStatus === 'invalid' && 'Token is invalid'}
									{tokenStatus === 'none' && 'No token available'}
								</strong>
								<br />
								<small style={{ color: '#6b7280' }}>
									{tokenString || tokens?.access_token
										? 'Token is loaded and decoded below. You can also paste other tokens for analysis.'
										: 'No active token found. Complete an OAuth flow to get tokens, or paste a token below for analysis.'}
								</small>
							</div>
						</TokenStatus>

						{tokens?.access_token || tokenString ? (
							<TokenDetails>
								<div className="detail">
									<span className="label">Token Type</span>
									<span className="value">
										{tokens?.token_type || 'Bearer'}
										{tokenTypeInfo()?.type !== 'unknown' &&
											` (${tokenTypeInfo()?.type === 'access' ? 'Access Token' : tokenTypeInfo()?.type === 'id' ? 'ID Token' : tokenTypeInfo()?.type === 'refresh' ? 'Refresh Token' : tokenTypeInfo()?.type})`}
									</span>
								</div>
								<div className="detail">
									<span className="label">Scope</span>
									<span className="value">
										{tokens?.scope ||
											(Array.isArray(tokenTypeInfo?.scopes)
												? tokenTypeInfo.scopes.join(' ')
												: tokenTypeInfo?.scopes) ||
											'openid profile email'}
									</span>
								</div>
								<div className="detail">
									<span className="label">Expires</span>
									<span className="value">
										{tokens?.expires_at
											? new Date(tokens.expires_at).toLocaleString()
											: currentAnalysis?.expiresIn
												? `${Math.floor(currentAnalysis.expiresIn / 60)} minutes from now`
												: 'Not specified'}
									</span>
								</div>
								<div className="detail">
									<span className="label">Status</span>
									<span
										className="value"
										style={{
											color:
												tokenStatus === 'valid'
													? '#22c55e'
													: tokenStatus === 'expired'
														? '#ef4444'
														: '#6b7280',
											fontWeight: '600',
										}}
									>
										{tokenStatus === 'valid'
											? 'Valid'
											: tokenStatus === 'expired'
												? 'Expired'
												: tokenStatus === 'invalid'
													? 'Invalid'
													: 'Unknown'}
									</span>
								</div>
							</TokenDetails>
						) : null}
					</CardBody>
				</TokenSection>

				{/* Token Input Section */}
				<TokenSection>
					<CardHeader>
						<h2>Token Decoder</h2>
						<p
							style={{
								margin: '0.5rem 0 0 0',
								color: '#6b7280',
								fontSize: '0.875rem',
							}}
						>
							{tokenSource?.source === 'Current Session'
								? 'Currently showing your active Access Token. You can also paste any other JWT token below for decoding.'
								: 'Paste any JWT token below to decode and analyze it. You can get tokens from the AuthZ Code Flow or paste custom tokens.'}
						</p>
					</CardHeader>
					<CardBody>
						<TokenSurface
							hasToken={!!tokenString}
							isJson={!!tokenString && tokenString?.trim().startsWith('{')}
							jsonContent={tokenString?.trim().startsWith('{') ? tokenString : undefined}
							ariaLabel="JWT token input for decoding"
						>
							<textarea
								id={tokenTextareaId}
								value={tokenString}
								onChange={handleTokenInput}
								placeholder="Paste any JWT token here to decode it (Access Token, ID Token, etc.) or use the buttons above to load tokens from AuthZ Code Flow"
								style={{
									width: '100%',
									minHeight: '400px',
									resize: 'vertical',
									border: 0,
									outline: 'none',
									background: 'transparent',
									color: 'inherit',
									fontFamily: 'inherit',
									fontSize: '14px',
									lineHeight: '1.5',
								}}
							/>
						</TokenSurface>
						<div style={{ marginTop: '1rem' }}>
							<ActionButton
								id={decodeTokenButtonId}
								onClick={handleDecodeClick}
								disabled={!tokenString?.trim() || isLoading}
								style={{
									backgroundColor: '#059669',
									borderColor: '#059669',
									color: 'white',
									width: '100%',
									justifyContent: 'center',
									fontSize: '1rem',
									padding: '1rem',
								}}
							>
								<FiEye />
								Decode JWT
							</ActionButton>
						</div>

						{/* Success Message */}
						{successMessage && (
							<div
								style={{
									background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
									color: 'white',
									padding: '0.75rem 1rem',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									fontWeight: '500',
									boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
									animation: 'slideIn 0.3s ease-out',
								}}
							>
								<FiCheckCircle size={20} />
								{successMessage}
							</div>
						)}

						{/* Error/Warning Message */}
						{message && (
							<StandardMessage
								type={message.type}
								title={message.title}
								message={message.message}
								onDismiss={() => setMessage(null)}
							/>
						)}

						{isOAuthFlow && (
							<div
								style={{
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									color: '#1e40af',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										fontWeight: '600',
									}}
								>
									<FiInfo />
									OAuth 2.0 Flow Detected
								</div>
								<div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
									ID Tokens are not available in pure OAuth 2.0 flows. ID Tokens are an OpenID
									Connect (OIDC) feature. Only Access and Refresh tokens are available for analysis.
								</div>
							</div>
						)}
					</CardBody>
				</TokenSection>

				{/* Decoded Token Section */}
				<TokenSection>
					<CardHeader>
						<h2>Decoded Token</h2>
					</CardHeader>
					<CardBody>
						<div style={{ marginBottom: '1rem' }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '0.5rem',
								}}
							>
								<h4 style={{ margin: 0 }}>Header</h4>
								{jwtHeader && jwtHeader !== 'No token data' && !jwtHeader.startsWith('Error:') && (
									<ActionButton
										className="secondary"
										onClick={handleCopyHeader}
										style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
									>
										<FiCopy />
										Copy Header
									</ActionButton>
								)}
							</div>
							<TokenSurface
								id={jwtHeaderId}
								className="jwt-content"
								ariaLabel="JWT Header"
								scrollable
								hasToken={!!jwtHeader}
								isJson={!!jwtHeader}
								jsonContent={jwtHeader}
							>
								{jwtHeader || 'No token data'}
							</TokenSurface>
						</div>

						<div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '0.5rem',
								}}
							>
								<h4 style={{ margin: 0 }}>Payload</h4>
								{jwtPayload &&
									jwtPayload !== 'No token data' &&
									!jwtPayload.startsWith('Error:') && (
										<ActionButton
											className="secondary"
											onClick={handleCopyPayload}
											style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
										>
											<FiCopy />
											Copy Payload
										</ActionButton>
									)}
							</div>
							<TokenSurface
								id={jwtPayloadId}
								className="jwt-content"
								ariaLabel="JWT Payload"
								scrollable
								hasToken={!!jwtPayload}
								isJson={!!jwtPayload}
								jsonContent={jwtPayload}
							>
								{jwtPayload || 'No token data'}
							</TokenSurface>
						</div>
					</CardBody>
				</TokenSection>

				{/* Group 1: Get Tokens */}
				<div
					style={{
						marginBottom: '1rem',
						backgroundColor: '#fff7ed',
						border: '1px solid #fed7aa',
						borderRadius: '8px',
						padding: '1rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 0.75rem 0',
							fontSize: '0.9rem',
							fontWeight: '600',
							color: '#c2410c',
						}}
					>
						Get Tokens
					</h4>
					<ButtonGroup>
						<ActionButton
							id={getAccessTokenButtonId}
							className="primary"
							onClick={() => handleGetSpecificToken('access_token')}
							disabled={isLoading}
							style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
						>
							<FiKey />
							{isLoading ? 'Getting...' : 'Get Access Token'}
						</ActionButton>

						<ActionButton
							id={getIdTokenButtonId}
							className={isOAuthFlow ? 'secondary' : 'primary'}
							onClick={() => handleGetSpecificToken('id_token')}
							disabled={isLoading || isOAuthFlow}
							title={
								isOAuthFlow
									? 'ID Tokens are not available in OAuth 2.0 flows (only in OpenID Connect)'
									: 'Get ID Token from current session'
							}
							style={{
								backgroundColor: '#3b82f6',
								borderColor: '#3b82f6',
								opacity: isOAuthFlow ? 0.6 : 1,
							}}
						>
							<FiShield />
							{isLoading ? 'Getting...' : isOAuthFlow ? 'Get ID Token (OAuth N/A)' : 'Get ID Token'}
						</ActionButton>

						<ActionButton
							id={getRefreshTokenButtonId}
							className="primary"
							onClick={() => handleGetSpecificToken('refresh_token')}
							disabled={isLoading}
							style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
						>
							<FiRefreshCw />
							{isLoading ? 'Getting...' : 'Get Refresh Token'}
						</ActionButton>
					</ButtonGroup>
				</div>

				{/* Group 2: Token Actions */}
				<div
					style={{
						marginBottom: '1rem',
						backgroundColor: '#f0fdf4',
						border: '1px solid #bbf7d0',
						borderRadius: '8px',
						padding: '1rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 0.75rem 0',
							fontSize: '0.9rem',
							fontWeight: '600',
							color: '#166534',
						}}
					>
						Token Actions
					</h4>
					<ButtonGroup>
						<ActionButton
							id={copyTokenButtonId}
							className="secondary"
							onClick={handleCopyToken}
							disabled={!tokenString || isLoading}
							style={{
								backgroundColor: '#3b82f6',
								borderColor: '#3b82f6',
								color: 'white',
							}}
						>
							<FiCopy />
							Copy Token
						</ActionButton>

						<ActionButton
							id={introspectTokenButtonId}
							className="secondary"
							onClick={handleIntrospectToken}
							disabled={!tokenString || isLoading}
							style={{
								backgroundColor: '#3b82f6',
								borderColor: '#3b82f6',
								color: 'white',
							}}
						>
							<FiShield />
							Introspect {isAccessToken ? 'Access Token' : 'ID Token'}
						</ActionButton>

						<ActionButton
							className="secondary"
							onClick={handleClearDecoder}
							disabled={!tokenString && !jwtHeader && !jwtPayload}
							style={{
								backgroundColor: '#ef4444',
								borderColor: '#ef4444',
								color: 'white',
							}}
						>
							<FiX />
							Clear
						</ActionButton>
					</ButtonGroup>
				</div>

				{/* Group 3: Load Tokens */}
				<div
					style={{
						marginBottom: '1rem',
						backgroundColor: '#fefce8',
						border: '1px solid #fde047',
						borderRadius: '8px',
						padding: '1rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 0.75rem 0',
							fontSize: '0.9rem',
							fontWeight: '600',
							color: '#a16207',
						}}
					>
						Load Tokens
					</h4>
					<ButtonGroup>
						<ActionButton
							className="secondary"
							onClick={() => {
								console.log(' [TokenManagement] Loading tokens from storage...');
								const storedTokens = getOAuthTokens();

								console.log(
									' [TokenManagement] Stored tokens from getOAuthTokens():',
									storedTokens
								);

								if (storedTokens?.access_token) {
									console.log(' [TokenManagement] Found stored tokens, loading...');
									setTokenString(storedTokens.access_token);
									setTokenSource({
										source: 'Stored Tokens',
										description: `Access Token from ${storedTokens.token_type || 'Bearer'} flow`,
										timestamp: new Date().toLocaleString(),
									});

									// Auto-decode the token
									setTimeout(() => decodeJWT(storedTokens.access_token), 100);

									// Update token status
									if (storedTokens.expires_at) {
										const now = Date.now();
										const expiresAt = new Date(storedTokens.expires_at).getTime();
										setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
									} else if (storedTokens.expires_in) {
										const now = Date.now();
										const expiresAt = now + storedTokens.expires_in * 1000;
										setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
									} else {
										setTokenStatus('valid');
									}

									// Show success message
									v4ToastManager.showSuccess('tokenLoadedFromStorage');
								} else {
									console.log(' [TokenManagement] No stored tokens found');
									setTokenStatus('none');
									v4ToastManager.showWarning('noTokensInStorage');
								}
							}}
							style={{
								backgroundColor: '#3b82f6',
								borderColor: '#3b82f6',
								color: 'white',
							}}
						>
							<FiRefreshCw />
							Load from Storage
						</ActionButton>

						<ActionButton
							className="secondary"
							onClick={() => {
								console.log(' [TokenManagement] Getting token from Dashboard Login...');
								// Try to get token from auth context first
								if (tokens?.access_token) {
									console.log(' [TokenManagement] Found token in auth context');
									setTokenString(tokens.access_token);
									setTokenSource({
										source: 'Dashboard Login',
										description: 'Access Token from current OAuth session',
										timestamp: new Date().toLocaleString(),
									});
									setTimeout(() => decodeJWT(tokens.access_token), 100);

									// Show success message
									v4ToastManager.showSuccess('saveConfigurationSuccess');
								} else {
									// Try to get from storage
									const storedTokens = getOAuthTokens();
									if (storedTokens?.access_token) {
										console.log(' [TokenManagement] Found token in storage');
										setTokenString(storedTokens.access_token);
										setTokenSource({
											source: 'Dashboard Login (Stored)',
											description: 'Access Token from stored OAuth session',
											timestamp: new Date().toLocaleString(),
										});
										setTimeout(() => decodeJWT(storedTokens.access_token), 100);

										// Show success message
										v4ToastManager.showSuccess(
											'Sample JWT loaded - this demonstrates a typical token structure'
										);
									} else {
										v4ToastManager.showWarning('saveConfigurationStart');
									}
								}
							}}
							style={{
								backgroundColor: '#3b82f6',
								borderColor: '#3b82f6',
								color: 'white',
							}}
						>
							<FiKey />
							Get from Dashboard Login
						</ActionButton>
					</ButtonGroup>
				</div>

				{/* Group 4: Sample & Demo Tokens */}
				<div
					style={{
						marginBottom: '1rem',
						backgroundColor: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '8px',
						padding: '1rem',
					}}
				>
					<h4
						style={{
							margin: '0 0 0.75rem 0',
							fontSize: '0.9rem',
							fontWeight: '600',
							color: '#dc2626',
						}}
					>
						Sample & Demo Tokens
					</h4>
					<ButtonGroup>
						<ActionButton
							className="secondary"
							onClick={() => {
								// Create a comprehensive sample token that matches real PingOne token structure
								const now = Math.floor(Date.now() / 1000);
								const samplePayload = {
									// Standard JWT claims
									iss: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
									sub: '87654321-4321-4321-4321-210987654321',
									aud: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
									exp: now + 3600, // Expires in 1 hour
									iat: now - 300, // Issued 5 minutes ago
									auth_time: now - 300,
									jti: `jwt_${Date.now()}`,

									// OIDC claims
									nonce: 'abc123def456ghi789',
									at_hash: 'sample_at_hash_value_123',

									// PingOne specific claims
									env: '12345678-1234-1234-1234-123456789012',
									org: '98765432-8765-4321-9876-543210987654',

									// User profile claims
									name: 'John Doe',
									given_name: 'John',
									family_name: 'Doe',
									email: 'john.doe@example.com',
									email_verified: true,
									preferred_username: 'john.doe',
									picture: 'https://example.com/avatar/john.doe.jpg',

									// Additional standard claims
									locale: 'en-US',
									zoneinfo: 'America/New_York',
									updated_at: now - 86400, // Updated yesterday

									// OAuth scope-related claims
									scope: 'openid profile email',
									client_id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',

									// PingOne environment claims
									amr: ['pwd'], // Authentication method reference
									acr: 'urn:pingone:loa:1', // Authentication context class reference
									sid: `session_${Date.now()}`,
								};

								// Create a properly formatted JWT (header.payload.signature)
								const header = {
									alg: 'RS256',
									typ: 'JWT',
									kid: 'sample_key_id_123',
								};
								const encodedHeader = btoa(JSON.stringify(header)).replace(
									/[+/=]/g,
									(m) => ({ '+': '-', '/': '_', '=': '' })[m]
								);
								const encodedPayload = btoa(JSON.stringify(samplePayload)).replace(
									/[+/=]/g,
									(m) => ({ '+': '-', '/': '_', '=': '' })[m]
								);
								const sampleSignature =
									'sample_signature_' +
									btoa('comprehensive_sample_token').replace(
										/[+/=]/g,
										(m) => ({ '+': '-', '/': '_', '=': '' })[m]
									);
								const sampleToken = `${encodedHeader}.${encodedPayload}.${sampleSignature}`;

								setTokenString(sampleToken);
								setTokenSource({
									source: 'Comprehensive Sample',
									description:
										'Realistic PingOne JWT sample with comprehensive claims including OIDC, profile, and PingOne-specific fields',
									timestamp: new Date().toLocaleString(),
								});
								console.log(
									' [TokenManagement] Loaded comprehensive sample token with realistic PingOne structure'
								);

								// Auto-decode the sample token
								setTimeout(() => decodeJWT(sampleToken), 100);

								// Show success message
								v4ToastManager.showSuccess('sampleTokenLoaded');
							}}
							style={{
								backgroundColor: '#eab308',
								borderColor: '#eab308',
								color: 'white',
							}}
						>
							Load Sample Token
						</ActionButton>

						<ActionButton
							className="danger"
							onClick={() => {
								// Generate a realistic-looking but intentionally flawed PingOne token
								const badToken = generateBadSecurityToken();
								setTokenString(badToken);
								setTokenSource({
									source: 'Security Demo',
									description: 'Intentionally flawed token for security demonstration',
									timestamp: new Date().toLocaleString(),
								});
								console.log(' [TokenManagement] Loaded bad security token for demonstration');

								// Auto-decode the bad token
								setTimeout(() => decodeJWT(badToken), 100);

								// Show success message
								v4ToastManager.showSuccess('badTokenLoaded');
							}}
							style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
						>
							Bad Security Token
						</ActionButton>
					</ButtonGroup>
				</div>

				{/* Token Introspection Results Section */}
				{introspectionResults && (
					<div ref={introspectionSectionRef}>
						<TokenSection>
							<CardHeader>
								<h2> Token Introspection</h2>
							</CardHeader>
							<CardBody>
								<div
									style={{
										border: '1px solid #dbeafe',
										borderRadius: '10px',
										background: '#f8fbff',
										padding: '1.75rem',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
											marginBottom: '1.5rem',
										}}
									>
										<div
											style={{
												background: introspectionResults.active ? '#16a34a' : '#dc2626',
												borderRadius: '50%',
												width: '2.5rem',
												height: '2.5rem',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												boxShadow: `0 8px 20px ${introspectionResults.active ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
											}}
										>
											{introspectionResults.active ? <FiShield size={18} color="white" /> : ''}
										</div>
										<div>
											<div
												style={{
													margin: 0,
													fontSize: '1.1rem',
													fontWeight: 700,
													color: introspectionResults.active ? '#166534' : '#b91c1c',
												}}
											>
												{introspectionResults.active ? 'Token is Active' : 'Token is Inactive'}
											</div>
											<p
												style={{
													margin: '0.35rem 0 0 0',
													color: '#475569',
													fontSize: '0.875rem',
												}}
											>
												PingOne{' '}
												{introspectionResults.active
													? 'validated this token.'
													: 'reported this token as inactive.'}
											</p>
										</div>
									</div>

									{/* Token Status */}
									{renderIntrospectionItem(
										'Token Status',
										introspectionResults.active ? '✅ Active' : '❌ Inactive'
									)}

									<div
										style={{
											display: 'grid',
											gap: '1rem',
											gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
										}}
									>
										{/* Core Token Information */}
										{renderIntrospectionItem('Client ID', introspectionResults.client_id)}
										{renderIntrospectionItem('Subject', introspectionResults.sub)}
										{renderIntrospectionItem('Username', introspectionResults.username)}
										{renderIntrospectionItem('Token Type', introspectionResults.token_type)}
										{renderIntrospectionItem('Scope', introspectionResults.scope)}

										{/* Token Metadata */}
										{renderIntrospectionItem('Audience', introspectionResults.aud)}
										{renderIntrospectionItem('Issuer', introspectionResults.iss)}
										{renderIntrospectionItem('JWT ID', introspectionResults.jti)}

										{/* Timestamps */}
										{renderIntrospectionItem(
											'Issued At',
											introspectionResults.iat
												? formatTimestamp(introspectionResults.iat)
												: undefined
										)}
										{renderIntrospectionItem(
											'Not Before',
											introspectionResults.nbf
												? formatTimestamp(introspectionResults.nbf)
												: undefined
										)}
										{renderIntrospectionItem(
											'Expires At',
											introspectionResults.exp
												? formatTimestamp(introspectionResults.exp)
												: undefined
										)}
										{/* ID Token specific fields */}
										{!isAccessToken &&
											introspectionResults.auth_time &&
											renderIntrospectionItem(
												'Auth Time',
												formatTimestamp(introspectionResults.auth_time)
											)}
										{!isAccessToken &&
											introspectionResults.nonce &&
											renderIntrospectionItem('Nonce', introspectionResults.nonce)}
										{!isAccessToken &&
											introspectionResults.acr &&
											renderIntrospectionItem('ACR', introspectionResults.acr)}
										{!isAccessToken &&
											introspectionResults.amr &&
											renderIntrospectionItem(
												'AMR',
												Array.isArray(introspectionResults.amr)
													? introspectionResults.amr.join(', ')
													: introspectionResults.amr
											)}
										{!isAccessToken &&
											introspectionResults.at_hash &&
											renderIntrospectionItem('AT Hash', introspectionResults.at_hash)}
										{!isAccessToken &&
											introspectionResults.c_hash &&
											renderIntrospectionItem('C Hash', introspectionResults.c_hash)}
									</div>

									{introspectionResults.username && (
										<div
											style={{
												marginTop: '1.25rem',
												paddingTop: '1.25rem',
												borderTop: '1px solid #e2e8f0',
											}}
										>
											<div
												style={{
													fontWeight: 600,
													fontSize: '0.95rem',
													color: '#2563eb',
													marginBottom: '0.75rem',
												}}
											>
												Subject Details
											</div>
											<div
												style={{
													display: 'grid',
													gap: '0.75rem',
													gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
												}}
											>
												{renderIntrospectionItem('Username', introspectionResults.username)}
												{renderIntrospectionItem('Email', introspectionResults.email)}
												{renderIntrospectionItem('Given Name', introspectionResults.given_name)}
												{renderIntrospectionItem('Family Name', introspectionResults.family_name)}
											</div>
										</div>
									)}
								</div>
							</CardBody>
						</TokenSection>
					</div>
				)}

				{/* Token History Section */}
				<TokenSection>
					<CardHeader>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<h2>Token History</h2>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<ActionButton
									className="secondary"
									style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
									onClick={() => {
										const _count = refreshTokenHistory();
										v4ToastManager.showSuccess('saveConfigurationSuccess');
									}}
									title="Refresh token history from storage"
								>
									<FiRefreshCw />
									Refresh
								</ActionButton>
								{tokenHistory.length > 0 && (
									<ActionButton
										className="secondary"
										style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
										onClick={handleClearHistory}
									>
										<FiTrash2 />
										Clear History
									</ActionButton>
								)}
							</div>
						</div>
					</CardHeader>
					<CardBody>
						{/* Debug information */}
						<div
							style={{
								background: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '6px',
								padding: '0.75rem',
								marginBottom: '1rem',
								fontSize: '0.875rem',
								color: '#64748b',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<div>
									<strong>Token History Status:</strong> {tokenHistory.length} entries stored
								</div>
								<div>
									<strong>Storage Key:</strong> pingone_playground_token_history
								</div>
							</div>
						</div>

						{tokenHistory.length === 0 ? (
							<div
								style={{
									color: '#6b7280',
									fontStyle: 'italic',
									textAlign: 'center',
									padding: '2rem',
								}}
							>
								<FiClock
									style={{
										display: 'inline',
										marginRight: '0.5rem',
										fontSize: '1.5rem',
									}}
								/>
								<div style={{ marginTop: '0.5rem' }}>No token history available</div>
								<div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
									Complete OAuth flows to see token history here
								</div>
							</div>
						) : (
							<div>
								<div
									style={{
										marginBottom: '1rem',
										color: '#6b7280',
										fontSize: '0.875rem',
									}}
								>
									{tokenHistory.length} token
									{tokenHistory.length !== 1 ? 's' : ''} received from OAuth flows
								</div>

								<HistoryTable>
									<HistoryTableHeader>
										<tr>
											<HistoryTableHeaderCell>Flow Type</HistoryTableHeaderCell>
											<HistoryTableHeaderCell>Tokens Received</HistoryTableHeaderCell>
											<HistoryTableHeaderCell>Date & Time</HistoryTableHeaderCell>
											<HistoryTableHeaderCell>Actions</HistoryTableHeaderCell>
										</tr>
									</HistoryTableHeader>
									<HistoryTableBody>
										{tokenHistory.map((entry) => (
											<HistoryTableRow
												key={entry.id}
												onClick={() => handleLoadTokenFromHistory(entry)}
											>
												<HistoryTableCell>
													<FlowBadge $flowType={entry.flowType}>
														{getFlowIcon(entry.flowType)}
														{getFlowDisplayName(entry.flowType)}
													</FlowBadge>
													<div
														style={{
															fontSize: '0.75rem',
															color: '#6b7280',
															marginTop: '0.25rem',
														}}
													>
														Scope: {entry.tokens.scope || 'openid profile email'}
													</div>
												</HistoryTableCell>

												<HistoryTableCell>
													<div
														style={{
															display: 'flex',
															flexWrap: 'wrap',
															gap: '0.25rem',
														}}
													>
														{entry.hasAccessToken && (
															<TokenBadge $type="access"> Access</TokenBadge>
														)}
														{entry.hasIdToken && <TokenBadge $type="id"> ID</TokenBadge>}
														{entry.hasRefreshToken && (
															<TokenBadge $type="refresh"> Refresh</TokenBadge>
														)}
													</div>
													<div
														style={{
															fontSize: '0.75rem',
															color: '#6b7280',
															marginTop: '0.25rem',
														}}
													>
														{entry.tokenCount} token
														{entry.tokenCount !== 1 ? 's' : ''}{' '}
														{entry.tokens.token_type || 'Bearer'}
													</div>
												</HistoryTableCell>

												<HistoryTableCell>
													<div style={{ color: '#374151', fontWeight: '500' }}>
														{entry.timestampFormatted}
													</div>
													<div
														style={{
															color: '#6b7280',
															fontSize: '0.75rem',
															marginTop: '0.25rem',
														}}
													>
														{entry.tokens.expires_in
															? `Expires: ${Math.floor(entry.tokens.expires_in / 60)} min`
															: 'Expires: 1 hour'}
													</div>
												</HistoryTableCell>

												<HistoryTableCell>
													<HistoryActions>
														<HistoryButton
															$variant="primary"
															onClick={(e) => {
																e.stopPropagation();
																handleLoadTokenFromHistory(entry);
															}}
														>
															<FiEye />
															Analyze
														</HistoryButton>
														<HistoryButton
															onClick={(e) => {
																e.stopPropagation();
																setHistoryEntryToRemove(entry.id);
																setShowRemoveHistoryModal(true);
															}}
														>
															<FiTrash2 />
															Remove
														</HistoryButton>
													</HistoryActions>
												</HistoryTableCell>
											</HistoryTableRow>
										))}
									</HistoryTableBody>
								</HistoryTable>
							</div>
						)}
					</CardBody>
				</TokenSection>

				{/* Enhanced Token Analysis and Error Diagnosis Section */}
				<TokenSection>
					<CardHeader>
						<h3
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								margin: 0,
							}}
						>
							<FiShield />
							Token Analysis & Error Diagnosis
						</h3>
					</CardHeader>
					<CardBody>
						<TabContainer>
							<Tab $active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
								<FiShield style={{ marginRight: '0.5rem' }} />
								Token Analysis
							</Tab>
							<Tab $active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')}>
								<FiAlertTriangle style={{ marginRight: '0.5rem' }} />
								Error Diagnosis
							</Tab>
						</TabContainer>

						{/* Token Analysis Tab */}
						<TabContent $active={activeTab === 'analysis'}>
							{tokenString ? (
								<div>
									{/* Token Status and Refresh Info */}
									<div style={{ marginBottom: '1.5rem' }}>
										<RefreshStatus $status={getTokenExpirationStatus().status}>
											{getTokenExpirationStatus().status === 'valid' && <FiCheckCircle />}
											{getTokenExpirationStatus().status === 'expiring' && <FiClock />}
											{getTokenExpirationStatus().status === 'expired' && <FiXCircle />}
											{getTokenExpirationStatus().status === 'unknown' && <FiInfo />}
											{getTokenExpirationStatus().status === 'valid' && 'Token is valid'}
											{getTokenExpirationStatus().status === 'expiring' && 'Token expiring soon'}
											{getTokenExpirationStatus().status === 'expired' && 'Token has expired'}
											{getTokenExpirationStatus().status === 'unknown' && 'Token status unknown'}
											{getTokenExpirationStatus().timeRemaining > 0 && (
												<span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
													({Math.floor(getTokenExpirationStatus().timeRemaining / 1000 / 60)}{' '}
													minutes remaining)
												</span>
											)}
										</RefreshStatus>

										{canRefresh && (
											<div style={{ marginTop: '0.5rem' }}>
												<ActionButton
													className="secondary"
													onClick={handleRefreshToken}
													disabled={isAnalyzing}
												>
													<FiRefreshCw />
													Refresh Token
												</ActionButton>
											</div>
										)}
									</div>

									{/* Analysis Results */}
									{currentAnalysis && (
										<AnalysisSection>
											{/* Security Score */}
											<SecurityScoreCard $score={getTokenSecurityScore().overall}>
												<h4 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>
													Security Score
												</h4>
												<ScoreCircle $score={getTokenSecurityScore().overall}>
													{getTokenSecurityScore().overall}
												</ScoreCircle>
												<div
													style={{
														textAlign: 'center',
														fontSize: '0.875rem',
														color: '#6b7280',
													}}
												>
													{getTokenSecurityScore().overall >= 80 && 'Excellent'}
													{getTokenSecurityScore().overall >= 60 &&
														getTokenSecurityScore().overall < 80 &&
														'Good'}
													{getTokenSecurityScore().overall >= 40 &&
														getTokenSecurityScore().overall < 60 &&
														'Fair'}
													{getTokenSecurityScore().overall < 40 && 'Poor'}
												</div>
											</SecurityScoreCard>

											{/* Token Information */}
											<div>
												<h4 style={{ margin: '0 0 1rem 0' }}>Token Information</h4>
												<div style={{ display: 'grid', gap: '0.5rem' }}>
													<div>
														<strong>Type:</strong> {tokenTypeInfo()?.type}
													</div>
													<div>
														<strong>Format:</strong> {tokenTypeInfo()?.format}
													</div>
													{tokenTypeInfo()?.issuer && (
														<div>
															<strong>Issuer:</strong> {tokenTypeInfo()?.issuer}
														</div>
													)}
													{tokenTypeInfo()?.subject && (
														<div>
															<strong>Subject:</strong> {tokenTypeInfo()?.subject}
														</div>
													)}
													{tokenTypeInfo()?.scopes && (
														<div>
															<strong>Scopes:</strong>{' '}
															{Array.isArray(tokenTypeInfo()?.scopes)
																? tokenTypeInfo().scopes.join(' ')
																: tokenTypeInfo()?.scopes}
														</div>
													)}
												</div>
											</div>
										</AnalysisSection>
									)}

									{/* Security Issues */}
									{hasIssues && (
										<div style={{ marginBottom: '1.5rem' }}>
											<h4 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>
												<FiAlertTriangle style={{ marginRight: '0.5rem' }} />
												Security Issues ({getCriticalIssues().length})
											</h4>
											<IssueList>
												{getCriticalIssues().map((issue, index) => (
													<IssueItem
														key={renderIssueKey('critical', index, issue.description)}
														$severity={issue.severity}
													>
														<div
															style={{
																fontWeight: '500',
																marginBottom: '0.25rem',
															}}
														>
															{issue.type.replace(/_/g, ' ').toUpperCase()}
														</div>
														<div
															style={{
																fontSize: '0.875rem',
																marginBottom: '0.5rem',
															}}
														>
															{issue.description}
														</div>
														<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
															<strong>Recommendation:</strong> {issue.recommendation}
														</div>
													</IssueItem>
												))}
											</IssueList>
										</div>
									)}

									{/* Validation Errors */}
									{hasErrors && (
										<div style={{ marginBottom: '1.5rem' }}>
											<h4 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>
												<FiXCircle style={{ marginRight: '0.5rem' }} />
												Validation Errors ({getValidationErrors().length})
											</h4>
											<IssueList>
												{getValidationErrors().map((error, index) => (
													<IssueItem
														key={renderIssueKey('validation', index, error.error)}
														$severity={error.severity}
													>
														<div
															style={{
																fontWeight: '500',
																marginBottom: '0.25rem',
															}}
														>
															{error.field}
														</div>
														<div style={{ fontSize: '0.875rem' }}>{error.error}</div>
													</IssueItem>
												))}
											</IssueList>
										</div>
									)}
								</div>
							) : (
								<div
									style={{
										textAlign: 'center',
										padding: '2rem',
										color: '#6b7280',
									}}
								>
									<FiKey size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
									<p>Enter a token above to see detailed analysis</p>
								</div>
							)}
						</TabContent>

						{/* Error Diagnosis Tab */}
						<TabContent $active={activeTab === 'diagnosis'}>
							<div>
								<h4 style={{ margin: '0 0 1rem 0' }}>Error Diagnosis</h4>
								<p
									style={{
										marginBottom: '1rem',
										color: '#6b7280',
										fontSize: '0.875rem',
									}}
								>
									Paste an error message below to get automated diagnosis and suggested fixes.
								</p>

								<textarea
									placeholder="Paste error message here..."
									value={errorInput}
									onChange={(e) => setErrorInput(e.target.value)}
									style={{
										width: '100%',
										minHeight: '100px',
										padding: '0.75rem',
										border: '1px solid #d1d5db',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										resize: 'vertical',
									}}
								/>

								<ButtonGroup>
									<ActionButton
										className="primary"
										onClick={handleDiagnoseError}
										disabled={!errorInput.trim() || isDiagnosing}
									>
										{isDiagnosing ? <FiRefreshCw className="animate-spin" /> : <FiAlertTriangle />}
										{isDiagnosing ? 'Diagnosing...' : 'Diagnose Error'}
									</ActionButton>
									<ActionButton className="secondary" onClick={() => setErrorInput('')}>
										<FiX />
										Clear
									</ActionButton>
								</ButtonGroup>

								{/* Diagnosis Results */}
								{hasCurrentDiagnosis && currentDiagnosis && (
									<div style={{ marginTop: '1.5rem' }}>
										<div
											style={{
												padding: '1rem',
												borderRadius: '0.5rem',
												backgroundColor: '#f0f9ff',
												border: '1px solid #bae6fd',
												marginBottom: '1rem',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
													marginBottom: '0.5rem',
												}}
											>
												<FiCheckCircle style={{ color: '#3b82f6' }} />
												<strong>Diagnosis Complete</strong>
											</div>
											<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
												<div>
													<strong>Confidence:</strong> {getErrorConfidence()}%
												</div>
												<div>
													<strong>Severity:</strong> {getErrorSeverity()}
												</div>
												<div>
													<strong>Category:</strong> {getErrorCategory()}
												</div>
											</div>
										</div>

										{/* Suggested Fixes */}
										{getSuggestedFixes().length > 0 && (
											<div>
												<h4 style={{ margin: '0 0 1rem 0' }}>Suggested Fixes</h4>
												<FixList>
													{getSuggestedFixes().map((fix, index) => (
														<FixItem
															key={renderIssueKey('fix', index, fix.title)}
															$priority={fix.priority}
														>
															<div
																style={{
																	fontWeight: '500',
																	marginBottom: '0.5rem',
																}}
															>
																{fix.title}
															</div>
															<div
																style={{
																	fontSize: '0.875rem',
																	marginBottom: '0.75rem',
																}}
															>
																{fix.description}
															</div>
															<div
																style={{
																	fontSize: '0.75rem',
																	color: '#6b7280',
																	marginBottom: '0.5rem',
																}}
															>
																<strong>Priority:</strong> {fix.priority} |<strong> Time:</strong>{' '}
																{fix.estimatedTime} |<strong> Success Rate:</strong>{' '}
																{fix.successRate}%
															</div>
															{fix.steps.length > 0 && (
																<div>
																	<strong style={{ fontSize: '0.75rem' }}>Steps:</strong>
																	<ol
																		style={{
																			fontSize: '0.75rem',
																			marginTop: '0.25rem',
																			paddingLeft: '1.25rem',
																		}}
																	>
																		{fix.steps.map((step, stepIndex) => (
																			<li
																				key={renderIssueKey(
																					'fix-step',
																					stepIndex,
																					`${fix.title}-${step}`
																				)}
																				style={{ marginBottom: '0.25rem' }}
																			>
																				{step}
																			</li>
																		))}
																	</ol>
																</div>
															)}
															{fix.codeExample && (
																<div style={{ marginTop: '0.75rem' }}>
																	<strong style={{ fontSize: '0.75rem' }}>Code Example:</strong>
																	<pre
																		style={{
																			fontSize: '0.75rem',
																			background: '#f3f4f6',
																			padding: '0.5rem',
																			borderRadius: '0.25rem',
																			marginTop: '0.25rem',
																			overflow: 'auto',
																		}}
																	>
																		{fix.codeExample}
																	</pre>
																</div>
															)}
														</FixItem>
													))}
												</FixList>
											</div>
										)}
									</div>
								)}
							</div>
						</TabContent>
					</CardBody>
				</TokenSection>

				{/* Confirmation Modals */}
				<ConfirmationModal
					isOpen={showRevokeModal}
					onClose={() => setShowRevokeModal(false)}
					onConfirm={confirmRevokeToken}
					title="Revoke Token"
					message="Are you sure you want to revoke this token? This action cannot be undone and the token will no longer be valid."
					confirmText="Revoke Token"
					cancelText="Cancel"
					variant="danger"
					isLoading={isLoading}
				/>

				<ConfirmationModal
					isOpen={showClearModal}
					onClose={() => setShowClearModal(false)}
					onConfirm={confirmClearToken}
					title="Clear Token"
					message="Are you sure you want to clear the current token? This will remove it from the display but won't revoke it on the server."
					confirmText="Clear Token"
					cancelText="Cancel"
					variant="primary"
				/>

				<ConfirmationModal
					isOpen={showClearHistoryModal}
					onClose={() => setShowClearHistoryModal(false)}
					onConfirm={confirmClearHistory}
					title="Clear Token History"
					message="Are you sure you want to clear all token history? This action cannot be undone and all stored token history will be permanently removed."
					confirmText="Clear History"
					cancelText="Cancel"
					variant="danger"
				/>

				<ConfirmationModal
					isOpen={showRemoveHistoryModal}
					onClose={() => {
						setShowRemoveHistoryModal(false);
						setHistoryEntryToRemove(null);
					}}
					onConfirm={confirmRemoveHistoryEntry}
					title="Remove Token Entry"
					message="Are you sure you want to remove this token entry from history? This action cannot be undone."
					confirmText="Remove Entry"
					cancelText="Cancel"
					variant="danger"
				/>

				{/* Centralized Success/Error Messages */}
			</ContentWrapper>
		</PageContainer>
	);
};

export default TokenManagement;
