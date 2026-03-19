// src/components/DocumentationHeader.tsx
/**
 * Standardized Documentation Header Component
 * Used across all Documentation & Reference pages for consistent branding
 */

import React from 'react';
import styled from 'styled-components';

const Header = styled.div`
	text-align: center;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 0.75rem;
	margin: 0 0 2rem 0;
	/* Remove fixed max-width to match parent container width */

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #1f2937;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
		max-width: 800px;
		margin: 0 auto;
	}

	span {
		font-size: 2.5rem;
	}
`;

interface DocumentationHeaderProps {
	emoji: string;
	title: string;
	description: string;
}

const DocumentationHeader: React.FC<DocumentationHeaderProps> = ({ emoji, title, description }) => {
	return (
		<Header>
			<h1>
				<span>{emoji}</span>
				{title}
			</h1>
			<p>{description}</p>
		</Header>
	);
};

export default DocumentationHeader;
