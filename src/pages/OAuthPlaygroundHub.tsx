// src/pages/OAuthPlaygroundHub.tsx
/**
 * Unified OAuth Playground Hub
 * Combines code editor, code generator, and code examples into one comprehensive page
 */

import React, { lazy, Suspense, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { CodeExamplesSection } from '../components/CodeExamplesSection';
import { FlowHeader } from '../services/flowHeaderService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

// Lazy load heavy components for better performance
const InteractiveCodeEditor = lazy(() => import('../components/InteractiveCodeEditor'));
const LiveRFCExplorer = lazy(() => import('../components/LiveRFCExplorer'));
const RealWorldScenarioBuilder = lazy(() => import('../components/RealWorldScenarioBuilder'));
const SecurityThreatTheater = lazy(() => import('../components/SecurityThreatTheater'));

const spin = keyframes`
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	min-height: 300px;
`;

const LoadingSpinner = styled.div`
	width: 60px;
	height: 60px;
	border: 4px solid ${V9_COLORS.BG.GRAY_LIGHT};
	border-top-color: ${V9_COLORS.PRIMARY.BLUE};
	border-radius: 50%;
	animation: ${spin} 1s linear infinite;
	margin-bottom: 1.5rem;
`;

const LoadingText = styled.div`
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	font-size: 1.1rem;
	font-weight: 500;
	text-align: center;
`;

const LoadingSubtext = styled.div`
	color: ${V9_COLORS.TEXT.GRAY_LIGHT};
	font-size: 0.9rem;
	margin-top: 0.5rem;
`;

const TabLoadingOverlay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem;
	background: ${V9_COLORS.BG.WHITE};
	border-radius: 1rem;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	min-height: 400px;
`;

const PageContainer = styled.div`
	min-height: 100vh;
	background: linear-gradient(
		135deg,
		${V9_COLORS.BG.GRAY_LIGHT} 0%,
		${V9_COLORS.TEXT.GRAY_LIGHTER} 100%
	);
`;

const HeroSection = styled.div`
	background: linear-gradient(135deg, #1e293b 0%, ${V9_COLORS.TEXT.GRAY_DARK} 100%);
	padding: 4rem 2rem;
	text-align: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const HeroTitle = styled.h1`;
color: $;
{
	V9_COLORS.BG.WHITE;
}
font - size;
: 3rem
font - weight;
: 800
margin: 0;
0;
1rem 0
background: linear -
	gradient(
		135deg,
		${V9_COLORS.PRIMARY.BLUE_LIGHT} 0%,
		${V9_COLORS.PRIMARY.BLUE} 50%,
		#f472b6 100%
	);
-webkit - background - clip;
: text
-webkit - text - fill - color;
: transparent
background - clip;
: text

@media (max-width: 768px)
{
	font - size;
	: 2rem
}
`;

const HeroSubtitle = styled.p`;
color: #cbd5e1;
font - size;
: 1.3rem
max - width;
: 800px
margin: 0;
auto;
2rem
line - height;
: 1.6

@media (max-width: 768px)
{
	font - size;
	: 1.1rem
}
`;

const FeatureGrid = styled.div`;
display: grid;
grid - template - columns;
: repeat(auto-fit, minmax(250px, 1fr))
gap:
1.5rem
max - width;
: 1000px
margin: 0;
auto;
padding: 0;
2rem
`;

const FeatureCard = styled.div<{ color: string }>`;
background: white;
padding:
1.5rem
border - radius;
: 1rem
border:
2px solid $
{
	({ color }) => color;
}
display: flex;
flex - direction;
: column
align - items;
: center
gap:
0.75rem
text - align;
: center
box - shadow;
: 0 4px 12px rgba(0, 0, 0, 0.08)
transition: all;
0.2s
cursor: pointer;

&:hover
{
	transform: translateY(-4px);
	box - shadow;
	: 0 8px 20px rgba(0, 0, 0, 0.15)
}
`;

const FeatureIcon = styled.div<{ color: string }>`;
width:
64px
height:
64px
border - radius;
: 50%
background: $;
{
	({ color }) => color;
}
display: flex;
align - items;
: center
justify - content;
: center
color: white;
font - size;
: 1.75rem
`;

const FeatureTitle = styled.div`;
font - weight;
: 700
font - size;
: 1.1rem
color: #
1e293b
`;

const FeatureDescription = styled.div`;
color: $;
{
	V9_COLORS.TEXT.GRAY_MEDIUM;
}
font - size;
: 0.9rem
line - height;
: 1.5
`;

const ContentSection = styled.div`;
max - width;
: 1400px
margin: 0;
auto;
padding:
2rem
`;

const SectionDivider = styled.div`;
height:
2px
background: linear - gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
margin:
3rem 0
`;

const StatsBar = styled.div`;
background: white;
padding:
2rem
border - radius;
: 1rem
margin:
2rem auto
max - width;
: 1000px
display: flex;
justify - content;
: space-around
gap:
2rem
flex - wrap;
: wrap
box - shadow;
: 0 4px 12px rgba(0, 0, 0, 0.08)
`;

const StatItem = styled.div`;
text - align;
: center
`;

const StatNumber = styled.div`;
font - size;
: 2.5rem
font - weight;
: 800
background: linear -
	gradient(
		135deg,
		${V9_COLORS.PRIMARY.GREEN} 0%,
		${V9_COLORS.PRIMARY.BLUE} 100%
	);
-webkit - background - clip;
: text
-webkit - text - fill - color;
: transparent
background - clip;
: text
`;

const StatLabel = styled.div`;
color: $;
{
	V9_COLORS.TEXT.GRAY_MEDIUM;
}
font - weight;
: 600
margin - top;
: 0.5rem
`;

const TabContainer = styled.div`
margin - bottom;
: 2rem
`;

const TabList = styled.div`
display: flex;
gap:
0.5rem
border - bottom;
: 2px solid $
{
	V9_COLORS.BORDER.GRAY;
}
margin - bottom;
: 2rem
flex - wrap;
: wrap
background: white;
padding:
0.5rem
border - radius;
: 0.5rem
`;

const Tab = styled.button<{ $active: boolean }>`;
padding:
1rem 2rem
background: $;
{
	({ $active }) => ($active ? V9_COLORS.PRIMARY.BLUE : 'transparent');
}
color: $;
{
	({ $active }) => ($active ? 'white' : V9_COLORS.TEXT.GRAY_DARK);
}
border: none;
border - radius;
: 0.375rem
cursor: pointer;
font - weight;
: 600
font - size;
: 1rem
transition: all;
0.2s
flex: 1;
min - width;
: 150px

&:hover
{
	background: $;
	({ $active }) => ($active ? V9_COLORS.PRIMARY.BLUE_DARK : V9_COLORS.BG.GRAY_LIGHT);
}

@media (max-width: 768px)
{
	padding:
	0.75rem 1rem
	font - size;
	: 0.875rem
}
`;

const EditorSection = styled.div`;
background: $;
{
	V9_COLORS.BG.WHITE;
}
border - radius;
: 1rem
padding:
2rem
margin - bottom;
: 2rem
box - shadow;
: 0 4px 12px rgba(0, 0, 0, 0.08)
`;

const SectionTitle = styled.h2`;
font - size;
: 1.75rem
font - weight;
: 700
color: $;
{
	V9_COLORS.TEXT.GRAY_DARK;
}
margin: 0;
0;
1rem 0
display: flex;
align - items;
: center
gap:
0.75rem
`;

const SectionDescription = styled.p`;
color: $;
{
	V9_COLORS.TEXT.GRAY_MEDIUM;
}
font - size;
: 1rem
line - height;
: 1.6
margin: 0;
0;
1.5rem 0
`;

const CallToAction = styled.div`;
margin - top;
: 4rem
padding:
2rem
background: white;
border - radius;
: 1rem
text - align;
: center
border:
3px solid $
{
	V9_COLORS.PRIMARY.GREEN;
}
box - shadow;
: 0 4px 12px rgba(0, 0, 0, 0.08)
`;

const CTATitle = styled.h2`;
color: $;
{
	V9_COLORS.PRIMARY.GREEN;
}
font - size;
: 1.75rem
margin - bottom;
: 1rem
`;

const CTADescription = styled.p`;
color: $;
{
	V9_COLORS.TEXT.GRAY_MEDIUM;
}
font - size;
: 1.1rem
line - height;
: 1.7
max - width;
: 700px
margin: 0;
auto;
2rem
`;

const CTAButtons = styled.div`;
display: flex;
gap:
1rem
justify - content;
: center
flex - wrap;
: wrap
`;

const CTAButton = styled.a<{ $primary?: boolean }>`;
padding:
1rem 2rem
background: $;
{
	({ $primary }) =>
		$primary
			? `linear-gradient(135deg, ${V9_COLORS.PRIMARY.GREEN} 0%, ${V9_COLORS.PRIMARY.GREEN_DARK} 100%)`
			: 'white';
}
color: $;
{
	({ $primary }) => ($primary ? 'white' : V9_COLORS.PRIMARY.GREEN);
}
border: $;
{
	({ $primary }) => ($primary ? 'none' : `2px solid ${V9_COLORS.PRIMARY.GREEN}`);
}
border - radius;
: 0.75rem
text - decoration;
: none
font - weight;
: 700
display: inline - flex;
align - items;
: center
gap:
0.5rem
transition: transform;
0.2s
cursor: pointer;

&:hover
{
	transform: translateY(-2px);
}
`;

type ActiveTab = 'editor' | 'scenarios' | 'examples' | 'rfc' | 'security';

const sampleCode = `; /**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * PingOne Implementation Example
 */

// 1. Generate PKCE code verifier and challenge
function generateCodeVerifier() {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return base64URLEncode(array);
}

async function generateCodeChallenge(verifier) {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return base64URLEncode(new Uint8Array(hash));
}

// 2. Build authorization URL
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

const authUrl = new URL('https://auth.pingone.com/{environmentId}/as/authorize');
authUrl.searchParams.set('client_id', 'your-client-id');
authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// 3. Redirect user to authorization URL
window.location.href = authUrl.toString();

// 4. Exchange authorization code for tokens (in callback handler)
async function exchangeCodeForTokens(code) {
	const response = await fetch('https://auth.pingone.com/{environmentId}/as/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code: code,
			client_id: 'your-client-id',
			redirect_uri: 'https://yourapp.com/callback',
			code_verifier: codeVerifier,
		}),
	});

	return await response.json();
}
`;

const codeExamples = [
	{
		title: 'Authorization Code with PKCE',
		description: 'Most secure flow for web and mobile applications',
		code: {
			javascript: `; // OAuth 2.0 Authorization Code Flow with PKCE
async function initiateAuthFlow() {
	// Generate PKCE parameters
	const codeVerifier = generateRandomString(128);
	const codeChallenge = await sha256(codeVerifier);

	// Store verifier for later use
	sessionStorage.setItem('code_verifier', codeVerifier);

	// Build authorization URL
	const authUrl = new URL('https://auth.pingone.com/{environmentId}/as/authorize');
	authUrl.searchParams.set('client_id', 'your-client-id');
	authUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', 'openid profile email');
	authUrl.searchParams.set('code_challenge', codeChallenge);
	authUrl.searchParams.set('code_challenge_method', 'S256');

	window.location.href = authUrl.toString();
}
`,
			dotnet: `; // .NET Implementation - Authorization Code with PKCE
public
async;
Task;
InitiateAuthFlow();
{
	// Generate PKCE parameters
	var codeVerifier = GenerateRandomString(128);
	var codeChallenge = await ComputeSha256Hash(codeVerifier);

	// Store verifier for later use
	HttpContext.Session.SetString('code_verifier', codeVerifier);

	// Build authorization URL
	var authUrl = new UriBuilder('https://auth.pingone.com/{environmentId}/as/authorize');
	var query = HttpUtility.ParseQueryString(string.Empty);
	query['client_id'] = 'your-client-id';
	query['redirect_uri'] = 'https://yourapp.com/callback';
	query['response_type'] = 'code';
	query['scope'] = 'openid profile email';
	query['code_challenge'] = codeChallenge;
	query['code_challenge_method'] = 'S256';
	authUrl.Query = query.ToString();

	Response.Redirect(authUrl.ToString());
}
`,
			go: `; // Go Implementation - Authorization Code with PKCE
func;
initiateAuthFlow();
string;
{
	// Generate PKCE parameters
	codeVerifier :
	= generateRandomString(128)
    codeChallenge := computeSha256Hash(codeVerifier)
    
    // Store verifier for later use
    session.Set("code_verifier", codeVerifier)
    
    // Build authorization URL
    authURL, _ := url.Parse("https://auth.pingone.com/{environmentId}/as/authorize")
    q := authURL.Query()
    q.Set("client_id", "your-client-id")
    q.Set("redirect_uri", "https://yourapp.com/callback")
    q.Set("response_type", "code")
    q.Set("scope", "openid profile email")
    q.Set("code_challenge", codeChallenge)
    q.Set("code_challenge_method", "S256")
    authURL.RawQuery = q.Encode()

	return authURL.String()
}
`,
		},
	},
	{
		title: 'Client Credentials Flow',
		description: 'Server-to-server authentication without user interaction',
		code: {
			javascript: `; // JavaScript - Client Credentials Flow
async function getAccessToken() {
	const response = await fetch('https://auth.pingone.com/{environmentId}/as/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + btoa('client-id:client-secret'),
		},
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			scope: 'read write',
		}),
	});

	const data = await response.json();
	return data.access_token;
}
`,
			dotnet: `; // .NET - Client Credentials Flow
public
async;
Task < string > GetAccessToken();
{
	using;
	var client = new HttpClient();
	var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes('client-id:client-secret'));
	client.DefaultRequestHeaders.Add("Authorization", $"Basic {credentials}");

	var formData = new Dictionary<string, string>();
	'grant_type', 'client_credentials';
	,
	'scope', 'read write';

	var response = await client.PostAsync(
		'https://auth.pingone.com/{environmentId}/as/token',
		new FormUrlEncodedContent(formData)
	);

	var data = await response.Content.ReadFromJsonAsync<TokenResponse>();
	return data.AccessToken;
}
`,
			go: `; // Go - Client Credentials Flow
func;
getAccessToken()(string, error);
{
	formData :
	= url.Values
	('grant_type');
	:
	('client_credentials');
	,
        "scope":
	('read write');
	,

	req, _;
	:= http.NewRequest("POST",
        "https://auth.pingone.com/{environmentId}/as/token",
        strings.NewReader(formData.Encode()))
    
    credentials := base64.StdEncoding.EncodeToString([]byte("client-id:client-secret"))
    req.Header.Set("Authorization", "Basic "+credentials)
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    
    client := &http.Client
	resp, err;
	:= client.Do(req)
	if err != nil {
        return "", err
    }
	defer;
	resp.Body.Close();

	var data;
	TokenResponse;
	json.NewDecoder(resp.Body).Decode(&data)
	return data.AccessToken, nil
}
`,
		},
	},
	{
		title: 'Token Introspection',
		description: 'Validate and get information about an access token',
		code: {
			javascript: `; // JavaScript - Token Introspection
async function introspectToken(accessToken) {
	const response = await fetch('https://auth.pingone.com/{environmentId}/as/introspect', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + btoa('client-id:client-secret'),
		},
		body: new URLSearchParams({
			token: accessToken,
		}),
	});

	const data = await response.json();
	// Returns: active, scope, client_id, username, exp, etc.
	return data;
}
`,
			dotnet: `; // .NET - Token Introspection
public
async;
Task<TokenInfo> IntrospectToken(string accessToken)
{
	using;
	var client = new HttpClient();
	var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes('client-id:client-secret'));
	client.DefaultRequestHeaders.Add("Authorization", $"Basic {credentials}");

	var formData = new Dictionary<string, string>();
	'token', accessToken;

	var response = await client.PostAsync(
		'https://auth.pingone.com/{environmentId}/as/introspect',
		new FormUrlEncodedContent(formData)
	);

	return await response.Content.ReadFromJsonAsync<TokenInfo>();
}
`,
			go: `; // Go - Token Introspection
func;
introspectToken(accessToken string) (*TokenInfo, error)
{
	formData :
	= url.Values
	('token');
	:
	accessToken;

	req, _;
	:= http.NewRequest("POST",
        "https://auth.pingone.com/{environmentId}/as/introspect",
        strings.NewReader(formData.Encode()))
    
    credentials := base64.StdEncoding.EncodeToString([]byte("client-id:client-secret"))
    req.Header.Set("Authorization", "Basic "+credentials)
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    
    client := &http.Client
	resp, err;
	:= client.Do(req)
	if err != nil {
        return nil, err
    }
	defer;
	resp.Body.Close();

	var info;
	TokenInfo;
	json.NewDecoder(resp.Body).Decode(&info)
	return &info, nil
}
`,
		},
	},
];

// Loading fallback component for Suspense
const TabLoadingFallback: React.FC<{ tabName: string }> = ({ tabName }) => (
	<LoadingContainer>
		<LoadingSpinner />
		<LoadingText>Loading {tabName}...</LoadingText>
		<LoadingSubtext>This may take a few seconds</LoadingSubtext>
	</LoadingContainer>
);

const OAuthPlaygroundHub: React.FC = () => {
	const [activeTab, setActiveTab] = useState<ActiveTab>('scenarios');

	return (
		<PageContainer>
			<FlowHeader flowId="oauth-playground-hub" />
			<HeroSection>
				<HeroTitle>OAuth Playground Hub</HeroTitle>
				<HeroSubtitle>
					Your complete resource for OAuth implementation: interactive code editor, real-world
					scenarios, multi-language examples, RFC specifications, and security simulations.
				</HeroSubtitle>
				<FeatureGrid>
					<FeatureCard color={V9_COLORS.PRIMARY.GREEN} onClick={() => setActiveTab('scenarios')}>
						<FeatureIcon
							color={`linear-gradient(135deg, ${V9_COLORS.PRIMARY.GREEN} 0%, ${V9_COLORS.PRIMARY.GREEN_DARK} 100%)`}
						>
							<span>⚡</span>
						</FeatureIcon>
						<FeatureTitle>Real-World Scenarios</FeatureTitle>
						<FeatureDescription>
							Banking, SaaS, Mobile, IoT — choose your use case and get pre-configured OAuth
							parameters
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color={V9_COLORS.PRIMARY.BLUE_DARK} onClick={() => setActiveTab('examples')}>
						<FeatureIcon
							color={`linear-gradient(135deg, ${V9_COLORS.PRIMARY.BLUE_DARK} 0%, ${V9_COLORS.PRIMARY.BLUE_DARK} 100%)`}
						>
							<span>💻</span>
						</FeatureIcon>
						<FeatureTitle>Multi-Language Examples</FeatureTitle>
						<FeatureDescription>
							JavaScript, .NET, Go — copy-paste production-ready code for any platform
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color={V9_COLORS.PRIMARY.BLUE} onClick={() => setActiveTab('editor')}>
						<FeatureIcon
							color={`linear-gradient(135deg, ${V9_COLORS.PRIMARY.BLUE} 0%, ${V9_COLORS.PRIMARY.BLUE_DARK} 100%)`}
						>
							<span>✏️</span>
						</FeatureIcon>
						<FeatureTitle>Interactive Editor</FeatureTitle>
						<FeatureDescription>
							Live code editing with syntax highlighting and OAuth flow templates
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color={V9_COLORS.PRIMARY.PURPLE} onClick={() => setActiveTab('rfc')}>
						<FeatureIcon
							color={`linear-gradient(135deg, ${V9_COLORS.PRIMARY.PURPLE} 0%, #7c3aed 100%)`}
						>
							<span>📖</span>
						</FeatureIcon>
						<FeatureTitle>Live RFC Explorer</FeatureTitle>
						<FeatureDescription>
							OAuth specs in plain English with real code examples and PingOne support notes
						</FeatureDescription>
					</FeatureCard>

					<FeatureCard color={V9_COLORS.PRIMARY.RED} onClick={() => setActiveTab('security')}>
						<FeatureIcon
							color={`linear-gradient(135deg, ${V9_COLORS.PRIMARY.RED} 0%, ${V9_COLORS.PRIMARY.RED_DARK} 100%)`}
						>
							<span>🛡️</span>
						</FeatureIcon>
						<FeatureTitle>Security Theater</FeatureTitle>
						<FeatureDescription>
							Watch CSRF, replay, and interception attacks in action — see how parameters protect
							you
						</FeatureDescription>
					</FeatureCard>
				</FeatureGrid>
			</HeroSection>

			<ContentSection>
				<StatsBar>
					<StatItem>
						<StatNumber>4</StatNumber>
						<StatLabel>Real-World Scenarios</StatLabel>
					</StatItem>
					<StatItem>
						<StatNumber>3</StatNumber>
						<StatLabel>Programming Languages</StatLabel>
					</StatItem>
					<StatItem>
						<StatNumber>8+</StatNumber>
						<StatLabel>OAuth Flows</StatLabel>
					</StatItem>
					<StatItem>
						<StatNumber>4</StatNumber>
						<StatLabel>Attack Simulations</StatLabel>
					</StatItem>
				</StatsBar>

				<TabContainer>
					<TabList>
						<Tab $active={activeTab === 'scenarios'} onClick={() => setActiveTab('scenarios')}>
							⚡ Scenarios
						</Tab>
						<Tab $active={activeTab === 'examples'} onClick={() => setActiveTab('examples')}>
							💻 Code Examples
						</Tab>
						<Tab $active={activeTab === 'editor'} onClick={() => setActiveTab('editor')}>
							✏️ Editor
						</Tab>
						<Tab $active={activeTab === 'rfc'} onClick={() => setActiveTab('rfc')}>
							📖 RFC Explorer
						</Tab>
						<Tab $active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
							🛡️ Security Theater
						</Tab>
					</TabList>

					{activeTab === 'scenarios' && (
						<div>
							<SectionTitle>⚡ Real-World Scenarios</SectionTitle>
							<SectionDescription>
								Choose from pre-configured industry scenarios. Each scenario provides tailored OAuth
								parameters, security recommendations, and PingOne-specific configurations.
							</SectionDescription>
							<Suspense fallback={<TabLoadingFallback tabName="Real-World Scenarios" />}>
								<RealWorldScenarioBuilder />
							</Suspense>
						</div>
					)}

					{activeTab === 'examples' && (
						<div>
							<SectionTitle>💻 Multi-Language Code Examples</SectionTitle>
							<SectionDescription>
								Production-ready code snippets in JavaScript, .NET, and Go. Copy-paste and adapt to
								your application. All examples follow OAuth 2.0 best practices and PingOne
								conventions.
							</SectionDescription>
							<CodeExamplesSection examples={codeExamples} />
						</div>
					)}

					{activeTab === 'editor' && (
						<EditorSection>
							<SectionTitle>✏️ Interactive Code Editor</SectionTitle>
							<SectionDescription>
								Edit and experiment with OAuth code in real-time. The editor provides syntax
								highlighting, auto-completion, and instant feedback for OAuth 2.0 implementations.
							</SectionDescription>
							<Suspense fallback={<TabLoadingFallback tabName="Code Editor" />}>
								<InteractiveCodeEditor
									initialCode={sampleCode}
									language="typescript"
									height="500px"
									readOnly={false}
									onChange={(code) => console.log('Code updated:', code.length)}
								/>
							</Suspense>
						</EditorSection>
					)}

					{activeTab === 'rfc' && (
						<div>
							<SectionTitle>📖 Live RFC Explorer</SectionTitle>
							<SectionDescription>
								OAuth 2.0 and OIDC specifications translated into plain English with real-world
								examples and PingOne implementation notes.
							</SectionDescription>
							<Suspense fallback={<TabLoadingFallback tabName="RFC Explorer" />}>
								<LiveRFCExplorer />
							</Suspense>
						</div>
					)}

					{activeTab === 'security' && (
						<div>
							<SectionTitle>🛡️ Security Threat Theater</SectionTitle>
							<SectionDescription>
								Interactive demonstrations of common OAuth attacks including CSRF, replay attacks,
								and token interception. Learn how proper parameter usage prevents each attack.
							</SectionDescription>
							<Suspense fallback={<TabLoadingFallback tabName="Security Theater" />}>
								<SecurityThreatTheater />
							</Suspense>
						</div>
					)}
				</TabContainer>

				<SectionDivider />

				<CallToAction>
					<CTATitle>🎓 Ready to Implement OAuth?</CTATitle>
					<CTADescription>
						You now have access to production-ready code, security best practices, and real-world
						scenarios. Choose a scenario or code example above, adapt it to your needs, and start
						building secure OAuth flows today!
					</CTADescription>
					<CTAButtons>
						<CTAButton
							href="https://docs.pingidentity.com/r/en-us/pingone/p1_access_tokens"
							target="_blank"
							rel="noopener noreferrer"
							$primary
						>
							<span>📖</span>
							PingOne Documentation
						</CTAButton>
						<CTAButton href="/flows/v9/oauth-authorization-code">
							<i className="bi bi-play-circle"></i>
							Try Live OAuth Flow
						</CTAButton>
					</CTAButtons>
				</CallToAction>
			</ContentSection>
		</PageContainer>
	);
};

export default OAuthPlaygroundHub;
