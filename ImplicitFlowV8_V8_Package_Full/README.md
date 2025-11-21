# ImplicitFlowV8 V8 Package — Docs & Manifests

This ZIP contains everything needed to build and wire the **ImplicitFlowV8 V8** experience using Cursor/Windsurf.

## Contents

- `docs/ImplicitFlowV8-StarterSkeleton.md`  
  - Full starter skeleton for `ImplicitFlowV8.tsx` with V8 UX and PingOne alignment.

- `docs/PingOne-Implicit-API-CheatSheet.md`  
  - Canonical reference for PingOne endpoints and parameters used by Implicit and related flows.

- `docs/ImplicitFlowV8-ValidationMatrix.md`  
  - Validation and error-handling contract between UI and PingOne apidocs.

- `docs/V8-CredentialHelper-ServiceStub-Guide.md`  
  - Spec for the lightweight V8 credential store and worker token reuse logic.

- `manifests/cursor-import-manifest-ImplicitFlowV8.md`  
  - AI-oriented manifest telling Cursor/Windsurf how to create and wire all code files.

- `manifests/windsurf-project.json`  
  - Simple project metadata Windsurf can use to understand the scope of this V8 package.

## How to Use

1. Unzip into your repo root (or a dedicated `v8-spec/` folder).  
2. Open `manifests/cursor-import-manifest-ImplicitFlowV8.md` in Cursor.  
3. Instruct Cursor:  
   - “Create and wire all files described in this manifest.”  
4. Use the docs in `docs/` as the source of truth for flows, endpoints, and validation.  

This package is designed so that future AI-powered refactors **cannot easily drift away** from the PingOne V8 design.
