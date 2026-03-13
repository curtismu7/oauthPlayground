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
	/** When true, badge renders as MOCK instead of version badge. */
	mock?: boolean;
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
	entries: Array<[path: string, label: string, migratedToV9?: boolean, mock?: boolean]>,
	prefix = ''
): SidebarMenuItem[] {
	return entries.map(([path, label, migratedToV9, mock]) => ({
		id: prefix ? `${prefix}-${itemIdFromPath(path)}` : itemIdFromPath(path),
		path,
		label,
		...(migratedToV9 !== undefined && { migratedToV9 }),
		...(mock !== undefined && { mock }),
	}));
}

/** Apply version badges to menu items based on migration status */
function applyVersionBadges(items: SidebarMenuItem[]): SidebarMenuItem[] {
	return items.map((item) => {
		// Mock badge takes priority
		if (item.mock) {
			return {
				...item,
				versionBadge: { type: 'mock', showVersion: false, showBadge: true },
			};
		}
		// Apply 'updated' badge to specific recently standardized apps
		const recentlyUpdatedApps = [
			'/flows/kroger-grocery-store-mfa',
			'/jwks-troubleshooting',
			'/flows/userinfo',
			'/configuration',
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

/** Default menu groups in display order. Educational flow: Setup → Mock → Unified → Docs → AI, then Tools & Admin. */
export const SIDEBAR_MENU_GROUPS: SidebarMenuGroup[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		items: items([
			['/dashboard', 'Dashboard', true],
			['/pingone-dashboard', 'Platform Dashboard', true],
			['/cleanliness-dashboard', 'Component Cleanliness Dashboard', true],
			['/api-status', 'API Status', true],
			['/cleanup-history', 'App update History', true],
		]),
	},
	{
		id: 'setup-configuration',
		label: 'Setup & Configuration',
		items: items([
			['/configuration', 'Configuration Management', true],
			['/auto-discover', 'OIDC Discovery', true],
			['/environments', 'Environment Management', true],
		]),
	},
	{
		id: 'mock-flows',
		label: 'Mock Flows',
		items: [],
		subGroups: [
			{
				id: 'oidc-mock',
				label: 'OIDC',
				items: items(
					[
						['/flows/oidc-authorization-code-v9', 'Authorization Code', true, true],
						['/flows/oidc-hybrid-v9', 'Hybrid Flow', true, true],
						['/flows/ciba-v9', 'CIBA (Backchannel)', true, true],
					],
					'oidc-mock'
				),
			},
			{
				id: 'oauth-2-mock',
				label: 'OAuth 2.0',
				items: items(
					[
						['/flows/device-authorization-v9', 'Device Authorization', true, true],
						['/flows/client-credentials-v9', 'Client Credentials', true, true],
						['/flows/implicit-v9', 'Implicit Flow', true, true],
						['/flows/jwt-bearer-token-v9', 'JWT Bearer Token', true, true],
						['/flows/saml-bearer-assertion-v9', 'SAML Bearer Assertion', true, true],
					],
					'oauth-2-mock'
				),
			},
			{
				id: 'unsupported-flows',
				label: 'Unsupported OAuth Flows',
				items: items(
					[
						['/flows/oauth-ropc-v9', 'Resource Owner Password (ROPC)', true, true],
						['/flows/dpop', 'DPoP (Proof of Possession)', true, true],
						['/flows/rar-v9', 'Rich Authorization Requests (RAR)', true, true],
						['/flows/par-v9', 'Pushed Authorization Requests (PAR)', true, true],
						['/flows/saml-sp-dynamic-acs-v1', 'SAML SP Dynamic ACS', true, true],
						['/flows/spiffe-spire-v9', 'SPIFFE/SPIRE', true, true],
					],
					'unsupported'
				),
			},
		],
	},
	{
		id: 'unified-production-flows',
		label: "Real PingOne API's & support apps",
		items: items([
			['/v8u/unified', 'Unified OAuth & OIDC', true],
			['/v8/unified-mfa', 'Unified MFA', true],
			['/v8u/enhanced-state-management', 'Enhanced State Management (V2)', true],
			['/protect-portal', 'Protect Portal App', true],
		]),
		subGroups: [
			{
				id: 'flow-tools',
				label: 'Flow Tools',
				items: items(
					[
						['/v8/delete-all-devices', 'Delete All Devices', true],
						['/v8u/flow-comparison', 'Flow Comparison Tool', true],
						['/v8u/token-monitoring', 'Token Monitoring Dashboard', true],
					],
					'flow-tools'
				),
			},
		],
	},
	{
		id: 'tokens-session',
		label: 'Tokens & Session',
		items: items([
			['/flows/worker-token-v9', 'Worker Token (V9)', true],
			['/token/operations', 'Token Operations', true],
			['/flows/userinfo', 'UserInfo Flow', true],
			['/flows/pingone-logout', 'PingOne Logout', true],
			['/flows/redirectless-v9-real', 'Redirectless Login Modal (V9)', true],
		]),
	},
	{
		id: 'documentation-reference',
		label: 'Documentation & Reference',
		items: items([
			['/documentation', 'Documentation Hub', true],
			['/documentation/oidc-overview', 'OIDC Overview', true],
			['/oauth-2-1', 'OAuth 2.1 Specification', true],
			['/docs/oauth2-security-best-practices', 'OAuth 2.0 Security Best Practices', true],
			['/comprehensive-oauth-education', 'OAuth Education', true],
			['/v9/resources-api', 'Resources API Tutorial', true],
			['/flows/advanced-oauth-params-demo', 'Advanced OAuth Parameters Demo', true],
			['/par-vs-rar', 'RAR vs PAR and DPoP Guide', true],
			['/ciba-vs-device-authz', 'CIBA vs Device Authorization Guide', true],
			['/pingone-scopes-reference', 'OAuth Scopes Reference', true],
			['/docs/oidc-specs', 'OIDC Specifications', true],
			['/docs/spiffe-spire-pingone', 'SPIFFE/SPIRE with PingOne', true],
			['/pingone-mock-features', 'Mock & Educational Features', true],
			['/pingone-sessions-api', 'PingOne Sessions API', true],
			['/oidc', 'OIDC Information', true],
			['/oidc-session-management', 'OIDC Session Management', true],
			['/about', 'About Page', true],
		]),
	},
	{
		id: 'artificial-intelligence',
		label: 'AI & Identity',
		items: items([
			['/ai-assistant', 'OAuth Assistant', true],
			['/mcp-server', 'MCP Server Config', true],
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
		id: 'developer-tools',
		label: 'Developer & Tools',
		items: items([
			['/postman-collection-generator', 'Postman Collection Generator', true],
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
			['/v9/debug-logs-popout', 'Debug Log Viewer (V9)', true],
			['/v7/settings', 'V7 Mock Server Settings', true],
		]),
	},
	{
		id: 'admin-platform',
		label: 'Admin & Platform',
		items: items([
			['/custom-domain-test', 'Custom Domain & API Test', true],
			['/pingone-webhook-viewer', 'Webhook Viewer', true],
			['/organization-licensing', 'Organization Licensing', true],
			['/pingone-user-profile', 'User Profile', true],
			['/security/password-reset', 'Password Reset', true],
			['/v8/mfa-feature-flags', 'MFA Feature Flags', true],
			['/advanced-security-settings', 'Advanced Security Settings', true],
		]),
	},
];
