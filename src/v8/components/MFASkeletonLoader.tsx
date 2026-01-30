/**
 * @file MFASkeletonLoader.tsx
 * @module v8/components
 * @description Skeleton loader components for MFA flows
 * @version 9.1.0
 */

import React from 'react';

interface SkeletonProps {
	variant?: 'text' | 'circular' | 'rectangular';
	width?: string | number;
	height?: string | number;
	animation?: 'pulse' | 'wave' | 'none';
	style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
	variant = 'text',
	width = '100%',
	height = variant === 'text' ? '1em' : '100%',
	animation = 'pulse',
	style,
}) => {
	const baseStyle: React.CSSProperties = {
		width,
		height,
		backgroundColor: '#e5e7eb',
		borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
		...style,
	};

	const animationStyle: React.CSSProperties =
		animation === 'pulse'
			? {
					animation: 'skeleton-pulse 1.5s ease-in-out infinite',
				}
			: animation === 'wave'
				? {
						background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
						backgroundSize: '200% 100%',
						animation: 'skeleton-wave 1.5s ease-in-out infinite',
					}
				: {};

	return (
		<>
			<div style={{ ...baseStyle, ...animationStyle }} />
			<style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeleton-wave {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
		</>
	);
};

export const MFAFlowSkeleton: React.FC = () => {
	return (
		<div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
			{/* Header skeleton */}
			<div style={{ marginBottom: '32px' }}>
				<Skeleton height={120} animation="wave" />
			</div>

			{/* Step indicator skeleton */}
			<div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} height={60} animation="wave" />
				))}
			</div>

			{/* Content skeleton */}
			<div style={{ background: 'white', borderRadius: '12px', padding: '32px' }}>
				<Skeleton width="60%" height={32} style={{ marginBottom: '16px' }} />
				<Skeleton width="100%" height={20} style={{ marginBottom: '8px' }} />
				<Skeleton width="90%" height={20} style={{ marginBottom: '24px' }} />

				<div style={{ display: 'grid', gap: '16px' }}>
					<Skeleton height={56} />
					<Skeleton height={56} />
					<Skeleton height={56} />
				</div>

				<div
					style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}
				>
					<Skeleton width={120} height={48} />
					<Skeleton width={120} height={48} />
				</div>
			</div>
		</div>
	);
};
