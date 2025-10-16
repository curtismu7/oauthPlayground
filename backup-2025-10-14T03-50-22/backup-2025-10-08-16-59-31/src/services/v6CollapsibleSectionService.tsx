// src/services/v6CollapsibleSectionService.tsx
/**
 * V6 Collapsible Section Service
 * 
 * Provides standardized collapsible sections for V6 flows
 * - Custom headers with icons
 * - Smooth animations
 * - Theme support
 * - Accessibility features
 */

import React from 'react';
import styled from 'styled-components';
import { type ThemeColor, V6FlowLayoutService } from './v6FlowLayoutService';

export class V6CollapsibleSectionService {
	/**
	 * Create collapsible section container
	 */
	static createCollapsibleSection() {
		return styled.section`
			border: 1px solid #e2e8f0;
			border-radius: 0.75rem;
			margin-bottom: 1.5rem;
			background-color: #ffffff;
			box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
		`;
	}

	/**
	 * Create collapsible header button
	 */
	static createCollapsibleHeaderButton(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.button<{ $collapsed?: boolean }>`
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			padding: 1.25rem 1.5rem;
			background: linear-gradient(135deg, ${colors.primaryLighter}20 0%, ${colors.primaryLighter}30 100%);
			border: none;
			border-radius: 0.75rem;
			cursor: pointer;
			font-size: 1.1rem;
			font-weight: 600;
			color: ${colors.text};
			transition: background 0.2s ease;

			&:hover {
				background: linear-gradient(135deg, ${colors.primaryLighter}30 0%, ${colors.primaryLighter}40 100%);
			}

			&:focus {
				outline: 2px solid ${colors.primary};
				outline-offset: 2px;
			}
		`;
	}

	/**
	 * Create collapsible title
	 */
	static createCollapsibleTitle() {
		return styled.span`
			display: flex;
			align-items: center;
			gap: 0.75rem;
		`;
	}

	/**
	 * Create collapsible toggle icon
	 */
	static createCollapsibleToggleIcon(theme: ThemeColor = 'blue') {
		const colors = V6FlowLayoutService.getTheme(theme);
		return styled.span<{ $collapsed?: boolean }>`
			display: inline-flex;
			align-items: center;
			justify-content: center;
			color: ${colors.primary};
			font-size: 1.25rem;
			transition: transform 0.2s ease;

			${({ $collapsed }) => $collapsed && `transform: rotate(-90deg);`}
		`;
	}

	/**
	 * Create collapsible content
	 */
	static createCollapsibleContent() {
		return styled.div`
			padding: 1.5rem;
			border-top: 1px solid #e2e8f0;
		`;
	}

	/**
	 * Get all collapsible components at once
	 */
	static createCollapsibleComponents(theme: ThemeColor = 'blue') {
		return {
			CollapsibleSection: V6CollapsibleSectionService.createCollapsibleSection(),
			CollapsibleHeaderButton: V6CollapsibleSectionService.createCollapsibleHeaderButton(theme),
			CollapsibleTitle: V6CollapsibleSectionService.createCollapsibleTitle(),
			CollapsibleToggleIcon: V6CollapsibleSectionService.createCollapsibleToggleIcon(theme),
			CollapsibleContent: V6CollapsibleSectionService.createCollapsibleContent(),
		};
	}
}

export default V6CollapsibleSectionService;


