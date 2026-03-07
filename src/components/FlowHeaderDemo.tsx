// src/components/FlowHeaderDemo.tsx
// Demo component showing the standardized V5 flow headers

import React from 'react';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

const DemoContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
`;

const DemoSection = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const FlowHeaderDemo: React.FC = () => {
	return (
		<DemoContainer>
			<h1 style={{ textAlign: 'center', marginBottom: '3rem', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
				V5 Flow Header Standardization Demo
			</h1>

			{/* OAuth 2.0 V5 Flows */}
			<DemoSection>
				<SectionTitle>OAuth 2.0 V5 Flows (Blue Theme)</SectionTitle>

				<FlowHeader flowId="oauth-authorization-code-v5" />
				<FlowHeader flowId="oauth-implicit-v5" />
				<FlowHeader flowId="client-credentials-v5" />
				<FlowHeader flowId="device-authorization-v5" />
			</DemoSection>

			{/* OIDC V5 Flows */}
			<DemoSection>
				<SectionTitle>OIDC V5 Flows (Green Theme)</SectionTitle>

				<FlowHeader flowId="oidc-authorization-code-v5" />
				<FlowHeader flowId="oidc-implicit-v5" />
				<FlowHeader flowId="oidc-client-credentials-v5" />
				<FlowHeader flowId="hybrid-v5" />
				<FlowHeader flowId="oidc-device-authorization-v5" />
			</DemoSection>

			{/* PingOne Token Flows */}
			<DemoSection>
				<SectionTitle>PingOne Token Flows (Orange Theme)</SectionTitle>

				<FlowHeader flowId="worker-token-v5" />
				<FlowHeader flowId="pingone-par-v5" />
				<FlowHeader flowId="redirectless-flow-v5" />
			</DemoSection>

			{/* Custom Configuration Example */}
			<DemoSection>
				<SectionTitle>Custom Configuration Example</SectionTitle>

				<FlowHeader
					flowId="oauth-authorization-code-v5"
					customConfig={{
						subtitle:
							'This is a custom subtitle showing how you can override the default description for specific implementations or use cases.',
					}}
				/>
			</DemoSection>

			{/* Code Examples */}
			<DemoSection>
				<SectionTitle>Usage Examples</SectionTitle>

				<div
					style={{
						background: 'V9_COLORS.TEXT.GRAY_DARK',
						color: '#f9fafb',
						padding: '1.5rem',
						borderRadius: '8px',
						fontFamily: 'Monaco, Consolas, monospace',
						fontSize: '0.875rem',
						lineHeight: '1.6',
					}}
				>
					<div style={{ marginBottom: '1rem' }}>
						<div style={{ color: 'V9_COLORS.PRIMARY.GREEN', marginBottom: '0.5rem' }}>
							// Basic Usage:
						</div>
						<div>{'<FlowHeader flowId="oauth-authorization-code-v5" />'}</div>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<div style={{ color: 'V9_COLORS.PRIMARY.GREEN', marginBottom: '0.5rem' }}>
							// With Custom Configuration:
						</div>
						<div>{'<FlowHeader'}</div>
						<div>{'  flowId="client-credentials-v5"'}</div>
						<div>{'  customConfig={{'}</div>
						<div>{'    subtitle: "Custom description for this flow"'}</div>
						<div>{'  }}'}</div>
						<div>{'/>'}</div>
					</div>

					<div>
						<div style={{ color: 'V9_COLORS.PRIMARY.GREEN', marginBottom: '0.5rem' }}>
							// Import:
						</div>
						<div>{"import { FlowHeader } from '../services/flowHeaderService';"}</div>
					</div>
				</div>
			</DemoSection>

			{/* Before/After Comparison */}
			<DemoSection>
				<SectionTitle>Before vs After Comparison</SectionTitle>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
					{/* Before */}
					<div>
						<h3 style={{ color: 'V9_COLORS.PRIMARY.RED_DARK', marginBottom: '1rem' }}>
							❌ Before (Inconsistent)
						</h3>
						<div
							style={{
								background: 'V9_COLORS.BG.ERROR',
								padding: '1rem',
								borderRadius: '8px',
								fontFamily: 'Monaco, Consolas, monospace',
								fontSize: '0.75rem',
							}}
						>
							<div>{'<Header>'}</div>
							<div>{'  <Badge>🔑 Client Credentials Flow V5</Badge>'}</div>
							<div>{'  <MainTitle>'}</div>
							<div>{'    <FiLock />'}</div>
							<div>{'    Client Credentials Flow'}</div>
							<div>{'  </MainTitle>'}</div>
							<div>{'  <Subtitle>'}</div>
							<div>{'    Secure server-to-server authentication...'}</div>
							<div>{'  </Subtitle>'}</div>
							<div>{'</Header>'}</div>
						</div>
					</div>

					{/* After */}
					<div>
						<h3 style={{ color: 'V9_COLORS.PRIMARY.GREEN_DARK', marginBottom: '1rem' }}>
							✅ After (Standardized)
						</h3>
						<div
							style={{
								background: 'V9_COLORS.BG.SUCCESS',
								padding: '1rem',
								borderRadius: '8px',
								fontFamily: 'Monaco, Consolas, monospace',
								fontSize: '0.75rem',
							}}
						>
							<div>{'<FlowHeader flowId="client-credentials-v5" />'}</div>
						</div>
					</div>
				</div>
			</DemoSection>
		</DemoContainer>
	);
};

export default FlowHeaderDemo;
