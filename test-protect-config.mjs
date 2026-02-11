// Test script to verify Protect Portal config loads without process.env errors
import { getPortalAppConfig } from './src/pages/protect-portal/config/protectPortalAppConfig.ts';
import { getEnvironmentConfig } from './src/pages/protect-portal/config/protectPortal.config.ts';

console.log('🧪 Testing Protect Portal Config Loading...');

try {
  // Test app config
  const appConfig = getPortalAppConfig();
  console.log('✅ App config loaded successfully:', {
    hasPingOneConfig: !!appConfig.pingone,
    hasProtectConfig: !!appConfig.protect,
    isDevelopment: appConfig.isDevelopment
  });

  // Test environment config
  const envConfig = getEnvironmentConfig();
  console.log('✅ Environment config loaded successfully:', {
    hasRiskPolicies: !!envConfig.riskPolicies,
    hasMFAConfig: !!envConfig.mfaConfig,
    hasUIConfig: !!envConfig.uiConfig
  });

  console.log('🎉 All configs loaded without process.env errors!');
} catch (error) {
  console.error('❌ Config loading failed:', error);
  process.exit(1);
}
