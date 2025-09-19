 
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_DEFAULT_THEME: 'light' | 'dark';
  
  // PingOne Configuration
  readonly VITE_PINGONE_ENVIRONMENT_ID: string;
  readonly VITE_PINGONE_CLIENT_ID: string;
  readonly VITE_PINGONE_REDIRECT_URI: string;
  readonly VITE_PINGONE_LOGOUT_REDIRECT_URI: string;
  readonly VITE_PINGONE_API_URL: string;
  
  // Development Settings
  readonly VITE_DEV_SERVER_PORT: string;
  readonly VITE_DEV_SERVER_HTTPS: string;
  
  // Feature Flags
  readonly VITE_FEATURE_DEBUG_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
