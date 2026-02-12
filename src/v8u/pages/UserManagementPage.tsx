/**
 * @file UserManagementPage.tsx
 * @module v8u/pages
 * @description User management page for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiX, FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';
import { userService } from '../../protect-app/services/UserService';
import { UserSearchDropdown } from '../../protect-app/components/UserSearchDropdown';
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
		background: ${theme.colors.primary};
		color: white;
		&:hover {
			background: ${theme.colors.primaryDark || theme.colors.primary};
		}
	}
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

const UserTable = styled.div<{ theme: any }>`
	background: ${({ theme }) => theme.colors.surface};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 8px;
	overflow: hidden;
`;

const TableHeader = styled.div<{ theme: any }>
	background: ${({ theme }) => theme.colors.primaryLight};
	padding: 1rem;
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
	gap: 1rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border;
`;

const TableRow = styled.div<{ theme: any }>`
	padding: 1rem;
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr 120px;
	gap: 1rem;
	align-items: center;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
	transition: background-color 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.primaryLight};
	}

	&:last-child {
		border-bottom: none;
	}
`;

const UserCell = styled.div<{ theme: any }>`
	display: flex;
	align-items: center;
	gap: 0.75rem;
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
	font-size: 0.875rem;
	font-weight: 600;
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
`;

const UserEmail = styled.div<{ theme: any }>`
	font-size: 0.75rem;
	color: ${({ theme }) => theme.colors.textSecondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const StatusBadge = styled.span<{ theme: any; status: string }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;

	${({ status, theme }) => {
		switch (status) {
			case 'active':
				return `
					background: #dcfce7;
					color: #166534;
				`;
			case 'inactive':
				return `
					background: #fee2e2;
					color: #dc2626;
				`;
			case 'pending':
				return `
					background: #fef3c7;
					color: #d97706;
				`;
			case 'suspended':
				return `
					background: #fed7aa;
					color: #ea580c;
				`;
			default:
				return `
					background: ${theme.colors.surface};
					color: ${theme.colors.text};
				`;
		}
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const IconButton = styled.button<{ theme: any; variant?: 'edit' | 'delete' }>`
	padding: 0.5rem;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;

	${({ variant = 'edit', theme }) => `
		background: ${theme.colors.primaryLight};
		color: ${theme.colors.primary};
		&:hover {
			background: ${theme.colors.primary};
			color: white;
		}
	`}

${({ variant = 'delete', theme }) => `
		background: #fee2e2;
		color: ${theme.colors.error};
		&:hover {
			background: ${theme.colors.error};
			color: white;
		}
	`}`;

const EmptyState = styled.div<{ theme: any }>`
	text-align: center;
	padding: 3rem;
	color: ${({ theme }) => theme.colors.textSecondary;
`;

const LoadingState = styled.div<{ theme: any }>`
	text-align: center;
	padding: 3rem;
	color: ${({ theme }) => theme.colors.textSecondary;
`;

// ============================================================================
// TYPES
// ============================================================================

interface UserFormData {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	roleId: string;
	statusId: string;
	phone: string;
	department: string;
}

interface UserManagementPageProps {}

// ============================================================================
// COMPONENT
// ============================================================================

export const UserManagementPage: React.FC<UserManagementPageProps> = () => {
	const { currentTheme } = useTheme();
	const [users, setUsers] = useState<any[]>([]);
	const [roles, setRoles] = useState<any[]>([]);
	const [statuses, setStatuses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRole, setSelectedRole] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [formData, setFormData] = useState<UserFormData>({
		username: '',
		email: '',
		firstName: '',
		lastName: '',
		password: '',
		roleId: '',
		statusId: '',
		phone: '',
		department: ''
	});

	// Load initial data
	useEffect(() => {
		loadUsers();
		loadRoles();
		loadStatuses();
	}, []);

	const loadUsers = async () => {
		setIsLoading(true);
		try {
			const result = await userService.searchUsers({
				searchTerm,
				role: selectedRole,
				status: selectedStatus,
				department: selectedDepartment,
				limit: 50
			});
			setUsers(result.users);
		} catch (error) {
			console.error('Error loading users:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadRoles = async () => {
		try {
			const roles = await userService.getRoles();
			setRoles(roles);
		} catch (error) {
			console.error('Error loading roles:', error);
		}
	};

	const loadStatuses = async () => {
		try {
			const statuses = await userService.getStatuses();
			setStatuses(statuses);
		} catch (error) {
			console.error('Error loading statuses:', error);
		}
	};

	const handleCreateUser = async () => {
		try {
			const newUser = await userService.createUser(formData);
			setUsers(prev => [...prev, newUser]);
			setShowCreateModal(false);
			resetForm();
		} catch (error) {
			console.error('Error creating user:', error);
		}
	};

	const handleUpdateUser = async () => {
		if (!selectedUser) return;
		
		try {
			const updatedUser = await userService.updateUser(selectedUser.id, {
				email: formData.email,
				firstName: formData.firstName,
				lastName: formData.lastName,
				roleId: formData.roleId,
				statusId: formData.statusId,
				phone: formData.phone,
				department: formData.department
			});
			setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
			setShowEditModal(false);
			resetForm();
		} catch (error) {
			console.error('Error updating user:', error);
		}
	};

	const handleDeleteUser = async () => {
		if (!selectedUser) return;
		
		try {
			await userService.deleteUser(selectedUser.id);
			setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
			setShowDeleteModal(false);
			setSelectedUser(null);
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	};

	const handleEditUser = (user: any) => {
		setSelectedUser(user);
		setFormData({
			username: user.username,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			password: '',
			roleId: user.role.id,
			statusId: user.status.id,
			phone: user.phone || '',
			department: user.department || ''
		});
		setShowEditModal(true);
	};

	const handleDeleteClick = (user: any) => {
		setSelectedUser(user);
		setShowDeleteModal(true);
	};

	const resetForm = () => {
		setFormData({
			username: '',
			email: '',
			firstName: '',
			lastName: '',
			password: '',
			roleId: '',
			statusId: '',
			phone: '',
			department: ''
		});
		setSelectedUser(null);
	};

	const handleFormChange = (field: keyof UserFormData, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const departments = ['IT', 'Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations'];

	return (
		<PageContainer>
			<PageHeader>
				<div>
					<PageTitle theme={currentTheme}>User Management</PageTitle>
					<PageDescription theme={currentTheme}>
						Manage users, roles, and permissions
					</PageDescription>
				</div>
				<ActionButton theme={currentTheme} variant="primary" onClick={() => setShowCreateModal(true)}>
					<FiPlus />
					Create User
				</ActionButton>
			</PageHeader>

			<SearchSection theme={currentTheme}>
				<SearchField>
					<SearchLabel theme={currentTheme}>Search Users</SearchLabel>
					<UserSearchDropdown
						value={searchTerm}
						onChange={setSearchTerm}
						placeholder="Search by name, email, or username..."
					/>
				</SearchField>
				<SearchField>
					<SearchLabel theme={currentTheme}>Role</SearchLabel>
					<SearchSelect theme={currentTheme} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
						<option value="">All Roles</option>
						{roles.map(role => (
							<option key={role.id} value={role.id}>{role.name}</option>
						))}
					</SearchSelect>
				</SearchField>
				<SearchField>
					<SearchLabel theme={currentTheme}>Status</SearchLabel>
					<SearchSelect theme={currentTheme} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
						<option value="">All Statuses</option>
						{statuses.map(status => (
							<option key={status.id} value={status.id}>{status.name}</option>
						))}
					</SearchSelect>
				</SearchField>
				<SearchField>
					<SearchLabel theme={currentTheme}>Department</SearchLabel>
					<SearchSelect theme={currentTheme} value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
						<option value="">All Departments</option>
						{departments.map(dept => (
							<option key={dept} value={dept}>{dept}</option>
						))}
					</SearchSelect>
				</SearchField>
			</SearchSection>

			<UserTable theme={currentTheme}>
				<TableHeader theme={currentTheme}>
					<div>User</div>
					<div>Role</div>
					<div>Status</div>
					<div>Department</div>
					<div>Actions</div>
				</TableHeader>

				{isLoading ? (
					<LoadingState theme={currentTheme}>
						<FiUser size={48} style={{ margin: '0 auto 1rem' }} />
						Loading users...
					</LoadingState>
				) : users.length === 0 ? (
					<EmptyState theme={currentTheme}>
						<FiUser size={48} style={{ margin: '0 auto 1rem' }} />
						No users found
					</EmptyState>
				) : (
					users.map((user: any) => (
						<TableRow key={user.id} theme={currentTheme}>
							<UserCell theme={currentTheme}>
								<UserAvatar theme={currentTheme}>
									{user.firstName.charAt(0)}{user.lastName.charAt(0)}
								</UserAvatar>
								<UserInfo>
									<UserName theme={currentTheme}>
										{user.firstName} {user.lastName}
									</UserName>
									<UserEmail theme={currentTheme}>
										{user.email}
									</UserEmail>
								</UserInfo>
							</UserCell>
							<div>{user.role.name}</div>
							<StatusBadge theme={currentTheme} status={user.status.id}>
								{user.status.name}
							</StatusBadge>
							<div>{user.department || '-'}</div>
							<div>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
							<ActionButtons>
								<IconButton theme={currentTheme} variant="edit" onClick={() => handleEditUser(user)}>
									<FiEdit2 size={16} />
								</IconButton>
								<IconButton theme={currentTheme} variant="delete" onClick={() => handleDeleteClick(user)}>
									<FiTrash2 size={16} />
								</IconButton>
							</ActionButtons>
						</TableRow>
					))
				)}
			</UserTable>

			{/* Create User Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold text-gray-900">Create New User</h2>
							<button
								onClick={() => setShowCreateModal(false)}
								className="text-gray-400 hover:text-gray-600 p-2"
							>
								<FiX size={20} />
							</button>
						</div>
						<form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
							<div className="space-y-4">
								<div>
									<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
										Username
									</label>
									<input
										id="username"
										type="text"
										value={formData.username}
										onChange={(e) => handleFormChange('username', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter username"
									style={{
										backgroundColor: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									/>
								</div>
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) => handleFormChange('email', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter email"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									/>
								</div>
								<div>
									<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
										First Name
									</label>
									<input
										id="firstName"
										type="text"
										value={formData.firstName}
										onChange={(e) => handleFormChange('firstName', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter first name"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									/>
								</div>
								<div>
									<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
										Last Name
									</label>
									<input
										id="lastName"
										type="text"
										value={formData.lastName}
										onChange={(e) => handleFormChange('lastName', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter last name"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									/>
								</div>
								<div>
									<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
										Password
									</label>
									<input
										id="password"
										type="password"
										value={formData.password}
										onChange={(e) => handleFormChange('password', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter password"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									/>
								</div>
								<div>
									<label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
										Role
									</label>
									<select
										id="roleId"
										value={formData.roleId}
										onChange={(e) => handleFormChange('roleId', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									>
										<option value="">Select a role</option>
										{roles.map(role => (
											<option key={role.id} value={role.id}>{role.name}</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
										Department
									</label>
									<select
										id="department"
										value={formData.department}
										onChange={(e) => handleFormChange('department', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									>
										<option value="">Select a department</option>
										{departments.map(dept => (
											<option key={dept} value={dept}>{dept}</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
										Phone (optional)
									</label>
									<input
										id="phone"
										type="tel"
										value={formData.phone}
										onChange={(e) => handleFormChange('phone', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter phone number"
										style={{
										background: currentTheme.colors.background,
										borderColor: currentTheme.colors.border,
										color: currentTheme.colors.text,
									}}
									/>
								</div>
								<FormActions>
									<button
										type="button"
										onClick={() => setShowCreateModal(false)}
										className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
									type="button"
								>
									Cancel
								</button>
									<button
										type="submit"
										className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
										type="submit"
									>
										<FiPlus />
										Create User
									</button>
								</FormActions>
							</form>
					</div>
				</div>
			)}

			{/* Edit User Modal */}
			{showEditModal && selectedUser && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold text-gray-900">Edit User</h2>
							<button
								onClick={() => setShowEditModal(false)}
								className="text-gray-400 hover:text-gray-600 p-2"
							>
								<FiX size={20} />
							</button>
						</div>
						<form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
							<div className="space-y-4">
								<div>
									<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
										Username
									</label>
									<input
										id="username"
										type="text"
										value={formData.username}
										disabled
										className="w-full px-3 py-2 border-gray-300 rounded-md bg-gray-100 text-gray-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									/>
								</div>
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) => handleFormChange('email', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									/>
								</div>
								<div>
									<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
										First Name
									</label>
									<input
										id="firstName"
										type="text"
										value={formData.firstName}
										onChange={(e) => handleFormChange('firstName', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									/>
								</div>
								<div>
									<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
										Last Name
									</label>
									<input
										id="lastName"
										type="text"
										value={formData.lastName}
										onChange={(e) => handleFormChange('lastName', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									/>
								</div>
								<div>
									<label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
										Role
									</label>
									<select
										id="roleId"
										value={formData.roleId}
										onChange={(e) => handleFormChange('roleId', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									>
										<option value="">Select a role</option>
										{roles.map(role => (
											<option key={role.id} value={role.id}>{role.name}</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="statusId" className="block text-sm font-medium text-gray-700 mb-2">
										Status
									</label>
									<select
										id="statusId"
										value={formData.statusId}
										onChange={(e) => handleFormChange('statusId', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									>
										<option value="">Select a status</option>
										{statuses.map(status => (
											<option key={status.id} value={status.id}>{status.name}</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
										Department
									</label>
									<select
										id="department"
										value={formData.department}
										onChange={(e) => handleFormChange('department', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									>
										<option value="">Select a department</option>
										{departments.map(dept => (
											<option key={dept} value={dept}>{dept}</option>
										))}
									</select>
								</div>
								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
										Phone (optional)
									</label>
									<input
										id="phone"
										type="tel"
										value={formData.phone}
										onChange={(e) => handleFormChange('phone', e.target.value)}
										className="w-full px-3 py-2 border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										style={{
											background: currentTheme.colors.background,
											borderColor: currentTheme.colors.border,
											color: currentTheme.colors.text,
										}}
									/>
								</div>
								<FormActions>
									<button
										type="button"
										onClick={() => setShowEditModal(false)}
										className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
										type="button"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
										type="submit"
									>
										<FiEdit2 />
										Update User
									</button>
								</FormActions>
							</form>
					</div>
				</div>
			)}

			{/* Delete User Modal */}
			{showDeleteModal && selectedUser && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold text-gray-900">Delete User</h2>
							<button
								onClick={() => setShowDeleteModal(false)}
								className="text-gray-400 hover:text-gray-600 p-2"
							>
								<FiX size={20} />
							</button>
						</div>
						<div className="mb-4">
							<p style={{ color: currentTheme.colors.text, marginBottom: '1rem' }}>
								Are you sure you want to delete this user?
							</p>
							<div
								style={{
									padding: '1rem',
									background: currentTheme.colors.primaryLight,
									borderRadius: currentTheme.borderRadius.md,
									marginBottom: '1rem',
								}}
							>
								<strong>{selectedUser.firstName} {selectedUser.lastName}</strong><br />
								{selectedUser.email}<br />
								{selectedUser.username}
							</div>
							<p style={{ color: currentTheme.colors.error, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiAlertTriangle />
								This action cannot be undone.
							</p>
						</div>
						<FormActions>
							<button
								onClick={() => setShowDeleteModal(false)}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
								type="button"
							>
								<FiTrash2 />
								Delete User
							</button>
							<button
								onClick={() => setShowDeleteModal(false)}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
								type="button"
							>
								Cancel
							</button>
						</FormActions>
					</div>
				</div>
			)}
		</PageContainer>
	);
};
