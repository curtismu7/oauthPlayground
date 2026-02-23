/**
 * ========================================================================
 * UNIFIED SIDEBAR COMPONENT
 * ========================================================================
 *
 * This component combines the functionality of Sidebar.tsx and DragDropSidebar.tsx
 * into a single, maintainable component with all sidebar features.
 *
 * Features:
 * - Resize functionality (from Sidebar.tsx)
 * - Header with search and version badge (from Sidebar.tsx)
 * - Drag mode toggle (from Sidebar.tsx)
 * - All menu items and navigation (from DragDropSidebar.tsx)
 * - Search filtering (from DragDropSidebar.tsx)
 * - Drag & drop functionality (from DragDropSidebar.tsx)
 *
 * This eliminates the double import chain and simplifies the architecture.
 * ========================================================================
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import SidebarSearch from './SidebarSearch';
import { VersionBadge } from './VersionBadge';

// App version from package.json
const APP_VERSION = '9.25.1';

// MDI Icon Component for PingOne UI
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden, style }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: `${size}px`, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

// Icon Mapping for Migration from React Icons to MDI
const ICON_MAPPING: Record<string, string> = {
	// Core & Configuration
	'FiCpu': 'mdi-cpu',
	'FiActivity': 'mdi-activity',
	'FiSettings': 'mdi-cog',
	'FiServer': 'mdi-server',
	'FiShield': 'mdi-shield-check',
	'FiCheckCircle': 'mdi-check-circle',
	'FiDatabase': 'mdi-database',
	'FiLayers': 'mdi-layers',
	
	// Authentication & Security
	'FiKey': 'mdi-key',
	'FiSmartphone': 'mdi-cellphone',
	'FiRefreshCw': 'mdi-refresh',
	'FiLink': 'mdi-link',
	'FiUsers': 'mdi-account-group',
	'FiUser': 'mdi-account',
	
	// Navigation & UI
	'FiHome': 'mdi-home',
	'FiChevronDown': 'mdi-chevron-down',
	'FiEye': 'mdi-eye',
	'FiTrash2': 'mdi-delete',
	'FiFileText': 'mdi-file-document',
	'FiBook': 'mdi-book',
	'FiBookOpen': 'mdi-book-open-page-variant',
	'FiCode': 'mdi-code-tags',
	'FiTool': 'mdi-tools',
	
	// Analytics & Monitoring
	'FiBarChart2': 'mdi-chart-bar',
	'FiTrendingUp': 'mdi-trending-up',
	'FiClock': 'mdi-clock',
	'FiZap': 'mdi-lightning-bolt',
	
	// Documentation & Learning
	'FiFileText': 'mdi-file-document',
	
	// UI Elements
	'FiX': 'mdi-close',
	'FiSearch': 'mdi-magnify',
};

// Styled Components - PingOne UI Design System
const SidebarContainer = styled.div<{ $width: number; $isOpen: boolean }>`
	position: relative;
	width: ${(props) => props.$isOpen ? props.$width : 0}px;
	min-width: ${(props) => props.$isOpen ? 'var(--sidebar-width-min, 300px)' : '0px'};
	max-width: ${(props) => props.$isOpen ? props.$width : 0}px;
	height: 100vh;
	background: var(--sidebar-bg-primary, #FFFFFF);
	border-right: ${(props) => props.$isOpen ? '1px solid var(--sidebar-border, #E5E7EB)' : 'none'};
	transition: width 0.15s ease-in-out, border-right 0.15s ease-in-out;
	z-index: 100; /* Ensure sidebar stays above content */
	overflow: hidden;
	display: flex;
	flex-direction: column;
	opacity: ${(props) => props.$isOpen ? 1 : 0};
	visibility: ${(props) => props.$isOpen ? 'visible' : 'hidden'};
	box-shadow: ${(props) => props.$isOpen ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none'};
`;

const ResizeHandle = styled.div<{ $isDragging?: boolean }>`
	position: absolute;
	top: 0;
	right: -2px;
	width: 8px;
	height: 100%;
	cursor: ew-resize;
	background: transparent;
	z-index: 10;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: var(--sidebar-accent, #2563EB);
		opacity: 0.3;
		transform: translateX(-2px);
		width: 12px;
	}

	&:active,
	&[data-dragging="true"] {
		background: var(--sidebar-accent, #2563EB);
		opacity: 0.6;
		transform: translateX(-2px);
		width: 12px;
	}

	/* Add visual indicator */
	&::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 2px;
		height: 20px;
		background: var(--sidebar-text-tertiary, #9CA3AF);
		border-radius: 1px;
		opacity: 0;
		transition: all 0.15s ease-in-out;
	}

	&:hover::after {
		opacity: 1;
		background: var(--sidebar-bg-primary, #FFFFFF);
	}
`;

const SidebarHeader = styled.div`
	padding: var(--sidebar-padding-y, 1rem) var(--sidebar-padding-x, 1rem);
	border-bottom: 1px solid var(--sidebar-border, #E5E7EB);
	background: var(--sidebar-bg-secondary, #F8FAFC);
	flex-shrink: 0;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	padding: 0.5rem;
	border-radius: var(--sidebar-border-radius, 0.5rem);
	cursor: pointer;
	color: var(--sidebar-text-secondary, #6B7280);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: var(--sidebar-bg-tertiary, #F1F5F9);
		color: var(--sidebar-text-primary, #111827);
		transform: scale(1.05);
	}

	&:focus {
		outline: 2px solid var(--sidebar-accent, #2563EB);
		outline-offset: 2px;
	}
`;

const DragModeToggle = styled.button<{ $isActive?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 2px solid var(--sidebar-border, #E5E7EB);
	border-radius: var(--sidebar-border-radius, 0.5rem);
	background: ${(props) => (props.$isActive ? 'var(--sidebar-accent, #2563EB)' : 'var(--sidebar-bg-primary, #FFFFFF)')};
	color: ${(props) => (props.$isActive ? 'var(--sidebar-bg-primary, #FFFFFF)' : 'var(--sidebar-text-primary, #111827)')};
	font-size: var(--sidebar-subtitle-size, 0.875rem);
	font-weight: var(--sidebar-subtitle-weight, 500);
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	box-shadow: ${(props) => (props.$isActive ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none')};

	&:hover {
		background: ${(props) => (props.$isActive ? 'var(--sidebar-accent-hover, #1D4ED8)' : 'var(--sidebar-bg-tertiary, #F1F5F9)')};
		border-color: var(--sidebar-accent, #2563EB);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	&:focus {
		outline: 2px solid var(--sidebar-accent, #2563EB);
		outline-offset: 2px;
	}

	&:active {
		transform: translateY(0);
	}
`;

const SidebarContent = styled.div`
	flex: 1;
	overflow: auto;
	display: flex;
	flex-direction: column;
`;

const SidebarFooter = styled.div`
	padding: var(--sidebar-padding-y, 1rem) var(--sidebar-padding-x, 1rem);
	border-top: 1px solid var(--sidebar-border, #E5E7EB);
	background: var(--sidebar-bg-secondary, #F8FAFC);
	flex-shrink: 0;
`;

// Menu Item Components - PingOne UI Design System
const MenuItemContainer = styled.div<{ $isDragging?: boolean; $isOver?: boolean; $isActive?: boolean }>`
	padding: 0.75rem 1rem;
	margin: 0.25rem 0.5rem;
	border-radius: var(--sidebar-border-radius, 0.5rem);
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	background: ${(props) => 
		props.$isActive ? 'var(--sidebar-accent, #2563EB)' : 
		props.$isDragging ? 'var(--sidebar-bg-tertiary, #F1F5F9)' : 
		'transparent'
	};
	border: ${(props) => 
		props.$isOver ? '2px solid var(--sidebar-accent, #2563EB)' : 
		props.$isActive ? '2px solid var(--sidebar-accent, #2563EB)' : 
		'2px solid transparent'
	};
	color: ${(props) => props.$isActive ? 'var(--sidebar-bg-primary, #FFFFFF)' : 'var(--sidebar-text-primary, #111827)'};

	&:hover {
		background: ${(props) => props.$isActive ? 'var(--sidebar-accent-hover, #1D4ED8)' : 'var(--sidebar-bg-tertiary, #F1F5F9)'};
		transform: translateX(2px);
	}

	&:active {
		transform: translateX(1px);
	}
`;

const MenuItemContent = styled.div<{ $isActive?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
`;

const MenuItemIcon = styled.div<{ $color?: string; $isActive?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	color: ${(props) => props.$isActive ? 'inherit' : props.$color || 'var(--sidebar-text-secondary, #6B7280)'};
	transition: color 0.15s ease-in-out;
`;

const MenuItemText = styled.div<{ $isActive?: boolean }>`
	flex: 1;
	min-width: 0;
	
	.menu-item-title {
		font-size: var(--sidebar-item-size, 0.875rem);
		font-weight: ${(props) => props.$isActive ? '600' : '400'};
		color: inherit;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.menu-item-description {
		font-size: 0.75rem;
		color: ${(props) => props.$isActive ? 'inherit' : 'var(--sidebar-text-secondary, #6B7280)'};
		margin: 0.125rem 0 0 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;

const MenuItemBadge = styled.span<{
	$variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}>`
	padding: 0.125rem 0.5rem;
	border-radius: 9999px;
	font-size: var(--sidebar-badge-size, 0.75rem);
	font-weight: var(--sidebar-badge-weight, 500);
	flex-shrink: 0;
	
	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: var(--sidebar-accent, #2563EB);
					color: var(--sidebar-bg-primary, #FFFFFF);
				`;
			case 'success':
				return `
					background: var(--color-success-primary, #059669);
					color: var(--sidebar-bg-primary, #FFFFFF);
				`;
			case 'warning':
				return `
					background: var(--color-warning-primary, #D97706);
					color: var(--sidebar-bg-primary, #FFFFFF);
				`;
			case 'danger':
				return `
					background: var(--color-danger-primary, #DC2626);
					color: var(--sidebar-bg-primary, #FFFFFF);
				`;
			default:
				return `
					background: var(--sidebar-bg-tertiary, #F1F5F9);
					color: var(--sidebar-text-secondary, #6B7280);
				`;
		}
	}}
`;

const SubMenuContainer = styled.div<{ $isExpanded: boolean }>`
	max-height: ${(props) => (props.$isExpanded ? '1000px' : '0')};
	overflow: hidden;
	transition: max-height 0.15s ease-in-out;
`;

const SubMenuHeader = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	margin: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	background: #f3f4f6;
	border: 1px solid #e5e7eb;
	font-weight: 600;
	font-size: 0.9rem;
	color: #374151;

	&:hover {
		background: #e5e7eb;
		border-color: #d1d5db;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	svg {
		transition: transform 0.15s ease-in-out;
		transform: ${(props) => (props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)')};
		margin-left: auto;
	}
`;

const GroupSeparator = styled.div`
	margin: 0.75rem 0;
	border-top: 1px solid #e5e7eb;
	border-bottom: 1px solid #f9fafb;
	height: 1px;
`;

// Menu Data Structure - Enhanced for V9 and PingOne UI
interface MenuItem {
	id: string;
	label: string;
	path?: string;
	icon: string; // Changed from React.ReactNode to string for MDI icons
	badge?: {
		text: string;
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
	};
	children?: MenuItem[];
	isVisible?: boolean;
	version?: 'v7' | 'v8' | 'v9' | 'v8u'; // Add version support
	category?: 'core' | 'auth' | 'protect' | 'legacy' | 'dev' | 'docs'; // Add categorization
	description?: string; // Add descriptions for better UX
	status?: 'active' | 'deprecated' | 'experimental'; // Add status indicators
}

// Main menu structure
const menuData: MenuItem[] = [
	{
		id: 'core-config',
		label: 'Core & Configuration',
		icon: 'mdi-cpu',
		children: [
			{
				id: 'dashboard',
				label: 'Dashboard',
				icon: 'mdi-activity',
				path: '/dashboard',
			},
			{
				id: 'configuration',
				label: 'Configuration',
				icon: 'mdi-cog',
				path: '/configuration',
			},
			{
				id: 'environment-management',
				label: 'Environment Management',
				icon: 'mdi-server',
				path: '/environments',
			},
			{
				id: 'feature-flags',
				label: 'Feature Flags',
				icon: 'mdi-shield-check',
				path: '/v8/mfa-feature-flags',
			},
			{
				id: 'api-status',
				label: 'API Status',
				icon: 'mdi-check-circle',
				path: '/system-status',
			},
		],
	},
	{
		id: 'oauth-flows',
		label: 'OAuth Flows',
		icon: 'mdi-key',
		children: [
			{
				id: 'oauth-authorization-code',
				label: 'Authorization Code Flow',
				icon: 'mdi-key',
				path: '/flows/oauth-authorization-code-v8',
				version: 'v8',
				description: 'OAuth 2.0 Authorization Code Flow with PKCE',
				status: 'active',
				badge: {
					text: 'REAL',
					variant: 'success'
				}
			},
			{
				id: 'oauth-implicit',
				label: 'Implicit Flow',
				icon: 'mdi-key',
				path: '/flows/implicit-v8',
				version: 'v8',
				description: 'OAuth 2.0 Implicit Flow (deprecated)',
				status: 'deprecated',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'oauth-client-credentials',
				label: 'Client Credentials Flow',
				icon: 'mdi-key',
				path: '/flows/client-credentials-v7',
				version: 'v7',
				description: 'OAuth 2.0 Client Credentials Flow',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'oauth-resource-owner',
				label: 'Resource Owner Password',
				icon: 'mdi-key',
				path: '/flows/oauth-ropc-v7',
				version: 'v7',
				description: 'OAuth 2.0 Resource Owner Password Flow',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'oauth-device-authorization',
				label: 'Device Authorization Flow',
				icon: 'mdi-devices',
				path: '/flows/device-authorization',
				version: 'v8',
				description: 'OAuth 2.0 Device Authorization Flow',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'oauth-jwt-bearer',
				label: 'JWT Bearer Flow',
				icon: 'mdi-key',
				path: '/flows/jwt-bearer',
				version: 'v8',
				description: 'OAuth 2.0 JWT Bearer Token Flow',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'oauth-par',
				label: 'PAR (Pushed Authorization Request)',
				icon: 'mdi-key',
				path: '/flows/oauth-par',
				version: 'v9',
				description: 'OAuth 2.0 Pushed Authorization Request',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'oauth-token-exchange',
				label: 'Token Exchange',
				icon: 'mdi-swap-horizontal',
				path: '/flows/token-exchange',
				version: 'v8',
				description: 'OAuth 2.0 Token Exchange',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
		],
	},
	{
		id: 'mfa-flows',
		label: 'MFA Flows',
		icon: 'mdi-shield-check',
		children: [
			{
				id: 'mfa-device-authorization',
				label: 'MFA Device Authorization',
				icon: 'mdi-devices',
				path: '/mfa/device-authorization',
				version: 'v8',
				description: 'Multi-Factor Authentication Device Flow',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'mfa-push',
				label: 'MFA Push',
				icon: 'mdi-cellphone',
				path: '/mfa/push',
				version: 'v8',
				description: 'Multi-Factor Authentication Push',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'mfa-sms',
				label: 'MFA SMS',
				icon: 'mdi-message',
				path: '/mfa/sms',
				version: 'v8',
				description: 'Multi-Factor Authentication SMS',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'mfa-email',
				label: 'MFA Email',
				icon: 'mdi-email',
				path: '/mfa/email',
				version: 'v8',
				description: 'Multi-Factor Authentication Email',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'mfa-voice',
				label: 'MFA Voice',
				icon: 'mdi-phone',
				path: '/mfa/voice',
				version: 'v8',
				description: 'Multi-Factor Authentication Voice',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'mfa-whatsapp',
				label: 'MFA WhatsApp',
				icon: 'mdi-whatsapp',
				path: '/mfa/whatsapp',
				version: 'v8',
				description: 'Multi-Factor Authentication WhatsApp',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'mfa-fido',
				label: 'MFA FIDO/WebAuthn',
				icon: 'mdi-fingerprint',
				path: '/mfa/fido',
				version: 'v8',
				description: 'Multi-Factor Authentication FIDO/WebAuthn',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
		],
	},
	{
		id: 'pingone-protect',
		label: 'PingOne Protect',
		icon: 'mdi-shield-check',
		children: [
			{
				id: 'protect-flow',
				label: 'Protect Flow',
				icon: 'mdi-activity',
				path: '/pingone-protect',
			},
			{
				id: 'user-search',
				label: 'User Search Dropdown',
				icon: 'mdi-account-search',
				path: '/user-search',
			},
			{
				id: 'login-patterns',
				label: 'Login Patterns',
				icon: 'mdi-login',
				path: '/login-patterns',
			},
			{
				id: 'security-monitoring',
				label: 'Security Monitoring',
				icon: 'mdi-activity',
				path: '/security-monitoring',
			},
		],
	},
	{
		id: 'unified-flows',
		label: 'Unified Flows (V8U)',
		icon: 'mdi-merge',
		children: [
			{
				id: 'unified-oauth-flow',
				label: 'Unified OAuth Flow',
				icon: 'mdi-key',
				path: '/v8u/unified/oauth-authz',
				version: 'v8u',
				description: 'Unified OAuth 2.0 Flow with enhanced features',
				status: 'active',
				badge: {
					text: 'REAL',
					variant: 'success'
				}
			},
			{
				id: 'unified-mfa-flow',
				label: 'Unified MFA Flow',
				icon: 'mdi-shield-check',
				path: '/v8/unified-mfa',
				version: 'v8',
				description: 'Unified Multi-Factor Authentication Flow',
				status: 'active',
				badge: {
					text: 'REAL',
					variant: 'success'
				}
			},
			{
				id: 'enhanced-state-management',
				label: 'Enhanced State Management',
				icon: 'mdi-cog',
				path: '/enhanced-state-management',
				version: 'v8u',
				description: 'Advanced state management and debugging',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'flow-comparison',
				label: 'Flow Comparison',
				icon: 'mdi-compare',
				path: '/flow-comparison',
				version: 'v8u',
				description: 'Compare different OAuth flows side by side',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'token-api-documentation',
				label: 'Token API Documentation',
				icon: 'mdi-file-document',
				path: '/token-api-documentation',
				version: 'v8u',
				description: 'Comprehensive token API documentation',
				status: 'active',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'spiffe-spire-flow',
				label: 'SPIFFE/SPIRE Flow',
				icon: 'mdi-shield-check',
				path: '/spiffe-spire-flow',
				version: 'v8u',
				description: 'SPIFFE/SPIRE identity flow',
				status: 'experimental',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
			{
				id: 'spiffe-spire-token-display',
				label: 'SPIFFE/SPIRE Token Display',
				icon: 'mdi-shield-check',
				path: '/spiffe-spire-token-display',
				version: 'v8u',
				description: 'SPIFFE/SPIRE token visualization',
				status: 'experimental',
				badge: {
					text: 'MOCK',
					variant: 'default'
				}
			},
		],
	},
	{
		id: 'token-management',
		label: 'Token Management',
		icon: 'mdi-key',
		children: [
			{
				id: 'token-status',
				label: 'Token Status',
				icon: 'mdi-check-circle',
				path: '/token-status',
				version: 'v8u',
				description: 'Real-time token status monitoring',
				status: 'active',
			},
			{
				id: 'token-refresh',
				label: 'Token Refresh',
				icon: 'mdi-refresh',
				path: '/token-refresh',
				version: 'v7',
				description: 'OAuth 2.0 Token Refresh Flow',
				status: 'active',
			},
			{
				id: 'token-revocation',
				label: 'Token Revocation',
				icon: 'mdi-delete',
				path: '/flows/token-revocation',
				version: 'v8',
				description: 'OAuth 2.0 Token Revocation Flow',
				status: 'active',
			},
			{
				id: 'token-introspection',
				label: 'Token Introspection',
				icon: 'mdi-eye',
				path: '/flows/token-introspection',
				version: 'v7',
				description: 'OAuth 2.0 Token Introspection Flow',
				status: 'active',
			},
			{
				id: 'worker-token-tester',
				label: 'Worker Token Tester',
				icon: 'mdi-worker',
				path: '/worker-token-tester',
				version: 'v8',
				description: 'Test worker token functionality',
				status: 'active',
			},
			{
				id: 'ultimate-token-display',
				label: 'Ultimate Token Display',
				icon: 'mdi-eye',
				path: '/ultimate-token-display-demo',
				version: 'v8',
				description: 'Advanced token visualization and analysis',
				status: 'active',
			},
		],
	},
	{
		id: 'tools-utilities',
		label: 'Tools & Utilities',
		icon: 'mdi-tools',
		children: [
			{
				id: 'client-generator',
				label: 'Client Generator',
				icon: 'mdi-code-tags',
				path: '/client-generator',
				version: 'v8',
				description: 'Generate OAuth client configurations',
				status: 'active',
			},
			{
				id: 'oauth-code-generator-hub',
				label: 'OAuth Code Generator Hub',
				icon: 'mdi-code-tags',
				path: '/oauth-code-generator-hub',
				version: 'v8',
				description: 'Centralized OAuth code generation tools',
				status: 'active',
			},
			{
				id: 'postman-collection-generator',
				label: 'Postman Collection Generator',
				icon: 'mdi-api',
				path: '/postman-collection-generator',
				version: 'v8',
				description: 'Generate Postman collections for APIs',
				status: 'active',
			},
			{
				id: 'device-management',
				label: 'Device Management',
				icon: 'mdi-devices',
				path: '/v8/device-management',
				version: 'v9',
				description: 'Manage registered devices',
				status: 'active',
			},
			{
				id: 'delete-all-devices',
				label: 'Delete All Devices',
				icon: 'mdi-delete',
				path: '/v8/delete-all-devices',
				version: 'v8',
				description: 'Utility to delete all registered devices',
				status: 'active',
			},
			{
				id: 'debug-logs',
				label: 'Debug Logs',
				icon: 'mdi-bug',
				path: '/v8/debug-logs',
				version: 'v8',
				description: 'View and debug application logs',
				status: 'active',
			},
		],
	},
	{
		id: 'developer-tools',
		label: 'Developer Tools',
		icon: 'mdi-code-tags',
		children: [
			{
				id: 'sdk-examples',
				label: 'SDK Examples',
				icon: 'mdi-code-tags',
				path: '/sdk-examples',
			},
			{
				id: 'configuration-tools',
				label: 'Configuration Tools',
				icon: 'mdi-cog',
				path: '/advanced-configuration',
			},
			{
				id: 'debug-troubleshooting',
				label: 'Debug & Troubleshooting',
				icon: 'mdi-tools',
				path: '/debug-logs',
			},
			{
				id: 'code-generators',
				label: 'Code Generators',
				icon: 'mdi-code-tags',
				path: '/code-generators',
			},
		],
	},
	{
		id: 'documentation-learning',
		label: 'Documentation & Learning',
		icon: 'mdi-book',
		children: [
			{
				id: 'protocol-documentation',
				label: 'Protocol Documentation',
				icon: 'mdi-file-document',
				path: '/documentation',
			},
			{
				id: 'api-reference',
				label: 'API Reference',
				icon: 'mdi-file-document',
				path: '/api-reference',
			},
			{
				id: 'security-guides',
				label: 'Security Guides',
				icon: 'mdi-shield-check',
				path: '/security-guides',
			},
			{
				id: 'ai-identity',
				label: 'AI & Identity',
				icon: 'mdi-cpu',
				path: '/ai-identity-architectures',
			},
		],
	},
];

// Helper Functions
const filterMenuItems = (
	items: MenuItem[],
	searchQuery: string,
	matchAnywhere: boolean
): MenuItem[] => {
	if (!searchQuery) return items;

	const query = searchQuery.toLowerCase();

	return items.reduce((acc: MenuItem[], item) => {
		const matchesSearch = matchAnywhere
			? item.label.toLowerCase().includes(query)
			: item.label.toLowerCase().startsWith(query);

		let filteredChildren: MenuItem[] = [];
		if (item.children) {
			filteredChildren = filterMenuItems(item.children, searchQuery, matchAnywhere);
		}

		if (matchesSearch || filteredChildren.length > 0) {
			acc.push({
				...item,
				children: filteredChildren.length > 0 ? filteredChildren : item.children,
				isVisible: matchesSearch || filteredChildren.length > 0,
			});
		}

		return acc;
	}, []);
};

// Main Component
interface UnifiedSidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
	initialWidth?: number;
	dragMode?: boolean;
	searchQuery?: string;
	matchAnywhere?: boolean;
	onSearchChange?: (query: string) => void;
	onMatchAnywhereChange?: (matchAnywhere: boolean) => void;
	onDragModeToggle?: (dragMode: boolean) => void;
	onMenuReorder?: (newMenuData: MenuItem[]) => void; // Add this callback
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
	isOpen = true,
	onClose,
	initialWidth = 350,
	dragMode: initialDragMode = false,
	searchQuery: initialSearchQuery = '',
	matchAnywhere: initialMatchAnywhere = false,
	onSearchChange,
	onMatchAnywhereChange,
	onDragModeToggle,
	onMenuReorder,
}) => {
	const [width, setWidth] = useState(initialWidth);
	const [dragMode, setDragMode] = useState(initialDragMode);
	const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
	const [matchAnywhere, setMatchAnywhere] = useState(initialMatchAnywhere);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
	const [dragOverItem, setDragOverItem] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const location = useLocation();
	const navigate = useNavigate();

	// Resize functionality
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);

		const startX = e.clientX;
		const startWidth = width;

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - startX;
			const newWidth = startWidth + deltaX;
			
			// Constrain width between 300px and 600px
			const constrainedWidth = Math.max(300, Math.min(600, newWidth));
			setWidth(constrainedWidth);
			
			// Save to localStorage for persistence
			localStorage.setItem('sidebar.width', constrainedWidth.toString());
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};

		// Change cursor and prevent text selection during resize
		document.body.style.cursor = 'ew-resize';
		document.body.style.userSelect = 'none';

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [width]);

	// Search functionality
	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			onSearchChange?.(query);
		},
		[onSearchChange]
	);

	const handleMatchAnywhereChange = useCallback(
		(match: boolean) => {
			setMatchAnywhere(match);
			onMatchAnywhereChange?.(match);
		},
		[onMatchAnywhereChange]
	);

	// Drag mode toggle
	const toggleDragDropMode = useCallback(() => {
		const newMode = !dragMode;
		setDragMode(newMode);
		onDragModeToggle?.(newMode);
	}, [dragMode, onDragModeToggle]);

	// Navigation
	const handleNavigate = useCallback(
		(path: string) => {
			navigate(path);
		},
		[navigate]
	);

	// Expand/collapse submenus
	const toggleExpanded = useCallback((itemId: string) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(itemId)) {
				newSet.delete(itemId);
			} else {
				newSet.add(itemId);
			}
			return newSet;
		});
	}, []);

	// Drag and drop handlers
	const handleDragStart = useCallback((item: MenuItem) => {
		setDraggedItem(item);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, itemId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOverItem(itemId);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// Only clear if leaving the actual drop zone
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
			setDragOverItem(null);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, targetItem: MenuItem) => {
			e.preventDefault();
			e.stopPropagation();
			setDragOverItem(null);

			if (!draggedItem || draggedItem.id === targetItem.id) {
				setDraggedItem(null);
				return;
			}

			// Find the items in the current filtered data
			const filteredData = filterMenuItems(menuData, searchQuery, matchAnywhere);
			
			// Find the dragged and target items in the filtered data
			const findItemInData = (items: MenuItem[], targetId: string): MenuItem | null => {
				for (const item of items) {
					if (item.id === targetId) return item;
					if (item.children) {
						const found = findItemInData(item.children, targetId);
						if (found) return found;
					}
				}
				return null;
			};

			const draggedInData = findItemInData(filteredData, draggedItem.id);
			const targetInData = findItemInData(filteredData, targetItem.id);

			if (!draggedInData || !targetInData) {
				setDraggedItem(null);
				return;
			}

			// Update the menu data with reordered items
			const reorderMenuItems = (items: MenuItem[]): MenuItem[] => {
				const newItems = [...items];
				const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);
				const targetIndex = newItems.findIndex(item => item.id === targetItem.id);

				if (draggedIndex !== -1 && targetIndex !== -1) {
					// Remove dragged item
					const [removed] = newItems.splice(draggedIndex, 1);
					// Insert at target position
					newItems.splice(targetIndex, 0, removed);
				}

				return newItems.map(item => ({
					...item,
					children: item.children ? reorderMenuItems(item.children) : undefined
				}));
			};

			// Apply the reordering to the original menu data
			const reorderedMenuData = reorderMenuItems(menuData);
			
			// Update the menu data via callback
			if (onMenuReorder) {
				onMenuReorder(reorderedMenuData);
			}
			
			// Save the new order to localStorage
			localStorage.setItem('sidebar.menuOrder', JSON.stringify(reorderedMenuData));
			
			console.log('Reordering:', draggedItem.label, '→', targetItem.label);

			setDraggedItem(null);
		},
		[draggedItem, menuData, searchQuery, matchAnywhere, onMenuReorder]
	);

	// Filter menu items based on search
	const filteredMenuData = useMemo(() => {
		return filterMenuItems(menuData, searchQuery, matchAnywhere);
	}, [searchQuery, matchAnywhere]);

	// Check if item is active
	const isItemActive = useCallback(
		(item: MenuItem): boolean => {
			if (item.path) {
				return location.pathname === item.path;
			}
			if (item.children) {
				return item.children.some((child) => isItemActive(child));
			}
			return false;
		},
		[location]
	);

	// Render menu item
	const renderMenuItem = useCallback(
		(item: MenuItem, level: number = 0, _isLastInGroup?: boolean) => {
			const isActive = isItemActive(item);
			const isExpanded = expandedItems.has(item.id);
			const hasChildren = item.children && item.children.length > 0;

			if (hasChildren) {
				return (
					<div key={item.id}>
						<SubMenuHeader $isExpanded={isExpanded} onClick={() => toggleExpanded(item.id)}>
							<MenuItemIcon $color={isActive ? 'var(--sidebar-accent, #2563EB)' : 'var(--sidebar-text-secondary, #6B7280)'}>
								<MDIIcon icon={item.icon} size={18} />
							</MenuItemIcon>
							<MenuItemText $isActive={isActive}>
								<div className="menu-item-title">{item.label}</div>
								{item.description && (
									<div className="menu-item-description">{item.description}</div>
								)}
							</MenuItemText>
							<MDIIcon icon="mdi-chevron-down" size={14} style={{ marginLeft: 'auto' }} />
							{item.badge && (
								<MenuItemBadge $variant={item.badge.variant}>{item.badge.text}</MenuItemBadge>
							)}
						</SubMenuHeader>
						<SubMenuContainer $isExpanded={isExpanded}>
							{item.children?.map((child, index) =>
								renderMenuItem(child, level + 1, index === item.children!.length - 1)
							)}
						</SubMenuContainer>
					</div>
				);
			}

			return (
				<MenuItemContainer
					key={item.id}
					$isActive={isActive}
					$isDragging={draggedItem?.id === item.id}
					$isOver={dragOverItem === item.id}
					onClick={() => item.path && handleNavigate(item.path)}
					draggable={dragMode}
					onDragStart={() => dragMode && handleDragStart(item)}
					onDragOver={(e) => dragMode && handleDragOver(e, item.id)}
					onDragLeave={dragMode ? handleDragLeave : undefined}
					onDrop={(e) => dragMode && handleDrop(e, item)}
				>
					<MenuItemContent $isActive={isActive}>
						<MenuItemIcon $color={isActive ? 'inherit' : 'var(--sidebar-text-secondary, #6B7280)'} $isActive={isActive}>
							<MDIIcon icon={item.icon} size={18} />
						</MenuItemIcon>
						<MenuItemText $isActive={isActive}>
							<div className="menu-item-title">{item.label}</div>
							{item.description && (
								<div className="menu-item-description">{item.description}</div>
							)}
						</MenuItemText>
						{item.badge && (
							<MenuItemBadge $variant={item.badge.variant}>{item.badge.text}</MenuItemBadge>
						)}
					</MenuItemContent>
				</MenuItemContainer>
			);
		},
		[
			isItemActive,
			expandedItems,
			draggedItem,
			dragOverItem,
			dragMode,
			handleNavigate,
			toggleExpanded,
			handleDragStart,
			handleDragOver,
			handleDragLeave,
			handleDrop,
		]
	);

	return (
		<SidebarContainer $width={width} $isOpen={isOpen}>
			<ResizeHandle onMouseDown={handleMouseDown} data-dragging={isDragging} />

			<SidebarHeader>
				{/* Menu System Indicator */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: '8px',
						padding: '4px 8px',
						background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
						borderRadius: '6px',
					}}
				>
					<span
						style={{
							fontSize: '0.75rem',
							fontWeight: '600',
							color: 'white',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
						}}
					>
						Unified Sidebar V2
					</span>
				</div>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '16px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
						PingOne MasterFlow API
					</h2>
					<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
						<VersionBadge version={APP_VERSION} variant="sidebar" />
						{onClose && (
							<CloseButton onClick={onClose}>
								<i className="mdi mdi-close" style={{ fontSize: 20 }}></i>
							</CloseButton>
						)}
					</div>
				</div>

				{/* Search */}
				<SidebarSearch
					onSearch={handleSearch}
					placeholder="Search flows and pages..."
					activeSearchQuery={searchQuery}
					matchAnywhere={matchAnywhere}
					onMatchAnywhereChange={handleMatchAnywhereChange}
				/>

				{/* Drag Mode Toggle */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '12px' }}>
					<DragModeToggle
						onClick={toggleDragDropMode}
						title={dragMode ? 'Switch to standard menu' : 'Enable drag & drop mode'}
						$isActive={dragMode}
					>
						<i className="mdi-drag-horizontal-variant" style={{ fontSize: 14 }}></i>
						{dragMode ? 'Drag Mode' : 'Enable Drag'}
					</DragModeToggle>
				</div>
			</SidebarHeader>

			{/* Main Content */}
			<SidebarContent>
				{filteredMenuData.map((item, index) => (
					<div key={item.id}>
						{renderMenuItem(item, 0, index === filteredMenuData.length - 1)}
						{index < filteredMenuData.length - 1 && <GroupSeparator />}
					</div>
				))}
			</SidebarContent>

			<SidebarFooter>
				<div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
					© 2026 PingOne MasterFlow API
				</div>
			</SidebarFooter>
		</SidebarContainer>
	);
};

export default UnifiedSidebar;
