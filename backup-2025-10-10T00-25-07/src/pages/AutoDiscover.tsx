import React, { useState } from 'react';
import { FiCheckCircle, FiGlobe, FiInfo, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import DiscoveryPanel from '../components/DiscoveryPanel';
import { usePageScroll } from '../hooks/usePageScroll';
import { OpenIDConfiguration } from '../services/discoveryService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { FlowHeader } from '../services/flowHeaderService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  p {
    margin: 0;
    color: #6b7280;
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const InfoCard = styled.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #4b5563;
    line-height: 1.6;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const AutoDiscover: React.FC = () => {
	// Centralized scroll management - ALL pages start at top
	usePageScroll({ pageName: 'OIDC Discovery', force: true });

	const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
	const [lastDiscovered, setLastDiscovered] = useState<{
		environmentId: string;
		timestamp: Date;
	} | null>(null);

	const handleConfigurationDiscovered = (config: OpenIDConfiguration, environmentId: string) => {
		try {
			// Save the discovered configuration to config credentials
			const success = credentialManager.saveConfigCredentials({
				environmentId: environmentId,
				clientId: '', // Will be filled in by user
				redirectUri: `${window.location.origin}/authz-callback`,
				scopes: ['openid', 'profile', 'email'],
				authEndpoint: config.authorization_endpoint,
				tokenEndpoint: config.token_endpoint,
				userInfoEndpoint: config.userinfo_endpoint,
				endSessionEndpoint: config.end_session_endpoint,
			});

			if (success) {
				setLastDiscovered({
					environmentId,
					timestamp: new Date(),
				});

				logger.success('AutoDiscover', 'Configuration saved successfully', {
					environmentId,
					authEndpoint: config.authorization_endpoint,
					tokenEndpoint: config.token_endpoint,
				});
			} else {
				logger.error('AutoDiscover', 'Failed to save discovered configuration');
			}
		} catch (error) {
			logger.error('AutoDiscover', 'Error saving configuration', error as Error);
		}
	};

	return (
		<PageContainer>
			<FlowHeader flowType="auto-discover" />

			<InfoCard>
				<h3>
					<FiInfo />
					How it works
				</h3>
				<ul>
					<li>Enter your PingOne Environment ID</li>
					<li>Select your region (US, EU, CA, or AP)</li>
					<li>Click "Discover" to fetch the OpenID configuration</li>
					<li>The discovered endpoints will be automatically saved to your configuration</li>
					<li>You can then use these endpoints for OAuth flows</li>
				</ul>
			</InfoCard>

			<ActionButton onClick={() => setShowDiscoveryPanel(true)}>
				<FiGlobe />
				Start OIDC Discovery
			</ActionButton>

			{lastDiscovered && (
				<SuccessMessage>
					<FiCheckCircle />
					Configuration discovered and saved for environment {lastDiscovered.environmentId}
					at {lastDiscovered.timestamp.toLocaleString()}
				</SuccessMessage>
			)}

			{showDiscoveryPanel && (
				<DiscoveryPanel
					onConfigurationDiscovered={handleConfigurationDiscovered}
					onClose={() => setShowDiscoveryPanel(false)}
				/>
			)}
		</PageContainer>
	);
};

export default AutoDiscover;
