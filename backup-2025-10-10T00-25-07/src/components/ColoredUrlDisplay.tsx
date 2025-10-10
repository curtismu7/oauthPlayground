// src/components/ColoredUrlDisplay.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiInfo, FiExternalLink } from 'react-icons/fi';
import { CopyButtonVariants, CopyButtonService } from '../services/copyButtonService';

interface ColoredUrlDisplayProps {
	url: string;
	showCopyButton?: boolean;
	showInfoButton?: boolean;
	showOpenButton?: boolean;
	onOpen?: () => void;
	label?: string;
	height?: string;
}

const UrlContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
	max-width: 100%;
	width: 100%; /* Ensure full width usage */
	overflow: visible; /* Changed from hidden to visible to allow horizontal scrolling */
	box-sizing: border-box;
`;

const UrlLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const UrlContent = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem 5rem 1rem 1rem; /* Increased right padding to accommodate buttons */
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-word; /* Changed from break-all to break-word for better readability */
	white-space: pre-wrap;
	position: relative;
	min-height: ${({ height }) => height || '150px'};
	overflow-x: auto; /* Allow horizontal scrolling for long URLs */
	overflow-y: hidden;
	max-width: 100%;
	width: 100%; /* Ensure full width usage */
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
`;

const ColoredUrlText = styled.span<{ $color: string }>`
	color: ${({ $color }) => $color};
	font-weight: ${({ $color }) => $color === '#1f2937' ? '600' : '400'};
`;

const ActionButtons = styled.div`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	display: flex;
	gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border-radius: 4px;
	border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : '#d1d5db')};
	background: ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : 'white')};
	color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#374151')};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) => ($variant === 'primary' ? '#2563eb' : '#f9fafb')};
		border-color: ${({ $variant }) => ($variant === 'primary' ? '#2563eb' : '#9ca3af')};
	}

	&:active {
		transform: translateY(1px);
	}
`;

const InfoModal = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const InfoModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 600px;
	max-height: 80vh;
	overflow-y: auto;
	margin: 1rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const InfoModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`;

const InfoModalTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
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

const ParameterList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ParameterItem = styled.div`
	padding: 1rem;
	background: #f8fafc;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;
`;

const ParameterName = styled.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ParameterDescription = styled.div`
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const ParameterValue = styled.div`
	color: #059669;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	margin-top: 0.25rem;
	word-break: break-all;
`;

// Color scheme for URL parts
const URL_COLORS = [
	'#1f2937', // Base URL - dark gray
	'#dc2626', // ? - red
	'#059669', // response_type - green
	'#7c3aed', // client_id - purple
	'#ea580c', // redirect_uri - orange
	'#0891b2', // scope - cyan
	'#be123c', // state - pink
	'#ca8a04', // code_challenge - yellow
	'#7c2d12', // code_challenge_method - brown
	'#1e40af', // response_mode - blue
	'#be185d', // nonce - magenta
	'#0f766e', // prompt - teal
	'#92400e', // max_age - amber
	'#7c2d12', // acr_values - brown
	'#1e3a8a', // claims - indigo
	'#991b1b', // ui_locales - red
	'#0c4a6e', // id_token_hint - sky
	'#581c87', // login_hint - violet
	'#7c2d12', // hd - brown
	'#0f766e', // include_granted_scopes - teal
];

const parseUrlWithColors = (url: string) => {
	const parts = [];
	let currentPart = '';
	let colorIndex = 0;

	for (let i = 0; i < url.length; i++) {
		const char = url[i];
		
		if (char === '?' || char === '&') {
			if (currentPart) {
				parts.push({
					text: currentPart,
					color: URL_COLORS[colorIndex % URL_COLORS.length]
				});
				colorIndex++;
			}
			parts.push({
				text: char,
				color: URL_COLORS[colorIndex % URL_COLORS.length]
			});
			colorIndex++;
			currentPart = '';
		} else {
			currentPart += char;
		}
	}

	if (currentPart) {
		parts.push({
			text: currentPart,
			color: URL_COLORS[colorIndex % URL_COLORS.length]
		});
	}

	return parts;
};

const getUrlParameters = (url: string) => {
	const urlObj = new URL(url);
	const params = new URLSearchParams(urlObj.search);
	
	const parameterInfo = [
		{
			name: 'response_type',
			description: 'Specifies the OAuth response type. For hybrid flow, this can be "code id_token", "code token", or "code id_token token".',
			value: params.get('response_type') || 'Not specified'
		},
		{
			name: 'client_id',
			description: 'The unique identifier for your OAuth client application.',
			value: params.get('client_id') || 'Not specified'
		},
		{
			name: 'redirect_uri',
			description: 'The URI where the user will be redirected after authorization. Must match the registered redirect URI.',
			value: params.get('redirect_uri') || 'Not specified'
		},
		{
			name: 'scope',
			description: 'The permissions your application is requesting from the user.',
			value: params.get('scope') || 'Not specified'
		},
		{
			name: 'state',
			description: 'A random string used to prevent CSRF attacks. Should be validated when the user returns.',
			value: params.get('state') || 'Not specified'
		},
		{
			name: 'response_mode',
			description: 'How the authorization response should be returned. Options: query, fragment, form_post, or pi.flow.',
			value: params.get('response_mode') || 'Not specified'
		},
		{
			name: 'code_challenge',
			description: 'PKCE code challenge for additional security. Generated from code_verifier.',
			value: params.get('code_challenge') || 'Not specified'
		},
		{
			name: 'code_challenge_method',
			description: 'The method used to generate the code_challenge. Usually "S256".',
			value: params.get('code_challenge_method') || 'Not specified'
		},
		{
			name: 'nonce',
			description: 'A random string used to prevent replay attacks for ID tokens.',
			value: params.get('nonce') || 'Not specified'
		}
	];

	return parameterInfo.filter(param => param.value !== 'Not specified');
};

export const ColoredUrlDisplay: React.FC<ColoredUrlDisplayProps> = ({
	url,
	showCopyButton = true,
	showInfoButton = true,
	showOpenButton = false,
	onOpen,
	label = 'Generated Authorization URL',
	height
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const coloredParts = parseUrlWithColors(url);
	const parameters = getUrlParameters(url);

	const handleOpen = () => {
		window.open(url, '_blank');
		onOpen?.();
	};

	return (
		<UrlContainer>
			<UrlLabel>
				{label}
				{showInfoButton && (
					<ActionButton onClick={() => setShowInfo(true)} $variant="secondary">
						<FiInfo size={14} />
						Explain URL
					</ActionButton>
				)}
			</UrlLabel>
			
			<UrlContent height={height}>
				<ActionButtons>
					{showCopyButton && (
						<CopyButtonService
							text={url}
							label="Authorization URL"
							size="sm"
							variant="primary"
							showLabel={false}
						/>
					)}
					{showOpenButton && (
						<ActionButton onClick={handleOpen} $variant="secondary">
							<FiExternalLink size={14} />
							Open
						</ActionButton>
					)}
				</ActionButtons>
				
				{coloredParts.map((part, index) => (
					<ColoredUrlText key={index} $color={part.color}>
						{part.text}
					</ColoredUrlText>
				))}
			</UrlContent>

			<InfoModal $isOpen={showInfo}>
				<InfoModalContent>
					<InfoModalHeader>
						<InfoModalTitle>Authorization URL Parameters</InfoModalTitle>
						<CloseButton onClick={() => setShowInfo(false)}>×</CloseButton>
					</InfoModalHeader>
					
					<ParameterList>
						{parameters.map((param, index) => (
							<ParameterItem key={index}>
								<ParameterName>{param.name}</ParameterName>
								<ParameterDescription>{param.description}</ParameterDescription>
								<ParameterValue>{param.value}</ParameterValue>
							</ParameterItem>
						))}
					</ParameterList>
				</InfoModalContent>
			</InfoModal>
		</UrlContainer>
	);
};

export default ColoredUrlDisplay;
