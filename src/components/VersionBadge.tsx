import React from 'react';
import styled from 'styled-components';

interface VersionBadgeProps {
	version: string;
	flow?: string;
	variant?: 'sidebar' | 'flow';
}

const Badge = styled.span<{ flow?: string; variant?: string }>`
  align-self: flex-start;
  background: ${(props) => {
		if (props.variant === 'sidebar') {
			return 'rgba(99, 102, 241, 0.2)';
		}
		return props.flow === 'Implicit' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(22, 163, 74, 0.2)';
	}};
  border: 1px solid ${(props) => {
		if (props.variant === 'sidebar') {
			return '#6366f1';
		}
		return props.flow === 'Implicit' ? '#60a5fa' : '#4ade80';
	}};
  color: ${(props) => {
		if (props.variant === 'sidebar') {
			return '#4f46e5';
		}
		return props.flow === 'Implicit' ? '#dbeafe' : '#bbf7d0';
	}};
  font-size: ${(props) => (props.variant === 'sidebar' ? '0.7rem' : '0.75rem')};
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: ${(props) => (props.variant === 'sidebar' ? '0.25rem 0.6rem' : '0.25rem 0.75rem')};
  border-radius: 9999px;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
`;

export const VersionBadge: React.FC<VersionBadgeProps> = ({ version, flow, variant = 'flow' }) => {
	console.log('[VersionBadge] Rendering:', { version, flow, variant });
	return (
		<Badge flow={flow} variant={variant}>
			{version}
		</Badge>
	);
};
