// src/components/PingOneWorkerInfo.tsx

import {
	FiAlertTriangle,
	FiCheckCircle,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiServer,
	FiShield,
} from '@icons';
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border-radius: 0.75rem;
	padding: 1.5rem;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.75rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const Title = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Subtitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #374151;
	margin: 0 0 0.75rem 0;
`;

const Description = styled.p`
	color: #4b5563;
	line-height: 1.6;
	margin: 0 0 1rem 0;
`;

const InfoBox = styled.div<{ $color?: string }>`
	background: ${(props) => {
		switch (props.$color) {
			case 'blue':
				return '#eff6ff';
			case 'purple':
				return '#faf5ff';
			case 'green':
				return '#f0fdf4';
			case 'orange':
				return '#fff7ed';
			case 'red':
				return '#fef2f2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$color) {
			case 'blue':
				return '#bfdbfe';
			case 'purple':
				return '#e9d5ff';
			case 'green':
				return '#bbf7d0';
			case 'orange':
				return '#fed7aa';
			case 'red':
				return '#fecaca';
			default:
				return '#bfdbfe';
		}
	}};
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const Card = styled.div<{ $color?: string }>`
	background: ${(props) => {
		switch (props.$color) {
			case 'blue':
				return 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)';
			case 'green':
				return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
			case 'orange':
				return '#fff7ed';
			case 'red':
				return '#fef2f2';
			default:
				return '#f9fafb';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$color) {
			case 'blue':
				return '#bfdbfe';
			case 'green':
				return '#86efac';
			case 'orange':
				return '#fed7aa';
			case 'red':
				return '#fecaca';
			default:
				return '#e5e7eb';
		}
	}};
	border-radius: 0.5rem;
	padding: 1rem;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
`;

const CardTitle = styled.h4`
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CardText = styled.p`
	font-size: 0.875rem;
	color: #4b5563;
	line-height: 1.5;
	margin: 0;
`;

const FlowStep = styled.div`
	display: flex;
	align-items: start;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
`;

const StepNumber = styled.div`
	flex-shrink: 0;
	width: 2rem;
	height: 2rem;
	background: #8b5cf6;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.875rem;
	font-weight: 600;
`;

const StepText = styled.span`
	color: #374151;
	padding-top: 0.25rem;
`;

const RoleCard = styled.div`
	border-left: 4px solid #fb923c;
	padding-left: 1rem;
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
	background: #fff7ed;
	margin-bottom: 0.75rem;
`;

const RoleName = styled.h4`
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.25rem 0;
`;

const RoleDescription = styled.p`
	font-size: 0.875rem;
	color: #4b5563;
	margin: 0;
`;

const BestPracticeItem = styled.div`
	display: flex;
	align-items: start;
	gap: 0.75rem;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.5rem;
	padding: 0.75rem;
`;

const BestPracticeText = styled.p`
	font-size: 0.875rem;
	color: #7f1d1d;
	margin: 0;
`;

const CriticalNote = styled.div`
	background: #fee2e2;
	border: 2px solid #fca5a5;
	border-radius: 0.5rem;
	padding: 1.25rem;
	display: flex;
	align-items: start;
	gap: 0.75rem;
`;

const CriticalTitle = styled.h3`
	font-weight: 700;
	color: #7f1d1d;
	margin: 0 0 0.5rem 0;
	font-size: 1.125rem;
`;

const CriticalText = styled.p`
	color: #991b1b;
	margin: 0;
	line-height: 1.6;
`;

const QuickReference = styled.div`
	background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
	border-radius: 0.75rem;
	padding: 1.5rem;
	color: white;
`;

const QuickRefTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 700;
	margin: 0 0 1rem 0;
`;

const QuickRefGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
`;

const QuickRefItem = styled.div`
	h4 {
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}
	
	p {
		font-size: 0.875rem;
		color: #e0e7ff;
		margin: 0;
	}
`;

const IconWrapper = styled.div<{ $color?: string }>`
	color: ${(props) => {
		switch (props.$color) {
			case 'blue':
				return '#4f46e5';
			case 'purple':
				return '#8b5cf6';
			case 'green':
				return '#10b981';
			case 'orange':
				return '#fb923c';
			case 'red':
				return '#dc2626';
			default:
				return '#4f46e5';
		}
	}};
	flex-shrink: 0;
`;

const PingOneWorkerInfo: React.FC = () => {
	return (
		<Container>
			{/* Header */}
			<Section>
				<Header>
					<IconWrapper $color="blue">
						<FiServer size={48} />
					</IconWrapper>
					<div>
						<Title>PingOne Worker Application & Token Usage</Title>
						<Description>
							A Worker application is an admin-level, non-interactive application connection to
							PingOne that acts on behalf of administrators to interact with PingOne APIs
							programmatically.
						</Description>
					</div>
				</Header>
				<InfoBox $color="blue">
					<strong>In Simple Terms:</strong> Think of it as a service account or machine identity
					that performs administrative tasks without requiring a human user to be present.
				</InfoBox>
			</Section>

			{/* Key Functions */}
			<Section>
				<Title>
					<FiKey size={28} />
					What Does It Do?
				</Title>
				<Grid>
					<Card $color="blue">
						<CardTitle>
							<FiCheckCircle size={20} color="#10b981" />
							API Management
						</CardTitle>
						<CardText>
							Create, read, update, and delete PingOne resources (users, groups, applications,
							environments)
						</CardText>
					</Card>
					<Card $color="blue">
						<CardTitle>
							<FiCheckCircle size={20} color="#10b981" />
							Automation
						</CardTitle>
						<CardText>
							Enable infrastructure-as-code tools like Terraform to manage PingOne configurations
						</CardText>
					</Card>
					<Card $color="blue">
						<CardTitle>
							<FiCheckCircle size={20} color="#10b981" />
							Integration
						</CardTitle>
						<CardText>
							Connect external systems to PingOne for provisioning, authentication flows, and
							administrative operations
						</CardText>
					</Card>
					<Card $color="blue">
						<CardTitle>
							<FiCheckCircle size={20} color="#10b981" />
							Administrative Tasks
						</CardTitle>
						<CardText>
							Perform bulk operations, reporting, and monitoring without manual console access
						</CardText>
					</Card>
				</Grid>
			</Section>

			{/* Token Usage */}
			<Section>
				<Title>
					<FiRefreshCw size={28} />
					Worker Token Usage
				</Title>
				<InfoBox $color="purple">
					<Description>
						Worker apps obtain access tokens via OAuth 2.0 Client Credentials Flow. Access tokens
						are JSON Web Tokens (JWTs) that authorize calls to PingOne Platform APIs.
					</Description>
					<strong>⏱️ Token Validity:</strong> Access tokens are valid for 1 hour, after which a new
					token must be requested.
				</InfoBox>

				<Subtitle>Token Acquisition Flow:</Subtitle>
				<FlowStep>
					<StepNumber>1</StepNumber>
					<StepText>Worker app authenticates using Client Credentials Flow (OAuth 2.0)</StepText>
				</FlowStep>
				<FlowStep>
					<StepNumber>2</StepNumber>
					<StepText>Sends client_id and client_secret to PingOne token endpoint</StepText>
				</FlowStep>
				<FlowStep>
					<StepNumber>3</StepNumber>
					<StepText>
						Receives an access token (JWT) with permissions based on assigned roles
					</StepText>
				</FlowStep>
				<FlowStep>
					<StepNumber>4</StepNumber>
					<StepText>Uses bearer token authentication for all API requests</StepText>
				</FlowStep>
				<FlowStep>
					<StepNumber>5</StepNumber>
					<StepText>Token expires after 60 minutes - must refresh</StepText>
				</FlowStep>
			</Section>

			{/* Use Cases */}
			<Section>
				<Title>Common Use Cases</Title>
				<Grid>
					<Card $color="green">
						<CardTitle>DevOps</CardTitle>
						<CardText>Terraform provisioning PingOne environments and applications</CardText>
					</Card>
					<Card $color="green">
						<CardTitle>CI/CD Pipelines</CardTitle>
						<CardText>Automated deployment of authentication configurations</CardText>
					</Card>
					<Card $color="green">
						<CardTitle>User Provisioning</CardTitle>
						<CardText>HR systems syncing employee data to PingOne</CardText>
					</Card>
					<Card $color="green">
						<CardTitle>Monitoring & Reporting</CardTitle>
						<CardText>Automated collection of authentication metrics</CardText>
					</Card>
					<Card $color="green">
						<CardTitle>Backup & DR</CardTitle>
						<CardText>Scheduled exports of configurations</CardText>
					</Card>
				</Grid>
			</Section>

			{/* Roles */}
			<Section>
				<Title>
					<FiShield size={28} />
					Role-Based Permissions
				</Title>
				<InfoBox $color="orange">
					Worker applications have no roles by default. Roles must be assigned after creation to
					grant specific permissions.
				</InfoBox>

				<Subtitle>Common Roles Assigned to Worker Apps:</Subtitle>
				<RoleCard>
					<RoleName>Organization Admin</RoleName>
					<RoleDescription>Create/manage environments across the organization</RoleDescription>
				</RoleCard>
				<RoleCard>
					<RoleName>Environment Admin</RoleName>
					<RoleDescription>Full control over a specific environment</RoleDescription>
				</RoleCard>
				<RoleCard>
					<RoleName>Identity Data Admin</RoleName>
					<RoleDescription>Manage users, groups, and populations</RoleDescription>
				</RoleCard>
				<RoleCard>
					<RoleName>Application Owner</RoleName>
					<RoleDescription>Manage application configurations</RoleDescription>
				</RoleCard>
				<RoleCard>
					<RoleName>Client Application Developer</RoleName>
					<RoleDescription>Create and configure OAuth/OIDC applications</RoleDescription>
				</RoleCard>
			</Section>

			{/* Security Best Practices */}
			<Section>
				<Title>
					<FiLock size={28} />
					Security Considerations
				</Title>

				<Grid>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>
							Store client secrets in secure vaults (never in code repositories)
						</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>
							Assign least-privilege roles - only what's needed for the task
						</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>
							Use separate Worker apps for different automation tasks
						</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>
							Rotate client secrets regularly (every 90 days recommended)
						</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>Monitor Worker app API usage for anomalies</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>Implement IP whitelisting when possible</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>
							Use certificate-based authentication for enhanced security
						</BestPracticeText>
					</BestPracticeItem>
					<BestPracticeItem>
						<IconWrapper $color="red">
							<FiCheckCircle size={20} />
						</IconWrapper>
						<BestPracticeText>
							Never share Worker app credentials across teams or environments
						</BestPracticeText>
					</BestPracticeItem>
				</Grid>

				<div style={{ marginTop: '1.5rem' }}>
					<CriticalNote>
						<IconWrapper $color="red">
							<FiAlertTriangle size={32} />
						</IconWrapper>
						<div>
							<CriticalTitle>Critical Security Note</CriticalTitle>
							<CriticalText>
								Worker app credentials apply only to the Worker app itself, not to PingOne admin
								users. Admin users need separate role assignments to perform the same actions.
							</CriticalText>
						</div>
					</CriticalNote>
				</div>
			</Section>

			{/* Quick Reference Card */}
			<QuickReference>
				<QuickRefTitle>Quick Reference</QuickRefTitle>
				<QuickRefGrid>
					<QuickRefItem>
						<h4>Authentication</h4>
						<p>OAuth 2.0 Client Credentials Flow</p>
					</QuickRefItem>
					<QuickRefItem>
						<h4>Token Type</h4>
						<p>JWT (JSON Web Token)</p>
					</QuickRefItem>
					<QuickRefItem>
						<h4>Token Lifetime</h4>
						<p>60 minutes (1 hour)</p>
					</QuickRefItem>
				</QuickRefGrid>
			</QuickReference>
		</Container>
	);
};

export default PingOneWorkerInfo;
