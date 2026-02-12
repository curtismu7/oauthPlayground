import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Security Alerts Component
 *
 * Displays security alerts and notifications.
 */
export const SecurityAlerts: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div
			className="p-6 rounded-xl"
			style={{
				backgroundColor: currentTheme.colors.surface,
				boxShadow: currentTheme.shadows.lg,
			}}
		>
			<h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
				Security Alerts
			</h3>
			<div className="space-y-3">
				<div
					className="p-3 rounded-lg border"
					style={{
						backgroundColor: `${currentTheme.colors.warning}10`,
						borderColor: currentTheme.colors.warning,
					}}
				>
					<div className="flex items-start space-x-3">
						<div className="text-xl">⚠️</div>
						<div className="flex-1">
							<div className="font-medium" style={{ color: currentTheme.colors.text }}>
								Suspicious Login Attempt
							</div>
							<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
								Unusual location detected for user login
							</div>
						</div>
					</div>
				</div>
				<div
					className="p-3 rounded-lg border"
					style={{
						backgroundColor: `${currentTheme.colors.info}10`,
						borderColor: currentTheme.colors.info,
					}}
				>
					<div className="flex items-start space-x-3">
						<div className="text-xl">ℹ️</div>
						<div className="flex-1">
							<div className="font-medium" style={{ color: currentTheme.colors.text }}>
								New Device Registered
							</div>
							<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
								User added a new trusted device
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
