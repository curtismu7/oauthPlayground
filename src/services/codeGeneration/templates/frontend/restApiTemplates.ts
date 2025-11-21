/**
 * REST API Templates for Frontend
 * Fetch and Axios implementations
 */

export class RestApiFetchTemplates {
	static authorization(config: any): string {
		return `// REST API (Fetch) - Authorization Flow
/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * Using native Fetch API
 */

// Generate PKCE code verifier and challenge
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
}

async function startAuthorization() {
  const config = {
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    redirectUri: '${config.redirectUri}',
  };

  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier(); // Random state for CSRF protection

    // Store for later use
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

    // Redirect to authorization page
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
}

startAuthorization();`;
	}

	static workerToken(config: any): string {
		return `// REST API (Fetch) - Worker Token
/**
 * Get worker token using client credentials
 * WARNING: This should be done on backend, not frontend!
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET',
};

async function getWorkerToken() {
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
      throw new Error(\`Token request failed: \${error.error_description || response.statusText}\`);
    }

    const data = await response.json();
    console.log('Worker token obtained');
    console.log('Token type:', data.token_type);
    console.log('Expires in:', data.expires_in, 'seconds');
    
    return data.access_token;
  } catch (error) {
    console.error('Failed to get worker token:', error);
    throw error;
  }
}

getWorkerToken();`;
	}

	static deviceSelection(config: any): string {
		return `// REST API (Fetch) - Device Selection
/**
 * List MFA devices for a user
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function listMfaDevices() {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Failed to fetch devices: \${error.message || response.statusText}\`);
    }

    const data = await response.json();
    const devices = data._embedded?.devices || [];
    
    console.log(\`Found \${devices.length} MFA device(s)\`);
    
    devices.forEach((device: any) => {
      console.log(\`- \${device.type}: \${device.name} (ID: \${device.id})\`);
      console.log(\`  Status: \${device.status}\`);
    });
    
    return devices;
  } catch (error) {
    console.error('Failed to list MFA devices:', error);
    throw error;
  }
}

listMfaDevices();`;
	}

	static mfaChallenge(config: any): string {
		return `// REST API (Fetch) - MFA Challenge
/**
 * Send MFA challenge to device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  deviceId: 'DEVICE_ID',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function sendMfaChallenge() {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${config.deviceId}/otp\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Failed to send challenge: \${error.message || response.statusText}\`);
    }

    const data = await response.json();
    console.log('MFA challenge sent successfully');
    console.log('Challenge ID:', data.id);
    console.log('Expires at:', new Date(data.expiresAt).toLocaleString());
    
    return data;
  } catch (error) {
    console.error('Failed to send MFA challenge:', error);
    throw error;
  }
}

sendMfaChallenge();`;
	}

	static mfaVerification(config: any): string {
		return `// REST API (Fetch) - MFA Verification
/**
 * Verify MFA code
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  deviceId: 'DEVICE_ID',
  otp: '123456',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function verifyMfaCode() {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${config.deviceId}/otp/verify\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: config.otp,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Verification failed: \${error.message || response.statusText}\`);
    }

    const data = await response.json();
    const isVerified = data.status === 'VERIFIED';
    
    if (isVerified) {
      console.log('✓ MFA verification successful');
    } else {
      console.log('✗ MFA verification failed - Invalid code');
    }
    
    return isVerified;
  } catch (error) {
    console.error('Failed to verify MFA code:', error);
    throw error;
  }
}

verifyMfaCode();`;
	}

	static deviceRegistration(config: any): string {
		return `// REST API (Fetch) - Device Registration
/**
 * Register new MFA device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function registerDevice(type: 'SMS' | 'EMAIL' | 'TOTP', details: any) {
  try {
    const payload: any = {
      type,
      name: details.name || \`My \${type} Device\`,
    };

    if (type === 'SMS') {
      payload.phone = details.phone;
    } else if (type === 'EMAIL') {
      payload.email = details.email;
    }

    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Registration failed: \${error.message || response.statusText}\`);
    }

    const device = await response.json();
    console.log(\`\${type} device registered successfully\`);
    console.log('Device ID:', device.id);
    
    if (type === 'TOTP') {
      console.log('QR Code URL:', device.qrCode?.href);
      console.log('Secret Key:', device.secret);
    }
    
    return device;
  } catch (error) {
    console.error('Failed to register device:', error);
    throw error;
  }
}

// Example: Register SMS device
registerDevice('SMS', { phone: '+1234567890', name: 'My Phone' });`;
	}
}

export class RestApiAxiosTemplates {
	static authorization(config: any): string {
		return `// REST API (Axios) - Authorization Flow
import axios from 'axios';

/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * Using Axios HTTP client
 */

// Generate PKCE code verifier and challenge
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
}

async function startAuthorization() {
  const config = {
    environmentId: '${config.environmentId}',
    clientId: '${config.clientId}',
    redirectUri: '${config.redirectUri}',
  };

  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier();

    // Store for later use
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state,
    });

    const authUrl = \`https://auth.pingone.com/\${config.environmentId}/as/authorize?\${params}\`;
    
    // Redirect to authorization page
    window.location.href = authUrl;
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
}

startAuthorization();`;
	}

	static workerToken(config: any): string {
		return `// REST API (Axios) - Worker Token
import axios from 'axios';

/**
 * Get worker token using client credentials
 * WARNING: This should be done on backend!
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET',
};

async function getWorkerToken() {
  try {
    const response = await axios.post(
      \`https://auth.pingone.com/\${config.environmentId}/as/token\`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('Worker token obtained');
    console.log('Token type:', response.data.token_type);
    console.log('Expires in:', response.data.expires_in, 'seconds');
    
    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Token request failed:', error.response?.data);
    } else {
      console.error('Failed to get worker token:', error);
    }
    throw error;
  }
}

getWorkerToken();`;
	}

	static deviceSelection(config: any): string {
		return `// REST API (Axios) - Device Selection
import axios from 'axios';

/**
 * List MFA devices for a user
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function listMfaDevices() {
  try {
    const response = await axios.get(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    const devices = response.data._embedded?.devices || [];
    
    console.log(\`Found \${devices.length} MFA device(s)\`);
    
    devices.forEach((device: any) => {
      console.log(\`- \${device.type}: \${device.name} (ID: \${device.id})\`);
      console.log(\`  Status: \${device.status}\`);
    });
    
    return devices;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to fetch devices:', error.response?.data);
    } else {
      console.error('Failed to list MFA devices:', error);
    }
    throw error;
  }
}

listMfaDevices();`;
	}

	static mfaChallenge(config: any): string {
		return `// REST API (Axios) - MFA Challenge
import axios from 'axios';

/**
 * Send MFA challenge to device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  deviceId: 'DEVICE_ID',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function sendMfaChallenge() {
  try {
    const response = await axios.post(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${config.deviceId}/otp\`,
      {},
      {
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('MFA challenge sent successfully');
    console.log('Challenge ID:', response.data.id);
    console.log('Expires at:', new Date(response.data.expiresAt).toLocaleString());
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to send challenge:', error.response?.data);
    } else {
      console.error('Failed to send MFA challenge:', error);
    }
    throw error;
  }
}

sendMfaChallenge();`;
	}

	static mfaVerification(config: any): string {
		return `// REST API (Axios) - MFA Verification
import axios from 'axios';

/**
 * Verify MFA code
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  deviceId: 'DEVICE_ID',
  otp: '123456',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function verifyMfaCode() {
  try {
    const response = await axios.post(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${config.deviceId}/otp/verify\`,
      {
        otp: config.otp,
      },
      {
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    const isVerified = response.data.status === 'VERIFIED';
    
    if (isVerified) {
      console.log('✓ MFA verification successful');
    } else {
      console.log('✗ MFA verification failed - Invalid code');
    }
    
    return isVerified;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Verification failed:', error.response?.data);
    } else {
      console.error('Failed to verify MFA code:', error);
    }
    throw error;
  }
}

verifyMfaCode();`;
	}

	static deviceRegistration(config: any): string {
		return `// REST API (Axios) - Device Registration
import axios from 'axios';

/**
 * Register new MFA device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function registerDevice(type: 'SMS' | 'EMAIL' | 'TOTP', details: any) {
  try {
    const payload: any = {
      type,
      name: details.name || \`My \${type} Device\`,
    };

    if (type === 'SMS') {
      payload.phone = details.phone;
    } else if (type === 'EMAIL') {
      payload.email = details.email;
    }

    const response = await axios.post(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      payload,
      {
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(\`\${type} device registered successfully\`);
    console.log('Device ID:', response.data.id);
    
    if (type === 'TOTP') {
      console.log('QR Code URL:', response.data.qrCode?.href);
      console.log('Secret Key:', response.data.secret);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Registration failed:', error.response?.data);
    } else {
      console.error('Failed to register device:', error);
    }
    throw error;
  }
}

// Example: Register SMS device
registerDevice('SMS', { phone: '+1234567890', name: 'My Phone' });`;
	}
}
