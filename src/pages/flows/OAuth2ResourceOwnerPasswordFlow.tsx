import type React from "react";
import { useEffect } from "react";
import { FiAlertTriangle, FiInfo, FiLock, FiShield, FiUser, FiX } from "react-icons/fi";
import styled from "styled-components";

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 2rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
`;

const WarningCard = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: #f0f9ff;
  border: 2px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardText = styled.p`
  margin: 0 0 1rem 0;
  line-height: 1.6;
`;

const CardList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  line-height: 1.6;
`;

const CardListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1rem 0;
`;

const SecurityNotice = styled.div`
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 2rem 0;
`;

const SecurityTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SecurityList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #92400e;
`;

const SecurityListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const OAuth2ResourceOwnerPasswordFlow: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <FiLock />
          OAuth 2.0 Resource Owner Password Flow
        </PageTitle>
        <PageSubtitle>
          Direct username/password authentication for trusted applications
        </PageSubtitle>
      </PageHeader>

      <WarningCard>
        <FiAlertTriangle size={24} color="#dc2626" />
        <CardContent>
          <CardTitle style={{ color: "#dc2626" }}>
            <FiAlertTriangle />
            Security Warning
          </CardTitle>
          <CardText style={{ color: "#991b1b" }}>
            The Resource Owner Password Credentials flow is <strong>deprecated</strong> and should
            be avoided in most cases due to significant security risks. This flow requires the
            application to collect and handle user credentials directly.
          </CardText>
          <CardList style={{ color: "#991b1b" }}>
            <CardListItem>Applications must handle passwords securely</CardListItem>
            <CardListItem>No delegation of authentication to authorization server</CardListItem>
            <CardListItem>Phishing attacks become easier</CardListItem>
            <CardListItem>Violates principle of least privilege</CardListItem>
          </CardList>
        </CardContent>
      </WarningCard>

      <InfoCard>
        <FiInfo size={24} color="#0ea5e9" />
        <CardContent>
          <CardTitle style={{ color: "#0c4a6e" }}>
            <FiInfo />
            When to Use (Rare Cases)
          </CardTitle>
          <CardText style={{ color: "#0c4a6e" }}>
            This flow should only be used in very specific, high-trust scenarios:
          </CardText>
          <CardList style={{ color: "#0c4a6e" }}>
            <CardListItem>Legacy system migration where other flows are impossible</CardListItem>
            <CardListItem>Highly trusted first-party applications</CardListItem>
            <CardListItem>Server-to-server communication with shared credentials</CardListItem>
            <CardListItem>
              Internal enterprise applications with strong security controls
            </CardListItem>
          </CardList>
        </CardContent>
      </InfoCard>

      <InfoCard>
        <FiShield size={24} color="#0ea5e9" />
        <CardContent>
          <CardTitle style={{ color: "#0c4a6e" }}>
            <FiShield />
            OAuth 2.0 Resource Owner Password Flow
          </CardTitle>
          <CardText style={{ color: "#0c4a6e" }}>
            The application collects the user's credentials and exchanges them directly for an
            access token.
          </CardText>

          <CardTitle style={{ color: "#0c4a6e", marginTop: "1.5rem" }}>Flow Steps:</CardTitle>
          <CardList style={{ color: "#0c4a6e" }}>
            <CardListItem>Application collects username and password</CardListItem>
            <CardListItem>Application sends credentials to token endpoint</CardListItem>
            <CardListItem>Authorization server validates credentials</CardListItem>
            <CardListItem>Server returns access token (and optionally refresh token)</CardListItem>
          </CardList>

          <CardTitle style={{ color: "#0c4a6e", marginTop: "1.5rem" }}>
            Token Request Example:
          </CardTitle>
          <CodeBlock>
            {`POST /as/token HTTP/1.1
Host: auth.pingone.com
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=user@example.com
&password=userpassword
&client_id=your-client-id
&client_secret=your-client-secret
&scope=read write`}
          </CodeBlock>
        </CardContent>
      </InfoCard>

      <SecurityNotice>
        <SecurityTitle>
          <FiAlertTriangle />
          Security Best Practices (If You Must Use This Flow)
        </SecurityTitle>
        <SecurityList>
          <SecurityListItem>
            <strong>Use HTTPS only:</strong> Never send credentials over unencrypted connections
          </SecurityListItem>
          <SecurityListItem>
            <strong>Minimal scope:</strong> Request only the minimum required permissions
          </SecurityListItem>
          <SecurityListItem>
            <strong>Secure storage:</strong> Never store passwords in plain text or client-side
          </SecurityListItem>
          <SecurityListItem>
            <strong>Token security:</strong> Implement proper token storage and rotation
          </SecurityListItem>
          <SecurityListItem>
            <strong>Audit logging:</strong> Log all authentication attempts and failures
          </SecurityListItem>
          <SecurityListItem>
            <strong>Rate limiting:</strong> Implement brute force protection
          </SecurityListItem>
          <SecurityListItem>
            <strong>Multi-factor authentication:</strong> Consider additional authentication factors
          </SecurityListItem>
        </SecurityList>
      </SecurityNotice>

      <InfoCard>
        <FiUser size={24} color="#0ea5e9" />
        <CardContent>
          <CardTitle style={{ color: "#0c4a6e" }}>
            <FiUser />
            Recommended Alternatives
          </CardTitle>
          <CardText style={{ color: "#0c4a6e" }}>
            Instead of the Resource Owner Password flow, consider these more secure alternatives:
          </CardText>
          <CardList style={{ color: "#0c4a6e" }}>
            <CardListItem>
              <strong>Authorization Code Flow:</strong> Most secure for web applications
            </CardListItem>
            <CardListItem>
              <strong>Authorization Code with PKCE:</strong> Best for mobile and SPA applications
            </CardListItem>
            <CardListItem>
              <strong>Device Code Flow:</strong> For devices with limited input capabilities
            </CardListItem>
            <CardListItem>
              <strong>Client Credentials Flow:</strong> For server-to-server communication
            </CardListItem>
          </CardList>
        </CardContent>
      </InfoCard>

      <SecurityNotice>
        <SecurityTitle>
          <FiX />
          Implementation Status
        </SecurityTitle>
        <CardText style={{ color: "#92400e" }}>
          This OAuth 2.0 Resource Owner Password flow is currently <strong>not implemented</strong>{" "}
          in this playground due to security concerns. If you need to test this flow, please use a
          dedicated, isolated environment with proper security controls in place.
        </CardText>
      </SecurityNotice>
    </PageContainer>
  );
};

export default OAuth2ResourceOwnerPasswordFlow;
