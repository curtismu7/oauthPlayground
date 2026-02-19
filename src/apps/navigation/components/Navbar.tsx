import React, { useEffect, useState } from 'react';
import {
	FiActivity,
	FiDownload,
	FiFileText,
	FiHelpCircle,
	FiLogIn,
	FiLogOut,
	FiMenu,
	FiSearch,
	FiServer,
	FiSettings,
	FiX,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@/contexts/NewAuthContext';
import { useAccessibility } from '@/hooks/useAccessibility';
import {
	exportAllUseCasesAsMarkdown,
	exportAllUseCasesAsPDF,
} from '@/v8u/services/unifiedFlowDocumentationServiceV8U';
import { APP_VERSION } from '@/version';

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
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-right: auto;
  text-align: left;
  
  img {
    height: 40px;
    width: auto;
    object-fit: contain;
    background: transparent;
    display: block;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    image-rendering: optimize-quality;
    flex-shrink: 0;
  }
  
  > div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-info {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 2px;
  }
  
  /* On smaller screens, adjust font sizes but keep everything visible */
  @media (max-width: 768px) {
    .user-info {
      font-size: 0.75rem;
    }
    
    > div span {
      font-size: 1.0rem;
    }
    
    gap: 0.5rem;
  }
  
  /* On very small screens, make text smaller but keep visible */
  @media (max-width: 480px) {
    .user-info {
      font-size: 0.7rem;
    }
    
    > div span {
      font-size: 0.9rem;
    }
    
    gap: 0.4rem;
    
    img {
      height: 32px;
    }
  }
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  
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
  
  /* Hide less important buttons on smaller screens */
  @media (max-width: 768px) {
    /* Hide OIDC Discovery and App Generator on tablets */
    a[href*="auto-discover"],
    a[href*="client-generator"] {
      display: none;
    }
  }
  
  @media (max-width: 640px) {
    /* Hide Configuration and Dashboard on mobile */
    a[href*="configuration"],
    a[href*="dashboard"] {
      display: none;
    }
  }
  
  @media (max-width: 480px) {
    /* Hide Export All on very small screens */
    button[title*="Export"] {
      display: none;
    }
  }
`;

const MenuButton = styled.button`
  margin-right: 1rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 500px;
  position: relative;
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px 12px 0 0;
  color: white;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const ModalMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const ExportButton = styled.button<{ $variant: 'markdown' | 'pdf' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({ $variant }) => {
		if ($variant === 'markdown') {
			return `
        background-color: #3b82f6;
        color: #ffffff;
        border-color: #2563eb;
        
        &:hover {
          background-color: #2563eb;
          border-color: #1d4ed8;
        }
      `;
		} else {
			return `
        background-color: #dc2626;
        color: #ffffff;
        border-color: #b91c1c;
        
        &:hover {
          background-color: #b91c1c;
          border-color: #991b1b;
        }
      `;
		}
	}}
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
	const [showExportModal, setShowExportModal] = useState(false);
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

	const handleExportAllUseCases = () => {
		setShowExportModal(true);
	};

	const handleExportMarkdown = () => {
		exportAllUseCasesAsMarkdown();
		setShowExportModal(false);
		announce('Exporting all Unified Flow use cases as Markdown');
	};

	const handleExportPDF = () => {
		exportAllUseCasesAsPDF();
		setShowExportModal(false);
		announce('Exporting all Unified Flow use cases as PDF');
	};

	const handleCloseExportModal = () => {
		setShowExportModal(false);
	};

	return (
		<>
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
					<img src="/images/ping-identity-logo.png" alt="Ping Identity" />
					<div>
						<span>PingOne MasterFlow API</span>
						<div className="user-info" aria-live="polite">
							Version {APP_VERSION}
						</div>
						{isAuthenticated && user && (
							<div className="user-info" aria-live="polite">
								Welcome, {user.name || user.email}
							</div>
						)}
					</div>
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
					<Link to="/api-status" title="View API server status and health metrics">
						<FiServer aria-hidden="true" />
						<span>API Status</span>
					</Link>
					<Link to="/dashboard" title="View dashboard and system overview">
						<FiActivity aria-hidden="true" />
						<span>Dashboard</span>
					</Link>
					<Link to="/auto-discover" title="OIDC Discovery tool" aria-label="OIDC Discovery tool">
						<FiSearch aria-hidden="true" />
						<span>OIDC Discovery</span>
					</Link>
					<Link to="/client-generator" title="Generate PingOne applications">
						<FiSettings aria-hidden="true" />
						<span>App Generator</span>
					</Link>
					<button
						type="button"
						onClick={handleExportAllUseCases}
						title="Export all Unified Flow use cases as PDF or Markdown"
						aria-label="Export all Unified Flow use cases"
					>
						<FiDownload aria-hidden="true" />
						<span>Export All</span>
					</button>
					{isAuthenticated ? (
						<button
							type="button"
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
			<ModalOverlay $isOpen={showExportModal} onClick={handleCloseExportModal}>
				<ModalContent onClick={(e) => e.stopPropagation()}>
					<ModalHeader>
						<ModalTitle>
							<FiDownload />
							Export All Unified Flow Use Cases
						</ModalTitle>
						<CloseButton onClick={handleCloseExportModal} aria-label="Close modal">
							<FiX size={20} />
						</CloseButton>
					</ModalHeader>
					<ModalBody>
						<ModalMessage>
							Choose a format to export all Unified Flow use cases. This will generate a
							comprehensive document containing API calls for each flow type.
						</ModalMessage>
						<ButtonGroup>
							<ExportButton $variant="markdown" onClick={handleExportMarkdown}>
								<FiFileText />
								Export as Markdown
							</ExportButton>
							<ExportButton $variant="pdf" onClick={handleExportPDF}>
								<FiDownload />
								Export as PDF
							</ExportButton>
						</ButtonGroup>
					</ModalBody>
				</ModalContent>
			</ModalOverlay>
		</>
	);
};

export default Navbar;
