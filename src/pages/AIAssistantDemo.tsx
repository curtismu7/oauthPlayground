import React from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiSearch, FiZap, FiBook } from 'react-icons/fi';

const AIAssistantDemo: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>🤖 AI Assistant</Title>
        <Subtitle>Your intelligent guide to OAuth & OIDC</Subtitle>
      </Header>

      <Content>
        <Section>
          <SectionTitle>
            <FiMessageCircle size={24} />
            What is the AI Assistant?
          </SectionTitle>
          <Description>
            The AI Assistant is an intelligent chatbot built into the OAuth Playground that helps you:
          </Description>
          <FeatureList>
            <FeatureItem>
              <Icon>🔍</Icon>
              <FeatureText>
                <strong>Find the right OAuth flow</strong> for your application type
              </FeatureText>
            </FeatureItem>
            <FeatureItem>
              <Icon>💡</Icon>
              <FeatureText>
                <strong>Understand concepts</strong> like PKCE, scopes, and tokens
              </FeatureText>
            </FeatureItem>
            <FeatureItem>
              <Icon>🎯</Icon>
              <FeatureText>
                <strong>Navigate quickly</strong> to relevant documentation and features
              </FeatureText>
            </FeatureItem>
            <FeatureItem>
              <Icon>🔧</Icon>
              <FeatureText>
                <strong>Troubleshoot issues</strong> with helpful guidance
              </FeatureText>
            </FeatureItem>
          </FeatureList>
        </Section>

        <Section>
          <SectionTitle>
            <FiSearch size={24} />
            How to Use It
          </SectionTitle>
          <StepList>
            <Step>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Open the Assistant</StepTitle>
                <StepDescription>
                  Look for the <PurpleText>purple floating chat button</PurpleText> in the bottom-right corner of any page
                </StepDescription>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Ask Your Question</StepTitle>
                <StepDescription>
                  Type any question about OAuth, OIDC, or the playground features
                </StepDescription>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Get Instant Answers</StepTitle>
                <StepDescription>
                  Receive helpful answers with links to relevant resources
                </StepDescription>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>4</StepNumber>
              <StepContent>
                <StepTitle>Navigate Directly</StepTitle>
                <StepDescription>
                  Click on suggested links to jump to flows, features, or documentation
                </StepDescription>
              </StepContent>
            </Step>
          </StepList>
        </Section>

        <Section>
          <SectionTitle>
            <FiZap size={24} />
            Example Questions
          </SectionTitle>
          <ExamplesGrid>
            <ExampleCard>
              <ExampleCategory>Flow Selection</ExampleCategory>
              <ExampleQuestion>"Which flow should I use for my mobile app?"</ExampleQuestion>
              <ExampleQuestion>"How do I test device flows?"</ExampleQuestion>
              <ExampleQuestion>"What's the best flow for backend services?"</ExampleQuestion>
            </ExampleCard>
            <ExampleCard>
              <ExampleCategory>Configuration</ExampleCategory>
              <ExampleQuestion>"How do I configure Authorization Code flow?"</ExampleQuestion>
              <ExampleQuestion>"How do I set up redirect URIs?"</ExampleQuestion>
              <ExampleQuestion>"What credentials do I need?"</ExampleQuestion>
            </ExampleCard>
            <ExampleCard>
              <ExampleCategory>Concepts</ExampleCategory>
              <ExampleQuestion>"What is PKCE?"</ExampleQuestion>
              <ExampleQuestion>"What's the difference between OAuth and OIDC?"</ExampleQuestion>
              <ExampleQuestion>"Explain scopes and claims"</ExampleQuestion>
            </ExampleCard>
            <ExampleCard>
              <ExampleCategory>Troubleshooting</ExampleCategory>
              <ExampleQuestion>"Redirect URI mismatch error"</ExampleQuestion>
              <ExampleQuestion>"How do I decode a JWT token?"</ExampleQuestion>
              <ExampleQuestion>"Token validation failed"</ExampleQuestion>
            </ExampleCard>
          </ExamplesGrid>
        </Section>

        <Section>
          <SectionTitle>
            <FiBook size={24} />
            What It Can Search
          </SectionTitle>
          <SearchableContent>
            <ContentCard>
              <ContentIcon>🔄</ContentIcon>
              <ContentTitle>15+ OAuth Flows</ContentTitle>
              <ContentDescription>
                Authorization Code, Client Credentials, Device Code, Implicit, JWT Bearer, CIBA, and more
              </ContentDescription>
            </ContentCard>
            <ContentCard>
              <ContentIcon>⚡</ContentIcon>
              <ContentTitle>12+ Features</ContentTitle>
              <ContentDescription>
                PKCE, Token Inspector, Code Generator, MFA, Password Reset, Session Management, and more
              </ContentDescription>
            </ContentCard>
            <ContentCard>
              <ContentIcon>📖</ContentIcon>
              <ContentTitle>Documentation</ContentTitle>
              <ContentDescription>
                Setup guides, security best practices, troubleshooting, and PingOne configuration
              </ContentDescription>
            </ContentCard>
          </SearchableContent>
        </Section>

        <CallToAction>
          <CTATitle>Try It Now!</CTATitle>
          <CTADescription>
            Look for the purple chat button in the bottom-right corner and start asking questions.
          </CTADescription>
          <CTAIcon>
            <FiMessageCircle size={48} />
          </CTAIcon>
        </CallToAction>
      </Content>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const Title = styled.h1`
  font-size: 48px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #666;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 60px;
`;

const Section = styled.section`
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  margin-bottom: 24px;
  color: #333;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 24px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
`;

const Icon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`;

const FeatureText = styled.div`
  font-size: 16px;
  line-height: 1.5;
  color: #333;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Step = styled.div`
  display: flex;
  gap: 20px;
`;

const StepNumber = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 8px;
  color: #333;
`;

const StepDescription = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: #666;
`;

const PurpleText = styled.span`
  color: #667eea;
  font-weight: 600;
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
`;

const ExampleCard = styled.div`
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
`;

const ExampleCategory = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
`;

const ExampleQuestion = styled.div`
  font-size: 14px;
  color: #333;
  padding: 8px 0;
  font-style: italic;
  
  &:before {
    content: '💬 ';
  }
`;

const SearchableContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const ContentCard = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  text-align: center;
`;

const ContentIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ContentTitle = styled.h3`
  font-size: 20px;
  margin-bottom: 12px;
  color: #333;
`;

const ContentDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #666;
`;

const CallToAction = styled.div`
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
`;

const CTATitle = styled.h2`
  font-size: 36px;
  margin-bottom: 16px;
`;

const CTADescription = styled.p`
  font-size: 18px;
  margin-bottom: 32px;
  opacity: 0.9;
`;

const CTAIcon = styled.div`
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

export default AIAssistantDemo;
