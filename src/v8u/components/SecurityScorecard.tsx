import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiAlertTriangle, FiChevronDown, FiShield, FiX, FiInfo } from 'react-icons/fi';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';

const ScorecardContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  margin: 1rem 0;
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: 3px solid transparent;
	border-radius: 1rem;
	cursor: pointer;
	font-size: 1.2rem;
	font-weight: 700;
	color: #14532d;
	transition: all 0.3s ease;
	position: relative;
	box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
		border-color: #86efac;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2);
	}

	&:active {
		transform: translateY(0);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border: 3px solid #3b82f6;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: all 0.3s ease;
	cursor: pointer;
	color: #3b82f6;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

	&:hover {
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-color: #2563eb;
		color: #2563eb;
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
	}

	svg {
		width: 24px;
		height: 24px;
		stroke-width: 3px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const ScorecardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const ScorecardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ScorecardHeading = styled.h3`
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const ScoreOverview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ScoreCircle = styled.div<{ $score: number; $grade: 'A' | 'B' | 'C' | 'D' | 'F' }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
  background: ${props => {
    switch (props.$grade) {
      case 'A': return '#10b981';
      case 'B': return '#3b82f6';
      case 'C': return '#f59e0b';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const ScoreText = styled.div`
  display: flex;
  flex-direction: column;
`;

const ScoreValue = styled.div<{ $grade: 'A' | 'B' | 'C' | 'D' | 'F' }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => {
    switch (props.$grade) {
      case 'A': return '#059669';
      case 'B': return '#1d4ed8';
      case 'C': return '#d97706';
      case 'D': return '#ea580c';
      case 'F': return '#dc2626';
      default: return '#4b5563';
    }
  }};
`;

const ScoreLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const SecurityCategories = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const SecurityCategory = styled.div<{ $status: 'pass' | 'warning' | 'fail' }>`
  background: white;
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pass': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'fail': return '#ef4444';
      default: return '#e2e8f0';
    }
  }};
  border-radius: 8px;
  padding: 1rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const CategoryTitle = styled.h4<{ $status: 'pass' | 'warning' | 'fail' }>`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  color: ${props => {
    switch (props.$status) {
      case 'pass': return '#059669';
      case 'warning': return '#d97706';
      case 'fail': return '#dc2626';
      default: return '#1e293b';
    }
  }};
`;

const CategoryItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SecurityItem = styled.div<{ $status: 'pass' | 'warning' | 'fail' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: ${props => {
    switch (props.$status) {
      case 'pass': return '#059669';
      case 'warning': return '#d97706';
      case 'fail': return '#dc2626';
      default: return '#64748b';
    }
  }};
`;

const Recommendations = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
`;

const RecommendationsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const RecommendationsTitle = styled.h4`
  color: #166534;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
`;

const RecommendationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RecommendationItem = styled.li`
  padding: 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActionButton = styled.button<{ $enabled?: boolean }>`
  padding: 0.25rem 0.75rem;
  border: 1px solid ${props => props.$enabled === true ? '#10b981' : '#6b7280'};
  border-radius: 0.375rem;
  background: ${props => props.$enabled === true ? '#10b981' : '#f3f4f6'};
  color: ${props => props.$enabled === true ? 'white' : '#374151'};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;

  &:hover {
    background: ${props => props.$enabled === true ? '#059669' : '#e5e7eb'};
    border-color: ${props => props.$enabled === true ? '#059669' : '#9ca3af'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecurityItemWithAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  
  > span {
    flex: 1;
  }
`;

interface SecurityScorecardProps {
  flowType: FlowType;
  specVersion: SpecVersion;
  credentials?: {
    usePKCE?: boolean;
    enableRefreshToken?: boolean;
    scopes?: string[];
  };
  onTogglePKCE?: (enabled: boolean) => void;
  onToggleRefreshToken?: (enabled: boolean) => void;
  onToggleScopes?: (scopes: string[]) => void;
}

interface SecurityCheck {
  category: string;
  items: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    description: string;
  }[];
}

export const SecurityScorecard: React.FC<SecurityScorecardProps> = ({
  flowType,
  specVersion,
  credentials,
  onTogglePKCE,
  onToggleRefreshToken,
  onToggleScopes,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Debug: Log when props change
  React.useEffect(() => {
    console.log('[SecurityScorecard] Props changed:', { flowType, specVersion, credentials });
  }, [flowType, specVersion, credentials]);

  const getSecurityChecks = (): SecurityCheck[] => {
    const checks: SecurityCheck[] = [];
    
    // PKCE Requirements - Only applicable to authorization code and hybrid flows
    const pkceItems = [
      {
        name: 'PKCE Required',
        status: specVersion === 'oauth2.1' && (flowType === 'oauth-authz' || flowType === 'hybrid') ? 'pass' as const : 
               (flowType === 'oauth-authz' || flowType === 'hybrid') ? 'pass' as const : 'pass' as const,
        description: specVersion === 'oauth2.1' && (flowType === 'oauth-authz' || flowType === 'hybrid')
          ? 'OAuth 2.1 requires PKCE for authorization code and hybrid flows'
          : (flowType === 'oauth-authz' || flowType === 'hybrid')
          ? 'PKCE is recommended for enhanced security'
          : flowType === 'implicit'
          ? 'PKCE is not applicable to implicit flow'
          : 'PKCE is not applicable to this flow type'
      },
      {
        name: 'PKCE Method',
        status: (flowType === 'implicit' || flowType === 'client-credentials' || flowType === 'device-code') ? 'pass' as const :
               (credentials?.usePKCE && (flowType === 'oauth-authz' || flowType === 'hybrid')) ? 'pass' as const : 
               (flowType === 'oauth-authz' || flowType === 'hybrid') ? 'warning' as const : 'pass' as const,
        description: (flowType === 'implicit' || flowType === 'client-credentials' || flowType === 'device-code')
          ? 'PKCE is not applicable to this flow type'
          : (credentials?.usePKCE && (flowType === 'oauth-authz' || flowType === 'hybrid'))
          ? 'PKCE is enabled for this flow'
          : (flowType === 'oauth-authz' || flowType === 'hybrid')
          ? 'Consider enabling PKCE for better security'
          : 'PKCE is not applicable to this flow type'
      },
    ];
    
    if (flowType === 'oauth-authz' || flowType === 'hybrid' || flowType === 'implicit') {
      checks.push({ category: 'PKCE Security', items: pkceItems });
    }

    // Flow Security
    const flowSecurityItems = [
      {
        name: 'Flow Type Security',
        status: flowType === 'implicit' && specVersion === 'oauth2.1' 
          ? 'fail' as const 
          : flowType === 'implicit' 
            ? 'warning' as const 
            : 'pass' as const,
        description: flowType === 'implicit' 
          ? 'Implicit flow exposes tokens in URL - use with caution'
          : flowType === 'oauth-authz'
            ? 'Authorization code flow is secure'
            : 'Flow type is appropriate for use case'
      },
      {
        name: 'HTTPS Enforcement',
        status: specVersion === 'oauth2.1' ? 'pass' as const : 'warning' as const,
        description: specVersion === 'oauth2.1'
          ? 'OAuth 2.1 requires HTTPS'
          : 'HTTPS is strongly recommended'
      },
    ];
    
    checks.push({ category: 'Flow Security', items: flowSecurityItems });

    // OIDC Requirements
    if (specVersion === 'oidc') {
      const oidcItems = [
        {
          name: 'OpenID Scope',
          status: credentials?.scopes?.includes('openid') ? 'pass' as const : 'fail' as const,
          description: credentials?.scopes?.includes('openid')
            ? 'OpenID scope is present for authentication'
            : 'OpenID scope is required for OIDC flows'
        },
        {
          name: 'ID Token Support',
          status: 'pass' as const,
          description: 'Flow supports ID tokens for user authentication'
        },
      ];
      
      checks.push({ category: 'OIDC Compliance', items: oidcItems });
    }

    // Token Security
    const tokenItems = [
      {
        name: 'Refresh Token Usage',
        status: credentials?.enableRefreshToken ? 'pass' as const : 'warning' as const,
        description: credentials?.enableRefreshToken
          ? 'Refresh tokens are enabled for extended sessions'
          : 'Consider refresh tokens for better UX'
      },
      {
        name: 'Token Storage',
        status: 'warning' as const,
        description: 'Ensure tokens are stored securely (httpOnly cookies, secure storage)'
      },
    ];
    
    checks.push({ category: 'Token Security', items: tokenItems });

    return checks;
  };

  const calculateScore = (): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } => {
    const checks = getSecurityChecks();
    const allItems = checks.flatMap(check => check.items);
    const totalItems = allItems.length;
    
    if (totalItems === 0) return { score: 0, grade: 'F' };
    
    const passCount = allItems.filter(item => item.status === 'pass').length;
    const warningCount = allItems.filter(item => item.status === 'warning').length;
    const failCount = allItems.filter(item => item.status === 'fail').length;
    
    // Score calculation: Pass = 100%, Warning = 70%, Fail = 0%
    const score = Math.round((passCount * 100 + warningCount * 70) / totalItems);
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';
    
    // Debug: Log score calculation
    console.log('[SecurityScorecard] Score calculated:', { 
      flowType, 
      specVersion, 
      totalItems, 
      passCount, 
      warningCount, 
      failCount, 
      score, 
      grade,
      checks: checks.map(c => ({ category: c.category, items: c.items.length }))
    });
    
    return { score, grade };
  };

  const getRecommendations = (): string[] => {
    const recommendations: string[] = [];
    const checks = getSecurityChecks();
    
    checks.forEach(check => {
      check.items.forEach(item => {
        if (item.status === 'fail') {
          recommendations.push(`Fix: ${item.description}`);
        } else if (item.status === 'warning') {
          recommendations.push(`Consider: ${item.description}`);
        }
      });
    });
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  };

  const { score, grade } = calculateScore();
  const securityChecks = getSecurityChecks();
  const recommendations = getRecommendations();

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass': return <FiCheck />;
      case 'warning': return <FiAlertTriangle />;
      case 'fail': return <FiX />;
    }
  };

  return (
    <ScorecardContainer>
      <CollapsibleHeaderButton
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
      >
        <CollapsibleTitle>
          <FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
          Security Scorecard
        </CollapsibleTitle>
        <CollapsibleToggleIcon $collapsed={isCollapsed}>
          <FiChevronDown />
        </CollapsibleToggleIcon>
      </CollapsibleHeaderButton>
      
      {!isCollapsed && (
        <CollapsibleContent>
          <ScorecardHeader>
            <ScorecardTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
                <ScorecardHeading>Security Scorecard</ScorecardHeading>
              </div>
            </ScorecardTitle>
            
            <ScoreOverview>
              <ScoreCircle $score={score} $grade={grade}>
                {grade}
              </ScoreCircle>
              <ScoreText>
                <ScoreValue $grade={grade}>{score}%</ScoreValue>
                <ScoreLabel>Security Score</ScoreLabel>
              </ScoreText>
            </ScoreOverview>
          </ScorecardHeader>

          <SecurityCategories>
            {securityChecks.map((check, index) => (
              <SecurityCategory key={index} $status={check.items.some(item => item.status === 'fail') ? 'fail' : check.items.some(item => item.status === 'warning') ? 'warning' : 'pass'}>
                <CategoryHeader>
                  {getStatusIcon(check.items.some(item => item.status === 'fail') ? 'fail' : check.items.some(item => item.status === 'warning') ? 'warning' : 'pass')}
                  <CategoryTitle $status={check.items.some(item => item.status === 'fail') ? 'fail' : check.items.some(item => item.status === 'warning') ? 'warning' : 'pass'}>
                    {check.category}
                  </CategoryTitle>
                </CategoryHeader>
                <CategoryItems>
                  {check.items.map((item, itemIndex) => {
                    // Determine if this item should have an action button
                    const shouldShowPKCEButton = item.name === 'PKCE Method' && 
                      (flowType === 'oauth-authz' || flowType === 'hybrid') && 
                      onTogglePKCE;
                    
                    const shouldShowRefreshTokenButton = item.name === 'Refresh Token Usage' && 
                      onToggleRefreshToken;

                    if (shouldShowPKCEButton) {
                      return (
                        <SecurityItemWithAction key={itemIndex}>
                          <span>
                            {getStatusIcon(item.status)}
                            <strong>{item.name}:</strong> {item.description}
                          </span>
                          <ActionButton 
                            $enabled={!!credentials?.usePKCE}
                            onClick={() => onTogglePKCE?.(!credentials?.usePKCE)}
                          >
                            {credentials?.usePKCE ? 'Disable' : 'Enable'} PKCE
                          </ActionButton>
                        </SecurityItemWithAction>
                      );
                    }

                    if (shouldShowRefreshTokenButton) {
                      return (
                        <SecurityItemWithAction key={itemIndex}>
                          <span>
                            {getStatusIcon(item.status)}
                            <strong>{item.name}:</strong> {item.description}
                          </span>
                          <ActionButton 
                            $enabled={!!credentials?.enableRefreshToken}
                            onClick={() => onToggleRefreshToken?.(!credentials?.enableRefreshToken)}
                          >
                            {credentials?.enableRefreshToken ? 'Disable' : 'Enable'} Refresh Token
                          </ActionButton>
                        </SecurityItemWithAction>
                      );
                    }

                    return (
                      <SecurityItem key={itemIndex} $status={item.status}>
                        {getStatusIcon(item.status)}
                        <span>
                          <strong>{item.name}:</strong> {item.description}
                        </span>
                      </SecurityItem>
                    );
                  })}
                </CategoryItems>
              </SecurityCategory>
            ))}
          </SecurityCategories>

          {recommendations.length > 0 && (
            <Recommendations>
              <RecommendationsHeader>
                <FiInfo style={{ color: '#166534' }} />
                <RecommendationsTitle>Security Recommendations</RecommendationsTitle>
              </RecommendationsHeader>
              <RecommendationList>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </RecommendationList>
            </Recommendations>
          )}

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <small style={{ color: '#64748b' }}>
              🔒 Security score based on OAuth 2.0/2.1 and OpenID Connect best practices
            </small>
          </div>
        </CollapsibleContent>
      )}
    </ScorecardContainer>
  );
};

export default SecurityScorecard;
