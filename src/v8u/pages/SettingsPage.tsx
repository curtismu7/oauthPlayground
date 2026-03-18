/**
 * @file SettingsPage.tsx
 * @module v8u/pages
 * @description Settings page for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import { useTheme } from '../contexts/ThemeContext';

export const SettingsPage: React.FC = () => {
	const { currentTheme, setTheme } = useTheme();
	const [settings, setSettings] = useState({
		notifications: true,
		autoRefresh: false,
		theme: currentTheme.name,
		language: 'en',
	});

	const handleSettingChange = (key: string, value: any) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
		logger.info('SettingsPage', `Setting changed: ${key} = ${value}`);
	};

	const handleThemeChange = (themeName: string) => {
		// This would update the theme context
		logger.info('SettingsPage', `Theme changed to: ${themeName}`);
	};

	const handleSaveSettings = () => {
		localStorage.setItem('appSettings', JSON.stringify(settings));
		logger.success('SettingsPage', 'Settings saved successfully');
	};

	const handleResetSettings = () => {
		const defaultSettings = {
			notifications: true,
			autoRefresh: false,
			theme: 'default',
			language: 'en',
		};
		setSettings(defaultSettings);
		localStorage.removeItem('appSettings');
		logger.info('SettingsPage', 'Settings reset to defaults');
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
					Settings
				</h1>
				<p className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
					Manage application settings and preferences
				</p>
			</div>

			<div
				className="p-6 rounded-lg space-y-6"
				style={{
					backgroundColor: currentTheme.colors.surface,
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				{/* Notifications Section */}
				<div>
					<h3 className="text-xl font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
						Notifications
					</h3>
					<div className="space-y-3">
						<label className="flex items-center space-x-3">
							<input
								type="checkbox"
								checked={settings.notifications}
								onChange={(e) => handleSettingChange('notifications', e.target.checked)}
								className="w-4 h-4 rounded"
								style={{ accentColor: currentTheme.colors.primary }}
							/>
							<span style={{ color: currentTheme.colors.text }}>Enable push notifications</span>
						</label>
						<label className="flex items-center space-x-3">
							<input
								type="checkbox"
								checked={settings.autoRefresh}
								onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
								className="w-4 h-4 rounded"
								style={{ accentColor: currentTheme.colors.primary }}
							/>
							<span style={{ color: currentTheme.colors.text }}>Auto-refresh data</span>
						</label>
					</div>
				</div>

				{/* Appearance Section */}
				<div>
					<h3 className="text-xl font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
						Appearance
					</h3>
					<div className="space-y-3">
						<div>
							<label className="block mb-2" style={{ color: currentTheme.colors.text }}>
								Theme
							</label>
							<select
								value={settings.theme}
								onChange={(e) => {
									handleSettingChange('theme', e.target.value);
									handleThemeChange(e.target.value);
								}}
								className="w-full p-2 rounded border"
								style={{
									backgroundColor: currentTheme.colors.background,
									borderColor: currentTheme.colors.border,
									color: currentTheme.colors.text,
								}}
							>
								<option value="light">Light</option>
								<option value="dark">Dark</option>
								<option value="auto">Auto (System)</option>
							</select>
						</div>
					</div>
				</div>

				{/* Language Section */}
				<div>
					<h3 className="text-xl font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
						Language & Region
					</h3>
					<div className="space-y-3">
						<div>
							<label className="block mb-2" style={{ color: currentTheme.colors.text }}>
								Language
							</label>
							<select
								value={settings.language}
								onChange={(e) => handleSettingChange('language', e.target.value)}
								className="w-full p-2 rounded border"
								style={{
									backgroundColor: currentTheme.colors.background,
									borderColor: currentTheme.colors.border,
									color: currentTheme.colors.text,
								}}
							>
								<option value="en">English</option>
								<option value="es">Español</option>
								<option value="fr">Français</option>
								<option value="de">Deutsch</option>
								<option value="ja">日本語</option>
							</select>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div
					className="flex space-x-4 pt-6 border-t"
					style={{ borderColor: currentTheme.colors.border }}
				>
					<button
						type="button"
						onClick={handleSaveSettings}
						className="px-6 py-2 rounded font-medium"
						style={{
							backgroundColor: currentTheme.colors.primary,
							color: 'white',
						}}
					>
						Save Settings
					</button>
					<button
						type="button"
						onClick={handleResetSettings}
						className="px-6 py-2 rounded font-medium"
						style={{
							backgroundColor: 'transparent',
							color: currentTheme.colors.text,
							border: `1px solid ${currentTheme.colors.border}`,
						}}
					>
						Reset to Defaults
					</button>
				</div>
			</div>
		</div>
	);
};
