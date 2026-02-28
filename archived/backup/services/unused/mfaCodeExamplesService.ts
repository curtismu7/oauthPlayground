// src/services/mfaCodeExamplesService.ts
// MFA Flow Code Examples Service
// Provides highly commented, production-ready code examples for PingOne MFA flows

export type MfaFlowStep =
	| 'authorization'
	| 'worker-token'
	| 'device-selection'
	| 'mfa-challenge'
	| 'mfa-verification'
	| 'device-registration';

export interface MfaCodeExample {
	language: 'javascript' | 'typescript' | 'python' | 'go';
	title: string;
	code: string;
	description: string;
	dependencies?: string[];
}

export interface MfaCodeExamplesConfig {
	environmentId: string;
	clientId: string;
	redirectUri: string;
	userId: string;
}

export class MfaCodeExamplesService {
	private config: MfaCodeExamplesConfig;

	constructor(config: MfaCodeExamplesConfig) {
		this.config = config;
	}

	getExamplesForStep(step: MfaFlowStep): MfaCodeExample[] {
		switch (step) {
			case 'authorization':
				return this.getAuthorizationExamples();
			case 'worker-token':
				return this.getWorkerTokenExamples();
			case 'device-selection':
				return this.getDeviceSelectionExamples();
			case 'mfa-challenge':
				return this.getMfaChallengeExamples();
			case 'mfa-verification':
				return this.getMfaVerificationExamples();
			case 'device-registration':
				return this.getDeviceRegistrationExamples();
			default:
				return [];
		}
	}

	private getAuthorizationExamples(): MfaCodeExample[] {
		const { environmentId, clientId, redirectUri } = this.config;

		return [
			{
				language: 'typescript',
				title: 'Authorization Code Flow with PKCE',
				description:
					'Initiate OAuth 2.0 Authorization Code flow with PKCE for secure authentication',
				code: `/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 * 
 * PKCE (Proof Key for Code Exchange) adds security by preventing
 * authorization code interception attacks in public clients.
 * 
 * Flow Steps:
 * 1. Generate code verifier and challenge
 * 2. Build authorization URL with PKCE parameters
 * 3. Redirect user to authorization endpoint
 * 4. User authenticates and authorizes
 * 5. Receive authorization code via redirect
 * 6. Exchange code for tokens using code verifier
 */

// Configuration - Replace with your actual values
const config = {
  environmentId: '${environmentId}',
  clientId: '${clientId}',
  redirectUri: '${redirectUri}',
  scopes: 'openid profile email', // Space-separated scopes
};

/**
 * Generates a cryptographically random code verifier
 * Must be 43-128 characters long
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Creates SHA-256 hash of code verifier for code challenge
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generates random state parameter for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Encodes data to base64url format (RFC 4648)
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=/g, '');
}

// Generate PKCE parameters
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);
const state = generateState();

// Build authorization URL
const authUrl = new URL(\`https://auth.pingone.com/\${config.environmentId}/as/authorize\`);
authUrl.searchParams.set('client_id', config.clientId);
authUrl.searchParams.set('redirect_uri', config.redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', config.scopes);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('state', state);

// Store for token exchange
sessionStorage.setItem('pkce_code_verifier', codeVerifier);
sessionStorage.setItem('oauth_state', state);

// Redirect to authorization endpoint
window.location.href = authUrl.toString();`,
				dependencies: ['crypto (built-in)'],
			},
		];
	}

	private getWorkerTokenExamples(): MfaCodeExample[] {
		const { environmentId } = this.config;

		return [
			{
				language: 'typescript',
				title: 'Worker Token Generation',
				description: 'Generate worker app access token for management API calls',
				code: `/**
 * Worker Token Generation (Client Credentials Grant)
 * 
 * Worker tokens enable server-to-server API calls to PingOne Management API.
 * Used for operations like:
 * - Fetching user MFA devices
 * - Sending MFA challenges
 * - Verifying MFA codes
 * - Managing user accounts
 * 
 * Prerequisites:
 * 1. Create Worker App in PingOne Admin Console
 * 2. Grant required permissions (e.g., "Read Users", "Update Users")
 * 3. Obtain client ID and client secret
 * 4. Keep client secret secure (never expose in client-side code)
 */

// Configuration - Use environment variables in production
const workerConfig = {
  environmentId: '${environmentId}',
  clientId: process.env.WORKER_CLIENT_ID || 'YOUR_WORKER_CLIENT_ID',
  clientSecret: process.env.WORKER_CLIENT_SECRET || 'YOUR_WORKER_CLIENT_SECRET',
};

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Fetches worker access token using client credentials grant
 * 
 * @param environmentId - PingOne environment ID
 * @param clientId - Worker app client ID
 * @param clientSecret - Worker app client secret
 * @returns Access token and metadata
 */
async function getWorkerToken(
  environmentId: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  // Construct token endpoint
  const tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;
  
  // Prepare request body
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  // Make token request
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  // Handle errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      \`Token request failed: \${error.error_description || error.error}\`
    );
  }
  
  // Parse response
  const data: TokenResponse = await response.json();
  
  // Log token metadata (never log the actual token)
  console.log(\`Token obtained. Expires in \${data.expires_in} seconds\`);
  
  return data;
}

// Usage example
try {
  const tokenData = await getWorkerToken(
    workerConfig.environmentId,
    workerConfig.clientId,
    workerConfig.clientSecret
  );
  
  // Store token for API calls
  const workerToken = tokenData.access_token;
  
  // Calculate expiration time
  const expiresAt = Date.now() + (tokenData.expires_in * 1000);
  
  // Use in Authorization header for management API calls
  // Example: Authorization: Bearer \${workerToken}
  
} catch (error) {
  console.error('Failed to obtain worker token:', error);
  // Handle error appropriately
}`,
				dependencies: ['fetch (built-in or node-fetch)'],
			},
		];
	}

	private getDeviceSelectionExamples(): MfaCodeExample[] {
		const { environmentId, userId } = this.config;

		return [
			{
				language: 'typescript',
				title: 'Fetch MFA Devices',
				description: 'Retrieve and filter user MFA devices',
				code: `/**
 * MFA Device Selection
 * 
 * Retrieves all registered MFA devices for a user.
 * Devices can be filtered by type, status, or policy requirements.
 * 
 * Device Types:
 * - SMS: Text message verification
 * - EMAIL: Email verification codes
 * - TOTP: Time-based OTP (Google Authenticator, Authy, etc.)
 * - FIDO2: Hardware security keys (YubiKey, etc.)
 * - MOBILE: PingOne mobile app push notifications
 * - VOICE: Voice call verification
 * 
 * Device Status:
 * - ACTIVE: Ready to use
 * - PENDING_ACTIVATION: Needs activation (TOTP)
 * - SUSPENDED: Temporarily disabled
 * - DELETED: Removed
 */

// Configuration
const config = {
  environmentId: '${environmentId}',
  userId: '${userId}',
  workerToken: 'WORKER_ACCESS_TOKEN', // From getWorkerToken()
};

interface MfaDevice {
  id: string;
  type: 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2' | 'MOBILE' | 'VOICE';
  status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED' | 'DELETED';
  name?: string;
  phoneNumber?: string;
  emailAddress?: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Fetches all MFA devices for a user
 * 
 * @param environmentId - PingOne environment ID
 * @param userId - User's unique identifier
 * @param accessToken - Worker app access token
 * @returns Array of MFA devices
 */
async function getMfaDevices(
  environmentId: string,
  userId: string,
  accessToken: string
): Promise<MfaDevice[]> {
  // Construct API endpoint
  const url = \`/pingone-api/v1/environments/\${environmentId}/users/\${userId}/devices\`;
  
  // Make API request
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
  });
  
  // Handle errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      \`Failed to fetch devices: \${error.message || response.statusText}\`
    );
  }
  
  // Parse response
  const data = await response.json();
  const devices: MfaDevice[] = data._embedded?.devices || [];
  
  console.log(\`Found \${devices.length} MFA device(s)\`);
  
  return devices;
}

/**
 * Filters devices by type and status
 */
function filterDevices(
  devices: MfaDevice[],
  options: {
    types?: MfaDevice['type'][];
    status?: MfaDevice['status'];
  }
): MfaDevice[] {
  return devices.filter(device => {
    // Filter by type if specified
    if (options.types && !options.types.includes(device.type)) {
      return false;
    }
    
    // Filter by status if specified
    if (options.status && device.status !== options.status) {
      return false;
    }
    
    return true;
  });
}

// Usage example
try {
  const allDevices = await getMfaDevices(
    config.environmentId,
    config.userId,
    config.workerToken
  );
  
  // Get only active devices
  const activeDevices = filterDevices(allDevices, {
    status: 'ACTIVE'
  });
  
  // Get strong authentication devices (TOTP or FIDO2)
  const strongAuthDevices = filterDevices(activeDevices, {
    types: ['TOTP', 'FIDO2']
  });
  
  // Get convenient authentication devices (SMS or EMAIL)
  const convenientDevices = filterDevices(activeDevices, {
    types: ['SMS', 'EMAIL']
  });
  
  console.log('Device breakdown:', {
    total: allDevices.length,
    active: activeDevices.length,
    strongAuth: strongAuthDevices.length,
    convenient: convenientDevices.length,
  });
  
  // Present devices to user for selection
  
} catch (error) {
  console.error('Failed to fetch MFA devices:', error);
}`,
				dependencies: ['fetch (built-in or node-fetch)'],
			},
		];
	}

	private getMfaChallengeExamples(): MfaCodeExample[] {
		const { environmentId, userId } = this.config;

		return [
			{
				language: 'typescript',
				title: 'Send MFA Challenge',
				description: 'Initiate MFA challenge and send OTP to device',
				code: `/**
 * MFA Challenge Initiation
 * 
 * Sends a one-time password (OTP) challenge to the selected device.
 * 
 * Behavior by device type:
 * - SMS: Sends text message with 6-digit code
 * - EMAIL: Sends email with 6-digit code
 * - TOTP: User generates code from authenticator app (no send needed)
 * - FIDO2: Prompts for security key (no send needed)
 * - MOBILE: Sends push notification to PingOne mobile app
 * - VOICE: Initiates voice call with spoken code
 * 
 * The challenge creates a unique ID that must be used for verification.
 * Challenges typically expire after 5-10 minutes.
 */

// Configuration
const config = {
  environmentId: '${environmentId}',
  userId: '${userId}',
  deviceId: 'SELECTED_DEVICE_ID', // From device selection
  workerToken: 'WORKER_ACCESS_TOKEN',
};

interface ChallengeResponse {
  id: string;
  expiresAt: string;
  status: string;
}

/**
 * Sends MFA challenge to a specific device
 * 
 * @param environmentId - PingOne environment ID
 * @param userId - User's unique identifier
 * @param deviceId - Selected MFA device ID
 * @param accessToken - Worker app access token
 * @returns Challenge information
 */
async function sendMfaChallenge(
  environmentId: string,
  userId: string,
  deviceId: string,
  accessToken: string
): Promise<ChallengeResponse> {
  // Construct API endpoint
  const url = \`/pingone-api/v1/environments/\${environmentId}/users/\${userId}/devices/\${deviceId}/otp\`;
  
  // Send challenge request
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
    // Optional: Customize message for SMS/EMAIL
    // body: JSON.stringify({
    //   message: 'Your verification code is: {{otp}}'
    // })
  });
  
  // Handle errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      \`Failed to send challenge: \${error.message || response.statusText}\`
    );
  }
  
  // Parse response
  const data: ChallengeResponse = await response.json();
  
  console.log('Challenge sent successfully');
  console.log('Challenge ID:', data.id);
  console.log('Expires at:', data.expiresAt);
  
  return data;
}

/**
 * Calculates time remaining until challenge expires
 */
function getTimeRemaining(expiresAt: string): {
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const remaining = expiry - now;
  
  if (remaining <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return { minutes, seconds, expired: false };
}

// Usage example
try {
  const challenge = await sendMfaChallenge(
    config.environmentId,
    config.userId,
    config.deviceId,
    config.workerToken
  );
  
  // Store challenge ID for verification
  sessionStorage.setItem('mfa_challenge_id', challenge.id);
  
  // Calculate expiration
  const timeRemaining = getTimeRemaining(challenge.expiresAt);
  console.log(\`Challenge expires in \${timeRemaining.minutes}m \${timeRemaining.seconds}s\`);
  
  // Prompt user to enter the code
  // For SMS/EMAIL: Code was sent to their device
  // For TOTP: User generates code from authenticator app
  // For FIDO2: User inserts security key
  
} catch (error) {
  console.error('Failed to send MFA challenge:', error);
}`,
				dependencies: ['fetch (built-in or node-fetch)'],
			},
		];
	}

	private getMfaVerificationExamples(): MfaCodeExample[] {
		const { environmentId, userId } = this.config;

		return [
			{
				language: 'typescript',
				title: 'Verify MFA Code',
				description: 'Verify OTP code entered by user',
				code: `/**
 * MFA Code Verification
 * 
 * Verifies the one-time password (OTP) entered by the user.
 * Must be called within the challenge expiration window.
 * 
 * OTP Format:
 * - Typically 6 digits
 * - May vary based on configuration
 * - Case-insensitive for alphanumeric codes
 * 
 * Common Error Scenarios:
 * - Invalid code: Wrong digits entered
 * - Expired challenge: Challenge timeout exceeded
 * - Too many attempts: Rate limit reached
 * - Device not found: Device was deleted
 */

// Configuration
const config = {
  environmentId: '${environmentId}',
  userId: '${userId}',
  deviceId: 'SELECTED_DEVICE_ID',
  challengeId: 'CHALLENGE_ID_FROM_SEND', // From sendMfaChallenge()
  workerToken: 'WORKER_ACCESS_TOKEN',
};

interface VerificationResponse {
  status: 'VERIFIED' | 'FAILED';
  message?: string;
}

/**
 * Verifies MFA code against a challenge
 * 
 * @param environmentId - PingOne environment ID
 * @param userId - User's unique identifier
 * @param deviceId - MFA device ID
 * @param challengeId - Challenge ID from sendMfaChallenge
 * @param otp - One-time password entered by user
 * @param accessToken - Worker app access token
 * @returns Verification result
 */
async function verifyMfaCode(
  environmentId: string,
  userId: string,
  deviceId: string,
  challengeId: string,
  otp: string,
  accessToken: string
): Promise<boolean> {
  // Construct API endpoint
  const url = \`/pingone-api/v1/environments/\${environmentId}/users/\${userId}/devices/\${deviceId}/otp/\${challengeId}\`;
  
  // Send verification request
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      otp: otp.trim(), // Remove whitespace
    }),
  });
  
  // Handle errors
  if (!response.ok) {
    const error = await response.json();
    
    // Provide specific error messages
    if (error.code === 'INVALID_VALUE') {
      throw new Error('Invalid verification code');
    } else if (error.code === 'EXPIRED') {
      throw new Error('Verification code expired');
    } else if (error.code === 'TOO_MANY_ATTEMPTS') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else {
      throw new Error(
        \`Verification failed: \${error.message || response.statusText}\`
      );
    }
  }
  
  // Parse response
  const data: VerificationResponse = await response.json();
  
  // Check verification status
  return data.status === 'VERIFIED';
}

/**
 * Handles verification with retry logic
 */
async function verifyWithRetry(
  otp: string,
  maxAttempts: number = 3
): Promise<boolean> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const isValid = await verifyMfaCode(
        config.environmentId,
        config.userId,
        config.deviceId,
        config.challengeId,
        otp,
        config.workerToken
      );
      
      return isValid;
      
    } catch (error) {
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempts) * 1000)
      );
    }
  }
  
  return false;
}

// Usage example
try {
  // Get code from user input
  const userCode = '123456'; // Replace with actual input
  
  // Verify the code
  const isValid = await verifyMfaCode(
    config.environmentId,
    config.userId,
    config.deviceId,
    config.challengeId,
    userCode,
    config.workerToken
  );
  
  if (isValid) {
    console.log('✓ MFA verification successful');
    
    // Clear stored challenge
    sessionStorage.removeItem('mfa_challenge_id');
    
    // Complete authentication
    // - Issue session tokens
    // - Update user session
    // - Redirect to application
    
  } else {
    console.log('✗ Invalid verification code');
    
    // Handle failed verification
    // - Show error message
    // - Allow retry
    // - Track failed attempts
  }
  
} catch (error) {
  console.error('MFA verification error:', error);
  
  // Handle specific errors
  if (error.message.includes('expired')) {
    // Offer to resend code
  } else if (error.message.includes('attempts')) {
    // Lock account temporarily
  } else {
    // Show generic error
  }
}`,
				dependencies: ['fetch (built-in or node-fetch)'],
			},
		];
	}

	private getDeviceRegistrationExamples(): MfaCodeExample[] {
		const { environmentId, userId } = this.config;

		return [
			{
				language: 'typescript',
				title: 'Register MFA Device',
				description: 'Register new MFA device for user',
				code: `/**
 * MFA Device Registration
 * 
 * Registers a new MFA device for a user.
 * Different device types require different registration flows.
 * 
 * Registration Requirements:
 * - SMS: Valid phone number in E.164 format (+1234567890)
 * - EMAIL: Valid email address
 * - TOTP: Generate secret and QR code for user to scan
 * - FIDO2: WebAuthn registration ceremony
 */

// Configuration
const config = {
  environmentId: '${environmentId}',
  userId: '${userId}',
  workerToken: 'WORKER_ACCESS_TOKEN',
};

/**
 * Registers an SMS device
 */
async function registerSmsDevice(
  environmentId: string,
  userId: string,
  phoneNumber: string,
  accessToken: string
): Promise<{ id: string }> {
  const url = \`/pingone-api/v1/environments/\${environmentId}/users/\${userId}/devices\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'SMS',
      phoneNumber: phoneNumber, // E.164 format: +1234567890
      name: 'My Phone',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Failed to register device: \${error.message}\`);
  }
  
  const device = await response.json();
  return { id: device.id };
}

// Usage
const device = await registerSmsDevice(
  config.environmentId,
  config.userId,
  '+12345678900',
  config.workerToken
);

console.log('Device registered:', device.id);`,
				dependencies: ['fetch (built-in or node-fetch)'],
			},
		];
	}
}
