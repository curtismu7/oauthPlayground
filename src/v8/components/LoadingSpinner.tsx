/**
 * @file LoadingSpinner.tsx
 * @module v8/components
 * @description Loading spinner component for async operations
 * @version 9.1.0
 */

import React from 'react';

interface LoadingSpinnerProps {
	size?: 'small' | 'medium' | 'large';
	color?: string;
	text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
	size = 'medium',
	color = '#3b82f6',
	text,
}) => {
	const sizeMap = {
		small: 24,
		medium: 40,
		large: 64,
	};

	const spinnerSize = sizeMap[size];

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '16px',
			}}
		>
			<div
				style={{
					width: spinnerSize,
					height: spinnerSize,
					border: `4px solid ${color}20`,
					borderTop: `4px solid ${color}`,
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite',
				}}
			/>
			{text && (
				<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{text}</p>
			)}
			<style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	);
};
