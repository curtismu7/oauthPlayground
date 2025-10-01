import React from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styled from 'styled-components';
import { themeService } from '../services/themeService';

interface CollapsibleIconProps {
	isExpanded: boolean;
	className?: string;
}

const IconWrapper = styled.div<{ $isExpanded: boolean }>`
	${() => themeService.getCollapseIconStyles()}
`;

export const CollapsibleIcon: React.FC<CollapsibleIconProps> = ({ isExpanded, className }) => {
	return (
		<IconWrapper $isExpanded={isExpanded} className={className}>
			{isExpanded ? <FiChevronDown /> : <FiChevronRight />}
		</IconWrapper>
	);
};

export default CollapsibleIcon;
