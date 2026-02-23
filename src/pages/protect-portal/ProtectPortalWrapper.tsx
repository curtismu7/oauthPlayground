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
import ProtectPortalAppPingUI from './ProtectPortalApp.PingUI';
import { BrandThemeProvider } from './themes/theme-provider';

// ============================================================================
// PROTECT PORTAL WRAPPER
// ============================================================================

const ProtectPortalWrapper: React.FC = () => {
	const _config = getPortalAppConfig();

	return (
		<BrandThemeProvider>
			<ProtectPortalAppPingUI />
		</BrandThemeProvider>
	);
};

export default ProtectPortalWrapper;
