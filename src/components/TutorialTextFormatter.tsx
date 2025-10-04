// src/components/TutorialTextFormatter.tsx
import React from 'react';
import styled from 'styled-components';

interface TutorialTextFormatterProps {
	content: string;
	type?:
		| 'info'
		| 'code'
		| 'diagram'
		| 'security'
		| 'validation'
		| 'comparison'
		| 'jwt'
		| 'claims'
		| 'discovery'
		| 'architecture'
		| 'enterprise';
}

const ContentContainer = styled.div<{ $type: string }>`
	line-height: 1.7;
	font-size: 1rem;
	color: #1f2937;

	/* Base styling for all content types */
	p {
		margin-bottom: 1.5rem;
		font-size: 1.05rem;
		line-height: 1.8;
	}

	/* Enhanced typography for better readability */
	h1, h2, h3, h4, h5, h6 {
		color: #1f2937;
		margin-top: 2rem;
		margin-bottom: 1rem;
		font-weight: 600;
		line-height: 1.3;
	}

	h1 { font-size: 1.5rem; }
	h2 { font-size: 1.25rem; }
	h3 { font-size: 1.125rem; }
	h4, h5, h6 { font-size: 1rem; }

	/* Enhanced list styling */
	ul, ol {
		margin: 1.5rem 0;
		padding-left: 2rem;
	}

	li {
		margin-bottom: 0.75rem;
		line-height: 1.6;
	}

	/* Enhanced blockquote styling */
	blockquote {
		border-left: 4px solid #3b82f6;
		padding: 1rem 1.5rem;
		margin: 1.5rem 0;
		background: #f8fafc;
		border-radius: 0 0.5rem 0.5rem 0;
		font-style: italic;
		color: #374151;
	}

	/* Enhanced code styling */
	code {
		background: #f1f5f9;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
		color: #1e293b;
		border: 1px solid #e2e8f0;
	}

	pre {
		background: #1e293b;
		color: #f1f5f9;
		padding: 1.5rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1.5rem 0;
		border: 1px solid #334155;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
		line-height: 1.5;

		code {
			background: transparent;
			padding: 0;
			border: none;
			color: inherit;
		}
	}

	/* Type-specific styling */
	${({ $type }) => {
		switch ($type) {
			case 'info':
				return `
					background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
					border: 1px solid #0ea5e9;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '💡';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			case 'security':
				return `
					background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
					border: 1px solid #22c55e;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '🛡️';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}

					h3, h4 {
						color: #166534;
					}
				`;
			case 'validation':
				return `
					background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
					border: 1px solid #f59e0b;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '✅';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}

					h3, h4 {
						color: #92400e;
					}
				`;
			case 'diagram':
				return `
					background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
					border: 1px solid #6b7280;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;
					font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

					&::before {
						content: '📊';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			case 'comparison':
				return `
					background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
					border: 1px solid #ec4899;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '⚖️';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			case 'jwt':
				return `
					background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
					border: 1px solid #d97706;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '🔐';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}

					code {
						background: #92400e;
						color: #fef3c7;
						font-weight: 500;
					}
				`;
			case 'claims':
				return `
					background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
					border: 1px solid #10b981;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '📋';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			case 'discovery':
				return `
					background: linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%);
					border: 1px solid #0284c7;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '🔍';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			case 'architecture':
				return `
					background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
					border: 1px solid #475569;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '🏗️';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			case 'enterprise':
				return `
					background: linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%);
					border: 1px solid #a855f7;
					border-radius: 0.75rem;
					padding: 1.5rem;
					margin: 1rem 0;

					&::before {
						content: '🏢';
						font-size: 1.5rem;
						display: block;
						margin-bottom: 1rem;
					}
				`;
			default:
				return `
					background: #ffffff;
					border: 1px solid #e5e7eb;
					border-radius: 0.5rem;
					padding: 1.25rem;
					margin: 1rem 0;
				`;
		}
	}}

	/* Enhanced emoji and symbol styling */
	span[role="img"], .emoji {
		font-size: 1.2em;
		margin-right: 0.5rem;
	}

	/* Better spacing for complex content */
	> *:first-child {
		margin-top: 0;
	}

	> *:last-child {
		margin-bottom: 0;
	}

	/* Enhanced table styling */
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		font-size: 0.9rem;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	tr:nth-child(even) {
		background: #f9fafb;
	}

	/* Enhanced link styling */
	a {
		color: #3b82f6;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 0.2s ease;

		&:hover {
			border-bottom-color: #3b82f6;
		}
	}

	/* Better spacing for nested elements */
	* + h1, * + h2, * + h3, * + h4, * + h5, * + h6 {
		margin-top: 2.5rem;
	}

	* + p, * + ul, * + ol, * + blockquote, * + pre {
		margin-top: 1.5rem;
	}
`;

const TutorialTextFormatter: React.FC<TutorialTextFormatterProps> = ({
	content,
	type = 'info',
}) => {
	return <ContentContainer $type={type} dangerouslySetInnerHTML={{ __html: content }} />;
};

export default TutorialTextFormatter;
