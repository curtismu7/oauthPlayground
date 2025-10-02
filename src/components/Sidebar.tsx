import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	Sidebar as ProSidebar,
	Menu,
	MenuItem,
	SubMenu,
} from 'react-pro-sidebar';
import {
	FiHome,
	FiSettings,
	FiShield,
	FiBookOpen,
	FiCpu,
	FiUser,
	FiKey,
	FiTool,
	FiFileText,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

const SidebarContainer = styled.div<{ $isOpen: boolean; $width: number }>`
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	z-index: 1000;
	width: ${({ $width }) => $width}px;
	transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
	transition: transform 0.3s ease;

	@media (min-width: 768px) {
		position: relative;
		transform: none;
	}

	.ps-sidebar-container {
		background: #ffffff;
		height: 100vh;
		border-right: 1px solid #e5e7eb;
	}

	.ps-menu-button {
		padding: 10px 16px;
		transition: all 0.2s;
		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;

		&:hover {
			background: #f3f4f6;
		}
	}

	.ps-menu-button.ps-active {
		background: #eff6ff;
		color: #3b82f6;
		border-right: 3px solid #3b82f6;
	}

	.ps-submenu-content {
		background: #f9fafb !important;
		border-left: 2px solid #e5e7eb;
		margin-left: 10px;
	}

	.ps-open > .ps-submenu-content {
		background: #f3f4f6 !important;
	}

	/* Style submenu headers with light blue background */
	.ps-submenu-root > .ps-menu-button {
		background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
		color: #1e40af;
		font-weight: 600;
		border-bottom: 1px solid #93c5fd;

		&:hover {
			background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
		}

		svg {
			color: #1e40af !important;
		}
	}

	/* Chevron icon styling - dark blue arrows */
	.ps-submenu-expand-icon {
		color: #1e40af !important;
		transition: transform 0.2s ease;
	}

	.ps-open > .ps-menu-button .ps-submenu-expand-icon {
		transform: rotate(180deg);
	}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.375rem;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #111827;
	}

	@media (min-width: 768px) {
		display: none;
	}
`;

const SidebarHeader = styled.div`
	padding: 1.25rem 1rem;
	border-bottom: 1px solid #e5e7eb;
	font-size: 1.125rem;
	font-weight: 600;
	color: #111827;
`;

const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 4px;
	height: 100%;
	background: transparent;
	cursor: col-resize;
	z-index: 1001;
	transition: background 0.2s;

	&:hover {
		background: #3b82f6;
	}

	&:active {
		background: #2563eb;
	}
`;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [sidebarWidth, setSidebarWidth] = useState(320);
	const isResizing = useRef(false);

	const isActive = (path: string) => location.pathname === path;

	const handleNavigation = (path: string) => {
		navigate(path);
		onClose();
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		isResizing.current = true;
		e.preventDefault();
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing.current) return;
			
			const newWidth = e.clientX;
			if (newWidth >= 250 && newWidth <= 500) {
				setSidebarWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			isResizing.current = false;
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, []);

	return (
		<SidebarContainer $isOpen={isOpen} $width={sidebarWidth}>
			<ResizeHandle onMouseDown={handleMouseDown} />
			<ProSidebar width={`${sidebarWidth}px`}>
				<SidebarHeader>
					PingOne OAuth Playground
					<CloseButton onClick={onClose}>
						<FiX size={20} />
					</CloseButton>
				</SidebarHeader>

				<Menu
					menuItemStyles={{
						button: ({ active }) => ({
							backgroundColor: active ? '#eff6ff' : undefined,
							color: active ? '#3b82f6' : '#4b5563',
							borderRight: active ? '3px solid #3b82f6' : undefined,
							fontSize: '0.875rem',
							padding: '10px 16px',
							'&:hover': {
								backgroundColor: '#f3f4f6',
							},
						}),
						subMenuContent: {
							backgroundColor: '#f9fafb',
						},
						label: {
							fontSize: '0.875rem',
						},
						icon: {
							fontSize: '1rem',
						},
					}}
				>
					{/* Overview Section */}
					<SubMenu
						label="Overview"
						icon={<FiBookOpen />}
						defaultOpen={true}
					>
						<MenuItem
							icon={<FiHome />}
							active={isActive('/dashboard')}
							onClick={() => handleNavigation('/dashboard')}
						>
							Dashboard
						</MenuItem>
						<MenuItem
							icon={<FiSettings />}
							active={isActive('/configuration')}
							onClick={() => handleNavigation('/configuration')}
						>
							Settings
						</MenuItem>
						<MenuItem
							icon={<FiShield />}
							active={isActive('/oauth-2-1')}
							onClick={() => handleNavigation('/oauth-2-1')}
						>
							OAuth 2.1
						</MenuItem>
						<MenuItem
							icon={<FiBookOpen />}
							active={isActive('/documentation/oidc-overview')}
							onClick={() => handleNavigation('/documentation/oidc-overview')}
						>
							OIDC Overview
						</MenuItem>
						<MenuItem
							icon={<FiBookOpen />}
							active={isActive('/ai-glossary')}
							onClick={() => handleNavigation('/ai-glossary')}
						>
							AI Glossary
						</MenuItem>
						<MenuItem
							icon={<FiCpu />}
							active={isActive('/ai-agent-overview')}
							onClick={() => handleNavigation('/ai-agent-overview')}
						>
							AI Agent Overview for PingOne
						</MenuItem>
						<MenuItem
							icon={<FiBookOpen />}
							active={isActive('/comprehensive-oauth-education')}
							onClick={() => handleNavigation('/comprehensive-oauth-education')}
						>
							Comprehensive OAuth AI Education
						</MenuItem>
					</SubMenu>

					{/* OAuth 2.0 Flows */}
					<SubMenu
						label="OAuth 2.0 Flows"
						icon={<FiShield />}
						defaultOpen={true}
					>
						<MenuItem
							active={isActive('/flows/oauth-authorization-code-v5')}
							onClick={() => handleNavigation('/flows/oauth-authorization-code-v5')}
						>
							Authorization Code (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/oauth-implicit-v5')}
							onClick={() => handleNavigation('/flows/oauth-implicit-v5')}
						>
							Implicit Flow (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/oauth-implicit-v5-1')}
							onClick={() => handleNavigation('/flows/oauth-implicit-v5-1')}
						>
							Implicit Flow (V5.1) 🚀
						</MenuItem>
						<MenuItem
							active={isActive('/flows/device-authorization-v5')}
							onClick={() => handleNavigation('/flows/device-authorization-v5')}
						>
							Device Authorization (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/client-credentials-v5')}
							onClick={() => handleNavigation('/flows/client-credentials-v5')}
						>
							Client Credentials (V5)
						</MenuItem>
					</SubMenu>

					{/* OpenID Connect */}
					<SubMenu
						label="OpenID Connect"
						icon={<FiUser />}
						defaultOpen={true}
					>
						<MenuItem
							active={isActive('/flows/oidc-authorization-code-v5')}
							onClick={() => handleNavigation('/flows/oidc-authorization-code-v5')}
						>
							Authorization Code (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/oidc-implicit-v5')}
							onClick={() => handleNavigation('/flows/oidc-implicit-v5')}
						>
							Implicit Flow (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/oidc-device-authorization-v5')}
							onClick={() => handleNavigation('/flows/oidc-device-authorization-v5')}
						>
							Device Authorization (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/hybrid-v5')}
							onClick={() => handleNavigation('/flows/hybrid-v5')}
						>
							Hybrid Flow (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/oidc-hybrid-v3')}
							onClick={() => handleNavigation('/flows/oidc-hybrid-v3')}
						>
							Hybrid Flow (V3)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/oidc-client-credentials-v5')}
							onClick={() => handleNavigation('/flows/oidc-client-credentials-v5')}
						>
							Client Credentials (V5)
						</MenuItem>
					</SubMenu>

					{/* PingOne Flows */}
					<SubMenu
						label="PingOne Flows"
						icon={<FiKey />}
						defaultOpen={false}
					>
						<MenuItem
							active={isActive('/flows/worker-token-v5')}
							onClick={() => handleNavigation('/flows/worker-token-v5')}
						>
							Worker Token (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/pingone-par-v5')}
							onClick={() => handleNavigation('/flows/pingone-par-v5')}
						>
							PAR Flow (V5)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/redirectless-flow-mock')}
							onClick={() => handleNavigation('/flows/redirectless-flow-mock')}
						>
							Redirectless Flow (Educational)
						</MenuItem>
						<MenuItem
							active={isActive('/flows/redirectless-flow-v5')}
							onClick={() => handleNavigation('/flows/redirectless-flow-v5')}
						>
							Redirectless Flow (V5)
						</MenuItem>
					</SubMenu>

					{/* Resources */}
					<SubMenu
						label="Resources"
						icon={<FiTool />}
						defaultOpen={false}
					>
						<MenuItem
							active={isActive('/token-management')}
							onClick={() => handleNavigation('/token-management')}
						>
							Token Management
						</MenuItem>
						<MenuItem
							active={isActive('/url-decoder')}
							onClick={() => handleNavigation('/url-decoder')}
						>
							URL Decoder
						</MenuItem>
						<MenuItem
							active={isActive('/auto-discover')}
							onClick={() => handleNavigation('/auto-discover')}
						>
							Auto Discover
						</MenuItem>
					</SubMenu>

					{/* Documentation */}
					<SubMenu
						label="Documentation"
						icon={<FiFileText />}
						defaultOpen={false}
					>
						<MenuItem
							active={isActive('/documentation')}
							onClick={() => handleNavigation('/documentation')}
						>
							Local Documentation
						</MenuItem>
						<MenuItem
							active={isActive('/docs/oidc-specs')}
							onClick={() => handleNavigation('/docs/oidc-specs')}
						>
							OIDC Specs
						</MenuItem>
						<MenuItem
							active={isActive('/docs/oidc-for-ai')}
							onClick={() => handleNavigation('/docs/oidc-for-ai')}
						>
							OIDC for AI
						</MenuItem>
						<MenuItem
							active={isActive('/docs/oauth2-security-best-practices')}
							onClick={() => handleNavigation('/docs/oauth2-security-best-practices')}
						>
							OAuth 2.0 Security Best Practices
						</MenuItem>
						<MenuItem
							onClick={() => {
								window.open('https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2', '_blank');
								onClose();
							}}
						>
							PingOne API Docs
						</MenuItem>
						<MenuItem
							onClick={() => {
								window.open('https://docs.pingidentity.com/sdks/latest/sdks/index.html', '_blank');
								onClose();
							}}
						>
							PingOne SDKs
						</MenuItem>
					</SubMenu>
				</Menu>
			</ProSidebar>
		</SidebarContainer>
	);
};

export default Sidebar;
