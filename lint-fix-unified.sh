#!/bin/bash

echo "🔧 Running comprehensive lint fix for Unified MFA and Unified OAuth..."

# Fix Unified MFA Registration Flow
echo "📝 Fixing UnifiedMFARegistrationFlowV8.tsx..."
npx eslint src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx --fix --quiet

# Fix Unified Device Selection Step
echo "📝 Fixing UnifiedDeviceSelectionStep.tsx..."
npx eslint src/v8/flows/unified/components/UnifiedDeviceSelectionStep.tsx --fix --quiet

# Fix Unified Device Selection Step Modern
echo "📝 Fixing UnifiedDeviceSelectionStep.modern.tsx..."
npx eslint src/v8/flows/unified/components/UnifiedDeviceSelectionStep.modern.tsx --fix --quiet

# Fix Unified Registration Step
echo "📝 Fixing UnifiedRegistrationStep.tsx..."
npx eslint src/v8/flows/unified/components/UnifiedRegistrationStep.tsx --fix --quiet

# Fix Unified Success Step
echo "📝 Fixing UnifiedSuccessStep.tsx..."
npx eslint src/v8/flows/unified/components/UnifiedSuccessStep.tsx --fix --quiet

# Fix Unified Configuration Step
echo "📝 Fixing UnifiedConfigurationStep.tsx..."
npx eslint src/v8/flows/unified/components/UnifiedConfigurationStep.tsx --fix --quiet

# Fix Unified Activation Step
echo "📝 Fixing UnifiedActivationStep.tsx..."
npx eslint src/v8/flows/unified/components/UnifiedActivationStep.tsx --fix --quiet

# Fix Device Component Registry
echo "📝 Fixing DeviceComponentRegistry.tsx..."
npx eslint src/v8/flows/unified/components/DeviceComponentRegistry.tsx --fix --quiet

# Fix Unified Flow Service Integration
echo "📝 Fixing unifiedFlowServiceIntegration.ts..."
npx eslint src/v8/flows/unified/services/unifiedFlowServiceIntegration.ts --fix --quiet

# Fix Device Flow Helpers
echo "📝 Fixing deviceFlowHelpers.ts..."
npx eslint src/v8/flows/unified/utils/deviceFlowHelpers.ts --fix --quiet

# Fix Unified Flow Validation
echo "📝 Fixing unifiedFlowValidation.ts..."
npx eslint src/v8/flows/unified/utils/unifiedFlowValidation.ts --fix --quiet

# Fix Unified OAuth Flow
echo "📝 Fixing UnifiedOAuthFlowV8U.tsx..."
npx eslint src/v8u/flows/UnifiedOAuthFlowV8U.tsx --fix --quiet

echo "✅ Lint fix complete for Unified components!"
echo ""
echo "📊 Summary of remaining issues:"
echo "Run 'npx eslint src/v8/flows/unified/ --ext .ts,.tsx' to see remaining issues"
echo "Run 'npx eslint src/v8u/flows/UnifiedOAuthFlowV8U.tsx' to see OAuth issues"
