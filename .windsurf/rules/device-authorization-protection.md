---
trigger: manual
description:
globs:
---

## ✅ CRITICAL FEATURES THAT MUST WORK

### 1. **Polling Logic** (useDeviceAuthorizationFlow.ts)
- ✅ Polling must stop after 3 consecutive 400 errors
- ✅ Error handling for expired device codes
- ✅ Status transitions: pending → polling → authorized
- ✅ NO INFINITE LOOPS

### 2. **Device Display Components**
- ✅ All devices must load immediately with realistic appearance
- ✅ QR code must be separate and not greyed out during authorization
- ✅ Device should be greyed out until authorization completes
- ✅ Success message should turn green and be compact after authorization
- ✅ Token display should be independent and full-width

### 3. **Token Display**
- ✅ Use UnifiedTokenDisplayService with proper props
- ✅ Header and payload displayed separately when decoded
- ✅ Independent width (not constrained by device size)
- ✅ In-place decode (replace token with JSON, not add below)

### 4. **RFC 8628 Compliance**
- ✅ Device code format and expiration handling
- ✅ Verification URI and verification URI complete
- ✅ Polling intervals (slow_down handling)
- ✅ Scope and audience validation

---

## 🔒 CHANGE PROTOCOL

### Allowed Changes
✅ Bug fixes that do not alter existing behavior
✅ UI improvements that maintain functionality
✅ Educational content updates
✅ Styling changes (colors, sizes, layout)
✅ Adding new device types
✅ Documentation improvements

### Prohibited Changes
❌ Modifying polling logic without testing all devices
❌ Changing error handling behavior
❌ Removing or altering safety mechanisms (400 error limits, etc.)
❌ Modifying token display without testing all flows
❌ Breaking device display initialization
❌ Changing device layout structure

### Required Process
1. **Test on ALL device types** before committing
   - Airport Kiosk
   - Smart TV
   - Smart Printer
   - POS Terminal
   - Smart Speaker
   - Gaming Console
   - Fitness Tracker
   - Gas Pump
   - AI Agent
   - MCP Server
   - Mobile Phone
2. **Run through complete flow** (QR code scan → authorization → tokens)
3. **Verify no regression** in token decoding
4. **Confirm RFC 8628 compliance** maintained

---

## 🧪 VERIFICATION CHECKLIST

Before marking any change complete:
- [ ] Can start polling with valid device code
- [ ] Polling stops after 3 consecutive 400 errors
- [ ] All device displays load immediately with realistic appearance
- [ ] QR code is visible and separate from device
- [ ] Device greys out until authorization
- [ ] Success message turns green and is compact
- [ ] Tokens display correctly with independent width
- [ ] Token decode shows header and payload separately
- [ ] "Open on this Device" works for mobile flows
- [ ] Token Management can decode all tokens

---

## ⚠️ EMERGENCY ROLLBACK

If device authorization is broken:
1. Immediately revert changes to protected files
2. Restore from git history
3. Document what broke and why
4. Re-implement with proper testing

---

**Last Approved Change:** Token display improvements (current session)
**Status:** WORKING AS EXPECTED
**Next Review:** Any change request affecting device authorization
