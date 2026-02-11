import React, { ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface AuthLayoutProps {
	children: ReactNode;
}

/**
 * Auth Layout Component
 * 
 * Layout for authentication pages (login, register, etc.).
 * Features a centered form with beautiful background and branding.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
	const { currentTheme } = useTheme();

	return (
		<div 
			className="min-h-screen flex items-center justify-center"
			style={{
				background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)`,
			}}
		>
			{/* Background Pattern */}
			<div className="absolute inset-0 opacity-10">
				<div className="absolute inset-0" style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
				}} />
			</div>

			{/* Main Content */}
			<div className="relative z-10 w-full max-w-md mx-auto p-6">
				{/* Logo/Branding */}
				<div className="text-center mb-8">
					<div 
						className="inline-block p-4 rounded-full mb-4"
						style={{
							backgroundColor: currentTheme.colors.surface,
							boxShadow: currentTheme.shadows.lg,
						}}
					>
						<div 
							className="text-3xl font-bold"
							style={{
								color: currentTheme.colors.primary,
							}}
						>
							🛡️
						</div>
					</div>
					<h1 
						className="text-2xl font-bold mb-2"
						style={{
							color: currentTheme.colors.surface,
						}}
					>
						PingOne Protect
					</h1>
					<p 
						className="text-sm opacity-90"
						style={{
							color: currentTheme.colors.surface,
						}}
					>
						Advanced Risk Evaluation & Security Monitoring
					</p>
				</div>

				{/* Auth Form Container */}
				<div 
					className="bg-white rounded-xl shadow-2xl p-8"
					style={{
						boxShadow: currentTheme.shadows.xl,
					}}
				>
					{children}
				</div>

				{/* Footer */}
				<div className="text-center mt-8">
					<p 
						className="text-xs opacity-75"
						style={{
							color: currentTheme.colors.surface,
						}}
					>
						© 2024 PingOne. All rights reserved.
					</p>
				</div>
			</div>
		</div>
	);
};
