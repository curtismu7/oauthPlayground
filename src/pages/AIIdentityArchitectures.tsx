import React from 'react';
import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';

// MDI Icon Helper Functions
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiActivity: 'mdi-activity',
		FiAlertTriangle: 'mdi-alert-triangle',
		FiCheckCircle: 'mdi-check-circle',
		FiCloud: 'mdi-cloud',
		FiCpu: 'mdi-cpu-64-bit',
		FiDatabase: 'mdi-database',
		FiExternalLink: 'mdi-open-in-new',
		FiEye: 'mdi-eye',
		FiGitBranch: 'mdi-git',
		FiGlobe: 'mdi-earth',
		FiInfo: 'mdi-information',
		FiKey: 'mdi-key',
		FiLock: 'mdi-lock',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield-check',
		FiTarget: 'mdi-target',
		FiTrendingUp: 'mdi-trending-up',
		FiUsers: 'mdi-account-group',
		FiZap: 'mdi-flash',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

// MDI Icon Component
const MDIIcon: React.FC<{ icon: string; size?: number; style?: React.CSSProperties; ariaLabel?: string }> = ({ 
	icon, 
	size = 16, 
	style, 
	ariaLabel 
}) => (
	<span
		className={`mdi ${getMDIIconClass(icon)}`}
		style={{ 
			fontSize: `${size}px`, 
			...style 
		}}
		aria-label={ariaLabel}
		aria-hidden={!ariaLabel}
	/>
);

const Container = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;

	h1 {
		font-size: 3rem;
		font-weight: 700;
		color: ${({ theme }) => theme.colors.primary};
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	p {
		font-size: 1.25rem;
		color: ${({ theme }) => theme.colors.gray600};
		max-width: 900px;
		margin: 0 auto;
		line-height: 1.6;
	}
`;

const Card = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	margin-bottom: 2rem;
	border: 1px solid #e5e7eb;
`;

const ArchitectureDiagram = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border: 2px solid #e5e7eb;
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981);
	}
`;

const Layer = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin: 1rem 0;
	padding: 1rem;
	background: white;
	border-radius: 0.5rem;
	border: 1px solid #e5e7eb;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const LayerIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 3rem;
	height: 3rem;
	background: ${({ color }) => color || '#3b82f6'};
	color: white;
	border-radius: 0.5rem;
	font-size: 1.25rem;
`;

const LayerContent = styled.div`
	flex: 1;

	h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: ${({ theme }) => theme.colors.gray900};
		margin-bottom: 0.25rem;
	}

	p {
		color: ${({ theme }) => theme.colors.gray600};
		font-size: 0.875rem;
		margin: 0;
	}
`;

const TrustBoundary = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 2px dashed #f59e0b;
	border-radius: 1rem;
	padding: 1.5rem;
	margin: 2rem 0;
	text-align: center;

	h3 {
		color: #92400e;
		font-weight: 600;
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	p {
		color: #a16207;
		margin: 0;
		font-size: 0.875rem;
	}
`;

const AgentType = styled.div`
	background: ${({ variant }) => {
		switch (variant) {
			case 'personal':
				return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
			case 'managed':
				return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
			case 'digital':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
			default:
				return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
		}
	}};
	border: 1px solid ${({ variant }) => {
		switch (variant) {
			case 'personal':
				return '#3b82f6';
			case 'managed':
				return '#10b981';
			case 'digital':
				return '#f59e0b';
			default:
				return '#6b7280';
		}
	}};
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const RoadmapItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.5rem;
	background: white;
	border-radius: 0.75rem;
	border: 1px solid #e5e7eb;
	margin: 1rem 0;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}
`;

const RoadmapIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	background: ${({ color }) => color || '#3b82f6'};
	color: white;
	border-radius: 0.5rem;
	font-size: 1.125rem;
	flex-shrink: 0;
`;

const RoadmapContent = styled.div`
	flex: 1;

	h4 {
		font-size: 1.125rem;
		font-weight: 600;
		color: ${({ theme }) => theme.colors.gray900};
		margin-bottom: 0.5rem;
	}

	p {
		color: ${({ theme }) => theme.colors.gray600};
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0;
	}
`;

const InfoBox = styled.div<{ $type?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	background: ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
			case 'error':
				return '#fee2e2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return '#92400e';
			case 'success':
				return '#065f46';
			case 'error':
				return '#991b1b';
			default:
				return '#1e40af';
		}
	}};
`;

const AIIdentityArchitectures: React.FC = () => {
	usePageScroll({ pageName: 'AI Identity Architectures', force: true });

	return (
		<Container>
			<FlowHeader flowId="ai-identity-architectures" />

			<Header>
				<h1>
					<MDIIcon icon="FiCpu" ariaLabel="CPU" />
					Identity for AI Architectures
				</h1>
				<p>
					Exploring the future of identity management in an AI-driven world. Understanding how to
					secure, manage, and govern AI agents and their interactions with enterprise systems.
				</p>
			</Header>

			{/* Identity Layers */}
			<CollapsibleHeader
				title="Identity Layers for AI"
				subtitle="Understanding the different layers of identity in AI architectures"
				icon={<MDIIcon icon="FiShield" ariaLabel="Security" />}
				theme="blue"
				defaultCollapsed={false}
			>
				<Card>
					<ArchitectureDiagram>
						<Layer>
							<LayerIcon color="#3b82f6">
								<MDIIcon icon="FiUsers" ariaLabel="Users" />
							</LayerIcon>
							<LayerContent>
								<h3>Users</h3>
								<p>Service Account, Password, Secret</p>
							</LayerContent>
						</Layer>

						<Layer>
							<LayerIcon color="#8b5cf6">
								<MDIIcon icon="FiKey" ariaLabel="Key" />
							</LayerIcon>
							<LayerContent>
								<h3>API Clients</h3>
								<p>OAuth Client ID, Client Secret, API Keys, mTLS</p>
							</LayerContent>
						</Layer>

						<Layer>
							<LayerIcon color="#06b6d4">
								<MDIIcon icon="FiCpu" ariaLabel="CPU" />
							</LayerIcon>
							<LayerContent>
								<h3>Workloads</h3>
								<p>SPIFFE, WIMSE, Secrets, mTLS</p>
							</LayerContent>
						</Layer>

						<Layer>
							<LayerIcon color="#10b981">
								<MDIIcon icon="FiDatabase" ariaLabel="Database" />
							</LayerIcon>
							<LayerContent>
								<h3>Devices/Machines</h3>
								<p>IP Address, mTLS</p>
							</LayerContent>
						</Layer>

						<Layer>
							<LayerIcon color="#f59e0b">
								<MDIIcon icon="FiZap" ariaLabel="Lightning" />
							</LayerIcon>
							<LayerContent>
								<h3>AI Agents</h3>
								<p>Agent Identity Types, Resource Types, Identifiers & Credential Types</p>
							</LayerContent>
						</Layer>
					</ArchitectureDiagram>
				</Card>
			</CollapsibleHeader>

			{/* OAuth Client Types */}
			<CollapsibleHeader
				title="OAuth Client Types for AI Agents"
				subtitle="Understanding different OAuth client types and their use cases for AI agents"
				icon={<MDIIcon icon="FiKey" ariaLabel="Key" />}
				theme="green"
				defaultCollapsed={false}
			>
				<Card>
					<AgentType variant="personal">
						<h3
							style={{
								color: '#1e40af',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<MDIIcon icon="FiUsers" ariaLabel="Users" />
							Personal Agents
						</h3>
						<p style={{ color: '#1e40af', marginBottom: '1rem' }}>
							<strong>OAuth Public Client</strong>
						</p>
						<ul style={{ color: '#1e40af', margin: 0, paddingLeft: '1.5rem' }}>
							<li>Authorization code grant with PKCE</li>
							<li>Cannot store client secrets securely</li>
							<li>Dynamic Client Registration</li>
						</ul>
					</AgentType>

					<AgentType variant="managed">
						<h3
							style={{
								color: '#065f46',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<MDIIcon icon="FiSettings" ariaLabel="Settings" />
							Managed Agents
						</h3>
						<p style={{ color: '#065f46', marginBottom: '1rem' }}>
							<strong>OAuth Confidential Client</strong>
						</p>
						<ul style={{ color: '#065f46', margin: 0, paddingLeft: '1.5rem' }}>
							<li>Pre-registered Clients</li>
							<li>Client credential grant</li>
							<li>Can store client secrets securely</li>
							<li>Token Exchange</li>
						</ul>
					</AgentType>

					<AgentType variant="digital">
						<h3
							style={{
								color: '#92400e',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<MDIIcon icon="FiCpu" ariaLabel="CPU" />
							Digital Workers
						</h3>
						<p style={{ color: '#92400e', marginBottom: '1rem' }}>
							<strong>Semi-Supervised Agent LCM</strong>
						</p>
						<ul style={{ color: '#92400e', margin: 0, paddingLeft: '1.5rem' }}>
							<li>Agent onboarding, offboarding, and governance</li>
							<li>Human-in-the-Loop</li>
							<li>Confirm/Approve with user for JIT access and high risk interactions</li>
						</ul>
					</AgentType>
				</Card>
			</CollapsibleHeader>

			{/* Trust Boundaries */}
			<CollapsibleHeader
				title="Trust Boundaries in AI Architectures"
				subtitle="Understanding security boundaries and trust models for AI agent interactions"
				icon={<MDIIcon icon="FiLock" ariaLabel="Lock" />}
				theme="orange"
				defaultCollapsed={false}
			>
				<Card>
					<TrustBoundary>
						<h3>
							<MDIIcon icon="FiShield" ariaLabel="Security" />
							Trust Boundary
						</h3>
						<p>
							The security perimeter that defines trusted vs. untrusted components in AI
							architectures
						</p>
					</TrustBoundary>

					<InfoBox $type="info">
						<MDIIcon icon="FiInfo" ariaLabel="Info" />
						<div>
							<strong>Key Considerations:</strong>
							<ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
								<li>Agent Discovery and Registration</li>
								<li>Consent Validation and User Approval</li>
								<li>Token Exchange and Delegation</li>
								<li>Human-in-the-Loop Controls</li>
							</ul>
						</div>
					</InfoBox>
				</Card>
			</CollapsibleHeader>

			{/* Architecture Patterns */}
			<CollapsibleHeader
				title="Architecture Patterns"
				subtitle="Different architectural patterns for AI agent identity management"
				icon={<MDIIcon icon="FiGitBranch" ariaLabel="Git" />}
				theme="highlight"
				defaultCollapsed={false}
			>
				<Card>
					<div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
						<div
							style={{
								padding: '1.5rem',
								background: '#f8fafc',
								borderRadius: '0.75rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<h4
								style={{
									color: '#1e40af',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiGlobe" ariaLabel="Globe" />
								Single Platform, Multi-Domain
							</h4>
							<p style={{ color: '#4b5563', margin: 0 }}>
								Centralized identity management across multiple domains within a single platform
							</p>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: '#f0fdf4',
								borderRadius: '0.75rem',
								border: '1px solid #bbf7d0',
							}}
						>
							<h4
								style={{
									color: '#065f46',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiCloud" ariaLabel="Cloud" />
								Multi-Platform, Multi-Domain
							</h4>
							<p style={{ color: '#4b5563', margin: 0 }}>
								Distributed identity management across multiple platforms and domains
							</p>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: '#fef3c7',
								borderRadius: '0.75rem',
								border: '1px solid #fde68a',
							}}
						>
							<h4
								style={{
									color: '#92400e',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiExternalLink" ariaLabel="External Link" />
								External Agent Integration
							</h4>
							<p style={{ color: '#4b5563', margin: 0 }}>
								Integration with external and third-party AI agents
							</p>
						</div>
					</div>
				</Card>
			</CollapsibleHeader>

			{/* CUAs vs Bots */}
			<CollapsibleHeader
				title="CUAs vs Bots: The Paradigm Shift"
				subtitle="Understanding the difference between Computer Using Agents and traditional bots"
				icon={<MDIIcon icon="FiTarget" ariaLabel="Target" />}
				theme="yellow"
				defaultCollapsed={false}
			>
				<Card>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '2rem',
							marginBottom: '2rem',
						}}
					>
						<div
							style={{
								padding: '1.5rem',
								background: '#fee2e2',
								borderRadius: '0.75rem',
								border: '1px solid #fecaca',
							}}
						>
							<h4
								style={{
									color: '#991b1b',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiAlertTriangle" ariaLabel="Alert" />
								Before: Bots as Threats
							</h4>
							<ul style={{ color: '#991b1b', margin: 0, paddingLeft: '1.5rem' }}>
								<li>Credential stuffing</li>
								<li>Password spraying</li>
								<li>Automated fraud</li>
								<li>Malicious intent</li>
							</ul>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: '#d1fae5',
								borderRadius: '0.75rem',
								border: '1px solid #a7f3d0',
							}}
						>
							<h4
								style={{
									color: '#065f46',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiCheckCircle" ariaLabel="Check" />
								Now: CUAs as Verified Agents
							</h4>
							<ul style={{ color: '#065f46', margin: 0, paddingLeft: '1.5rem' }}>
								<li>Identified & approved agents</li>
								<li>Intent evaluation</li>
								<li>Known user context</li>
								<li>Legitimate access</li>
							</ul>
						</div>
					</div>

					<InfoBox $type="warning">
						<MDIIcon icon="FiAlertTriangle" ariaLabel="Alert" />
						<div>
							<strong>Key Insight:</strong> The paradigm has shifted from treating all automated
							entities as threats to recognizing and managing legitimate Computer Using Agents
							(CUAs) that act on behalf of users.
						</div>
					</InfoBox>
				</Card>
			</CollapsibleHeader>

			{/* Thematic Roadmap */}
			<CollapsibleHeader
				title="Identity for AI: Thematic Roadmap"
				subtitle="Key areas of focus for identity management in AI architectures"
				icon={<MDIIcon icon="FiTrendingUp" ariaLabel="Trending Up" />}
				theme="green"
				defaultCollapsed={false}
			>
				<Card>
					<RoadmapItem>
						<RoadmapIcon color="#3b82f6">
							<MDIIcon icon="FiEye" ariaLabel="Eye" />
						</RoadmapIcon>
						<RoadmapContent>
							<h4>Making Agents Visible Across The Estate</h4>
							<p>
								Bot detection capabilities to identify unknown agents interacting with services.
								Centrally manage agents and tools with a single management plane for agent
								identities.
							</p>
						</RoadmapContent>
					</RoadmapItem>

					<RoadmapItem>
						<RoadmapIcon color="#8b5cf6">
							<MDIIcon icon="FiUsers" ariaLabel="Users" />
						</RoadmapIcon>
						<RoadmapContent>
							<h4>Bringing Brand Experiences to Life on the Agentic Channel</h4>
							<p>
								Standardized approaches to offer best-in-class brand and security experiences to a
								human using an agent. Human in the loop; consents; constraints.
							</p>
						</RoadmapContent>
					</RoadmapItem>

					<RoadmapItem>
						<RoadmapIcon color="#06b6d4">
							<MDIIcon icon="FiKey" ariaLabel="Key" />
						</RoadmapIcon>
						<RoadmapContent>
							<h4>Getting Token Issuance Right</h4>
							<p>
								Issue the right tokens to the right actors with the right scopes at the right
								control points. Agent Detection, MCP Gateway, Agent Management.
							</p>
						</RoadmapContent>
					</RoadmapItem>

					<RoadmapItem>
						<RoadmapIcon color="#10b981">
							<MDIIcon icon="FiShield" ariaLabel="Security" />
						</RoadmapIcon>
						<RoadmapContent>
							<h4>Authentication & Authorization</h4>
							<p>
								Entitlements management with least privilege, policy-based access control.
								Permission and policy controls to handle permission creep & delegated entitlements
								across A2A agents.
							</p>
						</RoadmapContent>
					</RoadmapItem>

					<RoadmapItem>
						<RoadmapIcon color="#f59e0b">
							<MDIIcon icon="FiActivity" ariaLabel="Activity" />
						</RoadmapIcon>
						<RoadmapContent>
							<h4>Enterprise Grade Service Layer for Agents</h4>
							<p>
								Protocol support, security controls and integrations to securely provide tools to
								agents, gain visibility of, and manage access policies. Revocation and kill switch
								controls.
							</p>
						</RoadmapContent>
					</RoadmapItem>
				</Card>
			</CollapsibleHeader>

			{/* What's Needed */}
			<CollapsibleHeader
				title="What's Needed for AI Identity"
				subtitle="Essential components and capabilities for comprehensive AI identity management"
				icon={<MDIIcon icon="FiSettings" ariaLabel="Settings" />}
				theme="blue"
				defaultCollapsed={false}
			>
				<Card>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '1.5rem',
						}}
					>
						<div
							style={{
								padding: '1.5rem',
								background: '#f8fafc',
								borderRadius: '0.75rem',
								border: '1px solid #e2e8f0',
							}}
						>
							<h4
								style={{
									color: '#1e40af',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiEye" ariaLabel="Eye" />
								Agent Discovery
							</h4>
							<ul style={{ color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
								<li>Agent Platform Integrations</li>
								<li>CUA Detection</li>
								<li>Centralized Control Plane</li>
							</ul>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: '#f0fdf4',
								borderRadius: '0.75rem',
								border: '1px solid #bbf7d0',
							}}
						>
							<h4
								style={{
									color: '#065f46',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiShield" ariaLabel="Security" />
								Security & Governance
							</h4>
							<ul style={{ color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
								<li>Agent Identity Type Provisioning</li>
								<li>Policy Management</li>
								<li>Human Oversight & Accountability</li>
							</ul>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: '#fef3c7',
								borderRadius: '0.75rem',
								border: '1px solid #fde68a',
							}}
						>
							<h4
								style={{
									color: '#92400e',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiUsers" ariaLabel="Users" />
								Human-Agent Experience
							</h4>
							<ul style={{ color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
								<li>Consents & Constraints</li>
								<li>Human in the Loop</li>
								<li>Requests & Approvals</li>
							</ul>
						</div>

						<div
							style={{
								padding: '1.5rem',
								background: '#eff6ff',
								borderRadius: '0.75rem',
								border: '1px solid #bfdbfe',
							}}
						>
							<h4
								style={{
									color: '#1e40af',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<MDIIcon icon="FiActivity" ariaLabel="Activity" />
								Operations & Monitoring
							</h4>
							<ul style={{ color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
								<li>Governance & Certification</li>
								<li>Audit Trail</li>
								<li>Just-in-Time Privilege</li>
							</ul>
						</div>
					</div>
				</Card>
			</CollapsibleHeader>

			{/* Emerging Trends */}
			<CollapsibleHeader
				title="Emerging Trends"
				subtitle="Latest developments and trends in AI identity management"
				icon={<MDIIcon icon="FiTrendingUp" ariaLabel="Trending Up" />}
				theme="highlight"
				defaultCollapsed={false}
			>
				<Card>
					<div
						style={{
							padding: '1.5rem',
							background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
							borderRadius: '0.75rem',
							border: '1px solid #0ea5e9',
						}}
					>
						<h4
							style={{
								color: '#0c4a6e',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<MDIIcon icon="FiZap" ariaLabel="Lightning" />
							SSO for AI Agents
						</h4>
						<p style={{ color: '#0c4a6e', marginBottom: '1rem' }}>
							<strong>OAuth Assertion Grant Flow</strong> enables Agent SSO and enterprise managed
							authorization policy
						</p>
						<ul style={{ color: '#0c4a6e', margin: 0, paddingLeft: '1.5rem' }}>
							<li>Eliminates need for agent to store multiple secrets for each backend service</li>
							<li>Agent Credential exchanged for Assertion Grant</li>
							<li>Centralized authorization policy management</li>
						</ul>
					</div>

					<InfoBox $type="success">
						<MDIIcon icon="FiCheckCircle" ariaLabel="Check" />
						<div>
							<strong>Key Benefits:</strong> Simplified credential management, enhanced security,
							and centralized policy enforcement for AI agents across enterprise systems.
						</div>
					</InfoBox>
				</Card>
			</CollapsibleHeader>
		</Container>
	);
};

export default AIIdentityArchitectures;
