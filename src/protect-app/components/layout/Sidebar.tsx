import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Sidebar Component
 *
 * Main navigation sidebar with menu items.
 */
export const Sidebar: React.FC = () => {
	const { currentTheme } = useTheme();
	const location = useLocation();

	const menuItems = [
		{ path: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ path: '/risk-evaluation', label: 'Risk Evaluation', icon: '🔍' },
		{ path: '/security-insights', label: 'Security Insights', icon: '📈' },
		{ path: '/users', label: 'User Management', icon: '👥' },
		{ path: '/settings', label: 'Settings', icon: '⚙️' },
		{ path: '/reports', label: 'Reports', icon: '📋' },
	];

	return (
		<aside
			className="w-64 border-r"
			style={{
				backgroundColor: currentTheme.colors.surface,
				borderColor: '#e5e7eb',
			}}
		>
			<nav className="p-4 space-y-2">
				{menuItems.map((item) => (
					<Link
						key={item.path}
						to={item.path}
						className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
						style={{
							backgroundColor:
								location.pathname === item.path
									? `${currentTheme.colors.primary}20`
									: 'transparent',
							color:
								location.pathname === item.path
									? currentTheme.colors.primary
									: currentTheme.colors.text,
						}}
					>
						<span className="text-xl">{item.icon}</span>
						<span className="font-medium">{item.label}</span>
					</Link>
				))}
			</nav>
		</aside>
	);
};
