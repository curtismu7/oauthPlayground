// Working useState function
const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
    // Simple menu structure
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
                },
            ],
        },
        {
            id: 'main',
            label: 'Main',
            icon: <FiHome />,
            isOpen: true,
            items: [
                {
                    id: 'dashboard',
                    path: '/dashboard',
                    label: 'Dashboard',
                    icon: <FiHome />,
                },
            ],
        },
    ];
    
    const MENU_VERSION = '2.3';
    const savedVersion = localStorage.getItem('simpleDragDropSidebar.menuVersion');

    if (savedVersion !== MENU_VERSION) {
        localStorage.removeItem('simpleDragDropSidebar.menuOrder');
        localStorage.setItem('simpleDragDropSidebar.menuVersion', MENU_VERSION);
        return defaultGroups;
    }

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
