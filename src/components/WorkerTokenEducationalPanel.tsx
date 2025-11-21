// src/components/WorkerTokenEducationalPanel.tsx
import React from 'react';
import styled from 'styled-components';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiKey,
	FiShield,
	FiXCircle,
} from '../services/commonImportsService';

/**
 * Props for WorkerTokenEducationalPanel component
 */
export interface WorkerTokenEducationalPanelProps {
	/** Display variant - full shows all sections, compact shows condensed version */
	variant?: 'full' | 'compact';
	/** Show authorization model section (PingOne Roles vs OAuth Scopes) */
	showAuthorizationModel?: boolean;
	/** Show token types section (what's included/excluded) */
	showTokenTypes?: boolean;
	/** Show use cases section (appropriate vs inappropriate uses) */
	showUseCases?: boolean;
	/** Additional CSS class name */
	className?: string;
}

const PanelContainer = styled.div`
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 24px;
	border-radius: 12px;
	margin: 24px 0;
	box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
`;

const PanelTitle = styled.h3`
	margin: 0 0 16px 0;
	font-size: 1.2rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const PanelContent = styled.div`
	font-size: 0.95rem;
	line-height: 1.6;
`;

const PanelParagraph = styled.p`
	margin: 0 0 12px 0;
`;

const SectionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
	margin-top: 16px;
`;

const Section = styled.div`
	/* Individual section styling */
`;

const SectionTitle = styled.strong`
	display: block;
	margin-bottom: 8px;
`;

const List = styled.ul`
	margin: 8px 0 0 0;
	padding-left: 20px;
	list-style: none;
`;

const ListItem = styled.li`
	margin-bottom: 4px;
	display: flex;
	align-items: flex-start;
	gap: 8px;
	
	svg {
		flex-shrink: 0;
		margin-top: 2px;
	}
`;

const CalloutBox = styled.div`
	background: rgba(255, 255, 255, 0.1);
	padding: 12px;
	border-radius: 8px;
	margin-top: 16px;
	border: 1px solid rgba(255, 255, 255, 0.2);
`;

/**
 * WorkerTokenEducationalPanel Component
 *
 * Displays educational content about PingOne Worker Tokens, including:
 * - What worker tokens are and their purpose
 * - Authorization model (PingOne Roles vs OAuth Scopes)
 * - Token types (what's included/excluded)
 * - Appropriate use cases
 *
 * @example
 * ```tsx
 * <WorkerTokenEducationalPanel
 *   variant="full"
 *   showAuthorizationModel={true}
 *   showTokenTypes={true}
 *   showUseCases={true}
 * />
 * ```
 */
const WorkerTokenEducationalPanel: React.FC<WorkerTokenEducationalPanelProps> = ({
	variant = 'full',
	showAuthorizationModel = true,
	showTokenTypes = true,
	showUseCases = true,
	className,
}) => {
	const isFullVariant = variant === 'full';
	const shouldShowTokenTypes = showTokenTypes && isFullVariant;
	const shouldShowAuthorizationModel =
		showAuthorizationModel && (isFullVariant || variant === 'compact');
	const shouldShowUseCases = showUseCases && isFullVariant;

	return (
		<PanelContainer className={className}>
			<PanelTitle>🔑 About Worker Tokens</PanelTitle>

			<PanelContent>
				{/* Overview Section */}
				<PanelParagraph>
					<strong>
						Worker tokens are special access tokens for PingOne Management API operations.
					</strong>{' '}
					They use the OAuth 2.0 Client Credentials flow and are designed for server-to-server
					authentication.
				</PanelParagraph>

				{/* Token Types Section */}
				{shouldShowTokenTypes && (
					<SectionGrid>
						<Section>
							<SectionTitle>✅ What you get:</SectionTitle>
							<List>
								<ListItem>
									<FiCheckCircle size={16} />
									<span>Access token for Management API calls</span>
								</ListItem>
								<ListItem>
									<FiCheckCircle size={16} />
									<span>No user interaction required</span>
								</ListItem>
								<ListItem>
									<FiCheckCircle size={16} />
									<span>Suitable for backend services</span>
								</ListItem>
							</List>
						</Section>

						<Section>
							<SectionTitle>❌ What you don't get:</SectionTitle>
							<List>
								<ListItem>
									<FiXCircle size={16} />
									<span>No ID token (no user identity)</span>
								</ListItem>
								<ListItem>
									<FiXCircle size={16} />
									<span>No refresh token (use client credentials again)</span>
								</ListItem>
								<ListItem>
									<FiXCircle size={16} />
									<span>No user-specific permissions</span>
								</ListItem>
							</List>
						</Section>
					</SectionGrid>
				)}

				{/* Authorization Model Section */}
				{shouldShowAuthorizationModel && (
					<CalloutBox>
						<SectionTitle>🔐 Authorization:</SectionTitle>
						<span>
							Worker tokens don't use scopes for permissions. Instead, they use{' '}
							<strong>PingOne Roles</strong> assigned to the application. Configure roles in the
							PingOne Admin Console under your application's settings.
						</span>
					</CalloutBox>
				)}

				{/* Use Cases Section */}
				{shouldShowUseCases && (
					<SectionGrid style={{ marginTop: '16px' }}>
						<Section>
							<SectionTitle>🛠️ Ideal for:</SectionTitle>
							<List>
								<ListItem>
									<FiKey size={16} />
									<span>Automation that manages PingOne users, groups, or MFA devices</span>
								</ListItem>
								<ListItem>
									<FiShield size={16} />
									<span>
										Secure server-side jobs that must enforce PingOne administrative policies
									</span>
								</ListItem>
								<ListItem>
									<FiCheckCircle size={16} />
									<span>
										Integration services that need reliable, scoped access without user prompts
									</span>
								</ListItem>
							</List>
						</Section>

						<Section>
							<SectionTitle>⚠️ Avoid using for:</SectionTitle>
							<List>
								<ListItem>
									<FiAlertCircle size={16} />
									<span>
										Client-side or mobile apps (client secrets must never ship to the browser)
									</span>
								</ListItem>
								<ListItem>
									<FiXCircle size={16} />
									<span>
										User impersonation flows—worker tokens can't act on behalf of a person
									</span>
								</ListItem>
								<ListItem>
									<FiAlertCircle size={16} />
									<span>
										Long-lived sessions—rotate tokens regularly instead of storing them indefinitely
									</span>
								</ListItem>
							</List>
						</Section>
					</SectionGrid>
				)}
			</PanelContent>
		</PanelContainer>
	);
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(WorkerTokenEducationalPanel);
