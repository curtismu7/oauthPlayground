import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
	padding: var(--ping-spacing-sm) var(--ping-spacing-md);
	border-bottom: 1px solid var(--ping-border-color);
	background: var(--ping-secondary-color);
	display: flex;
	flex-direction: column;
	gap: var(--ping-spacing-xs);
`;

const AdvancedOptions = styled.div`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs);
	font-size: 0.75rem;
	color: var(--ping-gray);
`;

const CheckboxLabel = styled.label`
	display: flex;
	align-items: center;
	gap: calc(var(--ping-spacing-xs) * 0.7);
	cursor: pointer;
	user-select: none;
	
	&:hover {
		color: var(--ping-text-color);
	}
`;

const Checkbox = styled.input`
	cursor: pointer;
	margin: 0;
`;

const SearchInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchInput = styled.input`
	width: 100%;
	padding: var(--ping-spacing-xs) 2.5rem var(--ping-spacing-xs) 2rem;
	border: 1px solid var(--ping-border-color);
	border-radius: var(--ping-border-radius-md);
	font-size: 0.875rem;
	background: white;
	transition: var(--ping-transition-normal);

	&:focus {
		outline: none;
		border-color: var(--ping-primary-color);
		box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
	}

	&::placeholder {
		color: var(--ping-gray);
	}
`;

const SearchIcon = styled.div`
	position: absolute;
	left: var(--ping-spacing-xs);
	color: var(--ping-gray);
	display: flex;
	align-items: center;
	pointer-events: none;
`;

const SearchButton = styled.button`
	position: absolute;
	right: var(--ping-spacing-xs);
	background: var(--ping-primary-color);
	border: none;
	color: white;
	cursor: pointer;
	padding: calc(var(--ping-spacing-xs) * 1.5) var(--ping-spacing-xs);
	border-radius: var(--ping-border-radius-sm);
	display: flex;
	align-items: center;
	transition: var(--ping-transition-normal);

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
	matchAnywhere?: boolean; // Whether to match anywhere (substring) or use strict word boundaries
	onMatchAnywhereChange?: (matchAnywhere: boolean) => void; // Callback when matchAnywhere changes
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({
	onSearch,
	placeholder = 'Search flows...',
	activeSearchQuery = '',
	matchAnywhere = false,
	onMatchAnywhereChange,
}) => {
	const [displayQuery, setDisplayQuery] = React.useState('');
	const [activeQuery, setActiveQuery] = React.useState('');
	const inputRef = useRef<HTMLInputElement>(null);

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
		<div className="end-user-nano">
			<SearchContainer data-search-container>
				<SearchInputWrapper>
					<SearchIcon>
						<span className="mdi mdi-magnify" style={{ fontSize: '14px' }}></span>
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
							<span className="mdi mdi-magnify" style={{ fontSize: '14px' }}></span>
						</SearchButton>
					) : displayQuery || activeQuery ? (
						<ClearButton onClick={clearSearch} title="Clear search">
							<span className="mdi mdi-close" style={{ fontSize: '14px' }}></span>
						</ClearButton>
					) : null}
				</SearchInputWrapper>
				{onMatchAnywhereChange && (
					<AdvancedOptions>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={matchAnywhere}
								onChange={(e) => {
									onMatchAnywhereChange(e.target.checked);
									// Re-trigger search with new setting
									if (activeQuery) {
										onSearch(activeQuery);
									}
								}}
							/>
							<span>Match anywhere (substring)</span>
						</CheckboxLabel>
					</AdvancedOptions>
				)}
			</SearchContainer>
		</div>
	);
};

export default SidebarSearch;
