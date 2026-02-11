import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Header Component
 * 
 * Main application header with navigation and user profile.
 */
export const Header: React.FC = () => {
	const { currentTheme, toggleDarkMode, isDarkMode } = useTheme();
	const { state: authState, logout } = useAuth();

	return (
		<header 
			className="border-b"
			style={{
				backgroundColor: currentTheme.colors.surface,
				borderColor: '#e5e7eb',
			}}
		>
			<div className="px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<div className="flex items-center space-x-3">
						<div 
							className="text-2xl"
							style={{ color: currentTheme.colors.primary }}
						>
							🛡️
						</div>
						<h1 
							className="text-xl font-bold"
							style={{ color: currentTheme.colors.text }}
						>
							PingOne Protect
						</h1>
					</div>

					{/* Right side actions */}
					<div className="flex items-center space-x-4">
						{/* Theme Toggle */}
						<button
							type="button"
							onClick={toggleDarkMode}
							className="p-2 rounded-lg transition-colors"
							style={{
								backgroundColor: isDarkMode ? '#374151' : 'transparent',
								color: currentTheme.colors.text,
							}}
							title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
						>
							{isDarkMode ? '☀️' : '🌙'}
						</button>

						{/* User Profile */}
						{authState.user && (
							<div className="flex items-center space-x-3">
								<div className="text-right">
									<div 
										className="text-sm font-medium"
										style={{ color: currentTheme.colors.text }}
									>
										{authState.user.firstName} {authState.user.lastName}
									</div>
									<div 
										className="text-xs"
										style={{ color: currentTheme.colors.textSecondary }}
									>
										{authState.user.email}
									</div>
								</div>
								<div 
									className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
									style={{
										backgroundColor: currentTheme.colors.primary,
										color: currentTheme.colors.surface,
									}}
								>
									{authState.user.firstName[0]}{authState.user.lastName[0]}
								</div>
								<button
									type="button"
									onClick={logout}
									className="px-3 py-1 text-sm rounded-lg transition-colors"
									style={{
										backgroundColor: currentTheme.colors.error,
										color: currentTheme.colors.surface,
									}}
								>
									Logout
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};
