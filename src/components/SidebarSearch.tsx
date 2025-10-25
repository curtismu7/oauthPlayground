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
	padding: 0.5rem 2rem 0.5rem 2rem;
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
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({ 
	onSearch, 
	placeholder = "Search flows..." 
}) => {
	const searchQueryRef = React.useRef('');
	const [displayQuery, setDisplayQuery] = React.useState('');
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Debounce search to avoid too many calls
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchQueryRef.current !== displayQuery) {
				searchQueryRef.current = displayQuery;
				onSearch(displayQuery);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [displayQuery, onSearch]);

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
		if (event.key === 'Escape') {
			setDisplayQuery('');
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
	};

	return (
		<SearchContainer data-search-container>
			<SearchInputWrapper>
				<SearchIcon>
					<FiSearch size={14} />
				</SearchIcon>
				<SearchInput
					key="sidebar-search-input"
					ref={inputRef}
					type="text"
					placeholder={`${placeholder} (⌘K)`}
					value={displayQuery}
					onChange={(e) => setDisplayQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
				/>
				{displayQuery && (
					<ClearButton onClick={clearSearch} title="Clear search">
						<FiX size={14} />
					</ClearButton>
				)}
			</SearchInputWrapper>
		</SearchContainer>
	);
};

export default SidebarSearch;