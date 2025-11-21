import React from 'react';
import {
	FiAlertTriangle,
	FiArrowRight,
	FiBookOpen,
	FiCheckCircle,
	FiDatabase,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiUsers,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import { PageLayoutService } from '../../services/pageLayoutService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
`;

const Content = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  color: #1f2937;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
`;

const SectionSubtitle = styled.h3`
  color: #374151;
  font-size: 1.4rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Paragraph = styled.p`
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 1.5rem;
  font-size: 1rem;
`;

const InfoBox = styled.div<{ type: 'info' | 'warning' | 'success' | 'error' }>`
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid;
  background: ${(props) => {
		switch (props.type) {
			case 'info':
				return '#eff6ff';
			case 'warning':
				return '#fffbeb';
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			default:
				return '#f9fafb';
		}
	}};
  border-color: ${(props) => {
		switch (props.type) {
			case 'info':
				return '#3b82f6';
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
`;

const InfoBoxContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoBoxIcon = styled.div<{ type: 'info' | 'warning' | 'success' | 'error' }>`
  color: ${(props) => {
		switch (props.type) {
			case 'info':
				return '#3b82f6';
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
  font-size: 1.25rem;
  margin-top: 0.125rem;
`;

const InfoBoxText = styled.div`
  flex: 1;
`;

const InfoBoxTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #1f2937;
`;

const InfoBoxDescription = styled.p`
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const InlineCode = styled.code`
  background: #f3f4f6;
  color: #dc2626;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  font-weight: 600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const List = styled.ul`
  color: #4b5563;
  line-height: 1.7;
  margin: 1.5rem 0;
  padding-left: 1.5rem;
`;

const ListItem = styled.li`
  margin-bottom: 0.75rem;
`;

const DiagramContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
`;

const DiagramTitle = styled.h4`
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
`;

const FlowStep = styled.div<{ $isActive?: boolean }>`
  background: ${(props) => (props.$isActive ? '#3b82f6' : 'white')};
  color: ${(props) => (props.$isActive ? 'white' : '#374151')};
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin: 0.5rem;
  display: inline-block;
  border: 2px solid ${(props) => (props.$isActive ? '#3b82f6' : '#e5e7eb')};
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FlowArrow = styled.div`
  color: #6b7280;
  font-size: 1.5rem;
  margin: 0 0.5rem;
  display: inline-block;
  vertical-align: middle;
`;

const BestPracticeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const BestPracticeCard = styled.div<{ type: 'do' | 'dont' }>`
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid;
  background: ${(props) => (props.type === 'do' ? '#f0fdf4' : '#fef2f2')};
  border-color: ${(props) => (props.type === 'do' ? '#10b981' : '#ef4444')};
`;

const BestPracticeHeader = styled.div<{ type: 'do' | 'dont' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: ${(props) => (props.type === 'do' ? '#059669' : '#dc2626')};
  font-weight: 600;
  font-size: 1.1rem;
`;

const BestPracticeContent = styled.div`
  color: #4b5563;
  line-height: 1.6;
`;

const ScopesBestPractices: React.FC = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'scopes-best-practices',
	};
	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

				<Content>
					<Section>
						<SectionTitle>
							<FiBookOpen />
							What are OAuth 2.0 Scopes?
						</SectionTitle>

						<Paragraph>
							OAuth 2.0 scopes are strings issued to access tokens that define the specific
							permissions a client application has when accessing protected resources. They act as a
							high-level authorization mechanism, restricting what APIs and operations a client can
							perform.
						</Paragraph>

						<InfoBox type="info">
							<InfoBoxContent>
								<InfoBoxIcon type="info">
									<FiKey />
								</InfoBoxIcon>
								<InfoBoxText>
									<InfoBoxTitle>Scope Purpose</InfoBoxTitle>
									<InfoBoxDescription>
										Scopes provide granular access control by defining both the type of resource and
										the operations allowed on that resource. They are essential for API security and
										user privacy protection.
									</InfoBoxDescription>
								</InfoBoxText>
							</InfoBoxContent>
						</InfoBox>

						<SectionSubtitle>Basic Scope Structure</SectionSubtitle>
						<Paragraph>
							A common approach to scope design combines the resource type with the access level
							required:
						</Paragraph>

						<Table>
							<thead>
								<tr>
									<TableHeader>Resource Type</TableHeader>
									<TableHeader>Access Level</TableHeader>
									<TableHeader>Scope Value</TableHeader>
									<TableHeader>Example Use Case</TableHeader>
								</tr>
							</thead>
							<tbody>
								<TableRow>
									<TableCell>
										<InlineCode>order</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>read</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>order:read</InlineCode>
									</TableCell>
									<TableCell>View customer orders</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<InlineCode>user</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>write</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>user:write</InlineCode>
									</TableCell>
									<TableCell>Update user profile</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<InlineCode>payment</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>process</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>payment:process</InlineCode>
									</TableCell>
									<TableCell>Process transactions</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<InlineCode>inventory</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>manage</InlineCode>
									</TableCell>
									<TableCell>
										<InlineCode>inventory:manage</InlineCode>
									</TableCell>
									<TableCell>Full inventory control</TableCell>
								</TableRow>
							</tbody>
						</Table>
					</Section>

					<Section>
						<SectionTitle>
							<FiUsers />
							Scopes in Real-World Systems
						</SectionTitle>

						<Paragraph>
							Modern organizations typically develop multiple APIs and clients across different
							business areas. Each component needs proper scope configuration to ensure secure
							access control.
						</Paragraph>

						<DiagramContainer>
							<DiagramTitle>Example Business Scenario: API Scopes and Clients</DiagramTitle>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									justifyContent: 'center',
									alignItems: 'center',
									gap: '1rem',
								}}
							>
								<FlowStep $isActive>Customer App</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Orders API</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Inventory API</FlowStep>
							</div>
							<div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
								<strong>Scopes:</strong> <InlineCode>orders:read</InlineCode>,{' '}
								<InlineCode>orders:write</InlineCode>, <InlineCode>inventory:read</InlineCode>
							</div>
						</DiagramContainer>

						<SectionSubtitle>Client Configuration</SectionSubtitle>
						<Paragraph>
							Each client must be configured with appropriate scopes to restrict its API privileges.
							The scopes in an access token represent the current API privileges available to the
							client.
						</Paragraph>

						<BestPracticeGrid>
							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Do: Configure Scopes by Business Area
								</BestPracticeHeader>
								<BestPracticeContent>
									<strong>Example:</strong> Use business-focused scopes like{' '}
									<InlineCode>orders</InlineCode>,<InlineCode>payments</InlineCode>,{' '}
									<InlineCode>inventory</InlineCode> rather than technical scopes like{' '}
									<InlineCode>api1</InlineCode>, <InlineCode>api2</InlineCode>.
								</BestPracticeContent>
							</BestPracticeCard>

							<BestPracticeCard type="dont">
								<BestPracticeHeader type="dont">
									<FiXCircle />
									Don't: Use Technical API Names
								</BestPracticeHeader>
								<BestPracticeContent>
									<strong>Avoid:</strong> Technical scope names that tie to specific API
									implementations or microservice architectures. This creates tight coupling and
									reduces flexibility.
								</BestPracticeContent>
							</BestPracticeCard>
						</BestPracticeGrid>
					</Section>

					<Section>
						<SectionTitle>
							<FiShield />
							Scope Design Principles
						</SectionTitle>

						<SectionSubtitle>1. Stability Over Flexibility</SectionSubtitle>
						<Paragraph>
							Scopes should remain stable to avoid "scope explosion" - the rapid proliferation of
							new scopes as systems evolve. Design scopes to be business-oriented and long-lasting.
						</Paragraph>

						<InfoBox type="warning">
							<InfoBoxContent>
								<InfoBoxIcon type="warning">
									<FiAlertTriangle />
								</InfoBoxIcon>
								<InfoBoxText>
									<InfoBoxTitle>Scope Explosion Anti-Pattern</InfoBoxTitle>
									<InfoBoxDescription>
										Avoid creating new scopes for every small API change. Instead, design scopes
										that can accommodate multiple related operations within a business domain.
									</InfoBoxDescription>
								</InfoBoxText>
							</InfoBoxContent>
						</InfoBox>

						<SectionSubtitle>2. High-Privilege Scopes</SectionSubtitle>
						<Paragraph>
							Some operations require elevated permissions that should only be granted temporarily.
							Use high-privilege scopes with appropriate time-to-live configurations.
						</Paragraph>

						<DiagramContainer>
							<DiagramTitle>High-Privilege Scope Flow</DiagramTitle>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									justifyContent: 'center',
									alignItems: 'center',
									gap: '1rem',
								}}
							>
								<FlowStep>User Action</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Request High-Privilege Scope</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep $isActive>User Consent</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Access Token with Elevated Permissions</FlowStep>
							</div>
							<div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
								<strong>Example:</strong> <InlineCode>payment:process</InlineCode> scope for payment
								operations
							</div>
						</DiagramContainer>

						<SectionSubtitle>3. Prefix Scopes for Dynamic Resources</SectionSubtitle>
						<Paragraph>
							For advanced scenarios where resource IDs are determined at runtime, use prefix scopes
							with a trailing hyphen convention.
						</Paragraph>

						<CodeBlock>{`// Configuration in authorization server
transaction-

// Client request at runtime
transaction-12345
transaction-67890

// Granted scope (always concrete)
transaction-12345`}</CodeBlock>

						<InfoBox type="info">
							<InfoBoxContent>
								<InfoBoxIcon type="info">
									<FiKey />
								</InfoBoxIcon>
								<InfoBoxText>
									<InfoBoxTitle>Prefix Scope Use Cases</InfoBoxTitle>
									<InfoBoxDescription>
										Useful for Financial-grade scenarios where specific transaction or account IDs
										need to be authorized dynamically. Always results in concrete, specific scopes.
									</InfoBoxDescription>
								</InfoBoxText>
							</InfoBoxContent>
						</InfoBox>
					</Section>

					<Section>
						<SectionTitle>
							<FiRefreshCw />
							Token Exchange and Scope Management
						</SectionTitle>

						<Paragraph>
							When APIs need to call other APIs, you have two main approaches: forwarding tokens or
							using token exchange to obtain new tokens with different scopes.
						</Paragraph>

						<SectionSubtitle>Simple Token Forwarding</SectionSubtitle>
						<Paragraph>
							For small microservices setups, forwarding the original access token works well when
							each API checks for its required scopes.
						</Paragraph>

						<DiagramContainer>
							<DiagramTitle>Token Forwarding Approach</DiagramTitle>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									justifyContent: 'center',
									alignItems: 'center',
									gap: '1rem',
								}}
							>
								<FlowStep>Client</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Orders API</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Inventory API</FlowStep>
							</div>
							<div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
								<strong>Same Token:</strong> <InlineCode>orders:read</InlineCode>,{' '}
								<InlineCode>inventory:read</InlineCode>
							</div>
						</DiagramContainer>

						<SectionSubtitle>Token Exchange for Downscoping</SectionSubtitle>
						<Paragraph>
							For enhanced security, use OAuth token exchange to obtain new tokens with reduced
							scopes when calling less trusted upstream APIs.
						</Paragraph>

						<DiagramContainer>
							<DiagramTitle>Token Exchange Flow</DiagramTitle>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									justifyContent: 'center',
									alignItems: 'center',
									gap: '1rem',
								}}
							>
								<FlowStep>Orders API</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep $isActive>Token Exchange</FlowStep>
								<FlowArrow></FlowArrow>
								<FlowStep>Shipping API</FlowStep>
							</div>
							<div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
								<strong>Original:</strong> <InlineCode>orders:read orders:write</InlineCode>
								<br />
								<strong>Exchanged:</strong> <InlineCode>shipping:write</InlineCode>
							</div>
						</DiagramContainer>

						<CodeBlock>{`curl -X POST https://auth.pingone.com/{env-id}/as/token \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange' \\
  -d 'client_id=forwarding-api' \\
  -d 'client_secret=myS3cret' \\
  -d 'subject_token=56acc3f6-b9ef-4a34-a9d4-f9d7a27a505b' \\
  -d 'subject_token_type=urn:ietf:params:oauth:token-type:access_token' \\
  -d 'scope=shipping.write' \\
  -d 'audience=shipping-api'`}</CodeBlock>
					</Section>

					<Section>
						<SectionTitle>
							<FiDatabase />
							Scope Best Practices Summary
						</SectionTitle>

						<Paragraph>
							Follow these essential guidelines when designing and implementing scopes in your OAuth
							2.0 system:
						</Paragraph>

						<BestPracticeGrid>
							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Always Use Scopes
								</BestPracticeHeader>
								<BestPracticeContent>
									Always use scopes in APIs and enforce them at every API endpoint. Return 403
									Forbidden when access tokens have insufficient scope.
								</BestPracticeContent>
							</BestPracticeCard>

							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Enable User Consent
								</BestPracticeHeader>
								<BestPracticeContent>
									Enable user consent when users need to grant scope-based access to third-party
									clients. This ensures transparency and user control over data sharing.
								</BestPracticeContent>
							</BestPracticeCard>

							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Use Business Areas
								</BestPracticeHeader>
								<BestPracticeContent>
									Consider using API business areas as scopes rather than technical implementation
									details. This creates more maintainable and understandable authorization policies.
								</BestPracticeContent>
							</BestPracticeCard>

							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Keep Scopes Stable
								</BestPracticeHeader>
								<BestPracticeContent>
									Keep scopes stable to avoid scope explosion. Only add new scopes when adding new
									API business areas, not for technical changes.
								</BestPracticeContent>
							</BestPracticeCard>

							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Design for End-to-End Flows
								</BestPracticeHeader>
								<BestPracticeContent>
									Design scopes so they work for end-to-end flows using multiple APIs. Consider how
									tokens will be shared or exchanged between services.
								</BestPracticeContent>
							</BestPracticeCard>

							<BestPracticeCard type="do">
								<BestPracticeHeader type="do">
									<FiCheckCircle />
									Use Token Exchange
								</BestPracticeHeader>
								<BestPracticeContent>
									Use token exchange to downgrade scopes when calling less trusted upstream APIs.
									This follows the principle of least privilege.
								</BestPracticeContent>
							</BestPracticeCard>
						</BestPracticeGrid>

						<InfoBox type="success">
							<InfoBoxContent>
								<InfoBoxIcon type="success">
									<FiShield />
								</InfoBoxIcon>
								<InfoBoxText>
									<InfoBoxTitle>Complete Authorization Solution</InfoBoxTitle>
									<InfoBoxDescription>
										Remember that scopes provide high-level access control but do not provide a
										complete API authorization solution. Combine scopes with claims and other
										authorization mechanisms for comprehensive security.
									</InfoBoxDescription>
								</InfoBoxText>
							</InfoBoxContent>
						</InfoBox>
					</Section>

					<Section>
						<SectionTitle>
							<FiArrowRight />
							Next Steps
						</SectionTitle>

						<Paragraph>
							Now that you understand scope best practices, consider these next steps for your OAuth
							2.0 implementation:
						</Paragraph>

						<List>
							<ListItem>
								<strong>Implement Claims Best Practices:</strong> Learn how to use claims for
								detailed API authorization alongside scopes.
							</ListItem>
							<ListItem>
								<strong>Review Your Current Scopes:</strong> Audit existing scope implementations
								against these best practices.
							</ListItem>
							<ListItem>
								<strong>Plan Token Exchange:</strong> Design token exchange flows for multi-API
								scenarios.
							</ListItem>
							<ListItem>
								<strong>Configure Scope Time-to-Live:</strong> Set appropriate expiration times for
								high-privilege scopes.
							</ListItem>
							<ListItem>
								<strong>Test Scope Enforcement:</strong> Ensure all API endpoints properly validate
								and enforce scope requirements.
							</ListItem>
						</List>

						<InfoBox type="info">
							<InfoBoxContent>
								<InfoBoxIcon type="info">
									<FiBookOpen />
								</InfoBoxIcon>
								<InfoBoxText>
									<InfoBoxTitle>Additional Resources</InfoBoxTitle>
									<InfoBoxDescription>
										For more detailed information on OAuth 2.0 and OpenID Connect implementation,
										explore the other documentation pages in this playground, including OIDC Specs,
										Security Best Practices, and OIDC for AI applications.
									</InfoBoxDescription>
								</InfoBoxText>
							</InfoBoxContent>
						</InfoBox>
					</Section>
				</Content>
			</ContentWrapper>
		</PageContainer>
	);
};

export default ScopesBestPractices;
