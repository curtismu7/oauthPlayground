/**
 * Shared sidebar menu configuration.
 * Source of truth for menu structure; see docs/updates-to-apps/MENU_GROUPING_PROPOSAL.md.
 * Consumed by Sidebar + DragDropSidebar (or SidebarMenuPing) for a single place to add/remove/reorder items.
 */

import { autoApplyVersionBadge } from '../components/VersionBadgeService';

/** When true, app uses Ping UI sidebar (SidebarMenuPing) with fixed width. */
export const USE_PING_MENU = true;

/** Default sidebar width when USE_PING_MENU is true (px). Resizable between min and max. */
export const SIDEBAR_PING_WIDTH = 520;
/** Min/max width for Ping sidebar when resizing (px). */
export const SIDEBAR_PING_MIN_WIDTH = 220;
export const SIDEBAR_PING_MAX_WIDTH = 700;

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

/** Apply version badges to menu items based on migration status */
function applyVersionBadges(items: SidebarMenuItem[]): SidebarMenuItem[] {
	return items.map((item) => {
		// Apply 'updated' badge to specific recently standardized apps
		const recentlyUpdatedApps = [
			'/flows/kroger-grocery-store-mfa',
			'/jwks-troubleshooting',
			'/flows/userinfo',
			'/configuration',
			'/credential-management',
			'/postman-collection-generator-v9',
			'/flows/mock-oidc-ropc',
		];

		if (recentlyUpdatedApps.includes(item.path)) {
			// Use applyUpdatedBadge for recently updated apps
			return {
				...item,
				versionBadge: {
					type: 'updated',
					showVersion: true,
					showBadge: true,
				},
			};
		}

		return autoApplyVersionBadge(item);
	});
}

/** Apply version badges to menu groups recursively */
function applyVersionBadgesToGroups(groups: SidebarMenuGroup[]): SidebarMenuGroup[] {
	return groups.map((group) => {
		const updatedGroup: SidebarMenuGroup = {
			...group,
			items: applyVersionBadges(group.items),
		};

		if (group.subGroups) {
			updatedGroup.subGroups = applyVersionBadgesToGroups(group.subGroups);
		}

		return updatedGroup;
	});
}

/** Get sidebar menu groups with version badges applied */
export function getSidebarMenuGroupsWithVersionBadges(): SidebarMenuGroup[] {
	return applyVersionBadgesToGroups(SIDEBAR_MENU_GROUPS);
}

/** Default menu groups in display order (Dashboard first, then Admin, PingOne Platform, etc.). */
export const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		items: items([['/dashboard', 'Dashboard', true]]),
	},
	{
		id: 'admin-configuration',
		label: 'Admin & Configuration',
		items: items([
			['/api-status', 'API Status', true],
			['/custom-domain-test', 'Custom Domain & API Test', true],
			['/v8/mfa-feature-flags', 'MFA Feature Flags', true],
			['/environments', 'Environment Management', true],
			['/configuration', 'Configuration Management', true],
			['/credential-management', 'Credential Management', true],
			['/advanced-configuration', 'Advanced Configuration', true],
			['/advanced-security-settings', 'Advanced Security Settings', true],
			['/advanced-security-settings-comparison', 'Security Settings Comparison', true],
			['/auto-discover', 'OIDC Discovery', true],
		]),
	},
	{
		id: 'pingone-platform',
		label: 'PingOne Platform',
		items: items([
			['/pingone-user-profile', 'User Profile', true],
			['/pingone-identity-metrics', 'Identity Metrics', true],
			['/security/password-reset', 'Password Reset', true],
			['/pingone-audit-activities', 'Audit Activities', true],
			['/pingone-webhook-viewer', 'Webhook Viewer', true],
			['/organization-licensing', 'Organization Licensing', true],
		]),
	},
	{
		id: 'unified-production-flows',
		label: 'Unified & Production Flows',
		items: items([
			['/v8u/unified', 'Unified OAuth & OIDC', true],
			['/v8/unified-mfa', 'Unified MFA', true],
			['/v8/delete-all-devices', 'Delete All Devices', true],
			['/v8u/flow-comparison', 'Flow Comparison Tool', true],
			['/v8u/token-monitoring', 'Token Monitoring Dashboard', true],
			['/v8u/enhanced-state-management', 'Enhanced State Management (V2)', true],
			['/protect-portal', 'Protect Portal App', true],
			['/flows/token-exchange-v9', 'Token Exchange (V9)', true],
		]),
	},
	{
		id: 'oauth-flows',
		label: 'OAuth 2.0 Flows',
		items: items([
			['/flows/oauth-authorization-code-v9', 'Authorization Code (V9)', true],
			['/flows/oauth-authorization-code-v9-condensed', 'Authorization Code Condensed (V9)', true],
			['/flows/oauth2-compliant-authorization-code', 'Authorization Code (RFC 6749)', true],
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
			['/flows/oidc-compliant-authorization-code', 'Authorization Code (OIDC Core 1.0)', true],
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
			['/flows/kroger-grocery-store-mfa', 'Kroger Grocery Store MFA', true],
			['/pingone-authentication', 'PingOne Authentication', true],
			['/pingone-authentication/result', 'Auth Results', true],
		]),
	},
	{
		id: 'tokens-session',
		label: 'Tokens & Session',
		items: items([
			['/flows/worker-token-v9', 'Worker Token (V9)', true],
			['/worker-token-tester', 'Worker Token Check', true],
			['/token-management', 'Token Management', true],
			['/flows/token-introspection', 'Token Introspection', true],
			['/flows/token-revocation', 'Token Revocation', true],
			['/flows/userinfo', 'UserInfo Flow', true],
			['/flows/pingone-logout', 'PingOne Logout', true],
		]),
	},
	{
		id: 'developer-tools',
		label: 'Developer & Tools',
		items: items([
			['/postman-collection-generator', 'Postman Collection Generator', true],
			['/postman-collection-generator-v9', 'Postman Generator V9', true],
			['/oauth-code-generator-hub', 'OAuth Code Generator Hub', true],
			['/application-generator', 'Application Generator', true],
			['/client-generator', 'Client Generator', true],
			['/service-test-runner', 'Service Test Runner', true],
			['/sdk-sample-app', 'SDK Sample App', true],
			['/sdk-examples', 'SDK Examples', true],
			['/code-examples', 'Code Examples', true],
			['/jwks-troubleshooting', 'JWKS Troubleshooting', true],
			['/url-decoder', 'URL Decoder', true],
			['/ultimate-token-display-demo', 'Ultimate Token Display', true],
			['/davinci-todo', 'DaVinci Todo App', true],
		]),
	},
	{
		id: 'education-tutorials',
		label: 'Education & Tutorials',
		items: items([
			['/v9/resources-api', 'Resources API Tutorial', true],
			['/v8u/spiffe-spire', 'SPIFFE/SPIRE Mock', true],
			['/flows/advanced-oauth-params-demo', 'Advanced OAuth Parameters Demo', true],
			['/comprehensive-oauth-education', 'OAuth Education', true],
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
						['/flows/oauth2-resource-owner-password', 'OAuth2 ROPC (Legacy)', true],
						['/flows/mock-oidc-ropc', 'Mock OIDC ROPC', true],
					],
					'oauth-mock'
				),
			},
			{
				id: 'advanced-mock-flows',
				label: 'Advanced Mock Flows',
				items: items(
					[
						['/flows/dpop', 'DPoP (Educational/Mock)', true],
						['/flows/rar-v9', 'RAR Flow (V9)', true],
						['/flows/saml-sp-dynamic-acs-v1', 'SAML Service Provider (V1)', true],
					],
					'advanced-mock'
				),
			},
			{
				id: 'v7m-mock-server-flows',
				label: 'V7 Mock Server Flows',
				items: items(
					[
						['/v7/oidc/authorization-code', 'Auth Code (V7 Mock)', true],
						['/v7/oauth/device-authorization', 'Device Authorization (V7 Mock)', true],
						['/v7/oauth/client-credentials', 'Client Credentials (V7 Mock)', true],
						['/v7/oauth/implicit', 'Implicit Flow (V7 Mock)', true],
						['/v7/oauth/ropc', 'ROPC (V7 Mock)', true],
						['/v7/settings', 'V7 Mock Settings', true],
					],
					'v7m-mock'
				),
			},
		],
	},
	{
		id: 'artificial-intelligence',
		label: 'Artificial Intelligence',
		items: items([
			['/ai-agent-overview', 'AI Agent Overview', true],
			['/ai-glossary', 'AI Glossary', true],
			['/docs/prompts/prompt-all', '🚀 Complete Prompts Guide', true],
			['/docs/migration/migrate-vscode', 'VSCode Migration Guide', true],
		]),
		subGroups: [
			{
				id: 'ai-ping',
				label: 'AI - Ping',
				items: items(
					[
						['/ping-ai-resources', 'Ping AI Resources', true],
						['/ai-identity-architectures', 'AI Identity Architectures', true],
						['/docs/oidc-for-ai', 'OIDC for AI', true],
						['/docs/oauth-for-ai', 'OAuth for AI', true],
						['/docs/ping-view-on-ai', 'PingOne AI Perspective', true],
						['/docs/ai-agent-auth-draft', 'AI Agent Auth (IETF Draft)', true],
					],
					'ai-ping'
				),
			},
		],
	},
	{
		id: 'documentation-reference',
		label: 'Documentation & Reference',
		items: items([
			['/documentation', 'Documentation Hub', true],
			['/documentation/oidc-overview', 'OIDC Overview', true],
			['/about', 'About Page', true],
			['/oauth-2-1', 'OAuth 2.1 Specification', true],
			['/oidc', 'OIDC Information', true],
			['/oidc-session-management', 'OIDC Session Management', true],
			['/par-vs-rar', 'RAR vs PAR and DPoP Guide', true],
			['/ciba-vs-device-authz', 'CIBA vs Device Authorization Guide', true],
			['/pingone-mock-features', 'Mock & Educational Features', true],
			['/pingone-scopes-reference', 'OAuth Scopes Reference', true],
			['/docs/oidc-specs', 'OIDC Specifications', true],
			['/docs/oauth2-security-best-practices', 'OAuth 2.0 Security Best Practices', true],
			['/docs/spiffe-spire-pingone', 'SPIFFE/SPIRE with PingOne', true],
			['/pingone-sessions-api', 'PingOne Sessions API', true],
		]),
	},
];
