// Complete working useState function with ALL menu items from backup
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
				{
					id: 'enhanced-state-management',
					path: '/v8u/enhanced-state-management',
					label: 'Enhanced State Management (V2)',
					icon: <FiDatabase />,
					badge: (
						<MigrationBadge title="Advanced state management with undo/redo, offline capabilities, and persistence">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: 'Token Monitoring Dashboard',
					icon: <FiEye />,
					badge: (
						<MigrationBadge title="Real-time token monitoring dashboard">
							NEW
						</MigrationBadge>
					),
				},
				{
					id: 'flow-comparison-tool',
					path: '/v8u/flow-comparison',
					label: 'Flow Comparison Tool',
					icon: <FiBarChart2 />,
					badge: (
						<MigrationBadge title="Compare OAuth flows with detailed metrics and recommendations">
							NEW
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'v8-flows',
			label: 'Production (Legacy)',
			icon: <FiZap />,
			isOpen: true,
			items: [
				{
					id: 'oauth-authorization-code-v8',
					path: '/flows/oauth-authorization-code-v8',
					label: 'Authorization Code (V8)',
					icon: (
						<ColoredIcon $color="#06b6d4">
							<FiKey />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="V8: Simplified UI with educational content in modals">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'implicit-v8',
					path: '/flows/implicit-v8',
					label: 'Implicit Flow (V8)',
					icon: (
						<ColoredIcon $color="#7c3aed">
							<FiZap />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="V8: Simplified UI with educational content in modals">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'pingone-api-test',
					path: '/test/pingone-api-test',
					label: 'PingOne API Test Suite',
					icon: (
						<ColoredIcon $color="#10b981">
							<FiTool />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test PingOne OAuth 2.0 and OIDC API calls">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'all-flows-api-test',
					path: '/test/all-flows-api-test',
					label: 'All Flows API Test Suite',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiTool />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test ALL OAuth/OIDC flow types: Auth Code, Implicit, Hybrid, Device Code, Client Credentials">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'par-test',
					path: '/test/par-test',
					label: 'PAR Flow Test',
					icon: (
						<ColoredIcon $color="#ea580c">
							<FiLock />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Test RFC 9126 Pushed Authorization Request (PAR) flow">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
			],
		},
		{
			id: 'main',
			label: 'Main',
			icon: (
				<ColoredIcon $color="#6366f1">
					<FiHome />
				</ColoredIcon>
			),
			isOpen: true,
			items: [
				{
					id: 'dashboard',
					path: '/dashboard',
					label: 'Dashboard',
					icon: (
						<ColoredIcon $color="#6366f1">
							<FiHome />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Application Dashboard and Status">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'configuration',
					path: '/configuration',
					label: 'Setup & Configuration',
					icon: (
						<ColoredIcon $color="#6366f1">
							<FiSettings />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Application Configuration & Credentials">
							<FiCheckCircle />
						</MigrationBadge>
					),
				},
				{
					id: 'ping-ai-resources',
					path: '/ping-ai-resources',
					label: 'Ping AI Resources',
					icon: (
						<ColoredIcon $color="#8b5cf6">
							<FiCpu />
						</ColoredIcon>
					),
					badge: (
						<MigrationBadge title="Ping Identity AI Resources & Documentation">
							<FiCheckCircle />
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
