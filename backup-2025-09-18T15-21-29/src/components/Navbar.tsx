/* eslint-disable */
import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/NewAuthContext';
import { useAccessibility } from '../hooks/useAccessibility';
import packageJson from '../../package.json';

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  
  img {
    height: 32px;
    margin-right: 0.75rem;
  }
  
  .user-info {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 2px;
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

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const { announceToScreenReader, setFocus } = useAccessibility();

  const handleLogout = () => {
    logout();
    navigate('/login');
    announceToScreenReader('Logged out successfully');
  };

  const handleMenuToggle = () => {
    toggleSidebar();
    announceToScreenReader('Navigation menu toggled');
  };

  return (
    <NavbarContainer 
      role="banner"
      aria-label="Main navigation"
    >
      <MenuButton 
        onClick={handleMenuToggle}
        aria-label="Toggle navigation menu"
        aria-expanded="false"
        aria-controls="sidebar-menu"
        title="Toggle navigation menu"
      >
        <FiMenu size={24} aria-hidden="true" />
      </MenuButton>
      
      <Logo>
        <span>PingOne OAuth/OIDC Playground v{packageJson.version}</span>
        {isAuthenticated && user && (
          <div className="user-info" aria-live="polite">
            Welcome, {user.name || user.email}
          </div>
        )}
      </Logo>
      
      <NavItems role="navigation" aria-label="Main navigation">
        <Link 
          to="/documentation" 
          title="View documentation and help"
          aria-label="View documentation and help"
        >
          <FiHelpCircle aria-hidden="true" />
          <span>Docs</span>
        </Link>
        <Link 
          to="/configuration" 
          title="Configure OAuth settings"
          aria-label="Configure OAuth settings"
        >
          <FiSettings aria-hidden="true" />
          <span>Configuration</span>
        </Link>
        {isAuthenticated ? (
          <button 
            onClick={handleLogout} 
            title="Logout from the application"
            aria-label="Logout from the application"
          >
            <FiLogOut aria-hidden="true" />
            <span>Logout</span>
          </button>
        ) : (
          <Link 
            to="/login" 
            title="Login to the application"
            aria-label="Login to the application"
          >
            <FiLogIn aria-hidden="true" />
            <span>Login</span>
          </Link>
        )}
      </NavItems>
    </NavbarContainer>
  );
};

export default Navbar;
