import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Settings Page
 * 
 * Page for application settings and configuration.
 */
export const SettingsPage: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div className="space-y-6">
			<div>
				<h1 
					className="text-3xl font-bold"
					style={{ color: currentTheme.colors.text }}
				>
					Settings
				</h1>
				<p 
					className="text-lg mt-1"
					style={{ color: currentTheme.colors.textSecondary }}
				>
					Configure application settings and preferences
				</p>
			</div>

			<div 
				className="p-6 rounded-lg"
				style={{
					backgroundColor: currentTheme.colors.surface,
					boxShadow: currentTheme.shadows.md,
				}}
			>
				<div className="text-center">
					<div 
						className="text-6xl mb-4"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						⚙️
					</div>
					<h3 
						className="text-xl font-semibold mb-2"
						style={{ color: currentTheme.colors.text }}
					>
						Settings Coming Soon
					</h3>
					<p 
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Application settings and configuration options will be available here.
					</p>
				</div>
			</div>
		</div>
	);
};
