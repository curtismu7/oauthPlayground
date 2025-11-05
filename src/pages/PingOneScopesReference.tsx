// src/pages/PingOneScopesReference.tsx
// Educational reference page for PingOne OAuth 2.0 and OIDC scopes

import React from 'react';
import styled from 'styled-components';
import { FiBook, FiLock, FiUser, FiMail, FiPhone, FiMapPin, FiRefreshCw, FiDatabase, FiShield, FiCheck, FiInfo } from 'react-icons/fi';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 2rem;
`;

const HeaderCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 2rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.04));
	border: 1px solid rgba(99, 102, 241, 0.2);
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #4f46e5;
`;

const Title = styled.h1`
	margin: 0;
	font-size: 2rem;
	font-weight: 700;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #4338ca;
	line-height: 1.6;
	font-size: 1rem;
`;

const ContentGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 2rem;
`;

const ScopeCategory = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 4px 20px -4px rgba(15, 23, 42, 0.12);
	overflow: hidden;
`;

const CategoryHeader = styled.div`
	padding: 1.5rem;
	background: linear-gradient(135deg, #f8fafc, #f1f5f9);
	border-bottom: 2px solid #e2e8f0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CategoryTitle = styled.h2`
	margin: 0;
	font-size: 1.3rem;
	font-weight: 600;
	color: #0f172a;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CategoryDescription = styled.p`
	margin: 0.5rem 0 0 0;
	color: #64748b;
	font-size: 0.95rem;
`;

const ScopeList = styled.div`
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const ScopeItem = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.75rem;
	border-left: 4px solid ${props => props.color || '#3b82f6'};
`;

const ScopeIcon = styled.div`
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border-radius: 0.5rem;
	background: ${props => props.color || '#3b82f6'}22;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.color || '#3b82f6'};
`;

const ScopeDetails = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const ScopeName = styled.div`
	font-family: 'Courier New', monospace;
	font-size: 1rem;
	font-weight: 700;
	color: #0f172a;
	background: #e0e7ff;
	padding: 0.25rem 0.75rem;
	border-radius: 0.375rem;
	display: inline-block;
	width: fit-content;
`;

const ScopeDescription = styled.p`
	margin: 0;
	color: #475569;
	font-size: 0.95rem;
	line-height: 1.5;
`;

const ScopeClaims = styled.div`
	margin-top: 0.5rem;
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const ClaimBadge = styled.span`
	font-size: 0.8rem;
	padding: 0.25rem 0.6rem;
	background: #dbeafe;
	color: #1e40af;
	border-radius: 999px;
	font-weight: 500;
	font-family: 'Courier New', monospace;
`;

const InfoBox = styled.div`
	padding: 1.25rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.75rem;
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	color: #2563eb;
`;

const InfoText = styled.div`
	flex: 1;
	color: #1e40af;
	font-size: 0.95rem;
	line-height: 1.6;
	
	strong {
		font-weight: 600;
	}
	
	code {
		background: #dbeafe;
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}
`;

const PingOneScopesReference: React.FC = () => {
	return (
		<PageContainer>
			<HeaderCard>
				<TitleRow>
					<FiBook size={32} />
					<Title>PingOne OAuth 2.0 & OIDC Scopes Reference</Title>
				</TitleRow>
				<Subtitle>
					A guide to understanding and using the most common scopes in PingOne SSO and Management API. 
					Scopes control what data and permissions an application receives when authenticating.
				</Subtitle>
				<InfoBox style={{ margin: '1rem 0 0 0', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
					<InfoIcon><FiInfo size={20} style={{ color: '#2563eb' }} /></InfoIcon>
					<InfoText style={{ color: '#1e40af' }}>
						<strong>📖 Complete Scope Documentation:</strong> For the full list of all PingOne Management API scopes and detailed permissions, 
						see the official <a href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#pingone-role-permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
						PingOne Platform API Reference</a>.
					</InfoText>
				</InfoBox>
			</HeaderCard>

			<InfoBox>
				<InfoIcon>
					<FiShield size={24} />
				</InfoIcon>
				<InfoText>
					<strong>What are scopes?</strong> Scopes are permissions that an application requests during authentication. 
					They determine what user data the application can access and what actions it can perform. 
					The user (or admin) must consent to granting these scopes to the application. Always follow the 
					<strong> principle of least privilege</strong> - only request the scopes your application actually needs.
				</InfoText>
			</InfoBox>

			<ContentGrid>
				{/* Standard OIDC Scopes */}
				<ScopeCategory>
					<CategoryHeader>
						<CategoryTitle>
							<FiLock size={24} style={{ color: '#6366f1' }} />
							Standard OpenID Connect (OIDC) Scopes
						</CategoryTitle>
					</CategoryHeader>
					<CategoryDescription style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
						These are standardized scopes defined by the OpenID Connect specification. They are supported by PingOne and most other OIDC providers.
					</CategoryDescription>
					<ScopeList>
						<ScopeItem color="#6366f1">
							<ScopeIcon color="#6366f1">
								<FiCheck size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>openid</ScopeName>
								<ScopeDescription>
									<strong>Required for OIDC authentication.</strong> Indicates that the application wants to use OIDC for authentication. 
									When included, PingOne will return an ID token containing the user's unique identifier.
								</ScopeDescription>
								<ScopeClaims>
									<ClaimBadge>sub</ClaimBadge>
									<ClaimBadge>iss</ClaimBadge>
									<ClaimBadge>aud</ClaimBadge>
									<ClaimBadge>exp</ClaimBadge>
									<ClaimBadge>iat</ClaimBadge>
								</ScopeClaims>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#8b5cf6">
							<ScopeIcon color="#8b5cf6">
								<FiUser size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>profile</ScopeName>
								<ScopeDescription>
									Grants access to the user's basic profile information such as name, username, nickname, picture, and other non-sensitive identity data.
								</ScopeDescription>
								<ScopeClaims>
									<ClaimBadge>name</ClaimBadge>
									<ClaimBadge>given_name</ClaimBadge>
									<ClaimBadge>family_name</ClaimBadge>
									<ClaimBadge>middle_name</ClaimBadge>
									<ClaimBadge>nickname</ClaimBadge>
									<ClaimBadge>preferred_username</ClaimBadge>
									<ClaimBadge>picture</ClaimBadge>
									<ClaimBadge>updated_at</ClaimBadge>
								</ScopeClaims>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#ec4899">
							<ScopeIcon color="#ec4899">
								<FiMail size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>email</ScopeName>
								<ScopeDescription>
									Provides access to the user's email address and whether the email has been verified by PingOne.
								</ScopeDescription>
								<ScopeClaims>
									<ClaimBadge>email</ClaimBadge>
									<ClaimBadge>email_verified</ClaimBadge>
								</ScopeClaims>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#f59e0b">
							<ScopeIcon color="#f59e0b">
								<FiMapPin size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>address</ScopeName>
								<ScopeDescription>
									Grants access to the user's postal address information including street, city, state, postal code, and country.
								</ScopeDescription>
								<ScopeClaims>
									<ClaimBadge>address.formatted</ClaimBadge>
									<ClaimBadge>address.street_address</ClaimBadge>
									<ClaimBadge>address.locality</ClaimBadge>
									<ClaimBadge>address.region</ClaimBadge>
									<ClaimBadge>address.postal_code</ClaimBadge>
									<ClaimBadge>address.country</ClaimBadge>
								</ScopeClaims>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#10b981">
							<ScopeIcon color="#10b981">
								<FiPhone size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>phone</ScopeName>
								<ScopeDescription>
									Provides access to the user's phone number and whether the phone number has been verified.
								</ScopeDescription>
								<ScopeClaims>
									<ClaimBadge>phone_number</ClaimBadge>
									<ClaimBadge>phone_number_verified</ClaimBadge>
								</ScopeClaims>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#06b6d4">
							<ScopeIcon color="#06b6d4">
								<FiRefreshCw size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>offline_access</ScopeName>
								<ScopeDescription>
									<strong>Enables refresh tokens.</strong> Allows the application to obtain refresh tokens, which can be used to get new access tokens 
									without requiring the user to re-authenticate. Useful for long-running applications or background processes.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>
					</ScopeList>
				</ScopeCategory>

				{/* PingOne Management API Scopes */}
				<ScopeCategory>
					<CategoryHeader>
						<CategoryTitle>
							<FiDatabase size={24} style={{ color: '#3b82f6' }} />
							Common PingOne Management API Scopes
						</CategoryTitle>
					</CategoryHeader>
					<CategoryDescription style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
						These are the <strong>most commonly used</strong> scopes for worker applications (machine-to-machine). 
						All PingOne Management API scopes use <strong>plural</strong> forms (e.g., <code>p1:read:users</code> not <code>p1:read:user</code>).
						<br /><br />
						<strong>📚 See the <a href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#pingone-role-permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
						official PingOne API documentation</a> for the complete list of all available scopes.</strong>
					</CategoryDescription>
					<ScopeList>
						<ScopeItem color="#3b82f6">
							<ScopeIcon color="#3b82f6">
								<FiUser size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:users</ScopeName>
								<ScopeDescription>
									Read user directory data (profiles, attributes, identity information).
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#3b82f6">
							<ScopeIcon color="#3b82f6">
								<FiUser size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:update:users</ScopeName>
								<ScopeDescription>
									Create, update, or delete user accounts and attributes.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#10b981">
							<ScopeIcon color="#10b981">
								<FiDatabase size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:environments</ScopeName>
								<ScopeDescription>
									Read environment metadata, configuration, and settings.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#8b5cf6">
							<ScopeIcon color="#8b5cf6">
								<FiDatabase size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:applications</ScopeName>
								<ScopeDescription>
									Read application configurations, OAuth settings, and registered applications.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#f59e0b">
							<ScopeIcon color="#f59e0b">
								<FiDatabase size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:populations</ScopeName>
								<ScopeDescription>
									Read population definitions and user group assignments.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#14b8a6">
							<ScopeIcon color="#14b8a6">
								<FiDatabase size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:groups</ScopeName>
								<ScopeDescription>
									Read group information and memberships.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#6366f1">
							<ScopeIcon color="#6366f1">
								<FiShield size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:roles</ScopeName>
								<ScopeDescription>
									Read role assignments and permissions.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>

						<ScopeItem color="#f43f5e">
							<ScopeIcon color="#f43f5e">
								<FiDatabase size={20} />
							</ScopeIcon>
							<ScopeDetails>
								<ScopeName>p1:read:audit</ScopeName>
								<ScopeDescription>
									Read audit events and activity logs for compliance and monitoring.
								</ScopeDescription>
							</ScopeDetails>
						</ScopeItem>
					</ScopeList>
				</ScopeCategory>

				{/* How to Configure Scopes in PingOne */}
				<ScopeCategory>
					<CategoryHeader>
						<CategoryTitle>
							<FiShield size={24} style={{ color: '#8b5cf6' }} />
							How to Configure Scopes & Permissions in PingOne
						</CategoryTitle>
					</CategoryHeader>
					<CategoryDescription style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
						Understanding how to configure applications, assign roles, and manage scope access in PingOne Admin Console.
					</CategoryDescription>
					<ScopeList>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
							<div>
								<h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
									🔑 For Worker Apps (Machine-to-Machine)
								</h3>
								<InfoBox style={{ margin: '0 0 1rem 0' }}>
									<InfoIcon><FiDatabase size={20} /></InfoIcon>
									<InfoText>
										<strong>Important:</strong> Worker apps access PingOne Management APIs using <code>p1:*</code> scopes. 
										However, requesting a scope is NOT enough - the application must also have the appropriate <strong>roles</strong> assigned.
									</InfoText>
								</InfoBox>
								
								<div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', marginBottom: '1rem' }}>
									<strong style={{ display: 'block', marginBottom: '0.75rem', color: '#0f172a' }}>Step-by-Step: Assigning Roles to Worker Apps</strong>
									<ol style={{ margin: '0', paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8' }}>
										<li><strong>PingOne Admin Console</strong> → Navigate to your environment</li>
										<li><strong>Applications</strong> → Select your Worker App</li>
										<li>Click the <strong>"Roles"</strong> tab</li>
										<li>Click <strong>"Grant Roles"</strong> button</li>
										<li>🚨 <strong style={{ color: '#dc2626' }}>CRITICAL:</strong> Select <strong>"Environment"</strong> from the level dropdown (NOT "Organization")</li>
										<li>Select the environment you want the app to access</li>
										<li>Choose the appropriate role(s):
											<ul style={{ marginTop: '0.5rem', marginLeft: '1rem', listStyleType: 'circle' }}>
												<li><strong>Identity Data Admin</strong> - Full CRUD access to users, groups, populations</li>
												<li><strong>Identity Data Read Only</strong> - Read-only access to identity data</li>
												<li><strong>Environment Admin</strong> - Full admin access including metrics and configuration</li>
												<li><strong>Application Admin</strong> - Manage applications and their configurations</li>
											</ul>
										</li>
										<li>Click <strong>"Save"</strong></li>
										<li>Wait 30-60 seconds for role assignment to propagate</li>
										<li>Generate a new worker token - it will now have the granted scopes</li>
									</ol>
								</div>

								<div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', marginBottom: '1rem' }}>
									<strong style={{ display: 'block', marginBottom: '0.5rem', color: '#991b1b' }}>⚠️ Common Mistake</strong>
									<p style={{ margin: '0', color: '#7f1d1d', fontSize: '0.95rem', lineHeight: '1.6' }}>
										Assigning roles at the <strong>Organization</strong> level will NOT grant access to <code>p1:read:users</code>, 
										<code>p1:read:environments</code>, or <code>p1:read:audit</code> scopes. You MUST assign roles at 
										the <strong>Environment</strong> level for these scopes to work.
									</p>
								</div>

								<InfoBox style={{ margin: 0 }}>
									<InfoIcon><FiCheck size={20} /></InfoIcon>
									<InfoText>
										<strong>Verification:</strong> After generating a token, decode it at <a href="https://jwt.io" target="_blank" rel="noopener noreferrer">jwt.io</a>. 
										The <code>scope</code> claim will show which scopes were actually granted by PingOne (not just requested).
									</InfoText>
								</InfoBox>
							</div>

							<div>
								<h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
									🎯 For User-Facing Apps (OIDC SSO)
								</h3>
								
								<div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', marginBottom: '1rem' }}>
									<strong style={{ display: 'block', marginBottom: '0.75rem', color: '#0f172a' }}>Step-by-Step: Configuring OIDC Scopes</strong>
									<ol style={{ margin: '0', paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8' }}>
										<li><strong>PingOne Admin Console</strong> → Navigate to your environment</li>
										<li><strong>Applications</strong> → Select your OIDC Application (Web, Single Page, or Native)</li>
										<li>Click the <strong>"Resources"</strong> tab</li>
										<li>You'll see <strong>"PingOne platform"</strong> resource - this provides standard OIDC scopes</li>
										<li>By default, <code>openid</code>, <code>profile</code>, <code>email</code>, <code>phone</code>, <code>address</code> are available</li>
										<li>Enable <code>offline_access</code> if you need refresh tokens</li>
										<li>Click <strong>"Save"</strong></li>
									</ol>
								</div>
							</div>

							<div>
								<h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
									🛠️ Creating Custom Resources & Scopes
								</h3>
								<InfoBox style={{ margin: '0 0 1rem 0' }}>
									<InfoIcon><FiDatabase size={20} /></InfoIcon>
									<InfoText>
										<strong>What are Resources?</strong> Resources represent APIs or services that you want to protect with PingOne. 
										Each resource can have custom scopes that define granular permissions for accessing that API.
									</InfoText>
								</InfoBox>
								
								<div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', marginBottom: '1rem' }}>
									<strong style={{ display: 'block', marginBottom: '0.75rem', color: '#0f172a' }}>Step-by-Step: Creating a Custom Resource</strong>
									<ol style={{ margin: '0', paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8' }}>
										<li><strong>PingOne Admin Console</strong> → Navigate to your environment</li>
										<li><strong>Resources</strong> (in left sidebar)</li>
										<li>Click <strong>"+ Add Resource"</strong></li>
										<li>Choose <strong>"Custom"</strong></li>
										<li>Enter:
											<ul style={{ marginTop: '0.5rem', marginLeft: '1rem', listStyleType: 'circle' }}>
												<li><strong>Resource Name:</strong> e.g., "My API"</li>
												<li><strong>Audience (Base URL):</strong> e.g., "https://api.mycompany.com"</li>
												<li><strong>Description:</strong> What this resource represents</li>
											</ul>
										</li>
										<li>Click <strong>"Save"</strong></li>
										<li>Now click <strong>"Scopes"</strong> tab within your new resource</li>
										<li>Click <strong>"+ Add Scope"</strong></li>
										<li>Define custom scopes:
											<ul style={{ marginTop: '0.5rem', marginLeft: '1rem', listStyleType: 'circle' }}>
												<li><strong>Scope Name:</strong> e.g., <code>read:orders</code>, <code>write:orders</code></li>
												<li><strong>Description:</strong> What this scope allows</li>
											</ul>
										</li>
										<li>Click <strong>"Save"</strong></li>
									</ol>
								</div>

								<div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>
									<strong style={{ display: 'block', marginBottom: '0.75rem', color: '#0f172a' }}>Step-by-Step: Granting Resource Access to Applications</strong>
									<ol style={{ margin: '0', paddingLeft: '1.25rem', color: '#475569', lineHeight: '1.8' }}>
										<li><strong>Applications</strong> → Select your application</li>
										<li>Click the <strong>"Resources"</strong> tab</li>
										<li>Click <strong>"Add Resources"</strong></li>
										<li>Find and select your custom resource</li>
										<li>Check the scopes you want to grant to this application</li>
										<li>Click <strong>"Save"</strong></li>
										<li>The application can now request these scopes when getting tokens</li>
									</ol>
								</div>
							</div>

							<InfoBox style={{ margin: '1rem 0 0 0', background: '#fff7ed', border: '1px solid #fed7aa' }}>
								<InfoIcon><FiShield size={20} style={{ color: '#c2410c' }} /></InfoIcon>
								<InfoText style={{ color: '#9a3412' }}>
									<strong>Security Best Practice:</strong> Only grant scopes that an application actually needs. 
									Review and audit scope assignments regularly. Use custom resources and fine-grained scopes to implement 
									the principle of least privilege in your API ecosystem.
								</InfoText>
							</InfoBox>
						</div>
					</ScopeList>
				</ScopeCategory>

				{/* Best Practices */}
				<ScopeCategory>
					<CategoryHeader>
						<CategoryTitle>
							<FiShield size={24} style={{ color: '#10b981' }} />
							Best Practices
						</CategoryTitle>
					</CategoryHeader>
					<ScopeList>
						<InfoBox style={{ margin: 0 }}>
							<InfoIcon>
								<FiCheck size={20} />
							</InfoIcon>
							<InfoText>
								<strong>1. Principle of Least Privilege:</strong> Only request scopes that your application actually needs. 
								Don't request <code>profile</code> if you only need <code>email</code>.
							</InfoText>
						</InfoBox>

						<InfoBox style={{ margin: 0 }}>
							<InfoIcon>
								<FiCheck size={20} />
							</InfoIcon>
							<InfoText>
								<strong>2. Always Include openid:</strong> For SSO/authentication flows, always include the <code>openid</code> scope. 
								Without it, you'll only get an OAuth access token, not an OIDC ID token.
							</InfoText>
						</InfoBox>

						<InfoBox style={{ margin: 0 }}>
							<InfoIcon>
								<FiCheck size={20} />
							</InfoIcon>
							<InfoText>
								<strong>3. Worker Apps vs User Apps:</strong> Management API scopes (<code>p1:*</code>) are typically for 
								worker applications (machine-to-machine). User-facing apps should use standard OIDC scopes.
							</InfoText>
						</InfoBox>

						<InfoBox style={{ margin: 0 }}>
							<InfoIcon>
								<FiCheck size={20} />
							</InfoIcon>
							<InfoText>
								<strong>4. Scope ≠ Permission:</strong> Just because an app <em>requests</em> a scope doesn't mean it will be <em>granted</em>. 
								Worker apps must have the appropriate <strong>roles</strong> assigned in PingOne Admin Console.
							</InfoText>
						</InfoBox>

						<InfoBox style={{ margin: 0 }}>
							<InfoIcon>
								<FiCheck size={20} />
							</InfoIcon>
							<InfoText>
								<strong>5. Dynamic Consent:</strong> Users should be shown what scopes are being requested and what data will be shared. 
								Transparent consent builds trust.
							</InfoText>
						</InfoBox>
					</ScopeList>
				</ScopeCategory>
			</ContentGrid>
		</PageContainer>
	);
};

export default PingOneScopesReference;

