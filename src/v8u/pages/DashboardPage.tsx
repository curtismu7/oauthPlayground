/**
 * @file DashboardPage.tsx
 * @module v8u/pages
 * @description Dashboard page for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

type DashboardPageProps = {};

export const DashboardPage: React.FC<DashboardPageProps> = () => {
	const { currentTheme } = useTheme();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold" style={{ color: currentTheme.colors.text }}>
					User Management Dashboard
				</h1>
				<p className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
					Overview of user management system
				</p>
			</div>

			<div
				className="p-6 rounded-lg"
				style={{
					backgroundColor: currentTheme.colors.surface,
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="text-4xl mb-2">👥</div>
						<div className="text-2xl font-semibold" style={{ color: currentTheme.colors.text }}>
							Total Users
						</div>
						<div className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
							4 users
						</div>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-2">🔐</div>
						<div className="text-2xl font-semibold" style={{ color: currentTheme.colors.text }}>
							Active Users
						</div>
						<div className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
							3 users
						</div>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-2">📊</div>
						<div className="text-2xl font-semibold" style={{ color: currentTheme.colors.text }}>
							Admin Users
						</div>
						<div className="text-lg" style={{ color: currentTheme.textSecondary }}>
							1 user
						</div>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-2">📈</div>
						<div className="text-2xl font-semibold" style={{ color: currentTheme.colors.text }}>
							Reports Generated
						</div>
						<div className="text-lg" style={{ color: currentTheme.textSecondary }}>
							12 reports
						</div>
					</div>
				</div>
			</div>

			<div
				className="p-6 rounded-lg"
				style={{
					background: currentTheme.colors.surface,
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h2 className="text-xl font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
					Recent Activity
				</h2>
				<div className="space-y-3">
					<div
						className="flex items-center justify-between p-3 rounded"
						style={{ backgroundColor: currentTheme.colors.primaryLight }}
					>
						<div className="flex items-center space-x-3">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<div>
								<div className="font-medium" style={{ color: currentTheme.colors.text }}>
									New user created
								</div>
								<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
									John Doe
								</div>
							</div>
						</div>
						<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
							2 hours ago
						</div>
					</div>
					<div
						className="flex items-center justify-between p-3 rounded"
						style={{ backgroundColor: currentTheme.colors.warningLight }}
					>
						<div className="flex items-center space-x-3">
							<div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
							<div>
								<div className="font-medium" style={{ color: currentTheme.colors.text }}>
									User role updated
								</div>
								<div className="text-sm" style={{ color: currentTheme.textSecondary }}>
									Jane Smith
								</div>
							</div>
						</div>
						<div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
							5 hours ago
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
