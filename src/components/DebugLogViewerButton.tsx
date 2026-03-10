/**
 * @file DebugLogViewerButton.tsx
 * @module components
 * @description Floating button to open Debug Log Viewer V9
 * @version 1.0.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ToggleButton = styled.button`
	position: fixed;
	bottom: 20px;
	right: 20px;
	width: 50px;
	height: 50px;
	background: var(--ping-bg-primary, #2563eb);
	color: var(--ping-text-inverse, #ffffff);
	border: 1px solid var(--ping-border-primary, #d1d5db);
	border-radius: 50%;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 9998;
	transition: all 0.15s ease-in-out;
	font-size: 18px;

	&:hover {
		background: var(--ping-bg-primary-hover, #1d4ed8);
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
			box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
		}
		100% {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}
	}
`;

interface DebugLogViewerButtonProps {
	hasNewLogs?: boolean;
}

export const DebugLogViewerButton: React.FC<DebugLogViewerButtonProps> = ({
	hasNewLogs = false,
}) => {
	const navigate = useNavigate();

	const handleClick = () => {
		navigate('/v9/debug-logs-popout');
	};

	return (
		<ToggleButton
			onClick={handleClick}
			className={hasNewLogs ? 'pulse' : ''}
			title="Open Debug Log Viewer"
		>
			<span>📋</span>
		</ToggleButton>
	);
};
