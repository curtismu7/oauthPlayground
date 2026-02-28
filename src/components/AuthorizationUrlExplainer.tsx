// src/components/AuthorizationUrlExplainer.tsx - Interactive popup explaining authorization URL parameters

import React from 'react';
import {
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiLock,
	FiShield,
	FiUser,
	FiX,
} from '@icons';
import styled from 'styled-components';

interface AuthorizationUrlExplainerProps {
	authUrl: string;
	isOpen: boolean;
	onClose: () => void;
}

interface UrlParameter {
	name: string;
	value: string;
	description: string;
	purpose: string;
	icon: React.ReactNode;
	category: 'authentication' | 'security' | 'flow' | 'authorization';
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
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
  color: white;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const UrlDisplay = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-all;
  color: #334155;
  position: relative;
`;

const ParameterGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const ParameterCard = styled.div<{ $category: string }>`
  background: white;
  border: 2px solid ${({ $category }) => {
		switch ($category) {
			case 'authentication':
				return '#3b82f6';
			case 'security':
				return '#10b981';
			case 'flow':
				return '#f59e0b';
			case 'authorization':
				return '#22c55e';
			default:
				return '#e5e7eb';
		}
	}};
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ParameterHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const ParameterIcon = styled.div<{ $category: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $category }) => {
		switch ($category) {
			case 'authentication':
				return '#dbeafe';
			case 'security':
				return '#dcfce7';
			case 'flow':
				return '#fef3c7';
			case 'authorization':
				return '#ede9fe';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${({ $category }) => {
		switch ($category) {
			case 'authentication':
				return '#3b82f6';
			case 'security':
				return '#10b981';
			case 'flow':
				return '#f59e0b';
			case 'authorization':
				return '#22c55e';
			default:
				return '#6b7280';
		}
	}};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

const ParameterName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`;

const ParameterValue = styled.div`
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 0.75rem;
  word-break: break-all;
`;

const ParameterDescription = styled.p`
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ParameterPurpose = styled.div`
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #92400e;
  font-weight: 500;
`;

const CopyUrlButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const copyToClipboard = async (text: string, label: string) => {
	try {
		await navigator.clipboard.writeText(text);
		// You could add a toast notification here
		console.log(`${label} copied to clipboard`);
	} catch (err) {
		console.error('Failed to copy to clipboard:', err);
	}
};

const parseAuthorizationUrl = (url: string): UrlParameter[] => {
	try {
		const urlObj = new URL(url);
		const params = new URLSearchParams(urlObj.search);

		const parameters: UrlParameter[] = [];

		// Base URL
		parameters.push({
			name: 'Authorization Endpoint',
			value: urlObj.origin + urlObj.pathname,
			description:
				'The PingOne authorization server endpoint where the authorization request is sent.',
			purpose:
				'This is the OAuth 2.0 authorization endpoint provided by PingOne for your environment.',
			icon: <FiGlobe />,
			category: 'authentication',
		});

		// Parse each query parameter
		for (const [key, value] of params.entries()) {
			switch (key) {
				case 'client_id':
					parameters.push({
						name: 'Client ID',
						value: value,
						description: 'Unique identifier for your OAuth application registered in PingOne.',
						purpose:
							'The authorization server uses this to identify which application is requesting access.',
						icon: <FiKey />,
						category: 'authentication',
					});
					break;

				case 'response_type':
					parameters.push({
						name: 'Response Type',
						value: value,
						description: 'Specifies the OAuth 2.0 grant type being used.',
						purpose:
							'Indicates that this is an Authorization Code Flow, which is the most secure flow for web applications.',
						icon: <FiShield />,
						category: 'flow',
					});
					break;

				case 'redirect_uri':
					parameters.push({
						name: 'Redirect URI',
						value: decodeURIComponent(value),
						description: 'The URL where the user will be redirected after authorization.',
						purpose:
							'This must exactly match the redirect URI configured in your PingOne application settings.',
						icon: <FiExternalLink />,
						category: 'flow',
					});
					break;

				case 'scope':
					parameters.push({
						name: 'Scope',
						value: decodeURIComponent(value).replace(/\+/g, ' '),
						description: 'The permissions your application is requesting from the user.',
						purpose: 'Defines what resources your application can access on behalf of the user.',
						icon: <FiUser />,
						category: 'authorization',
					});
					break;

				case 'state':
					parameters.push({
						name: 'State Parameter',
						value: value,
						description: 'A random string used to prevent CSRF attacks.',
						purpose:
							'The authorization server will return this exact value, allowing you to verify the request authenticity.',
						icon: <FiLock />,
						category: 'security',
					});
					break;

				case 'code_challenge':
					parameters.push({
						name: 'PKCE Code Challenge',
						value: value,
						description:
							'A cryptographic challenge derived from a code verifier for PKCE security.',
						purpose:
							'Prevents authorization code interception attacks, especially important for public clients.',
						icon: <FiShield />,
						category: 'security',
					});
					break;

				case 'code_challenge_method':
					parameters.push({
						name: 'PKCE Challenge Method',
						value: value,
						description: 'The method used to generate the code challenge from the code verifier.',
						purpose:
							'S256 uses SHA256 hashing, which is the recommended and most secure method for PKCE.',
						icon: <FiShield />,
						category: 'security',
					});
					break;

				case 'nonce':
					parameters.push({
						name: 'Nonce',
						value: value,
						description: 'A random string used to prevent replay attacks in OpenID Connect.',
						purpose:
							'Ensures that ID tokens are fresh and not reused, providing additional security for authentication.',
						icon: <FiLock />,
						category: 'security',
					});
					break;

				case 'request_uri':
					parameters.push({
						name: 'Request URI (PAR)',
						value: value,
						description:
							'Pushed Authorization Request URI containing the authorization parameters.',
						purpose:
							'This URI references authorization parameters that were securely pushed to the authorization server via PAR, enhancing security by keeping sensitive parameters off the browser URL.',
						icon: <FiShield />,
						category: 'security',
					});
					break;

				default:
					parameters.push({
						name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
						value: decodeURIComponent(value),
						description: `Custom parameter: ${key}`,
						purpose: 'Additional parameter included in the authorization request.',
						icon: <FiInfo />,
						category: 'authorization',
					});
			}
		}

		return parameters;
	} catch (error) {
		console.error('Error parsing authorization URL:', error);
		return [];
	}
};

export const AuthorizationUrlExplainer: React.FC<AuthorizationUrlExplainerProps> = ({
	authUrl,
	isOpen,
	onClose,
}) => {
	if (!isOpen || !authUrl) return null;

	const parameters = parseAuthorizationUrl(authUrl);

	return (
		<Overlay onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						<FiInfo />
						Authorization URL Breakdown
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<div style={{ marginBottom: '1.5rem' }}>
						<h3 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '1.1rem' }}>
							Complete Authorization URL:
						</h3>
						<UrlDisplay>
							<CopyUrlButton onClick={() => copyToClipboard(authUrl, 'Authorization URL')}>
								<FiCopy /> Copy URL
							</CopyUrlButton>
							{authUrl}
						</UrlDisplay>
					</div>

					<div style={{ marginBottom: '1.5rem' }}>
						<h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem' }}>
							Parameter Breakdown:
						</h3>
						<ParameterGrid>
							{parameters.map((param, index) => (
								<ParameterCard key={index} $category={param.category}>
									<ParameterHeader>
										<ParameterIcon $category={param.category}>{param.icon}</ParameterIcon>
										<ParameterName>{param.name}</ParameterName>
									</ParameterHeader>

									<ParameterValue>{param.value}</ParameterValue>

									<ParameterDescription>{param.description}</ParameterDescription>

									<ParameterPurpose>
										<strong>Purpose:</strong> {param.purpose}
									</ParameterPurpose>
								</ParameterCard>
							))}
						</ParameterGrid>
					</div>

					<div
						style={{
							background: '#f0f9ff',
							border: '1px solid #0ea5e9',
							borderRadius: '8px',
							padding: '1rem',
							fontSize: '0.9rem',
							color: '#0c4a6e',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>Educational Note:</h4>
						<p style={{ margin: 0, lineHeight: 1.5 }}>
							This authorization URL contains all the necessary parameters for a secure OAuth 2.0
							Authorization Code Flow with PKCE. Each parameter serves a specific security or
							functional purpose in the authentication process.
						</p>
					</div>
				</ModalBody>
			</Modal>
		</Overlay>
	);
};

export default AuthorizationUrlExplainer;
