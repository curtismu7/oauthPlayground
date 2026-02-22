// src/components/RARComponentsDemo.tsx
// Demo component showcasing the new RAR UI components

import React, { useState } from 'react';
import { FiCheckCircle, FiEye, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import RARService, { type AuthorizationDetail } from '../services/rarService';
import AuthorizationDetailsEditor from './AuthorizationDetailsEditor';
import RARExampleSelector from './RARExampleSelector';
import RARValidationDisplay from './RARValidationDisplay';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f9fafb;
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SideColumn = styled.div`
  position: sticky;
  top: 2rem;
`;

const ConfigPanel = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
`;

const ConfigTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConfigOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const ConfigCheckbox = styled.input`
  margin: 0;
`;

const ScopeInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: 0.5rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const StatsPanel = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

export const RARComponentsDemo: React.FC = () => {
	const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetail[]>(() =>
		RARService.getExampleAuthorizationDetails()
	);
	const [showScopeValidation, setShowScopeValidation] = useState(false);
	const [grantedScopes, setGrantedScopes] = useState('openid profile email');

	const scopesArray = grantedScopes.split(' ').filter(Boolean);
	const validation = RARService.validateAuthorizationDetails(authorizationDetails);

	return (
		<Container>
			<Header>
				<Title>RAR UI Components Demo</Title>
				<Subtitle>
					Interactive demonstration of the new Rich Authorization Requests UI components
				</Subtitle>
			</Header>

			<TwoColumnLayout>
				<MainColumn>
					<Section>
						<SectionHeader>
							<FiCheckCircle size={20} color="#059669" />
							<SectionTitle>Example Selector</SectionTitle>
						</SectionHeader>
						<SectionDescription>
							Choose from pre-built authorization detail templates including the new
							customer_information type. Click "Use Example" to load the template into the editor
							below.
						</SectionDescription>
						<RARExampleSelector onSelectExample={setAuthorizationDetails} />
					</Section>

					<Section>
						<SectionHeader>
							<FiSettings size={20} color="#3b82f6" />
							<SectionTitle>Authorization Details Editor</SectionTitle>
						</SectionHeader>
						<SectionDescription>
							Edit authorization details using either the visual editor or JSON editor. The editor
							provides real-time validation and supports all RAR authorization detail types.
						</SectionDescription>
						<AuthorizationDetailsEditor
							authorizationDetails={authorizationDetails}
							onUpdate={setAuthorizationDetails}
						/>
					</Section>
				</MainColumn>

				<SideColumn>
					<ConfigPanel>
						<ConfigTitle>
							<FiSettings size={16} />
							Configuration
						</ConfigTitle>

						<ConfigOption>
							<ConfigCheckbox
								type="checkbox"
								checked={showScopeValidation}
								onChange={(e) => setShowScopeValidation(e.target.checked)}
							/>
							Enable scope validation
						</ConfigOption>

						{showScopeValidation && (
							<div>
								<label
									style={{
										fontSize: '0.875rem',
										color: '#374151',
										display: 'block',
										marginBottom: '0.5rem',
									}}
									htmlFor="grantedscopes"
								>
									Granted Scopes:
								</label>
								<ScopeInput
									value={grantedScopes}
									onChange={(e) => setGrantedScopes(e.target.value)}
									placeholder="openid profile email"
								/>
							</div>
						)}
					</ConfigPanel>

					<StatsPanel>
						<ConfigTitle>
							<FiEye size={16} />
							Statistics
						</ConfigTitle>
						<StatsGrid>
							<StatItem>
								<StatValue>{authorizationDetails.length}</StatValue>
								<StatLabel>Total Details</StatLabel>
							</StatItem>
							<StatItem>
								<StatValue>{validation.valid ? 'Valid' : 'Invalid'}</StatValue>
								<StatLabel>Status</StatLabel>
							</StatItem>
							<StatItem>
								<StatValue>{validation.errors.length}</StatValue>
								<StatLabel>Errors</StatLabel>
							</StatItem>
							<StatItem>
								<StatValue>
									{[...new Set(authorizationDetails.map((d) => d.type).filter(Boolean))].length}
								</StatValue>
								<StatLabel>Types</StatLabel>
							</StatItem>
						</StatsGrid>
					</StatsPanel>

					<RARValidationDisplay
						authorizationDetails={authorizationDetails}
						grantedScopes={scopesArray}
						showScopeValidation={showScopeValidation}
					/>
				</SideColumn>
			</TwoColumnLayout>
		</Container>
	);
};

export default RARComponentsDemo;
