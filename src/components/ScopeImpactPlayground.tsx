// src/components/ScopeImpactPlayground.tsx
/**
 * Scope Impact Playground
 * Interactive explorer showing how OAuth/OIDC scopes translate to real permissions and APIs
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiChevronRight,
	FiInfo,
	FiServer,
	FiShield,
	FiTarget,
	FiUserCheck,
} from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

type ProviderId = 'pingone' | 'microsoft' | 'google';

interface ScopeDefinition {
	name: string;
	category: 'identity' | 'profile' | 'admin' | 'api' | 'governance';
	description: string;
	riskLevel: 'low' | 'medium' | 'high';
	apiExamples: Array<{
		method: string;
		path: string;
		description: string;
	}>;
	bestPractice: string;
	dependsOn?: string[];
}

interface ProviderConfig {
	id: ProviderId;
	label: string;
	tagline: string;
	scopePrefix?: string;
	scopeLibrary: ScopeDefinition[];
	recommendedBundles: Array<{
		name: string;
		description: string;
		scopes: string[];
	}>;
}

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
	pingone: {
		id: 'pingone',
		label: 'PingOne',
		tagline: 'Identity-first platform with fine-grained governance scopes',
		scopePrefix: 'p1:',
		scopeLibrary: [
			{
				name: 'p1:read:user',
				category: 'identity',
				description: 'Read PingOne user profiles (non-sensitive attributes).',
				riskLevel: 'medium',
				apiExamples: [
					{
						method: 'GET',
						path: '/environments/{envId}/users',
						description: 'List users in the environment.',
					},
					{
						method: 'GET',
						path: '/environments/{envId}/users/{userId}',
						description: 'Retrieve a single user including profile attributes.',
					},
				],
				bestPractice:
					'Pair with population filters or environment roles to restrict who you can see.',
			},
			{
				name: 'p1:update:user',
				category: 'identity',
				description: 'Update user attributes and password states.',
				riskLevel: 'high',
				apiExamples: [
					{
						method: 'PATCH',
						path: '/environments/{envId}/users/{userId}',
						description: 'Modify identity attributes or lifecycle state.',
					},
				],
				bestPractice:
					'Require just-in-time elevation. Use dedicated worker apps with audit logging.',
				dependsOn: ['p1:read:user'],
			},
			{
				name: 'p1:read:device',
				category: 'profile',
				description: 'Read MFA device registrations for users.',
				riskLevel: 'medium',
				apiExamples: [
					{
						method: 'GET',
						path: '/environments/{envId}/users/{userId}/devices',
						description: 'List a user’s registered MFA devices.',
					},
				],
				bestPractice: 'Limit to support tooling; never expose directly to end-user browsers.',
				dependsOn: ['p1:read:user'],
			},
			{
				name: 'p1:update:device',
				category: 'profile',
				description: 'Enroll, remove, or reset MFA devices.',
				riskLevel: 'high',
				apiExamples: [
					{
						method: 'POST',
						path: '/environments/{envId}/users/{userId}/devices',
						description: 'Create new device registration (MFA enrollment).',
					},
					{
						method: 'DELETE',
						path: '/environments/{envId}/users/{userId}/devices/{deviceId}',
						description: 'Remove an existing MFA device.',
					},
				],
				bestPractice: 'Add workflow approvals (PingOne DaVinci) before destructive operations.',
				dependsOn: ['p1:read:user', 'p1:read:device'],
			},
			{
				name: 'p1:read:population',
				category: 'governance',
				description: 'Read user population metadata for tenancy segmentation.',
				riskLevel: 'low',
				apiExamples: [
					{
						method: 'GET',
						path: '/environments/{envId}/populations',
						description: 'List populations and their policies.',
					},
				],
				bestPractice: 'Combine with scoped worker tokens per population to isolate automation.',
			},
			{
				name: 'p1:read:role',
				category: 'governance',
				description: 'Inspect administrative role assignments.',
				riskLevel: 'medium',
				apiExamples: [
					{
						method: 'GET',
						path: '/environments/{envId}/roles',
						description: 'List defined admin roles within the tenant.',
					},
					{
						method: 'GET',
						path: '/environments/{envId}/roleAssignments',
						description: 'View which identities hold elevated access.',
					},
				],
				bestPractice: 'Schedule periodic entitlement reviews; export assignments to GRC.',
			},
			{
				name: 'offline_access',
				category: 'identity',
				description: 'Request refresh tokens so the client can operate when the user is offline.',
				riskLevel: 'high',
				apiExamples: [
					{
						method: 'POST',
						path: '/oauth2/v1/token',
						description:
							'Token response includes a refresh_token when `offline_access` is granted.',
					},
				],
				bestPractice:
					'Treat refresh tokens as secrets. Store encrypted and rotate on consent changes.',
				dependsOn: [],
			},
		],
		recommendedBundles: [
			{
				name: 'Support Read-Only',
				description: 'Customer support staff investigating user issues without making changes.',
				scopes: ['p1:read:user', 'p1:read:device', 'p1:read:population'],
			},
			{
				name: 'MFA Operations',
				description: 'Automation that onboards or resets MFA devices with approvals in place.',
				scopes: ['p1:read:user', 'p1:read:device', 'p1:update:device'],
			},
			{
				name: 'Identity Lifecycle Admin',
				description: 'Privileged automation performing lifecycle operations with governance.',
				scopes: ['p1:read:user', 'p1:update:user', 'p1:read:population', 'p1:read:role'],
			},
			{
				name: 'Remember Me Session',
				description:
					'Allows background token refresh while the user is away, paired with least privilege data access.',
				scopes: ['p1:read:user', 'p1:read:device', 'p1:update:device', 'offline_access'],
			},
		],
	},
	microsoft: {
		id: 'microsoft',
		label: 'Microsoft Entra ID',
		tagline: 'Graph API scopes for Azure AD / Entra ID integrations',
		scopeLibrary: [
			{
				name: 'User.Read',
				category: 'identity',
				description: 'Read user profile, sign-in name, and basic info.',
				riskLevel: 'low',
				apiExamples: [
					{
						method: 'GET',
						path: '/v1.0/me',
						description: 'Retrieve profile details for signed-in user.',
					},
				],
				bestPractice: 'Default scope for delegated sign-in experiences.',
			},
			{
				name: 'User.ReadWrite.All',
				category: 'admin',
				description: 'Create, read, update, and delete any user without admin consent limits.',
				riskLevel: 'high',
				apiExamples: [
					{
						method: 'PATCH',
						path: '/v1.0/users/{id}',
						description: 'Update arbitrary attributes on any user.',
					},
				],
				bestPractice: 'Use workload identities with Conditional Access + PIM approval.',
			},
			{
				name: 'Directory.Read.All',
				category: 'governance',
				description: 'Read directory data, including groups and corporate structure.',
				riskLevel: 'medium',
				apiExamples: [
					{
						method: 'GET',
						path: '/v1.0/groups',
						description: 'List AAD groups and memberships.',
					},
				],
				bestPractice: 'Cache responses; monitor throttling from Microsoft Graph.',
			},
			{
				name: 'Mail.Send',
				category: 'api',
				description: 'Send email as any user (delegated) or app (application permission).',
				riskLevel: 'high',
				apiExamples: [
					{
						method: 'POST',
						path: '/v1.0/users/{id}/sendMail',
						description: 'Deliver email on behalf of selected user.',
					},
				],
				bestPractice: 'Restrict to service principals with outbound monitoring.',
			},
		],
		recommendedBundles: [
			{
				name: 'Self-Service Portal',
				description: 'Delegated access for users managing their own profile.',
				scopes: ['User.Read'],
			},
			{
				name: 'IT Helpdesk Automation',
				description: 'Service principal executing reset flows under supervision.',
				scopes: ['User.Read.All', 'Directory.Read.All'],
			},
		],
	},
	google: {
		id: 'google',
		label: 'Google Identity',
		tagline: 'OAuth scopes for Google Workspace & Cloud APIs',
		scopeLibrary: [
			{
				name: 'openid',
				category: 'identity',
				description: 'Enable OpenID Connect for Google Sign-In.',
				riskLevel: 'low',
				apiExamples: [
					{
						method: 'GET',
						path: 'https://openidconnect.googleapis.com/v1/userinfo',
						description: 'Fetch ID token claims via UserInfo endpoint.',
					},
				],
				bestPractice: 'Always pair with `profile` or `email` for usable identity info.',
			},
			{
				name: 'https://www.googleapis.com/auth/admin.directory.user',
				category: 'admin',
				description: 'Create and manage users in Google Workspace.',
				riskLevel: 'high',
				apiExamples: [
					{
						method: 'POST',
						path: '/admin/directory/v1/users',
						description: 'Provision a new Workspace account.',
					},
				],
				bestPractice: 'Require domain-wide delegation with least scope per automation.',
			},
			{
				name: 'https://www.googleapis.com/auth/calendar.readonly',
				category: 'api',
				description: 'Read calendar metadata and events.',
				riskLevel: 'medium',
				apiExamples: [
					{
						method: 'GET',
						path: '/calendar/v3/users/me/calendarList',
						description: 'List calendars available to the authenticated user.',
					},
				],
				bestPractice: 'Use incremental authorization; request write scope only when required.',
			},
			{
				name: 'profile',
				category: 'profile',
				description: 'Access basic profile information for personalization.',
				riskLevel: 'low',
				apiExamples: [
					{
						method: 'GET',
						path: 'https://openidconnect.googleapis.com/v1/userinfo',
						description: 'Return name, picture, and locale.',
					},
				],
				bestPractice: 'Combine with `email` for account linking workflows.',
			},
		],
		recommendedBundles: [
			{
				name: 'Workspace Automation',
				description: 'Admin automation for lifecycle management.',
				scopes: [
					'https://www.googleapis.com/auth/admin.directory.user',
					'https://www.googleapis.com/auth/admin.directory.group.readonly',
				],
			},
			{
				name: 'Calendar Integration',
				description: 'Read-only access for scheduling assistants.',
				scopes: ['openid', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
			},
		],
	},
};

const PlaygroundContainer = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
	border-radius: 1rem;
	padding: 2rem;
	border: 2px solid #2563eb;
	box-shadow: 0 10px 28px rgba(37, 99, 235, 0.15);
`;

const Header = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-bottom: 2rem;
`;

const Title = styled.h2`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #1e3a8a;
	margin: 0;
	font-size: 1.75rem;
`;

const Intro = styled.p`
	color: #1f2937;
	margin: 0;
	line-height: 1.6;
	font-size: 1.05rem;
`;

const ProviderSwitch = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const ProviderButton = styled.button<{ $selected: boolean }>`
	padding: 0.75rem 1.5rem;
	border-radius: 999px;
	border: 2px solid ${({ $selected }) => ($selected ? '#1d4ed8' : '#c7d2fe')};
	background: ${({ $selected }) =>
		$selected ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff'};
	color: ${({ $selected }) => ($selected ? '#ffffff' : '#1e3a8a')};
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: ${({ $selected }) =>
		$selected ? '0 8px 20px rgba(37, 99, 235, 0.25)' : '0 2px 6px rgba(15, 23, 42, 0.08)'};
	transition: all 0.2s;

	&:hover {
		transform: translateY(-2px);
	}
`;

const ContentLayout = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	gap: 1.5rem;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const ScopeLibraryPanel = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.5rem;
	border: 1px solid #dbeafe;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const PanelTitle = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #1d4ed8;
	margin: 0;
	font-size: 1.1rem;
`;

const ScopeChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const ScopeChip = styled.button<{ $selected: boolean; $risk: ScopeDefinition['riskLevel'] }>`
	padding: 0.5rem 1rem;
	border-radius: 999px;
	border: 2px solid
		${({ $selected, $risk }) => {
			if (!$selected) return '#cbd5f5';
			switch ($risk) {
				case 'high':
					return '#ef4444';
				case 'medium':
					return '#f59e0b';
				default:
					return '#10b981';
			}
		}};
	background: ${({ $selected, $risk }) => {
		if (!$selected) return '#ffffff';
		switch ($risk) {
			case 'high':
				return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.25))';
			case 'medium':
				return 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.25))';
			default:
				return 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25))';
		}
	}};
	color: ${({ $selected }) => ($selected ? '#0f172a' : '#1e293b')};
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-2px);
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 2rem 1rem;
	color: #475569;
	border: 2px dashed #cbd5f5;
	border-radius: 0.75rem;
`;

const DetailsPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const RiskSummaryCard = styled.div`
	background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
	border-radius: 0.75rem;
	padding: 1.5rem;
	color: #f1f5f9;
	box-shadow: 0 10px 28px rgba(15, 23, 42, 0.4);
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const SummaryMetrics = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 1rem;
`;

const Metric = styled.div`
	background: rgba(148, 163, 184, 0.2);
	padding: 1rem;
	border-radius: 0.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
`;

const MetricLabel = styled.span`
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: #e2e8f0;
`;

const MetricValue = styled.span`
	font-size: 1.5rem;
	font-weight: 700;
	color: #fbbf24;
`;

const MetricDetail = styled.span`
	font-size: 0.85rem;
	color: #cbd5f5;
`;

const AppliedBundle = styled.div`
	background: #f1f5f9;
	border-radius: 0.75rem;
	padding: 1.5rem;
	border: 1px solid #cbd5f5;
`;

const BundleTitle = styled.div`
	color: #1e3a8a;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
`;

const BundleScopes = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const BundleBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	background: rgba(37, 99, 235, 0.12);
	color: #1d4ed8;
	padding: 0.35rem 0.75rem;
	border-radius: 999px;
	font-weight: 600;
	font-size: 0.85rem;
`;

const ScopeDetailCard = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	border: 1px solid #e2e8f0;
	padding: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const ScopeHeading = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 700;
	color: #1f2937;
	font-size: 1.05rem;
`;

const ScopeDescription = styled.p`
	margin: 0;
	color: #475569;
	line-height: 1.6;
`;

const ApiExampleList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const ApiExampleRow = styled.div`
	display: grid;
	grid-template-columns: 0.8fr 1.2fr;
	gap: 0.75rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	padding: 0.75rem 1rem;
	border-left: 4px solid #2563eb;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const ApiLabel = styled.div`
	color: #1d4ed8;
	font-weight: 600;
	font-size: 0.9rem;
`;

const ApiDescription = styled.div`
	color: #475569;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const BestPractice = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	background: rgba(16, 185, 129, 0.12);
	border-left: 4px solid #10b981;
	padding: 1rem;
	border-radius: 0.5rem;
	color: #047857;
	line-height: 1.5;
`;

const DependencyNotice = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.75rem;
	background: rgba(59, 130, 246, 0.12);
	border-left: 4px solid #2563eb;
	border-radius: 0.5rem;
	color: #1e3a8a;
	font-size: 0.9rem;
`;

const AssistiveHint = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	color: #1e3a8a;
	margin-top: 0.5rem;
`;

const ScopeImpactPlayground: React.FC = () => {
	const [provider, setProvider] = useState<ProviderId>('pingone');
	const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

	const providerConfig = PROVIDERS[provider];

	const toggleScope = useCallback(
		(scope: string) => {
			setSelectedScopes((prev) => {
				if (prev.includes(scope)) {
					return prev.filter((item) => item !== scope);
				}

				const definition = providerConfig.scopeLibrary.find((s) => s.name === scope);
				if (definition?.dependsOn) {
					const missing = definition.dependsOn.filter((dep) => !prev.includes(dep));
					if (missing.length) {
						v4ToastManager.showInfo(`Added required scopes: ${missing.join(', ')} for ${scope}.`);
						return [...prev, ...missing, scope];
					}
				}

				return [...prev, scope];
			});
		},
		[providerConfig.scopeLibrary]
	);

	const scopeDetails = useMemo(
		() =>
			selectedScopes
				.map((scope) => providerConfig.scopeLibrary.find((item) => item.name === scope))
				.filter((item): item is ScopeDefinition => Boolean(item)),
		[providerConfig.scopeLibrary, selectedScopes]
	);

	const riskCounts = useMemo(() => {
		const counts = { low: 0, medium: 0, high: 0 };
		scopeDetails.forEach((scope) => {
			counts[scope.riskLevel] += 1;
		});
		return counts;
	}, [scopeDetails]);

	const highestRisk = useMemo(() => {
		if (!scopeDetails.length) return 'None selected';
		if (riskCounts.high) return 'High – enforce approvals and break-glass monitoring';
		if (riskCounts.medium) return 'Medium – monitor with audit events';
		return 'Low – safe for self-service experiences';
	}, [riskCounts, scopeDetails.length]);

	const recommendedBundle = useMemo(() => {
		if (!scopeDetails.length) return null;
		return providerConfig.recommendedBundles.find((bundle) =>
			bundle.scopes.every((scope) => selectedScopes.includes(scope))
		);
	}, [providerConfig.recommendedBundles, selectedScopes, scopeDetails.length]);

	return (
		<PlaygroundContainer>
			<Header>
				<Title>
					<FiTarget size={28} />
					Scope Impact Playground
				</Title>
				<Intro>
					Choose your identity provider, toggle scopes, and instantly understand the permissions,
					API surface area, and risk posture you are granting. Use this to refine least-privilege
					strategies and scope \"bundles\" before deploying your app.
				</Intro>
			</Header>

			<ProviderSwitch>
				{(Object.values(PROVIDERS) as ProviderConfig[]).map((item) => (
					<ProviderButton
						key={item.id}
						type="button"
						$selected={provider === item.id}
						onClick={() => {
							setProvider(item.id);
							setSelectedScopes([]);
						}}
					>
						<FiShield />
						{item.label}
					</ProviderButton>
				))}
			</ProviderSwitch>

			<AssistiveHint>
				<FiInfo />
				{providerConfig.tagline}
			</AssistiveHint>

			<ContentLayout>
				<ScopeLibraryPanel>
					<PanelTitle>
						<FiUserCheck />
						Scope Library
					</PanelTitle>

					<ScopeChips>
						{providerConfig.scopeLibrary.map((scope) => (
							<ScopeChip
								key={scope.name}
								type="button"
								$selected={selectedScopes.includes(scope.name)}
								$risk={scope.riskLevel}
								onClick={() => toggleScope(scope.name)}
							>
								{scope.name}
							</ScopeChip>
						))}
					</ScopeChips>

					{selectedScopes.length === 0 && (
						<EmptyState>
							No scopes selected yet. Tap scopes to build a bundle and evaluate risk.
						</EmptyState>
					)}
				</ScopeLibraryPanel>

				<DetailsPanel>
					<RiskSummaryCard>
						<ScopeHeading>
							<FiAlertTriangle />
							Risk Summary
						</ScopeHeading>

						<SummaryMetrics>
							<Metric>
								<MetricLabel>Total scopes</MetricLabel>
								<MetricValue>{selectedScopes.length}</MetricValue>
								<MetricDetail>
									{selectedScopes.length
										? 'Review the API matrix to validate least privilege.'
										: 'Add scopes to see risk analysis.'}
								</MetricDetail>
							</Metric>
							<Metric>
								<MetricLabel>High / Medium / Low</MetricLabel>
								<MetricValue>
									{riskCounts.high}/{riskCounts.medium}/{riskCounts.low}
								</MetricValue>
								<MetricDetail>Monitor high-risk scopes with SIEM alerts.</MetricDetail>
							</Metric>
							<Metric>
								<MetricLabel>Risk posture</MetricLabel>
								<MetricValue>{highestRisk}</MetricValue>
							</Metric>
						</SummaryMetrics>
					</RiskSummaryCard>

					{recommendedBundle && (
						<AppliedBundle>
							<BundleTitle>
								<FiChevronRight />
								Bundle Match: {recommendedBundle.name}
							</BundleTitle>
							<p>{recommendedBundle.description}</p>
							<BundleScopes>
								{recommendedBundle.scopes.map((scope) => (
									<BundleBadge key={scope}>
										<FiShield size={14} />
										{scope}
									</BundleBadge>
								))}
							</BundleScopes>
						</AppliedBundle>
					)}

					{scopeDetails.map((scope) => (
						<ScopeDetailCard key={scope.name}>
							<ScopeHeading>
								<FiServer />
								{scope.name}
							</ScopeHeading>
							<ScopeDescription>{scope.description}</ScopeDescription>

							<ApiExampleList>
								{scope.apiExamples.map((api) => (
									<ApiExampleRow key={`${api.method}-${api.path}`}>
										<ApiLabel>
											{api.method} {api.path}
										</ApiLabel>
										<ApiDescription>{api.description}</ApiDescription>
									</ApiExampleRow>
								))}
							</ApiExampleList>

							<BestPractice>
								<FiTarget size={18} />
								<div>{scope.bestPractice}</div>
							</BestPractice>

							{scope.dependsOn?.length ? (
								<DependencyNotice>
									<FiInfo size={18} />
									<div>
										This scope depends on:{' '}
										{scope.dependsOn.map((dep) => (
											<span key={dep}>{dep} </span>
										))}
									</div>
								</DependencyNotice>
							) : null}
						</ScopeDetailCard>
					))}
				</DetailsPanel>
			</ContentLayout>
		</PlaygroundContainer>
	);
};

export default ScopeImpactPlayground;
