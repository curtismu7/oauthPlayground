import React, { useState } from 'react';
import styled from 'styled-components';
import DiscoveryPanel from '../components/DiscoveryPanel';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { OpenIDConfiguration } from '../services/discoveryService';
import { FlowHeader } from '../services/flowHeaderService';
import { UnifiedTokenStorageService } from '../services/unifiedTokenStorageService';
import { logger } from '../utils/logger';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const InfoSection = styled.div`
  margin-bottom: 2rem;
`;

const InfoContent = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #1f2937;
    line-height: 1.8;
    
    li {
      margin-bottom: 0.75rem;
      
      strong {
        color: #111827;
      }
    }
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #b91c1c;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  i {
    font-size: 1.25rem;
  }
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  i {
    font-size: 1.5rem;
    color: #16a34a;
  }
  
  span {
    color: #111827;
  }
`;

const AutoDiscover: React.FC = () => {
	// Centralized scroll management - ALL pages start at top
	usePageScroll({ pageName: 'OIDC Discovery', force: true });

	const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
	const [lastDiscovered, setLastDiscovered] = useState<{
		environmentId: string;
		timestamp: Date;
	} | null>(null);

	const handleConfigurationDiscovered = async (
		config: OpenIDConfiguration,
		environmentId: string
	) => {
		try {
			// Save the discovered configuration to unified storage
			const storageService = new UnifiedTokenStorageService();
			await storageService.storeOAuthCredentials(
				{
					environmentId: environmentId,
					clientId: '', // Will be filled in by user
					redirectUri: `${window.location.origin}/authz-callback`,
					scopes: ['openid', 'profile', 'email'],
					authEndpoint: config.authorization_endpoint,
					tokenEndpoint: config.token_endpoint,
					userInfoEndpoint: config.userinfo_endpoint,
					endSessionEndpoint: config.end_session_endpoint,
				},
				{
					environmentId: environmentId,
					flowType: 'authz_code',
					flowName: 'Auto-Discovered Configuration',
				}
			);

			setLastDiscovered({
				environmentId,
				timestamp: new Date(),
			});

			logger.success('AutoDiscover', 'Configuration saved to unified storage', {
				environmentId,
				authEndpoint: config.authorization_endpoint,
				tokenEndpoint: config.token_endpoint,
			});
		} catch (error) {
			logger.error('AutoDiscover', 'Error saving configuration to unified storage', error as Error);
		}
	};

	return (
		<PageContainer>
			<FlowHeader flowType="auto-discover" />

			<InfoSection>
				<CollapsibleHeader
					title="How OIDC Discovery Works"
					theme="ping"
					variant="compact"
					defaultCollapsed={false}
				>
					<InfoContent>
						<ul>
							<li>
								<strong>Step 1:</strong> Enter your PingOne Environment ID
							</li>
							<li>
								<strong>Step 2:</strong> Select your region (US, EU, CA, or AP)
							</li>
							<li>
								<strong>Step 3:</strong> Click "Discover" to fetch the OpenID configuration
							</li>
							<li>
								<strong>Step 4:</strong> The discovered endpoints will be automatically saved to
								your configuration
							</li>
							<li>
								<strong>Step 5:</strong> You can then use these endpoints for OAuth flows
							</li>
						</ul>
					</InfoContent>
				</CollapsibleHeader>
			</InfoSection>

			<ActionButton onClick={() => setShowDiscoveryPanel(true)} aria-label="Start OIDC Discovery">
				<i className="mdi mdi-earth" aria-hidden="true" />
				Start OIDC Discovery
			</ActionButton>

			{lastDiscovered && (
				<SuccessMessage>
					<i className="mdi mdi-check-circle" aria-hidden="true" />
					<span>
						Configuration discovered and saved for environment{' '}
						<strong>{lastDiscovered.environmentId}</strong> at{' '}
						{lastDiscovered.timestamp.toLocaleString()}
					</span>
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
