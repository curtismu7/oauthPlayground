// src/services/pageLayoutService.ts
// Service for managing consistent page size, shape, and layout across all flows

import React from 'react';
import styled from 'styled-components';

export interface PageLayoutConfig {
	flowType: 'oauth' | 'oidc' | 'pingone' | 'documentation';
	theme: 'blue' | 'green' | 'orange' | 'purple' | 'red';
	maxWidth?: string;
	padding?: string;
	backgroundColor?: string;
	showHeader?: boolean;
	showFooter?: boolean;
	responsive?: boolean;
}

export interface PageSection {
	id: string;
	title?: string;
	content: React.ReactNode;
	collapsible?: boolean;
	collapsed?: boolean;
	priority?: 'high' | 'medium' | 'low';
}

export class PageLayoutService {
	// ============================================================================
	// CACHE FOR STYLED COMPONENTS (prevents dynamic creation warnings)
	// ============================================================================
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _mainCardCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _sectionContainerCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _contentGridCache = new Map<string, any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _contentFlexCache = new Map<string, any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _spacingCache = new Map<string, any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _pageFooterCache: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _pageContainerCache = new Map<string, any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _contentWrapperCache = new Map<string, any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static _pageHeaderCache = new Map<string, any>();

	// Main page container - ensures consistent sizing and structure
	static getPageContainer(config: PageLayoutConfig) {
		const {
			maxWidth = '64rem',
			padding = '2rem 0 6rem',
			backgroundColor = '#f9fafb',
			responsive = true,
		} = config;

		const cacheKey = `${maxWidth}-${padding}-${backgroundColor}-${responsive}`;
		if (!PageLayoutService._pageContainerCache.has(cacheKey)) {
			PageLayoutService._pageContainerCache.set(
				cacheKey,
				styled.div<{ $responsive?: boolean }>`
					min-height: 100vh;
					background-color: ${backgroundColor};
					padding: ${padding};

					${
						responsive &&
						`
						@media (max-width: 768px) {
							padding: 1rem 0 4rem;
						}
					`
					}
				`
			);
		}
		return PageLayoutService._pageContainerCache.get(cacheKey)!;
	}

	// Content wrapper - centers content and manages max width
	static getContentWrapper(config: PageLayoutConfig) {
		const { maxWidth = '64rem' } = config;

		if (!PageLayoutService._contentWrapperCache.has(maxWidth)) {
			PageLayoutService._contentWrapperCache.set(
				maxWidth,
				styled.div`
					max-width: ${maxWidth};
					margin: 0 auto;
					padding: 0 1rem;

					@media (max-width: 768px) {
						padding: 0 0.5rem;
					}
				`
			);
		}
		return PageLayoutService._contentWrapperCache.get(maxWidth)!;
	}

	// Main content card - consistent card styling across flows
	static getMainCard() {
		if (!PageLayoutService._mainCardCache) {
			PageLayoutService._mainCardCache = styled.div`
				background-color: #ffffff;
				border-radius: 1rem;
				box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
				border: 1px solid #e2e8f0;
				overflow: hidden;
				margin-bottom: 2rem;
			`;
		}
		return PageLayoutService._mainCardCache;
	}

	// Section container - for organizing content sections
	static getSectionContainer() {
		if (!PageLayoutService._sectionContainerCache) {
			PageLayoutService._sectionContainerCache = styled.section`
				padding: 2rem;
				border-bottom: 1px solid #f1f5f9;

				&:last-child {
					border-bottom: none;
				}

				@media (max-width: 768px) {
					padding: 1.5rem 1rem;
				}
			`;
		}
		return PageLayoutService._sectionContainerCache;
	}

	// Grid layout for responsive content
	static getContentGrid(columns: number = 2, gap: string = '2rem') {
		const cacheKey = `${columns}-${gap}`;
		if (!PageLayoutService._contentGridCache.has(cacheKey)) {
			PageLayoutService._contentGridCache.set(
				cacheKey,
				styled.div<{ $columns?: number; $gap?: string }>`
					display: grid;
					grid-template-columns: repeat(${(props) => props.$columns || columns}, 1fr);
					gap: ${(props) => props.$gap || gap};

					@media (max-width: 1024px) {
						grid-template-columns: 1fr;
						gap: 1.5rem;
					}
				`
			);
		}
		return PageLayoutService._contentGridCache.get(cacheKey)!;
	}

	// Flex layout for horizontal content
	static getContentFlex(justify: string = 'space-between', align: string = 'center') {
		const cacheKey = `${justify}-${align}`;
		if (!PageLayoutService._contentFlexCache.has(cacheKey)) {
			PageLayoutService._contentFlexCache.set(
				cacheKey,
				styled.div<{ $justify?: string; $align?: string }>`
					display: flex;
					justify-content: ${(props) => props.$justify || justify};
					align-items: ${(props) => props.$align || align};
					gap: 1rem;

					@media (max-width: 768px) {
						flex-direction: column;
						align-items: stretch;
					}
				`
			);
		}
		return PageLayoutService._contentFlexCache.get(cacheKey)!;
	}

	// Spacing utilities
	static getSpacing(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md') {
		const sizes = {
			xs: '0.5rem',
			sm: '1rem',
			md: '1.5rem',
			lg: '2rem',
			xl: '3rem',
		};

		if (!PageLayoutService._spacingCache.has(size)) {
			PageLayoutService._spacingCache.set(
				size,
				styled.div<{ $size?: string }>`
					margin: ${(props) => props.$size || sizes[size]} 0;
				`
			);
		}
		return PageLayoutService._spacingCache.get(size)!;
	}

	// Page header component
	static getPageHeader(config: PageLayoutConfig) {
		const themeColors = {
			blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		};

		if (!PageLayoutService._pageHeaderCache.has(config.theme)) {
			PageLayoutService._pageHeaderCache.set(
				config.theme,
				styled.header`
					background: ${themeColors[config.theme]};
					color: white;
					padding: 2rem;
					border-radius: 1rem 1rem 0 0;

					@media (max-width: 768px) {
						padding: 1.5rem;
					}
				`
			);
		}
		return PageLayoutService._pageHeaderCache.get(config.theme)!;
	}

	// Page footer component
	static getPageFooter() {
		if (!PageLayoutService._pageFooterCache) {
			PageLayoutService._pageFooterCache = styled.footer`
				background: #f8fafc;
				border-top: 1px solid #e2e8f0;
				padding: 1.5rem 2rem;
				border-radius: 0 0 1rem 1rem;
				text-align: center;
				color: #64748b;
				font-size: 0.875rem;

				@media (max-width: 768px) {
					padding: 1rem;
					font-size: 0.75rem;
				}
			`;
		}
		return PageLayoutService._pageFooterCache;
	}

	// Utility method to get default config for flow type
	static getDefaultConfig(flowType: PageLayoutConfig['flowType']): PageLayoutConfig {
		const configs: Record<PageLayoutConfig['flowType'], PageLayoutConfig> = {
			oauth: {
				flowType: 'oauth',
				theme: 'blue',
				maxWidth: '64rem',
				showHeader: true,
				showFooter: true,
				responsive: true,
			},
			oidc: {
				flowType: 'oidc',
				theme: 'green',
				maxWidth: '64rem',
				showHeader: true,
				showFooter: true,
				responsive: true,
			},
			pingone: {
				flowType: 'pingone',
				theme: 'orange',
				maxWidth: '64rem',
				showHeader: true,
				showFooter: true,
				responsive: true,
			},
			documentation: {
				flowType: 'documentation',
				theme: 'purple',
				maxWidth: '72rem',
				showHeader: true,
				showFooter: false,
				responsive: true,
			},
		};

		return configs[flowType] || configs.oauth;
	}

	// Method to create a complete page layout
	static createPageLayout(config: PageLayoutConfig) {
		const PageContainer = PageLayoutService.getPageContainer(config);
		const ContentWrapper = PageLayoutService.getContentWrapper(config);
		const MainCard = PageLayoutService.getMainCard();
		const PageHeader = config.showHeader ? PageLayoutService.getPageHeader(config) : null;
		const PageFooter = config.showFooter ? PageLayoutService.getPageFooter() : null;

		return {
			PageContainer,
			ContentWrapper,
			MainCard,
			PageHeader,
			PageFooter,
			SectionContainer: PageLayoutService.getSectionContainer(),
			ContentGrid: PageLayoutService.getContentGrid(),
			ContentFlex: PageLayoutService.getContentFlex(),
			Spacing: PageLayoutService.getSpacing(),
		};
	}
}

export default PageLayoutService;
