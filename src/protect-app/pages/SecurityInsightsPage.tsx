import React from 'react';
import { PageApiInfo } from '../components/common/PageApiInfo';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Security Insights Page
 *
 * Page displaying security analytics and insights.
 */
export const SecurityInsightsPage: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
					Security Insights
				</h1>
				<p className="text-lg mt-1" style={{ color: currentTheme.colors.textSecondary }}>
					Advanced security analytics and threat intelligence
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
					<div className="text-6xl mb-4" style={{ color: currentTheme.colors.textSecondary }}>
						📊
					</div>
					<h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
						Security Analytics Coming Soon
					</h3>
					<p style={{ color: currentTheme.colors.textSecondary }}>
						Advanced security insights and analytics will be available here.
					</p>
				</div>
			</div>

			{/* Page API Info */}
			<PageApiInfo pageName="Security Insights" />
		</div>
	);
};
