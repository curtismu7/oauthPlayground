/**
 * @file UserSearchDropdown.tsx
 * @module protect-app/components
 * @description Searchable user dropdown with pagination for user management
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Follows SWE-15 principles:
 * - Single Responsibility: Only handles user search and selection
 * - Interface Segregation: Minimal props, focused functionality
 * - Dependency Inversion: Depends on UserService abstraction
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiUser } from '@icons';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { userService } from '../services/UserService';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const DropdownContainer = styled.div`
	position: relative;
	width: 100%;
`;

const DropdownTrigger = styled.button<{ theme: any }>`
	width: 100%;
	padding: 0.75rem 1rem;
	background: ${({ theme }) => theme.colors.surface};
	border: 2px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 1rem;
	color: ${({ theme }) => theme.colors.text};
	text-align: left;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: all 0.3s ease;

	&:hover {
		border-color: ${({ theme }) => theme.colors.primary};
	}

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
		box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const DropdownMenu = styled.div<{ theme: any }>`
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: ${({ theme }) => theme.colors.surface};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	box-shadow: ${({ theme }) => theme.shadows.lg};
	z-index: 1000;
	max-height: 300px;
	overflow-y: auto;
	margin-top: 0.25rem;
`;

const SearchContainer = styled.div<{ theme: any }>`
	padding: 0.75rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const SearchInput = styled.input<{ theme: any }>`
	width: 100%;
	padding: 0.5rem;
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.text};

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
	}
`;

const UserList = styled.div`
	max-height: 200px;
	overflow-y: auto;
`;

const UserItem = styled.button<{ theme: any }>`
	width: 100%;
	padding: 0.75rem 1rem;
	background: transparent;
	border: none;
	text-align: left;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	transition: all 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.primaryLight};
	}

	&:focus {
		outline: none;
		background: ${({ theme }) => theme.colors.primaryLight};
	}
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

const LoadMoreButton = styled.button<{ theme: any }>`
	width: 100%;
	padding: 0.75rem;
	background: transparent;
	border: none;
	border-top: 1px solid ${({ theme }) => theme.colors.border};
	color: ${({ theme }) => theme.colors.primary};
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.primaryLight};
	}

	&:focus {
		outline: none;
		background: ${({ theme }) => theme.colors.primaryLight};
	}
`;

const EmptyState = styled.div<{ theme: any }>`
	padding: 1.5rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoadingState = styled.div<{ theme: any }>`
	padding: 1.5rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.textSecondary};
`;

// ============================================================================
// TYPES
// ============================================================================

interface User {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
}

interface UserSearchDropdownProps {
	value: string;
	onChange: (username: string) => void;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
	value,
	onChange,
	placeholder = 'Search for a user...',
	disabled = false,
	id,
	className,
}) => {
	const { currentTheme } = useTheme();
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [offset, setOffset] = useState(0);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isOpen]);

	// Search users when search term changes
	useEffect(() => {
		if (isOpen) {
			const timeoutId = setTimeout(() => {
				searchUsers(searchTerm, 0);
			}, 300); // Debounce search

			return () => clearTimeout(timeoutId);
		}
	}, [searchTerm, isOpen, searchUsers]);

	const searchUsers = useCallback(async (term: string, startOffset: number = 0) => {
		setIsLoading(true);
		try {
			const result = await userService.searchUsers({
				searchTerm: term,
				limit: 10,
				offset: startOffset,
			});

			if (startOffset === 0) {
				setUsers(result.users);
			} else {
				setUsers((prev) => [...prev, ...result.users]);
			}

			setHasMore(result.hasMore);
			setOffset(startOffset + result.limit);
		} catch (error) {
			console.error('Error searching users:', error);
			if (startOffset === 0) {
				setUsers([]);
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSelectUser = useCallback(
		(user: User) => {
			setSelectedUser(user);
			onChange(user.username);
			setIsOpen(false);
			setSearchTerm('');
		},
		[onChange]
	);

	const handleLoadMore = useCallback(() => {
		searchUsers(searchTerm, offset);
	}, [searchTerm, offset, searchUsers]);

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		setOffset(0);
	}, []);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			setIsOpen(false);
		}
	}, []);

	const displayValue = selectedUser
		? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.username})`
		: value;

	return (
		<DropdownContainer ref={dropdownRef} className={className}>
			<DropdownTrigger
				onClick={() => setIsOpen(!isOpen)}
				disabled={disabled}
				theme={currentTheme}
				id={id}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
			>
				<span>{displayValue || placeholder}</span>
				<FiChevronDown />
			</DropdownTrigger>

			{isOpen && (
				<DropdownMenu theme={currentTheme}>
					<SearchContainer theme={currentTheme}>
						<SearchInput
							ref={searchInputRef}
							type="text"
							placeholder="Search users..."
							value={searchTerm}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							theme={currentTheme}
						/>
					</SearchContainer>

					<UserList>
						{isLoading && offset === 0 ? (
							<LoadingState theme={currentTheme}>
								<FiUser size={24} style={{ margin: '0 auto 0.5rem' }} />
								Searching...
							</LoadingState>
						) : users.length === 0 && !isLoading ? (
							<EmptyState theme={currentTheme}>No users found</EmptyState>
						) : (
							users.map((user) => (
								<UserItem
									key={user.id}
									onClick={() => handleSelectUser(user)}
									theme={currentTheme}
									role="option"
								>
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
								</UserItem>
							))
						)}
					</UserList>

					{hasMore && !isLoading && (
						<LoadMoreButton onClick={handleLoadMore} theme={currentTheme}>
							Load more...
						</LoadMoreButton>
					)}

					{isLoading && offset > 0 && <LoadingState theme={currentTheme}>Loading...</LoadingState>}
				</DropdownMenu>
			)}
		</DropdownContainer>
	);
};
