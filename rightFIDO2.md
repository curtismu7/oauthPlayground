# Cursor Task – Implement Correct PingOne FIDO2 (WebAuthn) Registration Flow

## Goal

Implement the **FIDO2 / WebAuthn** device registration flow so it correctly uses:

- The `publicKeyCredentialCreationOptions` returned by PingOne.
- The browser’s WebAuthn API (`navigator.credentials.create`).
- The PingOne **FIDO2 device activation API**, with the attestation payload and origin.

You are wiring a **PingOne MFA educational/demo app (V8)** so that FIDO2 device registration works end-to-end, just like Email/SMS/TOTP, using the real PingOne APIs and WebAuthn semantics.

Do **not** redesign the UI – extend/adjust existing steps and modals.

### Relevant files (typical)

Adapt to the actual filenames in the repo, but expect to touch:

- `FIDO2FlowV8.tsx` (or equivalent)
- `FIDO2ConfigurationPageV8.tsx` (if present)
- `FIDO2FlowController.ts` / FIDO2 service file
- Shared: `MFAFlowBaseV8.tsx` and any `CredentialsServiceV8` or `MFACredentials` types used by MFA flows

---

## 1. PingOne FIDO2 Device Creation – What You Get Back

When you create a FIDO2 device in PingOne, the response includes a field like:

```json
"publicKeyCredentialCreationOptions": "{\"rp\":{\"id\":\"pingone.com\",\"name\":\"PingOne\"},\"user\":{...},\"challenge\":[...],\"pubKeyCredParams\":[...],\"timeout\":120000,\"excludeCredentials\":[],\"authenticatorSelection\":{...},\"attestation\":\"none\",\"extensions\":{...}}"
```

Important points:

- `publicKeyCredentialCreationOptions` is a **JSON string** (escaped JSON).
- Inside that string is a standard WebAuthn **`PublicKeyCredentialCreationOptions`** object.
- The object contains:
  - `rp` (relying party: id + name)
  - `user` (user handle, displayName, name)
  - `challenge` (array of bytes)
  - `pubKeyCredParams` (algorithms)
  - `authenticatorSelection` (resident key, user verification, etc.)
  - `attestation` (e.g., `"none"`)
  - `extensions` (e.g., `credProps`, `hmacCreateSecret`)
  - `excludeCredentials` (to avoid re-registering same authenticator)

Your job is to:

1. Parse that string into a JS object.
2. Convert the byte arrays into `Uint8Array` / `ArrayBuffer` for WebAuthn.
3. Pass it to `navigator.credentials.create({ publicKey: ... })`.

---

## 2. Frontend – Using `publicKeyCredentialCreationOptions` with WebAuthn

### Step 1 – Parse the options

From the API response:

```ts
const optionsString = response.publicKeyCredentialCreationOptions;
const opts = JSON.parse(optionsString);
```

### Step 2 – Convert byte arrays to `Uint8Array`

The WebAuthn API requires `ArrayBuffer`/`Uint8Array` for certain fields:

- `opts.challenge`
- `opts.user.id`
- `opts.excludeCredentials[i].id` (if present)

Example helper:

```ts
function toUint8Array(arr: number[]): Uint8Array {
  return new Uint8Array(arr);
}

opts.challenge = toUint8Array(opts.challenge);
opts.user.id = toUint8Array(opts.user.id);

if (Array.isArray(opts.excludeCredentials)) {
  opts.excludeCredentials = opts.excludeCredentials.map((cred: any) => ({
    ...cred,
    id: toUint8Array(cred.id),
  }));
}
```

### Step 3 – Call `navigator.credentials.create`

```ts
const credential = (await navigator.credentials.create({
  publicKey: opts,
})) as PublicKeyCredential | null;
```

If `credential` is `null`, handle it as user cancellation and surface that in the UI.

### Step 4 – Serialize `credential` to a JSON-safe object

You must convert the binary pieces to **base64url**, so they can be JSON-stringified and sent to the backend.

Helpers:

```ts
function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) {
    str += String.fromCharCode(b);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
```

Build the attestation object:

```ts
if (!credential) {
  throw new Error("User did not complete WebAuthn credential creation.");
}

const attestationObj = {
  id: credential.id,
  type: credential.type,
  rawId: bufferToBase64Url(credential.rawId),
  response: {
    clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
    attestationObject: bufferToBase64Url(
      (credential.response as AuthenticatorAttestationResponse).attestationObject
    ),
  },
  clientExtensionResults: credential.getClientExtensionResults(),
};
```

Now you can send this `attestationObj` to your backend.

---

## 3. Frontend → Backend – Send Origin + Attestation

The backend must receive:

- The **origin** where the WebAuthn ceremony occurred.
- The **attestation object** from the browser.

Typical payload from frontend to backend:

```ts
await fetch("/api/pingone/fido2/activate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    origin: window.location.origin,
    attestation: attestationObj,
    deviceId,   // device ID from PingOne's create-device response
    envId,      // environment ID
    userId,     // PingOne user ID
  }),
});
```

> The `origin` must match what PingOne expects for WebAuthn (e.g. your user-hosted UI origin or PingOne-hosted origin, per your setup).

---

## 4. Backend → PingOne – FIDO2 Device Activation

PingOne’s FIDO2 **activation** endpoint expects a body like:

```json
{
  "origin": "https://app.pingone.com",
  "attestation": "{"id":"ARacmDOuRE7DJV6L7w","type":"public-key","rawId":"ARacmDOuRE7DJV6L7w=","response":{"clientDataJSON":"eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRYWxzZX0=","attestationObject":"o2NmbXRmcGFja2VkZ2F0dFFO29h8n6WKBn6tHCQ="},"clientExtensionResults":{}}"
}
```

Note:

- `attestation` is a **JSON string** containing the object you built in the frontend.
- `origin` is the web origin of the ceremony.

Backend steps:

```ts
const bodyForPingOne = {
  origin,                               // e.g., "https://your-ui.example.com"
  attestation: JSON.stringify(attestationObj),
};

await pingOneClient.post(
  `${apiPath}/environments/${envId}/users/${userId}/devices/${deviceId}`,
  bodyForPingOne,
  {
    headers: {
      // Use the media type specified in PingOne FIDO2 docs, e.g.:
      // "Content-Type": "application/vnd.pingidentity.device.webauthn+json"
      "Content-Type": "application/vnd.pingidentity.device.webauthn+json",
    },
  }
);
```

PingOne validates:

- Challenge
- Origin
- RP ID
- Attestation object

On success, PingOne marks the FIDO2 device as ACTIVE.

Backend then responds to frontend: “FIDO2 device registered successfully.”

---

## 5. UX / Flow Integration

Integrate this into your existing MFA stepper flows with minimal disruption:

**High-level steps in `FIDO2FlowV8` (or equivalent):**

1. **Configuration step (optional)**  
   - Choose device policy, nickname, etc. if your flow supports that (like other MFA device flows).

2. **Create FIDO2 device**  
   - Call PingOne to create a FIDO2 device for the user.
   - Store `deviceId` and `publicKeyCredentialCreationOptions` from the response.

3. **Run WebAuthn ceremony**  
   - Parse `publicKeyCredentialCreationOptions` string into an object.
   - Convert byte arrays (challenge, user.id, excludeCredentials[].id) to `Uint8Array`.
   - Call `navigator.credentials.create({ publicKey: opts })`.
   - Serialize `credential` to `attestationObj` (base64url fields).

4. **Activate FIDO2 device**  
   - POST from frontend to backend with `{ origin, attestation: attestationObj, deviceId, envId, userId }`.
   - Backend calls PingOne activate endpoint with:
     ```json
     {
       "origin": "<origin>",
       "attestation": "<JSON.stringify(attestationObj)>"
     }
     ```
   - On success, set device to ACTIVE and show success in UI.

**Error handling:**

- If `navigator.credentials.create` fails or user cancels → show a clear message and allow retry.
- If PingOne activation fails → show the reason and allow the user to retry WebAuthn ceremony and/or activation.

---

## 6. Constraints and Guardrails

- **Do not redesign** the whole MFA UX. Only add the minimum steps / modals to guide the user through FIDO2 registration.
- Keep **TypeScript** strict-mode happy:
  - Properly type `PublicKeyCredential`, `AuthenticatorAttestationResponse`, etc.
  - Correct types for your request/response models.
- Reuse existing logging and toast/notification patterns used by other MFA flows.
- Do not break other MFA flows (Email, SMS, TOTP, FIDO2 sign-on if present).

---

## 7. Acceptance Criteria

You are done when:

1. FIDO2 device creation from PingOne returns `publicKeyCredentialCreationOptions`, and your frontend:
   - Parses it.
   - Converts binary arrays to `Uint8Array`.
   - Successfully calls `navigator.credentials.create({ publicKey: opts })`.

2. The browser’s credential is:
   - Serialized to a JSON-safe `attestationObj` (id, type, rawId, clientDataJSON, attestationObject, clientExtensionResults) using base64url encoding for binary fields.

3. Backend activation:
   - Receives `{ origin, attestation }` from the frontend.
   - Calls PingOne device activation endpoint for the correct `deviceId`, `envId`, `userId` with:
     ```json
     {
       "origin": "<origin>",
       "attestation": "<JSON.stringify(attestationObj)>"
     }
     ```
   - Handles success/failure and returns a clear result to the UI.

4. UI:
   - Guides the user cleanly through:
     - Start FIDO2 registration
     - Browser WebAuthn dialog
     - Confirmation of success (or clear error + retry).
   - Does not disrupt other MFA flows.

Use this file (`rightFIDO2.md`) as the Cursor prompt to fully implement the FIDO2 registration flow, wired correctly between PingOne, WebAuthn, your frontend, and your backend.
