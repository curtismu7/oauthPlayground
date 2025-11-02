// src/pages/flows/TokenExchangeFlowV7.tsx
// V7 OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security

import React, { useState, useCallback, useEffect } from 'react';
import {
	FiArrowRight,
	FiShield,
	FiKey,
	FiUsers,
	FiServer,
	FiCheckCircle,
	FiAlertCircle,
	FiInfo,
	FiRefreshCw,
	FiCopy,
	FiExternalLink,
	FiChevronDown,
	FiLock,
	FiGlobe,
	FiZap,
	FiCode,
	FiTerminal,
} from 'react-icons/fi';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import EnhancedApiCallDisplay from '../../components/EnhancedApiCallDisplay';
import { LearningTooltip } from '../../components/LearningTooltip';

type TokenExchangeScenario = 'delegation' | 'impersonation' | 'scope-reduction' | 'audience-restriction';

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const Header = styled.div`
	background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
	color: #ffffff;
	padding: 2rem;
	text-align: center;
`;

const VersionBadge = styled.span`
	background: rgba(124, 58, 237, 0.2);
	border: 1px solid #a855f7;
	color: #e9d5ff;
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
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.9);
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
			case 'banking': return '#22c55e';
			case 'payments': return '#f59e0b';
			case 'mcp': return '#7c3aed';
			case 'compliance': return '#ef4444';
			case 'admin': return '#dc2626';
			case 'user': return '#3b82f6';
			case 'business': return '#059669';
			case 'system': return '#6b7280';
			default: return '#e2e8f0';
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
				case 'banking': return '#22c55e';
				case 'payments': return '#f59e0b';
				case 'mcp': return '#7c3aed';
				case 'compliance': return '#ef4444';
				case 'admin': return '#dc2626';
				case 'user': return '#3b82f6';
				case 'business': return '#059669';
				case 'system': return '#6b7280';
				default: return '#e2e8f0';
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

// Enhanced component with detailed flow implementation
const TokenExchangeFlowV7Enhanced: React.FC = () => {
	usePageScroll({ pageName: 'Token Exchange Flow V7', force: true });
	
	const [selectedScenario, setSelectedScenario] = useState<TokenExchangeScenario>('audience-restriction');
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		codeExamples: true, // Implementation examples collapsed by default
		troubleshooting: true, // Troubleshooting collapsed by default
		advanced: false, // Advanced parameters expanded by default
		comparison: false, // Token comparison expanded by default
		details: false, // Scenario details expanded by default
		request: false, // Token exchange request expanded by default
		response: false, // Token exchange response expanded by default
		resources: true // Additional resources collapsed by default
	});
	const [subjectToken, setSubjectToken] = useState('');
	const [exchangedToken, setExchangedToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
	const [exchangeParams, setExchangeParams] = useState({
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		clientAuthMethod: 'private_key_jwt',
		audience: '',
		claims: '',
		authorizationDetails: '',
		includeRefreshToken: false
	});

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
			originalToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgcmVhZDpjb250YWN0cyByZWFkOmNhbGVuZGFyIHdyaXRlOmRhdGEiLCJhdWQiOiJteS13ZWItYXBwIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiZXhwIjoxNzI5NjM5NDQ3fQ...',
			availableScopes: [
				{ name: 'read:profile', description: 'Read user profile information', category: 'user' },
				{ name: 'read:contacts', description: 'Read user contacts from CRM', category: 'user' },
				{ name: 'write:contacts', description: 'Create/update contacts in CRM', category: 'user' },
				{ name: 'read:calendar', description: 'Read user calendar events', category: 'user' },
				{ name: 'read:opportunities', description: 'Read sales opportunities', category: 'business' },
				{ name: 'offline_access', description: 'Access data when user is offline', category: 'system' }
			],
			defaultClaims: '{"id_token":{"email":{"essential":true},"name":{"essential":true}}}',
			defaultAuthDetails: '[{"type":"crm_access","actions":["read"],"resources":["contacts","opportunities"]}]'
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
			originalToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl91c2VyIiwic2NvcGUiOiJhZG1pbjpmdWxsIGltcGVyc29uYXRlOnVzZXIgYXVkaXQ6cmVhZCBhdWRpdDp3cml0ZSIsImF1ZCI6ImFkbWluLWRhc2hib2FyZCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0N30...',
			availableScopes: [
				{ name: 'impersonate:user', description: 'Act on behalf of the user', category: 'delegation' },
				{ name: 'audit:read', description: 'Read audit logs and compliance data', category: 'compliance' },
				{ name: 'audit:write', description: 'Write audit entries', category: 'compliance' },
				{ name: 'admin:limited', description: 'Limited administrative access', category: 'admin' },
				{ name: 'reports:generate', description: 'Generate compliance reports', category: 'business' }
			],
			defaultClaims: '{"userinfo":{"sub":{"essential":true},"roles":{"essential":true}}}',
			defaultAuthDetails: '[{"type":"impersonation","target_user":"user_123","permissions":["audit:read"]}]'
		},
		'scope-reduction': {
			icon: <FiLock />,
			title: 'Scope Reduction',
			description: 'Reduce token scope for principle of least privilege',
			useCase: 'Limit permissions when calling specific microservices',
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			audience: 'https://api.reporting.service.com',
			scope: 'read:reports',
			color: '#22c55e',
			originalToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwb3dlcl91c2VyIiwic2NvcGUiOiJyZWFkOnJlcG9ydHMgd3JpdGU6cmVwb3J0cyBkZWxldGU6ZGF0YSBhZG1pbjphY2Nlc3MgcmVhZDpwcml2YXRlIHdyaXRlOnByaXZhdGUiLCJhdWQiOiJmdWxsLWFjY2Vzcy1hcHAiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
			availableScopes: [
				{ name: 'read:reports', description: 'Read generated reports only', category: 'reports' },
				{ name: 'read:public', description: 'Read public information', category: 'public' },
				{ name: 'write:reports', description: 'Create and modify reports', category: 'reports' },
				{ name: 'delete:reports', description: 'Delete reports', category: 'reports' },
				{ name: 'admin:reports', description: 'Administrative report access', category: 'admin' }
			],
			defaultClaims: '{"id_token":{"department":{"essential":true}}}',
			defaultAuthDetails: '[{"type":"data_access","classification":"public","actions":["read"]}]'
		},
		'audience-restriction': {
			icon: <FiServer />,
			title: 'CBA MCP/A2A Scenario',
			description: 'Create audience-specific tokens for CBA MCP/A2A communication',
			useCase: 'Generate tokens specifically for CBA MCP/A2A scenarios with scope reduction',
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			audience: 'https://mcp.cba.com.au',
			scope: 'mcp:read banking:transactions',
			color: '#7c3aed',
			originalToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYW5raW5nX2FwcCIsInNjb3BlIjoibWNwOnJlYWQgbWNwOndyaXRlIGEyYTpjb21tdW5pY2F0ZSBiYW5raW5nOmZ1bGwgcGF5bWVudHM6d3JpdGUgYWNjb3VudHM6d3JpdGUgdHJhbnNhY3Rpb25zOnJlYWQiLCJhdWQiOiJiYW5raW5nLXBsYXRmb3JtIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiZXhwIjoxNzI5NjM5NDQ3fQ...',
			availableScopes: [
				{ name: 'mcp:read', description: 'Read MCP data and configurations', category: 'mcp' },
				{ name: 'mcp:write', description: 'Write MCP data and configurations', category: 'mcp' },
				{ name: 'banking:transactions', description: 'Access transaction data', category: 'banking' },
				{ name: 'banking:accounts', description: 'Access account information', category: 'banking' },
				{ name: 'payments:initiate', description: 'Initiate payment transactions', category: 'payments' },
				{ name: 'payments:status', description: 'Check payment status', category: 'payments' },
				{ name: 'a2a:communicate', description: 'Application-to-application communication', category: 'system' },
				{ name: 'compliance:audit', description: 'Compliance and audit access', category: 'compliance' }
			],
			defaultClaims: '{"id_token":{"institution_id":{"essential":true},"regulatory_scope":{"essential":true}}}',
			defaultAuthDetails: '[{"type":"banking_access","institution":"CBA","services":["MCP","transactions"],"compliance_level":"PCI_DSS"}]'
		}
	};

	const toggleSection = useCallback((section: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	}, []);

	// Initialize selected scopes and parameters when component mounts
	useEffect(() => {
		const defaultScopes = scenarios[selectedScenario].scope.split(' ');
		setSelectedScopes(defaultScopes);
		setExchangeParams(prev => ({
			...prev,
			audience: scenarios[selectedScenario].audience,
			claims: scenarios[selectedScenario].defaultClaims,
			authorizationDetails: scenarios[selectedScenario].defaultAuthDetails
		}));
	}, []);

	const handleScenarioChange = useCallback((scenario: TokenExchangeScenario) => {
		setSelectedScenario(scenario);
		setCurrentStep(0);
		setSubjectToken('');
		setExchangedToken('');
		// Initialize with default scopes for the scenario
		const defaultScopes = scenarios[scenario].scope.split(' ');
		setSelectedScopes(defaultScopes);
		// Set scenario-specific defaults
		setExchangeParams(prev => ({
			...prev,
			audience: scenarios[scenario].audience,
			claims: scenarios[scenario].defaultClaims,
			authorizationDetails: scenarios[scenario].defaultAuthDetails
		}));
		v4ToastManager.showSuccess(`Selected ${scenarios[scenario].title} scenario`);
	}, []);

	const handleScopeToggle = useCallback((scopeName: string) => {
		setSelectedScopes(prev => {
			if (prev.includes(scopeName)) {
				return prev.filter(scope => scope !== scopeName);
			} else {
				return [...prev, scopeName];
			}
		});
	}, []);

	const handleParameterChange = useCallback((key: string, value: string | boolean) => {
		setExchangeParams(prev => ({
			...prev,
			[key]: value
		}));
	}, []);

	const simulateTokenExchange = useCallback(async () => {
		if (selectedScopes.length === 0) {
			v4ToastManager.showError('Please select at least one scope for the exchanged token');
			return;
		}

		setIsLoading(true);
		
		// Simulate API call delay with realistic processing time
		await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
		
		const scenario = scenarios[selectedScenario];
		const timestamp = new Date().toISOString();
		const tokenId = `${selectedScenario}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		// Create realistic exchanged token response based on scenario
		const header = btoa(JSON.stringify({
			alg: 'RS256',
			typ: 'JWT',
			kid: 'key-' + selectedScenario
		}));
		
		const payload = btoa(JSON.stringify({
			sub: selectedScenario === 'impersonation' ? 'service_account_123' : 'user_456',
			aud: exchangeParams.audience,
			iss: 'https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9',
			scope: selectedScopes.join(' '),
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			jti: tokenId,
			token_use: 'access',
			client_id: 'oauth-playground-client',
			username: selectedScenario === 'impersonation' ? 'system' : 'john.doe@example.com'
		}));
		
		const signature = Math.random().toString(36).substr(2, 43);
		
		const mockExchangedToken = {
			access_token: `${header}.${payload}.${signature}`,
			token_type: 'Bearer',
			expires_in: 3600,
			scope: selectedScopes.join(' '),
			audience: exchangeParams.audience,
			issued_token_type: exchangeParams.requestedTokenType,
			// Add scenario-specific metadata
			...(exchangeParams.includeRefreshToken && {
				refresh_token: `rt_${selectedScenario}_${Math.random().toString(36).substr(2, 32)}`
			}),
			// Server metadata
			server_timestamp: timestamp,
			grant_type: exchangeParams.grantType,
			environment_id: 'b9817c16-9910-4415-b67e-4ac687da74d9',
			client_authentication_method: exchangeParams.clientAuthMethod,
			// Exchange metadata
			exchange_metadata: {
				original_audience: selectedScenario === 'delegation' ? 'my-web-app' :
								 selectedScenario === 'impersonation' ? 'admin-dashboard' :
								 selectedScenario === 'scope-reduction' ? 'full-access-app' : 'banking-platform',
				scope_reduction: {
					original_scope_count: selectedScenario === 'delegation' ? 6 :
										 selectedScenario === 'impersonation' ? 4 :
										 selectedScenario === 'scope-reduction' ? 6 : 7,
					new_scope_count: selectedScopes.length,
					reduction_percentage: Math.round((1 - selectedScopes.length / (selectedScenario === 'delegation' ? 6 :
																				selectedScenario === 'impersonation' ? 4 :
																				selectedScenario === 'scope-reduction' ? 6 : 7)) * 100)
				},
				security_level: selectedScopes.length <= 2 ? 'HIGH' : selectedScopes.length <= 4 ? 'MEDIUM' : 'LOW',
				compliance_flags: {
					pci_dss: selectedScenario === 'audience-restriction' && selectedScopes.includes('payments:initiate'),
					gdpr: selectedScopes.some(s => s.includes('profile') || s.includes('contacts')),
					sox: selectedScenario === 'impersonation' && selectedScopes.includes('audit:read')
				}
			}
		};
		
		setExchangedToken(JSON.stringify(mockExchangedToken, null, 2));
		setIsLoading(false);
		v4ToastManager.showSuccess(`Token exchange completed! Reduced scope by ${mockExchangedToken.exchange_metadata.scope_reduction.reduction_percentage}%`);
	}, [selectedScenario, selectedScopes, exchangeParams]);

	const currentScenario = scenarios[selectedScenario];

	// Create API call object for EnhancedApiCallDisplay
	const tokenExchangeApiCall = {
		method: 'POST',
		url: 'https://auth.pingone.com/{environment_id}/as/token',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
			...(exchangeParams.clientAuthMethod === 'private_key_jwt' 
				? {} 
				: { 'Authorization': 'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=' }
			)
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
				client_assertion: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
			}),
			...(exchangeParams.claims && { claims: exchangeParams.claims }),
			...(exchangeParams.authorizationDetails && { authorization_details: exchangeParams.authorizationDetails })
		},
		flowType: 'token-exchange'
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
							<InfoTitle>Beyond Basic Scope Control</InfoTitle>
							<InfoText>
								OAuth 2.0 Token Exchange (RFC 8693) supports many advanced parameters for fine-grained control over 
								token properties, client authentication, claims, and authorization details. Configure these parameters 
								to match your specific security and integration requirements.
							</InfoText>
						</div>
					</EducationalBox>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
						<EducationalBox $type="success">
							<FiKey size={20} />
							<div>
								<InfoTitle>Token Types Explained</InfoTitle>
								<InfoText>
									• <strong>Access Token:</strong> Bearer token for API access<br/>
									• <strong>ID Token:</strong> JWT with user identity claims<br/>
									• <strong>Refresh Token:</strong> Long-lived token for renewal<br/>
									• <strong>JWT:</strong> Generic JSON Web Token format
								</InfoText>
							</div>
						</EducationalBox>
						<EducationalBox $type="warning">
							<FiUsers size={20} />
							<div>
								<InfoTitle>Grant Types Overview</InfoTitle>
								<InfoText>
									• <strong>Token Exchange:</strong> RFC 8693 delegation/impersonation<br/>
									• <strong>Authorization Code:</strong> Standard web app flow<br/>
									• <strong>Refresh Token:</strong> Renew expired access tokens<br/>
									• <strong>Client Credentials:</strong> Machine-to-machine auth
								</InfoText>
							</div>
						</EducationalBox>
					</div>

					<ParameterGrid>
						<ParameterGroup>
							<ParameterLabel>Grant Type</ParameterLabel>
							<ParameterSelect 
								value={exchangeParams.grantType}
								onChange={(e) => handleParameterChange('grantType', e.target.value)}
							>
								<option value="urn:ietf:params:oauth:grant-type:token-exchange">Token Exchange (RFC 8693)</option>
								<option value="authorization_code">Authorization Code</option>
								<option value="refresh_token">Refresh Token</option>
								<option value="client_credentials">Client Credentials</option>
							</ParameterSelect>
							<ParameterDescription>
								Determines the type of token exchange flow being performed
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>Subject Token Type</ParameterLabel>
							<ParameterSelect 
								value={exchangeParams.subjectTokenType}
								onChange={(e) => handleParameterChange('subjectTokenType', e.target.value)}
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">Access Token</option>
								<option value="urn:ietf:params:oauth:token-type:id_token">ID Token</option>
								<option value="urn:ietf:params:oauth:token-type:refresh_token">Refresh Token</option>
								<option value="urn:ietf:params:oauth:token-type:jwt">JWT</option>
							</ParameterSelect>
							<ParameterDescription>
								Type of the token being exchanged (the input token)
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>Requested Token Type</ParameterLabel>
							<ParameterSelect 
								value={exchangeParams.requestedTokenType}
								onChange={(e) => handleParameterChange('requestedTokenType', e.target.value)}
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">Access Token</option>
								<option value="urn:ietf:params:oauth:token-type:id_token">ID Token</option>
								<option value="urn:ietf:params:oauth:token-type:refresh_token">Refresh Token</option>
								<option value="urn:ietf:params:oauth:token-type:jwt">JWT</option>
							</ParameterSelect>
							<ParameterDescription>
								Type of token you want to receive from the exchange
							</ParameterDescription>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>Client Authentication Method</ParameterLabel>
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
							<ParameterLabel>Audience / Resource</ParameterLabel>
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
								/>
								<ParameterLabel style={{ margin: 0 }}>Include Refresh Token</ParameterLabel>
							</CheckboxGroup>
							<ParameterDescription>
								Request a refresh token in addition to the access token
							</ParameterDescription>
						</ParameterGroup>
					</ParameterGrid>

					<ParameterGrid>
						<ParameterGroup>
							<ParameterLabel>Claims (OIDC) - JSON</ParameterLabel>
							<ParameterTextarea 
								value={exchangeParams.claims}
								onChange={(e) => handleParameterChange('claims', e.target.value)}
								placeholder='{"id_token":{"email":{"essential":true}}}'
							/>
							<ParameterDescription>
								Request specific claims in ID token or UserInfo endpoint. Use "essential":true for required claims.
							</ParameterDescription>
							<div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#7c3aed' }}>
								<strong>Examples:</strong> email, name, groups, custom claims
							</div>
						</ParameterGroup>

						<ParameterGroup>
							<ParameterLabel>Authorization Details (RAR) - JSON</ParameterLabel>
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
							<InfoTitle>Claims vs Authorization Details vs Scopes</InfoTitle>
							<InfoText>
								• <strong>Scopes:</strong> Broad permission categories (read, write, admin)<br/>
								• <strong>Claims:</strong> Specific user attributes in tokens (email, name, roles)<br/>
								• <strong>Authorization Details:</strong> Fine-grained context (payment amounts, account numbers)<br/><br/>
								Use all three together for comprehensive authorization control in banking and financial applications.
							</InfoText>
						</div>
					</EducationalBox>

					<EducationalBox $type="security">
						<FiShield size={20} />
						<div>
							<InfoTitle>Security Best Practices</InfoTitle>
							<InfoText>
								• <strong>Always use PKCE</strong> for public clients; recommended for all clients<br/>
								• <strong>Prefer Private Key JWT</strong> for client authentication on confidential clients<br/>
								• <strong>Restrict Token Exchange</strong> (RFC 8693) to backends only; never from browsers<br/>
								• <strong>Validate resource values</strong> against an allow-list<br/>
								• <strong>Keep tokens short-lived</strong>; rotate refresh tokens; enable introspection
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
								See how token exchange is implemented in practice with cURL commands, Node.js/Express backend handlers, 
								and React frontend components. These examples show the complete flow from request to response.
							</InfoText>
						</div>
					</EducationalBox>

					<div style={{ marginBottom: '2rem' }}>
						<h4 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
${exchangeParams.clientAuthMethod === 'private_key_jwt' 
	? ` --data-urlencode "client_id=$CLIENT_ID" \\
 --data-urlencode "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \\
 --data-urlencode "client_assertion=$CLIENT_ASSERTION" \\`
	: ` -u "$CLIENT_ID:$CLIENT_SECRET" \\`
}
 --data-urlencode "grant_type=${exchangeParams.grantType}" \\
 --data-urlencode "subject_token=$SUBJECT_TOKEN" \\
 --data-urlencode "subject_token_type=${exchangeParams.subjectTokenType}" \\
 --data-urlencode "requested_token_type=${exchangeParams.requestedTokenType}" \\${exchangeParams.audience ? `
 --data-urlencode "resource=${exchangeParams.audience}" \\` : ''}
 --data-urlencode "scope=${selectedScopes.join(' ')}"${exchangeParams.claims ? ` \\
 --data-urlencode "claims=${exchangeParams.claims}"` : ''}${exchangeParams.authorizationDetails ? ` \\
 --data-urlencode "authorization_details=${exchangeParams.authorizationDetails}"` : ''}`}</CodeBlock>
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<h4 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiServer size={20} /> Actual Backend Implementation (server.js)
						</h4>
						<CodeBlock>{`// OAuth Playground Backend - Token Exchange Endpoint
// This is the actual implementation running at http://localhost:3001/api/token-exchange

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
						<h4 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiServer size={20} /> Custom Implementation Example
						</h4>
						<CodeBlock>{`// token.exchange.ts (TypeScript)
import fetch from "node-fetch";
import * as jose from "jose";

const AS = process.env.AS_ISSUER!;               // https://auth.pingone.com/<ENV_ID>
const TOKEN = \`\${AS}/as/token\`;
const CLIENT_ID = process.env.CLIENT_ID!;
${exchangeParams.clientAuthMethod === 'private_key_jwt' ? `const PRIVATE_KEY_PEM = process.env.PRIVATE_KEY_PEM!;

async function clientAssertion(aud: string) {
  const pk = await jose.importPKCS8(PRIVATE_KEY_PEM, "RS256");
  const now = Math.floor(Date.now()/1000);
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now).setExpirationTime(now + 60)
    .setIssuer(CLIENT_ID).setSubject(CLIENT_ID).setAudience(aud)
    .sign(pk);
}` : 'const CLIENT_SECRET = process.env.CLIENT_SECRET!;'}

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

${exchangeParams.clientAuthMethod === 'private_key_jwt' 
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
						<h4 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCode size={20} /> React Frontend Component
						</h4>
						<CodeBlock>{`// TokenExchangeComponent.tsx (React)
import React, { useState } from "react";

function TokenExchangeComponent() {
  const [exchangeState, setExchangeState] = useState({
    subjectToken: "",
    audience: "${exchangeParams.audience || 'https://api.example.com'}",
    scopes: [${selectedScopes.map(s => `"${s}"`).join(', ')}],
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
						<h4 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle size={20} /> Live Backend Response Example
						</h4>
						<EducationalBox $type="success">
							<FiInfo size={20} />
							<div>
								<InfoTitle>What You'll See When Testing</InfoTitle>
								<InfoText>
									When you click "Simulate Token Exchange" above, this frontend makes a real call to our backend 
									at <code>http://localhost:3001/api/token-exchange</code>. Here's what the actual response looks like:
								</InfoText>
							</div>
						</EducationalBox>
						<CodeBlock>{`// Successful Response from http://localhost:3001/api/token-exchange
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

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
						<EducationalBox $type="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Backend Features</InfoTitle>
								<InfoText>
									<strong>Our backend implementation includes:</strong><br/>
									• <strong>Multiple Auth Methods:</strong> Basic, POST, Private Key JWT<br/>
									• <strong>PKCE Support:</strong> Automatic code_verifier handling<br/>
									• <strong>Error Forwarding:</strong> PingOne errors passed through<br/>
									• <strong>Request Logging:</strong> Detailed debug information<br/>
									• <strong>Response Enrichment:</strong> Added server metadata
								</InfoText>
							</div>
						</EducationalBox>
						<EducationalBox $type="warning">
							<FiAlertCircle size={20} />
							<div>
								<InfoTitle>Error Handling</InfoTitle>
								<InfoText>
									<strong>Common error responses:</strong><br/>
									• <code>invalid_grant</code>: Invalid subject token<br/>
									• <code>invalid_scope</code>: Requested scope not allowed<br/>
									• <code>invalid_client</code>: Authentication failed<br/>
									• <code>unsupported_token_type</code>: Token type not supported<br/>
									• <code>server_error</code>: Backend processing error
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
				<FiLock /> Select Scopes for Exchanged Token
			</ScopeSelectorTitle>
			<p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
				Choose which scopes you want to include in the exchanged token. This allows you to implement 
				the principle of least privilege by only granting the minimum permissions required.
			</p>
			
			<div style={{ 
				display: 'flex', 
				flexWrap: 'wrap', 
				gap: '0.75rem', 
				marginBottom: '1rem',
				padding: '0.75rem',
				background: '#f8fafc',
				borderRadius: '0.5rem',
				border: '1px solid #e2e8f0'
			}}>
				<div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginRight: '0.5rem' }}>
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
					{ name: 'System', color: '#6b7280', bg: '#f3f4f6' }
				].map(category => (
					<div key={category.name} style={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: '0.25rem',
						fontSize: '0.75rem'
					}}>
						<div style={{
							width: '0.5rem',
							height: '0.5rem',
							borderRadius: '50%',
							background: category.color
						}}></div>
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
							<div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								{scope.name}
								<span style={{ 
									fontSize: '0.625rem', 
									padding: '0.125rem 0.375rem', 
									borderRadius: '0.25rem',
									background: (() => {
										switch (scope.category) {
											case 'banking': return '#dcfce7';
											case 'payments': return '#fef3c7';
											case 'mcp': return '#e0e7ff';
											case 'compliance': return '#fee2e2';
											case 'admin': return '#fecaca';
											case 'user': return '#dbeafe';
											case 'business': return '#d1fae5';
											case 'system': return '#f3f4f6';
											default: return '#f3f4f6';
										}
									})(),
									color: (() => {
										switch (scope.category) {
											case 'banking': return '#166534';
											case 'payments': return '#92400e';
											case 'mcp': return '#5b21b6';
											case 'compliance': return '#991b1b';
											case 'admin': return '#991b1b';
											case 'user': return '#1e40af';
											case 'business': return '#065f46';
											case 'system': return '#374151';
											default: return '#374151';
										}
									})(),
									fontWeight: '500',
									textTransform: 'uppercase'
								}}>
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
							Please select at least one scope to proceed with the token exchange. 
							The exchanged token will only have the permissions for the selected scopes.
						</InfoText>
					</div>
				</InfoBox>
			)}

			{selectedScopes.length > 0 && (
				<div style={{ marginTop: '1.5rem' }}>
					<h4 style={{ color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiShield size={16} /> Real-time Security Metrics
					</h4>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
						<MetricsCard>
							<MetricValue style={{ color: '#22c55e' }}>
								{Math.round((1 - selectedScopes.length / currentScenario.availableScopes.length) * 100)}%
							</MetricValue>
							<MetricLabel>Scope Reduction</MetricLabel>
						</MetricsCard>
						<MetricsCard>
							<MetricValue style={{ color: '#7c3aed' }}>
								{selectedScopes.length}
							</MetricValue>
							<MetricLabel>Active Permissions</MetricLabel>
						</MetricsCard>
						<MetricsCard>
							<MetricValue style={{ 
								color: selectedScopes.length <= 2 ? '#22c55e' : 
									   selectedScopes.length <= 4 ? '#f59e0b' : '#ef4444' 
							}}>
								{selectedScopes.length <= 2 ? 'HIGH' : 
								 selectedScopes.length <= 4 ? 'MED' : 'LOW'}
							</MetricValue>
							<MetricLabel>Security Level</MetricLabel>
						</MetricsCard>
						<MetricsCard>
							<MetricValue style={{ color: '#3b82f6' }}>
								{new Set(selectedScopes.map(scope => 
									currentScenario.availableScopes.find(s => s.name === scope)?.category
								)).size}
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
					
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
						<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
							<strong style={{ color: '#7c3aed' }}>Grant Type:</strong><br/>
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{currentScenario.grantType}</code>
						</div>
						<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
							<strong style={{ color: '#7c3aed' }}>Audience:</strong><br/>
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{currentScenario.audience}</code>
						</div>
						<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
							<strong style={{ color: '#7c3aed' }}>Default Scope:</strong><br/>
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{currentScenario.scope}</code>
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
								See how token exchange transforms a broad-scoped token into a focused, audience-specific token. 
								This demonstrates the principle of least privilege in action.
							</InfoText>
						</div>
					</EducationalBox>

					<div style={{ 
						display: 'grid', 
						gridTemplateColumns: '1fr auto 1fr', 
						gap: '1.5rem', 
						alignItems: 'center',
						margin: '2rem 0',
						padding: '1.5rem',
						background: '#f8fafc',
						borderRadius: '0.75rem',
						border: '1px solid #e2e8f0'
					}}>
						<div>
							<h4 style={{ 
								color: '#374151', 
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem'
							}}>
								<div style={{
									width: '1rem',
									height: '1rem',
									borderRadius: '50%',
									background: '#ef4444'
								}}></div>
								Original Token (Broad Scope)
							</h4>
							<div style={{ 
								background: '#ffffff',
								border: '1px solid #e5e7eb',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontSize: '0.75rem',
								fontFamily: 'Monaco, Menlo, monospace'
							}}>
								<div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>Subject Token:</div>
								<div style={{ wordBreak: 'break-all', marginBottom: '1rem', color: '#374151' }}>
									{currentScenario.originalToken}
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Audience:</span>
									<span>{currentScenario.originalToken.includes('admin') ? 'admin-dashboard' : 
										   currentScenario.originalToken.includes('banking') ? 'banking-platform' :
										   currentScenario.originalToken.includes('power') ? 'full-access-app' : 'my-web-app'}</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Scopes:</span>
									<span>{currentScenario.originalToken.includes('admin') ? 'admin:full impersonate:user audit:read audit:write' :
										   currentScenario.originalToken.includes('banking') ? 'mcp:read mcp:write a2a:communicate banking:full payments:write accounts:write transactions:read' :
										   currentScenario.originalToken.includes('power') ? 'read:reports write:reports delete:data admin:access read:private write:private' :
										   'openid profile email read:contacts read:calendar write:data'}</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Risk Level:</span>
									<span style={{ color: '#ef4444', fontWeight: '600' }}>HIGH - Broad permissions</span>
								</div>
							</div>
						</div>

						<div style={{ textAlign: 'center' }}>
							<div style={{
								background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
								color: 'white',
								padding: '1rem',
								borderRadius: '50%',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}>
								<FiArrowRight size={24} />
							</div>
							<div style={{ 
								fontSize: '0.75rem', 
								color: '#7c3aed', 
								fontWeight: '600', 
								marginTop: '0.5rem',
								textAlign: 'center'
							}}>
								Token<br/>Exchange
							</div>
						</div>

						<div>
							<h4 style={{ 
								color: '#374151', 
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem'
							}}>
								<div style={{
									width: '1rem',
									height: '1rem',
									borderRadius: '50%',
									background: '#22c55e'
								}}></div>
								Exchanged Token (Reduced Scope)
							</h4>
							<div style={{ 
								background: '#ffffff',
								border: '1px solid #e5e7eb',
								borderRadius: '0.5rem',
								padding: '1rem',
								fontSize: '0.75rem',
								fontFamily: 'Monaco, Menlo, monospace'
							}}>
								<div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>New Access Token:</div>
								<div style={{ wordBreak: 'break-all', marginBottom: '1rem', color: '#374151' }}>
									exchanged_{Date.now()}_{Math.random().toString(36).substr(2, 9)}
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Audience:</span>
									<span>{exchangeParams.audience}</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Scopes:</span>
									<span>{selectedScopes.join(' ')}</span>
									<span style={{ color: '#7c3aed', fontWeight: '600' }}>Risk Level:</span>
									<span style={{ color: '#22c55e', fontWeight: '600' }}>LOW - Minimal permissions</span>
								</div>
							</div>
						</div>
					</div>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
						<EducationalBox $type="success">
							<FiShield size={20} />
							<div>
								<InfoTitle>Security Benefits</InfoTitle>
								<InfoText>
									• <strong>Scope Reduction:</strong> {selectedScopes.length} vs original broader permissions<br/>
									• <strong>Audience Restriction:</strong> Token only valid for {exchangeParams.audience}<br/>
									• <strong>Time-bound:</strong> Short expiration reduces exposure window<br/>
									• <strong>Traceable:</strong> Clear audit trail of token exchanges
								</InfoText>
							</div>
						</EducationalBox>
						<EducationalBox $type="info">
							<FiLock size={20} />
							<div>
								<InfoTitle>Use Case: {currentScenario.title}</InfoTitle>
								<InfoText>
									<strong>Scenario:</strong> {currentScenario.useCase}<br/>
									<strong>Target API:</strong> {exchangeParams.audience}<br/>
									<strong>Selected Scopes:</strong> {selectedScopes.length} permissions<br/>
									<strong>Security Model:</strong> Zero Trust Architecture
								</InfoText>
							</div>
						</EducationalBox>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenExchangeRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('request')}>
				<CollapsibleTitle>
					<FiZap /> Token Exchange Request (RFC 8693)
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.request && (
				<CollapsibleContent>
					<InfoBox $variant="warning">
						<FiAlertCircle size={20} />
						<div>
							<InfoTitle>CBA Security Profile Implementation</InfoTitle>
							<InfoText>
								This demonstrates how CBA can implement token exchange for A2A scenarios with scope reduction 
								and audience restriction, following OAuth 2.0 security best practices. This approach enables:
								<br/><br/>
								• <strong>Zero Trust Architecture:</strong> Each service gets minimal required permissions<br/>
								• <strong>Audit Trail:</strong> Complete visibility into token exchanges and usage<br/>
								• <strong>Compliance:</strong> Meets banking regulatory requirements for access control<br/>
								• <strong>Scalability:</strong> Supports complex microservices architectures
							</InfoText>
						</div>
					</InfoBox>

					<div style={{ 
						display: 'grid', 
						gridTemplateColumns: '1fr auto 1fr', 
						gap: '1rem', 
						alignItems: 'center',
						margin: '1.5rem 0',
						padding: '1rem',
						background: '#f8fafc',
						borderRadius: '0.5rem',
						border: '1px solid #e2e8f0'
					}}>
						<div style={{ textAlign: 'center' }}>
							<div style={{ 
								padding: '1rem', 
								background: '#dbeafe', 
								borderRadius: '0.5rem',
								border: '1px solid #3b82f6'
							}}>
								<FiKey size={24} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
								<div style={{ fontWeight: '600', color: '#1e40af' }}>Original Token</div>
								<div style={{ fontSize: '0.75rem', color: '#3730a3' }}>
									Broad scope<br/>
									Multiple audiences
								</div>
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<FiArrowRight size={32} style={{ color: '#7c3aed' }} />
							<div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '600', marginTop: '0.25rem' }}>
								Token Exchange
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<div style={{ 
								padding: '1rem', 
								background: '#dcfce7', 
								borderRadius: '0.5rem',
								border: '1px solid #22c55e'
							}}>
								<FiShield size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
								<div style={{ fontWeight: '600', color: '#15803d' }}>Exchanged Token</div>
								<div style={{ fontSize: '0.75rem', color: '#166534' }}>
									Reduced scope<br/>
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
							urlHighlightRules: {
								'pingone.com': { color: '#7c3aed', weight: 'bold' },
								'token': { color: '#059669', weight: 'bold' }
							}
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
									New token issued with reduced scope and audience restriction for secure A2A communication.
								</InfoText>
							</div>
						</InfoBox>

						<CodeBlock>{exchangedToken}</CodeBlock>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
							<InfoBox $variant="success">
								<FiShield size={20} />
								<div>
									<InfoTitle>Security Benefits</InfoTitle>
									<InfoText>
										• <strong>Scope Reduction:</strong> Token has minimal required permissions<br/>
										• <strong>Audience Restriction:</strong> Token only valid for specific service<br/>
										• <strong>Time-bound:</strong> Short expiration reduces exposure window<br/>
										• <strong>Traceable:</strong> Clear audit trail of token exchanges
									</InfoText>
								</div>
							</InfoBox>
							<InfoBox $variant="info">
								<FiLock size={20} />
								<div>
									<InfoTitle>Banking Compliance</InfoTitle>
									<InfoText>
										• <strong>PCI DSS:</strong> Supports tokenization requirements<br/>
										• <strong>APRA CPS 234:</strong> Meets information security standards<br/>
										• <strong>Privacy Act:</strong> Enables data minimization principles<br/>
										• <strong>ACCC CDR:</strong> Supports Consumer Data Right architecture
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
						<VersionBadge>V7.0 - RFC 8693</VersionBadge>
						<Title>OAuth 2.0 Token Exchange</Title>
						<Subtitle>Secure A2A Communication with Scope Reduction & Audience Restriction</Subtitle>
					</Header>

					<ContentSection>
						<div style={{ textAlign: 'center', marginBottom: '2rem' }}>
							<h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Choose Your Token Exchange Scenario</h2>
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
									<div style={{ 
										marginTop: '0.75rem', 
										fontSize: '0.75rem', 
										color: '#7c3aed',
										fontWeight: '600'
									}}>
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
						{renderTokenExchangeRequest()}
						{renderTokenExchangeResponse()}

						<CollapsibleSection>
							<CollapsibleHeaderButton onClick={() => toggleSection('resources')}>
								<CollapsibleTitle>
									<FiExternalLink /> Additional Resources
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.resources && (
								<CollapsibleContent>
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
										<InfoBox $variant="info">
											<FiGlobe size={20} />
											<div>
												<InfoTitle>RFC 8693 Specification</InfoTitle>
												<InfoText>
													<a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/" 
													   target="_blank" rel="noopener noreferrer"
													   style={{ color: '#7c3aed', textDecoration: 'none' }}>
														OAuth 2.0 Token Exchange Specification
													</a>
												</InfoText>
											</div>
										</InfoBox>
										<InfoBox $variant="success">
											<FiServer size={20} />
											<div>
												<InfoTitle>A2A Implementation Guide</InfoTitle>
												<InfoText>
													<a href="https://blog.christianposta.com/setting-up-a2a-oauth-user-delegation/" 
													   target="_blank" rel="noopener noreferrer"
													   style={{ color: '#7c3aed', textDecoration: 'none' }}>
														Setting up A2A OAuth User Delegation
													</a>
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
												Use this troubleshooting guide to diagnose and fix common token exchange problems. 
												Most issues stem from parameter mismatches or authentication problems.
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
												<td><code>invalid_grant</code> (code)</td>
												<td>Wrong redirect_uri or reused/expired code</td>
												<td>Exact match redirect, single-use code</td>
											</tr>
											<tr>
												<td><code>invalid_client</code></td>
												<td>Client auth mismatch</td>
												<td>Use proper Private Key JWT / secret</td>
											</tr>
											<tr>
												<td><code>invalid_request</code> (claims/RAR)</td>
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
												<td><code>unsupported_token_type</code></td>
												<td>AS doesn't support requested token type</td>
												<td>Check AS capabilities, use supported types</td>
											</tr>
											<tr>
												<td><code>invalid_scope</code></td>
												<td>Requested scope not allowed</td>
												<td>Use scopes from original token or allowed list</td>
											</tr>
										</tbody>
									</TroubleshootingTable>

									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
										<EducationalBox $type="info">
											<FiCheckCircle size={20} />
											<div>
												<InfoTitle>Implementation Checklist</InfoTitle>
												<InfoText>
													☐ PKCE implemented (S256)<br/>
													☐ Private Key JWT configured on server<br/>
													☐ Token exchange endpoint wired to UI<br/>
													☐ JSON validators for claims and authorization_details<br/>
													☐ Resource server expects correct aud claim<br/>
													☐ Token introspection enabled for validation
												</InfoText>
											</div>
										</EducationalBox>
										<EducationalBox $type="success">
											<FiLock size={20} />
											<div>
												<InfoTitle>Security Validation</InfoTitle>
												<InfoText>
													☐ Tokens are short-lived (≤ 1 hour)<br/>
													☐ Refresh tokens rotate on use<br/>
													☐ Resource values validated against allow-list<br/>
													☐ Claims/RAR JSON properly sanitized<br/>
													☐ Token exchange restricted to backend only<br/>
													☐ Audit logging enabled for all exchanges
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

export default TokenExchangeFlowV7Enhanced;