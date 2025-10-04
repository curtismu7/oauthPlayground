import React from 'react';
import { FiHelpCircle, FiLogIn, FiLogOut, FiMenu, FiSearch, FiSettings } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import { useAccessibility } from '../hooks/useAccessibility';

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
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  
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
    background: white;
    border: 1px solid #e2e8f0;
    color: black;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    transition: all 0.2s;
    
    &:hover {
      background-color: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
	const { announce } = useAccessibility();

	const handleLogout = () => {
		logout();
		navigate('/login');
		announce('Logged out successfully');
	};

	const handleMenuToggle = () => {
		toggleSidebar();
		announce('Navigation menu toggled');
	};

	return (
		<NavbarContainer role="banner" aria-label="Main navigation">
			<MenuButton
				onClick={handleMenuToggle}
				aria-label="Toggle navigation menu"
				aria-expanded="false"
				aria-controls="sidebar-menu"
			>
				<FiMenu size={24} aria-hidden="true" />
			</MenuButton>

			<Logo>
				<span>PingOne OAuth/OIDC Playground</span>
				{isAuthenticated && user && (
					<div className="user-info" aria-live="polite">
						Welcome, {user.name || user.email}
					</div>
				)}
			</Logo>

			<NavItems role="navigation" aria-label="Main navigation">
				<Link to="/documentation" title="View documentation and help">
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
				<Link
					to="/auto-discover"
					title="OIDC Discovery tool"
					aria-label="OIDC Discovery tool"
				>
					<FiSearch aria-hidden="true" />
					<span>OIDC Discovery</span>
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
					<Link to="/login" title="Login to the application" aria-label="Login to the application">
						<FiLogIn aria-hidden="true" />
						<span>Login</span>
					</Link>
				)}
			</NavItems>
		</NavbarContainer>
	);
};

export default Navbar;
