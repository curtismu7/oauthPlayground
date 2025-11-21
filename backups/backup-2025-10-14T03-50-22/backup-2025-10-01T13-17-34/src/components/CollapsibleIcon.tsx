import React from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styled from 'styled-components';

interface CollapsibleIconProps {
	isExpanded: boolean;
	className?: string;
}

const IconWrapper = styled.div<{ $isExpanded: boolean }>`
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.2rem;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	flex-shrink: 0;

	svg {
		width: 20px;
		height: 20px;
	}

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}

	&:active {
		transform: translateY(0);
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}
`;

export const CollapsibleIcon: React.FC<CollapsibleIconProps> = ({ isExpanded, className }) => {
	return (
		<IconWrapper $isExpanded={isExpanded} className={className}>
			{isExpanded ? <FiChevronDown /> : <FiChevronRight />}
		</IconWrapper>
	);
};

export default CollapsibleIcon;
