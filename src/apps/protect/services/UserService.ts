/**
 * @file UserService.ts
 * @module protect-app/services
 * @description User management service for Protect Portal
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Services:
 * - User CRUD operations (Create, Read, Update, Delete)
 * - User search and filtering
 * - User role management
 * - User validation and business logic
 */

const MODULE_TAG = '[👤 USER-SERVICE]';

export interface User {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	status: UserStatus;
	createdAt: string;
	updatedAt: string;
	lastLogin?: string;
	phone?: string;
	department?: string;
}

export interface UserRole {
	id: string;
	name: string;
	description: string;
	permissions: string[];
}

export interface UserStatus {
	id: string;
	name: string;
	description: string;
	color: string;
}

export interface CreateUserRequest {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	roleId: string;
	phone?: string;
	department?: string;
}

export interface UpdateUserRequest {
	email?: string;
	firstName?: string;
	lastName?: string;
	roleId?: string;
	statusId?: string;
	phone?: string;
	department?: string;
}

export interface UserSearchRequest {
	searchTerm?: string;
	role?: string;
	status?: string;
	department?: string;
	limit?: number;
	offset?: number;
}

export interface UserSearchResult {
	users: User[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
}

// Mock data for development (replace with real API calls)
const mockUsers: User[] = [
	{
		id: '1',
		username: 'admin',
		email: 'admin@company.com',
		firstName: 'System',
		lastName: 'Administrator',
		role: {
			id: 'admin',
			name: 'Administrator',
			description: 'Full system access',
			permissions: ['*'],
		},
		status: { id: 'active', name: 'Active', description: 'User is active', color: 'green' },
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		lastLogin: '2024-02-12T10:30:00Z',
		department: 'IT',
	},
	{
		id: '2',
		username: 'jsmith',
		email: 'jsmith@company.com',
		firstName: 'John',
		lastName: 'Smith',
		role: {
			id: 'user',
			name: 'User',
			description: 'Standard user access',
			permissions: ['read', 'write'],
		},
		status: { id: 'active', name: 'Active', description: 'User is active', color: 'green' },
		createdAt: '2024-01-15T00:00:00Z',
		updatedAt: '2024-01-15T00:00:00Z',
		lastLogin: '2024-02-11T15:45:00Z',
		department: 'Sales',
	},
	{
		id: '3',
		username: 'mjones',
		email: 'mjones@company.com',
		firstName: 'Mary',
		lastName: 'Jones',
		role: {
			id: 'manager',
			name: 'Manager',
			description: 'Team management access',
			permissions: ['read', 'write', 'manage'],
		},
		status: { id: 'active', name: 'Active', description: 'User is active', color: 'green' },
		createdAt: '2024-01-20T00:00:00Z',
		updatedAt: '2024-01-20T00:00:00Z',
		lastLogin: '2024-02-12T09:15:00Z',
		department: 'Marketing',
	},
	{
		id: '4',
		username: 'rbrown',
		email: 'rbrown@company.com',
		firstName: 'Robert',
		lastName: 'Brown',
		role: {
			id: 'user',
			name: 'User',
			description: 'Standard user access',
			permissions: ['read', 'write'],
		},
		status: { id: 'inactive', name: 'Inactive', description: 'User is inactive', color: 'red' },
		createdAt: '2024-01-25T00:00:00Z',
		updatedAt: '2024-02-01T00:00:00Z',
		lastLogin: '2024-01-30T14:20:00Z',
		department: 'Engineering',
	},
];

const mockRoles: UserRole[] = [
	{ id: 'admin', name: 'Administrator', description: 'Full system access', permissions: ['*'] },
	{
		id: 'manager',
		name: 'Manager',
		description: 'Team management access',
		permissions: ['read', 'write', 'manage'],
	},
	{ id: 'user', name: 'User', description: 'Standard user access', permissions: ['read', 'write'] },
	{ id: 'viewer', name: 'Viewer', description: 'Read-only access', permissions: ['read'] },
];

const mockStatuses: UserStatus[] = [
	{ id: 'active', name: 'Active', description: 'User is active', color: 'green' },
	{ id: 'inactive', name: 'Inactive', description: 'User is inactive', color: 'red' },
	{ id: 'pending', name: 'Pending', description: 'User activation pending', color: 'yellow' },
	{
		id: 'suspended',
		name: 'Suspended',
		description: 'User is temporarily suspended',
		color: 'orange',
	},
];

/**
 * User Service Class
 *
 * Follows SWE-15 principles:
 * - Single Responsibility: Only handles user management operations
 * - Interface Segregation: Focused interfaces for different operations
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
class UserService {
	private users: User[] = [...mockUsers];
	private roles: UserRole[] = [...mockRoles];
	private statuses: UserStatus[] = [...mockStatuses];

	/**
	 * Search users with filtering and pagination
	 */
	async searchUsers(request: UserSearchRequest): Promise<UserSearchResult> {
		console.log(`${MODULE_TAG} Searching users:`, request);

		try {
			const {
				searchTerm = '',
				role = '',
				status = '',
				department = '',
				limit = 10,
				offset = 0,
			} = request;

			const filteredUsers = this.users.filter((user) => {
				const matchesSearch =
					!searchTerm ||
					user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
					`${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

				const matchesRole = !role || user.role.id === role;
				const matchesStatus = !status || user.status.id === status;
				const matchesDepartment = !department || user.department === department;

				return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
			});

			const total = filteredUsers.length;
			const paginatedUsers = filteredUsers.slice(offset, offset + limit);
			const hasMore = offset + limit < total;

			return {
				users: paginatedUsers,
				total,
				hasMore,
				offset,
				limit,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error searching users:`, error);
			throw new Error('Failed to search users');
		}
	}

	/**
	 * Get user by ID
	 */
	async getUserById(id: string): Promise<User | null> {
		console.log(`${MODULE_TAG} Getting user by ID: ${id}`);
		try {
			const user = this.users.find((u) => u.id === id);
			return user || null;
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting user by ID:`, error);
			throw new Error('Failed to get user');
		}
	}

	/**
	 * Create new user
	 */
	async createUser(request: CreateUserRequest): Promise<User> {
		console.log(`${MODULE_TAG} Creating user:`, request);

		try {
			// Validate business rules
			this.validateCreateUserRequest(request);

			const newUser: User = {
				id: Date.now().toString(),
				username: request.username,
				email: request.email,
				firstName: request.firstName,
				lastName: request.lastName,
				role: this.roles.find((r) => r.id === request.roleId) || this.roles[2], // Default to 'user' role
				status: this.statuses.find((s) => s.id === 'active') || this.statuses[0], // Default to 'active'
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				phone: request.phone,
				department: request.department,
			};

			this.users.push(newUser);
			return newUser;
		} catch (error) {
			console.error(`${MODULE_TAG} Error creating user:`, error);
			throw error;
		}
	}

	/**
	 * Update existing user
	 */
	async updateUser(id: string, request: UpdateUserRequest): Promise<User> {
		console.log(`${MODULE_TAG} Updating user ${id}:`, request);

		try {
			const userIndex = this.users.findIndex((u) => u.id === id);
			if (userIndex === -1) {
				throw new Error('User not found');
			}

			const existingUser = this.users[userIndex];
			const updatedUser: User = {
				...existingUser,
				...request,
				updatedAt: new Date().toISOString(),
				role: request.roleId
					? this.roles.find((r) => r.id === request.roleId) || existingUser.role
					: existingUser.role,
				status: request.statusId
					? this.statuses.find((s) => s.id === request.statusId) || existingUser.status
					: existingUser.status,
			};

			this.users[userIndex] = updatedUser;
			return updatedUser;
		} catch (error) {
			console.error(`${MODULE_TAG} Error updating user:`, error);
			throw error;
		}
	}

	/**
	 * Delete user
	 */
	async deleteUser(id: string): Promise<void> {
		console.log(`${MODULE_TAG} Deleting user: ${id}`);

		try {
			const userIndex = this.users.findIndex((u) => u.id === id);
			if (userIndex === -1) {
				throw new Error('User not found');
			}

			this.users.splice(userIndex, 1);
		} catch (error) {
			console.error(`${MODULE_TAG} Error deleting user:`, error);
			throw error;
		}
	}

	/**
	 * Get all available roles
	 */
	async getRoles(): Promise<UserRole[]> {
		console.log(`${MODULE_TAG} Getting all roles`);
		try {
			return [...this.roles];
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting roles:`, error);
			throw new Error('Failed to get roles');
		}
	}

	/**
	 * Get all available statuses
	 */
	async getStatuses(): Promise<UserStatus[]> {
		console.log(`${MODULE_TAG} Getting all statuses`);
		try {
			return [...this.statuses];
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting statuses:`, error);
			throw new Error('Failed to get statuses');
		}
	}

	/**
	 * Validate create user request
	 */
	private validateCreateUserRequest(request: CreateUserRequest): void {
		if (!request.username?.trim()) {
			throw new Error('Username is required');
		}

		if (!request.email?.trim()) {
			throw new Error('Email is required');
		}

		if (!request.firstName?.trim()) {
			throw new Error('First name is required');
		}

		if (!request.lastName?.trim()) {
			throw new Error('Last name is required');
		}

		if (!request.password?.trim()) {
			throw new Error('Password is required');
		}

		if (request.password.length < 8) {
			throw new Error('Password must be at least 8 characters');
		}

		// Check if username already exists
		if (this.users.some((u) => u.username === request.username)) {
			throw new Error('Username already exists');
		}

		// Check if email already exists
		if (this.users.some((u) => u.email === request.email)) {
			throw new Error('Email already exists');
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(request.email)) {
			throw new Error('Invalid email format');
		}
	}
}

// Singleton instance
export const userService = new UserService();
