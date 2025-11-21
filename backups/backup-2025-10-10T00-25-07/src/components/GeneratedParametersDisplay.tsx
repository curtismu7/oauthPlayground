// src/components/GeneratedParametersDisplay.tsx
import React, { useState } from 'react';
import { FiCopy, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

interface Parameter {
	label: string;
	value: string;
	description?: string;
	sensitive?: boolean;
}

interface GeneratedParametersDisplayProps {
	title: string;
	parameters: Parameter[];
	onCopy?: (value: string, label: string) => void;
	showInfoButton?: boolean;
	showCopyButtons?: boolean;
	className?: string;
}

const Container = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	margin: 1rem 0;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.5rem 0.75rem;
	border: 1px solid ${(props) => (props.$variant === 'primary' ? '#3b82f6' : '#d1d5db')};
	border-radius: 6px;
	background: ${(props) => (props.$variant === 'primary' ? '#3b82f6' : 'white')};
	color: ${(props) => (props.$variant === 'primary' ? 'white' : '#374151')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${(props) => (props.$variant === 'primary' ? '#2563eb' : '#f9fafb')};
		border-color: ${(props) => (props.$variant === 'primary' ? '#2563eb' : '#9ca3af')};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ParameterList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ParameterItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const ParameterLabel = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const Label = styled.span`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`;

const ParameterActions = styled.div`
	display: flex;
	gap: 0.25rem;
`;

const ValueContainer = styled.div<{ $isVisible?: boolean }>`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 0.75rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-all;
	white-space: pre-wrap;
	color: ${(props) => (props.$isVisible ? '#1f2937' : '#6b7280')};
	position: relative;
	min-height: 2.5rem;
	display: flex;
	align-items: center;
`;

const InfoModal = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const InfoContent = styled.div`
	background: white;
	border-radius: 8px;
	padding: 1.5rem;
	max-width: 500px;
	max-height: 80vh;
	overflow-y: auto;
	margin: 1rem;
`;

const InfoHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const InfoTitle = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem;

	&:hover {
		color: #374151;
	}
`;

const InfoBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const InfoSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const InfoSectionTitle = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
`;

const InfoText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.5;
`;

const InfoList = styled.ul`
	margin: 0;
	padding-left: 1rem;
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.5;
`;

export const GeneratedParametersDisplay: React.FC<GeneratedParametersDisplayProps> = ({
	title,
	parameters,
	onCopy,
	showInfoButton = true,
	showCopyButtons = true,
	className,
}) => {
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [visibleParameters, setVisibleParameters] = useState<Set<string>>(new Set());

	const handleCopy = (value: string, label: string) => {
		navigator.clipboard.writeText(value);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
		onCopy?.(value, label);
	};

	const toggleVisibility = (parameterLabel: string) => {
		setVisibleParameters((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(parameterLabel)) {
				newSet.delete(parameterLabel);
			} else {
				newSet.add(parameterLabel);
			}
			return newSet;
		});
	};

	const getParameterInfo = () => {
		const info: Record<string, any> = {
			'Code Verifier': {
				description:
					'A cryptographically random string used to prove possession of the authorization request.',
				details: [
					'Generated client-side using a secure random number generator',
					'Must be at least 43 characters and no more than 128 characters',
					'Contains only unreserved characters: A-Z, a-z, 0-9, -, ., _, ~',
					'Stored securely and used later to exchange the authorization code for tokens',
				],
			},
			'Code Challenge': {
				description: 'A SHA256 hash of the Code Verifier, used in the authorization request.',
				details: [
					'Generated by hashing the Code Verifier using SHA256',
					'Base64URL encoded for URL safety',
					'Sent in the authorization request instead of the raw Code Verifier',
					'Provides security without exposing the sensitive Code Verifier',
				],
			},
			Method: {
				description: 'The hashing method used to generate the Code Challenge.',
				details: [
					'S256 is the recommended method (SHA256)',
					'Provides strong cryptographic security',
					'Required by many OAuth providers for enhanced security',
				],
			},
		};

		return parameters.map((param) => ({
			...param,
			info: info[param.label] || {
				description: param.description || 'Generated parameter for OAuth flow.',
				details: ['This is a generated parameter used in the OAuth authorization flow.'],
			},
		}));
	};

	return (
		<Container className={className}>
			<Header>
				<Title>{title}</Title>
				<ActionButtons>
					{showInfoButton && (
						<ActionButton onClick={() => setIsInfoOpen(true)}>
							<FiInfo size={16} />
							Info
						</ActionButton>
					)}
				</ActionButtons>
			</Header>

			<ParameterList>
				{parameters.map((param, index) => {
					const isVisible = visibleParameters.has(param.label);
					const shouldShowValue = !param.sensitive || isVisible;

					return (
						<ParameterItem key={index}>
							<ParameterLabel>
								<Label>{param.label}:</Label>
								<ParameterActions>
									{param.sensitive && (
										<ActionButton
											onClick={() => toggleVisibility(param.label)}
											title={isVisible ? 'Hide value' : 'Show value'}
										>
											{isVisible ? <FiEyeOff size={14} /> : <FiEye size={14} />}
											{isVisible ? 'Hide' : 'Show'}
										</ActionButton>
									)}
									{showCopyButtons && (
										<ActionButton
											onClick={() => handleCopy(param.value, param.label)}
											title={`Copy ${param.label}`}
										>
											<FiCopy size={14} />
											Copy
										</ActionButton>
									)}
								</ParameterActions>
							</ParameterLabel>
							<ValueContainer $isVisible={shouldShowValue}>
								{shouldShowValue ? param.value : '••••••••••••••••••••••••••••••••••••••••'}
							</ValueContainer>
						</ParameterItem>
					);
				})}
			</ParameterList>

			<InfoModal $isOpen={isInfoOpen}>
				<InfoContent>
					<InfoHeader>
						<InfoTitle>{title} - Parameter Information</InfoTitle>
						<CloseButton onClick={() => setIsInfoOpen(false)}>×</CloseButton>
					</InfoHeader>
					<InfoBody>
						{getParameterInfo().map((param, index) => (
							<InfoSection key={index}>
								<InfoSectionTitle>{param.label}</InfoSectionTitle>
								<InfoText>{param.info.description}</InfoText>
								<InfoList>
									{param.info.details.map((detail: string, detailIndex: number) => (
										<li key={detailIndex}>{detail}</li>
									))}
								</InfoList>
							</InfoSection>
						))}
					</InfoBody>
				</InfoContent>
			</InfoModal>
		</Container>
	);
};

export default GeneratedParametersDisplay;
