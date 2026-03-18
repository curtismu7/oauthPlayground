---
mode: edit
description: Scaffold a new V9 OAuth/OIDC flow page following MasterFlow API migration standards
---

Scaffold a new V9 OAuth/OIDC flow page. Follow **every** rule below — this is a security-critical area.

## Pre-scaffold checklist (do these first)

1. Read `A-Migration/01-MIGRATION-GUIDE.md` (quality gates, Modern Messaging, color standards)
2. Read `A-Migration/02-SERVICES-AND-CONTRACTS.md` (worker token pattern, service dependencies)
3. Read `A-Migration/03-TESTING-AND-RULES.md` (infinite-loop prevention, async cleanup checklist)
4. Check `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` Section 7 (do-not-break areas)

## What to create

1. `src/pages/flows/v9/${FlowName}FlowV9.tsx` — the flow page
2. Register the route in `src/App.tsx`
3. Add sidebar entry in `src/config/sidebarMenuConfig.ts`

## Mandatory patterns

### Modern Messaging (no legacy toast)
```tsx
// ✅ Wait screen for blocking work
<modernMessaging.WaitScreen title="Requesting Token..." subtitle="Contacting PingOne" />

// ✅ Banner for persistent context
<modernMessaging.Banner type="info" title="PKCE Required" message="..." dismissible />

// ✅ Critical error with guidance
<modernMessaging.CriticalError
  title="Token Exchange Failed"
  message={error.message}
  nextStep="Check your client_id and redirect_uri, then retry."
/>

// ✅ Footer messaging for low-noise state
<modernMessaging.Footer message="Polling for device authorization..." />

// ❌ NEVER
import { v4ToastManager } from '...'; // forbidden — remove on sight
console.error('something failed');    // forbidden — use logger + Modern Messaging
```

### Flow state machine
```tsx
type FlowStep = 'idle' | 'loading' | 'success' | 'error';
const [step, setStep] = useState<FlowStep>('idle');
const [isSubmitting, setIsSubmitting] = useState(false);

// Disable the submit button while in-flight
<button disabled={isSubmitting || step === 'loading'}>Continue</button>
```

### Infinite-loop prevention
```tsx
// ✅ SAFE — depend only on stable inputs
useEffect(() => {
  const synced = V9CredentialStorageService.loadSync('v9:${flow-id}');
  if (synced?.clientId) setClientId(synced.clientId);
}, []); // empty deps = run once on mount

// ❌ DANGEROUS — effect depends on state it writes
useEffect(() => {
  setCredentials(load());
}, [credentials]); // causes infinite loop
```

### Async cleanup
```tsx
useEffect(() => {
  const controller = new AbortController();

  async function poll() {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!controller.signal.aborted) setData(await res.json());
    } catch (err) {
      if (!controller.signal.aborted) setError(err as Error);
    }
  }

  poll();
  return () => controller.abort(); // cleanup on unmount
}, [url]);
```

### Worker token (mandatory if your flow needs an access token for PingOne Management API)
```tsx
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';
import { unifiedWorkerTokenService } from '../../../services/unifiedWorkerTokenService';

// Load on mount — always from unifiedWorkerTokenService first
useEffect(() => {
  async function load() {
    const creds = await unifiedWorkerTokenService.loadCredentials();
    if (creds) setWorkerCreds(creds);
  }
  load();
}, []);

// In JSX
<WorkerTokenSectionV8
  environmentId={environmentId}
  onTokenAcquired={(token) => setWorkerToken(token)}
/>
```

## Color standards

```ts
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';

// Header gradient — default blue
background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);

// Header gradient — PingOne Management API pages ONLY
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

// ❌ FORBIDDEN: purple, green/amber headers
```

## Minimal scaffold shape

```tsx
// src/pages/flows/v9/${FlowName}FlowV9.tsx
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '../../../components/v9/V9ModernMessagingComponents';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { logger } from '../../../utils/logger';

const MODULE_TAG = '[🔐 ${FLOW_NAME_UPPER}-V9]';

const STEPS = [
  { title: 'Configuration', subtitle: 'Set credentials and parameters' },
  { title: 'Request',       subtitle: 'Build and send the OAuth request' },
  { title: 'Response',      subtitle: 'Inspect the token response' },
  { title: 'Complete',      subtitle: 'Review results and next steps' },
] as const;

// ─── Styled components ────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FlowHeader = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: #ffffff;
  padding: 2rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const ${FlowName}FlowV9: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load persisted credentials once on mount
  useEffect(() => {
    const saved = V9CredentialStorageService.loadSync('v9:${flow-id}');
    if (saved?.clientId) {
      // setClientId(saved.clientId);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      logger.info(MODULE_TAG, 'Starting ${FlowName} flow');
      // TODO: call service
      setCurrentStep((s) => s + 1);
    } catch (err) {
      logger.error(MODULE_TAG, 'Flow failed', err);
      setError(err as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setError(null);
  }, []);

  return (
    <PageWrapper>
      <V9FlowHeader flowId="${flow-id}" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <V9FlowRestartButton
          onRestart={restart}
          currentStep={currentStep}
          totalSteps={STEPS.length}
          position="header"
        />
      </div>

      {error && (
        <modernMessaging.CriticalError
          title="Flow Error"
          message={error.message}
          nextStep="Check your credentials and try again."
        />
      )}

      {/* Step content */}
      {currentStep === 0 && (
        <div>
          {/* Configuration step */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Loading…' : 'Start Flow'}
          </button>
        </div>
      )}
    </PageWrapper>
  );
};

export default ${FlowName}FlowV9;
```

## After scaffolding

- Feature-parity test: every feature from the V7/V8 source flow must exist in V9
- `tsc --noEmit` must pass before committing
- `npx biome check src/` must pass
- At least one failure-path test + one happy-path test (use `new-test` prompt)
- Add an entry to `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` Section 3
