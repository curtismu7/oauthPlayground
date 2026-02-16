# Device Management & Device Ordering - UI Contract

## 📋 **Document Overview**

**Document ID**: UI-CONTRACT-DEV-MGMT-001  
**Version**: 1.0.0  
**Created**: 2026-01-21  
**Status**: Active  
**Owner**: OAuth Playground Team  

This document defines the UI contract, user experience requirements, and implementation specifications for MFA device management and device ordering functionality in the OAuth Playground application.

---

## 🎯 **Purpose & Scope**

### **Purpose**
- Define consistent user experience for device management operations
- Establish UI patterns for device ordering workflows
- Specify accessibility and responsive design requirements
- Document error handling and user feedback mechanisms

### **Scope**
- Device listing and management interface
- Device blocking/unblocking operations
- Device deletion and renaming
- Device ordering and priority setting
- User permissions and role-based access
- Error states and recovery workflows

---

## 👥 **User Personas**

### **Primary Users**
1. **End Users** - Manage their personal MFA devices
2. **Administrators** - Manage devices for other users
3. **Support Staff** - Assist users with device issues

### **User Goals**
- View all registered MFA devices
- Block/unblock compromised devices
- Delete unused devices
- Set device authentication order
- Rename devices for easy identification

---

## 🎨 **UI Components & Patterns**

### **1. Device List Component**

#### **Visual Design**
```typescript
interface DeviceListProps {
  devices: MFADevice[];
  loading: boolean;
  error?: string;
  onBlockDevice: (deviceId: string) => void;
  onUnblockDevice: (deviceId: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  onRenameDevice: (deviceId: string, newName: string) => void;
  onSetAsDefault: (deviceId: string) => void;
  userRole: 'admin' | 'user' | 'support';
}
```

#### **Device Card Layout**
```
┌─────────────────────────────────────────────────────────┐
│ 📱 SMS Device          [ACTIVE]    ⭐ Default  [⋮] Menu │
│ ─────────────────────────────────────────────────────── │
│ 📧 +1-555-0123                                          │
│ 📅 Created: Jan 15, 2026                               │
│ 🔒 Last used: 2 hours ago                               │
│                                                         │
│ [🔒 Block] [✏️ Rename] [🗑️ Delete]                     │
└─────────────────────────────────────────────────────────┘
```

#### **Status Indicators**
- **🟢 ACTIVE** - Device is functional and can be used
- **🔴 BLOCKED** - Device is blocked and cannot be used
- **🟡 ACTIVATION_REQUIRED** - Device needs user activation
- **⚪ EXPIRED** - Device has expired

### **2. Device Ordering Component**

#### **Visual Design**
```typescript
interface DeviceOrderingProps {
  devices: MFADevice[];
  currentOrder: string[];
  loading: boolean;
  onSaveOrder: (orderedDeviceIds: string[]) => void;
  onCancel: () => void;
}
```

#### **Drag & Drop Interface**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Set Device Authentication Order                        │
│                                                         │
│ Drag devices to set priority order:                      │
│                                                         │
│ 1️⃣ 📱 SMS Device          [⚡ Drag]  ⬆️ ⬇️              │
│ 2️⃣ 📧 Email Device         [⚡ Drag]  ⬆️ ⬇️              │
│ 3️⃣ 🔐 TOTP App             [⚡ Drag]  ⬆️ ⬇️              │
│ 4️⃣ 🔑 FIDO2 Security Key  [⚡ Drag]  ⬆️ ⬇️              │
│                                                         │
│ [💾 Save Order] [❌ Cancel]                             │
└─────────────────────────────────────────────────────────┘
```

### **3. Action Buttons & Controls**

#### **Primary Actions**
```typescript
// Block Device Button
<Button
  variant="destructive"
  size="sm"
  disabled={device.status === 'BLOCKED'}
  onClick={() => handleBlockDevice(device.id)}
>
  🔒 Block Device
</Button>

// Unblock Device Button  
<Button
  variant="secondary"
  size="sm"
  disabled={device.status !== 'BLOCKED'}
  onClick={() => handleUnblockDevice(device.id)}
>
  🔓 Unblock Device
</Button>

// Delete Device Button
<Button
  variant="destructive"
  size="sm"
  onClick={() => handleDeleteDevice(device.id)}
>
  🗑️ Delete Device
</Button>
```

#### **Secondary Actions**
```typescript
// Rename Device
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleRenameDevice(device.id)}
>
  ✏️ Rename
</Button>

// Set as Default
<Button
  variant="outline"
  size="sm"
  disabled={device.isDefault}
  onClick={() => handleSetAsDefault(device.id)}
>
  ⭐ Set as Default
</Button>
```

---

## 🔄 **User Workflows**

### **1. View Devices Workflow**

#### **Steps**
1. User navigates to Device Management page
2. System loads user's MFA devices
3. Devices displayed in card format with status
4. User can view device details and available actions

#### **Success Criteria**
- All devices load within 2 seconds
- Device status is clearly visible
- Actions are contextually available
- Responsive design works on mobile

### **2. Block Device Workflow**

#### **Steps**
1. User clicks "Block Device" on device card
2. Confirmation dialog appears with warning
3. User confirms block action
4. System blocks device via API
5. UI updates to show blocked status
6. Success notification displayed

#### **Confirmation Dialog**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Block Device                                         │
│                                                         │
│ Are you sure you want to block this device?            │
│                                                         │
| 📱 SMS Device (+1-555-0123)                           │
│                                                         │
| Blocked devices cannot be used for authentication.     │
| You can unblock them at any time.                      │
│                                                         │
│ [🔒 Block Device] [❌ Cancel]                          │
└─────────────────────────────────────────────────────────┘
```

### **3. Device Ordering Workflow**

#### **Steps**
1. User clicks "Set Device Order" button
2. Device ordering interface opens
3. User drags devices to desired order
4. System validates order (max 10 devices)
5. User saves the new order
6. Confirmation message displayed

#### **Order Validation Rules**
- Maximum 10 devices in order
- At least 1 device must be selected
- Default device must be first in order
- Blocked devices cannot be ordered

---

## 🚨 **Error Handling & Edge Cases**

### **1. Network Errors**

#### **Loading States**
```typescript
// Skeleton loading for device list
<DeviceListSkeleton />
<DeviceCardSkeleton count={3} />

// Error state
<ErrorMessage
  title="Failed to load devices"
  message="We couldn't load your MFA devices. Please try again."
  action={<RetryButton onRetry={loadDevices} />}
/>
```

#### **API Error Handling**
```typescript
const handleBlockDevice = async (deviceId: string) => {
  try {
    setLoading(true);
    await MFAServiceV8.blockDevice({ deviceId, environmentId, userId });
    toastV8.success('Device blocked successfully');
    await loadDevices();
  } catch (error) {
    if (error.status === 403) {
      toastV8.error('You do not have permission to block devices');
    } else if (error.status === 404) {
      toastV8.error('Device not found');
    } else {
      toastV8.error('Failed to block device. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

### **2. Permission Errors**

#### **Role-Based Access Control**
```typescript
const canBlockDevice = (userRole: string, deviceStatus: string) => {
  if (userRole === 'admin') return true;
  if (userRole === 'support') return deviceStatus !== 'BLOCKED';
  if (userRole === 'user') return deviceStatus !== 'BLOCKED';
  return false;
};

const canDeleteDevice = (userRole: string) => {
  return userRole === 'admin';
};
```

#### **Permission Denied UI**
```
┌─────────────────────────────────────────────────────────┐
| 🔒 Permission Denied                                    │
│                                                         │
│ You do not have permission to delete devices.          │
│ Please contact your administrator for assistance.        │
│                                                         │
│ [📧 Contact Admin] [❌ Close]                          │
└─────────────────────────────────────────────────────────┘
```

### **3. Validation Errors**

#### **Device Limits**
```typescript
const validateDeviceOrder = (devices: MFADevice[]) => {
  if (devices.length > 10) {
    return {
      valid: false,
      message: 'You can only order up to 10 devices'
    };
  }
  
  if (devices.length === 0) {
    return {
      valid: false,
      message: 'At least one device must be selected'
    };
  }
  
  return { valid: true };
};
```

---

## 📱 **Responsive Design**

### **Mobile Layout (< 768px)**
```css
.device-card {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.device-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.device-actions button {
  width: 100%;
  justify-content: center;
}
```

### **Tablet Layout (768px - 1024px)**
```css
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

### **Desktop Layout (> 1024px)**
```css
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}
```

---

## ♿ **Accessibility Requirements**

### **Keyboard Navigation**
- All interactive elements reachable via Tab key
- Clear focus indicators on all buttons and links
- Skip navigation for screen readers
- ARIA labels for custom components

### **Screen Reader Support**
```typescript
<button
  aria-label={`Block ${device.type} device ${device.name}`}
  aria-describedby={`device-${device.id}-status`}
  disabled={device.status === 'BLOCKED'}
>
  🔒 Block Device
</button>

<div
  id={`device-${device.id}-status`}
  aria-live="polite"
>
  Status: {device.status}
</div>
```

### **Color Contrast**
- Text contrast ratio: 4.5:1 minimum
- Interactive elements: 3:1 minimum
- Status indicators use icons + color

---

## 🔐 **Security Considerations**

### **Data Protection**
- Worker tokens never exposed in UI
- Device IDs masked in logs
- Sensitive actions require confirmation
- Session timeout for inactive users

### **Permission Validation**
- All actions validated on backend
- Role-based access control enforced
- Audit logging for all device operations
- Rate limiting for device actions

---

## 📊 **Performance Requirements**

### **Loading Times**
- Device list: < 2 seconds
- Device actions: < 1 second
- Device ordering: < 500ms
- Error recovery: < 3 seconds

### **Caching Strategy**
- Device list cached for 5 minutes
- Device status cached for 1 minute
- Order preferences cached locally
- Cache invalidation on device changes

---

## 🧪 **Testing Requirements**

### **Unit Tests**
```typescript
describe('DeviceManagement', () => {
  test('should display device list', () => {
    // Test device rendering
  });
  
  test('should handle device blocking', () => {
    // Test block workflow
  });
  
  test('should validate device order', () => {
    // Test order validation
  });
});
```

### **Integration Tests**
- End-to-end device management workflows
- API integration with error scenarios
- Permission validation across roles
- Responsive design testing

### **Accessibility Tests**
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- ARIA label verification

---

## 📚 **Implementation Guidelines**

### **Component Structure**
```
src/
├── components/
│   ├── DeviceManagement/
│   │   ├── DeviceList.tsx
│   │   ├── DeviceCard.tsx
│   │   ├── DeviceOrdering.tsx
│   │   └── DeviceActions.tsx
│   └── common/
│       ├── ConfirmationDialog.tsx
│       ├── ErrorMessage.tsx
│       └── LoadingSkeleton.tsx
├── services/
│   ├── deviceManagementService.ts
│   └── deviceOrderingService.ts
└── hooks/
    ├── useDeviceManagement.ts
    └── useDeviceOrdering.ts
```

### **State Management**
```typescript
interface DeviceManagementState {
  devices: MFADevice[];
  loading: boolean;
  error: string | null;
  selectedDevices: string[];
  orderingMode: boolean;
}
```

### **API Integration**
```typescript
// Service layer for device operations
export class DeviceManagementService {
  static async getDevices(userId: string): Promise<MFADevice[]>
  static async blockDevice(deviceId: string): Promise<void>
  static async unblockDevice(deviceId: string): Promise<void>
  static async deleteDevice(deviceId: string): Promise<void>
  static async renameDevice(deviceId: string, name: string): Promise<void>
  static async setDeviceOrder(deviceIds: string[]): Promise<void>
}
```

---

## 🔄 **Version History**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-21 | Initial UI contract creation | OAuth Playground Team |

---

## 📞 **Contact & Support**

**Questions about this UI contract?**
- **Team**: OAuth Playground Development Team
- **Email**: dev-team@oauth-playground.com
- **Slack**: #oauth-playground-dev
- **Documentation**: [Confluence Space]

---

*This document is part of the OAuth Playground UI Contract series. For related documents, see the UI Documentation repository.*
