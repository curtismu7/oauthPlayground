# Collapsible Sections - Default State Table

**Date:** October 11, 2025  
**Rule:** ALL sections default to `collapsed` EXCEPT those marked as "Open by Default"

## Global Default State Rules

### ✅ OPEN BY DEFAULT (defaultCollapsed={false})
| Section Type | Reason |
|--------------|--------|
| `credentials` | Users need to configure these first |
| `overview` | Provides essential context for the flow |
| **Current Step Content** | Users need to see what they're working on |

### ❌ COLLAPSED BY DEFAULT (defaultCollapsed={true})
| Section Type | Reason |
|--------------|--------|
| `flowDiagram` | Nice to have, not critical |
| `configuration` | Advanced settings, not always needed |
| `authMethods` | Technical details, reference material |
| `pkceOverview` | Educational content |
| `pkceDetails` | Technical deep dive |
| `rarOverview` | Educational content |
| `rarDetails` | Technical deep dive |
| `rarExamples` | Examples, not critical |
| `parOverview` | Educational content |
| `parDetails` | Technical deep dive |
| `authRequestOverview` | Secondary info |
| `authRequestDetails` | Technical details |
| `authResponseOverview` | Secondary info |
| `authResponseDetails` | Technical details |
| `tokenExchangeOverview` | Secondary info |
| `tokenExchangeDetails` | Technical details |
| `deviceCodeOverview` | Educational content |
| `deviceCodeDetails` | Technical deep dive |
| `userAuthOverview` | Educational content |
| `userAuthDetails` | Technical details |
| `pollingOverview` | Educational content |
| `pollingDetails` | Technical details |
| `tokensOverview` | Can be collapsed initially |
| `tokensDetails` | Technical details |
| `tokenAnalysis` | Advanced analysis |
| `tokenIntrospection` | Advanced feature |
| `introspectionOverview` | Educational content |
| `introspectionDetails` | Technical details |
| `userInfoOverview` | Educational content |
| `userInfoDetails` | Technical details |
| `securityFeatures` | Best practices, reference |
| `bestPractices` | Reference material |
| `completionOverview` | Final summary, can be collapsed |
| `completionDetails` | Technical details |
| `flowSummary` | Final summary, can be collapsed |
| `flowComparison` | Comparison table, reference |
| `responseMode` | Technical details |
| `useCases` | Examples, not critical |
| `uiSettings` | Advanced settings |
| `rawJson` | Technical details, debugging |
| `requestDetails` | Technical details |
| `results` | Can start collapsed until there are results |

## Implementation Pattern

```typescript
// ✅ CORRECT - Explicit default states
<CollapsibleHeader
    title="Overview"
    icon={<FiInfo />}
    defaultCollapsed={false}  // Open by default - one of the 3 exceptions
    showArrow={true}
>
    {/* content */}
</CollapsibleHeader>

<CollapsibleHeader
    title="Credentials"
    icon={<FiKey />}
    defaultCollapsed={false}  // Open by default - one of the 3 exceptions
    showArrow={true}
>
    {/* content */}
</CollapsibleHeader>

<CollapsibleHeader
    title="PKCE Details"
    icon={<FiShield />}
    defaultCollapsed={true}  // Collapsed by default - most sections
    showArrow={true}
>
    {/* content */}
</CollapsibleHeader>
```

## Step-Specific Rules

### Multi-Step Flows (Authorization Code, Device, etc.)

**Step 0:** 
- `overview` → OPEN
- `credentials` → OPEN  
- Everything else → COLLAPSED

**Step 1+:**
- Content for **current step only** → OPEN
- Everything else → COLLAPSED
- Previous step results → COLLAPSED (user can expand if needed)

### Single-Step Flows (Client Credentials, JWT Bearer, etc.)

**All Steps:**
- `overview` → OPEN (if it's the first section user sees)
- `credentials` → OPEN
- Everything else → COLLAPSED

## Service Configuration

The `CollapsibleHeader` service accepts `defaultCollapsed` prop:

```typescript
interface CollapsibleHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    defaultCollapsed?: boolean;  // ← THIS controls initial state
    showArrow?: boolean;
    variant?: 'default' | 'compact' | 'large';
    onToggle?: (collapsed: boolean) => void;
    children: React.ReactNode;
}
```

## Migration Checklist

For each flow:

- [ ] Import `CollapsibleHeader` service
- [ ] Remove local `CollapsibleSection`, `CollapsibleHeaderButton`, etc. styled components
- [ ] Replace all collapsible sections with `<CollapsibleHeader>`
- [ ] Set `defaultCollapsed={false}` ONLY for: `overview`, `credentials`, or current step
- [ ] Set `defaultCollapsed={true}` (or omit, as true is default) for all other sections
- [ ] Test that sections expand/collapse correctly
- [ ] Verify overview and credentials are visible on page load

---

**This table provides a single source of truth for collapsible section defaults across ALL flows.**

