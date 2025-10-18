// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowResults.tsx
// V7.1 Flow Results - Display tokens, user info, and flow results

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronRight, FiCopy, FiEye, FiEyeOff, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import { UI_CONSTANTS } from '../constants/uiConstants';
import type { TokenResponse, UserInfo } from '../types/flowTypes';

interface FlowResultsProps {
  tokens: TokenResponse | null;
  userInfo: UserInfo | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefreshTokens?: () => void;
  onClearResults?: () => void;
  showTokenDetails?: boolean;
  showUserInfo?: boolean;
}

const ResultsContainer = styled.div`
  background: ${UI_CONSTANTS.SECTION.BACKGROUND};
  border: ${UI_CONSTANTS.SECTION.BORDER};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  padding: ${UI_CONSTANTS.SECTION.PADDING};
  margin-bottom: ${UI_CONSTANTS.SECTION.MARGIN_BOTTOM};
`;

const SectionHeader = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${UI_CONSTANTS.SPACING.LG};
  background: ${UI_CONSTANTS.COLORS.GRAY_50};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  &:hover {
    background: ${UI_CONSTANTS.COLORS.GRAY_100};
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.MD};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG};
  font-weight: ${UI_CONSTANTS.SECTION.HEADER_FONT_WEIGHT};
  color: ${UI_CONSTANTS.COLORS.GRAY_900};
`;

const CollapseIcon = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
  transition: transform ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  svg {
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(90deg)')};
  }
`;

const SectionContent = styled.div<{ $collapsed: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  padding: ${UI_CONSTANTS.SPACING.LG} 0;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${UI_CONSTANTS.SPACING.LG};
  margin-bottom: ${UI_CONSTANTS.SPACING.LG};
`;

const TokenCard = styled.div<{ $type: 'access' | 'id' | 'refresh' }>`
  background: ${props => {
    switch (props.$type) {
      case 'access': return UI_CONSTANTS.STATUS.SUCCESS_BACKGROUND;
      case 'id': return UI_CONSTANTS.STATUS.INFO_BACKGROUND;
      case 'refresh': return UI_CONSTANTS.COLORS.GRAY_50;
      default: return UI_CONSTANTS.COLORS.WHITE;
    }
  }};
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'access': return UI_CONSTANTS.STATUS.SUCCESS_BORDER;
      case 'id': return UI_CONSTANTS.STATUS.INFO_BORDER;
      case 'refresh': return UI_CONSTANTS.COLORS.GRAY_200;
      default: return UI_CONSTANTS.COLORS.GRAY_200;
    }
  }};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  padding: ${UI_CONSTANTS.SPACING.LG};
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${UI_CONSTANTS.SPACING.MD};
`;

const TokenTitle = styled.div<{ $type: 'access' | 'id' | 'refresh' }>`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD};
  color: ${props => {
    switch (props.$type) {
      case 'access': return UI_CONSTANTS.STATUS.SUCCESS_COLOR;
      case 'id': return UI_CONSTANTS.STATUS.INFO_COLOR;
      case 'refresh': return UI_CONSTANTS.COLORS.GRAY_700;
      default: return UI_CONSTANTS.COLORS.GRAY_900;
    }
  }};
`;

const TokenActions = styled.div`
  display: flex;
  gap: ${UI_CONSTANTS.SPACING.SM};
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.BLUE_600};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
        `;
      case 'secondary':
        return `
          background: ${UI_CONSTANTS.COLORS.GRAY_200};
          color: ${UI_CONSTANTS.COLORS.GRAY_600};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.GRAY_300};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
        `;
      default:
        return '';
    }
  }}
`;

const TokenValue = styled.div<{ $isMasked: boolean }>`
  font-family: monospace;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.COLORS.GRAY_700};
  background: ${UI_CONSTANTS.COLORS.GRAY_100};
  padding: ${UI_CONSTANTS.SPACING.MD};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  word-break: break-all;
  line-height: ${UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.RELAXED};
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({ $isMasked }) => $isMasked && `
    filter: blur(4px);
    user-select: none;
  `}
`;

const TokenInfo = styled.div`
  margin-top: ${UI_CONSTANTS.SPACING.MD};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
`;

const UserInfoCard = styled.div`
  background: ${UI_CONSTANTS.STATUS.INFO_BACKGROUND};
  border: 1px solid ${UI_CONSTANTS.STATUS.INFO_BORDER};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  padding: ${UI_CONSTANTS.SPACING.LG};
  margin-bottom: ${UI_CONSTANTS.SPACING.LG};
`;

const UserInfoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.MD};
  margin-bottom: ${UI_CONSTANTS.SPACING.MD};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD};
  color: ${UI_CONSTANTS.STATUS.INFO_COLOR};
`;

const UserInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${UI_CONSTANTS.SPACING.MD};
`;

const UserInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.XS};
`;

const UserInfoLabel = styled.div`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM};
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
`;

const UserInfoValue = styled.div`
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.COLORS.GRAY-900};
  font-family: monospace;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${UI_CONSTANTS.SPACING.MD};
  margin-top: ${UI_CONSTANTS.SPACING.LG};
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
  padding: ${UI_CONSTANTS.SPACING.MD} ${UI_CONSTANTS.SPACING.LG};
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_WEIGHT};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
          box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_SHADOW};
          
          &:hover {
            box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_HOVER_SHADOW};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
        `;
      case 'secondary':
        return `
          background: ${UI_CONSTANTS.BUTTON.SECONDARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.SECONDARY_COLOR};
          border: ${UI_CONSTANTS.BUTTON.SECONDARY_BORDER};
          
          &:hover {
            background: ${UI_CONSTANTS.BUTTON.SECONDARY_HOVER_BACKGROUND};
          }
        `;
      case 'danger':
        return `
          background: ${UI_CONSTANTS.STATUS.ERROR_COLOR};
          color: ${UI_CONSTANTS.COLORS.WHITE};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.GRAY_700};
          }
        `;
      default:
        return '';
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${UI_CONSTANTS.SPACING.XL};
  color: ${UI_CONSTANTS.COLORS.GRAY_500};
  font-style: italic;
`;

export const FlowResults: React.FC<FlowResultsProps> = ({
  tokens,
  userInfo,
  isCollapsed = false,
  onToggleCollapse,
  onRefreshTokens,
  onClearResults,
  showTokenDetails = true,
  showUserInfo = true,
}) => {
  const [maskedTokens, setMaskedTokens] = useState<Record<string, boolean>>({
    access_token: true,
    id_token: true,
    refresh_token: true,
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const toggleTokenMask = (tokenType: string) => {
    setMaskedTokens(prev => ({
      ...prev,
      [tokenType]: !prev[tokenType],
    }));
  };

  const copyToken = async (token: string, tokenType: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(tokenType);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const formatTokenInfo = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        return {
          header,
          payload,
          expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown',
        };
      }
    } catch (error) {
      // Not a JWT token
    }
    return null;
  };

  const hasResults = tokens || userInfo;

  if (!hasResults) {
    return (
      <ResultsContainer>
        <SectionHeader $collapsed={isCollapsed} onClick={onToggleCollapse}>
          <SectionTitle>
            <CollapseIcon $collapsed={isCollapsed}>
              <FiChevronRight />
            </CollapseIcon>
            <span>Flow Results</span>
          </SectionTitle>
        </SectionHeader>
        
        <SectionContent $collapsed={isCollapsed}>
          <EmptyState>
            No results yet. Complete the flow to see tokens and user information.
          </EmptyState>
        </SectionContent>
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer>
      <SectionHeader $collapsed={isCollapsed} onClick={onToggleCollapse}>
        <SectionTitle>
          <CollapseIcon $collapsed={isCollapsed}>
            <FiChevronRight />
          </CollapseIcon>
          <span>Flow Results</span>
        </SectionTitle>
      </SectionHeader>

      <SectionContent $collapsed={isCollapsed}>
        {showTokenDetails && tokens && (
          <TokenGrid>
            {tokens.access_token && (
              <TokenCard $type="access">
                <TokenHeader>
                  <TokenTitle $type="access">Access Token</TokenTitle>
                  <TokenActions>
                    <ActionButton
                      $variant="secondary"
                      onClick={() => toggleTokenMask('access_token')}
                      title={maskedTokens.access_token ? 'Show token' : 'Hide token'}
                    >
                      {maskedTokens.access_token ? <FiEye /> : <FiEyeOff />}
                    </ActionButton>
                    <ActionButton
                      $variant="primary"
                      onClick={() => copyToken(tokens.access_token!, 'access_token')}
                      title="Copy token"
                    >
                      {copiedToken === 'access_token' ? <FiCheck /> : <FiCopy />}
                    </ActionButton>
                  </TokenActions>
                </TokenHeader>
                <TokenValue $isMasked={maskedTokens.access_token}>
                  {maskedTokens.access_token ? '••••••••••••••••' : tokens.access_token}
                </TokenValue>
                <TokenInfo>
                  {formatTokenInfo(tokens.access_token) && (
                    <div>
                      <div>Expires: {formatTokenInfo(tokens.access_token)?.expires}</div>
                      <div>Type: {tokens.token_type || 'Bearer'}</div>
                    </div>
                  )}
                </TokenInfo>
              </TokenCard>
            )}

            {tokens.id_token && (
              <TokenCard $type="id">
                <TokenHeader>
                  <TokenTitle $type="id">ID Token</TokenTitle>
                  <TokenActions>
                    <ActionButton
                      $variant="secondary"
                      onClick={() => toggleTokenMask('id_token')}
                      title={maskedTokens.id_token ? 'Show token' : 'Hide token'}
                    >
                      {maskedTokens.id_token ? <FiEye /> : <FiEyeOff />}
                    </ActionButton>
                    <ActionButton
                      $variant="primary"
                      onClick={() => copyToken(tokens.id_token!, 'id_token')}
                      title="Copy token"
                    >
                      {copiedToken === 'id_token' ? <FiCheck /> : <FiCopy />}
                    </ActionButton>
                  </TokenActions>
                </TokenHeader>
                <TokenValue $isMasked={maskedTokens.id_token}>
                  {maskedTokens.id_token ? '••••••••••••••••' : tokens.id_token}
                </TokenValue>
                <TokenInfo>
                  {formatTokenInfo(tokens.id_token) && (
                    <div>
                      <div>Expires: {formatTokenInfo(tokens.id_token)?.expires}</div>
                      <div>Subject: {formatTokenInfo(tokens.id_token)?.payload.sub}</div>
                    </div>
                  )}
                </TokenInfo>
              </TokenCard>
            )}

            {tokens.refresh_token && (
              <TokenCard $type="refresh">
                <TokenHeader>
                  <TokenTitle $type="refresh">Refresh Token</TokenTitle>
                  <TokenActions>
                    <ActionButton
                      $variant="secondary"
                      onClick={() => toggleTokenMask('refresh_token')}
                      title={maskedTokens.refresh_token ? 'Show token' : 'Hide token'}
                    >
                      {maskedTokens.refresh_token ? <FiEye /> : <FiEyeOff />}
                    </ActionButton>
                    <ActionButton
                      $variant="primary"
                      onClick={() => copyToken(tokens.refresh_token!, 'refresh_token')}
                      title="Copy token"
                    >
                      {copiedToken === 'refresh_token' ? <FiCheck /> : <FiCopy />}
                    </ActionButton>
                  </TokenActions>
                </TokenHeader>
                <TokenValue $isMasked={maskedTokens.refresh_token}>
                  {maskedTokens.refresh_token ? '••••••••••••••••' : tokens.refresh_token}
                </TokenValue>
                <TokenInfo>
                  <div>Use to refresh access token</div>
                </TokenInfo>
              </TokenCard>
            )}
          </TokenGrid>
        )}

        {showUserInfo && userInfo && (
          <UserInfoCard>
            <UserInfoHeader>
              <span>👤 User Information</span>
            </UserInfoHeader>
            <UserInfoGrid>
              {Object.entries(userInfo).map(([key, value]) => (
                <UserInfoItem key={key}>
                  <UserInfoLabel>{key}</UserInfoLabel>
                  <UserInfoValue>{String(value)}</UserInfoValue>
                </UserInfoItem>
              ))}
            </UserInfoGrid>
          </UserInfoCard>
        )}

        <ButtonGroup>
          {onRefreshTokens && (
            <Button $variant="primary" onClick={onRefreshTokens}>
              <FiRefreshCw />
              Refresh Tokens
            </Button>
          )}
          {onClearResults && (
            <Button $variant="danger" onClick={onClearResults}>
              Clear Results
            </Button>
          )}
        </ButtonGroup>
      </SectionContent>
    </ResultsContainer>
  );
};

export default FlowResults;
