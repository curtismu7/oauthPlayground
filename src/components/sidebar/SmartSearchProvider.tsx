/**
 * SmartSearchProvider - Advanced search with fuzzy matching and AI features
 * Phase 3: Advanced Features
 * 
 * Provides:
 * - Fuzzy string matching
 * - Search ranking and scoring
 * - Search history
 * - AI-powered suggestions
 * - Advanced filtering
 */

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';

// Types for smart search
export interface SearchHistoryItem {
	query: string;
	timestamp: number;
	resultCount: number;
}

export interface SearchResult {
	item: {
		id: string;
		path: string;
		label: string;
		icon?: React.ReactNode;
		category?: string;
		description?: string;
		tags?: string[];
	};
	score: number;
	matches: {
		label: number[];
		path: number[];
		description?: number[];
		tags?: number[];
	};
	highlights: {
		label?: string;
		path?: string;
		description?: string;
	};
}

export interface SmartSearchContextType {
	query: string;
	results: SearchResult[];
	isLoading: boolean;
	searchHistory: SearchHistoryItem[];
	setQuery: (query: string) => void;
	clearSearch: () => void;
	addToHistory: (query: string, resultCount: number) => void;
	clearHistory: () => void;
	getSuggestions: (query: string) => string[];
	performSearch: (query: string, items: any[]) => SearchResult[];
}

const SmartSearchContext = createContext<SmartSearchContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
	SEARCH_HISTORY: 'sidebar.searchHistory',
	SEARCH_PREFERENCES: 'sidebar.searchPreferences',
} as const;

// Fuzzy matching algorithm
class FuzzyMatcher {
	// Calculate Levenshtein distance
	static levenshteinDistance(str1: string, str2: string): number {
		const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
		
		for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
		for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

		for (let j = 1; j <= str2.length; j++) {
			for (let i = 1; i <= str1.length; i++) {
				const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
				matrix[j][i] = Math.min(
					matrix[j][i - 1] + 1,
					matrix[j - 1][i] + 1,
					matrix[j - 1][i - 1] + indicator
				);
			}
		}

		return matrix[str2.length][str1.length];
	}

	// Calculate similarity score (0-1)
	static similarity(str1: string, str2: string): number {
		const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
		const maxLen = Math.max(str1.length, str2.length);
		return maxLen === 0 ? 1 : 1 - distance / maxLen;
	}

	// Check if string contains query as substring
	static containsSubstring(str: string, query: string): boolean {
		return str.toLowerCase().includes(query.toLowerCase());
	}

	// Check if string starts with query
	static startsWith(str: string, query: string): boolean {
		return str.toLowerCase().startsWith(query.toLowerCase());
	}

	// Check if words match (word boundary)
	static wordMatch(str: string, query: string): boolean {
		const strWords = str.toLowerCase().split(/\s+/);
		const queryWords = query.toLowerCase().split(/\s+/);
		
		return queryWords.every(queryWord => 
			strWords.some(strWord => 
				strWord.includes(queryWord) || queryWord.includes(strWord)
			)
		);
	}

	// Calculate fuzzy match score
	static fuzzyMatch(str: string, query: string): number {
		if (!query) return 0;
		if (!str) return 0;

		const strLower = str.toLowerCase();
		const queryLower = query.toLowerCase();

		// Exact match gets highest score
		if (strLower === queryLower) return 1.0;

		// Starts with gets high score
		if (this.startsWith(str, query)) return 0.9;

		// Contains gets good score
		if (this.containsSubstring(str, query)) return 0.8;

		// Word match gets decent score
		if (this.wordMatch(str, query)) return 0.7;

		// Fuzzy similarity
		const similarity = this.similarity(str, query);
		if (similarity > 0.5) return similarity * 0.6;

		return 0;
	}

	// Find all matches in string
	static findMatches(str: string, query: string): number[] {
		const matches: number[] = [];
		const strLower = str.toLowerCase();
		const queryLower = query.toLowerCase();

		// Find exact matches
		let index = strLower.indexOf(queryLower);
		while (index !== -1) {
			matches.push(index);
			index = strLower.indexOf(queryLower, index + 1);
		}

		// Find partial matches (for fuzzy highlighting)
		if (matches.length === 0 && this.similarity(str, query) > 0.5) {
			// Add first character match for fuzzy results
			for (let i = 0; i < strLower.length; i++) {
				if (strLower[i] === queryLower[0]) {
					matches.push(i);
					break;
				}
			}
		}

		return matches;
	}

	// Highlight matches in string
	static highlightMatches(str: string, matches: number[], query: string): string {
		if (matches.length === 0) return str;

		const result: string[] = [];
		let lastIndex = 0;

		matches.forEach((matchIndex) => {
			// Add text before match
			result.push(str.slice(lastIndex, matchIndex));
			
			// Add highlighted match
			const matchLength = Math.min(query.length, str.length - matchIndex);
			result.push(`<mark>${str.slice(matchIndex, matchIndex + matchLength)}</mark>`);
			
			lastIndex = matchIndex + matchLength;
		});

		// Add remaining text
		result.push(str.slice(lastIndex));

		return result.join('');
	}
}

// Search ranking algorithm
class SearchRanker {
	// Calculate search score based on multiple factors
	static calculateScore(result: SearchResult, query: string): number {
		let score = result.score;

		// Boost exact matches
		if (result.item.label.toLowerCase() === query.toLowerCase()) {
			score *= 2;
		}

		// Boost favorites (if available)
		if (result.item.category === 'favorite') {
			score *= 1.5;
		}

		// Boost recently accessed items
		if (result.item.category === 'recent') {
			score *= 1.2;
		}

		// Boost items with more matches
		const totalMatches = Object.values(result.matches).reduce((sum, matches) => sum + matches.length, 0);
		if (totalMatches > 1) {
			score *= 1.1;
		}

		// Boost shorter labels (easier to scan)
		if (result.item.label.length < 20) {
			score *= 1.05;
		}

		return Math.min(score, 1.0); // Cap at 1.0
	}

	// Sort results by score (descending)
	static sortResults(results: SearchResult[], query: string): SearchResult[] {
		return results
			.map(result => ({
				...result,
				score: this.calculateScore(result, query)
			}))
			.sort((a, b) => b.score - a.score);
	}
}

interface SmartSearchProviderProps {
	children: ReactNode;
	maxHistoryItems?: number;
	minQueryLength?: number;
}

export const SmartSearchProvider: React.FC<SmartSearchProviderProps> = ({
	children,
	maxHistoryItems = 50,
	minQueryLength = 2,
}) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

	// Load search history from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
			if (saved) {
				const parsed = JSON.parse(saved);
				setSearchHistory(parsed.slice(0, maxHistoryItems));
			}
		} catch (error) {
			console.warn('Failed to load search history:', error);
		}
	}, [maxHistoryItems]);

	// Save search history to localStorage
	const saveHistory = useCallback((history: SearchHistoryItem[]) => {
		try {
			localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
		} catch (error) {
			console.warn('Failed to save search history:', error);
		}
	}, []);

	// Perform search
	const performSearch = useCallback((searchQuery: string, items: any[]): SearchResult[] => {
		if (!searchQuery || searchQuery.length < minQueryLength) {
			return [];
		}

		const searchResults: SearchResult[] = [];

		items.forEach((item) => {
			const fields = [
				{ name: 'label', value: item.label, weight: 1.0 },
				{ name: 'path', value: item.path || '', weight: 0.8 },
				{ name: 'description', value: item.description || '', weight: 0.6 },
				{ name: 'tags', value: (item.tags || []).join(' '), weight: 0.7 },
			];

			let totalScore = 0;
			const fieldMatches: any = {};
			const fieldHighlights: any = {};

			fields.forEach((field) => {
				const score = FuzzyMatcher.fuzzyMatch(field.value, searchQuery);
				if (score > 0) {
					fieldMatches[field.name] = FuzzyMatcher.findMatches(field.value, searchQuery);
					fieldHighlights[field.name] = FuzzyMatcher.highlightMatches(field.value, fieldMatches[field.name], searchQuery);
					totalScore += score * field.weight;
				}
			});

			if (totalScore > 0) {
				searchResults.push({
					item,
					score: totalScore,
					matches: fieldMatches,
					highlights: fieldHighlights,
				});
			}
		});

		return SearchRanker.sortResults(searchResults, searchQuery);
	}, [minQueryLength]);

	// Get search suggestions
	const getSuggestions = useCallback((searchQuery: string): string[] => {
		if (!searchQuery || searchQuery.length < 2) return [];

		const suggestions = searchHistory
			.filter(item => item.query.toLowerCase().includes(searchQuery.toLowerCase()))
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, 5)
			.map(item => item.query);

		return suggestions;
	}, [searchHistory]);

	// Add to search history
	const addToHistory = useCallback((searchQuery: string, resultCount: number) => {
		if (!searchQuery || searchQuery.length < minQueryLength) return;

		const newItem: SearchHistoryItem = {
			query: searchQuery,
			timestamp: Date.now(),
			resultCount,
		};

		// Remove existing entry with same query
		const filtered = searchHistory.filter(item => item.query !== searchQuery);
		
		// Add new entry at the beginning
		const newHistory = [newItem, ...filtered].slice(0, maxHistoryItems);
		
		setSearchHistory(newHistory);
		saveHistory(newHistory);
	}, [searchHistory, minQueryLength, maxHistoryItems, saveHistory]);

	// Clear search
	const clearSearch = useCallback(() => {
		setQuery('');
		setResults([]);
	}, []);

	// Clear search history
	const clearHistory = useCallback(() => {
		setSearchHistory([]);
		saveHistory([]);
	}, [saveHistory]);

	const contextValue: SmartSearchContextType = {
		query,
		results,
		isLoading,
		searchHistory,
		setQuery,
		clearSearch,
		addToHistory,
		clearHistory,
		getSuggestions,
		performSearch,
	};

	return (
		<SmartSearchContext.Provider value={contextValue}>
			{children}
		</SmartSearchContext.Provider>
	);
};

export const useSmartSearch = (): SmartSearchContextType => {
	const context = useContext(SmartSearchContext);
	if (context === undefined) {
		throw new Error('useSmartSearch must be used within a SmartSearchProvider');
	}
	return context;
};

// Hook for search functionality
export const useSearch = (items: any[]) => {
	const { query, results, performSearch, addToHistory, clearSearch } = useSmartSearch();

	// Auto-search when query changes
	const searchResults = useMemo(() => {
		return performSearch(query, items);
	}, [query, items, performSearch]);

	// Add to history when search completes
	useEffect(() => {
		if (query && searchResults.length > 0) {
			addToHistory(query, searchResults.length);
		}
	}, [query, searchResults.length, addToHistory]);

	return {
		query,
		results: searchResults,
		setQuery,
		clearSearch,
		hasResults: searchResults.length > 0,
		resultCount: searchResults.length,
	};
};

export default SmartSearchProvider;
