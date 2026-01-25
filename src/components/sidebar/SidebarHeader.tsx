/**
 * SidebarHeader - Header component for the sidebar
 * Contains title, drag mode toggle, and close button
 */

import React from 'react';
import { FiMove, FiX } from 'react-icons/fi';
import styled from 'styled-components';

interface SidebarHeaderProps {
	isOpen: boolean;
	onClose: () => void;
	isDragDropMode: boolean;
	onToggleDragMode: () => void;
}

const HeaderContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	border-bottom: 1px solid #e5e7eb;
	background: #f8fafc;
`;

const TitleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 1rem;
	color: #1f2937;
`;

const ControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const DragModeToggle = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border: 1px solid ${(props) => (props.$isActive ? '#3b82f6' : '#d1d5db')};
	border-radius: 0.375rem;
	background: ${(props) => (props.$isActive ? '#3b82f6' : 'white')};
	color: ${(props) => (props.$isActive ? 'white' : '#374151')};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${(props) => (props.$isActive ? '#2563eb' : '#f9fafb')};
		border-color: ${(props) => (props.$isActive ? '#2563eb' : '#9ca3af')};
	}

	&:active {
		transform: scale(0.98);
	}
`;

const CloseButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.375rem;
	border: none;
	border-radius: 0.375rem;
	background: transparent;
	color: #6b7280;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}

	&:active {
		transform: scale(0.95);
	}
`;

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
	isOpen,
	onClose,
	isDragDropMode,
	onToggleDragMode,
}) => {
	return (
		<HeaderContainer>
			<TitleContainer>
				PingOne OAuth Playground
			</TitleContainer>
			<ControlsContainer>
				<DragModeToggle
					onClick={onToggleDragMode}
					title={isDragDropMode ? 'Switch to standard menu' : 'Enable drag & drop mode'}
					$isActive={isDragDropMode}
				>
					<FiMove size={14} />
					{isDragDropMode ? 'Drag Mode' : 'Enable Drag'}
				</DragModeToggle>
				<CloseButton onClick={onClose} title="Close sidebar">
					<FiX size={20} />
				</CloseButton>
			</ControlsContainer>
		</HeaderContainer>
	);
};

export default SidebarHeader;
