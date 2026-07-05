# 📊 **Side Menu Configuration & Unused Files Analysis**

## 🗂️ **Side Menu Configuration Overview**

### **📋 Menu Structure & Imports**

#### **Primary Configuration File**

```
📁 src/config/sidebarMenuConfig.ts
├── Imports: VersionBadgeService
├── Exports:
│   ├── SIDEBAR_MENU_GROUPS (array)
│   ├── getSidebarMenuGroupsWithVersionBadges()
│   ├── USE_PING_MENU (boolean)
│   └── SidebarMenuItem interface
└── Consumed by: SidebarMenuPing.tsx
```

#### **Import Dependencies**

| File                      | Import Path                         | Purpose                   |
| ------------------------- | ----------------------------------- | ------------------------- |
| `sidebarMenuConfig.ts`    | `../components/VersionBadgeService` | Auto-apply version badges |
| `VersionBadgeService.tsx` | `../config/sidebarMenuConfig`       | Type definitions          |
| `VersionBadgeService.tsx` | `../version`                        | Current version metadata  |
| `SidebarMenuPing.tsx`     | `../config/sidebarMenuConfig`       | Menu groups & items       |

---

## 🎯 **Complete Side Menu Structure**

### **📊 Menu Groups (13 Total)**

| Group ID                   | Label                      | Items Count | SubGroups | Status    |
| -------------------------- | -------------------------- | ----------- | --------- | --------- |
| `dashboard`                | Dashboard                  | 1           | 0         | ✅ Active |
| `admin-configuration`      | Admin & Configuration      | 11          | 0         | ✅ Active |
| `pingone-platform`         | PingOne Platform           | 6           | 0         | ✅ Active |
| `unified-production-flows` | Unified & Production Flows | 8           | 0         | ✅ Active |
| `oauth-flows`              | OAuth 2.0 Flows            | 7           | 0         | ✅ Active |
| `oidc-flows`               | OpenID Connect             | 5           | 0         | ✅ Active |
| `pingone-flows`            | PingOne Flows              | 6           | 0         | ✅ Active |
| `tokens-session`           | Tokens & Session           | 8           | 0         | ✅ Active |
| `developer-tools`          | Developer & Tools          | 15          | 0         | ✅ Active |
| `education-tutorials`      | Education & Tutorials      | 4           | 0         | ✅ Active |
| `mock-educational-flows`   | Mock & Educational Flows   | 0           | 3         | ✅ Active |
| `artificial-intelligence`  | Artificial Intelligence    | 4           | 1         | ✅ Active |
| `documentation-reference`  | Documentation & Reference  | 15          | 0         | ✅ Active |

### **📈 Total Menu Items**

- **Direct Items**: 80 menu items
- **SubGroup Items**: 14 items across 4 subgroups
- **Grand Total**: 94 menu items

---

## 🔗 **Menu Items by Path & Status**

### **✅ Recently Updated Items** (with 'updated' badge)

| Path                               | Label                    | Version | Status     |
| ---------------------------------- | ------------------------ | ------- | ---------- |
| `/flows/kroger-grocery-store-mfa`  | Kroger Grocery Store MFA | V9      | ✅ Updated |
| `/jwks-troubleshooting`            | JWKS Troubleshooting     | V9      | ✅ Updated |
| `/flows/userinfo`                  | UserInfo Flow            | V9      | ✅ Updated |
| `/configuration`                   | Configuration Management | V9      | ✅ Updated |
| `/credential-management`           | Credential Management    | V9      | ✅ Updated |
| `/postman-collection-generator-v9` | Postman Generator V9     | V9      | ✅ Updated |
| `/flows/mock-oidc-ropc`            | Mock OIDC ROPC           | V9      | ✅ Updated |

### **🔍 Debug Log Viewer Items** (Recently Added)

| Path                    | Label                 | Version | Status    |
| ----------------------- | --------------------- | ------- | --------- |
| `/v9/debug-logs-popout` | Debug Log Viewer (V9) | V9      | ✅ Active |
| `/v8/debug-logs-popout` | Debug Log Viewer (V8) | Legacy  | ⚠️ Legacy |

### **🧹 Cleanliness Dashboard** (Recently Added)

| Path                     | Label                           | Version | Status    |
| ------------------------ | ------------------------------- | ------- | --------- |
| `/cleanliness-dashboard` | Component Cleanliness Dashboard | V9      | ✅ Active |

---

## 📦 **Import Chain Analysis**

### **🔗 Dependency Flow**

```
sidebarMenuConfig.ts
    ↓ imports
VersionBadgeService.tsx
    ↓ imports
sidebarMenuConfig.ts (types)
    ↓ imports
version.ts
    ↓ consumed by
SidebarMenuPing.tsx
    ↓ consumes
getSidebarMenuGroupsWithVersionBadges()
```

### **📋 Import Details**

| Component                 | Imports From          | Purpose                  |
| ------------------------- | --------------------- | ------------------------ |
| `sidebarMenuConfig.ts`    | `VersionBadgeService` | Auto version badges      |
| `VersionBadgeService.tsx` | `sidebarMenuConfig`   | SidebarMenuItem type     |
| `VersionBadgeService.tsx` | `version`             | Current version metadata |
| `SidebarMenuPing.tsx`     | `sidebarMenuConfig`   | Menu groups & items      |

---

## 🗑️ **Unused Files Analysis by Directory**

### **📁 src/components/ - CleanlinessDashboard Variants**

| File                              | Status     | Usage              | Recommendation      |
| --------------------------------- | ---------- | ------------------ | ------------------- |
| `CleanlinessDashboard.tsx`        | ❌ Broken  | Not imported       | 🗑️ Remove           |
| `CleanlinessDashboardFixed.tsx`   | ⚠️ Complex | Not imported       | 📦 Archive          |
| `CleanlinessDashboardMinimal.tsx` | ✅ Working | Not imported       | 🧪 Keep for testing |
| `CleanlinessDashboardTest.tsx`    | ✅ Working | Not imported       | 🧪 Keep for testing |
| `CleanlinessDashboardSimple.tsx`  | ✅ Active  | ✅ Used in App.tsx | ✅ Keep             |

### **📁 src/components/ - Potential Unused Files**

#### **🔍 Device Flow Components** (May be unused)

| File                             | Last Referenced | Status         | Recommendation |
| -------------------------------- | --------------- | -------------- | -------------- |
| `AIAgentDeviceFlow.tsx`          | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `AirportKioskDeviceFlow.tsx`     | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `AmazonEchoShowDeviceFlow.tsx`   | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `AppleTVDeviceFlow.tsx`          | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `BoseSmartSpeakerDeviceFlow.tsx` | Unknown         | ⚠️ Check usage | 🔍 Investigate |

#### **🔍 Modal Components** (May be unused)

| File                               | Last Referenced | Status         | Recommendation |
| ---------------------------------- | --------------- | -------------- | -------------- |
| `ActivityModal.tsx`                | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `AddCustomUrlModal.tsx`            | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `AdvancedSecuritySettingsMock.tsx` | Unknown         | ⚠️ Check usage | 🔍 Investigate |

#### **🔍 Dashboard Components** (May be unused)

| File                     | Last Referenced | Status         | Recommendation |
| ------------------------ | --------------- | -------------- | -------------- |
| `AnalyticsDashboard.tsx` | Unknown         | ⚠️ Check usage | 🔍 Investigate |
| `CachingDashboard.tsx`   | Unknown         | ⚠️ Check usage | 🔍 Investigate |

### **📁 src/api/ - API Files**

| File                      | Usage   | Status         | Recommendation |
| ------------------------- | ------- | -------------- | -------------- |
| `credentialsSqliteApi.js` | Unknown | ⚠️ Check usage | 🔍 Investigate |
| `pingone.ts`              | Unknown | ⚠️ Check usage | 🔍 Investigate |

### **📁 src/**fixtures**/ - Test Fixtures**

| File              | Usage        | Status  | Recommendation      |
| ----------------- | ------------ | ------- | ------------------- |
| `hybridTokens.ts` | Test fixture | ✅ Keep | ✅ Keep for testing |

### **📁 src/AppLazy.tsx**

| File          | Usage   | Status         | Recommendation |
| ------------- | ------- | -------------- | -------------- |
| `AppLazy.tsx` | Unknown | ⚠️ Check usage | 🔍 Investigate |

---

## 🎯 **Unused Files Summary Table**

### **📊 High Priority - Likely Unused**

| Directory          | File                            | Reason                             | Action         |
| ------------------ | ------------------------------- | ---------------------------------- | -------------- |
| `/src/components/` | `CleanlinessDashboard.tsx`      | Broken, replaced by Simple version | 🗑️ Remove      |
| `/src/components/` | `CleanlinessDashboardFixed.tsx` | Complex errors, not used           | 📦 Archive     |
| `/src/components/` | `AnalyticsDashboard.tsx`        | Not in menu, unknown usage         | 🔍 Investigate |
| `/src/components/` | `CachingDashboard.tsx`          | Not in menu, unknown usage         | 🔍 Investigate |
| `/src/api/`        | `credentialsSqliteApi.js`       | Unknown API usage                  | 🔍 Investigate |
| `/src/`            | `AppLazy.tsx`                   | Unknown lazy loading usage         | 🔍 Investigate |

### **📊 Medium Priority - Check Usage**

| Directory          | File                             | Reason                     | Action   |
| ------------------ | -------------------------------- | -------------------------- | -------- |
| `/src/components/` | `AIAgentDeviceFlow.tsx`          | Device flow, may be unused | 🔍 Check |
| `/src/components/` | `AirportKioskDeviceFlow.tsx`     | Device flow, may be unused | 🔍 Check |
| `/src/components/` | `AmazonEchoShowDeviceFlow.tsx`   | Device flow, may be unused | 🔍 Check |
| `/src/components/` | `AppleTVDeviceFlow.tsx`          | Device flow, may be unused | 🔍 Check |
| `/src/components/` | `BoseSmartSpeakerDeviceFlow.tsx` | Device flow, may be unused | 🔍 Check |
| `/src/components/` | `ActivityModal.tsx`              | Modal, may be unused       | 🔍 Check |
| `/src/components/` | `AddCustomUrlModal.tsx`          | Modal, may be unused       | 🔍 Check |

### **📊 Low Priority - Keep**

| Directory            | File                              | Reason       | Action  |
| -------------------- | --------------------------------- | ------------ | ------- |
| `/src/components/`   | `CleanlinessDashboardMinimal.tsx` | Test version | ✅ Keep |
| `/src/components/`   | `CleanlinessDashboardTest.tsx`    | Test version | ✅ Keep |
| `/src/__fixtures__/` | `hybridTokens.ts`                 | Test fixture | ✅ Keep |

---

## 🔧 **Side Menu Configuration Details**

### **⚙️ Configuration Constants**

```typescript
USE_PING_MENU = true; // Use Ping UI sidebar
SIDEBAR_PING_WIDTH = 520; // Default width (px)
SIDEBAR_PING_MIN_WIDTH = 220; // Minimum width (px)
SIDEBAR_PING_MAX_WIDTH = 700; // Maximum width (px)
```

### **🎨 Menu Features**

- **Version Badges**: Auto-applied based on migration status
- **Drag & Drop**: Reordering support
- **LocalStorage**: Persists user preferences
- **Responsive**: Resizable between min/max widths
- **Hierarchical**: Support for subgroups
- **Search**: Built-in search functionality

### **🔄 Consumer Components**

| Component             | Purpose                   | Status    |
| --------------------- | ------------------------- | --------- |
| `SidebarMenuPing.tsx` | Main menu renderer        | ✅ Active |
| `DragDropSidebar.tsx` | Drag & drop functionality | ✅ Active |
| `Sidebar.tsx`         | Main sidebar container    | ✅ Active |

---

## 📈 **Statistics Summary**

### **📊 Menu Statistics**

- **Total Groups**: 13
- **Total Items**: 94 (80 direct + 14 subgroups)
- **V9 Migrated**: ~70%
- **Recently Updated**: 7 items
- **Recently Added**: 3 items (debug logs + cleanliness)

### **🗑️ Unused Files Statistics**

- **High Priority**: 6 files (remove/archive)
- **Medium Priority**: 7 files (investigate)
- **Low Priority**: 3 files (keep)
- **Total Investigate**: 13 files

### **🔗 Import Chain**

- **Direct Dependencies**: 3 files
- **Import Depth**: 2 levels
- **Circular Dependencies**: None detected
- **Unused Imports**: None found

---

## 🎯 **Recommendations**

### **🚀 Immediate Actions**

1. **🗑️ Remove**: `CleanlinessDashboard.tsx` (broken)
2. **📦 Archive**: `CleanlinessDashboardFixed.tsx` (complex issues)
3. **🔍 Investigate**: 13 potentially unused files
4. **✅ Keep**: Test versions and fixtures

### **🔧 Side Menu Improvements**

1. **Audit**: Verify all menu items work correctly
2. **Clean**: Remove any broken menu items
3. **Optimize**: Check for duplicate functionality
4. **Document**: Update menu item descriptions

### **📊 Maintenance**

1. **Regular**: Monthly unused file audit
2. **Monitor**: Track menu item usage
3. **Update**: Keep version badges current
4. **Test**: Verify all menu routes work

**The side menu is well-structured with 94 items across 13 groups, but there are several potentially unused files that should be investigated!** 🎯
