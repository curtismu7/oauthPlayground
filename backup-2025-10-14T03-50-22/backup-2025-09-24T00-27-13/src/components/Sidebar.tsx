import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
	FiHome,
	FiCode,
	FiUser,
	FiSettings,
	FiSearch,
	FiChevronDown,
	FiBookOpen,
	FiEye,
	FiShield,
	FiUsers,
	FiDatabase,
	FiTool,
	FiCpu,
	FiKey,
	FiZap,
	FiLock,
	FiSmartphone,
	FiServer,
	FiUnlock,
	FiPackage,
	FiGitBranch,
	FiBarChart,
	FiExternalLink,
} from 'react-icons/fi';

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
  background-color: white;
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

const SubmenuItem = styled(Link)<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.5rem 1.5rem 0.5rem 3.5rem;
  color: ${({ $isActive, theme }) =>
		$isActive ? '#ffffff' : (theme.colors?.gray700 || '#374151')};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: ${({ $isActive }) => ($isActive ? '600' : '400')};
  transition: all 0.2s;
  background-color: ${({ $isActive, theme }) =>
		$isActive ? (theme.colors?.primary || '#0070cc') : 'transparent'};
  border-right: ${({ $isActive, theme }) =>
		$isActive ? `3px solid ${theme.colors?.primaryDark || '#0056b3'}` : '3px solid transparent'};
  
  &:hover {
    background-color: ${({ $isActive, theme }) =>
			$isActive ? (theme.colors?.primaryDark || '#0056b3') : (theme.colors?.gray50 || '#f9fafb')};
    color: ${({ $isActive, theme }) =>
			$isActive ? '#ffffff' : (theme.colors?.primary || '#0070cc')};
  }
  
  &:before {
    content: '•';
    margin-right: 0.75rem;
    font-size: 1.5rem;
    line-height: 0;
    color: ${({ $isActive, theme }) =>
			$isActive ? '#ffffff' : (theme.colors?.gray400 || '#9ca3af')};
  }
`;

const NavItemWithSubmenu = styled.div`
  cursor: pointer;
  user-select: none;
`;

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
    color: #3b82f6;
    padding: 0.4rem;
    border-radius: 6px;
    background: #eff6ff;
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
					oauth: false, // Always start with OAuth menu collapsed
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
			oauth: false, // Default to collapsed
			oidc: true, // Default to expanded
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
				// Auto-expand if current route matches (OAuth menu stays collapsed by default)
				oauth: prev.oauth, // Keep OAuth menu collapsed by default
				oidc: path.startsWith('/oidc') || prev.oidc,
				'pingone-tokens': path.startsWith('/oidc/worker-token') || prev['pingone-tokens'],
				resources:
					path.startsWith('/oidc/userinfo') ||
					path.startsWith('/oidc/tokens') ||
					path.startsWith('/token-management') ||
					path.startsWith('/auto-discover') ||
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

	const toggleMenu = (menu: 'oauth' | 'oidc' | 'pingone-tokens' | 'resources' | 'docs') => {
		setOpenMenus((prev) => {
			const newState = {
				...prev,
				[menu]: !prev[menu],
			};

			// Persist to localStorage
			try {
				localStorage.setItem('nav.openSections', JSON.stringify(newState));
				console.log(`[📂 MENU] ${menu} toggled to ${newState[menu] ? 'expanded' : 'collapsed'}`);
			} catch (error) {
				console.warn('Failed to save navigation state to localStorage:', error);
			}

			return newState;
		});
	};

	return (
		<SidebarContainer $isOpen={isOpen}>
			<NavSection>
				<NavItem to="/dashboard" onClick={onClose} $isActive={isActiveRoute('/dashboard')}>
					<FiHome />
					<span>Dashboard</span>
				</NavItem>
				<NavItem to="/configuration" onClick={onClose} $isActive={isActiveRoute('/configuration')}>
					<FiSettings />
					<span>Configuration</span>
				</NavItem>
				<NavItem to="/auto-discover" onClick={onClose} $isActive={isActiveRoute('/auto-discover')}>
					<FiSearch />
					<span>OIDC Discovery</span>
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
						{/* Older OAuth Authorization Code Flow Hidden - keeping file but not showing in menu */}
						{/* <SubmenuItem to="/oidc/authorization-code" onClick={onClose} $isActive={isActiveRoute('/oidc/authorization-code')}>
              <FiLock />
              OAuth 2.0 Authorization Code
            </SubmenuItem> */}
						<SubmenuItem
							to="/flows/oauth-authorization-code-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth-authorization-code-v3')}
						>
							🔐 OAuth 2.0 Authorization Code (V3)
						</SubmenuItem>
						<SubmenuItem
							to="/flows/oauth2-implicit-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth2-implicit-v3')}
						>
							🚀 OAuth 2.0 Implicit V3
						</SubmenuItem>
						<SubmenuItem
							to="/flows/oauth2-client-credentials-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oauth2-client-credentials-v3')}
						>
							🚀 OAuth2 Client Credentials V3
						</SubmenuItem>
						{/* Old OAuth 2.0 Client Credentials Flow - Hidden */}
						{/* <SubmenuItem to="/oauth/client-credentials" onClick={onClose} $isActive={isActiveRoute('/oauth/client-credentials')}>
              <FiServer />
              OAuth 2.0 Client Credentials
            </SubmenuItem> */}
						<SubmenuItem
							to="/oauth/resource-owner-password"
							onClick={onClose}
							$isActive={isActiveRoute('/oauth/resource-owner-password')}
						>
							🚀 OAuth 2.0 Resource Owner Password
						</SubmenuItem>
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
						{/* V2 Flow Hidden - keeping file but not showing in menu */}
						{/* <SubmenuItem to="/flows/enhanced-authorization-code-v2" onClick={onClose} $isActive={isActiveRoute('/flows/enhanced-authorization-code-v2')}>
              <FiKey />
              OIDC Authorization Code (V2)
            </SubmenuItem> */}
						<SubmenuItem
							to="/flows/enhanced-authorization-code-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/enhanced-authorization-code-v3')}
						>
							🚀 OIDC Authorization Code (V3)
						</SubmenuItem>
						<SubmenuItem
							to="/flows/oidc-implicit-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-implicit-v3')}
						>
							🚀 OIDC Implicit V3
						</SubmenuItem>
						<SubmenuItem
							to="/flows/oidc-hybrid-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-hybrid-v3')}
						>
							🚀 OIDC Hybrid V3
						</SubmenuItem>
						<SubmenuItem
							to="/flows/oidc-client-credentials-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/oidc-client-credentials-v3')}
						>
							🚀 OIDC Client Credentials V3
						</SubmenuItem>
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
							🚀 OIDC Device Code V3
						</SubmenuItem>
						<SubmenuItem
							to="/oidc/resource-owner-password"
							onClick={onClose}
							$isActive={isActiveRoute('/oidc/resource-owner-password')}
						>
							🚀 OIDC Resource Owner Password
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
						{/* Old Worker Token Flow - Hidden */}
						{/* <SubmenuItem to="/oidc/worker-token" onClick={onClose} $isActive={isActiveRoute('/oidc/worker-token')}>
             🔧
             PingOne Worker Token
           </SubmenuItem> */}
						<SubmenuItem
							to="/flows/worker-token-v3"
							onClick={onClose}
							$isActive={isActiveRoute('/flows/worker-token-v3')}
						>
							🚀 PingOne Worker Token V3
						</SubmenuItem>
					</Submenu>
				</NavItemWithSubmenu>

				<NavItemWithSubmenu>
					<NavItemHeader onClick={() => toggleMenu('docs')} $isOpen={openMenus.docs}>
						<div>
							<FiBookOpen />
							<span>Docs</span>
						</div>
						<FiChevronDown />
					</NavItemHeader>

					<Submenu $isOpen={openMenus.docs}>
						<SubmenuItem to="/documentation" onClick={onClose}>
							📚 Local Documentation
						</SubmenuItem>
						<SubmenuItem to="/docs/oidc-specs" onClick={onClose}>
							📖 OIDC Specs
						</SubmenuItem>
						<SubmenuItem to="/docs/oidc-for-ai" onClick={onClose}>
							🤖 OIDC for AI
						</SubmenuItem>
						<SubmenuItem to="/docs/oauth2-security-best-practices" onClick={onClose}>
							🛡️ OAuth 2.0 Security Best Practices
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="https://apidocs.pingidentity.com"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							🔗 PingOne API Docs
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
							<FiPackage />
							Token Management
						</SubmenuItem>
						<SubmenuItem to="/auto-discover" onClick={onClose}>
							<FiSearch />
							OIDC Discovery
						</SubmenuItem>
						<SubmenuItem to="/flows/par" onClick={onClose}>
							<FiShield />
							Pushed Authorization Request (PAR)
						</SubmenuItem>
						<SubmenuItem to="/flows/compare" onClick={onClose}>
							<FiGitBranch />
							Flow Comparison
						</SubmenuItem>
						<SubmenuItem to="/flows/diagrams" onClick={onClose}>
							<FiBarChart />
							Interactive Diagrams
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="/test-reusable-step-system.html"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							🧪 Reusable Step System Test Suite
						</SubmenuItem>
						<SubmenuItem
							as="a"
							href="https://developer.pingidentity.com/en/tools/jwt-decoder.html"
							target="_blank"
							rel="noopener noreferrer"
							onClick={onClose}
						>
							<FiExternalLink />
							Ping JWT Decoder ↗
						</SubmenuItem>
					</Submenu>
				</NavItemWithSubmenu>

				<NavItem to="/oauth-2-1" onClick={onClose}>
					<FiShield />
					<span>OAuth 2.1</span>
				</NavItem>

				<NavItem to="/oidc-session-management" onClick={onClose}>
					<FiUsers />
					<span>Session Management</span>
				</NavItem>
			</NavSection>
		</SidebarContainer>
	);
};

export default Sidebar;
