import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiRefreshCw, FiCheckCircle, FiPlus, FiX, FiClock, FiKey, FiEye, FiTrash2, FiCopy, FiShield, FiAlertTriangle, FiXCircle, FiInfo, FiDownload, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import PageTitle from '../components/PageTitle';
import { getOAuthTokens } from '../utils/tokenStorage';
import { getTokenHistory, clearTokenHistory, removeTokenFromHistory, getFlowDisplayName, getFlowIcon, TokenHistoryEntry } from '../utils/tokenHistory';
import { useTokenAnalysis } from '../hooks/useTokenAnalysis';
import { useErrorDiagnosis } from '../hooks/useErrorDiagnosis';
import JSONHighlighter from '../components/JSONHighlighter';
import { TokenSurface } from '../components/TokenSurface';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
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

const TokenTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid #374151;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 120px;
  margin-bottom: 1rem;
  background-color: #1f2937;
  color: #ffffff;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

const JWTContent = styled.pre`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 2px solid #374151;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #ffffff !important;
  min-height: 120px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
    border-radius: 0.5rem 0.5rem 0 0;
  }
  
  &:empty::before {
    content: 'No token data';
    color: #9ca3af;
    font-style: italic;
  }
`;

const JWTHeader = styled.pre`
  background: #000000;
  border: 2px solid #374151;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #ffffff !important;
  min-height: 120px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
    border-radius: 0.5rem 0.5rem 0 0;
  }
  
  &:empty::before {
    content: 'No token data';
    color: #9ca3af;
    font-style: italic;
  }
`;

const JWTPayload = styled.pre`
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #000000 !important;
  min-height: 120px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #10b981, #059669, #047857);
    border-radius: 0.5rem 0.5rem 0 0;
  }
  
  &:empty::before {
    content: 'No token data';
    color: #6b7280;
    font-style: italic;
  }
`;

const HistoryEntry = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const HistoryFlow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
`;

const HistoryTimestamp = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const HistoryTokens = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const TokenBadge = styled.span<{ $type: 'access' | 'id' | 'refresh' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $type }) => {
    switch ($type) {
      case 'access': return '#dbeafe';
      case 'id': return '#fef3c7';
      case 'refresh': return '#d1fae5';
      default: return '#f3f4f6';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'access': return '#1e40af';
      case 'id': return '#92400e';
      case 'refresh': return '#065f46';
      default: return '#374151';
    }
  }};
  border: 1px solid ${({ $type }) => {
    switch ($type) {
      case 'access': return '#93c5fd';
      case 'id': return '#fcd34d';
      case 'refresh': return '#6ee7b7';
      default: return '#d1d5db';
    }
  }};
`;

const HistoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
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
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }};
  background-color: ${({ $severity }) => {
    switch ($severity) {
      case 'critical': return '#fef2f2';
      case 'high': return '#fff7ed';
      case 'medium': return '#fffbeb';
      case 'low': return '#f0fdf4';
      default: return '#f9fafb';
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
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#d1d5db';
    }
  }};
  background-color: ${({ $priority }) => {
    switch ($priority) {
      case 'critical': return '#fef2f2';
      case 'high': return '#fff7ed';
      case 'medium': return '#fffbeb';
      case 'low': return '#f0fdf4';
      default: '#ffffff';
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
  color: ${({ $active }) => $active ? '#3b82f6' : '#6b7280'};
  border-bottom-color: ${({ $active }) => $active ? '#3b82f6' : 'transparent'};
  
  &:hover {
    color: #3b82f6;
  }
`;

const TabContent = styled.div<{ $active: boolean }>`
  display: ${({ $active }) => $active ? 'block' : 'none'};
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
      case 'valid': return '#f0fdf4';
      case 'expiring': return '#fef3c7';
      case 'expired': return '#fef2f2';
      default: return '#f9fafb';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'valid': return '#16a34a';
      case 'expiring': return '#d97706';
      case 'expired': return '#dc2626';
      default: return '#6b7280';
    }
  }};
  border: 1px solid ${({ $status }) => {
    switch ($status) {
      case 'valid': return '#bbf7d0';
      case 'expiring': return '#fde68a';
      case 'expired': return '#fecaca';
      default: return '#e5e7eb';
    }
  }};
`;

const TokenManagement = () => {
  const [tokenString, setTokenString] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [tokenStatus, setTokenStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenSource, setTokenSource] = useState<Record<string, unknown> | null>(null);
  const [tokenHistory, setTokenHistory] = useState<TokenHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'diagnosis'>('analysis');
  const [errorInput, setErrorInput] = useState('');

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
    canRefresh
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
    hasCurrentDiagnosis
  } = useErrorDiagnosis({ enabled: true });

  // Mock token data for demonstration
  const mockTokenData = {
    access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh-token-123',
    scope: 'openid profile email'
  };

  useEffect(() => {
    // Auto-load tokens from OAuth flows on component mount
    const loadStoredTokens = () => {
      try {
        const oauthTokens = getOAuthTokens();
        
        if (oauthTokens && oauthTokens.access_token) {
          console.log('🔄 [TokenManagement] Auto-loading tokens from OAuth flows:', oauthTokens);
          setTokenString(oauthTokens.access_token);
          setTokenSource({
            source: 'OAuth Flow',
            description: `Token from ${oauthTokens.token_type || 'Bearer'} flow`,
            timestamp: oauthTokens.timestamp ? new Date(oauthTokens.timestamp).toLocaleString() : new Date().toLocaleString()
          });
          
          // Auto-decode the token
          setTimeout(() => decodeJWT(oauthTokens.access_token), 100);
          
          // Update token status based on expiration
          if (oauthTokens.timestamp && oauthTokens.expires_in) {
            const now = Date.now();
            const expiresAt = oauthTokens.timestamp + (oauthTokens.expires_in * 1000);
            setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
          } else {
            setTokenStatus('valid');
          }
        } else {
          // Fallback to old storage method for backward compatibility
          const storedToken = localStorage.getItem('pingone_token_cache');
          if (storedToken) {
            const tokenData = JSON.parse(storedToken);
            setTokenString(tokenData.token || '');
            setTokenSource({
              source: 'Legacy Storage',
              description: 'Token loaded from legacy browser storage',
              timestamp: new Date().toLocaleString()
            });
            setTimeout(() => decodeJWT(tokenData.token), 100);
          }
        }
      } catch (error) {
        console.error('❌ [TokenManagement] Error loading stored tokens:', error);
      }
    };
    
    loadStoredTokens();
    
    // Load token history
    const history = getTokenHistory();
    setTokenHistory(history.entries);
  }, []);

  const decodeJWT = (token: string) => {
    try {
      if (!token || token.trim() === '') {
        throw new Error('Please enter a JWT token');
      }

      console.log('🔍 [TokenManagement] Attempting to decode token:', token.substring(0, 50) + '...');

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
            Array.from(decoded, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
          );
          
          const parsed = JSON.parse(jsonPayload);
          console.log('✅ [TokenManagement] Successfully parsed JWT part:', { part: part.substring(0, 20) + '...', result: parsed });
          return parsed;
        } catch (e) {
          console.error('❌ [TokenManagement] Error parsing JWT part:', e, 'Part:', part.substring(0, 20) + '...');
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
  };

  const handleDecodeClick = () => {
    decodeJWT(tokenString);
  };

  const handleGetToken = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to get token
      setTimeout(() => {
        setTokenString(mockTokenData.access_token);
        setTokenSource({
          source: 'API Call',
          description: 'Token obtained from mock API',
          timestamp: new Date().toLocaleString()
        });
        decodeJWT(mockTokenData.access_token);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting token:', error);
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (tokenString) {
      try {
        await navigator.clipboard.writeText(tokenString);
        alert('Token copied to clipboard!');
      } catch (error) {
        console.error('Error copying token:', error);
      }
    }
  };


  const handleValidateToken = async () => {
    if (!tokenString) {
      alert('No token to validate');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate token validation
      setTimeout(() => {
        setTokenStatus('valid');
        alert('Token is valid!');
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
        alert('Connection test successful!');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error testing connection:', error);
      setIsLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (confirm('Are you sure you want to revoke this token?')) {
      setIsLoading(true);
      try {
        // Simulate token revocation
        setTimeout(() => {
          setTokenString('');
          setJwtHeader('');
          setJwtPayload('');
          setTokenStatus('none');
          alert('Token revoked successfully!');
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error revoking token:', error);
        setIsLoading(false);
      }
    }
  };

  const handleClearToken = () => {
    if (confirm('Are you sure you want to clear the token?')) {
      setTokenString('');
      setJwtHeader('');
      setJwtPayload('');
      setTokenStatus('none');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all token history?')) {
      clearTokenHistory();
      setTokenHistory([]);
      alert('Token history cleared successfully!');
    }
  };

  const handleRemoveHistoryEntry = (entryId: string) => {
    if (confirm('Are you sure you want to remove this token from history?')) {
      removeTokenFromHistory(entryId);
      setTokenHistory(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  const handleLoadTokenFromHistory = (entry: TokenHistoryEntry) => {
    if (entry.tokens.access_token) {
      setTokenString(entry.tokens.access_token);
      setTokenSource({
        source: 'Token History',
        description: `Token from ${entry.flowName} (${entry.timestampFormatted})`,
        timestamp: entry.timestampFormatted
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
        const newToken = mockTokenData.access_token.replace('1234567890', Date.now().toString().slice(-10));
        setTokenString(newToken);
        setTokenSource({
          source: 'Token Refresh',
          description: 'Token refreshed from analysis system',
          timestamp: new Date().toLocaleString()
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

  // Auto-analyze token when it changes
  useEffect(() => {
    if (tokenString.trim()) {
      handleAnalyzeToken();
    }
  }, [tokenString]);

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

      {/* Token Status Section */}
      <TokenSection>
        <CardHeader>
          <h2>Token Status</h2>
        </CardHeader>
        <CardBody>
          <TokenStatus className={tokenStatus}>
            <div className={`indicator ${tokenStatus}`}></div>
            <span className="text">
              {tokenStatus === 'valid' && 'Token is valid'}
              {tokenStatus === 'expired' && 'Token has expired'}
              {tokenStatus === 'invalid' && 'Token is invalid'}
              {tokenStatus === 'none' && 'No token available'}
            </span>
          </TokenStatus>

          <TokenDetails>
            <div className="detail">
              <div className="label">Token Type</div>
              <div className="value">Bearer</div>
            </div>
            <div className="detail">
              <div className="label">Expires In</div>
              <div className="value">1 hour</div>
            </div>
            <div className="detail">
              <div className="label">Scope</div>
              <div className="value">openid profile email</div>
            </div>
          </TokenDetails>
        </CardBody>
      </TokenSection>

      {/* Raw Token Section */}
      <TokenSection>
        <CardHeader>
          <h2>Raw Token</h2>
        </CardHeader>
        <CardBody>
          <TokenTextarea
            id="token-string"
            value={tokenString}
            onChange={handleTokenInput}
            placeholder="Paste your JWT token here or get a token using the 'Get Token' button"
          />

          <ButtonGroup>
            <ActionButton
              id="get-token-btn"
              className="primary"
              onClick={handleGetToken}
              disabled={isLoading}
            >
              <FiKey />
              {isLoading ? 'Getting...' : 'Get Token'}
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
                const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
                setTokenString(sampleToken);
                console.log('🧪 [TokenManagement] Loaded sample token for testing');
              }}
            >
              🧪 Load Sample Token
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
            <h4>Header</h4>
            <JWTHeader id="jwt-header" className="jwt-content">
              {jwtHeader || 'No token data'}
            </JWTHeader>
          </div>

          <div>
            <h4>Payload</h4>
            <JWTPayload id="jwt-payload" className="jwt-content">
              {jwtPayload || 'No token data'}
            </JWTPayload>
          </div>
        </CardBody>
      </TokenSection>

      {/* Token Controls Section */}
      <TokenSection>
        <CardHeader>
          <h2>Token Actions</h2>
        </CardHeader>
        <CardBody>
          <ButtonGroup>
            <ActionButton
              id="refresh-token-btn"
              className="primary"
              onClick={handleRefreshToken}
              disabled={isLoading}
            >
              <FiRefreshCw />
              {isLoading ? 'Refreshing...' : 'Refresh Token'}
            </ActionButton>

            <ActionButton
              id="validate-token-btn"
              className="secondary"
              onClick={handleValidateToken}
              disabled={!tokenString || isLoading}
            >
              <FiCheckCircle />
              Validate Token
            </ActionButton>

            <ActionButton
              id="test-connection-btn"
              className="secondary"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <FiPlus />
              Test Connection
            </ActionButton>

            <ActionButton
              id="revoke-token-btn"
              className="danger"
              onClick={handleRevokeToken}
              disabled={!tokenString || isLoading}
            >
              <FiX />
              Revoke Token
            </ActionButton>

            <ActionButton
              id="clear-token-btn"
              className="danger"
              onClick={handleClearToken}
              disabled={!tokenString || isLoading}
            >
              <FiTrash2 />
              Clear Token
            </ActionButton>
          </ButtonGroup>
        </CardBody>
      </TokenSection>

      {/* Token History Section */}
      <TokenSection>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Token History</h2>
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
        </CardHeader>
        <CardBody>
          {tokenHistory.length === 0 ? (
            <div style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              <FiClock style={{ display: 'inline', marginRight: '0.5rem', fontSize: '1.5rem' }} />
              <div style={{ marginTop: '0.5rem' }}>No token history available</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Complete OAuth flows to see token history here
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                {tokenHistory.length} token{tokenHistory.length !== 1 ? 's' : ''} received from OAuth flows
              </div>
              {tokenHistory.map((entry) => (
                <HistoryEntry 
                  key={entry.id}
                  onClick={() => handleLoadTokenFromHistory(entry)}
                >
                  <HistoryHeader>
                    <HistoryFlow>
                      <span>{getFlowIcon(entry.flowType)}</span>
                      {entry.flowName}
                    </HistoryFlow>
                    <HistoryTimestamp>
                      {entry.timestampFormatted}
                    </HistoryTimestamp>
                  </HistoryHeader>
                  
                  <HistoryTokens>
                    {entry.hasAccessToken && (
                      <TokenBadge $type="access">
                        🔐 Access Token
                      </TokenBadge>
                    )}
                    {entry.hasIdToken && (
                      <TokenBadge $type="id">
                        🎫 ID Token
                      </TokenBadge>
                    )}
                    {entry.hasRefreshToken && (
                      <TokenBadge $type="refresh">
                        🔄 Refresh Token
                      </TokenBadge>
                    )}
                  </HistoryTokens>
                  
                  <HistoryActions>
                    <HistoryButton 
                      $variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadTokenFromHistory(entry);
                      }}
                    >
                      <FiEye />
                      Load Token
                    </HistoryButton>
                    <HistoryButton 
                      $variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHistoryEntry(entry.id);
                      }}
                    >
                      <FiTrash2 />
                      Remove
                    </HistoryButton>
                  </HistoryActions>
                </HistoryEntry>
              ))}
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
                        ({Math.floor(getTokenExpirationStatus().timeRemaining / 1000 / 60)} minutes remaining)
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
                        {getTokenSecurityScore().overall >= 60 && getTokenSecurityScore().overall < 80 && 'Good'}
                        {getTokenSecurityScore().overall >= 40 && getTokenSecurityScore().overall < 60 && 'Fair'}
                        {getTokenSecurityScore().overall < 40 && 'Poor'}
                      </div>
                    </SecurityScoreCard>

                    {/* Token Information */}
                    <div>
                      <h4 style={{ margin: '0 0 1rem 0' }}>Token Information</h4>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <div><strong>Type:</strong> {getTokenTypeInfo().type}</div>
                        <div><strong>Format:</strong> {getTokenTypeInfo().format}</div>
                        {getTokenTypeInfo().issuer && <div><strong>Issuer:</strong> {getTokenTypeInfo().issuer}</div>}
                        {getTokenTypeInfo().subject && <div><strong>Subject:</strong> {getTokenTypeInfo().subject}</div>}
                        {getTokenTypeInfo().scopes && (
                          <div><strong>Scopes:</strong> {getTokenTypeInfo().scopes?.join(', ')}</div>
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
                          <div style={{ fontSize: '0.875rem' }}>
                            {error.error}
                          </div>
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
                        <RecommendationItem key={index}>
                          {recommendation}
                        </RecommendationItem>
                      ))}
                    </RecommendationList>
                  </div>
                )}

                {/* Token Claims */}
                {Object.keys(getTokenClaims()).length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Token Claims</h4>
                    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                      <JSONHighlighter data={getTokenClaims()} />
                    </div>
                  </div>
                )}
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
                <ActionButton 
                  className="secondary" 
                  onClick={() => setErrorInput('')}
                >
                  <FiX />
                  Clear
                </ActionButton>
              </ButtonGroup>

              {/* Diagnosis Results */}
              {hasCurrentDiagnosis && currentDiagnosis && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: '#f0f9ff', 
                    border: '1px solid #bae6fd',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FiCheckCircle style={{ color: '#3b82f6' }} />
                      <strong>Diagnosis Complete</strong>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      <div><strong>Confidence:</strong> {getErrorConfidence()}%</div>
                      <div><strong>Severity:</strong> {getErrorSeverity()}</div>
                      <div><strong>Category:</strong> {getErrorCategory()}</div>
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
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                              <strong>Priority:</strong> {fix.priority} | 
                              <strong> Time:</strong> {fix.estimatedTime} | 
                              <strong> Success Rate:</strong> {fix.successRate}%
                            </div>
                            {fix.steps.length > 0 && (
                              <div>
                                <strong style={{ fontSize: '0.75rem' }}>Steps:</strong>
                                <ol style={{ fontSize: '0.75rem', marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
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
                                <pre style={{ 
                                  fontSize: '0.75rem', 
                                  background: '#f3f4f6', 
                                  padding: '0.5rem', 
                                  borderRadius: '0.25rem',
                                  marginTop: '0.25rem',
                                  overflow: 'auto'
                                }}>
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

    </Container>
  );
};

export default TokenManagement;
