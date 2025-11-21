# SPIFFE/SPIRE Flow - Collapsed API Calls by Default

## Change Summary

Modified the API call display to show all sections collapsed by default, allowing users to expand only the calls they want to inspect.

## Changes Made

### 1. Enhanced EnhancedApiCallDisplay Component

**File**: `src/components/EnhancedApiCallDisplay.tsx`

Added new prop `initiallyCollapsed` to control the initial expansion state:

```typescript
interface EnhancedApiCallDisplayProps {
  apiCall: EnhancedApiCallData;
  options?: ApiCallDisplayOptions;
  onExecute?: () => Promise<void>;
  showExecuteButton?: boolean;
  className?: string;
  initiallyCollapsed?: boolean;  // NEW PROP
}
```

**Implementation**:
```typescript
export const EnhancedApiCallDisplay: React.FC<EnhancedApiCallDisplayProps> = ({
  apiCall,
  options = {},
  onExecute,
  showExecuteButton = false,
  className,
  initiallyCollapsed = false,  // Default to false for backward compatibility
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    initiallyCollapsed 
      ? new Set()  // Start with all sections collapsed
      : new Set(['url', 'pingone'])  // Original behavior: URL and PingOne expanded
  );
  // ...
};
```

### 2. Updated SPIFFE Flow

**File**: `src/v8u/flows/SpiffeSpireFlowV8U.tsx`

Set `initiallyCollapsed={true}` for all API call displays:

```typescript
{apiCalls.map((apiCall, index) => (
  <div key={index} style={{ marginBottom: index < apiCalls.length - 1 ? '1.5rem' : '0' }}>
    <EnhancedApiCallDisplay
      apiCall={apiCall}
      initiallyCollapsed={true}  // All sections start collapsed
      options={{
        includeHeaders: true,
        includeBody: true,
        prettyPrint: true,
        showEducationalNotes: true,
        showFlowContext: true,
      }}
    />
  </div>
))}
```

## User Experience

### Before
- API calls appeared with URL and PingOne sections expanded
- Request/response details visible immediately
- Could be overwhelming with multiple API calls

### After
- All API calls start collapsed
- Clean, compact view showing only:
  - HTTP method badge (POST, GET, etc.)
  - URL
  - Status badge (200 OK, etc.)
  - Duration
- Users click to expand sections they want to inspect:
  - Request headers
  - Request body
  - Response data
  - Educational notes
  - cURL command

## Benefits

1. **Cleaner Interface**: Less visual clutter in the API Call History section
2. **Better Scanning**: Users can quickly see all API calls at a glance
3. **Focused Learning**: Users expand only the calls they want to learn about
4. **Progressive Disclosure**: Information revealed on demand
5. **Better Performance**: Less DOM rendering initially

## Sections Available to Expand

Each API call can be expanded to show:

1. **Request Details**
   - Headers
   - Body (formatted JSON)
   - Query parameters

2. **Response Details**
   - Status code and text
   - Response headers
   - Response data (formatted JSON)

3. **Educational Notes**
   - Bullet points explaining what's happening
   - Context about the API call
   - Best practices

4. **cURL Command**
   - Copy-paste ready command
   - Includes all headers and body
   - Can be used for testing

5. **Flow Context**
   - Which step this belongs to
   - Why this call is made
   - What happens next

## Backward Compatibility

The `initiallyCollapsed` prop defaults to `false`, so existing uses of `EnhancedApiCallDisplay` in other flows will continue to work with their current behavior (URL and PingOne sections expanded).

Only the SPIFFE flow explicitly sets `initiallyCollapsed={true}`.

## Visual Flow

### API Call History Section
```
┌─────────────────────────────────────────────────────┐
│ 📡 API Call History (3)                             │
├─────────────────────────────────────────────────────┤
│ ℹ️  Mock API Interactions: These show the API      │
│    calls that would happen in a real integration... │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ▶ POST https://spire-server.example.org:8081/...   │
│   ✓ 200 OK • 1200ms                                │
│   [Click to expand]                                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ▶ POST https://token-exchange.example.org/api/...  │
│   ✓ 200 OK • 800ms                                 │
│   [Click to expand]                                 │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ▶ POST https://auth.pingone.com/{envId}/as/token   │
│   ✓ 200 OK • 1300ms                                │
│   [Click to expand]                                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Expanded API Call
```
┌─────────────────────────────────────────────────────┐
│ ▼ POST https://spire-server.example.org:8081/...   │
│   ✓ 200 OK • 1200ms                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📋 Request Headers                                  │
│   Content-Type: application/json                    │
│                                                      │
│ 📦 Request Body                                     │
│   {                                                  │
│     "attestation_data": {                           │
│       "type": "kubernetes",                         │
│       ...                                           │
│     }                                               │
│   }                                                  │
│                                                      │
│ ✅ Response (200 OK)                                │
│   {                                                  │
│     "svid": {                                       │
│       "spiffe_id": "spiffe://...",                  │
│       ...                                           │
│     }                                               │
│   }                                                  │
│                                                      │
│ 📚 Educational Notes                                │
│   • SPIRE Agent verifies the workload...           │
│   • For Kubernetes: validates pod UID...           │
│   • Attestation proves the workload...             │
│                                                      │
│ 💻 cURL Command                                     │
│   curl -X POST \                                    │
│     https://spire-server.example.org:8081/... \    │
│     -H "Content-Type: application/json" \           │
│     -d '{"attestation_data": {...}}'               │
│   [Copy]                                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Testing

- [x] API calls start collapsed
- [x] Click to expand shows all sections
- [x] Click to collapse hides sections
- [x] Multiple API calls can be expanded independently
- [x] Copy buttons work in expanded state
- [x] Educational notes display correctly
- [x] cURL commands are accurate

---

**Impact**: Cleaner, more scannable API call history that users can explore at their own pace.
