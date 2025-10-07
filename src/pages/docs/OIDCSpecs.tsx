import { FiBookOpen, FiCode, FiExternalLink, FiShield, FiUsers } from 'react-icons/fi';
import styled from 'styled-components';
import PageTitle from '../../components/PageTitle';
import { SpecCard } from '../../components/SpecCard';
import { FlowHeader } from '../../services/flowHeaderService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { PageLayoutService } from '../../services/pageLayoutService';
import { FlowUIService } from '../../services/flowUIService';

const DocsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Section = styled.section`
  margin-bottom: 3rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.gray800};
    
    svg {
      margin-right: 0.75rem;
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const LinkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ExternalLink = styled.a`
  display: block;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary}40;
  }
  
  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.primary};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 0;
  }
`;

const OIDCSpecs = () => {
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'oidc-specs',
	};
	const { PageContainer, ContentWrapper, FlowHeader: LayoutFlowHeader } =
		PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}

			<CollapsibleHeader
				title="Core Specifications"
				subtitle="Essential OAuth 2.0 and OpenID Connect specifications"
				icon={<FiShield />}
				defaultCollapsed={false}
			>
				<LinkGrid>
					<ExternalLink
						href="https://openid.net/specs/openid-connect-core-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							OpenID Connect Core 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>
							The core OpenID Connect specification that defines how to authenticate users using
							OAuth 2.0.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/specs/openid-connect-discovery-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							OpenID Connect Discovery 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>Defines how clients can dynamically discover information about OpenID Providers.</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/specs/openid-connect-session-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							OpenID Connect Session Management 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>Defines how to manage OpenID Connect sessions, including logout functionality.</p>
					</ExternalLink>
				</LinkGrid>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Authentication & Authorization"
				subtitle="Authentication and authorization specifications for OAuth 2.0 and OpenID Connect"
				icon={<FiCode />}
				defaultCollapsed={false}
			>
				<LinkGrid>
					<ExternalLink
						href="https://openid.net/specs/openid-connect-basic-client-implemented-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Basic Client Implemented 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>
							Defines a simple profile for OpenID Connect relying parties using the Authorization
							Code flow.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/specs/openid-connect-implicit-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Implicit Client Implemented 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>
							Defines a profile for OpenID Connect relying parties using the Implicit flow
							(deprecated).
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/specs/openid-connect-messages-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Messages 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>
							Defines the messages used in OpenID Connect, including request and response formats.
						</p>
					</ExternalLink>
				</LinkGrid>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="User Information & Identity"
				subtitle="User information and identity management specifications"
				icon={<FiUsers />}
				defaultCollapsed={false}
			>
				<LinkGrid>
					<ExternalLink
						href="https://openid.net/specs/openid-connect-registration-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Dynamic Client Registration 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>
							Defines how OpenID Connect clients can register with OpenID Providers dynamically.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/specs/openid-connect-federation-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Federation 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>
							Defines how to establish trust between OpenID Providers and Relying Parties in
							federated environments.
						</p>
					</ExternalLink>

					<ExternalLink
						href="https://openid.net/specs/openid-connect-4-identity-assurance-1_0.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						<h3>
							Identity Assurance 1.0
							<FiExternalLink size={16} />
						</h3>
						<p>Defines extensions for identity assurance and verification in OpenID Connect.</p>
					</ExternalLink>
				</LinkGrid>
			</CollapsibleHeader>

			<CollapsibleHeader
				title="Security & Best Practices"
				subtitle="Security considerations and best practices for OpenID Connect implementation"
				icon={<FiShield />}
				defaultCollapsed={false}
			>
				<SpecCard title="Security Considerations">
					<p>When implementing OpenID Connect, consider these security best practices:</p>
					<ul>
						<li>Always use HTTPS for all communications</li>
						<li>Validate ID tokens properly, including signature verification</li>
						<li>Use PKCE (Proof Key for Code Exchange) for public clients</li>
						<li>Implement proper state parameter validation</li>
						<li>Use secure token storage mechanisms</li>
						<li>Implement proper session management and logout</li>
					</ul>
				</SpecCard>
			</CollapsibleHeader>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OIDCSpecs;
