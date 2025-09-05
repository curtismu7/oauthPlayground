import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSettings, FiHelpCircle, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

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

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <NavbarContainer>
      <MenuButton onClick={toggleSidebar}>
        <FiMenu size={24} />
      </MenuButton>
      
      <Logo>
        <span>PingOne OAuth Playground</span>
      </Logo>
      
      <NavItems>
        <Link to="/documentation" title="Documentation">
          <FiHelpCircle />
          <span>Docs</span>
        </Link>
        <Link to="/configuration" title="Settings">
          <FiSettings />
          <span>Settings</span>
        </Link>
        {isAuthenticated ? (
          <button onClick={handleLogout} title="Logout">
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
