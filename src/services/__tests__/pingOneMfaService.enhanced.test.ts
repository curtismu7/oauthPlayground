// src/services/__tests__/pingOneMfaService.enhanced.test.ts
// Tests for enhanced PingOneMfaService with QR code integration

import PingOneMfaService, { type MfaCredentials, type MfaDevice } from '../pingOneMfaService';
import QRCodeService from '../qrCodeService';

// Mock QRCodeService
jest.mock('../qrCodeService');
const mockQRCodeService = QRCodeService as jest.Mocked<typeof QRCodeService>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Enhanced PingOneMfaService', () => {
	const mockCredentials: MfaCredentials = {
		workerToken: 'test-worker-token',
		environmentId: 'test-env-123',
		userId: 'test-user-456',
	};

	const mockTotpDevice: MfaDevice = {
		id: 'device-123',
		type: 'TOTP',
		status: 'ACTIVATION_REQUIRED',
		activationRequired: true,
		secret: 'JBSWY3DPEHPK3PXP',
		deviceName: 'Test TOTP Device',
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup QRCodeService mocks
		mockQRCodeService.generateTOTPQRCode.mockResolvedValue({
			qrCodeDataUrl: 'data:image/svg+xml;base64,mock-qr-code',
			totpUri:
				'otpauth://totp/PingOne%20MFA:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=PingOne%20MFA',
			manualEntryKey: 'JBSW Y3DP EHPK 3PXP',
			backupCodes: [
				'1234-5678',
				'2345-6789',
				'3456-7890',
				'4567-8901',
				'5678-9012',
				'6789-0123',
				'7890-1234',
				'8901-2345',
			],
		});

		mockQRCodeService.generateManualEntryCode.mockReturnValue('JBSW Y3DP EHPK 3PXP');

		mockQRCodeService.validateTOTPCode.mockReturnValue({
			valid: true,
			timeWindow: 0,
		});

		mockQRCodeService.getCapabilities.mockReturnValue({
			qrCodeGeneration: true,
			manualEntry: true,
			totpValidation: true,
			backupCodes: true,
		});
	});

	describe('generateDeviceQRCode', () => {
		it('should generate QR code for TOTP device', async () => {
			const result = await PingOneMfaService.generateDeviceQRCode(
				mockCredentials,
				mockTotpDevice,
				'Test Issuer',
				'test@example.com'
			);

			expect(result).toHaveProperty('qrCodeDataUrl');
			expect(result).toHaveProperty('totpUri');
			expect(result).toHaveProperty('manualEntryKey');
			expect(result).toHaveProperty('backupCodes');

			expect(mockQRCodeService.generateTOTPQRCode).toHaveBeenCalledWith({
				secret: 'JBSWY3DPEHPK3PXP',
				issuer: 'Test Issuer',
				accountName: 'test@example.com',
				algorithm: 'SHA1',
				digits: 6,
				period: 30,
			});
		});

		it('should use default issuer and generate account name', async () => {
			await PingOneMfaService.generateDeviceQRCode(mockCredentials, mockTotpDevice);

			expect(mockQRCodeService.generateTOTPQRCode).toHaveBeenCalledWith(
				expect.objectContaining({
					issuer: 'PingOne MFA',
					accountName: 'user-test-user-456@pingone-mfa',
				})
			);
		});

		it('should reject non-TOTP devices', async () => {
			const smsDevice: MfaDevice = {
				...mockTotpDevice,
				type: 'SMS',
			};

			await expect(
				PingOneMfaService.generateDeviceQRCode(mockCredentials, smsDevice)
			).rejects.toThrow('QR codes can only be generated for TOTP devices');
		});

		it('should reject devices without secret', async () => {
			const deviceWithoutSecret: MfaDevice = {
				...mockTotpDevice,
				secret: undefined,
				pairingKey: undefined,
			};

			await expect(
				PingOneMfaService.generateDeviceQRCode(mockCredentials, deviceWithoutSecret)
			).rejects.toThrow('Device must have a secret or pairing key to generate QR code');
		});

		it('should handle QRCodeService errors', async () => {
			mockQRCodeService.generateTOTPQRCode.mockRejectedValue(new Error('QR generation failed'));

			await expect(
				PingOneMfaService.generateDeviceQRCode(mockCredentials, mockTotpDevice)
			).rejects.toThrow('QR code generation failed: QR generation failed');
		});
	});

	describe('getDeviceSetupData', () => {
		it('should return comprehensive setup data for TOTP device', async () => {
			const result = await PingOneMfaService.getDeviceSetupData(mockCredentials, mockTotpDevice);

			expect(result).toHaveProperty('device');
			expect(result).toHaveProperty('qrCodeData');
			expect(result).toHaveProperty('setupInstructions');
			expect(result).toHaveProperty('alternativeMethods');

			expect(result.device).toBe(mockTotpDevice);
			expect(result.qrCodeData).toBeDefined();
			expect(result.alternativeMethods.manualEntry).toBeDefined();
			expect(result.alternativeMethods.backupCodes).toBeDefined();
			expect(result.setupInstructions).toContain('Scan the QR code with your authenticator app');
		});

		it('should handle SMS device setup data', async () => {
			const smsDevice: MfaDevice = {
				id: 'sms-device-123',
				type: 'SMS',
				status: 'ACTIVE',
				phoneNumber: '+1234567890',
				activationRequired: false,
			};

			const result = await PingOneMfaService.getDeviceSetupData(mockCredentials, smsDevice);

			expect(result.device).toBe(smsDevice);
			expect(result.qrCodeData).toBeUndefined();
			expect(result.setupInstructions).toContain(
				'Verification codes will be sent to your phone via SMS'
			);
			expect(result.setupInstructions).toContain('Phone number: +1234567890');
		});

		it('should handle EMAIL device setup data', async () => {
			const emailDevice: MfaDevice = {
				id: 'email-device-123',
				type: 'EMAIL',
				status: 'ACTIVE',
				emailAddress: 'test@example.com',
				activationRequired: false,
			};

			const result = await PingOneMfaService.getDeviceSetupData(mockCredentials, emailDevice);

			expect(result.setupInstructions).toContain('Verification codes will be sent to your email');
			expect(result.setupInstructions).toContain('Email address: test@example.com');
		});

		it('should handle QR code generation failure gracefully', async () => {
			mockQRCodeService.generateTOTPQRCode.mockRejectedValue(new Error('QR generation failed'));
			mockQRCodeService.generateManualEntryCode.mockReturnValue('JBSW Y3DP EHPK 3PXP');

			const result = await PingOneMfaService.getDeviceSetupData(mockCredentials, mockTotpDevice);

			expect(result.qrCodeData).toBeUndefined();
			expect(result.alternativeMethods.manualEntry).toBeDefined();
			expect(result.alternativeMethods.manualEntry?.key).toBe('JBSW Y3DP EHPK 3PXP');
			expect(result.alternativeMethods.manualEntry?.instructions).toContain(
				'QR code generation failed'
			);
		});

		it('should support custom options', async () => {
			const options = {
				issuer: 'Custom Issuer',
				accountName: 'custom@example.com',
				includeBackupCodes: false,
				includeInstructions: false,
			};

			const result = await PingOneMfaService.getDeviceSetupData(
				mockCredentials,
				mockTotpDevice,
				options
			);

			expect(result.setupInstructions).toHaveLength(0);
			expect(result.alternativeMethods.backupCodes).toBeUndefined();

			expect(mockQRCodeService.generateTOTPQRCode).toHaveBeenCalledWith(
				expect.objectContaining({
					issuer: 'Custom Issuer',
					accountName: 'custom@example.com',
				})
			);
		});
	});

	describe('createTotpDeviceWithQRCode', () => {
		beforeEach(() => {
			// Mock the createTotpDevice method
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockTotpDevice,
			} as Response);
		});

		it('should create TOTP device with QR code', async () => {
			const result = await PingOneMfaService.createTotpDeviceWithQRCode(mockCredentials);

			expect(result).toHaveProperty('device');
			expect(result).toHaveProperty('qrCodeData');
			expect(result.device.type).toBe('TOTP');
			expect(result.qrCodeData).toBeDefined();
		});

		it('should update device name when provided', async () => {
			// Mock successful device update
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTotpDevice,
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ ...mockTotpDevice, deviceName: 'Custom Device Name' }),
				} as Response);

			const result = await PingOneMfaService.createTotpDeviceWithQRCode(mockCredentials, {
				deviceName: 'Custom Device Name',
			});

			expect(result.device.deviceName).toBe('Custom Device Name');
		});
	});

	describe('validateTotpCode', () => {
		it('should validate TOTP code for device', async () => {
			const result = await PingOneMfaService.validateTotpCode(mockTotpDevice, '123456');

			expect(result.valid).toBe(true);
			expect(mockQRCodeService.validateTOTPCode).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP', '123456');
		});

		it('should reject non-TOTP devices', async () => {
			const smsDevice: MfaDevice = { ...mockTotpDevice, type: 'SMS' };

			const result = await PingOneMfaService.validateTotpCode(smsDevice, '123456');

			expect(result.valid).toBe(false);
			expect(result.error).toContain('not a TOTP device');
		});

		it('should handle devices without secret', async () => {
			const deviceWithoutSecret: MfaDevice = {
				...mockTotpDevice,
				secret: undefined,
				pairingKey: undefined,
			};

			const result = await PingOneMfaService.validateTotpCode(deviceWithoutSecret, '123456');

			expect(result.valid).toBe(false);
			expect(result.error).toContain('secret not available');
		});
	});

	describe('getQRCodeCapabilities', () => {
		it('should return QR code capabilities', () => {
			const capabilities = PingOneMfaService.getQRCodeCapabilities();

			expect(capabilities).toHaveProperty('supported');
			expect(capabilities).toHaveProperty('features');
			expect(capabilities.features).toHaveProperty('qrCodeGeneration');
			expect(capabilities.features).toHaveProperty('manualEntry');
			expect(capabilities.features).toHaveProperty('backupCodes');
			expect(capabilities.features).toHaveProperty('totpValidation');
		});
	});
});
