# V8 Code Examples - Real Implementation

**Date:** 2024-11-16  
**Purpose:** Show actual code examples of how to use V8 services

---

## 📋 Table of Contents

1. [Validation Service Examples](#1-validation-service-examples)
2. [Education Service Examples](#2-education-service-examples)
3. [Step Navigation Integration](#3-step-navigation-integration)
4. [Complete Flow Component](#4-complete-flow-component)

---

## 1. Validation Service Examples

### Example 1: Validate Credentials in Step 0

```typescript
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';

// In your component
const Step0ConfigureCredentials: React.FC = () => {
  const [credentials, setCredentials] = useState({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: ''
  });

  // Validate on every change
  const validation = useMemo(() => {
    return ValidationServiceV8.validateCredentials(credentials, 'oidc');
  }, [credentials]);

  return (
    <div>
      <h2>Step 0: Configure Credentials</h2>

      {/* Environment ID */}
      <div>
        <label>Environment ID</label>
        <input
          value={credentials.environmentId}
          onChange={(e) => setCredentials({
            ...credentials,
            environmentId: e.target.value
          })}
        />
        {/* Show error if present */}
        {validation.errors.find(e => e.field === 'environmentId') && (
          <div className="error">
            {validation.errors.find(e => e.field === 'environmentId')?.message}
          </div>
        )}
      </div>

      {/* Client ID */}
      <div>
        <label>Client ID</label>
        <input
          value={credentials.clientId}
          onChange={(e) => setCredentials({
            ...credentials,
            clientId: e.target.value
          })}
        />
        {validation.errors.find(e => e.field === 'clientId') && (
          <div className="error">
            {validation.errors.find(e => e.field === 'clientId')?.message}
          </div>
        )}
      </div>

      {/* Show all errors */}
      {!validation.valid && (
        <div className="validation-errors">
          <h4>Please fix the following issues:</h4>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>
                <strong>{error.field}:</strong> {error.message}
                {error.suggestion && (
                  <div className="suggestion">→ {error.suggestion}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show warnings */}
      {validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <h4>Warnings:</h4>
          <ul>
            {validation.warnings.map((warning, index) => (
              <li key={index}>
                <strong>{warning.field}:</strong> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next button - disabled until valid */}
      <button 
        disabled={!validation.canProceed}
        onClick={() => onNext()}
      >
        Next Step ▶
      </button>
    </div>
  );
};
```

---

### Example 2: Validate Authorization URL Parameters

```typescript
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';

const Step1GenerateAuthUrl: React.FC = () => {
  const [authUrl, setAuthUrl] = useState('');
  const [pkceCodes, setPkceCodes] = useState({ codeVerifier: '', codeChallenge: '' });
  const [state, setState] = useState('');

  // Generate auth URL
  const handleGenerateUrl = async () => {
    // Generate PKCE codes
    const codes = await generatePKCECodes();
    setPkceCodes(codes);

    // Generate state
    const newState = generateRandomString(32);
    setState(newState);

    // Build URL
    const url = buildAuthorizationUrl({
      authorizationEndpoint: endpoints.authorization_endpoint,
      clientId: credentials.clientId,
      redirectUri: credentials.redirectUri,
      scope: credentials.scopes,
      responseType: 'code',
      state: newState,
      codeChallenge: codes.codeChallenge,
      codeChallengeMethod: 'S256'
    });

    setAuthUrl(url);
  };

  // Validate auth URL params
  const validation = useMemo(() => {
    if (!authUrl) {
      return {
        valid: false,
        canProceed: false,
        errors: [{ field: 'authUrl', message: 'Authorization URL not generated' }],
        warnings: []
      };
    }

    return ValidationServiceV8.validateAuthorizationUrlParams({
      authorizationEndpoint: endpoints.authorization_endpoint,
      clientId: credentials.clientId,
      redirectUri: credentials.redirectUri,
      scope: credentials.scopes,
      responseType: 'code',
      state,
      codeChallenge: pkceCodes.codeChallenge,
      codeChallengeMethod: 'S256'
    });
  }, [authUrl, pkceCodes, state]);

  return (
    <div>
      <h2>Step 1: Generate Authorization URL</h2>

      <button onClick={handleGenerateUrl}>
        Generate Authorization URL
      </button>

      {authUrl && (
        <div>
          <h3>Authorization URL:</h3>
          <pre>{authUrl}</pre>
          
          {validation.valid && (
            <div className="success">
              ✅ Authorization URL generated successfully
            </div>
          )}
        </div>
      )}

      {/* Next button - disabled until URL generated */}
      <button 
        disabled={!validation.canProceed}
        onClick={() => onNext()}
      >
        Next Step ▶
      </button>
    </div>
  );
};
```

---

### Example 3: Validate Callback Parameters

```typescript
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';

const Step2HandleCallback: React.FC = () => {
  const [callbackParams, setCallbackParams] = useState<{
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
  }>({});

  // Parse callback URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackParams({
      code: params.get('code') || undefined,
      state: params.get('state') || undefined,
      error: params.get('error') || undefined,
      errorDescription: params.get('error_description') || undefined
    });
  }, []);

  // Validate callback
  const validation = useMemo(() => {
    return ValidationServiceV8.validateCallbackParams(
      callbackParams,
      expectedState // From Step 1
    );
  }, [callbackParams, expectedState]);

  return (
    <div>
      <h2>Step 2: Handle Callback</h2>

      {!callbackParams.code && !callbackParams.error && (
        <div>
          <p>⏳ Waiting for user to complete authentication...</p>
          <p>After authenticating, you'll be redirected back here.</p>
        </div>
      )}

      {callbackParams.error && (
        <div className="error">
          <h3>❌ Authorization Failed</h3>
          <p><strong>Error:</strong> {callbackParams.error}</p>
          {callbackParams.errorDescription && (
            <p><strong>Description:</strong> {callbackParams.errorDescription}</p>
          )}
        </div>
      )}

      {callbackParams.code && validation.valid && (
        <div className="success">
          <h3>✅ Authorization Code Received</h3>
          <p>Code: {callbackParams.code.substring(0, 20)}...</p>
        </div>
      )}

      {callbackParams.code && !validation.valid && (
        <div className="error">
          <h3>⚠️ Validation Failed</h3>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next button - disabled until valid code received */}
      <button 
        disabled={!validation.canProceed}
        onClick={() => onNext()}
      >
        Next Step ▶
      </button>
    </div>
  );
};
```

---

### Example 4: Validate Token Response

```typescript
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';

const Step3ExchangeTokens: React.FC = () => {
  const [tokens, setTokens] = useState<{
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
  }>({});

  // Exchange code for tokens
  const handleExchangeTokens = async () => {
    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authorizationCode,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          redirect_uri: credentials.redirectUri,
          code_verifier: pkceCodes.codeVerifier
        })
      });

      const tokenData = await response.json();
      setTokens(tokenData);
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  };

  // Validate tokens
  const validation = useMemo(() => {
    if (!tokens.access_token) {
      return {
        valid: false,
        canProceed: false,
        errors: [{ field: 'tokens', message: 'Tokens not received yet' }],
        warnings: []
      };
    }

    return ValidationServiceV8.validateTokenResponse(tokens, 'oidc');
  }, [tokens]);

  return (
    <div>
      <h2>Step 3: Exchange for Tokens</h2>

      <button onClick={handleExchangeTokens}>
        Exchange Code for Tokens
      </button>

      {tokens.access_token && validation.valid && (
        <div className="success">
          <h3>✅ Tokens Received Successfully</h3>
          
          <div>
            <h4>🎫 Access Token</h4>
            <pre>{tokens.access_token.substring(0, 50)}...</pre>
          </div>

          {tokens.id_token && (
            <div>
              <h4>🆔 ID Token</h4>
              <pre>{tokens.id_token.substring(0, 50)}...</pre>
            </div>
          )}

          {tokens.refresh_token && (
            <div>
              <h4>🔄 Refresh Token</h4>
              <pre>{tokens.refresh_token.substring(0, 50)}...</pre>
            </div>
          )}
        </div>
      )}

      {!validation.valid && validation.errors.length > 0 && (
        <div className="error">
          <h3>⚠️ Token Validation Failed</h3>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Final step - no Next button */}
      <button onClick={() => onReset()}>
        Start New Flow
      </button>
    </div>
  );
};
```

---

## 2. Education Service Examples

### Example 1: Tooltip Component

```typescript
import { EducationServiceV8 } from '@/v8/services/educationServiceV8';

const EducationTooltip: React.FC<{
  contentKey: string;
  children: React.ReactNode;
}> = ({ contentKey, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = EducationServiceV8.getTooltip(contentKey);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      <span className="info-icon">ℹ️</span>

      {showTooltip && (
        <div className="tooltip">
          <div className="tooltip-header">
            {tooltip.icon} {tooltip.title}
          </div>
          <div className="tooltip-body">
            {tooltip.description}
          </div>
          {tooltip.learnMoreUrl && (
            <a href={tooltip.learnMoreUrl} className="tooltip-link">
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Usage
<EducationTooltip contentKey="credential.clientId">
  <label>Client ID</label>
</EducationTooltip>

<EducationTooltip contentKey="scope.offline_access">
  <input type="checkbox" /> offline_access
</EducationTooltip>
```

---

### Example 2: Quick Start Modal

```typescript
import { EducationServiceV8 } from '@/v8/services/educationServiceV8';

const QuickStartModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: QuickStartPreset) => void;
  flowType: 'oauth' | 'oidc';
}> = ({ isOpen, onClose, onSelectPreset, flowType }) => {
  const presets = EducationServiceV8.getAvailablePresets(flowType);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Quick Start</h2>
        <p>Choose a preset to get started quickly:</p>

        {presets.map(preset => (
          <div key={preset.id} className="preset-card">
            <div className="preset-icon">{preset.icon}</div>
            <div className="preset-info">
              <h3>{preset.name}</h3>
              <p>{preset.description}</p>
              <div className="preset-scopes">
                Scopes: {preset.scopes.join(', ')}
              </div>
              <div className="preset-tags">
                {preset.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
            <button onClick={() => {
              onSelectPreset(preset);
              onClose();
            }}>
              Select
            </button>
          </div>
        ))}

        <button onClick={onClose}>
          Skip - Configure Manually
        </button>
      </div>
    </div>
  );
};

// Usage
const [showQuickStart, setShowQuickStart] = useState(false);

const handleSelectPreset = (preset: QuickStartPreset) => {
  // Apply preset to form
  setCredentials({
    ...credentials,
    ...preset.config,
    scopes: preset.scopes.join(' ')
  });
  
  console.log('[⚡ QUICK-START-V8] Preset applied', { presetId: preset.id });
};

<button onClick={() => setShowQuickStart(true)}>
  ⚡ Quick Start
</button>

<QuickStartModal
  isOpen={showQuickStart}
  onClose={() => setShowQuickStart(false)}
  onSelectPreset={handleSelectPreset}
  flowType="oidc"
/>
```

---

### Example 3: Detailed Explanation Modal

```typescript
import { EducationServiceV8 } from '@/v8/services/educationServiceV8';

const ExplanationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  explanationKey: string;
}> = ({ isOpen, onClose, explanationKey }) => {
  if (!isOpen) return null;

  const explanation = EducationServiceV8.getExplanation(explanationKey);

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>{explanation.title}</h2>
        
        <div className="summary">
          {explanation.summary}
        </div>

        <div className="details">
          {explanation.details}
        </div>

        {explanation.example && (
          <div className="example">
            <h3>Example:</h3>
            <pre>{explanation.example}</pre>
          </div>
        )}

        {explanation.codeSnippet && (
          <div className="code-snippet">
            <h3>Code Example:</h3>
            <pre><code>{explanation.codeSnippet}</code></pre>
          </div>
        )}

        {explanation.relatedTopics && (
          <div className="related-topics">
            <h3>Related Topics:</h3>
            <ul>
              {explanation.relatedTopics.map(topic => (
                <li key={topic}>
                  <button onClick={() => {
                    // Navigate to related topic
                  }}>
                    {topic}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {explanation.learnMoreUrl && (
          <a href={explanation.learnMoreUrl} className="learn-more">
            Learn more in documentation →
          </a>
        )}
      </div>
    </div>
  );
};

// Usage
const [showExplanation, setShowExplanation] = useState(false);
const [explanationKey, setExplanationKey] = useState('');

<button onClick={() => {
  setExplanationKey('offline_access');
  setShowExplanation(true);
}}>
  Learn about offline_access
</button>

<ExplanationModal
  isOpen={showExplanation}
  onClose={() => setShowExplanation(false)}
  explanationKey={explanationKey}
/>
```

---

## 3. Step Navigation Integration

### Example: Complete Step Navigation Component

```typescript
import { ValidationServiceV8 } from '@/v8/services/validationServiceV8';

interface StepDefinition {
  id: number;
  label: string;
  shortLabel: string;
  description: string;
  required: boolean;
  validation: () => ValidationResult;
  completed: boolean;
}

const OAuthAuthorizationCodeFlowV8: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [credentials, setCredentials] = useState({...});
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [tokens, setTokens] = useState({});

  // Define steps with validation
  const steps: StepDefinition[] = [
    {
      id: 0,
      label: 'Configure Credentials',
      shortLabel: 'Config',
      description: 'Set up your OAuth/OIDC application credentials',
      required: true,
      validation: () => ValidationServiceV8.validateCredentials(credentials, 'oidc'),
      completed: isStep0Complete()
    },
    {
      id: 1,
      label: 'Generate Authorization URL',
      shortLabel: 'Auth URL',
      description: 'Create the URL to redirect users for authentication',
      required: true,
      validation: () => validateStep1(),
      completed: isStep1Complete()
    },
    {
      id: 2,
      label: 'Handle Callback',
      shortLabel: 'Callback',
      description: 'Process the authorization code from the callback',
      required: true,
      validation: () => validateStep2(),
      completed: isStep2Complete()
    },
    {
      id: 3,
      label: 'Exchange for Tokens',
      shortLabel: 'Tokens',
      description: 'Exchange authorization code for access tokens',
      required: true,
      validation: () => validateStep3(),
      completed: isStep3Complete()
    }
  ];

  // Get current step validation
  const currentValidation = steps[currentStep].validation();

  // Handle step change
  const handleStepChange = (newStep: number) => {
    // Can always go back
    if (newStep < currentStep) {
      setCurrentStep(newStep);
      console.log('[🎯 STEP-NAV-V8] Moving back to step', { newStep });
      return;
    }

    // Can only go forward if current step is valid
    if (currentValidation.canProceed) {
      setCurrentStep(newStep);
      console.log('[🎯 STEP-NAV-V8] Moving forward to step', { newStep });
    } else {
      v4ToastManager.showError(
        'Please complete the current step before proceeding'
      );
      console.warn('[🎯 STEP-NAV-V8] Cannot proceed', {
        currentStep,
        errors: currentValidation.errors
      });
    }
  };

  // Handle next button
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  return (
    <div className="flow-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-text">
          Progress: {Math.round((currentStep / steps.length) * 100)}% 
          ({currentStep} of {steps.length})
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="step-navigation">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-indicator ${
              index === currentStep ? 'active' :
              step.completed ? 'completed' :
              index < currentStep ? 'available' :
              'locked'
            }`}
            onClick={() => {
              // Can click completed steps or current step
              if (index <= currentStep) {
                handleStepChange(index);
              }
            }}
          >
            <div className="step-number">
              {step.completed ? '✓' : index}
            </div>
            <div className="step-label">{step.shortLabel}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-content">
        <h2>{steps[currentStep].label}</h2>
        <p>{steps[currentStep].description}</p>

        {currentStep === 0 && <Step0ConfigureCredentials />}
        {currentStep === 1 && <Step1GenerateAuthUrl />}
        {currentStep === 2 && <Step2HandleCallback />}
        {currentStep === 3 && <Step3ExchangeTokens />}
      </div>

      {/* Validation Feedback */}
      {!currentValidation.valid && (
        <div className="validation-feedback error">
          <h4>⚠️ Cannot proceed to next step</h4>
          <p>Please fix the following issues:</p>
          <ul>
            {currentValidation.errors.map((error, index) => (
              <li key={index}>
                <strong>{error.field}:</strong> {error.message}
                {error.suggestion && (
                  <div className="suggestion">→ {error.suggestion}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentValidation.warnings.length > 0 && (
        <div className="validation-feedback warning">
          <h4>⚠️ Warnings:</h4>
          <ul>
            {currentValidation.warnings.map((warning, index) => (
              <li key={index}>
                <strong>{warning.field}:</strong> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="previous-button"
          disabled={currentStep === 0}
          onClick={handlePrevious}
        >
          ◀ Previous
        </button>

        {currentStep < steps.length - 1 && (
          <button
            className="next-button"
            disabled={!currentValidation.canProceed}
            onClick={handleNext}
            title={
              !currentValidation.canProceed
                ? `Cannot proceed:\n${ValidationServiceV8.formatErrors(currentValidation.errors)}`
                : 'Proceed to next step'
            }
          >
            Next Step ▶
          </button>
        )}

        {currentStep === steps.length - 1 && (
          <button
            className="finish-button"
            onClick={() => {
              console.log('[🎯 STEP-NAV-V8] Flow completed');
              // Handle completion
            }}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 4. Complete Flow Component

See the full integration example above in Section 3!

---

## 🎯 Key Takeaways

### 1. Validation is Reactive
```typescript
// Validate on every change
const validation = useMemo(() => {
  return ValidationServiceV8.validateCredentials(credentials, 'oidc');
}, [credentials]);

// Use validation result to control UI
<button disabled={!validation.canProceed}>Next</button>
```

### 2. Education is Contextual
```typescript
// Tooltips everywhere
<EducationTooltip contentKey="credential.clientId">
  <label>Client ID</label>
</EducationTooltip>

// Quick Start for fast setup
<QuickStartModal onSelectPreset={handleSelectPreset} />
```

### 3. Step Navigation is Enforced
```typescript
// Can only proceed if validation passes
const handleNext = () => {
  if (currentValidation.canProceed) {
    setCurrentStep(currentStep + 1);
  } else {
    showError('Please complete current step');
  }
};
```

---

**These examples show exactly how to use V8 services in your components!** 🚀
