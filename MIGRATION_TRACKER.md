# CollapsibleHeader Migration Tracker

**Date:** October 11, 2025  
**Goal:** Migrate all remaining flows to use CollapsibleHeader service

---

## ✅ Already Completed (6 flows)

1. ✅ AdvancedParametersV6.tsx
2. ✅ SAMLBearerAssertionFlowV6.tsx  
3. ✅ WorkerTokenFlowV6.tsx
4. ✅ JWTBearerTokenFlowV5.tsx
5. ✅ OAuthAuthorizationCodeFlowV6.tsx (uiSettings fixed, but still has local components)
6. ✅ OIDCAuthorizationCodeFlowV6.tsx (uiSettings fixed, but still has local components)

---

## 🎯 Flows with LOCAL CollapsibleSection (10 flows)

### High Priority - PingOne Flows
1. ⏳ **PingOnePARFlowV6_New.tsx** (starting now)
2. ⏳ **RARFlowV6_New.tsx**
3. ⏳ **PingOnePARFlowV6.tsx** (older version)

### Device Authorization Flows
4. ⏳ **DeviceAuthorizationFlowV6.tsx**
5. ⏳ **OIDCDeviceAuthorizationFlowV6.tsx**

### Mock/Other Flows
6. ⏳ **RedirectlessFlowV5_Mock.tsx**
7. ⏳ **RedirectlessFlowV5.tsx**
8. ⏳ **RedirectlessFlowV6_Real.tsx**
9. ⏳ **OIDCHybridFlowV5.tsx**
10. ⏳ **ClientCredentialsFlowV5_New.tsx**

---

## 🔄 Flows using FlowUIService (3 flows) 

These use `FlowUIService.getFlowUIComponents()` for collapsibles:

1. ⏳ **OAuthImplicitFlowV6.tsx**
2. ⏳ **OIDCImplicitFlowV6_Full.tsx**
3. ⏳ **JWTBearerTokenFlowV6.tsx**

**Note:** These require a different migration approach since they use shared service components.

---

## 📊 Current Status

**Total to Migrate:** 13 flows  
**Completed:** 0/13  
**In Progress:** 1 (PingOnePARFlowV6_New.tsx)  
**Pending:** 12

---

## 🚀 Current Focus

**Migrating:** PingOnePARFlowV6_New.tsx  
**Next:** RARFlowV6_New.tsx

---

*This tracker will be updated as each flow is completed.*

