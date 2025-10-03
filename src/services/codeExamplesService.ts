// src/services/codeExamplesService.ts

export type SupportedLanguage = 'javascript' | 'typescript' | 'go' | 'ruby' | 'python' | 'ping-sdk';

export interface CodeExample {
	language: SupportedLanguage;
	title: string;
	code: string;
	description?: string;
	dependencies?: string[];
}

export interface FlowStepCodeExamples {
	stepId: string;
	stepName: string;
	examples: CodeExample[];
}

export interface CodeExamplesConfig {
	baseUrl: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string[];
	environmentId: string;
}

// Default configuration for code examples
const DEFAULT_CONFIG: CodeExamplesConfig = {
	baseUrl: 'https://auth.pingone.com',
	clientId: 'your-client-id',
	clientSecret: 'your-client-secret',
	redirectUri: 'https://your-app.com/callback',
	scopes: ['openid', 'profile', 'email'],
	environmentId: 'your-environment-id',
};

// JavaScript/Node.js examples
const getJavaScriptExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'javascript',
		title: 'Node.js with fetch',
		code: `// Install: npm install node-fetch
const fetch = require('node-fetch');

const config = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  clientSecret: '${config.clientSecret}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

// Authorization URL
const authUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize?\` +
  \`response_type=code&\` +
  \`client_id=\${config.clientId}&\` +
  \`redirect_uri=\${encodeURIComponent(config.redirectUri)}&\` +
  \`scope=\${config.scopes.join(' ')}&\` +
  \`state=random-state-value\`;

console.log('Visit this URL:', authUrl);`,
		dependencies: ['node-fetch'],
	},
	{
		language: 'javascript',
		title: 'Browser with fetch',
		code: `// Browser implementation
const config = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

// Generate authorization URL
function generateAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: generateRandomState()
  });
  
  return \`\${config.baseUrl}/\${config.environmentId}/as/authorize?\${params}\`;
}

// Exchange code for token
async function exchangeCodeForToken(code) {
  const response = await fetch(\`\${config.baseUrl}/\${config.environmentId}/as/token\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret
    })
  });
  
  return await response.json();
}`,
	},
];

// TypeScript examples
const getTypeScriptExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'typescript',
		title: 'TypeScript with axios',
		code: `// Install: npm install axios @types/node
import axios, { AxiosResponse } from 'axios';

interface OAuthConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  environmentId: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

const config: OAuthConfig = {
  baseUrl: '${config.baseUrl}',
  clientId: '${config.clientId}',
  clientSecret: '${config.clientSecret}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environmentId: '${config.environmentId}'
};

class OAuthClient {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  generateAuthUrl(state: string = this.generateState()): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state
    });
    
    return \`\${this.config.baseUrl}/\${this.config.environmentId}/as/authorize?\${params}\`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response: AxiosResponse<TokenResponse> = await axios.post(
      \`\${this.config.baseUrl}/\${this.config.environmentId}/as/token\`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );
    
    return response.data;
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Usage
const oauthClient = new OAuthClient(config);
const authUrl = oauthClient.generateAuthUrl();
console.log('Visit this URL:', authUrl);`,
		dependencies: ['axios', '@types/node'],
	},
];

// Go examples
const getGoExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'go',
		title: 'Go with net/http',
		code: `// Install: go mod init your-app
// go get github.com/golang/oauth2

package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "strings"
    "time"
)

type OAuthConfig struct {
    BaseURL       string
    ClientID      string
    ClientSecret  string
    RedirectURI   string
    Scopes        []string
    EnvironmentID string
}

type TokenResponse struct {
    AccessToken  string \`json:"access_token"\`
    TokenType    string \`json:"token_type"\`
    ExpiresIn    int    \`json:"expires_in"\`
    RefreshToken string \`json:"refresh_token,omitempty"\`
    Scope        string \`json:"scope"\`
}

func main() {
    config := OAuthConfig{
        BaseURL:       "${config.baseUrl}",
        ClientID:      "${config.clientId}",
        ClientSecret:  "${config.clientSecret}",
        RedirectURI:   "${config.redirectUri}",
        Scopes:        ${JSON.stringify(config.scopes)},
        EnvironmentID: "${config.environmentId}",
    }

    // Generate authorization URL
    authURL := generateAuthURL(config)
    fmt.Printf("Visit this URL: %s\\n", authURL)

    // Example: Exchange code for token (you'd get the code from callback)
    // token, err := exchangeCodeForToken(config, "authorization-code-here")
    // if err != nil {
    //     log.Fatal(err)
    // }
    // fmt.Printf("Access Token: %s\\n", token.AccessToken)
}

func generateAuthURL(config OAuthConfig) string {
    params := url.Values{}
    params.Add("response_type", "code")
    params.Add("client_id", config.ClientID)
    params.Add("redirect_uri", config.RedirectURI)
    params.Add("scope", strings.Join(config.Scopes, " "))
    params.Add("state", generateRandomState())

    return fmt.Sprintf("%s/%s/as/authorize?%s", 
        config.BaseURL, config.EnvironmentID, params.Encode())
}

func exchangeCodeForToken(config OAuthConfig, code string) (*TokenResponse, error) {
    data := url.Values{}
    data.Set("grant_type", "authorization_code")
    data.Set("code", code)
    data.Set("redirect_uri", config.RedirectURI)
    data.Set("client_id", config.ClientID)
    data.Set("client_secret", config.ClientSecret)

    resp, err := http.PostForm(
        fmt.Sprintf("%s/%s/as/token", config.BaseURL, config.EnvironmentID),
        data,
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var token TokenResponse
    if err := json.NewDecoder(resp.Body).Decode(&token); err != nil {
        return nil, err
    }

    return &token, nil
}

func generateRandomState() string {
    return fmt.Sprintf("%d", time.Now().UnixNano())
}`,
		dependencies: ['github.com/golang/oauth2'],
	},
];

// Ruby examples
const getRubyExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'ruby',
		title: 'Ruby with Net::HTTP',
		code: `# Install: gem install net-http
require 'net/http'
require 'uri'
require 'json'
require 'securerandom'

class OAuthClient
  def initialize(config)
    @base_url = config[:base_url]
    @client_id = config[:client_id]
    @client_secret = config[:client_secret]
    @redirect_uri = config[:redirect_uri]
    @scopes = config[:scopes]
    @environment_id = config[:environment_id]
  end

  def generate_auth_url
    params = {
      'response_type' => 'code',
      'client_id' => @client_id,
      'redirect_uri' => @redirect_uri,
      'scope' => @scopes.join(' '),
      'state' => generate_random_state
    }
    
    query_string = URI.encode_www_form(params)
    "\#{@base_url}/\#{@environment_id}/as/authorize?\#{query_string}"
  end

  def exchange_code_for_token(code)
    uri = URI("\#{@base_url}/\#{@environment_id}/as/token")
    
    request = Net::HTTP::Post.new(uri)
    request.set_form_data({
      'grant_type' => 'authorization_code',
      'code' => code,
      'redirect_uri' => @redirect_uri,
      'client_id' => @client_id,
      'client_secret' => @client_secret
    })

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    JSON.parse(response.body)
  end

  private

  def generate_random_state
    SecureRandom.hex(16)
  end
end

# Usage
config = {
  base_url: '${config.baseUrl}',
  client_id: '${config.clientId}',
  client_secret: '${config.clientSecret}',
  redirect_uri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  environment_id: '${config.environmentId}'
}

oauth_client = OAuthClient.new(config)
auth_url = oauth_client.generate_auth_url
puts "Visit this URL: \#{auth_url}"`,
		dependencies: ['net-http'],
	},
];

// Python examples
const getPythonExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'python',
		title: 'Python with requests',
		code: `# Install: pip install requests
import requests
import urllib.parse
import secrets
import json

class OAuthClient:
    def __init__(self, config):
        self.base_url = config['base_url']
        self.client_id = config['client_id']
        self.client_secret = config['client_secret']
        self.redirect_uri = config['redirect_uri']
        self.scopes = config['scopes']
        self.environment_id = config['environment_id']

    def generate_auth_url(self):
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'state': self._generate_random_state()
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{self.base_url}/{self.environment_id}/as/authorize?{query_string}"

    def exchange_code_for_token(self, code):
        url = f"{self.base_url}/{self.environment_id}/as/token"
        
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(url, data=data)
        return response.json()

    def _generate_random_state(self):
        return secrets.token_urlsafe(32)

# Usage
config = {
    'base_url': '${config.baseUrl}',
    'client_id': '${config.clientId}',
    'client_secret': '${config.clientSecret}',
    'redirect_uri': '${config.redirectUri}',
    'scopes': ${JSON.stringify(config.scopes)},
    'environment_id': '${config.environmentId}'
}

oauth_client = OAuthClient(config)
auth_url = oauth_client.generate_auth_url()
print(f"Visit this URL: {auth_url}")`,
		dependencies: ['requests'],
	},
	{
		language: 'python',
		title: 'Python with httpx (async)',
		code: `# Install: pip install httpx
import httpx
import asyncio
import urllib.parse
import secrets

class AsyncOAuthClient:
    def __init__(self, config):
        self.base_url = config['base_url']
        self.client_id = config['client_id']
        self.client_secret = config['client_secret']
        self.redirect_uri = config['redirect_uri']
        self.scopes = config['scopes']
        self.environment_id = config['environment_id']

    def generate_auth_url(self):
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'state': self._generate_random_state()
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{self.base_url}/{self.environment_id}/as/authorize?{query_string}"

    async def exchange_code_for_token(self, code):
        url = f"{self.base_url}/{self.environment_id}/as/token"
        
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data)
            return response.json()

    def _generate_random_state(self):
        return secrets.token_urlsafe(32)

# Usage
async def main():
    config = {
        'base_url': '${config.baseUrl}',
        'client_id': '${config.clientId}',
        'client_secret': '${config.clientSecret}',
        'redirect_uri': '${config.redirectUri}',
        'scopes': ${JSON.stringify(config.scopes)},
        'environment_id': '${config.environmentId}'
    }

    oauth_client = AsyncOAuthClient(config)
    auth_url = oauth_client.generate_auth_url()
    print(f"Visit this URL: {auth_url}")

# Run the async function
# asyncio.run(main())`,
		dependencies: ['httpx'],
	},
];

// Ping (ForgeRock) SDK examples
const getPingSDKExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'ping-sdk',
		title: 'Ping SDK for JavaScript - OIDC Login',
		code: `// Install: npm install @pingidentity/pingone-sdk-js
import { PingOne } from '@pingidentity/pingone-sdk-js';

// Initialize PingOne SDK for OIDC login
const pingOne = new PingOne({
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  baseUrl: '${config.baseUrl}'
});

// Start OIDC login flow
async function startOIDCLogin() {
  try {
    // Step 1: Start the OIDC login journey
    const result = await pingOne.login();
    
    if (result.success) {
      console.log('Login successful!');
      console.log('Access Token:', result.tokens?.accessToken);
      console.log('ID Token:', result.tokens?.idToken);
      console.log('User Info:', result.user);
      
      return {
        success: true,
        tokens: result.tokens,
        user: result.user
      };
    } else {
      console.error('Login failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('OIDC login error:', error);
    throw error;
  }
}

// Handle logout
async function logout() {
  try {
    await pingOne.logout();
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

// Check if user is authenticated
function isAuthenticated() {
  return pingOne.isAuthenticated();
}

// Get current user info
async function getCurrentUser() {
  try {
    if (pingOne.isAuthenticated()) {
      const user = await pingOne.getUserInfo();
      return user;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    throw error;
  }
}

// Complete OIDC login example
async function completeOIDCLogin() {
  try {
    // Check if already authenticated
    if (isAuthenticated()) {
      console.log('User already authenticated');
      const user = await getCurrentUser();
      return { success: true, user };
    }
    
    // Start OIDC login
    const result = await startOIDCLogin();
    return result;
  } catch (error) {
    console.error('OIDC login flow failed:', error);
    throw error;
  }
}`,
		description: 'OIDC Login using Ping SDK for JavaScript (centralized login)',
		dependencies: ['@pingidentity/pingone-sdk-js'],
	},
	{
		language: 'ping-sdk',
		title: 'Ping SDK for JavaScript - Auth Journeys',
		code: `// Install: npm install @pingidentity/pingone-sdk-js
import { PingOne } from '@pingidentity/pingone-sdk-js';

// Initialize PingOne SDK for Auth Journeys
const pingOne = new PingOne({
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  baseUrl: '${config.baseUrl}'
});

// Start authentication journey
async function startAuthJourney() {
  try {
    // Step 1: Start the authentication journey
    const journey = await pingOne.startJourney();
    
    if (journey.success) {
      console.log('Journey started successfully');
      console.log('Journey ID:', journey.journeyId);
      console.log('Next Step:', journey.nextStep);
      
      return journey;
    } else {
      console.error('Failed to start journey:', journey.error);
      return { success: false, error: journey.error };
    }
  } catch (error) {
    console.error('Auth journey error:', error);
    throw error;
  }
}

// Handle journey step
async function handleJourneyStep(stepData: any) {
  try {
    const result = await pingOne.handleJourneyStep(stepData);
    
    if (result.success) {
      console.log('Step completed successfully');
      console.log('Next Step:', result.nextStep);
      console.log('Tokens:', result.tokens);
      
      return result;
    } else {
      console.error('Step failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Journey step error:', error);
    throw error;
  }
}

// Complete authentication journey
async function completeAuthJourney() {
  try {
    // Step 1: Start journey
    const journey = await startAuthJourney();
    
    if (!journey.success) {
      return journey;
    }
    
    // Step 2: Handle journey steps (this would be in your UI handlers)
    // const stepResult = await handleJourneyStep(stepData);
    
    // Step 3: Complete journey when done
    // const finalResult = await pingOne.completeJourney();
    
    return journey;
  } catch (error) {
    console.error('Auth journey failed:', error);
    throw error;
  }
}

// Get journey status
async function getJourneyStatus(journeyId: string) {
  try {
    const status = await pingOne.getJourneyStatus(journeyId);
    console.log('Journey Status:', status);
    return status;
  } catch (error) {
    console.error('Failed to get journey status:', error);
    throw error;
  }
}`,
		description: 'Authentication Journeys using Ping SDK for JavaScript',
		dependencies: ['@pingidentity/pingone-sdk-js'],
	},
	{
		language: 'ping-sdk',
		title: 'Ping (ForgeRock) Login Widget',
		code: `// Install: npm install @pingidentity/pingone-login-widget
import { PingOneLoginWidget } from '@pingidentity/pingone-login-widget';

// Initialize Login Widget
const loginWidget = new PingOneLoginWidget({
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)},
  baseUrl: '${config.baseUrl}'
});

// Configure the widget
function configureWidget() {
  // Step 1: Configure CSS
  loginWidget.configureCSS({
    theme: 'light', // or 'dark'
    primaryColor: '#3b82f6',
    borderRadius: '8px'
  });
  
  // Step 2: Configure SDK
  loginWidget.configureSDK({
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    redirectUri: '${config.redirectUri}'
  });
}

// Instantiate the widget
function createLoginWidget(containerId: string) {
  // Step 3: Create widget instance
  const widget = loginWidget.create({
    container: containerId,
    journey: 'default' // or specific journey name
  });
  
  return widget;
}

// Start a journey
async function startJourney(widget: any) {
  try {
    // Step 4: Start the journey
    const result = await widget.startJourney();
    
    if (result.success) {
      console.log('Journey started successfully');
      console.log('Journey ID:', result.journeyId);
      return result;
    } else {
      console.error('Failed to start journey:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Journey start error:', error);
    throw error;
  }
}

// Subscribe to events
function subscribeToEvents(widget: any) {
  // Step 5: Subscribe to widget events
  widget.on('journey:start', (data: any) => {
    console.log('Journey started:', data);
  });
  
  widget.on('journey:step', (data: any) => {
    console.log('Journey step:', data);
  });
  
  widget.on('journey:complete', (data: any) => {
    console.log('Journey completed:', data);
    console.log('Tokens:', data.tokens);
    console.log('User:', data.user);
  });
  
  widget.on('journey:error', (error: any) => {
    console.error('Journey error:', error);
  });
}

// Complete Login Widget setup
function setupLoginWidget(containerId: string) {
  try {
    // Configure widget
    configureWidget();
    
    // Create widget instance
    const widget = createLoginWidget(containerId);
    
    // Subscribe to events
    subscribeToEvents(widget);
    
    // Start journey
    startJourney(widget);
    
    return widget;
  } catch (error) {
    console.error('Login Widget setup failed:', error);
    throw error;
  }
}

// HTML usage example:
// <div id="login-widget-container"></div>
// <script>
//   const widget = setupLoginWidget('login-widget-container');
// </script>`,
		description: 'Ping (ForgeRock) Login Widget for web applications',
		dependencies: ['@pingidentity/pingone-login-widget'],
	},
];

// RAR (Rich Authorization Requests) specific examples
const getRARExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'javascript',
		title: 'RAR Authorization Request - JavaScript',
		code: `// RAR (Rich Authorization Requests) - Authorization Request
const crypto = require('crypto');

// Define authorization details for RAR
const authorizationDetails = [
  {
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate', 'status'],
    datatypes: ['account', 'amount']
  },
  {
    type: 'account_information',
    locations: ['https://api.bank.com/accounts'],
    actions: ['read'],
    datatypes: ['account', 'balance']
  }
];

// Generate RAR authorization URL
function generateRARAuthUrl() {
  const baseUrl = '${config.baseUrl}/${config.environmentId}/as/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: '${config.clientId}',
    redirect_uri: '${config.redirectUri}',
    scope: '${config.scopes.join(' ')}',
    state: crypto.randomBytes(16).toString('hex'),
    authorization_details: JSON.stringify({
      type: 'oauth_authorization_details',
      authorization_details: authorizationDetails
    })
  });
  
  return \`\${baseUrl}?\${params.toString()}\`;
}

// Example usage
const authUrl = generateRARAuthUrl();
console.log('RAR Authorization URL:', authUrl);`,
		description: 'Generate RAR authorization URL with granular permissions',
		dependencies: ['crypto'],
	},
	{
		language: 'typescript',
		title: 'RAR Authorization Request - TypeScript',
		code: `// RAR (Rich Authorization Requests) - TypeScript
import { randomBytes } from 'crypto';

interface AuthorizationDetail {
  type: string;
  locations: string[];
  actions: string[];
  datatypes: string[];
}

interface RARConfig {
  baseUrl: string;
  environmentId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

// Define authorization details for RAR
const authorizationDetails: AuthorizationDetail[] = [
  {
    type: 'payment_initiation',
    locations: ['https://api.bank.com/payments'],
    actions: ['initiate', 'status'],
    datatypes: ['account', 'amount']
  },
  {
    type: 'account_information',
    locations: ['https://api.bank.com/accounts'],
    actions: ['read'],
    datatypes: ['account', 'balance']
  }
];

// Generate RAR authorization URL
function generateRARAuthUrl(config: RARConfig): string {
  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: randomBytes(16).toString('hex'),
    authorization_details: JSON.stringify({
      type: 'oauth_authorization_details',
      authorization_details: authorizationDetails
    })
  });
  
  return \`\${baseUrl}?\${params.toString()}\`;
}

// Example usage
const config: RARConfig = {
  baseUrl: '${config.baseUrl}',
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)}
};

const authUrl = generateRARAuthUrl(config);
console.log('RAR Authorization URL:', authUrl);`,
		description: 'TypeScript implementation of RAR authorization request',
		dependencies: ['@types/node'],
	},
	{
		language: 'go',
		title: 'RAR Authorization Request - Go',
		code: `// RAR (Rich Authorization Requests) - Go
package main

import (
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "net/url"
)

type AuthorizationDetail struct {
    Type      string   \`json:"type"\`
    Locations []string \`json:"locations"\`
    Actions   []string \`json:"actions"\`
    DataTypes []string \`json:"datatypes"\`
}

type RARConfig struct {
    BaseURL       string
    EnvironmentID string
    ClientID      string
    RedirectURI   string
    Scopes        []string
}

// Generate RAR authorization URL
func generateRARAuthURL(config RARConfig) (string, error) {
    // Define authorization details
    authDetails := []AuthorizationDetail{
        {
            Type:      "payment_initiation",
            Locations: []string{"https://api.bank.com/payments"},
            Actions:   []string{"initiate", "status"},
            DataTypes: []string{"account", "amount"},
        },
        {
            Type:      "account_information",
            Locations: []string{"https://api.bank.com/accounts"},
            Actions:   []string{"read"},
            DataTypes: []string{"account", "balance"},
        },
    }
    
    // Create RAR structure
    rarData := map[string]interface{}{
        "type":                 "oauth_authorization_details",
        "authorization_details": authDetails,
    }
    
    // Marshal to JSON
    rarJSON, err := json.Marshal(rarData)
    if err != nil {
        return "", err
    }
    
    // Generate random state
    stateBytes := make([]byte, 16)
    if _, err := rand.Read(stateBytes); err != nil {
        return "", err
    }
    state := base64.URLEncoding.EncodeToString(stateBytes)
    
    // Build URL
    baseURL := fmt.Sprintf("%s/%s/as/authorize", config.BaseURL, config.EnvironmentID)
    params := url.Values{
        "response_type":        {"code"},
        "client_id":           {config.ClientID},
        "redirect_uri":        {config.RedirectURI},
        "scope":               {fmt.Sprintf("%s", config.Scopes)},
        "state":               {state},
        "authorization_details": {string(rarJSON)},
    }
    
    return fmt.Sprintf("%s?%s", baseURL, params.Encode()), nil
}

func main() {
    config := RARConfig{
        BaseURL:       "${config.baseUrl}",
        EnvironmentID: "${config.environmentId}",
        ClientID:      "${config.clientId}",
        RedirectURI:   "${config.redirectUri}",
        Scopes:        ${JSON.stringify(config.scopes)},
    }
    
    authURL, err := generateRARAuthURL(config)
    if err != nil {
        fmt.Printf("Error: %v\\n", err)
        return
    }
    
    fmt.Printf("RAR Authorization URL: %s\\n", authURL)
}`,
		description: 'Go implementation of RAR authorization request',
		dependencies: [],
	},
	{
		language: 'python',
		title: 'RAR Authorization Request - Python',
		code: `# RAR (Rich Authorization Requests) - Python
import json
import secrets
import urllib.parse
from typing import List, Dict, Any

class RARClient:
    def __init__(self, base_url: str, environment_id: str, client_id: str, 
                 redirect_uri: str, scopes: List[str]):
        self.base_url = base_url
        self.environment_id = environment_id
        self.client_id = client_id
        self.redirect_uri = redirect_uri
        self.scopes = scopes
    
    def generate_rar_auth_url(self) -> str:
        # Define authorization details for RAR
        authorization_details = [
            {
                "type": "payment_initiation",
                "locations": ["https://api.bank.com/payments"],
                "actions": ["initiate", "status"],
                "datatypes": ["account", "amount"]
            },
            {
                "type": "account_information",
                "locations": ["https://api.bank.com/accounts"],
                "actions": ["read"],
                "datatypes": ["account", "balance"]
            }
        ]
        
        # Create RAR structure
        rar_data = {
            "type": "oauth_authorization_details",
            "authorization_details": authorization_details
        }
        
        # Generate random state
        state = secrets.token_urlsafe(16)
        
        # Build URL parameters
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "authorization_details": json.dumps(rar_data)
        }
        
        # Build complete URL
        base_url = f"{self.base_url}/{self.environment_id}/as/authorize"
        query_string = urllib.parse.urlencode(params)
        return f"{base_url}?{query_string}"

# Example usage
config = {
    "base_url": "${config.baseUrl}",
    "environment_id": "${config.environmentId}",
    "client_id": "${config.clientId}",
    "redirect_uri": "${config.redirectUri}",
    "scopes": ${JSON.stringify(config.scopes)}
}

client = RARClient(**config)
auth_url = client.generate_rar_auth_url()
print(f"RAR Authorization URL: {auth_url}")`,
		description: 'Python implementation of RAR authorization request',
		dependencies: [],
	},
];

// PAR (Pushed Authorization Requests) specific examples
const getPARExamples = (config: CodeExamplesConfig): CodeExample[] => [
	{
		language: 'javascript',
		title: 'PAR Push Request - JavaScript',
		code: `// PAR (Pushed Authorization Requests) - Push Request
const crypto = require('crypto');

// Push authorization request to server
async function pushAuthorizationRequest() {
  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;
  
  // Generate PKCE parameters
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  const requestData = new URLSearchParams({
    client_id: '${config.clientId}',
    redirect_uri: '${config.redirectUri}',
    response_type: 'code',
    scope: '${config.scopes.join(' ')}',
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`
      },
      body: requestData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('PAR successful!');
      console.log('Request URI:', result.request_uri);
      console.log('Expires in:', result.expires_in, 'seconds');
      
      // Store for later use
      return {
        request_uri: result.request_uri,
        expires_in: result.expires_in,
        code_verifier: codeVerifier
      };
    } else {
      throw new Error(\`PAR failed: \${result.error} - \${result.error_description}\`);
    }
  } catch (error) {
    console.error('PAR error:', error);
    throw error;
  }
}

// Generate authorization URL using request URI
function generateAuthUrlWithPAR(requestUri) {
  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;
  const params = new URLSearchParams({
    client_id: '${config.clientId}',
    request_uri: requestUri
  });
  
  return \`\${baseUrl}?\${params.toString()}\`;
}

// Complete PAR flow example
async function completePARFlow() {
  try {
    // Step 1: Push authorization request
    const parResult = await pushAuthorizationRequest();
    
    // Step 2: Generate authorization URL
    const authUrl = generateAuthUrlWithPAR(parResult.request_uri);
    console.log('Authorization URL:', authUrl);
    
    return {
      authUrl,
      codeVerifier: parResult.code_verifier,
      expiresIn: parResult.expires_in
    };
  } catch (error) {
    console.error('PAR flow failed:', error);
    throw error;
  }
}`,
		description: 'JavaScript implementation of PAR push request',
		dependencies: ['crypto'],
	},
	{
		language: 'typescript',
		title: 'PAR Push Request - TypeScript',
		code: `// PAR (Pushed Authorization Requests) - TypeScript
import { randomBytes, createHash } from 'crypto';

interface PARConfig {
  baseUrl: string;
  environmentId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface PARResponse {
  request_uri: string;
  expires_in: number;
}

interface PARResult {
  request_uri: string;
  expires_in: number;
  code_verifier: string;
}

// Push authorization request to server
async function pushAuthorizationRequest(config: PARConfig): Promise<PARResult> {
  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;
  
  // Generate PKCE parameters
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  const requestData = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`
      },
      body: requestData
    });
    
    const result: PARResponse = await response.json();
    
    if (response.ok) {
      console.log('PAR successful!');
      console.log('Request URI:', result.request_uri);
      console.log('Expires in:', result.expires_in, 'seconds');
      
      return {
        request_uri: result.request_uri,
        expires_in: result.expires_in,
        code_verifier: codeVerifier
      };
    } else {
      throw new Error(\`PAR failed: \${(result as any).error} - \${(result as any).error_description}\`);
    }
  } catch (error) {
    console.error('PAR error:', error);
    throw error;
  }
}

// Generate authorization URL using request URI
function generateAuthUrlWithPAR(config: PARConfig, requestUri: string): string {
  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    request_uri: requestUri
  });
  
  return \`\${baseUrl}?\${params.toString()}\`;
}

// Example usage
const config: PARConfig = {
  baseUrl: '${config.baseUrl}',
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: '${config.clientSecret}',
  redirectUri: '${config.redirectUri}',
  scopes: ${JSON.stringify(config.scopes)}
};

async function completePARFlow() {
  try {
    const parResult = await pushAuthorizationRequest(config);
    const authUrl = generateAuthUrlWithPAR(config, parResult.request_uri);
    console.log('Authorization URL:', authUrl);
    return { authUrl, codeVerifier: parResult.code_verifier };
  } catch (error) {
    console.error('PAR flow failed:', error);
    throw error;
  }
}`,
		description: 'TypeScript implementation of PAR push request',
		dependencies: ['@types/node'],
	},
	{
		language: 'go',
		title: 'PAR Push Request - Go',
		code: `// PAR (Pushed Authorization Requests) - Go
package main

import (
    "bytes"
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "time"
)

type PARConfig struct {
    BaseURL       string
    EnvironmentID string
    ClientID      string
    ClientSecret  string
    RedirectURI   string
    Scopes        []string
}

type PARResponse struct {
    RequestURI string \`json:"request_uri"\`
    ExpiresIn  int    \`json:"expires_in"\`
}

type PARResult struct {
    RequestURI   string
    ExpiresIn    int
    CodeVerifier string
}

// Generate PKCE code verifier and challenge
func generatePKCE() (string, string, error) {
    // Generate code verifier
    verifierBytes := make([]byte, 32)
    if _, err := rand.Read(verifierBytes); err != nil {
        return "", "", err
    }
    codeVerifier := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(verifierBytes)
    
    // Generate code challenge
    hash := sha256.Sum256([]byte(codeVerifier))
    codeChallenge := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])
    
    return codeVerifier, codeChallenge, nil
}

// Push authorization request to server
func pushAuthorizationRequest(config PARConfig) (*PARResult, error) {
    parEndpoint := fmt.Sprintf("%s/%s/as/par", config.BaseURL, config.EnvironmentID)
    
    // Generate PKCE parameters
    codeVerifier, codeChallenge, err := generatePKCE()
    if err != nil {
        return nil, err
    }
    
    // Generate random state
    stateBytes := make([]byte, 16)
    if _, err := rand.Read(stateBytes); err != nil {
        return nil, err
    }
    state := base64.URLEncoding.EncodeToString(stateBytes)
    
    // Prepare request data
    data := url.Values{
        "client_id":            {config.ClientID},
        "redirect_uri":         {config.RedirectURI},
        "response_type":        {"code"},
        "scope":                {fmt.Sprintf("%s", config.Scopes)},
        "state":                {state},
        "code_challenge":       {codeChallenge},
        "code_challenge_method": {"S256"},
    }
    
    // Create HTTP request
    req, err := http.NewRequest("POST", parEndpoint, bytes.NewBufferString(data.Encode()))
    if err != nil {
        return nil, err
    }
    
    // Set headers
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    auth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", config.ClientID, config.ClientSecret)))
    req.Header.Set("Authorization", fmt.Sprintf("Basic %s", auth))
    
    // Make request
    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    // Read response
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("PAR failed with status %d: %s", resp.StatusCode, string(body))
    }
    
    // Parse response
    var parResp PARResponse
    if err := json.Unmarshal(body, &parResp); err != nil {
        return nil, err
    }
    
    fmt.Printf("PAR successful!\\n")
    fmt.Printf("Request URI: %s\\n", parResp.RequestURI)
    fmt.Printf("Expires in: %d seconds\\n", parResp.ExpiresIn)
    
    return &PARResult{
        RequestURI:   parResp.RequestURI,
        ExpiresIn:    parResp.ExpiresIn,
        CodeVerifier: codeVerifier,
    }, nil
}

// Generate authorization URL using request URI
func generateAuthUrlWithPAR(config PARConfig, requestURI string) string {
    baseURL := fmt.Sprintf("%s/%s/as/authorize", config.BaseURL, config.EnvironmentID)
    params := url.Values{
        "client_id":   {config.ClientID},
        "request_uri": {requestURI},
    }
    return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

func main() {
    config := PARConfig{
        BaseURL:       "${config.baseUrl}",
        EnvironmentID: "${config.environmentId}",
        ClientID:      "${config.clientId}",
        ClientSecret:  "${config.clientSecret}",
        RedirectURI:   "${config.redirectUri}",
        Scopes:        ${JSON.stringify(config.scopes)},
    }
    
    // Push authorization request
    parResult, err := pushAuthorizationRequest(config)
    if err != nil {
        fmt.Printf("Error: %v\\n", err)
        return
    }
    
    // Generate authorization URL
    authURL := generateAuthUrlWithPAR(config, parResult.RequestURI)
    fmt.Printf("Authorization URL: %s\\n", authURL)
}`,
		description: 'Go implementation of PAR push request',
		dependencies: [],
	},
	{
		language: 'python',
		title: 'PAR Push Request - Python',
		code: `# PAR (Pushed Authorization Requests) - Python
import base64
import hashlib
import json
import secrets
import urllib.parse
from typing import Dict, Any, Optional

import httpx

class PARClient:
    def __init__(self, base_url: str, environment_id: str, client_id: str, 
                 client_secret: str, redirect_uri: str, scopes: list):
        self.base_url = base_url
        self.environment_id = environment_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.scopes = scopes
    
    def generate_pkce(self) -> tuple[str, str]:
        """Generate PKCE code verifier and challenge"""
        # Generate code verifier
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        
        # Generate code challenge
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        return code_verifier, code_challenge
    
    async def push_authorization_request(self) -> Dict[str, Any]:
        """Push authorization request to server"""
        par_endpoint = f"{self.base_url}/{self.environment_id}/as/par"
        
        # Generate PKCE parameters
        code_verifier, code_challenge = self.generate_pkce()
        
        # Generate random state
        state = secrets.token_urlsafe(16)
        
        # Prepare request data
        data = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        
        # Prepare headers
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {auth_b64}"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    par_endpoint,
                    data=data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print("PAR successful!")
                    print(f"Request URI: {result['request_uri']}")
                    print(f"Expires in: {result['expires_in']} seconds")
                    
                    return {
                        "request_uri": result["request_uri"],
                        "expires_in": result["expires_in"],
                        "code_verifier": code_verifier
                    }
                else:
                    error_data = response.json()
                    raise Exception(f"PAR failed: {error_data.get('error')} - {error_data.get('error_description')}")
                    
        except Exception as e:
            print(f"PAR error: {e}")
            raise
    
    def generate_auth_url_with_par(self, request_uri: str) -> str:
        """Generate authorization URL using request URI"""
        base_url = f"{self.base_url}/{self.environment_id}/as/authorize"
        params = {
            "client_id": self.client_id,
            "request_uri": request_uri
        }
        query_string = urllib.parse.urlencode(params)
        return f"{base_url}?{query_string}"

# Example usage
async def main():
    config = {
        "base_url": "${config.baseUrl}",
        "environment_id": "${config.environmentId}",
        "client_id": "${config.clientId}",
        "client_secret": "${config.clientSecret}",
        "redirect_uri": "${config.redirectUri}",
        "scopes": ${JSON.stringify(config.scopes)}
    }
    
    client = PARClient(**config)
    
    try:
        # Push authorization request
        par_result = await client.push_authorization_request()
        
        # Generate authorization URL
        auth_url = client.generate_auth_url_with_par(par_result["request_uri"])
        print(f"Authorization URL: {auth_url}")
        
        return {
            "auth_url": auth_url,
            "code_verifier": par_result["code_verifier"]
        }
    except Exception as e:
        print(f"PAR flow failed: {e}")
        raise

# Run the async function
# asyncio.run(main())`,
		description: 'Python implementation of PAR push request',
		dependencies: ['httpx'],
	},
];

// Flow step definitions
export const FLOW_STEPS = {
	'authorization-code': {
		step1: {
			id: 'step1',
			name: 'Generate Authorization URL',
			description: 'Create the authorization URL that users will visit to authenticate',
		},
		step2: {
			id: 'step2',
			name: 'Handle Authorization Callback',
			description: 'Process the authorization code returned from the callback',
		},
		step3: {
			id: 'step3',
			name: 'Exchange Code for Token',
			description: 'Exchange the authorization code for access and ID tokens',
		},
		step4: {
			id: 'step4',
			name: 'Use Access Token',
			description: 'Make API calls using the access token',
		},
	},
	'implicit': {
		step1: {
			id: 'step1',
			name: 'Generate Authorization URL',
			description: 'Create the authorization URL for implicit flow',
		},
		step2: {
			id: 'step2',
			name: 'Handle Token Response',
			description: 'Extract tokens from the URL fragment',
		},
		step3: {
			id: 'step3',
			name: 'Use Access Token',
			description: 'Make API calls using the access token',
		},
	},
	'client-credentials': {
		step1: {
			id: 'step1',
			name: 'Request Access Token',
			description: 'Request access token using client credentials',
		},
		step2: {
			id: 'step2',
			name: 'Use Access Token',
			description: 'Make API calls using the access token',
		},
	},
	'device-authorization': {
		step1: {
			id: 'step1',
			name: 'Request Device Code',
			description: 'Request device authorization code',
		},
		step2: {
			id: 'step2',
			name: 'Poll for Token',
			description: 'Poll the token endpoint until user completes authorization',
		},
		step3: {
			id: 'step3',
			name: 'Use Access Token',
			description: 'Make API calls using the access token',
		},
	},
	'rar': {
		'authorization-request': {
			id: 'authorization-request',
			name: 'RAR Authorization Request',
			description: 'Generate authorization URL with Rich Authorization Requests (RAR) parameters',
		},
		'token-exchange': {
			id: 'token-exchange',
			name: 'RAR Token Exchange',
			description: 'Exchange authorization code for access token with RAR claims',
		},
		'use-token': {
			id: 'use-token',
			name: 'Use RAR Access Token',
			description: 'Make API calls using access token with RAR authorization details',
		},
	},
	'par': {
		'push-authorization-request': {
			id: 'push-authorization-request',
			name: 'Push Authorization Request',
			description: 'Push authorization request to authorization server',
		},
		'authorization-request': {
			id: 'authorization-request',
			name: 'Authorization Request',
			description: 'Generate authorization URL using request URI from PAR',
		},
		'token-exchange': {
			id: 'token-exchange',
			name: 'Token Exchange',
			description: 'Exchange authorization code for access token',
		},
		'use-token': {
			id: 'use-token',
			name: 'Use Access Token',
			description: 'Make API calls using the access token',
		},
	},
};

// Main service class
export class CodeExamplesService {
	private config: CodeExamplesConfig;

	constructor(config?: Partial<CodeExamplesConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	updateConfig(config: Partial<CodeExamplesConfig>): void {
		this.config = { ...this.config, ...config };
	}

	getExamplesForStep(flowType: string, stepId: string): FlowStepCodeExamples | null {
		const flowSteps = FLOW_STEPS[flowType as keyof typeof FLOW_STEPS];
		if (!flowSteps || !flowSteps[stepId as keyof typeof flowSteps]) {
			return null;
		}

		const step = flowSteps[stepId as keyof typeof flowSteps] as { id: string; name: string; description: string };
		let examples: CodeExample[] = [
			...getJavaScriptExamples(this.config),
			...getTypeScriptExamples(this.config),
			...getGoExamples(this.config),
			...getRubyExamples(this.config),
			...getPythonExamples(this.config),
			...getPingSDKExamples(this.config),
		];

		// Add flow-specific examples
		if (flowType === 'rar') {
			examples = [...examples, ...getRARExamples(this.config)];
		} else if (flowType === 'par') {
			examples = [...examples, ...getPARExamples(this.config)];
		}

		return {
			stepId: step.id,
			stepName: step.name,
			examples,
		};
	}

	getAllStepsForFlow(flowType: string): FlowStepCodeExamples[] {
		const flowSteps = FLOW_STEPS[flowType as keyof typeof FLOW_STEPS];
		if (!flowSteps) {
			return [];
		}

		return Object.values(flowSteps).map((step: { id: string; name: string; description: string }) => {
			let examples: CodeExample[] = [
				...getJavaScriptExamples(this.config),
				...getTypeScriptExamples(this.config),
				...getGoExamples(this.config),
				...getRubyExamples(this.config),
				...getPythonExamples(this.config),
				...getPingSDKExamples(this.config),
			];

			// Add flow-specific examples
			if (flowType === 'rar') {
				examples = [...examples, ...getRARExamples(this.config)];
			} else if (flowType === 'par') {
				examples = [...examples, ...getPARExamples(this.config)];
			}

			return {
				stepId: step.id,
				stepName: step.name,
				examples,
			};
		});
	}

	getSupportedLanguages(): SupportedLanguage[] {
		return ['javascript', 'typescript', 'go', 'ruby', 'python', 'ping-sdk'];
	}

	filterExamplesByLanguage(examples: CodeExample[], languages: SupportedLanguage[]): CodeExample[] {
		return examples.filter(example => languages.includes(example.language));
	}
}

// Export singleton instance
export const codeExamplesService = new CodeExamplesService();

// Export utility functions
export const getCodeExamplesForStep = (flowType: string, stepId: string, config?: Partial<CodeExamplesConfig>) => {
	const service = new CodeExamplesService(config);
	return service.getExamplesForStep(flowType, stepId);
};

export const getAllCodeExamplesForFlow = (flowType: string, config?: Partial<CodeExamplesConfig>) => {
	const service = new CodeExamplesService(config);
	return service.getAllStepsForFlow(flowType);
};


