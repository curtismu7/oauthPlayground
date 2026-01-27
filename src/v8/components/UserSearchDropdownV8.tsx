/**
 * @file UserSearchDropdownV8.tsx
 * @module v8/components
 * @description Searchable user dropdown with pagination for MFA flows
 * @version 8.0.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[👤 USER-SEARCH-DROPDOWN-V8]';

interface User {
	id: string;
	username: string;
	email: string;
}

interface UserSearchDropdownV8Props {
	environmentId: string;
	value: string;
	onChange: (username: string) => void;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
}

export const UserSearchDropdownV8: React.FC<UserSearchDropdownV8Props> = ({
	environmentId,
	value,
	onChange,
	placeholder = 'Search for a user...',
	disabled = false,
	id,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [offset, setOffset] = useState(0);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [error, setError] = useState<string | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const loadMoreButtonRef = useRef<HTMLButtonElement>(null);

	const loadUsers = useCallback(
		async (search: string = '', reset: boolean = true) => {
			if (!environmentId) {
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const currentOffset = reset ? 0 : offset;
				const result = await MFAServiceV8.listUsers(
					environmentId,
					search || undefined,
					10,
					currentOffset
				);

				if (reset) {
					setUsers(result.users);
					setOffset(10);
				} else {
					setUsers((prev) => [...prev, ...result.users]);
					setOffset((prev) => prev + 10);
				}

				setHasMore(result.hasMore);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
				setError(errorMessage);
				toastV8.error(`Failed to load users: ${errorMessage}`);
				setUsers([]);
				setHasMore(false);
			} finally {
				setIsLoading(false);
			}
		},
		[environmentId, offset]
	);

	// Load users when dropdown opens
	useEffect(() => {
		if (isOpen && environmentId && users.length === 0) {
			loadUsers('', true);
		}
	}, [isOpen, environmentId, loadUsers, users.length]);

	// Search with debounce
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const timeoutId = setTimeout(() => {
			if (environmentId) {
				loadUsers(searchTerm, true);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm, isOpen, environmentId, loadUsers]);

	// Load selected user info if value is set
	useEffect(() => {
		if (value && !selectedUser) {
			// If we have a username value, try to find it in the users list
			const found = users.find((u) => u.username === value);
			if (found) {
				setSelectedUser(found);
			}
		}
	}, [value, selectedUser, users]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchTerm('');
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen]);

	// Focus search input when dropdown opens
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isOpen]);

	const handleSelectUser = (user: User) => {
		setSelectedUser(user);
		onChange(user.username);
		setIsOpen(false);
		setSearchTerm('');
	};

	const handleLoadMore = () => {
		loadUsers(searchTerm, false);
	};

	const handleClear = () => {
		setSelectedUser(null);
		onChange('');
		setSearchTerm('');
	};

	const displayValue = selectedUser?.username || value || '';

	return (
		<div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
			{/* Main input/button */}
			<div
				style={{
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
					width: '100%',
				}}
			>
				<input
					id={id}
					type="text"
					value={displayValue}
					readOnly
					onClick={() => !disabled && setIsOpen(!isOpen)}
					onFocus={() => !disabled && setIsOpen(true)}
					placeholder={placeholder}
					disabled={disabled}
					style={{
						width: '100%',
						padding: '10px 12px',
						paddingRight: value ? '70px' : '40px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						fontSize: '14px',
						cursor: disabled ? 'not-allowed' : 'pointer',
						background: disabled ? '#f3f4f6' : 'white',
						color: disabled ? '#9ca3af' : '#111827',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						right: '8px',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
					}}
				>
					{value && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleClear();
							}}
							disabled={disabled}
							style={{
								background: 'none',
								border: 'none',
								cursor: disabled ? 'not-allowed' : 'pointer',
								padding: '4px',
								display: 'flex',
								alignItems: 'center',
								color: '#6b7280',
							}}
						>
							<FiX size={16} />
						</button>
					)}
					<div
						style={{
							color: '#6b7280',
							display: 'flex',
							alignItems: 'center',
						}}
					>
						<FiChevronDown size={16} />
					</div>
				</div>
			</div>

			{/* Dropdown */}
			{isOpen && !disabled && (
				<div
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						marginTop: '4px',
						background: 'white',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
						zIndex: 1000,
						maxHeight: '400px',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					{/* Search input */}
					<div
						style={{
							padding: '8px',
							borderBottom: '1px solid #e5e7eb',
						}}
					>
						<div
							style={{
								position: 'relative',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<FiSearch
								style={{
									position: 'absolute',
									left: '10px',
									color: '#9ca3af',
								}}
								size={16}
							/>
							<input
								ref={searchInputRef}
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by username or email..."
								style={{
									width: '100%',
									padding: '8px 8px 8px 34px',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>
					</div>

					{/* Users list */}
					<div
						style={{
							maxHeight: '300px',
							overflowY: 'auto',
							flex: 1,
						}}
					>
						{isLoading && users.length === 0 ? (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
								}}
							>
								Loading users...
							</div>
						) : error ? (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#dc2626',
									fontSize: '14px',
								}}
							>
								{error}
							</div>
						) : users.length === 0 ? (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
								}}
							>
								{searchTerm ? 'No users found' : 'No users available'}
							</div>
						) : (
							<>
								{users.map((user) => (
									<button
										key={user.id}
										type="button"
										onClick={() => handleSelectUser(user)}
										style={{
											width: '100%',
											padding: '12px 16px',
											textAlign: 'left',
											border: 'none',
											background: selectedUser?.id === user.id ? '#f3f4f6' : 'white',
											cursor: 'pointer',
											fontSize: '14px',
											borderBottom: '1px solid #f3f4f6',
											display: 'flex',
											flexDirection: 'column',
											gap: '4px',
										}}
										onMouseEnter={(e) => {
											if (selectedUser?.id !== user.id) {
												e.currentTarget.style.background = '#f9fafb';
											}
										}}
										onMouseLeave={(e) => {
											if (selectedUser?.id !== user.id) {
												e.currentTarget.style.background = 'white';
											}
										}}
									>
										<span style={{ fontWeight: '500', color: '#111827' }}>{user.username}</span>
										{user.email && (
											<span style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</span>
										)}
									</button>
								))}

								{/* Load More button */}
								{hasMore && (
									<div
										style={{
											padding: '8px',
											borderTop: '1px solid #e5e7eb',
										}}
									>
										<button
											ref={loadMoreButtonRef}
											type="button"
											onClick={handleLoadMore}
											disabled={isLoading}
											style={{
												width: '100%',
												padding: '8px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
												background: 'white',
												color: '#374151',
												fontSize: '14px',
												fontWeight: '500',
												cursor: isLoading ? 'not-allowed' : 'pointer',
												opacity: isLoading ? 0.6 : 1,
											}}
										>
											{isLoading ? 'Loading...' : 'Load More'}
										</button>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
