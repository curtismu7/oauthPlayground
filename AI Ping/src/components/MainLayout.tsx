import React from 'react';
import styled from 'styled-components';
import { useSidebar } from '../contexts/SidebarContext';

const MainContainer = styled.div<{ sidebarWidth: number }>`
	margin-left: ${props => props.sidebarWidth}px;
	min-height: 100vh;
	background: #f8fafc;
	transition: margin-left 0.3s ease;
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	max-width: 1200px;
	margin: 0 auto;
`;

interface MainLayoutProps {
	children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	const { isOpen } = useSidebar();
	const sidebarWidth = isOpen ? 280 : 60;

	return (
		<MainContainer sidebarWidth={sidebarWidth}>
			<ContentWrapper>
				{children}
			</ContentWrapper>
		</MainContainer>
	);
};

export default MainLayout;
