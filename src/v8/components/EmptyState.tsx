/**
 * @file EmptyState.tsx
 * @module v8/components
 * @description Empty state component with icon and call-to-action
 * @version 9.1.0
 */

import React from 'react';
import { FiInbox } from 'react-icons/fi';
import { colors, spacing, typography } from '@/v8/design/tokens';
import { Button } from './Button';

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export const EmptyState: React.FC<EmptyStateProps> = ({
	icon = <FiInbox size={64} />,
	title,
	description,
	action,
}) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: `${spacing['3xl']} ${spacing.lg}`,
				textAlign: 'center',
			}}
		>
			<div style={{ color: colors.neutral[400], marginBottom: spacing.xl }}>{icon}</div>
			<h3
				style={{
					margin: `0 0 ${spacing.md} 0`,
					fontSize: typography.fontSize.xl,
					fontWeight: typography.fontWeight.semibold,
					color: colors.neutral[900],
				}}
			>
				{title}
			</h3>
			<p
				style={{
					margin: `0 0 ${spacing.xl} 0`,
					fontSize: typography.fontSize.base,
					color: colors.neutral[500],
					maxWidth: '400px',
					lineHeight: typography.lineHeight.relaxed,
				}}
			>
				{description}
			</p>
			{action && (
				<Button onClick={action.onClick} variant="primary">
					{action.label}
				</Button>
			)}
		</div>
	);
};
