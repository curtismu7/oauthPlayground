// src/components/HiddenFieldExplanation.tsx
/**
 * HiddenFieldExplanation Component
 *
 * Displays an informational panel explaining why a credential field
 * is not applicable to the current OAuth/OIDC flow type.
 */

import { FiInfo } from '@icons';
import React from 'react';
import styled from 'styled-components';

export interface HiddenFieldExplanationProps {
	fieldName: string;
	reason: string;
	specReference?: string;
}

const InfoPanel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const InfoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const InfoContent = styled.div`
  flex: 1;
  color: #1e40af;
  
  strong {
    font-weight: 600;
    color: #1e3a8a;
  }
`;

const SpecLink = styled.a`
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  margin-left: 0.25rem;
  
  &:hover {
    text-decoration: underline;
    color: #1d4ed8;
  }
`;

/**
 * HiddenFieldExplanation Component
 * Shows why a field is not used in the current flow
 */
export const HiddenFieldExplanation: React.FC<HiddenFieldExplanationProps> = ({
	fieldName,
	reason,
	specReference,
}) => {
	return (
		<InfoPanel role="status" aria-live="polite">
			<InfoIcon aria-hidden="true">
				<FiInfo size={14} />
			</InfoIcon>
			<InfoContent>
				<strong>{fieldName}</strong> is not used in this flow.
				<br />
				{reason}
				{specReference && (
					<SpecLink href={specReference} target="_blank" rel="noopener noreferrer">
						Learn more →
					</SpecLink>
				)}
			</InfoContent>
		</InfoPanel>
	);
};

export default HiddenFieldExplanation;
