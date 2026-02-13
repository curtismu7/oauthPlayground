/**
 * @file PingOneAppConfigForm.tsx
 * @component PingOneAppConfigForm
 * @description Form for configuring PingOne application settings including wildcard redirect URI support
 * @version 1.0.0
 */

import React from 'react';
import { FiAlertTriangle, FiGlobe, FiInfo, FiShield } from 'react-icons/fi';
import styled from 'styled-components';

const Container = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const Title = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
`;

const Subtitle = styled.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin: 0.5rem 0 0 0;
`;

const Section = styled.div`
	margin-bottom: 1.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	margin: 0 0 0.75rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const Select = styled.select`
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	color: #374151;
	background-color: white;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ToggleContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem;
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
`;

const ToggleLabel = styled.span`
	font-size: 0.875rem;
	color: #374151;
`;

const Toggle = styled.button<{ $active: boolean }>`
	position: relative;
	width: 2.75rem;
	height: 1.375rem;
	background-color: ${({ $active }) => ($active ? '#10b981' : '#d1d5db')};
	border: none;
	border-radius: 9999px;
	cursor: pointer;
	transition: background-color 0.2s;
	
	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}
	
	&::after {
		content: '';
		position: absolute;
		top: 0.125rem;
		left: ${({ $active }) => ($active ? '1.5rem' : '0.125rem')};
		width: 1.125rem;
		height: 1.125rem;
		background-color: white;
		border-radius: 9999px;
		transition: left 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
`;

const Alert = styled.div<{ $type: 'warning' | 'error' | 'info' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	margin-top: 0.75rem;
	
	${({ $type }) => {
		switch ($type) {
			case 'warning':
				return `
					background-color: #fef3c7;
					border: 1px solid #f59e0b;
					color: #92400e;
				`;
			case 'error':
				return `
					background-color: #fee2e2;
					border: 1px solid #ef4444;
					color: #991b1b;
				`;
			case 'info':
				return `
					background-color: #dbeafe;
					border: 1px solid #3b82f6;
					color: #1e40af;
				`;
		}
	}}
`;

const AlertIcon = styled.div`
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const AlertContent = styled.div`
	flex: 1;
`;

const AlertTitle = styled.div`
	font-weight: 600;
	margin-bottom: 0.25rem;
`;

const AlertMessage = styled.div`
	line-height: 1.5;
`;

export interface PingOneAppConfig {
	oauthVersion: '2.0' | '2.1';
	allowRedirectUriPatterns: boolean;
}

interface PingOneAppConfigFormProps {
	config: PingOneAppConfig;
	onChange: (config: PingOneAppConfig) => void;
}

export const PingOneAppConfigForm: React.FC<PingOneAppConfigFormProps> = ({ config, onChange }) => {
	const handleOAuthVersionChange = (oauthVersion: '2.0' | '2.1') => {
		onChange({ ...config, oauthVersion });

		// If switching to OAuth 2.1, disable wildcard patterns
		if (oauthVersion === '2.1' && config.allowRedirectUriPatterns) {
			onChange({ ...config, oauthVersion, allowRedirectUriPatterns: false });
		}
	};

	const handleWildcardToggle = () => {
		const newConfig = { ...config, allowRedirectUriPatterns: !config.allowRedirectUriPatterns };
		onChange(newConfig);
	};

	return (
		<Container>
			<Header>
				<FiShield size={24} color="#3b82f6" />
				<div>
					<Title>PingOne Application Configuration</Title>
					<Subtitle>
						Configure your PingOne application settings to match your actual app configuration
					</Subtitle>
				</div>
			</Header>

			<Section>
				<SectionTitle>
					<FiGlobe size={16} />
					OAuth Version
				</SectionTitle>
				<FormGroup>
					<Label htmlFor="oauth-version">Select OAuth Version</Label>
					<Select
						id="oauth-version"
						value={config.oauthVersion}
						onChange={(e) => handleOAuthVersionChange(e.target.value as '2.0' | '2.1')}
					>
						<option value="2.0">OAuth 2.0</option>
						<option value="2.1">OAuth 2.1 (Draft)</option>
					</Select>
				</FormGroup>

				{config.oauthVersion === '2.1' && (
					<Alert $type="info">
						<AlertIcon>
							<FiInfo size={16} />
						</AlertIcon>
						<AlertContent>
							<AlertTitle>OAuth 2.1 Restrictions</AlertTitle>
							<AlertMessage>
								OAuth 2.1 does not allow wildcard redirect URIs, even with "Allow Redirect URI
								Patterns" enabled.
							</AlertMessage>
						</AlertContent>
					</Alert>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiGlobe size={16} />
					Redirect URI Patterns
				</SectionTitle>
				<ToggleContainer>
					<ToggleLabel>Allow Redirect URI Patterns</ToggleLabel>
					<Toggle
						$active={config.allowRedirectUriPatterns}
						onClick={handleWildcardToggle}
						disabled={config.oauthVersion === '2.1'}
						style={{ opacity: config.oauthVersion === '2.1' ? 0.5 : 1 }}
					/>
				</ToggleContainer>

				{!config.allowRedirectUriPatterns && (
					<Alert $type="error">
						<AlertIcon>
							<FiAlertTriangle size={16} />
						</AlertIcon>
						<AlertContent>
							<AlertTitle>Wildcard URIs Not Allowed</AlertTitle>
							<AlertMessage>
								Your PingOne application must have "Allow Redirect URI Patterns" enabled to use
								wildcard redirect URIs.
								<br />
								<br />
								To enable this setting:
								<br />
								1. Go to your PingOne application
								<br />
								2. Navigate to Configuration → OIDC
								<br />
								3. Check "Allow Redirect URI Patterns"
								<br />
								4. Save your changes
							</AlertMessage>
						</AlertContent>
					</Alert>
				)}

				{config.allowRedirectUriPatterns && config.oauthVersion === '2.0' && (
					<Alert $type="warning">
						<AlertIcon>
							<FiAlertTriangle size={16} />
						</AlertIcon>
						<AlertContent>
							<AlertTitle>Developer Sandbox Only</AlertTitle>
							<AlertMessage>
								Wildcard redirect URIs are allowed but should only be used in developer sandbox
								environments. For production, use specific redirect URIs for better security.
							</AlertMessage>
						</AlertContent>
					</Alert>
				)}
			</Section>
		</Container>
	);
};
