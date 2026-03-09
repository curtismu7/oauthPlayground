/**
 * @file ProtectPortalWrapper.tsx
 * @module protect-portal
 * @description Wrapper component for Protect Portal with real configuration
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This wrapper provides the real PingOne configuration to the Protect Portal app
 * and handles the integration with the main application.
 */

import React from 'react';
import { getPortalAppConfig } from './config/protectPortalAppConfig';
import ProtectPortalApp from './ProtectPortalApp';

// ============================================================================
// PROTECT PORTAL WRAPPER
// ============================================================================

const ProtectPortalWrapper: React.FC = () => {
	const config = getPortalAppConfig();

	return (
		<ProtectPortalApp
			environmentId={config.pingone.environmentId}
			clientId={config.pingone.clientId}
			clientSecret={config.pingone.clientSecret}
			redirectUri={config.pingone.redirectUri}
			protectCredentials={{
				environmentId: config.protect.environmentId,
				workerToken: config.protect.workerToken,
				region: config.protect.region,
			}}
		/>
	);
};

export default ProtectPortalWrapper;
