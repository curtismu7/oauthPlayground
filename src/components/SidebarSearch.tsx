import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styled from 'styled-components';

const SearchContainer = styled.div`
	padding: 0.75rem 1rem;
	border-bottom: 1px solid #e5e7eb;
	background: #f8fafc;
`;

const SearchInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchInput = styled.input`
	width: 100%;
	padding: 0.5rem 2.5rem 0.5rem 2rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const SearchIcon = styled.div`
	position: absolute;
	left: 0.5rem;
	color: #6b7280;
	display: flex;
	align-items: center;
	pointer-events: none;
`;

const SearchButton = styled.button`
	position: absolute;
	right: 0.5rem;
	background: #3b82f6;
	border: none;
	color: white;
	cursor: pointer;
	padding: 0.375rem 0.5rem;
	border-radius: 0.25rem;
	display: flex;
	align-items: center;
	transition: all 0.2s ease;

	&:hover {
		background: #2563eb;
	}

	&:active {
		transform: scale(0.95);
	}
`;

const ClearButton = styled.button`
	position: absolute;
	right: 0.5rem;
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

interface SidebarSearchProps {
	onSearch: (query: string) => void;
	placeholder?: string;
	activeSearchQuery?: string; // Track the active search query from parent
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({ 
	onSearch, 
	placeholder = "Search flows...",
	activeSearchQuery = ''
}) => {
	const [displayQuery, setDisplayQuery] = React.useState('');
	const [activeQuery, setActiveQuery] = React.useState('');
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Sync with parent's active search query
	React.useEffect(() => {
		if (activeSearchQuery !== activeQuery) {
			setActiveQuery(activeSearchQuery);
			setDisplayQuery(activeSearchQuery);
		}
	}, [activeSearchQuery, activeQuery]);

	// Trigger search function
	const triggerSearch = () => {
		setActiveQuery(displayQuery);
		onSearch(displayQuery);
	};

	// Add keyboard shortcut (Ctrl/Cmd + K) to focus search
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
				event.preventDefault();
				inputRef.current?.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			triggerSearch();
		} else if (event.key === 'Escape') {
			setDisplayQuery('');
			setActiveQuery('');
			onSearch('');
			inputRef.current?.blur();
		}
	};

	const handleBlur = (event: React.FocusEvent) => {
		// Prevent focus loss if we're just moving within the search component
		const relatedTarget = event.relatedTarget as HTMLElement;
		if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
			// Focus is moving within the search component, don't lose focus
			return;
		}
		// Allow normal blur behavior
	};

	const clearSearch = () => {
		setDisplayQuery('');
		setActiveQuery('');
		onSearch('');
		inputRef.current?.focus();
	};

	return (
		<SearchContainer data-search-container>
			<SearchInputWrapper>
				<SearchIcon>
					<FiSearch size={14} />
				</SearchIcon>
				<SearchInput
					ref={inputRef}
					type="text"
					placeholder={`${placeholder} (⌘K, Enter to search)`}
					value={displayQuery}
					onChange={(e) => setDisplayQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
				/>
				{displayQuery && displayQuery !== activeQuery ? (
					<SearchButton onClick={triggerSearch} title="Search (Enter)">
						<FiSearch size={14} />
					</SearchButton>
				) : (displayQuery || activeQuery) ? (
					<ClearButton onClick={clearSearch} title="Clear search">
						<FiX size={14} />
					</ClearButton>
				) : null}
			</SearchInputWrapper>
		</SearchContainer>
	);
};

export default SidebarSearch;