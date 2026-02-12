import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Recent Evaluations Component
 *
 * Shows a list of recent risk evaluations.
 */
export const RecentEvaluations: React.FC = () => {
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
				Recent Evaluations
			</h3>
			<div className="space-y-3">
				<div
					className="p-3 rounded-lg border"
					style={{
						backgroundColor: `${currentTheme.colors.primary}10`,
						borderColor: currentTheme.colors.primary,
					}}
				>
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium" style={{ color: currentTheme.colors.text }}>
								Web Login
							</div>
							<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
								2 minutes ago
							</div>
						</div>
						<div className="text-lg font-bold" style={{ color: currentTheme.colors.success }}>
							25
						</div>
					</div>
				</div>
				<div
					className="p-3 rounded-lg border"
					style={{
						backgroundColor: `${currentTheme.colors.warning}10`,
						borderColor: currentTheme.colors.warning,
					}}
				>
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium" style={{ color: currentTheme.colors.text }}>
								Mobile Access
							</div>
							<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
								1 hour ago
							</div>
						</div>
						<div className="text-lg font-bold" style={{ color: currentTheme.colors.warning }}>
							45
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
