import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NavigationButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: V9_COLORS.PRIMARY.BLUE;
	background: V9_COLORS.TEXT.WHITE;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	margin-bottom: 1rem;
	width: 100%;

	&:hover {
		background: V9_COLORS.BG.GRAY_LIGHT;
		border-color: V9_COLORS.PRIMARY.BLUE;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
`;

interface AdvancedParametersNavigationProps {
	flowType: string;
	className?: string;
}

export const AdvancedParametersNavigation: React.FC<AdvancedParametersNavigationProps> = ({
	flowType,
	className,
}) => {
	const navigate = useNavigate();

	const handleNavigate = () => {
		navigate(`/flows/advanced-parameters-v6/${flowType}`);
	};

	return (
		<NavigationButton onClick={handleNavigate} className={className}>
			<span>⚙️</span>
			Configure Advanced Parameters
			<span>➡️</span>
		</NavigationButton>
	);
};

export default AdvancedParametersNavigation;
