/**
 * AICodeGenerator - AI-powered code generation and optimization
 * Phase 5: AI Features
 * 
 * Provides:
 * - AI-assisted code generation
 * - Code optimization suggestions
 * - Smart code completion
 * - Code quality analysis
 */

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { FiCode, FiSparkles, FiCheck, FiCopy, FiRefreshCw, FiDownload, FiZap } from 'react-icons/fi';
import { useAI } from './AIProvider';

// Code generation types
interface CodeGenerationRequest {
	prompt: string;
	context?: string;
	language: 'typescript' | 'javascript' | 'tsx' | 'jsx';
	templates?: string[];
}

interface CodeGenerationResult {
	id: string;
	code: string;
	explanation: string;
	confidence: number;
	suggestions: string[];
	generatedAt: number;
	optimized?: boolean;
	language: string;
}

interface CodeOptimization {
	id: string;
	originalCode: string;
	optimizedCode: string;
	improvements: string[];
	performanceGain: number;
	confidence: number;
	appliedAt?: number;
}

interface CodeQuality {
	score: number;
	issues: {
		type: 'error' | 'warning' | 'info';
		message: string;
		line?: number;
		column?: number;
		suggestion?: string;
	}[];
	suggestions: string[];
}

interface AICodeGeneratorProps {
	initialCode?: string;
	language?: 'typescript' | 'javascript' | 'tsx' | 'jsx';
	onCodeGenerated?: (result: CodeGenerationResult) => void;
	onCodeOptimized?: (result: CodeOptimization) => void;
}

const AICodeGenerator: React.FC<AICodeGeneratorProps> = ({
	initialCode = '',
	language = 'typescript',
	onCodeGenerated,
	onCodeOptimized,
}) => {
	const { generateCode, optimizeCode } = useAI();
	
	const [code, setCode] = useState(initialCode);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [generationResult, setGenerationResult] = useState<CodeGenerationResult | null>(null);
	const [optimizationResult, setOptimizationResult] = useState<CodeOptimization | null>(null);
	const [codeQuality, setCodeQuality] = useState<CodeQuality | null>(null);
	const [copied, setCopied] = useState(false);
	const [prompt, setPrompt] = useState('');
	const [activeTab, setActiveTab] = useState<'generate' | 'optimize' | 'quality'>('generate');

	// Generate code
	const handleGenerateCode = useCallback(async () => {
		if (!prompt.trim()) return;
		
		setIsGenerating(true);
		try {
			const request: CodeGenerationRequest = {
				prompt,
				context: code,
				language,
			};
			
			const result = await generateCode(request);
			setGenerationResult(result);
			setCode(result.code);
			onCodeGenerated?.(result);
		} catch (error) {
			console.error('Failed to generate code:', error);
		} finally {
			setIsGenerating(false);
		}
	}, [prompt, code, language, generateCode, onCodeGenerated]);

	// Optimize code
	const handleOptimizeCode = useCallback(async () => {
		if (!code.trim()) return;
		
		setIsOptimizing(true);
		try {
			const result = await optimizeCode(code, language);
			setOptimizationResult(result);
			setCode(result.code);
			onCodeOptimized?.(result);
		} catch (error) {
			console.error('Failed to optimize code:', error);
		} finally {
			setIsOptimizing(false);
		}
	}, [code, language, optimizeCode, onCodeOptimized]);

	// Analyze code quality
	const handleAnalyzeQuality = useCallback(async () => {
		// Simulate code quality analysis
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		const issues = [];
		const suggestions = [];
		let score = 100;
		
		// Basic code analysis
		const lines = code.split('\n');
		lines.forEach((line, index) => {
			const trimmedLine = line.trim();
			
			// Check for common issues
			if (trimmedLine.includes('console.log') && !trimmedLine.includes('//')) {
				issues.push({
					type: 'warning',
					message: 'Console.log statement found in production code',
					line: index + 1,
					suggestion: 'Remove or replace with proper logging',
				});
				score -= 5;
			}
			
			if (trimmedLine.includes('any') && !trimmedLine.includes('//')) {
				issues.push({
					type: 'info',
					message: 'Consider using specific types instead of any',
					line: index + 1,
					suggestion: 'Replace with specific type for better type safety',
				});
				score -= 2;
			}
			
			if (trimmedLine.length > 100) {
				issues.push({
					type: 'info',
					message: 'Line is very long, consider breaking it up',
					line: index + 1,
					suggestion: 'Break long lines into multiple lines for better readability',
				});
				score -= 1;
			}
		});
		
		// Add suggestions
		if (code.includes('useState') && !code.includes('useCallback')) {
			suggestions.push('Consider using useCallback for functions that depend on props/state');
		}
		
		if (code.includes('useEffect') && !code.includes('cleanup')) {
			suggestions.push('Add cleanup function to useEffect to prevent memory leaks');
		}
		
		setCodeQuality({
			score: Math.max(0, score),
			issues,
			suggestions,
		});
	}, [code]);

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

	// Download code
	const handleDownload = useCallback(() => {
		const blob = new Blob([code], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `generated-code.${language}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [code, language]);

	// Clear code
	const handleClear = useCallback(() => {
		setCode('');
		setPrompt('');
		setGenerationResult(null);
		setOptimizationResult(null);
		setCodeQuality(null);
	}, []);

	// Apply suggestion
	const handleApplySuggestion = useCallback((suggestion: string) => {
		if (codeQuality) {
			const newCode = code + '\n\n' + suggestion;
			setCode(newCode);
			handleAnalyzeQuality();
		}
	}, [code, codeQuality, handleAnalyzeQuality]);

	// Get language icon
	const getLanguageIcon = () => {
		switch (language) {
			case 'typescript': return '📘';
			case 'javascript': return '🟨';
			case 'tsx': return '⚛️';
			case 'jsx': return '⚛️';
			default: return '📄';
		}
	};

	// Get language color
	const getLanguageColor = () => {
		switch (language) {
			case 'typescript': return '#3178c6';
			case 'javascript': return '#f7df1e';
			case 'tsx': return '#61dafb';
			case 'jsx': return '#61dafb';
			default: return '#6b7280';
		}
	};

	return (
		<div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiCode />
					AI Code Generator
				</h2>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						onClick={() => setActiveTab('generate')}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.5rem',
							background: activeTab === 'generate' ? '#3b82f6' : '#f3f4f6',
							color: activeTab === 'generate' ? 'white' : '#374151',
							cursor: 'pointer',
							fontSize: '0.875rem',
						}}
					>
						Generate
					</button>
					<button
						onClick={() => setActiveTab('optimize')}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.5rem',
							background: activeTab === 'optimize' ? '#3b82f6' : '#f3f4f6',
							color: activeTab === 'optimize' ? 'white' : '#374151',
							cursor: 'pointer',
							fontSize: '0.875rem',
						}}
					>
						Optimize
					</button>
					<button
						onClick={() => setActiveTab('quality')}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid #d1d5db',
							borderRadius: '0	5rem',
							background: activeTab === 'quality' ? '#3b82f6' : '#f3f4f6',
							color: activeTab === 'quality' ? 'white' : '#374151',
							cursor: 'pointer',
							fontSize: '0.875rem',
						}}
					>
						Quality
					</button>
				</div>
			</div>

			{/* Code Input */}
			<div style={{ marginBottom: '1rem' }}>
				<div style={{ marginBottom: '0.5rem' }}>
					<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
						{activeTab === 'generate' ? 'Prompt' : activeTab === 'optimize' ? 'Code to Optimize' : 'Code to Analyze'}
					</label>
					{activeTab === 'generate' && (
						<textarea
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="Describe the code you want to generate..."
							style={{
								width: '100%',
								minHeight: '100px',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
								resize: 'vertical',
							}}
						/>
					)}
					{activeTab === 'optimize' && (
						<textarea
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="Paste code to optimize..."
							style={{
								width: '100%',
								minHeight: '200px',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
								resize: 'vertical',
							}}
						/>
					)}
					{activeTab === 'quality' && (
						<textarea
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="Paste code to analyze..."
							style={{
								width: '100%',
								minHeight: '200px',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
								resize: 'vertical',
							}}
						/>
					)}
				</div>
				
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{activeTab === 'generate' && (
						<button
							onClick={handleGenerateCode}
							disabled={isGenerating || !prompt.trim()}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								background: (isGenerating || !prompt.trim()) ? '#f3f4f6' : '#3b82f6',
								color: (isGenerating || !prompt.trim()) ? '#6b7280' : 'white',
								cursor: (isGenerating || !prompt.trim()) ? 'not-allowed' : 'pointer',
								fontSize: '0.875rem',
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
									Generate Code
								</>
							)}
						</button>
					)}
					{activeTab === 'optimize' && (
						<button
							onClick={handleOptimizeCode}
							disabled={isOptimizing || !code.trim()}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								background: (isOptimizing || !code.trim()) ? '#f3f4f6' : '#3b82f6',
								color: (isOptimizing || !code.trim()) ? '#6b7280' : 'white',
								cursor: (isOptimizing || !code.trim()) ? 'not-allowed' : 'pointer',
								fontSize: '0.875rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							{isOptimizing ? (
								<>
									<FiZap style={{ animation: 'spin 1s linear infinite' }} />
									Optimizing...
								</>
							) : (
								<>
									<FiZap />
									Optimize Code
								</>
							)}
						</button>
					)}
					{activeTab === 'quality' && (
						<button
							onClick={handleAnalyzeQuality}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								background: '#3b82f6',
								color: 'white',
								cursor: 'pointer',
								fontSize: '0.875rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiCheckCircle />
							Analyze Quality
						</button>
					)}
					
					{code && (
						<button
							onClick={handleClear}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								background: '#f3f4f6',
								color: '#374151',
								cursor: 'pointer',
								fontSize: '0.875rem',
							}}
						>
							Clear
						</button>
					)}
				</div>
			</div>

			{/* Code Editor */}
			{code && (
				<div style={{ marginBottom: '1rem' }}>
					<div style={{
						background: '#1e293b',
						border: '1px solid #374151',
						borderRadius: '0.5rem',
						padding: '1rem',
						position: 'relative',
					}}>
						<div style={{
							position: 'absolute',
							top: '0.5rem',
							right: '0.5rem',
							padding: '0.25rem 0.5rem',
							background: '#374151',
							color: 'white',
							borderRadius: '0.25rem',
							fontSize: '0.75rem',
							fontWeight: '600',
						}}>
							{getLanguageIcon()} {language}
						</div>
						<pre
							style={{
								margin: 0,
								padding: '1rem',
								color: '#f9fafb',
								fontFamily: 'monospace',
								fontSize: '0.875rem',
								lineHeight: '1.5',
								overflow: 'auto',
								maxHeight: '400px',
								whiteSpace: 'pre-wrap',
							}}
						>
							<code>{code}</code>
						</pre>
					</div>
					
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
						<button
							onClick={() => handleCopy(code)}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								background: copied ? '#22c55e' : '#f3f4f6',
								color: copied ? 'white' : '#374151',
								cursor: 'pointer',
								fontSize: '0.875rem',
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
								fontSize: '0.875rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiDownload />
							Download
						</button>
					</div>
				</div>
			)}

			{/* Results */}
			{generationResult && (
				<div style={{
					background: '#f0f9ff',
					border: '1px solid #0ea5e9',
					borderRadius: '0.5rem',
					padding: '1rem',
					marginBottom: '1rem',
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						<FiCheckCircle style={{ color: '#22c55e' }} />
						<span style={{ fontWeight: '600', color: '#0c4a6e' }}>
							Code Generated Successfully
						</span>
					</div>
					
					<div style={{ marginBottom: '0.5rem' }}>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
							<strong>Explanation:</strong> {generationResult.explanation}
						</div>
					</div>
					
					<div style={{ marginBottom: '0.5rem' }}>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
							<strong>Confidence:</strong> {Math.round(generationResult.confidence * 100)}%
						</div>
					</div>
					
					{generationResult.suggestions.length > 0 && (
						<div>
							<div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
								AI Suggestions:
							</div>
							<ul style={{ margin: 0, paddingLeft: '1rem', color: '#64748b' }}>
								{generationResult.suggestions.map((suggestion, index) => (
									<li key={index} style={{ marginBottom: '0.25rem' }}>
										{suggestion}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{optimizationResult && (
				<div style={{
					background: '#f0fdf4',
					border: '1px solid #22c55e',
					borderRadius: '0.5rem',
					padding: '1rem',
					marginBottom: '1rem',
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						<FiZap style={{ color: '#22c55e' }} />
						<span style={{ fontWeight: '600', color: '#166534' }}>
							Code Optimized
						</span>
					</div>
					
					<div style={{ marginBottom: '0.5rem' }}>
						<div style={{ fontSize: '0.875rem', color: '#166534' }}>
							<strong>Performance Gain:</strong> {optimizationResult.performanceGain}%
						</div>
					</div>
					
					<div style={{ marginBottom: '0.5rem' }}>
						<div style={{ fontSize: '0.875rem', color: '#166534' }}>
							<strong>Confidence:</strong> {Math.round(optimizationResult.confidence * 100)}%
						</div>
					</div>
					
					{optimizationResult.improvements.length > 0 && (
						<div>
							<div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
								Improvements:
							</div>
							<ul style={{ margin: 0, paddingLeft: '1rem', color: '#166534' }}>
								{optimizationResult.improvements.map((improvement, index) => (
									<li key={index} style={{ marginBottom: '0.25rem' }}>
										{improvement}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{codeQuality && (
				<div style={{
					background: '#fef3c7',
					border: '1px solid #f59e0b',
					borderRadius: '0.5rem',
					padding: '1rem',
					marginBottom: '1rem',
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						<FiCheckCircle style={{ color: '#22c55e' }} />
						<span style={{ fontWeight: '600', color: '#166534' }}>
							Code Quality Analysis Complete
						</span>
					</div>
					
					<div style={{ marginBottom: '0.5rem' }}>
						<div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>
							Score Score: {codeQuality.score}/100
						</div>
					</div>
					
					{codeQuality.issues.length > 0 && (
						<div>
							<div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
								Issues Found ({codeQuality.issues.length})
							</div>
							<div style={{ maxHeight: '200px', overflowY: 'auto' }}>
								{codeQuality.issues.map((issue, index) => (
									<div
										key={index}
										style={{
											padding: '0.5rem',
											borderBottom: '1px solid #f59e0b',
											background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
										}}
									>
										<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
											<span style={{
												color: issue.type === 'error' ? '#ef4444' : issue.type === 'warning' ? '#f59e0b' : '#3b82f6',
												fontWeight: 'bold',
											}}>
												{issue.type.toUpperCase()}
											</span>
											<span style={{ flex: 1 }}>
												{issue.message}
											</span>
										</div>
										{issue.suggestion && (
											<div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
												💡 {issue.suggestion}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}
					
					{codeQuality.suggestions.length > 0 && (
						<div>
							<div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
								Suggestions ({codeQuality.suggestions.length})
							</div>
							<ul style={{ margin: 0, paddingLeft: '1rem', color: '#166534' }}>
								{codeQuality.suggestions.map((suggestion, index) => (
									<li key={index} style={{ marginBottom: '0.25rem' }}>
										{suggestion}
									</li>
								))}
							</ul>
						</div>
					)}
					
					{codeQuality.suggestions.length > 0 && (
						<div style={{ marginTop: '1rem' }}>
							<div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
								Quick Actions:
							</div>
							<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
								{codeQuality.suggestions.slice(0, 3).map((suggestion, index) => (
									<button
										key={index}
										onClick={() => handleApplySuggestion(suggestion)}
										style={{
											padding: '0.375rem 0.75rem',
											border: '1px solid #166534',
											borderRadius: '0.375rem',
											background: '#166534',
											color: 'white',
											cursor: 'pointer',
											fontSize: '0.75rem',
										}}
									>
										Apply
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default AICodeGenerator;
