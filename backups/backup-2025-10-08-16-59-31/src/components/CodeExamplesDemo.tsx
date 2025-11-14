// src/components/CodeExamplesDemo.tsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { CodeExamplesConfig } from '../services/codeExamplesService';
import { FlowHeader } from '../services/flowHeaderService';
import { CodeExamplesDisplay } from './CodeExamplesDisplay';
import { CodeExamplesInline } from './CodeExamplesInline';

const Container = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`;

const Title = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 2rem;
	text-align: center;
`;

const DemoSection = styled.div`
	margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 1rem;
`;

const ConfigForm = styled.div`
	background: #f8fafc;
	padding: 1.5rem;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	margin-bottom: 2rem;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const Input = styled.input`
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button`
	background: #3b82f6;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background: #2563eb;
	}
`;

const FlowSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`;

const FlowButton = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1.5rem;
	border: 1px solid ${({ $active }) => ($active ? '#3b82f6' : '#d1d5db')};
	border-radius: 6px;
	background: ${({ $active }) => ($active ? '#3b82f6' : '#ffffff')};
	color: ${({ $active }) => ($active ? '#ffffff' : '#374151')};
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $active }) => ($active ? '#2563eb' : '#f3f4f6')};
	}
`;

const StepSelector = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`;

const StepButton = styled.button<{ $active: boolean }>`
	padding: 0.5rem 1rem;
	border: 1px solid ${({ $active }) => ($active ? '#3b82f6' : '#d1d5db')};
	border-radius: 4px;
	background: ${({ $active }) => ($active ? '#3b82f6' : '#ffffff')};
	color: ${({ $active }) => ($active ? '#ffffff' : '#374151')};
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $active }) => ($active ? '#2563eb' : '#f3f4f6')};
	}
`;

const flows = [
	{ id: 'authorization-code', name: 'Authorization Code' },
	{ id: 'implicit', name: 'Implicit' },
	{ id: 'client-credentials', name: 'Client Credentials' },
	{ id: 'device-authorization', name: 'Device Authorization' },
];

const flowSteps: Record<string, Array<{ id: string; name: string }>> = {
	'authorization-code': [
		{ id: 'step1', name: 'Generate Auth URL' },
		{ id: 'step2', name: 'Handle Callback' },
		{ id: 'step3', name: 'Exchange Code' },
		{ id: 'step4', name: 'Use Token' },
	],
	implicit: [
		{ id: 'step1', name: 'Generate Auth URL' },
		{ id: 'step2', name: 'Handle Token Response' },
		{ id: 'step3', name: 'Use Token' },
	],
	'client-credentials': [
		{ id: 'step1', name: 'Request Token' },
		{ id: 'step2', name: 'Use Token' },
	],
	'device-authorization': [
		{ id: 'step1', name: 'Request Device Code' },
		{ id: 'step2', name: 'Poll for Token' },
		{ id: 'step3', name: 'Use Token' },
	],
};

export const CodeExamplesDemo: React.FC = () => {
	const [selectedFlow, setSelectedFlow] = useState('authorization-code');
	const [selectedStep, setSelectedStep] = useState('step1');
	const [config, setConfig] = useState<Partial<CodeExamplesConfig>>({
		baseUrl: 'https://auth.pingone.com',
		clientId: 'your-client-id',
		clientSecret: 'your-client-secret',
		redirectUri: 'https://your-app.com/callback',
		scopes: ['openid', 'profile', 'email'],
		environmentId: 'your-environment-id',
	});

	const handleConfigChange = (field: keyof CodeExamplesConfig, value: string) => {
		setConfig((prev) => ({
			...prev,
			[field]: field === 'scopes' ? value.split(',').map((s) => s.trim()) : value,
		}));
	};

	const currentSteps = flowSteps[selectedFlow] || [];

	return (
		<Container>
			<FlowHeader
				flowType="documentation"
				customConfig={{
					title: 'Code Examples',
					subtitle:
						'Comprehensive code examples for OAuth 2.0 and OpenID Connect flows in multiple programming languages. Copy, customize, and integrate into your applications.',
					icon: '💻',
				}}
			/>
			<Title>Code Examples Service Demo</Title>

			<DemoSection>
				<SectionTitle>Configuration</SectionTitle>
				<ConfigForm>
					<FormGrid>
						<FormGroup>
							<Label>Base URL</Label>
							<Input
								value={config.baseUrl || ''}
								onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
								placeholder="https://auth.pingone.com"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Client ID</Label>
							<Input
								value={config.clientId || ''}
								onChange={(e) => handleConfigChange('clientId', e.target.value)}
								placeholder="your-client-id"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Client Secret</Label>
							<Input
								type="password"
								value={config.clientSecret || ''}
								onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
								placeholder="your-client-secret"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Redirect URI</Label>
							<Input
								value={config.redirectUri || ''}
								onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
								placeholder="https://your-app.com/callback"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Scopes (comma-separated)</Label>
							<Input
								value={config.scopes?.join(', ') || ''}
								onChange={(e) => handleConfigChange('scopes', e.target.value)}
								placeholder="openid, profile, email"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Environment ID</Label>
							<Input
								value={config.environmentId || ''}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
								placeholder="your-environment-id"
							/>
						</FormGroup>
					</FormGrid>
					<Button onClick={() => console.log('Config updated:', config)}>
						Update Configuration
					</Button>
				</ConfigForm>
			</DemoSection>

			<DemoSection>
				<SectionTitle>Select Flow Type</SectionTitle>
				<FlowSelector>
					{flows.map((flow) => (
						<FlowButton
							key={flow.id}
							$active={selectedFlow === flow.id}
							onClick={() => {
								setSelectedFlow(flow.id);
								setSelectedStep(flowSteps[flow.id]?.[0]?.id || 'step1');
							}}
						>
							{flow.name}
						</FlowButton>
					))}
				</FlowSelector>
			</DemoSection>

			<DemoSection>
				<SectionTitle>Select Step</SectionTitle>
				<StepSelector>
					{currentSteps.map((step) => (
						<StepButton
							key={step.id}
							$active={selectedStep === step.id}
							onClick={() => setSelectedStep(step.id)}
						>
							{step.name}
						</StepButton>
					))}
				</StepSelector>
			</DemoSection>

			<DemoSection>
				<SectionTitle>Full Code Examples Display</SectionTitle>
				<CodeExamplesDisplay flowType={selectedFlow} stepId={selectedStep} config={config} />
			</DemoSection>

			<DemoSection>
				<SectionTitle>Inline Code Examples (Compact)</SectionTitle>
				<CodeExamplesInline
					flowType={selectedFlow}
					stepId={selectedStep}
					config={config}
					compact={true}
				/>
			</DemoSection>

			<DemoSection>
				<SectionTitle>Inline Code Examples (Full)</SectionTitle>
				<CodeExamplesInline
					flowType={selectedFlow}
					stepId={selectedStep}
					config={config}
					compact={false}
				/>
			</DemoSection>
		</Container>
	);
};

export default CodeExamplesDemo;

