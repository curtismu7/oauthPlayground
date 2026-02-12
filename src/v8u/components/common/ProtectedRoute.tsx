/**
 * @file ProtectedRoute.tsx
 * @module v8u/components/common
 * @description Protected route component for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	// For now, we'll just render the children
	// In a real app, you'd check authentication status here
	return <>{children}</>;
};
