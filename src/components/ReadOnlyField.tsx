// src/components/ReadOnlyField.tsx
/**
 * ReadOnlyField Component
 *
 * Displays a read-only credential field with lock icon and explanation.
 * Used when a field value is fixed by OAuth/OIDC specifications.
 */

import { FiLock } from '@icons';
import React from 'react';
import styled from 'styled-components';

export interface ReadOnlyFieldProps {
	label: string;
	value: string;
	explanation: string;
	specReference?: string;
	icon?: React.ReactNode;
}

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  position: relative;
  z-index: 5;
  pointer-events: auto;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LockIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: #6b7280;
`;

const ReadOnlyInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  background: #f9fafb !important;
  color: #374151;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  cursor: not-allowed;
  pointer-events: none;
  
  &:focus {
    outline: none;
    border-color: #9ca3af;
  }
`;

const ExplanationText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  border-left: 3px solid #3b82f6;
`;

const SpecLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  margin-left: 0.5rem;
  
  &:hover {
    text-decoration: underline;
    color: #2563eb;
  }
`;

/**
 * ReadOnlyField Component
 * Renders a field with lock icon and explanation for specification-enforced values
 */
export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({
	label,
	value,
	explanation,
	specReference,
	icon,
}) => {
	return (
		<FormField>
			<FormLabel>
				<LockIcon>{icon || <FiLock size={14} />}</LockIcon>
				{label}
			</FormLabel>
			<ReadOnlyInput
				type="text"
				value={value}
				readOnly
				disabled
				aria-label={label}
				aria-readonly="true"
			/>
			<ExplanationText>
				{explanation}
				{specReference && (
					<SpecLink href={specReference} target="_blank" rel="noopener noreferrer">
						View Specification →
					</SpecLink>
				)}
			</ExplanationText>
		</FormField>
	);
};

export default ReadOnlyField;
