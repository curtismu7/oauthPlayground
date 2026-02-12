/**
 * @file LoadingSpinner.tsx
 * @module v8u/components/common
 * @description Loading spinner component for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React from 'react';

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
	const sizeClasses = {
		sm: 'w-6 h-6',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
	};

	return (
		<div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
	);
};
