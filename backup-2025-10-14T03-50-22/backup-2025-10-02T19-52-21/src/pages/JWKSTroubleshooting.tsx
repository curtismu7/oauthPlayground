import { useCallback, useId, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiCopy,
	FiExternalLink,
	FiPlay,
} from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { FlowHeader } from '../services/flowHeaderService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #2d3748;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  color: #4a5568;
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 0;
`;

const Section = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IssueList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const IssueItem = styled.li`
  background: #f7fafc;
  border-left: 4px solid #4299e1;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const IssueNumber = styled.div`
  background: #4299e1;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
`;

const IssueContent = styled.div`
  flex: 1;
`;

const IssueTitle = styled.h3`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const IssueDescription = styled.p`
  color: #4a5568;
  margin: 0;
  line-height: 1.5;
`;

const CodeBlock = styled.pre`
  background: #1a202c;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 1rem 0;
  position: relative;
`;

const CommandContainer = styled.div`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const CommandHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const CommandTitle = styled.h4`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{
	variant?: 'primary' | 'secondary' | 'success' | 'danger';
}>`
  background: ${(props) => {
		switch (props.variant) {
			case 'primary':
				return '#4299e1';
			case 'success':
				return '#48bb78';
			case 'danger':
				return '#f56565';
			default:
				return '#e2e8f0';
		}
	}};
  color: ${(props) => (props.variant === 'secondary' ? '#4a5568' : 'white')};
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
`;

const OutputContainer = styled.div`
  background: #1a202c;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 1rem;
`;

const OutputHeader = styled.div`
  background: #2d3748;
  color: #e2e8f0;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

const OutputTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const OutputContent = styled.pre<{ isExpanded: boolean }>`
  background: #1a202c;
  color: #e2e8f0;
  padding: 1rem;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  max-height: ${(props) => (props.isExpanded ? '500px' : '0')};
  overflow-y: ${(props) => (props.isExpanded ? 'auto' : 'hidden')};
  transition: max-height 0.3s ease;
  white-space: pre-wrap;
  word-break: break-word;
`;

const StatusIndicator = styled.div<{
	status: 'idle' | 'running' | 'success' | 'error';
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => {
		switch (props.status) {
			case 'running':
				return '#4299e1';
			case 'success':
				return '#48bb78';
			case 'error':
				return '#f56565';
			default:
				return '#4a5568';
		}
	}};
`;

const Checklist = styled.div`
  background: #f7fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ChecklistItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #48bb78;
`;

const ChecklistLabel = styled.label`
  color: #2d3748;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
`;

const Link = styled.a`
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

interface CommandResult {
	command: string;
	output: string;
	status: 'success' | 'error';
	timestamp: Date;
}

const JWKSTroubleshooting: React.FC = () => {
	const environmentInputId = useId();
	const [environmentId, setEnvironmentId] = useState('');
	const [commandResults, setCommandResults] = useState<CommandResult[]>([]);
	const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());
	const [runningCommands, setRunningCommands] = useState<Set<string>>(new Set());

	const toggleOutput = useCallback((key: string) => {
		setExpandedOutputs((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	}, []);

	const _formatTimestamp = useCallback((date: Date) => {
		return `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`;
	}, []);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showCopySuccess(label);
		} catch {
			v4ToastManager.showCopyError(label);
		}
	}, []);

	const executeRequest = useCallback(
		async (url: string, _description: string) => {
			if (runningCommands.has(url)) return;

			setRunningCommands((prev) => new Set(prev).add(url));

			try {
				console.log(`[JWKS Troubleshooting] Making request to: ${url}`);

				const response = await fetch(url, {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

				let output: string;
				let status: 'success' | 'error';

				if (response.ok) {
					const data = await response.text();
					try {
						// Try to parse and pretty-print JSON
						const jsonData = JSON.parse(data);
						output = JSON.stringify(jsonData, null, 2);
						status = 'success';
					} catch {
						// If not JSON, just show the raw response
						output = data;
						status = 'success';
					}
				} else {
					output = `HTTP ${response.status}: ${response.statusText}\n\n${await response.text()}`;
					status = 'error';
				}

				const newResult: CommandResult = {
					command: `GET ${url}`,
					output,
					status,
					timestamp: new Date(),
				};
				setCommandResults((prev) => [newResult, ...prev]);

				if (status === 'success') {
					v4ToastManager.showSuccess('JWKS command executed successfully - check results below');
				} else {
					v4ToastManager.showError('networkError');
				}
			} catch (error) {
				const newResult: CommandResult = {
					command: `GET ${url}`,
					output: `Network Error: ${error instanceof Error ? error.message : 'Failed to make request'}`,
					status: 'error',
					timestamp: new Date(),
				};

				setCommandResults((prev) => [newResult, ...prev]);
				v4ToastManager.showError('networkError');
			} finally {
				setRunningCommands((prev) => {
					const newSet = new Set(prev);
					newSet.delete(url);
					return newSet;
				});
			}
		},
		[runningCommands]
	);

	const requests = [
		{
			title: 'Get JWKS from PingOne',
			url: `https://auth.pingone.com/{environmentId}/as/jwks`,
			description: 'Fetch JWKS from PingOne',
		},
		{
			title: 'Get OIDC Configuration',
			url: `https://auth.pingone.com/{environmentId}/as/.well-known/openid_configuration`,
			description: 'Get OIDC configuration to find jwks_uri',
		},
		{
			title: 'Get JWKS (Alternative Format)',
			url: `https://auth.pingone.com/{environmentId}/as/jwks`,
			description: 'Fetch JWKS with JSON formatting',
		},
	];

	const checklistItems = [
		'Root object has "keys" array',
		'Each key has kty, kid, n, e fields',
		'n and e are valid Base64URL (no =, +, /)',
		'kid values are unique',
		'JSON is properly formatted',
		'No extra commas or syntax errors',
	];

	return (
		<Container>
			<FlowHeader flowType="jwks-troubleshooting" />

			<Section>
				<SectionTitle>
					<FiAlertCircle />
					Common JWKS Format Issues
				</SectionTitle>

				<IssueList>
					<IssueItem>
						<IssueNumber>1</IssueNumber>
						<IssueContent>
							<IssueTitle>Missing Required Fields</IssueTitle>
							<IssueDescription>
								Ensure each key has these mandatory fields: <strong>kty</strong> (Key Type - usually
								"RSA"),
								<strong>kid</strong> (Key ID - unique identifier), <strong>n</strong> (Modulus), and
								<strong>e</strong> (Exponent - usually "AQAB").
							</IssueDescription>
						</IssueContent>
					</IssueItem>

					<IssueItem>
						<IssueNumber>2</IssueNumber>
						<IssueContent>
							<IssueTitle>Incorrect Root Structure</IssueTitle>
							<IssueDescription>
								Must have "keys" array at root level. The structure should be:
								<CodeBlock>{`{
  "keys": [
    // ... key objects here
  ]
}`}</CodeBlock>
							</IssueDescription>
						</IssueContent>
					</IssueItem>

					<IssueItem>
						<IssueNumber>3</IssueNumber>
						<IssueContent>
							<IssueTitle>Invalid Base64URL Encoding</IssueTitle>
							<IssueDescription>
								The n and e values must be Base64URL encoded (not standard Base64):
								<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
									<li>No padding (=)</li>
									<li>Use - instead of +</li>
									<li>Use _ instead of /</li>
								</ul>
							</IssueDescription>
						</IssueContent>
					</IssueItem>
				</IssueList>
			</Section>

			<Section>
				<SectionTitle>
					<FiPlay />
					PingOne JWKS Commands
				</SectionTitle>

				<div style={{ marginBottom: '1.5rem' }}>
					<label
						htmlFor={environmentInputId}
						style={{
							display: 'block',
							marginBottom: '0.5rem',
							fontWeight: '500',
							color: '#2d3748',
						}}
					>
						Environment ID:
					</label>
					<Input
						id={environmentInputId}
						type="text"
						placeholder="Enter your PingOne Environment ID"
						value={environmentId}
						onChange={(e) => setEnvironmentId(e.target.value)}
					/>
				</div>

				{requests.map((req) => {
					const fullUrl = req.url.replace('{environmentId}', environmentId);
					return (
						<CommandContainer key={req.title}>
							<CommandHeader>
								<CommandTitle>{req.title}</CommandTitle>
								<ButtonGroup>
									<Button
										variant="primary"
										onClick={() => executeRequest(fullUrl, req.description)}
										disabled={!environmentId || runningCommands.has(fullUrl)}
									>
										<FiPlay />
										{runningCommands.has(fullUrl) ? 'Loading...' : 'Execute'}
									</Button>
									<Button variant="secondary" onClick={() => copyToClipboard(fullUrl, 'URL')}>
										<FiCopy />
										Copy URL
									</Button>
								</ButtonGroup>
							</CommandHeader>
							<CodeBlock>{fullUrl}</CodeBlock>
						</CommandContainer>
					);
				})}

				<div
					style={{
						marginTop: '2rem',
						padding: '1rem',
						background: '#edf2f7',
						borderRadius: '0.5rem',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Regional Endpoints:</h4>
					<p style={{ margin: '0', color: '#4a5568', fontSize: '0.9rem' }}>
						<strong>EU:</strong> https://auth.pingone.eu/{'{environmentId}'}
						/as/jwks
						<br />
						<strong>CA:</strong> https://auth.pingone.ca/{'{environmentId}'}
						/as/jwks
						<br />
						<strong>AP:</strong> https://auth.pingone.asia/{'{environmentId}'}
						/as/jwks
					</p>
				</div>
			</Section>

			{commandResults.length > 0 && (
				<Section>
					<SectionTitle>
						<FiCheckCircle />
						Command Results
					</SectionTitle>

					{commandResults.map((result) => {
						const key = `${result.timestamp.getTime()}-${result.command}`;
						return (
							<div key={key} style={{ marginBottom: '1rem' }}>
								<OutputContainer>
									<OutputHeader onClick={() => toggleOutput(key)}>
										<OutputTitle>
											{expandedOutputs.has(key) ? <FiChevronDown /> : <FiChevronRight />}
											<StatusIndicator status={result.status}>
												{result.status === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
												{result.status === 'success' ? 'Success' : 'Error'}
											</StatusIndicator>
											<span
												style={{
													marginLeft: '1rem',
													fontSize: '0.875rem',
													color: '#a0aec0',
												}}
											>
												{result.timestamp.toLocaleTimeString()}
											</span>
										</OutputTitle>
										<Button
											variant="secondary"
											onClick={(e) => {
												e.stopPropagation();
												copyToClipboard(result.output, 'Output');
											}}
											style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
										>
											<FiCopy />
											Copy
										</Button>
									</OutputHeader>
									<OutputContent isExpanded={expandedOutputs.has(key)}>
										{result.output}
									</OutputContent>
								</OutputContainer>
							</div>
						);
					})}
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiCheckCircle />
					Validation Checklist
				</SectionTitle>

				<Checklist>
					{checklistItems.map((item) => {
						const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-');
						return (
							<ChecklistItem key={slug}>
								<Checkbox type="checkbox" id={`checklist-${slug}`} />
								<ChecklistLabel htmlFor={`checklist-${slug}`}>{item}</ChecklistLabel>
							</ChecklistItem>
						);
					})}
				</Checklist>
			</Section>

			<Section>
				<SectionTitle>
					<FiExternalLink />
					Additional Resources
				</SectionTitle>

				<div style={{ display: 'grid', gap: '1rem' }}>
					<div
						style={{
							padding: '1rem',
							background: '#f7fafc',
							borderRadius: '0.5rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Ping JWT Decoder:</h4>
						<p style={{ margin: '0 0 0.5rem 0', color: '#4a5568' }}>
							<Link
								href="https://jwt-decoder.pingidentity.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Ping JWT Decoder
							</Link>{' '}
							- Decode and validate JWT tokens with PingOne keys
						</p>
						<p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
							Official Ping Identity tool for decoding JWT tokens and validating signatures using
							PingOne JWKS endpoints.
						</p>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f7fafc',
							borderRadius: '0.5rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>PingOne SSO Documentation:</h4>
						<div style={{ display: 'grid', gap: '0.5rem' }}>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link
									href="https://docs.pingidentity.com/bundle/pingone/page/zhc1564020488549.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									PingOne JWKS Configuration
								</Link>{' '}
								- Configure JWKS endpoints in PingOne
							</p>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link
									href="https://docs.pingidentity.com/bundle/pingone/page/zhc1564020488549.html#zhc1564020488549__section_zhc1564020488549__section_zhc1564020488549"
									target="_blank"
									rel="noopener noreferrer"
								>
									Private Key JWT Authentication
								</Link>{' '}
								- Set up private key JWT authentication
							</p>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link
									href="https://docs.pingidentity.com/bundle/pingone/page/zhc1564020488549.html#zhc1564020488549__section_zhc1564020488549__section_zhc1564020488549"
									target="_blank"
									rel="noopener noreferrer"
								>
									OIDC Discovery Endpoint
								</Link>{' '}
								- Use OIDC discovery to find JWKS URI
							</p>
						</div>
						<p
							style={{
								margin: '0.5rem 0 0 0',
								fontSize: '0.875rem',
								color: '#6b7280',
							}}
						>
							Official Ping Identity documentation for configuring and troubleshooting JWKS in
							PingOne SSO.
						</p>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f7fafc',
							borderRadius: '0.5rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>Online Validators:</h4>
						<div style={{ display: 'grid', gap: '0.5rem' }}>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link href="https://jwt.io" target="_blank" rel="noopener noreferrer">
									JWT.io Debugger
								</Link>{' '}
								- Test your JWKS format and decode JWT tokens
							</p>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link href="https://mkjwk.org/" target="_blank" rel="noopener noreferrer">
									MKJWK Generator
								</Link>{' '}
								- Generate test JWKS for development
							</p>
						</div>
					</div>

					<div
						style={{
							padding: '1rem',
							background: '#f7fafc',
							borderRadius: '0.5rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#2d3748' }}>RFC Standards:</h4>
						<div style={{ display: 'grid', gap: '0.5rem' }}>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link
									href="https://tools.ietf.org/html/rfc7517"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 7517 - JSON Web Key (JWK)
								</Link>{' '}
								- JWKS specification
							</p>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link
									href="https://tools.ietf.org/html/rfc7518"
									target="_blank"
									rel="noopener noreferrer"
								>
									RFC 7518 - JSON Web Algorithms (JWA)
								</Link>{' '}
								- JWT algorithms specification
							</p>
							<p style={{ margin: '0', color: '#4a5568' }}>
								<Link
									href="https://openid.net/specs/openid-connect-discovery-1_0.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									OIDC Discovery
								</Link>{' '}
								- OpenID Connect Discovery specification
							</p>
						</div>
					</div>
				</div>
			</Section>
		</Container>
	);
};

export default JWKSTroubleshooting;
