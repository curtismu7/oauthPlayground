/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		exclude: [
			'node_modules', 
			'dist', 
			'.idea', 
			'.git', 
			'.cache',
			'src/tests/Phase3Features.test.tsx',
			'src/contexts/__tests__/NewAuthContext.enhanced.test.tsx',
			'src/services/__tests__/flowContextService.test.ts',
			'src/services/__tests__/phase3Validation.test.ts',
			'src/services/__tests__/pingOneMfaService.enhanced.test.ts',
			'src/services/__tests__/qrCodeService.test.ts',
			'src/services/__tests__/redirectStateManager.test.ts',
			'src/tests/csrfProtection.test.ts',
			'src/tests/unifiedStorageService.test.ts',
			'src/utils/__tests__/jwks.test.ts',
			'src/utils/flowRedirectUriMapping.test.ts',
			'src/v8/components/__tests__/StepActionButtonsV8.test.tsx',
			'src/v8/components/__tests__/StepValidationFeedbackV8.test.tsx',
			'src/v8/flows/__tests__/ImplicitFlowV8.test.tsx',
			'src/v8/flows/__tests__/OAuthAuthorizationCodeFlowV8.test.tsx',
			'src/v8/flows/__tests__/TokenExchangeFlowV8.test.tsx',
			'src/v8/flows/unified/__tests__/registrationStatus.test.ts',
			'src/v8/hooks/__tests__/useMFADevices.test.ts',
			'src/v8/hooks/__tests__/useMFAPolicies.test.ts',
			'src/v8/hooks/__tests__/useWorkerToken.test.ts',
			'src/v8/services/__tests__/appDiscoveryServiceV8.test.ts',
			'src/v8/services/__tests__/configCheckerServiceV8.test.ts',
			'src/v8/services/__tests__/errorHandlerV8.test.ts',
			'src/v8/services/__tests__/oauthIntegrationServiceV8.test.ts',
			'src/v8/services/__tests__/realPingOneTest.test.ts',
			'src/v8/services/__tests__/tokenExchangeServiceV8.test.ts',
			'src/v8/services/auth/__tests__/tokenGatewayV8.test.ts',
			'src/v8/utils/__tests__/toastNotificationsV8.test.ts',
			'src/v8u/services/__tests__/unifiedFlowIntegrationV8U.integration.test.ts',
			'src/components/sidebar/__tests__/SidebarPerformance.test.tsx'
		],
	},
});
