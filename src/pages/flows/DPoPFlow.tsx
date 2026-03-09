import { V9_COLORS } from '../../services/v9/V9ColorStandards';
// src/pages/flows/DPoPFlow.tsx
// DPoP (Demonstration of Proof-of-Possession) Flow - Educational/Mock Implementation
// RFC 9449 - OAuth 2.0 Demonstrating Proof of Possession (DPoP)

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../../components/Card';
import { showFlowSuccess } from '../../components/CentralizedSuccessMessage';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import DPoPService, { type DPoPKeyPair, type DPoPProof } from '../../services/dpopService';
import { FlowHeader } from '../../services/flowHeaderService';
import { copyToClipboard } from '../../utils/clipboard';

const Container = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 1.5rem;
	background: white;
	min-height: 100vh;
	padding-top: 100px;
	padding-bottom: 4rem;
`;

const MainCard = styled(Card)`
	margin-bottom: 2rem;
`;

const WarningBox = styled.div`
	background-color: V9_COLORS.BG.WARNING;
	border: 1px solid #fcd34d;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1.5rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const WarningIcon = styled.div`
	color: V9_COLORS.PRIMARY.YELLOW;
	font-size: 1.25rem;
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const WarningContent = styled.div`
	flex: 1;

	h4 {
		font-weight: 600;
		color: V9_COLORS.PRIMARY.YELLOW_DARK;
		margin-bottom: 0.5rem;
	}

	p {
		color: #78350f;
		margin: 0;
		line-height: 1.6;
	}
`;

const InfoBox = styled.div`
	background-color: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const InfoIcon = styled.div`
	color: V9_COLORS.PRIMARY.BLUE;
	font-size: 1.25rem;
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const InfoContent = styled.div`
	flex: 1;

	h4 {
		font-weight: 600;
		color: V9_COLORS.PRIMARY.BLUE_DARK;
		margin-bottom: 0.5rem;
	}

	p {
		color: #1e3a8a;
		margin: 0;
		line-height: 1.6;
	}
`;

const CodeBlock = styled.pre`
	background-color: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	white-space: pre-wrap;
	word-wrap: break-word;
`;

const CodeBlockHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const CopyButton = styled.button`
	background: #f3f4f6;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	font-size: 0.75rem;
	cursor: pointer;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	transition: all 0.2s;

	&:hover {
		background: V9_COLORS.TEXT.GRAY_LIGHTER;
	}
`;

const ActionButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	background: V9_COLORS.PRIMARY.BLUE;
	color: white;

	&:hover {
		background: V9_COLORS.PRIMARY.BLUE_DARK;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const KeyPairDisplay = styled.div`
	background: #f9fafb;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const KeyPairInfo = styled.div`
	margin-bottom: 1rem;

	strong {
		color: V9_COLORS.TEXT.GRAY_DARK;
		font-weight: 600;
		display: block;
		margin-bottom: 0.5rem;
	}

	pre {
		background: white;
		border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
		border-radius: 0.25rem;
		padding: 0.75rem;
		font-size: 0.75rem;
		overflow-x: auto;
		margin: 0.5rem 0;
	}
`;

const ProofDisplay = styled.div`
	background: #f0fdf4;
	border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const ProofInfo = styled.div`
	margin-bottom: 0.75rem;

	strong {
		color: V9_COLORS.PRIMARY.GREEN;
		font-weight: 600;
		display: block;
		margin-bottom: 0.25rem;
	}

	code {
		background: white;
		border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		color: V9_COLORS.PRIMARY.GREEN;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const DPoPFlow: React.FC = () => {
	const [keyPair, setKeyPair] = useState<DPoPKeyPair | null>(null);
	const [proof, setProof] = useState<DPoPProof | null>(null);
	const [httpMethod, setHttpMethod] = useState('POST');
	const [httpUri, setHttpUri] = useState('https://api.example.com/resource');
	const [accessToken, setAccessToken] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isCreatingProof, setIsCreatingProof] = useState(false);

	useEffect(() => {
		// Check browser support — unsupported state handled by DPoPStatus.isSupported() in render
	}, []);

	const handleCopyCode = (code: string, description: string) => {
		copyToClipboard(code);
		showFlowSuccess(`Copied ${description} to clipboard`);
	};

	const handleGenerateKeyPair = useCallback(async () => {
		setIsGenerating(true);
		try {
			const newKeyPair = await DPoPService.generateKeyPair({
				algorithm: 'ES256',
				namedCurve: 'P-256',
			});
			setKeyPair(newKeyPair);
			setProof(null); // Clear previous proof
			showFlowSuccess('DPoP key pair generated successfully');
		} catch (_error) {
			showFlowSuccess('Failed to generate key pair', 'error');
		} finally {
			setIsGenerating(false);
		}
	}, []);

	const handleCreateProof = useCallback(async () => {
		if (!keyPair) {
			showFlowSuccess('Please generate a key pair first', 'error');
			return;
		}

		setIsCreatingProof(true);
		try {
			const newProof = await DPoPService.createProof(httpMethod, httpUri, accessToken || undefined);
			setProof(newProof);
			showFlowSuccess('DPoP proof created successfully');
		} catch (_error) {
			showFlowSuccess('Failed to create DPoP proof', 'error');
		} finally {
			setIsCreatingProof(false);
		}
	}, [keyPair, httpMethod, httpUri, accessToken]);

	return (
		<Container>
			<FlowHeader
				title="DPoP (Demonstration of Proof-of-Possession)"
				subtitle="RFC 9449 - Educational/Mock Implementation"
				flowId="dpop-flow"
			/>

			<WarningBox>
				<WarningIcon>
					<span>⚠️</span>
				</WarningIcon>
				<WarningContent>
					<h4>Educational/Mock Implementation</h4>
					<p>
						This is an educational demonstration of DPoP (RFC 9449) concepts. PingOne does not
						currently support DPoP. This implementation shows how DPoP works, its security benefits,
						and proper implementation patterns. All DPoP proofs generated here are for educational
						purposes only and cannot be used with real OAuth servers.
					</p>
				</WarningContent>
			</WarningBox>

			<CollapsibleHeader
				title="What is DPoP?"
				theme="blue"
				icon={<span>📚</span>}
				defaultExpanded={true}
			>
				<MainCard>
					<CardBody>
						<p>
							<strong>DPoP (Demonstration of Proof-of-Possession)</strong> is an OAuth 2.0 extension
							(RFC 9449) that provides proof that the client presenting an access token actually
							possesses the private key associated with that token. This prevents token replay
							attacks and provides binding between the token and the HTTP request.
						</p>

						<h3>Key Benefits:</h3>
						<ul>
							<li>
								🛡️ <strong>Token Binding:</strong> Binds access tokens to specific HTTP requests and
								methods
							</li>
							<li>
								🚫 <strong>Replay Protection:</strong> Each proof includes a unique jti (JWT ID)
								preventing replay attacks
							</li>
							<li>
								🔗 <strong>Request Binding:</strong> Proof includes HTTP method and URI, ensuring
								token is used for intended request
							</li>
							<li>
								⏱️ <strong>Freshness:</strong> Includes iat (issued at) timestamp for freshness
								validation
							</li>
							<li>
								🔐 <strong>Key Possession:</strong> Proves client controls the private key, not just
								the token
							</li>
						</ul>

						<InfoBox>
							<InfoIcon>
								<span>ℹ️</span>
							</InfoIcon>
							<InfoContent>
								<h4>How DPoP Works</h4>
								<p>
									DPoP uses JWTs (JSON Web Tokens) with a special type "dpop+jwt" that contain the
									public key (JWK) in the header and HTTP method/URI in the payload. The proof is
									signed with the client's private key, demonstrating that the client possesses the
									key and can use it for this specific request.
								</p>
							</InfoContent>
						</InfoBox>
					</CardBody>
				</MainCard>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Step 1: Generate DPoP Key Pair"
				theme="green"
				icon={<span>🔑</span>}
				defaultExpanded={true}
			>
				<MainCard>
					<CardBody>
						<p>
							The first step is to generate an asymmetric key pair. The client generates a key pair
							(typically ES256 or RS256) and keeps the private key secret. The public key will be
							included in DPoP proofs.
						</p>

						<ActionButton onClick={handleGenerateKeyPair} disabled={isGenerating}>
							{isGenerating ? (
								<>
									<span>🔄</span>Generating...
								</>
							) : (
								<>
									<span>🔑</span>Generate DPoP Key Pair
								</>
							)}
						</ActionButton>

						{keyPair && (
							<KeyPairDisplay>
								<KeyPairInfo>
									<strong>Algorithm:</strong>
									<code>ES256 (ECDSA with P-256 curve)</code>
								</KeyPairInfo>
								<KeyPairInfo>
									<strong>Public Key (JWK):</strong>
									<CodeBlockHeader>
										<span>Public Key JWK</span>
										<CopyButton
											onClick={() =>
												handleCopyCode(JSON.stringify(keyPair.jwk, null, 2), 'Public Key JWK')
											}
										>
											<span>📋</span>Copy
										</CopyButton>
									</CodeBlockHeader>
									<CodeBlock>{JSON.stringify(keyPair.jwk, null, 2)}</CodeBlock>
								</KeyPairInfo>
								<InfoBox>
									<InfoIcon>
										<span>ℹ️</span>
									</InfoIcon>
									<InfoContent>
										<p>
											<strong>Note:</strong> The private key is kept secret and never shared. Only
											the public key (JWK) is included in DPoP proofs. The authorization server uses
											the public key to verify the proof signature.
										</p>
									</InfoContent>
								</InfoBox>
							</KeyPairDisplay>
						)}

						<CodeBlockHeader>
							<span>Code Example: Generate Key Pair</span>
							<CopyButton
								onClick={() =>
									handleCopyCode(
										`// Generate DPoP key pair
const keyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true, // extractable
  ['sign', 'verify']
);

// Export public key as JWK
const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);`,
										'Key generation code'
									)
								}
							>
								<span>📋</span>Copy
							</CopyButton>
						</CodeBlockHeader>
						<CodeBlock>{`// Generate DPoP key pair
const keyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true, // extractable
  ['sign', 'verify']
);

// Export public key as JWK
const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);`}</CodeBlock>
					</CardBody>
				</MainCard>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Step 2: Create DPoP Proof"
				theme="blue"
				icon={<span>🛡️</span>}
				defaultExpanded={true}
			>
				<MainCard>
					<CardBody>
						<p>
							Create a DPoP proof JWT for a specific HTTP request. The proof includes the HTTP
							method, URI, timestamp, and optionally the access token hash.
						</p>

						<FormGroup>
							<Label>HTTP Method</Label>
							<Select value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)}>
								<option value="GET">GET</option>
								<option value="POST">POST</option>
								<option value="PUT">PUT</option>
								<option value="PATCH">PATCH</option>
								<option value="DELETE">DELETE</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label>HTTP URI</Label>
							<Input
								type="text"
								value={httpUri}
								onChange={(e) => setHttpUri(e.target.value)}
								placeholder="https://api.example.com/resource"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Access Token (Optional - for ath claim)</Label>
							<Input
								type="text"
								value={accessToken}
								onChange={(e) => setAccessToken(e.target.value)}
								placeholder="Enter access token to include ath claim"
							/>
							<small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
								If provided, the access token will be hashed and included in the proof as the "ath"
								claim
							</small>
						</FormGroup>

						<ActionButton onClick={handleCreateProof} disabled={isCreatingProof || !keyPair}>
							{isCreatingProof ? (
								<>
									<span>🔄</span>Creating Proof...
								</>
							) : (
								<>
									<span>🛡️</span>Create DPoP Proof
								</>
							)}
						</ActionButton>

						{proof && (
							<ProofDisplay>
								<ProofInfo>
									<strong>DPoP Proof JWT:</strong>
									<code style={{ display: 'block', marginTop: '0.5rem', wordBreak: 'break-all' }}>
										{proof.jwt}
									</code>
								</ProofInfo>
								<ProofInfo>
									<strong>JWT ID (jti):</strong>
									<code>{proof.jti}</code>
								</ProofInfo>
								<ProofInfo>
									<strong>HTTP Method (htm):</strong>
									<code>{proof.htm}</code>
								</ProofInfo>
								<ProofInfo>
									<strong>HTTP URI (htu):</strong>
									<code>{proof.htu}</code>
								</ProofInfo>
								<ProofInfo>
									<strong>Issued At (iat):</strong>
									<code>{new Date(proof.iat * 1000).toISOString()}</code>
								</ProofInfo>
								<CodeBlockHeader style={{ marginTop: '1rem' }}>
									<span>Decoded Proof Structure</span>
									<CopyButton
										onClick={() => {
											const decoded = {
												header: {
													typ: 'dpop+jwt',
													alg: 'ES256',
													jwk: keyPair?.jwk,
												},
												payload: {
													jti: proof.jti,
													htm: proof.htm,
													htu: proof.htu,
													iat: proof.iat,
													...(accessToken && { ath: 'base64url-encoded-sha256-hash' }),
												},
											};
											handleCopyCode(JSON.stringify(decoded, null, 2), 'Decoded proof');
										}}
									>
										<span>📋</span>Copy
									</CopyButton>
								</CodeBlockHeader>
								<CodeBlock>
									{JSON.stringify(
										{
											header: {
												typ: 'dpop+jwt',
												alg: 'ES256',
												jwk: keyPair?.jwk,
											},
											payload: {
												jti: proof.jti,
												htm: proof.htm,
												htu: proof.htu,
												iat: proof.iat,
												...(accessToken && {
													ath: 'base64url-encoded-sha256-hash-of-access-token',
												}),
											},
										},
										null,
										2
									)}
								</CodeBlock>
							</ProofDisplay>
						)}
					</CardBody>
				</MainCard>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Step 3: Use DPoP Proof in API Request"
				theme="highlight"
				icon={<span>➡️</span>}
				defaultExpanded={true}
			>
				<MainCard>
					<CardBody>
						<p>
							Include the DPoP proof in the <code>DPoP</code> header when making API requests with
							the access token.
						</p>

						{proof && (
							<CodeBlockHeader>
								<span>Example API Request with DPoP</span>
								<CopyButton
									onClick={() => {
										const request = `${httpMethod} ${httpUri}
Authorization: Bearer ${accessToken || 'your_access_token_here'}
DPoP: ${proof.jwt}`;
										handleCopyCode(request, 'API request');
									}}
								>
									<span>📋</span>Copy
								</CopyButton>
							</CodeBlockHeader>
						)}
						<CodeBlock>
							{proof
								? `${httpMethod} ${httpUri}
Authorization: Bearer ${accessToken || 'your_access_token_here'}
DPoP: ${proof.jwt}`
								: `POST https://api.example.com/resource
Authorization: Bearer your_access_token_here
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiamZrIjp7Imt0eSI6IkVDIiw...`}
						</CodeBlock>

						<CodeBlockHeader>
							<span>JavaScript Fetch Example</span>
							<CopyButton
								onClick={() => {
									const code = `// Make API request with DPoP proof
const response = await fetch('${httpUri}', {
  method: '${httpMethod}',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'DPoP': '${proof?.jwt || 'dpop_proof_jwt_here'}'
  },
  body: JSON.stringify({ /* your request body */ })
});`;
									handleCopyCode(code, 'Fetch example');
								}}
							>
								<span>📋</span>Copy
							</CopyButton>
						</CodeBlockHeader>
						<CodeBlock>{`// Make API request with DPoP proof
const response = await fetch('${httpUri}', {
  method: '${httpMethod}',
  headers: {
    'Authorization': \`Bearer \${accessToken || 'your_access_token'}\`,
    'DPoP': '${proof?.jwt || 'dpop_proof_jwt_here'}'
  },
  body: JSON.stringify({ /* your request body */ })
});`}</CodeBlock>
					</CardBody>
				</MainCard>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="DPoP Integration with OAuth Flows"
				theme="orange"
				icon={<span>🌐</span>}
				defaultExpanded={false}
			>
				<MainCard>
					<CardBody>
						<p>
							DPoP can be integrated with any OAuth 2.0 flow. Here's how it works with different
							flows:
						</p>

						<h3>Authorization Code Flow with DPoP</h3>
						<ol>
							<li>Generate DPoP key pair (client-side)</li>
							<li>Include DPoP public key thumbprint in token request</li>
							<li>Authorization server binds the access token to the DPoP public key</li>
							<li>Use DPoP proof in all API requests with the access token</li>
						</ol>

						<CodeBlockHeader>
							<span>Token Request with DPoP</span>
							<CopyButton
								onClick={() => {
									const code = `POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=authorization_code_value&
redirect_uri=https://app.example.com/callback&
client_id=your_client_id&
client_secret=your_client_secret&
dpop_jkt=base64url-encoded-thumbprint-of-dpop-public-key`;
									handleCopyCode(code, 'Token request with DPoP');
								}}
							>
								<span>📋</span>Copy
							</CopyButton>
						</CodeBlockHeader>
						<CodeBlock>{`POST https://auth.pingone.com/{environmentId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=authorization_code_value&
redirect_uri=https://app.example.com/callback&
client_id=your_client_id&
client_secret=your_client_secret&
dpop_jkt=base64url-encoded-thumbprint-of-dpop-public-key`}</CodeBlock>

						<h3>Client Credentials Flow with DPoP</h3>
						<p>
							DPoP is particularly useful for Client Credentials flow where the client is also the
							resource owner, preventing token theft and replay attacks.
						</p>

						<InfoBox>
							<InfoIcon>
								<span>ℹ️</span>
							</InfoIcon>
							<InfoContent>
								<h4>PingOne Support</h4>
								<p>
									PingOne does not currently support DPoP. This page provides educational
									demonstrations of DPoP concepts and security benefits. For production use,
									consider mTLS or other token binding mechanisms supported by PingOne.
								</p>
							</InfoContent>
						</InfoBox>
					</CardBody>
				</MainCard>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Security Benefits Summary"
				theme="green"
				icon={<span>✅</span>}
				defaultExpanded={false}
			>
				<MainCard>
					<CardBody>
						<h3>Why Use DPoP?</h3>
						<ul>
							<li>
								<strong>Prevents Token Replay:</strong> Even if an access token is stolen, it cannot
								be used without the private key
							</li>
							<li>
								<strong>Request Binding:</strong> Each proof is tied to a specific HTTP method and
								URI, preventing token reuse in different contexts
							</li>
							<li>
								<strong>Proof of Possession:</strong> Demonstrates that the client controls the
								private key, not just the token
							</li>
							<li>
								<strong>Freshness:</strong> Timestamps in proofs help detect stale or replayed
								requests
							</li>
							<li>
								<strong>No Shared Secrets:</strong> Works with public/private key cryptography,
								eliminating the need for shared secrets
							</li>
						</ul>

						<h3>When to Use DPoP</h3>
						<ul>
							<li>High-security applications handling sensitive data</li>
							<li>APIs where token theft is a concern</li>
							<li>Client Credentials flows where clients are resource owners</li>
							<li>Applications requiring strong token binding</li>
							<li>Compliance scenarios requiring proof of possession</li>
						</ul>
					</CardBody>
				</MainCard>
			</CollapsibleHeader>
		</Container>
	);
};

export default DPoPFlow;
