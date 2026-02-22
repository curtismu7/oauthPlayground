/**
 * @file UserSearchDropdown.PingUI.tsx
 * @module protect-app/components
 * @description Searchable user dropdown with pagination for user management - Ping UI version
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Follows SWE-15 principles:
 * - Single Responsibility: Only handles user search and selection
 * - Interface Segregation: Minimal props, focused functionality
 * - Dependency Inversion: Depends on UserService abstraction
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	const style: React.CSSProperties = {
		width: size,
		height: size,
		fontSize: size,
		lineHeight: 1,
	};

	return (
		<span
			role="img"
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
			className={`mdi mdi-${icon} ${className}`}
			style={style}
		/>
	);
};

// ============================================================================
// STYLES (Ping UI - replacing styled-components)
// ============================================================================

const dropdownContainerStyle: React.CSSProperties = {
	position: 'relative',
	width: '100%',
};

const getDropdownTriggerStyle = (theme: {
	colors: { surface: string; border: string; text: string; primary: string };
	borderRadius: { md: string };
}) => ({
	width: '100%',
	padding: '0.75rem 1rem',
	background: theme?.colors?.surface || '#f8f9fa',
	border: `2px solid ${theme?.colors?.border || '#e5e5e5'}`,
	borderRadius: theme?.borderRadius?.md || '8px',
	fontSize: '1rem',
	color: theme?.colors?.text || '#1a1a1a',
	textAlign: 'left' as const,
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'space-between',
	transition: 'all 0.15s ease-in-out',
});

const dropdownMenuStyle = {
	position: 'absolute' as const,
	top: '100%',
	left: 0,
	right: 0,
	marginTop: '0.5rem',
	background: 'white',
	border: '1px solid #e5e5e5',
	borderRadius: '8px',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	maxHeight: '300px',
	overflowY: 'auto' as const,
	zIndex: 1000,
};

const searchInputStyle = {
	padding: '0.75rem 1rem',
	border: 'none',
	borderBottom: '1px solid #e5e5e5',
	fontSize: '16px',
	width: '100%',
	outline: 'none',
};

const userItemStyle = {
	padding: '0.75rem 1rem',
	cursor: 'pointer',
	transition: 'background-color 0.15s ease-in-out',
	border: 'none',
	background: 'none',
	width: '100%',
	textAlign: 'left' as const,
	fontSize: '14px',
	color: '#1a1a1a',
	display: 'flex',
	alignItems: 'center' as const,
	gap: '12px',
};

const userItemSelectedStyle = {
	backgroundColor: '#e3f2fd',
	color: '#0066cc',
};

const loadingStyle = {
	padding: '1rem',
	textAlign: 'center' as const,
	color: '#666',
	fontSize: '14px',
};

const noResultsStyle = {
	padding: '1rem',
	textAlign: 'center' as const,
	color: '#666',
	fontSize: '14px',
};

const paginationStyle = {
	padding: '0.75rem',
	borderTop: '1px solid #e5e5e5',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	fontSize: '14px',
};

const paginationButtonStyle = {
	padding: '0.25rem 0.5rem',
	border: '1px solid #e5e5e5',
	borderRadius: '4px',
	background: 'white',
	cursor: 'pointer',
	fontSize: '12px',
	transition: 'all 0.15s ease-in-out',
};

const paginationButtonDisabledStyle = {
	opacity: 0.5,
	cursor: 'not-allowed',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface User {
	id: string;
	name: string;
	email: string;
}

export interface UserSearchDropdownProps {
	onUserSelect: (user: User) => void;
	selectedUser?: User;
	placeholder?: string;
	disabled?: boolean;
}

export const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
	onUserSelect,
	selectedUser,
	placeholder = 'Search for a user...',
	disabled = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Mock theme - in real implementation, this would come from context
	const theme = {
		colors: {
			surface: '#f8f9fa',
			border: '#e5e5e5',
			text: '#1a1a1a',
			primary: '#0066cc',
		},
		borderRadius: {
			md: '8px',
		},
	};

	// Search users
	const searchUsers = useCallback(async (query: string, pageNum: number = 1) => {
		if (!query.trim()) {
			setUsers([]);
			setHasMore(false);
			return;
		}

		setLoading(true);
		try {
			// Mock API call - replace with actual userService.searchUsers
			const mockUsers: User[] = [
				{ id: '1', name: 'John Doe', email: 'john@example.com' },
				{ id: '2', name: 'Jane Smith', email: 'jane@example.com' },
				{ id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
			].filter(
				(user) =>
					user.name.toLowerCase().includes(query.toLowerCase()) ||
					user.email.toLowerCase().includes(query.toLowerCase())
			);

			const pageSize = 10;
			const startIndex = (pageNum - 1) * pageSize;
			const paginatedUsers = mockUsers.slice(startIndex, startIndex + pageSize);

			if (pageNum === 1) {
				setUsers(paginatedUsers);
			} else {
				setUsers((prev) => [...prev, ...paginatedUsers]);
			}

			setHasMore(startIndex + pageSize < mockUsers.length);
		} catch (error) {
			console.error('Error searching users:', error);
			setUsers([]);
			setHasMore(false);
		} finally {
			setLoading(false);
		}
	}, []);

	// Handle search query change
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setPage(1);
			searchUsers(searchQuery, 1);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchQuery, searchUsers]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;
			if (dropdownRef.current && !dropdownRef.current.contains(target)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
		return undefined;
	}, [isOpen]);

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isOpen]);

	const toggleDropdown = () => {
		if (!disabled) {
			setIsOpen(!isOpen);
		}
	};

	const handleUserSelect = (user: User) => {
		onUserSelect(user);
		setIsOpen(false);
		setSearchQuery('');
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const loadMore = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1;
			setPage(nextPage);
			searchUsers(searchQuery, nextPage);
		}
	};

	return (
		<div className="end-user-nano">
			<div ref={dropdownRef} style={dropdownContainerStyle}>
				{/* Dropdown Trigger */}
				<button
					style={getDropdownTriggerStyle(theme)}
					onClick={toggleDropdown}
					disabled={disabled}
					aria-label="Select user"
					aria-expanded={isOpen}
					aria-haspopup="listbox"
				>
					<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<MDIIcon icon="account" size={16} aria-hidden={true} />
						{selectedUser ? selectedUser.name : placeholder}
					</span>
					<MDIIcon icon="chevron-down" size={16} aria-hidden={true} />
				</button>

				{/* Dropdown Menu */}
				{isOpen && (
					<div style={dropdownMenuStyle} role="listbox">
						{/* Search Input */}
						<input
							ref={searchInputRef}
							type="text"
							style={searchInputStyle}
							placeholder="Search users..."
							value={searchQuery}
							onChange={handleSearchChange}
							aria-label="Search users"
						/>

						{/* User List */}
						{loading && users.length === 0 ? (
							<div style={loadingStyle}>Loading...</div>
						) : users.length === 0 && searchQuery ? (
							<div style={noResultsStyle}>No users found</div>
						) : (
							<>
								{users.map((user: User) => (
									<button
										key={user.id}
										style={{
											...userItemStyle,
											...(selectedUser?.id === user.id ? userItemSelectedStyle : {}),
										}}
										onClick={() => handleUserSelect(user)}
										role="option"
										aria-selected={selectedUser?.id === user.id}
										onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
											if (selectedUser?.id !== user.id) {
												e.currentTarget.style.backgroundColor = '#f8f9fa';
											}
										}}
										onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
											if (selectedUser?.id !== user.id) {
												e.currentTarget.style.backgroundColor = 'transparent';
											}
										}}
									>
										<MDIIcon icon="account" size={16} aria-hidden={true} />
										<div>
											<div style={{ fontWeight: '600', marginBottom: '2px' }}>{user.name}</div>
											<div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
										</div>
									</button>
								))}

								{/* Pagination */}
								{hasMore && (
									<div style={paginationStyle}>
										<span>{users.length} users</span>
										<button
											style={{
												...paginationButtonStyle,
												...(loading ? paginationButtonDisabledStyle : {}),
											}}
											onClick={loadMore}
											disabled={loading}
											aria-label="Load more users"
										>
											{loading ? 'Loading...' : 'Load More'}
										</button>
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
