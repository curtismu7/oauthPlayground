/**
 * @file UserManagementPage.tsx
 * @module protect-app/pages
 * @description Comprehensive user management page with CRUD operations
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Follows SWE-15 principles:
 * - Single Responsibility: Only handles user management operations
 * - Interface Segregation: Focused components for each operation
 * - Dependency Inversion: Depends on UserService abstraction
 * - Open/Closed: Extensible for new user operations
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiEdit2, FiPlus, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { PageApiInfo } from '../components/common/PageApiInfo';
import { UserSearchDropdown } from '../components/UserSearchDropdown';
import { useTheme } from '../contexts/ThemeContext';
import { User, UserRole, UserStatus, userService } from '../services/UserService';

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
	border-radius: ${({ theme }) => theme.borderRadius.md};
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
						background: ${theme.colors.primaryDark};
					}
				`;
			case 'secondary':
				return `
					background: ${theme.colors.surface};
					color: ${theme.colors.text};
					border: 1px solid ${theme.colors.border};
					&:hover {
						background: ${theme.colors.primaryLight};
					}
				`;
			case 'danger':
				return `
					background: ${theme.colors.error};
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
	border-radius: ${({ theme }) => theme.borderRadius.md};
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
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.text};

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
	}
`;

const UserTable = styled.div<{ theme: any }>`
	background: ${({ theme }) => theme.colors.surface};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
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
	border-radius: ${({ theme }) => theme.borderRadius.pill};
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
	}}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const IconButton = styled.button<{ theme: any; variant?: 'edit' | 'delete' }>`
	padding: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;

	${({ variant = 'edit', theme }) => {
		switch (variant) {
			case 'edit':
				return `
					background: ${theme.colors.primaryLight};
					color: ${theme.colors.primary};
					&:hover {
						background: ${theme.colors.primary};
						color: white;
					}
				`;
			case 'delete':
				return `
					background: #fee2e2;
					color: ${theme.colors.error};
					&:hover {
						background: ${theme.colors.error};
						color: white;
					}
				`;
			default:
				return '';
		}
	}}
`;

const Modal = styled.div<{ theme: any }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ModalContent = styled.div<{ theme: any }>`
	background: ${({ theme }) => theme.colors.surface};
	border-radius: ${({ theme }) => theme.borderRadius.lg};
	padding: 2rem;
	max-width: 500px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
`;

const ModalHeader = styled.div<{ theme: any }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2<{ theme: any }>`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text};
	margin: 0;
`;

const ModalClose = styled.button<{ theme: any }>`
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	color: ${({ theme }) => theme.colors.textSecondary};
	transition: all 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.primaryLight};
		color: ${({ theme }) => theme.colors.text};
	}
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const FormLabel = styled.label<{ theme: any }>`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
`;

const FormInput = styled.input<{ theme: any }>`
	padding: 0.75rem;
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.text};

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
	}
`;

const FormSelect = styled.select<{ theme: any }>`
	padding: 0.75rem;
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.text};

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
	}
`;

const FormActions = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
	margin-top: 1rem;
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

type UserManagementPageProps = {};

// ============================================================================
// COMPONENT
// ============================================================================

export const UserManagementPage: React.FC<UserManagementPageProps> = () => {
	const { currentTheme } = useTheme();
	const [users, setUsers] = useState<User[]>([]);
	const [roles, setRoles] = useState<UserRole[]>([]);
	const [statuses, setStatuses] = useState<UserStatus[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRole, setSelectedRole] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [formData, setFormData] = useState<UserFormData>({
		username: '',
		email: '',
		firstName: '',
		lastName: '',
		password: '',
		roleId: '',
		statusId: '',
		phone: '',
		department: '',
	});

	// Load initial data
	useEffect(() => {
		loadUsers();
		loadRoles();
		loadStatuses();
	}, [loadRoles, loadStatuses, loadUsers]);

	const loadUsers = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await userService.searchUsers({
				searchTerm,
				role: selectedRole,
				status: selectedStatus,
				department: selectedDepartment,
				limit: 50,
			});
			setUsers(result.users);
		} catch (error) {
			console.error('Error loading users:', error);
		} finally {
			setIsLoading(false);
		}
	}, [searchTerm, selectedRole, selectedStatus, selectedDepartment]);

	const loadRoles = useCallback(async () => {
		try {
			const roles = await userService.getRoles();
			setRoles(roles);
		} catch (error) {
			console.error('Error loading roles:', error);
		}
	}, []);

	const loadStatuses = useCallback(async () => {
		try {
			const statuses = await userService.getStatuses();
			setStatuses(statuses);
		} catch (error) {
			console.error('Error loading statuses:', error);
		}
	}, []);

	const handleCreateUser = useCallback(async () => {
		try {
			const newUser = await userService.createUser(formData);
			setUsers((prev) => [...prev, newUser]);
			setShowCreateModal(false);
			resetForm();
		} catch (error) {
			console.error('Error creating user:', error);
		}
	}, [formData, resetForm]);

	const handleUpdateUser = useCallback(async () => {
		if (!selectedUser) return;

		try {
			const updatedUser = await userService.updateUser(selectedUser.id, {
				email: formData.email,
				firstName: formData.firstName,
				lastName: formData.lastName,
				roleId: formData.roleId,
				statusId: formData.statusId,
				phone: formData.phone,
				department: formData.department,
			});
			setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
			setShowEditModal(false);
			resetForm();
		} catch (error) {
			console.error('Error updating user:', error);
		}
	}, [selectedUser, formData, resetForm]);

	const handleDeleteUser = useCallback(async () => {
		if (!selectedUser) return;

		try {
			await userService.deleteUser(selectedUser.id);
			setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
			setShowDeleteModal(false);
			setSelectedUser(null);
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}, [selectedUser]);

	const handleEditUser = useCallback((user: User) => {
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
			department: user.department || '',
		});
		setShowEditModal(true);
	}, []);

	const handleDeleteClick = useCallback((user: User) => {
		setSelectedUser(user);
		setShowDeleteModal(true);
	}, []);

	const resetForm = useCallback(() => {
		setFormData({
			username: '',
			email: '',
			firstName: '',
			lastName: '',
			password: '',
			roleId: '',
			statusId: '',
			phone: '',
			department: '',
		});
		setSelectedUser(null);
	}, []);

	const handleFormChange = useCallback((field: keyof UserFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

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
				<ActionButton
					theme={currentTheme}
					variant="primary"
					onClick={() => setShowCreateModal(true)}
				>
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
					<SearchSelect
						theme={currentTheme}
						value={selectedRole}
						onChange={(e) => setSelectedRole(e.target.value)}
					>
						<option value="">All Roles</option>
						{roles.map((role) => (
							<option key={role.id} value={role.id}>
								{role.name}
							</option>
						))}
					</SearchSelect>
				</SearchField>
				<SearchField>
					<SearchLabel theme={currentTheme}>Status</SearchLabel>
					<SearchSelect
						theme={currentTheme}
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
					>
						<option value="">All Statuses</option>
						{statuses.map((status) => (
							<option key={status.id} value={status.id}>
								{status.name}
							</option>
						))}
					</SearchSelect>
				</SearchField>
				<SearchField>
					<SearchLabel theme={currentTheme}>Department</SearchLabel>
					<SearchSelect
						theme={currentTheme}
						value={selectedDepartment}
						onChange={(e) => setSelectedDepartment(e.target.value)}
					>
						<option value="">All Departments</option>
						{departments.map((dept) => (
							<option key={dept} value={dept}>
								{dept}
							</option>
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
					<div>Last Login</div>
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
					users.map((user) => (
						<TableRow key={user.id} theme={currentTheme}>
							<UserCell theme={currentTheme}>
								<UserAvatar theme={currentTheme}>
									{user.firstName.charAt(0)}
									{user.lastName.charAt(0)}
								</UserAvatar>
								<UserInfo>
									<UserName theme={currentTheme}>
										{user.firstName} {user.lastName}
									</UserName>
									<UserEmail theme={currentTheme}>{user.email}</UserEmail>
								</UserInfo>
							</UserCell>
							<div>{user.role.name}</div>
							<StatusBadge theme={currentTheme} status={user.status.id}>
								{user.status.name}
							</StatusBadge>
							<div>{user.department || '-'}</div>
							<div>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
							<ActionButtons>
								<IconButton
									theme={currentTheme}
									variant="edit"
									onClick={() => handleEditUser(user)}
								>
									<FiEdit2 size={16} />
								</IconButton>
								<IconButton
									theme={currentTheme}
									variant="delete"
									onClick={() => handleDeleteClick(user)}
								>
									<FiTrash2 size={16} />
								</IconButton>
							</ActionButtons>
						</TableRow>
					))
				)}
			</UserTable>

			{/* Create User Modal */}
			{showCreateModal && (
				<Modal theme={currentTheme}>
					<ModalContent theme={currentTheme}>
						<ModalHeader theme={currentTheme}>
							<ModalTitle theme={currentTheme}>Create New User</ModalTitle>
							<ModalClose theme={currentTheme} onClick={() => setShowCreateModal(false)}>
								<FiX size={20} />
							</ModalClose>
						</ModalHeader>
						<Form
							onSubmit={(e) => {
								e.preventDefault();
								handleCreateUser();
							}}
						>
							<FormField>
								<FormLabel theme={currentTheme}>Username</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.username}
									onChange={(e) => handleFormChange('username', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Email</FormLabel>
								<FormInput
									theme={currentTheme}
									type="email"
									value={formData.email}
									onChange={(e) => handleFormChange('email', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>First Name</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.firstName}
									onChange={(e) => handleFormChange('firstName', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Last Name</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.lastName}
									onChange={(e) => handleFormChange('lastName', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Password</FormLabel>
								<FormInput
									theme={currentTheme}
									type="password"
									value={formData.password}
									onChange={(e) => handleFormChange('password', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Role</FormLabel>
								<FormSelect
									theme={currentTheme}
									value={formData.roleId}
									onChange={(e) => handleFormChange('roleId', e.target.value)}
									required
								>
									<option value="">Select a role</option>
									{roles.map((role) => (
										<option key={role.id} value={role.id}>
											{role.name}
										</option>
									))}
								</FormSelect>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Department</FormLabel>
								<FormSelect
									theme={currentTheme}
									value={formData.department}
									onChange={(e) => handleFormChange('department', e.target.value)}
								>
									<option value="">Select a department</option>
									{departments.map((dept) => (
										<option key={dept} value={dept}>
											{dept}
										</option>
									))}
								</FormSelect>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Phone</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.phone}
									onChange={(e) => handleFormChange('phone', e.target.value)}
								/>
							</FormField>
							<FormActions>
								<ActionButton
									theme={currentTheme}
									variant="secondary"
									type="button"
									onClick={() => setShowCreateModal(false)}
								>
									Cancel
								</ActionButton>
								<ActionButton theme={currentTheme} variant="primary" type="submit">
									<FiPlus />
									Create User
								</ActionButton>
							</FormActions>
						</Form>
					</ModalContent>
				</Modal>
			)}

			{/* Edit User Modal */}
			{showEditModal && selectedUser && (
				<Modal theme={currentTheme}>
					<ModalContent theme={currentTheme}>
						<ModalHeader theme={currentTheme}>
							<ModalTitle theme={currentTheme}>Edit User</ModalTitle>
							<ModalClose theme={currentTheme} onClick={() => setShowEditModal(false)}>
								<FiX size={20} />
							</ModalClose>
						</ModalHeader>
						<Form
							onSubmit={(e) => {
								e.preventDefault();
								handleUpdateUser();
							}}
						>
							<FormField>
								<FormLabel theme={currentTheme}>Username</FormLabel>
								<FormInput theme={currentTheme} value={formData.username} disabled />
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Email</FormLabel>
								<FormInput
									theme={currentTheme}
									type="email"
									value={formData.email}
									onChange={(e) => handleFormChange('email', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>First Name</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.firstName}
									onChange={(e) => handleFormChange('firstName', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Last Name</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.lastName}
									onChange={(e) => handleFormChange('lastName', e.target.value)}
									required
								/>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Role</FormLabel>
								<FormSelect
									theme={currentTheme}
									value={formData.roleId}
									onChange={(e) => handleFormChange('roleId', e.target.value)}
									required
								>
									{roles.map((role) => (
										<option key={role.id} value={role.id}>
											{role.name}
										</option>
									))}
								</FormSelect>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Status</FormLabel>
								<FormSelect
									theme={currentTheme}
									value={formData.statusId}
									onChange={(e) => handleFormChange('statusId', e.target.value)}
									required
								>
									{statuses.map((status) => (
										<option key={status.id} value={status.id}>
											{status.name}
										</option>
									))}
								</FormSelect>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Department</FormLabel>
								<FormSelect
									theme={currentTheme}
									value={formData.department}
									onChange={(e) => handleFormChange('department', e.target.value)}
								>
									<option value="">Select a department</option>
									{departments.map((dept) => (
										<option key={dept} value={dept}>
											{dept}
										</option>
									))}
								</FormSelect>
							</FormField>
							<FormField>
								<FormLabel theme={currentTheme}>Phone</FormLabel>
								<FormInput
									theme={currentTheme}
									value={formData.phone}
									onChange={(e) => handleFormChange('phone', e.target.value)}
								/>
							</FormField>
							<FormActions>
								<ActionButton
									theme={currentTheme}
									variant="secondary"
									type="button"
									onClick={() => setShowEditModal(false)}
								>
									Cancel
								</ActionButton>
								<ActionButton theme={currentTheme} variant="primary" type="submit">
									<FiEdit2 />
									Update User
								</ActionButton>
							</FormActions>
						</Form>
					</ModalContent>
				</Modal>
			)}

			{/* Delete User Modal */}
			{showDeleteModal && selectedUser && (
				<Modal theme={currentTheme}>
					<ModalContent theme={currentTheme}>
						<ModalHeader theme={currentTheme}>
							<ModalTitle theme={currentTheme}>Delete User</ModalTitle>
							<ModalClose theme={currentTheme} onClick={() => setShowDeleteModal(false)}>
								<FiX size={20} />
							</ModalClose>
						</ModalHeader>
						<div style={{ marginBottom: '1.5rem' }}>
							<p style={{ color: currentTheme.colors.text, marginBottom: '1rem' }}>
								Are you sure you want to delete this user?
							</p>
							<div
								style={{
									padding: '1rem',
									background: currentTheme.colors.primaryLight,
									borderRadius: currentTheme.borderRadius.md,
								}}
							>
								<strong>
									{selectedUser.firstName} {selectedUser.lastName}
								</strong>
								<br />
								{selectedUser.email}
								<br />
								{selectedUser.username}
							</div>
							<p
								style={{
									color: currentTheme.colors.error,
									marginTop: '1rem',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiAlertTriangle />
								This action cannot be undone.
							</p>
						</div>
						<FormActions>
							<ActionButton
								theme={currentTheme}
								variant="secondary"
								type="button"
								onClick={() => setShowDeleteModal(false)}
							>
								Cancel
							</ActionButton>
							<ActionButton
								theme={currentTheme}
								variant="danger"
								type="button"
								onClick={handleDeleteUser}
							>
								<FiTrash2 />
								Delete User
							</ActionButton>
						</FormActions>
					</ModalContent>
				</Modal>
			)}

			{/* Page API Info */}
			<PageApiInfo pageName="User Management" />
		</PageContainer>
	);
};
