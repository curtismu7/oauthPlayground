// src/pages/UltimateTokenDisplayDemo.tsx
// Demo page showcasing the UltimateTokenDisplay component
import React, { useState } from 'react';
import { FiRefreshCw, FiSettings, FiZap, FiSave, FiUpload } from 'react-icons/fi';
import styled from 'styled-components';
import UltimateTokenDisplay from '../components/UltimateTokenDisplay';
import { v4ToastManager } from '../utils/v4ToastMessages';

const Container = styled.div`
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 0;
`;

const ContentWrapper = styled.div`
  max-width: 90rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
`;

const ControlPanel = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ControlLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
`;

const DemoSection = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const mockTokenSets = {
	oauth: {
		access_token:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoicmVhZDp1c2VyIHdyaXRlOnVzZXIiLCJhdWQiOiJvYXV0aC1wbGF5Z3JvdW5kIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiZXhwIjoxNzI5NjM5NDQ3LCJpYXQiOjE3Mjk2MzU4NDcsImp0aSI6InRva2VuXzEyMyIsInRva2VuX3VzZSI6ImFjY2VzcyIsImNsaWVudF9pZCI6Im9hdXRoLXBsYXlncm91bmQtY2xpZW50IiwidXNlcm5hbWUiOiJqb2huLmRvZUBleGFtcGxlLmNvbSJ9.signature_here',
		refresh_token: 'rt_oauth_abcdef123456789',
		token_type: 'Bearer',
		expires_in: 3600,
		scope: 'read:user write:user',
	},
	oidc: {
		access_token:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ1NiIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdWQiOiJvaWRjLWNsaWVudCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0NywiaWF0IjoxNzI5NjM1ODQ3LCJqdGkiOiJ0b2tlbl80NTYiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJjbGllbnRfaWQiOiJvaWRjLWNsaWVudCIsInVzZXJuYW1lIjoiamFuZS5zbWl0aEBleGFtcGxlLmNvbSJ9.signature_here',
		id_token:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ1NiIsIm5hbWUiOiJKYW5lIFNtaXRoIiwiZW1haWwiOiJqYW5lLnNtaXRoQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpY3R1cmUiOiJodHRwczovL2V4YW1wbGUuY29tL2F2YXRhci5qcGciLCJhdWQiOiJvaWRjLWNsaWVudCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0NywiaWF0IjoxNzI5NjM1ODQ3LCJub25jZSI6Im5vbmNlXzEyMyIsImF0X2hhc2giOiJhdF9oYXNoXzQ1NiJ9.signature_here',
		refresh_token: 'rt_oidc_xyz789012345',
		token_type: 'Bearer',
		expires_in: 3600,
		scope: 'openid profile email',
	},
	tokenExchange: {
		access_token:
			'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzZXJ2aWNlX2FjY291bnRfMTIzIiwiYXVkIjoiaHR0cHM6Ly9tY3AuY2JhLmNvbS5hdSIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsInNjb3BlIjoibWNwOnJlYWQgYmFua2luZzp0cmFuc2FjdGlvbnMiLCJleHAiOjE3Mjk2Mzk0NDcsImlhdCI6MTcyOTYzNTg0NywianRpIjoidG9rZW5fZXhjaGFuZ2VfNzg5IiwidG9rZW5fdXNlIjoiYWNjZXNzIiwiY2xpZW50X2lkIjoiYmFua2luZy1jbGllbnQiLCJ1c2VybmFtZSI6InN5c3RlbSJ9.signature_here',
		token_type: 'Bearer',
		expires_in: 1800,
		scope: 'mcp:read banking:transactions',
		audience: 'https://mcp.cba.com.au',
		issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
	},
};

const UltimateTokenDisplayDemo: React.FC = () => {
	const [selectedTokenSet, setSelectedTokenSet] = useState<keyof typeof mockTokenSets>('oauth');
	const [displayMode, setDisplayMode] = useState<'compact' | 'detailed' | 'educational'>(
		'detailed'
	);
	const [flowType, setFlowType] = useState<'oauth' | 'oidc' | 'token-exchange'>('oauth');
	const [tokenEndpointAuth, setTokenEndpointAuth] = useState<string>('client_secret_basic');

	// Feature toggles
	const [showCopyButtons, setShowCopyButtons] = useState(true);
	const [showDecodeButtons, setShowDecodeButtons] = useState(true);
	const [showMaskToggle, setShowMaskToggle] = useState(true);
	const [showTokenManagement, setShowTokenManagement] = useState(true);
	const [showEducationalInfo, _setShowEducationalInfo] = useState(false);
	const [showMetadata, setShowMetadata] = useState(true);
	const [showSyntaxHighlighting, _setShowSyntaxHighlighting] = useState(false);
	const [defaultMasked, setDefaultMasked] = useState(false);

	// Load saved configuration on mount
	React.useEffect(() => {
		const savedConfig = localStorage.getItem('ultimate-token-display-config');
		if (savedConfig) {
			try {
				const config = JSON.parse(savedConfig);
				if (config.tokenEndpointAuth) {
					setTokenEndpointAuth(config.tokenEndpointAuth);
				}
				if (config.selectedTokenSet) {
					setSelectedTokenSet(config.selectedTokenSet);
				}
				if (config.displayMode) {
					setDisplayMode(config.displayMode);
				}
				if (config.flowType) {
					setFlowType(config.flowType);
				}
				if (config.showCopyButtons !== undefined) {
					setShowCopyButtons(config.showCopyButtons);
				}
				if (config.showDecodeButtons !== undefined) {
					setShowDecodeButtons(config.showDecodeButtons);
				}
				if (config.showMaskToggle !== undefined) {
					setShowMaskToggle(config.showMaskToggle);
				}
				if (config.showTokenManagement !== undefined) {
					setShowTokenManagement(config.showTokenManagement);
				}
				if (config.showMetadata !== undefined) {
					setShowMetadata(config.showMetadata);
				}
				if (config.defaultMasked !== undefined) {
					setDefaultMasked(config.defaultMasked);
				}
			} catch (error) {
				console.error('Failed to load saved configuration:', error);
			}
		}
	}, []);

	const handleTokenAnalyze = (tokenType: string, _token: string) => {
		v4ToastManager.showInfo(`Custom analysis requested for ${tokenType} token`);
	};

	const generateNewTokens = () => {
		// Simulate generating new tokens with different timestamps
		const _timestamp = Date.now();
		v4ToastManager.showSuccess('Generated new mock tokens with fresh timestamps');
	};

	const saveConfiguration = () => {
		const config = {
			tokenEndpointAuth,
			selectedTokenSet,
			displayMode,
			flowType,
			showCopyButtons,
			showDecodeButtons,
			showMaskToggle,
			showTokenManagement,
			showMetadata,
			defaultMasked,
		};
		
		localStorage.setItem('ultimate-token-display-config', JSON.stringify(config));
		v4ToastManager.showSuccess('Configuration saved successfully');
	};

	const importConfiguration = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.onchange = (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const config = JSON.parse(e.target?.result as string);
						
						// Restore configuration
						if (config.tokenEndpointAuth) {
							setTokenEndpointAuth(config.tokenEndpointAuth);
						}
						if (config.selectedTokenSet) {
							setSelectedTokenSet(config.selectedTokenSet);
						}
						if (config.displayMode) {
							setDisplayMode(config.displayMode);
						}
						if (config.flowType) {
							setFlowType(config.flowType);
						}
						if (config.showCopyButtons !== undefined) {
							setShowCopyButtons(config.showCopyButtons);
						}
						if (config.showDecodeButtons !== undefined) {
							setShowDecodeButtons(config.showDecodeButtons);
						}
						if (config.showMaskToggle !== undefined) {
							setShowMaskToggle(config.showMaskToggle);
						}
						if (config.showTokenManagement !== undefined) {
							setShowTokenManagement(config.showTokenManagement);
						}
						if (config.showMetadata !== undefined) {
							setShowMetadata(config.showMetadata);
						}
						if (config.defaultMasked !== undefined) {
							setDefaultMasked(config.defaultMasked);
						}
						
						v4ToastManager.showSuccess('Configuration imported successfully');
					} catch (error) {
						console.error('Failed to import configuration:', error);
						v4ToastManager.showError('Failed to import configuration. Invalid file format.');
					}
				};
				reader.readAsText(file);
			}
		};
		
		input.click();
	};

	return (
		<Container>
			<ContentWrapper>
				<Header>
					<Title>🔐 Ultimate Token Display</Title>
					<Subtitle>
						The most comprehensive token display component combining all the best features
					</Subtitle>
				</Header>

				<ControlPanel>
					<SectionTitle>
						<FiSettings size={20} />
						Configuration Panel
					</SectionTitle>

					<ControlGrid>
						<ControlGroup>
							<ControlLabel>Token Set</ControlLabel>
							<Select
								value={selectedTokenSet}
								onChange={(e) => setSelectedTokenSet(e.target.value as keyof typeof mockTokenSets)}
							>
								<option value="oauth">OAuth 2.0 Tokens</option>
								<option value="oidc">OIDC Tokens (with ID Token)</option>
								<option value="tokenExchange">Token Exchange Result</option>
							</Select>
						</ControlGroup>

						<ControlGroup>
							<ControlLabel>Display Mode</ControlLabel>
							<Select value={displayMode} onChange={(e) => setDisplayMode(e.target.value as any)}>
								<option value="compact">Compact</option>
								<option value="detailed">Detailed</option>
								<option value="educational">Educational</option>
							</Select>
						</ControlGroup>

						<ControlGroup>
							<ControlLabel>Flow Type</ControlLabel>
							<Select value={flowType} onChange={(e) => setFlowType(e.target.value as any)}>
								<option value="oauth">OAuth 2.0</option>
								<option value="oidc">OpenID Connect</option>
								<option value="token-exchange">Token Exchange</option>
							</Select>
						</ControlGroup>

						<ControlGroup>
							<ControlLabel>Token Endpoint Authentication</ControlLabel>
							<Select value={tokenEndpointAuth} onChange={(e) => setTokenEndpointAuth(e.target.value)}>
								<option value="client_secret_basic">Client Secret Basic</option>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="client_secret_jwt">Client Secret JWT</option>
								<option value="private_key_jwt">Private Key JWT</option>
								<option value="none">None (Public Client)</option>
							</Select>
						</ControlGroup>

						<ControlGroup>
							<CheckboxGroup>
								<Checkbox
									type="checkbox"
									checked={showCopyButtons}
									onChange={(e) => setShowCopyButtons(e.target.checked)}
								/>
								<ControlLabel>Show Copy Buttons</ControlLabel>
							</CheckboxGroup>
						</ControlGroup>

						<ControlGroup>
							<CheckboxGroup>
								<Checkbox
									type="checkbox"
									checked={showDecodeButtons}
									onChange={(e) => setShowDecodeButtons(e.target.checked)}
								/>
								<ControlLabel>Show Decode Buttons</ControlLabel>
							</CheckboxGroup>
						</ControlGroup>

						<ControlGroup>
							<CheckboxGroup>
								<Checkbox
									type="checkbox"
									checked={showMaskToggle}
									onChange={(e) => setShowMaskToggle(e.target.checked)}
								/>
								<ControlLabel>Show Mask Toggle</ControlLabel>
							</CheckboxGroup>
						</ControlGroup>

						<ControlGroup>
							<CheckboxGroup>
								<Checkbox
									type="checkbox"
									checked={showTokenManagement}
									onChange={(e) => setShowTokenManagement(e.target.checked)}
								/>
								<ControlLabel>Token Management Integration</ControlLabel>
							</CheckboxGroup>
						</ControlGroup>

						<ControlGroup>
							<CheckboxGroup>
								<Checkbox
									type="checkbox"
									checked={showMetadata}
									onChange={(e) => setShowMetadata(e.target.checked)}
								/>
								<ControlLabel>Show Metadata</ControlLabel>
							</CheckboxGroup>
						</ControlGroup>

						<ControlGroup>
							<CheckboxGroup>
								<Checkbox
									type="checkbox"
									checked={defaultMasked}
									onChange={(e) => setDefaultMasked(e.target.checked)}
								/>
								<ControlLabel>Default Masked</ControlLabel>
							</CheckboxGroup>
						</ControlGroup>
					</ControlGrid>

					<div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
						<Button onClick={generateNewTokens}>
							<FiRefreshCw size={16} />
							Generate New Tokens
						</Button>
						<Button onClick={saveConfiguration}>
							<FiSave size={16} />
							Save Configuration
						</Button>
						<Button onClick={importConfiguration}>
							<FiUpload size={16} />
							Import Configuration
						</Button>
					</div>
				</ControlPanel>

				<DemoSection>
					<SectionTitle>
						<FiZap size={20} />
						Live Demo
					</SectionTitle>

					<UltimateTokenDisplay
						tokens={mockTokenSets[selectedTokenSet]}
						flowType={flowType}
						flowKey={`${selectedTokenSet}-demo`}
						displayMode={displayMode}
						showCopyButtons={showCopyButtons}
						showDecodeButtons={showDecodeButtons}
						showMaskToggle={showMaskToggle}
						showTokenManagement={showTokenManagement}
						showEducationalInfo={showEducationalInfo}
						showMetadata={showMetadata}
						showSyntaxHighlighting={showSyntaxHighlighting}
						defaultMasked={defaultMasked}
						onTokenAnalyze={handleTokenAnalyze}
					/>
				</DemoSection>

				<DemoSection>
					<SectionTitle>Features Showcase</SectionTitle>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '2rem',
						}}
					>
						<div
							style={{
								background: 'white',
								padding: '1.5rem',
								borderRadius: '8px',
								border: '1px solid #e2e8f0',
							}}
						>
							<h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>🎨 Visual Features</h3>
							<ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
								<li>Color-coded token types with gradients</li>
								<li>Responsive design with hover effects</li>
								<li>Professional styling and animations</li>
								<li>Empty state handling</li>
								<li>Multiple display modes</li>
							</ul>
						</div>

						<div
							style={{
								background: 'white',
								padding: '1.5rem',
								borderRadius: '8px',
								border: '1px solid #e2e8f0',
							}}
						>
							<h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>🔧 Functional Features</h3>
							<ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
								<li>JWT decoding with header/payload separation</li>
								<li>Token masking/unmasking</li>
								<li>Copy to clipboard with feedback</li>
								<li>Token Management integration</li>
								<li>Custom analysis callbacks</li>
							</ul>
						</div>

						<div
							style={{
								background: 'white',
								padding: '1.5rem',
								borderRadius: '8px',
								border: '1px solid #e2e8f0',
							}}
						>
							<h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>📊 Metadata Features</h3>
							<ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
								<li>Token expiry formatting</li>
								<li>Scope display</li>
								<li>Token type indicators</li>
								<li>Flow-specific configuration</li>
								<li>Opaque token handling</li>
							</ul>
						</div>
					</div>
				</DemoSection>
			</ContentWrapper>
		</Container>
	);
};

export default UltimateTokenDisplayDemo;
