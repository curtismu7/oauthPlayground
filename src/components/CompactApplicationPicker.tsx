// src/components/CompactApplicationPicker.tsx
// Compact version of application picker for use in modals

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertCircle, FiRefreshCw, FiSearch } from '@icons';
import styled from 'styled-components';
import type { PingOneApplication } from '../services/pingOneApplicationService';
import { fetchApplications } from '../services/pingOneApplicationService';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const SearchBox = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchIcon = styled(FiSearch)`
	position: absolute;
	left: 0.75rem;
	color: #9ca3af;
	pointer-events: none;
`;

const SearchInput = styled.input`
	width: 100%;
	padding: 0.5rem 0.75rem 0.5rem 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: all 0.15s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const AppList = styled.div`
	max-height: 300px;
	overflow-y: auto;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	background: white;
`;

const AppItem = styled.button<{ $selected?: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem;
	border: none;
	background: ${({ $selected }) => ($selected ? '#eff6ff' : 'white')};
	border-left: 3px solid ${({ $selected }) => ($selected ? '#3b82f6' : 'transparent')};
	cursor: pointer;
	transition: all 0.15s;
	text-align: left;

	&:hover {
		background: ${({ $selected }) => ($selected ? '#eff6ff' : '#f9fafb')};
	}

	&:not(:last-child) {
		border-bottom: 1px solid #f3f4f6;
	}
`;

const AppIcon = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 0.375rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
`;

const AppInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const AppName = styled.div`
	font-weight: 500;
	font-size: 0.875rem;
	color: #111827;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const AppId = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', monospace;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const LoadingState = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	color: #6b7280;
	font-size: 0.875rem;
	gap: 0.5rem;
`;

const ErrorState = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.375rem;
	color: #991b1b;
	font-size: 0.875rem;
`;

const EmptyState = styled.div`
	padding: 2rem;
	text-align: center;
	color: #6b7280;
	font-size: 0.875rem;
`;

const RefreshButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.375rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: white;
	color: #374151;
	font-size: 0.8125rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	svg {
		animation: ${({ disabled }) => (disabled ? 'spin 1s linear infinite' : 'none')};
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const Title = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #111827;
`;

interface CompactApplicationPickerProps {
	environmentId: string;
	workerToken: string;
	selectedAppId?: string;
	onSelectApp: (app: PingOneApplication) => void;
	placeholder?: string;
}

export const CompactApplicationPicker: React.FC<CompactApplicationPickerProps> = ({
	environmentId,
	workerToken,
	selectedAppId,
	onSelectApp,
	placeholder = 'Search applications...',
}) => {
	const [applications, setApplications] = useState<PingOneApplication[]>([]);
	const [filteredApps, setFilteredApps] = useState<PingOneApplication[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadApplications = useCallback(async () => {
		if (!environmentId || !workerToken) {
			setError('Environment ID and Worker Token are required');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const apps = await fetchApplications({
				environmentId,
				workerToken,
			});
			setApplications(apps);
			setFilteredApps(apps);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load applications');
		} finally {
			setLoading(false);
		}
	}, [environmentId, workerToken]);

	useEffect(() => {
		loadApplications();
	}, [loadApplications]);

	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredApps(applications);
			return;
		}

		const query = searchQuery.toLowerCase();
		const filtered = applications.filter(
			(app) =>
				app.name.toLowerCase().includes(query) ||
				app.id.toLowerCase().includes(query) ||
				app.protocol?.toLowerCase().includes(query)
		);
		setFilteredApps(filtered);
	}, [searchQuery, applications]);

	if (loading) {
		return (
			<Container>
				<LoadingState>
					<FiRefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
					Loading applications...
				</LoadingState>
			</Container>
		);
	}

	if (error) {
		return (
			<Container>
				<ErrorState>
					<FiAlertCircle size={16} />
					{error}
				</ErrorState>
				<RefreshButton onClick={loadApplications}>
					<FiRefreshCw size={14} />
					Retry
				</RefreshButton>
			</Container>
		);
	}

	return (
		<Container>
			<Header>
				<Title>Select Application</Title>
				<RefreshButton onClick={loadApplications} disabled={loading}>
					<FiRefreshCw size={14} />
					Refresh
				</RefreshButton>
			</Header>

			<SearchBox>
				<SearchIcon size={16} />
				<SearchInput
					type="text"
					placeholder={placeholder}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</SearchBox>

			<AppList>
				{filteredApps.length === 0 ? (
					<EmptyState>
						{searchQuery ? 'No applications match your search' : 'No applications found'}
					</EmptyState>
				) : (
					filteredApps.map((app) => (
						<AppItem
							key={app.id}
							$selected={app.id === selectedAppId}
							onClick={() => onSelectApp(app)}
						>
							<AppIcon>{app.name.charAt(0).toUpperCase()}</AppIcon>
							<AppInfo>
								<AppName>{app.name}</AppName>
								<AppId>{app.id}</AppId>
							</AppInfo>
						</AppItem>
					))
				)}
			</AppList>
		</Container>
	);
};
