// src/components/FlowInfoExample.tsx - Example usage of the FlowInfoService

import React from 'react';
import styled from 'styled-components';
import EnhancedFlowInfoCard from './EnhancedFlowInfoCard';
import { useFlowInfo } from '../hooks/useFlowInfo';

const Container = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`;

const Title = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #6b7280;
	margin-bottom: 2rem;
`;

const FlowGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 2rem;
	margin-bottom: 2rem;
`;

const FlowSection = styled.div`
	margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
`;

const FlowList = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
`;

const FlowItem = styled.div`
	padding: 1rem;
	background: #f9fafb;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		border-color: #3b82f6;
	}
`;

const FlowName = styled.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
`;

const FlowDescription = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
`;

const FlowInfoExample: React.FC = () => {
	// Example of using the hook for different flow types
	const oauthAuthCode = useFlowInfo('oauth-authorization-code', {
		showAdditionalInfo: true,
		showDocumentation: true,
		showCommonIssues: true,
		showImplementationNotes: true,
	});

	const oidcAuthCode = useFlowInfo('oidc-authorization-code', {
		showAdditionalInfo: true,
		showDocumentation: true,
		showCommonIssues: false,
		showImplementationNotes: false,
	});

	const clientCredentials = useFlowInfo('client-credentials', {
		showAdditionalInfo: true,
		showDocumentation: true,
		showCommonIssues: false,
		showImplementationNotes: false,
	});

	const deviceCode = useFlowInfo('device-code', {
		showAdditionalInfo: true,
		showDocumentation: true,
		showCommonIssues: false,
		showImplementationNotes: false,
	});

	const ciba = useFlowInfo('oidc-ciba-v5', {
		showAdditionalInfo: true,
		showDocumentation: true,
		showCommonIssues: false,
		showImplementationNotes: false,
	});

	const par = useFlowInfo('par', {
		showAdditionalInfo: true,
		showDocumentation: true,
		showCommonIssues: false,
		showImplementationNotes: false,
	});

	const flows = [
		{
			type: 'oauth-authorization-code',
			name: 'OAuth Authorization Code',
			description: 'Most secure OAuth 2.0 flow',
		},
		{
			type: 'oidc-authorization-code',
			name: 'OIDC Authorization Code',
			description: 'Authentication + Authorization',
		},
		{
			type: 'client-credentials',
			name: 'Client Credentials',
			description: 'Machine-to-machine authentication',
		},
		{
			type: 'device-code',
			name: 'Device Authorization',
			description: 'For input-constrained devices',
		},
		{ type: 'oidc-ciba-v5', name: 'OIDC CIBA', description: 'Decoupled authentication' },
		{ type: 'par', name: 'Pushed Authorization Request', description: 'Enhanced security flow' },
	];

	return (
		<Container>
			<Title>Flow Information Service Examples</Title>
			<Subtitle>
				Comprehensive flow information cards for all V5 flows with detailed security notes, use
				cases, and implementation guidance.
			</Subtitle>

			<FlowSection>
				<SectionTitle>Available Flows</SectionTitle>
				<FlowList>
					{flows.map((flow) => (
						<FlowItem key={flow.type}>
							<FlowName>{flow.name}</FlowName>
							<FlowDescription>{flow.description}</FlowDescription>
						</FlowItem>
					))}
				</FlowList>
			</FlowSection>

			<FlowSection>
				<SectionTitle>OAuth 2.0 Authorization Code Flow (Full Details)</SectionTitle>
				<EnhancedFlowInfoCard
					flowType="oauth-authorization-code"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={true}
					showImplementationNotes={true}
				/>
			</FlowSection>

			<FlowSection>
				<SectionTitle>OIDC Authorization Code Flow</SectionTitle>
				<EnhancedFlowInfoCard
					flowType="oidc-authorization-code"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>
			</FlowSection>

			<FlowSection>
				<SectionTitle>Client Credentials Flow</SectionTitle>
				<EnhancedFlowInfoCard
					flowType="client-credentials"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>
			</FlowSection>

			<FlowSection>
				<SectionTitle>Device Authorization Flow</SectionTitle>
				<EnhancedFlowInfoCard
					flowType="device-code"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>
			</FlowSection>

			<FlowSection>
				<SectionTitle>OIDC CIBA Flow</SectionTitle>
				<EnhancedFlowInfoCard
					flowType="oidc-ciba-v5"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>
			</FlowSection>

			<FlowSection>
				<SectionTitle>Pushed Authorization Request (PAR)</SectionTitle>
				<EnhancedFlowInfoCard
					flowType="par"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>
			</FlowSection>
		</Container>
	);
};

export default FlowInfoExample;
