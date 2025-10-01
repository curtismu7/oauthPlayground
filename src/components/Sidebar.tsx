import React, { useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiBook,
	FiBookOpen,
	FiChevronDown,
	FiChevronRight,
	FiCode,
	FiCpu,
	FiExternalLink,
	FiGithub,
	FiGlobe,
	FiHome,
	FiInfo,
	FiKey,
	FiLock,
	FiSearch,
	FiServer,
	FiSettings,
	FiShield,
	FiTool,
	FiUser,
	FiZap,
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
interface SidebarContainerProps {
	$isOpen?: boolean;
}

interface SubmenuProps {
	$isOpen?: boolean;
}

interface NavItemHeaderProps {
	$isOpen?: boolean;
}

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

const SidebarContainer = styled.aside<SidebarContainerProps>`
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 320px;
  background-color: #f1f5f9; /* Darker light grey background */
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 900;
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 1rem 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints?.lg || '1024px'}) {
    transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

const NavSection = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const NavSectionTitle = styled.h3`
  font-size: 0.75rem;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors?.gray600 || '#6b7280'};
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 0 1.5rem;
  margin: 1.5rem 0 0.5rem;
`;

const NavItem = styled(Link)<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: ${({ $isActive, theme }) =>
		$isActive ? '#ffffff' : (theme.colors?.gray700 || '#374151')};
  text-decoration: none;
  transition: all 0.2s;
  font-weight: ${({ $isActive }) => ($isActive ? '600' : '500')};
  background-color: ${({ $isActive, theme }) =>
		$isActive ? (theme.colors?.primary || '#0070cc') : 'transparent'};
  border-right: ${({ $isActive, theme }) =>
		$isActive ? `3px solid ${theme.colors?.primary || '#0070cc'}` : '3px solid transparent'};
  
  &:hover {
    background-color: ${({ $isActive, theme }) =>
			$isActive ? (theme.colors?.primaryDark || '#0056b3') : (theme.colors?.gray100 || '#f3f4f6')};
    color: ${({ $isActive, theme }) =>
			$isActive ? '#ffffff' : (theme.colors?.primary || '#0070cc')};
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.25rem;
    color: ${({ $isActive, theme }) => ($isActive ? '#ffffff' : 'inherit')};
  }
`;

const Submenu = styled.div<SubmenuProps>`
  overflow: hidden;
  max-height: ${({ $isOpen }) => ($isOpen ? '500px' : '0')};
  transition: max-height 0.3s ease-in-out;
`;

const SubmenuItem = styled(Link)<{ $isActive?: boolean; $isV4?: boolean; $isV5?: boolean; $isWarning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 1.5rem 0.5rem 3.5rem;
  color: ${({ $isActive, $isV4, $isV5, $isWarning, theme }) =>
		$isActive
			? '#ffffff'
			: $isWarning
				? '#dc2626' // Red color for warning/unsupported flows
				: $isV5
					? '#059669' // Green color for V5 flows
					: $isV4
						? '#dc2626' // Red color for V4
						: theme.colors?.gray700 || '#374151'};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: ${({ $isActive, $isV4, $isV5, $isWarning }) => ($isActive || $isV4 || $isV5 || $isWarning ? '700' : '400')}; // Bold for V4, V5, and Warning
  transition: all 0.2s;
  background-color: ${({ $isActive, theme }) =>
		$isActive ? (theme.colors?.primary || '#0070cc') : 'transparent'};
  border-left: ${({ $isActive, $isV5, $isWarning, theme }) =>
		$isActive
			? `4px solid ${theme.colors?.primary || '#0070cc'}`
			: $isWarning
				? '4px solid #dc2626' // Red left border for warning/unsupported flows
				: $isV5
					? '4px solid #059669' // Green left border for V5
					: '4px solid transparent'};
  position: relative;
  
  &:hover {
    background-color: ${({ $isActive, $isV4, $isV5, $isWarning, theme }) =>
			$isActive
				? (theme.colors?.primaryDark || '#0056b3')
				: $isWarning
					? '#fef2f2' // Light red background on hover for warning/unsupported flows
					: $isV5
						? '#d1fae5' // Light green background on hover for V5
						: $isV4
							? '#fef2f2' // Light red background on hover for V4
							: theme.colors?.gray50 || '#f9fafb'};
    color: ${({ $isActive, $isV4, $isV5, $isWarning, theme }) =>
			$isActive
				? '#ffffff'
				: $isWarning
					? '#b91c1c' // Darker red on hover for warning/unsupported flows
					: $isV5
						? '#047857' // Darker green on hover for V5
						: $isV4
							? '#b91c1c' // Darker red on hover for V4
							: theme.colors?.primary || '#0070cc'};
  }

  ${({ $isActive, theme }) =>
		$isActive &&
		`
    box-shadow: 0 0 0 2px ${theme.colors?.primary || '#0070cc'}20,
                0 0 20px ${theme.colors?.primary || '#0070cc'}30;
    transform: translateX(4px);
  `}
  
  &:before {
    content: '';
    margin-right: 0.75rem;
    font-size: 1.5rem;
    line-height: 0;
    color: ${({ $isActive, $isV4, $isV5, $isWarning, theme }) =>
			$isActive
				? '#ffffff'
				: $isWarning
					? '#dc2626' // Red color for warning/unsupported flows
					: $isV5
						? '#059669' // Green color for V5
						: $isV4
							? '#dc2626' // Red color for V4
							: theme.colors?.gray400 || '#9ca3af'};
  }

  svg {
    color: ${({ $isActive, $isV4, $isV5, $isWarning, theme }) =>
			$isActive
				? '#ffffff'
				: $isWarning
					? '#dc2626' // Red color for warning/unsupported flows arrow
					: $isV5
						? '#059669' // Green color for V5 arrow
						: $isV4
							? '#dc2626' // Red color for V4 arrow
							: theme.colors?.gray400 || '#9ca3af'};
    font-size: 1rem;
    transition: color 0.2s;
    
    /* Right-aligned icons (arrows) */
    &:last-child {
      margin-left: auto;
      margin-right: 0;
    }
  }
`;

const NavItemWithSubmenu = styled.div`
  cursor: pointer;
  user-select: none;
`;

// Colored icon components for Resources menu
const ColoredIcon = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  background: ${(props) => props.color};
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
`;

const TokenIcon = () => <ColoredIcon color="#3b82f6"></ColoredIcon>;
const DiscoveryIcon = () => <ColoredIcon color="#10b981"></ColoredIcon>;
const PARIcon = () => <ColoredIcon color="#f59e0b"></ColoredIcon>;
const CompareIcon = () => <ColoredIcon color="#8b5cf6"></ColoredIcon>;
const DiagramsIcon = () => <ColoredIcon color="#ef4444"></ColoredIcon>;
const TestIcon = () => <ColoredIcon color="#06b6d4"></ColoredIcon>;
const JWTIcon = () => <ColoredIcon color="#84cc16"></ColoredIcon>;
const SessionIcon = () => <ColoredIcon color="#f97316"></ColoredIcon>;
const SDKIcon = () => <ColoredIcon color="#6366f1"></ColoredIcon>;

const NavItemHeader = styled.div<NavItemHeaderProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  color: ${({ theme }) => theme.colors?.gray700 || '#374151'};
  font-weight: 500;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors?.gray100 || '#f3f4f6'};
    color: ${({ theme }) => theme.colors?.primary || '#0070cc'};
  }
  
  svg:first-child {
    margin-right: 0.75rem;
  }
  
  svg:last-child {
    transition: all 0.2s ease;
    transform: rotate(${({ $isOpen }) => ($isOpen ? '0deg' : '-90deg')});
    opacity: 1;
    font-size: 1.5rem;
    color: white;
    padding: 0.4rem;
    border-radius: 6px;
    background: #3b82f6;
    border: 2px solid #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    cursor: pointer;
    
    &:hover {
      color: #1d4ed8;
      background: #dbeafe;
      border-color: #1d4ed8;
      transform: rotate(${({ $isOpen }) => ($isOpen ? '0deg' : '-90deg')}) scale(1.1);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }
    
    &:active {
      transform: rotate(${({ $isOpen }) => ($isOpen ? '0deg' : '-90deg')}) scale(1.05);
    }
  }
`;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	const location = useLocation();

	// Helper function to check if a route is active
	const isActiveRoute = (path: string): boolean => {
		if (path === '/dashboard' && location.pathname === '/') return true;
		if (path === location.pathname) return true;
		// For submenu items, check if current path starts with the route
		if (location.pathname.startsWith(path) && path !== '/') return true;
		return false;
	};

	// Load persisted menu state from localStorage
	const [openMenus, setOpenMenus] = useState(() => {
		try {
			const saved = localStorage.getItem('nav.openSections');
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					oauth: parsed.oauth ?? true, // Default to expanded
					oidc: parsed.oidc ?? true, // Default to expanded
					'pingone-tokens': parsed['pingone-tokens'] ?? true, // Default to expanded
					resources: parsed.resources ?? true, // Default to expanded
					docs: parsed.docs ?? false, // Default to collapsed
				};
			}
		} catch (error) {
			console.warn('Failed to load navigation state from localStorage:', error);
		}
		return {
			oauth: true, // Default to expanded
			oidc: true, // Default to expanded
			unsupported: false, // Default to collapsed
			'pingone-tokens': true, // Default to expanded
			resources: true, // Default to expanded
			docs: false, // Default to collapsed
		};
	});

	// Auto-open menu based on current route and persist state
	useEffect(() => {
		const path = location.pathname;
		setOpenMenus((prev) => {
			const newState = {
				...prev,
				// Auto-expand if current route matches
				oauth: path.startsWith('/flows/') || prev.oauth,
				oidc: path.startsWith('/oidc') || prev.oidc,
				unsupported: path.startsWith('/flows/unsupported') || path.startsWith('/oauth/resource-owner-password') || prev.unsupported,
				'pingone-tokens': path.startsWith('/oidc/worker-token') || prev['pingone-tokens'],
				resources:
					path.startsWith('/oidc/userinfo') ||
					path.startsWith('/oidc/tokens') ||
					path.startsWith('/token-management') ||
					path.startsWith('/auto-discover') ||
					path.startsWith('/jwks-troubleshooting') ||
					path.startsWith('/url-decoder') ||
					path.startsWith('/documentation') ||
					path.startsWith('/flows/compare') ||
					path.startsWith('/flows/diagrams') ||
					path.startsWith('/flows/par') ||
					prev.resources,
				docs: path.startsWith('/docs') || prev.docs,
			};

			// Persist to localStorage
			try {
				localStorage.setItem('nav.openSections', JSON.stringify(newState));
			} catch (error) {
				console.warn('Failed to save navigation state to localStorage:', error);
			}

			return newState;
		});
	}, [location.pathname]);

	// Scroll active menu item into view when sidebar opens or route changes
	useEffect(() => {
		// Wait for menu to render (whether sidebar is open or not)
		setTimeout(() => {
			const activeItem = document.querySelector('a[data-active="true"]') as HTMLElement;
			const sidebarContainer = document.querySelector('aside') as HTMLElement;
			
			if (activeItem && sidebarContainer) {
				// Get positions
				const itemTop = activeItem.offsetTop;
				const sidebarHeight = sidebarContainer.clientHeight;
				const itemHeight = activeItem.clientHeight;
				
				// Calculate scroll position to center the item
				const scrollPosition = itemTop - (sidebarHeight / 2) + (itemHeight / 2);
				
				// Scroll the sidebar container
				sidebarContainer.scrollTo({
					top: scrollPosition,
					behavior: 'smooth',
				});
				
				console.log('📍 [Sidebar] Scrolled to active menu item:', location.pathname, {
					itemTop,
					scrollPosition,
				});
			}
		}, isOpen ? 200 : 100); // Longer delay if sidebar is opening
	}, [location.pathname, isOpen]);

	const toggleMenu = (menu: 'oauth' | 'oidc' | 'unsupported' | 'pingone-tokens' | 'resources' | 'docs') => {
		setOpenMenus((prev) => {
			const newState = {
				...prev,
				[menu]: !prev[menu],
			};

			// Persist to localStorage
			try {
				localStorage.setItem('nav.openSections', JSON.stringify(newState));
				console.log(`[ MENU] ${menu} toggled to ${newState[menu] ? 'expanded' : 'collapsed'}`);
			} catch (error) {
				console.warn('Failed to save navigation state to localStorage:', error);
			}

			return newState;
		});
	};

	return (
		<SidebarContainer $isOpen={isOpen}>
			{/* Quick Access Section */}
			<NavSection>
				<NavItem to="/dashboard" onClick={onClose} $isActive={isActiveRoute('/dashboard')}>
					<FiHome />
					<span>Dashboard</span>
				</NavItem>
				<NavItem to="/configuration" onClick={onClose} $isActive={isActiveRoute('/configuration')}>
					<FiSettings />
					<span>Settings</span>
				</NavItem>
				<NavItem to="/oauth-2-1" onClick={onClose} $isActive={isActiveRoute('/oauth-2-1')}>
					<FiShield />
					<span>OAuth 2.1</span>
				</NavItem>
			<NavItem to="/documentation/oidc-overview" onClick={onClose} $isActive={isActiveRoute('/documentation/oidc-overview')}>
				<FiBookOpen />
				<span>OIDC Overview</span>
			</NavItem>
			<NavItem to="/ai-glossary" onClick={onClose} $isActive={isActiveRoute('/ai-glossary')}>
				<FiBookOpen />
				<span>AI Glossary</span>
			</NavItem>
				<NavItem to="/ai-agent-overview" onClick={onClose} $isActive={isActiveRoute('/ai-agent-overview')}>
					<FiCpu />
					<span>AI Agent Overview for PingOne</span>
				</NavItem>
			<NavItem to="/comprehensive-oauth-education" onClick={onClose} $isActive={isActiveRoute('/comprehensive-oauth-education')}>
				<FiBookOpen />
				<span>Comprehensive OAuth AI Education</span>
			</NavItem>
			</NavSection>

			<NavSection>
				<NavSectionTitle>OAuth & OpenID Connect</NavSectionTitle>
				<NavItemWithSubmenu>
					<NavItemHeader onClick={() => toggleMenu('oauth')} $isOpen={openMenus.oauth}>
						<div>
							<FiShield />
							<span>OAuth 2.0 Flows</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus.oauth}>
						{/* V5 OAuth Flows - Highlighted with green */}
						<SubmenuItem
							to="/flows/oauth-authorization-code-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth-authorization-code-v5')}
							$isV5={true}
							data-active={isActiveRoute('/flows/oauth-authorization-code-v5')}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>OAuth 2.0 Authorization Code V5</span>
						</SubmenuItem>

						<SubmenuItem
							to="/flows/oauth-implicit-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth-implicit-v5')}
							$isV5={true}
							data-active={isActiveRoute('/flows/oauth-implicit-v5')}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>OAuth 2.0 Implicit Flow V5</span>
						</SubmenuItem>

						<SubmenuItem
							to="/flows/device-authorization-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/device-authorization-v5')}
							$isV5={true}
							data-active={isActiveRoute('/flows/device-authorization-v5')}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>OAuth Device Authorization Code V5</span>
						</SubmenuItem>

						{/* V5 Client Credentials - OAuth 2.0 only (not OIDC) */}
						<SubmenuItem
							to="/flows/client-credentials-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/client-credentials-v5')}
							$isV5={true}
						>
							<FiLock style={{ marginRight: '0.5rem' }} />
							<span>OAuth Client Credentials V5</span>
						</SubmenuItem>

						{/* Standard OAuth 2.0 Flows */}
						{/* V3 Implicit hidden - use V5 instead */}
						{/* <SubmenuItem
							to="/flows/oauth2-implicit-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth2-implicit-v3')}
						>
							OAuth 2.0 Implicit V3
						</SubmenuItem> */}
						{/* V3 Client Credentials hidden - use V5 instead */}
						{/* <SubmenuItem
							to="/flows/oauth2-client-credentials-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth2-client-credentials-v3')}
						>
							OAuth2 Client Credentials V3
						</SubmenuItem> */}
						{/* <SubmenuItem
							to="/flows-old/device-code"
							onClick={onClose}
							$isActive={isActiveRoute('/flows-old/device-code')}
						>
							OAuth 2.0 Device Code (Legacy - Hidden)
						</SubmenuItem> */}
						<SubmenuItem
							to="/flows-old/jwt-bearer"
							onClick={onClose}
							$isActive={isActiveRoute('/flows-old/jwt-bearer')}
						>
							OAuth 2.0 JWT Bearer
						</SubmenuItem>

						{/* Hidden old flows */}
						{/* <SubmenuItem to="/flows/authorization-code-v5" onClick={onClose} $isActive={isActiveRoute('/flows/authorization-code-v5')} $isV5={true}>
							<span>Authorization Code Flow V5</span>
							<FiChevronRight />
						</SubmenuItem> */}
					</Submenu>
				</NavItemWithSubmenu>

				<NavItemWithSubmenu>
					<NavItemHeader onClick={() => toggleMenu('oidc')} $isOpen={openMenus.oidc}>
						<div>
							<FiUser />
							<span>OpenID Connect</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus.oidc}>
						{/* V5 OIDC Flows - Highlighted with green */}
						<SubmenuItem
							to="/flows/oidc-authorization-code-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-authorization-code-v5')}
							$isV5={true}
							data-active={isActiveRoute('/flows/oidc-authorization-code-v5')}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>OIDC Authorization Code V5</span>
						</SubmenuItem>

						<SubmenuItem
							to="/flows/oidc-implicit-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-implicit-v5')}
							$isV5={true}
							data-active={isActiveRoute('/flows/oidc-implicit-v5')}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>OIDC Implicit Flow V5</span>
						</SubmenuItem>

						<SubmenuItem
							to="/flows/oidc-device-authorization-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-device-authorization-v5')}
							$isV5={true}
							data-active={isActiveRoute('/flows/oidc-device-authorization-v5')}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>OIDC Device Authorization Code V5</span>
						</SubmenuItem>

						{/* V3 Flows - Hidden */}
						{/* <SubmenuItem to="/flows/enhanced-authorization-code-v2" onClick={onClose} $isActive={isActiveRoute('/flows/enhanced-authorization-code-v2')}>
              <FiKey />
              OIDC Authorization Code (V2)
            </SubmenuItem> */}
						{/* <SubmenuItem to="/flows/enhanced-authorization-code-v3" onClick={onClose} $isActive={isActiveRoute('/flows/enhanced-authorization-code-v3')}>
              OIDC Authorization Code (V3)
            </SubmenuItem> */}
						{/* V3 Implicit hidden - use V5 instead */}
						{/* <SubmenuItem
							to="/flows/oidc-implicit-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-implicit-v3')}
						>
							OIDC Implicit V3
						</SubmenuItem> */}
						<SubmenuItem
							to="/flows/oidc-hybrid-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-hybrid-v3')}
						>
							OIDC Hybrid V3
						</SubmenuItem>
						{/* OIDC Client Credentials V3 hidden - Client Credentials is OAuth 2.0 only, not OIDC */}
						{/* <SubmenuItem
							to="/flows/oidc-client-credentials-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-client-credentials-v3')}
						>
							OIDC Client Credentials V3
						</SubmenuItem> */}
						{/* Old Hybrid Flow - Hidden */}
						{/* <SubmenuItem to="/oidc/hybrid" onClick={onClose} $isActive={isActiveRoute('/oidc/hybrid')}>
              <FiCode />
              OIDC Hybrid Flow
            </SubmenuItem> */}
						<SubmenuItem
							to="/flows/device-code-oidc"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/device-code-oidc')}
						>
							OIDC Device Code V3
						</SubmenuItem>
					</Submenu>
				</NavItemWithSubmenu>

				{/* Unsupported by PingOne Section */}
				<NavItemWithSubmenu>
					<NavItemHeader onClick={() => toggleMenu('unsupported')} $isOpen={openMenus.unsupported}>
						<div>
							<FiAlertTriangle />
							<span>Unsupported by PingOne</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus.unsupported}>
						<SubmenuItem
							to="/oauth/resource-owner-password"
							onClick={onClose}
							$isActive={isActiveRoute('/oauth/resource-owner-password')}
							$isWarning={true}
						>
							<span>OAuth 2.0 Resource Owner Password</span>
							<FiAlertTriangle />
						</SubmenuItem>
						<SubmenuItem
							to="/oidc/resource-owner-password"
							onClick={onClose}
							$isActive={isActiveRoute('/oidc/resource-owner-password')}
							$isWarning={true}
						>
							<span>OIDC Resource Owner Password</span>
							<FiAlertTriangle />
						</SubmenuItem>
						<SubmenuItem
							to="/flows/unsupported/token-exchange"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/unsupported/token-exchange')}
							$isWarning={true}
						>
							<span>Token Exchange (Mock)</span>
							<FiAlertTriangle />
						</SubmenuItem>
					</Submenu>
				</NavItemWithSubmenu>

				<NavItemWithSubmenu>
					<NavItemHeader
						onClick={() => toggleMenu('pingone-tokens')}
						$isOpen={openMenus['pingone-tokens']}
					>
						<div>
							<FiServer />
							<span>PingOne Tokens</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus['pingone-tokens']}>
						{/* V5 Worker Token Flow - Highlighted with green */}
						<SubmenuItem
							to="/flows/worker-token-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/worker-token-v5')}
							$isV5={true}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>PingOne Worker Token V5</span>
						</SubmenuItem>
						<SubmenuItem
							to="/flows/pingone-par-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/pingone-par-v5')}
							$isV5={true}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>PingOne PAR Flow V5</span>
						</SubmenuItem>
						<SubmenuItem
							to="/flows/redirectless-flow-mock"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/redirectless-flow-mock')}
						>
							<FiInfo style={{ marginRight: '0.5rem' }} />
							<span>Redirectless Flow (Educational)</span>
						</SubmenuItem>
						<SubmenuItem
							to="/flows/redirectless-flow-v5"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/redirectless-flow-v5')}
							$isV5={true}
						>
							<FiZap style={{ marginRight: '0.5rem' }} />
							<span>Redirectless Flow V5 (Real)</span>
						</SubmenuItem>

						{/* V3 Flows - Hidden */}
						{/* <SubmenuItem to="/oidc/worker-token" onClick={onClose} $isActive={isActiveRoute('/oidc/worker-token')}>
             
             PingOne Worker Token
           </SubmenuItem> */}
						{/* <SubmenuItem to="/flows/worker-token-v3" onClick={onClose} $isActive={isActiveRoute('/flows/worker-token-v3')}>
             
             PingOne Worker Token V3
           </SubmenuItem> */}
					</Submenu>
				</NavItemWithSubmenu>

				<NavItemWithSubmenu>
					<NavItemHeader onClick={() => toggleMenu('docs')} $isOpen={openMenus.docs}>
						<div>
							<FiBookOpen />
							<span>Documentation</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus.docs}>
						<SubmenuItem to="/documentation" onClick={onClose}>
							Local Documentation
						</SubmenuItem>
						<SubmenuItem to="/docs/oidc-specs" onClick={onClose}>
							OIDC Specs
						</SubmenuItem>
						<SubmenuItem to="/docs/oidc-for-ai" onClick={onClose}>
							OIDC for AI
						</SubmenuItem>
						<SubmenuItem to="/docs/oauth2-security-best-practices" onClick={onClose}>
							OAuth 2.0 Security Best Practices
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#openid-connectoauth-2"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							<FiExternalLink />
							PingOne API Reference
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="https://docs.pingidentity.com/sdks/latest/sdks/index.html"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							<FiExternalLink />
							PingOne SDKs
						</SubmenuItem>
					</Submenu>
				</NavItemWithSubmenu>

				<NavItemWithSubmenu>
					<NavItemHeader onClick={() => toggleMenu('resources')} $isOpen={openMenus.resources}>
						<div>
							<FiTool />
							<span>Resources</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus.resources}>
						<SubmenuItem to="/token-management" onClick={onClose}>
							<TokenIcon />
							Token Management
						</SubmenuItem>
						<SubmenuItem to="/auto-discover" onClick={onClose}>
							<DiscoveryIcon />
							OIDC Discovery
						</SubmenuItem>
						<SubmenuItem to="/jwks-troubleshooting" onClick={onClose}>
							<FiKey />
							JWKS Troubleshooting
						</SubmenuItem>
						<SubmenuItem to="/url-decoder" onClick={onClose}>
							<FiGlobe />
							URL Decoder
						</SubmenuItem>
						<SubmenuItem to="/flows/par" onClick={onClose}>
							<PARIcon />
							Pushed Authorization Request (PAR)
						</SubmenuItem>
						<SubmenuItem to="/flows/compare" onClick={onClose}>
							<CompareIcon />
							Flow Comparison
						</SubmenuItem>
						<SubmenuItem to="/flows/diagrams" onClick={onClose}>
							<DiagramsIcon />
							Interactive Diagrams
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="/test-reusable-step-system.html"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							<TestIcon />
							Test Reusable Step System
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="https://developer.pingidentity.com/en/tools/jwt-decoder.html"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							<JWTIcon />
							JWT Decoder
						</SubmenuItem>
						<SubmenuItem to="/oidc-session-management" onClick={onClose}>
							<SessionIcon />
							Session Management
						</SubmenuItem>
						<SubmenuItem to="/sdk-sample-app" onClick={onClose}>
							<SDKIcon />
							SDK Sample App
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="https://decoder.pingidentity.cloud/"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							<FiExternalLink />
							Facile Decoder
						</SubmenuItem>
					</Submenu>
				</NavItemWithSubmenu>

			</NavSection>
		</SidebarContainer>
	);
};

export default Sidebar;
