# Sidebar Menu Badge Migration Guide

## 🎯 Objective
Replace all green checkmark badges (`FiCheckCircle`) with appropriate version tags and version numbers.

## 📋 Current State
- **File**: `src/components/DragDropSidebar.tsx`
- **Status**: MENU LOCKED - DO NOT MODIFY
- **Issue**: All menu items use generic green checkmark badges
- **Count**: 40+ instances of `FiCheckCircle` badges

## ✅ Solution: New Badge Component Created

### **Component**: `MenuVersionBadge.tsx`

**Features:**
- Color-coded badges by version type
- Displays version number
- Professional styling with hover effects

**Badge Types Available:**
```typescript
- v8   → Blue badge    → "V8 9.11.76"
- v8u  → Green badge   → "V8U 9.11.76"
- v7   → Purple badge  → "V7 7.2.0"
- v6   → Amber badge   → "V6 6.1.0"
- production → Green   → "PROD 9.11.76"
- legacy → Gray        → "LEGACY 5.0.0"
- new → Pink           → "NEW 9.11.76"
```

## 🔄 Migration Steps

### **Step 1: Import the New Badge Component**

In `DragDropSidebar.tsx`, add:
```typescript
import MenuVersionBadge from './MenuVersionBadge';
```

### **Step 2: Replace Badge Instances**

**OLD CODE (Green Checkmark):**
```typescript
badge: (
    <MigrationBadge title="V8: Simplified UI with educational content">
        <FiCheckCircle />
    </MigrationBadge>
),
```

**NEW CODE (Version Badge):**
```typescript
badge: <MenuVersionBadge version="9.11.76" type="v8" />,
```

### **Step 3: Version Mapping Guide**

Use this guide to determine which version type to use:

#### **V8 Flows (Blue - type="v8")**
- PingOne Token Exchange
- DPoP Authorization Code
- OAuth Authorization Code V8
- OIDC Authorization Code V8
- All Flows API Test
- PAR Test

#### **V8U Unified Flows (Green - type="v8u")**
- Unified MFA flows
- Unified OAuth flows
- Token Status pages

#### **V7 Flows (Purple - type="v7")**
- V7 OAuth Authorization Code
- V7 Device Authorization
- V7 Client Credentials
- V7 CIBA
- V7 Implicit flows
- V7 PAR flows
- V7 MFA flows

#### **V6 Flows (Amber - type="v6")**
- Legacy V6 implementations

#### **Production Features (Green - type="production")**
- PingOne Authentication
- PingOne Redirectless
- Worker Token flows
- Token Management
- User Profile
- Audit Activities

#### **Utility/Tools (Gray - type="legacy" or appropriate)**
- JWKS Troubleshooting
- Configuration pages
- Documentation pages

## 📝 Example Replacements

### **Example 1: V8 Flow**
```typescript
// BEFORE
{
    id: 'oauth-authz-v8',
    path: '/v8/oauth-authorization-code',
    label: 'OAuth Authorization Code',
    icon: <ColoredIcon $color="#10b981"><FiKey size={16} /></ColoredIcon>,
    badge: (
        <MigrationBadge title="V8: Simplified UI">
            <FiCheckCircle />
        </MigrationBadge>
    ),
}

// AFTER
{
    id: 'oauth-authz-v8',
    path: '/v8/oauth-authorization-code',
    label: 'OAuth Authorization Code',
    icon: <ColoredIcon $color="#10b981"><FiKey size={16} /></ColoredIcon>,
    badge: <MenuVersionBadge version="9.11.76" type="v8" />,
}
```

### **Example 2: V7 Flow**
```typescript
// BEFORE
{
    id: 'v7-oauth-authz',
    path: '/v7/oauth-authorization-code',
    label: 'V7 OAuth Authorization Code',
    icon: <ColoredIcon $color="#10b981"><FiKey size={16} /></ColoredIcon>,
    badge: (
        <MigrationBadge title="V7: Unified OAuth/OIDC">
            <FiCheckCircle />
        </MigrationBadge>
    ),
}

// AFTER
{
    id: 'v7-oauth-authz',
    path: '/v7/oauth-authorization-code',
    label: 'V7 OAuth Authorization Code',
    icon: <ColoredIcon $color="#10b981"><FiKey size={16} /></ColoredIcon>,
    badge: <MenuVersionBadge version="7.2.0" type="v7" />,
}
```

### **Example 3: Production Feature**
```typescript
// BEFORE
{
    id: 'pingone-auth',
    path: '/pingone-authentication',
    label: 'PingOne Authentication',
    icon: <ColoredIcon $color="#10b981"><FiShield size={16} /></ColoredIcon>,
    badge: (
        <MigrationBadge title="PingOne Authentication Flow">
            <FiCheckCircle />
        </MigrationBadge>
    ),
}

// AFTER
{
    id: 'pingone-auth',
    path: '/pingone-authentication',
    label: 'PingOne Authentication',
    icon: <ColoredIcon $color="#10b981"><FiShield size={16} /></ColoredIcon>,
    badge: <MenuVersionBadge version="9.11.76" type="production" />,
}
```

## 🎨 Visual Result

**Before:**
```
[Menu Item] ✓
```

**After:**
```
[Menu Item] [V8 9.11.76]    (Blue badge)
[Menu Item] [V7 7.2.0]      (Purple badge)
[Menu Item] [PROD 9.11.76]  (Green badge)
```

## 📊 Badge Color Reference

| Type | Color | Use Case |
|------|-------|----------|
| V8 | 🔵 Blue | Latest V8 implementations |
| V8U | 🟢 Green | Unified V8U flows |
| V7 | 🟣 Purple | V7 implementations |
| V6 | 🟠 Amber | Legacy V6 flows |
| PROD | 🟢 Green | Production features |
| LEGACY | ⚫ Gray | Deprecated features |
| NEW | 🔴 Pink | Newly added features |

## ⚠️ Important Notes

1. **File is Locked**: The DragDropSidebar.tsx file is marked as locked. You may need to:
   - Create a new version (DragDropSidebar.V2.tsx)
   - Or get approval to modify the locked file

2. **Version Numbers**: Use the actual version numbers from package.json:
   - V8/V8U: `9.11.76`
   - V7: `7.2.0` (or appropriate V7 version)
   - V6: `6.1.0` (or appropriate V6 version)

3. **Consistency**: Ensure all similar flows use the same version number

4. **Testing**: After migration, verify:
   - All badges display correctly
   - Colors match the version type
   - Hover tooltips show full version info

## 🚀 Next Steps

1. Review the migration guide
2. Decide on version numbers for each flow type
3. Create DragDropSidebar.V2.tsx or modify existing file
4. Replace all 40+ instances of green checkmarks
5. Test the sidebar display
6. Commit changes

---

**Created**: 2026-02-16  
**Component**: MenuVersionBadge.tsx  
**Status**: ✅ Ready for implementation
