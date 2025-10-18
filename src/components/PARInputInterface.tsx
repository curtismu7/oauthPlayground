// src/components/PARInputInterface.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiInfo, FiShield, FiCode, FiKey, FiGlobe } from 'react-icons/fi';

interface PARInputInterfaceProps {
	onPARDataSubmit: (parData: PARInputData) => void;
	onCancel: () => void;
	isOpen: boolean;
}

interface PARInputData {
	requestUri: string;
	expiresIn?: number;
	clientId: string;
	environmentId: string;
}

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	padding: 1rem;
`;

const Modal = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
`;

const Header = styled.div`
	padding: 1.5rem 1.5rem 0;
	border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0 0 1.5rem 0;
	line-height: 1.5;
`;

const Content = styled.div`
	padding: 1.5rem;
`;

const InfoBox = styled.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #0ea5e9;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const InfoIcon = styled.div`
	color: #0ea5e9;
	margin-top: 0.125rem;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: #0c4a6e;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.8rem;
	color: #0c4a6e;
	margin: 0;
	line-height: 1.5;
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	min-height: 100px;
	resize: vertical;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Helper = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`;

const Actions = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	padding: 1.5rem;
	border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	
	${({ $variant }) => $variant === 'primary' ? `
		background: #3b82f6;
		color: white;
		border: 1px solid #3b82f6;
		
		&:hover {
			background: #2563eb;
			border-color: #2563eb;
		}
	` : `
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		
		&:hover {
			background: #f9fafb;
			border-color: #9ca3af;
		}
	`}
`;

const PARInputInterface: React.FC<PARInputInterfaceProps> = ({
	onPARDataSubmit,
	onCancel,
	isOpen
}) => {
	const [formData, setFormData] = useState<PARInputData>({
		requestUri: 'urn:ietf:params:oauth:request_uri:example-request-uri-12345',
		expiresIn: 60, // PingOne default lifetime
		clientId: 'your-client-id-here',
		environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9'
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.requestUri && formData.clientId && formData.environmentId) {
			onPARDataSubmit(formData);
		}
	};

	const handleInputChange = (field: keyof PARInputData, value: string | number) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	if (!isOpen) return null;

	return (
		<Overlay>
			<Modal>
				<Header>
					<Title>
						<FiShield />
						PAR Request URI Input
					</Title>
					<Subtitle>
						Enter the PAR request URI and related data to generate the authorization URL
					</Subtitle>
				</Header>

				<Content>
					<InfoBox>
						<InfoIcon>
							<FiInfo size={16} />
						</InfoIcon>
						<InfoContent>
							<InfoTitle>PingOne PAR (Pushed Authorization Request)</InfoTitle>
							<InfoText>
								PAR allows applications to send authorization requests directly to PingOne via back-channel, 
								safeguarding sensitive data from end-user devices. PingOne returns a request_uri that 
								references the payload, with a default lifetime of 60 seconds. The request_uri can only 
								be used once.
							</InfoText>
						</InfoContent>
					</InfoBox>

					<div style={{
						padding: '0.75rem',
						background: '#fef3c7',
						border: '1px solid #f59e0b',
						borderRadius: '6px',
						marginBottom: '1rem',
						fontSize: '0.875rem',
						color: '#92400e'
					}}>
						<strong>📝 Note:</strong> The form below is pre-filled with example values to help you understand the expected format. 
						Replace these with your actual PAR request URI, Client ID, and Environment ID from your PingOne configuration.
					</div>

					<Form onSubmit={handleSubmit}>
						<Field>
							<Label>
								<FiKey size={14} />
								Request URI *
							</Label>
							<Input
								type="text"
								value={formData.requestUri}
								onChange={(e) => handleInputChange('requestUri', e.target.value)}
								placeholder="urn:ietf:params:oauth:request_uri:pingone-abc123def456..."
								required
							/>
							<Helper>
								The request_uri returned from PingOne's PAR endpoint. This example shows the format PingOne typically returns. 
								Replace with your actual request_uri from the PAR API response. Default lifetime is 60 seconds and can only be used once.
							</Helper>
						</Field>

						<Field>
							<Label>
								<FiCode size={14} />
								Client ID *
							</Label>
							<Input
								type="text"
								value={formData.clientId}
								onChange={(e) => handleInputChange('clientId', e.target.value)}
								placeholder="a4f963ea-0736-456a-be72-b1fa4f63f81f"
								required
							/>
							<Helper>
								Your OAuth application's client ID. This example shows the typical UUID format used by PingOne applications.
							</Helper>
						</Field>

						<Field>
							<Label>
								<FiGlobe size={14} />
								Environment ID *
							</Label>
							<Input
								type="text"
								value={formData.environmentId}
								onChange={(e) => handleInputChange('environmentId', e.target.value)}
								placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
								required
							/>
							<Helper>
								Your PingOne environment ID. This example shows the typical UUID format used by PingOne environments.
							</Helper>
						</Field>

						<Field>
							<Label>
								<FiInfo size={14} />
								Expires In (seconds)
							</Label>
							<Input
								type="number"
								value={formData.expiresIn}
								onChange={(e) => handleInputChange('expiresIn', parseInt(e.target.value) || 60)}
								placeholder="60"
								min="1"
								max="600"
							/>
							<Helper>
								How long the request_uri is valid. PingOne default is 60 seconds (range: 1-600 seconds)
							</Helper>
						</Field>
					</Form>
				</Content>

				<Actions>
					<Button type="button" onClick={onCancel}>
						Cancel
					</Button>
					<Button 
						type="submit" 
						$variant="primary"
						onClick={handleSubmit}
						disabled={!formData.requestUri || !formData.clientId || !formData.environmentId}
					>
						<FiShield />
						Generate Authorization URL
					</Button>
				</Actions>
			</Modal>
		</Overlay>
	);
};

export default PARInputInterface;
