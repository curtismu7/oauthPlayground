/**
 * @file UserManagementPage.tsx
 * @module v8u/pages
 * @description User management page for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */


import React, { useCallback, useEffect, useState } from 'react';
import { createModuleLogger } from '../../utils/consoleMigrationHelper';
import { UserSearchDropdownV8 } from '../../v8/components/UserSearchDropdownV8';
import { EnvironmentIdServiceV8 } from '../../v8/services/environmentIdServiceV8';
import { useTheme } from '../contexts/ThemeContext';

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
	const [environmentId, setEnvironmentId] = useState<string>('');

	// Load environment ID
	useEffect(() => {
		const envId = EnvironmentIdServiceV8.getEnvironmentId();
		setEnvironmentId(envId || '');
	}, []);

	// Load users
	const loadUsers = useCallback(async () => {
		try {
			setLoading(true);
			// TODO: Implement actual user loading
			// const response = await userService.getUsers();
			// setUsers(response.data);
			setUsers([]);
		} catch (error) {
			log.error('UserManagementPage', 'Failed to load users:', undefined, error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Load roles and statuses
	const loadRoles = useCallback(async () => {
		// TODO: Implement role loading
	}, []);

	const loadStatuses = useCallback(async () => {
		// TODO: Implement status loading
	}, []);

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

	// Event handlers
	const handleCreateUser = () => {
		// TODO: Implement create user modal
		console.log('Create user clicked');
	};

	const handleEditUser = (user: User) => {
		// TODO: Implement edit user modal
		console.log('Edit user:', user);
	};

	const handleDeleteUser = (user: User) => {
		// TODO: Implement delete user modal
		console.log('Delete user:', user);
	};

	// Helper functions
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return theme.currentTheme.colors.success;
			case 'inactive':
				return theme.currentTheme.colors.error;
			case 'pending':
				return theme.currentTheme.colors.warning;
			default:
				return theme.currentTheme.colors.primary;
		}
	};

	const getInitials = (username: string) => {
		return username.slice(0, 2).toUpperCase();
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
			{/* Page Header */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: '1rem',
				}}
			>
				<div>
					<h1
						style={{
							fontSize: '2rem',
							fontWeight: '700',
							color: theme.currentTheme.colors.text,
							margin: 0,
						}}
					>
						User Management
					</h1>
					<p style={{ color: theme.currentTheme.colors.secondary, margin: 0 }}>
						Manage application users and their permissions
					</p>
				</div>
				<button
					type="button"
					onClick={handleCreateUser}
					style={{
						padding: '0.75rem 1.5rem',
						borderRadius: '8px',
						fontWeight: '600',
						fontSize: '0.875rem',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						background: theme.currentTheme.colors.primary,
						color: 'white',
					}}
				>
					<span>➕</span>
					Add User
				</button>
			</div>

			{/* Search Section */}
			<div
				style={{
					background: theme.currentTheme.colors.surface,
					border: `1px solid ${theme.currentTheme.colors.primary}`,
					borderRadius: '8px',
					padding: '1.5rem',
					display: 'flex',
					gap: '1rem',
					alignItems: 'flex-end',
					flexWrap: 'wrap',
				}}
			>
				<div style={{ flex: 1, minWidth: '200px' }}>
					<label
						htmlFor="user-search-dropdown"
						style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: theme.currentTheme.colors.text,
							marginBottom: '0.5rem',
						}}
					>
						Search Users
					</label>
					<UserSearchDropdownV8
						id="user-search-dropdown"
						environmentId={environmentId}
						value={searchTerm}
						onChange={setSearchTerm}
						placeholder="Search by username or email..."
						onGetToken={() => {
							console.log('Worker token required for user search in UserManagementPage');
						}}
					/>
				</div>
				<div style={{ flex: 1, minWidth: '200px' }}>
					<label
						htmlFor="status-filter-select"
						style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: theme.currentTheme.colors.text,
							marginBottom: '0.5rem',
						}}
					>
						Status Filter
					</label>
					<select
						id="status-filter-select"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						style={{
							width: '100%',
							padding: '0.75rem',
							background: theme.currentTheme.colors.background,
							border: `1px solid ${theme.currentTheme.colors.primary}`,
							borderRadius: '8px',
							fontSize: '0.875rem',
							color: theme.currentTheme.colors.text,
						}}
					>
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="pending">Pending</option>
					</select>
				</div>
			</div>

			{/* User Table */}
			<div
				style={{
					background: theme.currentTheme.colors.surface,
					border: `1px solid ${theme.currentTheme.colors.primary}`,
					borderRadius: '8px',
					overflow: 'hidden',
				}}
			>
				{/* Table Header */}
				<div
					style={{
						background: theme.currentTheme.colors.primary,
						padding: '1rem',
						display: 'grid',
						gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
						gap: '1rem',
						fontWeight: '600',
						color: theme.currentTheme.colors.text,
						borderBottom: `1px solid ${theme.currentTheme.colors.primary}`,
					}}
				>
					<div>User</div>
					<div>Status</div>
					<div>Created</div>
					<div>Last Login</div>
					<div>Role</div>
					<div>Actions</div>
				</div>

				{loading ? (
					<div
						style={{
							textAlign: 'center',
							padding: '3rem',
							color: theme.currentTheme.colors.secondary,
						}}
					>
						Loading users...
					</div>
				) : filteredUsers.length === 0 ? (
					<div
						style={{
							textAlign: 'center',
							padding: '3rem',
							color: theme.currentTheme.colors.secondary,
						}}
					>
						{searchTerm || statusFilter !== 'all'
							? 'No users found matching your criteria.'
							: 'No users found.'}
					</div>
				) : (
					filteredUsers.map((user) => (
						<div
							key={user.id}
							style={{
								padding: '1rem',
								display: 'grid',
								gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
								gap: '1rem',
								alignItems: 'center',
								borderBottom: `1px solid ${theme.currentTheme.colors.primary}`,
							}}
						>
							{/* User Cell */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									flexShrink: 0,
									minWidth: 0,
								}}
							>
								<div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '50%',
										background: theme.currentTheme.colors.primary,
										color: 'white',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: '600',
										fontSize: '0.875rem',
										flexShrink: 0,
									}}
								>
									{getInitials(user.username)}
								</div>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											fontWeight: '600',
											color: theme.currentTheme.colors.text,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											fontSize: '0.875rem',
										}}
									>
										{user.username}
									</div>
									<div
										style={{
											color: theme.currentTheme.colors.secondary,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											fontSize: '0.875rem',
										}}
									>
										{user.email}
									</div>
								</div>
							</div>

							{/* Status Badge */}
							<span
								style={{
									padding: '0.25rem 0.75rem',
									borderRadius: '9999px',
									fontSize: '0.75rem',
									fontWeight: '600',
									textTransform: 'uppercase',
									letterSpacing: '0.025em',
									background: getStatusColor(user.status),
									color: 'white',
								}}
							>
								{user.status}
							</span>

							{/* Created Date */}
							<div style={{ color: theme.currentTheme.colors.text, fontSize: '0.875rem' }}>
								{new Date(user.createdAt).toLocaleDateString()}
							</div>

							{/* Last Login */}
							<div style={{ color: theme.currentTheme.colors.text, fontSize: '0.875rem' }}>
								{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
							</div>

							{/* Role */}
							<div style={{ color: theme.currentTheme.colors.text, fontSize: '0.875rem' }}>
								User
							</div>

							{/* Action Buttons */}
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<button
									type="button"
									onClick={() => handleEditUser(user)}
									title="Edit User"
									style={{
										padding: '0.5rem',
										borderRadius: '6px',
										border: 'none',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: theme.currentTheme.colors.primary,
										color: 'white',
									}}
								>
									<span>❓</span>
								</button>
								<button
									type="button"
									onClick={() => handleDeleteUser(user)}
									title="Delete User"
									style={{
										padding: '0.5rem',
										borderRadius: '6px',
										border: 'none',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: '#ef4444',
										color: 'white',
									}}
								>
									<span>🗑️</span>
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default UserManagementPage;
