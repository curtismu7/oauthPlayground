import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import styled from 'styled-components';
import { jwtGenerator } from '../utils/jwtGenerator';
import JWKSConverter from './JWKSConverter';

const GeneratorContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const GeneratorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const GeneratorTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
  color: ${({ $active }) => ($active ? '#3b82f6' : '#6b7280')};
  
  &:hover {
    color: #3b82f6;
  }
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case 'secondary':
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
		}
	}}
`;

const OutputContainer = styled.div`
  margin-top: 1.5rem;
`;

const OutputTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 0.75rem 0;
  max-height: 300px;
  overflow-y: auto;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Alert = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  
  ${({ $type }) => {
		switch ($type) {
			case 'info':
				return `
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
			case 'success':
				return `
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        `;
			case 'warning':
				return `
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        `;
			case 'error':
				return `
          background-color: #fecaca;
          color: #991b1b;
          border: 1px solid #fca5a5;
        `;
		}
	}}
`;

const JWTGenerator: React.FC = () => {
	const [activeTab, setActiveTab] = useState<
		'login-hint' | 'request-object' | 'client-secret' | 'private-key' | 'jwks'
	>('login-hint');
	const [generatedJWT, setGeneratedJWT] = useState<string>('');
	const [message, setMessage] = useState<{
		type: 'info' | 'success' | 'warning' | 'error';
		text: string;
	} | null>(null);
	const [showSecret, setShowSecret] = useState<boolean>(false);

	// Form states
	const [loginHintForm, setLoginHintForm] = useState({
		loginHint: '',
		issuer: 'oauth-playground',
		audience: 'pingone',
		subject: 'user',
		acrValues: '',
		prompt: '',
		maxAge: '',
		expiryMinutes: '5',
	});

	const [requestObjectForm, setRequestObjectForm] = useState({
		clientId: '',
		responseType: 'code',
		redirectUri: '',
		scope: 'openid profile email',
		issuer: '',
		audience: 'pingone',
		subject: '',
		state: '',
		nonce: '',
		codeChallenge: '',
		codeChallengeMethod: 'S256',
		acrValues: '',
		prompt: '',
		maxAge: '',
		uiLocales: '',
		expiryMinutes: '5',
	});

	const [clientSecretForm, setClientSecretForm] = useState({
		clientId: '',
		tokenEndpoint: '',
		clientSecret: '',
		issuer: '',
		subject: '',
		expiryMinutes: '5',
	});

	const [privateKeyForm, setPrivateKeyForm] = useState({
		clientId: '',
		tokenEndpoint: '',
		privateKey: '',
		issuer: '',
		subject: '',
		keyId: 'default',
		expiryMinutes: '5',
	});

	const [jwksForm, _setJwksForm] = useState({
		keys: JSON.stringify(
			[
				{
					kty: 'RSA',
					kid: 'default',
					use: 'sig',
					alg: 'RS256',
					n: 'sample_modulus',
					e: 'AQAB',
				},
			],
			null,
			2
		),
	});

	const handleGenerateLoginHintToken = () => {
		try {
			if (!loginHintForm.loginHint) {
				setMessage({ type: 'warning', text: 'Please enter a login hint' });
				return;
			}

			const jwt = jwtGenerator.generateLoginHintToken(loginHintForm.loginHint, {
				issuer: loginHintForm.issuer,
				audience: loginHintForm.audience,
				subject: loginHintForm.subject,
				acrValues: loginHintForm.acrValues || undefined,
				prompt: loginHintForm.prompt || undefined,
				maxAge: loginHintForm.maxAge ? parseInt(loginHintForm.maxAge, 10) : undefined,
				expiryMinutes: parseInt(loginHintForm.expiryMinutes, 10),
			});

			setGeneratedJWT(jwt);
			setMessage({ type: 'success', text: 'Login hint token generated successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleGenerateRequestObject = () => {
		try {
			if (
				!requestObjectForm.clientId ||
				!requestObjectForm.redirectUri ||
				!requestObjectForm.scope
			) {
				setMessage({
					type: 'warning',
					text: 'Please fill in required fields (Client ID, Redirect URI, Scope)',
				});
				return;
			}

			const jwt = jwtGenerator.generateRequestObject(
				requestObjectForm.clientId,
				requestObjectForm.responseType,
				requestObjectForm.redirectUri,
				requestObjectForm.scope,
				{
					issuer: requestObjectForm.issuer || requestObjectForm.clientId,
					audience: requestObjectForm.audience,
					subject: requestObjectForm.subject || requestObjectForm.clientId,
					state: requestObjectForm.state || undefined,
					nonce: requestObjectForm.nonce || undefined,
					codeChallenge: requestObjectForm.codeChallenge || undefined,
					codeChallengeMethod: requestObjectForm.codeChallengeMethod || undefined,
					acrValues: requestObjectForm.acrValues || undefined,
					prompt: requestObjectForm.prompt || undefined,
					maxAge: requestObjectForm.maxAge ? parseInt(requestObjectForm.maxAge, 10) : undefined,
					uiLocales: requestObjectForm.uiLocales || undefined,
					expiryMinutes: parseInt(requestObjectForm.expiryMinutes, 10),
				}
			);

			setGeneratedJWT(jwt);
			setMessage({ type: 'success', text: 'Request object generated successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleGenerateClientSecretJWT = () => {
		try {
			if (
				!clientSecretForm.clientId ||
				!clientSecretForm.tokenEndpoint ||
				!clientSecretForm.clientSecret
			) {
				setMessage({
					type: 'warning',
					text: 'Please fill in required fields (Client ID, Token Endpoint, Client Secret)',
				});
				return;
			}

			const jwt = jwtGenerator.generateClientSecretJWT(
				clientSecretForm.clientId,
				clientSecretForm.tokenEndpoint,
				clientSecretForm.clientSecret,
				{
					issuer: clientSecretForm.issuer || clientSecretForm.clientId,
					subject: clientSecretForm.subject || clientSecretForm.clientId,
					expiryMinutes: parseInt(clientSecretForm.expiryMinutes, 10),
				}
			);

			setGeneratedJWT(jwt);
			setMessage({ type: 'success', text: 'Client secret JWT generated successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleGeneratePrivateKeyJWT = () => {
		try {
			if (!privateKeyForm.clientId || !privateKeyForm.tokenEndpoint || !privateKeyForm.privateKey) {
				setMessage({
					type: 'warning',
					text: 'Please fill in required fields (Client ID, Token Endpoint, Private Key)',
				});
				return;
			}

			const jwt = jwtGenerator.generatePrivateKeyJWT(
				privateKeyForm.clientId,
				privateKeyForm.tokenEndpoint,
				privateKeyForm.privateKey,
				{
					issuer: privateKeyForm.issuer || privateKeyForm.clientId,
					subject: privateKeyForm.subject || privateKeyForm.clientId,
					keyId: privateKeyForm.keyId,
					expiryMinutes: parseInt(privateKeyForm.expiryMinutes, 10),
				}
			);

			setGeneratedJWT(jwt);
			setMessage({ type: 'success', text: 'Private key JWT generated successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleGenerateJWKS = () => {
		try {
			const keys = JSON.parse(jwksForm.keys);
			const jwks = jwtGenerator.generateJWKSString(keys);
			setGeneratedJWT(jwks);
			setMessage({ type: 'success', text: 'JWKS generated successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Generation failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
			});
		}
	};

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatedJWT);
			setMessage({ type: 'success', text: 'JWT copied to clipboard' });
		} catch (_error) {
			setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
		}
	};

	const handleDownload = () => {
		const blob = new Blob([generatedJWT], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `jwt-${activeTab}-${new Date().toISOString().split('T')[0]}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const renderLoginHintForm = () => (
		<FormContainer>
			<FormSection>
				<FormGroup>
					<Label>Login Hint *</Label>
					<Input
						type="text"
						value={loginHintForm.loginHint}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, loginHint: e.target.value }))}
						placeholder="user@example.com"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Issuer</Label>
					<Input
						type="text"
						value={loginHintForm.issuer}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, issuer: e.target.value }))}
					/>
				</FormGroup>
				<FormGroup>
					<Label>Audience</Label>
					<Input
						type="text"
						value={loginHintForm.audience}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, audience: e.target.value }))}
					/>
				</FormGroup>
				<FormGroup>
					<Label>Subject</Label>
					<Input
						type="text"
						value={loginHintForm.subject}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, subject: e.target.value }))}
					/>
				</FormGroup>
			</FormSection>
			<FormSection>
				<FormGroup>
					<Label>ACR Values</Label>
					<Input
						type="text"
						value={loginHintForm.acrValues}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, acrValues: e.target.value }))}
						placeholder="urn:mace:pingidentity.com:loc:1"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Prompt</Label>
					<Select
						value={loginHintForm.prompt}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, prompt: e.target.value }))}
					>
						<option value="">None</option>
						<option value="none">none</option>
						<option value="login">login</option>
						<option value="consent">consent</option>
						<option value="select_account">select_account</option>
					</Select>
				</FormGroup>
				<FormGroup>
					<Label>Max Age (seconds)</Label>
					<Input
						type="number"
						value={loginHintForm.maxAge}
						onChange={(e) => setLoginHintForm((prev) => ({ ...prev, maxAge: e.target.value }))}
						placeholder="3600"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Expiry (minutes)</Label>
					<Input
						type="number"
						value={loginHintForm.expiryMinutes}
						onChange={(e) =>
							setLoginHintForm((prev) => ({ ...prev, expiryMinutes: e.target.value }))
						}
					/>
				</FormGroup>
			</FormSection>
		</FormContainer>
	);

	const renderRequestObjectForm = () => (
		<FormContainer>
			<FormSection>
				<FormGroup>
					<Label>Client ID *</Label>
					<Input
						type="text"
						value={requestObjectForm.clientId}
						onChange={(e) =>
							setRequestObjectForm((prev) => ({ ...prev, clientId: e.target.value }))
						}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Response Type</Label>
					<Select
						value={requestObjectForm.responseType}
						onChange={(e) =>
							setRequestObjectForm((prev) => ({ ...prev, responseType: e.target.value }))
						}
					>
						<option value="code">code</option>
						<option value="token">token</option>
						<option value="id_token">id_token</option>
						<option value="code token">code token</option>
						<option value="code id_token">code id_token</option>
						<option value="token id_token">token id_token</option>
						<option value="code token id_token">code token id_token</option>
					</Select>
				</FormGroup>
				<FormGroup>
					<Label>Redirect URI *</Label>
					<Input
						type="url"
						value={requestObjectForm.redirectUri}
						onChange={(e) =>
							setRequestObjectForm((prev) => ({ ...prev, redirectUri: e.target.value }))
						}
						placeholder="http://localhost:3000/callback"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Scope *</Label>
					<Input
						type="text"
						value={requestObjectForm.scope}
						onChange={(e) => setRequestObjectForm((prev) => ({ ...prev, scope: e.target.value }))}
						placeholder="openid profile email"
					/>
				</FormGroup>
				<FormGroup>
					<Label>State</Label>
					<Input
						type="text"
						value={requestObjectForm.state}
						onChange={(e) => setRequestObjectForm((prev) => ({ ...prev, state: e.target.value }))}
						placeholder="random-state-value"
					/>
				</FormGroup>
			</FormSection>
			<FormSection>
				<FormGroup>
					<Label>Nonce</Label>
					<Input
						type="text"
						value={requestObjectForm.nonce}
						onChange={(e) => setRequestObjectForm((prev) => ({ ...prev, nonce: e.target.value }))}
						placeholder="random-nonce-value"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Code Challenge</Label>
					<Input
						type="text"
						value={requestObjectForm.codeChallenge}
						onChange={(e) =>
							setRequestObjectForm((prev) => ({ ...prev, codeChallenge: e.target.value }))
						}
						placeholder="code-challenge-value"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Code Challenge Method</Label>
					<Select
						value={requestObjectForm.codeChallengeMethod}
						onChange={(e) =>
							setRequestObjectForm((prev) => ({ ...prev, codeChallengeMethod: e.target.value }))
						}
					>
						<option value="S256">S256</option>
						<option value="plain">plain</option>
					</Select>
				</FormGroup>
				<FormGroup>
					<Label>ACR Values</Label>
					<Input
						type="text"
						value={requestObjectForm.acrValues}
						onChange={(e) =>
							setRequestObjectForm((prev) => ({ ...prev, acrValues: e.target.value }))
						}
						placeholder="urn:mace:pingidentity.com:loc:1"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Prompt</Label>
					<Select
						value={requestObjectForm.prompt}
						onChange={(e) => setRequestObjectForm((prev) => ({ ...prev, prompt: e.target.value }))}
					>
						<option value="">None</option>
						<option value="none">none</option>
						<option value="login">login</option>
						<option value="consent">consent</option>
						<option value="select_account">select_account</option>
					</Select>
				</FormGroup>
			</FormSection>
		</FormContainer>
	);

	const renderClientSecretForm = () => (
		<FormContainer>
			<FormSection>
				<FormGroup>
					<Label>Client ID *</Label>
					<Input
						type="text"
						value={clientSecretForm.clientId}
						onChange={(e) => setClientSecretForm((prev) => ({ ...prev, clientId: e.target.value }))}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Token Endpoint *</Label>
					<Input
						type="url"
						value={clientSecretForm.tokenEndpoint}
						onChange={(e) =>
							setClientSecretForm((prev) => ({ ...prev, tokenEndpoint: e.target.value }))
						}
						placeholder="https://auth.pingone.com/your-env-id/as/token"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Client Secret *</Label>
					<div style={{ position: 'relative' }}>
						<Input
							type={showSecret ? 'text' : 'password'}
							value={clientSecretForm.clientSecret}
							onChange={(e) =>
								setClientSecretForm((prev) => ({ ...prev, clientSecret: e.target.value }))
							}
							placeholder="your-client-secret"
							style={{ paddingRight: '3rem' }}
						/>
						<button
							type="button"
							onClick={() => setShowSecret(!showSecret)}
							style={{
								position: 'absolute',
								right: '0.75rem',
								top: '50%',
								transform: 'translateY(-50%)',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								color: '#6c757d',
								padding: '0.25rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
							aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
							title={showSecret ? 'Hide client secret' : 'Show client secret'}
						>
							{showSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
						</button>
					</div>
				</FormGroup>
			</FormSection>
			<FormSection>
				<FormGroup>
					<Label>Issuer</Label>
					<Input
						type="text"
						value={clientSecretForm.issuer}
						onChange={(e) => setClientSecretForm((prev) => ({ ...prev, issuer: e.target.value }))}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Subject</Label>
					<Input
						type="text"
						value={clientSecretForm.subject}
						onChange={(e) => setClientSecretForm((prev) => ({ ...prev, subject: e.target.value }))}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Expiry (minutes)</Label>
					<Input
						type="number"
						value={clientSecretForm.expiryMinutes}
						onChange={(e) =>
							setClientSecretForm((prev) => ({ ...prev, expiryMinutes: e.target.value }))
						}
					/>
				</FormGroup>
			</FormSection>
		</FormContainer>
	);

	const renderPrivateKeyForm = () => (
		<FormContainer>
			<FormSection>
				<FormGroup>
					<Label>Client ID *</Label>
					<Input
						type="text"
						value={privateKeyForm.clientId}
						onChange={(e) => setPrivateKeyForm((prev) => ({ ...prev, clientId: e.target.value }))}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Token Endpoint *</Label>
					<Input
						type="url"
						value={privateKeyForm.tokenEndpoint}
						onChange={(e) =>
							setPrivateKeyForm((prev) => ({ ...prev, tokenEndpoint: e.target.value }))
						}
						placeholder="https://auth.pingone.com/your-env-id/as/token"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Key ID</Label>
					<Input
						type="text"
						value={privateKeyForm.keyId}
						onChange={(e) => setPrivateKeyForm((prev) => ({ ...prev, keyId: e.target.value }))}
						placeholder="default"
					/>
				</FormGroup>
			</FormSection>
			<FormSection>
				<FormGroup>
					<Label>Private Key *</Label>
					<TextArea
						value={privateKeyForm.privateKey}
						onChange={(e) => setPrivateKeyForm((prev) => ({ ...prev, privateKey: e.target.value }))}
						placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Issuer</Label>
					<Input
						type="text"
						value={privateKeyForm.issuer}
						onChange={(e) => setPrivateKeyForm((prev) => ({ ...prev, issuer: e.target.value }))}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Subject</Label>
					<Input
						type="text"
						value={privateKeyForm.subject}
						onChange={(e) => setPrivateKeyForm((prev) => ({ ...prev, subject: e.target.value }))}
						placeholder="your-client-id"
					/>
				</FormGroup>
			</FormSection>
		</FormContainer>
	);

	const renderJWKSForm = () => (
		<div>
			<JWKSConverter />
		</div>
	);

	const renderForm = () => {
		switch (activeTab) {
			case 'login-hint':
				return renderLoginHintForm();
			case 'request-object':
				return renderRequestObjectForm();
			case 'client-secret':
				return renderClientSecretForm();
			case 'private-key':
				return renderPrivateKeyForm();
			case 'jwks':
				return renderJWKSForm();
			default:
				return null;
		}
	};

	const handleGenerate = () => {
		switch (activeTab) {
			case 'login-hint':
				handleGenerateLoginHintToken();
				break;
			case 'request-object':
				handleGenerateRequestObject();
				break;
			case 'client-secret':
				handleGenerateClientSecretJWT();
				break;
			case 'private-key':
				handleGeneratePrivateKeyJWT();
				break;
			case 'jwks':
				handleGenerateJWKS();
				break;
		}
	};

	return (
		<GeneratorContainer>
			<GeneratorHeader>
				<GeneratorTitle>JWT Generator</GeneratorTitle>
			</GeneratorHeader>

			{message && <Alert $type={message.type}>{message.text}</Alert>}

			<TabContainer>
				<Tab $active={activeTab === 'login-hint'} onClick={() => setActiveTab('login-hint')}>
					Login Hint Token
				</Tab>
				<Tab
					$active={activeTab === 'request-object'}
					onClick={() => setActiveTab('request-object')}
				>
					Request Object
				</Tab>
				<Tab $active={activeTab === 'client-secret'} onClick={() => setActiveTab('client-secret')}>
					Client Secret JWT
				</Tab>
				<Tab $active={activeTab === 'private-key'} onClick={() => setActiveTab('private-key')}>
					Private Key JWT
				</Tab>
				<Tab $active={activeTab === 'jwks'} onClick={() => setActiveTab('jwks')}>
					JWKS
				</Tab>
			</TabContainer>

			{renderForm()}

			<ButtonGroup>
				<Button $variant="primary" onClick={handleGenerate}>
					Generate JWT
				</Button>
			</ButtonGroup>

			{generatedJWT && (
				<OutputContainer>
					<OutputTitle>Generated JWT</OutputTitle>
					<CodeBlock>{generatedJWT}</CodeBlock>
					<ButtonGroup>
						<Button $variant="success" onClick={handleCopyToClipboard}>
							Copy to Clipboard
						</Button>
						<Button $variant="secondary" onClick={handleDownload}>
							Download
						</Button>
					</ButtonGroup>
				</OutputContainer>
			)}
		</GeneratorContainer>
	);
};

export default JWTGenerator;
