/**
 * @file PortalSuccess.tsx
 * @module protect-portal/components
 * @description Portal success component with OIDC token display
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This component displays the successful login page with user information,
 * risk evaluation summary, and OIDC token display.
 */

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiCopy, FiEye, FiEyeOff, FiLogOut, FiShield, FiUser, FiInfo } from 'react-icons/fi';

import type {
  UserContext,
  RiskEvaluationResult,
  TokenSet,
  EducationalContent
} from '../types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const SuccessContainer = styled.div`
  width: 100%;
  max-width: 800px;
  text-align: center;
`;

const SuccessTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #059669;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const SuccessMessage = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const UserInfoCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const UserInfoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const UserAvatar = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
`;

const UserDetails = styled.div`
  text-align: left;
`;

const UserName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const UserEmail = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
`;

const UserInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const UserInfoItem = styled.div`
  text-align: left;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #1f2937;
`;

const RiskSummaryCard = styled.div<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  background: ${props => {
    switch (props.riskLevel) {
      case 'LOW':
        return '#f0fdf4';
      case 'MEDIUM':
        return '#fffbeb';
      case 'HIGH':
        return '#fef2f2';
    }
  }};
  border: 1px solid ${props => {
    switch (props.riskLevel) {
      case 'LOW':
        return '#10b981';
      case 'MEDIUM':
        return '#f59e0b';
      case 'HIGH':
        return '#ef4444';
    }
  }};
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const RiskHeader = styled.div<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const RiskTitle = styled.h3<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: ${props => {
    switch (props.riskLevel) {
      case 'LOW':
        return '#059669';
      case 'MEDIUM':
        return '#d97706';
      case 'HIGH':
        return '#dc2626';
    }
  }};
`;

const RiskBadge = styled.span<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  background: ${props => {
    switch (props.riskLevel) {
      case 'LOW':
        return '#10b981';
      case 'MEDIUM':
        return '#f59e0b';
      case 'HIGH':
        return '#ef4444';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const RiskDescription = styled.p`
  font-size: 0.875rem;
  color: #374151;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const TokenSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const TokenHeader = styled.div`
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TokenTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const TokenToggle = styled.button`
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const TokenContent = styled.div`
  padding: 1.5rem;
`;

const TokenType = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TypeName = styled.div`
  font-weight: 600;
  color: #1f2937;
`;

const TypeBadge = styled.span`
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
`;

const TokenPreview = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #374151;
  word-break: break-all;
  position: relative;
`;

const TokenFull = styled.div`
  background: #1f2937;
  color: #10b981;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
  }

  &:active {
    background: #1d4ed8;
  }
`;

const TokenInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;
`;

const TokenInfoItem = styled.div`
  text-align: left;
`;

const InfoLabelSmall = styled.div`
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const InfoValueSmall = styled.div`
  color: #1f2937;
  word-break: break-all;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'secondary' ? '#f3f4f6' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};
  color: ${props => props.variant === 'secondary' ? '#374151' : 'white'};
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
`;

const EducationalSection = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: left;
`;

const EducationalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const EducationalTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
`;

const EducationalDescription = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const KeyPoints = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const KeyPoint = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const KeyPointIcon = styled(FiCheckCircle)`
  color: #10b981;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface PortalSuccessProps {
  userContext: UserContext;
  riskEvaluation: RiskEvaluationResult;
  tokens: TokenSet;
  onLogout: () => void;
  educationalContent: EducationalContent;
}

// ============================================================================
// COMPONENT
// ============================================================================

const PortalSuccess: React.FC<PortalSuccessProps> = ({
  userContext,
  riskEvaluation,
  tokens,
  onLogout,
  educationalContent
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [showFullTokens, setShowFullTokens] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleToggleTokens = useCallback(() => {
    setShowFullTokens(prev => !prev);
  }, []);

  const handleCopyToken = useCallback(async (tokenType: string, token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(tokenType);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  }, []);

  const getRiskLevelInfo = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'LOW':
        return {
          title: 'Low Risk',
          description: 'Your login was completed successfully with standard security measures.',
          icon: '✅',
          color: '#10b981'
        };
      case 'MEDIUM':
        return {
          title: 'Medium Risk (MFA Verified)',
          description: 'Additional verification was completed successfully to secure your login.',
          icon: '🔐',
          color: '#f59e0b'
        };
      case 'HIGH':
        return {
          title: 'High Risk (Blocked)',
          description: 'This login was blocked due to security concerns.',
          icon: '🚫',
          color: '#ef4444'
        };
      default:
        return {
          title: 'Unknown Risk',
          description: 'Risk level could not be determined.',
          icon: '❓',
          color: '#6b7280'
        };
    }
  };

  const formatTokenPreview = (token: string) => {
    return token.substring(0, 20) + '...' + token.substring(token.length - 10);
  };

  const getTokenExpiryTime = (expiresIn: number) => {
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    return expiryDate.toLocaleString();
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    console.log('[🎉 PORTAL-SUCCESS] Portal success page loaded', {
      userId: userContext.id,
      riskLevel: riskEvaluation.result.level,
      hasTokens: !!tokens
    });
  }, [userContext.id, riskEvaluation.result.level, tokens]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const riskInfo = getRiskLevelInfo(riskEvaluation.result.level);

  return (
    <SuccessContainer>
      <SuccessTitle>
        <FiCheckCircle />
        Login Successful
      </SuccessTitle>
      <SuccessMessage>
        Welcome back! Your authentication has been completed successfully.
      </SuccessMessage>

      {/* User Information */}
      <UserInfoCard>
        <UserInfoHeader>
          <UserAvatar>
            {userContext.name?.charAt(0).toUpperCase() || userContext.username.charAt(0).toUpperCase()}
          </UserAvatar>
          <UserDetails>
            <UserName>{userContext.name || userContext.username}</UserName>
            <UserEmail>{userContext.email}</UserEmail>
          </UserDetails>
        </UserInfoHeader>

        <UserInfoGrid>
          <UserInfoItem>
            <InfoLabel>User ID</InfoLabel>
            <InfoValue>{userContext.id}</InfoValue>
          </UserInfoItem>
          <UserInfoItem>
            <InfoLabel>Username</InfoLabel>
            <InfoValue>{userContext.username}</InfoValue>
          </UserInfoItem>
          <UserInfoItem>
            <InfoLabel>User Type</InfoLabel>
            <InfoValue>{userContext.type}</InfoValue>
          </UserInfoItem>
          <UserInfoItem>
            <InfoLabel>Login Time</InfoLabel>
            <InfoValue>{new Date().toLocaleString()}</InfoValue>
          </UserInfoItem>
        </UserInfoGrid>
      </UserInfoCard>

      {/* Risk Summary */}
      <RiskSummaryCard riskLevel={riskEvaluation.result.level}>
        <RiskHeader riskLevel={riskEvaluation.result.level}>
          <RiskTitle riskLevel={riskEvaluation.result.level}>
            <FiShield />
            Security Evaluation
          </RiskTitle>
          <RiskBadge riskLevel={riskEvaluation.result.level}>
            {riskInfo.title}
          </RiskBadge>
        </RiskHeader>

        <RiskDescription>{riskInfo.description}</RiskDescription>

        <UserInfoGrid>
          <UserInfoItem>
            <InfoLabel>Risk Level</InfoLabel>
            <InfoValue>{riskEvaluation.result.level}</InfoValue>
          </UserInfoItem>
          <UserInfoItem>
            <InfoLabel>Recommended Action</InfoLabel>
            <InfoValue>{riskEvaluation.result.recommendedAction}</InfoValue>
          </UserInfoItem>
          <UserInfoItem>
            <InfoLabel>Policy Used</InfoLabel>
            <InfoValue>{riskEvaluation.riskPolicySet.name}</InfoValue>
          </UserInfoItem>
          <UserInfoItem>
            <InfoLabel>Evaluated At</InfoLabel>
            <InfoValue>{new Date(riskEvaluation.createdAt).toLocaleString()}</InfoValue>
          </UserInfoItem>
        </UserInfoGrid>
      </RiskSummaryCard>

      {/* Token Display */}
      <TokenSection>
        <TokenHeader>
          <TokenTitle>
            <FiInfo />
            OAuth & OIDC Tokens
          </TokenTitle>
          <TokenToggle onClick={handleToggleTokens}>
            {showFullTokens ? <FiEyeOff /> : <FiEye />}
            {showFullTokens ? 'Hide Tokens' : 'Show Tokens'}
          </TokenToggle>
        </TokenHeader>

        <TokenContent>
          {/* Access Token */}
          <TokenType>
            <TypeName>Access Token</TypeName>
            <TypeBadge>Bearer</TypeBadge>
          </TokenType>

          {showFullTokens ? (
            <TokenFull>
              {tokens.accessToken}
              <CopyButton onClick={() => handleCopyToken('access', tokens.accessToken)}>
                {copiedToken === 'access' ? 'Copied!' : <FiCopy />}
              </CopyButton>
            </TokenFull>
          ) : (
            <TokenPreview>
              {formatTokenPreview(tokens.accessToken)}
              <CopyButton onClick={() => handleCopyToken('access', tokens.accessToken)}>
                {copiedToken === 'access' ? 'Copied!' : <FiCopy />}
              </CopyButton>
            </TokenPreview>
          )}

          {/* ID Token */}
          {tokens.idToken && (
            <>
              <TokenType style={{ marginTop: '1.5rem' }}>
                <TypeName>ID Token</TypeName>
                <TypeBadge>JWT</TypeBadge>
              </TokenType>

              {showFullTokens ? (
                <TokenFull>
                  {tokens.idToken}
                  <CopyButton onClick={() => handleCopyToken('id', tokens.idToken)}>
                    {copiedToken === 'id' ? 'Copied!' : <FiCopy />}
                  </CopyButton>
                </TokenFull>
              ) : (
                <TokenPreview>
                  {formatTokenPreview(tokens.idToken)}
                  <CopyButton onClick={() => handleCopyToken('id', tokens.idToken)}>
                    {copiedToken === 'id' ? 'Copied!' : <FiCopy />}
                  </CopyButton>
                </TokenPreview>
              )}
            </>
          )}

          {/* Token Information */}
          <TokenInfo>
            <TokenInfoItem>
              <InfoLabelSmall>Token Type</InfoLabelSmall>
              <InfoValueSmall>{tokens.tokenType}</InfoValueSmall>
            </TokenInfoItem>
            <TokenInfoItem>
              <InfoLabelSmall>Expires In</InfoLabelSmall>
              <InfoValueSmall>{tokens.expiresIn}s ({getTokenExpiryTime(tokens.expiresIn)})</InfoValueSmall>
            </TokenInfoItem>
            <TokenInfoItem>
              <InfoLabelSmall>Scope</InfoLabelSmall>
              <InfoValueSmall>{tokens.scope}</InfoValueSmall>
            </TokenInfoItem>
            {tokens.refreshToken && (
              <TokenInfoItem>
                <InfoLabelSmall>Refresh Token</InfoLabelSmall>
                <InfoValueSmall>Available</InfoValueSmall>
              </TokenInfoItem>
            )}
          </TokenInfo>
        </TokenContent>
      </TokenSection>

      {/* Action Buttons */}
      <ActionButtons>
        <Button onClick={onLogout}>
          <FiLogOut />
          Logout
        </Button>
      </ActionButtons>

      {/* Educational Section */}
      <EducationalSection>
        <EducationalHeader>
          <FiInfo style={{ color: '#3b82f6' }} />
          <EducationalTitle>{educationalContent.title}</EducationalTitle>
        </EducationalHeader>
        
        <EducationalDescription>{educationalContent.description}</EducationalDescription>
        
        <KeyPoints>
          {educationalContent.keyPoints.map((point, index) => (
            <KeyPoint key={index}>
              <KeyPointIcon />
              {point}
            </KeyPoint>
          ))}
        </KeyPoints>
      </EducationalSection>
    </SuccessContainer>
  );
};

export default PortalSuccess;
