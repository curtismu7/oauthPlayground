/**
 * @file MFAWaitScreenV8.tsx
 * @module v8/components
 * @description Wait screen component for MFA flow transitions
 * @version 8.0.0
 * @since 2026-02-12
 *
 * Provides a centered loading spinner with message during step transitions
 * to improve user experience and prevent confusion during async operations.
 */

import React from 'react';

interface MFAWaitScreenV8Props {
	/** Loading message to display */
	message?: string;
	/** Optional custom className for styling */
	className?: string;
}

/**
 * MFA Wait Screen component
 * 
 * Displays a centered spinner with loading message during step transitions.
 * Uses Bootstrap spinner classes for consistency with existing UI.
 * 
 * @param props - Component props
 * @returns Wait screen JSX element
 */
export const MFAWaitScreenV8: React.FC<MFAWaitScreenV8Props> = ({
	message = 'Loading...',
	className = '',
}) => {
	return (
		<div 
			className={`d-flex flex-column justify-content-center align-items-center min-vh-100 ${className}`}
			style={{ 
				background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
				minHeight: '400px'
			}}
		>
			{/* Loading Spinner */}
			<div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
				<span className="visually-hidden">Loading...</span>
			</div>
			
			{/* Loading Message */}
			<div className="text-center">
				<h5 className="text-muted mb-2">{message}</h5>
				<p className="text-muted small mb-0">Please wait while we prepare the next step...</p>
			</div>
			
			{/* Progress Dots */}
			<div className="d-flex justify-content-center mt-4">
				<div className="d-flex gap-2">
					<div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
					<div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
					<div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
				</div>
			</div>
		</div>
	);
};

export default MFAWaitScreenV8;
