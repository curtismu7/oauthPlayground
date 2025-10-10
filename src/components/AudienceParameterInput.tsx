// src/components/AudienceParameterInput.tsx
// OAuth/OIDC Audience Parameter Input - API targeting for access tokens
import React from 'react';
import styled from 'styled-components';
import { FiTarget, FiInfo, FiAlertCircle } from 'react-icons/fi';

interface AudienceParameterInputProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	flowType?: 'oauth' | 'oidc';
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

const ExampleItem = styled.button`
	display: block;
	width: 100%;
	text-align: left;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: #10b981;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f0fdf4;
		border-color: #10b981;
	}

	&:last-child {
		margin-bottom: 0;
	}
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

const examples = [
	'https://api.example.com',
	'https://api.myservice.com/v1',
	'urn:my-resource-server',
	'https://graph.microsoft.com',
];

export const AudienceParameterInput: React.FC<AudienceParameterInputProps> = ({
	value,
	onChange,
	disabled = false,
	flowType = 'oauth'
}) => {
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
				/>
			</InputWrapper>
			
			<HelperText>
				Specify the intended <strong>audience</strong> (target API) for the access token.
				The access token will be scoped to this specific API/resource.
			</HelperText>

			<ExamplesBox>
				<ExampleTitle>Common Examples (click to use):</ExampleTitle>
				{examples.map((example) => (
					<ExampleItem
						key={example}
						type="button"
						onClick={() => onChange(example)}
						disabled={disabled}
					>
						{example}
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

