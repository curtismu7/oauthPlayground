// src/components/ResourceParameterInput.tsx
// OAuth/OIDC Resource Parameter Input - RFC 8707 Resource Indicators
import React, { useState } from 'react';
import {
	FiInfo,
	FiMove,
	FiPlus,
	FiServer,
	FiTrash,
	FiTrash2
} from 'react-icons/fi';
import styled from 'styled-components';

interface ResourceParameterInputProps {
	value: string[];
	onChange: (resources: string[]) => void;
	disabled?: boolean;
	flowType?: 'oauth' | 'oidc';
	issuer?: string | undefined; // From OIDC discovery
	environmentId?: string | undefined; // PingOne environment ID
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
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.875rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);

	&:hover:not(:disabled) {
		background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
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

const ExampleItem = styled.button<{ $isFromDiscovery?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	text-align: left;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background: ${(props) => (props.$isFromDiscovery ? '#eff6ff' : '#ffffff')};
	border: 1px solid ${(props) => (props.$isFromDiscovery ? '#60a5fa' : '#c4b5fd')};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: ${(props) => (props.$isFromDiscovery ? '#1e40af' : '#7c3aed')};
	cursor: grab;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$isFromDiscovery ? '#dbeafe' : '#faf5ff')};
		border-color: ${(props) => (props.$isFromDiscovery ? '#3b82f6' : '#7c3aed')};
		transform: translateX(2px);
	}

	&:active {
		cursor: grabbing;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
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
	background: ${(props) => (props.$variant === 'warning' ? '#fef3c7' : '#eff6ff')};
	border: 1px solid ${(props) => (props.$variant === 'warning' ? '#fbbf24' : '#bfdbfe')};
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${(props) => (props.$variant === 'warning' ? '#78350f' : '#1e40af')};
	line-height: 1.5;
`;

const InfoIcon = styled.div<{ $variant?: 'info' | 'warning' }>`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${(props) => (props.$variant === 'warning' ? '#f59e0b' : '#3b82f6')};
`;

const _EmptyState = styled.div`
	text-align: center;
	padding: 2rem 1rem;
	color: #6b7280;
	font-style: italic;
`;

const EducationalHeader = styled.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 2px solid #bae6fd;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const EducationalTitle = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #0c4a6e;
	
	svg {
		color: #0284c7;
		font-size: 1.5rem;
	}
`;

const EducationalContent = styled.div`
	font-size: 0.9375rem;
	color: #0c4a6e;
	line-height: 1.7;
	
	p {
		margin: 0 0 1rem 0;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
	
	strong {
		color: #075985;
		font-weight: 600;
	}
	
	code {
		background: #dbeafe;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.875rem;
		color: #1e40af;
	}
`;

const UseCaseList = styled.ul`
	margin: 1rem 0 0 0;
	padding-left: 1.5rem;
	
	li {
		margin-bottom: 0.5rem;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const ExampleScenario = styled.div`
	background: #fff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	
	strong {
		display: block;
		color: #0369a1;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}
	
	div {
		font-size: 0.8125rem;
		color: #334155;
		line-height: 1.6;
	}
`;

const defaultExamples = [
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
	flowType = 'oauth',
	issuer,
	environmentId,
}) => {
	const [newResource, setNewResource] = useState('');

	// Build examples list with OIDC/PingOne discovered endpoints at the top
	const buildExamples = () => {
		const examples: Array<{ value: string; isFromDiscovery?: boolean; label?: string }> = [];

		// Add issuer (PingOne base URL)
		if (issuer) {
			examples.push({
				value: issuer,
				isFromDiscovery: true,
				label: 'Issuer/Base URL (from OIDC Discovery)',
			});
		}

		// If we have environmentId but no issuer, construct PingOne base URL
		if (environmentId && !issuer) {
			const pingOneBaseUrl = `https://auth.pingone.com/${environmentId}`;
			examples.push({
				value: pingOneBaseUrl,
				isFromDiscovery: true,
				label: 'PingOne Base URL',
			});
		}

		// Add default examples
		defaultExamples.forEach((ex) => {
			examples.push({ value: ex });
		});

		return examples;
	};

	const examples = buildExamples();

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

	// Handle drag start
	const handleDragStart = (e: React.DragEvent, exampleValue: string) => {
		e.dataTransfer.setData('text/plain', exampleValue);
		e.dataTransfer.effectAllowed = 'copy';
	};

	// Handle drop on input
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const droppedValue = e.dataTransfer.getData('text/plain');
		if (droppedValue && !disabled && !value.includes(droppedValue)) {
			setNewResource(droppedValue);
		}
	};

	// Prevent default drag over to allow drop
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};

	return (
		<Container>
			<EducationalHeader>
				<EducationalTitle>
					<FiServer />
					Resources
				</EducationalTitle>
				<EducationalContent>
					<p>
						<strong>What are Resources?</strong> In OAuth 2.0 and OIDC, a <code>resource</code> is a
						protected API or service that you want to access with your access token. Think of it as
						telling the authorization server:
						<em>
							"I need a token that will work with <strong>these specific APIs</strong>."
						</em>
					</p>

					<p>
						<strong>Why specify resources?</strong> When you request a token, you can tell the
						authorization server exactly which APIs you plan to call. This makes your tokens more
						secure because they're scoped to only work with the APIs you actually need.
					</p>

					<ExampleScenario>
						<strong>Real-World Example:</strong>
						<div>
							You're building a mobile app that needs to access both a <code>billing API</code> and
							an <code>analytics API</code>. By specifying both as resources, you get a single token
							that works with both APIs. Without the resource parameter, the authorization server
							might issue a generic token, or the APIs might reject your token.
						</div>
					</ExampleScenario>

					<p>
						<strong>When to use Resources (RFC 8707):</strong>
					</p>
					<UseCaseList>
						<li>
							<strong>Multiple APIs:</strong> Your app needs to call several different APIs with one
							token
						</li>
						<li>
							<strong>Microservices:</strong> Each service validates tokens and checks the audience
							claim
						</li>
						<li>
							<strong>API Gateway:</strong> You have an API gateway routing to multiple backend
							services
						</li>
						<li>
							<strong>Security:</strong> You want to limit token scope to only the APIs you actually
							use
						</li>
						<li>
							<strong>PingOne:</strong> Specify the PingOne issuer URL to scope tokens to your
							environment
						</li>
					</UseCaseList>

					<p
						style={{
							marginTop: '1rem',
							fontSize: '0.875rem',
							fontStyle: 'italic',
							color: '#0369a1',
						}}
					>
						💡 <strong>Tip:</strong> If you're unsure, use the PingOne base URL (shown in blue
						below) as your resource. This tells the authorization server to issue a token for your
						specific PingOne environment.
					</p>
				</EducationalContent>
			</EducationalHeader>

			<Label>
				<LabelIcon>
					<FiServer />
				</LabelIcon>
				Add Resources (Optional)
			</Label>

			<ResourceList>
				{value.length > 0 &&
					value.map((resource, index) => (
						<ResourceItem key={`${resource}-${index}`}>
							<ResourceInput type="text" value={resource} readOnly disabled={disabled} />
							<RemoveButton
								type="button"
								onClick={() => removeResource(index)}
								disabled={disabled}
								title="Remove resource"
							>
								<FiTrash2 size={16} />
							</RemoveButton>
						</ResourceItem>
					))}

				<InfoBox style={{ fontSize: '0.8125rem', marginTop: value.length > 0 ? '0.75rem' : '0' }}>
					<FiInfo size={16} />
					<div>
						<strong>Type or drag:</strong> Enter a resource URI below, or drag an example from the
						list. Press Enter or click "Add Resource" to add it to the list.
					</div>
				</InfoBox>

				<input
					type="text"
					value={newResource}
					onChange={(e) => setNewResource(e.target.value)}
					onKeyPress={handleKeyPress}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					placeholder="Type resource URI here or drag from examples below"
					disabled={disabled}
					title="Drag and drop examples here, or type manually"
					style={{
						width: '100%',
						marginTop: '0.75rem',
						padding: '0.875rem 1rem',
						border: '2px solid #bae6fd',
						borderRadius: '0.5rem',
						fontSize: '0.875rem',
						fontFamily: 'Monaco, Menlo, monospace',
						backgroundColor: '#ffffff',
						transition: 'all 0.2s',
					}}
					onFocus={(e) => {
						e.target.style.borderColor = '#0284c7';
						e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.1)';
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#bae6fd';
						e.target.style.boxShadow = 'none';
					}}
				/>

				<AddButton
					type="button"
					onClick={addResource}
					disabled={disabled || !newResource.trim() || value.includes(newResource.trim())}
					style={{ marginTop: '0.75rem' }}
				>
					<FiPlus size={16} />
					Add Resource
				</AddButton>
			</ResourceList>

			<ExamplesBox>
				<ExampleTitle>
					Common Examples (click or drag to add):
					{(issuer || environmentId) && (
						<span style={{ color: '#3b82f6', fontWeight: 400, marginLeft: '0.5rem' }}>
							✓ OIDC Discovery endpoints available
						</span>
					)}
				</ExampleTitle>
				{examples.map((example, index) => (
					<ExampleItem
						key={`${example.value}-${index}`}
						type="button"
						onClick={() => handleExampleClick(example.value)}
						disabled={disabled || value.includes(example.value)}
						draggable={!disabled && !value.includes(example.value)}
						onDragStart={(e) => handleDragStart(e, example.value)}
						$isFromDiscovery={example.isFromDiscovery}
						title={example.label || `Click or drag to add: ${example.value}`}
					>
						<ExampleText>{example.value}</ExampleText>
						{example.isFromDiscovery && <DiscoveryBadge>OIDC</DiscoveryBadge>}
						<DragIcon>
							<FiMove />
						</DragIcon>
					</ExampleItem>
				))}
			</ExamplesBox>

			{value.length > 0 && (
				<InfoBox>
					<InfoIcon>
						<FiInfo />
					</InfoIcon>
					<div>
						<strong>
							You've added {value.length} resource{value.length > 1 ? 's' : ''}!
						</strong>
						<div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
							Your access token will be scoped to work with{' '}
							{value.length > 1 ? 'these APIs' : 'this API'}. The authorization server will include{' '}
							{value.length > 1 ? 'these URLs' : 'this URL'} in the token's audience (
							<code>aud</code>) claim, and the {value.length > 1 ? 'APIs' : 'API'} will validate
							this before accepting your token.
						</div>
					</div>
				</InfoBox>
			)}

			{value.length === 0 && (issuer || environmentId) && (
				<InfoBox>
					<InfoIcon>
						<FiInfo />
					</InfoIcon>
					<div>
						<strong>Optional but Recommended:</strong> Resources are optional, but specifying them
						makes your tokens more secure. Try adding the blue PingOne base URL above to scope your
						token to your environment!
					</div>
				</InfoBox>
			)}
		</Container>
	);
};

export default ResourceParameterInput;
