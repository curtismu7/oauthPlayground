// src/components/RealWorldScenarioBuilder.tsx
/**
 * Real-World Scenario Builder
 * Pre-built OAuth scenarios with auto-populated parameters and generated code
 */

import React, { useCallback, useState } from 'react';
import {
	FiCheckCircle,
	FiCode,
	FiCopy,
	FiDollarSign,
	FiExternalLink,
	FiGlobe,
	FiLock,
	FiShoppingCart,
	FiSmartphone,
} from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const BuilderContainer = styled.div`
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	border: 3px solid #10b981;
	box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
`;

const Title = styled.h2`
	color: #065f46;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.75rem;
`;

const Subtitle = styled.p`
	color: #047857;
	margin: 0 0 2rem 0;
	font-size: 1.05rem;
	line-height: 1.6;
`;

const ScenarioGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const ScenarioCard = styled.button<{ $selected: boolean }>`
	background: white;
	border: 3px solid ${({ $selected }) => ($selected ? '#10b981' : '#e5e7eb')};
	border-radius: 0.75rem;
	padding: 1.5rem;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;
	box-shadow: ${({ $selected }) =>
		$selected ? '0 8px 24px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};

	&:hover {
		transform: translateY(-4px);
		border-color: #10b981;
		box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
	}
`;

const ScenarioIcon = styled.div<{ color: string }>`
	width: 56px;
	height: 56px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({ color }) => color};
	color: white;
	font-size: 1.75rem;
	margin-bottom: 1rem;
`;

const ScenarioTitle = styled.div`
	color: #1e293b;
	font-weight: 700;
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
`;

const ScenarioDescription = styled.div`
	color: #64748b;
	font-size: 0.95rem;
	line-height: 1.5;
	margin-bottom: 1rem;
`;

const ScenarioTags = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const Tag = styled.span`
	padding: 0.25rem 0.75rem;
	background: #f1f5f9;
	color: #475569;
	border-radius: 1rem;
	font-size: 0.75rem;
	font-weight: 600;
`;

const ConfigPanel = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	border: 2px solid #d1d5db;
	margin-bottom: 2rem;
`;

const ConfigSection = styled.div`
	margin-bottom: 2rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h3`
	color: #1e293b;
	font-size: 1.1rem;
	font-weight: 700;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ParameterList = styled.div`
	display: grid;
	gap: 0.75rem;
`;

const Parameter = styled.div`
	display: grid;
	grid-template-columns: 180px 1fr;
	gap: 1rem;
	align-items: center;
	padding: 0.75rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border-left: 4px solid #3b82f6;
`;

const ParameterName = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	font-weight: 600;
	color: #1e40af;
	font-size: 0.9rem;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', monospace;
	color: #059669;
	font-size: 0.875rem;
	word-break: break-all;
`;

const WhyBox = styled.div`
	background: #fef3c7;
	border-left: 4px solid #f59e0b;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
`;

const WhyTitle = styled.div`
	font-weight: 700;
	color: #92400e;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const WhyText = styled.div`
	color: #78350f;
	line-height: 1.6;
	font-size: 0.9rem;
`;

const CodeTabs = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1rem;
	border-bottom: 2px solid #e5e7eb;
`;

const CodeTab = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1.5rem;
	border: none;
	background: ${({ $active }) => ($active ? '#10b981' : 'transparent')};
	color: ${({ $active }) => ($active ? 'white' : '#64748b')};
	font-weight: 600;
	cursor: pointer;
	border-radius: 0.5rem 0.5rem 0 0;
	transition: all 0.2s;

	&:hover {
		background: ${({ $active }) => ($active ? '#059669' : '#f1f5f9')};
	}
`;

const CodeBlock = styled.pre`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1.5rem;
	border-radius: 0.75rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	position: relative;
`;

const CopyButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	padding: 0.5rem 1rem;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	transition: all 0.2s;

	&:hover {
		background: #059669;
		transform: translateY(-2px);
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	border: none;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1rem;
	transition: all 0.2s;
	background: ${({ variant }) =>
		variant === 'secondary' ? 'white' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
	color: ${({ variant }) => (variant === 'secondary' ? '#059669' : 'white')};
	border: ${({ variant }) => (variant === 'secondary' ? '2px solid #10b981' : 'none')};

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
	}
`;

type Language = 'javascript' | 'python' | 'java' | 'csharp';

interface ScenarioConfig {
	id: string;
	icon: React.ReactNode;
	iconColor: string;
	title: string;
	description: string;
	tags: string[];
	parameters: {
		[key: string]: string;
	};
	whyItMatters: string;
	codeExamples: {
		[key in Language]: string;
	};
	industryExample: string;
}

const scenarios: ScenarioConfig[] = [
	{
		id: 'banking-mfa',
		icon: <FiDollarSign />,
		iconColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
		title: 'Banking App with MFA',
		description:
			'High-security financial application requiring multi-factor authentication and recent login verification',
		tags: ['PCI-DSS', 'High Security', 'MFA Required'],
		parameters: {
			response_type: 'code',
			scope: 'openid profile email',
			prompt: 'login',
			max_age: '300',
			acr_values: 'urn:pingidentity:strong_auth',
			code_challenge_method: 'S256',
			state: 'RANDOM_STATE_TOKEN',
			nonce: 'RANDOM_NONCE_VALUE',
		},
		whyItMatters:
			'Financial apps MUST force fresh authentication (max_age=300 = 5 min), require MFA (acr_values), and use PKCE for mobile apps. PCI-DSS compliance requires these security measures.',
		industryExample:
			'💳 Chase, Bank of America, and Wells Fargo use these exact parameters for their mobile banking apps.',
		codeExamples: {
			javascript: `// Banking App OAuth Configuration
import crypto from 'crypto';

// Generate PKCE for mobile/SPA security
const codeVerifier = crypto.randomBytes(32).toString('hex');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Generate security tokens
const state = crypto.randomBytes(32).toString('hex');
const nonce = crypto.randomBytes(32).toString('hex');

// Store for validation
sessionStorage.setItem('pkce_verifier', codeVerifier);
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('oauth_nonce', nonce);

const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\` +
  new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    prompt: 'login',          // Force re-authentication
    max_age: '300',           // 5 minutes max age
    acr_values: 'urn:pingidentity:strong_auth', // Require MFA
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    nonce: nonce,
  });

// Redirect to authentication
window.location.href = authUrl;`,
			python: `# Banking App OAuth Configuration
import hashlib
import secrets
import base64
from urllib.parse import urlencode

# Generate PKCE for security
code_verifier = secrets.token_urlsafe(32)
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip('=')

# Generate security tokens
state = secrets.token_urlsafe(32)
nonce = secrets.token_urlsafe(32)

# Store in session
session['pkce_verifier'] = code_verifier
session['oauth_state'] = state
session['oauth_nonce'] = nonce

# Build authorization URL
params = {
    'client_id': client_id,
    'response_type': 'code',
    'redirect_uri': redirect_uri,
    'scope': 'openid profile email',
    'prompt': 'login',
    'max_age': '300',
    'acr_values': 'urn:pingidentity:strong_auth',
    'code_challenge': code_challenge,
    'code_challenge_method': 'S256',
    'state': state,
    'nonce': nonce,
}

auth_url = f"https://auth.pingone.com/{env_id}/as/authorize?{urlencode(params)}"
return redirect(auth_url)`,
			java: `// Banking App OAuth Configuration
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public class BankingOAuthConfig {
    public String buildAuthUrl() throws Exception {
        // Generate PKCE
        SecureRandom random = new SecureRandom();
        byte[] codeVerifierBytes = new byte[32];
        random.nextBytes(codeVerifierBytes);
        String codeVerifier = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(codeVerifierBytes);
        
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(codeVerifier.getBytes());
        String codeChallenge = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(hash);
        
        // Generate tokens
        byte[] stateBytes = new byte[32];
        random.nextBytes(stateBytes);
        String state = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(stateBytes);
        
        // Store in session
        session.setAttribute("pkce_verifier", codeVerifier);
        session.setAttribute("oauth_state", state);
        
        // Build URL
        return String.format(
            "https://auth.pingone.com/%s/as/authorize?" +
            "client_id=%s" +
            "&response_type=code" +
            "&redirect_uri=%s" +
            "&scope=openid%%20profile%%20email" +
            "&prompt=login" +
            "&max_age=300" +
            "&acr_values=urn:pingidentity:strong_auth" +
            "&code_challenge=%s" +
            "&code_challenge_method=S256" +
            "&state=%s",
            envId, clientId, redirectUri, 
            codeChallenge, state
        );
    }
}`,
			csharp: `// Banking App OAuth Configuration
using System;
using System.Security.Cryptography;
using System.Text;

public class BankingOAuthConfig
{
    public string BuildAuthUrl()
    {
        // Generate PKCE
        var codeVerifier = GenerateRandomString(32);
        var codeChallenge = GenerateCodeChallenge(codeVerifier);
        
        // Generate security tokens
        var state = GenerateRandomString(32);
        var nonce = GenerateRandomString(32);
        
        // Store in session
        HttpContext.Session.SetString("pkce_verifier", codeVerifier);
        HttpContext.Session.SetString("oauth_state", state);
        HttpContext.Session.SetString("oauth_nonce", nonce);
        
        // Build URL
        var authUrl = $"https://auth.pingone.com/{envId}/as/authorize?" +
            $"client_id={clientId}" +
            $"&response_type=code" +
            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope=openid%20profile%20email" +
            $"&prompt=login" +
            $"&max_age=300" +
            $"&acr_values=urn:pingidentity:strong_auth" +
            $"&code_challenge={codeChallenge}" +
            $"&code_challenge_method=S256" +
            $"&state={state}" +
            $"&nonce={nonce}";
        
        return authUrl;
    }
    
    private string GenerateCodeChallenge(string verifier)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(verifier));
        return Convert.ToBase64String(hash)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}`,
		},
	},
	{
		id: 'saas-multi-tenant',
		icon: <FiGlobe />,
		iconColor: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
		title: 'Multi-Tenant SaaS Platform',
		description: 'Cloud software with multiple customer APIs requiring resource-specific tokens',
		tags: ['SaaS', 'Multi-API', 'Resource Indicators'],
		parameters: {
			response_type: 'code',
			scope: 'openid profile email api:read api:write',
			'resource[]': 'https://customerA.api.com, https://customerB.api.com',
			code_challenge_method: 'S256',
			state: 'RANDOM_STATE_TOKEN',
		},
		whyItMatters:
			"Multi-tenant SaaS apps need resource indicators (RFC 8707) to limit token scope. If CustomerA's token is stolen, it can't access CustomerB's data.",
		industryExample:
			'☁️ Salesforce, HubSpot, and Zendesk use resource indicators to isolate customer data.',
		codeExamples: {
			javascript: `// Multi-Tenant SaaS OAuth
import crypto from 'crypto';

// User wants to access multiple customer APIs
const customerApis = [
  'https://customerA.api.com',
  'https://customerB.api.com',
];

// Generate PKCE
const codeVerifier = crypto.randomBytes(32).toString('hex');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

const state = crypto.randomBytes(32).toString('hex');

sessionStorage.setItem('pkce_verifier', codeVerifier);
sessionStorage.setItem('oauth_state', state);

// Build URL with multiple resources (RFC 8707)
const params = new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: redirectUri,
  scope: 'openid profile email api:read api:write',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  state: state,
});

// Add each resource separately
customerApis.forEach(api => {
  params.append('resource', api);
});

const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\${params}\`;

// Access token will contain:
// { 
//   "aud": ["https://customerA.api.com", "https://customerB.api.com"],
//   "scope": "api:read api:write",
//   ...
// }

// Each API validates its URL is in the audience
function validateToken(token, apiUrl) {
  if (!token.aud.includes(apiUrl)) {
    throw new Error('Token not authorized for this API');
  }
}`,
			python: `# Multi-Tenant SaaS OAuth
import secrets
import hashlib
import base64
from urllib.parse import urlencode

# Customer APIs to access
customer_apis = [
    'https://customerA.api.com',
    'https://customerB.api.com',
]

# Generate PKCE
code_verifier = secrets.token_urlsafe(32)
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip('=')

state = secrets.token_urlsafe(32)

# Store in session
session['pkce_verifier'] = code_verifier
session['oauth_state'] = state

# Build authorization URL with resources
params = [
    ('client_id', client_id),
    ('response_type', 'code'),
    ('redirect_uri', redirect_uri),
    ('scope', 'openid profile email api:read api:write'),
    ('code_challenge', code_challenge),
    ('code_challenge_method', 'S256'),
    ('state', state),
]

# Add each resource
for api in customer_apis:
    params.append(('resource', api))

auth_url = f"https://auth.pingone.com/{env_id}/as/authorize?{urlencode(params)}"

# Token validation in API
def validate_token(token, api_url):
    if api_url not in token.get('aud', []):
        raise ValueError('Token not authorized for this API')`,
			java: `// Multi-Tenant SaaS OAuth
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

public class SaaSMultiTenantOAuth {
    public String buildAuthUrl(List<String> customerApis) throws Exception {
        // Generate PKCE
        SecureRandom random = new SecureRandom();
        byte[] verifierBytes = new byte[32];
        random.nextBytes(verifierBytes);
        String codeVerifier = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(verifierBytes);
        
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String codeChallenge = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(digest.digest(codeVerifier.getBytes()));
        
        byte[] stateBytes = new byte[32];
        random.nextBytes(stateBytes);
        String state = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(stateBytes);
        
        // Store in session
        session.setAttribute("pkce_verifier", codeVerifier);
        session.setAttribute("oauth_state", state);
        
        // Build URL with multiple resources
        StringBuilder url = new StringBuilder(
            String.format(
                "https://auth.pingone.com/%s/as/authorize?" +
                "client_id=%s" +
                "&response_type=code" +
                "&redirect_uri=%s" +
                "&scope=openid%%20profile%%20email%%20api:read%%20api:write" +
                "&code_challenge=%s" +
                "&code_challenge_method=S256" +
                "&state=%s",
                envId, clientId, URLEncoder.encode(redirectUri, "UTF-8"),
                codeChallenge, state
            )
        );
        
        // Add each resource
        for (String api : customerApis) {
            url.append("&resource=")
               .append(URLEncoder.encode(api, "UTF-8"));
        }
        
        return url.toString();
    }
    
    // Token validation
    public void validateToken(JsonObject token, String apiUrl) {
        JsonArray aud = token.getAsJsonArray("aud");
        boolean authorized = false;
        for (JsonElement elem : aud) {
            if (elem.getAsString().equals(apiUrl)) {
                authorized = true;
                break;
            }
        }
        if (!authorized) {
            throw new SecurityException("Token not authorized for this API");
        }
    }
}`,
			csharp: `// Multi-Tenant SaaS OAuth
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;

public class SaaSMultiTenantOAuth
{
    public string BuildAuthUrl(List<string> customerApis)
    {
        // Generate PKCE
        var codeVerifier = GenerateRandomString(32);
        var codeChallenge = GenerateCodeChallenge(codeVerifier);
        var state = GenerateRandomString(32);
        
        // Store in session
        HttpContext.Session.SetString("pkce_verifier", codeVerifier);
        HttpContext.Session.SetString("oauth_state", state);
        
        // Build base URL
        var baseUrl = $"https://auth.pingone.com/{envId}/as/authorize?" +
            $"client_id={clientId}" +
            $"&response_type=code" +
            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope=openid%20profile%20email%20api:read%20api:write" +
            $"&code_challenge={codeChallenge}" +
            $"&code_challenge_method=S256" +
            $"&state={state}";
        
        // Add each resource
        var resources = string.Join("&", customerApis.Select(
            api => $"resource={Uri.EscapeDataString(api)}"
        ));
        
        return $"{baseUrl}&{resources}";
    }
    
    // Token validation
    public void ValidateToken(JObject token, string apiUrl)
    {
        var aud = token["aud"]?.ToObject<List<string>>();
        if (aud == null || !aud.Contains(apiUrl))
        {
            throw new SecurityException("Token not authorized for this API");
        }
    }
}`,
		},
	},
	{
		id: 'mobile-ecommerce',
		icon: <FiShoppingCart />,
		iconColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
		title: 'Mobile E-Commerce App',
		description:
			'Native mobile shopping app requiring secure OAuth with offline access for order tracking',
		tags: ['Mobile', 'PKCE Required', 'Offline Access'],
		parameters: {
			response_type: 'code',
			scope: 'openid profile email offline_access',
			code_challenge_method: 'S256',
			prompt: 'consent',
			state: 'RANDOM_STATE_TOKEN',
		},
		whyItMatters:
			'Mobile apps CANNOT securely store client secrets. PKCE is MANDATORY. offline_access scope provides refresh tokens for persistent login.',
		industryExample:
			'🛒 Amazon, eBay, and Shopify mobile apps use PKCE + offline_access for seamless shopping.',
		codeExamples: {
			javascript: `// Mobile E-Commerce OAuth (React Native)
import * as Crypto from 'expo-crypto';
import * as AuthSession from 'expo-auth-session';

// PKCE is REQUIRED for mobile apps (no client_secret!)
async function startMobileOAuth() {
  // Generate PKCE
  const codeVerifier = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString(36)
  );
  
  const codeChallenge = codeVerifier; // In real app, use proper base64url encoding
  
  const state = Math.random().toString(36).substring(7);
  
  // Store securely
  await SecureStore.setItemAsync('pkce_verifier', codeVerifier);
  await SecureStore.setItemAsync('oauth_state', state);
  
  // Build authorization request
  const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\` +
    new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: 'myapp://callback', // App deep link
      scope: 'openid profile email offline_access', // offline_access for refresh token
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent', // Show what permissions are being granted
      state: state,
    });
  
  // Open in-app browser
  const result = await AuthSession.startAsync({
    authUrl: authUrl,
  });
  
  if (result.type === 'success') {
    // Validate state
    const returnedState = result.params.state;
    const expectedState = await SecureStore.getItemAsync('oauth_state');
    
    if (returnedState !== expectedState) {
      throw new Error('State mismatch - possible CSRF attack!');
    }
    
    // Exchange code for tokens
    const code = result.params.code;
    const verifier = await SecureStore.getItemAsync('pkce_verifier');
    
    const tokenResponse = await fetch(
      \`https://auth.pingone.com/\${envId}/as/token\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'myapp://callback',
          client_id: clientId,
          code_verifier: verifier, // Proves we initiated the flow
        }),
      }
    );
    
    const tokens = await tokenResponse.json();
    
    // Store tokens securely
    await SecureStore.setItemAsync('access_token', tokens.access_token);
    await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
    
    return tokens;
  }
}

// Refresh token when expired
async function refreshTokens() {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  
  const response = await fetch(
    \`https://auth.pingone.com/\${envId}/as/token\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    }
  );
  
  const tokens = await response.json();
  await SecureStore.setItemAsync('access_token', tokens.access_token);
  
  return tokens;
}`,
			python: `# Mobile E-Commerce OAuth (Flutter/Python Backend)
import secrets
import hashlib
import base64
import requests

class MobileOAuthHandler:
    def __init__(self, env_id, client_id, redirect_uri):
        self.env_id = env_id
        self.client_id = client_id
        self.redirect_uri = redirect_uri
    
    def start_authorization(self):
        """Generate authorization URL for mobile app"""
        # Generate PKCE (REQUIRED for mobile)
        code_verifier = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')
        
        state = secrets.token_urlsafe(32)
        
        # Return these to mobile app for storage
        auth_data = {
            'code_verifier': code_verifier,
            'state': state,
            'auth_url': self._build_auth_url(code_challenge, state),
        }
        
        return auth_data
    
    def _build_auth_url(self, code_challenge, state):
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'redirect_uri': self.redirect_uri,
            'scope': 'openid profile email offline_access',
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'prompt': 'consent',
            'state': state,
        }
        
        return f"https://auth.pingone.com/{self.env_id}/as/authorize?" + \\
               '&'.join(f"{k}={v}" for k, v in params.items())
    
    def exchange_code(self, code, code_verifier):
        """Exchange authorization code for tokens"""
        token_url = f"https://auth.pingone.com/{self.env_id}/as/token"
        
        response = requests.post(
            token_url,
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'code_verifier': code_verifier,  # PKCE verification
            }
        )
        
        response.raise_for_status()
        return response.json()
    
    def refresh_tokens(self, refresh_token):
        """Use refresh token to get new access token"""
        token_url = f"https://auth.pingone.com/{self.env_id}/as/token"
        
        response = requests.post(
            token_url,
            data={
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': self.client_id,
            }
        )
        
        response.raise_for_status()
        return response.json()`,
			java: `// Mobile E-Commerce OAuth (Android)
import android.net.Uri;
import androidx.browser.customtabs.CustomTabsIntent;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public class MobileOAuthManager {
    private String envId;
    private String clientId;
    private String redirectUri;
    
    public void startOAuthFlow(Activity activity) throws Exception {
        // Generate PKCE (REQUIRED for mobile apps)
        SecureRandom random = new SecureRandom();
        byte[] verifierBytes = new byte[32];
        random.nextBytes(verifierBytes);
        String codeVerifier = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(verifierBytes);
        
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(codeVerifier.getBytes());
        String codeChallenge = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(hash);
        
        byte[] stateBytes = new byte[32];
        random.nextBytes(stateBytes);
        String state = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(stateBytes);
        
        // Store securely
        SharedPreferences prefs = activity.getSharedPreferences(
            "oauth", Context.MODE_PRIVATE
        );
        prefs.edit()
            .putString("code_verifier", codeVerifier)
            .putString("state", state)
            .apply();
        
        // Build authorization URL
        Uri authUri = Uri.parse(
            String.format(
                "https://auth.pingone.com/%s/as/authorize", envId
            )
        ).buildUpon()
            .appendQueryParameter("client_id", clientId)
            .appendQueryParameter("response_type", "code")
            .appendQueryParameter("redirect_uri", redirectUri)
            .appendQueryParameter("scope", "openid profile email offline_access")
            .appendQueryParameter("code_challenge", codeChallenge)
            .appendQueryParameter("code_challenge_method", "S256")
            .appendQueryParameter("prompt", "consent")
            .appendQueryParameter("state", state)
            .build();
        
        // Open Custom Tab (in-app browser)
        CustomTabsIntent intent = new CustomTabsIntent.Builder().build();
        intent.launchUrl(activity, authUri);
    }
    
    public TokenResponse exchangeCode(String code) throws Exception {
        SharedPreferences prefs = context.getSharedPreferences(
            "oauth", Context.MODE_PRIVATE
        );
        String codeVerifier = prefs.getString("code_verifier", null);
        
        // Exchange code for tokens
        OkHttpClient client = new OkHttpClient();
        RequestBody body = new FormBody.Builder()
            .add("grant_type", "authorization_code")
            .add("code", code)
            .add("redirect_uri", redirectUri)
            .add("client_id", clientId)
            .add("code_verifier", codeVerifier)
            .build();
        
        Request request = new Request.Builder()
            .url(String.format(
                "https://auth.pingone.com/%s/as/token", envId
            ))
            .post(body)
            .build();
        
        Response response = client.newCall(request).execute();
        return new Gson().fromJson(
            response.body().string(), 
            TokenResponse.class
        );
    }
}`,
			csharp: `// Mobile E-Commerce OAuth (Xamarin/MAUI)
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

public class MobileOAuthManager
{
    private string envId;
    private string clientId;
    private string redirectUri;
    
    public async Task<string> StartOAuthFlow()
    {
        // Generate PKCE (REQUIRED for mobile)
        var codeVerifier = GenerateRandomString(32);
        var codeChallenge = GenerateCodeChallenge(codeVerifier);
        var state = GenerateRandomString(32);
        
        // Store securely
        await SecureStorage.SetAsync("code_verifier", codeVerifier);
        await SecureStorage.SetAsync("oauth_state", state);
        
        // Build authorization URL
        var authUrl = $"https://auth.pingone.com/{envId}/as/authorize?" +
            $"client_id={clientId}" +
            $"&response_type=code" +
            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope=openid%20profile%20email%20offline_access" +
            $"&code_challenge={codeChallenge}" +
            $"&code_challenge_method=S256" +
            $"&prompt=consent" +
            $"&state={state}";
        
        // Open web authenticator
        var result = await WebAuthenticator.AuthenticateAsync(
            new Uri(authUrl),
            new Uri(redirectUri)
        );
        
        // Validate state
        var returnedState = result.Properties["state"];
        var expectedState = await SecureStorage.GetAsync("oauth_state");
        
        if (returnedState != expectedState)
        {
            throw new SecurityException("State mismatch!");
        }
        
        // Exchange code
        var code = result.Properties["code"];
        return await ExchangeCode(code);
    }
    
    private async Task<TokenResponse> ExchangeCode(string code)
    {
        var verifier = await SecureStorage.GetAsync("code_verifier");
        var client = new HttpClient();
        
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "grant_type", "authorization_code" },
            { "code", code },
            { "redirect_uri", redirectUri },
            { "client_id", clientId },
            { "code_verifier", verifier },
        });
        
        var response = await client.PostAsync(
            $"https://auth.pingone.com/{envId}/as/token",
            content
        );
        
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<TokenResponse>(json);
    }
    
    private string GenerateCodeChallenge(string verifier)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(verifier));
        return Convert.ToBase64String(hash)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}`,
		},
	},
	{
		id: 'iot-device',
		icon: <FiSmartphone />,
		iconColor: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
		title: 'IoT Device / Smart TV',
		description:
			'Input-constrained device using Device Authorization Flow for browserless authentication',
		tags: ['Device Flow', 'No Browser', 'IoT'],
		parameters: {
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			scope: 'openid profile device:control',
		},
		whyItMatters:
			'Devices without browsers (Smart TVs, IoT sensors, CLI tools) use Device Authorization Flow. User authenticates on their phone/computer, device polls for completion.',
		industryExample:
			'📺 Netflix, YouTube, and Spotify on Smart TVs use Device Flow for easy login.',
		codeExamples: {
			javascript: `// IoT Device / Smart TV OAuth (Device Flow)
import fetch from 'node-fetch';

async function deviceFlowAuth() {
  // Step 1: Request device code
  const deviceResponse = await fetch(
    \`https://auth.pingone.com/\${envId}/as/device_authorization\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        scope: 'openid profile device:control',
      }),
    }
  );
  
  const deviceData = await deviceResponse.json();
  
  // Display to user
  console.log(\`\\n🔐 To activate this device:\`);
  console.log(\`\\n   1. Visit: \${deviceData.verification_uri}\`);
  console.log(\`   2. Enter code: \${deviceData.user_code}\`);
  console.log(\`\\n   Waiting for authorization...\\n\`);
  
  // Step 2: Poll for tokens
  const interval = deviceData.interval || 5; // seconds
  const expiresIn = deviceData.expires_in || 600; // 10 minutes
  const startTime = Date.now();
  
  while (true) {
    // Check if expired
    if ((Date.now() - startTime) / 1000 > expiresIn) {
      throw new Error('Device code expired. Please restart.');
    }
    
    // Wait before polling
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
    
    // Poll token endpoint
    const tokenResponse = await fetch(
      \`https://auth.pingone.com/\${envId}/as/token\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceData.device_code,
          client_id: clientId,
        }),
      }
    );
    
    const result = await tokenResponse.json();
    
    if (result.error) {
      if (result.error === 'authorization_pending') {
        // Still waiting for user
        process.stdout.write('.');
        continue;
      } else if (result.error === 'slow_down') {
        // Polling too fast, increase interval
        interval += 5;
        continue;
      } else {
        throw new Error(\`Authorization failed: \${result.error}\`);
      }
    }
    
    // Success!
    console.log('\\n\\n✅ Device authorized!\\n');
    return result;
  }
}

// Usage in device/CLI
deviceFlowAuth()
  .then(tokens => {
    console.log('Access Token:', tokens.access_token.substring(0, 20) + '...');
    console.log('Expires in:', tokens.expires_in, 'seconds');
    
    // Store tokens for device use
    saveToDeviceStorage(tokens);
  })
  .catch(error => {
    console.error('❌ Authorization failed:', error.message);
  });`,
			python: `# IoT Device / Smart TV OAuth (Device Flow)
import requests
import time

class DeviceFlowAuth:
    def __init__(self, env_id, client_id):
        self.env_id = env_id
        self.client_id = client_id
        self.base_url = f"https://auth.pingone.com/{env_id}/as"
    
    def authorize(self):
        """Complete device authorization flow"""
        # Step 1: Request device code
        device_response = requests.post(
            f"{self.base_url}/device_authorization",
            data={
                'client_id': self.client_id,
                'scope': 'openid profile device:control',
            }
        )
        device_response.raise_for_status()
        device_data = device_response.json()
        
        # Display to user
        print(f"\\n🔐 To activate this device:")
        print(f"\\n   1. Visit: {device_data['verification_uri']}")
        print(f"   2. Enter code: {device_data['user_code']}")
        print(f"\\n   Waiting for authorization...\\n")
        
        # Step 2: Poll for tokens
        interval = device_data.get('interval', 5)
        expires_in = device_data.get('expires_in', 600)
        start_time = time.time()
        
        while True:
            # Check expiration
            if time.time() - start_time > expires_in:
                raise TimeoutError('Device code expired')
            
            # Wait before polling
            time.sleep(interval)
            
            # Poll token endpoint
            token_response = requests.post(
                f"{self.base_url}/token",
                data={
                    'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',
                    'device_code': device_data['device_code'],
                    'client_id': self.client_id,
                }
            )
            
            result = token_response.json()
            
            if 'error' in result:
                if result['error'] == 'authorization_pending':
                    print('.', end='', flush=True)
                    continue
                elif result['error'] == 'slow_down':
                    interval += 5
                    continue
                else:
                    raise Exception(f"Auth failed: {result['error']}")
            
            # Success!
            print('\\n\\n✅ Device authorized!\\n')
            return result

# Usage
auth = DeviceFlowAuth(env_id='YOUR_ENV_ID', client_id='YOUR_CLIENT_ID')
tokens = auth.authorize()
print(f"Access Token: {tokens['access_token'][:20]}...")
print(f"Expires in: {tokens['expires_in']} seconds")`,
			java: `// IoT Device / Smart TV OAuth (Device Flow)
import java.net.http.*;
import java.net.URI;
import java.util.Map;
import com.google.gson.Gson;

public class DeviceFlowAuth {
    private String envId;
    private String clientId;
    private HttpClient client;
    private Gson gson;
    
    public DeviceFlowAuth(String envId, String clientId) {
        this.envId = envId;
        this.clientId = clientId;
        this.client = HttpClient.newHttpClient();
        this.gson = new Gson();
    }
    
    public TokenResponse authorize() throws Exception {
        // Step 1: Request device code
        String deviceUrl = String.format(
            "https://auth.pingone.com/%s/as/device_authorization", 
            envId
        );
        
        HttpRequest deviceRequest = HttpRequest.newBuilder()
            .uri(URI.create(deviceUrl))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(
                String.format(
                    "client_id=%s&scope=openid%%20profile%%20device:control",
                    clientId
                )
            ))
            .build();
        
        HttpResponse<String> deviceResponse = client.send(
            deviceRequest, 
            HttpResponse.BodyHandlers.ofString()
        );
        
        DeviceCodeResponse deviceData = gson.fromJson(
            deviceResponse.body(), 
            DeviceCodeResponse.class
        );
        
        // Display to user
        System.out.println("\\n🔐 To activate this device:");
        System.out.println("\\n   1. Visit: " + deviceData.verificationUri);
        System.out.println("   2. Enter code: " + deviceData.userCode);
        System.out.println("\\n   Waiting for authorization...\\n");
        
        // Step 2: Poll for tokens
        int interval = deviceData.interval != null ? deviceData.interval : 5;
        int expiresIn = deviceData.expiresIn != null ? deviceData.expiresIn : 600;
        long startTime = System.currentTimeMillis();
        
        String tokenUrl = String.format(
            "https://auth.pingone.com/%s/as/token", 
            envId
        );
        
        while (true) {
            // Check expiration
            if ((System.currentTimeMillis() - startTime) / 1000 > expiresIn) {
                throw new Exception("Device code expired");
            }
            
            // Wait
            Thread.sleep(interval * 1000);
            
            // Poll
            HttpRequest tokenRequest = HttpRequest.newBuilder()
                .uri(URI.create(tokenUrl))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(
                    String.format(
                        "grant_type=urn:ietf:params:oauth:grant-type:device_code" +
                        "&device_code=%s&client_id=%s",
                        deviceData.deviceCode, clientId
                    )
                ))
                .build();
            
            HttpResponse<String> tokenResponse = client.send(
                tokenRequest, 
                HttpResponse.BodyHandlers.ofString()
            );
            
            TokenResponse result = gson.fromJson(
                tokenResponse.body(), 
                TokenResponse.class
            );
            
            if (result.error != null) {
                if ("authorization_pending".equals(result.error)) {
                    System.out.print(".");
                    continue;
                } else if ("slow_down".equals(result.error)) {
                    interval += 5;
                    continue;
                } else {
                    throw new Exception("Auth failed: " + result.error);
                }
            }
            
            System.out.println("\\n\\n✅ Device authorized!\\n");
            return result;
        }
    }
}`,
			csharp: `// IoT Device / Smart TV OAuth (Device Flow)
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

public class DeviceFlowAuth
{
    private string envId;
    private string clientId;
    private HttpClient client;
    
    public DeviceFlowAuth(string envId, string clientId)
    {
        this.envId = envId;
        this.clientId = clientId;
        this.client = new HttpClient();
    }
    
    public async Task<TokenResponse> AuthorizeAsync()
    {
        // Step 1: Request device code
        var deviceUrl = $"https://auth.pingone.com/{envId}/as/device_authorization";
        
        var deviceResponse = await client.PostAsync(
            deviceUrl,
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "scope", "openid profile device:control" },
            })
        );
        
        var deviceJson = await deviceResponse.Content.ReadAsStringAsync();
        var deviceData = JsonSerializer.Deserialize<DeviceCodeResponse>(deviceJson);
        
        // Display to user
        Console.WriteLine($"\\n🔐 To activate this device:");
        Console.WriteLine($"\\n   1. Visit: {deviceData.VerificationUri}");
        Console.WriteLine($"   2. Enter code: {deviceData.UserCode}");
        Console.WriteLine($"\\n   Waiting for authorization...\\n");
        
        // Step 2: Poll for tokens
        var interval = deviceData.Interval ?? 5;
        var expiresIn = deviceData.ExpiresIn ?? 600;
        var startTime = DateTime.UtcNow;
        
        var tokenUrl = $"https://auth.pingone.com/{envId}/as/token";
        
        while (true)
        {
            // Check expiration
            if ((DateTime.UtcNow - startTime).TotalSeconds > expiresIn)
            {
                throw new TimeoutException("Device code expired");
            }
            
            // Wait
            await Task.Delay(interval * 1000);
            
            // Poll
            var tokenResponse = await client.PostAsync(
                tokenUrl,
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "grant_type", "urn:ietf:params:oauth:grant-type:device_code" },
                    { "device_code", deviceData.DeviceCode },
                    { "client_id", clientId },
                })
            );
            
            var resultJson = await tokenResponse.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<TokenResponse>(resultJson);
            
            if (result.Error != null)
            {
                if (result.Error == "authorization_pending")
                {
                    Console.Write(".");
                    continue;
                }
                else if (result.Error == "slow_down")
                {
                    interval += 5;
                    continue;
                }
                else
                {
                    throw new Exception($"Auth failed: {result.Error}");
                }
            }
            
            Console.WriteLine("\\n\\n✅ Device authorized!\\n");
            return result;
        }
    }
}`,
		},
	},
];

const RealWorldScenarioBuilder: React.FC = () => {
	const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
	const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');

	const scenario = scenarios.find((s) => s.id === selectedScenario);

	const copyCode = useCallback((code: string) => {
		navigator.clipboard.writeText(code);
		v4ToastManager.showSuccess('Code copied to clipboard!');
	}, []);

	return (
		<BuilderContainer>
			<Title>
				<FiGlobe size={32} />
				Real-World Scenario Builder
			</Title>
			<Subtitle>
				🎯 Choose your use case, get pre-configured OAuth parameters and production-ready code in
				your language. No guesswork!
			</Subtitle>

			<ScenarioGrid>
				{scenarios.map((s) => (
					<ScenarioCard
						key={s.id}
						$selected={selectedScenario === s.id}
						onClick={() => setSelectedScenario(s.id)}
					>
						<ScenarioIcon color={s.iconColor}>{s.icon}</ScenarioIcon>
						<ScenarioTitle>{s.title}</ScenarioTitle>
						<ScenarioDescription>{s.description}</ScenarioDescription>
						<ScenarioTags>
							{s.tags.map((tag) => (
								<Tag key={tag}>{tag}</Tag>
							))}
						</ScenarioTags>
					</ScenarioCard>
				))}
			</ScenarioGrid>

			{scenario && (
				<>
					<ConfigPanel>
						<ConfigSection>
							<SectionTitle>
								<FiCheckCircle style={{ color: '#10b981' }} />
								Pre-Configured OAuth Parameters
							</SectionTitle>
							<ParameterList>
								{Object.entries(scenario.parameters).map(([key, value]) => (
									<Parameter key={key}>
										<ParameterName>{key}</ParameterName>
										<ParameterValue>{value}</ParameterValue>
									</Parameter>
								))}
							</ParameterList>

							<WhyBox>
								<WhyTitle>
									<FiLock />
									Why These Parameters Matter
								</WhyTitle>
								<WhyText>{scenario.whyItMatters}</WhyText>
							</WhyBox>
						</ConfigSection>

						<ConfigSection>
							<SectionTitle>
								<FiExternalLink style={{ color: '#3b82f6' }} />
								Industry Example
							</SectionTitle>
							<div
								style={{
									padding: '1rem',
									background: '#dbeafe',
									borderRadius: '0.5rem',
									borderLeft: '4px solid #3b82f6',
									color: '#1e40af',
									lineHeight: '1.6',
								}}
							>
								{scenario.industryExample}
							</div>
						</ConfigSection>
					</ConfigPanel>

					<div>
						<SectionTitle>
							<FiCode style={{ color: '#059669' }} />
							Production-Ready Code
						</SectionTitle>

						<CodeTabs>
							<CodeTab
								$active={selectedLanguage === 'javascript'}
								onClick={() => setSelectedLanguage('javascript')}
							>
								JavaScript
							</CodeTab>
							<CodeTab
								$active={selectedLanguage === 'python'}
								onClick={() => setSelectedLanguage('python')}
							>
								Python
							</CodeTab>
							<CodeTab
								$active={selectedLanguage === 'java'}
								onClick={() => setSelectedLanguage('java')}
							>
								Java
							</CodeTab>
							<CodeTab
								$active={selectedLanguage === 'csharp'}
								onClick={() => setSelectedLanguage('csharp')}
							>
								C#
							</CodeTab>
						</CodeTabs>

						<CodeBlock>
							<CopyButton onClick={() => copyCode(scenario.codeExamples[selectedLanguage])}>
								<FiCopy />
								Copy Code
							</CopyButton>
							{scenario.codeExamples[selectedLanguage]}
						</CodeBlock>

						<ActionButtons>
							<ActionButton onClick={() => copyCode(scenario.codeExamples[selectedLanguage])}>
								<FiCopy />
								Copy to Clipboard
							</ActionButton>
							<ActionButton variant="secondary" onClick={() => setSelectedScenario(null)}>
								<FiGlobe />
								Choose Different Scenario
							</ActionButton>
						</ActionButtons>
					</div>
				</>
			)}

			{!scenario && (
				<div
					style={{
						textAlign: 'center',
						padding: '3rem',
						color: '#059669',
						fontSize: '1.1rem',
					}}
				>
					👆 Select a scenario above to see pre-configured OAuth parameters and production code
				</div>
			)}
		</BuilderContainer>
	);
};

export default RealWorldScenarioBuilder;
