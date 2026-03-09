import React, { useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';

import { logger } from '../utils/logger';

const Container = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
`;

const Header = styled.div`
  background: #edf2f7;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const Content = styled.pre`
  margin: 0;
  padding: 1rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  background: white;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

interface SAMLAssertionDisplayProps {
	assertion: string;
	title?: string;
	showCopyButton?: boolean;
}

const SAMLAssertionDisplay: React.FC<SAMLAssertionDisplayProps> = ({
	assertion,
	title = 'SAML Assertion',
	showCopyButton = true,
}) => {
	const [copied, setCopied] = useState(false);

	const formatXML = (xml: string): string => {
		try {
			// Basic XML formatting - for better display
			const formatted = xml
				.replace(/></g, '>\n<')
				.replace(/\s+/g, ' ')
				.replace(/\s+</g, '<')
				.replace(/>\s+/g, '>')
				.trim();

			return formatted;
		} catch (error) {
			logger.error(
				'SAMLAssertionDisplay',
				'Error formatting SAML assertion:',
				undefined,
				error as Error
			);
			return xml; // Return original if formatting fails
		}
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(assertion);
		setCopied(true);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: 'SAML assertion copied to clipboard',
			duration: 4000,
		});

		// Reset the copied state after 2 seconds
		setTimeout(() => {
			setCopied(false);
		}, 2000);
	};

	return (
		<Container>
			<Header>
				<Title>{title}</Title>
				{showCopyButton && (
					<CopyButton onClick={handleCopy}>
						{copied ? (
							<>
								<span style={{ fontSize: '14px' }}>✅</span> Copied!
							</>
						) : (
							<>
								<span style={{ fontSize: '14px' }}>📋</span> Copy
							</>
						)}
					</CopyButton>
				)}
			</Header>
			<Content>{formatXML(assertion)}</Content>
		</Container>
	);
};

export default SAMLAssertionDisplay;
