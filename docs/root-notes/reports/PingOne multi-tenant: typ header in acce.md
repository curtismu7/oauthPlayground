PingOne multi-tenant: typ header in access tokens :rolled_up_newspaper:

:new_feature_shape2x: PingOne now supports the inclusion of the typ header with a value of at+jwt in our access tokens.

Optionally include when minting access tokens for custom resources, depending on the new per-application advanced setting
Always include when minting access tokens for PingOne APIs

:rocket: Value

Deliver an increased security posture because the typ header provides clarity of the intent of the token and helps preventing misuse of it.

:page_facing_up: Documentation

PingOne release notes
Support for the typ header parameter in access tokens > Include the typ parameter in the header of access tokens

PingOne documentation
Editing an application - OIDC

PingOne developer documentation (coming soon)
https://developer.pingidentity.com/pingone-api/platform/changelog.html#2026
https://developer.pingidentity.com/pingone-api/platform/applications/applications-1.html#applications-oidc-settings-data-model > includeTyp
https://developer.pingidentity.com/pingone-api/foundations/authentication-concepts/access-tokens-and-id-tokens/token-claims.html#access-token-claims

:clap::skin-tone-3: Special thanks to @marco, @Lucas Gauk, @brogankoh @Mahmud Mamat, @Kelcie Sharp, @avanderest, @Cheryl Yao and the support from multiple service teams.

:morning_read: Additional information

From now until March 1st, 2027, it's up to PingOne administrators to decide whether or when they want PingOne to include the typ header in custom resource access tokens.

---

IMPORTANT

---

Beginning March 2, 2027: PingOne will always include the typ header with a value of at+jwt when minting access tokens for PingOne APIs and custom resources. To avoid service disruptions, customers must validate and update their applications and custom resources (as needed) before this date to handle this header always being included in access tokens.

This message is part of our release notes, at the top of the page

This has been reverted in Pingone, but we should add it now.
