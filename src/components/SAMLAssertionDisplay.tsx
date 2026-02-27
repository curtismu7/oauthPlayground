import React, { useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const Container = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
`;

const Content = styled.pre`
  margin: 0;
  padding: 1rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #2d3748;
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
			console.error('Error formatting SAML assertion:', error);
			return xml; // Return original if formatting fails
		}
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(assertion);
		setCopied(true);
		v4ToastManager.showSuccess('SAML assertion copied to clipboard');

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
								<FiCheck size={14} /> Copied!
							</>
						) : (
							<>
								<FiCopy size={14} /> Copy
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
