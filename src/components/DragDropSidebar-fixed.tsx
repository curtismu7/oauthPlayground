// This is a temporary file to fix the useState function

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
