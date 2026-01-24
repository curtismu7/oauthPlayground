import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useSidebar } from '../contexts/SidebarContext';
import { FiCpu, FiBook, FiShield, FiSettings, FiChevronDown, FiChevronRight } from 'react-icons/fi';

const SidebarContainer = styled.div<{ isOpen: boolean }>`
	width: ${props => props.isOpen ? '280px' : '60px'};
	height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	transition: width 0.3s ease;
	overflow-x: hidden;
	position: fixed;
	left: 0;
	top: 0;
	z-index: 1000;
	box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
`;

const SidebarHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	text-align: center;
`;

const Logo = styled.div`
	font-size: ${props => props.isOpen ? '1.5rem' : '1.2rem'};
	font-weight: bold;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`;

const NavSection = styled.div`
	padding: 1rem 0;
`;

const SectionTitle = styled.div<{ isOpen: boolean }>`
	padding: 0.5rem 1.5rem;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: rgba(255, 255, 255, 0.7);
	display: flex;
	align-items: center;
	justify-content: ${props => props.isOpen ? 'space-between' : 'center'};
	cursor: pointer;
	&:hover {
		color: white;
	}
`;

const NavItem = styled(NavLink)`
	display: flex;
	align-items: center;
	padding: 0.75rem 1.5rem;
	color: rgba(255, 255, 255, 0.9);
	text-decoration: none;
	transition: all 0.2s ease;
	border-left: 3px solid transparent;
	
	&:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}
	
	&.active {
		background: rgba(255, 255, 255, 0.15);
		border-left-color: #fbbf24;
		color: white;
	}
`;

const NavIcon = styled.span`
	margin-right: 1rem;
	font-size: 1.1rem;
	display: flex;
	align-items: center;
`;

const NavText = styled.span<{ isOpen: boolean }>`
	white-space: nowrap;
	opacity: ${props => props.isOpen ? 1 : 0};
	transition: opacity 0.3s ease;
`;

interface MenuItem {
	id: string;
	path: string;
	label: string;
	icon: React.ReactNode;
}

interface MenuSection {
	id: string;
	title: string;
	items: MenuItem[];
}

const menuSections: MenuSection[] = [
	{
		id: 'ai-resources',
		title: 'AI Resources',
		items: [
			{
				id: 'ping-ai-resources',
				path: '/ping-ai-resources',
				label: 'Ping AI Resources',
				icon: <FiCpu />,
			},
			{
				id: 'ai-glossary',
				path: '/ai-glossary',
				label: 'AI Glossary',
				icon: <FiBook />,
			},
			{
				id: 'ai-identity-architectures',
				path: '/ai-identity-architectures',
				label: 'AI Identity Architectures',
				icon: <FiShield />,
			},
			{
				id: 'ai-agent-overview',
				path: '/ai-agent-overview',
				label: 'AI Agent Overview',
				icon: <FiSettings />,
			},
		],
	},
	{
		id: 'ai-documentation',
		title: 'AI Documentation',
		items: [
			{
				id: 'oauth-and-oidc-for-ai',
				path: '/docs/oauth-and-oidc-for-ai',
				label: 'OAuth & OIDC for AI',
				icon: <FiBook />,
			},
			{
				id: 'oauth-for-ai',
				path: '/docs/oauth-for-ai',
				label: 'OAuth for AI',
				icon: <FiBook />,
			},
			{
				id: 'oidc-for-ai',
				path: '/docs/oidc-for-ai',
				label: 'OIDC for AI',
				icon: <FiBook />,
			},
			{
				id: 'ping-view-on-ai',
				path: '/docs/ping-view-on-ai',
				label: 'PingOne AI Perspective',
				icon: <FiShield />,
			},
		],
	},
];

const Sidebar: React.FC = () => {
	const { isOpen, toggleSidebar } = useSidebar();
	const location = useLocation();
	const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
		new Set(['ai-resources', 'ai-documentation'])
	);

	const toggleSection = (sectionId: string) => {
		setExpandedSections(prev => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	};

	return (
		<SidebarContainer isOpen={isOpen}>
			<SidebarHeader>
				<Logo isOpen={isOpen}>
					<FiCpu />
					{isOpen && <span>PingOne AI</span>}
				</Logo>
			</SidebarHeader>
			
			{menuSections.map(section => (
				<NavSection key={section.id}>
					<SectionTitle
						isOpen={isOpen}
						onClick={() => toggleSection(section.id)}
					>
						{isOpen && <span>{section.title}</span>}
						{expandedSections.has(section.id) ? <FiChevronDown /> : <FiChevronRight />}
					</SectionTitle>
					
					{expandedSections.has(section.id) && section.items.map(item => (
						<NavItem
							key={item.id}
							to={item.path}
							className={location.pathname === item.path ? 'active' : ''}
						>
							<NavIcon>{item.icon}</NavIcon>
							<NavText isOpen={isOpen}>{item.label}</NavText>
						</NavItem>
					))}
				</NavSection>
			))}
		</SidebarContainer>
	);
};

export default Sidebar;
