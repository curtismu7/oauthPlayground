/**
 * @file ResourcesAPIFlowV9.tsx
 * @module flows/v9
 * @description Educational flow for PingOne Resources API - V9 Version
 * @version 9.0.0
 * @since 2025-03-08
 *
 * Teaches developers how to use the PingOne Resources API to manage
 * OAuth 2.0 resources, scopes, and resource attributes.
 */

import type React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import ConfigurationButton from '../../../components/ConfigurationButton';
import { type FlowStep, StepByStepFlow } from '../../../components/StepByStepFlow';
import { FlowHeader } from '../../../services/flowHeaderService';
import { V9ModernMessagingService } from '../../../services/v9/V9ModernMessagingService';
import { logger } from '../../../utils/logger';

const messagingService = V9ModernMessagingService.getInstance();

// Styled Components
const Container = styled.div`
	min-height: 100vh;
	background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.PURPLE_DARK 100%);
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	max-width: 1200px;
	margin: 0 auto;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;
	color: white;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	margin-bottom: 1rem;
	background: linear-gradient(135deg, #ffffff 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
`;

const Subtitle = styled.p`
	font-size: 1.25rem;
	opacity: 0.9;
	max-width: 600px;
	margin: 0 auto;
`;

const DocLinksSection = styled.section`
	background: rgba(255, 255, 255, 0.08);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 0.75rem;
	padding: 1.25rem 1.5rem;
	margin-bottom: 2rem;
	color: white;
`;

const DocLinksTitle = styled.h3`
	margin: 0 0 0.75rem 0;
	font-size: 1.125rem;
	font-weight: 600;
`;

const DocLinksList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	line-height: 1.7;
	font-size: 0.9375rem;
	opacity: 0.95;
	li { margin-bottom: 0.5rem; }
`;

const DocLink = styled.a`
	color: #93c5fd;
	text-decoration: none;
	&:hover { text-decoration: underline; }
`;

const ResourcesAPIFlowV9: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [_executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());

	const steps: FlowStep[] = [
		{
			title: 'Understanding Resources API',
			description: 'Learn about the PingOne Resources API and its purpose in OAuth 2.0',
			code: `// Resources API Overview
// The PingOne Resources API allows you to:
// - Register and manage OAuth 2.0 resources
// - Define resource scopes and attributes
// - Control access to protected resources
// - Implement fine-grained authorization

// Resource Structure
{
  "name": "photo-album",
  "type": "urn:pingone:resource-type:api",
  "scopes": ["read", "write", "delete"],
  "attributes": {
    "owner": "user-id",
    "visibility": "private"
  }
}

logger.info('Resources API initialized', "Logger info");`,
			execute: () => {
				logger.info('ResourcesAPIFlowV9', 'Step 1: Understanding Resources API');
				messagingService.showFooterMessage({
					type: 'info',
					message: 'Resources API concepts loaded',
					duration: 3000,
				});
				setExecutedSteps((prev) => new Set(prev).add(0));
			},
		},
		{
			title: 'Register a Resource',
			description: 'Create a new resource in PingOne with proper scopes and attributes',
			code: `// Register Resource Example
const resourceData = {
  name: 'user-profile',
  type: 'urn:pingone:resource-type:api',
  scopes: [
    'profile:read',
    'profile:write',
    'profile:email'
  ],
  attributes: {
    'owner': 'application-id',
    'category': 'user-data',
    'sensitivity': 'personal'
  }
};

// API Call to Register Resource
const registerResource = async () => {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      },
      body: JSON.stringify(resourceData)
    });
    
    const resource = await response.json();
    logger.info('Resource registered:', resource);
    return resource;
  } catch (error) {
    logger.error('Failed to register resource:', error);
  }
};

await registerResource();`,
			execute: () => {
				logger.info('ResourcesAPIFlowV9', 'Step 2: Register a Resource');
				messagingService.showFooterMessage({
					type: 'success',
					message: 'Resource registration simulated',
					duration: 3000,
				});
				setExecutedSteps((prev) => new Set(prev).add(1));
			},
		},
		{
			title: 'Manage Resource Scopes',
			description: 'Learn how to manage and update resource scopes dynamically',
			code: `// Resource Scopes Management
const updateResourceScopes = async (resourceId: string, scopes: string[]) => {
  try {
    const response = await fetch(\`/api/resources/\${resourceId}/scopes\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      },
      body: JSON.stringify({ scopes })
    });
    
    const updatedResource = await response.json();
    logger.info('Scopes updated:', updatedResource.scopes);
    return updatedResource;
  } catch (error) {
    logger.error('Failed to update scopes:', error);
  }
};

// Example: Add new scope
const newScopes = ['profile:avatar', 'profile:preferences'];
await updateResourceScopes('user-profile-id', newScopes);

logger.info('Resource scopes management completed', "Logger info");`,
			execute: () => {
				logger.info('ResourcesAPIFlowV9', 'Step 3: Manage Resource Scopes');
				messagingService.showFooterMessage({
					type: 'info',
					message: 'Resource scopes updated',
					duration: 3000,
				});
				setExecutedSteps((prev) => new Set(prev).add(2));
			},
		},
		{
			title: 'Resource Attributes',
			description: 'Work with resource attributes for enhanced authorization control',
			code: `// Resource Attributes Management
const updateResourceAttributes = async (resourceId: string, attributes: Record<string, any>) => {
  try {
    const response = await fetch(\`/api/resources/\${resourceId}/attributes\`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      },
      body: JSON.stringify({ attributes })
    });
    
    const updatedResource = await response.json();
    logger.info('Attributes updated:', updatedResource.attributes);
    return updatedResource;
  } catch (error) {
    logger.error('Failed to update attributes:', error);
  }
};

// Example: Update attributes
const newAttributes = {
  'access_level': 'premium',
  'geo_restriction': ['US', 'CA', 'UK'],
  'rate_limit': '1000/hour'
};

await updateResourceAttributes('user-profile-id', newAttributes);

logger.info('Resource attributes management completed', "Logger info");`,
			execute: () => {
				logger.info('ResourcesAPIFlowV9', 'Step 4: Resource Attributes');
				messagingService.showFooterMessage({
					type: 'success',
					message: 'Resource attributes updated',
					duration: 3000,
				});
				setExecutedSteps((prev) => new Set(prev).add(3));
			},
		},
		{
			title: 'Resource Access Control',
			description: 'Implement access control using resources and scopes',
			code: `// Resource Access Control Example
const checkResourceAccess = async (resourceId: string, token: string) => {
  try {
    // Introspect token to get scopes
    const introspectionResponse = await fetch('/oauth/introspect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        token: token,
        client_id: 'YOUR_CLIENT_ID',
        client_secret: 'YOUR_CLIENT_SECRET'
      })
    });
    
    const tokenInfo = await introspectionResponse.json();
    
    // Get resource details
    const resourceResponse = await fetch(\`/api/resources/\${resourceId}\`);
    const resource = await resourceResponse.json();
    
    // Check if token has required scopes
    const requiredScopes = ['profile:read', 'profile:write'];
    const tokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
    
    const hasAccess = requiredScopes.every(scope => tokenScopes.includes(scope));
    
    logger.info('Access granted:', hasAccess);
    logger.info('Token scopes:', tokenScopes);
    logger.info('Required scopes:', requiredScopes);
    
    return {
      hasAccess,
      tokenScopes,
      requiredScopes,
      resource
    };
  } catch (error) {
    logger.error('Access check failed:', error);
    return { hasAccess: false, error };
  }
};

// Check access
const accessResult = await checkResourceAccess('user-profile-id', 'ACCESS_TOKEN');
logger.info('Access control check completed:', accessResult);`,
			execute: () => {
				logger.info('ResourcesAPIFlowV9', 'Step 5: Resource Access Control');
				messagingService.showFooterMessage({
					type: 'success',
					message: 'Access control check completed',
					duration: 3000,
				});
				setExecutedSteps((prev) => new Set(prev).add(4));
			},
		},
	];

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowType="resources-api-v9" customConfig={{ flowType: 'pingone' }} />

				<Header>
					<Title>📚 PingOne Resources API</Title>
					<Subtitle>
						Master OAuth 2.0 resource management with PingOne Resources API. Learn to register
						resources, manage scopes, and implement fine-grained access control.
					</Subtitle>
				</Header>

				<DocLinksSection>
					<DocLinksTitle>📖 PingOne Resources – Find documentation</DocLinksTitle>
					<DocLinksList>
						<li>
							<DocLink
								href="https://docs.pingidentity.com/pingone/applications/p1_resources.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								Resources – PingOne Applications (docs.pingidentity.com)
							</DocLink>{' '}
							— Web application endpoints (APIs) protected by OAuth 2.0; scopes and application
							permissions.
						</li>
						<li>
							<DocLink
								href="https://developer.pingidentity.com/pingone-api/platform/reference.html"
								target="_blank"
								rel="noopener noreferrer"
							>
								PingOne Platform API Reference (developer.pingidentity.com)
							</DocLink>{' '}
							— Authorization, resource management, and application features.
						</li>
						<li>
							<DocLink
								href="https://apidocs.pingidentity.com/pingone/main/v1/api/"
								target="_blank"
								rel="noopener noreferrer"
							>
								PingOne for Developers – Foundations API (apidocs.pingidentity.com)
							</DocLink>{' '}
							— API reference for environments, applications, and resources.
						</li>
					</DocLinksList>
				</DocLinksSection>

				<StepByStepFlow
					steps={steps}
					currentStep={currentStep}
					onStepChange={setCurrentStep}
					onStart={() => setStatus('loading')}
					onReset={() => {
						setCurrentStep(0);
						setStatus('idle');
						setExecutedSteps(new Set());
					}}
					status={status}
					disabled={status === 'loading'}
					title="Resources API Tutorial"
					configurationButton={<ConfigurationButton flowType="resources-api" />}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default ResourcesAPIFlowV9;
