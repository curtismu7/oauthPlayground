import { FiCopy } from '@icons';
import React from 'react';
import styled from 'styled-components';
import { logger } from '../../utils/logger';

interface TokenResponseBoxesProps {
	tokens: {
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
	};
}

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const TokenBoxWrapper = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => `${$color.slice(0, -1)}, 0.2)`};
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TokenTitle = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
`;

const CopyButton = styled.button`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const TokenValue = styled.pre`
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 1rem;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
`;

const TokenResponseBoxes: React.FC<TokenResponseBoxesProps> = ({ tokens }) => {
	const handleCopy = (token: string, tokenName: string) => {
		navigator.clipboard.writeText(token);
		logger.info('Token copied to clipboard', tokenName);
		// You could add a toast notification here
	};

	const tokenData = [
		{ name: 'Access Token', value: tokens.access_token, color: '#e0f2fe' },
		{ name: 'ID Token', value: tokens.id_token, color: '#dcfce7' },
		{ name: 'Refresh Token', value: tokens.refresh_token, color: '#ffedd5' },
	];

	return (
		<TokenGrid>
			{tokenData.map(
				({ name, value, color }) =>
					value && (
						<TokenBoxWrapper key={name} $color={color}>
							<TokenHeader>
								<TokenTitle>{name}</TokenTitle>
								<CopyButton onClick={() => handleCopy(value, name)} title={`Copy ${name}`}>
									<FiCopy />
								</CopyButton>
							</TokenHeader>
							<TokenValue>{value}</TokenValue>
						</TokenBoxWrapper>
					)
			)}
		</TokenGrid>
	);
};

export default TokenResponseBoxes;
