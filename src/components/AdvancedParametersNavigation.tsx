import React from 'react';
import { FiArrowRight, FiSettings } from '@icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NavigationButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #0284c7;
	background: #ffffff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	margin-bottom: 1rem;
	width: 100%;

	&:hover {
		background: #f0f9ff;
		border-color: #0284c7;
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
			<FiSettings />
			Configure Advanced Parameters
			<FiArrowRight />
		</NavigationButton>
	);
};

export default AdvancedParametersNavigation;
