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

import { EmailFlowController } from '../controllers/EmailFlowController';
import { FIDO2FlowController } from '../controllers/FIDO2FlowController';
import type { FlowControllerCallbacks } from '../controllers/MFAFlowController';
import { SMSFlowController } from '../controllers/SMSFlowController';
import { TOTPFlowController } from '../controllers/TOTPFlowController';
import { WhatsAppFlowController } from '../controllers/WhatsAppFlowController';
import type { DeviceType } from '../shared/MFATypes';

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

		switch (deviceType) {
			case 'SMS':
				return new SMSFlowController(callbacks);

			case 'MOBILE':
				return new SMSFlowController(callbacks); // MOBILE uses SMS controller

			case 'EMAIL':
				return new EmailFlowController(callbacks);

			case 'TOTP':
				return new TOTPFlowController(callbacks);

			case 'FIDO2':
				return new FIDO2FlowController(callbacks);

			case 'WHATSAPP':
				return new WhatsAppFlowController(callbacks);

			default:
				console.warn(`${MODULE_TAG} Unknown device type: ${deviceType}, defaulting to SMS`);
				return new SMSFlowController(callbacks);
		}
	}

	/**
	 * Check if a device type is supported (has a dedicated controller)
	 */
	static isSupported(deviceType: DeviceType): boolean {
		const supportedTypes: DeviceType[] = ['SMS', 'MOBILE', 'EMAIL', 'TOTP', 'FIDO2', 'WHATSAPP'];
		return supportedTypes.includes(deviceType);
	}

	/**
	 * Get all supported device types (with dedicated controllers)
	 */
	static getSupportedTypes(): DeviceType[] {
		return ['SMS', 'MOBILE', 'EMAIL', 'TOTP', 'FIDO2', 'WHATSAPP'];
	}

	/**
	 * Get all available device types (including those that fall back to SMS)
	 */
	static getAllDeviceTypes(): DeviceType[] {
		return ['SMS', 'EMAIL', 'TOTP', 'FIDO2', 'MOBILE', 'OATH_TOKEN', 'VOICE', 'WHATSAPP'];
	}
}
