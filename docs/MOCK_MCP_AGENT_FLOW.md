# How To Use the Mock MCP Agent Flow

This guide explains how to use the **Mock MCP Agent Flow** page in the OAuth Playground. The page is an educational flow that simulates how an AI Agent uses an MCP (Model Context Protocol) server and Token Exchange to get tokens and call APIs—without calling any real PingOne APIs.

---

## Prerequisites

- The OAuth Playground app is running (e.g. dev server or deployed build).
- You can open the app in a supported browser (Chrome, Firefox, Safari, or Edge).

---

## Steps

### 1. Open the Mock MCP Agent Flow page

1. In the app sidebar, expand **Mock Flows** (if it is collapsed).
2. Under **MCP & Agent**, click **Mock MCP Agent Flow**.
3. The page loads with a short description banner, a **Reset flow** button, a **Secure AI Agent Authentication** section, and three steps.

**Expected result:** You see the flow title, the secure-auth guidance section, and three step blocks: **Step 1 — Get initial token**, **Step 2 — Token exchange**, and **Step 3 — List users**.

---

### 2. Run Step 1 — Get initial token

1. In **Step 1 — Get initial token**, read the short description (simulated Agent requests a worker token from the MCP server).
2. Click the **Send mock_get_token** button.
3. Scroll down to the result area that appears below the steps.

**Expected result:** A new section appears showing **✓ MCP tool: mock_get_token** with a green header. You see a **Request** (e.g. `clientId`, `clientSecret`) and a **Response** with a mock `access_token` and `expires_in`. The token is stored for the next steps.

---

### 3. Run Step 2 — Token exchange

1. Ensure Step 1 has been run (you have a token). The **Send mock_token_exchange** button is enabled when a token exists.
2. In **Step 2 — Token exchange**, click **Send mock_token_exchange**.
3. Check the result area that appears or updates.

**Expected result:** A section shows **✓ MCP tool: mock_token_exchange** with **Request** (e.g. `subject_token`, `requested_scope`) and **Response** (new `access_token`, `scope`). This simulates exchanging the first token for a new one with different scope (RFC 8693 Token Exchange).

---

### 4. Run Step 3 — List users

1. Ensure Step 2 has been run so the app has an exchanged token. The **Send mock_list_users** button is enabled when a token exists.
2. In **Step 3 — List users**, click **Send mock_list_users**.
3. Check the result area.

**Expected result:** A section shows **✓ MCP tool: mock_list_users** with **Request** (e.g. `access_token`) and **Response** with mock user data (e.g. a small list of users). No real API is called; the data is simulated.

---

### 5. Reset and run again (optional)

1. Click **Reset flow** (top right of the flow content).
2. All step state is cleared: tokens and the last result are removed.
3. You can run Step 1 → Step 2 → Step 3 again in order.

**Expected result:** The result block disappears, and the three step buttons behave as they did initially (Step 2 and 3 are disabled until you run Step 1, then Step 2).

---

## Expected Results Summary

| Step | Button | What you see after success |
|------|--------|----------------------------|
| 1 | Send mock_get_token | Request/response with mock `access_token`; Step 2 and 3 buttons become enabled when a token is present. |
| 2 | Send mock_token_exchange | Request (subject_token, requested_scope) and response (new access_token, scope). |
| 3 | Send mock_list_users | Request (access_token) and response (mock list of users). |

If a step fails (e.g. missing token), the result area shows **✗** and an error message in red.

---

## Troubleshooting

- **Step 2 or 3 button is disabled**  
  Run Step 1 first to get an initial token. After Step 2, the exchanged token is used for Step 3.

- **Error: "No subject token. Run step 1 first."**  
  Click **Send mock_get_token** in Step 1, then run Step 2 again.

- **Error: "No token. Run steps 1 and 2 first."**  
  Complete Step 1 and Step 2, then run Step 3.

- **You want to start over**  
  Click **Reset flow** and run the steps in order again.

---

## Secure AI Agent Authentication (why it matters)

The page includes a **Secure AI Agent Authentication** section (and a link to **MCP Documentation**). That content summarizes how to build real AI agents that use MCP and identity APIs safely:

- **Token storage:** Do not store tokens in plain text in code, logs, or URLs. Prefer short-lived worker tokens and secure credential storage; for user tokens, prefer session storage and clear on logout.
- **Token Exchange (RFC 8693):** Use it to exchange a subject token for a new token with different scope; do not pass raw tokens in URLs or logs.
- **MCP consent:** Hosts must get explicit user consent before invoking tools.

Reading this section and the MCP doc helps you apply the same patterns securely when building your own agent and MCP integration.

---

## Additional Information

- **MCP Documentation** (in-app): Use the **MCP Documentation →** link on the Mock MCP Agent Flow page, or open **Documentation → MCP** from the sidebar, for protocol details and Host/Client/Server roles.
- **Implementation plan:** [MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md](./MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md) describes the Token Exchange command flow and the design of this mock flow.
- **No real APIs:** This flow is for learning only. No real PingOne or other external APIs are called; all data is simulated in the browser.
