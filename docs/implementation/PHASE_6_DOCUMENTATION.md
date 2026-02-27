# 📚 Phase 6 Component Documentation

## 🎯 Overview

This documentation provides comprehensive guides for all Phase 5 and Phase 6 components, including integration examples, API references, and best practices.

## 📋 Table of Contents

1. [FlowProgressTrackerV8](#flowprogresstrackerv8)
2. [LazyLoadWrapperV8](#lazyloadwrapperv8)
3. [ComponentTestSuiteV8](#componenttestsuitev8)
4. [Integration Examples](#integration-examples)
5. [Performance Monitoring](#performance-monitoring)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)

---

## 📊 FlowProgressTrackerV8

### Overview
Enhanced flow visualization component with multiple variants and interactive features.

### Props

```typescript
interface FlowProgressTrackerV8Props {
  steps: FlowStep[];
  currentStep: number;
  showProgress?: boolean;
  showTimeEstimates?: boolean;
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
  onStepClick?: (stepId: number) => void;
}

interface FlowStep {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
  icon?: string;
  estimatedTime?: string;
}
```

### Usage Examples

#### Basic Usage
```tsx
import { FlowProgressTrackerV8 } from '@/v8/components/shared/FlowProgressTrackerV8';

const steps = [
  { id: 1, label: 'Configure', status: 'completed', description: 'Set up credentials' },
  { id: 2, label: 'Select Device', status: 'active', description: 'Choose device' },
  { id: 3, label: 'Register', status: 'pending', description: 'Register device' },
];

<FlowProgressTrackerV8
  steps={steps}
  currentStep={2}
  showProgress={true}
  variant="horizontal"
/>
```

#### Interactive Navigation
```tsx
<FlowProgressTrackerV8
  steps={steps}
  currentStep={currentStep}
  onStepClick={(stepId) => {
    if (stepId <= currentStep) {
      navigateToStep(stepId);
    }
  }}
  variant="vertical"
  showTimeEstimates={true}
/>
```

### Variants

#### Horizontal (Default)
```tsx
<FlowProgressTrackerV8
  steps={steps}
  currentStep={currentStep}
  variant="horizontal"
/>
```

#### Vertical
```tsx
<FlowProgressTrackerV8
  steps={steps}
  currentStep={currentStep}
  variant="vertical"
  showProgress={false}
/>
```

#### Compact
```tsx
<FlowProgressTrackerV8
  steps={steps}
  currentStep={currentStep}
  variant="compact"
/>
```

---

## ⚡ LazyLoadWrapperV8

### Overview
Performance optimization component for lazy loading with Intersection Observer API.

### Props

```typescript
interface LazyLoadWrapperV8Props {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}
```

### Usage Examples

#### Basic Lazy Loading
```tsx
import { LazyLoadWrapperV8 } from '@/v8/components/shared/LazyLoadWrapperV8';

<LazyLoadWrapperV8
  loader={() => import('./HeavyComponent').then(mod => ({ default: mod.HeavyComponent }))}
  fallback={<div>Loading...</div>}
  delay={200}
  threshold={0.1}
  onLoad={() => console.log('Component loaded!')}
  onError={(error) => console.error('Load failed:', error)}
>
  <div>This content will be lazy loaded</div>
</LazyLoadWrapperV8>
```

#### With HOC Wrapper
```tsx
import { withLazyLoad } from '@/v8/components/shared/LazyLoadWrapperV8';

const LazyHeavyComponent = withLazyLoad(
  () => import('./HeavyComponent'),
  { delay: 300, threshold: 0.2 }
);

<LazyHeavyComponent prop1="value1" prop2="value2" />
```

#### Preloading
```tsx
import { ComponentPreloader } from '@/v8/components/shared/LazyLoadWrapperV8';

// Preload components for better performance
ComponentPreloader.preload('heavy-component', () => import('./HeavyComponent'));

// Preload multiple components
ComponentPreloader.preloadMultiple({
  'component1': () => import('./Component1'),
  'component2': () => import('./Component2'),
  'component3': () => import('./Component3'),
});
```

### Configuration Options

| Property | Default | Description |
|----------|---------|-------------|
| `delay` | `200` | Delay before showing loading state |
| `threshold` | `0.1` | Intersection Observer threshold |
| `rootMargin` | `'50px'` | Root margin for early loading |
| `fallback` | LoadingSpinner | Custom fallback component |
| `errorFallback` | ErrorDisplay | Custom error component |

---

## 🧪 ComponentTestSuiteV8

### Overview
Comprehensive testing framework for React components with automated test execution.

### Props

```typescript
interface ComponentTestSuiteV8Props {
  components: string[];
  onTestComplete?: (results: TestResult[]) => void;
  autoRun?: boolean;
  showDetails?: boolean;
  className?: string;
}

interface TestResult {
  component: string;
  test: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
  duration?: number;
}
```

### Usage Examples

#### Basic Test Suite
```tsx
import { ComponentTestSuiteV8 } from '@/v8/components/shared/ComponentTestSuiteV8';

const components = ['FlowProgressTrackerV8', 'LazyLoadWrapperV8', 'ComponentTestSuiteV8'];

<ComponentTestSuiteV8
  components={components}
  autoRun={true}
  showDetails={true}
  onTestComplete={(results) => {
    console.log('Test Results:', results);
    const passRate = results.filter(r => r.status === 'pass').length / results.length * 100;
    console.log(`Pass Rate: ${passRate}%`);
  }}
/>
```

#### Custom Test Configuration
```tsx
<ComponentTestSuiteV8
  components={['MyComponent', 'AnotherComponent']}
  autoRun={false}
  showDetails={true}
  className="custom-test-suite"
/>
```

### Test Types

The test suite automatically runs these tests for each component:

1. **Render Test** - Component renders without errors
2. **Props Test** - Component handles props correctly
3. **Accessibility Test** - Component meets accessibility standards
4. **Performance Test** - Component renders within performance thresholds
5. **Responsive Test** - Component works across screen sizes

---

## 🔗 Integration Examples

### SMS Flow Integration

#### Enhanced Progress Tracking
```tsx
// src/v8/flows/types/SMSFlowV8.tsx
import { FlowProgressTrackerV8 } from '@/v8/components/shared/FlowProgressTrackerV8';

const steps = [
  { id: 1, label: 'Configure', status: nav.currentStep >= 1 ? 'completed' : 'pending', description: 'Set up credentials' },
  { id: 2, label: 'Select Device', status: nav.currentStep >= 2 ? 'completed' : nav.currentStep === 2 ? 'active' : 'pending', description: 'Choose device' },
  { id: 3, label: 'Register', status: nav.currentStep >= 3 ? 'completed' : nav.currentStep === 3 ? 'active' : 'pending', description: 'Register device' },
  { id: 4, label: 'Validate', status: nav.currentStep >= 4 ? 'completed' : nav.currentStep === 4 ? 'active' : 'pending', description: 'Validate OTP' }
];

<FlowProgressTrackerV8
  steps={steps}
  currentStep={nav.currentStep}
  showProgress={true}
  showTimeEstimates={true}
  variant="horizontal"
  onStepClick={(stepId) => {
    if (stepId <= nav.currentStep) {
      nav.goToStep(stepId);
    }
  }}
/>
```

#### Lazy Loading Components
```tsx
// src/v8/flows/types/SMSFlowV8.tsx
import { LazyLoadWrapperV8 } from '@/v8/components/shared/LazyLoadWrapperV8';

<LazyLoadWrapperV8
  loader={() => import('./components/SMSDeviceSelectorV8').then(mod => ({ default: mod.SMSDeviceSelectorV8 }))}
  fallback={<div>Loading device selector...</div>}
  delay={300}
  threshold={0.2}
>
  <div>Device selector will load when needed</div>
</LazyLoadWrapperV8>
```

### WhatsApp Flow Integration

#### Progress Tracking
```tsx
// src/v8/flows/types/WhatsAppFlowV8.tsx
import { FlowProgressTrackerV8 } from '@/v8/components/shared/FlowProgressTrackerV8';

const whatsappSteps = [
  { id: 1, label: 'Configure', status: 'completed', description: 'Set up WhatsApp credentials' },
  { id: 2, label: 'Select Device', status: 'active', description: 'Choose WhatsApp device' },
  { id: 3, label: 'Register', status: 'pending', description: 'Register WhatsApp device' },
  { id: 4, label: 'Send OTP', status: 'pending', description: 'Send OTP to WhatsApp' },
  { id: 5, label: 'Validate', status: 'pending', description: 'Validate OTP code' }
];

<FlowProgressTrackerV8
  steps={whatsappSteps}
  currentStep={nav.currentStep}
  variant="vertical"
  showTimeEstimates={true}
/>
```

---

## 📈 Performance Monitoring

### Built-in Monitoring

#### Component Performance Metrics
```tsx
import { ComponentTestSuiteV8 } from '@/v8/components/shared/ComponentTestSuiteV8';

<ComponentTestSuiteV8
  components={['FlowProgressTrackerV8', 'LazyLoadWrapperV8']}
  onTestComplete={(results) => {
    // Analyze performance metrics
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    const slowComponents = results.filter(r => (r.duration || 0) > 1000);
    
    console.log(`Average Load Time: ${avgDuration}ms`);
    console.log('Slow Components:', slowComponents.map(r => r.component));
  }}
/>
```

#### Memory Usage Monitoring
```tsx
import { ComponentPreloader } from '@/v8/components/shared/LazyLoadWrapperV8';

// Monitor cache size
console.log('Preload Cache Size:', ComponentPreloader.preloadCache.size);

// Clear cache if needed
ComponentPreloader.clearCache();
```

### Browser Dev Tools Integration

#### Performance Tab
1. Open Chrome DevTools
2. Go to Performance tab
3. Record performance while interacting with components
4. Analyze component load times and memory usage

#### Network Tab
1. Monitor lazy loading requests
2. Check for unnecessary network calls
3. Verify component code splitting

#### Memory Tab
1. Monitor heap usage
2. Check for memory leaks
3. Analyze component retention

---

## 🚀 Deployment Guide

### Production Build

#### Optimized Build Configuration
```json
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'components': [
            './src/v8/components/shared/FlowProgressTrackerV8',
            './src/v8/components/shared/LazyLoadWrapperV8',
            './src/v8/components/shared/ComponentTestSuiteV8',
          ],
        },
      },
    },
  },
});
```

#### Environment Variables
```bash
# .env.production
VITE_COMPONENT_PRELOAD=true
VITE_LAZY_LOADING_THRESHOLD=0.1
VITE_PERFORMANCE_MONITORING=true
```

### CDN Configuration

#### Component Preloading
```tsx
// public/preload-components.js
import { ComponentPreloader } from './src/v8/components/shared/LazyLoadWrapperV8';

// Preload critical components
ComponentPreloader.preloadMultiple({
  'flow-progress': () => import('./src/v8/components/shared/FlowProgressTrackerV8'),
  'lazy-load-wrapper': () => import('./src/v8/components/shared/LazyLoadWrapperV8'),
  'test-suite': () => import('./src/v8/components/shared/ComponentTestSuiteV8'),
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### Lazy Loading Not Working
```tsx
// ✅ Check Intersection Observer support
if (!('IntersectionObserver' in window)) {
  console.warn('IntersectionObserver not supported');
  // Fallback to immediate loading
}

// ✅ Verify component import
const loader = () => import('./Component').then(mod => ({ default: mod.Component }));
```

#### Performance Issues
```tsx
// ✅ Monitor component size
const ComponentSizeMonitor = () => {
  const components = document.querySelectorAll('[data-component-size]');
  components.forEach(comp => {
    const size = comp.getAttribute('data-component-size');
    if (parseInt(size) > 100000) { // 100KB
      console.warn(`Large component detected: ${size} bytes`);
    }
  });
};
```

#### Memory Leaks
```tsx
// ✅ Cleanup on unmount
useEffect(() => {
  return () => {
    ComponentPreloader.clearCache();
  };
}, []);
```

### Debug Mode

#### Enable Debug Logging
```tsx
// Enable debug mode
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Component Debug Mode Enabled');
  // Add debug logging to components
}
```

#### Error Boundaries
```tsx
// ✅ Wrap with error boundaries
import { ErrorBoundary } from 'react';

<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={(error, errorInfo) => {
    console.error('Component Error:', error, errorInfo);
  }}
>
  <LazyLoadWrapperV8 loader={loader} />
</ErrorBoundary>
```

### Browser Compatibility

#### Intersection Observer Support
```tsx
// Check support and provide fallback
const useIntersectionObserver = (callback: IntersectionObserverCallback) => {
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    setIsSupported('IntersectionObserver' in window);
  }, []);
  
  return isSupported ? callback : null;
};
```

#### Polyfill for Older Browsers
```html
<!-- polyfill for Intersection Observer -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

---

## 📚 API Reference

### FlowProgressTrackerV8

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `FlowStep[]` | Required | Array of step objects |
| `currentStep` | `number` | Required | Current active step |
| `showProgress` | `boolean` | `true` | Show progress bar |
| `showTimeEstimates` | `boolean` | `false` | Show time estimates |
| `variant` | `string` | `'horizontal'` | Display variant |
| `onStepClick` | `function` | `undefined` | Step click handler |

### LazyLoadWrapperV8

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loader` | `function` | Required | Component loader function |
| `fallback` | `ReactNode` | `LoadingSpinner` | Loading fallback |
| `errorFallback` | `ReactNode` | `ErrorDisplay` | Error fallback |
| `delay` | `number` | `200` | Delay before showing loading |
| `threshold` | `number` | `0.1` | Intersection threshold |
| `rootMargin` | `string` | `'50px'` | Root margin |
| `onLoad` | `function` | `undefined` | Load callback |
| `onError` | `function` | `undefined` | Error callback |

### ComponentTestSuiteV8

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `components` | `string[]` | Required | Component names to test |
| `autoRun` | `boolean` | `false` | Auto-run tests |
| `showDetails` | `boolean` | `true` | Show detailed results |
| `onTestComplete` | `function` | `undefined` | Test completion callback |

---

## 🎯 Best Practices

### Performance Optimization

1. **Use Lazy Loading** for large components
2. **Preload Critical Components** for better UX
3. **Monitor Component Size** to prevent bloat
4. **Use Error Boundaries** for graceful failure
5. **Test in Multiple Browsers** for compatibility

### Code Organization

1. **Group Related Components** in logical directories
2. **Use Consistent Naming** conventions
3. **Document Component APIs** thoroughly
4. **Provide Usage Examples** in documentation
5. **Version Components** for breaking changes

### Testing Strategy

1. **Automated Testing** with ComponentTestSuiteV8
2. **Manual Testing** in different browsers
3. **Performance Testing** with real data
4. **Accessibility Testing** with screen readers
5. **Integration Testing** in real applications

---

## 📞 Support

For additional help or questions:

1. **Check Documentation**: Review this guide and component source code
2. **Open Issues**: File bugs on GitHub with detailed reproduction steps
3. **Community Forum**: Ask questions in the developer community
4. **Code Review**: Request code reviews for component implementations

---

*Last Updated: Phase 6 Documentation*  
*Version: 8.6.0*  
*Components: FlowProgressTrackerV8, LazyLoadWrapperV8, ComponentTestSuiteV8*
