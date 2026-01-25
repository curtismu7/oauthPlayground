/**
 * APIDocumentation - Complete API documentation system
 * Phase 4: Developer Experience
 * 
 * Provides:
 * - Interactive API documentation
 * - Component prop documentation
 * - Hook documentation
 * - Code examples
 * - Type definitions
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FiBook, FiCode, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';

// API documentation interfaces
export interface APIParameter {
	name: string;
	type: string;
	description: string;
	required?: boolean;
	defaultValue?: any;
	example?: any;
}

export interface APIMethod {
	name: string;
	description: string;
	parameters: APIParameter[];
	returns: {
		type: string;
		description: string;
	};
	example?: string;
	deprecated?: boolean;
	since?: string;
}

export interface ComponentDoc {
	name: string;
	description: string;
	props: APIParameter[];
	examples: CodeExample[];
	relatedComponents?: string[];
	themeable?: boolean;
	accessible?: boolean;
}

export interface HookDoc {
	name: string;
	description: string;
	parameters: APIParameter[];
	returns: {
		type: string;
		description: string;
	};
	example?: string;
	relatedHooks?: string[];
}

export interface CodeExample {
	title: string;
	description?: string;
	code: string;
	language: 'typescript' | 'javascript' | 'jsx' | 'tsx';
	live?: boolean;
}

export interface DocumentationContextType {
	components: Map<string, ComponentDoc>;
	hooks: Map<string, HookDoc>;
	methods: Map<string, APIMethod>;
	
	// Documentation access
	getComponentDoc: (name: string) => ComponentDoc | undefined;
	getHookDoc: (name: string) => HookDoc | undefined;
	getMethodDoc: (name: string) => APIMethod | undefined;
	
	// Search
	searchDocs: (query: string) => SearchResult[];
	
	// Examples
	getExamples: (name: string, type: 'component' | 'hook') => CodeExample[];
	
	// Utilities
	copyToClipboard: (text: string) => Promise<void>;
}

export interface SearchResult {
	type: 'component' | 'hook' | 'method';
	name: string;
	description: string;
	relevance: number;
}

// Component documentation data
const COMPONENT_DOCS: ComponentDoc[] = [
	{
		name: 'SidebarAdvanced',
		description: 'Complete advanced sidebar with Phase 1-3 features including favorites, recent items, smart search, and user preferences.',
		props: [
			{
				name: 'isOpen',
				type: 'boolean',
				description: 'Whether the sidebar is open',
				required: true,
				defaultValue: false,
			},
			{
				name: 'onClose',
				type: '() => void',
				description: 'Callback when sidebar is closed',
				required: true,
			},
			{
				name: 'initialWidth',
				type: 'number',
				description: 'Initial width of the sidebar',
				required: false,
				defaultValue: 450,
			},
			{
				name: 'minWidth',
				type: 'number',
				description: 'Minimum width of the sidebar',
				required: false,
				defaultValue: 300,
			},
			{
				name: 'maxWidth',
				type: 'number',
				description: 'Maximum width of the sidebar',
				required: false,
				defaultValue: 600,
			},
		],
		examples: [
			{
				title: 'Basic Usage',
				description: 'Simple sidebar implementation',
				code: `import SidebarAdvanced from './components/SidebarAdvanced';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <SidebarAdvanced
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
}`,
				language: 'tsx',
				live: true,
			},
			{
				title: 'Custom Configuration',
				description: 'Sidebar with custom dimensions',
				code: `<SidebarAdvanced
  isOpen={isOpen}
  onClose={onClose}
  initialWidth={500}
  minWidth={350}
  maxWidth={700}
/>`,
				language: 'tsx',
			},
		],
		relatedComponents: ['SidebarEnhanced', 'SidebarMenuAdvanced'],
		themeable: true,
		accessible: true,
	},
	{
		name: 'SidebarMenuAdvanced',
		description: 'Advanced menu component with favorites, recent items, and smart search integration.',
		props: [
			{
				name: 'dragMode',
				type: 'boolean',
				description: 'Whether drag and drop mode is enabled',
				required: false,
				defaultValue: false,
			},
			{
				name: 'searchQuery',
				type: 'string',
				description: 'Current search query',
				required: false,
				defaultValue: '',
			},
			{
				name: 'menuGroups',
				type: 'MenuGroup[]',
				description: 'Array of menu groups to display',
				required: true,
			},
			{
				name: 'onToggleSection',
				type: '(groupId: string) => void',
				description: 'Callback when section is toggled',
				required: true,
			},
		],
		examples: [
			{
				title: 'With Search',
				description: 'Menu with search functionality',
				code: `<SidebarMenuAdvanced
  dragMode={false}
  searchQuery={searchQuery}
  menuGroups={menuGroups}
  onToggleSection={handleToggle}
/>`,
				language: 'tsx',
			},
		],
		relatedComponents: ['SidebarMenuEnhanced', 'SidebarMenu'],
		themeable: true,
		accessible: true,
	},
];

// Hook documentation data
const HOOK_DOCS: HookDoc[] = [
	{
		name: 'useUserPreferences',
		description: 'Hook for managing user preferences including favorites, recent items, and personalization settings.',
		parameters: [],
		returns: {
			type: 'UserPreferencesContextType',
			description: 'Object containing preferences and management functions',
		},
		example: `const {
  preferences,
  addFavorite,
  removeFavorite,
  isFavorite,
  updatePreferences,
  resetPreferences
} = useUserPreferences();

// Add to favorites
addFavorite({
  id: 'item-id',
  path: '/path',
  label: 'Item Label',
  icon: <FiStar />,
  category: 'production'
});`,
		relatedHooks: ['useFavorites', 'useRecentItems', 'usePreferences'],
	},
	{
		name: 'useSmartSearch',
		description: 'Hook for smart search functionality with fuzzy matching and search history.',
		parameters: [],
		returns: {
			type: 'SmartSearchContextType',
			description: 'Object containing search state and functions',
		},
		example: `const {
  query,
  results,
  setQuery,
  clearSearch,
  getSuggestions,
  performSearch
} = useSmartSearch();

// Perform search
const searchResults = performSearch('oauth', menuItems);`,
		relatedHooks: ['useSearch'],
	},
	{
		name: 'useDesignTokens',
		description: 'Hook for accessing and managing design system tokens and themes.',
		parameters: [],
		returns: {
			type: 'DesignTokenContextType',
			description: 'Object containing theme tokens and management functions',
		},
		example: `const {
  theme,
  setTheme,
  tokens,
  getToken,
  updateTokens
} = useDesignTokens();

// Get a token value
const primaryColor = getToken('colors.primary.500');

// Update theme
setTheme(darkTheme);`,
		relatedHooks: ['useTheme', 'useTokens'],
	},
	{
		name: 'usePluginSystem',
		description: 'Hook for managing sidebar plugins and extensions.',
		parameters: [],
		returns: {
			type: 'PluginContextType',
			description: 'Object containing plugin management functions',
		},
		example: `const {
  plugins,
  registerPlugin,
  activatePlugin,
  getPluginAPI
} = usePluginSystem();

// Register a plugin
registerPlugin(myPlugin);`,
		relatedHooks: ['usePlugin', 'usePluginMenu'],
	},
	{
		name: 'usePerformance',
		description: 'Hook for performance monitoring and analytics.',
		parameters: [],
		returns: {
			type: 'PerformanceContextType',
			description: 'Object containing performance metrics and monitoring functions',
		},
		example: `const {
  metrics,
  isMonitoring,
  trackRender,
  getPerformanceReport
} = usePerformance();

// Track component render
trackRender('MyComponent', renderTime);`,
		relatedHooks: ['usePerformanceTracker'],
	},
];

// Method documentation data
const METHOD_DOCS: APIMethod[] = [
	{
		name: 'addFavorite',
		description: 'Add an item to the user favorites',
		parameters: [
			{
				name: 'item',
				type: 'Omit<FavoriteItem, "addedAt">',
				description: 'The item to add to favorites',
				required: true,
			},
		],
		returns: {
			type: 'void',
			description: 'No return value',
		},
		example: `addFavorite({
  id: 'unified-oauth-flow',
  path: '/v8u/unified',
  label: 'Unified OAuth & OIDC',
  icon: <FiZap />,
  category: 'production'
});`,
		since: '3.0.0',
	},
	{
		name: 'performSearch',
		description: 'Perform smart search with fuzzy matching',
		parameters: [
			{
				name: 'query',
				type: 'string',
				description: 'The search query',
				required: true,
			},
			{
				name: 'items',
				type: 'any[]',
				description: 'Array of items to search through',
				required: true,
			},
		],
		returns: {
			type: 'SearchResult[]',
			description: 'Array of search results with scores',
		},
		example: `const results = performSearch('oauth', menuItems);
// Returns: [{ item, score: 0.9, matches: {...}, highlights: {...} }]`,
		since: '3.0.0',
	},
	{
		name: 'getToken',
		description: 'Get a design token value by path',
		parameters: [
			{
				name: 'path',
				type: 'string',
				description: 'Dot-separated path to the token (e.g., "colors.primary.500")',
				required: true,
			},
		],
		returns: {
			type: 'string | number',
			description: 'The token value',
		},
		example: `const primaryColor = getToken('colors.primary.500'); // Returns '#3b82f6'
const spacing = getToken('spacing.md'); // Returns '1rem'`,
		since: '4.0.0',
	},
];

const DocumentationContext = createContext<DocumentationContextType | undefined>(undefined);

interface DocumentationProviderProps {
	children: ReactNode;
	customDocs?: {
		components?: ComponentDoc[];
		hooks?: HookDoc[];
		methods?: APIMethod[];
	};
}

export const DocumentationProvider: React.FC<DocumentationProviderProps> = ({
	children,
	customDocs = {},
}) => {
	const [components] = useState<Map<string, ComponentDoc>>(() => {
		const map = new Map<string, ComponentDoc>();
		[...COMPONENT_DOCS, ...(customDocs.components || [])].forEach(doc => {
			map.set(doc.name, doc);
		});
		return map;
	});

	const [hooks] = useState<Map<string, HookDoc>>(() => {
		const map = new Map<string, HookDoc>();
		[...HOOK_DOCS, ...(customDocs.hooks || [])].forEach(doc => {
			map.set(doc.name, doc);
		});
		return map;
	});

	const [methods] = useState<Map<string, APIMethod>>(() => {
		const map = new Map<string, APIMethod>();
		[...METHOD_DOCS, ...(customDocs.methods || [])].forEach(doc => {
			map.set(doc.name, doc);
		});
		return map;
	});

	// Get component documentation
	const getComponentDoc = useCallback((name: string) => {
		return components.get(name);
	}, [components]);

	// Get hook documentation
	const getHookDoc = useCallback((name: string) => {
		return hooks.get(name);
	}, [hooks]);

	// Get method documentation
	const getMethodDoc = useCallback((name: string) => {
		return methods.get(name);
	}, [methods]);

	// Search documentation
	const searchDocs = useCallback((query: string): SearchResult[] => {
		const results: SearchResult[] = [];
		const lowerQuery = query.toLowerCase();

		// Search components
		components.forEach((doc, name) => {
			const relevance = calculateRelevance(doc, lowerQuery);
			if (relevance > 0) {
				results.push({
					type: 'component',
					name,
					description: doc.description,
					relevance,
				});
			}
		});

		// Search hooks
		hooks.forEach((doc, name) => {
			const relevance = calculateRelevance(doc, lowerQuery);
			if (relevance > 0) {
				results.push({
					type: 'hook',
					name,
					description: doc.description,
					relevance,
				});
			}
		});

		// Search methods
		methods.forEach((doc, name) => {
			const relevance = calculateRelevance(doc, lowerQuery);
			if (relevance > 0) {
				results.push({
					type: 'method',
					name,
					description: doc.description,
					relevance,
				});
			}
		});

		return results.sort((a, b) => b.relevance - a.relevance);
	}, [components, hooks, methods]);

	// Calculate relevance score
	const calculateRelevance = (doc: any, query: string): number => {
		let score = 0;
		
		// Exact name match
		if (doc.name.toLowerCase() === query) {
			score += 100;
		}
		// Name starts with query
		else if (doc.name.toLowerCase().startsWith(query)) {
			score += 80;
		}
		// Name contains query
		else if (doc.name.toLowerCase().includes(query)) {
			score += 60;
		}
		
		// Description contains query
		if (doc.description.toLowerCase().includes(query)) {
			score += 40;
		}
		
		return score;
	};

	// Get examples
	const getExamples = useCallback((name: string, type: 'component' | 'hook'): CodeExample[] => {
		const doc = type === 'component' ? components.get(name) : hooks.get(name);
		return doc?.examples || [];
	}, [components, hooks]);

	// Copy to clipboard
	const copyToClipboard = useCallback(async (text: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
		} catch (error) {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}
	}, []);

	const contextValue: DocumentationContextType = {
		components,
		hooks,
		methods,
		getComponentDoc,
		getHookDoc,
		getMethodDoc,
		searchDocs,
		getExamples,
		copyToClipboard,
	};

	return (
		<DocumentationContext.Provider value={contextValue}>
			{children}
		</DocumentationContext.Provider>
	);
};

export const useDocumentation = (): DocumentationContextType => {
	const context = useContext(DocumentationContext);
	if (context === undefined) {
		throw new Error('useDocumentation must be used within a DocumentationProvider');
	}
	return context;
};

// API Documentation Viewer Component
export const APIDocumentationViewer: React.FC<{
	initialQuery?: string;
	showSearch?: boolean;
}> = ({ initialQuery = '', showSearch = true }) => {
	const { searchDocs, getComponentDoc, getHookDoc, getMethodDoc, copyToClipboard } = useDocumentation();
	const [query, setQuery] = useState(initialQuery);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [copiedCode, setCopiedCode] = useState<string>('');
	const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

	// Search when query changes
	React.useEffect(() => {
		if (query.trim()) {
			const searchResults = searchDocs(query);
			setResults(searchResults);
		} else {
			setResults([]);
		}
	}, [query, searchDocs]);

	// Handle copy to clipboard
	const handleCopyCode = async (code: string) => {
		await copyToClipboard(code);
		setCopiedCode(code);
		setTimeout(() => setCopiedCode(''), 2000);
	};

	// Get documentation for selected item
	const getSelectedItemDoc = () => {
		if (!selectedItem) return null;

		switch (selectedItem.type) {
			case 'component':
				return getComponentDoc(selectedItem.name);
			case 'hook':
				return getHookDoc(selectedItem.name);
			case 'method':
				return getMethodDoc(selectedItem.name);
			default:
				return null;
		}
	};

	const selectedDoc = getSelectedItemDoc();

	return (
		<div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
			{showSearch && (
				<div style={{ marginBottom: '1rem' }}>
					<input
						type="text"
						placeholder="Search documentation..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						style={{
							width: '100%',
							padding: '0.75rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.5rem',
							fontSize: '1rem',
						}}
					/>
				</div>
			)}

			<div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
				{/* Search Results */}
				<div>
					<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
						{query ? 'Search Results' : 'Documentation'}
					</h3>
					
					{query && results.length === 0 && (
						<p style={{ color: '#6b7280', fontStyle: 'italic' }}>No results found</p>
					)}

					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
						{!query && (
							<>
								<div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
									Components
								</div>
								{Array.from(getComponentDoc ? [] : []).map(([name]) => (
									<div
										key={name}
										style={{
											padding: '0.5rem',
											borderRadius: '0.25rem',
											cursor: 'pointer',
											background: selectedItem?.name === name ? '#e5e7eb' : 'transparent',
										}}
										onClick={() => setSelectedItem({ type: 'component', name, description: '', relevance: 0 })}
									>
										<FiBook style={{ marginRight: '0.5rem' }} />
										{name}
									</div>
								))}
								
								<div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', marginTop: '1rem' }}>
									Hooks
								</div>
								{Array.from(getHookDoc ? [] : []).map(([name]) => (
									<div
										key={name}
										style={{
											padding: '0.5rem',
											borderRadius: '0.25rem',
											cursor: 'pointer',
											background: selectedItem?.name === name ? '#e5e7eb' : 'transparent',
										}}
										onClick={() => setSelectedItem({ type: 'hook', name, description: '', relevance: 0 })}
									>
										<FiCode style={{ marginRight: '0.5rem' }} />
										{name}
									</div>
								))}
							</>
						)}

						{results.map((result) => (
							<div
								key={`${result.type}-${result.name}`}
								style={{
									padding: '0.5rem',
									borderRadius: '0.25rem',
									cursor: 'pointer',
									background: selectedItem?.name === result.name ? '#e5e7eb' : 'transparent',
								}}
								onClick={() => setSelectedItem(result)}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									{result.type === 'component' && <FiBook />}
									{result.type === 'hook' && <FiCode />}
									{result.type === 'method' && <FiExternalLink />}
									<span style={{ fontWeight: '500' }}>{result.name}</span>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
									{result.description}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Documentation Content */}
				<div>
					{selectedDoc && selectedItem && (
						<div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
								{selectedItem.type === 'component' && <FiBook />}
								{selectedItem.type === 'hook' && <FiCode />}
								{selectedItem.type === 'method' && <FiExternalLink />}
								<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
									{selectedDoc.name}
								</h2>
								{selectedDoc.deprecated && (
									<span style={{ 
										padding: '0.25rem 0.5rem', 
										background: '#fef3c7', 
										color: '#92400e', 
										borderRadius: '0.25rem',
										fontSize: '0.875rem',
										fontWeight: '600'
									}}>
										Deprecated
									</span>
								)}
							</div>

							<p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1.5rem' }}>
								{selectedDoc.description}
							</p>

							{'props' in selectedDoc && selectedDoc.props.length > 0 && (
								<div style={{ marginBottom: '1.5rem' }}>
									<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
										Props
									</h3>
									<div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
										{selectedDoc.props.map((prop, index) => (
											<div
												key={prop.name}
												style={{
													padding: '1rem',
													borderBottom: index < selectedDoc.props.length - 1 ? '1px solid #f3f4f6' : 'none',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
													<span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{prop.name}</span>
													<span style={{ 
														padding: '0.125rem 0.375rem', 
														background: '#f3f4f6', 
														borderRadius: '0.25rem',
														fontSize: '0.875rem',
														fontFamily: 'monospace'
													}}>
														{prop.type}
													</span>
													{prop.required && (
														<span style={{ 
															padding: '0.125rem 0.375rem', 
															background: '#ef4444', 
															color: 'white',
															borderRadius: '0.25rem',
															fontSize: '0.75rem',
															fontWeight: '600'
														}}>
															Required
														</span>
													)}
												</div>
												<p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0' }}>
													{prop.description}
												</p>
												{prop.defaultValue !== undefined && (
													<p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
														<strong>Default:</strong> <code>{JSON.stringify(prop.defaultValue)}</code>
													</p>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{'example' in selectedDoc && selectedDoc.example && (
								<div style={{ marginBottom: '1.5rem' }}>
									<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
										Example
									</h3>
									<div style={{ position: 'relative' }}>
										<pre
											style={{
												background: '#1f2937',
												color: '#f9fafb',
												padding: '1rem',
												borderRadius: '0.5rem',
												overflow: 'auto',
												fontSize: '0.875rem',
												lineHeight: '1.5',
											}}
										>
											<code>{selectedDoc.example}</code>
										</pre>
										<button
											onClick={() => handleCopyCode(selectedDoc.example!)}
											style={{
												position: 'absolute',
												top: '0.5rem',
												right: '0.5rem',
												padding: '0.25rem 0.5rem',
												background: '#374151',
												color: 'white',
												border: 'none',
												borderRadius: '0.25rem',
												cursor: 'pointer',
												fontSize: '0.75rem',
												display: 'flex',
												alignItems: 'center',
												gap: '0.25rem',
											}}
										>
											{copiedCode === selectedDoc.example ? <FiCheck /> : <FiCopy />}
											{copiedCode === selectedDoc.example ? 'Copied!' : 'Copy'}
										</button>
									</div>
								</div>
							)}

							{'examples' in selectedDoc && selectedDoc.examples.length > 0 && (
								<div style={{ marginBottom: '1.5rem' }}>
									<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
										Examples
									</h3>
									{selectedDoc.examples.map((example, index) => (
										<div key={index} style={{ marginBottom: '1rem' }}>
											<h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
												{example.title}
											</h4>
											{example.description && (
												<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
													{example.description}
												</p>
											)}
											<div style={{ position: 'relative' }}>
												<pre
													style={{
														background: '#1f2937',
														color: '#f9fafb',
														padding: '1rem',
														borderRadius: '0.5rem',
														overflow: 'auto',
														fontSize: '0.875rem',
														lineHeight: '1.5',
													}}
												>
													<code>{example.code}</code>
												</pre>
												<button
													onClick={() => handleCopyCode(example.code)}
													style={{
														position: 'absolute',
														top: '0.5rem',
														right: '0.5rem',
														padding: '0.25rem 0.5rem',
														background: '#374151',
														color: 'white',
														border: 'none',
														borderRadius: '0.25rem',
														cursor: 'pointer',
														fontSize: '0.75rem',
														display: 'flex',
														alignItems: 'center',
														gap: '0.25rem',
													}}
												>
													{copiedCode === example.code ? <FiCheck /> : <FiCopy />}
													{copiedCode === example.code ? 'Copied!' : 'Copy'}
												</button>
											</div>
										</div>
									))}
								</div>
							)}

							{'returns' in selectedDoc && (
								<div style={{ marginBottom: '1.5rem' }}>
									<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
										Returns
									</h3>
									<div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
										<div style={{ fontFamily: 'monospace', marginBottom: '0.5rem' }}>
											{selectedDoc.returns.type}
										</div>
										<div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
											{selectedDoc.returns.description}
										</div>
									</div>
								</div>
							)}

							{'relatedComponents' in selectedDoc && selectedDoc.relatedComponents && selectedDoc.relatedComponents.length > 0 && (
								<div style={{ marginBottom: '1.5rem' }}>
									<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
										Related
									</h3>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
										{(selectedDoc.relatedComponents as string[]).map((related) => (
											<span
												key={related}
												style={{
													padding: '0.25rem 0.75rem',
													background: '#e5e7eb',
													borderRadius: '1rem',
													fontSize: '0.875rem',
													cursor: 'pointer',
												}}
												onClick={() => setSelectedItem({
													type: 'component',
													name: related,
													description: '',
													relevance: 0,
												})}
											>
												{related}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{!selectedDoc && (
						<div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
							<FiBook size={48} style={{ marginBottom: '1rem' }} />
							<p>Select a component, hook, or method to view its documentation</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default DocumentationProvider;
