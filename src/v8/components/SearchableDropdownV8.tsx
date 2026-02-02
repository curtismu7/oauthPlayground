/**
 * @file SearchableDropdownV8.tsx
 * @module v8/components
 * @description Searchable dropdown component with filter functionality
 * @version 8.0.0
 * @since 2026-02-01
 *
 * Purpose: Provide a searchable/filterable dropdown for long lists (like user lists).
 * Replaces standard <select> with a text input + filtered list overlay.
 *
 * Features:
 * - Type to search/filter options
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Click outside to close
 * - Matches existing design system
 * - Accessible (ARIA labels, keyboard support)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

const MODULE_TAG = '[🔍 SEARCHABLE-DROPDOWN-V8]';

export interface SearchableDropdownOption {
	value: string;
	label: string;
	secondaryLabel?: string; // Optional secondary text (e.g., email)
}

export interface SearchableDropdownV8Props {
	id?: string;
	value: string;
	options: SearchableDropdownOption[];
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	isLoading?: boolean;
	style?: React.CSSProperties;
	maxHeight?: number; // Max height for dropdown list
	onSearchChange?: (search: string) => void; // Server-side search callback
}

/**
 * Searchable Dropdown Component
 *
 * Provides type-to-search functionality for long dropdown lists.
 * Filters options as user types, supports keyboard navigation.
 */
export const SearchableDropdownV8: React.FC<SearchableDropdownV8Props> = ({
	id,
	value,
	options,
	onChange,
	placeholder = 'Select an option...',
	disabled = false,
	isLoading = false,
	style,
	maxHeight = 300,
	onSearchChange,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Filter options based on search term
	const filteredOptions = useMemo(() => {
		// If no search term, return all options
		if (!searchTerm) return options;

		// Always filter locally based on current search term
		// Even with server-side search, we filter the returned results for immediate feedback
		const lowerSearch = searchTerm.toLowerCase();
		return options.filter(
			(option) =>
				option.label.toLowerCase().includes(lowerSearch) ||
				option.value.toLowerCase().includes(lowerSearch) ||
				option.secondaryLabel?.toLowerCase().includes(lowerSearch)
		);
	}, [options, searchTerm]);

	// Get display text for selected value
	const displayText = useMemo(() => {
		if (!value) return '';
		const selectedOption = options.find((opt) => opt.value === value);
		if (!selectedOption) return value;
		return selectedOption.secondaryLabel
			? `${selectedOption.label} - ${selectedOption.secondaryLabel}`
			: selectedOption.label;
	}, [value, options]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setSearchTerm('');
				setHighlightedIndex(-1);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	// Reset highlighted index when search term changes
	useEffect(() => {
		setHighlightedIndex(-1);
	}, []);

	// Scroll highlighted option into view
	useEffect(() => {
		if (highlightedIndex >= 0 && listRef.current) {
			const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}, [highlightedIndex]);

	const handleInputFocus = () => {
		setIsOpen(true);
		setSearchTerm('');
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newSearchTerm = e.target.value;
		setSearchTerm(newSearchTerm);
		setIsOpen(true);
		setHighlightedIndex(-1);

		// Call server-side search callback if provided
		if (onSearchChange) {
			onSearchChange(newSearchTerm);
		}

		// If user clears the search, keep dropdown open to show full list
		if (newSearchTerm === '') {
			console.log(`${MODULE_TAG} Search cleared - dropdown stays open`);
		}
	};

	const handleOptionClick = (optionValue: string) => {
		console.log(`${MODULE_TAG} Option selected:`, optionValue);
		onChange(optionValue);
		setIsOpen(false);
		setSearchTerm('');
		setHighlightedIndex(-1);
		inputRef.current?.blur();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
			e.preventDefault();
			setIsOpen(true);
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
					handleOptionClick(filteredOptions[highlightedIndex].value);
				} else if (filteredOptions.length === 1) {
					// If only one option, select it
					handleOptionClick(filteredOptions[0].value);
				}
				break;
			case 'Escape':
				e.preventDefault();
				setIsOpen(false);
				setSearchTerm('');
				setHighlightedIndex(-1);
				inputRef.current?.blur();
				break;
			case 'Tab':
				setIsOpen(false);
				setSearchTerm('');
				setHighlightedIndex(-1);
				break;
		}
	};

	const handleInputBlur = () => {
		// Small delay to allow option click to register
		setTimeout(() => {
			if (!containerRef.current?.contains(document.activeElement)) {
				// Only clear search term if we're not keeping the dropdown open
				// If dropdown is open and search is empty, keep it open to show full list
				if (!isOpen) {
					setSearchTerm('');
				}
			}
		}, 150);
	};

	return (
		<div
			ref={containerRef}
			style={{
				position: 'relative',
				width: '100%',
				...style,
			}}
		>
			<input
				ref={inputRef}
				id={id}
				type="text"
				value={isOpen ? searchTerm : displayText}
				onChange={handleInputChange}
				onFocus={handleInputFocus}
				onBlur={handleInputBlur}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled || isLoading}
				autoComplete="off"
				role="combobox"
				aria-haspopup="listbox"
				aria-autocomplete="list"
				aria-controls={`${id}-listbox`}
				aria-expanded={isOpen}
				aria-activedescendant={
					highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
				}
				style={{
					width: '100%',
					padding: '10px 12px',
					paddingRight: value ? '76px' : '44px', // Extra space if clear button visible
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
					boxSizing: 'border-box',
					background: 'white',
					cursor: disabled || isLoading ? 'not-allowed' : 'text',
					opacity: disabled || isLoading ? 0.6 : 1,
				}}
			/>

			{/* Clear button */}
			{value && !disabled && !isLoading && (
				<button
					type="button"
					aria-label="Clear selection"
					onClick={(e) => {
						e.stopPropagation();
						onChange('');
						setSearchTerm('');
						setIsOpen(true); // Keep dropdown open when clearing
						if (onSearchChange) {
							onSearchChange(''); // Trigger search with empty string to restore full list
						}
						inputRef.current?.focus();
					}}
					style={{
						position: 'absolute',
						right: '44px',
						top: '50%',
						transform: 'translateY(-50%)',
						width: '24px',
						height: '24px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#6b7280',
						cursor: 'pointer',
						background: 'transparent',
						border: 'none',
						borderRadius: '4px',
						transition: 'background 0.15s ease, color 0.15s ease',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#f3f4f6';
						e.currentTarget.style.color = '#374151';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'transparent';
						e.currentTarget.style.color = '#6b7280';
					}}
				>
					<span style={{ fontSize: '18px', lineHeight: '18px' }}>×</span>
				</button>
			)}

			{/* Caret / toggle button */}
			<button
				type="button"
				aria-label={isOpen ? 'Close options' : 'Open options'}
				onClick={() => {
					if (disabled || isLoading) return;
					setIsOpen((s) => !s);
					if (!isOpen) {
						setTimeout(() => inputRef.current?.focus(), 0);
					}
				}}
				disabled={disabled || isLoading}
				style={{
					position: 'absolute',
					right: '8px',
					top: '50%',
					transform: 'translateY(-50%)',
					width: '32px',
					height: '32px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#4b5563',
					cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
					background: 'rgba(243, 244, 246, 0.8)',
					border: 'none',
					borderRadius: '4px',
					transition: 'background 0.15s ease',
				}}
				onMouseEnter={(e) => {
					if (!disabled && !isLoading) {
						e.currentTarget.style.background = 'rgba(229, 231, 235, 1)';
					}
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'rgba(243, 244, 246, 0.8)';
				}}
			>
				<span style={{ fontSize: '18px', lineHeight: '18px', fontWeight: 'bold' }}>
					{isOpen ? '▴' : '▾'}
				</span>
			</button>

			{isLoading && (
				<div
					style={{
						position: 'absolute',
						right: '40px',
						top: '50%',
						transform: 'translateY(-50%)',
						color: '#6b7280',
						fontSize: '14px',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
					}}
				>
					<div
						style={{
							width: '14px',
							height: '14px',
							border: '2px solid #d1d5db',
							borderTop: '2px solid #3b82f6',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
						}}
					/>
					<style>
						{`
							@keyframes spin {
								0% { transform: rotate(0deg); }
								100% { transform: rotate(360deg); }
							}
						`}
					</style>
					<span>Searching...</span>
				</div>
			)}

			{isOpen && !isLoading && (
				<div
					ref={listRef}
					id={`${id}-listbox`}
					role="listbox"
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						right: 0,
						marginTop: '4px',
						maxHeight: `${maxHeight}px`,
						overflowY: 'auto',
						background: 'white',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
						zIndex: 1000,
					}}
				>
					{filteredOptions.length === 0 ? (
						<div
							style={{
								padding: '10px 12px',
								color: '#6b7280',
								fontSize: '14px',
								textAlign: 'center',
							}}
						>
							No results found
						</div>
					) : (
						filteredOptions.map((option, index) => (
							<div
								key={option.value}
								id={`${id}-option-${index}`}
								role="option"
								tabIndex={0}
								aria-selected={option.value === value}
								onClick={() => handleOptionClick(option.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleOptionClick(option.value);
									}
								}}
								onMouseEnter={() => setHighlightedIndex(index)}
								style={{
									padding: '10px 12px',
									fontSize: '14px',
									cursor: 'pointer',
									background:
										highlightedIndex === index
											? '#f3f4f6'
											: option.value === value
												? '#eff6ff'
												: 'white',
									borderBottom: index < filteredOptions.length - 1 ? '1px solid #f3f4f6' : 'none',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<span>
									{option.label}
									{option.secondaryLabel && (
										<span style={{ color: '#6b7280', marginLeft: '8px' }}>
											- {option.secondaryLabel}
										</span>
									)}
								</span>
								{option.value === value && (
									<span style={{ color: '#2563eb', fontSize: '12px' }}>✓</span>
								)}
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
};
