import React, { useState } from 'react';
import { FiGlobe, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import EnvironmentIdInput from '../components/EnvironmentIdInput';
import { usePageScroll } from '../hooks/usePageScroll';
import { FlowHeader } from '../services/flowHeaderService';
import type { DiscoveryResult } from '../services/oidcDiscoveryService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.125rem;
    color: #6b7280;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const DemoSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: #6b7280;
    line-height: 1.6;
  }
`;

const ResultCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const ResultTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ResultContent = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  border-radius: 0.375rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
`;

const ComparisonTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ProItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;

  &::before {
    content: '✅';
    font-size: 1rem;
  }
`;

const ConItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;

  &::before {
    content: '❌';
    font-size: 1rem;
  }
`;

const EnvironmentIdInputDemo: React.FC = () => {
	usePageScroll({ pageName: 'Environment ID Input Demo', force: true });

	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
	const [environmentId, setEnvironmentId] = useState('');
	const [issuerUrl, setIssuerUrl] = useState('');

	const handleDiscoveryComplete = (result: DiscoveryResult) => {
		setDiscoveryResult(result);
		console.log('Discovery completed:', result);
	};

	const handleEnvironmentIdChange = (envId: string) => {
		setEnvironmentId(envId);
	};

	const handleIssuerUrlChange = (url: string) => {
		setIssuerUrl(url);
	};

	return (
		<Container>
			<FlowHeader flowId="environment-id-demo" />

			<Header>
				<h1>
					<FiGlobe />
					Environment ID Input Component Demo
				</h1>
				<p>
					A simplified approach to PingOne configuration. Just enter your environment ID, select
					your region, and we'll handle the rest!
				</p>
			</Header>

			<DemoSection>
				<SectionHeader>
					<h2>
						<FiSettings />
						Live Demo
					</h2>
					<p>
						Try entering your PingOne environment ID below. The component will construct the issuer
						URL and discover all available OIDC endpoints.
					</p>
				</SectionHeader>

				<EnvironmentIdInput
					onDiscoveryComplete={handleDiscoveryComplete}
					onEnvironmentIdChange={handleEnvironmentIdChange}
					onIssuerUrlChange={handleIssuerUrlChange}
					showSuggestions={true}
					autoDiscover={false}
				/>

				{(environmentId || discoveryResult) && (
					<ResultCard>
						<ResultTitle>Configuration Results</ResultTitle>
						<ResultContent>
							{JSON.stringify(
								{
									environmentId,
									issuerUrl,
									discoveryResult: discoveryResult
										? {
												success: discoveryResult.success,
												cached: discoveryResult.cached,
												error: discoveryResult.error,
												endpoints: discoveryResult.document
													? {
															authorization: discoveryResult.document.authorization_endpoint,
															token: discoveryResult.document.token_endpoint,
															userInfo: discoveryResult.document.userinfo_endpoint,
															jwks: discoveryResult.document.jwks_uri,
															deviceAuth: discoveryResult.document.device_authorization_endpoint,
															par: discoveryResult.document.pushed_authorization_request_endpoint,
														}
													: null,
											}
										: null,
								},
								null,
								2
							)}
						</ResultContent>
					</ResultCard>
				)}
			</DemoSection>

			<ComparisonGrid>
				<ComparisonCard>
					<ComparisonTitle>
						<span style={{ color: '#ef4444' }}>❌</span>
						Old Approach
					</ComparisonTitle>
					<ConItem>Users need to enter full issuer URL</ConItem>
					<ConItem>Easy to make typos in long URLs</ConItem>
					<ConItem>No regional guidance</ConItem>
					<ConItem>Manual endpoint discovery</ConItem>
					<ConItem>Complex error messages</ConItem>
					<ConItem>No URL validation</ConItem>
				</ComparisonCard>

				<ComparisonCard>
					<ComparisonTitle>
						<span style={{ color: '#10b981' }}>✅</span>
						New Approach
					</ComparisonTitle>
					<ProItem>Just enter environment ID</ProItem>
					<ProItem>Region selector with clear labels</ProItem>
					<ProItem>Automatic issuer URL construction</ProItem>
					<ProItem>One-click OIDC discovery</ProItem>
					<ProItem>Visual feedback and status</ProItem>
					<ProItem>Copy-to-clipboard functionality</ProItem>
				</ComparisonCard>
			</ComparisonGrid>

			<DemoSection>
				<SectionHeader>
					<h2>
						<FiGlobe />
						Usage Examples
					</h2>
					<p>Here are some example environment IDs you can try (these are examples only):</p>
				</SectionHeader>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '1rem',
					}}
				>
					<div
						style={{
							padding: '1rem',
							background: '#f1f5f9',
							borderRadius: '0.5rem',
							border: '1px solid #cbd5e1',
						}}
					>
						<strong>Example US:</strong>
						<div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#475569' }}>
							12345678-1234-1234-1234-123456789012
						</div>
					</div>
					<div
						style={{
							padding: '1rem',
							background: '#f1f5f9',
							borderRadius: '0.5rem',
							border: '1px solid #cbd5e1',
						}}
					>
						<strong>Example EU:</strong>
						<div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#475569' }}>
							abcdef12-3456-7890-abcd-ef1234567890
						</div>
					</div>
					<div
						style={{
							padding: '1rem',
							background: '#f1f5f9',
							borderRadius: '0.5rem',
							border: '1px solid #cbd5e1',
						}}
					>
						<strong>Example AP:</strong>
						<div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#475569' }}>
							98765432-1098-7654-3210-987654321098
						</div>
					</div>
				</div>
			</DemoSection>
		</Container>
	);
};

export default EnvironmentIdInputDemo;
