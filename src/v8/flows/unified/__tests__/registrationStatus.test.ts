import { computeDeviceStatus } from '../components/UnifiedRegistrationStep';

describe('computeDeviceStatus', () => {
	it('forces ACTIVATION_REQUIRED for TOTP user flows', () => {
		expect(computeDeviceStatus(undefined, 'TOTP', 'user')).toBe('ACTIVATION_REQUIRED');
		expect(computeDeviceStatus('ACTIVE', 'TOTP', 'user')).toBe('ACTIVATION_REQUIRED');
	});

	it('defaults to ACTIVATION_REQUIRED for TOTP admin/worker when no status returned', () => {
		expect(computeDeviceStatus(undefined, 'TOTP', 'admin')).toBe('ACTIVATION_REQUIRED');
	});

	it('returns provided status for non-TOTP device types', () => {
		expect(computeDeviceStatus('ACTIVE', 'SMS', 'user')).toBe('ACTIVE');
		expect(computeDeviceStatus(undefined, 'SMS', 'user')).toBe('ACTIVE');
	});
});
