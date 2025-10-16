import { useEffect, useState } from 'react';
import {
	FiBookOpen,
	FiClock,
	FiCode,
	FiExternalLink,
	FiGlobe,
	FiKey,
	FiMonitor,
	FiPlay,
	FiSave,
	FiServer,
	FiShield,
	FiStar,
	FiTrash2,
	FiUser,
	FiUsers,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import { CardBody } from '../components/Card';
import { useUISettings } from '../contexts/UISettingsContext';
import { usePageScroll } from '../hooks/usePageScroll';
import { v4ToastManager } from '../utils/v4ToastMessages';
import TutorialTextFormatter from '../components/TutorialTextFormatter';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import { FlowHeader } from '../services/flowHeaderService';

// Tutorial type definitions
interface TutorialStep {
	title: string;
	content: string;
	code: string;
	type: string;
}

interface Tutorial {
	id: string;
	title: string;
	description: string;
	difficulty: string;
	duration: string;
	icon: React.ComponentType<{ size?: number }>;
	steps: TutorialStep[];
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const ConfigurationBox = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ConfigHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ConfigField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConfigLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConfigInput = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ConfigStatus = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const ConfigActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.$variant === 'primary' ? '#3b82f6' : '#d1d5db'};
  border-radius: 0.5rem;
  background: ${props => props.$variant === 'primary' ? '#3b82f6' : 'white'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#374151'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#2563eb' : '#f9fafb'};
    border-color: ${props => props.$variant === 'primary' ? '#2563eb' : '#9ca3af'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${({ $progress }) => $progress}%;
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
  color: #1f2937;
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
  color: #1f2937;
`;


const InteractiveTutorials = () => {
	// Centralized scroll management
	usePageScroll({ pageName: 'Interactive Tutorials', force: true });

	// UI Settings integration
	useUISettings();
	const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedTutorials, setCompletedTutorials] = useState(new Set<string>());

	// Configuration state
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [pingoneAuthUrl, setPingoneAuthUrl] = useState('https://auth.pingone.com');
	const [redirectUri, setRedirectUri] = useState('');

	// Load saved configuration on component mount
	useEffect(() => {
		const savedConfig = localStorage.getItem('pingone-tutorial-config');
		if (savedConfig) {
			try {
				const config = JSON.parse(savedConfig);
				setEnvironmentId(config.environmentId || '');
				setClientId(config.clientId || '');
				setClientSecret(config.clientSecret || '');
				setPingoneAuthUrl(config.pingoneAuthUrl || 'https://auth.pingone.com');
				setRedirectUri(config.redirectUri || '');
				v4ToastManager.showSuccess('Configuration loaded from saved settings');
			} catch (error) {
				console.warn('Failed to load saved configuration:', error);
				v4ToastManager.showError('Failed to load saved configuration');
			}
		}
	}, []);

	// Save configuration to localStorage
	const saveConfiguration = () => {
		try {
			const config = {
				environmentId,
				clientId,
				clientSecret,
				pingoneAuthUrl,
				redirectUri,
			};
			localStorage.setItem('pingone-tutorial-config', JSON.stringify(config));
			v4ToastManager.showSuccess('Configuration saved successfully! Your settings will persist across sessions.');
		} catch (error) {
			console.error('Failed to save configuration:', error);
			v4ToastManager.showError('Failed to save configuration. Please try again.');
		}
	};

	// Clear configuration from localStorage
	const clearConfiguration = () => {
		try {
			localStorage.removeItem('pingone-tutorial-config');
			setEnvironmentId('');
			setClientId('');
			setClientSecret('');
			setPingoneAuthUrl('https://auth.pingone.com');
			setRedirectUri('');
			v4ToastManager.showSuccess('Configuration cleared successfully!');
		} catch (error) {
			console.error('Failed to clear configuration:', error);
			v4ToastManager.showError('Failed to clear configuration. Please try again.');
		}
	};

	// Check if all required fields are filled
	const isConfigurationComplete = () => {
		return environmentId.trim() && clientId.trim() && clientSecret.trim() && pingoneAuthUrl.trim() && redirectUri.trim();
	};

	// Debug selectedTutorial state changes
	useEffect(() => {
		console.log(' selectedTutorial state changed:', selectedTutorial?.title || 'null');
	}, [selectedTutorial]);

	const tutorials = [
		{
			id: 'oauth-basics',
			title: 'OAuth 2.0 Fundamentals',
			description: 'Master the core concepts, history, and real-world applications of OAuth 2.0',
			difficulty: 'beginner',
			duration: '25 min',
			icon: FiShield,
			steps: [
				{
					title: 'What is OAuth 2.0?',
					content:
						'OAuth 2.0 is an industry-standard authorization framework that enables applications to obtain limited access to user accounts on an HTTP service. Think of it as a "valet key" for your car - it gives access to specific functions without handing over the master key.',
					code: `🔐 OAuth 2.0: The "Valet Key" of the Internet

Key Concepts:
• Resource Owner: The user who owns the data (you)
• Client: The application requesting access (third-party app)
• Authorization Server: Issues access tokens (PingOne)
• Resource Server: Hosts the protected resources (API)

Real-World Example:
You want to use a photo printing app that needs access to your Google Photos.
Instead of giving the app your Google password, OAuth lets you:
1. Grant specific permissions (read photos only)
2. Revoke access anytime
3. Never share your password

Why OAuth Matters:
✅ Secure - No password sharing
✅ Granular - Specific permissions only
✅ Revocable - Easy to remove access
✅ Standardized - Works across platforms`,
					type: 'info',
				},
				{
					title: 'OAuth 2.0 vs OAuth 1.0',
					content: 'Understanding the evolution from OAuth 1.0 to 2.0 and why the change was necessary.',
					code: `OAuth 1.0 vs OAuth 2.0 Comparison:

OAuth 1.0 (2010):
❌ Complex signature-based authentication
❌ Required cryptographic libraries
❌ Difficult to implement correctly
❌ No refresh token concept
❌ Limited to web applications

OAuth 2.0 (2012):
✅ Simple bearer token authentication
✅ Works with any transport protocol
✅ Easy to implement
✅ Built-in refresh token support
✅ Supports mobile, web, and desktop apps

Key Improvements:
• Simplified client authentication
• Better mobile support
• More flexible token types
• Improved security model
• Better error handling

Migration Timeline:
2010: OAuth 1.0 released
2012: OAuth 2.0 becomes RFC 6749
2015: OAuth 1.0 deprecation begins
2020: Most providers drop OAuth 1.0 support`,
					type: 'comparison',
				},
				{
					title: 'OAuth Roles Deep Dive',
					content: 'Detailed understanding of each role in the OAuth ecosystem and their responsibilities.',
					code: `🎭 OAuth 2.0 Roles & Responsibilities:

1. Resource Owner (User)
   • The person who owns the data
   • Grants or denies permission to access resources
   • Can revoke access at any time
   • Examples: You, your customers, your employees

2. Client Application
   • The application requesting access to resources
   • Can be web, mobile, desktop, or server-side
   • Must be registered with the authorization server
   • Examples: Your web app, mobile app, API client

3. Authorization Server
   • Issues access tokens after successful authentication
   • Validates client credentials
   • Manages user consent and permissions
   • Examples: PingOne, Auth0, Google, Microsoft

4. Resource Server
   • Hosts the protected resources
   • Accepts and validates access tokens
   • Serves data based on token permissions
   • Examples: Your API, Google APIs, Microsoft Graph

Real-World Flow:
User (Resource Owner) → "I want to use this app"
App (Client) → "I need access to your data"
PingOne (Authorization Server) → "User, do you approve?"
User → "Yes, but only for reading"
PingOne → "Here's a token with read-only access"
App → "Thanks! Now I can access your data"
Your API (Resource Server) → "Token valid, here's the data"`,
					type: 'diagram',
				},
				{
					title: 'OAuth Flows Overview',
					content: 'Understanding the different OAuth 2.0 flows and when to use each one.',
					code: `🚀 OAuth 2.0 Flows - Choose the Right One:

1. Authorization Code Flow (Most Secure)
   ✅ Server-side web applications
   ✅ Can securely store client secret
   ✅ Supports refresh tokens
   ✅ Most secure for confidential clients
   Example: Your company's web application

2. Authorization Code + PKCE (Recommended for SPAs)
   ✅ Single Page Applications (SPAs)
   ✅ Mobile applications
   ✅ Public clients (can't store secret)
   ✅ Enhanced security with PKCE
   Example: React/Vue/Angular apps

3. Client Credentials Flow (Machine-to-Machine)
   ✅ Service-to-service communication
   ✅ No user involved
   ✅ Backend API calls
   ✅ Microservice authentication
   Example: Your API calling another API

4. Device Authorization Flow (Limited Input)
   ✅ Smart TVs, IoT devices
   ✅ Command-line tools
   ✅ Devices with limited keyboards
   ✅ User authorizes on another device
   Example: Smart TV app, CLI tools

5. Implicit Flow (Deprecated)
   ❌ Not recommended (OAuth 2.1)
   ❌ Tokens exposed in browser
   ❌ No refresh token support
   ❌ Security vulnerabilities
   Example: Legacy SPAs (use PKCE instead)

Flow Selection Decision Tree:
┌─ Is there a user involved?
│  ├─ No → Client Credentials Flow
│  └─ Yes → Is it a web app?
│     ├─ Yes → Can store client secret?
│     │  ├─ Yes → Authorization Code Flow
│     │  └─ No → Authorization Code + PKCE
│     └─ No → Device Authorization Flow`,
					type: 'info',
				},
				{
					title: 'Access Tokens Deep Dive',
					content: 'Understanding access tokens, their structure, and how they work.',
					code: `🎫 Access Tokens - Your Digital Passport

What is an Access Token?
• A credential that represents authorization to access resources
• Short-lived (typically 1 hour)
• Bearer token (whoever has it can use it)
• Contains information about permissions and user

Token Structure (JWT Example):
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-123"
  },
  "payload": {
    "iss": "https://auth.pingone.com/env123",
    "sub": "user123",
    "aud": "your-client-id",
    "exp": 1640995200,
    "iat": 1640991600,
    "scope": "read:profile write:posts",
    "client_id": "your-client-id"
  },
  "signature": "base64-encoded-signature"
}

Token Types:
• Bearer Token: Most common, included in Authorization header
• MAC Token: Message Authentication Code (rarely used)
• JWT: Self-contained token with claims
• Opaque Token: Server-side reference token

Using Access Tokens:
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

Security Considerations:
✅ Always use HTTPS
✅ Store securely (not in localStorage for sensitive apps)
✅ Validate on every request
✅ Implement proper expiration
✅ Use short-lived tokens with refresh tokens`,
					type: 'code',
				},
				{
					title: 'Refresh Tokens & Token Management',
					content: 'Understanding refresh tokens and best practices for token management.',
					code: `🔄 Refresh Tokens - Keeping Access Alive

What are Refresh Tokens?
• Long-lived tokens used to obtain new access tokens
• Stored securely on the client
• Can be revoked by the user or server
• Never sent to resource servers

Refresh Token Flow:
1. Client receives access token + refresh token
2. Access token expires (typically 1 hour)
3. Client uses refresh token to get new access token
4. Server issues new access token (and optionally new refresh token)
5. Process repeats

Example Refresh Request:
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=def456...&
client_id=your-client-id&
client_secret=your-client-secret

Token Rotation (Best Practice):
• Issue new refresh token with each refresh
• Invalidate old refresh token
• Prevents token replay attacks
• Improves security

Token Storage Best Practices:
Web Apps:
• HttpOnly cookies for refresh tokens
• Memory storage for access tokens
• Never localStorage for sensitive data

Mobile Apps:
• Keychain/Keystore for refresh tokens
• Memory for access tokens
• Encrypted storage if needed

Server Apps:
• Secure environment variables
• Encrypted database storage
• Hardware security modules (HSMs)

Token Revocation:
• User can revoke access anytime
• Server can revoke compromised tokens
• Implement token blacklisting
• Monitor for suspicious activity`,
					type: 'security',
				},
				{
					title: 'OAuth Scopes & Permissions',
					content: 'Understanding OAuth scopes and how to design permission systems.',
					code: `🎯 OAuth Scopes - Granular Permission Control

What are Scopes?
• Define what the application can access
• Requested during authorization
• Granted by the user
• Enforced by the resource server

Common Scope Patterns:

1. Resource-based Scopes:
   read:profile    - Read user profile
   write:profile   - Update user profile
   read:posts      - Read user posts
   write:posts     - Create/update posts
   delete:posts    - Delete posts

2. Action-based Scopes:
   read           - Read access
   write          - Write access
   admin          - Administrative access
   user           - User-level access

3. Service-based Scopes:
   api:read       - API read access
   api:write      - API write access
   billing:read   - Billing information
   analytics:read - Analytics data

Scope Design Best Practices:
✅ Use least privilege principle
✅ Be specific about permissions
✅ Use consistent naming conventions
✅ Document scope meanings
✅ Implement scope validation

Example Scope Implementation:
// Request scopes during authorization
GET /oauth/authorize?
  client_id=myapp&
  scope=read:profile write:posts&
  redirect_uri=https://myapp.com/callback

// Validate scopes in API
app.get('/api/posts', (req, res) => {
  const token = req.headers.authorization;
  const scopes = getTokenScopes(token);
  
  if (!scopes.includes('read:posts')) {
    return res.status(403).json({ error: 'Insufficient scope' });
  }
  
  // Return posts
});

Scope Hierarchy Example:
admin > write > read
• admin includes write and read
• write includes read
• read is the most basic level

Advanced Scope Features:
• Dynamic scopes based on user role
• Time-limited scopes
• Conditional scopes based on context
• Scope delegation between services`,
					type: 'info',
				},
				{
					title: 'OAuth Security Threats & Mitigations',
					content: 'Understanding common OAuth security threats and how to protect against them.',
					code: `🛡️ OAuth Security - Threats & Protections

Top OAuth Security Threats:

1. Authorization Code Interception
   Threat: Attacker intercepts auth code during redirect
   Impact: Can exchange code for access token
   Mitigation: 
   • Use PKCE (Proof Key for Code Exchange)
   • Short-lived authorization codes (10 minutes)
   • HTTPS only for all requests
   • Validate redirect URI exactly

2. Access Token Theft
   Threat: Token stolen from client storage or network
   Impact: Attacker gains access to user data
   Mitigation:
   • Short-lived access tokens (1 hour)
   • Secure token storage
   • Token binding to client
   • Monitor for suspicious activity

3. CSRF Attacks
   Threat: Malicious site tricks user into unwanted actions
   Impact: Unauthorized actions on behalf of user
   Mitigation:
   • State parameter validation
   • SameSite cookie attribute
   • Origin header validation

4. Redirect URI Manipulation
   Threat: Attacker redirects tokens to malicious site
   Impact: Token theft and phishing attacks
   Mitigation:
   • Strict redirect URI validation
   • Pre-registered redirect URIs
   • URI scheme validation

5. Token Replay Attacks
   Threat: Stolen token used multiple times
   Impact: Unauthorized access continues
   Mitigation:
   • Token expiration
   • One-time use tokens
   • Token revocation mechanisms

6. Man-in-the-Middle Attacks
   Threat: Tokens intercepted in transit
   Impact: Complete compromise of OAuth flow
   Mitigation:
   • Always use HTTPS/TLS
   • Certificate pinning
   • HSTS headers

Security Checklist:
✅ Use HTTPS for all OAuth endpoints
✅ Implement PKCE for public clients
✅ Validate all parameters
✅ Use short-lived tokens
✅ Implement proper error handling
✅ Log security events
✅ Regular security audits
✅ Keep libraries updated

OAuth 2.1 Security Improvements:
• Removes implicit flow
• Requires PKCE for all flows
• Mandates HTTPS
• Stricter redirect URI validation
• Enhanced token security`,
					type: 'security',
				},
			],
		},
		{
			id: 'auth-code-flow',
			title: 'Authorization Code Flow',
			description: 'Master the most secure OAuth flow with comprehensive examples and real-world scenarios',
			difficulty: 'intermediate',
			duration: '35 min',
			icon: FiCode,
			steps: [
				{
					title: 'Authorization Code Flow Overview',
					content:
						'The Authorization Code flow is the gold standard of OAuth 2.0 flows, designed for applications that can securely store client credentials. It provides the highest level of security by keeping sensitive credentials server-side.',
					code: `🏆 Authorization Code Flow - The Gold Standard

Why It's the Most Secure:
✅ Client secret never exposed to browser
✅ Authorization code is short-lived (10 minutes)
✅ Tokens exchanged server-to-server
✅ Supports refresh tokens
✅ PKCE compatible for enhanced security

Perfect For:
• Server-side web applications
• Applications that can store client secrets securely
• High-security requirements
• Enterprise applications
• APIs that need user context

Flow Steps:
1. User clicks "Login with PingOne"
2. App redirects to PingOne authorization server
3. User authenticates and grants permission
4. PingOne redirects back with authorization code
5. App exchanges code for access token (server-side)
6. App uses access token to access protected resources

Real-World Example:
Your company's internal dashboard needs to access employee data from PingOne.
Instead of storing employee passwords, you use OAuth to get secure access tokens.`,
					type: 'info',
				},
				{
					title: 'Step 1: Authorization Request',
					content: 'The client initiates the flow by redirecting the user to the authorization server with specific parameters.',
					code: `🚀 Step 1: Authorization Request

The client redirects the user to PingOne with these parameters:

GET {pingoneAuthUrl}/{environmentId}/as/authorize?
  response_type=code&
  client_id={clientId}&
  redirect_uri={redirectUri}&
  scope=openid profile email&
  state={randomString}&
  nonce={randomString}&
  code_challenge={codeChallenge}&
  code_challenge_method=S256

Parameter Breakdown:
• response_type=code - Request authorization code (not token)
• client_id - Your registered application ID
• redirect_uri - Where to send user after authorization
• scope - What permissions to request
• state - CSRF protection (random string)
• nonce - Replay attack protection
• code_challenge - PKCE challenge (if using PKCE)
• code_challenge_method=S256 - PKCE method

Example Real URL:
https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as/authorize?
  response_type=code&
  client_id=myapp-12345&
  redirect_uri=https://myapp.com/callback&
  scope=openid profile email&
  state=abc123xyz789&
  nonce=def456uvw012

Security Notes:
✅ Always use HTTPS
✅ Validate redirect_uri exactly
✅ Use cryptographically secure random state
✅ Implement PKCE for additional security`,
					type: 'code',
				},
				{
					title: 'Step 2: User Authentication & Consent',
					content: 'The user authenticates with PingOne and grants permission to your application.',
					code: `👤 Step 2: User Authentication & Consent

What the User Sees:

┌─────────────────────────────────────────┐
│  🔐 PingOne Identity Platform          │
│                                         │
│  Username: [john.doe@company.com]      │
│  Password: [••••••••••••••••••••••••]  │
│                                         │
│  [ ] Remember me for 30 days           │
│                                         │
│  [     Sign In     ] [ Forgot Password ]│
│                                         │
└─────────────────────────────────────────┘

After Authentication:

┌─────────────────────────────────────────┐
│  🎯 Authorize Application              │
│                                         │
│  Application: My Company Dashboard     │
│  Developer: IT Department              │
│                                         │
│  This application wants to:            │
│  ✅ View your profile information      │
│  ✅ View your email address            │
│  ✅ Access your basic information      │
│                                         │
│  Expires: Never (until you revoke)     │
│                                         │
│  [ Allow ] [ Deny ]                     │
└─────────────────────────────────────────┘

User Experience Best Practices:
• Clear application name and developer
• Explain what permissions are requested
• Show data usage policies
• Provide easy way to deny access
• Remember user's choice if appropriate

Security Considerations:
• User can deny access at any time
• Permissions are clearly explained
• User can revoke access later
• No sensitive data shown during consent`,
					type: 'diagram',
				},
				{
					title: 'Step 3: Authorization Code Response',
					content: 'After successful authorization, PingOne redirects the user back with an authorization code.',
					code: `📨 Step 3: Authorization Code Response

Successful Response:
{redirectUri}?code=abc123def456&state=xyz789

Response Parameters:
• code - Authorization code (short-lived, single-use)
• state - Same value sent in request (CSRF protection)

Example Callback:
https://myapp.com/callback?
  code=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&
  state=abc123xyz789

Authorization Code Properties:
• Short-lived (typically 10 minutes)
• Single-use only
• Must be exchanged immediately
• Contains no user information
• Must be exchanged server-side

Error Responses:
{redirectUri}?error=access_denied&state=xyz789
{redirectUri}?error=invalid_request&state=xyz789
{redirectUri}?error=invalid_scope&state=xyz789

Common Error Codes:
• access_denied - User denied authorization
• invalid_request - Malformed request
• invalid_scope - Invalid scope requested
• server_error - Authorization server error
• temporarily_unavailable - Server temporarily down

Security Validation:
✅ Verify state parameter matches sent value
✅ Check for error parameters
✅ Validate authorization code format
✅ Exchange code immediately (don't store)`,
					type: 'code',
				},
				{
					title: 'Step 4: Token Exchange',
					content: 'The client exchanges the authorization code for access and refresh tokens.',
					code: `🔄 Step 4: Token Exchange

The client makes a server-to-server request to exchange the code for tokens:

POST {pingoneAuthUrl}/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(clientId:clientSecret)}

grant_type=authorization_code&
code={authorizationCode}&
redirect_uri={redirectUri}&
client_id={clientId}&
client_secret={clientSecret}&
code_verifier={codeVerifier}

Request Headers:
• Content-Type: application/x-www-form-urlencoded
• Authorization: Basic base64(clientId:clientSecret)

Request Body Parameters:
• grant_type=authorization_code - Specify flow type
• code - Authorization code from callback
• redirect_uri - Must match original request
• client_id - Your application ID
• client_secret - Your application secret
• code_verifier - PKCE verifier (if using PKCE)

Example Request:
POST https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic bXlhcHAtMTIzNDU6c2VjcmV0LWtleS0xMjM0NTY=

grant_type=authorization_code&
code=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&
redirect_uri=https://myapp.com/callback&
client_id=myapp-12345&
client_secret=secret-key-123456&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

Security Notes:
✅ Always use HTTPS
✅ Include client authentication
✅ Validate redirect_uri exactly
✅ Exchange code immediately
✅ Use PKCE for additional security`,
					type: 'request',
				},
				{
					title: 'Step 5: Token Response',
					content: 'The authorization server responds with access and refresh tokens.',
					code: `🎫 Step 5: Token Response

Successful Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "def456ghi789jkl012mno345pqr678stu901vwx234",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Token Response Fields:
• access_token - Bearer token for API access
• refresh_token - Long-lived token for getting new access tokens
• token_type - Always "Bearer" for OAuth 2.0
• expires_in - Access token lifetime in seconds (3600 = 1 hour)
• scope - Granted permissions
• id_token - JWT with user identity (if OpenID Connect)

Error Response Example:
{
  "error": "invalid_grant",
  "error_description": "The provided authorization code is invalid or expired"
}

Common Error Codes:
• invalid_grant - Invalid or expired authorization code
• invalid_client - Invalid client credentials
• invalid_scope - Requested scope not allowed
• unauthorized_client - Client not authorized for this flow
• unsupported_grant_type - Grant type not supported

Token Usage:
// Use access token for API calls
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

// Store refresh token securely for later use
// Use to get new access tokens when current one expires

Security Best Practices:
✅ Store tokens securely (not in localStorage for sensitive apps)
✅ Validate token expiration before use
✅ Implement token refresh logic
✅ Revoke tokens on logout
✅ Monitor for suspicious activity`,
					type: 'code',
				},
				{
					title: 'Step 6: Using Access Tokens',
					content: 'How to use access tokens to make API calls to protected resources.',
					code: `🔐 Step 6: Using Access Tokens

Making API Calls with Access Tokens:

// Example: Get user profile
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json

Response:
{
  "id": "user123",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "profile_picture": "https://example.com/avatar.jpg",
  "department": "Engineering",
  "role": "Senior Developer"
}

// Example: Update user profile
PUT /api/user/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Smith",
  "department": "Product Management"
}

Response:
{
  "id": "user123",
  "name": "John Smith",
  "email": "john.doe@company.com",
  "department": "Product Management",
  "updated_at": "2024-01-15T10:30:00Z"
}

Token Validation on Server:
// Validate token on every request
app.get('/api/user/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, publicKey);
    
    // Check expiration
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Check scope
    if (!decoded.scope.includes('profile')) {
      return res.status(403).json({ error: 'Insufficient scope' });
    }
    
    // Return user data
    res.json(getUserProfile(decoded.sub));
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

Error Handling:
• 401 Unauthorized - Invalid or expired token
• 403 Forbidden - Insufficient permissions
• 429 Too Many Requests - Rate limiting
• 500 Internal Server Error - Server error

Best Practices:
✅ Always validate tokens server-side
✅ Check token expiration
✅ Verify token scope
✅ Implement proper error handling
✅ Log security events
✅ Use HTTPS for all requests`,
					type: 'code',
				},
				{
					title: 'Step 7: Token Refresh',
					content: 'How to refresh expired access tokens using refresh tokens.',
					code: `🔄 Step 7: Token Refresh

When Access Token Expires:
Access tokens typically expire after 1 hour. Use refresh tokens to get new access tokens without re-authentication.

Refresh Token Request:
POST {pingoneAuthUrl}/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(clientId:clientSecret)}

grant_type=refresh_token&
refresh_token={refreshToken}&
client_id={clientId}&
client_secret={clientSecret}

Example Request:
POST https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic bXlhcHAtMTIzNDU6c2VjcmV0LWtleS0xMjM0NTY=

grant_type=refresh_token&
refresh_token=def456ghi789jkl012mno345pqr678stu901vwx234&
client_id=myapp-12345&
client_secret=secret-key-123456

Successful Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new456ghi789jkl012mno345pqr678stu901vwx234",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}

Token Rotation (Best Practice):
• New refresh token issued with each refresh
• Old refresh token becomes invalid
• Prevents token replay attacks
• Improves security

Implementation Example:
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch('/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const tokens = await response.json();
    
    // Store new tokens
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    return tokens.access_token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
}

Error Handling:
• invalid_grant - Refresh token expired or invalid
• invalid_client - Invalid client credentials
• unauthorized_client - Client not authorized

Security Notes:
✅ Refresh tokens are long-lived (30-90 days)
✅ Store refresh tokens securely
✅ Implement token rotation
✅ Monitor refresh token usage
✅ Revoke refresh tokens on logout`,
					type: 'security',
				},
				{
					title: 'PKCE (Proof Key for Code Exchange)',
					content: 'Understanding PKCE and how it enhances the Authorization Code flow security.',
					code: `🔐 PKCE - Enhanced Security for Authorization Code Flow

What is PKCE?
PKCE (Proof Key for Code Exchange) is a security extension that prevents authorization code interception attacks, especially important for public clients.

PKCE Flow:
1. Client generates code_verifier (random string)
2. Client creates code_challenge = SHA256(code_verifier)
3. Client sends code_challenge in authorization request
4. Authorization server stores code_challenge
5. Client sends code_verifier in token exchange
6. Server validates: SHA256(code_verifier) === stored_challenge

Code Generation:
// Generate code_verifier (43-128 characters)
const codeVerifier = generateRandomString(64);

// Generate code_challenge
const codeChallenge = base64url(sha256(codeVerifier));

// Store code_verifier securely
sessionStorage.setItem('code_verifier', codeVerifier);

Authorization Request with PKCE:
GET /oauth/authorize?
  response_type=code&
  client_id=myapp&
  redirect_uri=https://myapp.com/callback&
  scope=openid profile&
  state=xyz123&
  code_challenge=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&
  code_challenge_method=S256

Token Exchange with PKCE:
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=abc123&
redirect_uri=https://myapp.com/callback&
client_id=myapp&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

PKCE Benefits:
✅ Prevents authorization code interception
✅ No client secret required
✅ Works with public clients
✅ Enhanced security for SPAs
✅ Recommended by OAuth 2.1

When to Use PKCE:
• Single Page Applications (SPAs)
• Mobile applications
• Public clients (can't store secret)
• Any client that can't securely store credentials
• Enhanced security requirements

Implementation Example:
// Generate PKCE parameters
function generatePKCE() {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64url(sha256(codeVerifier));
  
  return { codeVerifier, codeChallenge };
}

// Use in authorization request
const { codeVerifier, codeChallenge } = generatePKCE();
sessionStorage.setItem('code_verifier', codeVerifier);

const authUrl = \`/oauth/authorize?
  response_type=code&
  client_id=\${clientId}&
  redirect_uri=\${redirectUri}&
  scope=\${scope}&
  state=\${state}&
  code_challenge=\${codeChallenge}&
  code_challenge_method=S256\`;

// Use in token exchange
const codeVerifier = sessionStorage.getItem('code_verifier');
const tokenRequest = {
  grant_type: 'authorization_code',
  code: authorizationCode,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier
};`,
					type: 'security',
				},
				{
					title: 'Common Pitfalls & Troubleshooting',
					content: 'Common issues when implementing Authorization Code flow and how to solve them.',
					code: `⚠️ Common Pitfalls & Troubleshooting

1. Redirect URI Mismatch
Problem: "redirect_uri_mismatch" error
Cause: Redirect URI doesn't exactly match registered URI
Solution:
• Check registered redirect URIs in PingOne console
• Ensure exact match (including trailing slashes)
• Use HTTPS in production
• Test with exact URLs

2. Invalid Client Credentials
Problem: "invalid_client" error
Cause: Wrong client_id or client_secret
Solution:
• Verify client_id in PingOne console
• Check client_secret is correct
• Ensure proper Base64 encoding for Basic auth
• Verify client is enabled

3. Authorization Code Expired
Problem: "invalid_grant" error with "code expired"
Cause: Authorization code not exchanged within 10 minutes
Solution:
• Exchange code immediately after receiving it
• Don't store authorization codes
• Implement proper error handling
• Redirect to re-authorize if needed

4. State Parameter Mismatch
Problem: CSRF attack or state validation failure
Cause: State parameter not properly validated
Solution:
• Generate cryptographically secure state
• Store state in session
• Validate state on callback
• Reject requests with invalid state

5. Scope Issues
Problem: "invalid_scope" or insufficient permissions
Cause: Requested scope not allowed or not granted
Solution:
• Check allowed scopes in PingOne console
• Request only necessary scopes
• Validate scope in token response
• Handle scope errors gracefully

6. HTTPS Issues
Problem: Mixed content or security warnings
Cause: Using HTTP instead of HTTPS
Solution:
• Always use HTTPS in production
• Configure proper SSL certificates
• Use secure redirect URIs
• Implement HSTS headers

Debugging Checklist:
✅ Check PingOne console for client configuration
✅ Verify redirect URIs are registered
✅ Test with curl or Postman
✅ Check browser network tab for errors
✅ Validate token format and expiration
✅ Implement proper error handling
✅ Use HTTPS for all requests
✅ Test with different browsers

Common Error Codes:
• invalid_request - Malformed request
• invalid_client - Invalid client credentials
• invalid_grant - Invalid or expired authorization code
• unauthorized_client - Client not authorized
• unsupported_grant_type - Grant type not supported
• invalid_scope - Invalid scope requested

Testing Tools:
• PingOne OAuth Playground
• OAuth 2.0 Debugger
• Postman OAuth 2.0 collection
• Browser developer tools
• Network monitoring tools`,
					type: 'validation',
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
client_id={clientId}&
client_secret={clientSecret}&
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
			id: 'openid-connect-basics',
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
					content: 'The state parameter prevents CSRF attacks by binding the authorization request to the callback.',
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
					content: 'The client redirects the user using the request_uri instead of individual parameters.',
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
		{
			id: 'oauth-advanced-concepts',
			title: 'Advanced OAuth Concepts',
			description: 'Deep dive into OAuth security, token management, and enterprise features',
			difficulty: 'advanced',
			duration: '40 min',
			icon: FiShield,
			steps: [
				{
					title: 'OAuth Security Threat Model',
					content: 'Understanding the various attack vectors and how OAuth mitigates them.',
					code: `🔒 OAuth Security Threats & Mitigations:

1. Authorization Code Interception
   Attack: Malicious app intercepts auth code during redirect
   Mitigation: PKCE, short-lived codes, HTTPS only

2. Access Token Theft
   Attack: Token stolen from client storage or network
   Mitigation: Short-lived tokens, secure storage, refresh rotation

3. CSRF Attacks
   Attack: Malicious site tricks user into unwanted actions
   Mitigation: State parameter validation

4. Redirect URI Manipulation
   Attack: redirect_uri parameter exploited for phishing
   Mitigation: Strict redirect URI validation

5. Token Replay Attacks
   Attack: Stolen token used multiple times
   Mitigation: Token expiration, one-time use tokens

6. Man-in-the-Middle Attacks
   Attack: Tokens intercepted in transit
   Mitigation: Always use HTTPS/TLS`,
					type: 'security',
				},
				{
					title: 'JWT Security Deep Dive',
					content: 'Advanced JWT security considerations and best practices.',
					code: `JWT Security Best Practices:

Algorithm Selection:
• Use RS256 (RSA + SHA256) for asymmetric signing
• Avoid HS256 for public clients (symmetric key)
• Never use 'none' algorithm

Key Management:
• Rotate signing keys regularly
• Use appropriate key sizes (2048-bit RSA minimum)
• Implement key revocation mechanisms
• Use JWKS (JSON Web Key Set) for key distribution

Token Validation:
• Always verify signature before trusting claims
• Check issuer (iss) claim matches expected value
• Validate audience (aud) claim
• Verify expiration (exp) and not-before (nbf) times
• Check token type and scope claims`,
					type: 'security',
				},
				{
					title: 'OAuth for Microservices',
					content: 'How OAuth enables secure service-to-service communication.',
					code: `Microservice OAuth Patterns:

1. API Gateway Pattern
   • Central authorization point
   • Token validation at gateway
   • Service-to-service calls use access tokens

2. Client Credentials for Service Auth
   • Services authenticate with client credentials
   • Machine-to-machine communication
   • No user context required

3. Token Propagation
   • Original user token passed to downstream services
   • Maintains user context across service calls
   • Requires careful token validation

4. Service Mesh Integration
   • Automatic token validation
   • Policy enforcement at network level
   • Centralized security configuration`,
					type: 'architecture',
				},
				{
					title: 'Enterprise OAuth Features',
					content: 'Advanced features for enterprise-scale OAuth deployments.',
					code: `Enterprise OAuth Capabilities:

Multi-Tenant Support:
• Separate authorization contexts per tenant
• Tenant-specific client configurations
• Isolated token issuance and validation

Federation & SSO:
• Integration with enterprise identity providers
• SAML/OAuth bridging
• Cross-domain single sign-on

Audit & Compliance:
• Comprehensive audit logging
• Token usage analytics
• Compliance reporting (GDPR, SOX, etc.)

High Availability:
• Token replication across data centers
• Geographic distribution
• Automatic failover mechanisms

Advanced Security:
• Threat detection and response
• Rate limiting and abuse prevention
• Integration with SIEM systems`,
					type: 'enterprise',
				},
			],
		},
		{
			id: 'oauth-implementation-guide',
			title: 'OAuth Implementation Guide',
			description: 'Step-by-step guide to implementing OAuth in your applications',
			difficulty: 'intermediate',
			duration: '45 min',
			icon: FiCode,
			steps: [
				{
					title: 'Planning Your OAuth Implementation',
					content: 'Essential planning steps before implementing OAuth in your application.',
					code: `📋 OAuth Implementation Planning

1. Define Your Requirements
   • What data do you need to access?
   • Who are your users (employees, customers, partners)?
   • What platforms will you support (web, mobile, desktop)?
   • What security level do you need?

2. Choose Your OAuth Flow
   • Server-side web app → Authorization Code Flow
   • SPA/Mobile app → Authorization Code + PKCE
   • API-to-API → Client Credentials Flow
   • IoT/CLI → Device Authorization Flow

3. Select Your Authorization Server
   • PingOne (recommended for enterprise)
   • Auth0 (good for startups)
   • AWS Cognito (if using AWS)
   • Self-hosted (for maximum control)

4. Design Your Token Strategy
   • Access token lifetime (1 hour recommended)
   • Refresh token lifetime (30-90 days)
   • Token storage strategy
   • Token rotation policy

5. Plan Your Security Measures
   • HTTPS everywhere
   • PKCE for public clients
   • State parameter validation
   • Proper error handling
   • Rate limiting
   • Monitoring and logging

6. Consider User Experience
   • Single sign-on (SSO)
   • Remember me functionality
   • Graceful error handling
   • Clear permission requests
   • Easy logout process`,
					type: 'info',
				},
				{
					title: 'Setting Up PingOne OAuth',
					content: 'Complete guide to configuring OAuth in PingOne Identity Platform.',
					code: `🔧 Setting Up PingOne OAuth

1. Create a PingOne Environment
   • Log into PingOne Admin Console
   • Create new environment
   • Note your Environment ID
   • Configure your domain

2. Create an OAuth Application
   • Go to Applications → Applications
   • Click "Add Application"
   • Choose "Web Application"
   • Configure application settings

3. Configure Application Settings
   Application Name: My Company App
   Description: Internal company dashboard
   Logo: Upload your app logo
   Redirect URIs:
     - https://myapp.com/callback
     - https://myapp.com/auth/callback
   Post Logout Redirect URIs:
     - https://myapp.com/logout
     - https://myapp.com/

4. Configure OAuth Settings
   Grant Types:
     ✅ Authorization Code
     ✅ Refresh Token
     ❌ Implicit (deprecated)
   
   Response Types:
     ✅ code
   
   Scopes:
     ✅ openid
     ✅ profile
     ✅ email
     ✅ address (optional)
     ✅ phone (optional)

5. Configure Token Settings
   Access Token Lifetime: 1 hour
   Refresh Token Lifetime: 30 days
   ID Token Lifetime: 1 hour
   Token Endpoint Auth Method: client_secret_post

6. Configure Security Settings
   PKCE: Required for public clients
   State Parameter: Required
   Nonce: Required for OpenID Connect
   HTTPS Only: Enabled
   CORS: Configure for your domains

7. Test Your Configuration
   • Use PingOne OAuth Playground
   • Test with different browsers
   • Verify token responses
   • Check error handling

8. Production Checklist
   ✅ HTTPS enabled
   ✅ Redirect URIs registered
   ✅ Client secret secured
   ✅ Monitoring enabled
   ✅ Error logging configured
   ✅ Rate limiting set up`,
					type: 'code',
				},
				{
					title: 'Frontend Implementation (React)',
					content: 'Complete React implementation of OAuth Authorization Code flow with PKCE.',
					code: `⚛️ React OAuth Implementation

1. Install Dependencies
npm install axios crypto-js

2. Create OAuth Service
// services/oauthService.js
import axios from 'axios';
import CryptoJS from 'crypto-js';

class OAuthService {
  constructor() {
    this.clientId = process.env.REACT_APP_CLIENT_ID;
    this.redirectUri = process.env.REACT_APP_REDIRECT_URI;
    this.authUrl = process.env.REACT_APP_AUTH_URL;
    this.tokenUrl = process.env.REACT_APP_TOKEN_URL;
  }

  // Generate PKCE parameters
  generatePKCE() {
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = CryptoJS.SHA256(codeVerifier)
      .toString(CryptoJS.enc.Base64)
      .replace(/+/g, '-')
      .replace(///g, '_')
      .replace(/=/g, '');
    
    return { codeVerifier, codeChallenge };
  }

  // Generate random string for PKCE
  generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  // Start OAuth flow
  startOAuth() {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = this.generateRandomString(32);
    
    // Store PKCE parameters
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('state', state);
    
    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = \`\${this.authUrl}?\${params.toString()}\`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      throw new Error(\`OAuth error: \${error}\`);
    }
    
    if (!code) {
      throw new Error('No authorization code received');
    }
    
    // Verify state parameter
    const storedState = sessionStorage.getItem('state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);
    
    // Clean up
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('state');
    
    return tokens;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    
    const response = await axios.post(this.tokenUrl, {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: codeVerifier
    });
    
    return response.data;
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    const response = await axios.post(this.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId
    });
    
    return response.data;
  }

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    window.location.href = '/';
  }
}

export default new OAuthService();`,
					type: 'code',
				},
				{
					title: 'Mobile Implementation (React Native)',
					content: 'Complete React Native implementation for mobile OAuth flows.',
					code: `📱 React Native OAuth Implementation

1. Install Dependencies
npm install react-native-auth0
# or
npm install @react-native-async-storage/async-storage
npm install react-native-keychain

2. Configure Auth0 (Alternative to PingOne)
// Auth0Service.js
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id'
});

export const Auth0Service = {
  // Login with OAuth
  login: () => {
    return auth0.webAuth.authorize({
      scope: 'openid profile email',
      audience: 'your-api-identifier'
    });
  },

  // Get user info
  getUserInfo: (accessToken) => {
    return auth0.auth.userInfo({ token: accessToken });
  },

  // Logout
  logout: () => {
    return auth0.webAuth.clearSession();
  }
};

3. Create OAuth Hook
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth0Service } from '../services/Auth0Service';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const credentials = await Auth0Service.login();
      const userInfo = await Auth0Service.getUserInfo(credentials.accessToken);
      
      setAccessToken(credentials.accessToken);
      setUser(userInfo);
      
      // Store tokens securely
      await AsyncStorage.setItem('access_token', credentials.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
      
      return credentials;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Auth0Service.logout();
      setUser(null);
      setAccessToken(null);
      
      // Clear stored data
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    accessToken,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
};

4. Create Login Component
// components/LoginScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = () => {
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to My App</Text>
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? 'Loading...' : 'Login with Auth0'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default LoginScreen;

5. Create Protected Screen
// components/ProfileScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  name: {
    fontSize: 18,
    marginBottom: 10
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ProfileScreen;

6. Main App Component
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';

const Stack = createStackNavigator();

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="Profile" component={ProfileScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;`,
					type: 'code',
				},
				{
					title: 'Testing & Debugging OAuth',
					content: 'Comprehensive guide to testing and debugging OAuth implementations.',
					code: `🧪 Testing & Debugging OAuth

1. OAuth Testing Tools
   • PingOne OAuth Playground
   • OAuth 2.0 Debugger (https://oauth2debugger.com)
   • Postman OAuth 2.0 collection
   • curl commands for testing
   • Browser developer tools

2. Manual Testing Checklist
   ✅ Authorization request works
   ✅ User can authenticate
   ✅ Consent screen displays correctly
   ✅ Authorization code is received
   ✅ Token exchange succeeds
   ✅ Access token is valid
   ✅ API calls work with token
   ✅ Token refresh works
   ✅ Logout clears tokens
   ✅ Error handling works

3. Automated Testing
   // OAuth test suite
   describe('OAuth Flow', () => {
     test('should start authorization flow', async () => {
       const authUrl = oauthService.getAuthorizationUrl();
       expect(authUrl).toContain('response_type=code');
       expect(authUrl).toContain('client_id=test-client');
     });

     test('should exchange code for tokens', async () => {
       const mockCode = 'test-auth-code';
       const tokens = await oauthService.exchangeCodeForTokens(mockCode);
       
       expect(tokens).toHaveProperty('access_token');
       expect(tokens).toHaveProperty('refresh_token');
       expect(tokens.token_type).toBe('Bearer');
     });

     test('should validate access token', async () => {
       const token = 'valid-access-token';
       const isValid = await oauthService.validateToken(token);
       expect(isValid).toBe(true);
     });
   });

4. Common Debugging Issues
   Problem: "redirect_uri_mismatch"
   Solution: Check registered redirect URIs in PingOne console
   
   Problem: "invalid_client"
   Solution: Verify client_id and client_secret
   
   Problem: "invalid_grant"
   Solution: Check authorization code expiration
   
   Problem: "insufficient_scope"
   Solution: Verify requested scopes are allowed

5. Debugging with Browser Tools
   // Check network requests
   // Look for OAuth endpoints
   // Verify request/response headers
   // Check for CORS issues
   // Monitor console errors

6. Logging and Monitoring
   // Add comprehensive logging
   console.log('OAuth request:', {
     url: authUrl,
     params: authParams,
     timestamp: new Date().toISOString()
   });

   // Monitor token usage
   console.log('Token usage:', {
     token_type: 'access_token',
     scope: decoded.scope,
     expires_in: decoded.exp - Math.floor(Date.now() / 1000)
   });

7. Security Testing
   • Test with invalid tokens
   • Test with expired tokens
   • Test with wrong scopes
   • Test CSRF protection
   • Test PKCE implementation
   • Test state parameter validation

8. Performance Testing
   • Measure token exchange time
   • Test with high concurrent users
   • Monitor memory usage
   • Test token refresh performance
   • Load test API endpoints

9. Production Monitoring
   • Set up error tracking (Sentry, Bugsnag)
   • Monitor OAuth success rates
   • Track token usage patterns
   • Set up alerts for failures
   • Monitor security events

10. Troubleshooting Checklist
   ✅ Check PingOne console configuration
   ✅ Verify redirect URIs match exactly
   ✅ Test with different browsers
   ✅ Check HTTPS configuration
   ✅ Validate token format
   ✅ Test error scenarios
   ✅ Monitor network requests
   ✅ Check CORS settings
   ✅ Verify PKCE implementation
   ✅ Test state parameter validation`,
					type: 'validation',
				},
			],
		},
		{
			id: 'oauth-troubleshooting',
			title: 'OAuth Troubleshooting Guide',
			description: 'Comprehensive troubleshooting guide for common OAuth issues',
			difficulty: 'intermediate',
			duration: '30 min',
			icon: FiShield,
			steps: [
				{
					title: 'Common OAuth Error Codes',
					content: 'Understanding and resolving common OAuth error codes and messages.',
					code: `🚨 Common OAuth Error Codes & Solutions

1. invalid_request
   Description: The request is missing a required parameter
   Common Causes:
   • Missing client_id
   • Missing redirect_uri
   • Missing response_type
   • Malformed request
   
   Solutions:
   • Check all required parameters are present
   • Validate parameter formats
   • Use proper URL encoding
   • Check request method (GET for auth, POST for token)

2. invalid_client
   Description: Client authentication failed
   Common Causes:
   • Wrong client_id
   • Wrong client_secret
   • Client not found
   • Client disabled
   
   Solutions:
   • Verify client_id in PingOne console
   • Check client_secret is correct
   • Ensure proper Base64 encoding for Basic auth
   • Verify client is enabled

3. invalid_grant
   Description: The provided authorization grant is invalid
   Common Causes:
   • Authorization code expired
   • Authorization code already used
   • Wrong redirect_uri in token exchange
   • Invalid refresh token
   
   Solutions:
   • Exchange authorization code immediately
   • Use authorization code only once
   • Match redirect_uri exactly
   • Check refresh token validity

4. unauthorized_client
   Description: The client is not authorized to use this flow
   Common Causes:
   • Flow not enabled for client
   • Wrong grant type
   • Client type mismatch
   
   Solutions:
   • Enable required flows in PingOne console
   • Use correct grant_type
   • Check client type configuration

5. unsupported_grant_type
   Description: The grant type is not supported
   Common Causes:
   • Wrong grant_type parameter
   • Grant type not enabled
   
   Solutions:
   • Use correct grant_type value
   • Enable grant type in PingOne console
   • Check supported grant types

6. invalid_scope
   Description: The requested scope is invalid
   Common Causes:
   • Scope not allowed for client
   • Invalid scope format
   • Scope not supported by server
   
   Solutions:
   • Check allowed scopes in PingOne console
   • Use correct scope format
   • Request only supported scopes

7. access_denied
   Description: User denied the authorization request
   Common Causes:
   • User clicked "Deny"
   • User cancelled login
   • Consent not granted
   
   Solutions:
   • Handle user denial gracefully
   • Provide clear permission explanation
   • Allow user to retry

8. server_error
   Description: The authorization server encountered an error
   Common Causes:
   • Server overloaded
   • Database issues
   • Configuration problems
   
   Solutions:
   • Retry after delay
   • Check server status
   • Contact support if persistent

9. temporarily_unavailable
   Description: The server is temporarily unavailable
   Common Causes:
   • Server maintenance
   • High load
   • Network issues
   
   Solutions:
   • Retry after delay
   • Check server status
   • Implement exponential backoff

10. redirect_uri_mismatch
    Description: The redirect URI doesn't match registered URI
    Common Causes:
    • Wrong redirect_uri
    • Missing redirect_uri registration
    • Case sensitivity issues
    
    Solutions:
    • Check registered redirect URIs
    • Use exact match (including case)
    • Register all redirect URIs`,
					type: 'validation',
				},
				{
					title: 'Debugging OAuth Flows',
					content: 'Step-by-step debugging process for OAuth implementation issues.',
					code: `🔍 OAuth Debugging Process

1. Enable Debug Logging
   // Add comprehensive logging
   console.log('OAuth Debug:', {
     step: 'authorization_request',
     url: authUrl,
     params: authParams,
     timestamp: new Date().toISOString()
   });

2. Check Network Requests
   // Use browser dev tools
   // Look for OAuth endpoints
   // Check request/response headers
   // Verify HTTPS usage
   // Check for CORS issues

3. Validate Configuration
   // Check PingOne console
   • Client ID and secret
   • Redirect URIs
   • Allowed scopes
   • Grant types
   • Token settings

4. Test Each Step
   Step 1: Authorization Request
   ✅ URL is correct
   ✅ Parameters are present
   ✅ HTTPS is used
   ✅ Redirect URI matches

   Step 2: User Authentication
   ✅ User can log in
   ✅ Consent screen shows
   ✅ User can grant permission

   Step 3: Authorization Response
   ✅ Code is received
   ✅ State parameter matches
   ✅ No error parameters

   Step 4: Token Exchange
   ✅ Request format is correct
   ✅ Client authentication works
   ✅ Response contains tokens

5. Common Issues & Solutions
   Issue: "CORS error"
   Solution: Configure CORS in PingOne console
   
   Issue: "Mixed content error"
   Solution: Use HTTPS for all requests
   
   Issue: "Token validation fails"
   Solution: Check JWT signature and claims
   
   Issue: "Scope validation fails"
   Solution: Verify requested scopes are allowed

6. Testing Tools
   // Use OAuth 2.0 Debugger
   https://oauth2debugger.com
   
   // Use Postman
   Import OAuth 2.0 collection
   Configure with your settings
   Test each step individually
   
   // Use curl
   curl -X POST "https://auth.pingone.com/env/token" \\
     -H "Content-Type: application/x-www-form-urlencoded" \\
     -d "grant_type=authorization_code&code=...&client_id=..."

7. Error Handling Best Practices
   // Implement proper error handling
   try {
     const tokens = await exchangeCodeForTokens(code);
     return tokens;
   } catch (error) {
     console.error('Token exchange failed:', error);
     
     if (error.error === 'invalid_grant') {
       // Redirect to re-authorize
       startOAuthFlow();
     } else if (error.error === 'invalid_client') {
       // Check client configuration
       console.error('Client configuration error');
     } else {
       // Generic error handling
       showError('Authentication failed. Please try again.');
     }
   }

8. Monitoring & Alerting
   // Set up monitoring
   • Track OAuth success rates
   • Monitor error frequencies
   • Alert on high error rates
   • Log security events
   • Track token usage patterns

9. Performance Debugging
   // Measure performance
   const startTime = Date.now();
   const tokens = await exchangeCodeForTokens(code);
   const duration = Date.now() - startTime;
   console.log('Token exchange took:', duration, 'ms');

10. Security Debugging
    // Check security measures
    ✅ HTTPS is used everywhere
    ✅ State parameter is validated
    ✅ PKCE is implemented correctly
    ✅ Tokens are stored securely
    ✅ Proper error messages (no sensitive info)`,
					type: 'validation',
				},
				{
					title: 'Production OAuth Issues',
					content: 'Common production issues and how to resolve them.',
					code: `🏭 Production OAuth Issues & Solutions

1. High Error Rates
   Symptoms:
   • Many 401/403 errors
   • Users can't log in
   • High bounce rate
   
   Causes:
   • Token validation issues
   • Clock skew problems
   • Key rotation issues
   • Rate limiting
   
   Solutions:
   • Check system clocks are synchronized
   • Verify JWT keys are up to date
   • Implement proper retry logic
   • Monitor rate limits
   • Check server logs

2. Token Validation Failures
   Symptoms:
   • "Invalid token" errors
   • Users logged out unexpectedly
   • API calls failing
   
   Causes:
   • JWT signature verification fails
   • Token expired
   • Wrong issuer/audience
   • Key rotation issues
   
   Solutions:
   • Verify JWT keys are current
   • Check token expiration logic
   • Validate issuer and audience claims
   • Implement key rotation handling

3. CORS Issues
   Symptoms:
   • Browser CORS errors
   • OAuth requests blocked
   • Cross-origin issues
   
   Causes:
   • CORS not configured
   • Wrong origin headers
   • Preflight request failures
   
   Solutions:
   • Configure CORS in PingOne console
   • Add proper CORS headers
   • Handle preflight requests
   • Test with different origins

4. Rate Limiting
   Symptoms:
   • 429 Too Many Requests errors
   • Slow response times
   • Users blocked from logging in
   
   Causes:
   • Too many requests per second
   • Brute force attacks
   • Poor client implementation
   
   Solutions:
   • Implement exponential backoff
   • Cache tokens appropriately
   • Monitor request patterns
   • Contact PingOne support if needed

5. SSL/TLS Issues
   Symptoms:
   • Certificate errors
   • Mixed content warnings
   • OAuth requests failing
   
   Causes:
   • Expired certificates
   • Wrong certificate configuration
   • HTTP instead of HTTPS
   
   Solutions:
   • Renew SSL certificates
   • Configure certificates properly
   • Use HTTPS everywhere
   • Implement HSTS headers

6. Database Issues
   Symptoms:
   • OAuth requests timing out
   • Inconsistent behavior
   • High error rates
   
   Causes:
   • Database connection issues
   • Slow queries
   • Database overload
   
   Solutions:
   • Check database connectivity
   • Optimize queries
   • Scale database resources
   • Implement connection pooling

7. Network Issues
   Symptoms:
   • Intermittent failures
   • Timeout errors
   • Slow response times
   
   Causes:
   • Network connectivity problems
   • DNS issues
   • Firewall blocking
   
   Solutions:
   • Check network connectivity
   • Verify DNS resolution
   • Check firewall rules
   • Implement retry logic

8. Monitoring & Alerting
   // Set up comprehensive monitoring
   const oauthMetrics = {
     successRate: 0.95, // 95% success rate
     averageResponseTime: 200, // 200ms average
     errorRate: 0.05, // 5% error rate
     tokenValidationTime: 50 // 50ms token validation
   };

   // Alert on issues
   if (oauthMetrics.successRate < 0.90) {
     alert('OAuth success rate below 90%');
   }

9. Performance Optimization
   // Cache JWKS keys
   const jwksClient = require('jwks-client');
   const client = jwksClient({
     jwksUri: 'https://auth.pingone.com/.well-known/jwks.json',
     cache: true,
     cacheMaxAge: 600000 // 10 minutes
   });

   // Implement token caching
   const tokenCache = new Map();
   function getCachedToken(key) {
     const cached = tokenCache.get(key);
     if (cached && cached.expires > Date.now()) {
       return cached.token;
     }
     return null;
   }

10. Disaster Recovery
    // Implement fallback mechanisms
    • Backup OAuth configuration
    • Document recovery procedures
    • Test failover scenarios
    • Monitor backup systems
    • Have rollback plans ready`,
					type: 'security',
				},
			],
		},
	];

	const startTutorial = (tutorial: Tutorial) => {
		console.log(' Starting tutorial:', tutorial.title);
		setSelectedTutorial(tutorial);
		setCurrentStep(0);
		v4ToastManager.showSuccess(`Started tutorial: ${tutorial.title}`);
	};

	const nextStep = () => {
		if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
			setCurrentStep(currentStep + 1);
			v4ToastManager.showSuccess(`Step ${currentStep + 2} of ${selectedTutorial.steps.length}`);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
			v4ToastManager.showSuccess(`Step ${currentStep} of ${selectedTutorial?.steps.length}`);
		}
	};

	const completeTutorial = () => {
		if (selectedTutorial) {
			setCompletedTutorials((prev) => new Set(Array.from(prev).concat(selectedTutorial.id)));
			setSelectedTutorial(null);
			setCurrentStep(0);
			v4ToastManager.showSuccess(`🎉 Tutorial completed: ${selectedTutorial.title}!`);
		}
	};


	const renderStepContent = (step: TutorialStep) => {
		// Replace placeholders with actual configuration values
		const replacePlaceholders = (code: string) => {
			return code
				.replace(/\{environmentId\}/g, environmentId || '{environmentId}')
				.replace(/\{clientId\}/g, clientId || '{clientId}')
				.replace(/\{clientSecret\}/g, clientSecret || '{clientSecret}')
				.replace(/\{pingoneAuthUrl\}/g, pingoneAuthUrl || '{pingoneAuthUrl}')
				.replace(/\{redirectUri\}/g, redirectUri || '{redirectUri}')
				.replace(/your_client_id/g, clientId || 'your_client_id')
				.replace(/https:\/\/your-app\.com\/callback/g, redirectUri || 'https://your-app.com/callback')
				.replace(/https:\/\/auth\.pingone\.com/g, pingoneAuthUrl || 'https://auth.pingone.com');
		};

		const processedCode = replacePlaceholders(step.code);

		switch (step.type) {
			case 'code':
				return (
					<div>
						<p style={{ color: '#1f2937', marginBottom: '1rem' }}>{step.content}</p>
						<CodeBlock>{processedCode}</CodeBlock>
					</div>
				);
			case 'diagram':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="diagram"
					/>
				);
			case 'info':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="info"
					/>
				);
			case 'security':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="security"
					/>
				);
			case 'validation':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="validation"
					/>
				);
			case 'comparison':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="comparison"
					/>
				);
			case 'jwt':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="jwt"
					/>
				);
			case 'claims':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="claims"
					/>
				);
			case 'discovery':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="discovery"
					/>
				);
			case 'architecture':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="architecture"
					/>
				);
			case 'enterprise':
				return (
					<TutorialTextFormatter
						content={processedCode}
						type="enterprise"
					/>
				);
			default:
				return (
					<div>
						<p style={{ color: '#1f2937', marginBottom: '1rem' }}>{step.content}</p>
						<CodeBlock>{processedCode}</CodeBlock>
					</div>
				);
		}
	};

	return (
		<Container>
			<FlowHeader 
				flowType="documentation"
				customConfig={{
					title: "Interactive Tutorials",
					subtitle: "Step-by-step guided learning paths to master OAuth 2.0 and OpenID Connect. Choose a tutorial and follow along with interactive examples and explanations.",
					icon: "📚"
				}}
			/>
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

			<ConfigurationBox>
				<ConfigHeader>
					<h2>
						<FiKey />
						PingOne Configuration
					</h2>
					<p>Configure your PingOne environment details to see real examples in the tutorials</p>
				</ConfigHeader>

				<ConfigGrid>
					<ConfigField>
						<ConfigLabel>
							<FiServer size={16} />
							Environment ID
						</ConfigLabel>
						<ConfigInput
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="e.g., 12345678-1234-1234-1234-123456789012"
						/>
						<ConfigStatus>Your PingOne environment identifier</ConfigStatus>
					</ConfigField>

					<ConfigField>
						<ConfigLabel>
							<FiUser size={16} />
							Client ID
						</ConfigLabel>
						<ConfigInput
							type="text"
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="e.g., 12345678-1234-1234-1234-123456789012"
						/>
						<ConfigStatus>Your OAuth client application ID</ConfigStatus>
					</ConfigField>

					<ConfigField>
						<ConfigLabel>
							<FiShield size={16} />
							Client Secret
						</ConfigLabel>
						<ConfigInput
							type="password"
							value={clientSecret}
							onChange={(e) => setClientSecret(e.target.value)}
							placeholder="e.g., abc123def456..."
						/>
						<ConfigStatus>Your OAuth client secret (keep secure)</ConfigStatus>
					</ConfigField>

					<ConfigField>
						<ConfigLabel>
							<FiGlobe size={16} />
							PingOne Auth URL
						</ConfigLabel>
						<ConfigInput
							type="url"
							value={pingoneAuthUrl}
							onChange={(e) => setPingoneAuthUrl(e.target.value)}
							placeholder="https://auth.pingone.com"
						/>
						<ConfigStatus>Your PingOne authorization server URL</ConfigStatus>
					</ConfigField>

					<ConfigField>
						<ConfigLabel>
							<FiExternalLink size={16} />
							Redirect URI
						</ConfigLabel>
						<ConfigInput
							type="url"
							value={redirectUri}
							onChange={(e) => setRedirectUri(e.target.value)}
							placeholder="https://your-app.com/callback"
						/>
						<ConfigStatus>Your application's callback URL</ConfigStatus>
					</ConfigField>
				</ConfigGrid>

				<ConfigActions>
					<ActionButton $variant="primary" onClick={saveConfiguration}>
						<FiSave size={16} />
						Save Configuration
					</ActionButton>
					<ActionButton $variant="secondary" onClick={clearConfiguration}>
						<FiTrash2 size={16} />
						Clear All
					</ActionButton>
				</ConfigActions>
			</ConfigurationBox>

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
											<ProgressFill $progress={progress} />
										</ProgressBar>
									</div>
								)}

								<StartButton
									disabled={!isConfigurationComplete()}
									onClick={(e) => {
										console.log(' Tutorial card clicked:', tutorial.title);
										e.preventDefault();
										if (isConfigurationComplete()) {
											startTutorial(tutorial);
										} else {
											v4ToastManager.showWarning('Please complete all configuration fields before starting a tutorial');
										}
									}}
									style={{
										opacity: !isConfigurationComplete() ? 0.5 : 1,
										cursor: !isConfigurationComplete() ? 'not-allowed' : 'pointer',
									}}
								>
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
							<CloseButton onClick={() => setSelectedTutorial(null)}>
								<FiX size={20} />
							</CloseButton>
						</ModalHeader>

						<StepContainer>
							<StepHeader>
								<div className="step-number">{currentStep + 1}</div>
								<h3>{selectedTutorial.steps[currentStep].title}</h3>
							</StepHeader>

							<StepContent>{renderStepContent(selectedTutorial.steps[currentStep])}</StepContent>

							<StepNavigationButtons
								currentStep={currentStep}
								totalSteps={selectedTutorial.steps.length}
								onPrevious={prevStep}
								onReset={() => {
									setCurrentStep(0);
									v4ToastManager.showSuccess('Tutorial reset to beginning');
								}}
								onNext={() => {
									if (currentStep === selectedTutorial.steps.length - 1) {
										completeTutorial();
									} else {
										nextStep();
									}
								}}
								canNavigateNext={true}
								isFirstStep={currentStep === 0}
								nextButtonText={currentStep === selectedTutorial.steps.length - 1 ? 'Complete Tutorial' : 'Next Step'}
							/>
						</StepContainer>
					</ModalContent>
				</TutorialModal>
			)}
		</Container>
	);
};

export default InteractiveTutorials;
