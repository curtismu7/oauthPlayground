/**
 * Next.js Templates
 * Server-side + Client-side with API routes
 */

export class NextJsTemplates {
	static authorization(config: any): string {
		return `// Next.js - Authorization Flow
// pages/api/auth/login.ts (API Route)
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

/**
 * OAuth 2.0 Authorization - Next.js API Route
 * Handles server-side authorization redirect
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
};

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');

  // Store in cookie (use secure session in production)
  res.setHeader('Set-Cookie', [
    \`pkce_verifier=\${codeVerifier}; Path=/; HttpOnly; SameSite=Lax\`,
    \`oauth_state=\${state}; Path=/; HttpOnly; SameSite=Lax\`,
  ]);

  const authUrl = new URL(\`https://auth.pingone.com/\${config.environmentId}/as/authorize\`);
  authUrl.searchParams.append('client_id', config.clientId);
  authUrl.searchParams.append('redirect_uri', config.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);

  res.redirect(authUrl.toString());
}

// pages/api/auth/callback.ts (Callback Handler)
export async function callbackHandler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  
  // Verify state from cookie
  const cookies = parseCookies(req);
  if (state !== cookies.oauth_state) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(
      \`https://auth.pingone.com/\${config.environmentId}/as/token\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          code_verifier: cookies.pkce_verifier,
        }),
      }
    );

    const tokens = await tokenResponse.json();
    
    // Store tokens in secure cookie
    res.setHeader('Set-Cookie', [
      \`access_token=\${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict\`,
      \`id_token=\${tokens.id_token}; Path=/; HttpOnly; Secure; SameSite=Strict\`,
    ]);

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function parseCookies(req: NextApiRequest) {
  const cookies: Record<string, string> = {};
  req.headers.cookie?.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    cookies[key] = value;
  });
  return cookies;
}

// components/LoginButton.tsx (Client Component)
'use client';

export const LoginButton = () => {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <button type="button" onClick={handleLogin} className="login-btn">
      Login with PingOne
    </button>
  );
};`;
	}

	static workerToken(config: any): string {
		return `// Next.js - Worker Token API Route
// pages/api/worker-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Worker Token API Route
 * Server-side token acquisition
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: process.env.PINGONE_CLIENT_SECRET!, // Environment variable
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      \`https://auth.pingone.com/\${config.environmentId}/as/token\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Token request failed');
    }

    const data = await response.json();
    
    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Failed to get worker token:', error);
    res.status(500).json({ error: 'Failed to get worker token' });
  }
}

// Client-side hook
// hooks/useWorkerToken.ts
import { useState, useEffect } from 'react';

export const useWorkerToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/worker-token', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to get token');
        }

        const data = await response.json();
        setToken(data.access_token);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading, error };
};`;
	}

	static deviceSelection(config: any): string {
		return `// Next.js - Device Selection
// pages/api/devices/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * List MFA Devices API Route
 */

const config = {
  environmentId: '${config.environmentId}',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, accessToken } = req.query;

  if (!userId || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${userId}/devices\`,
      {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    const devices = data._embedded?.devices || [];

    res.status(200).json({ devices });
  } catch (error) {
    console.error('Failed to list devices:', error);
    res.status(500).json({ error: 'Failed to list devices' });
  }
}

// components/DeviceList.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';

interface Device {
  id: string;
  type: string;
  name: string;
  status: string;
}

export const DeviceList = ({ userId, accessToken }: { userId: string; accessToken: string }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(
          \`/api/devices/list?userId=\${userId}&accessToken=\${accessToken}\`
        );
        const data = await response.json();
        setDevices(data.devices);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [userId, accessToken]);

  if (loading) return <div>Loading devices...</div>;

  return (
    <div className="device-list">
      {devices.map((device) => (
        <div key={device.id} className="device-item">
          <span>{device.type}</span>
          <span>{device.name}</span>
          <span>{device.status}</span>
        </div>
      ))}
    </div>
  );
};`;
	}

	static mfaChallenge(config: any): string {
		return `// Next.js - MFA Challenge
// pages/api/mfa/challenge.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Send MFA Challenge API Route
 */

const config = {
  environmentId: '${config.environmentId}',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, deviceId, accessToken } = req.body;

  if (!userId || !deviceId || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${userId}/devices/\${deviceId}/otp\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send challenge');
    }

    const data = await response.json();

    res.status(200).json({
      challengeId: data.id,
      expiresAt: data.expiresAt,
    });
  } catch (error) {
    console.error('Failed to send challenge:', error);
    res.status(500).json({ error: 'Failed to send challenge' });
  }
}

// components/ChallengeButton.tsx (Client Component)
'use client';

import { useState } from 'react';

export const ChallengeButton = ({ 
  userId, 
  deviceId, 
  accessToken 
}: { 
  userId: string; 
  deviceId: string; 
  accessToken: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deviceId, accessToken }),
      });

      if (response.ok) {
        setSent(true);
      }
    } catch (error) {
      console.error('Failed to send challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={sendChallenge} disabled={loading || sent}>
      {sent ? 'Code Sent!' : loading ? 'Sending...' : 'Send Code'}
    </button>
  );
};`;
	}

	static mfaVerification(config: any): string {
		return `// Next.js - MFA Verification
// pages/api/mfa/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Verify MFA Code API Route
 */

const config = {
  environmentId: '${config.environmentId}',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, deviceId, otp, accessToken } = req.body;

  if (!userId || !deviceId || !otp || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${userId}/devices/\${deviceId}/otp/verify\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      }
    );

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    const isVerified = data.status === 'VERIFIED';

    res.status(200).json({ verified: isVerified });
  } catch (error) {
    console.error('Failed to verify code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
}

// components/VerificationForm.tsx (Client Component)
'use client';

import { useState } from 'react';

export const VerificationForm = ({ 
  userId, 
  deviceId, 
  accessToken,
  onSuccess 
}: { 
  userId: string; 
  deviceId: string; 
  accessToken: string;
  onSuccess: () => void;
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deviceId, otp: code, accessToken }),
      });

      const data = await response.json();

      if (data.verified) {
        onSuccess();
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      <button type="submit" disabled={loading || code.length !== 6}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};`;
	}

	static deviceRegistration(config: any): string {
		return `// Next.js - Device Registration
// pages/api/devices/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Register MFA Device API Route
 */

const config = {
  environmentId: '${config.environmentId}',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, type, phone, email, name, accessToken } = req.body;

  if (!userId || !type || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const payload: any = {
      type,
      name: name || \`My \${type} Device\`,
    };

    if (type === 'SMS' && phone) {
      payload.phone = phone;
    } else if (type === 'EMAIL' && email) {
      payload.email = email;
    }

    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${userId}/devices\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const device = await response.json();

    res.status(200).json({ device });
  } catch (error) {
    console.error('Failed to register device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
}

// components/RegisterDeviceForm.tsx (Client Component)
'use client';

import { useState } from 'react';

type DeviceType = 'SMS' | 'EMAIL' | 'TOTP';

export const RegisterDeviceForm = ({ 
  userId, 
  accessToken,
  onSuccess 
}: { 
  userId: string; 
  accessToken: string;
  onSuccess: (device: any) => void;
}) => {
  const [type, setType] = useState<DeviceType>('SMS');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, phone, email, name, accessToken }),
      });

      const data = await response.json();
      onSuccess(data.device);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={type} onChange={(e) => setType(e.target.value as DeviceType)}>
        <option value="SMS">SMS</option>
        <option value="EMAIL">Email</option>
        <option value="TOTP">Authenticator App</option>
      </select>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Device name"
      />

      {type === 'SMS' && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1234567890"
          required
        />
      )}

      {type === 'EMAIL' && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
        />
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register Device'}
      </button>
    </form>
  );
};`;
	}
}
