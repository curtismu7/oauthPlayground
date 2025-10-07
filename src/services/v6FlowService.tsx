// src/services/v6FlowService.tsx
/**
 * V6 Flow Service - Comprehensive Service Bundle
 * 
 * Combines all V6 services into a single, easy-to-use export
 * Use this as the primary import for building V6 flows
 * 
 * Usage:
 * ```tsx
 * import { V6FlowService } from '../../services/v6FlowService';
 * 
 * const {
 *   Layout,
 *   Collapsible,
 *   Info,
 *   Cards
 * } = V6FlowService.createFlowComponents('blue');
 * ```
 */

import { V6FlowLayoutService, type ThemeColor } from './v6FlowLayoutService';
import { V6CollapsibleSectionService } from './v6CollapsibleSectionService';
import { V6InfoComponentsService } from './v6InfoComponentsService';
import { V6FlowCardsService } from './v6FlowCardsService';
import { V6StepManagementService, useV6StepManagement } from './v6StepManagementService';

export class V6FlowService {
	/**
	 * Create all flow components with a specific theme
	 */
	static createFlowComponents(theme: ThemeColor = 'blue') {
		return {
			// Layout components
			Layout: V6FlowLayoutService.createFlowLayout(theme),
			
			// Collapsible components
			Collapsible: V6CollapsibleSectionService.createCollapsibleComponents(theme),
			
			// Info components
			Info: V6InfoComponentsService.createInfoComponents(),
			
			// Card components
			Cards: V6FlowCardsService.createFlowCards(theme),
			
			// Theme colors
			theme: V6FlowLayoutService.getTheme(theme),
		};
	}

	/**
	 * Get individual services
	 */
	static get services() {
		return {
			Layout: V6FlowLayoutService,
			Collapsible: V6CollapsibleSectionService,
			Info: V6InfoComponentsService,
			Cards: V6FlowCardsService,
			StepManagement: V6StepManagementService,
		};
	}

	/**
	 * Get step management hook
	 */
	static get hooks() {
		return {
			useStepManagement: useV6StepManagement,
		};
	}
}

// Export individual services for advanced use cases
export {
	V6FlowLayoutService,
	V6CollapsibleSectionService,
	V6InfoComponentsService,
	V6FlowCardsService,
	V6StepManagementService,
	useV6StepManagement,
};

// Export types
export type { ThemeColor } from './v6FlowLayoutService';
export type { InfoVariant } from './v6InfoComponentsService';
export type { SuitabilityVariant } from './v6FlowCardsService';
export type {
	StepMetadata,
	StepValidationResult,
	CollapsibleSectionState,
} from './v6StepManagementService';

export default V6FlowService;

