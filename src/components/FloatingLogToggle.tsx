/**
 * @file FloatingLogToggle.tsx
 * @module components
 * @description Toggle button for floating log viewer
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { FiTerminal } from '@icons';
import styled from 'styled-components';

const ToggleButton = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: ${(props) => (props.$isOpen ? '#ef4444' : '#3b82f6')};
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9998;
  transition: all 0.2s ease;
  font-size: 18px;

  &:hover {
    background: ${(props) => (props.$isOpen ? '#dc2626' : '#2563eb')};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &.pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    50% {
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
    }
    100% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
`;

interface FloatingLogToggleProps {
	isOpen: boolean;
	onClick: () => void;
	hasNewLogs?: boolean;
}

export const FloatingLogToggle: React.FC<FloatingLogToggleProps> = ({
	isOpen,
	onClick,
	hasNewLogs = false,
}) => {
	const [_isHovered, setIsHovered] = useState(false);

	return (
		<ToggleButton
			$isOpen={isOpen}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={hasNewLogs ? 'pulse' : ''}
			title={isOpen ? 'Close Log Viewer' : 'Open Log Viewer'}
		>
			<FiTerminal />
		</ToggleButton>
	);
};
