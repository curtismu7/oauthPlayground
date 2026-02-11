import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Reports Page
 * 
 * Page for generating and viewing security reports.
 */
export const ReportsPage: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div className="space-y-6">
			<div>
				<h1 
					className="text-3xl font-bold"
					style={{ color: currentTheme.colors.text }}
				>
					Reports
				</h1>
				<p 
					className="text-lg mt-1"
					style={{ color: currentTheme.colors.textSecondary }}
				>
					Generate and view security reports and analytics
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
						📈
					</div>
					<h3 
						className="text-xl font-semibold mb-2"
						style={{ color: currentTheme.colors.text }}
					>
						Reports Coming Soon
					</h3>
					<p 
						style={{ color: currentTheme.colors.textSecondary }}
					>
						Security reports and analytics will be available here.
					</p>
				</div>
			</div>
		</div>
	);
};
