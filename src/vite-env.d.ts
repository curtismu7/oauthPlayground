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

	// Optional: backend base URL for API status / health (e.g. production when /api is not proxied)
	readonly VITE_BACKEND_URL?: string;

	// Optional: public app URL / custom domain (e.g. https://api.pingdemo.com:3000); set by run.sh
	readonly VITE_PUBLIC_APP_URL?: string;

	// Feature Flags
	readonly VITE_FEATURE_DEBUG_MODE: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
