# Safe-to-Apply Prompts

### A) Safe to Apply Without Full Context
1. **Global Spec/Info Card Styling** (Section 23) – `.spec-card`, white background, black text, code block variables.
2. **OAuth 2.1 Panel Cleanup** (Sections 21/23) – PKCE required, exact redirect match; replace dark panels with `.spec-card`.
3. **Token Management Boxes Normalization** (Sections 17/23) – Header, Payload, Raw Token all using `.spec-card` and theme tokens.
4. **Security Warning Readability** (Section 20) – Keep brand color banners; body content in `.spec-card` for legibility.
5. **Left Menu Wiring & Persistence** (Sections 18/23) – Add **OIDC for AI**, keep sections expanded on selection, hide duplicate Device Code.
6. **Docs Integration Navigation** (Sections 16/22) – Docs → OIDC Specs (openid.net), Docs → OIDC for AI (Ping + OpenID + industry + research). *Links only; no dynamic fetching.*
7. **UI Fixes** – Eye icon for mask/unmask secrets; copy icon cleanup; menu default expansion (OpenID Connect, Resources).

**Acceptance for A**
- No TypeScript type changes beyond new components/props.
- No new backend calls or config services.
- All styles scoped via CSS variables and reusable class/component.