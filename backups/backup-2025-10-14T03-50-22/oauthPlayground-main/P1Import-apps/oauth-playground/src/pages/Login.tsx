import React, { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiCheckCircle,
	FiCopy,
	FiEdit,
	FiEye,
	FiEyeOff,
	FiLogIn,
} from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0070CC 0%, #0056A3 100%);
  padding: 2rem;
`;

const LoginLayout = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  max-width: 1400px;
  align-items: flex-start;
`;

const SetupSection = styled.div`
  flex: 1;
  max-width: 700px;
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 100%;
  }
`;

const LoginSection = styled.div`
  flex: 1;
  max-width: 480px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  overflow: hidden;
`;

const LoginHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  text-align: center;

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    color: #0070CC;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const TitleCopyButton = styled.button`
  background: none;
  border: 1px solid #0070CC;
  color: #0070CC;
  cursor: pointer;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s;
  margin-left: 0.5rem;

  &:hover {
    background-color: #0070CC;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 112, 204, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 1rem;
  }
`;

const DescriptionSection = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;

  p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0070CC;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const DescCopyButton = styled.button`
  background: none;
  border: 1px solid #0070CC;
  color: #0070CC;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background-color: #0070CC;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 112, 204, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 0.875rem;
  }
`;

const LoginBody = styled.div`
  padding: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({ theme }) => '#495057'};
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${({ theme }) => '#dee2e6'};
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: #0070CC;
      box-shadow: 0 0 0 3px rgba(0, 112, 204, 0.1);
    }

    &:disabled {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }
  }
  .error {
    color: ${({ theme }) => '#dc3545'};
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
`;

const ErrorIcon = styled(FiAlertCircle)`
  font-size: 3rem;
  color: ${({ theme }) => '#dc3545'};
  margin-bottom: 1.5rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({ theme }) => '#007bff'};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => '#0056b3'};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => '#007bff'};
  text-decoration: none;
  font-size: 0.9375rem;
  margin-top: 1rem;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Alert = styled.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
  background-color: ${({ theme }) => `${theme.colors.danger}10`};
  border: 1px solid ${({ theme }) => `${theme.colors.danger}20`};
  color: ${({ theme }) => '#dc3545'};
  
  svg {
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
  
  div {
    flex: 1;
  }
`;

const PingOneSetupSection = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: left;
  height: fit-content;

  h3 {
    color: #495057;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: #6c757d;
    margin-bottom: 1rem;
    line-height: 1.4;
    font-size: 0.9rem;
  }

  em {
    font-style: italic;
    color: #6c757d;
    font-size: 0.85rem;
  }
`;

const SetupSteps = styled.div`
  margin-bottom: 1.5rem;

  h4 {
    color: #343a40;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  ul {
    margin: 0 0 0.5rem 0;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.25rem;
    color: #495057;
    line-height: 1.3;
    font-size: 0.85rem;

    strong {
      color: #212529;
    }

    code {
      background-color: #e9ecef;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75em;
      color: #495057;
    }
  }
`;

const CredentialsBox = styled.div`
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.5rem;

  h4 {
    color: #343a40;
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  p {
    margin-bottom: 0.5rem;
    color: #495057;
    font-size: 0.8rem;

    strong {
      color: #212529;
      font-weight: 600;
    }

    code {
      background-color: #f8f9fa;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9rem;
      font-weight: 700;
      color: #0070CC;
      letter-spacing: 0.5px;
      word-break: break-all;
      display: inline-block;
      margin-top: 0.25rem;
      border: 1px solid #e9ecef;
    }
  }
`;

const CredentialRow = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;

  p {
    margin: 0;
    min-width: 120px;
    font-weight: 600;
    color: #495057;
  }
`;

const CredentialWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  code {
    flex: 1;
    margin: 0;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #f8f9fa;
    color: #0070CC;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    transition: all 0.2s;
  }
`;

const Login = () => {
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [credentials, setCredentials] = useState({
		environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
		clientId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
		clientSecret: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a',
	});
	const [showClientSecret, setShowClientSecret] = useState(false);
	const toggleClientSecretVisibility = () => setShowClientSecret(!showClientSecret);
	const [saveStatus, setSaveStatus] = useState<{
		type: string;
		title: string;
		message: string;
	} | null>(null);

	const { login, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const from = location.state?.from?.pathname || '/';

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			navigate(from, { replace: true });
		}
	}, [isAuthenticated, navigate, from]);

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const handleCredentialChange = (field: string, value: string) => {
		setCredentials((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleCredentialSave = () => {
		setSaveStatus(null);

		try {
			// Save to localStorage
			localStorage.setItem('login_credentials', JSON.stringify(credentials));

			setSaveStatus({
				type: 'success',
				title: 'Credentials saved',
				message: 'Your login credentials have been saved successfully.',
			});
		} catch (error) {
			console.error('Failed to save credentials:', error);
			setSaveStatus({
				type: 'danger',
				title: 'Error',
				message: 'Failed to save credentials. Please try again.',
			});
		}

		// Clear success message after 3 seconds
		setTimeout(() => {
			setSaveStatus(null);
		}, 3000);
	};

	const handleLogin = async () => {
		setError('');

		setIsLoading(true);

		try {
			// Redirect to PingOne for authentication
			await login();
			// The login function will handle the redirect, so we don't need to do anything else
		} catch (err) {
			console.error('Login error:', err);
			setError('An error occurred during login. Please try again.');
			setIsLoading(false);
		}
	};

	return (
		<LoginContainer>
			<LoginLayout>
				<SetupSection>
					<DescriptionSection>
						<p>
							<span>
								📝 Interactive OAuth 2.0 testing application
								<DescCopyButton
									onClick={() =>
										copyToClipboard('Interactive OAuth 2.0 testing application', 'app-description')
									}
									title="Copy Description"
								>
									{copiedId === 'app-description' ? <FiCheck size={12} /> : <FiCopy size={12} />}
									{copiedId === 'app-description' ? 'Copied!' : 'Copy'}
								</DescCopyButton>
							</span>
						</p>
					</DescriptionSection>

					<PingOneSetupSection>
						<h3>🔧 PingOne Configuration Required</h3>
						<p>To use this OAuth Playground, you need to configure your PingOne environment:</p>

						<SetupSteps>
							<h4>1. Access PingOne Admin Console</h4>
							<ul>
								<li>
									Navigate to your <strong>PingOne Admin Console</strong>
								</li>
								<li>
									Go to <strong>Applications</strong> → <strong>Applications</strong>
								</li>
								<li>
									Click{' '}
									<strong style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0070CC' }}>
										+ Add Application
									</strong>
								</li>
								<li>
									Select <strong>Web Application</strong>
								</li>
							</ul>

							<h4>2. Configure Application Details</h4>
							<ul>
								<li>
									<strong>Application Type:</strong> OIDC Web App
								</li>
								<li>
									<strong>Application Name:</strong>
									<span
										style={{
											fontWeight: '800',
											fontSize: '1rem',
											color: '#0070CC',
											marginLeft: '0.5rem',
										}}
									>
										PingOne OAuth Playground
										<button
											onClick={() => copyToClipboard('PingOne OAuth Playground', 'setup-app-name')}
											style={{
												background: 'none',
												border: '1px solid #0070CC',
												color: '#0070CC',
												cursor: 'pointer',
												padding: '0.125rem 0.25rem',
												borderRadius: '3px',
												fontSize: '0.7rem',
												fontWeight: '600',
												marginLeft: '0.5rem',
												display: 'inline-flex',
												alignItems: 'center',
												gap: '0.125rem',
												transition: 'all 0.2s',
											}}
											title="Copy Application Name"
										>
											{copiedId === 'setup-app-name' ? <FiCheck size={10} /> : <FiCopy size={10} />}
										</button>
									</span>
								</li>
								<li>
									<strong>Description:</strong> Interactive OAuth 2.0 testing application
								</li>
								<li>
									<strong>Hit Save Button</strong>
								</li>
							</ul>

							<h4>3. Configure Authentication</h4>
							<ul>
								<li>
									<strong>Enable Application - Grey button on top Right</strong>
								</li>
								<li>
									<strong>Hit Configuration tab</strong>
								</li>
								<li>
									<strong>Hit blue pencil</strong>
									<span
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '20px',
											height: '20px',
											backgroundColor: '#0070CC',
											borderRadius: '50%',
											marginLeft: '8px',
											color: 'white',
										}}
									>
										<FiEdit size={12} />
									</span>
								</li>
								<li>
									<strong>Response Type:</strong> Code
								</li>
								<li>
									<strong>Grant Type:</strong> Authorization Code
								</li>
								<li>
									<strong>Redirect URIs:</strong>
									<span
										style={{
											fontWeight: '800',
											fontSize: '1rem',
											color: '#0070CC',
											marginLeft: '0.5rem',
										}}
									>
										http://localhost:3000/callback
										<button
											onClick={() =>
												copyToClipboard('http://localhost:3000/callback', 'setup-redirect-uri')
											}
											style={{
												background: 'none',
												border: '1px solid #0070CC',
												color: '#0070CC',
												cursor: 'pointer',
												padding: '0.125rem 0.25rem',
												borderRadius: '3px',
												fontSize: '0.7rem',
												fontWeight: '600',
												marginLeft: '0.5rem',
												display: 'inline-flex',
												alignItems: 'center',
												gap: '0.125rem',
												transition: 'all 0.2s',
											}}
											title="Copy Redirect URI"
										>
											{copiedId === 'setup-redirect-uri' ? (
												<FiCheck size={10} />
											) : (
												<FiCopy size={10} />
											)}
										</button>
									</span>
								</li>
								<li>
									<strong>Token Endpoint Authentication Method:</strong> Client Secret Basic
								</li>
								<li>
									Click <strong style={{ color: '#0070CC' }}>Save</strong> to create the application
								</li>
							</ul>

							<h4>4. Save and Get Credentials</h4>
							<ul>
								<li>
									See the <strong>Environment ID (Issuer)</strong>
								</li>
								<li>
									See the <strong>Client ID</strong>
								</li>
								<li>
									See the <strong>Client Secret</strong>
									<span
										style={{
											marginLeft: '0.375rem',
											color: '#6c757d',
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.25rem',
										}}
									>
										(<FiEye size={12} /> show/hide)
									</span>
								</li>
							</ul>
						</SetupSteps>

						<CredentialsBox>
							<h4>📝 Enter Your Credentials</h4>

							{saveStatus && (
								<div
									style={{
										padding: '1rem',
										marginBottom: '1.5rem',
										borderRadius: '0.375rem',
										backgroundColor: saveStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
										border: `1px solid ${saveStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
										color: saveStatus.type === 'success' ? '#166534' : '#991b1b',
										display: 'flex',
										alignItems: 'flex-start',
									}}
								>
									{saveStatus.type === 'success' ? (
										<FiCheckCircle
											size={20}
											style={{ marginRight: '0.75rem', marginTop: '0.2rem', flexShrink: 0 }}
										/>
									) : (
										<FiAlertCircle
											size={20}
											style={{ marginRight: '0.75rem', marginTop: '0.2rem', flexShrink: 0 }}
										/>
									)}
									<div>
										<h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontWeight: 600 }}>
											{saveStatus.title}
										</h4>
										<p style={{ margin: 0, fontSize: '0.9375rem' }}>{saveStatus.message}</p>
									</div>
								</div>
							)}

							<CredentialRow>
								<p>
									<strong>Environment ID:</strong>
								</p>
								<CredentialWrapper>
									<input
										type="text"
										value={credentials.environmentId}
										onChange={(e) => handleCredentialChange('environmentId', e.target.value)}
										style={{
											width: '100%',
											padding: '0.5rem',
											border: '1px solid #dee2e6',
											borderRadius: '4px',
											fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
											fontSize: '0.85rem',
											backgroundColor: '#f8f9fa',
										}}
										placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
									/>
									<CopyButton
										onClick={() => copyToClipboard(credentials.environmentId, 'env-id')}
										title="Copy Environment ID"
									>
										{copiedId === 'env-id' ? <FiCheck size={16} /> : <FiCopy size={16} />}
									</CopyButton>
								</CredentialWrapper>
							</CredentialRow>

							<CredentialRow>
								<p>
									<strong>Client ID:</strong>
								</p>
								<CredentialWrapper>
									<input
										type="text"
										value={credentials.clientId}
										onChange={(e) => handleCredentialChange('clientId', e.target.value)}
										style={{
											width: '100%',
											padding: '0.5rem',
											border: '1px solid #dee2e6',
											borderRadius: '4px',
											fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
											fontSize: '0.85rem',
											backgroundColor: '#f8f9fa',
										}}
										placeholder="Enter your application's Client ID"
									/>
									<CopyButton
										onClick={() => copyToClipboard(credentials.clientId, 'client-id')}
										title="Copy Client ID"
									>
										{copiedId === 'client-id' ? <FiCheck size={16} /> : <FiCopy size={16} />}
									</CopyButton>
								</CredentialWrapper>
							</CredentialRow>

							<CredentialRow>
								<p>
									<strong>Client Secret:</strong>
								</p>
								<CredentialWrapper>
									<div style={{ position: 'relative', width: '100%' }}>
										<input
											type={showClientSecret ? 'text' : 'password'}
											value={credentials.clientSecret}
											onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
											style={{
												width: '100%',
												padding: '0.5rem 3.25rem 0.5rem 0.75rem',
												border: '1px solid #dee2e6',
												borderRadius: '4px',
												fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
												fontSize: '0.85rem',
												backgroundColor: '#f8f9fa',
											}}
											placeholder="Enter your application's Client Secret"
										/>
										<button
											onClick={toggleClientSecretVisibility}
											type="button"
											style={{
												position: 'absolute',
												right: '0.5rem',
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
											aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
										>
											{showClientSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
										</button>
									</div>
									<CopyButton
										onClick={() => copyToClipboard(credentials.clientSecret, 'client-secret')}
										title="Copy Client Secret"
										style={{ marginLeft: '0.5rem' }}
									>
										{copiedId === 'client-secret' ? <FiCheck size={16} /> : <FiCopy size={16} />}
									</CopyButton>
								</CredentialWrapper>
							</CredentialRow>

							<CredentialRow>
								<p>
									<strong>Redirect URI:</strong>
								</p>
								<CredentialWrapper>
									<code>http://localhost:3000/callback</code>
									<CopyButton
										onClick={() =>
											copyToClipboard('http://localhost:3000/callback', 'redirect-uri')
										}
										title="Copy Redirect URI"
									>
										{copiedId === 'redirect-uri' ? <FiCheck size={16} /> : <FiCopy size={16} />}
									</CopyButton>
								</CredentialWrapper>
							</CredentialRow>

							<div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
								<SubmitButton
									onClick={handleCredentialSave}
									disabled={false}
									style={{ width: 'auto', padding: '0.75rem 2rem' }}
								>
									<FiCheck />
									Save Credentials
								</SubmitButton>
							</div>
						</CredentialsBox>

						<p>
							<em>
								💡 <strong>Need Help?</strong> Check the PingOne documentation or contact your
								PingOne administrator.
							</em>
						</p>
					</PingOneSetupSection>
				</SetupSection>

				<LoginSection>
					<LoginCard>
						<LoginHeader>
							<h1>
								<span>
									🔐 PingOne OAuth Playground
									<TitleCopyButton
										onClick={() => copyToClipboard('PingOne OAuth Playground', 'app-title')}
										title="Copy App Name"
									>
										{copiedId === 'app-title' ? <FiCheck size={14} /> : <FiCopy size={14} />}
										{copiedId === 'app-title' ? 'Copied!' : 'Copy'}
									</TitleCopyButton>
								</span>
							</h1>
						</LoginHeader>

						<LoginBody>
							{error && (
								<Alert>
									<FiAlertCircle size={20} />
									<div>{error}</div>
								</Alert>
							)}

							<div style={{ textAlign: 'center', padding: '2rem 0' }}>
								<SubmitButton
									onClick={handleLogin}
									disabled={isLoading}
									style={{ width: 'auto', padding: '0.75rem 2rem' }}
								>
									<FiLogIn />
									{isLoading ? 'Redirecting...' : 'Login with PingOne'}
								</SubmitButton>
							</div>
						</LoginBody>
					</LoginCard>
				</LoginSection>
			</LoginLayout>
		</LoginContainer>
	);
};

export default Login;
