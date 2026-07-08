export const AUTH_CODE_FLOW_STEPS = [
  {
    id: '1',
    title: 'Configure',
    description: 'Set client credentials and scope',
  },
  {
    id: '2',
    title: 'Generate PKCE',
    description: 'Create code verifier and challenge (S256)',
  },
  {
    id: '3',
    title: 'Authorization Request',
    description: 'Send user to authorization endpoint',
  },
  {
    id: '4',
    title: 'Authorization Code',
    description: 'Receive code after user approves',
  },
  {
    id: '5',
    title: 'Exchange Code',
    description: 'POST code to token endpoint',
  },
  {
    id: '6',
    title: 'Access Tokens',
    description: 'Receive access token and optionally ID token',
  },
];
