// src/components/ResourceParameterInput.tsx
// OAuth/OIDC Resource Parameter Input - RFC 8707 Resource Indicators
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiServer, FiInfo, FiPlus, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

interface ResourceParameterInputProps {
	value: string[];
	onChange: (resources: string[]) => void;
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
	color: #7c3aed;
	font-size: 1rem;
`;

const ResourceList = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const ResourceItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
	padding: 0.75rem;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	transition: all 0.2s;

	&:hover {
		border-color: #7c3aed;
		box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.1);
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

const ResourceInput = styled.input`
	flex: 1;
	padding: 0.5rem 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
	}

	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
`;

const RemoveButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	color: #ef4444;
	background: transparent;
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const AddButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #7c3aed;
	background: #ffffff;
	border: 2px dashed #c4b5fd;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #faf5ff;
		border-color: #7c3aed;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ExamplesBox = styled.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: #faf5ff;
	border: 1px solid #c4b5fd;
	border-radius: 0.5rem;
`;

const ExampleTitle = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b21a8;
	margin-bottom: 0.5rem;
`;

const ExampleItem = styled.button`
	display: block;
	width: 100%;
	text-align: left;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background: #ffffff;
	border: 1px solid #c4b5fd;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: #7c3aed;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #faf5ff;
		border-color: #7c3aed;
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' }>`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${props => props.$variant === 'warning' ? '#fef3c7' : '#eff6ff'};
	border: 1px solid ${props => props.$variant === 'warning' ? '#fbbf24' : '#bfdbfe'};
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${props => props.$variant === 'warning' ? '#78350f' : '#1e40af'};
	line-height: 1.5;
`;

const InfoIcon = styled.div<{ $variant?: 'info' | 'warning' }>`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${props => props.$variant === 'warning' ? '#f59e0b' : '#3b82f6'};
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 2rem 1rem;
	color: #6b7280;
	font-style: italic;
`;

const examples = [
	'https://api.example.com',
	'https://graph.microsoft.com',
	'https://www.googleapis.com/auth/drive',
	'urn:example:resource',
	'myapp://api',
];

export const ResourceParameterInput: React.FC<ResourceParameterInputProps> = ({
	value,
	onChange,
	disabled = false,
	flowType = 'oauth'
}) => {
	const [newResource, setNewResource] = useState('');

	const addResource = () => {
		if (newResource.trim() && !value.includes(newResource.trim())) {
			onChange([...value, newResource.trim()]);
			setNewResource('');
		}
	};

	const removeResource = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const handleExampleClick = (example: string) => {
		if (!value.includes(example)) {
			onChange([...value, example]);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addResource();
		}
	};

	return (
		<Container>
			<Label>
				<LabelIcon><FiServer /></LabelIcon>
				Resource Indicators (RFC 8707)
			</Label>
			
			<ResourceList>
				{value.length === 0 ? (
					<EmptyState>
						No resources specified. Click "Add Resource" or select an example below.
					</EmptyState>
				) : (
					value.map((resource, index) => (
						<ResourceItem key={`${resource}-${index}`}>
							<ResourceInput
								type="text"
								value={resource}
								readOnly
								disabled={disabled}
							/>
							<RemoveButton
								type="button"
								onClick={() => removeResource(index)}
								disabled={disabled}
								title="Remove resource"
							>
								<FiTrash2 size={16} />
							</RemoveButton>
						</ResourceItem>
					))
				)}
				
				<AddButton
					type="button"
					onClick={addResource}
					disabled={disabled || !newResource.trim() || value.includes(newResource.trim())}
				>
					<FiPlus size={16} />
					Add Resource
				</AddButton>
				
				<input
					type="text"
					value={newResource}
					onChange={(e) => setNewResource(e.target.value)}
					onKeyPress={handleKeyPress}
					placeholder="Enter resource URI (e.g., https://api.example.com)"
					disabled={disabled}
					style={{
						width: '100%',
						marginTop: '0.75rem',
						padding: '0.75rem',
						border: '1px solid #e5e7eb',
						borderRadius: '0.5rem',
						fontSize: '0.875rem',
						fontFamily: 'Monaco, Menlo, monospace'
					}}
				/>
			</ResourceList>

			<ExamplesBox>
				<ExampleTitle>Common Examples (click to add):</ExampleTitle>
				{examples.map((example) => (
					<ExampleItem
						key={example}
						type="button"
						onClick={() => handleExampleClick(example)}
						disabled={disabled || value.includes(example)}
					>
						{example}
					</ExampleItem>
				))}
			</ExamplesBox>

			<InfoBox>
				<InfoIcon><FiInfo /></InfoIcon>
				<div>
					<strong>About Resource Indicators (RFC 8707):</strong>
					<div style={{ marginTop: '0.5rem' }}>
						The <code>resource</code> parameter specifies the target resource server(s) 
						for the access token. This allows:
					</div>
					<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
						<li>Multiple APIs with a single token request</li>
						<li>Resource-specific token scoping</li>
						<li>API gateway and microservice architectures</li>
						<li>Cross-service authorization</li>
					</ul>
					<div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontStyle: 'italic' }}>
						💡 <strong>Multiple Resources:</strong> You can specify multiple resources 
						by adding them one at a time. The authorization server will issue tokens 
						scoped to all specified resources.
					</div>
				</div>
			</InfoBox>

			{flowType === 'oauth' && value.length > 0 && (
				<InfoBox $variant="warning">
					<InfoIcon $variant="warning"><FiAlertTriangle /></InfoIcon>
					<div>
						<strong>OAuth Resource Indicators:</strong> When using resource indicators, 
						ensure your OAuth client is configured to support multiple resources in your 
						authorization server. Some providers require special configuration for 
						multi-resource tokens.
					</div>
				</InfoBox>
			)}
		</Container>
	);
};

export default ResourceParameterInput;
