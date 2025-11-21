# MFA Flow - Country Code Picker Integration

## Overview

Added a beautiful country code picker with flag emojis that integrates seamlessly with the phone number input field.

## Component: CountryCodePickerV8

### Features
- **47 countries** supported with flag emojis
- **Search functionality** - Filter by country name, code, or dial code
- **Visual design** - Flags + country names + dial codes
- **Keyboard accessible** - Auto-focus search on open
- **Click outside to close** - Intuitive UX
- **Seamless integration** - Looks like part of the phone input

### Supported Countries

**North America:**
- 🇺🇸 United States (+1)
- 🇨🇦 Canada (+1)
- 🇲🇽 Mexico (+52)

**Europe:**
- 🇬🇧 UK (+44), 🇩🇪 Germany (+49), 🇫🇷 France (+33), 🇪🇸 Spain (+34)
- 🇮🇹 Italy (+39), 🇳🇱 Netherlands (+31), 🇧🇪 Belgium (+32), 🇨🇭 Switzerland (+41)
- 🇦🇹 Austria (+43), 🇸🇪 Sweden (+46), 🇳🇴 Norway (+47), 🇩🇰 Denmark (+45)
- 🇫🇮 Finland (+358), 🇵🇱 Poland (+48), 🇮🇪 Ireland (+353), 🇵🇹 Portugal (+351)
- 🇬🇷 Greece (+30), 🇨🇿 Czech Republic (+420), 🇭🇺 Hungary (+36), 🇷🇴 Romania (+40)
- 🇷🇺 Russia (+7), 🇺🇦 Ukraine (+380), 🇹🇷 Turkey (+90)

**Asia Pacific:**
- 🇯🇵 Japan (+81), 🇰🇷 South Korea (+82), 🇨🇳 China (+86), 🇮🇳 India (+91)
- 🇸🇬 Singapore (+65), 🇭🇰 Hong Kong (+852), 🇲🇾 Malaysia (+60), 🇹🇭 Thailand (+66)
- 🇵🇭 Philippines (+63), 🇮🇩 Indonesia (+62), 🇻🇳 Vietnam (+84)
- 🇦🇺 Australia (+61), 🇳🇿 New Zealand (+64)

**Middle East & Africa:**
- 🇮🇱 Israel (+972), 🇦🇪 UAE (+971), 🇸🇦 Saudi Arabia (+966)
- 🇿🇦 South Africa (+27)

**Latin America:**
- 🇧🇷 Brazil (+55), 🇦🇷 Argentina (+54), 🇨🇱 Chile (+56), 🇨🇴 Colombia (+57)

## UI Design

### Integrated Look
```
┌─────────────────────────────────────────────┐
│ Phone Number *                              │
├──────────────┬──────────────────────────────┤
│ 🇺🇸 +1  ▼   │ 234567890                    │
└──────────────┴──────────────────────────────┘
```

### Dropdown Design
```
┌────────────────────────────────────────┐
│ Search countries...                    │
├────────────────────────────────────────┤
│ 🇺🇸  United States          +1        │
│     US                                 │
├────────────────────────────────────────┤
│ 🇬🇧  United Kingdom         +44       │
│     GB                                 │
├────────────────────────────────────────┤
│ 🇩🇪  Germany                +49       │
│     DE                                 │
└────────────────────────────────────────┘
```

## Implementation

### Component Props
```typescript
interface CountryCodePickerV8Props {
  value: string;           // Current dial code (e.g., "+1")
  onChange: (dialCode: string) => void;
  disabled?: boolean;
}
```

### Usage in MFA Flow
```typescript
<CountryCodePickerV8
  value={credentials.countryCode}
  onChange={(code) => setCredentials({ ...credentials, countryCode: code })}
/>
```

### Data Structure
```typescript
interface Country {
  code: string;      // ISO country code (e.g., "US")
  name: string;      // Full country name
  dialCode: string;  // Phone dial code (e.g., "+1")
  flag: string;      // Flag emoji (e.g., "🇺🇸")
}
```

## User Experience

### Selecting a Country
1. Click the country code button (shows flag + dial code)
2. Dropdown opens with search box auto-focused
3. Type to search by country name, code, or dial code
4. Click a country to select
5. Dropdown closes, button updates with new flag + code

### Phone Number Entry
1. Select country code from picker
2. Enter phone number **without** country code
3. System automatically combines: `countryCode + phoneNumber`
4. Example: `+1` + `2345678900` = `+12345678900`

### Visual Feedback
- **Selected country** - Green background in dropdown
- **Hover state** - Light gray background
- **Current selection** - Flag + dial code visible in button
- **Tooltip** - Full country name on hover

## Validation

### Updated Validation Rules
```typescript
// Old validation
if (!credentials.phoneNumber.startsWith('+')) {
  warnings.push('Phone number should include country code');
}

// New validation
if (!credentials.phoneNumber?.trim()) {
  errors.push('Phone Number is required');
} else if (credentials.phoneNumber.length < 6) {
  warnings.push('Phone number seems too short');
}
```

### Phone Number Cleaning
```typescript
// Remove any non-digit characters except spaces and dashes
const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
```

## Storage

### Credentials Structure
```typescript
interface Credentials {
  environmentId: string;
  username: string;
  countryCode: string;    // NEW: Stored separately
  phoneNumber: string;    // Now without country code
}
```

### Saved Example
```json
{
  "environmentId": "xxx-xxx-xxx",
  "username": "john.doe",
  "countryCode": "+1",
  "phoneNumber": "2345678900"
}
```

## API Integration

### Full Phone Number Construction
```typescript
const getFullPhoneNumber = (): string => {
  return `${credentials.countryCode}${credentials.phoneNumber}`;
};

// Usage in API call
const fullPhone = getFullPhoneNumber(); // "+12345678900"
await MFAServiceV8.registerDevice({
  environmentId: credentials.environmentId,
  username: credentials.username,
  type: 'SMS',
  phone: fullPhone,
});
```

## Styling

### Button Style
```css
.country-code-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 6px 0 0 6px;
  min-width: 90px;
  height: 42px;
}
```

### Phone Input Style
```css
.phone-number-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 0 6px 6px 0;
  font-family: monospace;
}
```

### Seamless Integration
- **No gap** between picker and input (`gap: 0`)
- **Shared border** - Picker has no right border, input has no left border
- **Matching height** - Both 42px tall
- **Matching radius** - Picker rounded left, input rounded right
- **Visual unity** - Looks like a single component

## Accessibility

- ✅ **Keyboard navigation** - Tab to focus, Enter to open
- ✅ **Search auto-focus** - Dropdown opens with search focused
- ✅ **Click outside to close** - Intuitive behavior
- ✅ **Tooltips** - Full country name on hover
- ✅ **Visual feedback** - Clear selected state
- ✅ **Disabled state** - Grayed out when disabled

## Benefits

### For Users
- ✅ **Visual country selection** - Flags make it easy to find countries
- ✅ **Fast search** - Type to filter instantly
- ✅ **No mistakes** - Can't enter wrong country code format
- ✅ **International support** - 47 countries covered
- ✅ **Clean input** - Only enter local number, no country code

### For Developers
- ✅ **Reusable component** - Can be used in any form
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Easy to extend** - Add more countries easily
- ✅ **Consistent API** - Standard onChange pattern
- ✅ **Well-documented** - Clear props and usage

## Future Enhancements

### Possible Additions
- [ ] Auto-detect country from browser locale
- [ ] Recently used countries at top
- [ ] Popular countries section
- [ ] Phone number formatting per country
- [ ] Validation rules per country
- [ ] Flag image fallback for older browsers

---

**Last Updated:** 2024-11-19  
**Version:** 8.0.0  
**Status:** Active - Country code picker fully integrated
