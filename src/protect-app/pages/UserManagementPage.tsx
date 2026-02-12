import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * User Management Page
 *
 * Page for managing users and their permissions.
 */
export const UserManagementPage: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
					User Management
				</h1>
				<p className="text-lg mt-1" style={{ color: currentTheme.colors.textSecondary }}>
					Manage users, roles, and permissions
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
						👥
					</div>
					<h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
						User Management Coming Soon
					</h3>
					<p style={{ color: currentTheme.colors.textSecondary }}>
						User management features will be available here.
					</p>
				</div>
			</div>
		</div>
	);
};
