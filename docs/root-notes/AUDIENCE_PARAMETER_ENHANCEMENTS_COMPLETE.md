# Audience Parameter Enhancements - COMPLETE ✅

## Features Implemented

### 1. OIDC Discovery Auto-Fill ✅
The audience field now automatically populates with discovered OIDC endpoints.

**How it works:**
- When OIDC discovery completes, the `issuerUrl` and `tokenEndpoint` are passed to the component
- For OIDC flows: Auto-fills with the issuer URL (base URL) - the preferred audience
- For OAuth flows: Shows endpoints but doesn't auto-fill (user choice)

**Priority:**
1. **Issuer URL** (preferred) - e.g., `https://auth.pingone.com/env-id`
2. **Token Endpoint** (fallback) - e.g., `https://auth.pingone.com/env-id/as/token`

---

### 2. Drag and Drop Examples ✅
Users can now **drag** example values directly to the input field!

**Features:**
- All example items are draggable (cursor changes to "grab")
- Drag icon (FiMove) appears on each example
- Drop zone on input field (cursor changes to "copy" on drag-over)
- Visual feedback: Examples animate on hover
- Also supports traditional click-to-use

---

### 3. OIDC Discovery Examples Added ✅
When OIDC discovery data is available, it appears as highlighted examples at the top of the list.

**Visual Distinction:**
- **Blue background** for OIDC-discovered endpoints
- **"OIDC" badge** to indicate source
- **Appears first** in the examples list

**Example List Order:**
1. 🔵 Issuer URL (from OIDC Discovery) with OIDC badge
2. 🔵 Token Endpoint (from OIDC Discovery) with OIDC badge
3. Default example: `https://api.example.com`
4. Default example: `https://api.myservice.com/v1`
5. Default example: `urn:my-resource-server`
6. Default example: `https://graph.microsoft.com`

---

## Implementation Details

### Component Enhanced: AudienceParameterInput.tsx

**New Props:**
```typescript
interface AudienceParameterInputProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	flowType?: 'oauth' | 'oidc';
	tokenEndpoint?: string | undefined; // From OIDC discovery
	issuer?: string | undefined; // From OIDC discovery
	autoFillFromDiscovery?: boolean; // Whether to auto-fill on load
}
```

**New Features:**
1. **Auto-fill on mount** (when `autoFillFromDiscovery=true`)
2. **Dynamic examples** with OIDC endpoints prioritized
3. **Drag & drop handlers** (`handleDragStart`, `handleDrop`, `handleDragOver`)
4. **Visual indicators** when OIDC data is available

**New Styled Components:**
```typescript
- ExampleText: Text portion of example
- DragIcon: Move icon for drag affordance
- DiscoveryBadge: "OIDC" label for discovered endpoints
- ExampleItem: Now supports $isFromDiscovery prop for styling
```

---

### Flows Updated

#### OAuth Authorization Code Flow V6
**File:** `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`

**Changes:**
```typescript
<AudienceParameterInput
	value={audience}
	onChange={setAudience}
	flowType="oauth"
	tokenEndpoint={credentials.tokenEndpoint}  // ✅ Added
	issuer={credentials.issuerUrl}              // ✅ Added
	autoFillFromDiscovery={false}               // ✅ OAuth: user choice
/>
```

**Behavior:**
- Shows OIDC discovery endpoints as examples
- Does NOT auto-fill (OAuth is about authorization, not authentication)
- User can drag/click to use discovered endpoints

---

#### OIDC Authorization Code Flow V6
**File:** `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`

**Changes:**
```typescript
<AudienceParameterInput
	value={audience}
	onChange={setAudience}
	flowType="oidc"
	tokenEndpoint={controller.credentials.tokenEndpoint}  // ✅ Added
	issuer={controller.credentials.issuerUrl}              // ✅ Added
	autoFillFromDiscovery={true}                          // ✅ OIDC: auto-fill
/>
```

**Behavior:**
- Shows OIDC discovery endpoints as examples
- **Auto-fills** with issuer URL on mount (if empty)
- User can change or drag different values

---

## User Experience

### Visual Workflow

**Step 1: OIDC Discovery Runs**
```
User enters Environment ID or Issuer URL in credentials
↓
ComprehensiveCredentialsService calls OIDC discovery
↓
Discovery returns: issuerUrl, tokenEndpoint, etc.
↓
Values are stored in controller.credentials
```

**Step 2: Navigate to Advanced Parameters**
```
User opens "Advanced OAuth Parameters (Optional)" section
↓
AudienceParameterInput receives OIDC discovery data
↓
Component displays discovered endpoints as blue examples
```

**Step 3: User Interaction Options**

**Option A - Auto-filled (OIDC only):**
```
[Input field contains: https://auth.pingone.com/12345678-1234-1234-1234-123456789abc]
✓ OIDC Discovery endpoints available - drag them to the field above!

🔵 https://auth.pingone.com/12345678-1234-1234-1234-123456789abc  [OIDC] ⋮
🔵 https://auth.pingone.com/12345678-1234-1234-1234-123456789abc/as/token  [OIDC] ⋮
⚪ https://api.example.com  ⋮
⚪ https://api.myservice.com/v1  ⋮
```

**Option B - User Drags:**
```
User grabs a blue example (cursor: grab → grabbing)
↓
Drags to input field (cursor shows "copy" effect)
↓
Drops - value fills input field
```

**Option C - User Clicks:**
```
User clicks any example
↓
Value fills input field immediately
```

---

## Benefits

✅ **Faster Configuration:** OIDC flows auto-fill the most common value  
✅ **Discoverability:** Users see what endpoints are available  
✅ **Flexibility:** Drag, click, or type manually  
✅ **Visual Feedback:** Clear indication of OIDC-discovered values  
✅ **Educational:** Shows relationship between OIDC discovery and audience  
✅ **Best Practices:** Prioritizes issuer URL (correct audience for most cases)  
✅ **Accessibility:** Multiple input methods (drag, click, keyboard)

---

## Technical Implementation

### Drag and Drop API

**Drag Start:**
```typescript
const handleDragStart = (e: React.DragEvent, exampleValue: string) => {
	e.dataTransfer.setData('text/plain', exampleValue);
	e.dataTransfer.effectAllowed = 'copy';
};
```

**Drop:**
```typescript
const handleDrop = (e: React.DragEvent) => {
	e.preventDefault();
	const droppedValue = e.dataTransfer.getData('text/plain');
	if (droppedValue && !disabled) {
		onChange(droppedValue);
	}
};
```

**Drag Over (enable drop zone):**
```typescript
const handleDragOver = (e: React.DragEvent) => {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
};
```

### Auto-Fill Logic

```typescript
useEffect(() => {
	if (autoFillFromDiscovery && !value && (tokenEndpoint || issuer)) {
		// Prefer issuer as audience (base URL), fallback to token endpoint
		const discoveredAudience = issuer || tokenEndpoint;
		if (discoveredAudience) {
			console.log('[AudienceParameter] Auto-filling from OIDC discovery:', discoveredAudience);
			onChange(discoveredAudience);
		}
	}
}, [autoFillFromDiscovery, value, tokenEndpoint, issuer, onChange]);
```

### Dynamic Examples Builder

```typescript
const buildExamples = () => {
	const examples: Array<{ value: string; isFromDiscovery?: boolean; label?: string }> = [];
	
	// Add issuer first (preferred audience)
	if (issuer) {
		examples.push({ 
			value: issuer, 
			isFromDiscovery: true,
			label: 'Issuer (from OIDC Discovery)'
		});
	}
	
	// Add token endpoint
	if (tokenEndpoint && tokenEndpoint !== issuer) {
		examples.push({ 
			value: tokenEndpoint, 
			isFromDiscovery: true,
			label: 'Token Endpoint (from OIDC Discovery)'
		});
	}
	
	// Add default examples
	defaultExamples.forEach(ex => {
		examples.push({ value: ex });
	});
	
	return examples;
};
```

---

## Files Modified

1. ✅ `src/components/AudienceParameterInput.tsx` - Enhanced component
2. ✅ `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` - Added OIDC discovery props
3. ✅ `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` - Added OIDC discovery props + auto-fill

---

## Linter Status
✅ **No linter errors** in any modified files

---

## Testing Checklist

### OIDC Discovery
- [ ] Run OIDC discovery in OIDC Authorization Code flow
- [ ] Verify audience field auto-fills with issuer URL
- [ ] Verify blue examples appear with OIDC badge
- [ ] Verify issuer appears before token endpoint

### Drag and Drop
- [ ] Hover over example - cursor changes to "grab"
- [ ] Click and drag example - cursor changes to "grabbing"
- [ ] Drag over input field - cursor shows "copy" effect
- [ ] Drop on input - value fills field
- [ ] Verify disabled state prevents drag/drop

### Click to Use
- [ ] Click any example - value fills field immediately
- [ ] Click OIDC example - value fills with discovered endpoint
- [ ] Click default example - value fills with default

### Visual Feedback
- [ ] OIDC examples have blue background
- [ ] OIDC badge appears on discovered endpoints
- [ ] Drag icon (⋮) appears on all examples
- [ ] Examples animate on hover
- [ ] Helper text shows "✓ OIDC Discovery endpoints available" message

### OAuth vs OIDC Behavior
- [ ] OAuth flow: No auto-fill, but shows examples
- [ ] OIDC flow: Auto-fills with issuer URL
- [ ] Both flows: Can drag/click to change value

---

**Date:** October 13, 2025  
**Status:** ✅ COMPLETE  
**Feature:** Audience Parameter OIDC Discovery + Drag & Drop  
**Components Enhanced:** AudienceParameterInput  
**Flows Updated:** OAuth Authorization Code V6, OIDC Authorization Code V6
