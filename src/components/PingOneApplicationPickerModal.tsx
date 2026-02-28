import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiBookOpen,
	FiCheck,
	FiInfo,
	FiKey,
	FiLink,
	FiLink2,
	FiRefreshCw,
	FiSearch
} from '@icons';
import styled from 'styled-components';
import { fetchApplications, type PingOneApplication } from '../services/pingOneApplicationService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { DraggableModal } from './DraggableModal';
import { WorkerTokenModal } from './WorkerTokenModal';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
`;

const FieldGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #0f172a;
`;

const TextInput = styled.input`
  width: 220px;
  padding: 0.55rem 0.65rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5f5;
  font-size: 0.9rem;
  background: #ffffff;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 160px;
  padding: 0.55rem 0.65rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5f5;
  font-size: 0.9rem;
  background: #ffffff;
  color: #0f172a;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 0.6rem;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;

  ${({ $variant }) =>
		$variant === 'secondary'
			? `
    background: #e2e8f0;
    color: #1f2937;

    &:hover:not(:disabled) {
      background: #cbd5f5;
      transform: translateY(-1px);
    }
  `
			: `
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    box-shadow: 0 8px 18px -10px rgba(37, 99, 235, 0.75);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px -10px rgba(37, 99, 235, 0.85);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TableWrapper = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const THead = styled.thead`
  background: #f1f5f9;
`;

const TH = styled.th`
  text-align: left;
  padding: 0.65rem 0.9rem;
  font-weight: 600;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
`;

const TR = styled.tr<{ $highlight?: boolean }>`
  background: ${({ $highlight }) => ($highlight ? 'rgba(37, 99, 235, 0.04)' : '#ffffff')};

  &:nth-child(even) {
    background: ${({ $highlight }) => ($highlight ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc')};
  }
`;

const TD = styled.td`
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
  color: #1f2937;
`;

const EmptyState = styled.div`
  display: flex;
  padding: 2.5rem;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  color: #64748b;
  text-align: center;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
  border-radius: 9999px;
  padding: 0.1rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InlineInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: #475569;
`;

const StatusBar = styled.div<{ $variant: 'info' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  background: ${({ $variant }) =>
		$variant === 'warning' ? 'rgba(254, 215, 170, 0.45)' : 'rgba(191, 219, 254, 0.6)'};
  color: ${({ $variant }) => ($variant === 'warning' ? '#92400e' : '#1e3a8a')};
  border: 1px solid
    ${({ $variant }) => ($variant === 'warning' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(59, 130, 246, 0.4)')};
`;

const Paginator = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.9rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
`;

const PaginationInfo = styled.span`
  font-size: 0.8rem;
  color: #475569;
`;

type Props = {
	isOpen: boolean;
	onClose: () => void;
	workerToken?: string | null;
	initialEnvironmentId?: string;
	initialRegion?: string;
	onSelect: (app: PingOneApplication, context: { environmentId: string; region: string }) => void;
	onWorkerTokenChange?: (token: string | null) => void;
};

const REGION_OPTIONS = [
	{ label: 'North America', value: 'na' },
	{ label: 'Europe', value: 'eu' },
	{ label: 'Asia-Pacific', value: 'ap' },
];

const PingOneApplicationPickerModal: React.FC<Props> = ({
	isOpen,
	onClose,
	workerToken,
	initialEnvironmentId,
	initialRegion = 'na',
	onSelect,
	onWorkerTokenChange,
}) => {
	const [environmentId, setEnvironmentId] = useState(initialEnvironmentId ?? '');
	const [region, setRegion] = useState(initialRegion);
	const [loading, setLoading] = useState(false);
	const [applications, setApplications] = useState<PingOneApplication[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const pageSize = 8;

	useEffect(() => {
		if (isOpen) {
			setEnvironmentId(initialEnvironmentId ?? '');
			setRegion(initialRegion);
			setApplications([]);
			setPage(0);
			setError(null);
		}
	}, [isOpen, initialEnvironmentId, initialRegion]);

	// Filter to only show latest version of each app (e.g., if "App V5", "App V6", "App V7", "App V8" exist, only show "App V8")
	const latestVersionApps = useMemo(() => {
		if (!applications.length) return [];

		// Group apps by base name (without version suffix)
		const appGroups = new Map<string, PingOneApplication[]>();

		applications.forEach((app) => {
			// Extract base name and version (e.g., "My App V8" -> base: "My App", version: 8)
			const versionMatch = app.name.match(/^(.+?)\s+v?(\d+)$/i);
			if (versionMatch) {
				const baseName = versionMatch[1].trim().toLowerCase();
				const version = parseInt(versionMatch[2], 10);
				if (!appGroups.has(baseName)) {
					appGroups.set(baseName, []);
				}
				appGroups.get(baseName)!.push({ ...app, _version: version } as any);
			} else {
				// No version suffix - treat as base app
				const baseName = app.name.toLowerCase();
				if (!appGroups.has(baseName)) {
					appGroups.set(baseName, []);
				}
				appGroups.get(baseName)!.push({ ...app, _version: 0 } as any);
			}
		});

		// For each group, keep only the app with the highest version
		const latestApps: PingOneApplication[] = [];
		appGroups.forEach((groupApps) => {
			// Sort by version descending and take the first (highest version)
			const sorted = groupApps.sort((a, b) => (b as any)._version - (a as any)._version);
			const latest = sorted[0];
			// Remove the temporary _version property
			const { _version, ...cleanApp } = latest as any;
			latestApps.push(cleanApp);
		});

		return latestApps;
	}, [applications]);

	const filteredApplications = useMemo(() => {
		const appsToFilter = latestVersionApps.length > 0 ? latestVersionApps : applications;

		if (!searchTerm.trim()) {
			return appsToFilter;
		}

		const term = searchTerm.toLowerCase();
		return appsToFilter.filter((app) => {
			const matchesName = app.name.toLowerCase().includes(term);
			const matchesClientId = app.clientId.toLowerCase().includes(term);
			const matchesDescription = app.description?.toLowerCase().includes(term);
			return matchesName || matchesClientId || matchesDescription;
		});
	}, [latestVersionApps, applications, searchTerm]);

	const pagedApplications = useMemo(() => {
		const start = page * pageSize;
		return filteredApplications.slice(start, start + pageSize);
	}, [filteredApplications, page]);

	const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

	const handleFetch = useCallback(async () => {
		if (!environmentId.trim()) {
			setError('Environment ID is required to query PingOne applications.');
			return;
		}

		if (!workerToken) {
			setError('Get a worker token first to fetch applications from PingOne.');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const apps = await fetchApplications({
				environmentId: environmentId.trim(),
				region,
				workerToken,
			});

			setApplications(apps);
			setPage(0);

			if (!apps.length) {
				setError('No applications were returned for this environment.');
			} else {
				v4ToastManager.showSuccess(`Loaded ${apps.length} PingOne applications.`);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to fetch PingOne applications.';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [environmentId, region, workerToken]);

	const handleSelect = useCallback(
		(app: PingOneApplication) => {
			onSelect(app, { environmentId: environmentId.trim(), region });
			onClose();
		},
		[environmentId, region, onSelect, onClose]
	);

	if (!isOpen) return null;

	const missingWorkerToken = !workerToken;

	return (
		<DraggableModal
			isOpen={isOpen}
			onClose={onClose}
			title="PingOne Applications"
			width="min(1040px, calc(100vw - 2rem))"
			maxHeight="calc(100vh - 4rem)"
		>
			<Content>
				<InlineInfo>
					<FiBookOpen /> Browse applications directly from your PingOne tenant and apply their
					credentials to this flow.
				</InlineInfo>

				<Toolbar>
					<FieldGroup>
						Environment ID
						<TextInput
							value={environmentId}
							onChange={(event) => setEnvironmentId(event.target.value)}
							placeholder="e.g. 12345678-90ab-cdef-1234-567890abcdef"
						/>
					</FieldGroup>
					<FieldGroup>
						Region
						<Select value={region} onChange={(event) => setRegion(event.target.value)}>
							{REGION_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</FieldGroup>
					<Button onClick={handleFetch} disabled={loading || missingWorkerToken}>
						<FiSearch size={16} />
						{loading ? 'Loading…' : 'Fetch Applications'}
					</Button>
					<Button
						$variant="secondary"
						onClick={() => {
							setApplications([]);
							setSearchTerm('');
							setError(null);
							setPage(0);
						}}
						disabled={!applications.length}
					>
						<FiRefreshCw size={16} /> Clear Results
					</Button>
					<FieldGroup>
						Search
						<TextInput
							value={searchTerm}
							onChange={(event) => {
								setSearchTerm(event.target.value);
								setPage(0);
							}}
							placeholder="Search by name, client ID, or description..."
						/>
					</FieldGroup>
				</Toolbar>

				{missingWorkerToken && (
					<StatusBar $variant="warning">
						<FiInfo size={16} /> Generate a worker token first so we can call the PingOne Admin API.
						<Button
							onClick={() => setShowWorkerTokenModal(true)}
							style={{
								marginLeft: '0.75rem',
								padding: '0.4rem 0.9rem',
								fontSize: '0.8rem',
								background: '#ffffff',
								color: '#92400e',
								border: '1px solid rgba(251, 191, 36, 0.5)',
							}}
						>
							<FiKey size={14} /> Get Worker Token
						</Button>
					</StatusBar>
				)}

				{error && (
					<StatusBar $variant="warning">
						<FiInfo size={16} /> {error}
					</StatusBar>
				)}

				{!error && !applications.length && !loading && (
					<EmptyState>
						<FiInfo size={28} />
						<div style={{ fontWeight: 600 }}>No applications loaded yet</div>
						<div style={{ maxWidth: 480 }}>
							Enter your PingOne Environment ID, ensure a worker token is available, then click
							“Fetch Applications”.
						</div>
					</EmptyState>
				)}

				{!!applications.length && (
					<TableWrapper>
						<Table>
							<THead>
								<tr>
									<TH style={{ width: '32%' }}>Application</TH>
									<TH style={{ width: '22%' }}>Client ID</TH>
									<TH style={{ width: '22%' }}>Grants / Type</TH>
									<TH style={{ width: '14%' }}>Redirects</TH>
									<TH style={{ width: '10%' }}></TH>
								</tr>
							</THead>
							<tbody>
								{pagedApplications.map((app) => (
									<TR key={app.id}>
										<TD>
											<div style={{ fontWeight: 600, color: '#0f172a' }}>{app.name}</div>
											{app.description && (
												<div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
													{app.description}
												</div>
											)}
										</TD>
										<TD>
											<InlineInfo>
												<FiLink2 size={14} color="#2563eb" />
												<span style={{ fontFamily: 'Menlo, monospace', fontSize: '0.78rem' }}>
													{app.clientId}
												</span>
											</InlineInfo>
										</TD>
										<TD>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
												<Badge>{app.type || 'APP'}</Badge>
												<div style={{ fontSize: '0.78rem', color: '#475569' }}>
													{app.grantTypes?.length
														? app.grantTypes.join(', ')
														: 'No grant types configured'}
												</div>
											</div>
										</TD>
										<TD>
											<div style={{ fontSize: '0.78rem', color: '#475569' }}>
												<div>Redirect URIs: {app.redirectUris?.length ?? 0}</div>
												<div>Logout URIs: {app.postLogoutRedirectUris?.length ?? 0}</div>
											</div>
										</TD>
										<TD>
											<Button
												onClick={() => handleSelect(app)}
												style={{ width: '100%', justifyContent: 'center' }}
											>
												<FiCheck size={16} /> Use App
											</Button>
										</TD>
									</TR>
								))}
							</tbody>
						</Table>
						{totalPages > 1 && (
							<Paginator>
								<PaginationInfo>
									Showing {page * pageSize + 1} –
									{Math.min((page + 1) * pageSize, filteredApplications.length)} of{' '}
									{filteredApplications.length}
									{applications.length > filteredApplications.length
										? ` (filtered from ${applications.length})`
										: ''}
								</PaginationInfo>
								<div style={{ display: 'flex', gap: '0.5rem' }}>
									<Button
										$variant="secondary"
										onClick={() => setPage((p) => Math.max(0, p - 1))}
										disabled={page === 0}
									>
										Previous
									</Button>
									<Button
										$variant="secondary"
										onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
										disabled={page >= totalPages - 1}
									>
										Next
									</Button>
								</div>
							</Paginator>
						)}
					</TableWrapper>
				)}

				{/* Worker Token Modal */}
				<WorkerTokenModal
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onContinue={() => {
						setShowWorkerTokenModal(false);
						// Check if token was stored in localStorage
						const storedToken = localStorage.getItem('worker_token');
						if (storedToken && onWorkerTokenChange) {
							onWorkerTokenChange(storedToken);
							v4ToastManager.showSuccess('Worker token obtained. You can now fetch applications.');
						}
					}}
					flowType="application-picker"
					environmentId={environmentId || ''}
				/>
			</Content>
		</DraggableModal>
	);
};

export { PingOneApplicationPickerModal };
