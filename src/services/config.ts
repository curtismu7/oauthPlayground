import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Required environment variables
  VITE_APP_TITLE: z.string().default('PingOne OAuth/OIDC Playground'),
  VITE_APP_DESCRIPTION: z.string().default('Interactive playground for OAuth 2.0 and OpenID Connect with PingOne'),
  VITE_APP_VERSION: z.string().default('4.9.2'),
  VITE_APP_DEFAULT_THEME: z.enum(['light', 'dark']).default('light'),
  
  // PingOne Configuration
  VITE_PINGONE_ENVIRONMENT_ID: z.string().min(1, 'PingOne Environment ID is required'),
  VITE_PINGONE_CLIENT_ID: z.string().min(1, 'PingOne Client ID is required'),
  VITE_PINGONE_CLIENT_SECRET: z.string().min(1, 'PingOne Client Secret is required'),
  VITE_PINGONE_REDIRECT_URI: z.string().url('Valid redirect URI is required'),
  VITE_PINGONE_LOGOUT_REDIRECT_URI: z.string().url('Valid logout redirect URI is required'),
  VITE_PINGONE_API_URL: z.string().url('Valid API URL is required').default('https://auth.pingone.com'),
  
  // Optional configuration with defaults
  VITE_DEV_SERVER_PORT: z.coerce.number().int().positive().default(3000),
  VITE_DEV_SERVER_HTTPS: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
  
  // Feature flags
  VITE_FEATURE_DEBUG_MODE: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
});

// Type for the validated environment variables
type EnvConfig = z.infer<typeof envSchema>;

// Validate and parse environment variables
const parseEnv = (): EnvConfig => {
  try {
    // In Vite, import.meta.env contains the environment variables
    const envVars = Object.fromEntries(
      Object.entries(import.meta.env)
        .filter(([key]) => key.startsWith('VITE_'))
        .map(([key, value]) => [key, value])
    );

    return envSchema.parse(envVars);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
    } else if (error instanceof Error) {
      console.error('❌ Failed to parse environment variables:', error.message);
    } else {
      console.error('❌ Failed to parse environment variables: Unknown error');
    }
    throw new Error('Invalid environment variables');
  }
};

// Get the validated environment variables
const env = parseEnv();

// Configuration object with derived values
export const config = {
  // App info
  app: {
    title: env.VITE_APP_TITLE,
    description: env.VITE_APP_DESCRIPTION,
    version: env.VITE_APP_VERSION,
    defaultTheme: env.VITE_APP_DEFAULT_THEME,
  },
  
  // PingOne configuration
  pingone: {
    environmentId: env.VITE_PINGONE_ENVIRONMENT_ID,
    clientId: env.VITE_PINGONE_CLIENT_ID,
    clientSecret: env.VITE_PINGONE_CLIENT_SECRET,
    redirectUri: env.VITE_PINGONE_REDIRECT_URI,
    logoutRedirectUri: env.VITE_PINGONE_LOGOUT_REDIRECT_URI,
    apiUrl: env.VITE_PINGONE_API_URL,
    
    // Derived endpoints
    authEndpoint: `${env.VITE_PINGONE_API_URL}/${env.VITE_PINGONE_ENVIRONMENT_ID}/as/authorize`,
    tokenEndpoint: `${env.VITE_PINGONE_API_URL}/${env.VITE_PINGONE_ENVIRONMENT_ID}/as/token`,
    userInfoEndpoint: `${env.VITE_PINGONE_API_URL}/${env.VITE_PINGONE_ENVIRONMENT_ID}/as/userinfo`,
    logoutEndpoint: `${env.VITE_PINGONE_API_URL}/${env.VITE_PINGONE_ENVIRONMENT_ID}/as/signoff`,
  },
  
  // Development settings
  dev: {
    port: env.VITE_DEV_SERVER_PORT,
    https: env.VITE_DEV_SERVER_HTTPS,
  },
  
  // Feature flags
  features: {
    debugMode: env.VITE_FEATURE_DEBUG_MODE,
  },
  
  // Default OAuth scopes
  defaultScopes: [
    'openid',
    'profile',
    'email',
    'address',
    'phone',
  ],
  
  // PKCE configuration
  pkce: {
    codeVerifierLength: 64,
    stateLength: 32,
    nonceLength: 32,
  },
} as const;

// Type for the config object
export type Config = typeof config;

// Helper function to get a nested config value by path
export const getConfigValue = <T>(path: string, defaultValue: T): T => {
  const keys = path.split('.');
  let result: unknown = config;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key as keyof typeof result];
  }
  
  return result !== undefined ? result as T : defaultValue;
};

// Export the config as default
export default config;
