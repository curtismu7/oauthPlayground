import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * System Health Component
 *
 * Displays system health and status information.
 */
export const SystemHealth: React.FC = () => {
	const { currentTheme } = useTheme();

	const healthMetrics = [
		{ label: 'API Status', value: 'Operational', status: 'healthy', icon: '🟢' },
		{ label: 'Database', value: 'Connected', status: 'healthy', icon: '🟢' },
		{ label: 'Risk Engine', value: 'Active', status: 'healthy', icon: '🟢' },
		{ label: 'Response Time', value: '120ms', status: 'healthy', icon: '🟢' },
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
				System Health
			</h3>
			<div className="space-y-3">
				{healthMetrics.map((metric, index) => (
					<div key={index} className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<span className="text-lg">{metric.icon}</span>
							<span style={{ color: currentTheme.colors.text }}>{metric.label}</span>
						</div>
						<span className="text-sm font-medium" style={{ color: currentTheme.colors.success }}>
							{metric.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
