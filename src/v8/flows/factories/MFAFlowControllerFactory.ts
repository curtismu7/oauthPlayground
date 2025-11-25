/**
 * @file MFAFlowControllerFactory.ts
 * @module v8/flows/factories
 * @description Factory for creating MFA flow controllers
 * @version 8.2.0
 *
 * This factory pattern provides:
 * - Centralized controller creation
 * - Easy addition of new device types
 * - Consistent controller instantiation
 * - Dependency injection support
 */

import type { DeviceType } from '../shared/MFATypes';
import type { FlowControllerCallbacks } from '../controllers/MFAFlowController';
import { SMSFlowController } from '../controllers/SMSFlowController';
import { EmailFlowController } from '../controllers/EmailFlowController';
// Future: import { TOTPFlowController } from '../controllers/TOTPFlowController';
// Future: import { FIDO2FlowController } from '../controllers/FIDO2FlowController';

const MODULE_TAG = '[🏭 MFA-CONTROLLER-FACTORY]';

export interface ControllerFactoryConfig {
	deviceType: DeviceType;
	callbacks?: FlowControllerCallbacks;
}

/**
 * Factory for creating MFA flow controllers
 * 
 * This factory centralizes controller creation, making it easy to:
 * - Add new device types
 * - Configure controllers consistently
 * - Inject dependencies
 * - Test controller creation
 */
export class MFAFlowControllerFactory {
	/**
	 * Create a controller for the specified device type
	 * 
	 * @param config - Factory configuration
	 * @returns Controller instance for the device type
	 * 
	 * @example
	 * const controller = MFAFlowControllerFactory.create({
	 *   deviceType: 'SMS',
	 *   callbacks: {
	 *     onDeviceRegistered: (id, status) => console.log('Registered:', id)
	 *   }
	 * });
	 */
	static create(config: ControllerFactoryConfig) {
		const { deviceType, callbacks = {} } = config;

		console.log(`${MODULE_TAG} Creating controller for device type: ${deviceType}`);

		switch (deviceType) {
			case 'SMS':
				return new SMSFlowController(callbacks);
			
			case 'EMAIL':
				return new EmailFlowController(callbacks);
			
			case 'TOTP':
				// TODO: Implement TOTPFlowController
				throw new Error('TOTP controller not yet implemented');
			
			case 'FIDO2':
				// TODO: Implement FIDO2FlowController
				throw new Error('FIDO2 controller not yet implemented');
			
			default:
				console.warn(`${MODULE_TAG} Unknown device type: ${deviceType}, defaulting to SMS`);
				return new SMSFlowController(callbacks);
		}
	}

	/**
	 * Check if a device type is supported
	 */
	static isSupported(deviceType: DeviceType): boolean {
		const supportedTypes: DeviceType[] = ['SMS', 'EMAIL'];
		return supportedTypes.includes(deviceType);
	}

	/**
	 * Get all supported device types
	 */
	static getSupportedTypes(): DeviceType[] {
		return ['SMS', 'EMAIL'];
	}
}

