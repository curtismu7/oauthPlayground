/**
 * @file EducationModeToggle.tsx
 * @module components/education
 * @description Education Mode Toggle component for switching between education display modes
 * @version 1.0.0
 * @since 2024-11-16
 *
 * This component provides a three-state toggle for switching between
 * full, compact, and hidden education modes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiBook, FiMinimize2, FiEyeOff, FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';
import {
	EducationPreferenceService,
	type EducationMode,
} from '../../services/educationPreferenceService';

const ToggleContainer = styled.div`
	position: sticky;
	top: 0;
	z-index: 100;
	background: #ffffff;
	border-bottom: 1px solid #e5e7eb;
	padding: 12px 0;
	margin-bottom: 16px;
`;

const ToggleInner = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ToggleLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	color: #374151;
	font-size: 14px;
`;

const ToggleButtons = styled.div`
	display: flex;
	background: #f3f4f6;
	border-radius: 6px;
	padding: 2px;
	gap: 2px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
	padding: 8px 12px;
	border: none;
	border-radius: 4px;
	background: ${(props) => (props.$active ? '#ffffff' : 'transparent')};
	color: ${(props) => (props.$active ? '#1f2937' : '#6b7280')};
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s ease;
	box-shadow: ${(props) => (props.$active ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none')};

	&:hover {
		background: ${(props) => (props.$active ? '#ffffff' : '#e5e7eb')};
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}
`;

const ModeIcon = styled.div`
	display: flex;
	align-items: center;
`;

const Description = styled.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
`;

const DropdownContainer = styled.div`
	position: relative;
`;

const DropdownButton = styled.button`
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	color: #374151;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s ease;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: 4px;
	background: #ffffff;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	z-index: 1000;
	opacity: ${(props) => (props.$isOpen ? 1 : 0)};
	visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
	transform: ${(props) => (props.$isOpen ? 'translateY(0)' : 'translateY(-10px)')};
	transition: all 0.2s ease;
	min-width: 200px;
`;

const DropdownItem = styled.button`
	width: 100%;
	padding: 10px 12px;
	border: none;
	background: transparent;
	color: #374151;
	font-size: 13px;
	text-align: left;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f3f4f6;
	}

	&:focus {
		background: #f3f4f6;
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}

	&:first-child {
		border-radius: 6px 6px 0 0;
	}

	&:last-child {
		border-radius: 0 0 6px 6px;
	}
`;

interface EducationModeToggleProps {
	className?: string;
	showDescription?: boolean;
	variant?: 'buttons' | 'dropdown';
}

/**
 * EducationModeToggle Component
 *
 * Provides a toggle interface for switching between education display modes.
 * Can be displayed as buttons or dropdown.
 */
export const EducationModeToggle: React.FC<EducationModeToggleProps> = ({
	className,
	showDescription = true,
	variant = 'buttons',
}) => {
	const [currentMode, setCurrentMode] = useState<EducationMode>('full');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// Load initial mode from preference service
	useEffect(() => {
		setCurrentMode(EducationPreferenceService.getEducationMode());
	}, []);

	// Handle mode change
	const handleModeChange = useCallback((newMode: EducationMode) => {
		EducationPreferenceService.setEducationMode(newMode);
		setCurrentMode(newMode);
		setIsDropdownOpen(false);
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isDropdownOpen]);

	const getModeIcon = (mode: EducationMode) => {
		switch (mode) {
			case 'full':
				return <FiBook size={16} />;
			case 'compact':
				return <FiMinimize2 size={16} />;
			case 'hidden':
				return <FiEyeOff size={16} />;
			default:
				return <FiBook size={16} />;
		}
	};

	const getModeLabel = (mode: EducationMode) => {
		switch (mode) {
			case 'full':
				return 'Full';
			case 'compact':
				return 'Compact';
			case 'hidden':
				return 'Hidden';
			default:
				return 'Full';
		}
	};

	const modes: EducationMode[] = ['full', 'compact', 'hidden'];

	// Buttons variant
	if (variant === 'buttons') {
		return (
			<ToggleContainer className={className}>
				<ToggleInner>
					<div>
						<ToggleLabel>
							<FiBook size={16} />
							Education Mode
						</ToggleLabel>
						{showDescription && (
							<Description>{EducationPreferenceService.getModeDescription()}</Description>
						)}
					</div>
					<ToggleButtons>
						{modes.map((mode) => (
							<ToggleButton
								key={mode}
								$active={currentMode === mode}
								onClick={() => handleModeChange(mode)}
								title={EducationPreferenceService.getModeDescription()}
							>
								<ModeIcon>{getModeIcon(mode)}</ModeIcon>
								{getModeLabel(mode)}
							</ToggleButton>
						))}
					</ToggleButtons>
				</ToggleInner>
			</ToggleContainer>
		);
	}

	// Dropdown variant
	return (
		<ToggleContainer className={className}>
			<ToggleInner>
				<div>
					<ToggleLabel>
						<FiBook size={16} />
						Education Mode
					</ToggleLabel>
					{showDescription && (
						<Description>{EducationPreferenceService.getModeDescription()}</Description>
					)}
				</div>
				<DropdownContainer className="dropdown-container">
					<DropdownButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
						<ModeIcon>{getModeIcon(currentMode)}</ModeIcon>
						{getModeLabel(currentMode)}
						<FiChevronDown
							size={14}
							style={{
								transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
								transition: 'transform 0.2s ease',
							}}
						/>
					</DropdownButton>
					<DropdownMenu $isOpen={isDropdownOpen}>
						{modes.map((mode) => (
							<DropdownItem key={mode} onClick={() => handleModeChange(mode)}>
								<ModeIcon>{getModeIcon(mode)}</ModeIcon>
								{getModeLabel(mode)}
							</DropdownItem>
						))}
					</DropdownMenu>
				</DropdownContainer>
			</ToggleInner>
		</ToggleContainer>
	);
};

export default EducationModeToggle;
