# PAR Configuration Service Usage Guide

**Date:** January 15, 2025  
**Status:** ✅ **CREATED** - Reusable PAR configuration service for all flows  

## 🎯 **Overview**

The `PARConfigurationService` is a reusable React component that provides PAR (Pushed Authorization Request) configuration functionality for any OAuth/OIDC flow that supports PAR. This service can be used across multiple flows to provide consistent PAR configuration capabilities.

## 🔧 **Service Features**

### **Core Functionality**
- ✅ **PAR Parameter Configuration** - ACR values, prompt, max age, UI locales, claims
- ✅ **Real-time Updates** - Changes immediately reflected in parent component
- ✅ **Form Validation** - JSON validation for claims, input validation for other fields
- ✅ **Educational Content** - Built-in explanation of PAR benefits and usage
- ✅ **Customizable** - Configurable title, educational content, and collapse state

### **Utility Functions**
- ✅ **Default Configuration** - Get flow-specific default PAR configurations
- ✅ **Validation** - Validate PAR configuration parameters
- ✅ **URL Conversion** - Convert between PAR config and URL parameters
- ✅ **Flow-Specific Defaults** - Pre-configured settings for different flow types

## 🚀 **Usage Examples**

### **1. Basic Usage in Any Flow**

```typescript
import { PARConfigurationService, PARConfigurationServiceUtils } from '../../services/parConfigurationService';

// In your flow component
const [parConfig, setParConfig] = useState(PARConfigurationServiceUtils.getDefaultConfig());

// In your render method
<PARConfigurationService
  config={parConfig}
  onConfigChange={setParConfig}
  defaultCollapsed={false}
  title="PAR Authorization Request Configuration"
  showEducationalContent={true}
/>
```

### **2. Flow-Specific Default Configuration**

```typescript
// Get flow-specific defaults
const defaultConfig = PARConfigurationServiceUtils.getFlowSpecificConfig('authorization-code');
// Returns: { prompt: 'consent', maxAge: 3600, ... }

// Get defaults for different flow types
const implicitConfig = PARConfigurationServiceUtils.getFlowSpecificConfig('implicit');
const deviceConfig = PARConfigurationServiceUtils.getFlowSpecificConfig('device-authorization');
```

### **3. Integration with Existing PingOne Configuration**

```typescript
// In PAR Flow (already implemented)
<PARConfigurationService
  config={{
    acrValues: pingOneConfig.acrValues || '',
    prompt: pingOneConfig.prompt || '',
    maxAge: pingOneConfig.maxAge,
    uiLocales: pingOneConfig.uiLocales || '',
    claims: pingOneConfig.claims
  }}
  onConfigChange={(parConfig) => {
    setPingOneConfig({
      ...pingOneConfig,
      acrValues: parConfig.acrValues,
      prompt: parConfig.prompt,
      maxAge: parConfig.maxAge,
      uiLocales: parConfig.uiLocales,
      claims: parConfig.claims
    });
  }}
  defaultCollapsed={shouldCollapseAll}
  title="PAR Authorization Request Configuration"
  showEducationalContent={true}
/>
```

### **4. RAR Flow Integration Example**

```typescript
// In RARFlowV6_New.tsx
import { PARConfigurationService, PARConfigurationServiceUtils } from '../../services/parConfigurationService';

// Add to imports and state
const [rarParConfig, setRarParConfig] = useState(
  PARConfigurationServiceUtils.getFlowSpecificConfig('authorization-code')
);

// Add to render method (Step 0)
<PARConfigurationService
  config={rarParConfig}
  onConfigChange={setRarParConfig}
  defaultCollapsed={shouldCollapseAll}
  title="RAR PAR Configuration"
  showEducationalContent={true}
/>
```

### **5. Hybrid Flow Integration Example**

```typescript
// In OIDCHybridFlowV7.tsx
import { PARConfigurationService, PARConfigurationServiceUtils } from '../../services/parConfigurationService';

// Add to state
const [hybridParConfig, setHybridParConfig] = useState(
  PARConfigurationServiceUtils.getFlowSpecificConfig('oidc-hybrid')
);

// Add to render method
<PARConfigurationService
  config={hybridParConfig}
  onConfigChange={setHybridParConfig}
  defaultCollapsed={false}
  title="Hybrid Flow PAR Configuration"
  showEducationalContent={true}
/>
```

## 🔧 **Service API**

### **PARConfigurationService Props**

```typescript
interface PARConfigurationServiceProps {
  config: PARConfiguration;                    // Current PAR configuration
  onConfigChange: (config: PARConfiguration) => void;  // Callback for changes
  defaultCollapsed?: boolean;                    // Whether section is collapsed by default
  title?: string;                              // Custom title for the section
  showEducationalContent?: boolean;           // Whether to show educational content
}
```

### **PARConfiguration Interface**

```typescript
interface PARConfiguration {
  acrValues?: string;        // Authentication Context Class Reference values
  prompt?: string;           // Authentication and consent behavior control
  maxAge?: number;          // Maximum authentication age in seconds
  uiLocales?: string;       // Preferred user interface locales
  claims?: any;             // Structured claims request (JSON object)
}
```

### **Utility Functions**

```typescript
class PARConfigurationServiceUtils {
  // Get default configuration
  static getDefaultConfig(): PARConfiguration;
  
  // Get flow-specific configuration
  static getFlowSpecificConfig(flowType: string): PARConfiguration;
  
  // Validate configuration
  static validateConfig(config: PARConfiguration): { isValid: boolean; errors: string[] };
  
  // Convert to URL parameters
  static configToUrlParams(config: PARConfiguration): Record<string, string>;
  
  // Convert from URL parameters
  static urlParamsToConfig(params: Record<string, string>): PARConfiguration;
}
```

## 🎯 **Flow-Specific Defaults**

### **Authorization Code Flow**
```typescript
{
  prompt: 'consent',    // Force consent for authorization code flows
  maxAge: 3600          // 1 hour default
}
```

### **Implicit Flow**
```typescript
{
  prompt: 'none',      // No consent needed for implicit flows
  maxAge: 1800         // 30 minutes for implicit flows
}
```

### **Device Authorization Flow**
```typescript
{
  prompt: 'login',     // Force login for device flows
  maxAge: 7200         // 2 hours for device flows
}
```

## ✅ **Benefits of Using the Service**

### **1. Consistency**
- ✅ **Unified Interface** - Same PAR configuration across all flows
- ✅ **Consistent Validation** - Same validation rules everywhere
- ✅ **Standardized UX** - Consistent user experience

### **2. Reusability**
- ✅ **DRY Principle** - Don't repeat PAR configuration code
- ✅ **Easy Integration** - Simple import and usage
- ✅ **Maintainable** - Single source of truth for PAR configuration

### **3. Flexibility**
- ✅ **Customizable** - Configurable title, educational content, collapse state
- ✅ **Flow-Specific** - Different defaults for different flow types
- ✅ **Validation** - Built-in validation and error handling

### **4. Educational Value**
- ✅ **Built-in Education** - Explains PAR benefits and usage
- ✅ **Parameter Guidance** - Helpful placeholders and examples
- ✅ **Best Practices** - Information about when to use each parameter

## 🚀 **Implementation Steps**

### **Step 1: Import the Service**
```typescript
import { PARConfigurationService, PARConfigurationServiceUtils } from '../../services/parConfigurationService';
```

### **Step 2: Add State Management**
```typescript
const [parConfig, setParConfig] = useState(
  PARConfigurationServiceUtils.getFlowSpecificConfig('your-flow-type')
);
```

### **Step 3: Add to Render Method**
```typescript
<PARConfigurationService
  config={parConfig}
  onConfigChange={setParConfig}
  defaultCollapsed={shouldCollapseAll}
  title="Your Flow PAR Configuration"
  showEducationalContent={true}
/>
```

### **Step 4: Use Configuration in PAR Requests**
```typescript
// Convert to URL parameters for PAR request
const parParams = PARConfigurationServiceUtils.configToUrlParams(parConfig);

// Use in PAR request
const parRequest = {
  ...baseRequest,
  ...parParams
};
```

## 🎉 **Result**

**The PAR Configuration Service provides a reusable, consistent way to configure PAR authorization request parameters across all OAuth/OIDC flows!**

### **Benefits**:
- ✅ **Reusable** - Use in any flow that supports PAR
- ✅ **Consistent** - Same interface and functionality everywhere
- ✅ **Educational** - Built-in explanation of PAR benefits
- ✅ **Flexible** - Customizable for different flow types
- ✅ **Maintainable** - Single source of truth for PAR configuration

---

**🔗 Files Created:**
- `src/services/parConfigurationService.tsx` - Reusable PAR configuration service

**🎯 Impact:** Any OAuth/OIDC flow can now easily integrate PAR configuration functionality with consistent UI, validation, and educational content.


