/**
 * @file MasterEducationSection.tsx
 * @module components/education
 * @description Master Education Section component for consolidating all educational content
 * @version 1.0.0
 * @since 2024-11-16
 *
 * This component consolidates all educational content into a single collapsible section
 * with support for different display modes (full, compact, hidden).
 */

import { FiBook, FiChevronRight, FiInfo, FiShield } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	type EducationMode,
	EducationPreferenceService,
} from '../../services/educationPreferenceService';

const MasterSectionContainer = styled.div`
	margin-bottom: 24px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #ffffff;
	overflow: hidden;
`;

const SectionHeader = styled.button`
	width: 100%;
	padding: 16px 20px;
	background: #f9fafb;
	border: none;
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 16px;
	font-weight: 600;
	color: #374151;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f3f4f6;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const ToggleIcon = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	transition: transform 0.2s ease;
	transform: ${(props) => (props.$isExpanded ? 'rotate(90deg)' : 'rotate(0deg)')};
`;

const CollapsibleContent = styled.div<{ $isExpanded: boolean }>`
	max-height: ${(props) => (props.$isExpanded ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease-in-out;
`;

const ContentInner = styled.div`
	padding: 20px;
`;

const EducationSection = styled.div`
	margin-bottom: 24px;
	padding: 16px;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	font-size: 16px;
	font-weight: 600;
	color: #1e40af;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const EducationContent = styled.div`
	color: #374151;
	line-height: 1.6;

	p {
		margin: 0 0 8px 0;
		&:last-child {
			margin-bottom: 0;
		}
	}

	ul, ol {
		margin: 8px 0;
		padding-left: 20px;
	}

	li {
		margin-bottom: 4px;
	}

	code {
		background: #e5e7eb;
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
	}

	strong {
		color: #111827;
	}
`;

const CompactSection = styled.div`
	padding: 12px 16px;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;
	margin-bottom: 8px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background: #e2e8f0;
	}

	&:last-child {
		margin-bottom: 0;
	}
`;

const CompactTitle = styled.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 4px;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const CompactContent = styled.div`
	font-size: 14px;
	color: #374151;
`;

export interface EducationSectionData {
	id: string;
	title: string;
	content: React.ReactNode;
	oneLiner?: string;
	icon?: React.ReactNode;
}

interface MasterEducationSectionProps {
	sections: EducationSectionData[];
	mode?: EducationMode;
	className?: string;
}

/**
 * MasterEducationSection Component
 *
 * Consolidates all educational content into a single collapsible section
 * with support for different display modes.
 */
export const MasterEducationSection: React.FC<MasterEducationSectionProps> = ({
	sections,
	mode,
	className,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
	const [currentMode, setCurrentMode] = useState<EducationMode>(
		mode || EducationPreferenceService.getEducationMode()
	);

	// Listen for preference changes via storage events and custom events
	useEffect(() => {
		const handleModeChange = () => {
			const newMode = mode || EducationPreferenceService.getEducationMode();
			console.log('[MasterEducationSection] Mode changed to:', newMode);
			setCurrentMode(newMode);
		};

		// Listen for storage events (from other tabs/windows)
		window.addEventListener('storage', handleModeChange);

		// Also poll for changes (fallback for same-window updates)
		const pollInterval = setInterval(() => {
			const latestMode = mode || EducationPreferenceService.getEducationMode();
			if (latestMode !== currentMode) {
				console.log('[MasterEducationSection] Mode changed via polling:', latestMode);
				setCurrentMode(latestMode);
			}
		}, 100); // Poll every 100ms

		return () => {
			window.removeEventListener('storage', handleModeChange);
			clearInterval(pollInterval);
		};
	}, [mode, currentMode]);

	const toggleSection = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	const toggleCompactSection = useCallback((sectionId: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	}, []);

	const getIconForSection = (section: EducationSectionData) => {
		if (section.icon) return section.icon;

		// Default icons based on section content
		if (
			section.title.toLowerCase().includes('security') ||
			section.title.toLowerCase().includes('consideration')
		) {
			return <FiShield size={16} />;
		}
		if (
			section.title.toLowerCase().includes('overview') ||
			section.title.toLowerCase().includes('introduction')
		) {
			return <FiInfo size={16} />;
		}
		return <FiBook size={16} />;
	};

	// Hidden mode - show nothing
	if (currentMode === 'hidden') {
		return null;
	}

	// Compact mode - show one-liners that can be expanded
	if (currentMode === 'compact') {
		return (
			<MasterSectionContainer className={className}>
				{sections.map((section) => (
					<CompactSection key={section.id} onClick={() => toggleCompactSection(section.id)}>
						<CompactTitle>
							{getIconForSection(section)}
							{section.title}
						</CompactTitle>
						<CompactContent>
							{section.oneLiner || 'Click to expand for more information'}
						</CompactContent>
						{expandedSections.has(section.id) && (
							<div
								style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}
							>
								<EducationContent>{section.content}</EducationContent>
							</div>
						)}
					</CompactSection>
				))}
			</MasterSectionContainer>
		);
	}

	// Full mode - show all content in collapsible sections
	return (
		<MasterSectionContainer className={className}>
			<SectionHeader onClick={toggleSection}>
				<HeaderContent>
					<FiBook size={20} />
					<span>Educational Content</span>
				</HeaderContent>
				<ToggleIcon $isExpanded={isExpanded}>
					<FiChevronRight size={20} />
				</ToggleIcon>
			</SectionHeader>
			<CollapsibleContent $isExpanded={isExpanded}>
				<ContentInner>
					{sections.map((section) => (
						<EducationSection key={section.id}>
							<SectionTitle>
								{getIconForSection(section)}
								{section.title}
							</SectionTitle>
							<EducationContent>{section.content}</EducationContent>
						</EducationSection>
					))}
				</ContentInner>
			</CollapsibleContent>
		</MasterSectionContainer>
	);
};

export default MasterEducationSection;
