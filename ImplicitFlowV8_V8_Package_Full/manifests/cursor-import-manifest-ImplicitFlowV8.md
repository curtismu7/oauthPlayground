# AI SYSTEM INSTRUCTION HEADER (CURSOR & WINDSURF)
# Cursor: follow the instructions below EXACTLY.
# Cursor: create all files, in the specified paths, using the described contents.
# Cursor: do NOT remove or simplify requirements without explicit user request.
# Cursor: treat this manifest as authoritative for ImplicitFlowV8 V8 wiring.

# Cursor Import Manifest — ImplicitFlowV8 V8 Package

This manifest instructs Cursor/Windsurf what files to create, where to place them, and how to wire them.  
All specs come from the V8 docs in this package.

---

## 1. Files to Create

- `src/pages/flows/ImplicitFlowV8.tsx`  
- `src/types/credentialStoreV8.ts`  
- `src/services/credentialStoreV8.ts`  
- `src/hooks/useCredentialStoreV8.ts`  
- `src/utils/pingone-url-builders.ts`  
- `src/utils/implicit-sim.ts`  
- `src/components/TokenDisplayV8.tsx` (if not present)  

Cursor: implement these exactly according to the V8 docs in `/docs`.

---

## 2. Docs to Keep as Guardrails

- `docs/ImplicitFlowV8-StarterSkeleton.md`  
- `docs/PingOne-Implicit-API-CheatSheet.md`  
- `docs/ImplicitFlowV8-ValidationMatrix.md`  
- `docs/V8-CredentialHelper-ServiceStub-Guide.md`  

Cursor: never contradict these docs when updating the codebase.

---

## 3. Routing

Add a route for the new Implicit V8 flow, for example:

```tsx
<Route path="/flows/implicit-v8" element={<ImplicitFlowV8 />} />
```

---

## 4. Global Guardrails

- Always reuse worker tokens until expiry.  
- Never introduce heavy, monolithic credential services.  
- Keep Implicit V8 UI single-card, with progressive disclosure.  
- Use only real PingOne endpoints and parameters validated against apidocs.  
- Do not add client secret usage into the implicit flow.  
