import React from 'react';
import { FiHelpCircle, FiLogIn, FiLogOut, FiMenu, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
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

const Navbar = ({ toggleSidebar }) => {
	const { isAuthenticated, logout } = useAuth();

	return (
		<NavbarContainer>
			<MenuButton onClick={toggleSidebar}>
				<FiMenu size={24} />
			</MenuButton>

			<Logo>
				<span>PingOne OAuth Playground</span>
			</Logo>

			<NavItems>
				<a href="/documentation" title="Documentation">
					<FiHelpCircle />
					<span>Docs</span>
				</a>
				<a href="/configuration" title="Settings">
					<FiSettings />
					<span>Settings</span>
				</a>
				{isAuthenticated ? (
					<button onClick={logout} title="Logout">
						<FiLogOut />
						<span>Logout</span>
					</button>
				) : (
					<a href="/login" title="Login">
						<FiLogIn />
						<span>Login</span>
					</a>
				)}
			</NavItems>
		</NavbarContainer>
	);
};

export default Navbar;
