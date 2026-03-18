// src/components/RedirectUriEducationButton.tsx
// Button component for Redirect URI educational functionality

import React from 'react';
import { useRedirectUriEducation } from '../hooks/useRedirectUriEducation';

interface RedirectUriEducationButtonProps {
	flowKey: string;
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	children?: React.ReactNode;
}

export const RedirectUriEducationButton: React.FC<RedirectUriEducationButtonProps> = ({
	flowKey,
	variant = 'secondary',
	size = 'md',
	children,
}) => {
	const { openEducationalModal, isLoading, flowInfo } = useRedirectUriEducation({ flowKey });

	const getButtonStyle = () => ({
		padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '1rem 2rem' : '0.75rem 1.5rem',
		borderRadius: '0.5rem',
		border: variant === 'outline' ? '1px solid V9_COLORS.PRIMARY.BLUE' : 'none',
		background:
			variant === 'primary' ? '#3b82f6' : variant === 'outline' ? 'transparent' : '#f3f4f6',
		color: variant === 'primary' || variant === 'outline' ? '#ffffff' : '#1f2937',
		fontWeight: '600' as const,
		cursor: isLoading || !flowInfo ? 'not-allowed' : 'pointer',
		opacity: isLoading || !flowInfo ? 0.6 : 1,
		transition: 'all 0.2s ease',
		fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
	});

	return (
		<button
			type="button"
			onClick={openEducationalModal}
			disabled={isLoading || !flowInfo}
			style={getButtonStyle()}
			title={
				flowInfo
					? `View URI educational guide for ${flowInfo.flowName}`
					: 'Loading URI information...'
			}
		>
			{isLoading ? 'Loading...' : children || '📚 URI Guide'}
		</button>
	);
};
