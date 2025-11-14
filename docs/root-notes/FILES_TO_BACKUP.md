# Files to Backup - V2/V3/V4 Flows

## Recommendation
Move these files to `/src/pages/flows/_backup/` folder since they are:
- Not in the sidebar menu
- Superseded by V5 versions
- Not actively used

---

## V4 Flows (2 files)
```
src/pages/flows/AuthorizationCodeFlowV4.tsx
src/pages/flows/AuthzV4NewWindsurfFlow.tsx
```

## V3 Flows (6 files)
```
src/pages/flows/OAuth2ImplicitFlowV3.tsx
src/pages/flows/OIDCImplicitFlowV3.tsx
src/pages/flows/OIDCHybridFlowV3.tsx
src/pages/flows/OAuth2ClientCredentialsFlowV3.tsx
src/pages/flows/OIDCClientCredentialsFlowV3.tsx
src/pages/flows/WorkerTokenFlowV3.tsx
```

## V2 Flows (1 file)
```
src/pages/flows/EnhancedAuthorizationCodeFlowV2.tsx
```

## Legacy Flows - No Version (11 files)
```
src/pages/flows/AuthorizationCodeFlow.tsx
src/pages/flows/EnhancedAuthorizationCodeFlow.tsx
src/pages/flows/ImplicitGrantFlow.tsx
src/pages/flows/ClientCredentialsFlow.tsx
src/pages/flows/WorkerTokenFlow.tsx
src/pages/flows/HybridFlow.tsx
src/pages/flows/HybridPostFlow.tsx
src/pages/flows/DeviceCodeFlow.tsx
src/pages/flows/DeviceCodeFlowOIDC.tsx
src/pages/flows/ResourceOwnerPasswordFlow.tsx
src/pages/flows/PingOnePARFlow.tsx (non-V5 version)
```

---

## Total Files to Backup: 20 files

## Action Plan
1. Create backup directory: `src/pages/flows/_backup/`
2. Move all 20 files listed above to backup folder
3. Remove their routes from `App.tsx`
4. Keep all V5 flows and utility pages
5. Test that all menu items still work

## Files to KEEP (Do NOT backup)
- All files ending in `V5.tsx` (17 V5 flows)
- `Flows.tsx` (legacy container)
- `OAuthFlowsNew.tsx` (main flows page)
- `UserInfoFlow.tsx` (utility)
- `IDTokensFlow.tsx` (utility)
- `PARFlow.tsx` (in Resources menu)
- All callback files (`*Callback.tsx`)
