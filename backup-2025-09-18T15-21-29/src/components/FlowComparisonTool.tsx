 
import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from './Card';
import { Link } from 'react-router-dom';

interface FlowComparison {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  security: 'high' | 'medium' | 'low';
  complexity: 'low' | 'medium' | 'high';
  implementationTime: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  route: string;
  recommended: boolean;
}

const ComparisonContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const FlowSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const FlowOption = styled.button<{ $selected: boolean; $added: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({ $selected, $added, theme }) => 
    $added ? theme.colors.success : 
    $selected ? theme.colors.primary : theme.colors.gray300};
  border-radius: 0.5rem;
  background-color: ${({ $selected, $added, theme }) => 
    $added ? `${theme.colors.success}10` : 
    $selected ? `${theme.colors.primary}10` : 'white'};
  color: ${({ $selected, $added, theme }) => 
    $added ? theme.colors.success : 
    $selected ? theme.colors.primary : theme.colors.gray700};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}10;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ComparisonGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ComparisonCard = styled(Card)`
  border: 2px solid ${({ theme }) => theme.colors.gray200};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FlowHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  
  .flow-icon {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  .flow-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  .flow-description {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const ComparisonSection = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const MetricItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  
  .metric-label {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray600};
    margin-bottom: 0.25rem;
  }
  
  .metric-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const SecurityBadge = styled.span<{ $level: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  ${({ $level }) => {
    switch ($level) {
      case 'high':
        return `
          background-color: #dcfce7;
          color: #166534;
        `;
      case 'medium':
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case 'low':
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const ComplexityBadge = styled.span<{ $level: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  ${({ $level }) => {
    switch ($level) {
      case 'low':
        return `
          background-color: #dcfce7;
          color: #166534;
        `;
      case 'medium':
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case 'high':
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const ProsConsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    line-height: 1.4;
    
    .pros-icon {
      color: ${({ theme }) => theme.colors.success};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
    
    .cons-icon {
      color: ${({ theme }) => theme.colors.error};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`;

const UseCasesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .use-case {
    padding: 0.25rem 0.75rem;
    background-color: ${({ theme }) => theme.colors.primary}10;
    color: ${({ theme }) => theme.colors.primary};
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.gray500};
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const availableFlows: FlowComparison[] = [
  {
    id: 'authorization-code',
    title: 'Authorization Code',
    description: 'Most secure flow for web applications with backend',
    icon: <FiCode />,
    security: 'high',
    complexity: 'medium',
    implementationTime: '2-4 hours',
    useCases: ['Web Apps', 'Mobile Apps', 'SPAs'],
    pros: [
      'Most secure OAuth flow',
      'Supports refresh tokens',
      'Client secret protection',
      'Industry standard'
    ],
    cons: [
      'Requires secure backend',
      'More complex than implicit',
      'Requires HTTPS'
    ],
    route: '/flows/authorization-code',
    recommended: true
  },
  {
    id: 'pkce',
    title: 'PKCE Flow',
    description: 'Enhanced authorization code flow for public clients',
    icon: <FiShield />,
    security: 'high',
    complexity: 'medium',
    implementationTime: '2-4 hours',
    useCases: ['Mobile Apps', 'SPAs', 'Native Apps'],
    pros: [
      'No client secret needed',
      'Enhanced security for public clients',
      'Supports refresh tokens',
      'Recommended for mobile'
    ],
    cons: [
      'More complex than implicit',
      'Requires code challenge generation',
      'Newer standard'
    ],
    route: '/flows/pkce',
    recommended: true
  },
  {
    id: 'client-credentials',
    title: 'Client Credentials',
    description: 'Machine-to-machine authentication',
    icon: <FiUser />,
    security: 'high',
    complexity: 'low',
    implementationTime: '1-2 hours',
    useCases: ['Server-to-Server', 'Background Processes', 'API Services'],
    pros: [
      'Simple implementation',
      'No user interaction',
      'Perfect for APIs',
      'Fast authentication'
    ],
    cons: [
      'No user context',
      'Limited to machine access',
      'Requires client credentials'
    ],
    route: '/flows/client-credentials',
    recommended: true
  },
  {
    id: 'implicit',
    title: 'Implicit Grant',
    description: 'Simplified flow for client-side apps (deprecated)',
    icon: <FiCode />,
    security: 'low',
    complexity: 'low',
    implementationTime: '1-2 hours',
    useCases: ['Legacy SPAs', 'Client-side only apps'],
    pros: [
      'Simple implementation',
      'No backend required',
      'Direct token access'
    ],
    cons: [
      'Deprecated by OAuth 2.1',
      'No refresh tokens',
      'Tokens in URL fragment',
      'Security vulnerabilities'
    ],
    route: '/flows/implicit',
    recommended: false
  },
  {
    id: 'device-code',
    title: 'Device Code',
    description: 'For devices with limited input capabilities',
    icon: <FiClock />,
    security: 'medium',
    complexity: 'medium',
    implementationTime: '3-5 hours',
    useCases: ['Smart TVs', 'IoT Devices', 'Gaming Consoles'],
    pros: [
      'Works on limited devices',
      'User-friendly for TVs',
      'Secure authentication'
    ],
    cons: [
      'More complex flow',
      'Requires polling',
      'User must have another device'
    ],
    route: '/flows/device-code',
    recommended: false
  },
  {
    id: 'hybrid',
    title: 'Hybrid Flow',
    description: 'Combines authorization code with implicit flow',
    icon: <FiShield />,
    security: 'high',
    complexity: 'high',
    implementationTime: '4-6 hours',
    useCases: ['High Security Apps', 'Enterprise Applications'],
    pros: [
      'Maximum security',
      'Multiple token types',
      'Enterprise ready'
    ],
    cons: [
      'Very complex',
      'Long implementation time',
      'Overkill for most apps'
    ],
    route: '/flows/hybrid',
    recommended: false
  }
];

const FlowComparisonTool: React.FC = () => {
  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);

  const toggleFlow = (flowId: string) => {
    setSelectedFlows(prev => {
      if (prev.includes(flowId)) {
        return prev.filter(id => id !== flowId);
      } else if (prev.length < 4) {
        return [...prev, flowId];
      }
      return prev;
    });
  };

  const getSelectedFlowData = () => {
    return availableFlows.filter(flow => selectedFlows.includes(flow.id));
  };

  const selectedFlowData = getSelectedFlowData();

  return (
    <ComparisonContainer>
      <PageHeader>
        <h1>OAuth Flow Comparison</h1>
        <p>
          Compare different OAuth flows side-by-side to find the best fit for your application. 
          Select up to 4 flows to compare their features, security, and use cases.
        </p>
      </PageHeader>

      <FlowSelector>
        {availableFlows.map((flow) => (
          <FlowOption
            key={flow.id}
            $selected={selectedFlows.includes(flow.id)}
            $added={selectedFlows.includes(flow.id)}
            onClick={() => toggleFlow(flow.id)}
            disabled={!selectedFlows.includes(flow.id) && selectedFlows.length >= 4}
          >
            {selectedFlows.includes(flow.id) ? <FiMinus /> : <FiPlus />}
            {flow.icon}
            {flow.title}
            {flow.recommended && <FiStar />}
          </FlowOption>
        ))}
      </FlowSelector>

      {selectedFlowData.length === 0 ? (
        <EmptyState>
          <div className="empty-icon">🔍</div>
          <h3>Select Flows to Compare</h3>
          <p>
            Choose up to 4 OAuth flows from the options above to see a detailed comparison 
            of their features, security levels, and use cases.
          </p>
        </EmptyState>
      ) : (
        <ComparisonGrid $columns={selectedFlowData.length}>
          {selectedFlowData.map((flow) => (
            <ComparisonCard key={flow.id}>
              <CardHeader>
                <FlowHeader>
                  <div className="flow-icon">{flow.icon}</div>
                  <h3 className="flow-title">{flow.title}</h3>
                  <p className="flow-description">{flow.description}</p>
                  {flow.recommended && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        <FiStar />
                        Recommended
                      </span>
                    </div>
                  )}
                </FlowHeader>
              </CardHeader>
              
              <CardBody>
                <ComparisonSection>
                  <h4>
                    <FiShield />
                    Security & Complexity
                  </h4>
                  <MetricGrid>
                    <MetricItem>
                      <div className="metric-label">Security</div>
                      <div className="metric-value">
                        <SecurityBadge $level={flow.security}>
                          {flow.security}
                        </SecurityBadge>
                      </div>
                    </MetricItem>
                    <MetricItem>
                      <div className="metric-label">Complexity</div>
                      <div className="metric-value">
                        <ComplexityBadge $level={flow.complexity}>
                          {flow.complexity}
                        </ComplexityBadge>
                      </div>
                    </MetricItem>
                    <MetricItem>
                      <div className="metric-label">Time</div>
                      <div className="metric-value">{flow.implementationTime}</div>
                    </MetricItem>
                  </MetricGrid>
                </ComparisonSection>

                <ComparisonSection>
                  <h4>
                    <FiCheckCircle />
                    Pros
                  </h4>
                  <ProsConsList>
                    {flow.pros.map((pro, index) => (
                      <li key={index}>
                        <FiCheckCircle className="pros-icon" />
                        {pro}
                      </li>
                    ))}
                  </ProsConsList>
                </ComparisonSection>

                <ComparisonSection>
                  <h4>
                    <FiXCircle />
                    Cons
                  </h4>
                  <ProsConsList>
                    {flow.cons.map((con, index) => (
                      <li key={index}>
                        <FiXCircle className="cons-icon" />
                        {con}
                      </li>
                    ))}
                  </ProsConsList>
                </ComparisonSection>

                <ComparisonSection>
                  <h4>
                    <FiUser />
                    Use Cases
                  </h4>
                  <UseCasesList>
                    {flow.useCases.map((useCase, index) => (
                      <span key={index} className="use-case">
                        {useCase}
                      </span>
                    ))}
                  </UseCasesList>
                </ComparisonSection>

                <ActionButton to={flow.route}>
                  <FiExternalLink />
                  Try This Flow
                </ActionButton>
              </CardBody>
            </ComparisonCard>
          ))}
        </ComparisonGrid>
      )}
    </ComparisonContainer>
  );
};

export default FlowComparisonTool;
