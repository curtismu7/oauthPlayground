import React, { useEffect, useRef, useState } from 'react';
import {
	FiBookOpen,
	FiClock,
	FiCpu,
	FiDatabase,
	FiExternalLink,
	FiEye,
	FiFileText,
	FiGitBranch,
	FiHome,
	FiKey,
	FiLayers,
	FiLock,
	FiPackage,
	FiSearch,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiTool,
	FiUser,
	FiX,
	FiZap,
} from 'react-icons/fi';
import { Menu, MenuItem, Sidebar as ProSidebar, SubMenu } from 'react-pro-sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Colored icon wrapper component for sidebar menu
const ColoredIcon = styled.span<{ $color?: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.$color || 'currentColor'};
	
	svg {
		color: ${props => props.$color || 'currentColor'} !important;
	}
`;

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
		position: fixed;
		transform: none;
	}

	.ps-sidebar-container {
		background: #ffffff;
		height: 100vh;
		border-right: 1px solid #e5e7eb;
		overflow-y: auto;
		scroll-behavior: smooth;
		padding-bottom: 2rem; /* Add padding at bottom for better UX */
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
		background: #fef2f2;
		color: #dc2626;
		border-right: 3px solid #dc2626;
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
	const [sidebarWidth, setSidebarWidth] = useState(380); // Increased to fit widest menu items
	const isResizing = useRef(false);

	// Load persisted menu state from localStorage
	const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
		try {
			const saved = localStorage.getItem('nav.openSections');
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn('Failed to load navigation state from localStorage:', error);
		}
		// Default state - only Core Overview and OAuth 2.0 Flows open by default
		return {
			'Core Overview': true,
			'OAuth 2.0 Flows': true,
			'V6 Flows': true,
			'OpenID Connect': true,
			PingOne: false,
			'Mock & Demo Flows': false,
			'Artificial Intelligence': false,
			'Security & Management': false,
			'Tools & Utilities': false,
			Documentation: false,
		};
	});

	const isActive = (path: string) => location.pathname === path;

	const handleNavigation = (path: string) => {
		navigate(path);
		onClose();
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		isResizing.current = true;
		e.preventDefault();
	};

	// Toggle menu section and persist to localStorage
	const toggleMenu = (menuLabel: string) => {
		setOpenMenus((prev: Record<string, boolean>) => {
			const newState = {
				...prev,
				[menuLabel]: !prev[menuLabel],
			};

			try {
				localStorage.setItem('nav.openSections', JSON.stringify(newState));
			} catch (error) {
				console.warn('Failed to save navigation state to localStorage:', error);
			}

			return newState;
		});
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing.current) return;

			const newWidth = e.clientX;
			if (newWidth >= 300 && newWidth <= 600) {
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
							backgroundColor: active ? '#fef2f2' : undefined,
							color: active ? '#dc2626' : '#4b5563',
							borderRight: active ? '3px solid #dc2626' : undefined,
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
					{/* Core Overview Section */}
					<SubMenu
						label="Core Overview"
						icon={<ColoredIcon $color="#8b5cf6"><FiHome /></ColoredIcon>}
						open={openMenus['Core Overview']}
						onOpenChange={() => toggleMenu('Core Overview')}
					>
						<MenuItem
							icon={<ColoredIcon $color="#8b5cf6"><FiHome /></ColoredIcon>}
							active={isActive('/dashboard')}
							onClick={() => handleNavigation('/dashboard')}
						>
							Dashboard
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#6366f1"><FiSettings /></ColoredIcon>}
							active={isActive('/configuration')}
							onClick={() => handleNavigation('/configuration')}
						>
							Setup & Configuration
						</MenuItem>
					</SubMenu>

					{/* OAuth 2.0 Flows */}
					<SubMenu
						label="OAuth 2.0 Flows"
						icon={<ColoredIcon $color="#ef4444"><FiShield /></ColoredIcon>}
						open={openMenus['OAuth 2.0 Flows']}
						onOpenChange={() => toggleMenu('OAuth 2.0 Flows')}
					>
						<MenuItem
							icon={<ColoredIcon $color="#dc2626"><FiLock /></ColoredIcon>}
							active={isActive('/flows/oauth-authorization-code-v5')}
							onClick={() => handleNavigation('/flows/oauth-authorization-code-v5')}
						>
							Authorization Code (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#f59e0b"><FiZap /></ColoredIcon>}
							active={isActive('/flows/oauth-implicit-v5')}
							onClick={() => handleNavigation('/flows/oauth-implicit-v5')}
						>
							Implicit Flow (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#ec4899"><FiSmartphone /></ColoredIcon>}
							active={isActive('/flows/device-authorization-v5')}
							onClick={() => handleNavigation('/flows/device-authorization-v5')}
						>
							Device Authorization (V5)
						</MenuItem>
						<MenuItem
					icon={<ColoredIcon $color="#f97316"><FiKey /></ColoredIcon>}
					active={isActive('/flows/client-credentials-v5')}
					onClick={() => handleNavigation('/flows/client-credentials-v5')}
				>
					Client Credentials (V5)
				</MenuItem>
				</SubMenu>

				{/* V6 Flows */}
				<SubMenu
					label="V6 Flows"
					icon={<ColoredIcon $color="#8b5cf6"><FiZap /></ColoredIcon>}
					open={openMenus['V6 Flows']}
					onOpenChange={() => toggleMenu('V6 Flows')}
				>
					<MenuItem
						icon={<ColoredIcon $color="#10b981"><FiUser /></ColoredIcon>}
						active={isActive('/flows/oidc-authorization-code-v6')}
						onClick={() => handleNavigation('/flows/oidc-authorization-code-v6')}
					>
						OIDC Authorization Code (V6)
					</MenuItem>
				</SubMenu>

				{/* OpenID Connect */}
				<SubMenu
					label="OpenID Connect"
					icon={<ColoredIcon $color="#10b981"><FiUser /></ColoredIcon>}
					open={openMenus['OpenID Connect']}
					onOpenChange={() => toggleMenu('OpenID Connect')}
				>
						<MenuItem
							icon={<ColoredIcon $color="#059669"><FiLock /></ColoredIcon>}
							active={isActive('/flows/oidc-authorization-code-v5')}
							onClick={() => handleNavigation('/flows/oidc-authorization-code-v5')}
						>
							Authorization Code (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#84cc16"><FiZap /></ColoredIcon>}
							active={isActive('/flows/oidc-implicit-v5')}
			onClick={() => handleNavigation('/flows/oidc-implicit-v5')}
						>
							Implicit Flow (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#14b8a6"><FiSmartphone /></ColoredIcon>}
							active={isActive('/flows/oidc-device-authorization-v5')}
							onClick={() => handleNavigation('/flows/oidc-device-authorization-v5')}
						>
							Device Authorization (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#22c55e"><FiGitBranch /></ColoredIcon>}
							active={isActive('/flows/hybrid-v5')}
							onClick={() => handleNavigation('/flows/hybrid-v5')}
						>
							Hybrid Flow (V5)
						</MenuItem>
						{/* V3 Hybrid Flow - Hidden, use V5 instead */}
						{/* <MenuItem
							active={isActive('/flows/oidc-hybrid-v3')}
							onClick={() => handleNavigation('/flows/oidc-hybrid-v3')}
						>
							Hybrid Flow (V3)
						</MenuItem> */}
					</SubMenu>

					{/* PingOne */}
					<SubMenu
						label="PingOne"
						icon={<ColoredIcon $color="#f97316"><FiKey /></ColoredIcon>}
						open={openMenus['PingOne']}
						onOpenChange={() => toggleMenu('PingOne')}
					>
						<MenuItem
							icon={<ColoredIcon $color="#fb923c"><FiKey /></ColoredIcon>}
							active={isActive('/flows/worker-token-v5')}
							onClick={() => handleNavigation('/flows/worker-token-v5')}
						>
							Worker Token (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#ea580c"><FiLock /></ColoredIcon>}
							active={isActive('/flows/pingone-par-v5')}
							onClick={() => handleNavigation('/flows/pingone-par-v5')}
						>
							PAR (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>}
							active={isActive('/flows/redirectless-flow-v5')}
							onClick={() => handleNavigation('/flows/redirectless-flow-v5')}
						>
							Redirectless Flow V5 (Real)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#fbbf24"><FiSmartphone /></ColoredIcon>}
							active={isActive('/flows/ciba-v5')}
							onClick={() => handleNavigation('/flows/ciba-v5')}
						>
							CBIA (V5)
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#f97316"><FiShield /></ColoredIcon>}
							active={isActive('/flows/pingone-mfa-v5')}
			onClick={() => handleNavigation('/flows/pingone-mfa-v5')}
						>
							PingOne MFA
						</MenuItem>
					</SubMenu>

					{/* Mock & Demo Flows */}
					<SubMenu
						label="Mock & Demo Flows"
						icon={<ColoredIcon $color="#a78bfa"><FiEye /></ColoredIcon>}
						open={openMenus['Mock & Demo Flows']}
						onOpenChange={() => toggleMenu('Mock & Demo Flows')}
					>
						<MenuItem
							icon={<FiEye />}
							active={isActive('/flows/jwt-bearer-v5')}
							onClick={() => handleNavigation('/flows/jwt-bearer-v5')}
						>
							JWT Bearer Token (Mock) (V5)
						</MenuItem>
						<MenuItem
							icon={<FiEye />}
							active={isActive('/flows/oauth2-resource-owner-password')}
							onClick={() => handleNavigation('/flows/oauth2-resource-owner-password')}
						>
							ROPC (Mock) (V5)
						</MenuItem>
						<MenuItem
							icon={<FiEye />}
							active={isActive('/flows/rar-v5')}
							onClick={() => handleNavigation('/flows/rar-v5')}
						>
							RAR (Mock) (V5)
						</MenuItem>
						<MenuItem
							icon={<FiEye />}
							active={isActive('/code-examples-demo')}
							onClick={() => handleNavigation('/code-examples-demo')}
						>
							Code Examples
						</MenuItem>
						<MenuItem
							icon={<FiSmartphone />}
							active={isActive('/flows/redirectless-flow-mock')}
							onClick={() => handleNavigation('/flows/redirectless-flow-mock')}
						>
							Redirectless Flow V5 (Educational)
						</MenuItem>
					</SubMenu>

					{/* Artificial Intelligence */}
					<SubMenu
						label="Artificial Intelligence"
						icon={<ColoredIcon $color="#06b6d4"><FiCpu /></ColoredIcon>}
						open={openMenus['Artificial Intelligence']}
						onOpenChange={() => toggleMenu('Artificial Intelligence')}
					>
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
							icon={<FiShield />}
							active={isActive('/competitive-analysis')}
							onClick={() => handleNavigation('/competitive-analysis')}
						>
							Competitive Analysis
						</MenuItem>
						<MenuItem
							icon={<FiBookOpen />}
							active={isActive('/comprehensive-oauth-education')}
							onClick={() => handleNavigation('/comprehensive-oauth-education')}
						>
							Comprehensive OAuth AI Education
						</MenuItem>
						<MenuItem
							icon={<FiFileText />}
							active={isActive('/docs/oidc-for-ai')}
							onClick={() => handleNavigation('/docs/oidc-for-ai')}
						>
							OIDC for AI
						</MenuItem>
						<MenuItem
							icon={<FiCpu />}
							active={isActive('/docs/ping-view-on-ai')}
							onClick={() => handleNavigation('/docs/ping-view-on-ai')}
						>
							Ping View on AI
						</MenuItem>
						<MenuItem
							icon={<FiShield />}
							active={isActive('/docs/oauth2-security-best-practices')}
							onClick={() => handleNavigation('/docs/oauth2-security-best-practices')}
						>
							OAuth 2.0 Security Best Practices
						</MenuItem>
						<MenuItem
							icon={<FiBookOpen />}
							active={isActive('/oauth-oidc-training')}
							onClick={() => handleNavigation('/oauth-oidc-training')}
						>
							OAuth/OIDC Training
						</MenuItem>
						<MenuItem
							icon={<FiBookOpen />}
							active={isActive('/tutorials')}
							onClick={() => handleNavigation('/tutorials')}
						>
							Interactive Tutorials
						</MenuItem>
					</SubMenu>
					<SubMenu
						label="Security & Management"
						icon={<ColoredIcon $color="#dc2626"><FiShield /></ColoredIcon>}
						open={openMenus['Security & Management']}
						onOpenChange={() => toggleMenu('Security & Management')}
					>
						<MenuItem
							icon={<FiShield />}
							active={isActive('/oauth-2-1')}
							onClick={() => handleNavigation('/oauth-2-1')}
						>
							OAuth 2.1
						</MenuItem>
						<MenuItem
							icon={<FiDatabase />}
							active={isActive('/token-management')}
							onClick={() => handleNavigation('/token-management')}
						>
							Token Management
						</MenuItem>
						<MenuItem
							icon={<FiClock />}
							active={isActive('/oidc-session-management')}
							onClick={() => handleNavigation('/oidc-session-management')}
						>
							Session Management
						</MenuItem>
						<MenuItem
							icon={<FiSearch />}
							active={isActive('/auto-discover')}
							onClick={() => handleNavigation('/auto-discover')}
						>
							OIDC Discovery
						</MenuItem>
					</SubMenu>

					{/* Tools & Utilities Section */}
					<SubMenu
						label="Tools & Utilities"
						icon={<ColoredIcon $color="#8b5cf6"><FiTool /></ColoredIcon>}
						open={openMenus['Tools & Utilities']}
						onOpenChange={() => toggleMenu('Tools & Utilities')}
					>
						<MenuItem
							icon={<FiGitBranch />}
							active={isActive('/flows/compare')}
							onClick={() => handleNavigation('/flows/compare')}
						>
							Flow Comparison
						</MenuItem>
						<MenuItem
							icon={<FiLayers />}
							active={isActive('/flows/diagrams')}
							onClick={() => handleNavigation('/flows/diagrams')}
						>
							Interactive Diagrams
						</MenuItem>
						<MenuItem
							icon={<FiPackage />}
							active={isActive('/sdk-sample-app')}
							onClick={() => handleNavigation('/sdk-sample-app')}
						>
							SDK Sample App
						</MenuItem>
						<MenuItem
							icon={<FiSettings />}
							active={isActive('/advanced-config')}
							onClick={() => handleNavigation('/advanced-config')}
						>
							Advanced Configuration
						</MenuItem>
					</SubMenu>

					{/* Documentation */}
					<SubMenu
						label="Documentation"
						icon={<ColoredIcon $color="#3b82f6"><FiFileText /></ColoredIcon>}
						open={openMenus['Documentation']}
						onOpenChange={() => toggleMenu('Documentation')}
					>
						<MenuItem
							icon={<FiFileText />}
							active={isActive('/documentation')}
							onClick={() => handleNavigation('/documentation')}
						>
							Local Documentation
						</MenuItem>
						<MenuItem
							icon={<FiFileText />}
							active={isActive('/docs/oidc-specs')}
							onClick={() => handleNavigation('/docs/oidc-specs')}
						>
							OIDC Specs
						</MenuItem>
						<MenuItem
							icon={<FiFileText />}
							active={isActive('/docs/oidc-for-ai')}
							onClick={() => handleNavigation('/docs/oidc-for-ai')}
						>
							OIDC for AI
						</MenuItem>
						<MenuItem
							icon={<FiShield />}
							active={isActive('/docs/oauth2-security-best-practices')}
							onClick={() => handleNavigation('/docs/oauth2-security-best-practices')}
						>
							OAuth 2.0 Security Best Practices
						</MenuItem>
						<MenuItem
							icon={<FiExternalLink />}
							onClick={() => {
								window.open(
									'https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2',
									'_blank'
								);
								onClose();
							}}
						>
							PingOne API Docs
						</MenuItem>
						<MenuItem
							icon={<FiExternalLink />}
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
