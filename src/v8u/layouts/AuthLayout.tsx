/**
 * @file AuthLayout.tsx
 * @module v8u/layouts
 * @description Authentication layout for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AuthLayoutProps {
	children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
	const { currentTheme } = useTheme();

	return (
		<div
			className="min-h-screen flex items-center justify-center"
			style={{
				background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)`,
			}}
		>
			<div className="w-full max-w-md mx-auto p-6">{children}</div>
		</div>
	);
};
