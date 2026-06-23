import { FlowStepProps } from './FlowStep';
import { OAuthConfig } from '../types';

export const getFlowStepsData = (config: OAuthConfig): Omit<FlowStepProps, 'status'>[] => [
  {
    number: 1,
    title: 'Authorization Request',
    description: 'Your app redirects the user to the OAuth server to log in',
    protocol: {
      method: 'GET',
      url: '/as/authorization',
      params: [
        { key: 'client_id', value: config.clientId },
        { key: 'response_type', value: config.responseType },
        { key: 'redirect_uri', value: config.redirectUri },
        { key: 'scope', value: config.scopes.join(' ') },
        { key: 'state', value: config.advancedOptions.state || 'auto-generated', comment: '← CSRF protection' },
      ],
    },
    annotation: {
      icon: '🔍',
      title: "What's happening?",
      body: 'Your app is asking OAuth: "Please ask the user if they want to let my app see their profile and email."',
    },
  },

  {
    number: 2,
    title: 'User Authorization',
    description: 'User logs in and grants permission',
    annotation: {
      icon: '⏳',
      title: 'Waiting...',
      body: 'The user is on the OAuth server login page. Once they approve, the server redirects them back to your app with an authorization code.',
    },
  },

  {
    number: 3,
    title: 'Authorization Code Callback',
    description: 'OAuth server redirects user back with authorization code',
    protocol: {
      method: 'HTTP 302',
      url: 'Redirect to Redirect URI',
      params: [
        { key: 'code', value: 'abc123def456...', comment: '← Valid for ~10 minutes' },
        { key: 'state', value: config.advancedOptions.state || 'auto-generated', comment: '← Must match request' },
      ],
    },
    annotation: {
      icon: '🔐',
      title: 'Security Note',
      body: 'The code is not a token—it is a ticket proving the user approved your request. Your backend exchanges it for actual tokens next.',
    },
  },

  {
    number: 4,
    title: 'Token Exchange (Backend)',
    description: 'Your backend exchanges the code for access tokens',
    protocol: {
      method: 'POST',
      url: '/as/token',
      params: [
        { key: 'grant_type', value: 'authorization_code' },
        { key: 'code', value: 'abc123def456...' },
        { key: 'client_id', value: config.clientId },
        { key: 'client_secret', value: config.clientSecret ? '••••••••' : '(public client)', comment: '← Kept secret on backend' },
        { key: 'redirect_uri', value: config.redirectUri },
      ],
    },
    annotation: {
      icon: '🔐',
      title: 'Why This is Secure',
      body: 'The client_secret is never exposed to the browser. Only your backend knows it, so only your backend can exchange the code for real tokens.',
    },
  },

  {
    number: 5,
    title: 'Token Response',
    description: 'OAuth server returns access token and ID token',
    protocol: {
      method: 'HTTP 200 OK',
      url: 'JSON Response',
      params: [
        { key: 'access_token', value: 'eyJhbGc...', comment: '← Use to access user data' },
        { key: 'token_type', value: 'Bearer' },
        { key: 'expires_in', value: '3600', comment: '← Seconds until expiration' },
        { key: 'id_token', value: 'eyJhbGc...', comment: '← Contains user claims (OIDC)' },
      ],
    },
    annotation: {
      icon: '✅',
      title: 'Success!',
      body: 'Your backend now has tokens to access user data and verify their identity.',
    },
  },

  {
    number: 6,
    title: 'Validate & Decode',
    description: 'Verify token signatures and extract user information',
    annotation: {
      icon: '🔍',
      title: 'What happens next?',
      body: 'Verify the token signature using the OAuth server\'s public key, decode the JWT to extract user claims, and use the access_token to fetch additional user data if needed.',
    },
  },
];
