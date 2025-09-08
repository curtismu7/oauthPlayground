import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FiHome, FiCode, FiUser, FiSettings, 
  FiChevronDown, FiBookOpen, FiEye, FiShield, FiUsers, FiDatabase, FiTool, FiCpu
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
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 900;
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 1rem 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints?.lg || '1024px'}) {
    transform: ${({ $isOpen }) => $isOpen ? 'translateX(0)' : 'translateX(-100%)'};
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

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: ${({ theme }) => theme.colors?.gray700 || '#374151'};
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors?.gray100 || '#f3f4f6'};
    color: ${({ theme }) => theme.colors?.primary || '#0070cc'};
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
`;

const Submenu = styled.div<SubmenuProps>`
  overflow: hidden;
  max-height: ${({ $isOpen }) => $isOpen ? '500px' : '0'};
  transition: max-height 0.3s ease-in-out;
`;

const SubmenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.5rem 1.5rem 0.5rem 3.5rem;
  color: ${({ theme }) => theme.colors?.gray700 || '#374151'};
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors?.gray50 || '#f9fafb'};
    color: ${({ theme }) => theme.colors?.primary || '#0070cc'};
  }
  
  &:before {
    content: '•';
    margin-right: 0.75rem;
    font-size: 1.5rem;
    line-height: 0;
    color: ${({ theme }) => theme.colors?.gray400 || '#9ca3af'};
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
    transition: transform 0.2s;
    transform: rotate(${({ $isOpen }) => $isOpen ? '0deg' : '-90deg'});
  }
`;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  // Load persisted menu state from localStorage
  const [openMenus, setOpenMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('nav.openSections');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          oidc: parsed.oidc ?? true,  // Default to expanded
          resources: parsed.resources ?? true, // Default to expanded
          docs: parsed.docs ?? false, // Default to collapsed
        };
      }
    } catch (error) {
      console.warn('Failed to load navigation state from localStorage:', error);
    }
    return {
      oidc: true,  // Default to expanded
      resources: true, // Default to expanded
      docs: false, // Default to collapsed
    };
  });

  // Auto-open menu based on current route and persist state
  useEffect(() => {
    const path = location.pathname;
    setOpenMenus(prev => {
      const newState = {
        ...prev,
        // Auto-expand if current route matches
        oidc: path.startsWith('/oidc') || prev.oidc,
        resources: (path.startsWith('/oidc/userinfo') || path.startsWith('/oidc/tokens') || 
                   path.startsWith('/token-management') || path.startsWith('/documentation')) || prev.resources,
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

  const toggleMenu = (menu: 'oidc' | 'resources' | 'docs') => {
    setOpenMenus(prev => {
      const newState = {
        ...prev,
        [menu]: !prev[menu]
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
        <NavItem to="/dashboard" onClick={onClose}>
          <FiHome />
          <span>Dashboard</span>
        </NavItem>
        <NavItem to="/configuration" onClick={onClose}>
          <FiSettings />
          <span>Configuration</span>
        </NavItem>
        <NavItem to="/flows/userinfo" onClick={onClose}>
          <FiUser />
          <span>Get UserInfo</span>
        </NavItem>
      </NavSection>

      <NavSection>
        <NavSectionTitle>OpenID Connect</NavSectionTitle>
        
        <NavItemWithSubmenu>
          <NavItemHeader 
            onClick={() => toggleMenu('oidc')}
            $isOpen={openMenus.oidc}
          >
            <div>
              <FiUser />
              <span>OpenID Connect</span>
            </div>
            <FiChevronDown />
          </NavItemHeader>
          
          <Submenu $isOpen={openMenus.oidc}>
            <SubmenuItem to="/oidc/authorization-code" onClick={onClose}>
              Authorization Code
            </SubmenuItem>
            <SubmenuItem to="/oidc/implicit" onClick={onClose}>
              Implicit
            </SubmenuItem>
            <SubmenuItem to="/oidc/hybrid" onClick={onClose}>
              Hybrid Flow
            </SubmenuItem>
            <SubmenuItem to="/oidc/client-credentials" onClick={onClose}>
              Client Credentials
            </SubmenuItem>
            <SubmenuItem to="/oidc/worker-token" onClick={onClose}>
              Worker Token
            </SubmenuItem>
            <SubmenuItem to="/oidc/device-code" onClick={onClose}>
              Device Code
            </SubmenuItem>
          </Submenu>
        </NavItemWithSubmenu>
        

        <NavItemWithSubmenu>
          <NavItemHeader 
            onClick={() => toggleMenu('docs')}
            $isOpen={openMenus.docs}
          >
            <div>
              <FiBookOpen />
              <span>Docs</span>
            </div>
            <FiChevronDown />
          </NavItemHeader>
          
          <Submenu $isOpen={openMenus.docs}>
            <SubmenuItem to="/docs/oidc-specs" onClick={onClose}>
              OIDC Specs
            </SubmenuItem>
            <SubmenuItem to="/docs/oidc-for-ai" onClick={onClose}>
              OIDC for AI
            </SubmenuItem>
          </Submenu>
        </NavItemWithSubmenu>

        <NavItemWithSubmenu>
          <NavItemHeader 
            onClick={() => toggleMenu('resources')}
            $isOpen={openMenus.resources}
          >
            <div>
              <FiTool />
              <span>Resources</span>
            </div>
            <FiChevronDown />
          </NavItemHeader>
          
          <Submenu $isOpen={openMenus.resources}>
            <SubmenuItem to="/auto-discover" onClick={onClose}>
              Auto-discover
            </SubmenuItem>
            <SubmenuItem to="/token-management" onClick={onClose}>
              Token Management
            </SubmenuItem>
            <SubmenuItem to="/flows/par" onClick={onClose}>
              Pushed Authorization
            </SubmenuItem>
            <SubmenuItem to="/documentation" onClick={onClose}>
              Documentation
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
