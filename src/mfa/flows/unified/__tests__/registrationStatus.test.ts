import { computeDeviceStatus } from '../components/UnifiedRegistrationStep';

describe('computeDeviceStatus', () => {
	it('forces ACTIVATION_REQUIRED for TOTP user flows', () => {
		expect(computeDeviceStatus(undefined, 'TOTP', 'user')).toBe('ACTIVATION_REQUIRED');
		expect(computeDeviceStatus('ACTIVE', 'TOTP', 'user')).toBe('ACTIVATION_REQUIRED');
	});

	it('respects admin flow deviceStatus selection', () => {
		expect(computeDeviceStatus(undefined, 'SMS', 'worker', 'ACTIVE')).toBe('ACTIVE');
		expect(computeDeviceStatus(undefined, 'SMS', 'worker', 'ACTIVATION_REQUIRED')).toBe(
			'ACTIVATION_REQUIRED'
		);
	});

	it('defaults to ACTIVATION_REQUIRED for TOTP admin/worker when no status returned', () => {
		expect(computeDeviceStatus(undefined, 'TOTP', 'worker')).toBe('ACTIVATION_REQUIRED');
	});

	it('returns provided status for non-TOTP device types', () => {
		expect(computeDeviceStatus('ACTIVE', 'SMS', 'user')).toBe('ACTIVE');
		expect(computeDeviceStatus(undefined, 'SMS', 'user')).toBe('ACTIVE');
	});
});
