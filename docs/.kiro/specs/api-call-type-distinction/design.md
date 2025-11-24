# Design Document: API Call Type Distinction with Color Coding

## Overview

This design enhances the API call display system to clearly distinguish between PingOne backend calls, frontend client-side operations, and internal proxy calls using color-coded visual indicators. The solution automatically classifies calls and applies consistent color schemes throughout the UI, making it immediately obvious to developers what type of operation is being performed.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Call Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. API Call Created                                         │
│     ↓                                                         │
│  2. Call Type Detector (NEW)                                 │
│     - Analyzes URL/method                                    │
│     - Classifies as: pingone | frontend | internal          │
│     ↓                                                         │
│  3. API Call Tracker Service (ENHANCED)                      │
│     - Stores call with callType property                     │
│     ↓                                                         │
│  4. Enhanced API Call Display (ENHANCED)                     │
│     - Applies color scheme based on callType                 │
│     - Renders color-coded rows                               │
│     - Shows type-specific badges and icons                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
┌──────────────────────┐
│  Flow Components     │
│  (WorkerTokenFlow,   │
│   PARFlow, etc.)     │
└──────────┬───────────┘
           │ creates API call
           ↓
┌──────────────────────┐
│ Call Type Detector   │◄─── URL pattern matching
│ (NEW utility)        │◄─── Method checking
└──────────┬───────────┘
           │ returns callType
           ↓
┌──────────────────────┐
│ API Call Tracker     │
│ Service (ENHANCED)   │
└──────────┬───────────┘
           │ stores with callType
           ↓
┌──────────────────────┐
│ Enhanced API Call    │
│ Display (ENHANCED)   │◄─── Color theme mapping
└──────────────────────┘◄─── Icon selection
```

## Components and Interfaces

### 1. Enhanced API Call Interface

**File:** `src/services/apiCallTrackerService.ts`

```typescript
export type ApiCallType = 'pingone' | 'frontend' | 'internal';

export interface ApiCall {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'LOCAL';
  url: string;
  actualPingOneUrl?: string;
  callType: ApiCallType; // NEW: Automatically determined call type
  headers?: Record<string, string>;
  body?: string | object | null;
  queryParams?: Record<string, string>;
  response?: {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    data?: unknown;
    error?: string;
  };
  timestamp: Date;
  duration?: number;
  step?: string;
}
```

### 2. Call Type Detector Utility

**File:** `src/utils/apiCallTypeDetector.ts` (NEW)

```typescript
export type ApiCallType = 'pingone' | 'frontend' | 'internal';

export interface CallTypeResult {
  type: ApiCallType;
  displayName: string;
  icon: string;
  description: string;
}

export class ApiCallTypeDetector {
  /**
   * Detect the type of API call based on URL and method
   */
  static detectCallType(url: string, method: string): CallTypeResult {
    // Frontend/Client-side operations
    if (method === 'LOCAL' || !url || url === 'Client-side') {
      return {
        type: 'frontend',
        displayName: 'Frontend Client-Side',
        icon: '💻',
        description: 'Client-side operation (no network request)'
      };
    }

    // PingOne backend calls
    if (url.includes('auth.pingone.com') || 
        url.includes('api.pingone.com') ||
        url.includes('pingone.com') ||
        url.includes('pingone.asia') ||
        url.includes('pingone.eu')) {
      return {
        type: 'pingone',
        displayName: 'PingOne Backend API',
        icon: '🌐',
        description: 'Real HTTP request to PingOne servers'
      };
    }

    // Internal/Proxy calls (default)
    return {
      type: 'internal',
      displayName: 'Internal Proxy',
      icon: '🔄',
      description: 'Request to application backend/proxy'
    };
  }

  /**
   * Get color theme for call type
   */
  static getColorTheme(callType: ApiCallType): ColorTheme {
    const themes: Record<ApiCallType, ColorTheme> = {
      pingone: {
        background: '#fef3c7',
        border: '#f59e0b',
        text: '#92400e',
        badgeBackground: '#fde68a',
        headerGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        hoverGradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)'
      },
      frontend: {
        background: '#dbeafe',
        border: '#3b82f6',
        text: '#1e40af',
        badgeBackground: '#bfdbfe',
        headerGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        hoverGradient: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'
      },
      internal: {
        background: '#e0e7ff',
        border: '#8b5cf6',
        text: '#5b21b6',
        badgeBackground: '#c7d2fe',
        headerGradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        hoverGradient: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)'
      }
    };

    return themes[callType];
  }
}

interface ColorTheme {
  background: string;
  border: string;
  text: string;
  badgeBackground: string;
  headerGradient: string;
  hoverGradient: string;
}
```

### 3. Enhanced API Call Display Component

**File:** `src/components/EnhancedApiCallDisplay.tsx` (ENHANCED)

Key changes:
- Add `callType` prop to component
- Apply color theme to entire container
- Update all section headers with call-type-specific colors
- Add call type badge with icon
- Add color legend component

```typescript
interface EnhancedApiCallDisplayProps {
  apiCall: EnhancedApiCallData;
  options?: ApiCallDisplayOptions;
  onExecute?: () => Promise<void>;
  showExecuteButton?: boolean;
  showColorLegend?: boolean; // NEW
  className?: string;
}

// Styled component updates
const Container = styled.div<{ 
  $theme?: 'light' | 'dark';
  $callType?: ApiCallType; // NEW
}>`
  background: ${({ $callType }) => 
    $callType ? ApiCallTypeDetector.getColorTheme($callType).background : '#ffffff'
  };
  border: 2px solid ${({ $callType }) => 
    $callType ? ApiCallTypeDetector.getColorTheme($callType).border : '#e5e7eb'
  };
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
`;

const CallTypeBadge = styled.div<{ $callType: ApiCallType }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ $callType }) => 
    ApiCallTypeDetector.getColorTheme($callType).badgeBackground
  };
  color: ${({ $callType }) => 
    ApiCallTypeDetector.getColorTheme($callType).text
  };
  border: 2px solid ${({ $callType }) => 
    ApiCallTypeDetector.getColorTheme($callType).border
  };
`;
```

### 4. Color Legend Component

**File:** `src/components/ApiCallColorLegend.tsx` (NEW)

```typescript
export const ApiCallColorLegend: React.FC = () => {
  return (
    <LegendContainer>
      <LegendTitle>API Call Types</LegendTitle>
      <LegendItems>
        <LegendItem $callType="pingone">
          <LegendIcon>🌐</LegendIcon>
          <LegendText>
            <strong>PingOne Backend</strong>
            <span>Real HTTP requests to PingOne servers</span>
          </LegendText>
        </LegendItem>
        <LegendItem $callType="frontend">
          <LegendIcon>💻</LegendIcon>
          <LegendText>
            <strong>Frontend Client-Side</strong>
            <span>JavaScript operations (no network request)</span>
          </LegendText>
        </LegendItem>
        <LegendItem $callType="internal">
          <LegendIcon>🔄</LegendIcon>
          <LegendText>
            <strong>Internal Proxy</strong>
            <span>Requests to application backend</span>
          </LegendText>
        </LegendItem>
      </LegendItems>
    </LegendContainer>
  );
};
```

## Data Models

### Call Type Classification Rules

```typescript
interface ClassificationRule {
  condition: (url: string, method: string) => boolean;
  callType: ApiCallType;
  priority: number; // Higher priority rules checked first
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    condition: (url, method) => method === 'LOCAL' || !url,
    callType: 'frontend',
    priority: 100
  },
  {
    condition: (url) => /pingone\.(com|asia|eu)/.test(url),
    callType: 'pingone',
    priority: 90
  },
  {
    condition: () => true, // Default fallback
    callType: 'internal',
    priority: 0
  }
];
```

### Color Theme Configuration

```typescript
interface ColorThemeConfig {
  callTypes: {
    pingone: ColorTheme;
    frontend: ColorTheme;
    internal: ColorTheme;
  };
  accessibility: {
    minContrastRatio: number; // WCAG AA: 4.5:1
    textColors: {
      light: string;
      dark: string;
    };
  };
}

const COLOR_THEME_CONFIG: ColorThemeConfig = {
  callTypes: {
    pingone: {
      background: '#fef3c7',      // Amber 100
      border: '#f59e0b',          // Amber 500
      text: '#92400e',            // Amber 800
      badgeBackground: '#fde68a', // Amber 200
      headerGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      hoverGradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)'
    },
    frontend: {
      background: '#dbeafe',      // Blue 100
      border: '#3b82f6',          // Blue 500
      text: '#1e40af',            // Blue 800
      badgeBackground: '#bfdbfe', // Blue 200
      headerGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      hoverGradient: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'
    },
    internal: {
      background: '#e0e7ff',      // Indigo 100
      border: '#8b5cf6',          // Violet 500
      text: '#5b21b6',            // Violet 800
      badgeBackground: '#c7d2fe', // Indigo 200
      headerGradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
      hoverGradient: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)'
    }
  },
  accessibility: {
    minContrastRatio: 4.5,
    textColors: {
      light: '#ffffff',
      dark: '#111827'
    }
  }
};
```

## Error Handling

### Call Type Detection Errors

1. **Invalid URL Format**
   - Fallback to 'internal' type
   - Log warning for debugging
   - Display generic internal badge

2. **Missing Method**
   - Default to 'GET' method
   - Attempt classification based on URL only
   - Log warning if classification uncertain

3. **Ambiguous Classification**
   - Use priority-based rule system
   - Higher priority rules take precedence
   - Document edge cases in code comments

### Color Theme Errors

1. **Missing Theme Configuration**
   - Fallback to default gray theme
   - Log error for missing configuration
   - Ensure UI remains functional

2. **Invalid Color Values**
   - Validate hex color format
   - Use fallback colors if invalid
   - Log validation errors

## Testing Strategy

### Unit Tests

1. **Call Type Detector Tests**
   ```typescript
   describe('ApiCallTypeDetector', () => {
     test('detects PingOne calls correctly', () => {
       const result = ApiCallTypeDetector.detectCallType(
         'https://auth.pingone.com/env-id/as/token',
         'POST'
       );
       expect(result.type).toBe('pingone');
     });

     test('detects frontend operations', () => {
       const result = ApiCallTypeDetector.detectCallType('', 'LOCAL');
       expect(result.type).toBe('frontend');
     });

     test('defaults to internal for unknown URLs', () => {
       const result = ApiCallTypeDetector.detectCallType(
         'https://myapp.com/api/proxy',
         'POST'
       );
       expect(result.type).toBe('internal');
     });
   });
   ```

2. **Color Theme Tests**
   ```typescript
   describe('Color Theme', () => {
     test('returns correct theme for each call type', () => {
       const pingoneTheme = ApiCallTypeDetector.getColorTheme('pingone');
       expect(pingoneTheme.border).toBe('#f59e0b');
     });

     test('meets WCAG AA contrast requirements', () => {
       // Test contrast ratios for all themes
     });
   });
   ```

### Integration Tests

1. **API Call Display with Call Types**
   - Render component with different call types
   - Verify correct colors applied
   - Check badge displays correctly

2. **Multiple Calls in Sequence**
   - Display mixed call types
   - Verify color alternation
   - Check legend displays correctly

### Visual Regression Tests

1. **Color Consistency**
   - Screenshot tests for each call type
   - Verify color schemes match design
   - Check hover states

2. **Accessibility**
   - Contrast ratio validation
   - Color blindness simulation
   - Screen reader compatibility

## Implementation Notes

### Phase 1: Core Infrastructure
1. Create `ApiCallTypeDetector` utility
2. Update `ApiCall` interface with `callType` property
3. Modify `apiCallTrackerService` to auto-detect and store call type

### Phase 2: Visual Components
1. Create `ApiCallColorLegend` component
2. Update `EnhancedApiCallDisplay` styled components
3. Apply color themes to all sections

### Phase 3: Integration
1. Update all flow components to use new system
2. Add color legend to pages with API call displays
3. Test with real PingOne calls

### Phase 4: Polish
1. Add animations and transitions
2. Optimize performance
3. Add accessibility features
4. Documentation and examples

## Design Decisions

### Why Color-Code Entire Rows?
- **Immediate Recognition**: Users can scan quickly without reading text
- **Visual Hierarchy**: Different call types stand out clearly
- **Consistency**: Same color scheme throughout all sections of a call

### Why These Specific Colors?
- **Amber/Yellow for PingOne**: Represents external/important backend calls
- **Blue for Frontend**: Common convention for client-side operations
- **Purple for Internal**: Distinguishes from both frontend and backend

### Why Auto-Detection?
- **Developer Experience**: No manual classification needed
- **Consistency**: Rules applied uniformly across all calls
- **Maintainability**: Single source of truth for classification logic

### Accessibility Considerations
- All color combinations meet WCAG AA contrast requirements (4.5:1)
- Icons supplement color coding for color-blind users
- Text labels provide additional context beyond color alone
- Hover states and focus indicators remain visible
