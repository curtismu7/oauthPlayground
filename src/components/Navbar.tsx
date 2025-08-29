import type { FC } from 'react';
import styled from 'styled-components';
import { FiMenu, FiSettings, FiHelpCircle, FiLogIn, FiLogOut, FiUser, FiInfo } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UserChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.15);
  margin-right: 0.5rem;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  span {
    font-size: 0.9rem;
  }
`;

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  
  img {
    height: 32px;
    margin-right: 0.75rem;
  }
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  
  button, a {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    span {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      display: none;
      
      @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
        display: inline;
      }
    }
  }
`;

const MenuButton = styled.button`
  margin-right: 1rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: FC<NavbarProps> = ({ toggleSidebar }) => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <NavbarContainer>
      <MenuButton onClick={toggleSidebar}>
        <FiMenu size={24} />
      </MenuButton>
      
      <Logo>
        <span>PingOne OAuth Playground</span>
      </Logo>
      
      <NavItems>
        {isAuthenticated && (
          <UserChip title={user?.email || user?.name || 'Signed in'}>
            <FiUser />
            <span>{user?.name || 'Signed in'}</span>
          </UserChip>
        )}
        <a
          href="https://www.pingidentity.com/en/openid-connect.html"
          target="_blank"
          rel="noopener noreferrer"
          title="OIDC Overview (opens in new tab)"
        >
          <FiInfo />
          <span>OIDC Overview</span>
        </a>
        <a href="https://apidocs.pingidentity.com" target="_blank" rel="noopener noreferrer" title="Documentation (opens in new tab)">
          <FiHelpCircle />
          <span>Docs</span>
        </a>
        <Link to="/configuration" title="Settings">
          <FiSettings />
          <span>Settings</span>
        </Link>
        {isAuthenticated ? (
          <button onClick={logout} title="Logout">
            <FiLogOut />
            <span>Logout</span>
          </button>
        ) : (
          <Link to="/login" title="Login">
            <FiLogIn />
            <span>Login</span>
          </Link>
        )}
      </NavItems>
    </NavbarContainer>
  );
};

export default Navbar;
