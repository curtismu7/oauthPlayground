import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';

interface CollapsibleSectionProps {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	defaultCollapsed?: boolean;
	icon?: string;
	className?: string;
	headerActions?: React.ReactNode;
}

const SectionContainer = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed',
})<{ $collapsed: boolean }>`
	margin-bottom: 2rem;
	background: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
	overflow: hidden;
	transition: all 0.3s ease;
`;

const SectionHeader = styled.div`
	padding: 1.5rem;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	border-bottom: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: background-color 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	flex: 1;
`;

const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	z-index: 1;

	* {
		pointer-events: auto;
	}
`;

const RightContent = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
`;

const SectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
`;

const TitleText = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #ffffff;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Subtitle = styled.p`
	margin: 0.25rem 0 0 0;
	color: rgba(255, 255, 255, 0.9);
`;

const ChevronIcon = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed',
})<{ $collapsed: boolean }>`
	color: #ffffff;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	svg {
		color: #ffffff;
	}

	&:hover {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')} scale(1.1);
	}

	&:active {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')} scale(1.05);
	}
`;

const SectionContent = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed',
})<{ $collapsed: boolean }>`
	padding: ${({ $collapsed }) => ($collapsed ? '0' : '1.5rem')};
	max-height: ${({ $collapsed }) => ($collapsed ? '0' : '1200px')};
	overflow: hidden;
	opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
	visibility: ${({ $collapsed }) => ($collapsed ? 'hidden' : 'visible')};
	transition: all 0.3s ease;
`;

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	subtitle,
	children,
	defaultCollapsed = true,
	icon,
	className,
	headerActions,
}) => {
	const [collapsed, setCollapsed] = useState(defaultCollapsed);

	const handleToggle = () => {
		setCollapsed((prev) => !prev);
	};

	return (
		<SectionContainer $collapsed={collapsed} className={className}>
			<SectionHeader onClick={handleToggle}>
				<HeaderContent>
					<SectionTitle>
						<TitleText>
							{icon && <span>{icon}</span>}
							{title}
						</TitleText>
						{subtitle && <Subtitle>{subtitle}</Subtitle>}
					</SectionTitle>
				</HeaderContent>
				<RightContent>
					{headerActions && (
						<HeaderActions onClick={(e) => e.stopPropagation()}>{headerActions}</HeaderActions>
					)}
					<ChevronIcon $collapsed={collapsed} aria-hidden="true">
						<FiChevronDown size={18} />
					</ChevronIcon>
				</RightContent>
			</SectionHeader>
			<SectionContent $collapsed={collapsed}>{children}</SectionContent>
		</SectionContainer>
	);
};

export default CollapsibleSection;
