import styled from 'styled-components';
import { FiAlertTriangle, FiShield } from 'react-icons/fi';

const FlowContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const FlowHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const FlowTitle = styled.h2`
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 1rem;
`;

const FlowDescription = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const WarningBox = styled.div`
  background: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  display: flex;
  align-items: center;
`;

const WarningIcon = styled(FiAlertTriangle)`
  color: ${({ theme }) => theme.colors.danger};
  margin-right: 1rem;
  font-size: 1.5rem;
`;

const WarningText = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.danger};
`;

const WarningDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray700};
`;

const SecurityNote = styled.div`
  background: ${({ theme }) => theme.colors.light};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  display: flex;
  align-items: center;
`;

const SecurityIcon = styled(FiShield)`
  color: ${({ theme }) => theme.colors.warning};
  margin-right: 1rem;
`;

const ImplicitFlow = () => {
  return (
    <FlowContainer>
      <FlowHeader>
        <FlowTitle>Implicit Flow</FlowTitle>
        <FlowDescription>
          A simplified flow that returns tokens directly in the browser.
          This flow is deprecated and should not be used in production.
        </FlowDescription>
      </FlowHeader>

      <WarningBox>
        <WarningIcon />
        <WarningText>
          <WarningTitle>⚠️ Deprecated Flow</WarningTitle>
          <WarningDescription>
            The Implicit Flow is deprecated by OAuth 2.1 specification and should not be used
            in new applications. Use Authorization Code Flow with PKCE instead.
          </WarningDescription>
        </WarningText>
      </WarningBox>

      <div style={{ marginTop: '2rem' }}>
        <h3>How it worked:</h3>
        <ol>
          <li>User initiates login</li>
          <li>Redirected to authorization endpoint</li>
          <li>After authentication, tokens returned directly in URL fragment</li>
          <li>Client processes tokens from URL fragment</li>
        </ol>
      </div>

      <SecurityNote>
        <SecurityIcon />
        <div>
          <strong>Security Concerns:</strong> Tokens exposed in browser history, logs, and referrer headers.
          No refresh tokens. Better alternatives available.
        </div>
      </SecurityNote>
    </FlowContainer>
  );
};

export default ImplicitFlow;
