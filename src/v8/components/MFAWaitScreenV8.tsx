/**
 * @file MFAWaitScreenV8.tsx
 * @module v8/components
 * @description Wait screen component for MFA flow transitions
 * @version 8.0.0
 * @since 2026-02-12
 *
 * Provides a centered loading spinner with message during step transitions.
 * Uses blue only (hard rule: no purple) so appearance is consistent across themes.
 */

import React from 'react';

const WAIT_SCREEN_BLUE = '#3b82f6';
const WAIT_SCREEN_BLUE_DARK = '#2563eb';

interface MFAWaitScreenV8Props {
	/** Loading message to display */
	message?: string;
	/** Optional custom className for styling */
	className?: string;
}

/**
 * MFA Wait Screen component — blue only (no purple).
 * Displays a centered spinner with loading message during step transitions.
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
				minHeight: '400px',
			}}
		>
			{/* Loading Spinner — explicit blue (no Bootstrap primary/purple) */}
			<div
				className="mb-3"
				role="status"
				style={{
					width: '3rem',
					height: '3rem',
					border: `3px solid #e2e8f0`,
					borderTopColor: WAIT_SCREEN_BLUE,
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite',
				}}
			>
				<span className="visually-hidden">Loading...</span>
			</div>

			{/* Loading Message */}
			<div className="text-center">
				<h5 className="mb-2" style={{ color: '#374151' }}>
					{message}
				</h5>
				<p className="small mb-0" style={{ color: '#6b7280' }}>
					Please wait while we prepare the next step...
				</p>
			</div>

			{/* Progress Dots — blue only */}
			<div className="d-flex justify-content-center mt-4">
				<div className="d-flex gap-2">
					<div
						className="rounded-circle"
						style={{ width: '8px', height: '8px', background: WAIT_SCREEN_BLUE }}
					/>
					<div
						className="rounded-circle"
						style={{ width: '8px', height: '8px', background: WAIT_SCREEN_BLUE }}
					/>
					<div
						className="rounded-circle"
						style={{ width: '8px', height: '8px', background: WAIT_SCREEN_BLUE }}
					/>
				</div>
			</div>
		</div>
	);
};

export default MFAWaitScreenV8;
