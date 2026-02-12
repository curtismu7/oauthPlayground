/**
 * @file UserManagementApp.tsx
 * @module v8u/apps
 * @description User Management Application - Separate app for user management operations
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Follows SWE-15 principles:
 * - Single Responsibility: Only handles user management operations
 * - Interface Segregation: Focused components for user operations
 * - Dependency Inversion: Depends on UserService abstraction
 * - Open/Closed: Extensible for new user management features
 */

import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';
import { UserManagementProvider } from '../contexts/UserManagementContext';
import { ThemeProvider } from '../contexts/ThemeContext';

import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';

import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ReportsPage } from '../pages/ReportsPage';

/**
 * User Management Application
 *
 * Standalone application for managing users, roles, and permissions.
 * Separate from Protect Portal to maintain clear separation of concerns.
 *
 * Features:
 * - Complete user CRUD operations
 * - Role and permission management
 * - User search and filtering
 * - Department-based organization
 * - Real-time updates and notifications
 * - Comprehensive reporting and analytics
 * - Theme customization
 * - Multi-tenant support
 */
export const UserManagementApp: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		// Initialize User Management application
		const initializeApp = async () => {
			try {
				// Load user management configuration
				// Initialize user management services
				// Check authentication status
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate initialization
				setIsLoading(false);
			} catch (error) {
				console.error('Failed to initialize User Management:', error);
				setHasError(true);
				setIsLoading(false);
			}
		};

		initializeApp();
	}, []);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
				<div className="text-center">
					<LoadingSpinner size="lg" />
					<p className="mt-4 text-lg font-medium text-gray-600">Initializing User Management...</p>
				</div>
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
				<div className="text-center p-8">
					<div className="text-6xl mb-4">👥</div>
					<h1 className="text-2xl font-bold text-red-600 mb-2">Initialization Failed</h1>
					<p className="text-gray-600 mb-4">Unable to start the User Management application.</p>
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
					<UserManagementProvider>
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
								<Route path="users" element={<UserManagementPage />} />
								<Route path="reports" element={<ReportsPage />} />
								<Route path="settings" element={<SettingsPage />} />
							</Route>

							{/* Fallback Route */}
							<Route path="*" element={<Navigate to="/dashboard" replace />} />
						</Routes>
					</UserManagementProvider>
				</AuthProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
};
