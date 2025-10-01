import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import { useUISettings } from '../contexts/UISettingsContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import {
	FiPlay,
	FiCheckCircle,
	FiArrowRight,
	FiBookOpen,
	FiCode,
	FiShield,
	FiUsers,
	FiSettings,
	FiChevronDown,
	FiChevronRight,
	FiStar,
	FiClock,
	FiKey,
	FiGlobe,
	FiServer,
	FiMonitor,
	FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: #4f46e5;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: #6b7280;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const TutorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const TutorialCard = styled(Card)`
  height: fit-content;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
`;

const TutorialIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  font-size: 2rem;
  transition: transform 0.3s ease;

  &.beginner { background: linear-gradient(135deg, #10b981, #059669); color: white; }
  &.intermediate { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
  &.advanced { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
`;

const DifficultyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;

  &.beginner { background-color: #dcfce7; color: #166534; }
  &.intermediate { background-color: #dbeafe; color: #1e40af; }
  &.advanced { background-color: #f0fdf4; color: #16a34a; }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${({ progress }) => progress}%;
`;

const StartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #2563eb;
  }
`;

const TutorialModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const StepContainer = styled.div`
  padding: 2rem;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.125rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`;

const StepContent = styled.div`
  margin-bottom: 2rem;
`;

const CodeBlock = styled.pre`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  white-space: pre-wrap;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  &.primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;

    &:hover {
      background-color: #2563eb;
      border-color: #2563eb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InteractiveTutorials = () => {
	// Centralized scroll management
	usePageScroll({ pageName: 'Interactive Tutorials', force: true });
	
	// UI Settings integration
	const { settings: uiSettings } = useUISettings();

	const navigate = useNavigate();
	const [selectedTutorial, setSelectedTutorial] = useState(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedTutorials, setCompletedTutorials] = useState(new Set());

	// Debug selectedTutorial state changes
	useEffect(() => {
		console.log(' selectedTutorial state changed:', selectedTutorial?.title || 'null');
	}, [selectedTutorial]);

	const tutorials = [
		{
			id: 'oauth-basics',
			title: 'OAuth 2.0 Fundamentals',
			description: 'Learn the core concepts of OAuth 2.0 authorization framework',
			difficulty: 'beginner',
			duration: '15 min',
			icon: FiShield,
			steps: [
				{
					title: 'What is OAuth 2.0?',
					content:
						'OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service.',
					code: `// OAuth 2.0 Key Concepts
- Resource Owner: The user who owns the data
- Client: The application requesting access
- Authorization Server: Issues access tokens
- Resource Server: Hosts the protected resources`,
					type: 'info',
				},
				{
					title: 'OAuth Roles',
					content: 'Understanding the four main roles in OAuth 2.0 ecosystem.',
					code: `Resource Owner (User)
     grants permission to
Client Application
     requests access from
Authorization Server
     issues tokens to
Resource Server (API)`,
					type: 'diagram',
				},
				{
					title: 'Access Tokens',
					content: 'Bearer tokens that grant access to protected resources.',
					code: `// Example Access Token
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}`,
					type: 'code',
				},
				{
					title: 'Token Types',
					content: 'Different types of tokens used in OAuth flows.',
					code: `Access Token: Short-lived, used for API calls
Refresh Token: Long-lived, used to get new access tokens
Authorization Code: Temporary code exchanged for tokens
ID Token: JWT containing user identity information`,
					type: 'info',
				},
			],
		},
		{
			id: 'auth-code-flow',
			title: 'Authorization Code Flow',
			description: 'Master the most secure OAuth flow for web applications',
			difficulty: 'intermediate',
			duration: '25 min',
			icon: FiCode,
			steps: [
				{
					title: 'Flow Overview',
					content:
						'The Authorization Code flow is the most secure flow for applications that can securely store client secrets.',
					code: `1. Client redirects user to Authorization Server
2. User authenticates and grants consent
3. Authorization Server redirects back with code
4. Client exchanges code for access token`,
					type: 'steps',
				},
				{
					title: 'Authorization Request',
					content: 'The initial request to the authorization endpoint.',
					code: `GET /authorize?
  client_id=your_client_id
  &redirect_uri=https://your-app.com/callback
  &response_type=code
  &scope=openid profile email
  &state=xyz123
  &nonce=abc456`,
					type: 'request',
				},
				{
					title: 'Token Exchange',
					content: 'Exchanging the authorization code for tokens.',
					code: `POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=your_client_id
&client_secret=your_client_secret
&code=auth_code_from_redirect
&redirect_uri=https://your-app.com/callback`,
					type: 'request',
				},
				{
					title: 'Security Features',
					content: 'Built-in security measures of the Authorization Code flow.',
					code: ` Client authentication required
 Authorization code is short-lived
 Tokens never exposed to user agent
 Supports refresh tokens
 PKCE support for enhanced security`,
					type: 'security',
				},
			],
		},
		{
			id: 'openid-connect',
			title: 'OpenID Connect Deep Dive',
			description: 'Complete guide to identity layer on top of OAuth 2.0',
			difficulty: 'advanced',
			duration: '35 min',
			icon: FiUsers,
			steps: [
				{
					title: 'OIDC vs OAuth',
					content: 'Understanding the relationship between OpenID Connect and OAuth 2.0.',
					code: `OAuth 2.0: Authorization framework
  
OpenID Connect: Identity layer on OAuth 2.0

OIDC adds:
 ID Tokens (JWT with user identity)
 UserInfo endpoint
 Standard claims
 Discovery document
 Dynamic client registration`,
					type: 'comparison',
				},
				{
					title: 'ID Token Structure',
					content: 'Anatomy of a JWT ID Token.',
					code: `Header: {"alg": "RS256", "typ": "JWT"}
Payload: {
  "iss": "https://auth.example.com",
  "sub": "user123",
  "aud": "client_id",
  "exp": 1638360000,
  "iat": 1638356400,
  "name": "John Doe",
  "email": "john@example.com"
}
Signature: Base64Url-encoded signature`,
					type: 'jwt',
				},
				{
					title: 'Standard Claims',
					content: 'Common claims included in ID tokens.',
					code: `sub: Subject (unique user identifier)
name: Full name
given_name: First name
family_name: Last name
email: Email address
email_verified: Email verification status
picture: Profile picture URL
locale: User locale
zoneinfo: Time zone`,
					type: 'claims',
				},
				{
					title: 'Discovery & Metadata',
					content: 'How clients discover OIDC provider capabilities.',
					code: `GET /.well-known/openid-configuration

Response includes:
 authorization_endpoint
 token_endpoint
 userinfo_endpoint
 jwks_uri (JSON Web Key Set)
 issuer
 supported scopes
 supported response types`,
					type: 'discovery',
				},
			],
		},
		{
			id: 'security-best-practices',
			title: 'Security Best Practices',
			description: 'Essential security measures for OAuth and OIDC implementations',
			difficulty: 'advanced',
			duration: '30 min',
			icon: FiShield,
			steps: [
				{
					title: 'Secure Token Storage',
					content: 'Best practices for storing access tokens and refresh tokens.',
					code: ` Use HttpOnly, Secure, SameSite cookies
 Store tokens in secure storage (not localStorage)
 Implement token rotation
 Use short-lived access tokens
 Validate tokens on every request`,
					type: 'security',
				},
				{
					title: 'PKCE (Proof Key for Code Exchange)',
					content: 'Enhanced security for public clients.',
					code: `1. Client generates code_verifier (random string)
2. Creates code_challenge = BASE64URL(SHA256(code_verifier))
3. Sends code_challenge in authorization request
4. Authorization Server stores code_challenge
5. Client sends code_verifier in token request
6. Server validates: SHA256(code_verifier) === stored_challenge`,
					type: 'security',
				},
				{
					title: 'State Parameter Protection',
					content: 'Preventing CSRF attacks with state parameters.',
					code: `// Generate cryptographically secure state
const state = crypto.randomBytes(32).toString('hex');

// Store state in session
session.state = state;

// Include in authorization request
GET /authorize?client_id=...&state=\${state}

// Validate on callback
if (req.query.state !== session.state) {
  throw new Error('Invalid state parameter');
}`,
					type: 'security',
				},
				{
					title: 'Token Validation',
					content: 'Properly validating JWT tokens.',
					code: ` Verify signature using JWKS
 Check expiration (exp claim)
 Validate issuer (iss claim)
 Check audience (aud claim)
 Verify not before (nbf claim)
 Validate nonce (if present)
 Check token type and scope`,
					type: 'validation',
				},
			],
		},
		{
			id: 'authorization-code-flow',
			title: 'Authorization Code Flow',
			description: 'Learn the most secure OAuth 2.0 flow with step-by-step examples',
			difficulty: 'intermediate',
			duration: '20 min',
			icon: FiKey,
			steps: [
				{
					title: 'What is Authorization Code Flow?',
					content:
						'The Authorization Code flow is the most secure OAuth 2.0 flow, designed for server-side applications that can securely store client credentials.',
					code: `Key Benefits:
 Most secure OAuth flow
 Client secret never exposed to browser
 Supports PKCE for additional security
 Can refresh tokens securely
 Recommended for web applications`,
					type: 'info',
				},
				{
					title: 'Step 1: Authorization Request',
					content:
						'The client redirects the user to the authorization server with the required parameters.',
					code: `GET https://auth.pingone.com/{environmentId}/as/authorize?
  response_type=code&
  client_id={clientId}&
  redirect_uri={redirectUri}&
  scope=openid profile email&
  state={randomString}&
  code_challenge={codeChallenge}&
  code_challenge_method=S256`,
					type: 'code',
				},
				{
					title: 'Step 2: User Authorization',
					content: 'The user authenticates and grants permission to the client application.',
					code: `User sees PingOne login page:

  PingOne Identity Platform      
                                 
  Username: [____________]       
  Password: [____________]       
                                 
  [ ] Remember me                
  [     Sign In     ]            
                                 
  Grant access to: My App        
  [Allow] [Deny]                 
`,
					type: 'diagram',
				},
				{
					title: 'Step 3: Authorization Code',
					content:
						'After successful authorization, the user is redirected back with an authorization code.',
					code: `Redirect to: {redirectUri}?code=abc123&state=xyz789

  Authorization codes are:
- Short-lived (typically 10 minutes)
- Single-use only
- Must be exchanged immediately`,
					type: 'security',
				},
				{
					title: 'Step 4: Token Exchange',
					content: 'The client exchanges the authorization code for access and refresh tokens.',
					code: `POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(clientId:clientSecret)}

grant_type=authorization_code&
code={authorizationCode}&
redirect_uri={redirectUri}&
code_verifier={codeVerifier}`,
					type: 'code',
				},
				{
					title: 'Step 5: Access Protected Resources',
					content: 'Use the access token to make API calls to protected resources.',
					code: `GET https://api.example.com/user/profile
Authorization: Bearer {access_token}

Response:
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com"
}`,
					type: 'code',
				},
			],
		},
		{
			id: 'implicit-flow',
			title: 'Implicit Flow',
			description: 'Understand the browser-based OAuth flow for single-page applications',
			difficulty: 'intermediate',
			duration: '15 min',
			icon: FiGlobe,
			steps: [
				{
					title: 'What is Implicit Flow?',
					content:
						'The Implicit flow is designed for browser-based applications that cannot securely store client credentials.',
					code: `  Deprecated in OAuth 2.1
 Still supported by PingOne
 Good for SPAs and mobile apps
 Less secure than Authorization Code
 No refresh tokens`,
					type: 'info',
				},
				{
					title: 'Implicit Flow Steps',
					content: 'The implicit flow is simpler but less secure than authorization code flow.',
					code: `1. Client redirects to authorization server
2. User authenticates and grants permission
3. Authorization server redirects with access token
4. Client uses token to access protected resources`,
					type: 'diagram',
				},
				{
					title: 'Authorization Request',
					content: 'The client initiates the flow with response_type=token.',
					code: `GET https://auth.pingone.com/{environmentId}/as/authorize?
  response_type=token&
  client_id={clientId}&
  redirect_uri={redirectUri}&
  scope=read write&
  state={randomString}`,
					type: 'code',
				},
				{
					title: 'Token Response',
					content: 'The access token is returned directly in the redirect URL fragment.',
					code: `Redirect to: {redirectUri}#access_token=eyJhbGciOiJSUzI1NiIs...&
token_type=Bearer&
expires_in=3600&
scope=read write&
state={randomString}

  Token is in URL fragment (after #)
  Not accessible to server-side code
  Must be handled by JavaScript`,
					type: 'security',
				},
				{
					title: 'Security Considerations',
					content: 'Important security considerations for implicit flow.',
					code: ` Access tokens exposed in browser history
 No refresh token capability
 Vulnerable to token theft
 Cannot securely store client secret
 Good for public clients (SPAs)
 Simpler implementation`,
					type: 'security',
				},
			],
		},
		{
			id: 'client-credentials-flow',
			title: 'Client Credentials Flow',
			description: 'Learn machine-to-machine authentication for service-to-service communication',
			difficulty: 'intermediate',
			duration: '12 min',
			icon: FiServer,
			steps: [
				{
					title: 'What is Client Credentials Flow?',
					content:
						'The Client Credentials flow is designed for machine-to-machine (M2M) authentication where no user interaction is required.',
					code: `Use Cases:
 Service-to-service API calls
 Backend system integration
 Automated data synchronization
 Server-side batch processing
 Microservice communication`,
					type: 'info',
				},
				{
					title: 'Flow Overview',
					content:
						'The client authenticates directly with the authorization server using its credentials.',
					code: `Client Application
     (client_id + client_secret)
Authorization Server
     (access_token)
Resource Server (API)

No user involved in this flow!`,
					type: 'diagram',
				},
				{
					title: 'Token Request',
					content: 'The client directly requests an access token using its credentials.',
					code: `POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(clientId:clientSecret)}

grant_type=client_credentials&
scope=api:read api:write`,
					type: 'code',
				},
				{
					title: 'Token Response',
					content: 'The authorization server returns an access token for the client.',
					code: `Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}

Note: No refresh token in client credentials flow`,
					type: 'code',
				},
				{
					title: 'Security Best Practices',
					content: 'Important security considerations for client credentials flow.',
					code: ` Store client secret securely
 Use HTTPS for all requests
 Validate token expiration
 Implement proper error handling
 Use least privilege scopes
 Monitor token usage
 Rotate credentials regularly`,
					type: 'security',
				},
			],
		},
		{
			id: 'device-code-flow',
			title: 'Device Code Flow',
			description: 'Learn about OAuth for devices with limited input capabilities',
			difficulty: 'advanced',
			duration: '18 min',
			icon: FiMonitor,
			steps: [
				{
					title: 'What is Device Code Flow?',
					content:
						'The Device Code flow enables OAuth on devices with limited input capabilities, such as smart TVs, IoT devices, or command-line tools.',
					code: `Perfect for:
 Smart TVs and streaming devices
 IoT devices and smart home gadgets
 Command-line tools and CLIs
 Gaming consoles
 Devices with limited keyboards`,
					type: 'info',
				},
				{
					title: 'Flow Overview',
					content:
						'The device gets a user code and verification URL, while polling for the access token.',
					code: `1. Device requests device code
2. User visits verification URL
3. User enters user code and authorizes
4. Device polls for access token
5. Device receives access token`,
					type: 'diagram',
				},
				{
					title: 'Step 1: Device Authorization Request',
					content: 'The device requests a device code and user code from the authorization server.',
					code: `POST https://auth.pingone.com/{environmentId}/as/device
Content-Type: application/x-www-form-urlencoded

client_id={clientId}&
scope=openid profile email`,
					type: 'code',
				},
				{
					title: 'Step 2: Device Authorization Response',
					content:
						'The authorization server returns device and user codes with verification information.',
					code: `Response:
{
  "device_code": "abc123...",
  "user_code": "ABCD-EFGH",
  "verification_uri": "https://auth.pingone.com/device",
  "verification_uri_complete": "https://auth.pingone.com/device?user_code=ABCD-EFGH",
  "expires_in": 1800,
  "interval": 5
}`,
					type: 'code',
				},
				{
					title: 'Step 3: User Authorization',
					content: 'The user visits the verification URL and enters the user code.',
					code: `User visits: https://auth.pingone.com/device
User enters: ABCD-EFGH

PingOne shows:

  Device Authorization           
                                 
  Enter code: [ABCD-EFGH]        
                                 
  App: My Smart TV App           
  Scopes: profile, email         
                                 
  [Authorize] [Deny]             
`,
					type: 'diagram',
				},
				{
					title: 'Step 4: Token Polling',
					content: 'The device polls the token endpoint until the user completes authorization.',
					code: `POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code&
device_code={device_code}&
client_id={clientId}

Poll every 5 seconds until success or expiration`,
					type: 'code',
				},
				{
					title: 'Step 5: Token Response',
					content: 'When the user authorizes, the device receives the access token.',
					code: `Success Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "def456...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}

Error Response (while waiting):
{
  "error": "authorization_pending"
}`,
					type: 'code',
				},
			],
		},
		{
			id: 'openid-connect',
			title: 'OpenID Connect (OIDC)',
			description: 'Learn about OIDC identity layer on top of OAuth 2.0',
			difficulty: 'intermediate',
			duration: '25 min',
			icon: FiUser,
			steps: [
				{
					title: 'What is OpenID Connect?',
					content:
						'OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0 that provides authentication and user information.',
					code: `OIDC = OAuth 2.0 + Identity Layer

Key Features:
 User authentication (not just authorization)
 User identity information (ID tokens)
 Standardized user profile data
 Discovery endpoints for configuration
 Standardized logout flows`,
					type: 'info',
				},
				{
					title: 'OIDC vs OAuth 2.0',
					content: 'Understanding the difference between OAuth 2.0 and OpenID Connect.',
					code: `OAuth 2.0:
- Authorization framework
- "Can this app access my data?"
- Returns access tokens
- Scopes like "read", "write"

OpenID Connect:
- Identity layer on OAuth 2.0
- "Who is this user?"
- Returns ID tokens (JWT)
- Scopes like "openid", "profile"`,
					type: 'diagram',
				},
				{
					title: 'OIDC Flows',
					content: 'OpenID Connect supports multiple flows for different use cases.',
					code: `Supported OIDC Flows:

1. Authorization Code Flow (Recommended)
   - Most secure
   - Server-side applications
   - Returns both access and ID tokens

2. Implicit Flow
   - Browser-based applications
   - Returns ID token directly
   - Less secure

3. Hybrid Flow
   - Combination of code and implicit
   - Returns ID token immediately
   - Access token via code exchange`,
					type: 'info',
				},
				{
					title: 'ID Token Structure',
					content: 'ID tokens are JWTs containing user identity information.',
					code: `ID Token (JWT) Structure:

Header:
{
  "alg": "RS256",
  "kid": "key-id",
  "typ": "JWT"
}

Payload:
{
  "iss": "https://auth.pingone.com/{envId}",
  "sub": "user123",
  "aud": "client-id",
  "exp": 1640995200,
  "iat": 1640991600,
  "auth_time": 1640991600,
  "nonce": "random-nonce",
  "email": "user@example.com",
  "name": "John Doe"
}`,
					type: 'code',
				},
				{
					title: 'OIDC Scopes',
					content: 'OpenID Connect defines standard scopes for requesting user information.',
					code: `Standard OIDC Scopes:

openid (Required)
- Indicates this is an OIDC request
- Must be included in all OIDC flows

profile
- User's basic profile information
- name, family_name, given_name, etc.

email
- User's email address
- email, email_verified

address
- User's address information

phone
- User's phone number information`,
					type: 'info',
				},
				{
					title: 'UserInfo Endpoint',
					content:
						'The UserInfo endpoint provides additional user information using the access token.',
					code: `GET https://auth.pingone.com/{environmentId}/as/userinfo
Authorization: Bearer {access_token}

Response:
{
  "sub": "user123",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}`,
					type: 'code',
				},
			],
		},
		{
			id: 'oauth-security',
			title: 'OAuth Security Best Practices',
			description: 'Learn essential security practices for implementing OAuth flows',
			difficulty: 'advanced',
			duration: '30 min',
			icon: FiShield,
			steps: [
				{
					title: 'Common OAuth Vulnerabilities',
					content: 'Understanding and preventing common OAuth security vulnerabilities.',
					code: ` Top OAuth Security Risks:

1. Authorization Code Interception
   - Attacker intercepts authorization code
   - Mitigation: Use PKCE, HTTPS, short-lived codes

2. Token Leakage
   - Access tokens exposed in logs, URLs, or storage
   - Mitigation: Secure storage, HTTPS, token binding

3. CSRF Attacks
   - Cross-site request forgery on authorization
   - Mitigation: State parameter, SameSite cookies

4. Redirect URI Manipulation
   - Attacker redirects tokens to malicious site
   - Mitigation: Strict redirect URI validation`,
					type: 'security',
				},
				{
					title: 'PKCE (Proof Key for Code Exchange)',
					content: 'PKCE adds an extra layer of security to authorization code flow.',
					code: `PKCE Flow:

1. Generate code_verifier (random string)
2. Create code_challenge = SHA256(code_verifier)
3. Include code_challenge in authorization request
4. Include code_verifier in token exchange

Authorization Request:
GET /authorize?...
  &code_challenge={codeChallenge}
  &code_challenge_method=S256

Token Exchange:
POST /token
  grant_type=authorization_code
  &code={authorization_code}
  &code_verifier={codeVerifier}`,
					type: 'code',
				},
				{
					title: 'State Parameter Protection',
					content:
						'The state parameter prevents CSRF attacks by binding the authorization request to the callback.',
					code: `// Generate cryptographically secure state
const state = crypto.randomBytes(32).toString('hex');

// Store state in session
session.state = state;

// Include in authorization request
GET /authorize?client_id=...&state=\${state}

// Validate on callback
if (req.query.state !== session.state) {
  throw new Error('Invalid state parameter');
}`,
					type: 'security',
				},
				{
					title: 'Token Validation',
					content: 'Properly validating JWT tokens is crucial for security.',
					code: ` Verify signature using JWKS
 Check expiration (exp claim)
 Validate issuer (iss claim)
 Check audience (aud claim)
 Verify not before (nbf claim)
 Validate nonce (if present)
 Check token type and scope`,
					type: 'validation',
				},
				{
					title: 'Secure Token Storage',
					content: 'Best practices for storing tokens securely in different environments.',
					code: `Web Applications:
 HTTP-only cookies for refresh tokens
 Memory storage for access tokens
 localStorage (XSS vulnerable)
 sessionStorage (tab closure risk)

Mobile Applications:
 Keychain/Keystore for long-term storage
 Memory for short-term tokens
 Encrypted storage if needed

Server Applications:
 Secure environment variables
 Encrypted database storage
 Hardware security modules (HSMs)`,
					type: 'security',
				},
				{
					title: 'Scope Validation',
					content: 'Properly validating and limiting token scopes is essential for security.',
					code: `Scope Best Practices:

 Use least privilege principle
 Validate requested scopes
 Check scope in every API call
 Implement scope-based access control

Example:
// Validate scope before API access
if (!token.scope.includes('read:users')) {
  throw new Error('Insufficient scope');
}

// Check specific permissions
const hasPermission = (token, resource, action) => {
  const requiredScope = action + ':' + resource;
  return token.scope.includes(requiredScope);
};`,
					type: 'validation',
				},
			],
		},
		{
			id: 'pushed-authorization-request',
			title: 'Pushed Authorization Request (PAR)',
			description: 'Learn about PAR for enhanced security in OAuth authorization requests',
			difficulty: 'advanced',
			duration: '20 min',
			icon: FiShield,
			steps: [
				{
					title: 'What is Pushed Authorization Request (PAR)?',
					content:
						'PAR is a security extension to OAuth 2.0 that pushes authorization request parameters to the authorization server before redirecting the user.',
					code: `PAR Benefits:
 Enhanced security - request parameters protected
 Prevents parameter tampering attacks
 Centralized request validation
 Better error handling before redirect
 Improved user experience
 RFC 9126 standard`,
					type: 'info',
				},
				{
					title: 'PAR vs Standard Authorization Flow',
					content: 'Understanding the difference between standard OAuth and PAR flow.',
					code: `Standard OAuth Flow:
1. Client redirects user with parameters in URL
2. User authorizes on authorization server
3. Server redirects back with code/token

PAR Flow:
1. Client pushes request to authorization server
2. Server validates and stores request
3. Client redirects user with request_uri
4. User authorizes on authorization server
5. Server redirects back with code/token`,
					type: 'diagram',
				},
				{
					title: 'Step 1: Push Authorization Request',
					content: 'The client sends authorization parameters to the PAR endpoint.',
					code: `POST https://auth.pingone.com/{environmentId}/as/par
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(clientId:clientSecret)}

response_type=code&
client_id={clientId}&
redirect_uri={redirectUri}&
scope=openid profile email&
state={randomString}&
code_challenge={codeChallenge}&
code_challenge_method=S256&
nonce={randomString}`,
					type: 'code',
				},
				{
					title: 'Step 2: PAR Response',
					content: 'The authorization server validates the request and returns a request URI.',
					code: `Success Response:
{
  "request_uri": "urn:ietf:params:oauth:request_uri:{requestId}",
  "expires_in": 90
}

Error Response:
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}

  Request URIs expire in 90 seconds
  Must be used immediately after creation`,
					type: 'code',
				},
				{
					title: 'Step 3: Authorization with Request URI',
					content:
						'The client redirects the user using the request_uri instead of individual parameters.',
					code: `GET https://auth.pingone.com/{environmentId}/as/authorize?
  client_id={clientId}&
  request_uri={requestUri}

Note: Only client_id and request_uri are needed!
All other parameters are retrieved from the stored request.`,
					type: 'code',
				},
				{
					title: 'Step 4: User Authorization',
					content: 'The user sees the same authorization page as standard OAuth flow.',
					code: `User sees PingOne login page:

  PingOne Identity Platform      
                                 
  Username: [____________]       
  Password: [____________]       
                                 
  [ ] Remember me                
  [     Sign In     ]            
                                 
  Grant access to: My App        
  [Allow] [Deny]                 


Same user experience as standard flow!`,
					type: 'diagram',
				},
				{
					title: 'Step 5: Authorization Response',
					content: 'After authorization, the user is redirected back with the authorization code.',
					code: `Redirect to: {redirectUri}?code=abc123&state=xyz789

Same response as standard OAuth flow!
The authorization code can be exchanged for tokens normally.`,
					type: 'code',
				},
				{
					title: 'PAR Security Benefits',
					content: 'Key security advantages of using PAR over standard OAuth.',
					code: ` Parameter Protection:
- Authorization parameters are encrypted in transit
- Parameters cannot be tampered with by malicious actors
- Request validation happens server-side

 Attack Prevention:
- Prevents parameter injection attacks
- Reduces risk of authorization code interception
- Eliminates URL length limitations

 Better Error Handling:
- Validation errors returned before redirect
- No broken user experience from invalid requests
- Centralized parameter validation`,
					type: 'security',
				},
				{
					title: 'PAR Implementation Best Practices',
					content: 'Best practices for implementing PAR in your applications.',
					code: ` Always use HTTPS for PAR requests
 Implement proper error handling
 Use short expiration times (90 seconds max)
 Validate request_uri format
 Handle PAR endpoint errors gracefully
 Fall back to standard flow if PAR fails
 Cache request URIs appropriately

Example Error Handling:
if (parResponse.error) {
  // Log error and fall back to standard flow
  console.error('PAR failed:', parResponse.error);
  return standardAuthorizationFlow();
}`,
					type: 'validation',
				},
			],
		},
	];

	const startTutorial = (tutorial) => {
		console.log(' Starting tutorial:', tutorial.title);
		setSelectedTutorial(tutorial);
		setCurrentStep(0);
	};

	const nextStep = () => {
		if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const completeTutorial = () => {
		if (selectedTutorial) {
			setCompletedTutorials((prev) => new Set(Array.from(prev).concat(selectedTutorial.id)));
			setSelectedTutorial(null);
			setCurrentStep(0);
		}
	};

	const getDifficultyColor = (difficulty) => {
		switch (difficulty) {
			case 'beginner':
				return '#10b981';
			case 'intermediate':
				return '#3b82f6';
			case 'advanced':
				return '#22c55e';
			default:
				return '#6b7280';
		}
	};

	const renderStepContent = (step) => {
		switch (step.type) {
			case 'code':
				return (
					<div>
						<p>{step.content}</p>
						<CodeBlock>{step.code}</CodeBlock>
					</div>
				);
			case 'diagram':
				return (
					<div>
						<p>{step.content}</p>
						<div
							style={{
								backgroundColor: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								whiteSpace: 'pre-line',
							}}
						>
							{step.code}
						</div>
					</div>
				);
			case 'info':
				return (
					<div>
						<p>{step.content}</p>
						<CodeBlock>{step.code}</CodeBlock>
					</div>
				);
			case 'security':
				return (
					<div>
						<p>{step.content}</p>
						<div
							style={{
								backgroundColor: '#dcfce7',
								border: '1px solid #bbf7d0',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								color: '#166534',
							}}
						>
							{step.code}
						</div>
					</div>
				);
			case 'validation':
				return (
					<div>
						<p>{step.content}</p>
						<div
							style={{
								backgroundColor: '#dbeafe',
								border: '1px solid #93c5fd',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontFamily: 'monospace',
								color: '#1e40af',
							}}
						>
							{step.code}
						</div>
					</div>
				);
			default:
				return (
					<div>
						<p>{step.content}</p>
						<CodeBlock>{step.code}</CodeBlock>
					</div>
				);
		}
	};

	return (
		<Container>
			<Header>
				<h1>
					<FiBookOpen />
					Interactive Tutorials
				</h1>
				<p>
					Step-by-step guided learning paths to master OAuth 2.0 and OpenID Connect. Choose a
					tutorial and follow along with interactive examples and explanations.
				</p>
			</Header>

			<TutorialGrid>
				{tutorials.map((tutorial) => {
					const progress = completedTutorials.has(tutorial.id)
						? 100
						: selectedTutorial?.id === tutorial.id
							? Math.round((currentStep / tutorial.steps.length) * 100)
							: 0;

					return (
						<div
							key={tutorial.id}
							style={{
								background: 'white',
								borderRadius: '0.5rem',
								boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
								padding: '1.5rem',
								cursor: 'pointer',
								transition: 'transform 0.2s ease, box-shadow 0.2s ease',
								height: 'fit-content',
							}}
							onClick={(e) => {
								console.log(' Tutorial card clicked:', tutorial.title);
								e.preventDefault();
								startTutorial(tutorial);
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.15)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
							}}
						>
							<CardBody style={{ textAlign: 'center' }}>
								<TutorialIcon className={tutorial.difficulty}>
									<tutorial.icon size={32} />
								</TutorialIcon>

								<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
									{tutorial.title}
								</h3>

								<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
									{tutorial.description}
								</p>

								<DifficultyBadge className={tutorial.difficulty}>
									<FiStar size={12} />
									{tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
								</DifficultyBadge>

								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.5rem',
										marginBottom: '1rem',
									}}
								>
									<FiClock size={14} style={{ color: '#6b7280' }} />
									<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
										{tutorial.duration}
									</span>
								</div>

								{progress > 0 && (
									<div style={{ marginBottom: '1rem' }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												marginBottom: '0.5rem',
											}}
										>
											<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Progress</span>
											<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{progress}%</span>
										</div>
										<ProgressBar>
											<ProgressFill progress={progress} />
										</ProgressBar>
									</div>
								)}

								<StartButton>
									<FiPlay size={16} />
									{completedTutorials.has(tutorial.id) ? 'Review Tutorial' : 'Start Tutorial'}
								</StartButton>
							</CardBody>
						</div>
					);
				})}
			</TutorialGrid>

			{/* Tutorial Modal */}
			{selectedTutorial && (
				<TutorialModal>
					<ModalContent>
						<ModalHeader>
							<h2>{selectedTutorial.title}</h2>
							<CloseButton onClick={() => setSelectedTutorial(null)}></CloseButton>
						</ModalHeader>

						<StepContainer>
							<StepHeader>
								<div className="step-number">{currentStep + 1}</div>
								<h3>{selectedTutorial.steps[currentStep].title}</h3>
							</StepHeader>

							<StepContent>{renderStepContent(selectedTutorial.steps[currentStep])}</StepContent>

							<NavigationButtons>
								<NavButton onClick={prevStep} disabled={currentStep === 0}>
									<FiChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
									Previous
								</NavButton>

								<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
									Step {currentStep + 1} of {selectedTutorial.steps.length}
								</div>

								{currentStep === selectedTutorial.steps.length - 1 ? (
									<NavButton className="primary" onClick={completeTutorial}>
										Complete Tutorial
										<FiCheckCircle size={16} />
									</NavButton>
								) : (
									<NavButton onClick={nextStep}>
										Next
										<FiChevronRight size={16} />
									</NavButton>
								)}
							</NavigationButtons>
						</StepContainer>
					</ModalContent>
				</TutorialModal>
			)}
		</Container>
	);
};

export default InteractiveTutorials;
