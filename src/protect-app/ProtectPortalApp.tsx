import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import ProtectPortalConfigModal, { ProtectPortalConfiguration } from './components/ProtectPortalConfigModal';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectPortalProvider } from './contexts/ProtectPortalContext';
import { RiskProvider } from './contexts/RiskContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';

import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ReportsPage } from './pages/ReportsPage';
import { RiskEvaluationPage } from './pages/RiskEvaluationPage';
import { SecurityInsightsPage } from './pages/SecurityInsightsPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Main Protect Portal Application
 *
 * Features:
 * - Advanced risk evaluation with PingOne Protect API
 * - Real-time security monitoring and alerting
 * - Multi-brand theming and customization
 * - Responsive design with PWA support
 * - Comprehensive user authentication and session management
 * - Analytics dashboard with detailed reporting
 */
export const ProtectPortalApp: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [showConfigModal, setShowConfigModal] = useState(false);

	useEffect(() => {
		// Initialize application
		const initializeApp = async () => {
			try {
				// Check if environment configuration is available
				const hasEnvironmentConfig = !!(process.env.REACT_APP_ENVIRONMENT_ID || 
					localStorage.getItem('protect_portal_config'));
				
				// Show configuration modal if no environment config is available
				if (!hasEnvironmentConfig) {
					setShowConfigModal(true);
				}
				
				// Load application configuration
				// Initialize services
				// Check authentication status
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate initialization
				setIsLoading(false);
			} catch (error) {
				console.error('Failed to initialize Protect Portal:', error);
				setHasError(true);
				setIsLoading(false);
			}
		};

		initializeApp();
	}, []);

	const handleConfigurationSaved = (config: ProtectPortalConfiguration) => {
		console.log('Protect Portal configuration saved:', config);
		// Optionally reload the app to apply new configuration
		window.location.reload();
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
				<div className="text-center">
					<LoadingSpinner size="lg" />
					<p className="mt-4 text-lg font-medium text-gray-600">Initializing Protect Portal...</p>
				</div>
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
				<div className="text-center p-8">
					<div className="text-6xl mb-4">🚨</div>
					<h1 className="text-2xl font-bold text-red-600 mb-2">Initialization Failed</h1>
					<p className="text-gray-600 mb-4">Unable to start the Protect Portal application.</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<ErrorBoundary>
			<ThemeProvider>
				<AuthProvider>
					<RiskProvider>
						<ProtectPortalProvider>
							<Routes>
								{/* Public Routes */}
								<Route
									path="/login"
									element={
										<AuthLayout>
											<LoginPage />
										</AuthLayout>
									}
								/>

								{/* Protected Routes */}
								<Route
									path="/"
									element={
										<ProtectedRoute>
											<MainLayout />
										</ProtectedRoute>
									}
								>
									<Route index element={<Navigate to="/dashboard" replace />} />
									<Route path="dashboard" element={<DashboardPage />} />
									<Route path="risk-evaluation" element={<RiskEvaluationPage />} />
									<Route path="security-insights" element={<SecurityInsightsPage />} />
									<Route path="reports" element={<ReportsPage />} />
									<Route path="settings" element={<SettingsPage />} />
								</Route>

								{/* Fallback Route */}
								<Route path="*" element={<Navigate to="/dashboard" replace />} />
							</Routes>
							
							{/* Configuration Modal */}
							<ProtectPortalConfigModal
								isOpen={showConfigModal}
								onClose={() => setShowConfigModal(false)}
								onConfigurationSaved={handleConfigurationSaved}
							/>
						</ProtectPortalProvider>
					</RiskProvider>
				</AuthProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
};
