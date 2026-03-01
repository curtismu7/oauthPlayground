/**
 * @file TokenEndpointAuthModal.tsx
 * @module v8/components
 * @description Educational modal explaining PingOne Token Endpoint Authentication Methods
 * @version 8.0.0
 * @since 2024-11-20
 */

import { FiCheckCircle, FiInfo, FiKey, FiLock, FiShield, FiX, FiXCircle } from '@icons';
import React from 'react';
import styled from 'styled-components';

const MODULE_TAG = '[🔐 TOKEN-AUTH-MODAL-V8]';

interface TokenEndpointAuthModalProps {
	isOpen: boolean;
	onClose: () => void;
}

// Styled Components
const Overlay = styled.div<{ $isOpen: boolean }>`
	display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
`;

const ModalContainer = styled.div`
	background: white;
	border-radius: 1rem;
	max-width: 900px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 1.5rem;
	border-radius: 1rem 1rem 0 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: white;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.375rem;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
`;

const ModalBody = styled.div`
	padding: 1.5rem;
`;

const Section = styled.div`
	margin-bottom: 2rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h3`
	margin: 0 0 1rem 0;
	color: #1f2937;  // Dark text on light background
	font-size: 1.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const MethodCard = styled.div`
	background: #f9fafb;  // Light grey background
	border: 1px solid #e5e7eb;  // Grey border
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const MethodHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.5rem;
`;

const MethodName = styled.h4`
	margin: 0;
	color: #1f2937;  // Dark text on light background
	font-size: 1.125rem;
	font-weight: 600;
`;

const MethodDescription = styled.p`
	margin: 0.5rem 0;
	color: #4b5563;  // Medium grey text on light background
	font-size: 0.875rem;
	line-height: 1.5;
`;

const CodeExample = styled.code`
	background: #1f2937;  // Dark background
	color: #f9fafb;  // Light text on dark background
	padding: 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.8125rem;
	display: block;
	margin-top: 0.5rem;
	overflow-x: auto;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin-top: 1rem;
	font-size: 0.875rem;
`;

const TableHeader = styled.th`
	background: #f3f4f6;  // Light grey background
	color: #1f2937;  // Dark text on light background
	padding: 0.75rem;
	text-align: left;
	font-weight: 600;
	border-bottom: 2px solid #e5e7eb;  // Grey border
`;

const TableCell = styled.td`
	padding: 0.75rem;
	border-bottom: 1px solid #e5e7eb;  // Grey border
	color: #374151;  // Dark text on light background
`;

const TableRow = styled.tr`
	&:hover {
		background: #f9fafb;  // Light grey hover
	}
`;

const CheckIcon = styled(FiCheckCircle)`
	color: #10b981;  // Green
`;

const XIcon = styled(FiXCircle)`
	color: #ef4444;  // Red
`;

const InfoBox = styled.div<{ $variant: 'info' | 'warning' | 'success' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	display: flex;
	gap: 0.75rem;

	${(props) => {
		switch (props.$variant) {
			case 'success':
				return `
					background: #f0fdf4;  // Light green background
					border: 1px solid #86efac;  // Green border
					color: #166534;  // Dark green text
				`;
			case 'warning':
				return `
					background: #fef3c7;  // Light yellow background
					border: 1px solid #fde68a;  // Yellow border
					color: #92400e;  // Dark brown text
				`;
			default:
				return `
					background: #eff6ff;  // Light blue background
					border: 1px solid #bfdbfe;  // Blue border
					color: #1e40af;  // Dark blue text
				`;
		}
	}}
`;

const RecommendationCard = styled.div`
	background: #f0fdf4;  // Light green background
	border: 1px solid #86efac;  // Green border
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const RecommendationTitle = styled.h5`
	margin: 0 0 0.5rem 0;
	color: #166534;  // Dark green text on light background
	font-size: 1rem;
	font-weight: 600;
`;

const RecommendationText = styled.p`
	margin: 0;
	color: #166534;  // Dark green text on light background
	font-size: 0.875rem;
	line-height: 1.5;
`;

export const TokenEndpointAuthModal: React.FC<TokenEndpointAuthModalProps> = ({
	isOpen,
	onClose,
}) => {
	console.log(`${MODULE_TAG} Modal state:`, { isOpen });

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	return (
		<Overlay $isOpen={isOpen} onClick={onClose}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						<FiKey size={24} />
						Token Endpoint Authentication Methods
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX size={24} />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					{/* Introduction */}
					<Section>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<strong>What is Token Endpoint Authentication?</strong>
								<p style={{ margin: '0.5rem 0 0 0' }}>
									When your application exchanges an authorization code for tokens, it must prove
									its identity to PingOne. The authentication method determines how your app proves
									it's legitimate.
								</p>
							</div>
						</InfoBox>
					</Section>

					{/* Authentication Methods */}
					<Section>
						<SectionTitle>
							<FiShield size={20} />
							Authentication Methods
						</SectionTitle>

						<MethodCard>
							<MethodHeader>
								<FiKey size={18} color="#10b981" />
								<MethodName>None (Public Client)</MethodName>
							</MethodHeader>
							<MethodDescription>
								<strong>For:</strong> Single Page Apps (SPAs), Mobile Apps, Native Apps
							</MethodDescription>
							<MethodDescription>
								<strong>How it works:</strong> No secret required. Client ID sent in request body.
								Must use PKCE for security.
							</MethodDescription>
							<CodeExample>
								{`// No Authorization header
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=your-client-id
&code_verifier=xyz789  // PKCE required`}
							</CodeExample>
						</MethodCard>

						<MethodCard>
							<MethodHeader>
								<FiLock size={18} color="#3b82f6" />
								<MethodName>Client Secret Basic</MethodName>
							</MethodHeader>
							<MethodDescription>
								<strong>For:</strong> Web Applications, Backend Services (most common)
							</MethodDescription>
							<MethodDescription>
								<strong>How it works:</strong> Client ID and secret sent in HTTP Basic Authorization
								header (Base64 encoded).
							</MethodDescription>
							<CodeExample>
								{`// Authorization header with Base64(client_id:client_secret)
POST /token
Authorization: Basic YWJjMTIzOnh5ejc4OQ==
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&redirect_uri=https://app.example.com/callback`}
							</CodeExample>
						</MethodCard>

						<MethodCard>
							<MethodHeader>
								<FiLock size={18} color="#8b5cf6" />
								<MethodName>Client Secret Post</MethodName>
							</MethodHeader>
							<MethodDescription>
								<strong>For:</strong> Web Applications, Backend Services (alternative to Basic)
							</MethodDescription>
							<MethodDescription>
								<strong>How it works:</strong> Client ID and secret sent in POST body (not
								recommended for production).
							</MethodDescription>
							<CodeExample>
								{`// Credentials in POST body
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=your-client-id
&client_secret=your-client-secret
&redirect_uri=https://app.example.com/callback`}
							</CodeExample>
						</MethodCard>

						<MethodCard>
							<MethodHeader>
								<FiShield size={18} color="#f59e0b" />
								<MethodName>Client Secret JWT</MethodName>
							</MethodHeader>
							<MethodDescription>
								<strong>For:</strong> Enterprise Applications, High-Security Services
							</MethodDescription>
							<MethodDescription>
								<strong>How it works:</strong> HMAC-signed JWT using client secret (HS256, HS384,
								HS512).
							</MethodDescription>
							<CodeExample>
								{`// JWT signed with client secret
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
							</CodeExample>
						</MethodCard>

						<MethodCard>
							<MethodHeader>
								<FiShield size={18} color="#ef4444" />
								<MethodName>Private Key JWT</MethodName>
							</MethodHeader>
							<MethodDescription>
								<strong>For:</strong> Enterprise Applications, Maximum Security (recommended for
								production)
							</MethodDescription>
							<MethodDescription>
								<strong>How it works:</strong> RSA/ECDSA-signed JWT using private key (RS256, RS384,
								RS512, ES256, ES384, ES512).
							</MethodDescription>
							<CodeExample>
								{`// JWT signed with private key
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`}
							</CodeExample>
						</MethodCard>
					</Section>

					{/* Compatibility Matrix */}
					<Section>
						<SectionTitle>
							<FiInfo size={20} />
							Flow Compatibility Matrix
						</SectionTitle>

						<Table>
							<thead>
								<tr>
									<TableHeader>Flow Type</TableHeader>
									<TableHeader style={{ textAlign: 'center' }}>None</TableHeader>
									<TableHeader style={{ textAlign: 'center' }}>Basic</TableHeader>
									<TableHeader style={{ textAlign: 'center' }}>Post</TableHeader>
									<TableHeader style={{ textAlign: 'center' }}>Secret JWT</TableHeader>
									<TableHeader style={{ textAlign: 'center' }}>Private Key JWT</TableHeader>
								</tr>
							</thead>
							<tbody>
								<TableRow>
									<TableCell>Authorization Code (OAuth)</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Authorization Code (OIDC)</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>PKCE / SPA / Native App</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Client Credentials</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Refresh Token</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Implicit (OIDC)</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Device Authorization</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<CheckIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
									<TableCell style={{ textAlign: 'center' }}>
										<XIcon size={18} />
									</TableCell>
								</TableRow>
							</tbody>
						</Table>
					</Section>

					{/* Recommendations */}
					<Section>
						<SectionTitle>
							<FiCheckCircle size={20} />
							Recommended Pairings
						</SectionTitle>

						<RecommendationCard>
							<RecommendationTitle>🌐 Web App (Confidential)</RecommendationTitle>
							<RecommendationText>
								<strong>Default:</strong> Client Secret Basic
								<br />
								<strong>Alternate:</strong> Client Secret Post, Client Secret JWT, Private Key JWT
								<br />
								<strong>Flows:</strong> Authorization Code, Hybrid
							</RecommendationText>
						</RecommendationCard>

						<RecommendationCard>
							<RecommendationTitle>📱 Native / Mobile App</RecommendationTitle>
							<RecommendationText>
								<strong>Default:</strong> None (PKCE required)
								<br />
								<strong>Alternate:</strong> None
								<br />
								<strong>Flows:</strong> Authorization Code (PKCE), Device Authorization
							</RecommendationText>
						</RecommendationCard>

						<RecommendationCard>
							<RecommendationTitle>💻 SPA (Browser JavaScript)</RecommendationTitle>
							<RecommendationText>
								<strong>Default:</strong> None (PKCE required)
								<br />
								<strong>Alternate:</strong> None
								<br />
								<strong>Flows:</strong> Authorization Code (PKCE)
							</RecommendationText>
						</RecommendationCard>

						<RecommendationCard>
							<RecommendationTitle>🔧 Service / API (Machine-to-Machine)</RecommendationTitle>
							<RecommendationText>
								<strong>Default:</strong> Client Secret JWT or Private Key JWT
								<br />
								<strong>Alternate:</strong> Client Secret Basic
								<br />
								<strong>Flows:</strong> Client Credentials, JWT Bearer
							</RecommendationText>
						</RecommendationCard>
					</Section>

					{/* Key Takeaways */}
					<Section>
						<InfoBox $variant="warning">
							<FiInfo size={20} />
							<div>
								<strong>Key Takeaways</strong>
								<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
									<li>
										"None" is only appropriate for <strong>public</strong> clients (SPAs, mobile
										apps)
									</li>
									<li>
										Confidential clients (web apps, services) <strong>must</strong> authenticate
									</li>
									<li>
										JWT-based methods (Client Secret JWT, Private Key JWT) are strongest for
										enterprise workloads
									</li>
									<li>PingOne rejects "None" for confidential clients</li>
									<li>Always use PKCE with "None" authentication method</li>
								</ul>
							</div>
						</InfoBox>
					</Section>
				</ModalBody>
			</ModalContainer>
		</Overlay>
	);
};

export default TokenEndpointAuthModal;
