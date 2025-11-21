/**
 * React Templates
 * Hooks-based implementation with Context API
 */

export class ReactTemplates {
	static authorization(config: any): string {
		return `// React - Authorization Flow
import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * OAuth 2.0 Authorization with React Hooks
 * Uses Context API for state management
 */

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  const config = {
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    redirectUri: '${config.redirectUri}',
  };

  // Generate PKCE parameters
  const generateCodeVerifier = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
      .replace(/=/g, '');
  };

  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
      .replace(/=/g, '');
  };

  const login = async () => {
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateCodeVerifier();

      // Store for callback
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL
      const authUrl = new URL(\`https://auth.pingone.com/\${config.environmentId}/as/authorize\`);
      authUrl.searchParams.append('client_id', config.clientId);
      authUrl.searchParams.append('redirect_uri', config.redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', 'openid profile email');
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('state', state);

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    sessionStorage.clear();
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (code && state === sessionStorage.getItem('oauth_state')) {
        // Exchange code for tokens (should be done on backend)
        console.log('Authorization code received:', code);
        setIsAuthenticated(true);
      }
    };

    handleCallback();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Usage in component
export const LoginButton: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <button onClick={isAuthenticated ? logout : login}>
      {isAuthenticated ? 'Logout' : 'Login with PingOne'}
    </button>
  );
};`;
	}

	static workerToken(config: any): string {
		return `// React - Worker Token Hook
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing worker tokens
 * WARNING: This should be done on backend!
 */

interface UseWorkerTokenResult {
  token: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useWorkerToken = (): UseWorkerTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const config = {
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    clientSecret: 'YOUR_CLIENT_SECRET', // Never expose in frontend!
  };

  const fetchToken = async () => {
    setLoading(true);
    setError(null);

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
        throw new Error('Failed to get worker token');
      }

      const data = await response.json();
      setToken(data.access_token);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return { token, loading, error, refetch: fetchToken };
};

// Usage in component
export const WorkerTokenDisplay: React.FC = () => {
  const { token, loading, error } = useWorkerToken();

  if (loading) return <div>Loading token...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!token) return <div>No token</div>;

  return (
    <div>
      <h3>Worker Token</h3>
      <code>{token.substring(0, 20)}...</code>
    </div>
  );
};`;
	}

	static deviceSelection(config: any): string {
		return `// React - MFA Device Selection
import React, { useState, useEffect } from 'react';

/**
 * MFA Device Selection Component
 */

interface MFADevice {
  id: string;
  type: string;
  name: string;
  status: string;
}

interface DeviceListProps {
  accessToken: string;
  userId: string;
  onDeviceSelect: (deviceId: string) => void;
}

export const MFADeviceList: React.FC<DeviceListProps> = ({
  accessToken,
  userId,
  onDeviceSelect,
}) => {
  const [devices, setDevices] = useState<MFADevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = {
    environmentId: '${config.environmentId}',
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(
          \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${userId}/devices\`,
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
        setDevices(data._embedded?.devices || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [accessToken, userId]);

  if (loading) {
    return <div className="loading">Loading MFA devices...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (devices.length === 0) {
    return <div className="no-devices">No MFA devices found</div>;
  }

  return (
    <div className="device-list">
      <h3>Select MFA Device</h3>
      {devices.map((device) => (
        <button
          key={device.id}
          className="device-item"
          onClick={() => onDeviceSelect(device.id)}
        >
          <span className="device-type">{device.type}</span>
          <span className="device-name">{device.name}</span>
          <span className="device-status">{device.status}</span>
        </button>
      ))}
    </div>
  );
};`;
	}

	static mfaChallenge(config: any): string {
		return `// React - MFA Challenge
import React, { useState } from 'react';

/**
 * MFA Challenge Component
 */

interface MFAChallengeProps {
  accessToken: string;
  userId: string;
  deviceId: string;
  onChallengeComplete: (challengeId: string) => void;
}

export const MFAChallenge: React.FC<MFAChallengeProps> = ({
  accessToken,
  userId,
  deviceId,
  onChallengeComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeSent, setChallengeSent] = useState(false);

  const config = {
    environmentId: '${config.environmentId}',
  };

  const sendChallenge = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${userId}/devices/\${deviceId}/otp\`,
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
      setChallengeSent(true);
      onChallengeComplete(data.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-challenge">
      <h3>MFA Challenge</h3>
      
      {!challengeSent ? (
        <button
          onClick={sendChallenge}
          disabled={loading}
          className="send-challenge-btn"
        >
          {loading ? 'Sending...' : 'Send Code'}
        </button>
      ) : (
        <div className="challenge-sent">
          ✓ Challenge code sent! Check your device.
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};`;
	}

	static mfaVerification(config: any): string {
		return `// React - MFA Verification
import React, { useState } from 'react';

/**
 * MFA Code Verification Component
 */

interface MFAVerificationProps {
  accessToken: string;
  userId: string;
  deviceId: string;
  onVerificationComplete: (success: boolean) => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  accessToken,
  userId,
  deviceId,
  onVerificationComplete,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = {
    environmentId: '${config.environmentId}',
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${userId}/devices/\${deviceId}/otp/verify\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp: code }),
        }
      );

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();
      const isVerified = data.status === 'VERIFIED';
      
      if (isVerified) {
        onVerificationComplete(true);
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-verification">
      <h3>Enter Verification Code</h3>
      
      <form onSubmit={verifyCode}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          pattern="[0-9]{6}"
          required
          className="code-input"
        />
        
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="verify-btn"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
};`;
	}

	static deviceRegistration(config: any): string {
		return `// React - Device Registration
import React, { useState } from 'react';

/**
 * MFA Device Registration Component
 */

interface DeviceRegistrationProps {
  accessToken: string;
  userId: string;
  onRegistrationComplete: (device: any) => void;
}

type DeviceType = 'SMS' | 'EMAIL' | 'TOTP';

export const DeviceRegistration: React.FC<DeviceRegistrationProps> = ({
  accessToken,
  userId,
  onRegistrationComplete,
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('SMS');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = {
    environmentId: '${config.environmentId}',
  };

  const registerDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        type: deviceType,
        name: name || \`My \${deviceType} Device\`,
      };

      if (deviceType === 'SMS') {
        payload.phone = phone;
      } else if (deviceType === 'EMAIL') {
        payload.email = email;
      }

      const response = await fetch(
        \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${userId}/devices\`,
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
      onRegistrationComplete(device);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="device-registration">
      <h3>Register MFA Device</h3>
      
      <form onSubmit={registerDevice}>
        <div className="form-group">
          <label>Device Type</label>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as DeviceType)}
          >
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
            <option value="TOTP">Authenticator App</option>
          </select>
        </div>

        <div className="form-group">
          <label>Device Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Device"
          />
        </div>

        {deviceType === 'SMS' && (
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              required
            />
          </div>
        )}

        {deviceType === 'EMAIL' && (
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="register-btn"
        >
          {loading ? 'Registering...' : 'Register Device'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
};`;
	}
}
