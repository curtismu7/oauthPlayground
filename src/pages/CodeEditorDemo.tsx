import React from 'react';
import styled from 'styled-components';
import { InteractiveCodeEditor } from '../components/InteractiveCodeEditor';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const PageTitle = styled.h1`
  font-size: 48px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PageSubtitle = styled.p`
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
`;

const DemoSection = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const SectionDescription = styled.p`
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const FeatureCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const FeatureTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeatureDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

const sampleCode = `/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * 
 * This example demonstrates how to initiate an OAuth 2.0 authorization
 * flow with PKCE (Proof Key for Code Exchange) for enhanced security.
 * 
 * PKCE prevents authorization code interception attacks by using
 * a dynamically generated code verifier and challenge.
 */

// Configuration - Replace with your actual values
const config = {
  environmentId: 'YOUR_ENVIRONMENT_ID',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: 'https://your-app.com/callback',
  scopes: 'openid profile email',
};

/**
 * Generates a cryptographically random code verifier
 * Must be 43-128 characters long (base64url encoded)
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Creates SHA-256 hash of code verifier for code challenge
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generates random state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Encodes data to base64url format (RFC 4648)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
}

// Main execution
async function initiateAuthorizationFlow() {
  try {
    // Step 1: Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Step 2: Build authorization URL
    const authUrl = new URL(\`https://auth.pingone.com/\${config.environmentId}/as/authorize\`);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scopes);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);

    // Step 3: Store for token exchange
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // Step 4: Redirect to authorization endpoint
    console.log('Redirecting to:', authUrl.toString());
    window.location.href = authUrl.toString();
    
  } catch (error) {
    console.error('Authorization flow failed:', error);
    throw error;
  }
}

// Execute the flow
initiateAuthorizationFlow();`;

const CodeEditorDemo: React.FC = () => {
  return (
    <PageContainer>
      <ContentWrapper>
        <PageHeader>
          <PageTitle>🚀 Interactive Code Editor Demo</PageTitle>
          <PageSubtitle>
            Test the Monaco Editor with real-time editing, syntax highlighting, and more
          </PageSubtitle>
        </PageHeader>

        <DemoSection>
          <SectionTitle>✨ Features</SectionTitle>
          <SectionDescription>
            This interactive code editor is powered by Monaco Editor (the same editor used in VS Code).
            Try editing the code, changing configuration values, and using the toolbar buttons!
          </SectionDescription>

          <FeatureGrid>
            <FeatureCard>
              <FeatureTitle>✏️ Live Editing</FeatureTitle>
              <FeatureDescription>
                Edit code directly in the editor with full syntax highlighting and IntelliSense
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>🎨 Syntax Highlighting</FeatureTitle>
              <FeatureDescription>
                TypeScript/JavaScript syntax highlighting with VS Code color scheme
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>🔧 Live Config</FeatureTitle>
              <FeatureDescription>
                Update configuration values and see code change in real-time
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>📋 Copy & Download</FeatureTitle>
              <FeatureDescription>
                One-click copy to clipboard or download as TypeScript file
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>🎭 Theme Toggle</FeatureTitle>
              <FeatureDescription>
                Switch between light and dark themes for comfortable viewing
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>🔄 Reset & Format</FeatureTitle>
              <FeatureDescription>
                Reset to original code or auto-format with Prettier-style formatting
              </FeatureDescription>
            </FeatureCard>
          </FeatureGrid>
        </DemoSection>

        <InteractiveCodeEditor
          initialCode={sampleCode}
          language="typescript"
          title="OAuth 2.0 Authorization Code Flow with PKCE"
          onCodeChange={(code) => {
            console.log('Code changed, length:', code.length);
          }}
        />

        <DemoSection style={{ marginTop: '32px' }}>
          <SectionTitle>🎯 How to Use</SectionTitle>
          <FeatureGrid>
            <FeatureCard>
              <FeatureTitle>1️⃣ Edit Configuration</FeatureTitle>
              <FeatureDescription>
                Update the configuration fields at the top to customize the code with your values
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>2️⃣ Modify Code</FeatureTitle>
              <FeatureDescription>
                Click in the editor and start typing. Use Ctrl+Space for auto-completion
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>3️⃣ Copy or Download</FeatureTitle>
              <FeatureDescription>
                Use the toolbar buttons to copy code to clipboard or download as a file
              </FeatureDescription>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>4️⃣ Toggle Theme</FeatureTitle>
              <FeatureDescription>
                Switch between light and dark themes using the theme toggle button
              </FeatureDescription>
            </FeatureCard>
          </FeatureGrid>
        </DemoSection>
      </ContentWrapper>
    </PageContainer>
  );
};

export default CodeEditorDemo;
