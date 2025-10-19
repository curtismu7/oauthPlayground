import React, { useEffect, useRef, useState } from 'react';
import {
	FiBook,
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
	FiRefreshCw,
	FiSearch,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiTool,
	FiUser,
	FiUsers,
	FiX,
	FiZap,
	FiCheckCircle,
	FiCode,
} from 'react-icons/fi';
import { Menu, MenuItem, Sidebar as ProSidebar, SubMenu } from 'react-pro-sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

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

// Migration status badge for flows that have been migrated
const MigrationBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-left: auto;
	padding-left: 0.5rem;
	color: #10b981;
	font-size: 0.875rem;
	
	svg {
		width: 16px;
		height: 16px;
	}
`;

// Wrapper for menu item content with badge
const MenuItemContent = styled.span`
	display: flex;
	align-items: center;
	width: 100%;
	gap: 0.5rem;
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
	}


		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;

		&:hover {
			background: #f3f4f6;
		}
	}

	/* Dark green background for V6 flows - maximum specificity - Updated Oct 10 2025 10:30 AM - FORCE REFRESH */
	.ps-sidebar .ps-menu-button.v6-flow,
	.ps-sidebar .ps-menu-button.v6-flow[style],
	.ps-sidebar .ps-menu-button.v6-flow[style*="background"] {
		background: #047857 !important;
		border-left: 4px solid #059669 !important;
		color: #ffffff !important;
		position: relative !important;
		font-weight: 600 !important;
	}

	.ps-sidebar .ps-menu-button.v6-flow:hover,
	.ps-sidebar .ps-menu-button.v6-flow:hover[style] {
		background: #dcfce7 !important;
		color: #15803d !important;
		transform: translateX(2px) !important;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4) !important;
	}

	.ps-sidebar .ps-menu-button.v6-flow.ps-active,
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style],
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style*="background"],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow,
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style*="background"] {
		background: #064e3b !important;
		color: #ffffff !important;
		border-right: 4px solid #10b981 !important;
		border-left: 4px solid #10b981 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
	}

	/* Override any inline styles for V6 flows */
	.ps-sidebar .ps-menu-button.v6-flow[style*="background"] {
		background: #047857 !important;
	}

	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style*="background"] {
		background: #064e3b !important;
	}

	.ps-menu-button.ps-active {
		background: #fef2f2 !important;
		color: #dc2626 !important;
		border-right: 3px solid #dc2626 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
		position: relative !important;
	}

	.ps-menu-button:hover {
		transform: translateX(2px) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
	}

	/* ULTRA-HIGH SPECIFICITY V6 FLOW OVERRIDES - MUST BE AFTER GENERAL RULES - Updated Oct 10 2025 10:30 AM - FORCE REFRESH */
	.ps-sidebar .ps-menu-button.v6-flow.ps-active,
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style],
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style*="background"],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow,
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style*="background"],
	.ps-sidebar .ps-menu-button.v6-flow.ps-active:hover,
	.ps-sidebar .ps-menu-button.v6-flow.ps-active:hover[style] {
		background: #064e3b !important;
		color: #ffffff !important;
		border-right: 4px solid #10b981 !important;
		border-left: 4px solid #10b981 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
		position: relative !important;
	}

	/* NUCLEAR OPTION - HIGHEST SPECIFICITY POSSIBLE - Updated Oct 10 2025 10:30 AM */
	body .ps-sidebar .ps-menu-button.v6-flow,
	body .ps-sidebar .ps-menu-button.v6-flow[style],
	body .ps-sidebar .ps-menu-button.v6-flow[style*="background"] {
		background: #047857 !important;
		border-left: 4px solid #059669 !important;
		color: #ffffff !important;
		position: relative !important;
		font-weight: 600 !important;
	}

	body .ps-sidebar .ps-menu-button.v6-flow:hover,
	body .ps-sidebar .ps-menu-button.v6-flow:hover[style] {
		background: #dcfce7 !important;
		color: #15803d !important;
		transform: translateX(2px) !important;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4) !important;
	}

	body .ps-sidebar .ps-menu-button.v6-flow.ps-active,
	body .ps-sidebar .ps-menu-button.v6-flow.ps-active[style],
	body .ps-sidebar .ps-menu-button.ps-active.v6-flow,
	body .ps-sidebar .ps-menu-button.ps-active.v6-flow[style] {
		background: #064e3b !important;
		color: #ffffff !important;
		border-right: 4px solid #10b981 !important;
		border-left: 4px solid #10b981 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
		position: relative !important;
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
	
	// Force re-render timestamp for CSS updates
	const renderTimestamp = Date.now();
	
	// Helper function to get V6 flow styles
	const getV6FlowStyles = (isActive: boolean) => ({
		background: '#dcfce7', // Light green for all V6 flows
		color: '#166534', // Dark green text
		borderLeft: '3px solid #22c55e',
		borderRight: isActive ? '3px solid #22c55e' : undefined, // Green border for active
		fontWeight: isActive ? '700' : '600',
		transition: 'all 0.2s ease',
		cursor: 'pointer'
	});

	// Helper function to get V6 flow hover styles
	const getV6FlowHoverStyles = () => ({
		background: '#bbf7d0', // Light green hover
		color: '#15803d', // Dark green text
		transform: 'translateX(2px)',
		boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)' // Green shadow
	});

	// Helper function to create V6 menu item props
	const createV6MenuItemProps = (path: string, additionalPaths: string[] = []) => {
		const isActiveState = isActive(path) || additionalPaths.some(p => isActive(p));
		return {
			className: 'v6-flow',
			style: getV6FlowStyles(isActiveState)
		};
	};

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
			'OpenID Connect': true,
			PingOne: false,
			'Mock & Demo Flows': false,
			'Artificial Intelligence': false,
			'Security & Management': false,
			'Tools & Utilities': false,
			Documentation: false,
			'Developers': false,
		};
	});

	const isActive = (path: string) => location.pathname === path;

	// Get friendly flow name from path for toast notification
	const getFlowName = (path: string): string | undefined => {
		const flowNames: Record<string, string> = {
			'/dashboard': 'Dashboard',
			'/configuration': 'Configuration',
			'/flows/oauth-authorization-code-v6': 'OAuth Authorization Code',
			'/flows/oauth-authorization-code-v7': 'Authorization Code V7',
			'/flows/oauth-authorization-code-v7-1': 'Authorization Code V7.1',
			'/flows/oauth-authorization-code-v7-2': 'Authorization Code V7.2',
			'/flows/oauth2-compliant-authorization-code': 'RFC 6749 Compliant OAuth 2.0',
			'/flows/oidc-compliant-authorization-code': 'OIDC Core 1.0 Compliant',
			'/flows/oauth-implicit-v6': 'OAuth Implicit Flow',
			'/flows/oidc-authorization-code-v6': 'OIDC Authorization Code',
			'/flows/oidc-implicit-v6': 'OIDC Implicit Flow',
			'/flows/oidc-hybrid-v6': 'OIDC Hybrid Flow',
			'/flows/oidc-hybrid-v7': 'Hybrid Flow V7',
			'/flows/implicit-v7': 'Implicit Flow V7',
			'/flows/token-exchange-v7': 'Token Exchange V7',
			'/flows/device-authorization-v7': 'Device Authorization V7',
			'/oidc-overview': 'OIDC Overview',
			'/auto-discover': 'Auto Discover',
			'/flows/oidc-ciba-v6': 'OIDC CIBA Flow V6',
			'/flows/client-credentials-v6': 'Client Credentials',
			'/flows/client-credentials-v7': 'OAuth Client Credentials (V7)',
			'/flows/oauth-ropc-v7': 'OAuth Resource Owner Password (V7)',
			'/flows/device-authorization-v6': 'Device Authorization',
			'/flows/oidc-device-authorization-v6': 'OIDC Device Authorization',
			'/flows/worker-token-v6': 'Worker Token',
			'/flows/jwt-bearer-token-v6': 'JWT Bearer Token',
			'/flows/jwt-bearer-token-v7': 'JWT Bearer Token V7',
			'/flows/saml-bearer-assertion-v7': 'SAML Bearer Assertion V7',
			'/flows/advanced-oauth-params-demo': 'Advanced OAuth Parameters Demo',
			'/flows/pingone-par-v6': 'PingOne PAR',
			'/flows/redirectless-v6-real': 'Redirectless Flow V6',
			'/flows/pingone-mfa-v6': 'PingOne MFA V6',
			'/flows/rar-v6': 'Rich Authorization Request',
			'/flows/resource-owner-password-v6': 'Resource Owner Password',
			'/flows/pingone-complete-mfa-v7': 'PingOne Complete MFA Flow V7',
			'/pingone-authentication': 'PingOne Authentication',
			'/pingone-mock-features': 'PingOne Mock Features',
		};
		return flowNames[path];
	};

	const handleNavigation = (path: string) => {
		console.log('Navigating to:', path);
		
		// Don't show toast if navigating to same page
		if (location.pathname !== path) {
			const flowName = getFlowName(path);
			console.log('Flow name:', flowName);
			if (!flowName && path.startsWith('/flows/')) {
				v4ToastManager.showError('Unable to locate that flow. Please verify the menu configuration.');
				return;
			}
			if (flowName) {
				// Show brief toast notification using showSuccess (no showInfo method exists)
				v4ToastManager.showSuccess(`Switched to ${flowName}`, {}, { duration: 1500 });
			}
		}
		
		// Navigate immediately without scrolling the menu
		navigate(path);
		// Close sidebar after navigation
		setTimeout(() => {
			onClose();
		}, 150);
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
			<ProSidebar key={`sidebar-${renderTimestamp}`} width={`${sidebarWidth}px`}>
				<SidebarHeader>
					PingOne OAuth Playground
					<CloseButton onClick={onClose}>
						<FiX size={20} />
					</CloseButton>
				</SidebarHeader>

				<Menu
					menuItemStyles={{
						button: ({ active, className }) => {
							const isV6 = className?.includes('v6-flow');
							if (isV6) {
								// Debug: Log V6 flow detection
								console.log('🎯 [Sidebar] V6 Flow detected:', {
									className,
									active,
									path: window.location.pathname
								});
								// V6 flows - minimal inline styles, let CSS handle the rest
								return {
									fontSize: '0.875rem',
									padding: '10px 16px',
									// Don't override background, color, or borders - let CSS handle it
								};
							}
							// V5 flows - use inline styles for non-V6 flows
							return {
								backgroundColor: active ? '#dbeafe' : undefined,
								color: active ? '#1e40af' : '#4b5563',
								borderRight: active ? '3px solid #3b82f6' : undefined,
								fontSize: '0.875rem',
								padding: '10px 16px',
								fontWeight: active ? '700' : '500',
								transition: 'all 0.2s ease',
								'&:hover': {
									backgroundColor: '#f3f4f6',
									transform: 'translateX(2px)',
								},
							};
						},
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

					{/* OAuth 2.0 Flows - OAuth-only flows */}
					<SubMenu
						label="OAuth 2.0 Flows"
						icon={<ColoredIcon $color="#ef4444"><FiShield /></ColoredIcon>}
						open={openMenus['OAuth 2.0 Flows']}
						onOpenChange={() => toggleMenu('OAuth 2.0 Flows')}
					>
					{/* Authorization Code (V7) - Unified OAuth/OIDC */}
					<MenuItem
						icon={<ColoredIcon $color="#22d3ee"><FiKey /></ColoredIcon>}
						active={isActive('/flows/oauth-authorization-code-v7')}
						onClick={() => handleNavigation('/flows/oauth-authorization-code-v7')}
						{...createV6MenuItemProps('/flows/oauth-authorization-code-v7')}
					>
						<MenuItemContent>
							<span>Authorization Code (V7)</span>
							<MigrationBadge title="V7: Unified OAuth/OIDC authorization code experience">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

					{/* Authorization Code (V7.1) - Refactored */}
					<MenuItem
						icon={<ColoredIcon $color="#10b981"><FiKey /></ColoredIcon>}
						active={isActive('/flows/oauth-authorization-code-v7-1')}
						onClick={() => handleNavigation('/flows/oauth-authorization-code-v7-1')}
						className="v7-flow"
						style={{
							background: isActive('/flows/oauth-authorization-code-v7-1') ? '#f0fdf4' : 'transparent',
							borderLeft: isActive('/flows/oauth-authorization-code-v7-1') ? '3px solid #10b981' : '3px solid transparent',
						}}
					>
						<MenuItemContent>
							<span>Authorization Code (V7.1)</span>
							<MigrationBadge title="V7.1: Refactored with modular components, error boundaries, and performance monitoring">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

					{/* Authorization Code (V7.2) - Original UI */}
					<MenuItem
						icon={<ColoredIcon $color="#f97316"><FiKey /></ColoredIcon>}
						active={isActive('/flows/oauth-authorization-code-v7-2')}
						onClick={() => handleNavigation('/flows/oauth-authorization-code-v7-2')}
						className="v7-flow"
						style={{
							background: isActive('/flows/oauth-authorization-code-v7-2') ? '#fff7ed' : 'transparent',
							borderLeft: isActive('/flows/oauth-authorization-code-v7-2') ? '3px solid #f97316' : '3px solid transparent',
						}}
					>
						<MenuItemContent>
							<span>Authorization Code (V7.2)</span>
							<MigrationBadge title="V7.2: Original V7 UI with minimal architectural improvements" style={{ background: '#f97316', color: '#ffffff' }}>
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

					{/* Implicit Flow (V7) - Unified OAuth/OIDC */}
					<MenuItem
						icon={<ColoredIcon $color="#7c3aed"><FiZap /></ColoredIcon>}
						active={isActive('/flows/implicit-v7')}
						onClick={() => handleNavigation('/flows/implicit-v7')}
						className="v6-flow"
						style={getV6FlowStyles(isActive('/flows/implicit-v7'))}
					>
						<MenuItemContent>
							<span>Implicit Flow (V7)</span>
							<MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

					{/* Device Authorization (V7) - Unified OAuth/OIDC */}
					<MenuItem
						icon={<ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>}
						active={isActive('/flows/device-authorization-v7')}
						onClick={() => handleNavigation('/flows/device-authorization-v7')}
						className="v6-flow"
						style={getV6FlowStyles(isActive('/flows/device-authorization-v7'))}
					>
						<MenuItemContent>
							<span>Device Authorization (V7)</span>
							<MigrationBadge title="V7: Unified OAuth/OIDC device authorization for TVs, IoT devices, and CLI tools">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>


					{/* V7 OAuth Flows */}
					<MenuItem
						icon={<ColoredIcon $color="#10b981"><FiKey /></ColoredIcon>}
						active={isActive('/flows/client-credentials-v7')}
						onClick={() => handleNavigation('/flows/client-credentials-v7')}
					>
						<MenuItemContent>
							<span>OAuth Client Credentials (V7)</span>
							<MigrationBadge 
								title="V7: Enhanced OAuth Client Credentials with modern UI"
								style={{
									backgroundColor: '#10b981',
									color: 'white',
									border: 'none',
									fontWeight: 'normal',
								}}
							>
								V7
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

					<MenuItem
						icon={<ColoredIcon $color="#10b981"><FiLock /></ColoredIcon>}
						active={isActive('/flows/oauth-ropc-v7')}
						onClick={() => handleNavigation('/flows/oauth-ropc-v7')}
					>
						<MenuItemContent>
							<span>OAuth Resource Owner Password (V7)</span>
							<MigrationBadge 
								title="V7: OAuth Resource Owner Password Credentials with enhanced UI"
								style={{
									backgroundColor: '#10b981',
									color: 'white',
									border: 'none',
									fontWeight: 'normal',
								}}
							>
								V7
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

					{/* Token Exchange (V7) - RFC 8693 OAuth Extension */}
					<MenuItem
						icon={<ColoredIcon $color="#7c3aed"><FiRefreshCw /></ColoredIcon>}
						active={isActive('/flows/token-exchange-v7')}
						onClick={() => handleNavigation('/flows/token-exchange-v7')}
						className="v6-flow"
						style={getV6FlowStyles(isActive('/flows/token-exchange-v7'))}
					>
						<MenuItemContent>
							<span>Token Exchange (V7)</span>
							<MigrationBadge title="V7: RFC 8693 Token Exchange for A2A Security">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
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
							icon={<ColoredIcon $color="#22d3ee"><FiKey /></ColoredIcon>}
							active={isActive('/flows/oauth-authorization-code-v7')}
							onClick={() => handleNavigation('/flows/oauth-authorization-code-v7')}
							{...createV6MenuItemProps('/flows/oauth-authorization-code-v7')}
						>
						<MenuItemContent>
							<span>Authorization Code (V7)</span>
							<MigrationBadge title="V7: Unified OAuth/OIDC authorization code experience">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>

						<MenuItem
							icon={<ColoredIcon $color="#7c3aed"><FiZap /></ColoredIcon>}
							active={isActive('/flows/implicit-v7')}
							onClick={() => handleNavigation('/flows/implicit-v7')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/implicit-v7'))}
						>
						<MenuItemContent>
							<span>Implicit Flow (V7)</span>
							<MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#22c55e"><FiGitBranch /></ColoredIcon>}
							active={isActive('/flows/oidc-hybrid-v7')}
							onClick={() => handleNavigation('/flows/oidc-hybrid-v7')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/oidc-hybrid-v7'))}
						>
						<MenuItemContent>
							<span>Hybrid Flow (V7)</span>
							<MigrationBadge title="V7: Unified OAuth/OIDC hybrid flow implementation">
								<FiCheckCircle />
							</MigrationBadge>
						</MenuItemContent>
					</MenuItem>
						{/* V3 Hybrid Flow - Hidden, use V5 instead */}
						{/* <MenuItem
							active={isActive('/flows/oidc-hybrid-v3')}
							onClick={() => handleNavigation('/flows/oidc-hybrid-v3')}
						>
							Hybrid Flow (V3)
						</MenuItem> */}

						<MenuItem
							icon={<ColoredIcon $color="#8b5cf6"><FiShield /></ColoredIcon>}
							active={isActive('/flows/jwt-bearer-token-v7')}
							onClick={() => handleNavigation('/flows/jwt-bearer-token-v7')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/jwt-bearer-token-v7'))}
						>
							<MenuItemContent>
								<span>JWT Bearer Token (V7)</span>
								<MigrationBadge title="V7: JWT Bearer with PingFederate/PingOne AIS examples">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>

						{/* OIDC Documentation & Discovery */}
						<MenuItem
							icon={<ColoredIcon $color="#10b981"><FiBook /></ColoredIcon>}
							active={isActive('/oidc-overview')}
							onClick={() => handleNavigation('/oidc-overview')}
						>
							<MenuItemContent>
								<span>OIDC Overview</span>
								<MigrationBadge title="OpenID Connect specification overview and fundamentals">
									<FiBook />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>

						<MenuItem
							icon={<ColoredIcon $color="#06b6d4"><FiSearch /></ColoredIcon>}
							active={isActive('/auto-discover')}
							onClick={() => handleNavigation('/auto-discover')}
						>
							<MenuItemContent>
								<span>Auto Discover</span>
								<MigrationBadge title="OIDC Discovery - Well-known configuration endpoint">
									<FiSearch />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>

						<MenuItem
							icon={<ColoredIcon $color="#8b5cf6"><FiShield /></ColoredIcon>}
							active={isActive('/flows/oidc-ciba-v6')}
							onClick={() => handleNavigation('/flows/oidc-ciba-v6')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/oidc-ciba-v6'))}
						>
							<MenuItemContent>
								<span>OIDC CIBA Flow (V6)</span>
								<MigrationBadge title="V6: Client Initiated Backchannel Authentication">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>
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
							active={isActive('/flows/worker-token-v6')}
							onClick={() => handleNavigation('/flows/worker-token-v6')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/worker-token-v6'))}
							onMouseEnter={(e) => Object.assign(e.currentTarget.style, getV6FlowHoverStyles(isActive('/flows/worker-token-v6')))}
							onMouseLeave={(e) => Object.assign(e.currentTarget.style, getV6FlowStyles(isActive('/flows/worker-token-v6')))}
						>
							<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
								Worker Token (V6)
								<MigrationBadge>
									<FiUsers size={12} />
									V6: PingOne Worker App
								</MigrationBadge>
							</span>
						</MenuItem>
							<MenuItem
								icon={<ColoredIcon $color="#ea580c"><FiLock /></ColoredIcon>}
								active={isActive('/flows/pingone-par-v6') || isActive('/flows/pingone-par-v5')}
								onClick={() => handleNavigation('/flows/pingone-par-v6')}
								className="v6-flow"
								style={getV6FlowStyles(isActive('/flows/pingone-par-v6') || isActive('/flows/pingone-par-v5'))}
							>
							<MenuItemContent>
								<span>PAR (V6)</span>
								<MigrationBadge title="V6: Service Architecture + PAR Education">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>
							<MenuItem
								icon={<ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>}
								active={isActive('/flows/redirectless-v6-real') || isActive('/flows/redirectless-flow-v5') || isActive('/flows/redirectless-v6')}
								onClick={() => handleNavigation('/flows/redirectless-v6-real')}
								className="v6-flow"
								style={getV6FlowStyles(isActive('/flows/redirectless-v6-real') || isActive('/flows/redirectless-flow-v5') || isActive('/flows/redirectless-v6'))}
							>
							<MenuItemContent>
								<span>Redirectless Flow V6</span>
								<MigrationBadge title="V6: Service Architecture + pi.flow Education">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
							</MenuItem>

						<MenuItem
							icon={<ColoredIcon $color="#16a34a"><FiShield /></ColoredIcon>}
							active={isActive('/flows/pingone-mfa-v6')}
							onClick={() => handleNavigation('/flows/pingone-mfa-v6')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/pingone-mfa-v6'))}
						>
							<MenuItemContent>
								<span>PingOne MFA (V6)</span>
								<MigrationBadge title="V6: Modern MFA flow with enhanced UX and comprehensive educational content">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#f59e0b"><FiBookOpen /></ColoredIcon>}
							active={isActive('/pingone-mock-features')}
							onClick={() => handleNavigation('/pingone-mock-features')}
						>
							Mock & Educational Features
						</MenuItem>

						{/* V7 PingOne Flows */}
						<MenuItem
							icon={<ColoredIcon $color="#16a34a"><FiShield /></ColoredIcon>}
							active={isActive('/flows/pingone-complete-mfa-v7')}
							onClick={() => handleNavigation('/flows/pingone-complete-mfa-v7')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/pingone-complete-mfa-v7'))}
						>
							<MenuItemContent>
								<span>PingOne Complete MFA Flow (V7)</span>
								<MigrationBadge title="V7: Complete MFA authentication flow with V6 architecture, comprehensive device management, security monitoring, and accessibility features">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>

						<MenuItem
							icon={<ColoredIcon $color="#f59e0b"><FiUser /></ColoredIcon>}
							active={isActive('/pingone-authentication')}
							onClick={() => handleNavigation('/pingone-authentication')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/pingone-authentication'))}
						>
							<MenuItemContent>
								<span>PingOne Authentication</span>
								<MigrationBadge title="V7: Dedicated authentication page with inline and popup modes">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>

						{/* Enterprise SAML Flow */}
						<MenuItem
							icon={<ColoredIcon $color="#8b5cf6"><FiShield /></ColoredIcon>}
							active={isActive('/flows/saml-bearer-assertion-v7')}
							onClick={() => handleNavigation('/flows/saml-bearer-assertion-v7')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/saml-bearer-assertion-v7'))}
						>
							<MenuItemContent>
								<span>SAML Bearer Assertion (V7)</span>
								<MigrationBadge title="V7: SAML Bearer with PingFederate/PingOne AIS examples">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
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
							icon={<ColoredIcon $color="#3b82f6"><FiSettings /></ColoredIcon>}
							active={isActive('/flows/advanced-oauth-params-demo')}
							onClick={() => handleNavigation('/flows/advanced-oauth-params-demo')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/advanced-oauth-params-demo'))}
						>
							<MenuItemContent>
								<span>Advanced OAuth Parameters Demo</span>
								<MigrationBadge title="Demonstrates all OAuth/OIDC advanced parameters with mock responses">
									<FiBookOpen />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#dc2626"><FiKey /></ColoredIcon>}
							active={isActive('/flows/oauth2-resource-owner-password-v6')}
							onClick={() => handleNavigation('/flows/oauth2-resource-owner-password-v6')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/oauth2-resource-owner-password-v6'))}
						>
							<MenuItemContent>
								<span>ROPC (Mock) (V6)</span>
								<MigrationBadge title="V6: Hybrid implementation - V5 controller with V6 layout and styling">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>
						<MenuItem
							icon={<ColoredIcon $color="#fbbf24"><FiSmartphone /></ColoredIcon>}
							active={isActive('/flows/ciba-v6')}
							onClick={() => handleNavigation('/flows/ciba-v6')}
							className="v6-flow"
							style={getV6FlowStyles(isActive('/flows/ciba-v6'))}
						>
							<MenuItemContent>
								<span>CIBA Flow (Mock) (V6)</span>
								<MigrationBadge title="V6: Educational CIBA implementation - PingOne does not support CIBA">
									<FiBookOpen />
								</MigrationBadge>
							</MenuItemContent>
						</MenuItem>
							<MenuItem
								icon={<FiEye />}
								active={isActive('/flows/rar-v6') || isActive('/flows/rar-v5')}
								onClick={() => handleNavigation('/flows/rar-v6')}
								className="v6-flow"
								style={getV6FlowStyles(isActive('/flows/rar-v6') || isActive('/flows/rar-v5'))}
							>
							<MenuItemContent>
								<span>RAR (V6)</span>
								<MigrationBadge title="V6: Service Architecture + RAR Education">
									<FiCheckCircle />
								</MigrationBadge>
							</MenuItemContent>
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
							icon={<FiGitBranch />}
							active={isActive('/emerging-ai-standards')}
							onClick={() => handleNavigation('/emerging-ai-standards')}
						>
							Emerging AI Standards
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
						<MenuItem
							icon={<FiExternalLink />}
							onClick={() => {
								window.open('https://docs.google.com/presentation/d/1xiLl0VdrlNMAei8pmaX4ojIOfej6lhvZbOIK7Z6C-Go/edit?usp=sharing', '_blank');
								onClose();
							}}
						>
							State of AI Report - 2025 ONLINE
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

{/* Developers */}
<SubMenu
label="Developers"
icon={<ColoredIcon $color="#06b6d4"><FiCode /></ColoredIcon>}
open={openMenus['Developers']}
onOpenChange={() => toggleMenu('Developers')}
>
<MenuItem
icon={<FiPackage />}
onClick={() => {
window.open('https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2', '_blank');
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
<MenuItem
icon={<FiExternalLink />}
onClick={() => {
window.open('https://developer.pingidentity.com/ai/', '_blank');
onClose();
}}
>
Ping Identity AI for Developers
</MenuItem>
<MenuItem
icon={<FiEye />}
active={isActive('/code-examples-demo')}
onClick={() => handleNavigation('/code-examples-demo')}
>
Code Examples
</MenuItem>
</SubMenu>
				</Menu>
			</ProSidebar>
		</SidebarContainer>
	);
};

export default Sidebar;
