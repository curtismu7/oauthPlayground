import React, { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styled from 'styled-components';

const SearchContainer = styled.div`
	padding: 1rem;
	border-bottom: 1px solid #e5e7eb;
	background: #f9fafb;
`;

const SearchInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchInput = styled.input`
	width: 100%;
	padding: 0.75rem 2.5rem 0.75rem 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const SearchIcon = styled.div`
	position: absolute;
	left: 0.75rem;
	color: #6b7280;
	display: flex;
	align-items: center;
	pointer-events: none;
`;

const ClearButton = styled.button`
	position: absolute;
	right: 0.75rem;
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.25rem;
	display: flex;
	align-items: center;
	transition: all 0.2s ease;

	&:hover {
		color: #374151;
		background: #f3f4f6;
	}
`;

const SearchResults = styled.div`
	max-height: 300px;
	overflow-y: auto;
	margin-top: 0.5rem;
`;

const SearchResultItem = styled.div<{ $isActive?: boolean }>`
	padding: 0.75rem;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${(props) => (props.$isActive ? '#dbeafe' : 'white')};
	border: 1px solid ${(props) => (props.$isActive ? '#3b82f6' : '#e5e7eb')};
	margin-bottom: 0.25rem;

	&:hover {
		background: #f0f9ff;
		border-color: #60a5fa;
		transform: translateX(2px);
	}
`;

const ResultTitle = styled.div`
	font-weight: 600;
	color: #111827;
	font-size: 0.875rem;
	margin-bottom: 0.25rem;
`;

const ResultPath = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ResultCategory = styled.div`
	font-size: 0.75rem;
	color: #3b82f6;
	font-weight: 500;
`;

const NoResults = styled.div`
	padding: 1rem;
	text-align: center;
	color: #6b7280;
	font-size: 0.875rem;
`;

interface MenuItem {
	id: string;
	path: string;
	label: string;
	category: string;
}

interface MenuSearchProps {
	menuItems: MenuItem[];
	onNavigate: (path: string) => void;
	currentPath: string;
}

const MenuSearch: React.FC<MenuSearchProps> = ({ menuItems, onNavigate, currentPath }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Filter menu items based on search query
	const filteredItems = useMemo(() => {
		if (!searchQuery.trim()) {
			return [];
		}

		const query = searchQuery.toLowerCase();
		return menuItems
			.filter(
				(item) =>
					item.label.toLowerCase().includes(query) ||
					item.path.toLowerCase().includes(query) ||
					item.category.toLowerCase().includes(query)
			)
			.slice(0, 10); // Limit to 10 results for performance
	}, [searchQuery, menuItems]);

	// Clear search when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			// Don't close if clicking on search results or search container
			if (!target.closest('[data-search-container]') && !target.closest('[data-search-results]')) {
				setIsSearchFocused(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Add keyboard shortcut (Ctrl/Cmd + K) to focus search
	useEffect(() => {
		const handleGlobalKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
				event.preventDefault();
				inputRef.current?.focus();
				setIsSearchFocused(true);
			}
		};

		document.addEventListener('keydown', handleGlobalKeyDown);
		return () => document.removeEventListener('keydown', handleGlobalKeyDown);
	}, []);

	// Handle keyboard navigation
	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Escape') {
			setSearchQuery('');
			setIsSearchFocused(false);
		}
	};

	const handleItemClick = (path: string) => {
		onNavigate(path);
		// Add a small delay to ensure navigation happens before clearing search
		setTimeout(() => {
			setSearchQuery('');
			setIsSearchFocused(false);
		}, 100);
	};

	const clearSearch = () => {
		setSearchQuery('');
		setIsSearchFocused(false);
	};

	const showResults = isSearchFocused && searchQuery.trim().length > 0;

	return (
		<SearchContainer data-search-container>
			<SearchInputWrapper>
				<SearchIcon>
					<FiSearch size={16} />
				</SearchIcon>
				<SearchInput
					ref={inputRef}
					type="text"
					placeholder="Search flows and pages... (⌘K)"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onFocus={() => setIsSearchFocused(true)}
					onKeyDown={handleKeyDown}
				/>
				<ClearButton onClick={clearSearch} title="Clear search">
					<FiX size={16} />
				</ClearButton>
			</SearchInputWrapper>

			{showResults && (
				<SearchResults data-search-results>
					{filteredItems.length > 0 ? (
						filteredItems.map((item) => (
							<SearchResultItem
								key={item.id}
								$isActive={currentPath === item.path}
								onClick={() => handleItemClick(item.path)}
							>
								<ResultTitle>{item.label}</ResultTitle>
								<ResultCategory>{item.category}</ResultCategory>
								<ResultPath>{item.path}</ResultPath>
							</SearchResultItem>
						))
					) : (
						<NoResults>No results found for "{searchQuery}"</NoResults>
					)}
				</SearchResults>
			)}
		</SearchContainer>
	);
};

export default MenuSearch;
