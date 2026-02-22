/**
 * @file LoginPage.tsx
 * @module v8u/pages
 * @description Login page for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type LoginPageProps = Record<string, never>;

export const LoginPage: React.FC<LoginPageProps> = () => {
	const { currentTheme } = useTheme();
	const navigate = useNavigate();
	const { login } = useAuth();
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			await login(formData.username, formData.password);
			navigate('/dashboard');
		} catch (_error) {
			setError('Invalid credentials');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="w-full max-w-md p-6">
				<div className="text-center mb-8">
					<div className="text-6xl mb-4">👥</div>
					<h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>
						User Management Login
					</h1>
					<p className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
						Sign in to manage users and permissions
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">{error}</div>}

					<div>
						<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
							Username
						</label>
						<input
							id="username"
							type="text"
							value={formData.username}
							onChange={(e) => setFormData({ ...formData, username: e.target.value })}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							placeholder="Enter your username"
							style={{
								backgroundColor: currentTheme.colors.background,
								borderColor: currentTheme.colors.border,
								color: currentTheme.colors.text,
							}}
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={formData.password}
							onChange={(e) => setFormData({ ...formData, password: e.target.value })}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							placeholder="Enter your password"
							style={{
								backgroundColor: currentTheme.colors.background,
								borderColor: currentTheme.colors.border,
								color: currentTheme.colors.text,
							}}
						/>
					</div>

					<button
						type="submit"
						className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
					>
						Sign In
					</button>
				</form>
			</div>
		</div>
	);
};
