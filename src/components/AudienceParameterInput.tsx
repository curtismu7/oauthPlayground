// src/components/AudienceParameterInput.tsx
// OAuth/OIDC Audience Parameter Input - API targeting for access tokens
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { FiTarget, FiInfo, FiAlertCircle, FiMove } from 'react-icons/fi';

interface AudienceParameterInputProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	flowType?: 'oauth' | 'oidc';
	tokenEndpoint?: string | undefined; // From OIDC discovery
	issuer?: string | undefined; // From OIDC discovery
	autoFillFromDiscovery?: boolean; // Whether to auto-fill on load
}

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const LabelIcon = styled.div`
	color: #10b981;
	font-size: 1rem;
`;

const InputWrapper = styled.div`
	position: relative;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const HelperText = styled.div`
	margin-top: 0.5rem;
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.5;
`;

const ExamplesBox = styled.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
`;

const ExampleTitle = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const ExampleItem = styled.button<{ $isFromDiscovery?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	text-align: left;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background: ${props => props.$isFromDiscovery ? '#eff6ff' : '#ffffff'};
	border: 1px solid ${props => props.$isFromDiscovery ? '#60a5fa' : '#e5e7eb'};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: ${props => props.$isFromDiscovery ? '#1e40af' : '#10b981'};
	cursor: grab;
	transition: all 0.2s;
	position: relative;

	&:hover {
		background: ${props => props.$isFromDiscovery ? '#dbeafe' : '#f0fdf4'};
		border-color: ${props => props.$isFromDiscovery ? '#3b82f6' : '#10b981'};
		transform: translateX(2px);
	}

	&:active {
		cursor: grabbing;
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

const ExampleText = styled.span`
	flex: 1;
`;

const DragIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.5;
	font-size: 0.875rem;
	margin-left: 0.5rem;
`;

const DiscoveryBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.375rem;
	background: #3b82f6;
	color: white;
	border-radius: 0.25rem;
	font-size: 0.625rem;
	font-weight: 600;
	margin-left: 0.5rem;
	text-transform: uppercase;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' }>`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${props => props.$variant === 'warning' ? '#fef3c7' : '#f0fdf4'};
	border: 1px solid ${props => props.$variant === 'warning' ? '#fbbf24' : '#86efac'};
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${props => props.$variant === 'warning' ? '#78350f' : '#166534'};
	line-height: 1.5;
`;

const InfoIcon = styled.div<{ $variant?: 'info' | 'warning' }>`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${props => props.$variant === 'warning' ? '#f59e0b' : '#10b981'};
`;

const defaultExamples = [
	'https://api.example.com',
	'https://api.myservice.com/v1',
	'urn:my-resource-server',
	'https://graph.microsoft.com',
];

export const AudienceParameterInput: React.FC<AudienceParameterInputProps> = ({
	value,
	onChange,
	disabled = false,
	flowType = 'oauth',
	tokenEndpoint,
	issuer,
	autoFillFromDiscovery = false
}) => {
	// Auto-fill from OIDC discovery on mount if enabled and value is empty
	useEffect(() => {
		if (autoFillFromDiscovery && !value && (tokenEndpoint || issuer)) {
			// Prefer issuer as audience (base URL), fallback to token endpoint
			const discoveredAudience = issuer || tokenEndpoint;
			if (discoveredAudience) {
				console.log('[AudienceParameter] Auto-filling from OIDC discovery:', discoveredAudience);
				onChange(discoveredAudience);
			}
		}
	}, [autoFillFromDiscovery, value, tokenEndpoint, issuer, onChange]);

	// Build examples list with OIDC discovery endpoints at the top
	const buildExamples = () => {
		const examples: Array<{ value: string; isFromDiscovery?: boolean; label?: string }> = [];
		
		// Add issuer first (preferred audience)
		if (issuer) {
			examples.push({ 
				value: issuer, 
				isFromDiscovery: true,
				label: 'Issuer (from OIDC Discovery)'
			});
		}
		
		// Add token endpoint
		if (tokenEndpoint && tokenEndpoint !== issuer) {
			examples.push({ 
				value: tokenEndpoint, 
				isFromDiscovery: true,
				label: 'Token Endpoint (from OIDC Discovery)'
			});
		}
		
		// Add default examples
		defaultExamples.forEach(ex => {
			examples.push({ value: ex });
		});
		
		return examples;
	};

	const examples = buildExamples();

	// Handle drag start
	const handleDragStart = (e: React.DragEvent, exampleValue: string) => {
		e.dataTransfer.setData('text/plain', exampleValue);
		e.dataTransfer.effectAllowed = 'copy';
	};

	// Handle drop on input
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const droppedValue = e.dataTransfer.getData('text/plain');
		if (droppedValue && !disabled) {
			onChange(droppedValue);
		}
	};

	// Prevent default drag over to allow drop
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};

	return (
		<Container>
			<Label>
				<LabelIcon><FiTarget /></LabelIcon>
				Audience (API Target for Access Token)
			</Label>
			
			<InputWrapper>
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					placeholder="https://api.example.com"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					title="Drag and drop examples here, or type manually"
				/>
			</InputWrapper>
			
			<HelperText>
				Specify the intended <strong>audience</strong> (target API) for the access token.
				The access token will be scoped to this specific API/resource.
				{(tokenEndpoint || issuer) && (
					<div style={{ marginTop: '0.5rem', color: '#3b82f6', fontWeight: 500 }}>
						✓ OIDC Discovery endpoints available - drag them to the field above!
					</div>
				)}
			</HelperText>

			<ExamplesBox>
				<ExampleTitle>Common Examples (click or drag to use):</ExampleTitle>
				{examples.map((example, index) => (
					<ExampleItem
						key={`${example.value}-${index}`}
						type="button"
						onClick={() => onChange(example.value)}
						disabled={disabled}
						draggable={!disabled}
						onDragStart={(e) => handleDragStart(e, example.value)}
						$isFromDiscovery={example.isFromDiscovery}
						title={example.label || `Click or drag to use: ${example.value}`}
					>
						<ExampleText>{example.value}</ExampleText>
						{example.isFromDiscovery && (
							<DiscoveryBadge>OIDC</DiscoveryBadge>
						)}
						<DragIcon>
							<FiMove />
						</DragIcon>
					</ExampleItem>
				))}
			</ExamplesBox>

			<InfoBox>
				<InfoIcon><FiInfo /></InfoIcon>
				<div>
					<strong>Why Use Audience?</strong>
					<div style={{ marginTop: '0.5rem' }}>
						The <code>audience</code> parameter ensures your access token is issued for a 
						<strong> specific API</strong>. This is critical for security:
					</div>
					<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
						<li>Prevents token misuse on wrong API</li>
						<li>API can validate the <code>aud</code> claim in JWT</li>
						<li>Enables multi-API architecture with scoped tokens</li>
						<li>Required by many authorization servers for API access</li>
					</ul>
				</div>
			</InfoBox>

			{flowType === 'oauth' && !value && (
				<InfoBox $variant="warning">
					<InfoIcon $variant="warning"><FiAlertCircle /></InfoIcon>
					<div>
						<strong>OAuth Best Practice:</strong> For production OAuth applications accessing protected APIs,
						always specify an <code>audience</code> parameter. Without it, you may receive an opaque token
						instead of a JWT, or the token may not be accepted by your API.
					</div>
				</InfoBox>
			)}
		</Container>
	);
};

export default AudienceParameterInput;

