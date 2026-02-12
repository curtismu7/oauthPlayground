/**
 * @file MainLayout.tsx
 * @module v8u/layouts
 * @description Main layout for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface MainLayoutProps {
	children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	const { currentTheme } = useTheme();

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{
				backgroundColor: currentTheme.colors.background,
				color: currentTheme.colors.text,
			}}
		>
			{/* Header */}
			<header
				className="border-b"
				style={{
					backgroundColor: currentTheme.colors.surface,
					borderColor: '#e5e7eb',
				}}
			>
				<div className="px-6 py-4">
					<div className="flex items-center space-x-3">
						<div className="text-2xl" style={{ color: currentTheme.colors.primary }}>
							👥
						</div>
						<h1 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>
							User Management
						</h1>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-auto">
				<div className="p-6">{children || <Outlet />}</div>
			</main>
		</div>
	);
};
