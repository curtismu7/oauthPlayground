// src/services/interactiveFlowDiagramService.tsx
// ⭐ V6 SERVICE - Service for interactive OAuth/OIDC flow diagrams using Mermaid.js
// Used in: Interactive Diagrams page, Flow Comparison
// Purpose: Provides professional, interactive flow visualizations

import mermaid from 'mermaid';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

export interface FlowDiagramConfig {
	id: string;
	title: string;
	description: string;
	diagramType: 'oauth' | 'oidc' | 'hybrid' | 'implicit' | 'client-credentials';
	interactive?: boolean;
	showSteps?: boolean;
	theme?: 'default' | 'dark' | 'neutral';
}

export interface FlowStep {
	id: string;
	title: string;
	description: string;
	actor: 'client' | 'authorization-server' | 'resource-server' | 'user';
	action: string;
	details?: string;
}

// Initialize Mermaid with professional theme
mermaid.initialize({
	startOnLoad: false,
	theme: 'default',
	themeVariables: {
		primaryColor: '#3b82f6',
		primaryTextColor: '#1f2937',
		primaryBorderColor: '#2563eb',
		lineColor: '#6b7280',
		sectionBkgColor: '#f8fafc',
		altSectionBkgColor: '#ffffff',
		gridColor: '#e5e7eb',
		secondaryColor: '#f1f5f9',
		tertiaryColor: '#ffffff',
		background: '#ffffff',
		mainBkg: '#ffffff',
		secondBkg: '#f8fafc',
		tertiaryBkg: '#ffffff',
	},
	flowchart: {
		useMaxWidth: true,
		htmlLabels: true,
		curve: 'basis',
	},
	sequence: {
		diagramMarginX: 50,
		diagramMarginY: 10,
		actorMargin: 50,
		width: 150,
		height: 65,
		boxMargin: 10,
		boxTextMargin: 5,
		noteMargin: 10,
		messageMargin: 35,
		mirrorActors: true,
		bottomMarginAdj: 1,
		useMaxWidth: true,
		rightAngles: false,
		showSequenceNumbers: false,
	},
});

// Styled components for the interactive diagram
const DiagramContainer = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	margin: 1rem 0;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
	overflow: visible;
	width: 100%;
	min-height: 400px;
`;

const DiagramHeader = styled.div`
	margin-bottom: 1.5rem;
	text-align: center;

	h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	p {
		color: #6b7280;
		font-size: 1rem;
		line-height: 1.6;
	}
`;

const DiagramWrapper = styled.div`
	background: #f8fafc;
	border-radius: 8px;
	padding: 1.5rem;
	margin: 1rem 0;
	border: 1px solid #e2e8f0;
	overflow: visible;
	width: 100%;
	min-height: 400px;

	.mermaid {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
		width: 100%;
	}

	svg {
		max-width: 100%;
		height: auto;
		width: 100%;
	}
`;

const ControlsContainer = styled.div`
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin: 1rem 0;
	flex-wrap: wrap;
`;

const ControlButton = styled.button<{ $active?: boolean }>`
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid #d1d5db;
	background: ${(props) => (props.$active ? '#3b82f6' : 'white')};
	color: ${(props) => (props.$active ? 'white' : '#374151')};

	&:hover {
		background: ${(props) => (props.$active ? '#2563eb' : '#f3f4f6')};
		border-color: ${(props) => (props.$active ? '#2563eb' : '#9ca3af')};
	}
`;

const StepDetails = styled.div`
	margin-top: 1.5rem;
	padding: 1rem;
	background: #f0f9ff;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;

	h4 {
		color: #1e40af;
		margin-bottom: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
	}

	p {
		color: #1e3a8a;
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
	}
`;

// OAuth/OIDC Flow Definitions
const flowDefinitions: Record<string, { diagram: string; steps: FlowStep[] }> = {
	'oauth-authorization-code': {
		diagram: `
sequenceDiagram
    participant U as User
    participant C as Client
    participant AS as Authorization Server
    participant RS as Resource Server

    Note over U,RS: OAuth 2.0 Authorization Code Flow

    U->>C: 1. Access protected resource
    C->>AS: 2. Redirect to authorization endpoint
    Note right of C: response_type=code<br/>client_id=xxx<br/>redirect_uri=xxx<br/>scope=read<br/>state=xyz
    AS->>U: 3. User authentication
    U->>AS: 4. User consent
    AS->>C: 5. Authorization code
    Note left of AS: redirect_uri?code=abc123&state=xyz
    C->>AS: 6. Exchange code for tokens
    Note right of C: grant_type=authorization_code<br/>code=abc123<br/>client_id=xxx<br/>client_secret=xxx
    AS->>C: 7. Access token + refresh token
    Note left of AS: {<br/>  "access_token": "eyJ...",<br/>  "refresh_token": "def456",<br/>  "expires_in": 3600<br/>}
    C->>RS: 8. Access protected resource
    Note right of C: Authorization: Bearer eyJ...
    RS->>C: 9. Protected resource data
		`,
		steps: [
			{
				id: '1',
				title: 'User Access Request',
				description: 'User attempts to access a protected resource',
				actor: 'user',
				action: 'Access protected resource',
				details: 'The user clicks on a protected resource in the client application.',
			},
			{
				id: '2',
				title: 'Authorization Request',
				description: 'Client redirects user to authorization server',
				actor: 'client',
				action: 'Redirect to authorization endpoint',
				details:
					'The client redirects the user to the authorization server with the necessary parameters.',
			},
			{
				id: '3',
				title: 'User Authentication',
				description: 'User authenticates with authorization server',
				actor: 'user',
				action: 'User authentication',
				details: 'The user provides credentials to prove their identity.',
			},
			{
				id: '4',
				title: 'User Consent',
				description: 'User grants permission to client',
				actor: 'user',
				action: 'User consent',
				details: 'The user reviews and approves the requested permissions.',
			},
			{
				id: '5',
				title: 'Authorization Code',
				description: 'Server returns authorization code',
				actor: 'authorization-server',
				action: 'Authorization code',
				details:
					'The authorization server redirects back to the client with an authorization code.',
			},
			{
				id: '6',
				title: 'Token Exchange',
				description: 'Client exchanges code for tokens',
				actor: 'client',
				action: 'Exchange code for tokens',
				details:
					'The client makes a backend request to exchange the authorization code for access and refresh tokens.',
			},
			{
				id: '7',
				title: 'Token Response',
				description: 'Server returns access and refresh tokens',
				actor: 'authorization-server',
				action: 'Access token + refresh token',
				details: 'The authorization server returns the requested tokens to the client.',
			},
			{
				id: '8',
				title: 'Resource Access',
				description: 'Client accesses protected resource',
				actor: 'client',
				action: 'Access protected resource',
				details: 'The client uses the access token to request the protected resource.',
			},
			{
				id: '9',
				title: 'Resource Response',
				description: 'Resource server returns data',
				actor: 'resource-server',
				action: 'Protected resource data',
				details: 'The resource server validates the token and returns the requested data.',
			},
		],
	},
	'oidc-authorization-code': {
		diagram: `
sequenceDiagram
    participant U as User
    participant C as Client
    participant AS as Authorization Server
    participant RS as Resource Server

    Note over U,RS: OpenID Connect Authorization Code Flow

    U->>C: 1. Access protected resource
    C->>AS: 2. Redirect to authorization endpoint
    Note right of C: response_type=code<br/>client_id=xxx<br/>redirect_uri=xxx<br/>scope=openid profile email<br/>state=xyz<br/>nonce=abc
    AS->>U: 3. User authentication
    U->>AS: 4. User consent
    AS->>C: 5. Authorization code
    Note left of AS: redirect_uri?code=abc123&state=xyz
    C->>AS: 6. Exchange code for tokens
    Note right of C: grant_type=authorization_code<br/>code=abc123<br/>client_id=xxx<br/>client_secret=xxx
    AS->>C: 7. Access token + ID token + refresh token
    Note left of AS: {<br/>  "access_token": "eyJ...",<br/>  "id_token": "eyJ...",<br/>  "refresh_token": "def456",<br/>  "expires_in": 3600<br/>}
    C->>RS: 8. Access protected resource
    Note right of C: Authorization: Bearer eyJ...
    RS->>C: 9. Protected resource data
		`,
		steps: [
			{
				id: '1',
				title: 'User Access Request',
				description: 'User attempts to access a protected resource',
				actor: 'user',
				action: 'Access protected resource',
				details: 'The user clicks on a protected resource in the client application.',
			},
			{
				id: '2',
				title: 'Authorization Request',
				description: 'Client redirects user to authorization server',
				actor: 'client',
				action: 'Redirect to authorization endpoint',
				details:
					'The client redirects the user to the authorization server with OpenID Connect specific parameters including nonce.',
			},
			{
				id: '3',
				title: 'User Authentication',
				description: 'User authenticates with authorization server',
				actor: 'user',
				action: 'User authentication',
				details: 'The user provides credentials to prove their identity.',
			},
			{
				id: '4',
				title: 'User Consent',
				description: 'User grants permission to client',
				actor: 'user',
				action: 'User consent',
				details:
					'The user reviews and approves the requested permissions including identity information.',
			},
			{
				id: '5',
				title: 'Authorization Code',
				description: 'Server returns authorization code',
				actor: 'authorization-server',
				action: 'Authorization code',
				details:
					'The authorization server redirects back to the client with an authorization code.',
			},
			{
				id: '6',
				title: 'Token Exchange',
				description: 'Client exchanges code for tokens',
				actor: 'client',
				action: 'Exchange code for tokens',
				details:
					'The client makes a backend request to exchange the authorization code for access, ID, and refresh tokens.',
			},
			{
				id: '7',
				title: 'Token Response',
				description: 'Server returns access, ID, and refresh tokens',
				actor: 'authorization-server',
				action: 'Access token + ID token + refresh token',
				details:
					'The authorization server returns the requested tokens including the ID token with user identity information.',
			},
			{
				id: '8',
				title: 'Resource Access',
				description: 'Client accesses protected resource',
				actor: 'client',
				action: 'Access protected resource',
				details: 'The client uses the access token to request the protected resource.',
			},
			{
				id: '9',
				title: 'Resource Response',
				description: 'Resource server returns data',
				actor: 'resource-server',
				action: 'Protected resource data',
				details: 'The resource server validates the token and returns the requested data.',
			},
		],
	},
	'oauth-implicit': {
		diagram: `
sequenceDiagram
    participant U as User
    participant C as Client
    participant AS as Authorization Server

    Note over U,AS: OAuth 2.0 Implicit Flow (Deprecated)

    U->>C: 1. Access protected resource
    C->>AS: 2. Redirect to authorization endpoint
    Note right of C: response_type=token<br/>client_id=xxx<br/>redirect_uri=xxx<br/>scope=read<br/>state=xyz
    AS->>U: 3. User authentication
    U->>AS: 4. User consent
    AS->>C: 5. Access token
    Note left of AS: redirect_uri#access_token=eyJ...&expires_in=3600&state=xyz
		`,
		steps: [
			{
				id: '1',
				title: 'User Access Request',
				description: 'User attempts to access a protected resource',
				actor: 'user',
				action: 'Access protected resource',
				details: 'The user clicks on a protected resource in the client application.',
			},
			{
				id: '2',
				title: 'Authorization Request',
				description: 'Client redirects user to authorization server',
				actor: 'client',
				action: 'Redirect to authorization endpoint',
				details:
					'The client redirects the user to the authorization server with response_type=token.',
			},
			{
				id: '3',
				title: 'User Authentication',
				description: 'User authenticates with authorization server',
				actor: 'user',
				action: 'User authentication',
				details: 'The user provides credentials to prove their identity.',
			},
			{
				id: '4',
				title: 'User Consent',
				description: 'User grants permission to client',
				actor: 'user',
				action: 'User consent',
				details: 'The user reviews and approves the requested permissions.',
			},
			{
				id: '5',
				title: 'Access Token',
				description: 'Server returns access token directly',
				actor: 'authorization-server',
				action: 'Access token',
				details:
					'The authorization server redirects back to the client with the access token in the URL fragment.',
			},
		],
	},
	'oauth-client-credentials': {
		diagram: `
sequenceDiagram
    participant C as Client
    participant AS as Authorization Server
    participant RS as Resource Server

    Note over C,RS: OAuth 2.0 Client Credentials Flow

    C->>AS: 1. Request access token
    Note right of C: grant_type=client_credentials<br/>client_id=xxx<br/>client_secret=xxx<br/>scope=api:read
    AS->>C: 2. Access token
    Note left of AS: {<br/>  "access_token": "eyJ...",<br/>  "token_type": "Bearer",<br/>  "expires_in": 3600<br/>}
    C->>RS: 3. Access protected resource
    Note right of C: Authorization: Bearer eyJ...
    RS->>C: 4. Protected resource data
		`,
		steps: [
			{
				id: '1',
				title: 'Token Request',
				description: 'Client requests access token',
				actor: 'client',
				action: 'Request access token',
				details:
					'The client makes a direct request to the authorization server using client credentials.',
			},
			{
				id: '2',
				title: 'Token Response',
				description: 'Server returns access token',
				actor: 'authorization-server',
				action: 'Access token',
				details:
					'The authorization server validates the client credentials and returns an access token.',
			},
			{
				id: '3',
				title: 'Resource Access',
				description: 'Client accesses protected resource',
				actor: 'client',
				action: 'Access protected resource',
				details: 'The client uses the access token to request the protected resource.',
			},
			{
				id: '4',
				title: 'Resource Response',
				description: 'Resource server returns data',
				actor: 'resource-server',
				action: 'Protected resource data',
				details: 'The resource server validates the token and returns the requested data.',
			},
		],
	},
};

export class InteractiveFlowDiagramService {
	static createFlowDiagram(config: FlowDiagramConfig) {
		const FlowDiagramComponent: React.FC = () => {
			const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null);
			const [currentFlow, setCurrentFlow] = useState(config.diagramType);
			const diagramRef = useRef<HTMLDivElement>(null);

			useEffect(() => {
				const renderDiagram = async () => {
					if (diagramRef.current) {
						const definition =
							flowDefinitions[`${config.diagramType}-authorization-code`] ||
							flowDefinitions['oauth-authorization-code'];

						try {
							const { svg } = await mermaid.render(`${config.id}-diagram`, definition.diagram);
							diagramRef.current.innerHTML = svg;
						} catch (error) {
							console.error('Error rendering diagram:', error);
							diagramRef.current.innerHTML = '<p>Error rendering diagram</p>';
						}
					}
				};

				renderDiagram();
			}, [config.id, config.diagramType]);

			const availableFlows = [
				{ id: 'oauth', label: 'OAuth 2.0' },
				{ id: 'oidc', label: 'OpenID Connect' },
				{ id: 'implicit', label: 'Implicit (Deprecated)' },
				{ id: 'client-credentials', label: 'Client Credentials' },
			];

			const handleFlowChange = (flowType: string) => {
				setCurrentFlow(flowType as any);
				setSelectedStep(null);
			};

			const handleStepClick = (step: FlowStep) => {
				setSelectedStep(selectedStep?.id === step.id ? null : step);
			};

			const definition =
				flowDefinitions[`${currentFlow}-authorization-code`] ||
				flowDefinitions['oauth-authorization-code'];

			return (
				<DiagramContainer>
					<DiagramHeader>
						<h3>{config.title}</h3>
						<p>{config.description}</p>
					</DiagramHeader>

					<ControlsContainer>
						{availableFlows.map((flow) => (
							<ControlButton
								key={flow.id}
								$active={currentFlow === flow.id}
								onClick={() => handleFlowChange(flow.id)}
							>
								{flow.label}
							</ControlButton>
						))}
					</ControlsContainer>

					<DiagramWrapper>
						<div ref={diagramRef} className="mermaid" />
					</DiagramWrapper>

					{config.showSteps && definition.steps && (
						<div>
							<h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>Flow Steps:</h4>
							{definition.steps.map((step, _index) => (
								<div
									key={step.id}
									onClick={() => handleStepClick(step)}
									style={{
										padding: '0.75rem',
										margin: '0.5rem 0',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										backgroundColor: selectedStep?.id === step.id ? '#eff6ff' : 'white',
										borderColor: selectedStep?.id === step.id ? '#3b82f6' : '#e5e7eb',
									}}
								>
									<strong>
										{step.id}. {step.title}
									</strong>
									<p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
										{step.description}
									</p>
								</div>
							))}
						</div>
					)}

					{selectedStep && (
						<StepDetails>
							<h4>{selectedStep.title}</h4>
							<p>{selectedStep.details || selectedStep.description}</p>
						</StepDetails>
					)}
				</DiagramContainer>
			);
		};

		return FlowDiagramComponent;
	}
}

export default InteractiveFlowDiagramService;
