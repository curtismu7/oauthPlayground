// src/v8m/pages/V8MTokenExchange.tsx
// V8M OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiBriefcase,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiCopy,
	FiCpu,
	FiDollarSign,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiTerminal,
	FiUsers,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import EnhancedApiCallDisplay from '../../components/EnhancedApiCallDisplay';
import { LearningTooltip } from '../../components/LearningTooltip';
import { usePageScroll } from '../../hooks/usePageScroll';
import type { EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { FlowUIService } from '../../services/flowUIService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

type TokenExchangeScenario =
	| 'delegation'
	| 'impersonation'
	| 'scope-reduction'
	| 'audience-restriction';

// Get UI components from FlowUIService
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const Header = styled.div`
	background: #ffffff;
	border-bottom: 2px solid #e2e8f0;
	color: #1f2937;
	padding: 2rem;
	text-align: center;
`;

const VersionBadge = styled.span`
	background: #f3f4f6;
	border: 1px solid #d1d5db;
	color: #374151;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	margin-bottom: 1rem;
	display: inline-block;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
	color: #1f2937;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #4b5563;
	margin: 0;
`;

const ContentSection = styled.div`
	padding: 2rem;
`;

const ScenarioSelector = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin: 2rem 0;
`;

const ScenarioCard = styled.button<{ $selected: boolean }>`
	padding: 1.5rem;
	border: 2px solid ${({ $selected }) => ($selected ? '#7c3aed' : '#e2e8f0')};
	border-radius: 0.75rem;
	background: ${({ $selected }) => ($selected ? '#f3f4f6' : '#ffffff')};
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;

	&:hover {
		border-color: #7c3aed;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
	}
`;

const ScenarioIcon = styled.div`
	font-size: 1.5rem;
	color: #7c3aed;
	margin-bottom: 0.75rem;
`;

const ScenarioTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
`;

const ScenarioDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.5;
`;

// Additional styled components for the flow
const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			if ($variant === 'error') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'error') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #374151;
	transition: background 0.2s ease;
	line-height: 1.4;
	min-height: 72px;
	gap: 0.75rem;

	&:hover {
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1.5rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 1rem 0;
`;

const StepIndicator = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin: 2rem 0;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
`;

const StepNumber = styled.div`
	width: 2rem;
	height: 2rem;
	background: #7c3aed;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
`;

const StepContent = styled.div`
	flex: 1;
`;

const StepTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.25rem 0;
`;

const StepDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	
	${({ $variant }) =>
		$variant === 'primary'
			? `
				background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
				color: white;
				&:hover {
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
				}
			`
			: `
				background: #f3f4f6;
				color: #374151;
				border: 1px solid #d1d5db;
				&:hover {
					background: #e5e7eb;
				}
			`}
`;

const ScopeSelector = styled.div`
	margin: 1.5rem 0;
	padding: 1.5rem;
	background: #f8fafc;
	border-radius: 0.75rem;
	border: 1px solid #e2e8f0;
`;

const ScopeSelectorTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ScopeGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 0.75rem;
`;

const ScopeOption = styled.label<{ $selected: boolean; $category?: string }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	background: ${({ $selected }) => ($selected ? '#e0e7ff' : '#ffffff')};
	border: 2px solid ${({ $selected, $category }) => {
		if ($selected) return '#7c3aed';
		switch ($category) {
			case 'banking':
				return '#22c55e';
			case 'payments':
				return '#f59e0b';
			case 'mcp':
				return '#7c3aed';
			case 'compliance':
				return '#ef4444';
			case 'admin':
				return '#dc2626';
			case 'user':
				return '#3b82f6';
			case 'business':
				return '#059669';
			case 'system':
				return '#6b7280';
			default:
				return '#e2e8f0';
		}
	}};
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${({ $selected }) => ($selected ? '#5b21b6' : '#374151')};
	position: relative;

	&:hover {
		border-color: #7c3aed;
		background: ${({ $selected }) => ($selected ? '#e0e7ff' : '#f3f4f6')};
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
	}

	input[type="checkbox"] {
		margin: 0;
		width: 1rem;
		height: 1rem;
		accent-color: #7c3aed;
	}

	&::before {
		content: '';
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: ${({ $category }) => {
			switch ($category) {
				case 'banking':
					return '#22c55e';
				case 'payments':
					return '#f59e0b';
				case 'mcp':
					return '#7c3aed';
				case 'compliance':
					return '#ef4444';
				case 'admin':
					return '#dc2626';
				case 'user':
					return '#3b82f6';
				case 'business':
					return '#059669';
				case 'system':
					return '#6b7280';
				default:
					return '#e2e8f0';
			}
		}};
	}
`;

const ScopeDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	margin-top: 0.25rem;
`;

const SelectedScopesDisplay = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: #ffffff;
	border-radius: 0.5rem;
	border: 1px solid #d1d5db;
`;

const SelectedScopesTitle = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const SelectedScopesList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const ScopeTag = styled.span`
	background: #7c3aed;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 500;
`;

const MetricsCard = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border: 1px solid #cbd5e1;
	border-radius: 0.75rem;
	padding: 1rem;
	text-align: center;
`;

const MetricValue = styled.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-weight: 600;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0;
`;

const ParameterGroup = styled.div`
	padding: 1rem;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const ParameterLabel = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const ParameterSelect = styled.select`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const ParameterInput = styled.input`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	
	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const ParameterTextarea = styled.textarea`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	resize: vertical;
	min-height: 80px;
	
	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const ParameterDescription = styled.p`
	font-size: 0.75rem;
	color: #6b7280;
	margin: 0.25rem 0 0 0;
	line-height: 1.4;
`;

const GeneratedContentBox = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ParameterValue = styled.div`
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background: #f0fdf4;
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #16a34a;
	margin-top: 0.5rem;
`;

const CheckboxGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.5rem;
`;

const EducationalBox = styled.div<{ $type?: 'info' | 'warning' | 'success' | 'security' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $type }) => {
			if ($type === 'warning') return '#f59e0b';
			if ($type === 'success') return '#22c55e';
			if ($type === 'security') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $type }) => {
			if ($type === 'warning') return '#fef3c7';
			if ($type === 'success') return '#dcfce7';
			if ($type === 'security') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const TroubleshootingTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 1rem 0;
	font-size: 0.875rem;
	
	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
	}
	
	th {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
	}
	
	td {
		color: #6b7280;
	}
	
	tr:hover {
		background: #f9fafb;
	}
`;

// Static scenarios data - moved outside component to prevent infinite re-renders
const scenarios = {
	delegation: {
		icon: <FiUsers />,
		title: 'User Delegation',
		description: 'Exchange user token for service-specific token with reduced scope',
		useCase: 'User authorizes app to call downstream service on their behalf',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://api.salesforce.com',
		scope: 'read:profile read:contacts',
		color: '#3b82f6',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgcmVhZDpjb250YWN0cyByZWFkOmNhbGVuZGFyIHdyaXRlOmRhdGEiLCJhdWQiOiJteS13ZWItYXBwIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiZXhwIjoxNzI5NjM5NDQ3fQ...',
		availableScopes: [
			{ name: 'read:profile', description: 'Read user profile information', category: 'user' },
			{ name: 'read:contacts', description: 'Read user contacts from CRM', category: 'user' },
			{ name: 'write:contacts', description: 'Create/update contacts in CRM', category: 'user' },
			{ name: 'read:calendar', description: 'Read user calendar events', category: 'user' },
			{
				name: 'read:opportunities',
				description: 'Read sales opportunities',
				category: 'business',
			},
			{
				name: 'offline_access',
				description: 'Access data when user is offline',
				category: 'system',
			},
		],
		defaultClaims: '{"id_token":{"email":{"essential":true},"name":{"essential":true}}}',
		defaultAuthDetails:
			'[{"type":"crm_access","actions":["read"],"resources":["contacts","opportunities"]}]',
	},
	impersonation: {
		icon: <FiShield />,
		title: 'Service Impersonation',
		description: 'Service acts on behalf of user with limited permissions',
		useCase: 'Backend service needs to call API as if it were the user',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://api.internal.company.com',
		scope: 'impersonate:user audit:read',
		color: '#f59e0b',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl91c2VyIiwic2NvcGUiOiJhZG1pbjpmdWxsIGltcGVyc29uYXRlOnVzZXIgYXVkaXQ6cmVhZCBhdWRpdDp3cml0ZSIsImF1ZCI6ImFkbWluLWRhc2hib2FyZCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0N30...',
		availableScopes: [
			{
				name: 'impersonate:user',
				description: 'Act on behalf of the user',
				category: 'delegation',
			},
			{
				name: 'audit:read',
				description: 'Read audit logs and compliance data',
				category: 'compliance',
			},
			{ name: 'audit:write', description: 'Write audit entries', category: 'compliance' },
			{ name: 'admin:limited', description: 'Limited administrative access', category: 'admin' },
			{ name: 'system:monitor', description: 'System monitoring access', category: 'system' },
			{ name: 'logs:read', description: 'Read system logs', category: 'system' },
		],
		defaultClaims:
			'{"id_token":{"sub":{"essential":true},"auth_method":{"essential":true},"impersonator":{"essential":true}}}',
		defaultAuthDetails:
			'[{"type":"impersonation","actor":"service_account","target":"user","permissions":["audit:read","admin:limited"]}]',
	},
	audienceRestriction: {
		icon: <FiLock />,
		title: 'Audience Restriction',
		description: 'Exchange token for one with restricted audience (downscoped)',
		useCase: 'Frontend needs token with limited access to specific microservice',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://payments.api.company.com',
		scope: 'payments:read payments:write',
		color: '#10b981',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2FjY291bnQiLCJzY29wZSI6ImFkbWluOmZ1bGwgcGF5bWVudHM6cmVhZCBwYXltZW50czp3cml0ZSBhdWRpdDpyZWFkIGF1ZGl0OndyaXRlIiwiYXVkIjoibWFpbi1hcHAiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
		availableScopes: [
			{ name: 'payments:read', description: 'Read payment data', category: 'financial' },
			{ name: 'payments:write', description: 'Create/update payments', category: 'financial' },
			{ name: 'payments:refund', description: 'Process refunds', category: 'financial' },
			{ name: 'transactions:read', description: 'Read transaction history', category: 'financial' },
			{
				name: 'reports:generate',
				description: 'Generate financial reports',
				category: 'reporting',
			},
			{ name: 'compliance:read', description: 'Access compliance data', category: 'compliance' },
		],
		defaultClaims:
			'{"access_control":{"audience":["payments.api.company.com"],"restrictions":["ip_whitelist"]}}',
		defaultAuthDetails:
			'[{"type":"access_control","audience":"payments.api.company.com","restrictions":["ip_whitelist","rate_limit"]}]',
	},
	domainDelegation: {
		icon: <FiGlobe />,
		title: 'Cross-Domain Delegation',
		description: 'Exchange token for access to resources in another domain',
		useCase: 'Partner application needs access to user data across organizational boundaries',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://partner-api.external-org.com',
		scope: 'user:profile data:read analytics:view',
		color: '#8b5cf6',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2RvbWFpbiIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgZG9tYWluOmRlbGVnYXRlIGRhdGE6cmVhZCBhbmFseXRpY3M6dmlldyIsImF1ZCI6Im9yZy1tYWluLWFwcCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0N30...',
		availableScopes: [
			{ name: 'user:profile', description: 'Access user profile data', category: 'user' },
			{ name: 'data:read', description: 'Read shared data', category: 'data' },
			{ name: 'analytics:view', description: 'View analytics reports', category: 'analytics' },
			{ name: 'reports:export', description: 'Export shared reports', category: 'reporting' },
			{
				name: 'audit:trail',
				description: 'Access audit trail for cross-domain access',
				category: 'compliance',
			},
		],
		defaultClaims:
			'{"domain_delegation":{"source_domain":"my-org.com","target_domain":"partner-org.com","permissions":["read","view"]}}',
		defaultAuthDetails:
			'[{"type":"domain_delegation","source":"my-org.com","target":"partner-org.com","access_level":"limited"}]',
	},
	onBehalfOfClient: {
		icon: <FiBriefcase />,
		title: 'On-Behalf-Of Client',
		description: 'Service exchanges user token to act as client on behalf of user',
		useCase: 'Middleware service calls downstream API using client credentials with user context',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://downstream-api.service.com',
		scope: 'client:access user:context',
		color: '#f97316',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2NsaWVudCIsInNjb3BlIjoiY2xpZW50OmFjY2VzcyB1c2VyOmNvbnRleHQgYXBpOmNhbGwgZGVidWc6dHJhY2UiLCJhdWQiOiJtaWRkbGV3YXJlLXNlcnZpY2UiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
		availableScopes: [
			{ name: 'client:access', description: 'Client-level API access', category: 'client' },
			{ name: 'user:context', description: 'User context preservation', category: 'user' },
			{ name: 'api:call', description: 'Make API calls on behalf', category: 'api' },
			{ name: 'debug:trace', description: 'Debug tracing enabled', category: 'system' },
			{
				name: 'metrics:collect',
				description: 'Collect performance metrics',
				category: 'monitoring',
			},
		],
		defaultClaims:
			'{"client_delegation":{"client_id":"middleware-service","acting_on_behalf_of":"user_123","delegation_scope":["api:call","user:context"]}}',
		defaultAuthDetails:
			'[{"type":"client_delegation","client_id":"middleware-service","user_context":"preserved","permissions":["api:call","user:context"]}]',
	},
	deviceToToken: {
		icon: <FiCpu />,
		title: 'Device-to-Token Exchange',
		description: 'Exchange device grant token for access token with different permissions',
		useCase: 'IoT device exchanges limited token for broader API access',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://iot-platform.company.com',
		scope: 'device:control data:upload telemetry:send',
		color: '#06b6d4',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZpY2VfNzg5Iiwic2NvcGUiOiJkZXZpY2U6bGltaXRlZCBkYXRhOnJlYWQgdGVsZW1ldHJ5OnNlbmQiLCJhdWQiOiJpb3QtcGxhdGZvcm0iLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
		availableScopes: [
			{ name: 'device:control', description: 'Control device operations', category: 'device' },
			{ name: 'data:upload', description: 'Upload sensor data', category: 'data' },
			{ name: 'telemetry:send', description: 'Send telemetry data', category: 'telemetry' },
			{ name: 'firmware:update', description: 'Update device firmware', category: 'maintenance' },
			{ name: 'status:report', description: 'Report device status', category: 'monitoring' },
		],
		defaultClaims:
			'{"device_info":{"device_id":"device_789","type":"sensor","firmware":"v2.1.3","location":"facility_a"}}',
		defaultAuthDetails:
			'[{"type":"device_access","device_id":"device_789","capabilities":["control","upload","telemetry"]}]',
	},
	bankingIntegration: {
		icon: <FiDollarSign />,
		title: 'Banking API Integration',
		description: 'Exchange token for banking API access with compliance requirements',
		useCase: 'FinTech application needs secure access to banking services with audit trail',
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		audience: 'https://banking-api.secure-bank.com',
		scope: 'accounts:read transactions:read payments:initiate compliance:report',
		color: '#059669',
		originalToken:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmaW50ZWNoX2NsaWVudCIsInNjb3BlIjoiYWNjb3VudHM6cmVhZCB0cmFuc2FjdGlvbnM6cmVhZCBwYXltZW50czppbml0aWF0ZSBjb21wbGlhbmNlOnJlcG9ydCIsImF1ZCI6ImJhbmtpbmctZ2F0ZXdheSIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0N30...',
		availableScopes: [
			{ name: 'accounts:read', description: 'Read account information', category: 'accounts' },
			{
				name: 'transactions:read',
				description: 'Read transaction history',
				category: 'transactions',
			},
			{ name: 'payments:initiate', description: 'Initiate payments', category: 'payments' },
			{
				name: 'compliance:report',
				description: 'Generate compliance reports',
				category: 'compliance',
			},
			{ name: 'audit:trail', description: 'Access audit trail', category: 'compliance' },
		],
		defaultClaims:
			'{"banking_context":{"client_type":"finTech","compliance_level":"PCI_DSS","audit_required":true,"jurisdiction":"US"}}',
		defaultAuthDetails:
			'[{"type":"banking_access","institution":"CBA","services":["MCP","transactions"],"compliance_level":"PCI_DSS"}]',
	},
};

// Enhanced component with detailed flow implementation
const V8MTokenExchange: React.FC = () => {
	usePageScroll({ pageName: 'V8M Token Exchange Flow', force: true });

	const [selectedScenario, setSelectedScenario] =
		useState<TokenExchangeScenario>('audience-restriction');
	const [_currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		codeExamples: true, // Implementation examples collapsed by default
		troubleshooting: true, // Troubleshooting collapsed by default
		advanced: false, // Advanced parameters expanded by default
		comparison: false, // Token comparison expanded by default
		details: false, // Scenario details expanded by default
		authzCodeFlow: false, // Authorization code flow expanded by default
		authzCodeReceived: false, // Authorization code received expanded by default
		exchangeAuthCode: false, // Exchange auth code expanded by default
		request: false, // Token exchange request expanded by default
		response: false, // Token exchange response expanded by default
		resources: true, // Additional resources collapsed by default
	});
	const [_subjectToken, setSubjectToken] = useState('');
	const [exchangedToken, setExchangedToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
	const [authCode, setAuthCode] = useState('');
	const [initialAccessToken, setInitialAccessToken] = useState('');
	const [isExchangingAuthCode, setIsExchangingAuthCode] = useState(false);
	const [exchangeParams, setExchangeParams] = useState({
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		clientAuthMethod: 'private_key_jwt',
		audience: '',
		claims: '',
		authorizationDetails: '',
	});

	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Initialize selected scopes and parameters when component mounts
	useEffect(() => {
		const defaultScopes = scenarios[selectedScenario].scope.split(' ');
		setSelectedScopes(defaultScopes);
		setExchangeParams((prev) => ({
			...prev,
			audience: scenarios[selectedScenario].audience,
			claims: scenarios[selectedScenario].defaultClaims,
			authorizationDetails: scenarios[selectedScenario].defaultAuthDetails,
		}));
	}, [selectedScenario]);

	const handleScenarioChange = useCallback(
		(scenario: TokenExchangeScenario) => {
			setSelectedScenario(scenario);
			setCurrentStep(0);
			setSubjectToken('');
			setExchangedToken('');
			setAuthCode('');
			setInitialAccessToken('');
			// Initialize with default scopes for the scenario
			const defaultScopes = scenarios[scenario].scope.split(' ');
			setSelectedScopes(defaultScopes);
			// Set scenario-specific defaults
			setExchangeParams((prev) => ({
				...prev,
				audience: scenarios[scenario].audience,
				claims: scenarios[scenario].defaultClaims,
				authorizationDetails: scenarios[scenario].defaultAuthDetails,
			}));
			v4ToastManager.showSuccess(`Selected ${scenarios[scenario].title} scenario`);
		},
		[selectedScenario]
	);

	const handleScopeToggle = useCallback((scopeName: string) => {
		setSelectedScopes((prev) => {
			if (prev.includes(scopeName)) {
				return prev.filter((scope) => scope !== scopeName);
			} else {
				return [...prev, scopeName];
			}
		});
	}, []);

	const handleParameterChange = useCallback((key: string, value: string | boolean) => {
		setExchangeParams((prev) => ({
			...prev,
			[key]: value,
		}));
	}, []);

	const simulateTokenExchange = useCallback(async () => {
		if (selectedScopes.length === 0) {
			v4ToastManager.showError('Please select at least one scope for the exchanged token');
			return;
		}

		setIsLoading(true);

		// Simulate API call delay with realistic processing time
		await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

		const _scenario = scenarios[selectedScenario];
		const timestamp = new Date().toISOString();
		const tokenId = `${selectedScenario}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Create realistic exchanged token response based on scenario
		const header = btoa(
			JSON.stringify({
				alg: 'RS256',
				typ: 'JWT',
				kid: `key-${selectedScenario}`,
			})
		);

		const payload = btoa(
			JSON.stringify({
				sub: selectedScenario === 'impersonation' ? 'service_account_123' : 'user_456',
				aud: exchangeParams.audience,
				iss: 'https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9',
				scope: selectedScopes.join(' '),
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				jti: tokenId,
				token_use: 'access',
				client_id: 'oauth-playground-client',
				username: selectedScenario === 'impersonation' ? 'system' : 'john.doe@example.com',
			})
		);

		const signature = Math.random().toString(36).substr(2, 43);

		const mockExchangedToken = {
			access_token: `${header}.${payload}.${signature}`,
			token_type: 'Bearer',
			expires_in: 3600,
			scope: selectedScopes.join(' '),
			audience: exchangeParams.audience,
			issued_token_type: exchangeParams.requestedTokenType,
			// PingOne Phase 1: No refresh token in Token Exchange responses
			// Note: includeRefreshToken is disabled in UI, but kept for future phase compatibility
			// Refresh tokens are not included in Phase 1 (coming in future phases)
			// Server metadata
			server_timestamp: timestamp,
			grant_type: exchangeParams.grantType,
			environment_id: 'b9817c16-9910-4415-b67e-4ac687da74d9',
			client_authentication_method: exchangeParams.clientAuthMethod,
			// Exchange metadata
			exchange_metadata: {
				original_audience:
					selectedScenario === 'delegation'
						? 'my-web-app'
						: selectedScenario === 'impersonation'
							? 'admin-dashboard'
							: selectedScenario === 'scope-reduction'
								? 'full-access-app'
								: 'banking-platform',
				scope_reduction: {
					original_scope_count:
						selectedScenario === 'delegation'
							? 6
							: selectedScenario === 'impersonation'
								? 4
								: selectedScenario === 'scope-reduction'
									? 6
									: 7,
					new_scope_count: selectedScopes.length,
					reduction_percentage: Math.round(
						(1 -
							selectedScopes.length /
								(selectedScenario === 'delegation'
									? 6
									: selectedScenario === 'impersonation'
										? 4
										: selectedScenario === 'scope-reduction'
											? 6
											: 7)) *
							100
					),
				},
				security_level:
					selectedScopes.length <= 2 ? 'HIGH' : selectedScopes.length <= 4 ? 'MEDIUM' : 'LOW',
				compliance_flags: {
					pci_dss:
						selectedScenario === 'audience-restriction' &&
						selectedScopes.includes('payments:initiate'),
					gdpr: selectedScopes.some((s) => s.includes('profile') || s.includes('contacts')),
					sox: selectedScenario === 'impersonation' && selectedScopes.includes('audit:read'),
				},
			},
		};

		setExchangedToken(JSON.stringify(mockExchangedToken, null, 2));
		setIsLoading(false);
		v4ToastManager.showSuccess(
			`Token exchange completed! Reduced scope by ${mockExchangedToken.exchange_metadata.scope_reduction.reduction_percentage}%`
		);
	}, [selectedScenario, exchangeParams.audience, selectedScopes, exchangeParams]);

	const currentScenario = scenarios[selectedScenario];

	// Create API call object for EnhancedApiCallDisplay
	const tokenExchangeApiCall: EnhancedApiCallData = {
		method: 'POST',
		url: 'https://auth.pingone.com/{environment_id}/as/token',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			...(exchangeParams.clientAuthMethod === 'private_key_jwt'
				? {}
				: { Authorization: 'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=' }),
		},
		body: {
			grant_type: exchangeParams.grantType,
			subject_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
			subject_token_type: exchangeParams.subjectTokenType,
			requested_token_type: exchangeParams.requestedTokenType,
			...(exchangeParams.audience && { audience: exchangeParams.audience }),
			...(exchangeParams.audience && { resource: exchangeParams.audience }),
			scope: selectedScopes.join(' ') || currentScenario.scope,
			...(exchangeParams.clientAuthMethod === 'private_key_jwt' && {
				client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
				client_assertion: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
			}),
			...(exchangeParams.claims && { claims: exchangeParams.claims }),
			...(exchangeParams.authorizationDetails && {
				authorization_details: exchangeParams.authorizationDetails,
			}),
		},
		// Note: 'token-exchange' is not a standard flowType in EnhancedApiCallData
		// Using 'client-credentials' as closest match since Token Exchange is also A2A
		flowType: 'client-credentials',
	};

	const renderAdvancedParameters = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('advanced')}>
				<CollapsibleTitle>
					<FiZap /> Advanced Token Exchange Parameters
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.advanced && (
				<CollapsibleContent>
					<EducationalBox $type="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>PingOne Token Exchange Implementation (Phase 1 - Q1 2026)</InfoTitle>
							<InfoText>
								<strong>
									PingOne plans to support OAuth 2.0 Token Exchange (RFC 8693) in Phase 1 by the end
									of Q1 2026.
								</strong>
								<br />
								<br />
								<strong>Phase 1 Coverage:</strong>
								<br />• Token Exchange must be <strong>explicitly enabled</strong> in PingOne
								application configuration
								<br />• Subject and actor tokens must be{' '}
								<strong>access tokens or ID tokens from the same PingOne environment</strong>
								<br />• Supported <code>requested_token_type</code>:{' '}
								<code>urn:ietf:params:oauth:token-type:access_token</code> and{' '}
								<code>urn:ietf:params:oauth:token-type:id_token</code>
								<br />• <strong>No refresh tokens</strong> will be included in Token Exchange
								responses (Phase 1 limitation)
								<br />• Scope parameter works similar to authorization requests - scopes must be
								added to the application's "Allowed Scopes"
								<br />
								<br />
								<strong>Future Phases:</strong> Refresh tokens, third-party authorization servers,
								advanced attribute mapping, and more (see details below).
							</InfoText>
						</div>
					</EducationalBox>

					<EducationalBox $type="warning">
						<FiAlertCircle size={20} />
						<div>
							<InfoTitle>PingOne Application Configuration Requirements</InfoTitle>
							<InfoText>
								<strong>To use Token Exchange in PingOne, administrators must configure:</strong>
								<br />• <strong>Name:</strong> App A (the application acting as the client for Token
								Exchange)
								<br />• <strong>Client ID:</strong> The client ID of App A
								<br />• <strong>Enabled Grant Type:</strong> <code>Token Exchange</code> (must be
								explicitly enabled)
								<br />• <strong>Allowed Scopes:</strong> <code>openid</code> and scopes from API B
								(e.g., <code>B.r</code>, <code>banking:transactions</code>)
								<br />• <strong>Token Endpoint Auth Method:</strong> Any supported method
								(client_secret_basic, client_secret_post, private_key_jwt, etc.)
								<br />
								<br />
								The developer of API A needs this information to construct the Token Exchange
								request to PingOne.
							</InfoText>
						</div>
					</EducationalBox>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
							gap: '1rem',
							margin: '1.5rem 0',
						}}
					>
						<EducationalBox $type="success">
							<FiKey size={20} />
							<div>
								<InfoTitle>Token Types Explained</InfoTitle>
								<InfoText>
									• <strong>Access Token:</strong> Bearer token for API access
									<br />• <strong>ID Token:</strong> JWT with user identity claims
									<br />• <strong>Refresh Token:</strong> Long-lived token for renewal
									<br />• <strong>JWT:</strong> Generic JSON Web Token format
								</InfoText>
							</div>
						</EducationalBox>
						<EducationalBox $type="warning">
							<FiUsers size={20} />
							<div>
								<InfoTitle>Grant Types Overview</InfoTitle>
								<InfoText>
									• <strong>Token Exchange:</strong> RFC 8693 delegation/impersonation
									<br />• <strong>Authorization Code:</strong> Standard web app flow
									<br />• <strong>Refresh Token:</strong> Renew expired access tokens
									<br />• <strong>Client Credentials:</strong> Machine-to-machine auth
								</InfoText>
							</div>
						</EducationalBox>
					</div>

					<ParameterGrid>
						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="learning"
									title="Grant Type"
									content="OAuth 2.0 grant type determines how the client obtains tokens. Token Exchange (RFC 8693) is used for exchanging one token for another."
									placement="top"
								>
									Grant Type
								</LearningTooltip>
							</ParameterLabel>
							<ParameterSelect
								value={exchangeParams.grantType}
								onChange={(e) => handleParameterChange('grantType', e.target.value)}
							>
								<option value="urn:ietf:params:oauth:grant-type:token-exchange">
									Token Exchange (RFC 8693)
								</option>
								<option value="authorization_code">Authorization Code</option>
								<option value="refresh_token">Refresh Token</option>
								<option value="client_credentials">Client Credentials</option>
							</ParameterSelect>
							<ParameterDescription>
								Determines the type of token exchange flow being performed
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="learning"
									title="Subject Token Type"
									content="The type of token you're providing as input to the exchange (access token, ID token, refresh token, or generic JWT)."
									placement="top"
								>
									Subject Token Type
								</LearningTooltip>
							</ParameterLabel>
							<ParameterSelect
								value={exchangeParams.subjectTokenType}
								onChange={(e) => handleParameterChange('subjectTokenType', e.target.value)}
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">Access Token</option>
								<option value="urn:ietf:params:oauth:token-type:id_token">ID Token</option>
								<option value="urn:ietf:params:oauth:token-type:refresh_token">
									Refresh Token
								</option>
								<option value="urn:ietf:params:oauth:token-type:jwt">JWT</option>
							</ParameterSelect>
							<ParameterDescription>
								Type of the token being exchanged (the input token)
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="learning"
									title="Requested Token Type"
									content="The type of token you want to receive from the exchange. PingOne Phase 1 supports access_token and id_token types. Refresh tokens are not supported in Phase 1 (coming in future phases)."
									placement="top"
								>
									Requested Token Type
									<span style={{ color: '#f59e0b', marginLeft: '4px' }}>(PingOne Phase 1)</span>
								</LearningTooltip>
							</ParameterLabel>
							<ParameterSelect
								value={exchangeParams.requestedTokenType}
								onChange={(e) => handleParameterChange('requestedTokenType', e.target.value)}
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">
									Access Token (Phase 1)
								</option>
								<option value="urn:ietf:params:oauth:token-type:id_token">
									ID Token (Phase 1)
								</option>
								<option value="urn:ietf:params:oauth:token-type:refresh_token" disabled>
									Refresh Token (Future Phase)
								</option>
								<option value="urn:ietf:params:oauth:token-type:jwt" disabled>
									JWT (Future Phase)
								</option>
							</ParameterSelect>
							<ParameterDescription>
								<strong>PingOne Phase 1 (Q1 2026):</strong> Supports access_token and id_token only.
								When requesting id_token, the <code>access_token</code> field in the response will
								contain an ID token.
								<br />
								<br />
								<strong>Future Phases:</strong> Refresh token inclusion and{' '}
								<code>urn:ietf:params:oauth:token-type:id-jag</code> support planned.
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="learning"
									title="Client Authentication Method"
									content="How the client authenticates with the token endpoint. Private Key JWT is recommended for A2A scenarios as it doesn't require sharing secrets."
									placement="top"
								>
									Client Authentication Method
								</LearningTooltip>
							</ParameterLabel>
							<ParameterSelect
								value={exchangeParams.clientAuthMethod}
								onChange={(e) => handleParameterChange('clientAuthMethod', e.target.value)}
							>
								<option value="private_key_jwt">Private Key JWT (Recommended)</option>
								<option value="client_secret_basic">Client Secret Basic</option>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="client_secret_jwt">Client Secret JWT</option>
								<option value="none">None (Public Client)</option>
							</ParameterSelect>
							<ParameterDescription>
								How the client authenticates with the authorization server
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="info"
									title="Audience / Resource"
									content="The intended recipient of the exchanged token (URI of the target API/service). Restricts token validity to specific services, enhancing security."
									placement="top"
								>
									Audience / Resource
								</LearningTooltip>
							</ParameterLabel>
							<ParameterInput
								value={exchangeParams.audience}
								onChange={(e) => handleParameterChange('audience', e.target.value)}
								placeholder="https://api.example.com"
							/>
							<ParameterDescription>
								Target audience for the exchanged token (which API/service will receive it)
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<CheckboxGroup>
								<input
									type="checkbox"
									checked={exchangeParams.includeRefreshToken}
									onChange={(e) => handleParameterChange('includeRefreshToken', e.target.checked)}
									disabled
								/>
								<ParameterLabel style={{ margin: 0 }}>
									Include Refresh Token <span style={{ color: '#f59e0b' }}>(Future Phase)</span>
								</ParameterLabel>
							</CheckboxGroup>
							<ParameterDescription>
								<strong>PingOne Phase 1 (Q1 2026):</strong> Refresh tokens are{' '}
								<strong>not included</strong> in Token Exchange responses. This is a known Phase 1
								limitation.
								<br />
								<br />
								<strong>Future Phases:</strong> Inclusion of refresh tokens (if applicable) is
								planned for future releases after Phase 1.
							</ParameterDescription>
						</ParameterGroup>
					</ParameterGrid>

					<ParameterGrid>
						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="info"
									title="Claims (OIDC)"
									content="Claims are pieces of information about the user (email, name, groups) or the token itself. Requested via the 'claims' parameter in JSON format."
									placement="top"
								>
									Claims (OIDC)
								</LearningTooltip>{' '}
								- JSON
							</ParameterLabel>
							<ParameterTextarea
								value={exchangeParams.claims}
								onChange={(e) => handleParameterChange('claims', e.target.value)}
								placeholder='{"id_token":{"email":{"essential":true}}}'
							/>
							<ParameterDescription>
								Request specific claims in ID token or UserInfo endpoint. Use "essential":true for
								required claims.
							</ParameterDescription>
							<div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#7c3aed' }}>
								<strong>Examples:</strong> email, name, groups, custom claims
							</div>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>
								<LearningTooltip
									variant="learning"
									title="Authorization Details (RAR)"
									content="Rich Authorization Requests (RFC 9396) - Structured JSON for fine-grained authorization beyond simple scopes. Enables specifying exact resources, actions, and conditions."
									placement="top"
								>
									Authorization Details (RAR)
								</LearningTooltip>{' '}
								- JSON
							</ParameterLabel>
							<ParameterTextarea
								value={exchangeParams.authorizationDetails}
								onChange={(e) => handleParameterChange('authorizationDetails', e.target.value)}
								placeholder='[{"type":"payment_initiation","instructedAmount":{"currency":"USD","amount":"125.00"}}]'
							/>
							<ParameterDescription>
								Rich Authorization Requests for fine-grained permissions beyond simple scopes.
							</ParameterDescription>
							<div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#7c3aed' }}>
								<strong>Use cases:</strong> Payment amounts, account access, transaction limits
							</div>
						</ParameterGroup>
					</ParameterGrid>

					<EducationalBox $type="info">
						<FiGlobe size={20} />
						<div>
							<InfoTitle>
								<LearningTooltip
									variant="info"
									title="Claims"
									content="User attributes and token properties requested from the authorization server (email, name, groups)."
									placement="top"
								>
									Claims
								</LearningTooltip>{' '}
								vs{' '}
								<LearningTooltip
									variant="learning"
									title="Authorization Details (RAR)"
									content="Rich Authorization Requests - Structured JSON for fine-grained permissions specifying resources, actions, and conditions (RFC 9396)."
									placement="top"
								>
									Authorization Details (RAR)
								</LearningTooltip>{' '}
								vs{' '}
								<LearningTooltip
									variant="info"
									title="Scopes"
									content="Simple string-based permissions (e.g., 'read write delete'). Limited expressiveness compared to RAR."
									placement="top"
								>
									Scopes
								</LearningTooltip>
							</InfoTitle>
							<InfoText>
								• <strong>Scopes:</strong> Broad permission categories (read, write, admin)
								<br />• <strong>Claims:</strong> Specific user attributes in tokens (email, name,
								roles)
								<br />• <strong>Authorization Details:</strong> Fine-grained context (payment
								amounts, account numbers)
								<br />
								<br />
								Use all three together for comprehensive authorization control in banking and
								financial applications.
							</InfoText>
						</div>
					</EducationalBox>

					<EducationalBox $type="security">
						<FiShield size={20} />
						<div>
							<InfoTitle>Security Best Practices</InfoTitle>
							<InfoText>
								• <strong>Always use PKCE</strong> for public clients; recommended for all clients
								<br />• <strong>Prefer Private Key JWT</strong> for client authentication on
								confidential clients
								<br />• <strong>Restrict Token Exchange</strong> (RFC 8693) to backends only; never
								from browsers
								<br />• <strong>Validate resource values</strong> against an allow-list
								<br />• <strong>Keep tokens short-lived</strong>; rotate refresh tokens; enable
								introspection
							</InfoText>
						</div>
					</EducationalBox>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderCodeExamples = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('codeExamples')}>
				<CollapsibleTitle>
					<FiCode /> Implementation Examples
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.codeExamples && (
				<CollapsibleContent>
					<EducationalBox $type="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Real-World Implementation Examples</InfoTitle>
							<InfoText>
								See how token exchange is implemented in practice with cURL commands,
								Node.js/Express backend handlers, and React frontend components. These examples show
								the complete flow from request to response.
							</InfoText>
						</div>
					</EducationalBox>

					<div style={{ marginBottom: '2rem' }}>
						<h4
							style={{
								color: '#374151',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiTerminal size={20} /> cURL Command Example
						</h4>
						<CodeBlock>{`# Token Exchange with Advanced Parameters
AS="https://auth.pingone.com/<ENV_ID>"
TOKEN="$AS/as/token"
CLIENT_ID="${exchangeParams.clientAuthMethod === 'private_key_jwt' ? '<client_id>' : 'your_client_id'}"
${exchangeParams.clientAuthMethod === 'private_key_jwt' ? 'CLIENT_ASSERTION="<signed_private_key_jwt>"' : 'CLIENT_SECRET="your_client_secret"'}
SUBJECT_TOKEN="<user_access_token_here>"

curl -s -X POST "$TOKEN" \\
 -H "Content-Type: application/x-www-form-urlencoded" \\
${
	exchangeParams.clientAuthMethod === 'private_key_jwt'
		? ` --data-urlencode "client_id=$CLIENT_ID" \\
 --data-urlencode "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \\
 --data-urlencode "client_assertion=$CLIENT_ASSERTION" \\`
		: ` -u "$CLIENT_ID:$CLIENT_SECRET" \\`
}
 --data-urlencode "grant_type=${exchangeParams.grantType}" \\
 --data-urlencode "subject_token=$SUBJECT_TOKEN" \\
 --data-urlencode "subject_token_type=${exchangeParams.subjectTokenType}" \\
 --data-urlencode "requested_token_type=${exchangeParams.requestedTokenType}" \\${
		exchangeParams.audience
			? `
 --data-urlencode "resource=${exchangeParams.audience}" \\`
			: ''
 }
 --data-urlencode "scope=${selectedScopes.join(' ')}"${
		exchangeParams.claims
			? ` \\
 --data-urlencode "claims=${exchangeParams.claims}"`
			: ''
 }${
		exchangeParams.authorizationDetails
			? ` \\
 --data-urlencode "authorization_details=${exchangeParams.authorizationDetails}"`
			: ''
 }`}</CodeBlock>
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<h4
							style={{
								color: '#374151',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiServer size={20} /> Actual Backend Implementation (server.js)
						</h4>
						<CodeBlock>{`// OAuth Playground Backend - Token Exchange Endpoint
// This is the actual implementation running at https://localhost:3001/api/token-exchange

app.post('/api/token-exchange', async (req, res) => {
  console.log('🚀 [Server] Token exchange request received');
  
  try {
    const {
      grant_type,
      client_id,
      client_secret,
      redirect_uri,
      code,
      code_verifier,
      refresh_token,
      scope,
      environment_id,
      // Advanced parameters
      subject_token,
      subject_token_type,
      requested_token_type,
      audience,
      resource,
      claims,
      authorization_details,
      client_assertion,
      client_assertion_type
    } = req.body;

    // Validate required parameters
    if (!grant_type || !client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: grant_type and client_id'
      });
    }

    // Build PingOne token endpoint URL
    const environmentId = environment_id || process.env.PINGONE_ENVIRONMENT_ID;
    const tokenEndpoint = 'https://auth.pingone.com/' + environmentId + '/as/token';

    // Prepare request body based on grant type
    const tokenRequestBody = new URLSearchParams();
    tokenRequestBody.set('grant_type', grant_type);
    tokenRequestBody.set('client_id', client_id);

    // Handle different grant types
    if (grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange') {
      // RFC 8693 Token Exchange
      tokenRequestBody.set('subject_token', subject_token);
      tokenRequestBody.set('subject_token_type', subject_token_type);
      tokenRequestBody.set('requested_token_type', requested_token_type);
      if (audience) tokenRequestBody.set('audience', audience);
      if (resource) tokenRequestBody.set('resource', resource);
    } else if (grant_type === 'authorization_code') {
      tokenRequestBody.set('code', code);
      tokenRequestBody.set('redirect_uri', redirect_uri);
      if (code_verifier) tokenRequestBody.set('code_verifier', code_verifier);
    } else if (grant_type === 'refresh_token') {
      tokenRequestBody.set('refresh_token', refresh_token);
    }

    // Add optional parameters
    if (scope) tokenRequestBody.set('scope', scope);
    if (claims) tokenRequestBody.set('claims', claims);
    if (authorization_details) tokenRequestBody.set('authorization_details', authorization_details);

    // Handle client authentication
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    
    if (client_assertion && client_assertion_type) {
      // Private Key JWT authentication
      tokenRequestBody.set('client_assertion_type', client_assertion_type);
      tokenRequestBody.set('client_assertion', client_assertion);
    } else if (client_secret) {
      // Client secret authentication
      const authMethod = req.body.client_auth_method || 'client_secret_post';
      if (authMethod === 'client_secret_basic') {
        const credentials = Buffer.from(client_id + ':' + client_secret).toString('base64');
        headers.Authorization = 'Basic ' + credentials;
      } else {
        tokenRequestBody.set('client_secret', client_secret);
      }
    }

    // Make request to PingOne
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers,
      body: tokenRequestBody.toString()
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [Server] PingOne error:', responseData);
      return res.status(response.status).json(responseData);
    }

    // Add server metadata to response
    const enrichedResponse = {
      ...responseData,
      server_timestamp: new Date().toISOString(),
      grant_type: grant_type,
      environment_id: environmentId
    };

    console.log('✅ [Server] Token exchange successful');
    res.json(enrichedResponse);

  } catch (error) {
    console.error('💥 [Server] Token exchange error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token exchange'
    });
  }
});`}</CodeBlock>
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<h4
							style={{
								color: '#374151',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiServer size={20} /> Custom Implementation Example
						</h4>
						<CodeBlock>{`// token.exchange.ts (TypeScript)
import fetch from "node-fetch";
import * as jose from "jose";

const AS = process.env.AS_ISSUER!;               // https://auth.pingone.com/<ENV_ID>
const TOKEN = \`\${AS}/as/token\`;
const CLIENT_ID = process.env.CLIENT_ID!;
${
	exchangeParams.clientAuthMethod === 'private_key_jwt'
		? `const PRIVATE_KEY_PEM = process.env.PRIVATE_KEY_PEM!;

async function clientAssertion(aud: string) {
  const pk = await jose.importPKCS8(PRIVATE_KEY_PEM, "RS256");
  const now = Math.floor(Date.now()/1000);
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now).setExpirationTime(now + 60)
    .setIssuer(CLIENT_ID).setSubject(CLIENT_ID).setAudience(aud)
    .sign(pk);
}`
		: 'const CLIENT_SECRET = process.env.CLIENT_SECRET!;'
}

export async function exchangeToken({ 
  subjectToken, 
  audience, 
  scopes,
  claims, 
  authorizationDetails 
}: { 
  subjectToken: string; 
  audience?: string; 
  scopes: string[];
  claims?: string; 
  authorizationDetails?: string;
}) {
  const form = new URLSearchParams();
  form.set("grant_type", "${exchangeParams.grantType}");
  form.set("subject_token", subjectToken);
  form.set("subject_token_type", "${exchangeParams.subjectTokenType}");
  form.set("requested_token_type", "${exchangeParams.requestedTokenType}");
  form.set("scope", scopes.join(" "));
  
  if (audience) form.set("resource", audience);
  if (claims) form.set("claims", claims);
  if (authorizationDetails) form.set("authorization_details", authorizationDetails);

${
	exchangeParams.clientAuthMethod === 'private_key_jwt'
		? `  const assertion = await clientAssertion(TOKEN);
  form.set("client_id", CLIENT_ID);
  form.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
  form.set("client_assertion", assertion);`
		: `  form.set("client_id", CLIENT_ID);
  form.set("client_secret", CLIENT_SECRET);`
}

  const response = await fetch(TOKEN, { 
    method: "POST", 
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, 
    body: form 
  });
  
  const json = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error("token_exchange_failed"), { 
      status: response.status, 
      detail: json 
    });
  }
  
  return json;
}`}</CodeBlock>
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<h4
							style={{
								color: '#374151',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiCode size={20} /> React Frontend Component
						</h4>
						<CodeBlock>{`// TokenExchangeComponent.tsx (React)
import React, { useState } from "react";

function TokenExchangeComponent() {
  const [exchangeState, setExchangeState] = useState({
    subjectToken: "",
    audience: "${exchangeParams.audience || 'https://api.example.com'}",
    scopes: [${selectedScopes.map((s) => `"${s}"`).join(', ')}],
    claims: '${exchangeParams.claims}',
    authorizationDetails: '${exchangeParams.authorizationDetails}'
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExchange = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/token/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exchangeState)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Exchange failed");
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-exchange-form">
      <h3>Token Exchange</h3>
      
      <div className="form-group">
        <label>Subject Token:</label>
        <input 
          type="text" 
          value={exchangeState.subjectToken}
          onChange={(e) => setExchangeState({
            ...exchangeState, 
            subjectToken: e.target.value
          })}
          placeholder="eyJhbGciOiJSUzI1NiIs..."
        />
      </div>
      
      <div className="form-group">
        <label>Target Audience:</label>
        <input 
          type="text" 
          value={exchangeState.audience}
          onChange={(e) => setExchangeState({
            ...exchangeState, 
            audience: e.target.value
          })}
        />
      </div>
      
      <button 
        onClick={handleExchange} 
        disabled={loading || !exchangeState.subjectToken}
      >
        {loading ? "Exchanging..." : "Exchange Token"}
      </button>
      
      {error && <div className="error">{error}</div>}
      {result && (
        <pre className="result">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}`}</CodeBlock>
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<h4
							style={{
								color: '#374151',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiCheckCircle size={20} /> Live Backend Response Example
						</h4>
						<EducationalBox $type="success">
							<FiInfo size={20} />
							<div>
								<InfoTitle>What You'll See When Testing</InfoTitle>
								<InfoText>
									When you click "Simulate Token Exchange" above, this frontend makes a real call to
									our backend at <code>https://localhost:3001/api/token-exchange</code>. Here's what
									the actual response looks like:
								</InfoText>
							</div>
						</EducationalBox>
						<CodeBlock>{`// Successful Response from https://localhost:3001/api/token-exchange
{
  "access_token": "exchanged_1729635847123_k8j2h9f3x",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "${selectedScopes.join(' ')}",
  "audience": "${exchangeParams.audience || 'https://mcp.cba.com.au'}",
  "issued_token_type": "${exchangeParams.requestedTokenType}",
  "server_timestamp": "2024-10-22T19:30:47.123Z",
  "grant_type": "${exchangeParams.grantType}",
  "environment_id": "b9817c16-9910-4415-b67e-4ac687da74d9"
}

// Error Response Example
{
  "error": "invalid_scope",
  "error_description": "The requested scope is invalid, unknown, or malformed",
  "server_timestamp": "2024-10-22T19:30:47.123Z"
}`}</CodeBlock>
					</div>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '1rem',
						}}
					>
						<EducationalBox $type="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Backend Features</InfoTitle>
								<InfoText>
									<strong>Our backend implementation includes:</strong>
									<br />• <strong>Multiple Auth Methods:</strong> Basic, POST, Private Key JWT
									<br />• <strong>PKCE Support:</strong> Automatic code_verifier handling
									<br />• <strong>Error Forwarding:</strong> PingOne errors passed through
									<br />• <strong>Request Logging:</strong> Detailed debug information
									<br />• <strong>Response Enrichment:</strong> Added server metadata
								</InfoText>
							</div>
						</EducationalBox>
						<EducationalBox $type="warning">
							<FiAlertCircle size={20} />
							<div>
								<InfoTitle>Error Handling</InfoTitle>
								<InfoText>
									<strong>Common error responses:</strong>
									<br />• <code>invalid_grant</code>: Invalid subject token
									<br />• <code>invalid_scope</code>: Requested scope not allowed
									<br />• <code>invalid_client</code>: Authentication failed
									<br />• <code>unsupported_token_type</code>: Token type not supported
									<br />• <code>server_error</code>: Backend processing error
								</InfoText>
							</div>
						</EducationalBox>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderScopeSelector = () => (
		<ScopeSelector>
			<ScopeSelectorTitle>
				<FiLock /> Select{' '}
				<LearningTooltip
					variant="info"
					title="Scopes"
					content="String-based permissions that define what resources and actions the token allows (e.g., 'read:profile write:contacts')."
					placement="top"
				>
					Scopes
				</LearningTooltip>{' '}
				for Exchanged Token
			</ScopeSelectorTitle>
			<p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
				Choose which scopes you want to include in the exchanged token. This allows you to implement
				the principle of least privilege by only granting the minimum permissions required.
			</p>

			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '0.75rem',
					marginBottom: '1rem',
					padding: '0.75rem',
					background: '#f8fafc',
					borderRadius: '0.5rem',
					border: '1px solid #e2e8f0',
				}}
			>
				<div
					style={{
						fontSize: '0.75rem',
						fontWeight: '600',
						color: '#374151',
						marginRight: '0.5rem',
					}}
				>
					Categories:
				</div>
				{[
					{ name: 'Banking', color: '#22c55e', bg: '#dcfce7' },
					{ name: 'Payments', color: '#f59e0b', bg: '#fef3c7' },
					{ name: 'MCP', color: '#7c3aed', bg: '#e0e7ff' },
					{ name: 'Compliance', color: '#ef4444', bg: '#fee2e2' },
					{ name: 'Admin', color: '#dc2626', bg: '#fecaca' },
					{ name: 'User', color: '#3b82f6', bg: '#dbeafe' },
					{ name: 'Business', color: '#059669', bg: '#d1fae5' },
					{ name: 'System', color: '#6b7280', bg: '#f3f4f6' },
				].map((category) => (
					<div
						key={category.name}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.25rem',
							fontSize: '0.75rem',
						}}
					>
						<div
							style={{
								width: '0.5rem',
								height: '0.5rem',
								borderRadius: '50%',
								background: category.color,
							}}
						></div>
						<span style={{ color: '#374151' }}>{category.name}</span>
					</div>
				))}
			</div>

			<ScopeGrid>
				{currentScenario.availableScopes.map((scope) => (
					<ScopeOption
						key={scope.name}
						$selected={selectedScopes.includes(scope.name)}
						$category={scope.category}
					>
						<input
							type="checkbox"
							checked={selectedScopes.includes(scope.name)}
							onChange={() => handleScopeToggle(scope.name)}
						/>
						<div style={{ flex: 1 }}>
							<div
								style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
							>
								{scope.name}
								<span
									style={{
										fontSize: '0.625rem',
										padding: '0.125rem 0.375rem',
										borderRadius: '0.25rem',
										background: (() => {
											switch (scope.category) {
												case 'banking':
													return '#dcfce7';
												case 'payments':
													return '#fef3c7';
												case 'mcp':
													return '#e0e7ff';
												case 'compliance':
													return '#fee2e2';
												case 'admin':
													return '#fecaca';
												case 'user':
													return '#dbeafe';
												case 'business':
													return '#d1fae5';
												case 'system':
													return '#f3f4f6';
												default:
													return '#f3f4f6';
											}
										})(),
										color: (() => {
											switch (scope.category) {
												case 'banking':
													return '#166534';
												case 'payments':
													return '#92400e';
												case 'mcp':
													return '#5b21b6';
												case 'compliance':
													return '#991b1b';
												case 'admin':
													return '#991b1b';
												case 'user':
													return '#1e40af';
												case 'business':
													return '#065f46';
												case 'system':
													return '#374151';
												default:
													return '#374151';
											}
										})(),
										fontWeight: '500',
										textTransform: 'uppercase',
									}}
								>
									{scope.category}
								</span>
							</div>
							<ScopeDescription>{scope.description}</ScopeDescription>
						</div>
					</ScopeOption>
				))}
			</ScopeGrid>

			{selectedScopes.length > 0 && (
				<SelectedScopesDisplay>
					<SelectedScopesTitle>Selected Scopes ({selectedScopes.length}):</SelectedScopesTitle>
					<SelectedScopesList>
						{selectedScopes.map((scope) => (
							<ScopeTag key={scope}>{scope}</ScopeTag>
						))}
					</SelectedScopesList>
				</SelectedScopesDisplay>
			)}

			{selectedScopes.length === 0 && (
				<InfoBox $variant="warning" style={{ marginTop: '1rem' }}>
					<FiAlertCircle size={20} />
					<div>
						<InfoTitle>No Scopes Selected</InfoTitle>
						<InfoText>
							Please select at least one scope to proceed with the token exchange. The exchanged
							token will only have the permissions for the selected scopes.
						</InfoText>
					</div>
				</InfoBox>
			)}

			{selectedScopes.length > 0 && (
				<div style={{ marginTop: '1.5rem' }}>
					<h4
						style={{
							color: '#374151',
							marginBottom: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<FiShield size={16} /> Real-time Security Metrics
					</h4>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
							gap: '1rem',
						}}
					>
						<MetricsCard>
							<MetricValue style={{ color: '#22c55e' }}>
								{Math.round(
									(1 - selectedScopes.length / currentScenario.availableScopes.length) * 100
								)}
								%
							</MetricValue>
							<MetricLabel>Scope Reduction</MetricLabel>
						</MetricsCard>
						<MetricsCard>
							<MetricValue style={{ color: '#7c3aed' }}>{selectedScopes.length}</MetricValue>
							<MetricLabel>Active Permissions</MetricLabel>
						</MetricsCard>
						<MetricsCard>
							<MetricValue
								style={{
									color:
										selectedScopes.length <= 2
											? '#22c55e'
											: selectedScopes.length <= 4
												? '#f59e0b'
												: '#ef4444',
								}}
							>
								{selectedScopes.length <= 2 ? 'HIGH' : selectedScopes.length <= 4 ? 'MED' : 'LOW'}
							</MetricValue>
							<MetricLabel>Security Level</MetricLabel>
						</MetricsCard>
						<MetricsCard>
							<MetricValue style={{ color: '#3b82f6' }}>
								{
									new Set(
										selectedScopes.map(
											(scope) =>
												currentScenario.availableScopes.find((s) => s.name === scope)?.category
										)
									).size
								}
							</MetricValue>
							<MetricLabel>Categories</MetricLabel>
						</MetricsCard>
					</div>
				</div>
			)}
		</ScopeSelector>
	);

	const renderScenarioDetails = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('details')}>
				<CollapsibleTitle>
					<FiInfo /> {currentScenario.title} - Implementation Details
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.details && (
				<CollapsibleContent>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Use Case: {currentScenario.useCase}</InfoTitle>
							<InfoText>{currentScenario.description}</InfoText>
						</div>
					</InfoBox>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							gap: '1rem',
						}}
					>
						<div
							style={{
								padding: '1rem',
								background: '#f8fafc',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<strong style={{ color: '#7c3aed' }}>Grant Type:</strong>
							<br />
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
								{currentScenario.grantType}
							</code>
						</div>
						<div
							style={{
								padding: '1rem',
								background: '#f8fafc',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<strong style={{ color: '#7c3aed' }}>Audience:</strong>
							<br />
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
								{currentScenario.audience}
							</code>
						</div>
						<div
							style={{
								padding: '1rem',
								background: '#f8fafc',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<strong style={{ color: '#7c3aed' }}>Default Scope:</strong>
							<br />
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
								{currentScenario.scope}
							</code>
						</div>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenComparison = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('comparison')}>
				<CollapsibleTitle>
					<FiArrowRight /> Before & After Token Comparison
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.comparison && (
				<CollapsibleContent>
					<EducationalBox $type="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Token Exchange Visualization</InfoTitle>
							<InfoText>
								See how token exchange transforms a broad-scoped token into a focused,
								audience-specific token. This demonstrates the principle of least privilege in
								action.
							</InfoText>
						</div>
					</EducationalBox>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr auto 1fr',
							gap: '1.5rem',
							alignItems: 'center',
							margin: '2rem 0',
							padding: '1.5rem',
							background: '#f8fafc',
							borderRadius: '0.75rem',
							border: '1px solid #e2e8f0',
						}}
					>
						<div>
							<h4
								style={{
									color: '#374151',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<div
									style={{
										width: '1rem',
										height: '1rem',
										borderRadius: '50%',
										background: '#ef4444',
									}}
								></div>
								Original Token (Broad Scope)
							</h4>
							<div
								style={{
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontSize: '0.75rem',
									fontFamily: 'Monaco, Menlo, monospace',
								}}
							>
								<div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>Subject Token:</div>
								<div style={{ wordBreak: 'break-all', marginBottom: '1rem', color: '#374151' }}>
									{currentScenario.originalToken}
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'auto 1fr',
										gap: '0.5rem',
										fontSize: '0.75rem',
									}}
								>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Audience:</span>
									<span>
										{currentScenario.originalToken.includes('admin')
											? 'admin-dashboard'
											: currentScenario.originalToken.includes('banking')
												? 'banking-platform'
												: currentScenario.originalToken.includes('power')
													? 'full-access-app'
													: 'my-web-app'}
									</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Scopes:</span>
									<span>
										{currentScenario.originalToken.includes('admin')
											? 'admin:full impersonate:user audit:read audit:write'
											: currentScenario.originalToken.includes('banking')
												? 'mcp:read mcp:write a2a:communicate banking:full payments:write accounts:write transactions:read'
												: currentScenario.originalToken.includes('power')
													? 'read:reports write:reports delete:data admin:access read:private write:private'
													: 'openid profile email read:contacts read:calendar write:data'}
									</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Risk Level:</span>
									<span style={{ color: '#ef4444', fontWeight: '600' }}>
										HIGH - Broad permissions
									</span>
								</div>
							</div>
						</div>

						<div style={{ textAlign: 'center' }}>
							<div
								style={{
									background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
									color: 'white',
									padding: '1rem',
									borderRadius: '50%',
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<FiArrowRight size={24} />
							</div>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#7c3aed',
									fontWeight: '600',
									marginTop: '0.5rem',
									textAlign: 'center',
								}}
							>
								Token
								<br />
								Exchange
							</div>
						</div>

						<div>
							<h4
								style={{
									color: '#374151',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<div
									style={{
										width: '1rem',
										height: '1rem',
										borderRadius: '50%',
										background: '#22c55e',
									}}
								></div>
								Exchanged Token (Reduced Scope)
							</h4>
							<div
								style={{
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontSize: '0.75rem',
									fontFamily: 'Monaco, Menlo, monospace',
								}}
							>
								<div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>New Access Token:</div>
								<div style={{ wordBreak: 'break-all', marginBottom: '1rem', color: '#374151' }}>
									exchanged_{Date.now()}_{Math.random().toString(36).substr(2, 9)}
								</div>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'auto 1fr',
										gap: '0.5rem',
										fontSize: '0.75rem',
									}}
								>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Audience:</span>
									<span>{exchangeParams.audience}</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Scopes:</span>
									<span>{selectedScopes.join(' ')}</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Risk Level:</span>
									<span style={{ color: '#22c55e', fontWeight: '600' }}>
										LOW - Minimal permissions
									</span>
								</div>
							</div>
						</div>
					</div>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							gap: '1rem',
						}}
					>
						<EducationalBox $type="success">
							<FiShield size={20} />
							<div>
								<InfoTitle>Security Benefits</InfoTitle>
								<InfoText>
									• <strong>Scope Reduction:</strong> {selectedScopes.length} vs original broader
									permissions
									<br />• <strong>Audience Restriction:</strong> Token only valid for{' '}
									{exchangeParams.audience}
									<br />• <strong>Time-bound:</strong> Short expiration reduces exposure window
									<br />• <strong>Traceable:</strong> Clear audit trail of token exchanges
								</InfoText>
							</div>
						</EducationalBox>
						<EducationalBox $type="info">
							<FiLock size={20} />
							<div>
								<InfoTitle>Use Case: {currentScenario.title}</InfoTitle>
								<InfoText>
									<strong>Scenario:</strong> {currentScenario.useCase}
									<br />
									<strong>Target API:</strong> {exchangeParams.audience}
									<br />
									<strong>Selected Scopes:</strong> {selectedScopes.length} permissions
									<br />
									<strong>Security Model:</strong> Zero Trust Architecture
								</InfoText>
							</div>
						</EducationalBox>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderAuthorizationCodeFlow = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('authzCodeFlow')}>
				<CollapsibleTitle>
					<FiKey /> Step 1: App X Obtains Access Token (Authorization Code Flow)
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.authzCodeFlow && (
				<CollapsibleContent>
					<EducationalBox $type="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>
								Complete Flow: Authorization Code → Access Token → Token Exchange
							</InfoTitle>
							<InfoText>
								<strong>
									To understand Token Exchange, we first need to see how App X obtains its initial
									access token.
								</strong>
								<br />
								<br />
								<strong>Step 1:</strong> App X uses the Authorization Code Flow to get an access
								token to call API A.
								<br />
								<strong>Step 2:</strong> App X receives an authorization code from PingOne.
								<br />
								<strong>Step 3:</strong> App X exchanges the authorization code for an access token.
								<br />
								<strong>Step 4:</strong> API A uses Token Exchange (RFC 8693) with App X's access
								token to get a new token for API B.
								<br />
								<br />
								This demonstrates the complete journey from user authorization to token exchange for
								A2A communication.
							</InfoText>
						</div>
					</EducationalBox>

					<StepIndicator>
						<StepNumber>1</StepNumber>
						<StepContent>
							<StepTitle>Build Authorization Request</StepTitle>
							<StepDescription>
								App X redirects the user to PingOne to authorize access to API A
							</StepDescription>
						</StepContent>
					</StepIndicator>

					<EducationalBox $type="success">
						<FiGlobe size={20} />
						<div>
							<InfoTitle>Authorization URL</InfoTitle>
							<InfoText>
								App X constructs an authorization URL with:
								<br />• <strong>response_type=code</strong>: Request an authorization code
								<br />• <strong>client_id</strong>: App X's client ID
								<br />• <strong>redirect_uri</strong>: Where PingOne sends the code
								<br />• <strong>scope</strong>: Permissions for API A (e.g.,{' '}
								<code>openid profile email</code>)
								<br />• <strong>state</strong>: CSRF protection token
								<br />• <strong>code_challenge</strong> & <strong>code_challenge_method</strong>:
								PKCE for security
							</InfoText>
						</div>
					</EducationalBox>

					<CodeBlock>{`GET https://auth.pingone.com/{environment_id}/as/authorize?
  response_type=code
  &client_id=app_x_client_id
  &redirect_uri=https://app-x.example.com/callback
  &scope=openid profile email
  &state=xyz123
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256`}</CodeBlock>

					<Button
						$variant="primary"
						onClick={() => {
							// Simulate authorization request
							const mockAuthCode = `auth_code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
							setAuthCode(mockAuthCode);
							v4ToastManager.showSuccess('Authorization code received!');
						}}
						disabled={!!authCode}
					>
						<FiZap /> Simulate Authorization Request
					</Button>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderAuthorizationCodeReceived = () => {
		if (!authCode) return null;

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton onClick={() => toggleSection('authzCodeReceived')}>
					<CollapsibleTitle>
						<FiCheckCircle /> Step 2: Authorization Code Received
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.authzCodeReceived && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Authorization Code Received</InfoTitle>
								<InfoText>
									PingOne redirected the user back to App X with an authorization code in the
									callback URL.
									<br />
									<br />
									<strong>Example callback URL:</strong>
									<br />
									<code>https://app-x.example.com/callback?code={authCode}&state=xyz123</code>
								</InfoText>
							</div>
						</InfoBox>

						<EducationalBox $type="info">
							<FiKey size={20} />
							<div>
								<InfoTitle>What is an Authorization Code?</InfoTitle>
								<InfoText>
									<strong>Authorization Code:</strong> A short-lived, single-use credential
									(typically valid for 10 minutes) that represents the user's authorization.
									<br />
									<br />
									<strong>Key Properties:</strong>
									<br />• <strong>Short-lived:</strong> Expires quickly (usually 10 minutes)
									<br />• <strong>Single-use:</strong> Can only be exchanged once for tokens
									<br />• <strong>Opaque:</strong> Meaningless to the client - just a random string
									<br />• <strong>Secure:</strong> Must be exchanged server-side (never exposed to
									browser JavaScript)
									<br />
									<br />
									<strong>Why use Authorization Codes?</strong>
									<br />• Tokens are never exposed in the browser URL (unlike Implicit Flow)
									<br />• Client secret can be kept on the backend server
									<br />• PKCE adds extra security for public clients
									<br />• Supports refresh tokens for long-lived sessions
								</InfoText>
							</div>
						</EducationalBox>

						<GeneratedContentBox style={{ marginTop: '1.5rem' }}>
							<ParameterLabel>Authorization Code</ParameterLabel>
							<ParameterValue
								style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem' }}
							>
								{authCode}
							</ParameterValue>
							<Button
								$variant="secondary"
								onClick={() => {
									navigator.clipboard.writeText(authCode);
									v4ToastManager.showSuccess('Authorization code copied!');
								}}
								style={{ marginTop: '0.5rem' }}
							>
								<FiCopy /> Copy Code
							</Button>
						</GeneratedContentBox>

						<EducationalBox $type="warning" style={{ marginTop: '1.5rem' }}>
							<FiAlertCircle size={20} />
							<div>
								<InfoTitle>Security Best Practices</InfoTitle>
								<InfoText>
									• <strong>Exchange immediately:</strong> Don't store authorization codes -
									exchange them right away
									<br />• <strong>Validate state:</strong> Always verify the state parameter matches
									what you sent
									<br />• <strong>Use HTTPS:</strong> Authorization codes must only be transmitted
									over secure connections
									<br />• <strong>Server-side exchange:</strong> Never exchange codes in browser
									JavaScript - always use your backend
									<br />• <strong>PKCE required:</strong> For public clients (SPAs, mobile apps),
									always use PKCE
								</InfoText>
							</div>
						</EducationalBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	const renderExchangeAuthCodeForToken = () => {
		if (!authCode) return null;

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton onClick={() => toggleSection('exchangeAuthCode')}>
					<CollapsibleTitle>
						<FiRefreshCw /> Step 3: Exchange Authorization Code for Access Token
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.exchangeAuthCode && (
					<CollapsibleContent>
						<EducationalBox $type="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>Token Exchange: Authorization Code → Access Token</InfoTitle>
								<InfoText>
									App X now exchanges the authorization code for an access token. This access token
									will be used to call API A, and later will become the{' '}
									<strong>subject_token</strong> in the Token Exchange request.
									<br />
									<br />
									<strong>
										This is a standard OAuth 2.0 Authorization Code Flow token exchange (RFC 6749),
										not RFC 8693 Token Exchange.
									</strong>
									<br />
									<br />
									The RFC 8693 Token Exchange happens in the next step, where API A exchanges App
									X's access token for a new token scoped for API B.
								</InfoText>
							</div>
						</EducationalBox>

						<StepIndicator>
							<StepNumber>3</StepNumber>
							<StepContent>
								<StepTitle>Exchange Code for Tokens</StepTitle>
								<StepDescription>
									App X sends the authorization code to PingOne's token endpoint to receive an
									access token
								</StepDescription>
							</StepContent>
						</StepIndicator>

						<EnhancedApiCallDisplay
							apiCall={{
								method: 'POST',
								url: 'https://auth.pingone.com/{environment_id}/as/token',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									Accept: 'application/json',
								},
								body: {
									grant_type: 'authorization_code',
									code: authCode,
									redirect_uri: 'https://app-x.example.com/callback',
									client_id: 'app_x_client_id',
									client_secret: 'app_x_client_secret',
									code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
								},
								flowType: 'authorization-code',
							}}
							options={{
								showEducationalNotes: true,
								showFlowContext: true,
								urlHighlightRules: [
									{
										pattern: 'pingone.com',
										label: 'PingOne Domain',
										description: 'PingOne authorization server endpoint',
										color: '#7c3aed',
									},
									{
										pattern: 'token',
										label: 'Token Endpoint',
										description: 'Token endpoint path',
										color: '#059669',
									},
								],
							}}
						/>

						<Button
							$variant="primary"
							onClick={async () => {
								if (!authCode) return;

								setIsExchangingAuthCode(true);

								// Simulate token exchange delay
								await new Promise((resolve) => setTimeout(resolve, 1500));

								// Generate mock access token (this will be the subject_token for Token Exchange)
								const exp = Math.floor(Date.now() / 1000) + 3600;
								const iat = Math.floor(Date.now() / 1000);
								const mockAccessToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdWQiOiJhcGktYSIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6${exp}LCJpYXQiOi${iat}}.signature`;

								setInitialAccessToken(mockAccessToken);
								setSubjectToken(mockAccessToken); // This becomes the subject_token for Token Exchange
								setIsExchangingAuthCode(false);

								v4ToastManager.showSuccess(
									'Access token received! This will be used as the subject_token for Token Exchange.'
								);
							}}
							disabled={isExchangingAuthCode || !!initialAccessToken}
							style={{ marginTop: '1rem' }}
						>
							{isExchangingAuthCode ? (
								<>
									<FiRefreshCw className="animate-spin" /> Exchanging...
								</>
							) : (
								<>
									<FiRefreshCw /> Exchange Authorization Code for Access Token
								</>
							)}
						</Button>

						{initialAccessToken && (
							<InfoBox $variant="success" style={{ marginTop: '1.5rem' }}>
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Access Token Received</InfoTitle>
									<InfoText>
										App X now has an access token that can be used to call API A.
										<br />
										<br />
										<strong>
											This access token will become the subject_token in the Token Exchange request.
										</strong>
										<br />
										<br />
										<strong>Token Response:</strong>
										<br />• <code>access_token</code>: {initialAccessToken.substring(0, 50)}...
										<br />• <code>token_type</code>: Bearer
										<br />• <code>expires_in</code>: 3600 seconds (1 hour)
										<br />• <code>scope</code>: openid profile email
									</InfoText>
								</div>
							</InfoBox>
						)}
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	const renderTokenExchangeRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('request')}>
				<CollapsibleTitle>
					<FiZap />{' '}
					<LearningTooltip
						variant="learning"
						title="Token Exchange Request"
						content="The HTTP POST request to the token endpoint using grant_type=urn:ietf:params:oauth:grant-type:token-exchange with subject_token and requested_token_type parameters (RFC 8693)."
						placement="top"
					>
						Token Exchange Request
					</LearningTooltip>{' '}
					(
					<LearningTooltip
						variant="info"
						title="RFC 8693"
						content="OAuth 2.0 Token Exchange specification"
						placement="top"
					>
						RFC 8693
					</LearningTooltip>
					)
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.request && (
				<CollapsibleContent>
					<InfoBox $variant="warning">
						<FiAlertCircle size={20} />
						<div>
							<InfoTitle>PingOne Token Exchange: Common Use Case Example</InfoTitle>
							<InfoText>
								<strong>Scenario:</strong> App X obtains an access token to call API A. API A needs
								data from API B to fulfill the request.
								<br />
								<br />
								<strong>Complete Flow:</strong>
								<br />
								1. <strong>App X → PingOne:</strong> Authorization Code Flow (Steps 1-3 above)
								<br />
								&nbsp;&nbsp;&nbsp;→ App X receives authorization code
								<br />
								&nbsp;&nbsp;&nbsp;→ App X exchanges code for access token
								<br />
								2. <strong>App X → API A:</strong> App X calls API A with the access token
								<br />
								3. <strong>API A → PingOne:</strong> Token Exchange (RFC 8693) - Step 4 below
								<br />
								&nbsp;&nbsp;&nbsp;• Client ID: App A's client ID
								<br />
								&nbsp;&nbsp;&nbsp;• Subject token: The access token from App X (from step 1)
								<br />
								&nbsp;&nbsp;&nbsp;• Actor token: None (for Phase 1)
								<br />
								&nbsp;&nbsp;&nbsp;• Scope: B.r (scopes from API B)
								<br />
								4. <strong>PingOne → API A:</strong> Returns new access token scoped with B.r,
								issued to App A
								<br />
								5. <strong>API A → API B:</strong> API A uses the new token to call API B and get
								data N
								<br />
								6. <strong>API A → App X:</strong> API A returns data M to App X
								<br />
								<br />
								<strong>Benefits:</strong> Zero Trust Architecture, Audit Trail, Compliance (banking
								regulatory requirements), Scalability (microservices)
							</InfoText>
						</div>
					</InfoBox>

					<EducationalBox $type="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>
								PingOne Token Exchange: Subject Token & Actor Token Requirements
							</InfoTitle>
							<InfoText>
								<strong>Phase 1 Limitations:</strong>
								<br />• Subject token and actor token must be{' '}
								<strong>access tokens or ID tokens from the same PingOne environment</strong>
								<br />• Tokens from other PingOne environments (even same organization) are{' '}
								<strong>not supported</strong>
								<br />• Tokens from external authorization servers are{' '}
								<strong>not supported</strong> in Phase 1
								<br />• The token must be <strong>valid</strong> (not expired, valid signature,
								etc.)
								<br />
								<br />
								<strong>Future Phases:</strong> Support for third-party authorization servers is
								planned after Phase 1.
							</InfoText>
						</div>
					</EducationalBox>

					<EducationalBox $type="success">
						<FiShield size={20} />
						<div>
							<InfoTitle>PingOne Token Exchange: Attribute Mapping & Expressions</InfoTitle>
							<InfoText>
								<strong>Phase 1 Feature:</strong> When <code>requested_token_type</code> is{' '}
								<code>urn:ietf:params:oauth:token-type:access_token</code>, token fulfillment is
								controlled by attribute mapping configuration of the applicable custom resource(s).
								<br />
								<br />
								<strong>Administrators can use expressions to implement fulfillment logic:</strong>
								<br />• Check <code>context.requestData.grantType</code> to fulfill attributes
								differently based on grant type
								<br />• Access subject token claims:{' '}
								<code>context.requestData.subjectToken[.claim]</code>
								<br />• Access scope parameter: <code>context.requestData.scope</code>
								<br />• Access app config: <code>context.appConfig.clientId</code>,{' '}
								<code>context.appConfig.tokenEndpointAuthMethod</code>,{' '}
								<code>context.appConfig.envId</code>, <code>context.appConfig.orgId</code>
								<br />
								<br />
								<strong>Future Phases:</strong> Advanced attribute mapping policy with UI/management
								API for common sources, reducing reliance on expressions.
							</InfoText>
						</div>
					</EducationalBox>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr auto 1fr',
							gap: '1rem',
							alignItems: 'center',
							margin: '1.5rem 0',
							padding: '1rem',
							background: '#f8fafc',
							borderRadius: '0.5rem',
							border: '1px solid #e2e8f0',
						}}
					>
						<div style={{ textAlign: 'center' }}>
							<div
								style={{
									padding: '1rem',
									background: '#dbeafe',
									borderRadius: '0.5rem',
									border: '1px solid #3b82f6',
								}}
							>
								<FiKey size={24} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
								<div style={{ fontWeight: '600', color: '#1e40af' }}>Original Token</div>
								<div style={{ fontSize: '0.75rem', color: '#3730a3' }}>
									Broad scope
									<br />
									Multiple audiences
								</div>
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<FiArrowRight size={32} style={{ color: '#7c3aed' }} />
							<div
								style={{
									fontSize: '0.75rem',
									color: '#7c3aed',
									fontWeight: '600',
									marginTop: '0.25rem',
								}}
							>
								Token Exchange
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<div
								style={{
									padding: '1rem',
									background: '#dcfce7',
									borderRadius: '0.5rem',
									border: '1px solid #22c55e',
								}}
							>
								<FiShield size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
								<div style={{ fontWeight: '600', color: '#15803d' }}>Exchanged Token</div>
								<div style={{ fontSize: '0.75rem', color: '#166534' }}>
									Reduced scope
									<br />
									Specific audience
								</div>
							</div>
						</div>
					</div>

					{/* Enhanced API Call Display with Documentation Links */}
					<EnhancedApiCallDisplay
						apiCall={tokenExchangeApiCall}
						options={{
							showEducationalNotes: true,
							showFlowContext: true,
							urlHighlightRules: [
								{
									pattern: 'pingone.com',
									label: 'PingOne Domain',
									description: 'PingOne authorization server endpoint',
									color: '#7c3aed',
								},
								{
									pattern: 'token',
									label: 'Token Endpoint',
									description: 'Token endpoint path',
									color: '#059669',
								},
							],
						}}
					/>

					<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
						<Button $variant="primary" onClick={simulateTokenExchange} disabled={isLoading}>
							{isLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
							{isLoading ? 'Exchanging Token...' : 'Simulate Token Exchange'}
						</Button>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenExchangeResponse = () => {
		if (!exchangedToken) return null;

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton onClick={() => toggleSection('response')}>
					<CollapsibleTitle>
						<FiCheckCircle /> Token Exchange Response
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.response && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Token Exchange Successful</InfoTitle>
								<InfoText>
									New token issued with reduced scope and audience restriction for secure A2A
									communication.
								</InfoText>
							</div>
						</InfoBox>

						<CodeBlock>{exchangedToken}</CodeBlock>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
								gap: '1rem',
							}}
						>
							<InfoBox $variant="success">
								<FiShield size={20} />
								<div>
									<InfoTitle>Security Benefits</InfoTitle>
									<InfoText>
										• <strong>Scope Reduction:</strong> Token has minimal required permissions
										<br />• <strong>Audience Restriction:</strong> Token only valid for specific
										service
										<br />• <strong>Time-bound:</strong> Short expiration reduces exposure window
										<br />• <strong>Traceable:</strong> Clear audit trail of token exchanges
									</InfoText>
								</div>
							</InfoBox>
							<InfoBox $variant="info">
								<FiLock size={20} />
								<div>
									<InfoTitle>Banking Compliance</InfoTitle>
									<InfoText>
										• <strong>PCI DSS:</strong> Supports tokenization requirements
										<br />• <strong>APRA CPS 234:</strong> Meets information security standards
										<br />• <strong>Privacy Act:</strong> Enables data minimization principles
										<br />• <strong>ACCC CDR:</strong> Supports Consumer Data Right architecture
									</InfoText>
								</div>
							</InfoBox>
						</div>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<Header>
						<VersionBadge>
							V8M -{' '}
							<LearningTooltip
								variant="learning"
								title="RFC 8693: OAuth 2.0 Token Exchange"
								content="OAuth 2.0 extension specification for exchanging tokens. Enables delegation, impersonation, scope reduction, and audience restriction for secure application-to-application (A2A) communication."
								placement="top"
							>
								RFC 8693
							</LearningTooltip>
						</VersionBadge>
						<Title>
							<LearningTooltip
								variant="learning"
								title="OAuth 2.0 Token Exchange"
								content="A grant type that allows clients to exchange one token for another with different properties (scope, audience, lifetime). Used for delegation, impersonation, and implementing the principle of least privilege."
								placement="top"
							>
								OAuth 2.0 Token Exchange
							</LearningTooltip>
						</Title>
						<Subtitle>
							Secure{' '}
							<LearningTooltip
								variant="info"
								title="A2A Communication"
								content="Application-to-Application: Secure communication between backend services without user interaction."
								placement="top"
							>
								A2A Communication
							</LearningTooltip>{' '}
							with{' '}
							<LearningTooltip
								variant="security"
								title="Scope Reduction"
								content="Principle of least privilege: Reducing token permissions to only what's necessary for the specific operation."
								placement="top"
							>
								Scope Reduction
							</LearningTooltip>{' '}
							&{' '}
							<LearningTooltip
								variant="security"
								title="Audience Restriction"
								content="Limiting token validity to specific services or APIs. Prevents token reuse across different systems."
								placement="top"
							>
								Audience Restriction
							</LearningTooltip>
						</Subtitle>
					</Header>

					<ContentSection>
						<div style={{ textAlign: 'center', marginBottom: '2rem' }}>
							<h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>
								Choose Your Token Exchange Scenario
							</h2>
							<p style={{ color: '#6b7280', margin: 0 }}>
								Select the use case that best matches your A2A security requirements
							</p>
						</div>

						<ScenarioSelector>
							{Object.entries(scenarios).map(([key, scenario]) => (
								<ScenarioCard
									key={key}
									$selected={selectedScenario === key}
									onClick={() => handleScenarioChange(key as TokenExchangeScenario)}
								>
									<ScenarioIcon>{scenario.icon}</ScenarioIcon>
									<ScenarioTitle>{scenario.title}</ScenarioTitle>
									<ScenarioDescription>{scenario.description}</ScenarioDescription>
									<div
										style={{
											marginTop: '0.75rem',
											fontSize: '0.75rem',
											color: '#7c3aed',
											fontWeight: '600',
										}}
									>
										{scenario.useCase}
									</div>
								</ScenarioCard>
							))}
						</ScenarioSelector>

						{renderScenarioDetails()}
						{renderScopeSelector()}
						{renderTokenComparison()}
						{renderAdvancedParameters()}
						{renderCodeExamples()}

						{/* Complete Flow: Authorization Code → Access Token → Token Exchange */}
						<CollapsibleSection>
							<CollapsibleHeaderButton onClick={() => toggleSection('completeFlow')}>
								<CollapsibleTitle>
									<FiArrowRight /> Complete Flow: From Authorization Code to Token Exchange
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.completeFlow && (
								<CollapsibleContent>
									<EducationalBox $type="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Understanding the Complete Journey</InfoTitle>
											<InfoText>
												To fully understand Token Exchange (RFC 8693), it's important to see how the{' '}
												<strong>subject_token</strong> (the access token being exchanged) was
												originally obtained.
												<br />
												<br />
												<strong>This section shows:</strong>
												<br />• <strong>Step 1:</strong> How App X builds an authorization request
												<br />• <strong>Step 2:</strong> How App X receives an authorization code
												<br />• <strong>Step 3:</strong> How App X exchanges the authorization code
												for an access token
												<br />• <strong>Step 4:</strong> How API A uses Token Exchange with that
												access token (RFC 8693)
												<br />
												<br />
												This demonstrates the complete flow from user authorization through token
												exchange for A2A communication.
											</InfoText>
										</div>
									</EducationalBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{renderAuthorizationCodeFlow()}
						{renderAuthorizationCodeReceived()}
						{renderExchangeAuthCodeForToken()}

						{/* Step 4: Token Exchange (RFC 8693) */}
						{initialAccessToken && (
							<CollapsibleSection>
								<CollapsibleHeaderButton onClick={() => toggleSection('tokenExchangeStep4')}>
									<CollapsibleTitle>
										<FiZap /> Step 4: Token Exchange (RFC 8693) - API A Exchanges App X's Token
									</CollapsibleTitle>
									<FiChevronDown />
								</CollapsibleHeaderButton>
								{!collapsedSections.tokenExchangeStep4 && (
									<CollapsibleContent>
										<EducationalBox $type="success">
											<FiShield size={20} />
											<div>
												<InfoTitle>Now We're Ready for Token Exchange!</InfoTitle>
												<InfoText>
													App X now has an access token (from Step 3) that it uses to call API A.
													<br />
													<br />
													<strong>When API A needs data from API B:</strong>
													<br />• API A acts as "App A" (a separate PingOne application)
													<br />• API A uses Token Exchange (RFC 8693) with App X's access token as
													the <strong>subject_token</strong>
													<br />• PingOne validates the subject_token and issues a new token scoped
													for API B
													<br />• API A uses this new token to call API B
													<br />
													<br />
													<strong>
														This is the Token Exchange step (RFC 8693) - different from the
														authorization code exchange above.
													</strong>
												</InfoText>
											</div>
										</EducationalBox>
									</CollapsibleContent>
								)}
							</CollapsibleSection>
						)}

						{renderTokenExchangeRequest()}
						{renderTokenExchangeResponse()}

						<CollapsibleSection>
							<CollapsibleHeaderButton onClick={() => toggleSection('resources')}>
								<CollapsibleTitle>
									<FiExternalLink /> Additional Resources & PingOne Future Phases
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.resources && (
								<CollapsibleContent>
									<EducationalBox $type="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>PingOne Token Exchange: Future Phases (After Q1 2026)</InfoTitle>
											<InfoText>
												<strong>Note:</strong> The following items are planned for future phases
												after Phase 1. No commitment can be made at this point.
												<br />
												<br />
												<strong>Planned Improvements:</strong>
												<br />• <strong>Advanced Attribute Mapping Policy:</strong> Write an
												expression once and apply it to multiple attributes in the same or different
												custom resources. Add UI and management API for common sources to reduce
												reliance on expressions.
												<br />• <strong>Inclusion of Refresh Token:</strong> If applicable, refresh
												tokens may be included in Token Exchange responses in future phases.
												<br />• <strong>Expand requested_token_type:</strong> Support for{' '}
												<code>urn:ietf:params:oauth:token-type:id-jag</code> from{' '}
												<a
													href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/"
													target="_blank"
													rel="noopener noreferrer"
													style={{ color: '#7c3aed' }}
												>
													OAuth Identity Assertion Authorization Grant
												</a>
												.
												<br />• <strong>Support Third-Party Authorization Servers:</strong> Accept
												tokens from external authorization servers (not just same PingOne
												environment).
											</InfoText>
										</div>
									</EducationalBox>

									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
											gap: '1rem',
											marginTop: '1.5rem',
										}}
									>
										<InfoBox $variant="info">
											<FiGlobe size={20} />
											<div>
												<InfoTitle>RFC 8693 Specification</InfoTitle>
												<InfoText>
													<a
														href="https://datatracker.ietf.org/doc/html/rfc8693"
														target="_blank"
														rel="noopener noreferrer"
														style={{ color: '#7c3aed', textDecoration: 'none' }}
													>
														OAuth 2.0 Token Exchange Specification (RFC 8693)
													</a>
												</InfoText>
											</div>
										</InfoBox>
										<InfoBox $variant="success">
											<FiServer size={20} />
											<div>
												<InfoTitle>A2A Implementation Guide</InfoTitle>
												<InfoText>
													<a
														href="https://blog.christianposta.com/setting-up-a2a-oauth-user-delegation/"
														target="_blank"
														rel="noopener noreferrer"
														style={{ color: '#7c3aed', textDecoration: 'none' }}
													>
														Setting up A2A OAuth User Delegation
													</a>
												</InfoText>
											</div>
										</InfoBox>
										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>PingOne Documentation</InfoTitle>
												<InfoText>
													<strong>Release Status:</strong> Phase 1 planned for Q1 2026
													<br />
													<br />
													For PingOne-specific implementation details, refer to PingOne
													documentation and API docs when Token Exchange becomes available.
												</InfoText>
											</div>
										</InfoBox>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton onClick={() => toggleSection('troubleshooting')}>
								<CollapsibleTitle>
									<FiAlertCircle /> Troubleshooting Guide
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.troubleshooting && (
								<CollapsibleContent>
									<EducationalBox $type="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Common Issues & Solutions</InfoTitle>
											<InfoText>
												Use this troubleshooting guide to diagnose and fix common token exchange
												problems. Most issues stem from parameter mismatches or authentication
												problems.
											</InfoText>
										</div>
									</EducationalBox>

									<TroubleshootingTable>
										<thead>
											<tr>
												<th>Symptom</th>
												<th>Likely Cause</th>
												<th>Fix</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<code>invalid_grant</code> (code)
												</td>
												<td>Wrong redirect_uri or reused/expired code</td>
												<td>Exact match redirect, single-use code</td>
											</tr>
											<tr>
												<td>
													<code>invalid_client</code>
												</td>
												<td>Client auth mismatch</td>
												<td>Use proper Private Key JWT / secret</td>
											</tr>
											<tr>
												<td>
													<code>invalid_request</code> (claims/RAR)
												</td>
												<td>Malformed JSON</td>
												<td>Validate and minify before send</td>
											</tr>
											<tr>
												<td>No audience in token</td>
												<td>Missing resource parameter</td>
												<td>Add one or more resource params</td>
											</tr>
											<tr>
												<td>Claims missing in ID Token</td>
												<td>Server policy</td>
												<td>Ask AS admin to enable claim mapping/enrichment</td>
											</tr>
											<tr>
												<td>
													<code>unsupported_token_type</code>
												</td>
												<td>AS doesn't support requested token type</td>
												<td>Check AS capabilities, use supported types</td>
											</tr>
											<tr>
												<td>
													<code>invalid_scope</code>
												</td>
												<td>Requested scope not allowed</td>
												<td>Use scopes from original token or allowed list</td>
											</tr>
										</tbody>
									</TroubleshootingTable>

									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
											gap: '1rem',
											marginTop: '1.5rem',
										}}
									>
										<EducationalBox $type="info">
											<FiCheckCircle size={20} />
											<div>
												<InfoTitle>Implementation Checklist</InfoTitle>
												<InfoText>
													☐ PKCE implemented (S256)
													<br />☐ Private Key JWT configured on server
													<br />☐ Token exchange endpoint wired to UI
													<br />☐ JSON validators for claims and authorization_details
													<br />☐ Resource server expects correct aud claim
													<br />☐ Token introspection enabled for validation
												</InfoText>
											</div>
										</EducationalBox>
										<EducationalBox $type="success">
											<FiLock size={20} />
											<div>
												<InfoTitle>Security Validation</InfoTitle>
												<InfoText>
													☐ Tokens are short-lived (≤ 1 hour)
													<br />☐ Refresh tokens rotate on use
													<br />☐ Resource values validated against allow-list
													<br />☐ Claims/RAR JSON properly sanitized
													<br />☐ Token exchange restricted to backend only
													<br />☐ Audit logging enabled for all exchanges
												</InfoText>
											</div>
										</EducationalBox>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</ContentSection>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default V8MTokenExchange;
