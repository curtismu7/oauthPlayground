/**
 * Backend Node.js Templates
 * Express.js server implementations
 */

export class NodeJsTemplates {
	static authorization(config: any): string {
		return `// Node.js Backend - Authorization Endpoint
const express = require('express');
const crypto = require('crypto');
const app = express();

/**
 * OAuth 2.0 Authorization Code Flow - Backend
 * Handles authorization redirect and callback
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: '${config.redirectUri}',
};

// Generate PKCE code verifier and challenge
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

// Start authorization flow
app.get('/auth/login', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');

  // Store in session
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;

  const authUrl = new URL(\`https://auth.pingone.com/\${config.environmentId}/as/authorize\`);
  authUrl.searchParams.append('client_id', config.clientId);
  authUrl.searchParams.append('redirect_uri', config.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);

  res.redirect(authUrl.toString());
});

// Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state
  if (state !== req.session.state) {
    return res.status(400).send('Invalid state parameter');
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
          code: code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code_verifier: req.session.codeVerifier,
        }),
      }
    );

    const tokens = await tokenResponse.json();
    
    // Store tokens in session
    req.session.accessToken = tokens.access_token;
    req.session.idToken = tokens.id_token;

    res.json({ success: true, tokens });
  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`;
	}

	static workerToken(config: any): string {
		return `// Node.js Backend - Worker Token
const fetch = require('node-fetch');

/**
 * Get worker token using client credentials
 * This is the secure way to get tokens on the backend
 */

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: process.env.PINGONE_CLIENT_SECRET, // Use environment variable!
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
      throw new Error(\`Token request failed: \${error.error_description}\`);
    }

    const data = await response.json();
    console.log('Worker token obtained');
    console.log('Expires in:', data.expires_in, 'seconds');
    
    return data.access_token;
  } catch (error) {
    console.error('Failed to get worker token:', error);
    throw error;
  }
}

module.exports = { getWorkerToken };`;
	}

	static deviceSelection(config: any): string {
		return `// Node.js Backend - Device Selection
const fetch = require('node-fetch');

/**
 * List MFA devices for a user
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
};

async function listMfaDevices(accessToken) {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices\`,
      {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Failed to fetch devices: \${error.message}\`);
    }

    const data = await response.json();
    const devices = data._embedded?.devices || [];
    
    console.log(\`Found \${devices.length} MFA device(s)\`);
    
    return devices.map(device => ({
      id: device.id,
      type: device.type,
      name: device.name,
      status: device.status,
    }));
  } catch (error) {
    console.error('Failed to list MFA devices:', error);
    throw error;
  }
}

module.exports = { listMfaDevices };`;
	}

	static mfaChallenge(config: any): string {
		return `// Node.js Backend - MFA Challenge
const fetch = require('node-fetch');

/**
 * Send MFA challenge to device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
};

async function sendMfaChallenge(accessToken, deviceId) {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${deviceId}/otp\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Failed to send challenge: \${error.message}\`);
    }

    const data = await response.json();
    console.log('MFA challenge sent successfully');
    console.log('Challenge ID:', data.id);
    
    return {
      challengeId: data.id,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error('Failed to send MFA challenge:', error);
    throw error;
  }
}

module.exports = { sendMfaChallenge };`;
	}

	static mfaVerification(config: any): string {
		return `// Node.js Backend - MFA Verification
const fetch = require('node-fetch');

/**
 * Verify MFA code
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
};

async function verifyMfaCode(accessToken, deviceId, otp) {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${config.userId}/devices/\${deviceId}/otp/verify\`,
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
      const error = await response.json();
      throw new Error(\`Verification failed: \${error.message}\`);
    }

    const data = await response.json();
    const isVerified = data.status === 'VERIFIED';
    
    console.log('MFA verification:', isVerified ? 'SUCCESS' : 'FAILED');
    
    return {
      verified: isVerified,
      status: data.status,
    };
  } catch (error) {
    console.error('Failed to verify MFA code:', error);
    throw error;
  }
}

module.exports = { verifyMfaCode };`;
	}

	static deviceRegistration(config: any): string {
		return `// Node.js Backend - Device Registration
const fetch = require('node-fetch');

/**
 * Register new MFA device
 */

const config = {
  environmentId: '${config.environmentId}',
  userId: '${config.userId}',
};

async function registerDevice(accessToken, type, details) {
  try {
    const payload = {
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
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Registration failed: \${error.message}\`);
    }

    const device = await response.json();
    console.log(\`\${type} device registered successfully\`);
    
    const result = {
      id: device.id,
      type: device.type,
      name: device.name,
      status: device.status,
    };

    if (type === 'TOTP') {
      result.qrCodeUrl = device.qrCode?.href;
      result.secret = device.secret;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to register device:', error);
    throw error;
  }
}

// Example usage
async function example() {
  const token = await getWorkerToken();
  
  // Register SMS device
  const smsDevice = await registerDevice(token, 'SMS', {
    phone: '+1234567890',
    name: 'My Phone',
  });
  
  console.log('Registered device:', smsDevice);
}

module.exports = { registerDevice };`;
	}
}

export class PythonTemplates {
	static authorization(config: any): string {
		return `# Python Backend - Authorization Flow
from flask import Flask, redirect, request, session
import requests
import secrets
import hashlib
import base64

"""
OAuth 2.0 Authorization Code Flow with PKCE
Flask backend implementation
"""

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

config = {
    'environment_id': '${config.environmentId}',
    'client_id': '${config.clientId}',
    'client_secret': 'YOUR_CLIENT_SECRET',
    'redirect_uri': '${config.redirectUri}',
}

def generate_code_verifier():
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

def generate_code_challenge(verifier):
    digest = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')

@app.route('/auth/login')
def login():
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    state = secrets.token_hex(16)
    
    # Store in session
    session['code_verifier'] = code_verifier
    session['state'] = state
    
    auth_url = f"https://auth.pingone.com/{config['environment_id']}/as/authorize"
    params = {
        'client_id': config['client_id'],
        'redirect_uri': config['redirect_uri'],
        'response_type': 'code',
        'scope': 'openid profile email',
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256',
        'state': state,
    }
    
    return redirect(f"{auth_url}?{requests.compat.urlencode(params)}")

@app.route('/auth/callback')
def callback():
    code = request.args.get('code')
    state = request.args.get('state')
    
    # Verify state
    if state != session.get('state'):
        return {'error': 'Invalid state parameter'}, 400
    
    # Exchange code for tokens
    token_url = f"https://auth.pingone.com/{config['environment_id']}/as/token"
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': config['redirect_uri'],
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'code_verifier': session.get('code_verifier'),
    }
    
    response = requests.post(token_url, data=data)
    tokens = response.json()
    
    # Store tokens in session
    session['access_token'] = tokens.get('access_token')
    session['id_token'] = tokens.get('id_token')
    
    return {'success': True, 'tokens': tokens}

if __name__ == '__main__':
    app.run(port=3000)`;
	}

	static workerToken(config: any): string {
		return `# Python Backend - Worker Token
import requests
import os

"""
Get worker token using client credentials
Secure backend implementation
"""

config = {
    'environment_id': '${config.environmentId}',
    'client_id': '${config.clientId}',
    'client_secret': os.getenv('PINGONE_CLIENT_SECRET'),  # Use environment variable!
}

def get_worker_token():
    """Get worker token for server-to-server API calls"""
    try:
        token_url = f"https://auth.pingone.com/{config['environment_id']}/as/token"
        data = {
            'grant_type': 'client_credentials',
            'client_id': config['client_id'],
            'client_secret': config['client_secret'],
        }
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        
        tokens = response.json()
        print(f"Worker token obtained")
        print(f"Expires in: {tokens['expires_in']} seconds")
        
        return tokens['access_token']
    except requests.exceptions.RequestException as e:
        print(f"Failed to get worker token: {e}")
        raise

if __name__ == '__main__':
    token = get_worker_token()
    print(f"Token: {token[:20]}...")`;
	}

	static deviceSelection(config: any): string {
		return `# Python Backend - Device Selection
import requests

"""
List MFA devices for a user
"""

config = {
    'environment_id': '${config.environmentId}',
    'user_id': '${config.userId}',
}

def list_mfa_devices(access_token):
    """List all MFA devices for a user"""
    try:
        url = f"https://api.pingone.com/v1/environments/{config['environment_id']}/users/{config['user_id']}/devices"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        devices = data.get('_embedded', {}).get('devices', [])
        
        print(f"Found {len(devices)} MFA device(s)")
        
        return [
            {
                'id': device['id'],
                'type': device['type'],
                'name': device['name'],
                'status': device['status'],
            }
            for device in devices
        ]
    except requests.exceptions.RequestException as e:
        print(f"Failed to list MFA devices: {e}")
        raise

if __name__ == '__main__':
    token = 'YOUR_WORKER_TOKEN'
    devices = list_mfa_devices(token)
    for device in devices:
        print(f"- {device['type']}: {device['name']} (ID: {device['id']})")`;
	}

	static mfaChallenge(config: any): string {
		return `# Python Backend - MFA Challenge
import requests

"""
Send MFA challenge to device
"""

config = {
    'environment_id': '${config.environmentId}',
    'user_id': '${config.userId}',
}

def send_mfa_challenge(access_token, device_id):
    """Send MFA challenge code to device"""
    try:
        url = f"https://api.pingone.com/v1/environments/{config['environment_id']}/users/{config['user_id']}/devices/{device_id}/otp"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print('MFA challenge sent successfully')
        print(f"Challenge ID: {data['id']}")
        
        return {
            'challenge_id': data['id'],
            'expires_at': data['expiresAt'],
        }
    except requests.exceptions.RequestException as e:
        print(f"Failed to send MFA challenge: {e}")
        raise

if __name__ == '__main__':
    token = 'YOUR_WORKER_TOKEN'
    device_id = 'DEVICE_ID'
    challenge = send_mfa_challenge(token, device_id)
    print(f"Challenge: {challenge}")`;
	}

	static mfaVerification(config: any): string {
		return `# Python Backend - MFA Verification
import requests

"""
Verify MFA code
"""

config = {
    'environment_id': '${config.environmentId}',
    'user_id': '${config.userId}',
}

def verify_mfa_code(access_token, device_id, otp):
    """Verify MFA code entered by user"""
    try:
        url = f"https://api.pingone.com/v1/environments/{config['environment_id']}/users/{config['user_id']}/devices/{device_id}/otp/verify"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        payload = {'otp': otp}
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        is_verified = data['status'] == 'VERIFIED'
        
        print(f"MFA verification: {'SUCCESS' if is_verified else 'FAILED'}")
        
        return {
            'verified': is_verified,
            'status': data['status'],
        }
    except requests.exceptions.RequestException as e:
        print(f"Failed to verify MFA code: {e}")
        raise

if __name__ == '__main__':
    token = 'YOUR_WORKER_TOKEN'
    device_id = 'DEVICE_ID'
    otp = '123456'
    result = verify_mfa_code(token, device_id, otp)
    print(f"Result: {result}")`;
	}

	static deviceRegistration(config: any): string {
		return `# Python Backend - Device Registration
import requests

"""
Register new MFA device
"""

config = {
    'environment_id': '${config.environmentId}',
    'user_id': '${config.userId}',
}

def register_device(access_token, device_type, details):
    """Register new MFA device for user"""
    try:
        url = f"https://api.pingone.com/v1/environments/{config['environment_id']}/users/{config['user_id']}/devices"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        payload = {
            'type': device_type,
            'name': details.get('name', f'My {device_type} Device'),
        }
        
        if device_type == 'SMS':
            payload['phone'] = details['phone']
        elif device_type == 'EMAIL':
            payload['email'] = details['email']
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        device = response.json()
        print(f"{device_type} device registered successfully")
        
        result = {
            'id': device['id'],
            'type': device['type'],
            'name': device['name'],
            'status': device['status'],
        }
        
        if device_type == 'TOTP':
            result['qr_code_url'] = device.get('qrCode', {}).get('href')
            result['secret'] = device.get('secret')
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"Failed to register device: {e}")
        raise

if __name__ == '__main__':
    token = 'YOUR_WORKER_TOKEN'
    
    # Register SMS device
    sms_device = register_device(token, 'SMS', {
        'phone': '+1234567890',
        'name': 'My Phone',
    })
    
    print(f"Registered device: {sms_device}")`;
	}
}
