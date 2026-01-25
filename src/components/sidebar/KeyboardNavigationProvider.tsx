/**
 * KeyboardNavigationProvider - Enhanced keyboard navigation for sidebar
 * Phase 2: User Experience Enhancement
 * 
 * Provides comprehensive keyboard navigation including:
 * - Arrow key navigation
 * - Home/End key support
 * - Enter/Space for activation
 * - Escape for closing
 * - Tab navigation with focus trapping
 */

import React, { createContext, useContext, useCallback, useRef, useEffect, useState, ReactNode } from 'react';

// Types for keyboard navigation
export interface KeyboardNavigationContextType {
	focusedIndex: number;
	focusedGroupId: string;
	isKeyboardMode: boolean;
	setFocusedIndex: (index: number) => void;
	setFocusedGroupId: (groupId: string) => void;
	setKeyboardMode: (enabled: boolean) => void;
	handleKeyDown: (e: React.KeyboardEvent, groupId: string, itemCount: number) => void;
	focusNextItem: (groupId: string, itemCount: number) => void;
	focusPreviousItem: (groupId: string, itemCount: number) => void;
	focusFirstItem: (groupId: string) => void;
	focusLastItem: (groupId: string, itemCount: number) => void;
	activateItem: () => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

interface KeyboardNavigationProviderProps {
	children: ReactNode;
	onEscape?: () => void;
	onActivate?: (groupId: string, index: number) => void;
}

export const KeyboardNavigationProvider: React.FC<KeyboardNavigationProviderProps> = ({
	children,
	onEscape,
	onActivate,
}) => {
	const [focusedIndex, setFocusedIndex] = useState(0);
	const [focusedGroupId, setFocusedGroupId] = useState('');
	const [isKeyboardMode, setIsKeyboardMode] = useState(false);
	const containerRef = useRef<HTMLElement>(null);

	// Handle keyboard navigation
	const handleKeyDown = useCallback((
		e: React.KeyboardEvent,
		groupId: string,
		itemCount: number
	) => {
		// Enable keyboard mode on any key press
		if (!isKeyboardMode) {
			setIsKeyboardMode(true);
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusNextItem(groupId, itemCount);
				break;

			case 'ArrowUp':
				e.preventDefault();
				focusPreviousItem(groupId, itemCount);
				break;

			case 'Home':
				e.preventDefault();
				focusFirstItem(groupId);
				break;

			case 'End':
				e.preventDefault();
				focusLastItem(groupId, itemCount);
				break;

			case 'Enter':
			case ' ':
				e.preventDefault();
				activateItem();
				break;

			case 'Escape':
				e.preventDefault();
				if (onEscape) {
					onEscape();
				}
				break;

			case 'Tab':
				// Allow default tab behavior
				break;

			default:
				// Handle character navigation (type to find)
				if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
					// This would be implemented with search functionality
					// For now, just prevent default to avoid unexpected behavior
					e.preventDefault();
				}
				break;
		}
	}, [isKeyboardMode, onEscape]);

	// Navigation functions
	const focusNextItem = useCallback((groupId: string, itemCount: number) => {
		setFocusedGroupId(groupId);
		setFocusedIndex((prev) => (prev + 1) % itemCount);
	}, []);

	const focusPreviousItem = useCallback((groupId: string, itemCount: number) => {
		setFocusedGroupId(groupId);
		setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
	}, []);

	const focusFirstItem = useCallback((groupId: string) => {
		setFocusedGroupId(groupId);
		setFocusedIndex(0);
	}, []);

	const focusLastItem = useCallback((groupId: string, itemCount: number) => {
		setFocusedGroupId(groupId);
		setFocusedIndex(itemCount - 1);
	}, []);

	const activateItem = useCallback(() => {
		if (onActivate && focusedGroupId) {
			onActivate(focusedGroupId, focusedIndex);
		}
	}, [onActivate, focusedGroupId, focusedIndex]);

	// Handle focus management
	const handleFocus = useCallback(() => {
		setIsKeyboardMode(true);
	}, []);

	const handleBlur = useCallback((e: React.FocusEvent) => {
		// Check if focus is moving outside the container
		if (!e.currentTarget.contains(e.relatedTarget)) {
			setIsKeyboardMode(false);
		}
	}, []);

	// Focus trapping
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Tab' && containerRef.current) {
				const focusableElements = containerRef.current.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				
				const firstElement = focusableElements[0] as HTMLElement;
				const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement?.focus();
					}
				} else {
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement?.focus();
					}
				}
			}
		};

		document.addEventListener('keydown', handleGlobalKeyDown);
		return () => document.removeEventListener('keydown', handleGlobalKeyDown);
	}, []);

	// Reset focus when group changes
	useEffect(() => {
		setFocusedIndex(0);
	}, [focusedGroupId]);

	const contextValue: KeyboardNavigationContextType = {
		focusedIndex,
		focusedGroupId,
		isKeyboardMode,
		setFocusedIndex,
		setFocusedGroupId,
		setKeyboardMode: setIsKeyboardMode,
		handleKeyDown,
		focusNextItem,
		focusPreviousItem,
		focusFirstItem,
		focusLastItem,
		activateItem,
	};

	return (
		<KeyboardNavigationContext.Provider value={contextValue}>
			<div
				ref={containerRef as any}
				onFocus={handleFocus}
				onBlur={handleBlur}
				style={{ outline: 'none' }}
			>
				{children}
			</div>
		</KeyboardNavigationContext.Provider>
	);
};

export const useKeyboardNavigation = (): KeyboardNavigationContextType => {
	const context = useContext(KeyboardNavigationContext);
	if (context === undefined) {
		throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
	}
	return context;
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const key = [];
			
			if (e.ctrlKey) key.push('ctrl');
			if (e.altKey) key.push('alt');
			if (e.shiftKey) key.push('shift');
			if (e.metaKey) key.push('meta');
			
			key.push(e.key.toLowerCase());
			const shortcut = key.join('+');

			if (shortcuts[shortcut]) {
				e.preventDefault();
				shortcuts[shortcut]();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [shortcuts]);
};

export default KeyboardNavigationProvider;
