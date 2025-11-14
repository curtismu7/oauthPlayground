// src/services/codeHighlightingService.ts
// Centralized service for VS Code-style code and JSON syntax highlighting

import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-python';

// VS Code Light Theme color scheme
export const VSCODE_COLORS = {
	background: '#ffffff',
	text: '#000000',
	lineNumber: '#237893',
	comment: '#6a9955',
	keyword: '#0000ff',
	string: '#a31515',
	number: '#09885a',
	function: '#795e26',
	variable: '#001080',
	type: '#267f99',
	operator: '#000000',
	bracket: '#000000',
	property: '#0000ff', // Blue for JSON keys/properties
	boolean: '#09885a', // Green for booleans
	null: '#6b7280', // Gray for null
};

export type SupportedLanguage = 'javascript' | 'typescript' | 'json' | 'go' | 'ruby' | 'python' | 'text' | 'plaintext';

/**
 * Highlight code using Prism.js with VS Code Light Theme styling
 */
export const highlightCode = (code: string, language: SupportedLanguage = 'javascript'): string => {
	// Map language aliases
	let prismLanguage = language;
	if (language === 'text' || language === 'plaintext') {
		prismLanguage = 'text';
	} else if (language === 'json') {
		prismLanguage = 'json';
	} else if (language === 'javascript' || language === 'js') {
		prismLanguage = 'javascript';
	} else if (language === 'typescript' || language === 'ts') {
		prismLanguage = 'typescript';
	}

	// Use Prism.js to highlight the code
	try {
		if (prismLanguage === 'text' || !Prism.languages[prismLanguage]) {
			// Return plain text with HTML escaping
			return code
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}
		return Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
	} catch (error) {
		console.error(`[CodeHighlightingService] Error highlighting code:`, error);
		// Fallback to HTML escaping
		return code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}
};

/**
 * Format JSON with proper indentation and highlight it
 */
export const formatAndHighlightJSON = (data: any): string => {
	try {
		const jsonString = JSON.stringify(data, null, 2);
		return highlightCode(jsonString, 'json');
	} catch (error) {
		console.error(`[CodeHighlightingService] Error formatting JSON:`, error);
		return highlightCode(String(data), 'text');
	}
};

/**
 * Get VS Code-style CSS classes for syntax highlighting
 * These can be used in styled-components or CSS
 */
export const getVSCodeStyles = () => `
	/* VS Code Light Theme syntax highlighting */
	.token.comment,
	.token.prolog,
	.token.doctype,
	.token.cdata {
		color: ${VSCODE_COLORS.comment};
	}
	
	.token.punctuation {
		color: ${VSCODE_COLORS.bracket};
	}
	
	.token.property,
	.token.tag,
	.token.constant,
	.token.symbol,
	.token.deleted {
		color: ${VSCODE_COLORS.property};
	}
	
	.token.boolean,
	.token.number {
		color: ${VSCODE_COLORS.number};
	}
	
	.token.selector,
	.token.attr-name,
	.token.string,
	.token.char,
	.token.builtin,
	.token.inserted {
		color: ${VSCODE_COLORS.string};
	}
	
	.token.operator,
	.token.entity,
	.token.url,
	.token.variable {
		color: ${VSCODE_COLORS.operator};
	}
	
	.token.atrule,
	.token.attr-value,
	.token.function,
	.token.class-name {
		color: ${VSCODE_COLORS.function};
	}
	
	.token.keyword {
		color: ${VSCODE_COLORS.keyword};
	}
	
	.token.regex,
	.token.important {
		color: #811f3f;
	}
	
	/* JSON-specific styling */
	.language-json .token.property {
		color: ${VSCODE_COLORS.property};
		font-weight: 600;
	}
	
	.language-json .token.string {
		color: ${VSCODE_COLORS.string};
	}
	
	.language-json .token.number {
		color: ${VSCODE_COLORS.number};
	}
	
	.language-json .token.boolean {
		color: ${VSCODE_COLORS.boolean};
	}
	
	.language-json .token.null {
		color: ${VSCODE_COLORS.null};
	}
`;

/**
 * React component props for code display
 */
export interface CodeDisplayProps {
	code: string;
	language?: SupportedLanguage;
	showLineNumbers?: boolean;
	maxHeight?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	showCopyButton?: boolean;
}

