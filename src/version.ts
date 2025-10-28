import packageJson from '../package.json';

const { version: packageVersion } = packageJson as { version?: string };

export const APP_VERSION = packageVersion ?? '0.0.0-dev';

export const VERSION_METADATA = {
	app: APP_VERSION,
};

export default APP_VERSION;
