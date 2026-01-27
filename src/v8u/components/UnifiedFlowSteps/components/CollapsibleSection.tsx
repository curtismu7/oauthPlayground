import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';

const CollapsibleSectionContainer = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: 3px solid transparent;
	border-radius: 1rem;
	cursor: pointer;
	font-size: 1.2rem;
	font-weight: 700;
	color: #14532d;
	transition: all 0.3s ease;

	&:hover {
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-color: #2563eb;
		color: #2563eb;
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
	}

	&:active {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(0.95)' : 'rotate(0deg) scale(0.95)')};
		box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
	}

	svg {
		width: 24px;
		height: 24px;
		stroke-width: 3px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}
`;

const CollapsibleTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed?: boolean }>`
	transition: transform 0.3s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background-color: #ffffff;
	border-radius: 6px;
	border: 2px solid #3b82f6;
	transition: all 0.2s ease;

	svg {
		color: #3b82f6;
	}

	&:hover {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')} scale(1.05);
		border-color: #2563eb;
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

interface CollapsibleSectionProps {
	title: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	defaultCollapsed?: boolean;
	variant?: 'default' | 'info' | 'warning' | 'success';
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	icon,
	children,
	defaultCollapsed = false,
	variant = 'default',
}) => {
	const [collapsed, setCollapsed] = useState(defaultCollapsed);

	const getVariantStyles = () => {
		switch (variant) {
			case 'info':
				return {
					background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
					borderColor: '#3b82f6',
					color: '#1e40af',
				};
			case 'warning':
				return {
					background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
					borderColor: '#f59e0b',
					color: '#92400e',
				};
			case 'success':
				return {
					background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
					borderColor: '#22c55e',
					color: '#059669',
				};
			default:
				return {
					background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)',
					borderColor: '#10b981',
					color: '#14532d',
				};
		}
	};

	const variantStyles = getVariantStyles();

	return (
		<CollapsibleSectionContainer>
			<CollapsibleHeaderButton
				onClick={() => setCollapsed(!collapsed)}
				aria-expanded={!collapsed}
				style={{
					background: variantStyles.background,
					borderColor: variantStyles.borderColor,
					color: variantStyles.color,
				}}
			>
				<CollapsibleTitle>
					{icon && <span style={{ fontSize: '20px', marginRight: '8px' }}>{icon}</span>}
					{title}
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsed}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsed && <CollapsibleContent>{children}</CollapsibleContent>}
		</CollapsibleSectionContainer>
	);
};
