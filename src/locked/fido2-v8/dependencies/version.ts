import packageJson from '../package.json';

const {
	version: packageVersion,
	mfaV8Version,
	unifiedV8uVersion,
} = packageJson as {
	version?: string;
	mfaV8Version?: string;
	unifiedV8uVersion?: string;
};

export const APP_VERSION = packageVersion ?? '0.0.0-dev';
export const MFA_V8_VERSION = mfaV8Version ?? '0.0.0-dev';
export const UNIFIED_V8U_VERSION = unifiedV8uVersion ?? '0.0.0-dev';

export const VERSION_METADATA = {
	app: APP_VERSION,
	ui: APP_VERSION,
	server: APP_VERSION,
	logs: APP_VERSION,
	mfaV8: MFA_V8_VERSION,
	unifiedV8u: UNIFIED_V8U_VERSION,
} as const;

export default APP_VERSION;
