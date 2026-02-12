import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredPermission?: string;
	requiredRole?: string;
}

/**
 * Protected Route Component
 *
 * Protects routes that require authentication and/or specific permissions/roles.
 * Redirects to login page if user is not authenticated.
 * Shows access denied message if user lacks required permissions/roles.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	requiredPermission,
	requiredRole,
}) => {
	const { isAuthenticated, hasPermission, hasRole, state } = useAuth();

	// Show loading spinner while checking authentication
	if (state.isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Check for required permission
	if (requiredPermission && !hasPermission(requiredPermission)) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center p-8">
					<div className="text-6xl mb-4">🚫</div>
					<h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
					<p className="text-gray-600 mb-4">You don't have permission to access this resource.</p>
					<p className="text-sm text-gray-500">
						Required permission:{' '}
						<code className="bg-gray-200 px-2 py-1 rounded">{requiredPermission}</code>
					</p>
				</div>
			</div>
		);
	}

	// Check for required role
	if (requiredRole && !hasRole(requiredRole)) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center p-8">
					<div className="text-6xl mb-4">🚫</div>
					<h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
					<p className="text-gray-600 mb-4">
						You don't have the required role to access this resource.
					</p>
					<p className="text-sm text-gray-500">
						Required role: <code className="bg-gray-200 px-2 py-1 rounded">{requiredRole}</code>
					</p>
				</div>
			</div>
		);
	}

	// User is authenticated and has required permissions/roles
	return <>{children}</>;
};
