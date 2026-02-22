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

import React, { useCallback, useState } from 'react';
import { FiBook, FiChevronRight, FiInfo, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import { useGlobalEducationMode } from '../../hooks/useGlobalEducationMode';

const MasterSectionContainer = styled.div`
	margin-bottom: 24px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #ffffff;
	overflow: hidden;

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const _SectionHeader = styled.button`
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

const _HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const _ToggleIcon = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	transition: transform 0.2s ease;
	transform: ${(props) => (props.$isExpanded ? 'rotate(90deg)' : 'rotate(0deg)')};
`;

const _CollapsibleContent = styled.div<{ $isExpanded: boolean }>`
	max-height: ${(props) => (props.$isExpanded ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease-in-out;
`;

const _ContentInner = styled.div`
	padding: 20px;
`;

const CompactSection = styled.div<{ $isExpanded?: boolean }>`
	padding: 12px 16px;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;
	margin-bottom: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 1px solid #e2e8f0;

	&:hover {
		background: #e2e8f0;
		border-color: #3b82f6;
	}

	&:last-child {
		margin-bottom: 0;
	}

	${(props) =>
		props.$isExpanded &&
		`
		background: #ffffff;
		border-color: #3b82f6;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	`}
`;

const CompactTitle = styled.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 4px;
	display: flex;
	align-items: center;
	gap: 8px;
	justify-content: space-between;
`;

const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	transition: transform 0.2s ease;
	transform: ${(props) => (props.$isExpanded ? 'rotate(90deg)' : 'rotate(0deg)')};
	color: #6b7280;
`;

const CompactContent = styled.div`
	font-size: 14px;
	color: #374151;
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

	strong {
		color: #111827;
	}
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
	className,
}) => {
	const { currentMode } = useGlobalEducationMode();
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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
				{sections.map((section) => {
					const isExpanded = expandedSections.has(section.id);
					return (
						<CompactSection
							key={section.id}
							onClick={() => toggleCompactSection(section.id)}
							$isExpanded={isExpanded}
						>
							<CompactTitle>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									{getIconForSection(section)}
									{section.title}
								</div>
								<ExpandIcon $isExpanded={isExpanded}>
									<FiChevronRight size={16} />
								</ExpandIcon>
							</CompactTitle>
							<CompactContent>
								{section.oneLiner || 'Click to expand for more information'}
							</CompactContent>
							{isExpanded && (
								<div
									style={{
										marginTop: '12px',
										paddingTop: '12px',
										borderTop: '1px solid #e2e8f0',
										animation: 'slideDown 0.3s ease-out',
									}}
								>
									<EducationContent>{section.content}</EducationContent>
								</div>
							)}
						</CompactSection>
					);
				})}
			</MasterSectionContainer>
		);
	}

	// Full mode - show all content in individually collapsible sections
	return (
		<MasterSectionContainer className={className}>
			{sections.map((section) => {
				const isExpanded = expandedSections.has(section.id);
				return (
					<CompactSection
						key={section.id}
						onClick={() => toggleCompactSection(section.id)}
						$isExpanded={isExpanded}
					>
						<CompactTitle>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								{getIconForSection(section)}
								{section.title}
							</div>
							<ExpandIcon $isExpanded={isExpanded}>
								<FiChevronRight size={16} />
							</ExpandIcon>
						</CompactTitle>
						<CompactContent>
							{section.oneLiner || 'Click to expand for more information'}
						</CompactContent>
						{isExpanded && (
							<div
								style={{
									marginTop: '12px',
									paddingTop: '12px',
									borderTop: '1px solid #e2e8f0',
									animation: 'slideDown 0.3s ease-out',
								}}
							>
								<EducationContent>{section.content}</EducationContent>
							</div>
						)}
					</CompactSection>
				);
			})}
		</MasterSectionContainer>
	);
};

export default MasterEducationSection;
