# AI Task: Add PingOne MFA Device Order Management (set-device-order) With Interactive Reordering UI

You are working in my **PingOne MFA educational app**.

Your job is to:

1. Add support for the **PingOne MFA “set device order”** endpoint:
   - `POST /mfa/v1/environments/{envId}/users/{userId}/devices/order`
   - Doc anchor: `#post-set-device-order`
2. Build a **visual UI** that lets the user change the order of MFA devices for a given user.
3. Integrate this into the existing MFA education flows **without breaking anything**.

The goal is to teach:
- How PingOne stores the **per-user MFA device order**, and
- How changing that order affects **which device is preferred / tried first** during MFA.

---

## 1. Context & Constraints

- This app already has:
  - A concept of **PingOne environment** and **user selection**.
  - Awareness of **MFA devices per user** (e.g., we can list devices and their types).
  - A general MFA educational UI with:
    - Stepper-based flows,
    - Token handling,
    - JSON request/response views,
    - Toaster or Modal components for user feedback.

- **Do NOT**:
  - Break or remove existing device registration, activation, or authentication flows.
  - Use browser-native `alert/confirm/prompt`; use the app’s Toaster/Modal.
  - Invent undocumented behavior for the `set-device-order` endpoint.

- **Do**:
  - Reuse the app’s existing HTTP client / MFA service layer.
  - Maintain the unified logging style (timestamps, module tags, non-blocking).
  - Make the UI intuitive and educational, not just a raw API toggle.

---

## 2. Endpoint: Set Device Order

Implement support for the PingOne MFA endpoint:

- **Set device order for a user**  
  `POST /mfa/v1/environments/{envId}/users/{userId}/devices/order`  
  Doc anchor: `#post-set-device-order`

Use the request/response JSON formats from the PingOne MFA docs.  
Do not guess field names; follow the documented body structure for specifying the new device order (typically an ordered list of device IDs or device references).

### Service layer

In the MFA service module, add a function like:

```ts
setUserMfaDeviceOrder(envId: string, userId: string, orderedDeviceIds: string[]): Promise<SetDeviceOrderResponse>
```

Where:

- `orderedDeviceIds` is an array representing the **desired final order** of the user’s MFA devices.
- `SetDeviceOrderResponse` is a typed interface derived from the documented response.

This function should:

- Use the existing HTTP client config (base URL, auth headers, worker token or appropriate token).
- Throw or surface helpful errors for:
  - Invalid device IDs,
  - Permission issues,
  - Any PingOne-side validation failures.

---

## 3. UI: Interactive Reordering of Devices

Create a dedicated **“Device Order”** UI for a selected user that:

1. **Lists the user’s MFA devices** in their current order.
2. Lets the user **change the order** visually.
3. Calls `setUserMfaDeviceOrder` to persist the new order in PingOne.
4. Shows JSON request/response and logs the change.

### 3.1 Where to put the UI

Integrate into the existing MFA user/device UI, for example:

- As a **new tab/section** in the user’s MFA details view (e.g., “Devices”, “Authentication”, **“Order”**).
- Or a **panel** on the user’s MFA dashboard, clearly labeled “Set device order”.

Follow existing layout and component patterns in the app.

### 3.2 Interaction patterns

Use one of these interaction patterns (or the one that best matches the current UI style):

- **Drag-and-drop list**
  - Each device is a list item (show type, nickname, last used, etc.).
  - The user can drag items to reorder.
  - A “Save order” button sends the updated list to PingOne.

- **Up/Down arrows**
  - Each device row has **Up** / **Down** controls to move it in the list.
  - A “Save order” button persists changes.

- **Position selector**
  - Each device has a position dropdown (1, 2, 3, …).
  - Changes update a local order model, then “Save order” sends the new array.

Pick whichever pattern is easiest to implement cleanly inside the existing codebase, but ensure:

- The new order is previewed **before** saving.
- The user has a clear “Save” vs “Cancel/Reset” workflow.

### 3.3 Displaying device details

Each device row should show at least:

- Device ID (or short ID),
- Device type (e.g., SMS, Email, Mobile App, FIDO2, etc.),
- Friendly name / nickname if available,
- Status (e.g., active/inactive), if the app already tracks this.

Optional but helpful:

- An icon based on device type.
- A subtle note that the **top device** is the primary/first in order (depending on PingOne behavior as documented).

---

## 4. Education & JSON Views

Because this is an educational app, we want to show **what’s actually going on**:

1. When the device list is loaded:
   - Show the underlying **GET devices** request and response (reusing existing device listing logic if present).
2. When the user changes the order and clicks **Save**:
   - Show:
     - The **`set-device-order` POST** endpoint and HTTP method.
     - The **request JSON** (body with ordered device IDs).
     - The **response JSON** from PingOne.

Include a small explanatory text block in the UI:

- Explain **what “device order” means** in PingOne MFA.
- How it can affect:
  - Default MFA device choice,
  - UX when multiple devices are available,
  - Fallback behavior (device 2, 3, etc.).

Make it clear that **the actual behavior may depend on PingOne policies and integration settings**, and that this screen is here to demonstrate how to programmatically manage the order.

---

## 5. Error Handling & Edge Cases

Handle at least these cases gracefully:

- **No devices** for the user:
  - Show a friendly message: “This user has no MFA devices to order.”
  - Disable Save button.

- **Failed set-device-order call**:
  - Show an error toast/modal:
    - High-level human-readable message.
    - Optionally expose the raw error code/message in the JSON view.
  - Do **not** lose the local order; let the user adjust and retry.

- **Device list changed on server while editing**:
  - If the server responds with a conflict-style error or unexpected data (for example, a device was removed while editing):
    - Explain that the device list changed.
    - Offer a “Reload devices” button to refresh from PingOne.

- **Permission / scope issues**:
  - If the token used doesn’t have rights to call `set-device-order`, surface this clearly in the UI and logs:
    - “Your current token is not authorized to change device order.”

---

## 6. Logging & Guardrails

- Use the app’s existing logging pattern:
  - Add a module tag like `[🔐 P1-MFA-DEVICE-ORDER]`.
  - Log:
    - User ID,
    - Device IDs and new order,
    - Success/failure of the `set-device-order` call (no secrets).
- Make sure logs are:
  - Non-blocking,
  - Fail-safe (logging must not crash the UI),
  - Visible on the UI logging page if such a page exists.

Also:

- No system modals.
- No breaking changes to existing services.
- If you introduce any new shared components (e.g., a reusable `ReorderList` component), keep them generic and well-typed so other flows can reuse them later.

---

## 7. Output Expectations (What to Show Me)

When you finish the implementation, summarize:

1. **New service functions**
   - Names, file locations, and mapped endpoints (e.g., `setUserMfaDeviceOrder` → `POST /mfa/v1/environments/{envId}/users/{userId}/devices/order`).

2. **New or updated UI components**
   - Which screen(s) now include the device-order section.
   - Which interaction pattern you used (drag-and-drop, up/down arrows, etc.).

3. **Example flow**
   - Briefly describe the full UX path:
     - Select user,
     - Load devices,
     - Reorder devices,
     - Save new order,
     - Observe JSON request/response.

4. **Limitations / notes**
   - Any assumptions you made from the PingOne docs.
   - Any known edge cases that still need follow-up.

Keep the implementation TypeScript-safe, aligned with existing patterns, and clearly educational about how PingOne MFA device order works.
