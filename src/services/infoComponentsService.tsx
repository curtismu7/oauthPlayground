// src/services/v6InfoComponentsService.tsx
/**
 * V6 Info Components Service
 *
 * Provides standardized info boxes, titles, and text components
 * - Multiple variants (success, info, warning, danger)
 * - Consistent styling
 * - Reusable across all flows
 */

import styled from 'styled-components';

export type InfoVariant = 'success' | 'info' | 'warning' | 'danger';

export class V6InfoComponentsService {
	// Cache for styled components to prevent dynamic creation warnings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _infoBoxCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _infoTitleCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _infoTextCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _infoListCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _infoComponentsCache: any = null;

	/**
	 * Create info box (cached to prevent dynamic creation warnings)
	 */
	static createInfoBox() {
		if (!V6InfoComponentsService._infoBoxCache) {
			V6InfoComponentsService._infoBoxCache = styled.div<{ $variant?: InfoVariant }>`
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
		return V6InfoComponentsService._infoBoxCache;
	}

	/**
	 * Create info title (cached to prevent dynamic creation warnings)
	 */
	static createInfoTitle() {
		if (!V6InfoComponentsService._infoTitleCache) {
			V6InfoComponentsService._infoTitleCache = styled.h3`
				font-size: 1rem;
				font-weight: 600;
				margin: 0 0 0.5rem 0;
			`;
		}
		return V6InfoComponentsService._infoTitleCache;
	}

	/**
	 * Create info text (cached to prevent dynamic creation warnings)
	 */
	static createInfoText() {
		if (!V6InfoComponentsService._infoTextCache) {
			V6InfoComponentsService._infoTextCache = styled.p`
				font-size: 0.95rem;
				line-height: 1.5;
				margin: 0;
			`;
		}
		return V6InfoComponentsService._infoTextCache;
	}

	/**
	 * Create info list (cached to prevent dynamic creation warnings)
	 */
	static createInfoList() {
		if (!V6InfoComponentsService._infoListCache) {
			V6InfoComponentsService._infoListCache = styled.ul`
				font-size: 0.95rem;
				line-height: 1.5;
				margin: 0;
				padding-left: 1.25rem;

				li {
					margin-bottom: 0.5rem;
				}
			`;
		}
		return V6InfoComponentsService._infoListCache;
	}

	/**
	 * Get all info components at once (cached to prevent dynamic creation warnings)
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static createInfoComponents(): any {
		if (!V6InfoComponentsService._infoComponentsCache) {
			V6InfoComponentsService._infoComponentsCache = {
				InfoBox: V6InfoComponentsService.createInfoBox(),
				InfoTitle: V6InfoComponentsService.createInfoTitle(),
				InfoText: V6InfoComponentsService.createInfoText(),
				InfoList: V6InfoComponentsService.createInfoList(),
			};
		}
		return V6InfoComponentsService._infoComponentsCache;
	}
}

export default V6InfoComponentsService;
