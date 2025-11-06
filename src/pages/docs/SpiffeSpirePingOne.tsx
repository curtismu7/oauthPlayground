// src/pages/docs/SpiffeSpirePingOne.tsx
// SPIFFE/SPIRE Education Page - Integration with PingOne SSO

import React, { useState } from 'react';
import {
	FiShield,
	FiKey,
	FiServer,
	FiLock,
	FiCheckCircle,
	FiAlertTriangle,
	FiInfo,
	FiArrowRight,
	FiExternalLink,
	FiZap,
	FiUsers,
	FiGlobe,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../../components/Card';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: #ffffff;
	min-height: 100vh;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;
	padding: 2rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 0.75rem;
	margin-bottom: 2rem;

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	p {
		font-size: 1.125rem;
		max-width: 800px;
		margin: 0 auto;
		line-height: 1.6;
		opacity: 0.95;
	}
`;

const Section = styled.section`
	margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.75rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding-bottom: 0.75rem;
	border-bottom: 2px solid #e5e7eb;
`;

const InfoCard = styled(Card)`
	margin-bottom: 1.5rem;
	border-left: 4px solid ${props => props.$color || '#3b82f6'};
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const FeatureCard = styled(Card)`
	transition: transform 0.2s, box-shadow 0.2s;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}
`;

const FeatureIcon = styled.div<{ $color: string }>`
	width: 48px;
	height: 48px;
	border-radius: 0.5rem;
	background: ${props => props.$color}15;
	color: ${props => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	margin-bottom: 1rem;
`;

const StepList = styled.ol`
	list-style: none;
	counter-reset: step-counter;
	padding: 0;
	margin: 0;
`;

const StepItem = styled.li`
	counter-increment: step-counter;
	margin-bottom: 1.5rem;
	padding-left: 3rem;
	position: relative;

	&::before {
		content: counter(step-counter);
		position: absolute;
		left: 0;
		top: 0;
		width: 2rem;
		height: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	p {
		color: #4b5563;
		line-height: 1.6;
	}
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1.5rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	margin: 1rem 0;
`;

const BenefitList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;

	li {
		padding: 0.75rem 0;
		padding-left: 2rem;
		position: relative;
		color: #4b5563;
		line-height: 1.6;

		&::before {
			content: '✓';
			position: absolute;
			left: 0;
			color: #22c55e;
			font-weight: 600;
			font-size: 1.25rem;
		}
	}
`;

const Alert = styled.div<{ $type: 'info' | 'warning' | 'success' }>`
	padding: 1rem 1.5rem;
	border-radius: 0.5rem;
	margin: 1.5rem 0;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	background: ${props => {
		if (props.$type === 'warning') return '#fef3c7';
		if (props.$type === 'success') return '#d1fae5';
		return '#dbeafe';
	}};
	border-left: 4px solid ${props => {
		if (props.$type === 'warning') return '#f59e0b';
		if (props.$type === 'success') return '#22c55e';
		return '#3b82f6';
	}};
	color: ${props => {
		if (props.$type === 'warning') return '#92400e';
		if (props.$type === 'success') return '#065f46';
		return '#1e40af';
	}};
`;

const Link = styled.a`
	color: #3b82f6;
	text-decoration: none;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	transition: color 0.2s;

	&:hover {
		color: #2563eb;
		text-decoration: underline;
	}
`;

const SpiffeSpirePingOne: React.FC = () => {
	return (
		<PageContainer>
			<Header>
				<h1>
					<FiShield />
					SPIFFE & SPIRE with PingOne SSO
				</h1>
				<p>
					Learn how to integrate SPIFFE (Secure Production Identity Framework for Everyone) and SPIRE 
					(SPIFFE Runtime Environment) with PingOne for secure workload authentication and Single Sign-On.
				</p>
			</Header>

			<Section>
				<SectionTitle>
					<FiInfo />
					What is SPIFFE?
				</SectionTitle>
				<InfoCard $color="#3b82f6">
					<CardBody>
						<p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#4b5563' }}>
							<strong>SPIFFE</strong> (Secure Production Identity Framework for Everyone) is an open-source 
							framework that provides a standardized way to identify and authenticate workloads across 
							heterogeneous environments. It defines a set of standards for issuing and managing 
							cryptographic identities for services, enabling zero-trust architectures.
						</p>
					</CardBody>
				</InfoCard>

				<FeatureGrid>
					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#3b82f6">
								<FiKey />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								SPIFFE ID
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								A unique, cryptographically verifiable identifier for each workload, following the format: 
								<code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
									spiffe://trust-domain/path
								</code>
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#22c55e">
								<FiShield />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								SVID (SPIFFE Verifiable Identity Document)
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								A short-lived, cryptographically signed document that proves a workload's identity. 
								Common formats include X.509 certificates and JWT tokens.
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#f59e0b">
								<FiGlobe />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								Trust Domain
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								A logical grouping of workloads that share the same trust root. All workloads within 
								a trust domain can verify each other's identities.
							</p>
						</CardBody>
					</FeatureCard>
				</FeatureGrid>
			</Section>

			<Section>
				<SectionTitle>
					<FiServer />
					What is SPIRE?
				</SectionTitle>
				<InfoCard $color="#22c55e">
					<CardBody>
						<p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#4b5563' }}>
							<strong>SPIRE</strong> (SPIFFE Runtime Environment) is the reference implementation of the 
							SPIFFE standards. It provides the infrastructure needed to issue and manage SVIDs, enabling 
							workloads to authenticate each other securely without relying on traditional secrets like 
							API keys or passwords.
						</p>
					</CardBody>
				</InfoCard>

				<FeatureGrid>
					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#3b82f6">
								<FiZap />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								SPIRE Server
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								The central component that manages the trust domain, issues SVIDs, and maintains the 
								registration entries that define which workloads receive which identities.
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#22c55e">
								<FiServer />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								SPIRE Agent
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								Runs on each node and communicates with the SPIRE server to obtain SVIDs for workloads 
								running on that node. It also provides the Workload API that workloads use to retrieve 
								their identities.
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#f59e0b">
								<FiLock />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								Workload API
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								A local API provided by the SPIRE agent that workloads use to retrieve their SVIDs and 
								trust bundles. This API is accessed via Unix domain sockets for security.
							</p>
						</CardBody>
					</FeatureCard>
				</FeatureGrid>
			</Section>

			<Section>
				<SectionTitle>
					<FiUsers />
					Why Integrate SPIFFE/SPIRE with PingOne?
				</SectionTitle>
				<Alert $type="info">
					<FiInfo style={{ fontSize: '1.5rem', flexShrink: 0 }} />
					<div>
						<strong>Zero-Trust Architecture:</strong> SPIFFE/SPIRE enables zero-trust authentication where 
						workloads authenticate each other based on verifiable identities rather than network location 
						or static credentials. Integrating with PingOne extends this to user authentication and SSO.
					</div>
				</Alert>

				<BenefitList>
					<li>
						<strong>Enhanced Security:</strong> Workloads authenticate using short-lived, cryptographically 
						verifiable identities (SVIDs) instead of static API keys or passwords, reducing the attack surface.
					</li>
					<li>
						<strong>Unified Identity Management:</strong> Combine workload identity (SPIFFE) with user identity 
						(PingOne) for a comprehensive identity and access management solution.
					</li>
					<li>
						<strong>Simplified Authentication:</strong> Automated issuance and rotation of workload identities 
						eliminates the need for manual secret management.
					</li>
					<li>
						<strong>Cross-Environment Support:</strong> SPIFFE works across Kubernetes, VMs, containers, and 
						cloud environments, providing consistent identity management.
					</li>
					<li>
						<strong>Audit and Compliance:</strong> All authentication events are logged and traceable, supporting 
						compliance requirements and security audits.
					</li>
					<li>
						<strong>Federation Support:</strong> SPIFFE Federation enables trust relationships between different 
						trust domains, allowing secure communication across organizational boundaries.
					</li>
				</BenefitList>
			</Section>

			<Section>
				<SectionTitle>
					<FiArrowRight />
					Integration Architecture
				</SectionTitle>
				<InfoCard $color="#8b5cf6">
					<CardHeader>
						<h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
							How SPIFFE/SPIRE Works with PingOne SSO
						</h3>
					</CardHeader>
					<CardBody>
						<StepList>
							<StepItem>
								<h3>1. Workload Identity Establishment</h3>
								<p>
									SPIRE issues SPIFFE IDs and SVIDs to workloads based on attestation data (e.g., 
									process attributes, container labels, Kubernetes service accounts). Each workload 
									receives a unique identity that can be cryptographically verified.
								</p>
							</StepItem>
							<StepItem>
								<h3>2. SPIFFE Federation Setup</h3>
								<p>
									Configure SPIFFE Federation to establish trust between your SPIRE trust domain and 
									PingOne. This involves exchanging trust bundles and configuring federation endpoints 
									to enable mutual trust.
								</p>
							</StepItem>
							<StepItem>
								<h3>3. SVID-to-User Mapping</h3>
								<p>
									Configure PingOne to accept SVIDs as valid credentials and map SPIFFE identities to 
									PingOne user or service accounts. This mapping enables workloads authenticated by SPIRE 
									to be recognized by PingOne.
								</p>
							</StepItem>
							<StepItem>
								<h3>4. SSO Token Exchange</h3>
								<p>
									When a workload needs to access PingOne-protected resources, it presents its SVID to 
									PingOne. PingOne validates the SVID, maps it to a user/service account, and issues an 
									OAuth 2.0 or OIDC token for SSO.
								</p>
							</StepItem>
							<StepItem>
								<h3>5. Resource Access</h3>
								<p>
									The workload uses the OAuth/OIDC token from PingOne to access protected resources, 
									enabling seamless SSO across services while maintaining the security benefits of 
									SPIFFE workload identity.
								</p>
							</StepItem>
						</StepList>
					</CardBody>
				</InfoCard>
			</Section>

			<Section>
				<SectionTitle>
					<FiKey />
					Implementation Steps
				</SectionTitle>
				<StepList>
					<StepItem>
						<h3>Step 1: Deploy SPIRE</h3>
						<p>
							Deploy SPIRE server and agents in your environment. The SPIRE server manages the trust domain 
							and issues SVIDs, while SPIRE agents run on each node to provide identities to workloads.
						</p>
						<CodeBlock>
{`# Example: Deploy SPIRE in Kubernetes
kubectl apply -f spire-server.yaml
kubectl apply -f spire-agent.yaml`}
						</CodeBlock>
					</StepItem>
					<StepItem>
						<h3>Step 2: Configure Workload Registration</h3>
						<p>
							Create registration entries in SPIRE that define which workloads receive which SPIFFE IDs. 
							This is based on attestation data such as process attributes, container labels, or Kubernetes 
							service accounts.
						</p>
						<CodeBlock>
{`# Example: Register a workload in SPIRE
spire-server entry create \\
  -spiffeID spiffe://example.org/frontend \\
  -parentID spiffe://example.org/spire/agent/k8s_psat/production \\
  -selector k8s:ns:default \\
  -selector k8s:sa:frontend-sa`}
						</CodeBlock>
					</StepItem>
					<StepItem>
						<h3>Step 3: Set Up SPIFFE Federation</h3>
						<p>
							Configure SPIFFE Federation to establish trust between your SPIRE trust domain and PingOne. 
							This involves configuring federation endpoints and exchanging trust bundles.
						</p>
						<Alert $type="warning">
							<FiAlertTriangle style={{ fontSize: '1.5rem', flexShrink: 0 }} />
							<div>
								<strong>Important:</strong> Federation requires careful configuration of trust bundles and 
								endpoints. Ensure proper network connectivity and security policies are in place.
							</div>
						</Alert>
					</StepItem>
					<StepItem>
						<h3>Step 4: Configure PingOne Integration</h3>
						<p>
							In PingOne, configure a custom authentication flow or connector that accepts SVIDs. Map SPIFFE 
							identities to PingOne user or service accounts, and configure OAuth 2.0/OIDC token issuance.
						</p>
						<CodeBlock>
{`# Example: PingOne API call to create a service account
POST /v1/environments/{envId}/serviceAccounts
{
  "name": "spiffe-workload",
  "description": "Service account for SPIFFE-authenticated workloads",
  "spiffeId": "spiffe://example.org/frontend"
}`}
						</CodeBlock>
					</StepItem>
					<StepItem>
						<h3>Step 5: Implement Token Exchange</h3>
						<p>
							Implement a token exchange service that accepts SVIDs from workloads, validates them with SPIRE, 
							and exchanges them for PingOne OAuth/OIDC tokens. This service acts as a bridge between SPIFFE 
							and PingOne.
						</p>
						<CodeBlock>
{`# Example: Token exchange flow
1. Workload presents SVID to token exchange service
2. Service validates SVID with SPIRE trust bundle
3. Service maps SPIFFE ID to PingOne user/service account
4. Service requests OAuth token from PingOne
5. Service returns token to workload`}
						</CodeBlock>
					</StepItem>
					<StepItem>
						<h3>Step 6: Test and Validate</h3>
						<p>
							Test the integration by having workloads authenticate using their SVIDs, exchange them for 
							PingOne tokens, and access protected resources. Monitor logs and metrics to ensure proper 
							authentication and token issuance.
						</p>
					</StepItem>
				</StepList>
			</Section>

			<Section>
				<SectionTitle>
					<FiCheckCircle />
					Best Practices
				</SectionTitle>
				<FeatureGrid>
					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#22c55e">
								<FiLock />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								Short-Lived SVIDs
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								Configure SPIRE to issue short-lived SVIDs (e.g., 1 hour) and enable automatic rotation. 
								This minimizes the impact of compromised credentials.
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#3b82f6">
								<FiShield />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								Principle of Least Privilege
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								Assign SPIFFE IDs and PingOne permissions based on the principle of least privilege. 
								Workloads should only receive the minimum permissions necessary for their function.
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#f59e0b">
								<FiServer />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								Monitor and Audit
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								Enable comprehensive logging and monitoring for both SPIRE and PingOne authentication events. 
								This supports security audits and incident response.
							</p>
						</CardBody>
					</FeatureCard>

					<FeatureCard>
						<CardBody>
							<FeatureIcon $color="#8b5cf6">
								<FiGlobe />
							</FeatureIcon>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
								Federation Security
							</h3>
							<p style={{ color: '#4b5563', lineHeight: '1.6' }}>
								When setting up SPIFFE Federation, use secure channels (TLS) for trust bundle exchange and 
								implement proper access controls on federation endpoints.
							</p>
						</CardBody>
					</FeatureCard>
				</FeatureGrid>
			</Section>

			<Section>
				<SectionTitle>
					<FiExternalLink />
					Additional Resources
				</SectionTitle>
				<InfoCard $color="#3b82f6">
					<CardBody>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
							<li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiExternalLink />
								<Link href="https://spiffe.io/" target="_blank" rel="noopener noreferrer">
									SPIFFE Official Documentation
								</Link>
							</li>
							<li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiExternalLink />
								<Link href="https://spiffe.io/docs/latest/spire/" target="_blank" rel="noopener noreferrer">
									SPIRE Documentation
								</Link>
							</li>
							<li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiExternalLink />
								<Link href="https://spiffe.io/docs/latest/architecture/federation/" target="_blank" rel="noopener noreferrer">
									SPIFFE Federation Guide
								</Link>
							</li>
							<li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiExternalLink />
								<Link href="https://apidocs.pingidentity.com/pingone/platform/v1/api/" target="_blank" rel="noopener noreferrer">
									PingOne Platform API Documentation
								</Link>
							</li>
							<li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiExternalLink />
								<Link href="https://github.com/spiffe/spire" target="_blank" rel="noopener noreferrer">
									SPIRE GitHub Repository
								</Link>
							</li>
						</ul>
					</CardBody>
				</InfoCard>
			</Section>

			<Alert $type="success">
				<FiCheckCircle style={{ fontSize: '1.5rem', flexShrink: 0 }} />
				<div>
					<strong>Ready to Get Started?</strong> Begin by deploying SPIRE in your environment and configuring 
					workload registration. Then set up SPIFFE Federation with PingOne to enable seamless SSO for your 
					workloads.
				</div>
			</Alert>
		</PageContainer>
	);
};

export default SpiffeSpirePingOne;

