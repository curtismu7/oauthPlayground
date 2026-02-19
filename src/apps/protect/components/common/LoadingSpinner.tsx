import React from 'react';

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	color?: 'primary' | 'secondary' | 'white';
	className?: string;
}

/**
 * Loading Spinner Component
 *
 * A customizable loading spinner with different sizes and colors.
 * Used throughout the application for loading states.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
	size = 'md',
	color = 'primary',
	className = '',
}) => {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12',
	};

	const colorClasses = {
		primary: 'border-blue-600',
		secondary: 'border-gray-600',
		white: 'border-white',
	};

	const combinedClassName = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

	return <div className={combinedClassName} />;
};
