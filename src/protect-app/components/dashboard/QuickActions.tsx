import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Quick Actions Component
 *
 * Provides quick access to common actions.
 */
export const QuickActions: React.FC = () => {
	const { currentTheme } = useTheme();

	const actions = [
		{ label: 'New Evaluation', icon: '🔍', color: currentTheme.colors.primary },
		{ label: 'User Review', icon: '👤', color: currentTheme.colors.info },
		{ label: 'Security Scan', icon: '🛡️', color: currentTheme.colors.success },
		{ label: 'Generate Report', icon: '📊', color: currentTheme.colors.warning },
	];

	return (
		<div
			className="p-6 rounded-xl"
			style={{
				backgroundColor: currentTheme.colors.surface,
				boxShadow: currentTheme.shadows.lg,
			}}
		>
			<h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
				Quick Actions
			</h3>
			<div className="grid grid-cols-2 gap-3">
				{actions.map((action, index) => (
					<button
						key={index}
						type="button"
						className="p-4 rounded-lg border transition-colors hover:opacity-80"
						style={{
							backgroundColor: `${action.color}10`,
							borderColor: action.color,
							color: action.color,
						}}
					>
						<div className="text-2xl mb-2">{action.icon}</div>
						<div className="text-sm font-medium">{action.label}</div>
					</button>
				))}
			</div>
		</div>
	);
};
