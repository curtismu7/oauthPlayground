import React from 'react';
import styled from 'styled-components';

interface VersionBadgeProps {
	version: string;
	type?: 'v8' | 'v8u' | 'v7' | 'v6' | 'production' | 'legacy' | 'new';
	label?: string;
}

const BadgeContainer = styled.span<{ $color: string; $bgColor: string }>`
	background: ${(props) => props.$bgColor};
	border: 1px solid ${(props) => props.$color};
	color: V9_COLORS.TEXT.WHITE;
	padding: 0.125rem 0.375rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	z-index: 1;
	position: relative;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	white-space: nowrap;
`;

const BADGE_STYLES = {
	v8: {
		color: 'V9_COLORS.PRIMARY.BLUE',
		bgColor: 'rgba(59, 130, 246, 0.9)',
		defaultLabel: 'V8',
	},
	v8u: {
		color: 'V9_COLORS.PRIMARY.GREEN',
		bgColor: 'rgba(16, 185, 129, 0.9)',
		defaultLabel: 'V8U',
	},
	v7: {
		color: '#8b5cf6',
		bgColor: 'rgba(139, 92, 246, 0.9)',
		defaultLabel: 'V7',
	},
	v6: {
		color: 'V9_COLORS.PRIMARY.YELLOW',
		bgColor: 'rgba(245, 158, 11, 0.9)',
		defaultLabel: 'V6',
	},
	production: {
		color: 'V9_COLORS.PRIMARY.GREEN',
		bgColor: 'rgba(34, 197, 94, 0.9)',
		defaultLabel: 'PROD',
	},
	legacy: {
		color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
		bgColor: 'rgba(107, 114, 128, 0.9)',
		defaultLabel: 'LEGACY',
	},
	new: {
		color: '#ec4899',
		bgColor: 'rgba(236, 72, 153, 0.9)',
		defaultLabel: 'NEW',
	},
};

export const MenuVersionBadge: React.FC<VersionBadgeProps> = ({
	version,
	type = 'production',
	label,
}) => {
	const style = BADGE_STYLES[type];
	const displayLabel = label || style.defaultLabel;

	return (
		<BadgeContainer
			$color={style.color}
			$bgColor={style.bgColor}
			title={`${displayLabel} ${version}`}
		>
			{displayLabel} {version}
		</BadgeContainer>
	);
};

export default MenuVersionBadge;
