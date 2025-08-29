import styled from 'styled-components';
import { FiCode, FiKey, FiUser, FiCheckCircle } from 'react-icons/fi';

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
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const FlowDescription = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const StepsContainer = styled.div`
  margin-top: 2rem;
`;

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const StepIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.5rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StepDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;
`;

const AuthorizationCodeFlow = () => {
  return (
    <FlowContainer>
      <FlowHeader>
        <FlowTitle>Authorization Code Flow</FlowTitle>
        <FlowDescription>
          The most secure and recommended OAuth 2.0 flow for web applications.
          Involves a server-side exchange of the authorization code for tokens.
        </FlowDescription>
      </FlowHeader>

      <StepsContainer>
        <Step>
          <StepIcon>
            <FiUser />
          </StepIcon>
          <StepContent>
            <StepTitle>1. User Initiates Login</StepTitle>
            <StepDescription>
              User clicks login and is redirected to PingOne authorization endpoint with client_id,
              redirect_uri, scope, and state parameters.
            </StepDescription>
          </StepContent>
        </Step>

        <Step>
          <StepIcon>
            <FiCode />
          </StepIcon>
          <StepContent>
            <StepTitle>2. Authorization Code Granted</StepTitle>
            <StepDescription>
              After successful authentication, PingOne redirects back to your application with
              an authorization code in the query parameters.
            </StepDescription>
          </StepContent>
        </Step>

        <Step>
          <StepIcon>
            <FiKey />
          </StepIcon>
          <StepContent>
            <StepTitle>3. Token Exchange</StepTitle>
            <StepDescription>
              Your server securely exchanges the authorization code for access_token and
              refresh_token using the token endpoint.
            </StepDescription>
          </StepContent>
        </Step>

        <Step>
          <StepIcon>
            <FiCheckCircle />
          </StepIcon>
          <StepContent>
            <StepTitle>4. Access Resources</StepTitle>
            <StepDescription>
              Use the access token to access protected resources and maintain user session.
            </StepDescription>
          </StepContent>
        </Step>
      </StepsContainer>
    </FlowContainer>
  );
};

export default AuthorizationCodeFlow;
