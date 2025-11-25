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

import React, { lazy, ComponentType } from 'react';
import type { DeviceType } from '../shared/MFATypes';

const MODULE_TAG = '[🏭 MFA-COMPONENT-FACTORY]';

// Lazy load flow components for code splitting
const SMSFlowV8 = lazy(() => import('../types/SMSFlowV8').then((m) => ({ default: m.SMSFlowV8 })));
const EmailFlowV8 = lazy(() => import('../types/EmailFlowV8').then((m) => ({ default: m.EmailFlowV8 })));

// Placeholder component for unsupported types
const ComingSoonComponent: React.FC<{ deviceType: DeviceType }> = ({ deviceType }) => (
	<div style={{ padding: '40px', textAlign: 'center' }}>
		<h2>{deviceType} Flow - Coming Soon</h2>
		<p>{deviceType} device flow is not yet implemented. Please use SMS flow for now.</p>
	</div>
);

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
		MFAFlowComponentFactory.register('SMS', SMSFlowV8);
		MFAFlowComponentFactory.register('EMAIL', EmailFlowV8);
		// Future: MFAFlowComponentFactory.register('TOTP', TOTPFlowV8);
		// Future: MFAFlowComponentFactory.register('FIDO2', FIDO2FlowV8);
	}

	/**
	 * Register a flow component
	 */
	static register(deviceType: DeviceType, component: ComponentType): void {
		MFAFlowComponentFactory.componentRegistry.set(deviceType, component);
		console.log(`${MODULE_TAG} Registered component for ${deviceType}`);
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
		console.warn(`${MODULE_TAG} Component not found for ${deviceType}, returning placeholder`);
		return () => <ComingSoonComponent deviceType={deviceType} />;
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

