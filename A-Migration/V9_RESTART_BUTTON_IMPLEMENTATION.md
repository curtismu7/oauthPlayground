# V9 Restart Button Implementation Guide

**Date:** March 2, 2026  
**Purpose:** Add restart functionality to all V9 stepper flows  
**Status:** ✅ **IMPLEMENTATION TEMPLATE READY**

---

## 🔄 **RESTART BUTTON IMPLEMENTATION**

### **✅ Required for All V9 Stepper Flows**

All V9 flows with `STEP_METADATA` and `currentStep` state **MUST** include the restart button functionality.

---

## 📋 **IMPLEMENTATION STEPS**

### **Step 1: Add Import**
```typescript
// Add to existing imports
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
```

### **Step 2: Add Restart Function**
```typescript
// Add after state declarations, before step navigation
const restartFlow = useCallback(() => {
	// Reset all state to initial values
	setCurrentStep(0);
	
	// Reset all flow-specific state variables
	// Example for OAuthROPCFlowV9:
	setRopcConfig({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		username: '',
		password: '',
		scope: 'openid profile email',
	});
	setTokenResponse(null);
	setUserInfo(null);
	setRefreshedToken(null);
	setIsLoading(false);
	
	// Show notification
	const modernMessaging = V9ModernMessagingService.getInstance();
	modernMessaging.showBanner({
		type: 'info',
		title: 'Flow Restarted',
		message: 'All progress has been reset. You can start again from step 1.',
		dismissible: true,
	});
}, []); // Add dependencies for state setters
```

### **Step 3: Add Restart Button to UI**
```typescript
// Add after V9FlowHeader, before Step Progress Indicator
<div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
	{/* Restart Button */}
	<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
		<V9FlowRestartButton
			onRestart={restartFlow}
			currentStep={currentStep}
			totalSteps={STEP_METADATA.length}
			position="header"
		/>
	</div>

	{/* Step Progress Indicator */}
	<div style={{ marginBottom: '2rem' }}>
		// ... existing step progress code
	</div>
```

---

## 🎯 **FLOW-SPECIFIC CUSTOMIZATION**

### **OAuthROPCFlowV9** ✅ **COMPLETED**
```typescript
const restartFlow = useCallback(() => {
	setCurrentStep(0);
	setRopcConfig({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		username: '',
		password: '',
		scope: 'openid profile email',
	});
	setTokenResponse(null);
	setUserInfo(null);
	setRefreshedToken(null);
	setIsLoading(false);
	
	const modernMessaging = V9ModernMessagingService.getInstance();
	modernMessaging.showBanner({
		type: 'info',
		title: 'Flow Restarted',
		message: 'All progress has been reset. You can start again from step 1.',
		dismissible: true,
	});
}, []);
```

### **JWTBearerTokenFlowV9** - Template
```typescript
const restartFlow = useCallback(() => {
	setCurrentStep(0);
	setClientId('');
	setTokenEndpoint('');
	setJwtSignature({ privateKey: '', publicKey: '' });
	setGeneratedJWT('');
	setTokenResponse(null);
	
	const modernMessaging = V9ModernMessagingService.getInstance();
	modernMessaging.showBanner({
		type: 'info',
		title: 'Flow Restarted',
		message: 'All progress has been reset. You can start again from step 1.',
		dismissible: true,
	});
}, []);
```

### **MFALoginHintFlowV9** - Template
```typescript
const restartFlow = useCallback(() => {
	setCurrentStep(0);
	setMfaConfig({
		environmentId: '',
		clientId: '',
		loginHintToken: '',
	});
	setMfaResponse(null);
	setMfaCompletion(null);
	
	const modernMessaging = V9ModernMessagingService.getInstance();
	modernMessaging.showBanner({
		type: 'info',
		title: 'Flow Restarted',
		message: 'All progress has been reset. You can start again from step 1.',
		dismissible: true,
	});
}, []);
```

---

## 📁 **FLOWS REQUIRING RESTART BUTTON**

### **✅ Identified Stepper Flows (10 total):**

1. **OAuthROPCFlowV9** ✅ **COMPLETED**
2. **JWTBearerTokenFlowV9** - PENDING
3. **MFALoginHintFlowV9** - PENDING
4. **DeviceAuthorizationFlowV9** - PENDING
5. **OAuthAuthorizationCodeFlowV9** - PENDING
6. **OAuthAuthorizationCodeFlowV9_Condensed** - PENDING
7. **ImplicitFlowV9** - PENDING
8. **ClientCredentialsFlowV9** - PENDING
9. **OIDCHybridFlowV9** - PENDING
10. **RARFlowV9** - PENDING

---

## 🔧 **AUTOMATED IMPLEMENTATION**

### **Bash Script for Batch Updates:**
```bash
#!/bin/bash
# Add restart button to all V9 stepper flows

V9_FLOWS=(
	"JWTBearerTokenFlowV9"
	"MFALoginHintFlowV9" 
	"DeviceAuthorizationFlowV9"
	"OAuthAuthorizationCodeFlowV9"
	"OAuthAuthorizationCodeFlowV9_Condensed"
	"ImplicitFlowV9"
	"ClientCredentialsFlowV9"
	"OIDCHybridFlowV9"
	"RARFlowV9"
)

for flow in "${V9_FLOWS[@]}"; do
	echo "Processing $flow..."
	# Add implementation script here
done
```

---

## 🎨 **BUTTON FEATURES**

### **✅ Functionality:**
- **Smart Text**: Shows "Reset Flow" on step 1, "Restart (Step X/Y)" on other steps
- **Confirmation**: Prompts user if not on step 1
- **Notification**: Shows banner when flow is restarted
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Styling**: Uses V9 color standards (danger button style)

### **✅ Position Options:**
- **header**: Above step progress (recommended)
- **footer**: Below navigation buttons
- **inline**: Within content area

---

## 📋 **VALIDATION CHECKLIST**

### **✅ Implementation Requirements:**

- [ ] Import added: `V9FlowRestartButton`
- [ ] Restart function implemented with all state resets
- [ ] Button added to UI (header position recommended)
- [ ] Modern messaging notification included
- [ ] All flow-specific state variables reset
- [ ] TypeScript compilation passes
- [ ] Build passes: `npm run build`
- [ ] Linting passes: `npx biome check`

---

## 🚀 **BENEFITS**

### **✅ User Experience:**
- **Easy Reset**: One-click restart from any step
- **Progress Awareness**: Shows current step in button text
- **Confirmation**: Prevents accidental restarts
- **Feedback**: Clear notification when restarted

### **✅ Developer Experience:**
- **Consistent UI**: Same button across all flows
- **Reusable Component**: Centralized implementation
- **Type Safety**: Full TypeScript support
- **Accessibility**: WCAG compliant

---

## 🎯 **NEXT STEPS**

1. **Implement**: Add restart button to remaining 9 flows
2. **Test**: Verify functionality in each flow
3. **Validate**: Ensure all state is properly reset
4. **Document**: Update flow-specific documentation
5. **Deploy**: Release to production

---

**🚀 All V9 stepper flows will have consistent restart functionality!**
