import React from 'react';
import styled from 'styled-components';
import { FiCheck, FiAlertTriangle, FiX, FiShield, FiInfo } from 'react-icons/fi';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';

const ScorecardContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
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
  margin: 0;
  padding-left: 1.5rem;
  color: #15803d;
  font-size: 0.75rem;
  line-height: 1.5;
`;

interface SecurityScorecardProps {
  flowType: FlowType;
  specVersion: SpecVersion;
  credentials?: {
    usePKCE?: boolean;
    enableRefreshToken?: boolean;
    scopes?: string[];
  };
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
}) => {
  // Debug: Log when props change
  React.useEffect(() => {
    console.log('[SecurityScorecard] Props changed:', { flowType, specVersion, credentials });
  }, [flowType, specVersion, credentials]);

  const getSecurityChecks = (): SecurityCheck[] => {
    const checks: SecurityCheck[] = [];
    
    // PKCE Requirements
    const pkceItems = [
      {
        name: 'PKCE Required',
        status: specVersion === 'oauth2.1' ? 'pass' as const : 'pass' as const,
        description: specVersion === 'oauth2.1' 
          ? 'OAuth 2.1 requires PKCE for all flows'
          : 'PKCE is recommended for enhanced security'
      },
      {
        name: 'PKCE Method',
        status: credentials?.usePKCE ? 'pass' as const : 'warning' as const,
        description: credentials?.usePKCE 
          ? 'PKCE is enabled for this flow'
          : 'Consider enabling PKCE for better security'
      },
    ];
    
    if (flowType === 'oauth-authz' || flowType === 'implicit') {
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
      <ScorecardHeader>
        <ScorecardTitle>
          <FiShield style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
          <ScorecardHeading>Security Scorecard</ScorecardHeading>
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
              {check.items.map((item, itemIndex) => (
                <SecurityItem key={itemIndex} $status={item.status}>
                  {getStatusIcon(item.status)}
                  <span>
                    <strong>{item.name}:</strong> {item.description}
                  </span>
                </SecurityItem>
              ))}
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
    </ScorecardContainer>
  );
};

export default SecurityScorecard;
