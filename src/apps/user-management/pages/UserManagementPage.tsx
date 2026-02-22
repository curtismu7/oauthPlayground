/**
 * @file UserManagementPage.tsx
 * @module v8u/pages
 * @description User management page for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash, FiTrash2, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import { UserSearchDropdown } from '../../protect-app/components/UserSearchDropdown';
import { DeleteAllUsersFlow } from '../components/DeleteAllUsersFlow';
import { useTheme } from '../contexts/ThemeContext';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PageContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
`;

const PageTitle = styled.h1<{ theme: any }>`
	font-size: 2rem;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin: 0;
`;

const PageDescription = styled.p<{ theme: any }>`
	color: ${({ theme }) => theme.colors.textSecondary};
	margin: 0;
`;

const ActionButton = styled.button<{ theme: any; variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.875rem;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.3s ease;

	${({ variant = 'primary', theme }) => {
		switch (variant) {
			case 'primary':
				return `
					background: ${theme.colors.primary};
					color: white;
					&:hover {
						background: ${theme.colors.primaryDark || theme.colors.primary};
					}
				`;
			case 'secondary':
				return `
					background: ${theme.colors.surface};
					color: ${theme.colors.text};
					border: 1px solid ${theme.colors.border};
					&:hover {
						background: ${theme.colors.surfaceHover || theme.colors.surface};
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover {
						background: #dc2626;
					}
				`;
			default:
				return '';
		}
	}}
`;

const SearchSection = styled.div<{ theme: any }>`
	background: ${({ theme }) => theme.colors.surface};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	padding: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-end;
	flex-wrap: wrap;
`;

const SearchField = styled.div`
	flex: 1;
	min-width: 200px;
`;

const SearchLabel = styled.label<{ theme: any }>`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
	margin-bottom: 0.5rem;
`;

const SearchSelect = styled.select<{ theme: any }>`
	width: 100%;
	padding: 0.75rem;
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.text};
`;

const UserTable = styled.div<{ theme: any }>`
	background: ${({ theme }) => theme.colors.surface};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	overflow: hidden;
`;

const TableHeader = styled.div<{ theme: any }>`
	background: ${({ theme }) => theme.colors.primaryLight};
	padding: 1rem;
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
	gap: 1rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TableRow = styled.div<{ theme: any }>`
	padding: 1rem;
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
	gap: 1rem;
	align-items: center;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	transition: background-color 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.surfaceHover || theme.colors.surface};
	}

	&:last-child {
		border-bottom: none;
	}
`;

const UserCell = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-shrink: 0;
	min-width: 0;
`;

const UserAvatar = styled.div<{ theme: any }>`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: ${({ theme }) => theme.colors.primary};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
`;

const UserInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const UserName = styled.div<{ theme: any }>`
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 0.875rem;
`;

const UserEmail = styled.div<{ theme: any }>`
	color: ${({ theme }) => theme.colors.textSecondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 0.875rem;
`;

const StatusBadge = styled.span<{ theme: any; status: string }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.025em;

	${({ status, theme }) => {
		switch (status) {
			case 'active':
				return `
					background: #10b981;
					color: white;
				`;
			case 'inactive':
				return `
					background: #6b7280;
					color: white;
				`;
			case 'pending':
				return `
					background: #f59e0b;
					color: white;
				`;
			default:
				return `
					background: ${theme.colors.border};
					color: ${theme.colors.text};
				`;
		}
	}}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const IconButton = styled.button<{ theme: any; variant?: 'edit' | 'delete' }>`
	padding: 0.5rem;
	border-radius: 6px;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	${({ variant = 'edit', theme }) => {
		switch (variant) {
			case 'edit':
				return `
					background: ${theme.colors.primary};
					color: white;
					&:hover {
						background: ${theme.colors.primaryDark || theme.colors.primary};
					}
				`;
			case 'delete':
				return `
					background: #ef4444;
					color: white;
					&:hover {
						background: #dc2626;
					}
				`;
			default:
				return '';
		}
	}}
`;

const EmptyState = styled.div<{ theme: any }>`
	text-align: center;
	padding: 3rem;
	color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoadingState = styled.div<{ theme: any }>`
	text-align: center;
	padding: 3rem;
	color: ${({ theme }) => theme.colors.textSecondary};
`;

// ============================================================================
// TYPES
// ============================================================================

interface User {
	id: string;
	username: string;
	email: string;
	status: 'active' | 'inactive' | 'pending';
	createdAt: string;
	lastLogin?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserManagementPage: React.FC = () => {
	const theme = useTheme();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [_showCreateModal, setShowCreateModal] = useState(false);
	const [_showEditModal, setShowEditModal] = useState(false);
	const [_showDeleteModal, setShowDeleteModal] = useState(false);
	const [_selectedUser, setSelectedUser] = useState<User | null>(null);
	const [showBulkDeleteFlow, setShowBulkDeleteFlow] = useState(false);

	// Mock environment ID - in real app this would come from context or config
	const environmentId = 'dev-pingone';

	// Load users
	const loadUsers = async () => {
		try {
			setLoading(true);
			// TODO: Implement actual user loading
			// const response = await userService.getUsers();
			// setUsers(response.data);
			setUsers([]);
		} catch (error) {
			console.error('Failed to load users:', error);
		} finally {
			setLoading(false);
		}
	};

	// Load roles and statuses
	const loadRoles = async () => {
		// TODO: Implement role loading
	};

	const loadStatuses = async () => {
		// TODO: Implement status loading
	};

	useEffect(() => {
		loadUsers();
		loadRoles();
		loadStatuses();
	}, [loadRoles, loadStatuses, loadUsers]);

	// Filter users
	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	// Handle user actions
	const handleCreateUser = () => {
		setShowCreateModal(true);
	};

	const handleEditUser = (user: User) => {
		setSelectedUser(user);
		setShowEditModal(true);
	};

	const handleDeleteUser = (user: User) => {
		setSelectedUser(user);
		setShowDeleteModal(true);
	};

	const handleBulkDelete = () => {
		setShowBulkDeleteFlow(true);
	};

	const handleBulkDeleteComplete = (result: any) => {
		console.log('Bulk delete completed:', result);
		setShowBulkDeleteFlow(false);
		// Reload users to reflect changes
		loadUsers();
	};

	const handleBulkDeleteCancel = () => {
		setShowBulkDeleteFlow(false);
	};

	return (
		<PageContainer>
			<PageHeader>
				<div>
					<PageTitle theme={theme}>User Management</PageTitle>
					<PageDescription theme={theme}>
						Manage user accounts, permissions, and access controls
					</PageDescription>
				</div>
				<div style={{ display: 'flex', gap: '1rem' }}>
					<ActionButton variant="danger" onClick={handleBulkDelete}>
						<FiTrash />
						Delete All Users
					</ActionButton>
					<ActionButton variant="primary" onClick={handleCreateUser}>
						<FiPlus />
						Add User
					</ActionButton>
				</div>
			</PageHeader>

			<SearchSection>
				<SearchField>
					<SearchLabel theme={theme}>Search Users</SearchLabel>
					<UserSearchDropdown
						onUserSelect={(user) => {
							if (user) {
								setSearchTerm(user.username || user.email);
							}
						}}
						placeholder="Search by username or email..."
					/>
				</SearchField>
				<SearchField>
					<SearchLabel theme={theme}>Status Filter</SearchLabel>
					<SearchSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="pending">Pending</option>
					</SearchSelect>
				</SearchField>
			</SearchSection>

			<UserTable>
				<TableHeader>
					<div>User</div>
					<div>Status</div>
					<div>Role</div>
					<div>Created</div>
					<div>Last Login</div>
					<div>Actions</div>
				</TableHeader>
				{loading ? (
					<LoadingState theme={theme}>Loading users...</LoadingState>
				) : filteredUsers.length === 0 ? (
					<EmptyState theme={theme}>
						<FiUser size={48} style={{ marginBottom: '1rem' }} />
						<h3>No users found</h3>
						<p>
							{searchTerm || statusFilter !== 'all'
								? 'Try adjusting your search or filter criteria'
								: 'Get started by adding your first user'}
						</p>
					</EmptyState>
				) : (
					filteredUsers.map((user) => (
						<TableRow key={user.id}>
							<UserCell>
								<UserAvatar theme={theme}>{user.username.charAt(0).toUpperCase()}</UserAvatar>
								<UserInfo>
									<UserName theme={theme}>{user.username}</UserName>
									<UserEmail theme={theme}>{user.email}</UserEmail>
								</UserInfo>
							</UserCell>
							<div>
								<StatusBadge theme={theme} status={user.status}>
									{user.status}
								</StatusBadge>
							</div>
							<div>Admin</div>
							<div>{new Date(user.createdAt).toLocaleDateString()}</div>
							<div>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
							<ActionButtons>
								<IconButton variant="edit" onClick={() => handleEditUser(user)} title="Edit user">
									<FiEdit2 size={16} />
								</IconButton>
								<IconButton
									variant="delete"
									onClick={() => handleDeleteUser(user)}
									title="Delete user"
								>
									<FiTrash2 size={16} />
								</IconButton>
							</ActionButtons>
						</TableRow>
					))
				)}
			</UserTable>

			{/* TODO: Add Create/Edit/Delete Modals */}

			{/* Bulk Delete Flow */}
			{showBulkDeleteFlow && (
				<DeleteAllUsersFlow
					environmentId={environmentId}
					onComplete={handleBulkDeleteComplete}
					onCancel={handleBulkDeleteCancel}
				/>
			)}
		</PageContainer>
	);
};

export default UserManagementPage;
