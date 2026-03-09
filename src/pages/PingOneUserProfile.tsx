import { FlowHeader } from '../services/flowHeaderService';
// src/pages/PingOneUserProfile.tsx
// PingOne User Profile viewer with worker token management
// Cache bust: 2025-02-17-11:32
// PingOne User Profile Page - Display detailed user information using real PingOne APIs

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { usePageScroll } from '../hooks/usePageScroll';
import PageLayoutService from '../services/pageLayoutService';
import { lookupPingOneUser } from '../services/pingOneUserProfileService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { credentialManager } from '../utils/credentialManager';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { UserSearchDropdownV8 } from '../v8/components/UserSearchDropdownV8';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

interface PingOneConsentRecord {
	id?: string;
	type?: string;
	name?: string;
	status?: string;
	[key: string]: unknown;
}

interface UserDataBundle {
	profile: PingOneUserProfileData;
	groups: PingOneUserGroup[];
	roles: PingOneUserRole[];
	mfa: PingOneMfaStatus;
	resolvedId: string;
	consents: PingOneConsentRecord[];
}

const extractLabel = (
	input: unknown,
	fallback: string | null = 'Not available',
	preferredKeys: string[] = ['name', 'displayName', 'label', 'description', 'type', 'value']
): string | null => {
	if (!input) return fallback;
	if (typeof input === 'string' && input.trim()) {
		return input.trim();
	}
	if (typeof input === 'object') {
		for (const key of preferredKeys) {
			const value = (input as Record<string, unknown>)[key];
			if (typeof value === 'string' && value.trim()) {
				return value.trim();
			}
		}
	}
	return fallback;
};

const extractPopulation = (population: unknown): string => {
	if (!population) return 'N/A';
	if (typeof population === 'string') return population;
	if (typeof population === 'number') return String(population);

	// Try to extract a label from common fields
	const populationName = extractLabel(population, null, [
		'name',
		'displayName',
		'id',
		'title',
		'description',
		'value',
	]);
	if (populationName) return populationName;

	// If it's an object, check for id field (could be string or number)
	if (typeof population === 'object' && population !== null) {
		const popObj = population as Record<string, unknown>;
		if ('id' in popObj && popObj.id !== null && popObj.id !== undefined) {
			return String(popObj.id);
		}
		// Check for nested population object
		if ('population' in popObj) {
			return extractPopulation(popObj.population);
		}
		// Log what we found for debugging
		logger.info('[extractPopulation] Unhandled population structure:', {
			population,
			keys: Object.keys(popObj),
			values: Object.values(popObj).slice(0, 3), // First 3 values for debugging
		});
	}
	return 'N/A';
};

interface PingOneUserProfileData {
	id?: string;
	name?:
		| string
		| { formatted?: string; givenName?: string; familyName?: string; [key: string]: unknown };
	given_name?: string;
	preferred_username?: string;
	username?: string;
	email?: string;
	email_verified?: boolean;
	enabled?: boolean;
	primaryAuthenticationMethod?: string | Record<string, unknown>;
	authenticationMethods?: Array<string | Record<string, unknown>>;
	authoritativeIdentityProfile?: { name?: string } | Record<string, unknown>;
	identityProvider?: { name?: string; type?: string } | Record<string, unknown>;
	createdAt?: string;
	created_at?: string;
	updatedAt?: string;
	updated_at?: string;
	population?: { name?: string } | Record<string, unknown>;
	account?: { status?: string; syncState?: string };
	syncState?: string;
	consents?: Array<{ status?: string; type?: string; name?: string }>;
	[key: string]: unknown;
}

interface PingOneUserGroup {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

interface PingOneUserRole {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

interface PingOneMfaDetails {
	enabled?: boolean;
	status?: string;
	devices?: Array<Record<string, unknown>>;
	[key: string]: unknown;
}

type PingOneMfaStatus = PingOneMfaDetails | null;

import { FiAlertTriangle, FiRefreshCw, FiUser } from '@icons';
import type { CSSProperties } from 'react';

import { logger } from '../utils/logger';
const styles: Record<string, CSSProperties> = {
	pageContainer: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '2rem',
		background: '#f8fafc',
		minHeight: '100vh',
	},
	header: {
		background: 'linear-gradient(135deg, #dc2626 0%, #dc2626 100%)',
		borderRadius: '1rem',
		padding: '2rem',
		marginBottom: '2rem',
		textAlign: 'center',
	},
	headerInner: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '1rem',
	},
	userAvatar: {
		width: '64px',
		height: '64px',
		borderRadius: '50%',
		background: 'white',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: '#dc2626',
		fontSize: '1.5rem',
		fontWeight: 600,
		flexShrink: 0,
	},
	userInfo: {
		flex: 1,
		textAlign: 'left',
	},
	userInfoName: {
		margin: 0,
		fontSize: '1.875rem',
		fontWeight: 700,
		color: 'white',
	},
	userInfoSubtitle: {
		color: 'rgba(255,255,255,0.9)',
		fontSize: '0.875rem',
		marginTop: '0.25rem',
	},
	tokenStatusValid: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		marginTop: '0.5rem',
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: 'rgba(255,255,255,0.9)',
	},
	tokenStatusExpired: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		marginTop: '0.5rem',
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: '#fef3c7',
	},
	tokenStatusMissing: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		marginTop: '0.5rem',
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: '#ef4444',
	},
	compareTable: {
		width: '100%',
		borderCollapse: 'collapse',
		fontSize: '0.875rem',
		marginTop: '1rem',
	},
	compareHeaderCell: {
		textAlign: 'left',
		padding: '0.75rem',
		background: '#f8fafc',
		borderBottom: '1px solid #e5e7eb',
		fontSize: '0.875rem',
		fontWeight: 700,
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		color: '#6b7280',
	},
	compareCell: {
		padding: '0.75rem',
		borderBottom: '1px solid #e5e7eb',
		verticalAlign: 'top',
		color: '#6b7280',
		fontWeight: 500,
	},
	compareCellEmphasize: {
		padding: '0.75rem',
		borderBottom: '1px solid #e5e7eb',
		verticalAlign: 'top',
		color: '#1f2937',
		fontWeight: 600,
	},
	compareBadgeActive: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '9999px',
		fontSize: '0.75rem',
		fontWeight: 600,
		background: '#ecfdf5',
		color: '#10b981',
	},
	compareBadgeInactive: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '9999px',
		fontSize: '0.75rem',
		fontWeight: 600,
		background: '#fef2f2',
		color: '#dc2626',
	},
	tabsContainer: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.5rem',
		borderBottom: '2px solid #e5e7eb',
	},
	tabActive: {
		padding: '0.75rem 1.5rem',
		border: 'none',
		background: 'none',
		cursor: 'pointer',
		fontSize: '0.875rem',
		fontWeight: 500,
		color: '#3b82f6',
		borderBottom: '2px solid #3b82f6',
		marginBottom: '-2px',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	tabInactive: {
		padding: '0.75rem 1.5rem',
		border: 'none',
		background: 'none',
		cursor: 'pointer',
		fontSize: '0.875rem',
		fontWeight: 500,
		color: '#6b7280',
		borderBottom: '2px solid transparent',
		marginBottom: '-2px',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	alertBanner: {
		padding: '1rem 1.5rem',
		background: '#fef3c7',
		border: '1px solid #fbbf24',
		borderRadius: '0.5rem',
		marginBottom: '1.5rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		color: '#d97706',
	},
	section: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '1.5rem',
		marginBottom: '1.5rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	},
	sectionHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: '1.5rem',
		paddingBottom: '1rem',
		borderBottom: '1px solid #e5e7eb',
	},
	sectionHeaderH2: {
		margin: 0,
		fontSize: '1.125rem',
		fontWeight: 600,
		color: '#1f2937',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	sectionTimestamp: {
		color: '#6b7280',
		fontSize: '0.875rem',
	},
	fieldGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '1.5rem',
	},
	fieldLabel: {
		fontSize: '0.75rem',
		fontWeight: 500,
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		marginBottom: '0.5rem',
	},
	fieldValue: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		fontSize: '0.875rem',
		color: '#1f2937',
		fontWeight: 500,
	},
	verificationBadgeVerified: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		fontSize: '0.75rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '0.25rem',
		marginLeft: '0.5rem',
		background: '#ecfdf5',
		color: '#10b981',
	},
	verificationBadgeUnverified: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		fontSize: '0.75rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '0.25rem',
		marginLeft: '0.5rem',
		background: '#fef2f2',
		color: '#dc2626',
	},
	infoCards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: '1rem',
	},
	infoCard: {
		padding: '1.5rem',
		background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
		borderRadius: '0.5rem',
		border: '1px solid #e5e7eb',
		textAlign: 'center',
	},
	infoCardIcon: {
		fontSize: '2rem',
		marginBottom: '0.75rem',
		color: '#3b82f6',
	},
	infoCardValue: {
		fontSize: '1.5rem',
		fontWeight: 700,
		color: '#1f2937',
		marginBottom: '0.25rem',
	},
	infoCardLabel: {
		fontSize: '0.875rem',
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
	},
	statusTagList: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '0.5rem',
	},
	statusTag: {
		background: '#f1f5f9',
		color: '#1f2937',
		padding: '0.3rem 0.75rem',
		borderRadius: '9999px',
		fontSize: '0.75rem',
		fontWeight: 600,
	},
	statusSection: {
		marginTop: '1.5rem',
	},
	statusHeading: {
		margin: '0 0 0.5rem',
		fontSize: '0.9rem',
		fontWeight: 600,
		color: '#1f2937',
	},
	loadingState: {
		padding: '3rem',
		textAlign: 'center',
		color: '#6b7280',
	},
	errorState: {
		padding: '2rem',
		background: '#fef2f2',
		border: '1px solid #fca5a5',
		borderRadius: '0.5rem',
		color: '#dc2626',
		textAlign: 'center',
	},
	userSelectorCard: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '2rem',
		maxWidth: '860px',
		margin: '2rem auto',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	},
	selectorPageHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		maxWidth: '860px',
		margin: '0 auto',
		padding: '1.5rem 2rem',
		background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
		borderRadius: '0.75rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	},
	selectorPageHeaderH1: {
		margin: 0,
		fontSize: '1.5rem',
		fontWeight: 700,
		color: 'white',
	},
	selectorPageHeaderP: {
		margin: '0.25rem 0 0',
		fontSize: '0.9rem',
		color: 'rgba(255,255,255,0.85)',
	},
	serverErrorModalOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.6)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 10000,
	},
	serverErrorModalContent: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '2rem',
		maxWidth: '550px',
		margin: '1rem',
		boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
		border: '3px solid #dc2626',
	},
	serverErrorModalTitle: {
		fontSize: '1.5rem',
		fontWeight: 700,
		color: '#1f2937',
		margin: '0 0 1rem 0',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
	},
	serverErrorModalMessage: {
		fontSize: '1rem',
		color: '#1f2937',
		lineHeight: 1.6,
		margin: '0 0 1.5rem 0',
	},
	serverErrorModalInstructions: {
		fontSize: '0.9rem',
		color: '#1f2937',
		lineHeight: 1.6,
		margin: '0 0 1.5rem 0',
		padding: '1rem',
		background: '#f3f4f6',
		borderRadius: '0.5rem',
		borderLeft: '4px solid #3b82f6',
	},
	serverErrorModalActions: {
		display: 'flex',
		justifyContent: 'flex-end',
		gap: '0.75rem',
	},
	serverErrorModalButton: {
		padding: '0.75rem 1.5rem',
		background: '#3b82f6',
		color: 'white',
		border: 'none',
		borderRadius: '0.5rem',
		fontSize: '1rem',
		fontWeight: 600,
		cursor: 'pointer',
	},
	inputField: {
		marginBottom: '1.5rem',
	},
	inputLabel: {
		display: 'block',
		fontSize: '0.875rem',
		fontWeight: 500,
		color: '#1f2937',
		marginBottom: '0.5rem',
	},
	inputEl: {
		width: '100%',
		padding: '0.75rem',
		border: '1px solid #e5e7eb',
		borderRadius: '0.375rem',
		fontSize: '0.875rem',
	},
};

// Layout components at module scope — styled-components v6 calls useContext
// internally when creating styled components; must not run inside a component.
const pageConfig = {
	title: 'PingOne User Profile',
	subtitle: 'View detailed user information using real PingOne APIs',
	maxWidth: '1200px',
	showHeader: true,
	showFooter: false,
	responsive: true,
	flowType: 'pingone' as const,
	theme: 'blue' as const,
};

const { PageContainer } = PageLayoutService.createPageLayout(pageConfig);

// Simple styled components for basic functionality
const Container = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`;

const Title = styled.h1`
	font-size: 2rem;
	margin-bottom: 1rem;
	color: #1f2937;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #6b7280;
	margin-bottom: 2rem;
`;

const LoadingMessage = styled.div`
	text-align: center;
	padding: 2rem;
	color: #6b7280;
`;

const ErrorMessage = styled.div`
	background: #fef2f2;
	border: 1px solid #ef4444;
	border-radius: 0.5rem;
	padding: 1rem;
	color: #dc2626;
	margin-bottom: 1rem;
`;

const PingOneUserProfile: React.FC = () => {
	usePageScroll({ pageName: 'PingOne User Profile', force: true });
	const [searchParams] = useSearchParams();

	// Use global worker token service (unified storage) - MUST be called before any useState hooks
	// IMPORTANT: This hook must be called first to maintain consistent hook order
	const globalTokenStatus = useGlobalWorkerToken();

	// Use global worker token instead of custom accessToken state
	const accessToken = globalTokenStatus.token || '';

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// User data state
	const [userProfile, setUserProfile] = useState<PingOneUserProfileData | null>(null);
	const [userGroups, setUserGroups] = useState<PingOneUserGroup[]>([]);
	const [userRoles, setUserRoles] = useState<PingOneUserRole[]>([]);
	const [, setMfaStatus] = useState<PingOneMfaStatus>(null);
	const [, setUserConsents] = useState<PingOneConsentRecord[]>([]);
	const [, setPopulationDetails] = useState<Record<string, unknown> | null>(null);
	const [, setComparisonPopulationDetails] = useState<Record<string, unknown> | null>(null);

	const USER_IDENTIFIER_STORAGE_KEY = 'pingone_user_identifier';
	const initialIdentifier =
		searchParams.get('userId') ||
		searchParams.get('sub') ||
		localStorage.getItem(USER_IDENTIFIER_STORAGE_KEY) ||
		'';
	const [userIdentifier, setUserIdentifier] = useState(initialIdentifier);
	const [resolvedUserId, setResolvedUserId] = useState(initialIdentifier);
	const [environmentId, setEnvironmentId] = useState(() => {
		// URL param takes highest priority, then fall back to any stored source
		const searchParamEnvId = searchParams.get('environmentId');
		if (searchParamEnvId) return searchParamEnvId;
		return readBestEnvironmentId();
	});
	// Always show user selector initially - user must explicitly load the profile
	const [showUserSelector, setShowUserSelector] = useState(true);

	const [, setShowServerErrorModal] = useState(false);
	const [, setSavedWorkerCredentials] = useState(() => credentialManager.getAllCredentials());
	const [identifierError, setIdentifierError] = useState<string | null>(null);
	const [isResolvingUser, setIsResolvingUser] = useState(false);
	const [comparisonProfile] = useState<PingOneUserProfileData | null>(null);

	const fetchUserBundle = useCallback(
		async (targetUserId: string): Promise<UserDataBundle> => {
			const profileResponse = await fetch(
				`/api/pingone/user/${encodeURIComponent(targetUserId)}?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
			);

			if (!profileResponse.ok) {
				if (profileResponse.status === 401) {
					const unauthorizedError = new Error('Worker token unauthorized') as Error & {
						status?: number;
					};
					unauthorizedError.status = 401;
					throw unauthorizedError;
				}

				let errorMessage = `Failed to fetch user profile (${profileResponse.status})`;
				const rawBody = await profileResponse.text().catch(() => '');
				if (rawBody) {
					try {
						const parsed = JSON.parse(rawBody);
						const detail =
							parsed.error_description || parsed.message || parsed.error || parsed.detail;
						if (detail) {
							errorMessage = `${errorMessage}: ${detail}`;
						}
					} catch {
						const trimmed = rawBody.trim();
						if (trimmed) {
							errorMessage = `${errorMessage}: ${trimmed}`;
						}
					}
				}

				if (profileResponse.status === 400) {
					errorMessage +=
						' • Verify the user ID and ensure the worker token includes p1:read:user scope.';
				}

				const enrichedError = new Error(errorMessage) as Error & { status?: number };
				enrichedError.status = profileResponse.status;
				throw enrichedError;
			}

			const profile = (await profileResponse.json()) as PingOneUserProfileData;
			const resolvedId = profile.id || targetUserId;

			let groups: PingOneUserGroup[] = [];
			let roles: PingOneUserRole[] = [];
			let mfa: PingOneMfaStatus = null;
			let consents: PingOneConsentRecord[] = [];

			try {
				const [groupsPayload, rolesPayload, mfaPayload, consentsPayload] = await Promise.all([
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/groups?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					)
						.then((r) => {
							logger.info('[fetchUserBundle] Groups fetch response status:', r.status, r.ok);
							return r.ok ? r.json() : { _embedded: { groups: [] } };
						})
						.then((payload) => {
							logger.info(
								'[fetchUserBundle] Groups payload received:',
								JSON.stringify(payload, null, 2).substring(0, 1500)
							);
							return payload;
						}) as Promise<{
						_embedded?: {
							groups?: PingOneUserGroup[];
							items?: PingOneUserGroup[];
							memberOfGroups?: PingOneUserGroup[];
						};
					}>,
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/roles?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					).then((r) => (r.ok ? r.json() : { _embedded: { roles: [] } })) as Promise<{
						_embedded?: { roles?: PingOneUserRole[]; items?: PingOneUserRole[] };
					}>,
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/mfa?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					).then((r) => (r.ok ? r.json() : null)) as Promise<PingOneMfaStatus>,
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/consents?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					).then((r) => (r.ok ? r.json() : { _embedded: { consents: [] } })) as Promise<{
						_embedded?: { consents?: PingOneConsentRecord[]; items?: PingOneConsentRecord[] };
					}>,
				]);

				const embeddedGroups = groupsPayload._embedded as
					| {
							groups?: Array<
								PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
							>;
							items?: Array<
								PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
							>;
							memberOfGroups?: Array<
								PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
							>;
					  }
					| undefined;
				if (embeddedGroups) {
					// Backend expands memberOfGroups into groups, so check groups first
					if (Array.isArray(embeddedGroups.groups)) {
						groups = embeddedGroups.groups.map((item) => {
							if (item && typeof item === 'object') {
								// If item has nested group object, extract it
								if ('group' in item && item.group && typeof item.group === 'object') {
									return item.group as PingOneUserGroup;
								}
								// Otherwise use item as-is (backend already expanded)
								return item as PingOneUserGroup;
							}
							return item as PingOneUserGroup;
						});
					} else if (Array.isArray(embeddedGroups.items)) {
						groups = embeddedGroups.items.map((item) => {
							if (item && typeof item === 'object' && 'group' in item && item.group) {
								return item.group as PingOneUserGroup;
							}
							return item as PingOneUserGroup;
						});
					} else if (Array.isArray(embeddedGroups.memberOfGroups)) {
						// Fallback: extract groups from memberOfGroups if backend didn't expand
						groups = embeddedGroups.memberOfGroups.map((item) => {
							if (item && typeof item === 'object') {
								// Check if item has nested group object
								if ('group' in item && item.group && typeof item.group === 'object') {
									return item.group as PingOneUserGroup;
								}
								// Check if item itself is the group (has name/id)
								if (
									'name' in item ||
									'displayName' in item ||
									('id' in item && !('group' in item))
								) {
									return item as PingOneUserGroup;
								}
							}
							return item as PingOneUserGroup;
						});
					}
				}
				if (!groups.length && Array.isArray(groupsPayload)) {
					groups = groupsPayload.map((item) => {
						if (item && typeof item === 'object' && 'group' in item && item.group) {
							return item.group as PingOneUserGroup;
						}
						return item as PingOneUserGroup;
					});
				}
				if (
					!groups.length &&
					groupsPayload &&
					typeof groupsPayload === 'object' &&
					'groups' in groupsPayload &&
					Array.isArray(groupsPayload.groups)
				) {
					groups = (
						groupsPayload.groups as Array<
							PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
						>
					).map((item) => {
						if (item && typeof item === 'object' && 'group' in item && item.group) {
							return item.group as PingOneUserGroup;
						}
						return item as PingOneUserGroup;
					});
				}
				if (
					!groups.length &&
					groupsPayload &&
					typeof groupsPayload === 'object' &&
					'memberOfGroups' in groupsPayload &&
					Array.isArray(groupsPayload.memberOfGroups)
				) {
					groups = (
						groupsPayload.memberOfGroups as Array<
							PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
						>
					).map((item) => {
						if (item && typeof item === 'object' && 'group' in item && item.group) {
							return item.group as PingOneUserGroup;
						}
						return item as PingOneUserGroup;
					});
				}

				const embeddedRoles = rolesPayload._embedded as
					| {
							roles?: PingOneUserRole[];
							roleAssignments?: Array<{ role?: PingOneUserRole; [key: string]: unknown }>;
							items?: PingOneUserRole[];
					  }
					| undefined;
				if (embeddedRoles) {
					// Backend expands roleAssignments into roles, so check roles first
					if (Array.isArray(embeddedRoles.roles)) {
						roles = embeddedRoles.roles;
					} else if (Array.isArray(embeddedRoles.items)) {
						roles = embeddedRoles.items;
					} else if (Array.isArray(embeddedRoles.roleAssignments)) {
						// Fallback: extract roles from roleAssignments if backend didn't expand
						roles = embeddedRoles.roleAssignments
							.map((assignment) => {
								if (assignment && typeof assignment === 'object') {
									// Check if assignment has nested role object
									if (
										'role' in assignment &&
										assignment.role &&
										typeof assignment.role === 'object'
									) {
										return assignment.role as PingOneUserRole;
									}
									// Check if assignment itself is the role (has name/id)
									if ('name' in assignment || 'displayName' in assignment || 'id' in assignment) {
										return assignment as PingOneUserRole;
									}
								}
								return null;
							})
							.filter((role): role is PingOneUserRole => Boolean(role));
					}
				}
				if (!roles.length && Array.isArray(rolesPayload)) {
					roles = rolesPayload;
				}
				if (
					!roles.length &&
					Array.isArray(
						(
							rolesPayload as {
								roleAssignments?: Array<{ role?: PingOneUserRole; [key: string]: unknown }>;
							}
						).roleAssignments
					)
				) {
					roles = (
						rolesPayload as {
							roleAssignments: Array<{ role?: PingOneUserRole; [key: string]: unknown }>;
						}
					).roleAssignments
						.map((assignment) => assignment.role)
						.filter((role): role is PingOneUserRole => Boolean(role));
				}
				if (
					!roles.length &&
					rolesPayload &&
					typeof rolesPayload === 'object' &&
					'roles' in rolesPayload &&
					Array.isArray(rolesPayload.roles)
				) {
					roles = (
						rolesPayload.roles as Array<
							PingOneUserRole | { role?: PingOneUserRole; [key: string]: unknown }
						>
					).map((item) => {
						if (item && typeof item === 'object' && 'role' in item && item.role) {
							return item.role as PingOneUserRole;
						}
						return item as PingOneUserRole;
					});
				}
				if (
					!roles.length &&
					rolesPayload &&
					typeof rolesPayload === 'object' &&
					'roleAssignments' in rolesPayload &&
					Array.isArray(rolesPayload.roleAssignments)
				) {
					roles = (
						rolesPayload.roleAssignments as Array<{
							role?: PingOneUserRole;
							[key: string]: unknown;
						}>
					)
						.map((assignment) => assignment.role)
						.filter((role): role is PingOneUserRole => Boolean(role));
				}

				logger.info('[fetchUserBundle] ===== GROUPS DEBUG =====');
				logger.info('[fetchUserBundle] Final groups count:', groups.length);
				logger.info('[fetchUserBundle] Groups payload keys:', Object.keys(groupsPayload || {}));
				logger.info(
					'[fetchUserBundle] Groups _embedded keys:',
					groupsPayload._embedded ? Object.keys(groupsPayload._embedded) : 'NO _embedded'
				);
				logger.info(
					'[fetchUserBundle] Groups _embedded.groups:',
					groupsPayload._embedded?.groups
						? `Array of ${groupsPayload._embedded.groups.length}`
						: 'NOT FOUND'
				);
				logger.info(
					'[fetchUserBundle] Groups _embedded.memberOfGroups:',
					groupsPayload._embedded?.memberOfGroups
						? `Array of ${groupsPayload._embedded.memberOfGroups.length}`
						: 'NOT FOUND'
				);
				logger.info(
					'[fetchUserBundle] Groups _embedded.items:',
					groupsPayload._embedded?.items
						? `Array of ${groupsPayload._embedded.items.length}`
						: 'NOT FOUND'
				);
				logger.info(
					'[fetchUserBundle] First group (if any):',
					groups.length > 0 ? groups[0] : 'NONE'
				);
				logger.info('[fetchUserBundle] ===== END GROUPS DEBUG =====');

				logger.info('[fetchUserBundle] Groups, Roles, and Population:', {
					groupsCount: groups.length,
					rolesCount: roles.length,
					groupsPayloadKeys: Object.keys(groupsPayload || {}),
					rolesPayloadKeys: Object.keys(rolesPayload || {}),
					groupsEmbeddedKeys: groupsPayload._embedded ? Object.keys(groupsPayload._embedded) : [],
					rolesEmbeddedKeys: rolesPayload._embedded ? Object.keys(rolesPayload._embedded) : [],
					groupsSample: groups.length > 0 ? groups[0] : null,
					rolesSample: roles.length > 0 ? roles[0] : null,
					groupsSampleKeys: groups.length > 0 && groups[0] ? Object.keys(groups[0]) : [],
					rolesSampleKeys: roles.length > 0 && roles[0] ? Object.keys(roles[0]) : [],
					groupsSampleName:
						groups.length > 0 ? groups[0]?.name || groups[0]?.displayName || groups[0]?.id : null,
					rolesSampleName:
						roles.length > 0 ? roles[0]?.name || roles[0]?.displayName || roles[0]?.id : null,
					profilePopulation: profile.population,
					populationType: typeof profile.population,
					populationKeys:
						profile.population && typeof profile.population === 'object'
							? Object.keys(profile.population)
							: [],
					populationExtracted: extractPopulation(profile.population),
					rawGroupsPayload: JSON.stringify(groupsPayload, null, 2).substring(0, 1000),
					rawRolesPayload: JSON.stringify(rolesPayload, null, 2).substring(0, 1000),
				});

				mfa = mfaPayload;
				const embeddedConsents = consentsPayload._embedded as
					| {
							consents?: PingOneConsentRecord[];
							items?: PingOneConsentRecord[];
					  }
					| undefined;
				if (embeddedConsents) {
					if (Array.isArray(embeddedConsents.consents)) {
						consents = embeddedConsents.consents;
					} else if (Array.isArray(embeddedConsents.items)) {
						consents = embeddedConsents.items;
					}
				}
				if (
					!consents.length &&
					Array.isArray((profile as { consents?: PingOneConsentRecord[] }).consents)
				) {
					consents = ((profile as { consents?: PingOneConsentRecord[] }).consents ?? []).filter(
						Boolean
					);
				}
			} catch (additionalError) {
				logger.error(
					'PingOneUserProfile',
					'Failed to fetch additional user data:',
					undefined,
					additionalError as Error
				);
			}

			return {
				profile,
				groups,
				roles,
				mfa,
				resolvedId,
				consents,
			};
		},
		[environmentId, accessToken]
	);

	const fetchUserProfile = useCallback(
		async (targetUserId?: string) => {
			const effectiveUserId = targetUserId ?? resolvedUserId;

			if (!effectiveUserId || !environmentId || !accessToken) {
				setError('Please provide a User ID, Environment ID, and Worker Token to load a profile.');
				setLoading(false);
				setShowUserSelector(true);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const bundle = await fetchUserBundle(effectiveUserId);
				setUserProfile(bundle.profile);
				setResolvedUserId(bundle.resolvedId);
				setUserGroups(bundle.groups);
				setUserRoles(bundle.roles);
				setMfaStatus(bundle.mfa);
				setUserConsents(bundle.consents);
			} catch (err: unknown) {
				logger.error('PingOneUserProfile', 'Failed to fetch user profile:', undefined, err as Error);
				const status = (err as { status?: number })?.status;
				const message = err instanceof Error ? err.message : 'Failed to load user profile';
				if (status === 401 || message === 'Worker token unauthorized') {
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message:
							'Worker token expired or missing permissions. Please generate a new worker token.',
						dismissible: true,
					});
					// Clear worker token through unified service
					setShowUserSelector(true);
					return;
				}
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: message,
					dismissible: true,
				});
				setError(message);
			} finally {
				setLoading(false);
			}
		},
		[resolvedUserId, environmentId, accessToken, fetchUserBundle]
	);

	// Fetch population details if we have a population ID but no name
	useEffect(() => {
		if (!userProfile?.population || !environmentId || !accessToken) {
			setPopulationDetails(null);
			return;
		}

		const pop = userProfile.population;
		// If it's already a string with a name, no need to fetch
		if (
			typeof pop === 'string' &&
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pop)
		) {
			setPopulationDetails(null);
			return;
		}

		// Get population ID
		let populationId: string | null = null;
		if (typeof pop === 'string') {
			populationId = pop;
		} else if (typeof pop === 'object' && pop !== null) {
			const popObj = pop as Record<string, unknown>;
			// Check if we already have a name
			if (popObj.name || popObj.displayName) {
				setPopulationDetails(popObj);
				return;
			}
			populationId = popObj.id ? String(popObj.id) : null;
		}

		if (!populationId) {
			setPopulationDetails(null);
			return;
		}

		// Fetch population details
		fetch(
			`/api/pingone/population/${encodeURIComponent(populationId)}?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
		)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data) {
					setPopulationDetails(data);
				}
			})
			.catch((err) => {
				logger.error(
					'PingOneUserProfile',
					'[Population] Failed to fetch population details:',
					undefined,
					err as Error
				);
			});
	}, [userProfile?.population, environmentId, accessToken]);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			try {
				const data = unifiedWorkerTokenService.getTokenDataSync();
				if (data?.credentials?.environmentId && !environmentId) {
					setEnvironmentId(data.credentials.environmentId);
				}
			} catch (error) {
				logger.info('Failed to update environment ID from worker token:', error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [environmentId]);

	// Fetch population details for comparison user
	useEffect(() => {
		if (!comparisonProfile?.population || !environmentId || !accessToken) {
			setComparisonPopulationDetails(null);
			return;
		}

		let populationId: string | null = null;
		if (typeof comparisonProfile.population === 'string') {
			populationId = comparisonProfile.population;
		} else if (typeof comparisonProfile.population === 'number') {
			populationId = String(comparisonProfile.population);
		} else if (comparisonProfile.population && typeof comparisonProfile.population === 'object') {
			const popObj = comparisonProfile.population as Record<string, unknown>;
			// Check if we already have a name
			if (popObj.name || popObj.displayName) {
				setComparisonPopulationDetails(popObj);
				return;
			}
			populationId = popObj.id ? String(popObj.id) : null;
		}

		if (!populationId) {
			setComparisonPopulationDetails(null);
			return;
		}

		// Fetch population details
		fetch(
			`/api/pingone/population/${encodeURIComponent(populationId)}?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
		)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data) {
					setComparisonPopulationDetails(data);
				}
			})
			.catch((err) => {
				logger.error(
					'PingOneUserProfile',
					'[Comparison Population] Failed to fetch population details:',
					undefined,
					err as Error
				);
			});
	}, [comparisonProfile?.population, environmentId, accessToken]);

	const handleLoadUserProfile = useCallback(async () => {
		if (!accessToken) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Generate a worker token before loading a profile.',
				dismissible: true,
			});
			return;
		}

		if (!globalTokenStatus.isValid) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Worker token expired. Generate a new worker token to continue.',
				dismissible: true,
			});
			return;
		}

		if (!environmentId.trim()) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please provide an Environment ID',
				dismissible: true,
			});
			return;
		}

		if (!userIdentifier.trim()) {
			const message = 'User identifier is required (user ID, username, or email).';
			setIdentifierError(message);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: message,
				dismissible: true,
			});
			return;
		}

		setIdentifierError(null);
		setIsResolvingUser(true);

		const trimmedIdentifier = userIdentifier.trim();
		const trimmedEnvironment = environmentId.trim();
		const trimmedAccessToken = accessToken.trim();

		// Double-check all values are non-empty before making the request
		if (!trimmedEnvironment || !trimmedAccessToken || !trimmedIdentifier) {
			const missing = [];
			if (!trimmedEnvironment) missing.push('Environment ID');
			if (!trimmedAccessToken) missing.push('Worker Token');
			if (!trimmedIdentifier) missing.push('User Identifier');
			const message = `Missing required fields: ${missing.join(', ')}`;
			setIdentifierError(message);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: message,
				dismissible: true,
			});
			setIsResolvingUser(false);
			return;
		}

		try {
			const lookupResult = await lookupPingOneUser({
				environmentId: trimmedEnvironment,
				accessToken: trimmedAccessToken,
				identifier: trimmedIdentifier,
			});
			const matchedUser = lookupResult.user as Partial<PingOneUserProfileData> | undefined;
			const resolvedId = matchedUser?.id;
			if (!resolvedId) {
				throw new Error('Unable to find a user matching that identifier.');
			}
			setResolvedUserId(resolvedId);
			setUserProfile(null);
			setUserGroups([]);
			setUserRoles([]);
			setMfaStatus(null);
			setUserConsents([]);
			const finalIdentifier =
				matchedUser?.preferred_username ||
				matchedUser?.username ||
				matchedUser?.email ||
				trimmedIdentifier;
			if (finalIdentifier) {
				setUserIdentifier(finalIdentifier);
			}
			try {
				localStorage.setItem('worker_environment_id', trimmedEnvironment);
				// Clear worker token through unified service
				if (finalIdentifier) {
					localStorage.setItem(USER_IDENTIFIER_STORAGE_KEY, finalIdentifier);
				}
			} catch (storageError) {
				logger.warn('PingOneUserProfile', 'Unable to persist credentials to localStorage:', {
					error: storageError,
				});
			}
			setShowUserSelector(false);
			await fetchUserProfile(resolvedId);
			if (lookupResult.matchType) {
				modernMessaging.showFooterMessage({
					type: 'status',
					message: `User matched by ${lookupResult.matchType}.`,
					duration: 4000,
				});
			} else {
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'User resolved successfully.',
					duration: 4000,
				});
			}
		} catch (err) {
			// Check if this is a server error (500)
			if (err instanceof Error && 'isServerError' in err && err.isServerError) {
				setShowServerErrorModal(true);
				setIdentifierError('Backend server is not responding');
			} else {
				const message = err instanceof Error ? err.message : 'Unable to resolve user identifier.';
				setIdentifierError(message);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: message,
					dismissible: true,
				});
			}
		} finally {
			setIsResolvingUser(false);
		}
	}, [accessToken, environmentId, userIdentifier, fetchUserProfile, globalTokenStatus.isValid]);

	useEffect(() => {
		if (showUserSelector) {
			setLoading(false);
			setError(null);
		}
	}, [showUserSelector]);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (!event.key || event.key === 'pingone_permanent_credentials') {
				setSavedWorkerCredentials(credentialManager.getAllCredentials());
			}
		};

		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);

	if (loading) {
		return (
			<>
				<FlowHeader flowId="pingone-user-profile" />
				<div style={styles.pageContainer}>
					<div style={styles.loadingState}>
						<FiRefreshCw className="animate-spin" size={24} style={{ marginBottom: '1rem' }} />
						<p>Loading user profile...</p>
					</div>
				</div>
			</>
		);
	}

	if (error) {
		return (
			<>
				<FlowHeader flowId="pingone-user-profile" />
				<div style={styles.pageContainer}>
					<div style={styles.errorState}>
						<FiAlertTriangle size={24} style={{ marginBottom: '1rem' }} />
						<p>{error}</p>
						<button
							type="button"
							onClick={() => fetchUserProfile()}
							style={{
								marginTop: '1rem',
								padding: '0.5rem 1rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer',
							}}
						>
							Retry
						</button>
					</div>
				</div>
			</>
		);
	}

	const hasValidWorkerToken = globalTokenStatus.isValid && !!globalTokenStatus.token;

	if (!userProfile && showUserSelector) {
		return (
			<>
				<FlowHeader flowId="pingone-user-profile" />
				<div style={styles.pageContainer}>
					<div style={styles.selectorPageHeader}>
						<FiUser size={36} style={{ color: 'white', flexShrink: 0 }} />
						<div>
							<h1 style={styles.selectorPageHeaderH1}>Select User to View Profile</h1>
							<p style={styles.selectorPageHeaderP}>
								Look up a PingOne user by ID, username, or email address
							</p>
						</div>
					</div>
					<div style={styles.userSelectorCard}>
						{hasValidWorkerToken ? (
							<div
								style={{
									...styles.alertBanner,
									background: '#ecfdf5',
									border: '1px solid #34d399',
									color: '#047857',
								}}
							>
								<span>✅</span>
								<span>Worker token detected. Token is active.</span>
							</div>
						) : (
							<div style={styles.alertBanner}>
								<span>⚠️</span>
								<span>
									No worker token found or token expired. Generate one to load a user profile.
								</span>
							</div>
						)}
						<div style={styles.inputField}>
							<label htmlFor="environmentId" style={styles.inputLabel}>
								Environment ID *
							</label>
							<input
								id="environmentId"
								type="text"
								value={environmentId}
								onChange={(e) => setEnvironmentId(e.target.value)}
								placeholder="Enter PingOne Environment ID"
								style={styles.inputEl}
							/>
						</div>

						{/* Worker Token Section */}
						<WorkerTokenSectionV8 compact environmentId={environmentId} />

						{/* Configuration Checkboxes */}
						<div
							style={{
								marginBottom: '1rem',
								display: 'flex',
								flexDirection: 'row',
								flexWrap: 'wrap',
								gap: '1.5rem',
							}}
						>
							<SilentApiConfigCheckboxV8 />
							<ShowTokenConfigCheckboxV8 />
						</div>

						<div style={styles.inputField}>
							<label htmlFor="userIdentifier" style={styles.inputLabel}>
								User Identifier *
							</label>
							<UserSearchDropdownV8
								environmentId={environmentId}
								value={userIdentifier}
								onChange={(value) => {
									setUserIdentifier(value);
									setIdentifierError(null);
									// Persist to localStorage as user types
									try {
										if (value.trim()) {
											localStorage.setItem(USER_IDENTIFIER_STORAGE_KEY, value);
										} else {
											localStorage.removeItem(USER_IDENTIFIER_STORAGE_KEY);
										}
									} catch (storageError) {
										logger.warn(
											'PingOneUserProfile',
											'Unable to persist user identifier to localStorage:',
											{ error: storageError }
										);
									}
								}}
								placeholder="Search for a user by ID, username, or email..."
								disabled={!environmentId.trim() || !accessToken.trim()}
								id="userIdentifier"
								autoLoad={true}
							/>
							<div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
								Search and select a user from the dropdown list in the selected environment.
							</div>
							{identifierError && (
								<div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.5rem' }}>
									{identifierError}
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={() => handleLoadUserProfile()}
							disabled={
								isResolvingUser ||
								!userIdentifier.trim() ||
								!environmentId.trim() ||
								!accessToken.trim()
							}
							style={{
								width: '100%',
								padding: '0.75rem',
								background:
									isResolvingUser ||
									!userIdentifier.trim() ||
									!environmentId.trim() ||
									!accessToken.trim()
										? '#9ca3af'
										: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								fontSize: '0.875rem',
								fontWeight: '600',
								cursor:
									isResolvingUser ||
									!userIdentifier.trim() ||
									!environmentId.trim() ||
									!accessToken.trim()
										? 'not-allowed'
										: 'pointer',
							}}
						>
							{isResolvingUser ? 'Resolving user…' : 'Load User Profile'}
						</button>
					</div>
				</div>
			</>
		);
	}

	if (!userProfile && !showUserSelector) {
		return (
			<>
				<FlowHeader flowId="pingone-user-profile" />
				<PageContainer>
					<ErrorState>
						<p>
							No user data available. Provide a User ID, Environment ID, and Worker Token using the
							selector above. Worker tokens cannot determine the user automatically, so enter the
							user ID manually when prompted.
						</p>
						<button
							type="button"
							onClick={() => setShowUserSelector(true)}
							style={{
								marginTop: '1rem',
								padding: '0.5rem 1rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer',
							}}
						>
							Select User
						</button>
					</ErrorState>
				</PageContainer>
			</>
		);
	}

	if (!userProfile) {
		return null;
	}

	return (
		<>
			<FlowHeader flowId="pingone-user-profile" />
			<PageContainer>
				{loading ? (
					<LoadingMessage>
						<FiRefreshCw className="animate-spin" size={24} style={{ marginBottom: '1rem' }} />
						Loading user profile...
					</LoadingMessage>
				) : error ? (
					<ErrorMessage>
						<FiAlertTriangle size={24} style={{ marginBottom: '1rem' }} />
						{error}
					</ErrorMessage>
				) : userProfile ? (
					<Container>
						<Title>PingOne User Profile</Title>
						<Subtitle>View detailed user information using real PingOne APIs</Subtitle>

						<div>
							<h3>User Information</h3>
							<p>
								<strong>Name:</strong> {userProfile.name || 'N/A'}
							</p>
							<p>
								<strong>Email:</strong> {userProfile.email || 'N/A'}
							</p>
							<p>
								<strong>Username:</strong> {userProfile.username || 'N/A'}
							</p>
							<p>
								<strong>ID:</strong> {userProfile.id || 'N/A'}
							</p>
						</div>

						<div style={{ marginTop: '2rem' }}>
							<h3>Groups ({userGroups.length})</h3>
							{userGroups.length > 0 ? (
								<ul>
									{userGroups.map((group, index) => (
										<li key={group.id || index}>{group.name || 'Unnamed Group'}</li>
									))}
								</ul>
							) : (
								<p>No groups found</p>
							)}
						</div>

						<div style={{ marginTop: '2rem' }}>
							<h3>Roles ({userRoles.length})</h3>
							{userRoles.length > 0 ? (
								<ul>
									{userRoles.map((role, index) => (
										<li key={role.id || index}>{role.name || 'Unnamed Role'}</li>
									))}
								</ul>
							) : (
								<p>No roles found</p>
							)}
						</div>
					</Container>
				) : (
					<Container>
						<Title>PingOne User Profile</Title>
						<Subtitle>View detailed user information using real PingOne APIs</Subtitle>
						<ErrorMessage>
							No user profile loaded. Please ensure you have a valid worker token.
						</ErrorMessage>
					</Container>
				)}
			</PageContainer>
		</>
	);
};

export default PingOneUserProfile;
