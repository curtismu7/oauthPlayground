// src/pages/learn/ResponseModesLearnPage.tsx
// Standalone learn page for Response Modes with editable inputs and presets

import React, { useCallback, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import ResponseModeExamples, {
	type ResponseModeExample,
} from '../../components/response-modes/ResponseModeExamples';
import ResponseModeSelector, {
	type ResponseModeSelectorProps,
} from '../../components/response-modes/ResponseModeSelector';
import { FlowHeader } from '../../services/flowHeaderService';

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const ContentWrapper = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const MainCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
`;

const Section = styled.section`
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionDescription = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const InfoBox = styled.div<{ $variant: 'info' | 'success' | 'warning' | 'danger' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  
  ${(props) => {
		switch (props.$variant) {
			case 'info':
				return 'background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af;';
			case 'success':
				return 'background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;';
			case 'warning':
				return 'background: #fffbeb; border: 1px solid #fed7aa; color: #92400e;';
			case 'danger':
				return 'background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;';
			default:
				return '';
		}
	}}
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const CompatibilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const CompatibilityCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const CompatibilityTitle = styled.h5`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const CompatibilityList = styled.ul`
  margin: 0;
  padding-left: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.5;
`;

const CompatibilityItem = styled.li`
  margin-bottom: 0.25rem;
`;

const ResponseModesLearnPage: React.FC = () => {
	// Form state
	const [formData, setFormData] = useState({
		flowKey: 'authorization_code' as ResponseModeSelectorProps['flowKey'],
		responseType: 'code' as ResponseModeSelectorProps['responseType'],
		clientId: 'my_app_client',
		redirectUri: 'https://myapp.com/callback',
		scope: 'openid profile email',
		state: 'random_state_123',
		nonce: 'random_nonce_456',
	});

	// Handle form input changes
	const handleInputChange = useCallback((field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	// Handle example selection
	const handleSelectExample = useCallback((example: ResponseModeExample) => {
		setFormData({
			flowKey: example.flowKey,
			responseType: example.responseType,
			clientId: example.clientId,
			redirectUri: example.redirectUri,
			scope: example.scope,
			state: example.state,
			nonce: example.nonce || 'random_nonce_456',
		});
	}, []);

	return (
		<Container>
			<FlowHeader flowId="response-modes-learn" />

			<ContentWrapper>
				<MainCard>
					<Section>
						<SectionTitle>
							<FiInfo size={20} />
							Understanding Response Modes
						</SectionTitle>
						<SectionDescription>
							Response modes determine how authorization responses are returned to your application.
							Choose the right mode based on your application type and security requirements.
						</SectionDescription>

						<InfoBox $variant="info">
							<FiInfo size={20} />
							<InfoContent>
								<InfoTitle>What are Response Modes?</InfoTitle>
								<InfoText>
									Response modes specify how the authorization server returns authorization response
									parameters to the client application. They affect both security and usability of
									your OAuth/OIDC implementation.
								</InfoText>
							</InfoContent>
						</InfoBox>

						<InfoBox $variant="warning">
							<FiAlertTriangle size={20} />
							<InfoContent>
								<InfoTitle>Security Considerations</InfoTitle>
								<InfoText>
									Different response modes have different security implications. Fragment mode is
									recommended for SPAs to prevent token leakage in server logs, while query mode is
									standard for server-side applications.
								</InfoText>
							</InfoContent>
						</InfoBox>
					</Section>

					<Section>
						<SectionTitle>
							<FiCheckCircle size={20} />
							Interactive Examples
						</SectionTitle>
						<SectionDescription>
							Try different configurations and see live previews of how authorization requests and
							responses work.
						</SectionDescription>

						<ResponseModeExamples onSelectExample={handleSelectExample} />

						<SectionTitle>Custom Configuration</SectionTitle>
						<SectionDescription>
							Adjust these parameters to see how they affect the authorization request and response.
						</SectionDescription>

						<InputGrid>
							<InputGroup>
								<InputLabel>Flow Type</InputLabel>
								<Select
									value={formData.flowKey}
									onChange={(e) => handleInputChange('flowKey', e.target.value)}
								>
									<option value="authorization_code">Authorization Code</option>
									<option value="implicit">Implicit</option>
									<option value="hybrid">Hybrid</option>
									<option value="device">Device Code</option>
									<option value="client_credentials">Client Credentials</option>
								</Select>
							</InputGroup>

							<InputGroup>
								<InputLabel>Response Type</InputLabel>
								<Select
									value={formData.responseType}
									onChange={(e) => handleInputChange('responseType', e.target.value)}
								>
									<option value="code">code</option>
									<option value="token">token</option>
									<option value="id_token">id_token</option>
									<option value="token id_token">token id_token</option>
									<option value="code id_token">code id_token</option>
									<option value="code token">code token</option>
									<option value="code token id_token">code token id_token</option>
								</Select>
							</InputGroup>

							<InputGroup>
								<InputLabel>Client ID</InputLabel>
								<Input
									type="text"
									value={formData.clientId}
									onChange={(e) => handleInputChange('clientId', e.target.value)}
									placeholder="your_client_id"
								/>
							</InputGroup>

							<InputGroup>
								<InputLabel>Redirect URI</InputLabel>
								<Input
									type="url"
									value={formData.redirectUri}
									onChange={(e) => handleInputChange('redirectUri', e.target.value)}
									placeholder="https://yourapp.com/callback"
								/>
							</InputGroup>

							<InputGroup>
								<InputLabel>Scope</InputLabel>
								<Input
									type="text"
									value={formData.scope}
									onChange={(e) => handleInputChange('scope', e.target.value)}
									placeholder="openid profile email"
								/>
							</InputGroup>

							<InputGroup>
								<InputLabel>State</InputLabel>
								<Input
									type="text"
									value={formData.state}
									onChange={(e) => handleInputChange('state', e.target.value)}
									placeholder="random_state_123"
								/>
							</InputGroup>

							<InputGroup>
								<InputLabel>Nonce (OIDC)</InputLabel>
								<Input
									type="text"
									value={formData.nonce}
									onChange={(e) => handleInputChange('nonce', e.target.value)}
									placeholder="random_nonce_456"
								/>
							</InputGroup>
						</InputGrid>

						<ResponseModeSelector
							flowKey={formData.flowKey}
							responseType={formData.responseType}
							redirectUri={formData.redirectUri}
							clientId={formData.clientId}
							scope={formData.scope}
							state={formData.state}
							nonce={formData.nonce}
							readOnlyFlowContext={false}
						/>
					</Section>

					<Section>
						<SectionTitle>
							<FiShield size={20} />
							Compatibility Matrix
						</SectionTitle>
						<SectionDescription>
							Understanding which response modes work best with different response types and flow
							types.
						</SectionDescription>

						<CompatibilityGrid>
							<CompatibilityCard>
								<CompatibilityTitle>Authorization Code Flow</CompatibilityTitle>
								<CompatibilityList>
									<CompatibilityItem>
										<strong>Query:</strong> Standard, server-side handling
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>Fragment:</strong> Unusual, client-side handling
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>Form POST:</strong> Allowed by OIDC specification
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>pi.flow:</strong> PingOne proprietary
									</CompatibilityItem>
								</CompatibilityList>
							</CompatibilityCard>

							<CompatibilityCard>
								<CompatibilityTitle>Implicit Flow</CompatibilityTitle>
								<CompatibilityList>
									<CompatibilityItem>
										<strong>Query:</strong> Not recommended for tokens
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>Fragment:</strong> Recommended for SPAs
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>Form POST:</strong> Not standard for tokens
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>pi.flow:</strong> Requires server-side exchange
									</CompatibilityItem>
								</CompatibilityList>
							</CompatibilityCard>

							<CompatibilityCard>
								<CompatibilityTitle>Hybrid Flow</CompatibilityTitle>
								<CompatibilityList>
									<CompatibilityItem>
										<strong>Query:</strong> May expose tokens in logs
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>Fragment:</strong> Recommended for security
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>Form POST:</strong> Secure parameter transmission
									</CompatibilityItem>
									<CompatibilityItem>
										<strong>pi.flow:</strong> Requires server-side exchange
									</CompatibilityItem>
								</CompatibilityList>
							</CompatibilityCard>

							<CompatibilityCard>
								<CompatibilityTitle>Device Code Flow</CompatibilityTitle>
								<CompatibilityList>
									<CompatibilityItem>
										<strong>All modes:</strong> Not applicable - no browser redirects
									</CompatibilityItem>
									<CompatibilityItem>Uses polling-based token exchange</CompatibilityItem>
									<CompatibilityItem>No response mode selection needed</CompatibilityItem>
								</CompatibilityList>
							</CompatibilityCard>
						</CompatibilityGrid>
					</Section>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default ResponseModesLearnPage;
