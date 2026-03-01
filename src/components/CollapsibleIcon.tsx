import { FiChevronDown, FiChevronUp } from '@icons';
import React from 'react';
import styled from 'styled-components';

interface CollapsibleIconProps {
	isExpanded: boolean;
	className?: string;
}

const IconWrapper = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	color: #ffffff;
	transition: transform 0.2s ease, color 0.2s ease;

	svg {
		width: 1.25rem;
		height: 1.25rem;
		color: inherit;
	}
`;

export const CollapsibleIcon: React.FC<CollapsibleIconProps> = ({ isExpanded, className }) => {
	return (
		<IconWrapper $isExpanded={isExpanded} className={className}>
			{isExpanded ? <FiChevronDown /> : <FiChevronUp />}
		</IconWrapper>
	);
};

export default CollapsibleIcon;
