import React, { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowDown,
	FiArrowRight,
	FiCheckCircle,
	FiCode,
	FiInfo,
	FiKey,
	FiPause,
	FiPlay,
	FiRotateCcw,
	FiServer,
	FiShield,
	FiUser,
} from '@icons';
import styled from 'styled-components';

interface FlowStep {
	id: string;
	title: string;
	description: string;
	explanation?: string;
	actor: 'user' | 'client' | 'server' | 'auth-server';
	action: string;
	data?: string;
	duration: number;
	status: 'pending' | 'active' | 'completed' | 'error';
}

interface FlowDiagram {
	id: string;
	title: string;
	description: string;
	steps: FlowStep[];
}

const DiagramContainer = styled.div`
  max-width: 100vw;
  margin: 0 auto;
  padding: 1rem;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
  
  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #3b82f6, #22c55e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: #6b7280;
    font-size: 1rem;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.4;
  }
`;

const FlowSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  justify-content: center;
  flex-shrink: 0;
`;

const FlowButton = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid ${({ $selected }) => ($selected ? '#3b82f6' : '#e5e7eb')};
  border-radius: 0.5rem;
  background: ${({ $selected }) =>
		$selected ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 'white'};
  color: ${({ $selected }) => ($selected ? '#1e40af' : '#374151')};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${({ $selected }) =>
		$selected ? '0 4px 6px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  
  &:hover {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }
`;

const ControlsPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  justify-content: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid ${({ $variant, theme }) =>
		$variant === 'primary' ? theme.colors.primary : theme.colors.gray300};
  border-radius: 0.5rem;
  background-color: ${({ $variant, theme }) =>
		$variant === 'primary' ? theme.colors.primary : 'white'};
  color: ${({ $variant, theme }) => ($variant === 'primary' ? 'white' : theme.colors.gray700)};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ $variant, theme }) =>
			$variant === 'primary' ? theme.colors.primaryDark : theme.colors.gray100};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DiagramArea = styled.div`
  position: relative;
  flex: 1;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
  display: flex;
  align-items: stretch;
`;

const ActorColumn = styled.div<{ $actor: string }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  min-width: 0;
  
  &:not(:last-child) {
    margin-right: 1rem;
  }
`;

const ActorCard = styled.div<{ $actor: string }>`
  width: 100%;
  padding: 1rem;
  background: ${({ $actor }) => {
		switch ($actor) {
			case 'user':
				return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
			case 'client':
				return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
			case 'auth-server':
				return 'linear-gradient(135deg, #fef3c7, #fde68a)';
			case 'server':
				return 'linear-gradient(135deg, #e9d5ff, #ddd6fe)';
			default:
				return 'white';
		}
	}};
  border: 2px solid ${({ $actor }) => {
		switch ($actor) {
			case 'user':
				return '#3b82f6';
			case 'client':
				return '#10b981';
			case 'auth-server':
				return '#f59e0b';
			case 'server':
				return '#22c55e';
			default:
				return '#e5e7eb';
		}
	}};
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
  
  .actor-icon {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: ${({ $actor }) => {
			switch ($actor) {
				case 'user':
					return '#1e40af';
				case 'client':
					return '#065f46';
				case 'auth-server':
					return '#92400e';
				case 'server':
					return '#5b21b6';
				default:
					return '#6b7280';
			}
		}};
  }
  
  .actor-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({ $actor }) => {
			switch ($actor) {
				case 'user':
					return '#1e40af';
				case 'client':
					return '#065f46';
				case 'auth-server':
					return '#92400e';
				case 'server':
					return '#5b21b6';
				default:
					return '#374151';
			}
		}};
    margin-bottom: 0.25rem;
  }
  
  .actor-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
  }
`;

const StepCard = styled.div<{ $status: string; $delay: number }>`
  width: 100%;
  padding: 1rem;
  background: ${({ $status }) => {
		switch ($status) {
			case 'active':
				return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
			case 'completed':
				return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
			case 'error':
				return 'linear-gradient(135deg, #fee2e2, #fecaca)';
			default:
				return 'white';
		}
	}};
  border: 2px solid ${({ $status }) => {
		switch ($status) {
			case 'active':
				return '#3b82f6';
			case 'completed':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#e5e7eb';
		}
	}};
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  opacity: ${({ $status }) => ($status === 'pending' ? 0.6 : 1)};
  transform: ${({ $status }) => ($status === 'active' ? 'scale(1.02)' : 'scale(1)')};
  transition: all 0.3s ease;
  animation-delay: ${({ $delay }) => $delay}ms;
  box-shadow: ${({ $status }) =>
		$status === 'active' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.1)'};
  
  .step-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({ $status }) => {
			switch ($status) {
				case 'active':
					return '#1e40af';
				case 'completed':
					return '#065f46';
				case 'error':
					return '#991b1b';
				default:
					return '#374151';
			}
		}};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .step-description {
    font-size: 0.8rem;
    color: #4b5563;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .step-explanation {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    font-style: italic;
    background: rgba(255, 255, 255, 0.6);
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    border-left: 3px solid ${({ $status }) => {
			switch ($status) {
				case 'active':
					return '#3b82f6';
				case 'completed':
					return '#10b981';
				case 'error':
					return '#ef4444';
				default:
					return '#d1d5db';
			}
		}};
  }
  
  .step-data {
    font-size: 0.7rem;
    color: #1f2937;
    font-family: 'Monaco', 'Menlo', monospace;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-top: 0.5rem;
    word-break: break-all;
    white-space: pre-wrap;
    line-height: 1.4;
  }
`;

const StatusIndicator = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
  
  ${({ $status }) => {
		switch ($status) {
			case 'active':
				return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
			case 'completed':
				return `
          background-color: #dcfce7;
          color: #166534;
        `;
			case 'error':
				return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: #374151;
        `;
		}
	}}
`;

const flowDiagrams: FlowDiagram[] = [
	{
		id: 'authorization-code',
		title: 'Authorization Code Flow',
		description: 'The most secure OAuth flow for web applications',
		steps: [
			{
				id: '1',
				title: 'Authorization Request',
				description: 'User clicks login, client redirects to auth server',
				explanation:
					'The user initiates the login process. The client application redirects the user to PingOne with the necessary parameters including client_id, redirect_uri, and scope.',
				actor: 'user',
				action: 'Clicks login button',
				data: 'https://auth.pingone.com/oauth/authorize?client_id=abc&redirect_uri=...&scope=openid profile',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '2',
				title: 'User Authentication',
				description: 'User enters credentials on auth server',
				explanation:
					"The user is presented with PingOne's login form. They enter their username and password, which PingOne validates against their identity store.",
				actor: 'auth-server',
				action: 'Validates user credentials',
				data: 'Username: user@example.com, Password: ',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '3',
				title: 'Authorization Code',
				description: 'Auth server redirects back with authorization code',
				explanation:
					'After successful authentication, PingOne generates a short-lived authorization code and redirects the user back to the client application with this code.',
				actor: 'auth-server',
				action: 'Redirects with code',
				data: 'https://app.example.com/callback?code=abc123&state=xyz',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '4',
				title: 'Token Exchange',
				description: 'Client exchanges code for access token',
				explanation:
					'The client application makes a secure server-to-server request to PingOne, exchanging the authorization code for an access token. This happens behind the scenes.',
				actor: 'client',
				action: 'POST /token with code',
				data: 'POST /oauth/token\nAuthorization: Basic abc123\nBody: grant_type=authorization_code&code=abc123',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '5',
				title: 'Access Token',
				description: 'Auth server returns access token',
				explanation:
					'PingOne validates the authorization code and client credentials, then returns an access token (and optionally a refresh token) to the client application.',
				actor: 'auth-server',
				action: 'Returns tokens',
				data: '{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "refresh_token": "def456",\n  "expires_in": 3600\n}',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '6',
				title: 'API Access',
				description: 'Client uses access token to call protected API',
				explanation:
					'The client application can now use the access token to make authenticated requests to protected APIs. The token is included in the Authorization header.',
				actor: 'client',
				action: 'GET /api/user with token',
				data: 'GET /api/user\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
				duration: 1000,
				status: 'pending',
			},
		],
	},
	{
		id: 'implicit',
		title: 'Implicit Flow',
		description: 'Simplified flow for single-page applications',
		steps: [
			{
				id: '1',
				title: 'Authorization Request',
				description: 'User clicks login, client redirects to auth server',
				explanation:
					'The user initiates login. The client redirects to PingOne with response_type=token (instead of code) to request the access token directly.',
				actor: 'user',
				action: 'Clicks login button',
				data: 'https://auth.pingone.com/oauth/authorize?response_type=token&client_id=abc...',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '2',
				title: 'User Authentication',
				description: 'User enters credentials on auth server',
				explanation:
					"The user enters their credentials on PingOne's login form. This is the same authentication step as the Authorization Code flow.",
				actor: 'auth-server',
				action: 'Validates user credentials',
				data: 'Username: user@example.com, Password: ',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '3',
				title: 'Access Token',
				description: 'Auth server redirects back with access token',
				explanation:
					'PingOne redirects back to the client with the access token directly in the URL fragment (after #). This is less secure than the Authorization Code flow.',
				actor: 'auth-server',
				action: 'Redirects with token',
				data: 'https://app.example.com/callback#access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...&token_type=Bearer&expires_in=3600',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '4',
				title: 'API Access',
				description: 'Client uses access token to call protected API',
				explanation:
					'The client extracts the token from the URL fragment and uses it to make authenticated API calls. The token is visible in the browser URL.',
				actor: 'client',
				action: 'GET /api/user with token',
				data: 'GET /api/user\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
				duration: 1000,
				status: 'pending',
			},
		],
	},
	{
		id: 'client-credentials',
		title: 'Client Credentials Flow',
		description: 'Machine-to-machine authentication without user interaction',
		steps: [
			{
				id: '1',
				title: 'Token Request',
				description: 'Client requests token using credentials',
				explanation:
					'The client application makes a direct request to PingOne using its client credentials (client_id and client_secret). No user interaction is required.',
				actor: 'client',
				action: 'POST /token with credentials',
				data: 'POST /oauth/token\nAuthorization: Basic YWJjOnh5eg==\nBody: grant_type=client_credentials&scope=api:read',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '2',
				title: 'Credential Validation',
				description: 'Auth server validates client credentials',
				explanation:
					'PingOne validates the client_id and client_secret against its client registry. If valid, it proceeds to issue a token.',
				actor: 'auth-server',
				action: 'Validates client_id and client_secret',
				data: 'Client ID: abc123\nClient Secret: \nStatus: Valid',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '3',
				title: 'Access Token',
				description: 'Auth server returns access token',
				explanation:
					'PingOne issues an access token with the requested scope. This token can be used to access APIs on behalf of the application (not a user).',
				actor: 'auth-server',
				action: 'Returns access token',
				data: '{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "api:read"\n}',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '4',
				title: 'API Access',
				description: 'Client uses token to access protected resources',
				explanation:
					'The client uses the access token to make API calls. This is typically used for machine-to-machine communication or accessing application-specific resources.',
				actor: 'client',
				action: 'GET /api/data with token',
				data: 'GET /api/v1/data\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
				duration: 1000,
				status: 'pending',
			},
		],
	},
	{
		id: 'device-code',
		title: 'Device Code Flow',
		description: 'For devices with limited input capabilities',
		steps: [
			{
				id: '1',
				title: 'Device Authorization Request',
				description: 'Device requests authorization from auth server',
				explanation:
					'The device (like a smart TV or IoT device) makes a request to PingOne to initiate the device authorization flow. No user credentials are needed at this stage.',
				actor: 'client',
				action: 'POST /device/authorize',
				data: 'POST /oauth/device/authorize\nBody: client_id=abc123&scope=read write',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '2',
				title: 'Device Code & User Code',
				description: 'Auth server returns device code and user code',
				explanation:
					'PingOne generates a device_code (for the device) and a user_code (for the user). The device displays the user_code and verification URL to the user.',
				actor: 'auth-server',
				action: 'Returns device_code and user_code',
				data: '{\n  "device_code": "xyz789",\n  "user_code": "ABCD-EFGH",\n  "verification_uri": "https://auth.pingone.com/device",\n  "expires_in": 600\n}',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '3',
				title: 'User Authentication',
				description: 'User visits verification URL and enters user code',
				explanation:
					'The user goes to the verification URL on their phone/computer and enters the user_code. They then authenticate with their PingOne credentials.',
				actor: 'user',
				action: 'Goes to verification URL and enters code',
				data: 'User Code: ABCD-EFGH\nURL: https://auth.pingone.com/device\nUsername: user@example.com',
				duration: 2000,
				status: 'pending',
			},
			{
				id: '4',
				title: 'User Authorization',
				description: 'User authorizes the device on auth server',
				explanation:
					'After authentication, the user sees a consent screen asking them to authorize the device. They click "Allow" to grant access to the device.',
				actor: 'auth-server',
				action: 'User approves device access',
				data: 'Device: Smart TV\nApp: Netflix\nScopes: read write\nAction: User clicks "Allow"',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '5',
				title: 'Token Polling',
				description: 'Device polls for access token using device code',
				explanation:
					'The device repeatedly polls PingOne using the device_code to check if the user has completed authorization. This continues until the user authorizes or the code expires.',
				actor: 'client',
				action: 'POST /token with device_code',
				data: 'POST /oauth/token\nBody: grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=xyz789',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '6',
				title: 'Access Token',
				description: 'Auth server returns access token',
				explanation:
					'Once the user has authorized the device, PingOne returns an access token to the device. The device can now access protected resources on behalf of the user.',
				actor: 'auth-server',
				action: 'Returns access token',
				data: '{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "read write"\n}',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '7',
				title: 'API Access',
				description: 'Device uses token to access protected resources',
				explanation:
					'The device can now make authenticated API calls using the access token. This enables the device to access user-specific resources like playlists or preferences.',
				actor: 'client',
				action: 'GET /api/data with token',
				data: 'GET /api/v1/user/playlist\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
				duration: 1000,
				status: 'pending',
			},
		],
	},
	{
		id: 'resource-owner-password',
		title: 'Resource Owner Password Flow',
		description: 'Direct username/password authentication (Not supported by PingOne)',
		steps: [
			{
				id: '1',
				title: 'User Credentials',
				description: 'User provides username and password directly to the client',
				explanation:
					'The user enters their credentials directly into the client application. This is less secure as credentials are exposed to the client.',
				actor: 'user',
				action: 'Enters username and password',
				data: 'Username: user@example.com\nPassword: ',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '2',
				title: 'Token Request',
				description: 'Client sends credentials directly to authorization server',
				explanation:
					'The client makes a direct request to the token endpoint with the user credentials. This bypasses the authorization server UI.',
				actor: 'client',
				action: 'POST /token with credentials',
				data: 'POST /oauth/token\nBody: grant_type=password&username=user@example.com&password=',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '3',
				title: 'Credential Validation',
				description: 'Authorization server validates credentials',
				explanation:
					'The authorization server validates the username and password against its user store. This is a direct authentication without redirects.',
				actor: 'auth-server',
				action: 'Validates username and password',
				data: 'Username: user@example.com\nPassword: \nStatus: Valid',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '4',
				title: 'Access Token',
				description: 'Authorization server returns access token',
				explanation:
					'Upon successful validation, the authorization server returns an access token directly to the client.',
				actor: 'auth-server',
				action: 'Returns access token',
				data: '{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "read write"\n}',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '5',
				title: 'API Access',
				description: 'Client uses token to access protected resources',
				explanation:
					'The client can now use the access token to make authenticated requests to protected APIs.',
				actor: 'client',
				action: 'GET /api/data with token',
				data: 'GET /api/v1/user/data\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
				duration: 1000,
				status: 'pending',
			},
		],
	},
	{
		id: 'par',
		title: 'Pushed Authorization Request (PAR)',
		description: 'Enhanced security flow that pushes authorization parameters to the server first',
		steps: [
			{
				id: '1',
				title: 'PAR Request',
				description: 'Client pushes authorization parameters to auth server',
				explanation:
					"The client application makes a secure request to PingOne's PAR endpoint, pushing all authorization parameters including client credentials, scopes, and redirect URI.",
				actor: 'client',
				action: 'POST /par with parameters',
				data: 'POST /oauth/par\nAuthorization: Basic abc123\nBody: client_id=abc&scope=openid profile&redirect_uri=https://app.example.com/callback',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '2',
				title: 'Request URI',
				description: 'Auth server returns a request URI',
				explanation:
					'PingOne validates the parameters and returns a short-lived request URI that contains a reference to the pushed parameters. This URI is much shorter and safer than the original parameters.',
				actor: 'auth-server',
				action: 'Returns request URI',
				data: 'Request URI: urn:ietf:params:oauth:request_uri:abc123def456\nExpires in: 60 seconds',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '3',
				title: 'Authorization Request',
				description: 'User clicks login with request URI',
				explanation:
					'The user initiates the login process. Instead of passing all parameters in the URL, the client only needs to pass the short request URI to PingOne.',
				actor: 'user',
				action: 'Clicks login button',
				data: 'https://auth.pingone.com/oauth/authorize?request_uri=urn:ietf:params:oauth:request_uri:abc123def456&response_type=code',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '4',
				title: 'User Authentication',
				description: 'User enters credentials on auth server',
				explanation:
					"The user is presented with PingOne's login form. They enter their username and password, which PingOne validates against their identity store.",
				actor: 'auth-server',
				action: 'Validates user credentials',
				data: 'Username: user@example.com, Password: ',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '5',
				title: 'Authorization Code',
				description: 'Auth server redirects back with authorization code',
				explanation:
					'After successful authentication, PingOne generates a short-lived authorization code and redirects the user back to the client application with this code.',
				actor: 'auth-server',
				action: 'Redirects with code',
				data: 'https://app.example.com/callback?code=abc123&state=xyz',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '6',
				title: 'Token Exchange',
				description: 'Client exchanges code for access token',
				explanation:
					'The client application makes a secure server-to-server request to PingOne, exchanging the authorization code for an access token. This happens behind the scenes.',
				actor: 'client',
				action: 'POST /token with code',
				data: 'POST /oauth/token\nAuthorization: Basic abc123\nBody: grant_type=authorization_code&code=abc123',
				duration: 1500,
				status: 'pending',
			},
			{
				id: '7',
				title: 'Access Token',
				description: 'Auth server returns access token',
				explanation:
					'PingOne validates the authorization code and returns an access token (and optionally a refresh token) to the client application.',
				actor: 'auth-server',
				action: 'Returns access token',
				data: 'Access Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...\nToken Type: Bearer\nExpires In: 3600',
				duration: 1000,
				status: 'pending',
			},
			{
				id: '8',
				title: 'API Access',
				description: 'Client uses access token to call protected API',
				explanation:
					'The client can now use the access token to make authenticated requests to protected APIs.',
				actor: 'client',
				action: 'GET /api/data with token',
				data: 'GET /api/v1/user/data\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
				duration: 1000,
				status: 'pending',
			},
		],
	},
];

const InteractiveFlowDiagram: React.FC = () => {
	const [selectedFlow, setSelectedFlow] = useState<string>('authorization-code');
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [steps, setSteps] = useState<FlowStep[]>([]);
	const [isManualMode, setIsManualMode] = useState(false);

	const currentFlow = flowDiagrams.find((flow) => flow.id === selectedFlow);

	useEffect(() => {
		if (currentFlow) {
			setSteps(currentFlow.steps.map((step) => ({ ...step, status: 'pending' as const })));
			setCurrentStep(0);
		}
	}, [currentFlow]);

	useEffect(() => {
		if (!isPlaying || isManualMode) return;

		const interval = setInterval(() => {
			setCurrentStep((prev) => {
				if (prev >= steps.length - 1) {
					setIsPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, 2000);

		return () => clearInterval(interval);
	}, [isPlaying, steps.length, isManualMode]);

	useEffect(() => {
		setSteps((prev) =>
			prev.map((step, index) => ({
				...step,
				status:
					index < currentStep
						? ('completed' as const)
						: index === currentStep
							? ('active' as const)
							: ('pending' as const),
			}))
		);
	}, [currentStep]);

	const handlePlay = () => {
		if (currentStep >= steps.length - 1) {
			setCurrentStep(0);
			setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as const })));
		}
		setIsPlaying(true);
	};

	const handlePause = () => {
		setIsPlaying(false);
	};

	const handleReset = () => {
		setIsPlaying(false);
		setCurrentStep(0);
		setSteps((prev) => prev.map((step) => ({ ...step, status: 'pending' as const })));
	};

	// PingOne Icon Component
	const PingOneIcon = () => (
		<div
			style={{
				width: '24px',
				height: '24px',
				background: '#dc2626',
				borderRadius: '4px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: 'white',
				fontSize: '12px',
				fontWeight: 'bold',
				border: '2px solid #b91c1c',
			}}
		>
			P1
		</div>
	);

	const getActorIcon = (actor: string) => {
		switch (actor) {
			case 'user':
				return <FiUser />;
			case 'client':
				return <FiCode />;
			case 'auth-server':
				return <PingOneIcon />;
			case 'server':
				return <FiServer />;
			default:
				return <FiUser />;
		}
	};

	const getFlowIcon = (flowId: string) => {
		switch (flowId) {
			case 'authorization-code':
				return <FiKey />;
			case 'implicit':
				return <FiArrowRight />;
			case 'client-credentials':
				return <FiCode />;
			case 'device-code':
				return <FiServer />;
			case 'resource-owner-password':
				return <FiShield />;
			case 'par':
				return <FiInfo />;
			default:
				return <FiKey />;
		}
	};

	const getActorTitle = (actor: string) => {
		switch (actor) {
			case 'user':
				return 'User';
			case 'client':
				return 'Client App';
			case 'auth-server':
				return 'PingOne';
			case 'server':
				return 'Resource Server';
			default:
				return 'Actor';
		}
	};

	const getActorDescription = (actor: string) => {
		switch (actor) {
			case 'user':
				return 'End user accessing the application';
			case 'client':
				return 'Your application requesting access';
			case 'auth-server':
				return 'PingOne Identity Platform';
			case 'server':
				return 'API server with protected resources';
			default:
				return 'Participant in the flow';
		}
	};

	const actors = ['user', 'client', 'auth-server', 'server'];

	return (
		<DiagramContainer>
			<PageHeader>
				<h1>Interactive OAuth Flow Diagrams</h1>
				<p>
					Watch OAuth flows come to life with interactive, step-by-step animations. Select a flow
					and click play to see how the authentication process works.
				</p>
			</PageHeader>

			<FlowSelector>
				{flowDiagrams.map((flow) => (
					<FlowButton
						key={flow.id}
						$selected={selectedFlow === flow.id}
						onClick={() => setSelectedFlow(flow.id)}
					>
						{getFlowIcon(flow.id)}
						{flow.title}
					</FlowButton>
				))}
			</FlowSelector>

			<ControlsPanel>
				<ControlButton
					onClick={() => {
						setIsManualMode(true);
						setIsPlaying(false);
						setCurrentStep(Math.max(0, currentStep - 1));
					}}
					disabled={currentStep === 0}
				>
					<FiArrowDown style={{ transform: 'rotate(90deg)' }} />
					Back
				</ControlButton>

				<ControlButton
					$variant="primary"
					onClick={() => {
						setIsManualMode(true);
						setIsPlaying(false);
						setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
					}}
					disabled={currentStep >= steps.length - 1}
				>
					Next
					<FiArrowDown style={{ transform: 'rotate(-90deg)' }} />
				</ControlButton>

				<div style={{ width: '1px', height: '2rem', background: '#e5e7eb', margin: '0 0.5rem' }} />

				<ControlButton $variant="primary" onClick={handlePlay} disabled={isPlaying}>
					<FiPlay />
					{currentStep >= steps.length - 1 ? 'Restart' : 'Play'}
				</ControlButton>

				<ControlButton onClick={handlePause} disabled={!isPlaying}>
					<FiPause />
					Pause
				</ControlButton>

				<ControlButton onClick={handleReset}>
					<FiRotateCcw />
					Reset
				</ControlButton>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						color: '#6b7280',
						fontSize: '0.875rem',
						marginLeft: '0.5rem',
					}}
				>
					<FiInfo />
					Step {currentStep + 1} of {steps.length}
				</div>
			</ControlsPanel>

			<DiagramArea>
				{actors.map((actor) => (
					<ActorColumn key={actor} $actor={actor}>
						<ActorCard $actor={actor}>
							<div className="actor-icon">{getActorIcon(actor)}</div>
							<div className="actor-title">{getActorTitle(actor)}</div>
							<div className="actor-description">{getActorDescription(actor)}</div>
						</ActorCard>

						{steps
							.filter((step) => step.actor === actor)
							.map((step, index) => (
								<StepCard key={step.id} $status={step.status} $delay={index * 200}>
									<div className="step-title">
										{step.status === 'active' && <FiCheckCircle />}
										{step.status === 'completed' && <FiCheckCircle />}
										{step.status === 'error' && <FiAlertCircle />}
										<span
											style={{
												background: '#3b82f6',
												color: 'white',
												borderRadius: '50%',
												width: '20px',
												height: '20px',
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: '0.75rem',
												fontWeight: '600',
												marginRight: '0.5rem',
											}}
										>
											{step.id}
										</span>
										{step.title}
										<StatusIndicator $status={step.status}>{step.status}</StatusIndicator>
									</div>
									<div className="step-description">{step.description}</div>
									{step.explanation && <div className="step-explanation">{step.explanation}</div>}
									{step.data && <div className="step-data">{step.data}</div>}
								</StepCard>
							))}
					</ActorColumn>
				))}

				{/* Flow indicators between columns */}
				{steps.length > 0 && (
					<>
						<div
							style={{
								position: 'absolute',
								top: '50%',
								left: '25%',
								transform: 'translate(-50%, -50%)',
								fontSize: '1.5rem',
								color: '#3b82f6',
								opacity: 0.7,
							}}
						>
							<FiArrowRight />
						</div>
						<div
							style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
								fontSize: '1.5rem',
								color: '#3b82f6',
								opacity: 0.7,
							}}
						>
							<FiArrowRight />
						</div>
						<div
							style={{
								position: 'absolute',
								top: '50%',
								left: '75%',
								transform: 'translate(-50%, -50%)',
								fontSize: '1.5rem',
								color: '#3b82f6',
								opacity: 0.7,
							}}
						>
							<FiArrowRight />
						</div>
					</>
				)}
			</DiagramArea>
		</DiagramContainer>
	);
};

export default InteractiveFlowDiagram;
