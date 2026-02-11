import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

/**
 * Login Page
 * 
 * Authentication page for user login.
 * Features email/password login with form validation.
 */
export const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const { login, state: authState } = useAuth();
	const { currentTheme } = useTheme();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		// Clear error when user starts typing
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: '' }));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.email) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid';
		}

		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) return;

		try {
			await login({
				username: formData.email,
				password: formData.password,
				rememberMe: false,
			});
			navigate('/dashboard');
		} catch (error) {
			console.error('Login failed:', error);
			setErrors({ 
				general: 'Login failed. Please check your credentials and try again.' 
			});
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center"
			style={{
				background: `linear-gradient(135deg, ${currentTheme.colors.primary} 0%, ${currentTheme.colors.secondary} 100%)`,
			}}
		>
			<div className="max-w-md w-full mx-4">
				<div 
					className="bg-white rounded-xl shadow-2xl p-8"
					style={{
						boxShadow: currentTheme.shadows.xl,
					}}
				>
					{/* Logo/Branding */}
					<div className="text-center mb-8">
						<div 
							className="inline-block p-4 rounded-full mb-4"
							style={{
								backgroundColor: `${currentTheme.colors.primary}10`,
							}}
						>
							<div 
								className="text-3xl"
								style={{
									color: currentTheme.colors.primary,
								}}
							>
								🛡️
							</div>
						</div>
						<h2 
							className="text-2xl font-bold"
							style={{
								color: currentTheme.colors.text,
							}}
						>
							Sign In
						</h2>
						<p 
							className="text-sm mt-2"
							style={{
								color: currentTheme.colors.textSecondary,
							}}
						>
							Access your PingOne Protect Portal
						</p>
					</div>

					{/* Login Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Email Field */}
						<div>
							<label 
								htmlFor="email"
								className="block text-sm font-medium mb-2"
								style={{
									color: currentTheme.colors.text,
								}}
							>
								Email Address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleChange}
								className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								style={{
									borderColor: errors.email ? currentTheme.colors.error : '#e5e7eb',
									backgroundColor: currentTheme.colors.surface,
									color: currentTheme.colors.text,
								}}
								placeholder="Enter your email"
								disabled={authState.isLoading}
							/>
							{errors.email && (
								<p 
									className="mt-1 text-sm"
									style={{
										color: currentTheme.colors.error,
									}}
								>
									{errors.email}
								</p>
							)}
						</div>

						{/* Password Field */}
						<div>
							<label 
								htmlFor="password"
								className="block text-sm font-medium mb-2"
								style={{
									color: currentTheme.colors.text,
								}}
							>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								value={formData.password}
								onChange={handleChange}
								className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								style={{
									borderColor: errors.password ? currentTheme.colors.error : '#e5e7eb',
									backgroundColor: currentTheme.colors.surface,
									color: currentTheme.colors.text,
								}}
								placeholder="Enter your password"
								disabled={authState.isLoading}
							/>
							{errors.password && (
								<p 
									className="mt-1 text-sm"
									style={{
										color: currentTheme.colors.error,
									}}
								>
									{errors.password}
								</p>
							)}
						</div>

						{/* General Error */}
						{errors.general && (
							<div 
								className="p-4 rounded-lg text-sm"
								style={{
									backgroundColor: `${currentTheme.colors.error}10`,
									borderColor: currentTheme.colors.error,
									border: '1px solid',
									color: currentTheme.colors.error,
								}}
							>
								{errors.general}
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={authState.isLoading}
							className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
							style={{
								backgroundColor: currentTheme.colors.primary,
								color: currentTheme.colors.surface,
							}}
						>
							{authState.isLoading ? (
								<div className="flex items-center justify-center space-x-2">
									<LoadingSpinner size="sm" color="white" />
									<span>Signing in...</span>
								</div>
							) : (
								'Sign In'
							)}
						</button>
					</form>

					{/* Footer Links */}
					<div className="mt-6 text-center space-y-2">
						<p 
							className="text-sm"
							style={{
								color: currentTheme.colors.textSecondary,
							}}
						>
							Don't have an account?{' '}
							<Link 
								to="/register" 
								className="font-medium hover:underline"
								style={{
									color: currentTheme.colors.primary,
								}}
							>
								Sign up
							</Link>
						</p>
						<p 
							className="text-sm"
							style={{
								color: currentTheme.colors.textSecondary,
							}}
						>
							<Link 
								to="/forgot-password" 
								className="font-medium hover:underline"
								style={{
									color: currentTheme.colors.primary,
								}}
							>
								Forgot your password?
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
