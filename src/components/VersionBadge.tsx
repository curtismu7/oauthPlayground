import React from 'react';
import styled from 'styled-components';

interface VersionBadgeProps {
	version: string;
	flow: string;
}

const Badge = styled.span<{ flow: string }>`
  align-self: flex-start;
  background: ${(props) =>
		props.flow === 'Implicit' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(22, 163, 74, 0.2)'};
  border: 1px solid ${(props) => (props.flow === 'Implicit' ? '#60a5fa' : '#4ade80')};
  color: ${(props) => (props.flow === 'Implicit' ? '#dbeafe' : '#bbf7d0')};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
`;

export const VersionBadge: React.FC<VersionBadgeProps> = ({ version, flow }) => {
	return <Badge flow={flow}>{version}</Badge>;
};
