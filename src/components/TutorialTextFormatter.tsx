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
	color: V9_COLORS.TEXT.GRAY_DARK;

	/* Base styling for all content types */
	p {
		margin-bottom: 1.5rem;
		font-size: 1.05rem;
		line-height: 1.8;
	}

	/* Enhanced typography for better readability */
	h1, h2, h3, h4, h5, h6 {
		color: V9_COLORS.TEXT.GRAY_DARK;
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
		border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
		padding: 1rem 1.5rem;
		margin: 1.5rem 0;
		background: V9_COLORS.BG.GRAY_LIGHT;
		border-radius: 0 0.5rem 0.5rem 0;
		font-style: italic;
		color: V9_COLORS.TEXT.GRAY_DARK;
	}

	/* Enhanced code styling */
	code {
		background: V9_COLORS.BG.GRAY_MEDIUM;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9em;
		color: #1e293b;
		border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	}

	pre {
		background: #1e293b;
		color: V9_COLORS.BG.GRAY_MEDIUM;
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
					background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.BG.GRAY_LIGHT 100%);
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
					background: linear-gradient(135deg, #f0fdf4 0%, V9_COLORS.BG.SUCCESS 100%);
					border: 1px solid V9_COLORS.PRIMARY.GREEN;
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
						color: V9_COLORS.PRIMARY.GREEN;
					}
				`;
			case 'validation':
				return `
					background: linear-gradient(135deg, #fefce8 0%, V9_COLORS.BG.WARNING 100%);
					border: 1px solid V9_COLORS.PRIMARY.YELLOW;
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
						color: V9_COLORS.PRIMARY.YELLOW_DARK;
					}
				`;
			case 'diagram':
				return `
					background: linear-gradient(135deg, #f3f4f6 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
					border: 1px solid V9_COLORS.TEXT.GRAY_MEDIUM;
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
					background: linear-gradient(135deg, V9_COLORS.BG.WARNING 0%, V9_COLORS.BG.WARNING_BORDER 100%);
					border: 1px solid V9_COLORS.PRIMARY.YELLOW_DARK;
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
						background: V9_COLORS.PRIMARY.YELLOW_DARK;
						color: V9_COLORS.BG.WARNING;
						font-weight: 500;
					}
				`;
			case 'claims':
				return `
					background: linear-gradient(135deg, V9_COLORS.BG.SUCCESS 0%, V9_COLORS.BG.SUCCESS 100%);
					border: 1px solid V9_COLORS.PRIMARY.GREEN;
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
					background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
					border: 1px solid V9_COLORS.PRIMARY.BLUE;
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
					background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
					border: 1px solid V9_COLORS.TEXT.GRAY_MEDIUM;
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
					background: V9_COLORS.TEXT.WHITE;
					border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
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
		border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
		color: V9_COLORS.TEXT.GRAY_DARK;
	}

	tr:nth-child(even) {
		background: #f9fafb;
	}

	/* Enhanced link styling */
	a {
		color: V9_COLORS.PRIMARY.BLUE;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 0.2s ease;

		&:hover {
			border-bottom-color: V9_COLORS.PRIMARY.BLUE;
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
