/**
 * @file DpopAuthorizationCodeFlowV8.tsx
 * @module pages
 * @description DPoP Authorization Code Flow V8 - Demonstrates OAuth 2.0 Demonstrating Proof of Possession (DPoP)
 * @version 8.0.0
 * @since 2026-02-15
 *
 * Purpose: Educational implementation of DPoP (RFC 9449) for learning OAuth 2.0 security enhancements.
 * Since PingOne does not support DPoP natively, this implementation provides a mock DPoP server
 * to demonstrate the concept and allow users to learn about DPoP proof-of-possession tokens.
 *
 * Architecture:
 * - Mock DPoP server for demonstration purposes
 * - DPoP proof JWT generation and validation
 * - Authorization Code Flow with DPoP binding
 * - Educational content and step-by-step guidance
 * - Mock token introspection with DPoP confirmation
 */

import {
	FiActivity,
	FiAlertTriangle,
	FiBook,
	FiCheckCircle,
	FiCode,
	FiCpu,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiUnlock,
} from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.section`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #0c4a6e;
`;

const WarningBox = styled.div`
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #92400e;
`;

const SuccessBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #16a34a;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #166534;
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #dc2626;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #dc2626;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 1rem;

  ${({ $variant = 'primary' }) => {
		const colors = {
			primary: { bg: '#3b82f6', hover: '#2563eb' },
			secondary: { bg: '#6b7280', hover: '#4b5563' },
			danger: { bg: '#ef4444', hover: '#dc2626' },
		};

		return `
      background: ${colors[$variant].bg};
      color: white;
      &:hover {
        background: ${colors[$variant].hover};
      }
    `;
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StepIndicator = styled.div<{ $active?: boolean; $completed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: ${({ $active, $completed }) =>
		$active ? '#dbeafe' : $completed ? '#d1fae5' : '#f3f4f6'};
  border: 1px solid ${({ $active, $completed }) =>
		$active ? '#22c55e' : $completed ? '#16a34a' : '#d1d5db'};
`;

const StepNumber = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $active, $completed }) => ($active || $completed ? 'white' : '#6b7280')};
  background: ${({ $active, $completed }) =>
		$active ? '#22c55e' : $completed ? '#16a34a' : '#d1d5db'};
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  color: #1f2937;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const StepDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const TokenDisplay = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
`;

const ProofDisplay = styled.div`
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  word-break: break-all;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
`;

const Column = styled.div``;

// Types
interface DpopProof {
	typ: string;
	alg: string;
	jwk: {
		kty: string;
		crv: string;
		e: string;
		nbf?: string;
		kid?: string;
		k: string;
		x5c?: string;
		x5t?: string;
	};
	iat: string;
	exp: number;
	nbf?: string;
	nonce?: string;
	athm: string;
	htu?: string;
	htm: string;
}

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	dpop_jkt: string;
}

interface MockServerState {
	isRunning: boolean;
	logs: string[];
	issuedTokens: TokenResponse[];
	currentProof: DpopProof | null;
}

// Mock DPoP server implementation
class MockDpopServer {
	private state: MockServerState = {
		isRunning: false,
		logs: [],
		issuedTokens: [],
		currentProof: null,
	};

	start() {
		this.state.isRunning = true;
		this.log('🚀 Mock DPoP Server Started');
		this.log('📋 Server endpoints:');
		this.log('   POST /dpop/auth - Authorization endpoint with DPoP');
		this.log('   POST /dpop/token - Token endpoint with DPoP binding');
		this.log('   GET /dpop/introspect - Token introspection with DPoP confirmation');
		this.log('   GET /dpop/jwks - JSON Web Key Set endpoint');
		this.log('   GET /dpop/nonce - Server-provided nonce endpoint');
	}

	stop() {
		this.state.isRunning = false;
		this.log('🛑 Mock DPoP Server Stopped');
	}

	private log(message: string) {
		const timestamp = new Date().toISOString();
		this.state.logs.push(`[${timestamp}] ${message}`);
	}

	generateNonce(): string {
		const nonce =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		this.log(`🔢 Generated nonce: ${nonce}`);
		return nonce;
	}

	generateKeyPair(): { publicKey: string; privateKey: string } {
		// Generate a simple mock key pair (in real implementation, use proper crypto)
		const mockPublicKey = `mock-public-key-${Math.random().toString(36).substring(2, 15)}`;
		const mockPrivateKey = `mock-private-key-${Math.random().toString(36).substring(2, 15)}`;

		this.log(`🔐 Generated mock key pair`);
		this.log(`   Public: ${mockPublicKey}`);
		this.log(`   Private: ${mockPrivateKey}`);

		return { publicKey: mockPublicKey, privateKey: mockPrivateKey };
	}

	createDpopProof(htm: string, privateKey: string, nonce?: string): DpopProof {
		const now = Math.floor(Date.now() / 1000);
		const exp = now + 60; // 1 minute expiry

		const proof: DpopProof = {
			typ: 'dpop+jwt',
			alg: 'RS256',
			jwk: {
				kty: 'RSA',
				crv: 'RS256',
				e: 'AQAB',
				nbf: '1',
				kid: `mock-key-id-${Math.random().toString(36).substring(2, 15)}`,
				k: privateKey,
			},
			iat: now.toString(),
			exp,
			...(nonce && { nbf: nonce }),
			athm: 'POST',
			...(nonce && { nonce }),
			htm,
		};

		this.log(`📝 Created DPoP proof for ${htm}`);
		this.state.currentProof = proof;
		return proof;
	}

	validateDpopProof(proof: DpopProof): boolean {
		try {
			// Basic validation (in real implementation, verify signature)
			const now = Math.floor(Date.now() / 1000);

			if (proof.exp < now) {
				this.log('❌ DPoP proof expired');
				return false;
			}

			if (proof.nbf && parseInt(proof.nbf, 10) > now) {
				this.log('❌ DPoP proof not yet valid (nbf > current time)');
				return false;
			}

			if (proof.typ !== 'dpop+jwt') {
				this.log('❌ Invalid DPoP proof type');
				return false;
			}

			this.log('✅ DPoP proof validation passed');
			return true;
		} catch (error) {
			this.log(`❌ DPoP proof validation error: ${error}`);
			return false;
		}
	}

	issueAuthorizationCode(): string {
		const code = `auth-code-${Math.random().toString(36).substring(2, 15)}`;
		this.log(`🔑 Issued authorization code: ${code}`);
		return code;
	}

	exchangeCodeForToken(_code: string, dpopProof: DpopProof): TokenResponse {
		if (!this.validateDpopProof(dpopProof)) {
			throw new Error('Invalid DPoP proof');
		}

		// Mock token issuance with DPoP binding
		const token = `dpop-access-token-${Math.random().toString(36).substring(2, 15)}`;
		const tokenResponse: TokenResponse = {
			access_token: token,
			token_type: 'DPoP',
			expires_in: 3600,
			scope: 'read write',
			dpop_jkt: dpopProof.jwk.kid || 'default-jkt',
		};

		this.state.issuedTokens.push(tokenResponse);
		this.log(`🎫 Issued DPoP access token: ${token}`);
		this.log(`   Token type: ${tokenResponse.token_type}`);
		this.log(`   DPoP JKT: ${tokenResponse.dpop_jkt}`);
		this.log(`   Expires in: ${tokenResponse.expires_in}s`);

		return tokenResponse;
	}

	introspectToken(token: string): {
		active: boolean;
		scope?: string;
		token_type?: string;
		exp?: number;
		iat?: number;
		cnf?: { jkt?: string };
	} {
		const issuedToken = this.state.issuedTokens.find((t) => t.access_token === token);

		if (!issuedToken) {
			return { active: false };
		}

		const now = Math.floor(Date.now() / 1000);
		const issuedAt = now - 1800; // Assume issued 30 minutes ago
		const expiresAt = issuedAt + issuedToken.expires_in;

		return {
			active: expiresAt > now,
			scope: issuedToken.scope,
			token_type: issuedToken.token_type,
			exp: expiresAt,
			iat: issuedAt,
			cnf: {
				jkt: issuedToken.dpop_jkt,
			},
		};
	}

	getLogs(): string[] {
		return [...this.state.logs];
	}

	getState(): MockServerState {
		return { ...this.state };
	}
}

// Main component
const DpopAuthorizationCodeFlowV8: React.FC = () => {
	const [mockServer] = useState(() => new MockDpopServer());
	const [currentStep, setCurrentStep] = useState(0);
	const [authorizationCode, setAuthorizationCode] = useState<string>('');
	const [accessToken, setAccessToken] = useState<string>('');
	const [dpopProof, setDpopProof] = useState<DpopProof | null>(null);
	const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
	const [error, setError] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);

	// Initialize mock server
	useEffect(() => {
		mockServer.start();
		return () => mockServer.stop();
	}, [mockServer]);

	// Step 1: Generate Key Pair
	const generateKeyPair = useCallback(() => {
		try {
			const keys = mockServer.generateKeyPair();
			setKeyPair(keys);
			setError('');
			setCurrentStep(1);
		} catch (err) {
			setError('Failed to generate key pair');
			console.error('Key pair generation error:', err);
		}
	}, [mockServer]);

	// Step 2: Create DPoP Proof
	const createDpopProof = useCallback(() => {
		if (!keyPair) return;

		try {
			const nonce = mockServer.generateNonce();
			const proof = mockServer.createDpopProof('POST /dpop/auth', keyPair.privateKey, nonce);
			setDpopProof(proof);
			setError('');
			setCurrentStep(2);
		} catch (err) {
			setError('Failed to create DPoP proof');
			console.error('DPoP proof creation error:', err);
		}
	}, [keyPair, mockServer]);

	// Step 3: Get Authorization Code
	const getAuthorizationCode = useCallback(() => {
		try {
			const code = mockServer.issueAuthorizationCode();
			setAuthorizationCode(code);
			setError('');
			setCurrentStep(3);
		} catch (err) {
			setError('Failed to get authorization code');
			console.error('Authorization code error:', err);
		}
	}, [mockServer]);

	// Step 4: Exchange Code for Token
	const exchangeCodeForToken = useCallback(async () => {
		if (!dpopProof || !authorizationCode) return;

		setIsLoading(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const tokenResponse = mockServer.exchangeCodeForToken(authorizationCode, dpopProof);
			setAccessToken(tokenResponse.access_token);
			setError('');
			setCurrentStep(4);
		} catch (err) {
			setError('Failed to exchange code for token');
			console.error('Token exchange error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [dpopProof, authorizationCode, mockServer]);

	// Step 5: Use Token with DPoP Proof
	const useTokenWithProof = useCallback(async () => {
		if (!accessToken || !dpopProof) return;

		setIsLoading(true);
		try {
			// Create new DPoP proof for resource access
			const nonce = mockServer.generateNonce();
			mockServer.createDpopProof('GET /api/resource', keyPair!.privateKey, nonce);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Introspect token
			const introspection = mockServer.introspectToken(accessToken);

			if (introspection.active) {
				setError('');
				setCurrentStep(5);
			} else {
				setError('Token is not active or invalid');
			}
		} catch (err) {
			setError('Failed to use token with DPoP proof');
			console.error('Token usage error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [accessToken, dpopProof, keyPair, mockServer]);

	// Reset flow
	const resetFlow = useCallback(() => {
		setCurrentStep(0);
		setAuthorizationCode('');
		setAccessToken('');
		setDpopProof(null);
		setKeyPair(null);
		setError('');
		setIsLoading(false);
	}, []);

	const steps = [
		{
			title: 'Generate Key Pair',
			description: 'Create a public/private key pair for DPoP proof generation',
			icon: <FiKey />,
		},
		{
			title: 'Create DPoP Proof',
			description: 'Generate a DPoP proof JWT to demonstrate possession of the private key',
			icon: <FiShield />,
		},
		{
			title: 'Get Authorization Code',
			description: 'Request authorization code from the mock DPoP server',
			icon: <FiRefreshCw />,
		},
		{
			title: 'Exchange Code for Token',
			description: 'Exchange authorization code for DPoP-bound access token',
			icon: <FiUnlock />,
		},
		{
			title: 'Use Token with DPoP',
			description: 'Access protected resource using DPoP-bound token with proof',
			icon: <FiCheckCircle />,
		},
	];

	return (
		<Container>
			<Header>
				<Title>🔐 DPoP Authorization Code Flow (V8)</Title>
				<Subtitle>
					Learn OAuth 2.0 Demonstrating Proof of Possession (DPoP) - RFC 9449. Since PingOne doesn't
					support DPoP natively, this implementation uses a mock server to demonstrate the concept
					and allow hands-on learning.
				</Subtitle>
			</Header>

			<Section>
				<SectionTitle>
					<FiShield />
					About DPoP
				</SectionTitle>
				<InfoBox>
					<strong>What is DPoP?</strong>
					<br />
					DPoP (Demonstrating Proof of Possession) is an OAuth 2.0 security enhancement that binds
					tokens to a cryptographic key pair. This prevents token theft and misuse by requiring the
					client to prove possession of the private key when presenting the token.
				</InfoBox>

				<InfoBox>
					<strong>Key Benefits:</strong>
					<br />• Prevents token replay attacks
					<br />• Protects against token leakage
					<br />• Enables sender-constrained tokens
					<br />• Works with browser-based applications
					<br />• Complements TLS security
				</InfoBox>

				<WarningBox>
					<strong>⚠️ Educational Implementation:</strong>
					<br />
					This is a mock implementation for learning purposes. The "DPoP server" is simulated in the
					browser and does not provide real cryptographic security. In production, use a proper
					OAuth 2.0 authorization server with DPoP support.
				</WarningBox>
			</Section>

			<Section>
				<SectionTitle>
					<FiActivity />
					Flow Progress
				</SectionTitle>

				{steps.map((step, index) => (
					<StepIndicator
						key={index}
						$active={currentStep === index}
						$completed={currentStep > index}
					>
						<StepNumber $active={currentStep === index} $completed={currentStep > index}>
							{currentStep > index ? '✓' : index + 1}
						</StepNumber>
						<StepContent>
							<StepTitle>{step.title}</StepTitle>
							<StepDescription>{step.description}</StepDescription>
						</StepContent>
					</StepIndicator>
				))}
			</Section>

			<Section>
				<SectionTitle>
					<FiCpu />
					Mock DPoP Server Status
				</SectionTitle>

				<div style={{ marginBottom: '1rem' }}>
					<strong>Status: </strong>
					<span
						style={{
							color: mockServer.getState().isRunning ? '#16a34a' : '#dc2626',
							marginLeft: '0.5rem',
						}}
					>
						{mockServer.getState().isRunning ? '🟢 Running' : '🔴 Stopped'}
					</span>
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<strong>Issued Tokens: </strong>
					<span style={{ marginLeft: '0.5rem' }}>{mockServer.getState().issuedTokens.length}</span>
				</div>

				<Button
					onClick={() => mockServer.start()}
					disabled={mockServer.getState().isRunning}
					$variant="secondary"
				>
					Start Server
				</Button>

				<Button
					onClick={() => mockServer.stop()}
					disabled={!mockServer.getState().isRunning}
					$variant="danger"
					style={{ marginLeft: '1rem' }}
				>
					Stop Server
				</Button>
			</Section>

			<Section>
				<SectionTitle>
					<FiKey />
					Step 1: Generate Key Pair
				</SectionTitle>
				<InfoBox>
					<strong>What is a Key Pair?</strong>
					<br />A DPoP key pair consists of a public key and a private key. The private key is used
					to sign DPoP proofs, while the public key is shared with the authorization server to
					verify those signatures. This ensures that only the legitimate key holder can use the
					access token.
					<br />
					<br />
					<strong>Why is this needed?</strong>
					<br />
					DPoP binds access tokens to a specific key pair, preventing token theft and replay
					attacks. Even if someone steals your access token, they can't use it without your private
					key.
				</InfoBox>

				<Button onClick={generateKeyPair} $variant="primary">
					Generate Key Pair
				</Button>

				{keyPair && (
					<div>
						<h4>Generated Key Pair:</h4>
						<TokenDisplay>
							<strong>Public Key:</strong>
							<br />
							{keyPair.publicKey}
							<br />
							<br />
							<strong>Private Key:</strong>
							<br />
							{keyPair.privateKey}
						</TokenDisplay>
						<InfoBox>
							<strong>🔐 Security Note:</strong> In a real application, the private key should be
							stored securely and never exposed. This educational demo shows both keys for learning
							purposes.
						</InfoBox>
					</div>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiShield />
					Step 2: Create DPoP Proof
				</SectionTitle>
				<InfoBox>
					Create a DPoP proof JWT that demonstrates possession of the private key. The proof
					includes HTTP method, timestamp, nonce, and is signed with the private key.
				</InfoBox>

				<Button onClick={createDpopProof} $variant="primary">
					Create DPoP Proof
				</Button>

				<div>
					<h4>DPoP Proof JWT:</h4>
					<ProofDisplay>
						{dpopProof ? JSON.stringify(dpopProof, null, 2) : 'No DPoP proof generated yet'}
					</ProofDisplay>

					<Grid>
						<Column>
							<strong>Header:</strong>
							<br />
							{dpopProof?.htm}
						</Column>
						<Column>
							<strong>Type:</strong>
							<br />
							{dpopProof?.typ}
						</Column>
						<Column>
							<strong>Algorithm:</strong>
							<br />
							{dpopProof?.alg}
						</Column>
						<Column>
							<strong>Expires:</strong>
							<br />
							{dpopProof?.exp ? new Date(dpopProof.exp * 1000).toLocaleString() : 'N/A'}
						</Column>
						<Column>
							<strong>Nonce:</strong>
							<br />
							{dpopProof?.nonce || 'None'}
						</Column>
					</Grid>
					<InfoBox>
						<strong>📝 How it works:</strong> The server verifies this proof by checking the
						signature against your public key, ensuring you possess the private key.
					</InfoBox>
				</div>
			</Section>

			<Section>
				<SectionTitle>
					<FiRefreshCw />
					Step 3: Get Authorization Code
				</SectionTitle>
				<InfoBox>
					Request an authorization code from the mock DPoP server. In a real implementation, this
					would redirect the user to the authorization server.
				</InfoBox>

				<Button onClick={getAuthorizationCode} $variant="primary">
					Get Authorization Code
				</Button>

				{authorizationCode && (
					<div>
						<h4>Authorization Code:</h4>
						<TokenDisplay>{authorizationCode}</TokenDisplay>

						<InfoBox>
							This code would normally be exchanged for an access token at the token endpoint. In
							this demo, you'll exchange it in the next step.
						</InfoBox>
					</div>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiUnlock />
					Step 4: Exchange Code for Token
				</SectionTitle>
				<InfoBox>
					Exchange the authorization code for a DPoP-bound access token. The token will be bound to
					your public key via the DPoP proof.
				</InfoBox>

				<Button onClick={exchangeCodeForToken} $variant="primary" disabled={isLoading}>
					{isLoading ? 'Exchanging...' : 'Exchange Code for Token'}
				</Button>

				{accessToken && (
					<div>
						<h4>Access Token:</h4>
						<TokenDisplay>{accessToken}</TokenDisplay>

						<Grid>
							<Column>
								<strong>Type:</strong>
								<br />
								{
									mockServer.getState().issuedTokens[mockServer.getState().issuedTokens.length - 1]
										?.token_type
								}
							</Column>
							<Column>
								<strong>Scope:</strong>
								<br />
								{
									mockServer.getState().issuedTokens[mockServer.getState().issuedTokens.length - 1]
										?.scope
								}
							</Column>
							<Column>
								<strong>DPoP JKT:</strong>
								<br />
								{
									mockServer.getState().issuedTokens[mockServer.getState().issuedTokens.length - 1]
										?.dpop_jkt
								}
							</Column>
						</Grid>

						<SuccessBox>
							✅ Token successfully bound to your public key! The token can only be used by someone
							who possesses the corresponding private key.
						</SuccessBox>
					</div>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiCheckCircle />
					Step 5: Use Token with DPoP
				</SectionTitle>
				<InfoBox>
					Access a protected resource using the DPoP-bound token. Each request must include a fresh
					DPoP proof to demonstrate possession of the private key.
				</InfoBox>

				<Button onClick={useTokenWithProof} $variant="primary" disabled={isLoading}>
					{isLoading ? 'Accessing Resource...' : 'Access Protected Resource'}
				</Button>

				<div>
					<h4>Resource Access Successful!</h4>
					<SuccessBox>
						✅ You successfully demonstrated the complete DPoP flow:
						<br />
						1. Generated key pair
						<br />
						2. Created DPoP proof
						<br />
						3. Obtained authorization code
						<br />
						4. Exchanged for DPoP-bound token
						<br />
						5. Used token with DPoP proof
					</SuccessBox>
				</div>
				<Button onClick={resetFlow} $variant="secondary">
					Start Over
				</Button>
			</Section>

			{error && (
				<Section>
					<SectionTitle>
						<FiAlertTriangle />
						Error
					</SectionTitle>
					<ErrorBox>{error}</ErrorBox>
					<Button onClick={resetFlow} $variant="secondary">
						Try Again
					</Button>
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiBook />
					Server Logs
				</SectionTitle>
				<div
					style={{
						background: '#1f2937',
						color: '#f3f4f6',
						borderRadius: '8px',
						padding: '1rem',
						maxHeight: '300px',
						overflowY: 'auto',
						fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
						fontSize: '0.75rem',
						lineHeight: '1.4',
					}}
				>
					{mockServer.getLogs().map((log, index) => (
						<div key={index} style={{ marginBottom: '0.5rem' }}>
							{log}
						</div>
					))}
				</div>
			</Section>

			<Section>
				<SectionTitle>
					<FiCode />
					Learn More About DPoP
				</SectionTitle>
				<InfoBox>
					<strong>Official Resources:</strong>
					<br />•{' '}
					<a
						href="https://www.rfc-editor.org/rfc/rfc9449.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						RFC 9449 - OAuth 2.0 Demonstrating Proof of Possession (DPoP)
					</a>
					<br />•{' '}
					<a href="https://www.pingidentity.com/pingone/" target="_blank" rel="noopener noreferrer">
						PingOne Documentation
					</a>
				</InfoBox>

				<InfoBox>
					<strong>Key Concepts:</strong>
					<br />- <strong>DPoP Proof JWT:</strong> Signed JWT demonstrating key possession
					<br />- <strong>Token Binding:</strong> Access tokens bound to public keys
					<br />- <strong>Nonce:</strong> Server-provided value to prevent pre-computed proofs
					<br />
					<strong>HTM:</strong> HTTP method and target URI
					<br />- <strong>JKT:</strong> JSON Web Key Thumbprint for key identification
				</InfoBox>

				<InfoBox>
					<strong>Implementation Notes:</strong>
					<br />- This demo uses mock cryptography for educational purposes
					<br />- Real implementations should use proper crypto libraries
					<br />- DPoP complements but does not replace TLS security
					<br />- PingOne does not currently support DPoP natively
				</InfoBox>
			</Section>
		</Container>
	);
};

export default DpopAuthorizationCodeFlowV8;
