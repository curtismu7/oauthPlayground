import React, { useState } from 'react';
import { FiAlertCircle, FiCheck, FiCopy, FiEye, FiKey, FiRefreshCw, FiTool } from 'react-icons/fi';
import styled from 'styled-components';
import { generateCodeChallenge, generateRandomString, parseJwt } from '../utils/oauth';
import { Card, CardBody, CardHeader } from './Card';

const UtilitiesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const UtilityCard = styled(Card)`
  height: fit-content;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.monospace};
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${({ $variant, theme }) => {
		switch ($variant) {
			case 'success':
				return theme.colors.success;
			case 'secondary':
				return theme.colors.gray200;
			default:
				return theme.colors.primary;
		}
	}};
  color: ${({ $variant, theme }) => ($variant === 'secondary' ? theme.colors.gray700 : 'white')};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultBox = styled.div<{ $type?: 'success' | 'error' | 'info' }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.375rem;
  background-color: ${({ $type, theme }) => {
		switch ($type) {
			case 'success':
				return theme.colors.success + '10';
			case 'error':
				return theme.colors.danger + '10';
			default:
				return theme.colors.info + '10';
		}
	}};
  border: 1px solid ${({ $type, theme }) => {
		switch ($type) {
			case 'success':
				return theme.colors.success + '40';
			case 'error':
				return theme.colors.danger + '40';
			default:
				return theme.colors.info + '40';
		}
	}};

  pre {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.monospace};
    font-size: 0.875rem;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const CopyableField = styled.div`
  position: relative;
  margin-top: 0.5rem;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray200};
  }
`;

const OAuthUtilities: React.FC = () => {
	// JWT Decoder State
	const [jwtInput, setJwtInput] = useState('');
	const [decodedJwt, setDecodedJwt] = useState<{
		header: Record<string, unknown>;
		payload: Record<string, unknown>;
	} | null>(null);
	const [jwtError, setJwtError] = useState('');

	// PKCE Generator State
	const [codeVerifier, setCodeVerifier] = useState('');
	const [codeChallenge, setCodeChallenge] = useState('');
	const [pkceError, setPkceError] = useState('');

	// Random String Generator State
	const [stringLength, setStringLength] = useState(32);
	const [randomString, setRandomString] = useState('');

	// Copy State
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Helper function to decode JWT parts
	const parseJwtPart = (part: string) => {
		try {
			// Add padding if needed
			let base64 = part.replace(/-/g, '+').replace(/_/g, '/');
			while (base64.length % 4) {
				base64 += '=';
			}

			// Use modern base64 decoding
			let decoded;
			if (typeof window !== 'undefined' && window.btoa) {
				// Browser environment
				decoded = atob(base64);
			} else {
				// Node.js environment or fallback
				decoded = Buffer.from(base64, 'base64').toString('binary');
			}

			// Convert to UTF-8 string
			const jsonPayload = decodeURIComponent(
				Array.from(decoded, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
			);

			const parsed = JSON.parse(jsonPayload);
			console.log(' [JWT Decoder] Successfully parsed JWT part:', {
				part: part.substring(0, 20) + '...',
				result: parsed,
			});
			return parsed;
		} catch (e) {
			console.error(
				' [JWT Decoder] Error parsing JWT part:',
				e,
				'Part:',
				part.substring(0, 20) + '...'
			);
			return null;
		}
	};

	const handleDecodeJWT = () => {
		try {
			setJwtError('');
			setDecodedJwt(null); // Clear previous results

			if (!jwtInput.trim()) {
				setJwtError('Please enter a JWT token');
				return;
			}

			const token = jwtInput.trim();
			console.log(' [JWT Decoder] Attempting to decode token:', token.substring(0, 50) + '...');

			const parts = token.split('.');
			console.log(' [JWT Decoder] Token parts count:', parts.length);

			if (parts.length !== 3) {
				setJwtError('Invalid JWT format: token must have 3 parts separated by dots');
				return;
			}

			// Decode header
			console.log(' [JWT Decoder] Decoding header part:', parts[0].substring(0, 20) + '...');
			const header = parseJwtPart(parts[0]);
			if (!header) {
				setJwtError('Failed to decode JWT header');
				return;
			}

			// Decode payload
			console.log(' [JWT Decoder] Decoding payload part:', parts[1].substring(0, 20) + '...');
			const payload = parseJwtPart(parts[1]);
			if (!payload) {
				setJwtError('Failed to decode JWT payload');
				return;
			}

			console.log(' [JWT Decoder] Successfully decoded JWT:', { header, payload });
			setDecodedJwt({ header, payload });
			setJwtError(''); // Clear any previous errors
		} catch (error) {
			console.error(' [JWT Decoder] Error in handleDecodeJWT:', error);
			setJwtError('Failed to decode JWT: ' + (error as Error).message);
			setDecodedJwt(null);
		}
	};

	const handleGeneratePKCE = async () => {
		try {
			setPkceError('');
			const verifier = generateRandomString(64);
			const challenge = await generateCodeChallenge(verifier);

			setCodeVerifier(verifier);
			setCodeChallenge(challenge);
		} catch (error) {
			setPkceError('Failed to generate PKCE: ' + (error as Error).message);
		}
	};

	const handleGenerateRandomString = () => {
		const newString = generateRandomString(stringLength);
		setRandomString(newString);
	};

	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	return (
		<div>
			<h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
				<FiTool /> OAuth Development Utilities
			</h2>

			<UtilitiesContainer>
				{/* JWT Decoder */}
				<UtilityCard>
					<CardHeader>
						<h3>
							<FiEye /> JWT Token Decoder
						</h3>
					</CardHeader>
					<CardBody>
						<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
							Decode and inspect JWT tokens (ID tokens, access tokens) to view their claims and
							metadata.
						</p>

						<InputGroup>
							<label htmlFor="jwt-input">JWT Token</label>
							<TextArea
								id="jwt-input"
								placeholder="Paste your JWT token here..."
								value={jwtInput}
								onChange={(e) => setJwtInput(e.target.value)}
							/>
						</InputGroup>

						<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
							<Button onClick={handleDecodeJWT}>
								<FiEye size={16} />
								Decode JWT
							</Button>
							<Button
								$variant="secondary"
								onClick={() => {
									const sampleToken =
										'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
									setJwtInput(sampleToken);
									console.log(' [JWT Decoder] Loaded sample token for testing');
								}}
							>
								Load Sample Token
							</Button>
						</div>

						{jwtError && (
							<ResultBox $type="error">
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									<FiAlertCircle size={16} />
									{jwtError}
								</div>
							</ResultBox>
						)}

						{decodedJwt && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
								{/* Header Section */}
								<ResultBox $type="info">
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '0.5rem',
										}}
									>
										<strong>Header:</strong>
										<CopyButton
											onClick={() =>
												handleCopy(JSON.stringify(decodedJwt.header, null, 2), 'header')
											}
										>
											{copiedField === 'header' ? <FiCheck size={12} /> : <FiCopy size={12} />}
											{copiedField === 'header' ? 'Copied!' : 'Copy'}
										</CopyButton>
									</div>
									<pre
										style={{
											margin: 0,
											fontSize: '0.875rem',
											lineHeight: '1.4',
											backgroundColor: '#000000',
											color: '#ffffff',
											padding: '0.75rem',
											borderRadius: '0.25rem',
											border: '2px solid #374151',
											overflow: 'auto',
											fontFamily: 'monospace',
										}}
									>
										{JSON.stringify(decodedJwt.header, null, 2)}
									</pre>
								</ResultBox>

								{/* Payload Section */}
								<ResultBox $type="success">
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '0.5rem',
										}}
									>
										<strong>Payload:</strong>
										<CopyButton
											onClick={() =>
												handleCopy(JSON.stringify(decodedJwt.payload, null, 2), 'payload')
											}
										>
											{copiedField === 'payload' ? <FiCheck size={12} /> : <FiCopy size={12} />}
											{copiedField === 'payload' ? 'Copied!' : 'Copy'}
										</CopyButton>
									</div>
									<pre
										style={{
											margin: 0,
											fontSize: '0.875rem',
											lineHeight: '1.4',
											backgroundColor: '#ffffff',
											color: '#000000',
											padding: '0.75rem',
											borderRadius: '0.25rem',
											border: '2px solid #e5e7eb',
											overflow: 'auto',
											fontFamily: 'monospace',
										}}
									>
										{JSON.stringify(decodedJwt.payload, null, 2)}
									</pre>
								</ResultBox>

								{/* Full Token Copy */}
								<div style={{ textAlign: 'center' }}>
									<CopyButton
										onClick={() => handleCopy(JSON.stringify(decodedJwt, null, 2), 'full')}
									>
										{copiedField === 'full' ? <FiCheck size={12} /> : <FiCopy size={12} />}
										{copiedField === 'full' ? 'Copied!' : 'Copy Full Decoded JWT'}
									</CopyButton>
								</div>
							</div>
						)}
					</CardBody>
				</UtilityCard>

				{/* PKCE Generator */}
				<UtilityCard>
					<CardHeader>
						<h3>
							<FiKey /> PKCE Code Generator
						</h3>
					</CardHeader>
					<CardBody>
						<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
							Generate PKCE (Proof Key for Code Exchange) code verifier and code challenge for
							secure OAuth flows.
						</p>

						<Button onClick={handleGeneratePKCE}>
							<FiRefreshCw size={16} />
							Generate PKCE Pair
						</Button>

						{pkceError && (
							<ResultBox $type="error">
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									<FiAlertCircle size={16} />
									{pkceError}
								</div>
							</ResultBox>
						)}

						{codeVerifier && (
							<div>
								<ResultBox $type="info">
									<div style={{ marginBottom: '1rem' }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: '0.5rem',
											}}
										>
											<strong>Code Verifier:</strong>
											<CopyButton onClick={() => handleCopy(codeVerifier, 'verifier')}>
												{copiedField === 'verifier' ? <FiCheck size={12} /> : <FiCopy size={12} />}
												{copiedField === 'verifier' ? 'Copied!' : 'Copy'}
											</CopyButton>
										</div>
										<pre style={{ marginBottom: '1rem' }}>{codeVerifier}</pre>

										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: '0.5rem',
											}}
										>
											<strong>Code Challenge (S256):</strong>
											<CopyButton onClick={() => handleCopy(codeChallenge, 'challenge')}>
												{copiedField === 'challenge' ? <FiCheck size={12} /> : <FiCopy size={12} />}
												{copiedField === 'challenge' ? 'Copied!' : 'Copy'}
											</CopyButton>
										</div>
										<pre>{codeChallenge}</pre>
									</div>
								</ResultBox>
							</div>
						)}
					</CardBody>
				</UtilityCard>

				{/* Random String Generator */}
				<UtilityCard>
					<CardHeader>
						<h3>
							<FiRefreshCw /> Random String Generator
						</h3>
					</CardHeader>
					<CardBody>
						<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
							Generate cryptographically secure random strings for state parameters, nonces, and
							other OAuth security tokens.
						</p>

						<InputGroup>
							<label htmlFor="string-length">String Length</label>
							<Input
								id="string-length"
								type="number"
								min="8"
								max="128"
								value={stringLength}
								onChange={(e) => setStringLength(parseInt(e.target.value) || 32)}
							/>
						</InputGroup>

						<Button onClick={handleGenerateRandomString}>
							<FiRefreshCw size={16} />
							Generate Random String
						</Button>

						{randomString && (
							<ResultBox $type="info">
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: '0.5rem',
									}}
								>
									<strong>Generated String ({randomString.length} characters):</strong>
									<CopyButton onClick={() => handleCopy(randomString, 'random')}>
										{copiedField === 'random' ? <FiCheck size={12} /> : <FiCopy size={12} />}
										{copiedField === 'random' ? 'Copied!' : 'Copy'}
									</CopyButton>
								</div>
								<pre>{randomString}</pre>
							</ResultBox>
						)}
					</CardBody>
				</UtilityCard>

				{/* URL Decoder */}
				<UtilityCard>
					<CardHeader>
						<h3>
							<FiEye /> URL Parameter Decoder
						</h3>
					</CardHeader>
					<CardBody>
						<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
							Decode and analyze OAuth callback URLs to inspect authorization responses and error
							details.
						</p>

						<InputGroup>
							<label htmlFor="url-input">OAuth Callback URL</label>
							<TextArea
								id="url-input"
								placeholder="Paste OAuth callback URL here..."
								style={{ minHeight: '80px' }}
							/>
						</InputGroup>

						<Button>
							<FiEye size={16} />
							Decode URL
						</Button>

						<ResultBox $type="info">
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '0.5rem',
								}}
							>
								<strong>URL Parameters:</strong>
								<CopyButton>
									<FiCopy size={12} />
									Copy
								</CopyButton>
							</div>
							<pre>// Decoded parameters will appear here</pre>
						</ResultBox>
					</CardBody>
				</UtilityCard>
			</UtilitiesContainer>
		</div>
	);
};

export default OAuthUtilities;
