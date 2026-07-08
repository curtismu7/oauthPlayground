/**
 * @file MFAFlowComponentFactory.ts
 * @module v8/flows/factories
 * @description Factory for creating MFA flow React components
 * @version 8.2.0
 *
 * This factory provides:
 * - Centralized component creation
 * - Lazy loading support
 * - Component registration
 * - Type-safe component access
 */

import React, { ComponentType, lazy } from 'react';
import { logger } from '../../../utils/logger';
import type { DeviceType } from '../shared/MFATypes';

const MODULE_TAG = '[ MFA-COMPONENT-FACTORY]';

// Lazy load flow components for code splitting
const SMSFlow = lazy(() => import('../types/SMSFlow').then((m) => ({ default: m.SMSFlow })));
const MobileFlow = lazy(() =>
	import('../types/MobileFlow').then((m) => ({ default: m.MobileFlow }))
);
const EmailFlow = lazy(() =>
	import('../types/EmailFlow').then((m) => ({ default: m.EmailFlow }))
);
const TOTPFlow = lazy(() =>
	import('../types/TOTPFlow').then((m) => ({ default: m.TOTPFlow }))
);
const FIDO2Flow = lazy(() =>
	import('../types/FIDO2Flow').then((m) => ({ default: m.FIDO2Flow }))
);
const WhatsAppFlow = lazy(() =>
	import('../types/WhatsAppFlow').then((m) => ({ default: m.WhatsAppFlow }))
);

// Placeholder component for unsupported types
const ComingSoonComponent: React.FC<{ deviceType: DeviceType }> = ({ deviceType }) => {
	return React.createElement(
		'div',
		{ style: { padding: '40px', textAlign: 'center' } },
		React.createElement('h2', null, `${deviceType} Flow - Coming Soon`),
		React.createElement(
			'p',
			null,
			`${deviceType} device flow is not yet implemented. Please use SMS flow for now.`
		)
	);
};

/**
 * Factory for creating MFA flow React components
 *
 * Provides centralized component creation with:
 * - Lazy loading for better performance
 * - Type-safe component access
 * - Easy registration of new flows
 */
export class MFAFlowComponentFactory {
	private static componentRegistry = new Map<DeviceType, ComponentType>();

	/**
	 * Initialize and register all flow components
	 */
	static initialize(): void {
		MFAFlowComponentFactory.register('SMS', SMSFlow);
		MFAFlowComponentFactory.register('MOBILE', MobileFlow);
		MFAFlowComponentFactory.register('EMAIL', EmailFlow);
		MFAFlowComponentFactory.register('TOTP', TOTPFlow);
		MFAFlowComponentFactory.register('FIDO2', FIDO2Flow);
		MFAFlowComponentFactory.register('WHATSAPP', WhatsAppFlow);
	}

	/**
	 * Register a flow component
	 */
	static register(deviceType: DeviceType, component: ComponentType): void {
		MFAFlowComponentFactory.componentRegistry.set(deviceType, component);
	}

	/**
	 * Create a flow component for the specified device type
	 *
	 * @param deviceType - Device type to create component for
	 * @returns React component for the device type
	 *
	 * @example
	 * const Component = MFAFlowComponentFactory.create('SMS');
	 * return <Component />;
	 */
	static create(deviceType: DeviceType): ComponentType {
		const component = MFAFlowComponentFactory.componentRegistry.get(deviceType);

		if (component) {
			return component;
		}

		// Return placeholder for unsupported types
		logger.warn(`${MODULE_TAG} Component not found for ${deviceType}, returning placeholder`);
		return (() => React.createElement(ComingSoonComponent, { deviceType })) as ComponentType;
	}

	/**
	 * Check if a component is registered for a device type
	 */
	static isRegistered(deviceType: DeviceType): boolean {
		return MFAFlowComponentFactory.componentRegistry.has(deviceType);
	}

	/**
	 * Get all registered device types
	 */
	static getRegisteredTypes(): DeviceType[] {
		return Array.from(MFAFlowComponentFactory.componentRegistry.keys());
	}
}

// Initialize on module load
MFAFlowComponentFactory.initialize();
