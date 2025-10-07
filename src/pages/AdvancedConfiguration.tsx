import React, { useState, useMemo } from 'react';
import {
	FiCheckCircle,
	FiCopy,
	FiEdit,
	FiEye,
	FiInfo,
	FiMinus,
	FiPlus,
	FiRotateCcw,
	FiSave,
	FiSettings,
	FiShield,
	FiTerminal,
} from 'react-icons/fi';
import styled from 'styled-components';
import PageLayoutService from '../services/pageLayoutService';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { usePageScroll } from '../hooks/usePageScroll';
import { credentialManager } from '../utils/credentialManager';
import JsonEditor from '../components/JsonEditor';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: #6b7280;
    line-height: 1.6;
  }
`;

const CardBody = styled.div`
  /* Additional styles if needed */
`;

const ConfigSection = styled(Card)`
  height: fit-content;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const ScopeItem = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: ${({ active }) => (active ? '#dbeafe' : '#f9fafb')};
  border: 1px solid ${({ active }) => (active ? '#3b82f6' : '#e5e7eb')};
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ active }) => (active ? '#bfdbfe' : '#f3f4f6')};
  }
`;

const ClaimItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ClaimInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
`;

const RemoveButton = styled.button`
  padding: 0.25rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #dc2626;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #047857;
  }
`;

const PreviewSection = styled(Card)`
  margin-top: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const CodeBlock = styled.pre`
  background-color: #1f2937;
  color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  margin: 1rem 0;
  border: 1px solid #374151;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const InfoBox = styled.div<{ $type?: 'info' | 'warning' | 'success' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  border-left: 4px solid;
  
  ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return `
          background-color: #fef3c7;
          border-left-color: #f59e0b;
          color: #92400e;
        `;
			case 'success':
				return `
          background-color: #d1fae5;
          border-left-color: #10b981;
          color: #065f46;
        `;
			default:
				return `
          background-color: #dbeafe;
          border-left-color: #3b82f6;
          color: #1e40af;
        `;
		}
	}}
`;

const CredentialStatus = styled.div<{ $status: 'complete' | 'partial' | 'missing' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  border-left: 4px solid;
  
  ${({ $status }) => {
		switch ($status) {
			case 'complete':
				return `
          background-color: #d1fae5;
          border-left-color: #10b981;
          color: #065f46;
        `;
			case 'partial':
				return `
          background-color: #fef3c7;
          border-left-color: #f59e0b;
          color: #92400e;
        `;
			case 'missing':
				return `
          background-color: #fee2e2;
          border-left-color: #ef4444;
          color: #991b1b;
        `;
		}
	}}
`;

const AdvancedConfiguration = () => {
	usePageScroll({ pageName: 'Advanced Configuration', force: true });

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for advanced config (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'advanced-configuration', // Enables FlowHeader integration
	};

	const { PageContainer, ContentWrapper, FlowHeader: LayoutFlowHeader } = 
		PageLayoutService.createPageLayout(pageConfig);

	const [selectedScopes, setSelectedScopes] = useState(new Set(['openid', 'profile', 'email']));
	const [customScopes, setCustomScopes] = useState(['']);
	const [customClaims, setCustomClaims] = useState(['']);
	const [saved, setSaved] = useState(false);
	const [copiedText, setCopiedText] = useState<string>('');

	// Standard OpenID Connect claims
	const standardClaims = [
		'sub',
		'name',
		'given_name',
		'family_name',
		'middle_name',
		'nickname',
		'preferred_username',
		'profile',
		'picture',
		'website',
		'email',
		'email_verified',
		'gender',
		'birthdate',
		'zoneinfo',
		'locale',
		'phone_number',
		'phone_number_verified',
		'address',
		'updated_at',
	];

	// Generate the configuration object for the JSON editor
	const configurationObject = useMemo(() => {
		const allScopes = [
			...Array.from(selectedScopes),
			...customScopes.filter((scope) => scope.trim() !== ''),
		];

		const allClaims = [...standardClaims, ...customClaims.filter((claim) => claim.trim() !== '')];

		return {
			oauth: {
				scopes: allScopes,
				scopeString: allScopes.join(' '),
				customScopes: customScopes.filter((scope) => scope.trim() !== ''),
			},
			oidc: {
				requestedClaims: allClaims,
				customClaims: customClaims.filter((claim) => claim.trim() !== ''),
			},
			configuration: {
				lastUpdated: new Date().toISOString(),
				version: '1.0.0',
			},
		};
	}, [selectedScopes, customScopes, customClaims]);

	// Define scope colors for the JSON editor
	const scopeColors = {
		openid: '#3b82f6',
		profile: '#10b981',
		email: '#f59e0b',
		address: '#ef4444',
		phone: '#8b5cf6',
		offline_access: '#06b6d4',
		read: '#84cc16',
		write: '#f97316',
		admin: '#dc2626',
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedText(label);
			setTimeout(() => setCopiedText(''), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const CodeBlockWithCopy = ({ children, label }: { children: string; label: string }) => (
		<CodeBlock>
			<CopyButton onClick={() => copyToClipboard(children, label)}>
				<FiCopy />
				{copiedText === label ? 'Copied!' : 'Copy'}
			</CopyButton>
			{children}
		</CodeBlock>
	);

	const generateConfigSnippet = () => {
		const allScopes = [
			...Array.from(selectedScopes),
			...customScopes.filter((scope) => scope.trim() !== ''),
		];

		const allClaims = [...standardClaims, ...customClaims.filter((claim) => claim.trim() !== '')];

		return `// OAuth Configuration
const oauthConfig = {
  scopes: "${allScopes.join(' ')}",
  requestedClaims: ${JSON.stringify(allClaims, null, 2)},
  customScopes: ${JSON.stringify(customScopes.filter((scope) => scope.trim() !== ''))},
  customClaims: ${JSON.stringify(customClaims.filter((claim) => claim.trim() !== ''))}
};

// Usage in your application
const authUrl = \`https://auth.pingone.com/\${envId}/as/authorize?\` +
  \`client_id=\${clientId}&\` +
  \`response_type=code&\` +
  \`scope=\${oauthConfig.scopes}&\` +
  \`redirect_uri=\${redirectUri}&\` +
  \`state=\${state}\`;`;
	};

	// Predefined OAuth 2.0 and OpenID Connect scopes
	const predefinedScopes = [
		{ id: 'openid', label: 'OpenID Connect', description: 'Required for OpenID Connect flows' },
		{ id: 'profile', label: 'Profile', description: 'Access to basic profile information' },
		{ id: 'email', label: 'Email', description: 'Access to email address and verification status' },
		{ id: 'address', label: 'Address', description: 'Access to postal address information' },
		{ id: 'phone', label: 'Phone', description: 'Access to phone number information' },
		{
			id: 'offline_access',
			label: 'Offline Access',
			description: 'Request refresh tokens for long-term access',
		},
	];

	const toggleScope = (scopeId) => {
		const newSelected = new Set(selectedScopes);
		if (newSelected.has(scopeId)) {
			newSelected.delete(scopeId);
		} else {
			newSelected.add(scopeId);
		}
		setSelectedScopes(newSelected);
	};

	const addCustomScope = () => {
		setCustomScopes([...customScopes, '']);
	};

	const updateCustomScope = (index, value) => {
		const newScopes = [...customScopes];
		newScopes[index] = value;
		setCustomScopes(newScopes);
	};

	const removeCustomScope = (index) => {
		setCustomScopes(customScopes.filter((_, i) => i !== index));
	};

	const addCustomClaim = () => {
		setCustomClaims([...customClaims, '']);
	};

	const updateCustomClaim = (index, value) => {
		const newClaims = [...customClaims];
		newClaims[index] = value;
		setCustomClaims(newClaims);
	};

	const removeCustomClaim = (index) => {
		setCustomClaims(customClaims.filter((_, i) => i !== index));
	};

	const saveConfiguration = () => {
		const allScopes = [
			...Array.from(selectedScopes),
			...customScopes.filter((scope) => scope.trim() !== ''),
		].join(' ');

		const allClaims = [...standardClaims, ...customClaims.filter((claim) => claim.trim() !== '')];

		const config = {
			scopes: allScopes,
			requestedClaims: allClaims,
			customScopes: customScopes.filter((scope) => scope.trim() !== ''),
			customClaims: customClaims.filter((claim) => claim.trim() !== ''),
		};

		// Save to localStorage for now (could be extended to save to server)
		localStorage.setItem('advancedConfig', JSON.stringify(config));
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	const resetToDefaults = () => {
		setSelectedScopes(new Set(['openid', 'profile', 'email']));
		setCustomScopes(['']);
		setCustomClaims(['']);
	};

	const allScopes = [
		...Array.from(selectedScopes),
		...customScopes.filter((scope) => scope.trim() !== ''),
	];

	const allClaims = [...standardClaims, ...customClaims.filter((claim) => claim.trim() !== '')];

	// Check current credentials status
	const currentCredentials = credentialManager.loadAuthzFlowCredentials();
	const hasCredentials = currentCredentials.environmentId && currentCredentials.clientId;
	const credentialStatus = hasCredentials ? 'complete' : 'missing';

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

			<Header>
				<h1>
					<FiSettings />
					Advanced Configuration
				</h1>
				<p>
					Customize OAuth scopes and OpenID Connect claims for your specific use case. Configure
					exactly what data your application requests and receives.
				</p>
			</Header>

			{/* Credential Status */}
			<CredentialStatus $status={credentialStatus}>
				<div
					style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
				>
					{credentialStatus === 'complete' ? <FiCheckCircle /> : <FiInfo />}
					<strong>
						{credentialStatus === 'complete' ? 'Credentials Configured' : 'Credentials Required'}
					</strong>
				</div>
				<p style={{ margin: 0, fontSize: '0.875rem' }}>
					{credentialStatus === 'complete'
						? 'Your PingOne credentials are configured. You can now test OAuth flows with your custom scopes and claims.'
						: 'Configure your PingOne credentials in the main Configuration page before using these advanced settings.'}
				</p>
			</CredentialStatus>

			<ConfigGrid>
				{/* OAuth Scopes Configuration */}
				<ConfigSection>
					<CardHeader>
						<h2>
							<FiShield />
							OAuth Scopes
						</h2>
						<p>Configure the permissions your application requests</p>
					</CardHeader>
					<CardBody>
						<div style={{ marginBottom: '1.5rem' }}>
							<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
								Standard Scopes
							</h3>
							{predefinedScopes.map((scope) => (
								<ScopeItem
									key={scope.id}
									active={selectedScopes.has(scope.id)}
									onClick={() => toggleScope(scope.id)}
									style={{ cursor: 'pointer' }}
								>
									<div>
										<div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{scope.label}</div>
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
											{scope.description}
										</div>
									</div>
									<div
										style={{
											width: '20px',
											height: '20px',
											borderRadius: '50%',
											border: '2px solid #d1d5db',
											backgroundColor: selectedScopes.has(scope.id) ? '#3b82f6' : 'white',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										{selectedScopes.has(scope.id) && (
											<div style={{ color: 'white', fontSize: '12px' }}></div>
										)}
									</div>
								</ScopeItem>
							))}
						</div>

						<div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '1rem',
								}}
							>
								<h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Custom Scopes</h3>
								<AddButton onClick={addCustomScope}>
									<FiPlus size={16} />
									Add Scope
								</AddButton>
							</div>
							{customScopes.map((scope, index) => (
								<div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
									<ClaimInput
										placeholder="Enter custom scope (e.g., read:contacts)"
										value={scope}
										onChange={(e) => updateCustomScope(index, e.target.value)}
									/>
									<RemoveButton onClick={() => removeCustomScope(index)}>
										<FiMinus size={16} />
									</RemoveButton>
								</div>
							))}
						</div>
					</CardBody>
				</ConfigSection>

				{/* OpenID Connect Claims Configuration */}
				<ConfigSection>
					<CardHeader>
						<h2>
							<FiEye />
							OpenID Connect Claims
						</h2>
						<p>Configure the user information your application receives</p>
					</CardHeader>
					<CardBody>
						<div style={{ marginBottom: '1.5rem' }}>
							<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
								Standard Claims (Included by default)
							</h3>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
									gap: '0.5rem',
								}}
							>
								{standardClaims.map((claim) => (
									<div
										key={claim}
										style={{
											padding: '0.5rem',
											backgroundColor: '#dbeafe',
											border: '1px solid #3b82f6',
											borderRadius: '0.25rem',
											fontSize: '0.75rem',
											fontFamily: 'monospace',
											textAlign: 'center',
											color: '#1e40af',
										}}
									>
										{claim}
									</div>
								))}
							</div>
						</div>

						<div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '1rem',
								}}
							>
								<h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Custom Claims</h3>
								<AddButton onClick={addCustomClaim}>
									<FiPlus size={16} />
									Add Claim
								</AddButton>
							</div>
							{customClaims.map((claim, index) => (
								<ClaimItem key={index}>
									<FiEdit size={16} style={{ color: '#6b7280' }} />
									<ClaimInput
										placeholder="Enter custom claim (e.g., department)"
										value={claim}
										onChange={(e) => updateCustomClaim(index, e.target.value)}
									/>
									<RemoveButton onClick={() => removeCustomClaim(index)}>
										<FiMinus size={16} />
									</RemoveButton>
								</ClaimItem>
							))}
						</div>
					</CardBody>
				</ConfigSection>
			</ConfigGrid>

			{/* Configuration Preview */}
			<PreviewSection>
				<CardHeader>
					<h2>
						<FiSave />
						Configuration Preview
					</h2>
					<p>Review your configuration and generate code snippets for your application</p>
				</CardHeader>
				<CardBody>
					<div style={{ marginBottom: '1.5rem' }}>
						<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
							Requested Scopes
						</h3>
						<div
							style={{
								fontFamily: 'monospace',
								fontSize: '0.875rem',
								color: '#059669',
								backgroundColor: '#f0fdf4',
								padding: '0.5rem',
								borderRadius: '0.25rem',
							}}
						>
							{allScopes.join(' ')}
						</div>
					</div>

					<div style={{ marginBottom: '1.5rem' }}>
						<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
							Live Configuration JSON
						</h3>
						<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
							This JSON updates automatically as you modify scopes and claims. Each scope is
							color-coded for easy identification.
						</p>
						<JsonEditor
							value={configurationObject}
							scopeColors={scopeColors}
							height="300px"
							readOnly={true}
						/>
					</div>

					<div style={{ marginBottom: '1.5rem' }}>
						<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
							<FiTerminal />
							Generated Configuration Code
						</h3>
						<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
							Copy this code snippet to integrate your custom configuration into your application.
						</p>
						<CodeBlockWithCopy label="config">{generateConfigSnippet()}</CodeBlockWithCopy>
					</div>

					<InfoBox $type="info">
						<strong>Integration Tip:</strong> Use the generated configuration in your OAuth flows.
						The scopes will be included in authorization requests, and claims will be requested from
						the UserInfo endpoint.
					</InfoBox>

					<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
						<SaveButton onClick={saveConfiguration}>
							<FiSave />
							{saved ? 'Configuration Saved!' : 'Save Configuration'}
						</SaveButton>
						<button
							onClick={resetToDefaults}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								backgroundColor: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								cursor: 'pointer',
								fontSize: '1rem',
								fontWeight: '500',
								transition: 'background-color 0.2s',
							}}
							onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
							onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
						>
							<FiRotateCcw />
							Reset to Defaults
						</button>
					</div>
				</CardBody>
			</PreviewSection>
			</ContentWrapper>
		</PageContainer>
	);
};

export default AdvancedConfiguration;
