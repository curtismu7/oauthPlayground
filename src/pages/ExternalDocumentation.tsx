import React from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiExternalLink, FiBook, FiCode, FiShield, FiGlobe, FiUsers } from 'react-icons/fi';
import PageTitle from '../components/PageTitle';

const DocumentationContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const DocumentationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const DocumentationCard = styled(Card)`
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeaderStyled = styled(CardHeader)`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 1.2rem;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 1rem 0;
  color: #666;
  line-height: 1.6;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LinkItem = styled.li`
  margin-bottom: 0.75rem;
`;

const ExternalLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  text-decoration: none;
  color: #495057;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: #e9ecef;
    border-color: #667eea;
    color: #667eea;
    transform: translateX(4px);
  }
`;

const LinkTitle = styled.span`
  flex: 1;
  font-weight: 600;
`;

const LinkDescription = styled.span`
  font-size: 0.85rem;
  color: #6c757d;
  margin-left: auto;
`;

const ExternalIcon = styled(FiExternalLink)`
  font-size: 0.9rem;
  opacity: 0.7;
`;

const CategoryTitle = styled.h2`
  color: #333;
  margin: 3rem 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
`;

const Introduction = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border-left: 4px solid #667eea;
`;

const IntroductionTitle = styled.h2`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.4rem;
`;

const IntroductionText = styled.p`
  color: #666;
  margin: 0;
  line-height: 1.6;
  font-size: 1.1rem;
`;

const ExternalDocumentation: React.FC = () => {
  const documentationLinks = {
    pingIdentity: [
      {
        title: 'OpenID Connect Overview',
        url: 'https://www.pingidentity.com/en/openid-connect.html',
        description: 'Comprehensive OIDC guide',
        category: 'OIDC Fundamentals'
      },
      {
        title: 'PingOne API Documentation',
        url: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/',
        description: 'Official API reference',
        category: 'API Reference'
      },
      {
        title: 'PingOne Platform Documentation',
        url: 'https://docs.pingidentity.com/bundle/pingone-platform/page/',
        description: 'Platform setup and configuration',
        category: 'Platform Setup'
      }
    ],
    oidcSpecs: [
      {
        title: 'OpenID Connect Core Specification',
        url: 'https://openid.net/specs/openid-connect-core-1_0.html',
        description: 'Official OIDC specification',
        category: 'OIDC Standards'
      },
      {
        title: 'OAuth 2.0 Authorization Framework',
        url: 'https://tools.ietf.org/html/rfc6749',
        description: 'OAuth 2.0 RFC specification',
        category: 'OAuth Standards'
      },
      {
        title: 'JWT (JSON Web Token) Specification',
        url: 'https://tools.ietf.org/html/rfc7519',
        description: 'JWT token format specification',
        category: 'Token Standards'
      }
    ],
    security: [
      {
        title: 'OAuth 2.0 Security Best Practices',
        url: 'https://tools.ietf.org/html/draft-ietf-oauth-security-topics',
        description: 'Security recommendations',
        category: 'Security Guidelines'
      },
      {
        title: 'PKCE (Proof Key for Code Exchange)',
        url: 'https://tools.ietf.org/html/rfc7636',
        description: 'PKCE extension specification',
        category: 'Security Extensions'
      },
      {
        title: 'OIDC Security Considerations',
        url: 'https://openid.net/specs/openid-connect-core-1_0.html#Security',
        description: 'OIDC security best practices',
        category: 'Security Guidelines'
      }
    ],
    developer: [
      {
        title: 'OIDC Developer Guide',
        url: 'https://developers.google.com/identity/protocols/oauth2/openid-connect',
        description: 'Google OIDC implementation guide',
        category: 'Implementation Guides'
      },
      {
        title: 'Auth0 OIDC Documentation',
        url: 'https://auth0.com/docs/protocols/oidc',
        description: 'Auth0 OIDC implementation',
        category: 'Implementation Guides'
      },
      {
        title: 'Microsoft Identity Platform',
        url: 'https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc',
        description: 'Microsoft OIDC implementation',
        category: 'Implementation Guides'
      }
    ]
  };

  const renderDocumentationSection = (title: string, links: any[], icon: React.ReactNode) => (
    <DocumentationCard>
      <CardHeaderStyled>
        <IconWrapper>{icon}</IconWrapper>
        <CardTitle>{title}</CardTitle>
      </CardHeaderStyled>
      <CardBody>
        <LinkList>
          {links.map((link, index) => (
            <LinkItem key={index}>
              <ExternalLink href={link.url} target="_blank" rel="noopener noreferrer">
                <LinkTitle>{link.title}</LinkTitle>
                <LinkDescription>{link.description}</LinkDescription>
                <ExternalIcon />
              </ExternalLink>
            </LinkItem>
          ))}
        </LinkList>
      </CardBody>
    </DocumentationCard>
  );

  return (
    <DocumentationContainer>
      <PageTitle 
        title="External Documentation" 
        subtitle="Comprehensive resources for OAuth 2.0, OpenID Connect, and PingOne"
        backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      />
      
      <Introduction>
        <IntroductionTitle>📚 Comprehensive OAuth & OIDC Resources</IntroductionTitle>
        <IntroductionText>
          Access official documentation, specifications, and implementation guides for OAuth 2.0, 
          OpenID Connect, and PingOne platform. These resources provide in-depth information 
          about authentication flows, security best practices, and platform configuration.
        </IntroductionText>
      </Introduction>

      <CategoryTitle>🏢 Ping Identity & PingOne Resources</CategoryTitle>
      <DocumentationGrid>
        {renderDocumentationSection(
          'Ping Identity Documentation',
          documentationLinks.pingIdentity,
          <FiShield />
        )}
      </DocumentationGrid>

      <CategoryTitle>📋 Official Specifications & Standards</CategoryTitle>
      <DocumentationGrid>
        {renderDocumentationSection(
          'OIDC & OAuth Specifications',
          documentationLinks.oidcSpecs,
          <FiBook />
        )}
      </DocumentationGrid>

      <CategoryTitle>🔒 Security & Best Practices</CategoryTitle>
      <DocumentationGrid>
        {renderDocumentationSection(
          'Security Guidelines',
          documentationLinks.security,
          <FiShield />
        )}
      </DocumentationGrid>

      <CategoryTitle>👨‍💻 Developer Implementation Guides</CategoryTitle>
      <DocumentationGrid>
        {renderDocumentationSection(
          'Implementation Resources',
          documentationLinks.developer,
          <FiCode />
        )}
      </DocumentationGrid>
    </DocumentationContainer>
  );
};

export default ExternalDocumentation;

