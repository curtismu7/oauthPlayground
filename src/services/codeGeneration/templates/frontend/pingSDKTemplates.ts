/**
 * PingOne SDK JavaScript/TypeScript Templates
 * Complete implementation for all 6 MFA flow steps
 */

export class PingSDKJavaScriptTemplates {
	static authorization(config: any): string {
		return `// PingOne SDK - Authorization Flow
import { PingOneClient } from '@pingidentity/pingone-js-sdk';

/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * 
 * This example demonstrates how to initiate an authorization flow
 * using the PingOne JavaScript SDK with PKCE for enhanced security.
 */

const client = new PingOneClient({
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
});

async function startAuthorization() {
  try {
    // Generate authorization URL with PKCE
    const authUrl = await client.authorize({
      scope: 'openid profile email',
      responseType: 'code',
      usePKCE: true,
      state: generateRandomState(),
    });
    
    // Store code verifier for token exchange
    sessionStorage.setItem('pkce_code_verifier', client.getCodeVerifier());
    
    // Redirect to PingOne authorization page
    window.location.href = authUrl;
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

startAuthorization();`;
	}

	static workerToken(config: any): string {
		return `// PingOne SDK - Worker Token (Client Credentials)
/**
 * Worker tokens are used for server-to-server API calls
 * to manage MFA devices and challenges.
 * 
 * WARNING: Never expose client secrets in frontend code!
 * This should be done on your backend server.
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET', // Store securely on backend!
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
      throw new Error(\`Token request failed: \${response.statusText}\`);
    }

    const data = await response.json();
    console.log('Worker token obtained:', data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Failed to get worker token:', error);
    throw error;
  }
}

getWorkerToken();`;
	}

	static deviceSelection(config: any): string {
		return `// PingOne SDK - MFA Device Selection
/**
 * List and select MFA devices for a user
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  accessToken: 'YOUR_WORKER_TOKEN', // From previous step
};

async function listMfaDevices() {
  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(\`Failed to fetch devices: \${response.statusText}\`);
    }

    const data = await response.json();
    const devices = data._embedded?.devices || [];
    
    console.log('Available MFA devices:', devices);
    
    // Display devices to user
    devices.forEach((device: any, index: number) => {
      console.log(\`[\${index + 1}] \${device.type} - \${device.name}\`);
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
		return `// PingOne SDK - Send MFA Challenge
/**
 * Send an MFA challenge to a selected device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  deviceId: 'DEVICE_ID', // From device selection
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function sendMfaChallenge() {
  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${config.deviceId}/otp\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(\`Failed to send challenge: \${response.statusText}\`);
    }

    const data = await response.json();
    console.log('MFA challenge sent successfully');
    console.log('Challenge ID:', data.id);
    console.log('Expires at:', data.expiresAt);
    
    return data;
  } catch (error) {
    console.error('Failed to send MFA challenge:', error);
    throw error;
  }
}

sendMfaChallenge();`;
	}

	static mfaVerification(config: any): string {
		return `// PingOne SDK - Verify MFA Code
/**
 * Verify the MFA code entered by the user
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  deviceId: 'DEVICE_ID',
  otp: '123456', // Code from user input
  accessToken: 'YOUR_WORKER_TOKEN',
};

async function verifyMfaCode() {
  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${config.deviceId}/otp/verify\`,
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
    
    console.log('MFA verification result:', isVerified ? 'SUCCESS' : 'FAILED');
    
    if (isVerified) {
      console.log('User successfully authenticated with MFA');
    } else {
      console.log('Invalid code. Please try again.');
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
		return `// PingOne SDK - Register New MFA Device
/**
 * Register a new MFA device for a user
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
  accessToken: 'YOUR_WORKER_TOKEN',
};

// Register SMS Device
async function registerSmsDevice(phoneNumber: string) {
  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SMS',
          phone: phoneNumber,
          name: 'My Phone',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(\`Registration failed: \${response.statusText}\`);
    }

    const device = await response.json();
    console.log('SMS device registered:', device);
    return device;
  } catch (error) {
    console.error('Failed to register SMS device:', error);
    throw error;
  }
}

// Register Email Device
async function registerEmailDevice(email: string) {
  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'EMAIL',
          email: email,
          name: 'My Email',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(\`Registration failed: \${response.statusText}\`);
    }

    const device = await response.json();
    console.log('Email device registered:', device);
    return device;
  } catch (error) {
    console.error('Failed to register email device:', error);
    throw error;
  }
}

// Register TOTP Device (Authenticator App)
async function registerTotpDevice(name: string = 'Authenticator App') {
  try {
    const response = await fetch(
      \`/pingone-api/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TOTP',
          name: name,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(\`Registration failed: \${response.statusText}\`);
    }

    const device = await response.json();
    console.log('TOTP device registered:', device);
    console.log('QR Code URL:', device.qrCode?.href);
    console.log('Secret Key:', device.secret);
    
    return device;
  } catch (error) {
    console.error('Failed to register TOTP device:', error);
    throw error;
  }
}

// Example usage
registerSmsDevice('+1234567890');`;
	}
}
