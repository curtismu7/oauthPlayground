/**
 * Shared sidebar menu configuration.
 * Source of truth for menu structure; see docs/updates-to-apps/MENU_GROUPING_PROPOSAL.md.
 * Consumed by Sidebar + DragDropSidebar (or SidebarMenuPing) for a single place to add/remove/reorder items.
 */

/** When true, app uses Ping UI sidebar (SidebarMenuPing) with fixed width. */
export const USE_PING_MENU = true;

/** Default sidebar width when USE_PING_MENU is true (px). Resizable between min and max. */
export const SIDEBAR_PING_WIDTH = 260;
/** Min/max width for Ping sidebar when resizing (px). */
export const SIDEBAR_PING_MIN_WIDTH = 220;
export const SIDEBAR_PING_MAX_WIDTH = 500;

export interface SidebarMenuItem {
	id: string;
	path: string;
	label: string;
	migratedToV9?: boolean;
}

export interface SidebarMenuGroup {
	id: string;
	label: string;
	items: SidebarMenuItem[];
	subGroups?: SidebarMenuGroup[];
}

/** Stable id from path for menu items (path without leading slash, query preserved, slashes to dashes). */
export function itemIdFromPath(path: string): string {
	return (
		path
			.replace(/^\//, '')
			.replace(/\?.*$/, (q) => `-${q.replace(/[?=&]/g, '-')}`)
			.replace(/\//g, '-') || 'item'
	);
}

/** Build items with ids from path/label pairs. */
function items(
	entries: Array<[path: string, label: string, migratedToV9?: boolean]>,
	prefix = ''
): SidebarMenuItem[] {
	return entries.map(([path, label, migratedToV9]) => ({
		id: prefix ? `${prefix}-${itemIdFromPath(path)}` : itemIdFromPath(path),
		path,
		label,
		...(migratedToV9 !== undefined && { migratedToV9 }),
	}));
}

/** Default menu groups in display order (Dashboard first, then Admin, PingOne Platform, etc.). */
export const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		items: items([['/dashboard', 'Dashboard']]),
	},
	{
		id: 'admin-configuration',
		label: 'Admin & Configuration',
		items: items([
			['/api-status', 'API Status'],
			['/custom-domain-test', 'Custom Domain & API Test'],
			['/v8/mfa-feature-flags', 'MFA Feature Flags'],
			['/environments', 'Environment Management'],
			['/advanced-configuration', 'Advanced Configuration'],
			['/auto-discover', 'OIDC Discovery'],
		]),
	},
	{
		id: 'pingone-platform',
		label: 'PingOne Platform',
		items: items([
			['/pingone-user-profile', 'User Profile'],
			['/pingone-identity-metrics', 'Identity Metrics'],
			['/security/password-reset', 'Password Reset'],
			['/pingone-audit-activities', 'Audit Activities'],
			['/pingone-webhook-viewer', 'Webhook Viewer'],
			['/organization-licensing', 'Organization Licensing'],
		]),
	},
	{
		id: 'unified-production-flows',
		label: 'Unified & Production Flows',
		items: items([
			['/v8u/unified', 'Unified OAuth & OIDC'],
			['/v8/unified-mfa', 'Unified MFA'],
			['/v8/delete-all-devices', 'Delete All Devices'],
			['/v8u/flow-comparison', 'Flow Comparison Tool'],
			['/v8u/token-monitoring', 'Token Monitoring Dashboard'],
			['/v8u/enhanced-state-management', 'Enhanced State Management (V2)'],
			['/protect-portal', 'Protect Portal App'],
			['/flows/token-exchange-v9', 'Token Exchange (V9)', true],
		]),
	},
	{
		id: 'oauth-flows',
		label: 'OAuth 2.0 Flows',
		items: items([
			['/flows/oauth-authorization-code-v9', 'Authorization Code (V9)', true],
			['/flows/oauth-authorization-code-v9-condensed', 'Authorization Code Condensed (V9)', true],
			['/flows/implicit-v9', 'Implicit Flow (V9)', true],
			['/flows/device-authorization-v9', 'Device Authorization (V9)', true],
			['/flows/client-credentials-v9', 'Client Credentials (V9)', true],
			['/flows/dpop-authorization-code-v9', 'DPoP Authorization Code (V9)', true],
		]),
	},
	{
		id: 'oidc-flows',
		label: 'OpenID Connect',
		items: items([
			['/flows/implicit-v9?variant=oidc', 'Implicit Flow (V9)', true],
			['/flows/device-authorization-v9?variant=oidc', 'Device Authorization (V9 – OIDC)', true],
			['/flows/oidc-hybrid-v9', 'Hybrid Flow (V9)', true],
			['/flows/ciba-v9', 'CIBA Flow (V9)', true],
		]),
	},
	{
		id: 'pingone-flows',
		label: 'PingOne Flows',
		items: items([
			['/flows/pingone-par-v9', 'Pushed Authorization Request (V9)', true],
			['/flows/redirectless-v9-real', 'Redirectless Flow (V9)', true],
			['/flows/pingone-mfa-workflow-library-v9', 'PingOne MFA Workflow Library (V9)', true],
			['/flows/kroger-grocery-store-mfa', 'Kroger Grocery Store MFA'],
			['/pingone-authentication', 'PingOne Authentication'],
		]),
	},
	{
		id: 'tokens-session',
		label: 'Tokens & Session',
		items: items([
			['/flows/worker-token-v9', 'Worker Token (V9)', true],
			['/worker-token-tester', 'Worker Token Check'],
			['/token-management', 'Token Management'],
			['/flows/token-introspection', 'Token Introspection'],
			['/flows/token-revocation', 'Token Revocation'],
			['/flows/userinfo', 'UserInfo Flow'],
			['/flows/pingone-logout', 'PingOne Logout'],
		]),
	},
	{
		id: 'developer-tools',
		label: 'Developer & Tools',
		items: items([
			['/postman-collection-generator', 'Postman Collection Generator'],
			['/oauth-code-generator-hub', 'OAuth Code Generator Hub'],
			['/application-generator', 'Application Generator'],
			['/client-generator', 'Client Generator'],
			['/jwks-troubleshooting', 'JWKS Troubleshooting'],
			['/url-decoder', 'URL Decoder'],
			['/sdk-examples', 'SDK Examples'],
			['/ultimate-token-display-demo', 'Ultimate Token Display'],
			['/davinci-todo', 'DaVinci Todo App'],
		]),
	},
	{
		id: 'education-tutorials',
		label: 'Education & Tutorials',
		items: items([
			['/v8/resources-api', 'Resources API Tutorial'],
			['/v8u/spiffe-spire', 'SPIFFE/SPIRE Mock'],
			['/flows/advanced-oauth-params-demo', 'Advanced OAuth Parameters Demo'],
		]),
	},
	{
		id: 'mock-educational-flows',
		label: 'Mock & Educational Flows',
		items: [],
		subGroups: [
			{
				id: 'oauth-mock-flows',
				label: 'OAuth Mock Flows',
				items: items(
					[
						['/flows/jwt-bearer-token-v9', 'JWT Bearer Token (V9)', true],
						['/flows/saml-bearer-assertion-v9', 'SAML Bearer Assertion (V9)', true],
						['/flows/oauth-ropc-v9', 'Resource Owner Password (V9)', true],
						['/flows/oauth2-resource-owner-password', 'OAuth2 ROPC (Legacy)'],
						['/flows/mock-oidc-ropc', 'Mock OIDC ROPC'],
					],
					'oauth-mock'
				),
			},
			{
				id: 'advanced-mock-flows',
				label: 'Advanced Mock Flows',
				items: items(
					[
						['/flows/dpop', 'DPoP (Educational/Mock)'],
						['/flows/rar-v9', 'RAR Flow (V9)', true],
						['/flows/saml-sp-dynamic-acs-v1', 'SAML Service Provider (V1)'],
					],
					'advanced-mock'
				),
			},
		],
	},
	{
		id: 'ai-ping',
		label: 'AI - Ping',
		items: items([
			['/ping-ai-resources', 'Ping AI Resources'],
			['/ai-identity-architectures', 'AI Identity Architectures'],
			['/docs/oidc-for-ai', 'OIDC for AI'],
			['/docs/oauth-for-ai', 'OAuth for AI'],
			['/docs/ping-view-on-ai', 'PingOne AI Perspective'],
		]),
	},
	{
		id: 'ai-prompts',
		label: 'AI Prompts & Development',
		items: items([
			['/docs/prompts/prompt-all', '🚀 Complete Prompts Guide'],
			['/docs/migration/migrate-vscode', 'VSCode Migration Guide'],
		]),
	},
	{
		id: 'documentation-reference',
		label: 'Documentation & Reference',
		items: items([
			['/par-vs-rar', 'RAR vs PAR and DPoP Guide'],
			['/ciba-vs-device-authz', 'CIBA vs Device Authorization Guide'],
			['/pingone-mock-features', 'Mock & Educational Features'],
			['/pingone-scopes-reference', 'OAuth Scopes Reference'],
			['/documentation/oidc-overview', 'OIDC Overview'],
			['/docs/oidc-specs', 'OIDC Specifications'],
			['/docs/oauth2-security-best-practices', 'OAuth 2.0 Security Best Practices'],
			['/docs/spiffe-spire-pingone', 'SPIFFE/SPIRE with PingOne'],
			['/oauth-2-1', 'OAuth 2.1'],
			['/oidc-session-management', 'OIDC Session Management'],
			['/pingone-sessions-api', 'PingOne Sessions API'],
		]),
	},
];
