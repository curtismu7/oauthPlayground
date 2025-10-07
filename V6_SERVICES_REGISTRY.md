# V6 Services Registry

**Created**: October 7, 2025  
**Status**: ✅ Restored and Active  
**Purpose**: Track all V6 services and their integration

---

## ✅ V6 Services - Restored & Active

### Core V6 Services

#### 1. **collapsibleHeaderService.tsx** ⭐ V6 SERVICE
**Status**: ✅ Restored  
**Purpose**: Consistent collapsible headers with blue gradient background and white arrows

**Features**:
- Blue gradient header with hover effects
- White circular arrow indicators that rotate on toggle
- Smooth expand/collapse animations
- Controlled and uncontrolled component modes
- Prevents infinite render loops
- ARIA accessible
- Icon + title + subtitle layout

**Props**:
```typescript
{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;        // For controlled mode
  onToggle?: () => void;      // For controlled mode
  showArrow?: boolean;
  variant?: 'default' | 'compact' | 'large';
}
```

**Used By**:
- Dashboard (5 sections)
- Configuration (5 sections)
- OAuthAuthorizationCodeFlowV6 (all sections)

**Fixed Issues**:
- ✅ Prevented "Maximum update depth exceeded" errors
- ✅ Added controlled component support
- ✅ Stable effect dependencies

---

#### 2. **shallowEqual.ts** ⭐ V6 UTILITY
**Status**: ✅ Restored  
**Purpose**: Utility for shallow equality comparison to prevent unnecessary re-renders

**Functions**:
```typescript
// Compare two objects/arrays shallowly
shallowEqual(a: any, b: any): boolean

// Set state only if changed
setIfChanged<T>(setter, next: T): void
```

**Used By**:
- PingOneApplicationConfig (prevents prop-to-state loops)
- Any component needing to guard state updates

**Purpose**: Part of React "Maximum update depth exceeded" fix strategy

---

### Integration with Existing V5 Services

The V6 services integrate seamlessly with existing V5 services:

#### **flowLayoutService.ts** (V5)
**Status**: ✅ Active  
**Purpose**: Page layout and dimensions  
**Features**:
- Container styles (max-width: 64rem)
- Content wrapper
- Main card
- Step headers
- Responsive breakpoints

**Note**: V6 services work alongside V5 layout service

---

#### **flowHeaderService.tsx** (V5)
**Status**: ✅ Active  
**Purpose**: Standardized flow headers

**Used By**: All pages (Dashboard, Configuration, all flows)

---

## 📊 Dashboard Integration

The Dashboard now uses collapsibleHeaderService for all 5 sections:

| Section | Icon | Default State | Purpose |
|---------|------|---------------|---------|
| System Status | 🖥️ FiServer | Expanded | Server health monitoring |
| V5 Flow Credential Status | 🔑 FiKey | Expanded | Credential configuration status |
| Available API Endpoints | 🔗 FiLink | **Collapsed** | Backend API documentation |
| Quick Access Flows | ⚡ FiZap | Expanded | Flow navigation shortcuts |
| Recent Activity | 📊 FiActivity | Expanded | Activity timeline |

---

## 📊 Configuration Integration

The Configuration page uses collapsibleHeaderService for all 5 sections:

| Section | Icon | Default State | Purpose |
|---------|------|---------------|---------|
| Application Information | 📦 FiPackage | **Collapsed** | Version and requirements |
| Quick Start Setup | 🖥️ FiTerminal | Expanded | Setup instructions |
| Alternative Startup Options | 🌐 FiGlobe | Expanded | Different startup methods |
| Troubleshooting | ℹ️ FiInfo | **Collapsed** | Common issues and solutions |
| Additional Resources | 🔗 FiExternalLink | **Collapsed** | External links |

---

## 🎯 V6 Service Architecture Principles

### Design Goals
1. **Consistency**: Same UI/UX across all pages
2. **Performance**: Prevent render loops and unnecessary re-renders
3. **Maintainability**: Single source of truth for common patterns
4. **Type Safety**: Full TypeScript support
5. **Accessibility**: ARIA attributes and keyboard navigation

### Anti-Patterns Prevented
- ❌ No setState during render
- ❌ No unstable effect dependencies
- ❌ No prop-to-state sync loops
- ❌ No service mutations in render
- ❌ No unguarded state updates

### Best Practices
- ✅ Use `useMemo` for derived values
- ✅ Use `useCallback` for event handlers
- ✅ Guard state updates with `shallowEqual`
- ✅ Controlled components for complex state
- ✅ Minimal effect dependencies

---

## 🚀 Usage Examples

### Collapsible Section (Uncontrolled)
```typescript
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FiSettings } from 'react-icons/fi';

<CollapsibleHeader
  title="Settings"
  subtitle="Configure your application"
  icon={<FiSettings />}
  defaultCollapsed={false}
>
  {/* Your content here */}
</CollapsibleHeader>
```

### Collapsible Section (Controlled)
```typescript
const [collapsed, setCollapsed] = useState(false);

<CollapsibleHeader
  title="Settings"
  subtitle="Configure your application"
  icon={<FiSettings />}
  collapsed={collapsed}
  onToggle={() => setCollapsed(!collapsed)}
>
  {/* Your content here */}
</CollapsibleHeader>
```

### With State Management
```typescript
const [sections, setSections] = useState({
  section1: false,
  section2: true,
});

const toggleSection = useCallback((key: keyof typeof sections) => {
  setSections(prev => ({ ...prev, [key]: !prev[key] }));
}, []);

<CollapsibleHeader
  title="Section 1"
  collapsed={sections.section1}
  onToggle={() => toggleSection('section1')}
>
  {/* Content */}
</CollapsibleHeader>
```

---

## ✅ Quality Checklist

All V6 services meet these standards:

- [x] TypeScript with proper types
- [x] JSDoc comments for functions
- [x] No linter errors
- [x] No React warnings
- [x] Prevents infinite loops
- [x] Memoized where appropriate
- [x] Accessible (ARIA attributes)
- [x] Responsive design
- [x] Consistent styling
- [x] Service pattern architecture

---

## 📈 Impact Metrics

### Code Reduction
- **Before**: Each page implemented own collapsible logic (~50 lines each)
- **After**: Import and use CollapsibleHeader (~10 lines)
- **Savings**: ~40 lines per section per page

### Pages Updated
- ✅ Dashboard (5 sections collapsified)
- ✅ Configuration (5 sections collapsified)
- 🎯 OAuthAuthorizationCodeFlowV6 (when rebuilt)

### Total Sections Collapsible
- **Current**: 10 sections across 2 pages
- **Potential**: 50+ sections across all pages

---

## 🔄 Service Dependencies

```
Dashboard & Configuration
├── collapsibleHeaderService (V6)
│   └── Uses controlled component pattern
├── flowHeaderService (V5)
│   └── Page headers
└── flowLayoutService (V5)
    └── Page dimensions and containers
```

---

## 🎓 Developer Guide

### Adding Collapsible Sections to a Page

**Step 1**: Import the service
```typescript
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FiSettings } from 'react-icons/fi';
```

**Step 2**: Add state management
```typescript
const [collapsedSections, setCollapsedSections] = useState({
  section1: false,
  section2: true,
});

const toggleSection = useCallback((key: keyof typeof collapsedSections) => {
  setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
}, []);
```

**Step 3**: Wrap your content
```typescript
<CollapsibleHeader
  title="Your Section Title"
  subtitle="Description of the section"
  icon={<FiSettings />}
  collapsed={collapsedSections.section1}
  onToggle={() => toggleSection('section1')}
>
  {/* Your existing content */}
</CollapsibleHeader>
```

---

## 🐛 Common Issues & Solutions

### Issue: "Maximum update depth exceeded"
**Solution**: Use controlled mode with `useCallback` for toggleSection

### Issue: Section doesn't remember state
**Solution**: Use `defaultCollapsed` for uncontrolled mode or manage state in parent

### Issue: Icon not showing
**Solution**: Import icon from `react-icons/fi` and pass as JSX element

### Issue: Double borders
**Solution**: Remove border/shadow from inner cards:
```typescript
<Card style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
```

---

**Last Updated**: October 7, 2025  
**Status**: ✅ Production Ready  
**Maintained By**: V6 Architecture Team

