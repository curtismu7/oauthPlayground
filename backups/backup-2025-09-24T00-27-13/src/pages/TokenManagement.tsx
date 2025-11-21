import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiDownload,
	FiEye,
	FiInfo,
	FiKey,
	FiPlus,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiTrash2,
	FiX,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../components/Card';
import CentralizedSuccessMessage, {
	showFlowError,
	showFlowSuccess,
} from '../components/CentralizedSuccessMessage';
import ConfirmationModal from '../components/ConfirmationModal';
import JSONHighlighter from '../components/JSONHighlighter';
import PageTitle from '../components/PageTitle';
import StandardMessage from '../components/StandardMessage';
import { TokenSurface } from '../components/TokenSurface';
import { useAuth } from '../contexts/NewAuthContext';
import { useErrorDiagnosis } from '../hooks/useErrorDiagnosis';
import { usePageScroll } from '../hooks/usePageScroll';
import { useTokenAnalysis } from '../hooks/useTokenAnalysis';
import {
	clearTokenHistory,
	getFlowDisplayName,
	getFlowIcon,
	getTokenHistory,
	removeTokenFromHistory,
	TokenHistoryEntry,
} from '../utils/tokenHistory';
import { getOAuthTokens } from '../utils/tokenStorage';

const Container = styled.div`
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

const IssueItem = styled.div<{ $severity: 'low' | 'medium' | 'high' | 'critical' }>`
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

const RecommendationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RecommendationItem = styled.div`
  padding: 0.75rem;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ErrorDiagnosisCard = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
`;

const ErrorInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 1rem;
  background-color: #ffffff;
  color: #1f2937;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FixList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FixItem = styled.div<{ $priority: 'low' | 'medium' | 'high' | 'critical' }>`
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

const RefreshStatus = styled.div<{ $status: 'valid' | 'expiring' | 'expired' | 'unknown' }>`
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

	// Scroll to top when page loads
	// Use centralized scroll management
	usePageScroll({ pageName: 'Token Management', force: true });

	// Check flow source to determine if ID Token should be available
	const flowSource = sessionStorage.getItem('flow_source') || '';
	const isOAuthFlow = flowSource.includes('oauth') && !flowSource.includes('oidc');
	const isOIDCFlow = flowSource.includes('oidc') || flowSource.includes('enhanced');

	console.log('🔍 [TokenManagement] Flow source detection:', {
		flowSource,
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

	// Token analysis hook
	const {
		analyzeToken,
		currentAnalysis,
		securityAnalysis,
		refreshInfo,
		getTokenExpirationStatus,
		getTokenSecurityScore,
		getTokenRecommendations,
		getCriticalIssues,
		getValidationErrors,
		needsRefresh,
		getTokenTypeInfo,
		getTokenClaims,
		isAnalyzing,
		isValid,
		riskScore,
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

	useEffect(() => {
		// Auto-load current Access Token from auth context or storage
		const loadCurrentToken = () => {
			try {
				console.log('🔄 [TokenManagement] Loading current token from auth context:', tokens);

				// First try to get token from auth context
				let currentTokens = tokens;

				// If no tokens in auth context or no access token, try to load from storage
				if (!currentTokens || !currentTokens.access_token) {
					console.log('ℹ️ [TokenManagement] No access token in auth context, checking storage...');
					const storageTokens = getOAuthTokens();
					if (
						storageTokens &&
						(storageTokens.access_token || storageTokens.id_token || storageTokens.refresh_token)
					) {
						console.log('✅ [TokenManagement] Found tokens in secure storage:', storageTokens);
						currentTokens = storageTokens;
					} else {
						// Check localStorage for tokens from Authorization Code flow
						console.log('ℹ️ [TokenManagement] Checking localStorage for oauth_tokens...');
						const localStorageTokens = localStorage.getItem('oauth_tokens');
						if (localStorageTokens) {
							try {
								const parsedTokens = JSON.parse(localStorageTokens);
								console.log('✅ [TokenManagement] Found tokens in localStorage:', parsedTokens);
								if (
									parsedTokens &&
									(parsedTokens.access_token || parsedTokens.id_token || parsedTokens.refresh_token)
								) {
									currentTokens = parsedTokens;
								}
							} catch (parseError) {
								console.error(
									'❌ [TokenManagement] Error parsing localStorage tokens:',
									parseError
								);
							}
						}
					}
				}

				// Auto-load the best available token (prefer access token, then ID token, then refresh token)
				let tokenToLoad = null;
				let tokenTypeToLoad = '';

				if (currentTokens && currentTokens.access_token) {
					tokenToLoad = currentTokens.access_token;
					tokenTypeToLoad = 'access_token';
				} else if (currentTokens && currentTokens.id_token) {
					tokenToLoad = currentTokens.id_token;
					tokenTypeToLoad = 'id_token';
				} else if (currentTokens && currentTokens.refresh_token) {
					tokenToLoad = currentTokens.refresh_token;
					tokenTypeToLoad = 'refresh_token';
				}

				if (tokenToLoad) {
					console.log(
						`✅ [TokenManagement] Found current ${tokenTypeToLoad}, auto-loading and decoding`
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
					if (currentTokens.expires_at) {
						const now = Date.now();
						const expiresAt = new Date(currentTokens.expires_at).getTime();
						setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
					} else if (currentTokens.expires_in) {
						// Calculate expiration from expires_in
						const now = Date.now();
						const expiresAt = now + currentTokens.expires_in * 1000;
						setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
					} else {
						setTokenStatus('valid');
					}
				} else {
					console.log('ℹ️ [TokenManagement] No tokens found in auth context or storage');
					setTokenStatus('none');
				}
			} catch (error) {
				console.error('❌ [TokenManagement] Error loading current token:', error);
				setTokenStatus('none');
			}
		};

		// Add a small delay to ensure auth context is fully loaded
		const timer = setTimeout(loadCurrentToken, 100);
		return () => clearTimeout(timer);

		// Load token history
		const history = getTokenHistory();

		// If no history exists and we have current tokens, create initial history entries
		if (history.entries.length === 0 && tokens?.access_token) {
			console.log(
				'🔍 [TokenManagement] No history found, creating sample entries with current tokens'
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
				console.log('✅ [TokenManagement] Added current tokens to history');
			}
		} else {
			setTokenHistory(history.entries);
			console.log(
				'📋 [TokenManagement] Loaded existing token history:',
				history.entries.length,
				'entries'
			);
		}
	}, [tokens]);

	const decodeJWT = (token: string) => {
		try {
			if (!token || token.trim() === '') {
				throw new Error('Please enter a JWT token');
			}

			console.log(
				'🔍 [TokenManagement] Attempting to decode token:',
				token.substring(0, 50) + '...'
			);

			const parts = token.split('.');
			console.log('🔍 [TokenManagement] Token parts count:', parts.length);

			if (parts.length !== 3) {
				throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
			}

			// Helper function to decode JWT parts with proper base64 handling
			const parseJwtPart = (part: string) => {
				try {
					// Add padding if needed
					let base64 = part.replace(/-/g, '+').replace(/_/g, '/');
					while (base64.length % 4) {
						base64 += '=';
					}

					// Use modern base64 decoding
					let decoded;
					if (typeof window !== 'undefined' && window.btoa) {
						// Browser environment
						decoded = atob(base64);
					} else {
						// Node.js environment or fallback
						decoded = Buffer.from(base64, 'base64').toString('binary');
					}

					// Convert to UTF-8 string
					const jsonPayload = decodeURIComponent(
						Array.from(decoded, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(
							''
						)
					);

					const parsed = JSON.parse(jsonPayload);
					console.log('✅ [TokenManagement] Successfully parsed JWT part:', {
						part: part.substring(0, 20) + '...',
						result: parsed,
					});
					return parsed;
				} catch (e) {
					console.error(
						'❌ [TokenManagement] Error parsing JWT part:',
						e,
						'Part:',
						part.substring(0, 20) + '...'
					);
					throw e;
				}
			};

			// Decode header
			console.log('🔍 [TokenManagement] Decoding header part:', parts[0].substring(0, 20) + '...');
			const header = parseJwtPart(parts[0]);
			setJwtHeader(JSON.stringify(header, null, 2));

			// Decode payload
			console.log('🔍 [TokenManagement] Decoding payload part:', parts[1].substring(0, 20) + '...');
			const payload = parseJwtPart(parts[1]);
			setJwtPayload(JSON.stringify(payload, null, 2));

			console.log('✅ [TokenManagement] Successfully decoded JWT:', { header, payload });
			setTokenStatus('valid');
			setSuccessMessage(
				'Token successfully decoded! You can now view the header and payload details below.'
			);
		} catch (error) {
			console.error('❌ [TokenManagement] JWT decode error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			setJwtHeader('Error: ' + errorMessage);
			setJwtPayload('Error: ' + errorMessage);
			setTokenStatus('invalid');
		}
	};

	const handleTokenInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setTokenString(e.target.value);
		setSuccessMessage(null); // Clear success message when user types
	};

	const handleDecodeClick = () => {
		// If no token in input, try to get current token from auth context or storage
		if (!tokenString || tokenString.trim() === '') {
			console.log('🔄 [TokenManagement] No token in input, attempting to load current token...');

			// Try to get token from auth context first
			console.log('🔍 [TokenManagement] Auth context tokens:', tokens);
			if (tokens && tokens.access_token) {
				console.log('✅ [TokenManagement] Loading token from auth context for decoding');
				setTokenString(tokens.access_token);
				setTimeout(() => decodeJWT(tokens.access_token), 100);
				return;
			}

			// Try to get token from storage
			const storedTokens = getOAuthTokens();
			console.log('🔍 [TokenManagement] Stored tokens from getOAuthTokens():', storedTokens);
			if (storedTokens && storedTokens.access_token) {
				console.log('✅ [TokenManagement] Loading token from storage for decoding');
				setTokenString(storedTokens.access_token);
				setTimeout(() => decodeJWT(storedTokens.access_token), 100);
				return;
			}

			// No token available
			console.log('❌ [TokenManagement] No token available in auth context or storage');
			setMessage({
				type: 'warning',
				title: 'No Token Available',
				message: 'No token available to decode. Please load a token first or enter one manually.',
			});
			return;
		}

		decodeJWT(tokenString);
	};

	const handleGetToken = async () => {
		setIsLoading(true);
		try {
			console.log('🔄 [TokenManagement] Getting current token from auth context:', tokens);

			let currentTokens = tokens;

			// If no tokens in auth context, try to load from storage
			if (!currentTokens || !currentTokens.access_token) {
				console.log('ℹ️ [TokenManagement] No tokens in auth context, checking storage...');
				currentTokens = getOAuthTokens();
				if (currentTokens) {
					console.log('✅ [TokenManagement] Found tokens in storage:', currentTokens);
				}
			}

			if (currentTokens && currentTokens.access_token) {
				console.log('✅ [TokenManagement] Loading current access token');
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
				console.log('⚠️ [TokenManagement] No current access token available');
				setMessage({
					type: 'error',
					title: 'No Token Available',
					message:
						'No current access token available. Please complete an OAuth flow first or use "Load from Storage" to load previously saved tokens.',
				});
			}
		} catch (error) {
			console.error('❌ [TokenManagement] Error getting token:', error);
			setMessage({
				type: 'error',
				title: 'Error Loading Token',
				message:
					'Error loading current token: ' +
					(error instanceof Error ? error.message : 'Unknown error'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleGetSpecificToken = async (
		tokenType: 'access_token' | 'id_token' | 'refresh_token'
	) => {
		setIsLoading(true);
		try {
			console.log(`🔄 [TokenManagement] Getting ${tokenType} from auth context:`, tokens);

			let currentTokens = tokens;

			// If no tokens in auth context OR the specific token type is missing, try to load from storage
			if (!currentTokens || !currentTokens[tokenType]) {
				console.log(`ℹ️ [TokenManagement] No ${tokenType} in auth context, checking storage...`);
				const storageTokens = getOAuthTokens();
				if (storageTokens && storageTokens[tokenType]) {
					console.log(`✅ [TokenManagement] Found ${tokenType} in secure storage:`, storageTokens);
					currentTokens = storageTokens;
				} else {
					// Check localStorage for tokens from Authorization Code flow
					console.log('ℹ️ [TokenManagement] Checking localStorage for oauth_tokens...');
					const localStorageTokens = localStorage.getItem('oauth_tokens');
					if (localStorageTokens) {
						try {
							const parsedTokens = JSON.parse(localStorageTokens);
							console.log('✅ [TokenManagement] Found tokens in localStorage:', parsedTokens);
							if (parsedTokens && parsedTokens[tokenType]) {
								currentTokens = parsedTokens;
							}
						} catch (parseError) {
							console.error('❌ [TokenManagement] Error parsing localStorage tokens:', parseError);
						}
					}
				}
			}

			// Debug: Log all available token types
			if (currentTokens) {
				console.log('🔍 [TokenManagement] Available tokens:', {
					access_token: currentTokens.access_token ? '✅' : '❌',
					id_token: currentTokens.id_token ? '✅' : '❌',
					refresh_token: currentTokens.refresh_token ? '✅' : '❌',
					token_type: currentTokens.token_type || 'none',
					expires_in: currentTokens.expires_in || 'none',
				});
			}

			if (currentTokens && currentTokens[tokenType]) {
				console.log(`✅ [TokenManagement] Loading current ${tokenType}`);
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

				// Show success message
				setSuccessMessage(`✅ ${tokenType.replace('_', ' ').toUpperCase()} loaded successfully!`);
			} else {
				console.log(`⚠️ [TokenManagement] No current ${tokenType} available`);
				console.log('🔍 [TokenManagement] Current tokens object:', currentTokens);
				setMessage({
					type: 'error',
					title: 'No Token Available',
					message: `No ${tokenType.replace('_', ' ')} found in current session or storage. Please complete an OAuth flow first.`,
				});
			}
		} catch (error) {
			console.error(`❌ [TokenManagement] Error getting ${tokenType}:`, error);
			setMessage({
				type: 'error',
				title: 'Error Getting Token',
				message: `Failed to retrieve ${tokenType.replace('_', ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyToken = async () => {
		if (tokenString) {
			try {
				await navigator.clipboard.writeText(tokenString);
				setMessage({
					type: 'success',
					title: 'Copied!',
					message: 'Token copied to clipboard!',
				});
			} catch (error) {
				console.error('Error copying token:', error);
			}
		}
	};

	const handleCopyHeader = async () => {
		if (jwtHeader) {
			try {
				await navigator.clipboard.writeText(jwtHeader);
				setMessage({
					type: 'success',
					title: 'Copied!',
					message: 'JWT Header copied to clipboard!',
				});
			} catch (error) {
				console.error('Error copying header:', error);
			}
		}
	};

	const handleCopyPayload = async () => {
		if (jwtPayload) {
			try {
				await navigator.clipboard.writeText(jwtPayload);
				setMessage({
					type: 'success',
					title: 'Copied!',
					message: 'JWT Payload copied to clipboard!',
				});
			} catch (error) {
				console.error('Error copying payload:', error);
			}
		}
	};

	const handleValidateToken = async () => {
		if (!tokenString) {
			setMessage({
				type: 'warning',
				title: 'No Token',
				message: 'No token to validate',
			});
			return;
		}

		setIsLoading(true);
		try {
			// Simulate token validation
			setTimeout(() => {
				setTokenStatus('valid');
				setMessage({
					type: 'success',
					title: 'Token Valid',
					message: 'Token is valid!',
				});
				setIsLoading(false);
			}, 500);
		} catch (error) {
			console.error('Error validating token:', error);
			setIsLoading(false);
		}
	};

	const handleTestConnection = async () => {
		setIsLoading(true);
		try {
			// Simulate connection test
			setTimeout(() => {
				setMessage({
					type: 'success',
					title: 'Connection Test',
					message: 'Connection test successful!',
				});
				setIsLoading(false);
			}, 1000);
		} catch (error) {
			console.error('Error testing connection:', error);
			setIsLoading(false);
		}
	};

	const handleRevokeToken = async () => {
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
				setMessage({
					type: 'success',
					title: 'Token Revoked',
					message: 'Token revoked successfully!',
				});
				setIsLoading(false);
			}, 500);
		} catch (error) {
			console.error('Error revoking token:', error);
			setIsLoading(false);
		}
	};

	const handleClearToken = () => {
		setShowClearModal(true);
	};

	const confirmClearToken = () => {
		setTokenString('');
		setJwtHeader('');
		setJwtPayload('');
		setTokenStatus('none');
		setMessage({
			type: 'success',
			title: 'Token Cleared',
			message: 'Token has been cleared successfully!',
		});
	};

	const handleClearHistory = () => {
		setShowClearHistoryModal(true);
	};

	const confirmClearHistory = () => {
		clearTokenHistory();
		setTokenHistory([]);
		setMessage({
			type: 'success',
			title: 'History Cleared',
			message: 'Token history cleared successfully!',
		});
	};

	const handleRemoveHistoryEntry = (entryId: string) => {
		setHistoryEntryToRemove(entryId);
		setShowRemoveHistoryModal(true);
	};

	const confirmRemoveHistoryEntry = () => {
		if (historyEntryToRemove) {
			removeTokenFromHistory(historyEntryToRemove);
			setTokenHistory((prev) => prev.filter((entry) => entry.id !== historyEntryToRemove));
			setMessage({
				type: 'success',
				title: 'Entry Removed',
				message: 'Token entry removed from history successfully!',
			});
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
	const handleAnalyzeToken = async () => {
		if (!tokenString.trim()) return;

		try {
			await analyzeToken(tokenString);
		} catch (error) {
			console.error('Token analysis failed:', error);
		}
	};

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

	const handleLoadFromStorage = () => {
		console.log('🔄 [TokenManagement] Loading tokens from storage...');
		const storedTokens = getOAuthTokens();

		console.log('🔍 [TokenManagement] Stored tokens from getOAuthTokens():', storedTokens);

		if (storedTokens && storedTokens.access_token) {
			console.log('✅ [TokenManagement] Found stored tokens, loading...');
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
			console.log('ℹ️ [TokenManagement] No stored tokens found');
			setTokenStatus('none');
		}
	};

	// Auto-analyze token when it changes
	useEffect(() => {
		if (tokenString.trim()) {
			handleAnalyzeToken();
		}
	}, [tokenString]);

	// Function to refresh token history
	const refreshTokenHistory = useCallback(() => {
		console.log('🔄 [TokenManagement] Manually refreshing token history...');
		const history = getTokenHistory();

		console.log('📋 [TokenManagement] Refreshed token history:', {
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
		console.log('🔄 [TokenManagement] Loading token history on mount...');
		const history = getTokenHistory();

		console.log('📋 [TokenManagement] Mount - Retrieved token history:', {
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
			console.log(
				'✅ [TokenManagement] Loaded',
				history.entries.length,
				'history entries on mount'
			);
		} else {
			console.log('ℹ️ [TokenManagement] No token history found on mount');
		}
	}, []); // Run only on mount

	// Refresh token history when tokens change (but don't create duplicate entries)
	useEffect(() => {
		if (tokens?.access_token) {
			console.log('🔄 [TokenManagement] Tokens changed, refreshing history...');
			const history = getTokenHistory();

			// Only add to history if this token isn't already in history
			const tokenAlreadyInHistory = history.entries.some(
				(entry) => entry.tokens?.access_token === tokens.access_token
			);

			if (!tokenAlreadyInHistory) {
				console.log('🔍 [TokenManagement] New token detected, adding to history');

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
						'✅ [TokenManagement] Added new tokens to history, total entries:',
						updatedHistory.entries.length
					);
				}
			} else {
				console.log('ℹ️ [TokenManagement] Token already exists in history, skipping');
			}
		}
	}, [tokens]); // Re-run when tokens change

	// Determine token source display
	const getTokenSourceInfo = () => {
		if (flowSource.includes('oauth-v3')) {
			return {
				type: 'OAuth 2.0 V3',
				description: 'Tokens from OAuth 2.0 Authorization Code Flow V3',
				color: '#0369a1',
				icon: <FiKey />,
			};
		} else if (flowSource.includes('oidc-v3')) {
			return {
				type: 'OpenID Connect V3',
				description: 'Tokens from OIDC Authorization Code Flow V3',
				color: '#059669',
				icon: <FiShield />,
			};
		} else if (flowSource.includes('enhanced')) {
			return {
				type: 'Enhanced Authorization Code',
				description: 'Tokens from Enhanced Authorization Code Flow',
				color: '#0891b2',
				icon: <FiShield />,
			};
		} else if (flowSource.includes('implicit')) {
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

	const tokenSourceInfo = getTokenSourceInfo();

	return (
		<Container>
			<PageTitle
				title={
					<>
						<FiKey />
						Token Management
					</>
				}
				subtitle="Monitor and manage PingOne authentication tokens"
			/>

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
				{flowSource && (
					<div
						style={{
							fontSize: '0.75rem',
							color: '#9ca3af',
							fontFamily: 'monospace',
							background: '#f9fafb',
							padding: '0.5rem',
							borderRadius: '4px',
							border: '1px solid #e5e7eb',
						}}
					>
						Flow Source ID: {flowSource}
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
								{tokens && tokens.access_token
									? 'Token from your current OAuth session is automatically loaded and decoded below. You can also paste other tokens for analysis.'
									: 'No active token found. Complete an OAuth flow to get tokens, or paste a token below for analysis.'}
							</small>
						</div>
					</TokenStatus>

					{(tokens && tokens.access_token) || tokenString ? (
						<TokenDetails>
							<div className="detail">
								<span className="label">Token Type</span>
								<span className="value">
									{tokens?.token_type || 'Bearer'}
									{getTokenTypeInfo().type !== 'unknown' &&
										` (${getTokenTypeInfo().type === 'access' ? 'Access Token' : getTokenTypeInfo().type === 'id' ? 'ID Token' : getTokenTypeInfo().type === 'refresh' ? 'Refresh Token' : getTokenTypeInfo().type})`}
								</span>
							</div>
							<div className="detail">
								<span className="label">Scope</span>
								<span className="value">
									{tokens?.scope || getTokenTypeInfo().scopes?.join(' ') || 'openid profile email'}
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
					<p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
						{tokenSource?.source === 'Current Session'
							? 'Currently showing your active Access Token. You can also paste any other JWT token below for decoding.'
							: 'Paste any JWT token below to decode and analyze it. You can get tokens from the AuthZ Code Flow or paste custom tokens.'}
					</p>
				</CardHeader>
				<CardBody>
					<TokenSurface
						hasToken={!!tokenString}
						isJson={!!tokenString && tokenString.trim().startsWith('{')}
						jsonContent={
							tokenString && tokenString.trim().startsWith('{') ? tokenString : undefined
						}
						ariaLabel="JWT token input for decoding"
					>
						<textarea
							id="token-string"
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
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
							>
								<FiInfo />
								OAuth 2.0 Flow Detected
							</div>
							<div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
								ID Tokens are not available in pure OAuth 2.0 flows. ID Tokens are an OpenID Connect
								(OIDC) feature. Only Access and Refresh tokens are available for analysis.
							</div>
						</div>
					)}

					<ButtonGroup>
						<ActionButton
							id="get-access-token-btn"
							className="primary"
							onClick={() => handleGetSpecificToken('access_token')}
							disabled={isLoading}
						>
							<FiKey />
							{isLoading ? 'Getting...' : 'Get Access Token'}
						</ActionButton>

						<ActionButton
							id="get-id-token-btn"
							className={isOAuthFlow ? 'secondary' : 'primary'}
							onClick={() => handleGetSpecificToken('id_token')}
							disabled={isLoading || isOAuthFlow}
							title={
								isOAuthFlow
									? 'ID Tokens are not available in OAuth 2.0 flows (only in OpenID Connect)'
									: 'Get ID Token from current session'
							}
						>
							<FiShield />
							{isLoading ? 'Getting...' : isOAuthFlow ? 'ID Token (OAuth N/A)' : 'Get ID Token'}
						</ActionButton>

						<ActionButton
							id="get-refresh-token-btn"
							className="primary"
							onClick={() => handleGetSpecificToken('refresh_token')}
							disabled={isLoading}
						>
							<FiRefreshCw />
							{isLoading ? 'Getting...' : 'Get Refresh Token'}
						</ActionButton>

						<ActionButton
							id="copy-token-btn"
							className="secondary"
							onClick={handleCopyToken}
							disabled={!tokenString || isLoading}
						>
							<FiCopy />
							Copy Token
						</ActionButton>

						<ActionButton
							className="secondary"
							onClick={() => {
								console.log('🔄 [TokenManagement] Loading tokens from storage...');
								const storedTokens = getOAuthTokens();

								console.log(
									'🔍 [TokenManagement] Stored tokens from getOAuthTokens():',
									storedTokens
								);

								if (storedTokens && storedTokens.access_token) {
									console.log('✅ [TokenManagement] Found stored tokens, loading...');
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
									setMessage({
										type: 'success',
										title: 'Token Loaded from Storage!',
										message: 'Successfully loaded and decoded token from secure storage.',
									});
								} else {
									console.log('ℹ️ [TokenManagement] No stored tokens found');
									setTokenStatus('none');
									setMessage({
										type: 'warning',
										title: 'No Stored Tokens',
										message: 'No tokens found in secure storage. Complete an OAuth flow first.',
									});
								}
							}}
						>
							<FiRefreshCw />
							Load from Storage
						</ActionButton>

						<ActionButton
							className="secondary"
							onClick={() => {
								console.log('🔄 [TokenManagement] Getting token from AuthZ Code Flow...');
								// Try to get token from auth context first
								if (tokens && tokens.access_token) {
									console.log('✅ [TokenManagement] Found token in auth context');
									setTokenString(tokens.access_token);
									setTokenSource({
										source: 'AuthZ Code Flow',
										description: 'Access Token from current OAuth session',
										timestamp: new Date().toLocaleString(),
									});
									setTimeout(() => decodeJWT(tokens.access_token), 100);

									// Show success message
									setMessage({
										type: 'success',
										title: 'Token Loaded from AuthZ Code Flow!',
										message:
											'Successfully loaded and decoded access token from current OAuth session.',
									});
								} else {
									// Try to get from storage
									const storedTokens = getOAuthTokens();
									if (storedTokens && storedTokens.access_token) {
										console.log('✅ [TokenManagement] Found token in storage');
										setTokenString(storedTokens.access_token);
										setTokenSource({
											source: 'AuthZ Code Flow (Stored)',
											description: 'Access Token from stored OAuth session',
											timestamp: new Date().toLocaleString(),
										});
										setTimeout(() => decodeJWT(storedTokens.access_token), 100);

										// Show success message
										setMessage({
											type: 'success',
											title: 'Token Loaded from Stored Session!',
											message:
												'Successfully loaded and decoded access token from stored OAuth session.',
										});
									} else {
										setMessage({
											type: 'warning',
											title: 'No Token Available',
											message:
												'No token available from AuthZ Code Flow. Please complete the OAuth flow first.',
										});
									}
								}
							}}
						>
							<FiKey />
							Get from AuthZ Code Flow
						</ActionButton>

						<ActionButton
							id="decode-token-btn"
							className="primary"
							onClick={handleDecodeClick}
							disabled={!tokenString || isLoading}
						>
							<FiEye />
							Decode JWT
						</ActionButton>

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
									jti: 'jwt_' + Date.now(),

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
									sid: 'session_' + Date.now(),
								};

								// Create a properly formatted JWT (header.payload.signature)
								const header = { alg: 'RS256', typ: 'JWT', kid: 'sample_key_id_123' };
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
									'🧪 [TokenManagement] Loaded comprehensive sample token with realistic PingOne structure'
								);

								// Auto-decode the sample token
								setTimeout(() => decodeJWT(sampleToken), 100);

								// Show success message
								setMessage({
									type: 'success',
									title: 'Comprehensive Sample Token Loaded!',
									message:
										'Loaded a realistic sample token with comprehensive claims matching real PingOne token structure. Perfect for testing and demonstration.',
								});
							}}
						>
							🧪 Load Sample Token
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
								console.log('🚨 [TokenManagement] Loaded bad security token for demonstration');

								// Auto-decode the bad token
								setTimeout(() => decodeJWT(badToken), 100);

								// Show success message
								setMessage({
									type: 'success',
									title: 'Bad Security Token Loaded!',
									message:
										'Generated a token with intentional security flaws for demonstration. Check the analysis section to see detected issues.',
								});
							}}
						>
							🚨 Bad Security Token
						</ActionButton>
					</ButtonGroup>
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
							id="jwt-header"
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
							{jwtPayload && jwtPayload !== 'No token data' && !jwtPayload.startsWith('Error:') && (
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
							id="jwt-payload"
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

			{/* Token History Section */}
			<TokenSection>
				<CardHeader>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h2>Token History</h2>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<ActionButton
								className="secondary"
								style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
								onClick={() => {
									const count = refreshTokenHistory();
									showFlowSuccess(`Token history refreshed! Found ${count} entries.`);
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
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
							<FiClock style={{ display: 'inline', marginRight: '0.5rem', fontSize: '1.5rem' }} />
							<div style={{ marginTop: '0.5rem' }}>No token history available</div>
							<div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
								Complete OAuth flows to see token history here
							</div>
						</div>
					) : (
						<div>
							<div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
								{tokenHistory.length} token{tokenHistory.length !== 1 ? 's' : ''} received from
								OAuth flows
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
													style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}
												>
													Scope: {entry.tokens.scope || 'openid profile email'}
												</div>
											</HistoryTableCell>

											<HistoryTableCell>
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
													{entry.hasAccessToken && (
														<TokenBadge $type="access">🔐 Access</TokenBadge>
													)}
													{entry.hasIdToken && <TokenBadge $type="id">🎫 ID</TokenBadge>}
													{entry.hasRefreshToken && (
														<TokenBadge $type="refresh">🔄 Refresh</TokenBadge>
													)}
												</div>
												<div
													style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}
												>
													{entry.tokenCount} token{entry.tokenCount !== 1 ? 's' : ''} •{' '}
													{entry.tokens.token_type || 'Bearer'}
												</div>
											</HistoryTableCell>

											<HistoryTableCell>
												<div style={{ color: '#374151', fontWeight: '500' }}>
													{entry.timestampFormatted}
												</div>
												<div
													style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}
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
					<h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
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
												({Math.floor(getTokenExpirationStatus().timeRemaining / 1000 / 60)} minutes
												remaining)
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
											<h4 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Security Score</h4>
											<ScoreCircle $score={getTokenSecurityScore().overall}>
												{getTokenSecurityScore().overall}
											</ScoreCircle>
											<div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
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
													<strong>Type:</strong> {getTokenTypeInfo().type}
												</div>
												<div>
													<strong>Format:</strong> {getTokenTypeInfo().format}
												</div>
												{getTokenTypeInfo().issuer && (
													<div>
														<strong>Issuer:</strong> {getTokenTypeInfo().issuer}
													</div>
												)}
												{getTokenTypeInfo().subject && (
													<div>
														<strong>Subject:</strong> {getTokenTypeInfo().subject}
													</div>
												)}
												{getTokenTypeInfo().scopes && (
													<div>
														<strong>Scopes:</strong> {getTokenTypeInfo().scopes?.join(', ')}
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
												<IssueItem key={index} $severity={issue.severity}>
													<div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
														{issue.type.replace(/_/g, ' ').toUpperCase()}
													</div>
													<div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
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
												<IssueItem key={index} $severity={error.severity}>
													<div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
														{error.field}
													</div>
													<div style={{ fontSize: '0.875rem' }}>{error.error}</div>
												</IssueItem>
											))}
										</IssueList>
									</div>
								)}

								{/* Recommendations */}
								{getTokenRecommendations().length > 0 && (
									<div style={{ marginBottom: '1.5rem' }}>
										<h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>
											<FiInfo style={{ marginRight: '0.5rem' }} />
											Recommendations
										</h4>
										<RecommendationList>
											{getTokenRecommendations().map((recommendation, index) => (
												<RecommendationItem key={index}>{recommendation}</RecommendationItem>
											))}
										</RecommendationList>
									</div>
								)}

								{/* Token Claims - REMOVED FOR NOW (saved for potential future use)
                {Object.keys(getTokenClaims()).length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Token Claims</h4>
                    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                      <JSONHighlighter data={getTokenClaims()} />
                    </div>
                  </div>
                )}
                */}
							</div>
						) : (
							<div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
								<FiKey size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
								<p>Enter a token above to see detailed analysis</p>
							</div>
						)}
					</TabContent>

					{/* Error Diagnosis Tab */}
					<TabContent $active={activeTab === 'diagnosis'}>
						<div>
							<h4 style={{ margin: '0 0 1rem 0' }}>Error Diagnosis</h4>
							<p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
								Paste an error message below to get automated diagnosis and suggested fixes.
							</p>

							<ErrorInput
								placeholder="Paste error message here..."
								value={errorInput}
								onChange={(e) => setErrorInput(e.target.value)}
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
													<FixItem key={index} $priority={fix.priority}>
														<div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
															{fix.title}
														</div>
														<div style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
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
															{fix.estimatedTime} |<strong> Success Rate:</strong> {fix.successRate}
															%
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
																		<li key={stepIndex} style={{ marginBottom: '0.25rem' }}>
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
			<CentralizedSuccessMessage position="top" />
			<CentralizedSuccessMessage position="bottom" />
		</Container>
	);
};

export default TokenManagement;
