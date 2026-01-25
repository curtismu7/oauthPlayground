// Complete working useState function with all menu items
const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
	// Cleaned up menu structure - V8 flows at top, then V7 flows
	const defaultGroups: MenuGroup[] = [
		{
			id: 'v8-flows-new',
			label: 'Production',
			icon: <FiZap />,
			isOpen: true,
			items: [
				{
					id: 'unified-oauth-flow-v8u',
					path: '/v8u/unified',
					label: 'Unified OAuth & OIDC',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiZap />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="V8U: Single UI for all OAuth/OIDC flows with real PingOne APIs">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'spiffe-spire-flow-v8u',
					path: '/v8u/spiffe-spire',
					label: 'SPIFFE/SPIRE Mock',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiShield />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Mock flow demonstrating SPIFFE/SPIRE workload identity to PingOne token exchange">
							MOCK
						</MigrationBadge>
					),
				},
				{
					id: 'mfa-playground-v8',
					path: '/v8/mfa',
					label: 'PingOne MFA',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiSmartphone />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="V8: PingOne MFA Playground with SMS, Email, TOTP, and FIDO2">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'delete-all-devices-utility-v8',
					path: '/v8/delete-all-devices',
					label: 'Delete All Devices',
					icon: (
						<ColoredIcon $color="#ef4444">
							<FiTrash2 />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Utility to delete all MFA devices for a user with device type filtering">
							UTILITY
						</MigrationBadge>
					),
				},
				{
					id: 'postman-collection-generator',
					path: '/postman-collection-generator',
					label: 'Postman Collection Generator',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiPackage />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Generate custom Postman collections for Unified OAuth/OIDC and MFA flows">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'resources-api-v8',
					path: '/v8/resources-api',
					label: 'Resources API Tutorial',
					icon: <FiBook />,
					badge: (
						<MigrationBadge title="PingOne resources API tutorial">
							NEW
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'v7-flows',
			label: 'Development',
			icon: (
				<ColoredIcon $color="#f59e0b">
					<FiCode />
				</ColoredIcon>
			),
			isOpen: false,
			items: [
				{
					id: 'oauth-authorization-code-flow-v7',
					path: '/v7/oauth/auth-code',
					label: 'OAuth 2.0 Auth Code',
					icon: (
						<ColoredIcon $color="#3b82f6">
							<FiKey />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth 2.0 Authorization Code Flow with PKCE">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'oauth-implicit-flow-v7',
					path: '/v7/oauth/implicit',
					label: 'OAuth 2.0 Implicit',
					icon: (
						<ColoredIcon $color="#ef4444">
							<FiEye />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth 2.0 Implicit Flow (deprecated)">
							LEGACY
						</MigrationBadge>
					),
				},
				{
					id: 'oauth-client-credentials-flow-v7',
					path: '/v7/oauth/client-credentials',
					label: 'OAuth 2.0 Client Credentials',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiServer />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth 2.0 Client Credentials Flow">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'oauth-resource-owner-credentials-flow-v7',
					path: '/v7/oauth/resource-owner',
					label: 'OAuth 2.0 Resource Owner',
					icon: (
						<ColoredIcon $color="#f97316">
							<FiUser />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth 2.0 Resource Owner Password Credentials Flow">
							LEGACY
						</MigrationBadge>
					),
				},
				{
					id: 'oidc-authorization-code-flow-v7',
					path: '/v7/oidc/auth-code',
					label: 'OIDC Authorization Code',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiShield />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OpenID Connect Authorization Code Flow with ID Token">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'oidc-implicit-flow-v7',
					path: '/v7/oidc/implicit',
					label: 'OIDC Implicit',
					icon: (
						<ColoredIcon $color="#dc2626">
							<FiEye />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OpenID Connect Implicit Flow (deprecated)">
							LEGACY
						</MigrationBadge>
					),
				},
				{
					id: 'oidc-hybrid-flow-v7',
					path: '/v7/oidc/hybrid',
					label: 'OIDC Hybrid',
					icon: (
						<ColoredIcon $color="#f59e0b">
							<FiLayers />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OpenID Connect Hybrid Flow">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'device-authorization-flow-v7',
					path: '/v7/device',
					label: 'Device Authorization',
					icon: (
						<ColoredIcon $color="#6366f1">
							<FiSmartphone />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth 2.0 Device Authorization Flow for IoT/TV apps">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'jwt-introspection-v7',
					path: '/v7/jwt/introspection',
					label: 'JWT Introspection',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiSearch />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="JWT Introspection Endpoint">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'jwt-introspection-v7',
					path: '/v7/jwt/introspection',
					label: 'JWT Introspection',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiSearch />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="JWT Introspection Endpoint">
							V7
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'testing-tools',
			label: 'Testing Tools',
			icon: (
				<ColoredIcon $color="#10b981">
					<FiTestTube />
				</ColoredIcon>
			),
			isOpen: false,
			items: [
				{
					id: 'test-callback-v7',
					path: '/v7/test/callback',
					label: 'Test Callback',
					icon: (
						<ColoredIcon $color="#3b82f6">
							<FiCheckCircle />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test OAuth/OIDC callback handling">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'implicit-flow-test-v7',
					path: '/v7/test/implicit',
					label: 'Implicit Flow Test',
					icon: (
						<ColoredIcon $color="#ef4444">
							<FiAlertTriangle />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test OAuth 2.0 Implicit Flow">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'token-api-test-v7',
					path: '/v7/test/token-api',
					label: 'Token API Test',
					icon: (
						<ColoredIcon $color="#f97316">
							<FiApi />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test Token API endpoints">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'par-test-v7',
					path: '/v7/test/par',
					label: 'PAR Test',
					icon: (
						<ColoredIcon $color="#6366f1">
							<FiLink />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test Pushed Authorization Request">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'mfa-flows-api-test-v7',
					path: '/v7/test/mfa',
					label: 'MFA Flows API Test',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiShield />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test MFA Flow API endpoints">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'all-flows-api-test-v7',
					path: '/v7/test/all-flows',
					label: 'All Flows API Test',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiGitBranch />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test all flow API endpoints">
							V7
						</MigrationBadge>
					),
				},
				{
					id: 'pingone-api-test-v7',
					path: '/v7/test/pingone',
					label: 'PingOne API Test',
					icon: (
						<ColoredIcon $color="#3b82f6">
							<FiGlobe />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test PingOne API endpoints">
							V7
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'documentation',
			label: 'Documentation',
			icon: (
				<ColoredIcon $color="#3b82f6">
					<FiBook />
				</ColoredIcon>
			),
			isOpen: false,
			items: [
				{
					id: 'oidc-overview',
					path: '/documentation/oidc-overview',
					label: 'OIDC Overview',
					icon: (
						<ColoredIcon $color="#3b82f6">
							<FiBook />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OIDC Overview and Guide">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'oidc-specs',
					path: '/docs/oidc-specs',
					label: 'OIDC Specifications',
					icon: (
						<ColoredIcon $color="#3b82f6">
							<FiBookOpen />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OIDC Technical Specifications">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'oauth2-security-best-practices',
					path: '/docs/oauth2-security-best-practices',
					label: 'OAuth 2.0 Security Best Practices',
					icon: (
						<ColoredIcon $color="#dc2626">
							<FiShield />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth 2.0 Security Guidelines">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'spiffe-spire-pingone',
					path: '/docs/spiffe-spire-pingone',
					label: 'SPIFFE/SPIRE with PingOne',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiShield />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Workload Identity & SSO">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'ai-documentation',
			label: 'AI Documentation',
			icon: (
				<ColoredIcon $color="#8b5cf6">
					<FiCpu />
				</ColoredIcon>
			),
			isOpen: false,
			items: [
				{
					id: 'ai-identity-architectures',
					path: '/ai-identity-architectures',
					label: 'AI Identity Architectures',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiCpu />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="AI Identity Architectures and Patterns">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'oidc-for-ai',
					path: '/docs/oidc-for-ai',
					label: 'OIDC for AI',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiCpu />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OIDC for AI Applications">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'oauth-for-ai',
					path: '/docs/oauth-for-ai',
					label: 'OAuth for AI',
					icon: (
						<ColoredIcon $color="#f97316">
							<FiCpu />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="OAuth specifications and PingOne compatibility matrix for AI systems">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'ping-view-on-ai',
					path: '/docs/ping-view-on-ai',
					label: 'PingOne AI Perspective',
					icon: (
						<ColoredIcon $color="#16a34a">
							<FiShield />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="PingOne's View on AI Identity">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'security-management',
			label: 'Security & Management',
			icon: (
				<ColoredIcon $color="#3b82f6">
					<FiShield />
				</ColoredIcon>
			),
			isOpen: false,
			items: [
				{
					id: 'feature-flags-admin',
					path: '/admin/feature-flags',
					label: '⚙️ Feature Flags Admin',
					icon: (
						<ColoredIcon $color="#3b82f6">
							<FiSettings />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Control Phase 1-3 OIDC services rollout">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: '🔍 Token Monitoring',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiEye />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Real-time token monitoring and management">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'security-audit-log',
					path: '/admin/security-audit',
					label: '📋 Security Audit Log',
					icon: (
						<ColoredIcon $color="#f59e0b">
							<FiFileText />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Security events and audit trail">
							BETA
						</MigrationBadge>
					),
				},
			],
		},
	];
	
	const MENU_VERSION = '2.3'; // Updated to add V8 Flows group at top
	const savedVersion = localStorage.getItem('simpleDragDropSidebar.menuVersion');

	// If version changed, clear old menu layout and use new structure
	if (savedVersion !== MENU_VERSION) {
		localStorage.removeItem('simpleDragDropSidebar.menuOrder');
		localStorage.setItem('simpleDragDropSidebar.menuVersion', MENU_VERSION);
		return defaultGroups;
	}

	// Try to restore from localStorage
	const savedOrder = localStorage.getItem('simpleDragDropSidebar.menuOrder');
	if (savedOrder) {
		try {
			const serializedGroups = JSON.parse(savedOrder);
			console.log('🔄 Restoring menu layout from localStorage');
			return restoreMenuGroups(serializedGroups, defaultGroups);
		} catch (error) {
			console.warn('Failed to parse saved menu order:', error);
		}
	}

	return defaultGroups;
});
