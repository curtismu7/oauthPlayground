import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { jwtAuthServiceV8 } from '../../services/jwtAuthServiceV8';
import { PingOneJWTService } from '../../services/pingOneJWTService';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ExampleCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const ExampleTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ExampleDescription = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const Button = styled.button`
  background: #007bff;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-right: 1rem;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
    color: #ffffff;
  }

  &:disabled {
    background: #6c757d;
    color: #ffffff;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: #6c757d;

  &:hover {
    background: #545b62;
    color: #ffffff;
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c757d;
  color: #ffffff !important;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #545b62;
    color: #ffffff !important;
  }
`;

const ResultArea = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

const Input = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  resize: vertical;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  
  ${(props) =>
		props.type === 'success' &&
		`
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}
  
  ${(props) =>
		props.type === 'error' &&
		`
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
  
  ${(props) =>
		props.type === 'info' &&
		`
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  `}
`;

const JWTExamples: React.FC = () => {
	const [privateKey, setPrivateKey] = useState('');
	const [keyId, setKeyId] = useState('');
	const [generatedJWT, setGeneratedJWT] = useState('');
	const [keyPair, setKeyPair] = useState('');
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
		setStatus({ type, message });
		setTimeout(() => setStatus(null), 5000);
	};

	const handleGenerateKeyPair = async () => {
		setIsLoading(true);
		try {
			const generatedKeyPair = await PingOneJWTService.generateRSAKeyPair(2048);
			setKeyPair(JSON.stringify(generatedKeyPair, null, 2));
			setPrivateKey(generatedKeyPair.privateKey || '');
			setKeyId(generatedKeyPair.keyId || '');
			showStatus('success', 'RSA key pair generated successfully!');
		} catch (error) {
			showStatus('error', `Failed to generate key pair: ${error}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGeneratePrivateKeyJWT = async () => {
		if (!privateKey || !keyId) {
			showStatus('error', 'Please generate a key pair first or enter private key and key ID');
			return;
		}

		setIsLoading(true);
		try {
			const config = {
				clientId: 'test-client-id',
				tokenEndpoint: 'https://auth.pingone.com/oauth2/token',
				privateKey,
				keyId,
			};

			const result = await jwtAuthServiceV8.generatePrivateKeyJWT(config);
			if (result.success && result.jwt) {
				setGeneratedJWT(result.jwt);
				showStatus('success', 'Private Key JWT generated successfully!');
			} else {
				showStatus('error', `Failed to generate JWT: ${result.error}`);
			}
		} catch (error) {
			showStatus('error', `Error generating JWT: ${error}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleValidatePrivateKey = () => {
		const isValid = jwtAuthServiceV8.validatePrivateKey(privateKey);
		showStatus(
			isValid ? 'success' : 'error',
			isValid ? 'Private key format is valid!' : 'Invalid private key format'
		);
	};

	const handleDecodeToken = () => {
		if (!generatedJWT) {
			showStatus('error', 'Please generate a JWT first');
			return;
		}

		try {
			// Since decode methods are private, we'll create a simple decoder
			const parts = generatedJWT.split('.');
			if (parts.length !== 3) {
				showStatus('error', 'Invalid JWT format');
				return;
			}

			try {
				const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
				const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));

				const decoded = {
					header,
					payload,
					decoded: true,
				};

				setGeneratedJWT(JSON.stringify(decoded, null, 2));
				showStatus('success', 'Token decoded successfully!');
			} catch (decodeError) {
				showStatus('error', `Failed to decode token: ${decodeError}`);
			}
		} catch (error) {
			showStatus('error', `Failed to decode token: ${error}`);
		}
	};

	return (
		<Container>
			<BackButton to="/sdk-examples">← Back to SDK Examples</BackButton>
			<Header>JWT Authentication Examples</Header>
			<Description>
				Explore comprehensive JWT implementation examples including private key JWT generation,
				client secret JWT, token validation, and secure key management using the jose library and
				custom PingOne JWT services.
			</Description>

			{status && <StatusMessage type={status.type}>{status.message}</StatusMessage>}

			<ExamplesGrid>
				<ExampleCard>
					<ExampleTitle>Key Pair Generation</ExampleTitle>
					<ExampleDescription>
						Generate RSA key pairs for private key JWT authentication. The keys are generated using
						the PingOne JWT service with proper key ID management.
					</ExampleDescription>

					<Button onClick={handleGenerateKeyPair} disabled={isLoading}>
						{isLoading ? 'Generating...' : 'Generate RSA Key Pair'}
					</Button>

					{keyPair && <ResultArea>{keyPair}</ResultArea>}
				</ExampleCard>

				<ExampleCard>
					<ExampleTitle>Private Key JWT Generation</ExampleTitle>
					<ExampleDescription>
						Generate JWT tokens using private key authentication for OAuth 2.0 client
						authentication. This follows the RFC 7523 standard for JWT-based client authentication.
					</ExampleDescription>

					<InputGroup>
						<Label>Private Key:</Label>
						<Input
							value={privateKey}
							onChange={(e) => setPrivateKey(e.target.value)}
							placeholder="Enter private key or generate one above"
						/>
					</InputGroup>

					<InputGroup>
						<Label>Key ID:</Label>
						<Input
							value={keyId}
							onChange={(e) => setKeyId(e.target.value)}
							placeholder="Enter key ID or generate one above"
						/>
					</InputGroup>

					<Button onClick={handleGeneratePrivateKeyJWT} disabled={isLoading}>
						{isLoading ? 'Generating...' : 'Generate Private Key JWT'}
					</Button>

					{generatedJWT && <ResultArea>{generatedJWT}</ResultArea>}
				</ExampleCard>

				<ExampleCard>
					<ExampleTitle>Token Validation</ExampleTitle>
					<ExampleDescription>
						Validate private key format and decode JWT tokens to inspect headers and payloads. This
						helps with debugging and understanding token structure.
					</ExampleDescription>

					<Button onClick={handleValidatePrivateKey}>Validate Private Key Format</Button>

					<Button onClick={handleDecodeToken}>Decode JWT Token</Button>

					<SecondaryButton onClick={() => setGeneratedJWT('')}>Clear Results</SecondaryButton>
				</ExampleCard>

				<ExampleCard>
					<ExampleTitle>Usage Examples</ExampleTitle>
					<ExampleDescription>
						See how to use JWT authentication in real OAuth flows and API calls. These examples show
						integration patterns with PingOne services.
					</ExampleDescription>

					<ResultArea>{`// Private Key JWT for Client Authentication
const authResult = await applyClientAuthentication({
  method: 'private_key_jwt',
  clientId: credentials.clientId,
  privateKey: credentials.privateKey,
  keyId: credentials.keyId,
  tokenEndpoint,
});

// Generate JWT for custom claims
const customJWT = await PingOneJWTService.createPrivateKeyJWT({
  clientId: 'your-client-id',
  audience: 'https://auth.pingone.com/oauth2/token',
  privateKey: 'your-private-key',
  keyId: 'your-key-id',
  expiresIn: 3600,
  customClaims: {
    scope: 'openid profile email',
    purpose: 'api-access'
  }
});`}</ResultArea>
				</ExampleCard>
			</ExamplesGrid>

			<div
				style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', marginTop: '3rem' }}
			>
				<h2>Security Best Practices</h2>
				<ul style={{ color: '#666', lineHeight: '1.6' }}>
					<li>Never log private keys or JWT tokens to console</li>
					<li>Store private keys securely using environment variables or secure storage</li>
					<li>Use appropriate key sizes (2048 bits minimum for RSA)</li>
					<li>Validate all JWT tokens before using them</li>
					<li>Implement proper token expiration and refresh mechanisms</li>
					<li>Use HTTPS for all token exchanges</li>
				</ul>
			</div>
		</Container>
	);
};

export default JWTExamples;
