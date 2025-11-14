// src/components/PAREducationalPanel.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiShield, FiAlertCircle } from '../services/commonImportsService';
import { createCopyButton } from '../services/copyButtonService';

/**
 * Props for PAREducationalPanel component
 */
export interface PAREducationalPanelProps {
	/** Display variant - full shows all sections, compact shows condensed version */
	variant?: 'full' | 'compact';
	/** Show flow relationship section */
	showFlowRelationship?: boolean;
	/** Show PKCE requirement section */
	showPKCERequirement?: boolean;
	/** Show request example section */
	showRequestExample?: boolean;
	/** Show response example section */
	showResponseExample?: boolean;
	/** Show security benefits section */
	showSecurityBenefits?: boolean;
	/** Show when to use section */
	showWhenToUse?: boolean;
	/** Show flow sequence diagram */
	showFlowSequence?: boolean;
	/** Environment ID for dynamic examples */
	environmentId?: string;
	/** Additional CSS class name */
	className?: string;
}

const PanelContainer = styled.div`
	background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
	color: white;
	padding: 32px;
	border-radius: 16px;
	margin: 24px 0;
	box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
`;

const PanelTitle = styled.h2`
	margin: 0 0 24px 0;
	font-size: 1.5rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 24px 0 16px 0;
	display: flex;
	align-items: center;
	gap: 8px;
	
	&:first-of-type {
		margin-top: 0;
	}
`;

const Content = styled.div`
	font-size: 0.95rem;
	line-height: 1.6;
`;

const Paragraph = styled.p`
	margin: 0 0 16px 0;
`;

const List = styled.ul`
	margin: 12px 0;
	padding-left: 24px;
	list-style: none;
`;

const ListItem = styled.li`
	margin-bottom: 8px;
	display: flex;
	align-items: flex-start;
	gap: 8px;
	
	svg {
		flex-shrink: 0;
		margin-top: 2px;
	}
`;

const CodeBlock = styled.pre`
	background: rgba(0, 0, 0, 0.3);
	padding: 16px;
	border-radius: 8px;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	border: 1px solid rgba(255, 255, 255, 0.1);
	margin: 16px 0;
	position: relative;
`;

const CodeBlockHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CodeBlockTitle = styled.div`
	font-weight: 600;
	color: #fbbf24;
`;

const ParameterList = styled.dl`
	margin: 16px 0;
	background: rgba(0, 0, 0, 0.2);
	padding: 16px;
	border-radius: 8px;
	
	dt {
		font-weight: 600;
		color: #fbbf24;
		margin-top: 12px;
		font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
		font-size: 0.875rem;
		
		&:first-child {
			margin-top: 0;
		}
	}
	
	dd {
		margin: 4px 0 0 16px;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.875rem;
	}
`;

const FlowSequence = styled.div`
	background: rgba(0, 0, 0, 0.2);
	padding: 20px;
	border-radius: 8px;
	margin: 16px 0;
`;

const FlowStep = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin: 12px 0;
	
	&:first-child {
		margin-top: 0;
	}
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const StepNumber = styled.div`
	background: rgba(255, 255, 255, 0.2);
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	flex-shrink: 0;
`;

const StepText = styled.div`
	flex: 1;
	font-size: 0.9rem;
`;

const TwoColumnGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
	margin: 16px 0;
`;

const GridSection = styled.div`
	background: rgba(0, 0, 0, 0.2);
	padding: 16px;
	border-radius: 8px;
`;

const GridSectionTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 12px 0;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const WarningBox = styled.div`
	background: rgba(245, 158, 11, 0.2);
	border: 1px solid rgba(245, 158, 11, 0.4);
	padding: 12px 16px;
	border-radius: 8px;
	margin: 16px 0;
	display: flex;
	align-items: flex-start;
	gap: 12px;
	
	svg {
		flex-shrink: 0;
		color: #fbbf24;
		margin-top: 2px;
	}
`;

/**
 * PAREducationalPanel Component
 * 
 * Displays comprehensive educational content about PAR (Pushed Authorization Request), including:
 * - What PAR is and RFC 9126 reference
 * - How PAR relates to Authorization Code flow
 * - PKCE requirement and implementation
 * - Request and response examples with explanations
 * - Security benefits
 * - When to use PAR
 * - Flow sequence diagram
 * 
 * @example
 * ```tsx
 * <PAREducationalPanel 
 *   variant="full"
 *   showFlowRelationship={true}
 *   showPKCERequirement={true}
 *   showRequestExample={true}
 *   showResponseExample={true}
 *   showSecurityBenefits={true}
 *   showWhenToUse={true}
 *   showFlowSequence={true}
 *   environmentId="your-env-id"
 * />
 * ```
 */
const PAREducationalPanel: React.FC<PAREducationalPanelProps> = ({
	variant = 'full',
	showFlowRelationship = true,
	showPKCERequirement = true,
	showRequestExample = true,
	showResponseExample = true,
	showSecurityBenefits = true,
	showWhenToUse = true,
	showFlowSequence = true,
	environmentId = 'your-environment-id',
	className,
}) => {
	const isFullVariant = variant === 'full';
	const shouldShowFlowRelationship = showFlowRelationship;
	const shouldShowPKCERequirement = showPKCERequirement;
	const shouldShowRequestExample = showRequestExample;
	const shouldShowResponseExample = showResponseExample && isFullVariant;
	const shouldShowSecurityBenefits = showSecurityBenefits && isFullVariant;
	const shouldShowWhenToUse = showWhenToUse && isFullVariant;
	const shouldShowFlowSequence = showFlowSequence && isFullVariant;
	// Generate dynamic PAR request example
	const parRequestExample = useMemo(() => {
		return `POST https://auth.pingone.com/${environmentId}/as/par HTTP/1.1
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID
&redirect_uri=https://your-app.com/callback
&response_type=code
&scope=openid profile email
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
&code_challenge_method=S256
&state=abc123xyz`;
	}, [environmentId]);

	// Generate dynamic authorization URL example
	const authorizationUrlExample = useMemo(() => {
		return `https://auth.pingone.com/${environmentId}/as/authorize?client_id=YOUR_CLIENT_ID&request_uri=urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c`;
	}, [environmentId]);

	return (
		<PanelContainer className={className}>
			<PanelTitle>
				🔐 Understanding PAR (Pushed Authorization Request)
			</PanelTitle>
			
			<Content>
				{/* Overview Section */}
				<Paragraph>
					<strong>PAR (RFC 9126)</strong> is a security enhancement for OAuth 2.0 that sends authorization parameters to a secure backend endpoint instead of passing them in the URL. This protects sensitive data and prevents parameter tampering.
				</Paragraph>

				{/* Flow Relationship Section */}
				{shouldShowFlowRelationship && (
					<>
						<SectionTitle>📊 PAR + Authorization Code Flow</SectionTitle>
						<Paragraph>
							PAR is <strong>not a standalone flow</strong> — it enhances the Authorization Code flow by adding a secure parameter push step before authorization.
						</Paragraph>
						<List>
							<ListItem>
								<FiCheckCircle size={16} />
								<span><strong>Step 1:</strong> Push parameters to PAR endpoint (secure backend)</span>
							</ListItem>
							<ListItem>
								<FiCheckCircle size={16} />
								<span><strong>Step 2:</strong> Receive request_uri reference</span>
							</ListItem>
							<ListItem>
								<FiCheckCircle size={16} />
								<span><strong>Step 3:</strong> Use request_uri in authorization request</span>
							</ListItem>
							<ListItem>
								<FiCheckCircle size={16} />
								<span><strong>Step 4:</strong> Complete authorization and token exchange (standard flow)</span>
							</ListItem>
						</List>
					</>
				)}

				{/* PKCE Requirement Section */}
				{shouldShowPKCERequirement && (
					<>
						<SectionTitle>🔑 PKCE is Required</SectionTitle>
						<Paragraph>
							PAR flows <strong>require PKCE</strong> (Proof Key for Code Exchange, RFC 7636) to prevent authorization code interception attacks.
						</Paragraph>
						<CodeBlock>
							<CodeBlockHeader>
								<CodeBlockTitle>PKCE Parameters</CodeBlockTitle>
							</CodeBlockHeader>
							{`// Generate random code verifier (43-128 characters)
code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

// Create code challenge (SHA-256 hash, base64url encoded)
code_challenge = BASE64URL(SHA256(code_verifier))
code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

// Always use S256 method
code_challenge_method = "S256"`}
						</CodeBlock>
						<ParameterList>
							<dt>code_challenge</dt>
							<dd>Sent in PAR request - SHA-256 hash of the code_verifier</dd>
							
							<dt>code_verifier</dt>
							<dd>Sent in token exchange - proves you made the original PAR request</dd>
							
							<dt>code_challenge_method</dt>
							<dd>Always "S256" (SHA-256 hashing)</dd>
						</ParameterList>
					</>
				)}

				{/* Request Example Section */}
				{shouldShowRequestExample && (
					<>
						<SectionTitle>📤 PAR Request Example</SectionTitle>
						<CodeBlock>
							<CodeBlockHeader>
								<CodeBlockTitle>HTTP POST Request</CodeBlockTitle>
								<div style={{ display: 'flex', gap: '8px' }}>
									{createCopyButton(parRequestExample, 'Copy PAR Request', { showLabel: false, size: 'sm', variant: 'outline' })}
								</div>
							</CodeBlockHeader>
							{parRequestExample}
						</CodeBlock>
						<ParameterList>
							<dt>client_id</dt>
							<dd>Your application's client identifier from PingOne</dd>
							
							<dt>redirect_uri</dt>
							<dd>Where to send the user after authorization (must be registered)</dd>
							
							<dt>response_type</dt>
							<dd>Always "code" for Authorization Code flow</dd>
							
							<dt>scope</dt>
							<dd>Permissions requested (e.g., "openid profile email")</dd>
							
							<dt>code_challenge</dt>
							<dd>PKCE challenge - SHA-256 hash of code_verifier</dd>
							
							<dt>code_challenge_method</dt>
							<dd>Always "S256" for SHA-256 hashing</dd>
							
							<dt>state</dt>
							<dd>CSRF protection token - verify this matches in callback</dd>
						</ParameterList>
					</>
				)}

				{/* Response Example Section */}
				{shouldShowResponseExample && (
					<>
						<SectionTitle>📥 PAR Response Example</SectionTitle>
						<CodeBlock>
							<CodeBlockHeader>
								<CodeBlockTitle>JSON Response</CodeBlockTitle>
							</CodeBlockHeader>
							{`{
  "request_uri": "urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c",
  "expires_in": 90
}`}
						</CodeBlock>
						<ParameterList>
							<dt>request_uri</dt>
							<dd>Reference URI representing your pushed parameters - use this in authorization request</dd>
							
							<dt>expires_in</dt>
							<dd>Validity period in seconds (typically 90 seconds)</dd>
						</ParameterList>
						<Paragraph style={{ marginTop: '16px' }}>
							<strong>Use the request_uri in your authorization request:</strong>
						</Paragraph>
						<CodeBlock>
							<CodeBlockHeader>
								<CodeBlockTitle>Authorization URL</CodeBlockTitle>
								<div style={{ display: 'flex', gap: '8px' }}>
									{createCopyButton(authorizationUrlExample, 'Copy Authorization URL', { showLabel: false, size: 'sm', variant: 'outline' })}
								</div>
							</CodeBlockHeader>
							{authorizationUrlExample}
						</CodeBlock>
					</>
				)}

				{/* Security Benefits Section */}
				{shouldShowSecurityBenefits && (
					<>
						<SectionTitle>🛡️ Security Benefits</SectionTitle>
						<List>
							<ListItem>
								<FiShield size={16} />
								<span><strong>Prevents parameter tampering</strong> - Parameters not visible in URL</span>
							</ListItem>
							<ListItem>
								<FiShield size={16} />
								<span><strong>Protects sensitive data</strong> - Authorization details not exposed in browser</span>
							</ListItem>
							<ListItem>
								<FiShield size={16} />
								<span><strong>Reduces URL length</strong> - No query string bloat or length limits</span>
							</ListItem>
							<ListItem>
								<FiShield size={16} />
								<span><strong>Server-side validation</strong> - Parameters validated before authorization</span>
							</ListItem>
							<ListItem>
								<FiShield size={16} />
								<span><strong>Supports complex parameters</strong> - Enables Rich Authorization Requests (RAR)</span>
							</ListItem>
						</List>
					</>
				)}

				{/* When to Use Section */}
				{shouldShowWhenToUse && (
					<>
						<SectionTitle>🎯 When to Use PAR</SectionTitle>
						<TwoColumnGrid>
							<GridSection>
								<GridSectionTitle>
									<FiCheckCircle size={18} />
									Recommended For
								</GridSectionTitle>
								<List>
									<ListItem>
										<span>✅ High-security applications</span>
									</ListItem>
									<ListItem>
										<span>✅ Complex authorization parameters</span>
									</ListItem>
									<ListItem>
										<span>✅ Rich Authorization Requests (RAR)</span>
									</ListItem>
									<ListItem>
										<span>✅ Parameter confidentiality requirements</span>
									</ListItem>
								</List>
							</GridSection>
							
							<GridSection>
								<GridSectionTitle>
									<FiAlertCircle size={18} />
									Considerations
								</GridSectionTitle>
								<List>
									<ListItem>
										<span>⚠️ Requires additional server round-trip</span>
									</ListItem>
									<ListItem>
										<span>⚠️ Adds implementation complexity</span>
									</ListItem>
									<ListItem>
										<span>⚠️ May not be needed for simple use cases</span>
									</ListItem>
								</List>
							</GridSection>
						</TwoColumnGrid>
					</>
				)}

				{/* Flow Sequence Section */}
				{shouldShowFlowSequence && (
					<>
						<SectionTitle>🔄 Complete PAR Flow Sequence</SectionTitle>
						<FlowSequence>
							<FlowStep>
								<StepNumber>1</StepNumber>
								<StepText>
									<strong>Client → Authorization Server:</strong> POST to /as/par with parameters
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>2</StepNumber>
								<StepText>
									<strong>Authorization Server → Client:</strong> Returns request_uri
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>3</StepNumber>
								<StepText>
									<strong>Client → Authorization Server:</strong> GET to /as/authorize with request_uri
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>4</StepNumber>
								<StepText>
									<strong>Authorization Server → User:</strong> Shows login/consent page
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>5</StepNumber>
								<StepText>
									<strong>User → Authorization Server:</strong> Authenticates and approves
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>6</StepNumber>
								<StepText>
									<strong>Authorization Server → Client:</strong> Redirects with authorization code
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>7</StepNumber>
								<StepText>
									<strong>Client → Authorization Server:</strong> POST to /as/token with code + code_verifier
								</StepText>
							</FlowStep>
							<FlowStep>
								<StepNumber>8</StepNumber>
								<StepText>
									<strong>Authorization Server → Client:</strong> Returns access token + ID token
								</StepText>
							</FlowStep>
						</FlowSequence>
					</>
				)}

				{/* Warning Box */}
				<WarningBox>
					<FiAlertCircle size={20} />
					<div>
						<strong>Important:</strong> The request_uri expires in 90 seconds. You must use it immediately in your authorization request. If it expires, you'll need to make a new PAR request.
					</div>
				</WarningBox>
			</Content>
		</PanelContainer>
	);
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(PAREducationalPanel);
