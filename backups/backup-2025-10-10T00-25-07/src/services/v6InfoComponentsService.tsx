// src/services/v6InfoComponentsService.tsx
/**
 * V6 Info Components Service
 * 
 * Provides standardized info boxes, titles, and text components
 * - Multiple variants (success, info, warning, danger)
 * - Consistent styling
 * - Reusable across all flows
 */

import React from 'react';
import styled from 'styled-components';

export type InfoVariant = 'success' | 'info' | 'warning' | 'danger';

export class V6InfoComponentsService {
	/**
	 * Create info box
	 */
	static createInfoBox() {
		return styled.div<{ $variant?: InfoVariant }>`
			display: flex;
			align-items: flex-start;
			gap: 1rem;
			padding: 1.25rem;
			border-radius: 0.75rem;
			margin-bottom: 1.5rem;

			${({ $variant = 'info' }) => {
				switch ($variant) {
					case 'success':
						return `
							background-color: #f0fdf4;
							border: 1px solid #bbf7d0;
							color: #166534;
						`;
					case 'info':
						return `
							background-color: #eff6ff;
							border: 1px solid #bfdbfe;
							color: #1e40af;
						`;
					case 'warning':
						return `
							background-color: #fffbeb;
							border: 1px solid #fde68a;
							color: #92400e;
						`;
					case 'danger':
						return `
							background-color: #fef2f2;
							border: 1px solid #fecaca;
							color: #991b1b;
						`;
				}
			}}
		`;
	}

	/**
	 * Create info title
	 */
	static createInfoTitle() {
		return styled.h3`
			font-size: 1rem;
			font-weight: 600;
			margin: 0 0 0.5rem 0;
		`;
	}

	/**
	 * Create info text
	 */
	static createInfoText() {
		return styled.p`
			font-size: 0.95rem;
			line-height: 1.5;
			margin: 0;
		`;
	}

	/**
	 * Create info list
	 */
	static createInfoList() {
		return styled.ul`
			font-size: 0.95rem;
			line-height: 1.5;
			margin: 0;
			padding-left: 1.25rem;

			li {
				margin-bottom: 0.5rem;
			}
		`;
	}

	/**
	 * Get all info components at once
	 */
	static createInfoComponents() {
		return {
			InfoBox: V6InfoComponentsService.createInfoBox(),
			InfoTitle: V6InfoComponentsService.createInfoTitle(),
			InfoText: V6InfoComponentsService.createInfoText(),
			InfoList: V6InfoComponentsService.createInfoList(),
		};
	}
}

export default V6InfoComponentsService;


