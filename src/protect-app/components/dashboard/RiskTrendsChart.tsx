import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Risk Trends Chart Component
 * 
 * Displays risk score trends over time.
 */
export const RiskTrendsChart: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div 
			className="p-6 rounded-xl"
			style={{
				backgroundColor: currentTheme.colors.surface,
				boxShadow: currentTheme.shadows.lg,
			}}
		>
			<h3 
				className="text-lg font-semibold mb-4"
				style={{ color: currentTheme.colors.text }}
			>
				Risk Trends
			</h3>
			<div className="h-64 flex items-center justify-center">
				<div className="text-center">
					<div 
						className="text-6xl mb-4"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						📈
					</div>
					<p 
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Risk trends chart coming soon
					</p>
				</div>
			</div>
		</div>
	);
};
