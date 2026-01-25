/**
 * AIDocumentationGenerator - AI-powered documentation generation
 * Phase 5: AI Features
 * 
 * Provides:
 * - Natural language documentation generation
 * - Component analysis and documentation
 * - Interactive documentation editor
 * - AI-powered content suggestions
 */

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { FiBook, FiEdit3, FiSparkles, FiCopy, FiCheck, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { useAI } from './AIProvider';

// Documentation types
interface GeneratedDocumentation {
	id: string;
	title: string;
	content: string;
	language: string;
	generatedAt: number;
	confidence: number;
	source: 'ai' | 'manual';
	editedAt?: number;
}

interface DocumentationSection {
	id: string;
	title: string;
	content: string;
	isEditing: boolean;
	suggestions?: string[];
}

interface AIDocumentationGeneratorProps {
	componentName: string;
	componentCode: string;
	onDocumentationGenerated?: (doc: GeneratedDocumentation) => void;
	onDocumentationUpdated?: (doc: GeneratedDocumentation) => void;
}

const AIDocumentationGenerator: React.FC<AIDocumentationGeneratorProps> = ({
	componentName,
	componentCode,
	onDocumentationGenerated,
	onDocumentationUpdated,
}) => {
	const { generateDocumentation } = useAI();
	
	const [documentation, setDocumentation] = useState<GeneratedDocumentation | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingContent, setEditingContent] = useState('');
	const [copied, setCopied] = useState(false);
	const [sections, setSections] = useState<DocumentationSection[]>([]);
	const [activeSection, setActiveSection] = useState<string | null>(null);

	// Generate documentation
	const handleGenerateDocumentation = useCallback(async () => {
		setIsGenerating(true);
		try {
			const doc = await generateDocumentation(componentName, componentCode);
			setDocumentation(doc);
			setEditingContent(doc.content);
			
			// Parse content into sections
			const parsedSections = parseDocumentationSections(doc.content);
			setSections(parsedSections);
			
			onDocumentationGenerated?.(doc);
		} catch (error) {
			console.error('Failed to generate documentation:', error);
		} finally {
			setIsGenerating(false);
		}
	}, [componentName, componentCode, generateDocumentation, onDocumentationGenerated]);

	// Parse documentation into sections
	const parseDocumentationSections = (content: string): DocumentationSection[] => {
		const lines = content.split('\n');
		const sections: DocumentationSection[] = [];
		let currentSection: DocumentationSection | null = null;
		let sectionContent: string[] = [];

		for (const line of lines) {
			// Check for section headers
			if (line.startsWith('# ')) {
				// Save previous section
				if (currentSection) {
					currentSection.content = sectionContent.join('\n');
					sections.push(currentSection);
				}
				
				// Start new section
				const title = line.substring(2).trim();
				currentSection = {
					id: `section-${sections.length}`,
					title,
					content: '',
					isEditing: false,
				};
				sectionContent = [];
			} else {
				sectionContent.push(line);
			}
		}

		// Add last section
		if (currentSection) {
			currentSection.content = sectionContent.join('\n');
			sections.push(currentSection);
		}

		return sections;
	};

	// Start editing
	const handleStartEditing = useCallback(() => {
		setIsEditing(true);
		setEditingContent(documentation?.content || '');
	}, [documentation]);

	// Save edits
	const handleSaveEdits = useCallback(() => {
		if (documentation) {
			const updatedDoc: GeneratedDocumentation = {
				...documentation,
				content: editingContent,
				editedAt: Date.now(),
				source: 'manual',
			};
			
			setDocumentation(updatedDoc);
			setIsEditing(false);
			
			// Re-parse sections
			const parsedSections = parseDocumentationSections(editingContent);
			setSections(parsedSections);
			
			onDocumentationUpdated?.(updatedDoc);
		}
	}, [documentation, editingContent, parseDocumentationSections, onDocumentationUpdated]);

	// Cancel editing
	const handleCancelEditing = useCallback(() => {
		setIsEditing(false);
		setEditingContent(documentation?.content || '');
	}, [documentation]);

	// Copy to clipboard
	const handleCopy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	}, []);

	// Download documentation
	const handleDownload = useCallback(() => {
		if (documentation) {
			const blob = new Blob([documentation.content], { type: 'text/markdown' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${componentName}-documentation.md`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}, [documentation, componentName]);

	// Edit section
	const handleEditSection = useCallback((sectionId: string) => {
		setSections(prev => prev.map(section => 
			section.id === sectionId 
				? { ...section, isEditing: true }
				: section
		));
		setActiveSection(sectionId);
	}, []);

	// Save section
	const handleSaveSection = useCallback((sectionId: string, content: string) => {
		setSections(prev => prev.map(section => 
			section.id === sectionId 
				? { ...section, content, isEditing: false }
				: section
		));
		
		// Update full documentation
		const fullContent = sections.map(section => 
			section.id === sectionId ? content : section.content
		).join('\n\n');
		
		if (documentation) {
			const updatedDoc: GeneratedDocumentation = {
				...documentation,
				content: fullContent,
				editedAt: Date.now(),
				source: 'manual',
			};
			
			setDocumentation(updatedDoc);
			setEditingContent(fullContent);
			onDocumentationUpdated?.(updatedDoc);
		}
		
		setActiveSection(null);
	}, [sections, documentation, onDocumentationUpdated]);

	// Cancel section edit
	const handleCancelSectionEdit = useCallback((sectionId: string) => {
		setSections(prev => prev.map(section => 
			section.id === sectionId 
				? { ...section, isEditing: false }
				: section
		));
		setActiveSection(null);
	}, []);

	// Generate suggestions for section
	const handleGenerateSuggestions = useCallback(async (sectionId: string) => {
		// In a real implementation, this would call AI to generate suggestions
		const suggestions = [
			'Add more examples to illustrate usage',
			'Include accessibility information',
			'Add performance considerations',
			'Include error handling examples',
		];
		
		setSections(prev => prev.map(section => 
			section.id === sectionId 
				? { ...section, suggestions }
				: section
		));
	}, []);

	return (
		<div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiBook />
					AI Documentation Generator
				</h2>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						onClick={handleGenerateDocumentation}
						disabled={isGenerating}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.5rem',
							background: isGenerating ? '#f3f4f6' : '#3b82f6',
							color: isGenerating ? '#6b7280' : 'white',
							cursor: isGenerating ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						{isGenerating ? (
							<>
								<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
								Generating...
							</>
						) : (
							<>
								<FiSparkles />
								Generate Documentation
							</>
						)}
					</button>
					
					{documentation && (
						<>
							<button
								onClick={handleStartEditing}
								style={{
									padding: '0.5rem 1rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									background: '#f3f4f6',
									color: '#374151',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiEdit3 />
								{isEditing ? 'Editing' : 'Edit'}
							</button>
							
							<button
								onClick={() => handleCopy(documentation.content)}
								style={{
									padding: '0.5rem 1rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									background: copied ? '#22c55e' : '#f3f4f6',
									color: copied ? 'white' : '#374151',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								{copied ? <FiCheck /> : <FiCopy />}
								{copied ? 'Copied!' : 'Copy'}
							</button>
							
							<button
								onClick={handleDownload}
								style={{
									padding: '0.5rem 1rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									background: '#f3f4f6',
									color: '#374151',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiDownload />
								Download
							</button>
						</>
					)}
				</div>
			</div>

			{isGenerating && (
				<div style={{
					padding: '2rem',
					textAlign: 'center',
					color: '#6b7280',
					background: '#f9fafb',
					borderRadius: '0.5rem',
					marginBottom: '1rem',
				}}>
					<FiRefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
					<p>AI is analyzing your component and generating documentation...</p>
					<p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
						This usually takes 2-3 seconds
					</p>
				</div>
			)}

			{documentation && !isGenerating && (
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
					{/* Main content */}
					<div>
						{isEditing ? (
							<div style={{ marginBottom: '1rem' }}>
								<textarea
									value={editingContent}
									onChange={(e) => setEditingContent(e.target.value)}
									style={{
										width: '100%',
										minHeight: '400px',
										padding: '1rem',
										border: '1px solid #d1d5db',
										borderRadius: '0.5rem',
										fontFamily: 'monospace',
										fontSize: '0.875rem',
										lineHeight: '1.5',
										resize: 'vertical',
									}}
									placeholder="Edit your documentation here..."
								/>
								<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
									<button
										onClick={handleSaveEdits}
										style={{
											padding: '0.5rem 1rem',
											border: '1px solid #22c55e',
											borderRadius: '0.5rem',
											background: '#22c55e',
											color: 'white',
											cursor: 'pointer',
										}}
									>
										Save Changes
									</button>
									<button
										onClick={handleCancelEditing}
										style={{
											padding: '0.5rem 1rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											background: '#f3f4f6',
											color: '#374151',
											cursor: 'pointer',
										}}
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<div>
								<div style={{
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '0.5rem',
									padding: '1rem',
									marginBottom: '1rem',
								}}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
										<FiBook />
										<strong>{documentation.title}</strong>
									</div>
									<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
										Generated: {new Date(documentation.generatedAt).toLocaleString()}
									</div>
									<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
										Confidence: {Math.round(documentation.confidence * 100)}%
									</div>
									{documentation.editedAt && (
										<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
											Last edited: {new Date(documentation.editedAt).toLocaleString()}
										</div>
									)}
								</div>
								
								<div style={{
									background: 'white',
									border: '1px solid #e5e7eb',
									borderRadius: '0.5rem',
									padding: '1rem',
								}}>
									<pre style={{
										margin: 0,
										whiteSpace: 'pre-wrap',
										fontFamily: 'monospace',
										fontSize: '0.875rem',
										lineHeight: '1.5',
										color: '#374151',
									}}>
										{documentation.content}
									</pre>
								</div>
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div>
						<div style={{
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '0.5rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}>
							<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Documentation Info</h3>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								<p><strong>Component:</strong> {componentName}</p>
								<p><strong>Language:</strong> {documentation.language}</p>
								<p><strong>Source:</strong> {documentation.source}</p>
								<p><strong>Length:</strong> {documentation.content.length} characters</p>
							</div>
						</div>

						{sections.length > 0 && (
							<div style={{
								background: '#f9fafb',
								border: '1px solid #e5e7eb',
								borderRadius: '0.5rem',
								padding: '1rem',
							}}>
								<h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Sections</h3>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
									{sections.map((section) => (
										<div
											key={section.id}
											style={{
												padding: '0.5rem',
												background: section.isEditing ? '#e5e7eb' : 'white',
												borderRadius: '0.25rem',
												border: '1px solid #d1d5db',
												cursor: 'pointer',
											}}
											onClick={() => !section.isEditing && handleEditSection(section.id)}
										>
											<div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
												{section.title}
											</div>
											<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
												{section.content.length} characters
											</div>
											
											{section.isEditing && (
												<div style={{ marginTop: '0.5rem' }}>
													<textarea
														value={section.content}
														onChange={(e) => {
															const newContent = e.target.value;
															setSections(prev => prev.map(s => 
																s.id === section.id 
																	? { ...s, content: newContent }
																	: s
															));
														}}
														style={{
															width: '100%',
															minHeight: '100px',
															padding: '0.5rem',
															border: '1px solid #d1d5db',
															borderRadius: '0.25rem',
															fontFamily: 'monospace',
															fontSize: '0.75rem',
															resize: 'vertical',
														}}
													/>
													<div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
														<button
															onClick={() => handleSaveSection(section.id, section.content)}
															style={{
																padding: '0.25rem 0.5rem',
																border: '1px solid #22c55e',
																borderRadius: '0.25rem',
																background: '#22c55e',
																color: 'white',
																fontSize: '0.75rem',
																cursor: 'pointer',
															}}
														>
															Save
														</button>
														<button
															onClick={() => handleCancelSectionEdit(section.id)}
															style={{
																padding: '0.25rem 0.5rem',
																border: '1px solid #d1d5db',
																borderRadius: '0.25rem',
																background: '#f3f4f6',
																color: '#374151',
																fontSize: '0.75rem',
																cursor: 'pointer',
															}}
														>
															Cancel
														</button>
														<button
															onClick={() => handleGenerateSuggestions(section.id)}
															style={{
																padding: '0.25rem 0.5rem',
																border: '1px solid #3b82f6',
																borderRadius: '0.25rem',
																background: '#3b82f6',
																color: 'white',
																fontSize: '0.75rem',
																cursor: 'pointer',
															}}
														>
															Suggestions
														</button>
													</div>
												</div>
											)}
											
											{section.suggestions && section.suggestions.length > 0 && (
												<div style={{ marginTop: '0.5rem' }}>
													<div style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
														Suggestions:
													</div>
													{section.suggestions.map((suggestion, index) => (
														<div key={index} style={{ fontSize: '0.75rem', color: '#6b7280' }}>
															• {suggestion}
														</div>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default AIDocumentationGenerator;
