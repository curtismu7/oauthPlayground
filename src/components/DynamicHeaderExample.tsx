// src/components/DynamicHeaderExample.tsx
// Example component demonstrating dynamic header colors based on security features


import React, { useState } from 'react';
import styled from 'styled-components';
import { createSecurityFeaturesConfig, FlowHeader } from '../services/flowHeaderService';

const ExampleContainer = styled.div`
	padding: 2rem;
	max-width: 800px;
	margin: 0 auto;
`;

const SecurityControls = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 12px;
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const ControlGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const ToggleSwitch = styled.label`
	position: relative;
	display: inline-block;
	width: 50px;
	height: 24px;
`;

const ToggleInput = styled.input`
	opacity: 0;
	width: 0;
	height: 0;

	&:checked + span {
		background-color: V9_COLORS.PRIMARY.BLUE;
	}

	&:checked + span:before {
		transform: translateX(26px);
	}
`;

const ToggleSlider = styled.span`
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ccc;
	transition: 0.4s;
	border-radius: 24px;

	&:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}
`;

const ControlLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const StatusIndicator = styled.div<{ $enabled: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border-radius: 6px;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${(props) => (props.$enabled ? 'V9_COLORS.BG.SUCCESS' : 'V9_COLORS.BG.ERROR')};
	color: ${(props) => (props.$enabled ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.PRIMARY.RED_DARK')};
`;

const DynamicHeaderExample: React.FC = () => {
	// Mock PingOne configuration state
	const [pingOneConfig, setPingOneConfig] = useState({
		enableJWKS: false,
		requirePushedAuthorizationRequest: false,
		requestParameterSignatureRequirement: 'DEFAULT' as 'DEFAULT' | 'REQUIRE_SIGNED',
		enableDPoP: false,
	});

	// Create security features config from PingOne state
	const securityFeatures = createSecurityFeaturesConfig(pingOneConfig);

	const handleToggle = (feature: keyof typeof pingOneConfig) => {
		setPingOneConfig((prev) => ({
			...prev,
			[feature]: !prev[feature],
		}));
	};

	const handleAuthMethodChange = (value: 'DEFAULT' | 'REQUIRE_SIGNED') => {
		setPingOneConfig((prev) => ({
			...prev,
			requestParameterSignatureRequirement: value,
		}));
	};

	return (
		<ExampleContainer>
			<h1>Dynamic Header Colors Demo</h1>
			<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '2rem' }}>
				Toggle security features below to see how the header colors change dynamically.
			</p>

			<SecurityControls>
				<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					Security Features
				</h3>

				<ControlGroup>
					<ToggleSwitch>
						<ToggleInput
							type="checkbox"
							checked={pingOneConfig.enableJWKS}
							onChange={() => handleToggle('enableJWKS')}
						/>
						<ToggleSlider />
					</ToggleSwitch>
					<ControlLabel>
						<span style={{ fontSize: '16px' }}>🔑</span>
						JWKS (JSON Web Key Set)
					</ControlLabel>
					<StatusIndicator $enabled={pingOneConfig.enableJWKS}>
						{pingOneConfig.enableJWKS ? 'Enabled' : 'Disabled'}
					</StatusIndicator>
				</ControlGroup>

				<ControlGroup>
					<ToggleSwitch>
						<ToggleInput
							type="checkbox"
							checked={pingOneConfig.requirePushedAuthorizationRequest}
							onChange={() => handleToggle('requirePushedAuthorizationRequest')}
						/>
						<ToggleSlider />
					</ToggleSwitch>
					<ControlLabel>
						<span style={{ fontSize: '16px' }}>🌐</span>
						PAR (Pushed Authorization Request)
					</ControlLabel>
					<StatusIndicator $enabled={pingOneConfig.requirePushedAuthorizationRequest}>
						{pingOneConfig.requirePushedAuthorizationRequest ? 'Enabled' : 'Disabled'}
					</StatusIndicator>
				</ControlGroup>

				<ControlGroup>
					<ToggleSwitch>
						<ToggleInput
							type="checkbox"
							checked={pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED'}
							onChange={() =>
								handleAuthMethodChange(
									pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED'
										? 'DEFAULT'
										: 'REQUIRE_SIGNED'
								)
							}
						/>
						<ToggleSlider />
					</ToggleSwitch>
					<ControlLabel>
						<span style={{ fontSize: '16px' }}>🛡️</span>
						JAR (JWT Secured Authorization Request)
					</ControlLabel>
					<StatusIndicator
						$enabled={pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED'}
					>
						{pingOneConfig.requestParameterSignatureRequirement === 'REQUIRE_SIGNED'
							? 'Enabled'
							: 'Disabled'}
					</StatusIndicator>
				</ControlGroup>

				<ControlGroup>
					<ToggleSwitch>
						<ToggleInput
							type="checkbox"
							checked={pingOneConfig.enableDPoP}
							onChange={() => handleToggle('enableDPoP')}
						/>
						<ToggleSlider />
					</ToggleSwitch>
					<ControlLabel>
						<span style={{ fontSize: '16px' }}>⚙️</span>
						DPoP (Demonstration of Proof of Possession)
					</ControlLabel>
					<StatusIndicator $enabled={pingOneConfig.enableDPoP}>
						{pingOneConfig.enableDPoP ? 'Enabled' : 'Disabled'}
					</StatusIndicator>
				</ControlGroup>
			</SecurityControls>

			{/* Dynamic Header Examples */}
			<div style={{ marginBottom: '2rem' }}>
				<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					OAuth 2.0 Flow Header
				</h3>
				<FlowHeader
					flowType="oauth"
					customConfig={{
						title: 'OAuth 2.0 Authorization Code Flow',
						subtitle: 'API Authorization with Access token only',
						version: 'V6',
						securityFeatures,
					}}
				/>
			</div>

			<div style={{ marginBottom: '2rem' }}>
				<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					OpenID Connect Flow Header
				</h3>
				<FlowHeader
					flowType="oidc"
					customConfig={{
						title: 'OpenID Connect Authorization Code Flow',
						subtitle: 'Authentication + Authorization with ID token and Access token',
						version: 'V6',
						securityFeatures,
					}}
				/>
			</div>

			<div style={{ marginBottom: '2rem' }}>
				<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					PingOne Flow Header
				</h3>
				<FlowHeader
					flowType="pingone"
					customConfig={{
						title: 'PingOne Advanced Configuration',
						subtitle: 'Enterprise-grade security features',
						version: 'V6',
						securityFeatures,
					}}
				/>
			</div>

			{/* Security Status Summary */}
			<div
				style={{
					background: 'V9_COLORS.BG.GRAY_LIGHT',
					border: '1px solid #0ea5e9',
					borderRadius: '8px',
					padding: '1rem',
					marginTop: '2rem',
				}}
			>
				<h4 style={{ margin: '0 0 0.5rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					Security Status
				</h4>
				<div style={{ fontSize: '0.875rem', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
					<strong>Current Security Level:</strong>{' '}
					{securityFeatures?.highSecurityMode
						? '🔒 High Security (Gold)'
						: securityFeatures?.jwksEnabled ||
								securityFeatures?.parEnabled ||
								securityFeatures?.jarEnabled ||
								securityFeatures?.dpopEnabled
							? '🛡️ Enhanced Security (Green)'
							: '🔓 Standard Security (Default)'}
				</div>
				<div style={{ fontSize: '0.8rem', color: 'V9_COLORS.PRIMARY.BLUE', marginTop: '0.5rem' }}>
					<strong>Active Features:</strong>{' '}
					{Object.entries(securityFeatures || {})
						.filter(([key, value]) => key !== 'highSecurityMode' && value)
						.map(([key]) => key.replace('Enabled', '').toUpperCase())
						.join(', ') || 'None'}
				</div>
			</div>
		</ExampleContainer>
	);
};

export default DynamicHeaderExample;
