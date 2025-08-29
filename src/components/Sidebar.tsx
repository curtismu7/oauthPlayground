import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiHome, FiCode, FiUser, FiSettings,
  FiChevronDown, FiBookOpen, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const SidebarContainer = styled.aside<{ $isOpen: boolean }>`
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

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
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
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 0 1.5rem;
  margin: 1.5rem 0 0.5rem;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: ${({ theme }) => theme.colors.gray700};
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  &.active {
    background-color: ${({ theme }) => theme.colors.primaryLight}20;
    color: ${({ theme }) => theme.colors.primary};
    border-right: 3px solid ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
`;

const Submenu = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  max-height: ${({ $isOpen }) => $isOpen ? '500px' : '0'};
  transition: max-height 0.3s ease-in-out;
`;

const SubmenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 0.5rem 1.5rem 0.5rem 3.5rem;
  color: ${({ theme }) => theme.colors.gray700};
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  &.active {
    background-color: ${({ theme }) => theme.colors.primaryLight}10;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
  }
  
  &:before {
    content: '•';
    margin-right: 0.75rem;
    font-size: 1.5rem;
    line-height: 0;
    color: ${({ theme }) => theme.colors.gray400};
  }
  
  &.active:before {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NavItemWithSubmenu = styled.div`
  cursor: pointer;
  user-select: none;
`;

const NavItemHeader = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  color: ${({ theme }) => theme.colors.gray700};
  font-weight: 500;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  svg:first-child {
    margin-right: 0.75rem;
  }
  
  svg:last-child {
    transition: transform 0.2s;
    transform: rotate(${({ $isOpen }) => $isOpen ? '0deg' : '-90deg'});
  }
`;

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const [openMenus, setOpenMenus] = useState<{ flows: boolean; oidc: boolean }>({
    flows: false,
    oidc: false,
  });

  // Auto-open menu based on current route
  useEffect(() => {
    const path = location.pathname;
    setOpenMenus({
      flows: path.startsWith('/flows'),
      oidc: path.startsWith('/oidc'),
    });
  }, [location.pathname]);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu as keyof typeof prev]
    }));
  };

  return (
    <SidebarContainer $isOpen={isOpen}>
      <NavSection>
        <NavItem to="/dashboard" onClick={onClose}>
          <FiHome />
          <span>Dashboard</span>
        </NavItem>
      </NavSection>

      <NavSection>
        <NavSectionTitle>OAuth 2.0 Flows</NavSectionTitle>
        
        <NavItemWithSubmenu>
          <NavItemHeader 
            onClick={() => toggleMenu('flows')}
            $isOpen={openMenus.flows}
          >
            <div>
              <FiCode />
              <span>OAuth 2.0 Flows</span>
            </div>
            <FiChevronDown />
          </NavItemHeader>
          
          <Submenu $isOpen={openMenus.flows}>
            <SubmenuItem to="/flows/authorization-code" onClick={onClose}>
              Authorization Code
            </SubmenuItem>
            <SubmenuItem to="/flows/implicit" onClick={onClose}>
              Implicit
            </SubmenuItem>
            <SubmenuItem to="/flows/client-credentials" onClick={onClose}>
              Client Credentials
            </SubmenuItem>
            <SubmenuItem to="/flows/pkce" onClick={onClose}>
              PKCE
            </SubmenuItem>
            <SubmenuItem to="/flows/device-code" onClick={onClose}>
              Device Code
            </SubmenuItem>
          </Submenu>
        </NavItemWithSubmenu>
        
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
            <SubmenuItem to="/oidc" onClick={onClose}>
              UserInfo Endpoint
            </SubmenuItem>
            <SubmenuItem to="/oidc" onClick={onClose}>
              ID Tokens
            </SubmenuItem>
          </Submenu>
        </NavItemWithSubmenu>
      </NavSection>
      
      <NavSection>
        <NavSectionTitle>Resources</NavSectionTitle>
        <a
          href="https://apidocs.pingidentity.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            color: '#495057',
            textDecoration: 'none',
            fontWeight: 500
          }}
          onClick={onClose}
        >
          <FiBookOpen style={{ marginRight: '0.75rem', fontSize: '1.25rem' }} />
          <span>Documentation</span>
        </a>
        <NavItem to="/configuration" onClick={onClose}>
          <FiSettings />
          <span>Configuration</span>
        </NavItem>
      </NavSection>

      {isAuthenticated && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '1.5rem',
          right: '1.5rem',
          padding: '1rem 0',
          borderTop: '1px solid #e9ecef'
        }}>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545'}
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </SidebarContainer>
  );
};

export default Sidebar;
