import React, { useEffect, useState } from 'react';
import { FiHelpCircle, FiLogIn, FiLogOut, FiMenu, FiSearch, FiSettings } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import { useAccessibility } from '../hooks/useAccessibility';
import { APP_VERSION } from '../version';

const NavbarContainer = styled.nav<{ $sidebarOpen?: boolean; $sidebarWidth?: number }>`
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
  z-index: 999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  
  /* On desktop (768px+), adjust for sidebar if it's open */
  @media (min-width: 768px) {
    left: ${({ $sidebarOpen, $sidebarWidth }) => {
			// On desktop, sidebar is always visible when open, so always adjust
			if ($sidebarOpen && $sidebarWidth && $sidebarWidth > 0) {
				return `${$sidebarWidth}px`;
			}
			return '0';
		}};
  }
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
	sidebarOpen?: boolean;
	sidebarWidth?: number;
}

const Navbar: React.FC<NavbarProps> = ({
	toggleSidebar,
	sidebarOpen = false,
	sidebarWidth: propSidebarWidth,
}) => {
	const { isAuthenticated, logout, user } = useAuth();
	const navigate = useNavigate();
	const { announce } = useAccessibility();
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) return parsed;
		} catch {}
		return 450; // Default width, matching Sidebar component
	});

	// Listen for sidebar width changes from localStorage
	useEffect(() => {
		const handleStorageChange = () => {
			try {
				const saved = localStorage.getItem('sidebar.width');
				const parsed = saved ? parseInt(saved, 10) : NaN;
				if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) {
					setSidebarWidth(parsed);
				}
			} catch {}
		};

		// Check on mount and when sidebar opens/closes
		handleStorageChange();

		// Listen for storage events (in case sidebar updates localStorage)
		window.addEventListener('storage', handleStorageChange);

		// Also poll occasionally for same-tab updates (since storage event only fires cross-tab)
		const interval = setInterval(handleStorageChange, 500);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
		};
	}, []);

	// Use prop if provided, otherwise use local state
	const effectiveSidebarWidth = propSidebarWidth ?? sidebarWidth;

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
		<NavbarContainer
			role="banner"
			aria-label="Main navigation"
			$sidebarOpen={sidebarOpen}
			$sidebarWidth={effectiveSidebarWidth}
		>
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
				<div className="user-info" aria-live="polite">
					Version {APP_VERSION}
				</div>
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
				<Link to="/configuration" title="Configure OAuth settings">
					<FiSettings aria-hidden="true" />
					<span>Configuration</span>
				</Link>
				<Link to="/auto-discover" title="OIDC Discovery tool" aria-label="OIDC Discovery tool">
					<FiSearch aria-hidden="true" />
					<span>OIDC Discovery</span>
				</Link>
				<Link to="/client-generator" title="Generate PingOne applications">
					<FiSettings aria-hidden="true" />
					<span>App Generator</span>
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
