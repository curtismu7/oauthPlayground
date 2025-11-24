# AI SYSTEM INSTRUCTION HEADER (CURSOR & WINDSURF)
# Cursor: treat this document as an authoritative spec for ImplicitFlowV8.tsx.
# Cursor: do NOT simplify away fields, flows, or steps.
# Cursor: follow all structure, UX, and PingOne alignment described here.
# Cursor: when generating code, prefer correctness over brevity.

# ImplicitFlowV8 — Starter File Skeleton (V8 Redesign)

This file provides a clean, ready-to-build starter skeleton for `ImplicitFlowV8.tsx`.  
It already includes:

- Single-card V8 layout  
- App picker integration  
- Credential store hooks  
- Authorization URL builder  
- Redirect simulation  
- Fragment parsing  
- Token display  
- Real PingOne endpoint alignment  
- Correct apidocs-driven fields  

---

## ⚛️ ImplicitFlowV8.tsx (Starter Skeleton)

```tsx
import React, { useState, useEffect, useMemo } from "react";

// TODO: update import paths to match your project structure
import { useCredentialStoreV8 } from "../../hooks/useCredentialStoreV8";
import { buildPingOneImplicitAuthUrl } from "../../utils/pingone-url-builders";
import { simulateImplicitRedirect, parseFragmentParams } from "../../utils/implicit-sim";
import { TokenDisplayV8 } from "../../components/TokenDisplayV8";
import { VersionBadge } from "../../components/VersionBadge";
import { InfoPopover } from "../../components/InfoPopover";
import { LearnMoreSection } from "../../components/LearnMoreSection";

type Step = "CONFIG" | "AUTH_URL" | "REDIRECT" | "TOKENS";

export const ImplicitFlowV8: React.FC = () => {
  const [step, setStep] = useState<Step>("CONFIG");

  const {
    apps,
    selectedAppId,
    selectApp,
    getActiveAppConfig,
  } = useCredentialStoreV8();

  const activeApp = getActiveAppConfig();

  const [clientId, setClientId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [scopes, setScopes] = useState("openid profile");
  const [responseType, setResponseType] =
    useState<"id_token" | "token" | "both">("id_token");
  const [responseMode, setResponseMode] =
    useState<"fragment" | "form_post">("fragment");

  const [authUrl, setAuthUrl] = useState("");
  const [fragment, setFragment] = useState("");
  const [parsedTokens, setParsedTokens] = useState<Record<string, string>>({});

  // Auto-fill when app changes
  useEffect(() => {
    if (!activeApp) return;
    setClientId(activeApp.clientId ?? "");
    setRedirectUri(activeApp.defaultRedirectUri ?? "");
  }, [activeApp?.appId]);

  const canBuild = useMemo(
    () => !!clientId && !!redirectUri && scopes.trim().length > 0,
    [clientId, redirectUri, scopes]
  );

  const handleBuildAuthUrl = () => {
    if (!canBuild || !activeApp) return;

    const url = buildPingOneImplicitAuthUrl({
      environmentId: activeApp.environmentId,
      clientId,
      redirectUri,
      scopes,
      responseType,
      responseMode,
    });

    setAuthUrl(url);
    setStep("AUTH_URL");
  };

  const handleSimRedirect = () => {
    if (!authUrl) return;
    const frag = simulateImplicitRedirect(authUrl);
    setFragment(frag);
    setStep("REDIRECT");
  };

  const handleParseFragment = () => {
    if (!fragment) return;
    const parsed = parseFragmentParams(fragment);
    setParsedTokens(parsed);
    setStep("TOKENS");
  };

  return (
    <div className="flex justify-center mt-6">
      <div className="p1-flow-card max-w-3xl w-full bg-white p-6 rounded-xl shadow-md space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Implicit Flow (V8)</h1>
            <p className="text-xs text-gray-600">
              SPA-style implicit simulation using real PingOne authorization endpoints.
            </p>
          </div>
          <VersionBadge version="V8" flow="Implicit" />
        </header>

        {/* STEP 1: App Configuration */}
        {step === "CONFIG" && (
          <section className="space-y-4" aria-label="App configuration">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">App configuration</h2>
                <p className="text-xs text-gray-600">
                  Select a saved PingOne application or create a new one. Credentials are reused across flows.
                </p>
              </div>
              <span className="text-xs text-gray-500">
                Worker tokens & configs are reused until expiry.
              </span>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm font-medium flex flex-col">
                Application
                <select
                  className="mt-1 border rounded-md px-2 py-1 text-sm"
                  value={selectedAppId ?? ""}
                  onChange={(e) => selectApp(e.target.value)}
                >
                  <option value="">Select an app…</option>
                  {apps.map((app) => (
                    <option key={app.appId} value={app.appId}>
                      {app.label} ({app.environmentId})
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="border rounded-md px-3 py-1 text-xs"
                onClick={() => {
                  // TODO: open "Manage Apps" modal
                }}
              >
                Manage Apps…
              </button>

              <button
                type="button"
                className="border rounded-md px-3 py-1 text-xs"
                onClick={() => {
                  // TODO: open Redirect/Logout URI popup table
                }}
              >
                View Redirect/Logout URIs
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Client ID
                  <InfoPopover title="Client ID">
                    Client ID from your PingOne application configuration. Pulled automatically from the selected app.
                  </InfoPopover>
                </label>
                <input
                  className="border rounded-md px-2 py-1 text-sm w-full"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. a1b2c3d4..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Redirect URI
                  <InfoPopover title="Redirect URI">
                    Must match one of the configured redirect URIs for this PingOne application. For implicit flows,
                    tokens are returned to this location as a URL fragment.
                  </InfoPopover>
                </label>
                <input
                  className="border rounded-md px-2 py-1 text-sm w-full"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="https://your-app.example.com/callback"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Scopes
                  <InfoPopover title="Scopes">
                    Space-delimited list of scopes. For OIDC, include "openid" plus additional scopes such as "profile"
                    or "email".
                  </InfoPopover>
                </label>
                <input
                  className="border rounded-md px-2 py-1 text-sm w-full"
                  value={scopes}
                  onChange={(e) => setScopes(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Response Type
                  <InfoPopover title="Response Type">
                    Implicit flows return tokens directly from the authorization endpoint. Choose id_token, token, or both.
                  </InfoPopover>
                </label>
                <select
                  className="border rounded-md px-2 py-1 text-sm w-full"
                  value={responseType}
                  onChange={(e) => {
                    const val = e.target.value as "id_token" | "token" | "both";
                    setResponseType(val);
                  }}
                >
                  <option value="id_token">id_token (OIDC)</option>
                  <option value="token">token (OAuth access token)</option>
                  <option value="both">id_token token (hybrid-implicit)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  Response Mode
                  <InfoPopover title="Response Mode">
                    For implicit, fragment is typical. form_post posts the tokens to the redirect URI instead.
                  </InfoPopover>
                </label>
                <select
                  className="border rounded-md px-2 py-1 text-sm w-full"
                  value={responseMode}
                  onChange={(e) => setResponseMode(e.target.value as "fragment" | "form_post")}
                >
                  <option value="fragment">fragment (recommended)</option>
                  <option value="form_post">form_post</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                className="bg-indigo-600 text-white rounded-md px-4 py-1.5 text-sm disabled:opacity-50"
                disabled={!canBuild}
                onClick={handleBuildAuthUrl}
              >
                Build Authorization Request
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: Authorization URL */}
        {step === "AUTH_URL" && (
          <section className="space-y-3" aria-label="Authorization URL">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Authorization Request</h2>
              <InfoPopover title="PingOne Authorization Endpoint">
                This URL is built using the PingOne authorization endpoint as documented in apidocs.pingidentity.com.
              </InfoPopover>
            </div>

            <div className="bg-gray-50 border rounded-md p-3 text-xs font-mono break-all">
              {authUrl || "Authorization URL will appear here after you build it."}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="border rounded-md px-3 py-1 text-xs"
                onClick={() => authUrl && navigator.clipboard.writeText(authUrl)}
                disabled={!authUrl}
              >
                Copy URL
              </button>
              <button
                type="button"
                className="border rounded-md px-3 py-1 text-xs"
                onClick={handleSimRedirect}
                disabled={!authUrl}
              >
                Simulate Redirect
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Redirect / Fragment */}
        {step === "REDIRECT" && (
          <section className="space-y-3" aria-label="Redirect simulation">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Redirect & Fragment</h2>
              <InfoPopover title="URL Fragment">
                In implicit flows, tokens are returned in the URL fragment portion (#...) of the redirect URI.
              </InfoPopover>
            </div>

            <div className="bg-gray-50 border rounded-md p-3 text-xs font-mono break-all">
              {fragment || "#id_token=...&access_token=...&expires_in=3600"}
            </div>

            <button
              type="button"
              className="border rounded-md px-3 py-1 text-xs"
              onClick={handleParseFragment}
              disabled={!fragment}
            >
              Parse Fragment
            </button>
          </section>
        )}

        {/* STEP 4: Tokens */}
        {step === "TOKENS" && (
          <section className="space-y-3" aria-label="Tokens">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Tokens</h2>
              <InfoPopover title="Tokens Returned">
                Implicit returns tokens directly from the authorization endpoint. This is a simulation of what your SPA
                would see in the browser.
              </InfoPopover>
            </div>

            <TokenDisplayV8
              idToken={parsedTokens["id_token"]}
              accessToken={parsedTokens["access_token"]}
              expiresIn={parsedTokens["expires_in"]}
              tokenType={parsedTokens["token_type"]}
            />

            <LearnMoreSection
              title="Learn more about implicit flows"
              items={[
                "Why implicit is considered legacy and when to use Authz + PKCE instead.",
                "How PingOne maps scopes, claims, and tokens in OIDC responses.",
                "Security considerations for SPAs using implicit vs. authorization code with PKCE.",
              ]}
            />
          </section>
        )}
      </div>
    </div>
  );
}
```
