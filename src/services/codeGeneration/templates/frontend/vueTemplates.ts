/**
 * Vue.js Templates
 * Composition API with Pinia for state management
 */

export class VueTemplates {
  static authorization(config: any): string {
    return `// Vue.js - Authorization Composable
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

/**
 * OAuth 2.0 Authorization with Vue Composition API
 */

const router = useRouter();
const isAuthenticated = ref(false);
const user = ref<any | null>(null);

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

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

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
  isAuthenticated.value = false;
  user.value = null;
  sessionStorage.clear();
  router.push('/login');
};

// Handle OAuth callback
onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (code && state === sessionStorage.getItem('oauth_state')) {
    console.log('Authorization code received:', code);
    isAuthenticated.value = true;
  }
});
</script>

<template>
  <div class="auth-container">
    <button @click="isAuthenticated ? logout() : login()" class="auth-btn">
      {{ isAuthenticated ? 'Logout' : 'Login with PingOne' }}
    </button>
  </div>
</template>

// Pinia Store (stores/auth.ts)
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const user = ref<any | null>(null);

  const login = async () => {
    // Login logic here
  };

  const logout = () => {
    isAuthenticated.value = false;
    user.value = null;
    sessionStorage.clear();
  };

  return { isAuthenticated, user, login, logout };
});`;
  }

  static workerToken(config: any): string {
    return `// Vue.js - Worker Token Composable
<script setup lang="ts">
import { ref, onMounted } from 'vue';

/**
 * Worker Token Management
 * WARNING: This should be done on backend!
 */

const token = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET', // Never expose in frontend!
};

const fetchToken = async () => {
  loading.value = true;
  error.value = null;

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
    token.value = data.access_token;
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchToken();
});
</script>

<template>
  <div class="token-display">
    <div v-if="loading">Loading token...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="token">
      <h3>Worker Token</h3>
      <code>{{ token.substring(0, 20) }}...</code>
    </div>
  </div>
</template>

// Composable (composables/useWorkerToken.ts)
import { ref } from 'vue';

export function useWorkerToken() {
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchToken = async () => {
    // Token fetching logic
  };

  return { token, loading, error, fetchToken };
}`;
  }

  static deviceSelection(config: any): string {
    return `// Vue.js - MFA Device Selection
<script setup lang="ts">
import { ref, onMounted } from 'vue';

/**
 * MFA Device Selection Component
 */

interface MFADevice {
  id: string;
  type: string;
  name: string;
  status: string;
}

interface Props {
  accessToken: string;
  userId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  deviceSelect: [deviceId: string];
}>();

const devices = ref<MFADevice[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const config = {
  environmentId: '${config.environmentId}',
};

const fetchDevices = async () => {
  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${props.userId}/devices\`,
      {
        headers: {
          'Authorization': \`Bearer \${props.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    devices.value = data._embedded?.devices || [];
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
};

const selectDevice = (deviceId: string) => {
  emit('deviceSelect', deviceId);
};

onMounted(() => {
  fetchDevices();
});
</script>

<template>
  <div class="device-list">
    <h3>Select MFA Device</h3>
    
    <div v-if="loading" class="loading">Loading MFA devices...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="devices.length === 0" class="no-devices">
      No MFA devices found
    </div>
    <div v-else>
      <button
        v-for="device in devices"
        :key="device.id"
        class="device-item"
        @click="selectDevice(device.id)"
      >
        <span class="device-type">{{ device.type }}</span>
        <span class="device-name">{{ device.name }}</span>
        <span class="device-status">{{ device.status }}</span>
      </button>
    </div>
  </div>
</template>`;
  }

  static mfaChallenge(config: any): string {
    return `// Vue.js - MFA Challenge
<script setup lang="ts">
import { ref } from 'vue';

/**
 * MFA Challenge Component
 */

interface Props {
  accessToken: string;
  userId: string;
  deviceId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  challengeComplete: [challengeId: string];
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const challengeSent = ref(false);

const config = {
  environmentId: '${config.environmentId}',
};

const sendChallenge = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${props.userId}/devices/\${props.deviceId}/otp\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${props.accessToken}\`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send challenge');
    }

    const data = await response.json();
    challengeSent.value = true;
    emit('challengeComplete', data.id);
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="mfa-challenge">
    <h3>MFA Challenge</h3>
    
    <button
      v-if="!challengeSent"
      @click="sendChallenge"
      :disabled="loading"
      class="send-challenge-btn"
    >
      {{ loading ? 'Sending...' : 'Send Code' }}
    </button>
    
    <div v-else class="challenge-sent">
      ✓ Challenge code sent! Check your device.
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>`;
  }

  static mfaVerification(config: any): string {
    return `// Vue.js - MFA Verification
<script setup lang="ts">
import { ref } from 'vue';

/**
 * MFA Code Verification Component
 */

interface Props {
  accessToken: string;
  userId: string;
  deviceId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  verificationComplete: [success: boolean];
}>();

const code = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const config = {
  environmentId: '${config.environmentId}',
};

const verifyCode = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${props.userId}/devices/\${props.deviceId}/otp/verify\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${props.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: code.value }),
      }
    );

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    const data = await response.json();
    const isVerified = data.status === 'VERIFIED';
    
    if (isVerified) {
      emit('verificationComplete', true);
    } else {
      error.value = 'Invalid code. Please try again.';
    }
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="mfa-verification">
    <h3>Enter Verification Code</h3>
    
    <form @submit.prevent="verifyCode">
      <input
        v-model="code"
        type="text"
        placeholder="Enter 6-digit code"
        maxlength="6"
        pattern="[0-9]{6}"
        required
        class="code-input"
      />
      
      <button
        type="submit"
        :disabled="loading || code.length !== 6"
        class="verify-btn"
      >
        {{ loading ? 'Verifying...' : 'Verify Code' }}
      </button>
    </form>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>`;
  }

  static deviceRegistration(config: any): string {
    return `// Vue.js - Device Registration
<script setup lang="ts">
import { ref } from 'vue';

/**
 * MFA Device Registration Component
 */

interface Props {
  accessToken: string;
  userId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  registrationComplete: [device: any];
}>();

type DeviceType = 'SMS' | 'EMAIL' | 'TOTP';

const deviceType = ref<DeviceType>('SMS');
const phone = ref('');
const email = ref('');
const name = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const config = {
  environmentId: '${config.environmentId}',
};

const registerDevice = async () => {
  loading.value = true;
  error.value = null;

  try {
    const payload: any = {
      type: deviceType.value,
      name: name.value || \`My \${deviceType.value} Device\`,
    };

    if (deviceType.value === 'SMS') {
      payload.phone = phone.value;
    } else if (deviceType.value === 'EMAIL') {
      payload.email = email.value;
    }

    const response = await fetch(
      \`https://api.pingone.com/v1/environments/\${config.environmentId}/users/\${props.userId}/devices\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${props.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const device = await response.json();
    emit('registrationComplete', device);
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="device-registration">
    <h3>Register MFA Device</h3>
    
    <form @submit.prevent="registerDevice">
      <div class="form-group">
        <label>Device Type</label>
        <select v-model="deviceType">
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="TOTP">Authenticator App</option>
        </select>
      </div>

      <div class="form-group">
        <label>Device Name</label>
        <input
          v-model="name"
          type="text"
          placeholder="My Device"
        />
      </div>

      <div v-if="deviceType === 'SMS'" class="form-group">
        <label>Phone Number</label>
        <input
          v-model="phone"
          type="tel"
          placeholder="+1234567890"
          required
        />
      </div>

      <div v-if="deviceType === 'EMAIL'" class="form-group">
        <label>Email Address</label>
        <input
          v-model="email"
          type="email"
          placeholder="user@example.com"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="register-btn"
      >
        {{ loading ? 'Registering...' : 'Register Device' }}
      </button>
    </form>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>`;
  }
}
